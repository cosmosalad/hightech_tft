import { calculateCox, CONSTANTS } from './utils.js';

export const calculateDit = (ss, deviceParams) => {
/**
 * 🔬 Dit (Interface Trap Density) 계산 모듈
 * 
 * 📖 물리적 의미:
 * - 산화막과 반도체 채널 사이의 계면에 위치한 전자 trap 상태의 밀도
 * - 계면 트랩은 전하를 포획/방출하여 소자 성능을 저하시킴
 * - 낮은 Dit 값일수록 좋은 계면 품질을 의미
 * 
 * 📏 측정 데이터: IDVG-Linear
 * - 드레인 전압: 0.1V (일정)
 * - SS(Subthreshold Swing) 값으로부터 간접 계산
 * 
 * 🧮 계산 수식: Dit = (Cox/q) × (SS/(2.3×kT/q) - 1)
 * - 이상적 SS = 60mV/dec (계면 트랩 없음)
 * - 실제 SS > 60mV/dec → 계면 트랩 존재
 * 
 * 📊 일반적 범위: 1×10¹⁰ ~ 1×10¹² cm⁻²eV⁻¹ (우수~보통)
 */

  // 입력값 유효성 검사
  if (!ss || ss <= 0 || !deviceParams.tox) return 0;
  
  // 🔄 SS 단위 변환: mV/decade → V/decade
  // 중요: SS는 보통 mV/decade로 입력되므로 V로 변환 필요
  const ss_V = ss / 1000;
  
  // 🌡️ 열전압 계산 (kT/q at 300K = 25.85mV)
  const kT_q = (CONSTANTS.BOLTZMANN * CONSTANTS.ROOM_TEMP) / CONSTANTS.ELEMENTARY_CHARGE;
  
  // 📏 Cox 계산 및 F/cm² 단위 변환
  const cox = calculateCox(deviceParams.tox) * 1e-4;
  
  // 🧮 Dit 핵심 계산
  // Dit = (Cox/q) × (SS/(2.3×kT/q) - 1)
  // (SS/(2.3×kT/q) - 1) 부분이 트랩에 의한 추가 기여도를 나타냄
  const dit = (cox / CONSTANTS.ELEMENTARY_CHARGE) * (ss_V / (2.3 * kT_q) - 1);
  
  // ✅ 물리적으로 합리적인 범위 체크 (1e10 ~ 1e15 cm⁻²eV⁻¹)
  return dit > 0 && dit < 1e15 ? dit : 0;
};