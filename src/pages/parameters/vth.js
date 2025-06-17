import { linearRegression } from './utils.js';

export const calculateVth = (chartData, gmData, options = {}) => {
/**
 * ⚡ Vth (Threshold Voltage) 계산 모듈 - 4가지 방법 제공
 * 
 * 📖 물리적 의미:
 * - Source-Drain 사이에 전도성 채널을 형성하여 MOSFET을 "ON"으로 만드는 최소 게이트 전압
 * - TFT의 스위칭 특성을 결정하는 핵심 파라미터
 * - 회로 설계시 동작 전압 결정에 직접적 영향
 * 
 * 📏 측정 데이터: IDVG-Linear
 * - 드레인 전압: 0.1V (일정)
 * - gm(transconductance) 데이터 필요 (방법에 따라)
 * 
 * 🧮 계산 방법 (4가지):
 * 1. Linear Extrapolation of Linear Scale (기본값): gm_max 지점에서 실측값 기반 선형 외삽
 * 2. Constant Current Method: 특정 전류값(기본 1e-7A)에서의 게이트 전압
 * 3. Subthreshold Slope Extrapolation: subthreshold 영역 선형회귀로 외삽
 * 4. Linear Extrapolation of Log Scale: 로그 스케일에서 gm_max 기반 선형 외삽
 * 
 * 📊 일반적 범위: ±1V 이내 (이상적), ±5V 이내 (허용 가능)
 */

  const {
    method = 'linear_extrapolation_linear',  // 기본값: 원래 방법
    targetCurrent = 1e-7,                    // Method 2용 목표 전류
    subthresholdRange = { min: -10, max: -6 }, // Method 3용 subthreshold 범위
    targetLogCurrent = -7                     // Method 3, 4용 목표 로그 전류
  } = options;

  switch(method) {
    case 'linear_extrapolation_linear':
      return calculateVthMethod1LinearExtrapolationLinear(chartData, gmData);
    case 'constant_current':
      return calculateVthMethod2ConstantCurrent(chartData, targetCurrent);
    case 'subthreshold_extrapolation':
      return calculateVthMethod3SubthresholdExtrapolation(chartData, subthresholdRange, targetLogCurrent);
    case 'linear_extrapolation_log':
      return calculateVthMethod4LinearExtrapolationLog(chartData, gmData);
    default:
      return calculateVthMethod1LinearExtrapolationLinear(chartData, gmData);
  }
};

/**
 * 🧮 Method 1: Linear Extrapolation of Linear Scale (기존 방법)
 * 
 * 📖 원리:
 * - gm_max 지점에서 ID vs VG의 접선을 구함
 * - 실측값 기반으로 선형 외삽하여 VG축과의 교점 계산
 * - 수식: Vth = VG_at_gm_max - (ID_at_gm_max / gm_max)
 * 
 * 📊 장점: 직관적이고 물리적 의미가 명확
 * 📊 단점: gm_max 지점의 정확도에 의존
 */
const calculateVthMethod1LinearExtrapolationLinear = (chartData, gmData) => {
  // 입력 데이터 유효성 검사
  if (!gmData || gmData.length === 0) return 0;
  
  // 📈 Step 1: gm_max 지점 찾기
  // gm 배열에서 최대값과 그 위치를 찾음
  const maxGmPoint = gmData.reduce((max, current) => 
    current.gm > max.gm ? current : max
  );
  
  const vg_max = maxGmPoint.VG;      // gm이 최대인 지점의 게이트 전압
  const gm_max = maxGmPoint.gm;      // 최대 transconductance 값
  
  // 📊 Step 2: gm_max 지점에서의 ID 값 찾기
  // chartData에서 VG가 vg_max와 가장 가까운 점의 ID 값
  const currentPoint = chartData.find(d => Math.abs(d.VG - vg_max) < 0.1);
  if (!currentPoint) return 0;
  
  const id_max = currentPoint.ID;    // gm_max 지점에서의 드레인 전류 (실측값)
  
  // 🧮 Step 3: Linear Extrapolation 계산
  // 접선의 방정식: ID = gm_max × (VG - Vth)
  // gm_max 지점을 지나므로: id_max = gm_max × (vg_max - Vth)
  // 따라서: Vth = vg_max - id_max/gm_max
  return vg_max - (id_max / gm_max);
};

/**
 * 🧮 Method 2: Constant Current Method (정전류법)
 * 
 * 📖 원리:
 * - 특정 전류값(기본 1e-7 A)에서의 게이트 전압을 Vth로 정의
 * - log(ID) vs VG 데이터에서 보간법으로 정확한 VG 계산
 * - 산업 표준에서 널리 사용되는 방법
 * 
 * 📊 장점: 측정 조건과 무관하게 일관된 기준, 재현성 우수
 * 📊 단점: 임의의 전류값 기준, 물리적 의미가 상대적으로 약함
 */
