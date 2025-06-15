import { linearRegression } from './utils.js';

export const calculateSS = (chartData, options = {}) => {
/**
 * ⚡ Enhanced SS (Subthreshold Swing) 계산 모듈 - Custom Range 지원
 * 
 * 📖 물리적 의미:
 * - 게이트 전압이 소자를 오프→온 상태로 얼마나 효과적으로 전환하는지 정량화
 * - 드레인 전류를 10배(1 decade) 변화시키는 데 필요한 게이트 전압 스윙
 * - 이상적인 SS = 60mV/dec (실온에서)
 * 
 * 📏 측정 데이터: IDVG-Linear
 * - 드레인 전압: 0.1V (일정)
 * - Subthreshold 영역(스위칭 구간)의 기울기 분석
 * 
 * 🧮 계산 수식: SS = dVG/d(log₁₀ID) = 1/slope × 1000 (mV/decade)
 * - log₁₀(ID) vs VG 그래프에서 선형 구간의 기울기의 역수
 * - 기울기가 클수록(가파를수록) SS가 작음 → 좋은 스위칭
 * 
 * 📊 품질 기준:
 * - < 100 mV/dec: 우수
 * - 100~300 mV/dec: 양호  
 * - 300~1000 mV/dec: 보통
 * - > 1000 mV/dec: 미흡
 */

  // 📋 옵션 파라미터 추출
  const {
    customRange = false,    // 사용자 정의 범위 사용 여부
    startVG = null,        // 시작 VG 값
    endVG = null,          // 끝 VG 값  
    method = 'auto'        // 자동 범위 선택 방법
  } = options;

  // ✅ 1단계: 입력 데이터 유효성 검사
  if (!chartData || chartData.length < 10) {
    console.warn('SS 계산 실패: 데이터 부족 (최소 10개 점 필요)');
    return 0;
  }
  
  // 🔄 2단계: 로그 변환 (핵심!)
  // 왜? TFT subthreshold 영역에서 ID는 지수함수적으로 변하므로
  // log(ID) vs VG로 변환하면 선형 관계가 됨
  const logData = chartData.map(d => ({
    VG: d.VG,                           // 게이트 전압 그대로 유지
    logID: Math.log10(Math.abs(d.ID))   // 전류를 log10으로 변환 (절대값 사용)
  })).filter(d => isFinite(d.logID));   // NaN, Infinity 등 유효하지 않은 값 제거
  
  // 로그 변환 후에도 충분한 데이터 확인
  if (logData.length < 5) {
    console.warn('SS 계산 실패: 로그 변환 후 유효 데이터 부족');
    return 0;
  }

  // 🎯 3단계: 분석할 데이터 범위 선택
  let selectedData;

  if (customRange && startVG !== null && endVG !== null) {
    // 🆕 사용자가 직접 범위를 지정한 경우
    selectedData = logData.filter(d => d.VG >= startVG && d.VG <= endVG);
    
    if (selectedData.length < 3) {
      console.warn(`사용자 정의 범위 ${startVG}V ~ ${endVG}V에 데이터 부족: ${selectedData.length}개`);
      return 0;
    }
  } else {
    // 🔄 자동 범위 선택 (기존 로직)
    selectedData = selectOptimalRange(logData, method);
  }

  // 선택된 데이터가 충분한지 확인
  if (selectedData.length < 3) {
    console.warn('선택된 범위에 데이터 부족 (최소 3개 점 필요)');
    return 0;
  }

  // 📐 4단계: 선형 회귀 분석 수행
  const x = selectedData.map(d => d.VG);      // 독립변수: 게이트 전압
  const y = selectedData.map(d => d.logID);   // 종속변수: log10(드레인 전류)
  
  // utils.js의 linearRegression 함수 호출
  const { slope } = linearRegression(x, y);
  
  // 🧮 5단계: SS 값 계산
  // 물리적 의미: SS = dVG/d(log₁₀ID) = 1/slope
  // slope는 decade/V 단위이므로, 1/slope는 V/decade
  // mV/decade로 변환하기 위해 1000을 곱함
  return slope > 0 ? (1 / slope) * 1000 : 0;
};

