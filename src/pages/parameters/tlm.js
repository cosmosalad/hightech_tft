// TLM (Transfer Length Method) 분석 모듈
import * as XLSX from 'xlsx';

/**
 * TLM 분석 상수
 */
export const TLM_CONSTANTS = {
  CONTACT_WIDTH: 1.0, // mm
  VOLTAGE_RANGE: { min: -2, max: 2 }, // V
  DEFAULT_DISTANCE_STEP: 0.5, // mm
  MIN_SLOPE_THRESHOLD: 1e-12,
  MIN_DATA_POINTS: 2
};

/**
 * 거리 간격에 따른 잠재적 거리 배열 생성
 * @param {number} step - 거리 간격 (mm)
 * @param {number} maxDistance - 최대 거리 (mm)
 * @returns {string[]} 거리 문자열 배열
 */
export const generatePotentialDistances = (step = 0.5, maxDistance = 5.0) => {
  const distances = [];
  for (let i = step; i <= maxDistance; i += step) {
    distances.push(i.toFixed(1));
  }
  return distances;
};

/**
 * 선형 회귀 분석
 * @param {number[]} xValues - X축 데이터 
 * @param {number[]} yValues - Y축 데이터
 * @returns {Object} {slope, intercept, rSquared}
 */
export const linearRegression = (xValues, yValues) => {
  const n = xValues.length;
  if (n < 2) throw new Error('최소 2개의 데이터 포인트가 필요합니다.');

  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R² 계산
  const meanY = sumY / n;
  const totalSumSquares = yValues.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
  const residualSumSquares = yValues.reduce((sum, y, i) => {
    const predicted = slope * xValues[i] + intercept;
    return sum + Math.pow(y - predicted, 2);
  }, 0);
  const rSquared = totalSumSquares === 0 ? 1 : 1 - (residualSumSquares / totalSumSquares);

  return { slope, intercept, rSquared };
};

/**
 * 시트 이름에서 거리 추출
 * @param {string} sheetName - 워크시트 이름
 * @param {number} distanceStep - 거리 간격 (mm)
 * @returns {number} 거리 (mm), 추출 실패시 NaN
 */
export const parseDistanceFromSheetName = (sheetName, distanceStep = 0.5) => {
  const potentialDistances = generatePotentialDistances(distanceStep);
  const normalized = sheetName.replace(',', '.');
  
  // 정확한 매치 우선
  for (const distance of potentialDistances) {
    if (normalized === distance) {
      return parseFloat(distance);
    }
  }
  
  // 부분 매치
  for (const distance of potentialDistances) {
    if (normalized.includes(distance)) {
      return parseFloat(distance);
    }
  }
  
  // 숫자 추출 시도
  const match = normalized.match(/(\d+\.?\d*)/);
  if (match) {
    const value = parseFloat(match[1]);
    // 거리 간격의 배수인지 확인
    const ratio = value / distanceStep;
    if (Math.abs(ratio - Math.round(ratio)) < 0.01 && value >= distanceStep && value <= 10.0) {
      return value;
    }
  }
  
  return NaN;
};

/**
 * I-V 데이터에서 저항 계산 (polyfit 방식)
 * @param {Array} ivData - I-V 데이터 [{AV, AI}, ...]
 * @returns {Object} {resistance, rSquared} 저항값과 R² 값
 */
