/**
 * 🔄 ΔVth (Hysteresis) 계산 모듈
 * 
 * 📖 물리적 의미:
 * - 게이트 전압을 순방향/역방향으로 스윕할 때 관찰되는 Vth의 차이
 * - 소자의 안정성을 정량화하는 핵심 지표
 * - 전하 트래핑, 이온 이동 등의 불안정 요소를 반영
 * 
 * 📏 측정 데이터: IDVG-Linear-Hysteresis
 * - Forward: 게이트 전압을 -10V → 20V (순방향)
 * - Backward: 게이트 전압을 20V → -10V (역방향)
 * - 드레인 전압: 0.1V (일정)
 * - 같은 측정 조건에서 방향만 다름
 * 
 * 🧮 계산 방법:
 * - 각각 Forward/Backward 스윕에서 √ID Extrapolation으로 Vth 계산
 * - ΔVth = |Vth_forward - Vth_backward|
 * - √ID vs VG의 선형 구간을 x축으로 외삽하여 x절편 구함
 * 
 * 📊 안정성 기준:
 * - < 0.5V: Excellent (우수)
 * - 0.5~1.0V: Good (양호)  
 * - 1.0~2.0V: Fair (보통)
 * - > 2.0V: Poor (불량)
 */

import { linearRegression } from './utils.js';

export const calculateDeltaVth = (forwardData, backwardData) => {
  // 입력 데이터 유효성 검사
  if (!forwardData || !backwardData) return { deltaVth: 0, vthForward: 0, vthBackward: 0 };
  
  // 📈 Forward 스윕에서 Vth 계산
  const vthForward = calculateVthFromSqrt(forwardData);
  
  // 📉 Backward 스윕에서 Vth 계산  
  const vthBackward = calculateVthFromSqrt(backwardData);
  
  // 🔄 Hysteresis 계산: ΔVth = |Vth_forward - Vth_backward|
  const deltaVth = Math.abs(vthForward - vthBackward);
  
  return { deltaVth, vthForward, vthBackward };
};

/**
 * √ID Extrapolation Method로 Vth 계산
 * 
 * @param {Array} data - ID-VG 측정 데이터
 * @returns {number} Vth 값 (V)
 * 
 * 🧮 원리:
 * - Saturation 영역에서 ID ∝ (VG - Vth)²
 * - 따라서 √ID ∝ (VG - Vth)
 * - √ID vs VG 그래프가 선형 관계
 * - 이 직선을 VG축으로 외삽한 x절편이 Vth
 */
const calculateVthFromSqrt = (data) => {
  // 최소 데이터 요구사항
  if (data.length < 10) return 0;
  
  // 📊 중간 구간 선택 (30% ~ 70%)
  // 너무 낮은 전류(노이즈)와 너무 높은 전류(포화) 구간 제외
  const start = Math.floor(data.length * 0.3);
  const end = Math.floor(data.length * 0.7);
  const selectedData = data.slice(start, end);
  
  // 📐 √ID vs VG 선형 회귀
  const x = selectedData.map(d => d.VG);                    // 게이트 전압 (독립변수)
  const y = selectedData.map(d => Math.sqrt(Math.abs(d.ID)));  // √ID (종속변수)
  const { slope, intercept } = linearRegression(x, y);
  
  // 🎯 Vth 계산: x절편 = -intercept/slope
  // 직선의 방정식: y = slope × x + intercept
  // y = 0일 때: 0 = slope × x + intercept
  // 따라서: x = -intercept/slope = Vth
  return slope !== 0 ? -intercept / slope : 0;
};