/**
 * 🔍 최적 범위 자동 선택 함수 (기존 로직 분리)
 */
const selectOptimalRange = (logData, method) => {
  // 🎯 우선순위: 스위칭 구간 → Subthreshold 구간 → 전체 중간 구간
  
  // Option 1: 스위칭 구간 (-1V ~ +1V) - 가장 정확
  const switchingData = logData.filter(d => d.VG >= -1 && d.VG <= 1);
  
  // Option 2: Subthreshold 구간 (전류 범위 기준)
  const subthresholdData = logData.filter(d => d.logID > -12 && d.logID < -6);
  
  // Option 3: 전체 데이터의 중간 구간
  const start = Math.floor(logData.length * 0.3);
  const end = Math.floor(logData.length * 0.7);
  const middleData = logData.slice(start, end);
  
  // 🔍 데이터 선택 우선순위
  if (switchingData.length >= 10) {
    return switchingData;        // 스위칭 구간 우선
  } else if (subthresholdData.length >= 5) {
    return subthresholdData;     // Subthreshold 구간
  } else {
    return middleData;           // 중간 구간 (fallback)
  }
};

/**
 * 🔬 SS 품질 평가 함수 (새로 추가)
 */
export const evaluateSSQuality = (chartData, startVG, endVG, ssValue) => {
  if (!chartData || startVG >= endVG) {
    return { quality: 'Invalid', score: 0, issues: ['Invalid range'] };
  }

  const selectedData = chartData.filter(d => d.VG >= startVG && d.VG <= endVG);
  const logData = selectedData.map(d => ({
    VG: d.VG,
    logID: Math.log10(Math.abs(d.ID))
  })).filter(d => isFinite(d.logID));

  if (logData.length < 3) {
    return { quality: 'Poor', score: 0, issues: ['Insufficient data points'] };
  }

  // R² 계산
  const x = logData.map(d => d.VG);
  const y = logData.map(d => d.logID);
  const { slope, intercept } = linearRegression(x, y);
  
  const yMean = y.reduce((sum, val) => sum + val, 0) / y.length;
  const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
  const ssResidual = x.reduce((sum, xi, i) => {
    const predicted = slope * xi + intercept;
    return sum + Math.pow(y[i] - predicted, 2);
  }, 0);
  
  const rSquared = Math.max(0, Math.min(1, 1 - (ssResidual / ssTotal)));

  // 품질 평가
  let quality = 'Poor';
  let score = 0;
  const issues = [];

  // R² 평가 (40점)
  if (rSquared >= 0.95) {
    score += 40;
  } else if (rSquared >= 0.90) {
    score += 30;
  } else if (rSquared >= 0.85) {
    score += 20;
  } else {
    issues.push(`낮은 선형성 (R² = ${rSquared.toFixed(3)})`);
  }

  // 데이터 포인트 평가 (30점)
  if (logData.length >= 15) {
    score += 30;
  } else if (logData.length >= 10) {
    score += 20;
  } else if (logData.length >= 5) {
    score += 10;
  } else {
    issues.push(`데이터 포인트 부족 (${logData.length}개)`);
  }

  // SS 값 평가 (30점)
  if (ssValue < 100) {
    score += 30; // 우수
  } else if (ssValue < 500) {
    score += 25; // 양호
  } else if (ssValue < 1000) {
    score += 20; // 보통
  } else if (ssValue < 1500) {
    score += 10; // 미흡
    issues.push(`높은 SS 값 (${ssValue.toFixed(1)} mV/decade)`);
  } else {
    score += 5;  // 매우 미흡
    issues.push(`매우 높은 SS 값 (${ssValue.toFixed(1)} mV/decade)`);
  }

  // 최종 품질 등급
  if (score >= 80) quality = 'Excellent';
  else if (score >= 60) quality = 'Good';
  else if (score >= 40) quality = 'Fair';

  return {
    quality,
    score,
    rSquared,
    dataPoints: logData.length,
    issues,
    slope,
    intercept
  };
};

