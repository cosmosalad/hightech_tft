/**
 * ⚡ gm_sat (Saturation Transconductance) 계산 모듈
 * 
 * 📖 물리적 의미:
 * - 소자가 포화되었을 때의 transconductance
 * - 포화 영역에서의 게이트 제어 효율성
 * - Linear gm과 비교하여 소자 특성 분석
 * 
 * 📏 측정 데이터: IDVG-Saturation
 * - 드레인 전압: 20V (포화 조건)
 * 
 * 🧮 계산 방법: gm.js와 동일한 수치 미분 사용
 */

import { calculateGm } from './gm.js';

export const calculateGmSat = (chartData) => {
  // gm 계산 로직은 동일하므로 기존 함수 재사용
  // 차이점은 측정 조건(VD = 20V)뿐
  return calculateGm(chartData);
};