export const calculateResistanceFromIV = (ivData) => {
  if (!ivData || ivData.length < 2) return { resistance: NaN, rSquared: NaN };
  
  // -2V ~ +2V 범위 필터링 및 전류가 0이 아닌 데이터만 선택
  const filtered = ivData.filter(point => 
    point.AV >= TLM_CONSTANTS.VOLTAGE_RANGE.min && 
    point.AV <= TLM_CONSTANTS.VOLTAGE_RANGE.max && 
    !isNaN(point.AV) && !isNaN(point.AI) && 
    point.AI !== 0
  );
  
  if (filtered.length < TLM_CONSTANTS.MIN_DATA_POINTS) return { resistance: NaN, rSquared: NaN };
  
  try {
    const voltages = filtered.map(p => p.AV);
    const currents = filtered.map(p => p.AI);
    
    const { slope, rSquared } = linearRegression(voltages, currents);
    
    if (Math.abs(slope) < TLM_CONSTANTS.MIN_SLOPE_THRESHOLD) {
      return { resistance: Infinity, rSquared: rSquared };
    }
    
    return { resistance: 1 / slope, rSquared: rSquared }; // 저항 = 1/기울기
  } catch (error) {
    console.warn('저항 계산 오류:', error);
    return { resistance: NaN, rSquared: NaN };
  }
};

/**
 * TLM 파라미터 계산
 * @param {Array} resistanceData - [{distance, resistance}, ...]
 * @param {number} contactWidth - 접촉 폭 (mm)
 * @returns {Object} TLM 파라미터
 */
export const calculateTLMParameters = (resistanceData, contactWidth) => {
  if (!resistanceData || resistanceData.length < 2) {
    throw new Error('TLM 파라미터 계산을 위해서는 최소 2개의 데이터가 필요합니다.');
  }
  
  // 거리 > 0인 데이터만 사용
  const validData = resistanceData.filter(d => 
    d.distance > 0 && 
    !isNaN(d.resistance) && 
    isFinite(d.resistance)
  );
  
  if (validData.length < 2) {
    throw new Error('유효한 데이터가 부족합니다.');
  }
  
  const distances = validData.map(d => d.distance);
  const resistances = validData.map(d => d.resistance);
  
  const { slope, intercept, rSquared } = linearRegression(distances, resistances);
  
  // TLM 파라미터 계산
  const Rc = intercept / 2.0; // 접촉 저항 (Ω)
  const Rsh = slope * contactWidth; // 면저항 (Ω/sq)
  const LT = Math.abs(intercept / (2.0 * slope)); // 전달 길이 (mm)
  const rho_c = Rsh * Math.pow(LT * 0.1, 2); // 접촉 비저항 (Ω·cm²)
  
  return {
    Rc,
    Rsh,
    LT: LT * 0.1, // cm 단위로 변환
    rho_c,
    rSquared,
    slope,
    intercept
  };
};

/**
 * 단일 Excel 파일 분석
 * @param {Object} fileInfo - 파일 정보
 * @param {number} distanceStep - 거리 간격 (mm)
 * @returns {Object} 분석 결과
 */
export const analyzeSingleFile = async (fileInfo, distanceStep = 0.5) => {
  const arrayBuffer = await fileInfo.file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);
  
  const fileName = fileInfo.name;
  const sampleName = fileName.replace(/\.(xls|xlsx)$/i, '');
  
  const measurements = [];
  const ivCharts = [];
  
  // 각 워크시트 처리
  for (const sheetName of workbook.SheetNames) {
    const distance = parseDistanceFromSheetName(sheetName, distanceStep);
    if (isNaN(distance)) continue;
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    // I-V 데이터 정리
    const ivData = data.map(row => ({
      AV: parseFloat(row.AV || 0),
      AI: parseFloat(row.AI || 0)
    })).filter(point => !isNaN(point.AV) && !isNaN(point.AI));
    
    // 저항 계산
    const resistanceResult = calculateResistanceFromIV(ivData);
    
    if (!isNaN(resistanceResult.resistance) && isFinite(resistanceResult.resistance)) {
      measurements.push({ 
        distance, 
        resistance: resistanceResult.resistance, 
        rSquared: resistanceResult.rSquared || 1.0 
      });
    }
    
    // 차트용 데이터 저장
    ivCharts.push({
      sheetName,
      distance,
      data: ivData,
      resistance: resistanceResult.resistance,
      rSquared: resistanceResult.rSquared || 1.0
    });
  }
  
  // 거리 순으로 정렬
  measurements.sort((a, b) => a.distance - b.distance);
  ivCharts.sort((a, b) => a.distance - b.distance);
  
  // 개별 파일의 TLM 파라미터 계산
  let tlmParameters = null;
  if (measurements.length >= 2) {
    try {
      tlmParameters = calculateTLMParameters(measurements, TLM_CONSTANTS.CONTACT_WIDTH);
    } catch (error) {
      console.warn(`파일 ${fileName}의 TLM 파라미터 계산 실패:`, error);
    }
  }
  
  return {
    fileName,
    sampleName,
    measurements,
    ivCharts,
    tlmParameters
  };
};

