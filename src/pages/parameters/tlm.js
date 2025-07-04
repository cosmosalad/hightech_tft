// TLM (Transfer Length Method) 분석 모듈
import * as XLSX from 'xlsx';

/**
 * 📈 TLM (Transfer Length Method) 분석 모듈
 *
 * 📖 물리적 의미:
 * - 반도체 소자에서 금속 전극과 반도체 채널 사이의 접촉 저항(Contact Resistance)과
 * 반도체 활성층의 면저항(Sheet Resistance)을 분리하여 측정하는 표준 분석법입니다.
 * - 소자의 성능에 큰 영향을 미치는 접촉 특성을 정량적으로 평가하는 데 필수적입니다.
 *
 * 📏 측정 데이터:
 * - 다양한 채널 길이(L)를 가진 소자들의 I-V (전류-전압) 특성 곡선이 필요합니다.
 * - 각 소자의 총저항(Total Resistance, R_T)은 채널 길이에 따라 선형적으로 증가하는 관계를 이용합니다.
 *
 * 🧮 분석 방법:
 * 1. 각 채널 길이별 소자의 I-V 곡선에서 선형 구간의 기울기를 구해 총저항(R_T)을 계산합니다.
 * 2. 총저항(R_T)을 채널 길이(L)에 대해 플로팅하여 'R_T vs. L' 그래프를 얻습니다.
 * 3. 이 그래프를 선형 회귀 분석하여 기울기(Slope)와 Y절편(Intercept)을 구합니다.
 * - R_T = (R_sh / W) * L + 2*R_c
 * - Y절편 = 2 * R_c (접촉 저항)
 * - 기울기 = R_sh / W (면저항)
 * 4. 추출된 값들로부터 접촉 저항(Rc), 면저항(Rsh), 전달 길이(LT), 접촉 비저항(ρc) 등
 * 핵심 파라미터를 계산합니다.
 */

/**
 * 🔬 TLM 분석 관련 상수 정의
 */
export const TLM_CONSTANTS = {
  CONTACT_WIDTH: 1.0, // 접촉 폭 (mm), 외부에서 설정 가능
  VOLTAGE_RANGE: { min: -2, max: 2 }, // 저항 계산에 사용할 전압 범위 (V)
  DEFAULT_DISTANCE_STEP: 0.5, // 기본 채널 길이 간격 (mm)
  MIN_SLOPE_THRESHOLD: 1e-12, // 유효한 I-V 기울기의 최소값 (0에 가까운 기울기 방지)
  MIN_DATA_POINTS: 2 // 선형 회귀에 필요한 최소 데이터 포인트 수
};

/**
 * 📏 잠재적인 채널 길이(거리) 배열 생성 함수
 * @param {number} step - 거리 간격 (mm)
 * @param {number} maxDistance - 최대 거리 (mm)
 * @returns {string[]} 거리 값 문자열 배열 (e.g., ['0.5', '1.0', ...])
 */
export const generatePotentialDistances = (step = 0.5, maxDistance = 5.0) => {
  const distances = [];
  for (let i = step; i <= maxDistance; i += step) {
    distances.push(i.toFixed(1));
  }
  return distances;
};

/**
 * 📐 Linear Regression (선형 회귀) 함수
 *
 * 📖 물리적 의미:
 * - 두 변수(여기서는 채널 길이와 총저항) 간의 선형 관계를 수학적으로 모델링합니다.
 * - TLM 분석에서 'R_T vs. L' 그래프의 기울기와 절편을 찾는 핵심 계산입니다.
 *
 * 🧮 수식: y = mx + b
 * - m (기울기): (nΣxy - ΣxΣy) / (nΣx² - (Σx)²)
 * - b (y절편): (Σy - mΣx) / n
 *
 * @param {number[]} xValues - 독립변수 배열 (채널 길이)
 * @param {number[]} yValues - 종속변수 배열 (총저항)
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

  // R² (결정 계수) 계산: 모델의 설명력 평가
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
 * 📄 시트 이름에서 채널 길이(거리) 추출
 * @param {string} sheetName - Excel 워크시트 이름 (e.g., "0.5", "1.0mm")
 * @param {number} distanceStep - 거리 간격 (mm)
 * @returns {number} 추출된 거리 (mm), 실패 시 NaN
 */
export const parseDistanceFromSheetName = (sheetName, distanceStep = 0.5) => {
  const potentialDistances = generatePotentialDistances(distanceStep);
  const normalized = sheetName.replace(',', '.'); // 소수점 형식 통일

  // 1. 정확히 일치하는 거리 값 우선 탐색
  for (const distance of potentialDistances) {
    if (normalized === distance) {
      return parseFloat(distance);
    }
  }

  // 2. 시트 이름에 포함된 거리 값 탐색
  for (const distance of potentialDistances) {
    if (normalized.includes(distance)) {
      return parseFloat(distance);
    }
  }

  // 3. 정규식을 이용해 숫자 추출 (최후의 수단)
  const match = normalized.match(/(\d+\.?\d*)/);
  if (match) {
    const value = parseFloat(match[1]);
    // 추출된 값이 유효한 거리 간격의 배수인지 검증
    const ratio = value / distanceStep;
    if (Math.abs(ratio - Math.round(ratio)) < 0.01 && value >= distanceStep && value <= 10.0) {
      return value;
    }
  }

  return NaN;
};

