/**
 * 🎯 TFT Parameters 통합 모듈
 * 
 * 📖 목적:
 * - 모든 TFT 파라미터 계산 함수들을 중앙에서 관리
 * - 일관된 import 구조 제공
 * - 의존성 관리 및 버전 관리 용이
 * 
 * 📊 제공하는 파라미터들:
 * - Transconductance 그룹: gm, gm_max, gm_sat
 * - Mobility 그룹: μFE, μ0, μeff, θ  
 * - Threshold & Switching: Vth, SS, Dit
 * - Performance: Ion/Ioff, Ron, ID_sat
 * - Stability: ΔVth
 * - Utilities: Cox, linearRegression, CONSTANTS
 * 
 * - TLM Analysis: Rc, Rsh, LT, ρc (접촉 저항 분석)
 */

// Transconductance 관련
export { calculateGm } from './gm.js';
export { calculateGmMax } from './gm_max.js';
export { calculateGmSat } from './gm_sat.js';

// Mobility 관련  
export { calculateMuFE } from './field_effect_mobility.js';
export { calculateMu0 } from './low_field_field_effect_mobility.js';
export { calculateMuEff } from './effective_mobility.js';
export { calculateTheta } from './mobility_degradation_factor.js';

// Threshold & Switching 관련
export { calculateVth } from './vth.js';
export { calculateSS, evaluateSSQuality, calculateSSDetailed } from './ss.js';
export { calculateDit } from './dit.js';

// Performance 관련
export { calculateOnOffRatio } from './on_off_ratio.js';
export { calculateRon } from './ron.js';
export { calculateIDSat } from './ID_sat.js';

// Stability 관련
export { calculateDeltaVth } from './dvth.js';

// 유틸리티 함수들
export { linearRegression, calculateCox, CONSTANTS } from './utils.js';

// TLM (Transfer Length Method) 관련 - 추가되는 부분
export { 
  TLM_CONSTANTS,
  generatePotentialDistances,
  parseDistanceFromSheetName,
  calculateResistanceFromIV,
  calculateTLMParameters,
  analyzeSingleFile,
  performTLMAnalysis,
  exportResultsToCSV
} from './tlm.js';