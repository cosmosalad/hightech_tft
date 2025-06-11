// 🔥 물리 상수 정의 (중앙 관리)
export const PHYSICAL_CONSTANTS = {
  // 기본 물리 상수
  EPSILON_0: 8.854e-12,           // 진공 유전율 (F/m)
  BOLTZMANN: 1.380649e-23,       // 볼츠만 상수 (J/K)
  ELEMENTARY_CHARGE: 1.602e-19,   // 기본 전하량 (C)
  
  // 온도 관련
  ROOM_TEMPERATURE: 300,          // 실온 (K) = 27°C
  THERMAL_VOLTAGE_300K: 0.0259,   // kT/q at 300K (V)
  
  // 재료별 상대유전율
  EPSILON_R: {
    SiO2: 3.9,                    // 이산화규소
    Si3N4: 7.5,                   // 질화규소
    Al2O3: 9.0,                   // 산화알루미늄
    HfO2: 25.0                    // 산화하프늄
  }
};

// 🔥 단위 변환 유틸리티
export const UNIT_CONVERSIONS = {
  // 길이 단위
  nm_to_m: (nm) => nm * 1e-9,
  um_to_m: (um) => um * 1e-6,
  mm_to_m: (mm) => mm * 1e-3,
  cm_to_m: (cm) => cm * 1e-2,
  
  // 면적 단위
  cm2_to_m2: (cm2) => cm2 * 1e-4,
  m2_to_cm2: (m2) => m2 * 1e4,
  
  // 이동도 단위
  mobility_cm2Vs_to_m2Vs: (mobility) => mobility * 1e-4,
  mobility_m2Vs_to_cm2Vs: (mobility) => mobility * 1e4,
  
  // 전류 밀도
  A_to_mA: (A) => A * 1000,
  mA_to_A: (mA) => mA / 1000,
  A_per_mm: (current_A, width_m) => current_A / (width_m * 1000),
  
  // 전압
  mV_to_V: (mV) => mV / 1000,
  V_to_mV: (V) => V * 1000
};

// 🔥 TFT 관련 상수
export const TFT_CONSTANTS = {
  // 일반적인 TFT 파라미터 범위
  MOBILITY_RANGE: {
    a_Si: { min: 0.1, max: 1.0 },           // a-Si:H TFT
    poly_Si: { min: 10, max: 100 },         // poly-Si TFT
    IGZO: { min: 5, max: 50 },              // IGZO TFT
    IZO: { min: 1, max: 20 }                // IZO TFT
  },
  
  // 일반적인 Vth 범위
  VTH_RANGE: { min: -5, max: 10 },          // V
  
  // SS 이상값
  SS_IDEAL: 0.060,                          // V/decade at 300K
  SS_ACCEPTABLE_MAX: 1.0,                   // V/decade
  
  // θ 일반적 범위
  THETA_RANGE: { min: 0.001, max: 2.0 },   // V⁻¹
  
  // Dit 일반적 범위  
  DIT_RANGE: { min: 1e10, max: 1e13 }      // cm⁻²eV⁻¹
};

// 🔥 계산 검증 함수들
export const validatePhysicalParameters = {
  // 이동도 검증
  mobility: (mobility, material = 'IGZO') => {
    const range = TFT_CONSTANTS.MOBILITY_RANGE[material] || TFT_CONSTANTS.MOBILITY_RANGE.IGZO;
    return {
      isValid: mobility >= range.min && mobility <= range.max * 2, // 여유 두기
      range: range,
      warning: mobility > range.max ? 'unusually high' : mobility < range.min ? 'unusually low' : null
    };
  },
  
  // Vth 검증
  vth: (vth) => {
    const range = TFT_CONSTANTS.VTH_RANGE;
    return {
      isValid: vth >= range.min && vth <= range.max,
      range: range,
      warning: vth > range.max ? 'high threshold voltage' : vth < range.min ? 'negative threshold' : null
    };
  },
  
  // SS 검증
  ss: (ss) => {
    return {
      isValid: ss >= TFT_CONSTANTS.SS_IDEAL && ss <= TFT_CONSTANTS.SS_ACCEPTABLE_MAX,
      ideal: TFT_CONSTANTS.SS_IDEAL,
      warning: ss > TFT_CONSTANTS.SS_ACCEPTABLE_MAX ? 'poor switching' : 
               ss < TFT_CONSTANTS.SS_IDEAL ? 'below theoretical limit' : null
    };
  },
  
  // θ 검증
  theta: (theta) => {
    const range = TFT_CONSTANTS.THETA_RANGE;
    return {
      isValid: theta >= range.min && theta <= range.max,
      range: range,
      warning: theta > range.max ? 'excessive degradation' : 
               theta < range.min ? 'negligible degradation' : null
    };
  }
};

// 🔥 온도별 열전압 계산
export const getThermalVoltage = (temperature_K = PHYSICAL_CONSTANTS.ROOM_TEMPERATURE) => {
  return (PHYSICAL_CONSTANTS.BOLTZMANN * temperature_K) / PHYSICAL_CONSTANTS.ELEMENTARY_CHARGE;
};

// 🔥 재료별 Cox 계산
export const calculateCoxForMaterial = (thickness_m, material = 'SiO2') => {
  const epsilon_r = PHYSICAL_CONSTANTS.EPSILON_R[material] || PHYSICAL_CONSTANTS.EPSILON_R.SiO2;
  return (PHYSICAL_CONSTANTS.EPSILON_0 * epsilon_r) / thickness_m;
};