/**
 * 📊 SS 미리보기 데이터 생성 (새로 추가)
 */
export const generateSSPreviewData = (chartData, startVG, endVG) => {
  if (!chartData) return [];
  
  return chartData.map(d => ({
    VG: d.VG,
    ID: d.ID,
    logID: Math.log10(Math.abs(d.ID)),
    inRange: d.VG >= startVG && d.VG <= endVG,
    isValid: isFinite(Math.log10(Math.abs(d.ID)))
  })).filter(d => d.isValid);
};

/**
 * 🎯 권장 범위 제안 함수 (새로 추가)
 */
export const suggestOptimalRange = (chartData) => {
  if (!chartData || chartData.length < 10) {
    return { startVG: -1, endVG: 1, confidence: 'Low' };
  }

  const logData = chartData.map(d => ({
    VG: d.VG,
    logID: Math.log10(Math.abs(d.ID))
  })).filter(d => isFinite(d.logID)).sort((a, b) => a.VG - b.VG);

  // 다양한 범위 시도해보고 가장 좋은 선형성을 가진 구간 찾기
  const candidates = [
    { start: -2, end: 2, name: 'Wide Switching' },
    { start: -1, end: 1, name: 'Standard Switching' },
    { start: -1.5, end: 0.5, name: 'Asymmetric Range' },
    { start: -0.5, end: 1.5, name: 'Positive Biased' }
  ];

  let bestRange = { startVG: -1, endVG: 1, confidence: 'Low', rSquared: 0 };

  for (const candidate of candidates) {
    const rangeData = logData.filter(d => 
      d.VG >= candidate.start && d.VG <= candidate.end
    );

    if (rangeData.length < 5) continue;

    const x = rangeData.map(d => d.VG);
    const y = rangeData.map(d => d.logID);
    
    try {
      const { slope, intercept } = linearRegression(x, y);
      
      // R² 계산
      const yMean = y.reduce((sum, val) => sum + val, 0) / y.length;
      const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
      const ssResidual = x.reduce((sum, xi, i) => {
        const predicted = slope * xi + intercept;
        return sum + Math.pow(y[i] - predicted, 2);
      }, 0);
      
      const rSquared = Math.max(0, Math.min(1, 1 - (ssResidual / ssTotal)));

      if (rSquared > bestRange.rSquared) {
        bestRange = {
          startVG: candidate.start,
          endVG: candidate.end,
          confidence: rSquared > 0.95 ? 'High' : rSquared > 0.90 ? 'Medium' : 'Low',
          rSquared: rSquared,
          dataPoints: rangeData.length,
          name: candidate.name
        };
      }
    } catch (error) {
      continue;
    }
  }

  return bestRange;
};

/**
 * 🧮 상세 SS 계산 결과 (디버깅용)
 */
export const calculateSSDetailed = (chartData, startVG, endVG) => {
  if (!chartData || startVG >= endVG) {
    return null;
  }

  const selectedData = chartData.filter(d => d.VG >= startVG && d.VG <= endVG);
  const logData = selectedData.map(d => ({
    VG: d.VG,
    logID: Math.log10(Math.abs(d.ID)),
    ID: d.ID
  })).filter(d => isFinite(d.logID));

  if (logData.length < 3) {
    return null;
  }

  const x = logData.map(d => d.VG);
  const y = logData.map(d => d.logID);
  const regression = linearRegression(x, y);
  
  const ss = regression.slope > 0 ? (1 / regression.slope) * 1000 : 0;
  const quality = evaluateSSQuality(chartData, startVG, endVG, ss);

  return {
    ss: ss,
    slope: regression.slope,
    intercept: regression.intercept,
    rSquared: quality.rSquared,
    dataPoints: logData.length,
    range: { startVG, endVG },
    quality: quality.quality,
    issues: quality.issues,
    selectedData: logData  // 디버깅용
  };
};