import { calculateCox, CONSTANTS } from './utils.js';

export const calculateDit = (ss, deviceParams) => {
  if (!ss || ss <= 0 || !deviceParams.tox) return 0;
  
  // 🔥 SS 단위 변환: mV/decade → V/decade
  const ss_V = ss / 1000; // mV를 V로 변환
  
  const kT_q = (CONSTANTS.BOLTZMANN * CONSTANTS.ROOM_TEMP) / CONSTANTS.ELEMENTARY_CHARGE;
  const cox = calculateCox(deviceParams.tox) * 1e-4; // F/cm²로 변환
  
  // Dit 계산: Dit = (Cox/q) × (SS/(2.3×kT/q) - 1)
  // 이제 ss_V는 V/decade 단위이므로 수식이 올바름
  const dit = (cox / CONSTANTS.ELEMENTARY_CHARGE) * (ss_V / (2.3 * kT_q) - 1);
  
  // 물리적으로 합리적한 범위 체크 (1e10 ~ 1e15 cm⁻²eV⁻¹)
  return dit > 0 && dit < 1e15 ? dit : 0;
};