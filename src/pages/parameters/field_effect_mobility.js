/**
 * 🚀 μFE (Field-Effect Mobility) 계산 모듈
 * 
 * 📖 물리적 의미:
 * - 게이트 전기장 영향 하에서 채널 내 전하 운반자(전자/정공)의 이동도
 * - TFT의 전류 구동 능력을 직접적으로 결정하는 핵심 파라미터
 * - 높은 μFE → 빠른 스위칭, 높은 전류 구동 능력
 * 
 * 📏 측정 데이터: IDVG-Linear
 * - 드레인 전압: 0.1V (저전계 조건)
 * - 필요 파라미터: gm_max, W, L, Cox, VDS
 * 
 * 🧮 계산 수식: μFE = L/(W×Cox×VDS) × gm_max
 * - Linear 영역에서 ID = μFE × (W/L) × Cox × (VG-Vth) × VDS
 * - gm = dID/dVG = μFE × (W/L) × Cox × VDS
 * - 따라서: μFE = (L/(W×Cox×VDS)) × gm_max
 * 
 * 📊 일반적 범위:
 * - a-Si:H TFT: 0.1 ~ 1 cm²/V·s
 * - poly-Si TFT: 10 ~ 100 cm²/V·s  
 * - IGZO TFT: 5 ~ 50 cm²/V·s
 */

import { calculateCox } from './utils.js';

export const calculateMuFE = (gm_max, deviceParams, vds) => {
  // 입력값 유효성 검사
  if (!gm_max || !deviceParams.W || !deviceParams.L || !vds) return 0;

  const { W, L, tox } = deviceParams;
  
  // 📏 Cox 계산 (게이트 산화막 정전용량)
  const cox = calculateCox(tox);
  
  // 🧮 μFE 계산: μFE = L/(W×Cox×VDS) × gm_max
  // 물리적 의미:
  // - L/W: 채널 기하학적 비율 (길이/폭)
  // - Cox: 게이트 제어 효율
  // - VDS: Linear 측정 조건 (저전계)
  // - gm_max: 최대 transconductance (최적 동작점)
  const muFE = (L / (W * cox * vds)) * gm_max * 1e4; // m²/V·s → cm²/V·s 변환
  
  return muFE;
};