/**
 * 🔌 I-V 데이터로부터 총저항(R_T) 계산
 *
 * 📖 물리적 의미:
 * - 특정 채널 길이를 가진 소자의 총저항입니다.
 * - 옴의 법칙(V=IR)에 따라, I-V 곡선의 선형 영역에서 기울기의 역수가 저항(R = V/I)이 됩니다.
 *
 * 🧮 계산 방법:
 * - 저전압 선형 영역(-2V ~ +2V)의 I-V 데이터를 선택합니다.
 * - 선택된 데이터로 선형 회귀를 수행하여 기울기(dI/dV, 컨덕턴스)를 계산합니다.
 * - 저항 = 1 / 기울기.
 *
 * @param {Array} ivData - I-V 데이터 포인트 배열 [{AV, AI}, ...]
 * @returns {Object} {resistance, rSquared} 계산된 저항과 선형성의 R² 값
 */
export const calculateResistanceFromIV = (ivData) => {
  if (!ivData || ivData.length < 2) return { resistance: NaN, rSquared: NaN };

  // -2V ~ +2V 선형 영역 필터링
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

    // 선형 회귀로 기울기(Conductance) 계산
    const { slope, rSquared } = linearRegression(voltages, currents);

    if (Math.abs(slope) < TLM_CONSTANTS.MIN_SLOPE_THRESHOLD) {
      return { resistance: Infinity, rSquared: rSquared }; // 거의 수평인 경우 (저항 무한대)
    }

    return { resistance: 1 / slope, rSquared: rSquared }; // 저항 = 1 / 컨덕턴스
  } catch (error) {
    console.warn('저항 계산 오류:', error);
    return { resistance: NaN, rSquared: NaN };
  }
};

/**
 * 🧮 TLM 핵심 파라미터 계산
 *
 * 📖 물리적 의미:
 * - Rc (접촉 저항): 금속-반도체 계면에서의 저항. 낮을수록 좋습니다.
 * - Rsh (면저항): 반도체 활성층의 고유 저항. 단위 면적당 저항값 (Ω/sq).
 * - LT (전달 길이): 전류가 접촉 영역 아래로 전달되는 평균 거리. 접촉 품질의 척도입니다.
 * - ρc (접촉 비저항): 접촉 저항을 정규화한 값 (Ω·cm²). 재료 고유의 특성입니다.
 *
 * 🧮 계산 수식:
 * - 'R_T vs. L' 그래프에서: 절편 = 2*Rc, 기울기 = Rsh/W
 * - Rc = 절편 / 2
 * - Rsh = 기울기 * W
 * - LT = |절편 / (2 * 기울기)|
 * - ρc = Rsh * (LT)²  (단위 변환 주의)
 *
 * @param {Array} resistanceData - [{distance, resistance}, ...] 배열
 * @param {number} contactWidth - 접촉 폭 (mm)
 * @returns {Object} 계산된 TLM 파라미터 딕셔너리
 */
export const calculateTLMParameters = (resistanceData, contactWidth) => {
  if (!resistanceData || resistanceData.length < 2) {
    throw new Error('TLM 파라미터 계산을 위해서는 최소 2개의 데이터가 필요합니다.');
  }

  // 유효한 데이터 필터링 (거리 > 0, 저항값이 유한)
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

  // R_T vs. L 선형 회귀 분석
  const { slope, intercept, rSquared } = linearRegression(distances, resistances);

  // TLM 파라미터 계산
  const Rc = intercept / 2.0; // 접촉 저항 (Ω)
  const Rsh = slope * contactWidth; // 면저항 (Ω/sq)
  const LT_mm = Math.abs(intercept / (2.0 * slope)); // 전달 길이 (mm)
  const LT_cm = LT_mm * 0.1; // 전달 길이 (cm)
  const rho_c = Rsh * Math.pow(LT_cm, 2); // 접촉 비저항 (Ω·cm²)

  return {
    Rc,
    Rsh,
    LT: LT_cm, // cm 단위로 반환
    rho_c,
    rSquared,
    slope,
    intercept
  };
};

/**
 * 📁 단일 Excel 파일 분석
 * @param {Object} fileInfo - 파일 정보 객체
 * @param {number} distanceStep - 거리 간격 (mm)
 * @returns {Object} 분석 결과 (샘플 이름, 측정 데이터, 차트 데이터, TLM 파라미터)
 */