const calculateVthMethod2ConstantCurrent = (chartData, targetCurrent) => {
  if (!chartData || chartData.length < 5) return 0;
  
  const targetLogID = Math.log10(targetCurrent);
  
  // 📊 로그 변환된 데이터 생성
  const logData = chartData.map(d => ({
    VG: d.VG,
    ID: d.ID,
    logID: Math.log10(Math.abs(d.ID))
  })).filter(d => isFinite(d.logID)).sort((a, b) => a.VG - b.VG);
  
  // 🎯 목표 전류에 가장 가까운 두 점 찾기 (보간용)
  let closestPoints = [];
  for (let i = 0; i < logData.length - 1; i++) {
    const current = logData[i];
    const next = logData[i + 1];
    
    // targetLogID가 두 점 사이에 있는지 확인
    if ((current.logID <= targetLogID && next.logID >= targetLogID) ||
        (current.logID >= targetLogID && next.logID <= targetLogID)) {
      closestPoints = [current, next];
      break;
    }
  }
  
  let vth;
  if (closestPoints.length === 2) {
    // 📐 선형 보간으로 정확한 VG 계산
    const [p1, p2] = closestPoints;
    const ratio = (targetLogID - p1.logID) / (p2.logID - p1.logID);
    vth = p1.VG + ratio * (p2.VG - p1.VG);
  } else {
    // 🔍 가장 가까운 점 사용 (보간 불가능한 경우)
    const closest = logData.reduce((min, current) => 
      Math.abs(current.logID - targetLogID) < Math.abs(min.logID - targetLogID) 
        ? current : min
    );
    vth = closest.VG;
  }
  
  return vth;
};

/**
 * 🧮 Method 3: Subthreshold Slope Extrapolation (subthreshold 기울기 외삽법)
 * 
 * 📖 원리:
 * - Subthreshold 영역에서 log(ID) vs VG의 선형 관계 이용
 * - 이 직선을 연장하여 특정 로그 전류값에서의 VG 계산
 * - SS 계산과 동일한 원리 적용
 * 
 * 📊 장점: Subthreshold 영역의 물리적 특성 반영, 안정적
 * 📊 단점: Subthreshold 영역 선택에 따라 결과 변동 가능
 */
const calculateVthMethod3SubthresholdExtrapolation = (chartData, range, targetLogCurrent) => {
  if (!chartData || chartData.length < 10) return 0;
  
  // 📊 로그 변환
  const logData = chartData.map(d => ({
    VG: d.VG,
    logID: Math.log10(Math.abs(d.ID))
  })).filter(d => isFinite(d.logID));
  
  // 🎯 Subthreshold 영역 선택 (기본: -10 < log(ID) < -6)
  const subthresholdData = logData.filter(d => 
    d.logID >= range.min && d.logID <= range.max
  );
  
  if (subthresholdData.length < 3) return 0;
  
  // 📐 선형 회귀: log(ID) = slope × VG + intercept
  const x = subthresholdData.map(d => d.VG);
  const y = subthresholdData.map(d => d.logID);
  const { slope, intercept } = linearRegression(x, y);
  
  // 🧮 특정 로그 전류값에서의 VG 계산
  // slope × VG + intercept = targetLogCurrent
  // VG = (targetLogCurrent - intercept) / slope
  const vth = slope !== 0 ? (targetLogCurrent - intercept) / slope : 0;
  
  return vth;
};

/**
 * 🧮 Method 4: Linear Extrapolation of Log Scale (로그 스케일 선형 외삽법)
 * 
 * 📖 원리:
 * - 로그 스케일에서 gm_max 지점의 접선을 구함
 * - log(ID) vs VG에서 선형 외삽하여 VG축과의 교점 계산
 * - Method 1의 로그 스케일 버전
 * 
 * 📊 장점: 넓은 전류 범위에서 안정적, 로그 특성 반영
 * 📊 단점: 로그 변환으로 인한 복잡성, gm 계산이 복잡
 */
const calculateVthMethod4LinearExtrapolationLog = (chartData, gmData) => {
  if (!chartData || chartData.length < 10) return 0;
  if (!gmData || gmData.length === 0) return 0;
  
  // 📊 로그 변환된 데이터 생성
  const logData = chartData.map(d => ({
    VG: d.VG,
    ID: d.ID,
    logID: Math.log10(Math.abs(d.ID))
  })).filter(d => isFinite(d.logID)).sort((a, b) => a.VG - b.VG);
  
  // 📊 로그 스케일에서 gm 계산: gm_log = d(log(ID))/dVG
  let logGmData = [];
  for (let i = 1; i < logData.length - 1; i++) {
    const deltaVG = logData[i+1].VG - logData[i-1].VG;
    const deltaLogID = logData[i+1].logID - logData[i-1].logID;
    
    if (deltaVG !== 0) {
      const gm_log = Math.abs(deltaLogID / deltaVG);  // 로그 스케일에서의 기울기
      logGmData.push({ VG: logData[i].VG, gm: gm_log });
    }
  }
  
  if (logGmData.length === 0) return 0;
  
  // 📈 로그 스케일에서 gm_max 지점 찾기
  const maxLogGmPoint = logGmData.reduce((max, current) => 
    current.gm > max.gm ? current : max
  );
  
  const vg_max_log = maxLogGmPoint.VG;
  const gm_max_log = maxLogGmPoint.gm;
  
  // 📊 gm_max 지점에서의 log(ID) 값 찾기
  const currentLogPoint = logData.find(d => Math.abs(d.VG - vg_max_log) < 0.1);
  if (!currentLogPoint) return 0;
  
  const logID_max = currentLogPoint.logID;  // 로그값 사용
  
  // 🧮 로그 스케일에서 Linear Extrapolation 계산
  // 접선의 방정식: log(ID) = gm_max_log × (VG - Vth)
  // log(ID) = 0일 때 (즉, ID = 1A일 때)의 VG를 구하거나
  // 또는 특정 기준 로그값에서의 VG를 구함
  
  // 여기서는 log(ID) = -7 (즉, ID = 1e-7A)일 때의 VG를 Vth로 정의
  const targetLogForVth = -7;
  const vth = vg_max_log - (logID_max - targetLogForVth) / gm_max_log;
  
  return vth;
};