/**
 * 메인 TLM 분석 함수
 * @param {Array} uploadedFiles - 업로드된 파일 목록
 * @param {number} contactWidth - 접촉 폭 (mm)
 * @param {number} distanceStep - 거리 간격 (mm)
 * @returns {Object} 전체 분석 결과
 */
export const performTLMAnalysis = async (uploadedFiles, contactWidth, distanceStep = 0.5) => {
  try {
    console.log(`TLM 분석 시작... (거리 간격: ${distanceStep}mm)`);
    
    // 개별 파일 분석
    const individualResults = [];
    
    for (const fileInfo of uploadedFiles) {
      const result = await analyzeSingleFile(fileInfo, distanceStep);
      // contactWidth 업데이트
      if (result.tlmParameters) {
        result.tlmParameters = calculateTLMParameters(result.measurements, contactWidth);
      }
      individualResults.push(result);
    }
    
    // 통합 TLM 분석 제거 - 개별 파일 분석만 수행
    let integratedTLM = null;
    
    console.log('TLM 분석 완료');
    
    return {
      contactWidth,
      distanceStep,
      totalFiles: uploadedFiles.length,
      individualResults,
      integratedTLM,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('TLM 분석 중 오류:', error);
    throw new Error(`TLM 분석 실패: ${error.message}`);
  }
};

/**
 * 결과 데이터를 CSV로 내보내기
 * @param {Object} results - 분석 결과
 * @returns {string} CSV 문자열
 */
export const exportResultsToCSV = (results) => {
  const csvRows = [];
  
  // 헤더
  csvRows.push(['파일명', '거리(mm)', '저항(Ω)', '기울기(A/V)', 'R²'].join(','));
  
  // 개별 파일 데이터
  results.individualResults.forEach(file => {
    file.measurements.forEach(m => {
      csvRows.push([
        file.fileName,
        m.distance.toFixed(1),
        m.resistance.toFixed(2),
        (1/m.resistance).toExponential(4),
        '1.0000'
      ].join(','));
    });
  });
  
  // 개별 파일 TLM 파라미터
  csvRows.push([]);
  csvRows.push(['개별 파일 TLM 파라미터']);
  csvRows.push(['파일명', 'Rc (Ω)', 'Rsh (Ω/sq)', 'LT (cm)', 'ρc (Ω·cm²)', 'R²', '데이터 포인트'].join(','));
  
  results.individualResults.forEach(file => {
    if (file.tlmParameters) {
      csvRows.push([
        file.fileName,
        file.tlmParameters.Rc.toFixed(2),
        file.tlmParameters.Rsh.toFixed(2),
        file.tlmParameters.LT.toFixed(3),
        file.tlmParameters.rho_c.toExponential(2),
        file.tlmParameters.rSquared.toFixed(4),
        file.measurements.length
      ].join(','));
    } else {
      csvRows.push([
        file.fileName,
        'N/A', 'N/A', 'N/A', 'N/A', 'N/A',
        file.measurements.length
      ].join(','));
    }
  });
  
  csvRows.push([]);
  csvRows.push([`분석 완료 시간: ${new Date().toISOString()}`]);
  csvRows.push([`접촉 폭: ${results.contactWidth} mm`]);
  csvRows.push([`거리 간격: ${results.distanceStep} mm`]);
  
  return csvRows.join('\n');
};