export const analyzeSingleFile = async (fileInfo, distanceStep = 0.5) => {
  const arrayBuffer = await fileInfo.file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);

  const fileName = fileInfo.name;
  const sampleName = fileName.replace(/\.(xls|xlsx)$/i, '');

  const measurements = [];
  const ivCharts = [];

  // Excel 파일의 각 시트(채널 길이별 데이터)를 순회
  for (const sheetName of workbook.SheetNames) {
    const distance = parseDistanceFromSheetName(sheetName, distanceStep);
    if (isNaN(distance)) continue; // 유효한 거리를 찾지 못하면 건너뜀

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // I-V 데이터 정리
    const ivData = data.map(row => ({
      AV: parseFloat(row.AV || 0),
      AI: parseFloat(row.AI || 0)
    })).filter(point => !isNaN(point.AV) && !isNaN(point.AI));

    // 총저항 계산
    const resistanceResult = calculateResistanceFromIV(ivData);

    if (!isNaN(resistanceResult.resistance) && isFinite(resistanceResult.resistance)) {
      measurements.push({
        distance,
        resistance: resistanceResult.resistance,
        rSquared: resistanceResult.rSquared || 1.0
      });
    }

    // 시각화를 위한 차트 데이터 저장
    ivCharts.push({
      sheetName,
      distance,
      data: ivData,
      resistance: resistanceResult.resistance,
      rSquared: resistanceResult.rSquared || 1.0
    });
  }

  // 데이터들을 거리 순으로 정렬
  measurements.sort((a, b) => a.distance - b.distance);
  ivCharts.sort((a, b) => a.distance - b.distance);

  // 개별 파일에 대한 TLM 파라미터 계산
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
 * 🚀 메인 TLM 분석 실행 함수
 * @param {Array} uploadedFiles - 업로드된 파일 목록
 * @param {number} contactWidth - 접촉 폭 (mm)
 * @param {number} distanceStep - 거리 간격 (mm)
 * @returns {Object} 전체 분석 결과
 */
export const performTLMAnalysis = async (uploadedFiles, contactWidth, distanceStep = 0.5) => {
  try {
    console.log(`TLM 분석 시작... (접촉 폭: ${contactWidth}mm, 거리 간격: ${distanceStep}mm)`);

    const individualResults = [];

    // 업로드된 각 파일에 대해 개별 분석 수행
    for (const fileInfo of uploadedFiles) {
      const result = await analyzeSingleFile(fileInfo, distanceStep);
      // 사용자가 입력한 contactWidth로 TLM 파라미터 재계산
      if (result.tlmParameters) {
        result.tlmParameters = calculateTLMParameters(result.measurements, contactWidth);
      }
      individualResults.push(result);
    }

    console.log('TLM 분석 완료');

    return {
      contactWidth,
      distanceStep,
      totalFiles: uploadedFiles.length,
      individualResults,
      integratedTLM: null, // 통합 분석 기능은 현재 사용 안 함
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('TLM 분석 중 오류:', error);
    throw new Error(`TLM 분석 실패: ${error.message}`);
  }
};

/**
 * 💾 분석 결과를 CSV 형식으로 내보내기
 * @param {Object} results - 분석 결과 객체
 * @returns {string} CSV 데이터 문자열
 */
export const exportResultsToCSV = (results) => {
  const csvRows = [];

  // 헤더
  csvRows.push(['파일명', '거리(mm)', '저항(Ω)', '컨덕턴스(S)', 'I-V 선형성 R²'].join(','));

  // 개별 측정 데이터
  results.individualResults.forEach(file => {
    file.measurements.forEach(m => {
      csvRows.push([
        file.fileName,
        m.distance.toFixed(1),
        m.resistance.toFixed(2),
        (1/m.resistance).toExponential(4),
        m.rSquared.toFixed(4)
      ].join(','));
    });
  });

  // 개별 파일 TLM 파라미터 결과
  csvRows.push([]);
  csvRows.push(['--- 개별 파일 TLM 파라미터 ---']);
  csvRows.push(['파일명', 'Rc (Ω)', 'Rsh (Ω/sq)', 'LT (cm)', 'ρc (Ω·cm²)', 'TLM 선형성 R²', '데이터 포인트 수'].join(','));

  results.individualResults.forEach(file => {
    if (file.tlmParameters) {
      csvRows.push([
        file.fileName,
        file.tlmParameters.Rc.toFixed(2),
        file.tlmParameters.Rsh.toFixed(2),
        file.tlmParameters.LT.toExponential(3),
        file.tlmParameters.rho_c.toExponential(3),
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

  // 분석 조건 요약
  csvRows.push([]);
  csvRows.push([`분석 완료 시간: ${results.timestamp}`]);
  csvRows.push([`적용된 접촉 폭: ${results.contactWidth} mm`]);
  csvRows.push([`적용된 거리 간격: ${results.distanceStep} mm`]);

  return csvRows.join('\n');
};