/**
 * 🚀 ID_sat (Saturation Current Density) 계산 모듈
 * 
 * 📖 물리적 의미:
 * - Saturation 영역에서 동작할 때 흐르는 드레인 전류
 * - 단위 폭당 전류값 (A/mm)으로 표준화하여 소자 크기 무관한 비교 가능
 * - 소자의 전류 구동 능력을 나타냄
 * 
 * 📏 측정 데이터: IDVG-Saturation  
 * - 최대 게이트 전압에서의 ID 값 사용
 * - 채널 폭(W)으로 나누어 정규화
 * 
 * 🧮 계산 수식: ID_sat = ID(VG = VG_max) / W
 */

export const calculateIDSat = (chartData, deviceParams) => {
  // 입력 데이터 검증
  if (!chartData || !deviceParams.W) return 0;
  
  // 📊 최대 드레인 전류 추출
  const maxCurrent = Math.max(...chartData.map(d => d.ID));
  
  // 📏 단위 변환: m → mm (W를 mm 단위로)
  const W_mm = deviceParams.W * 1000;
  
  // 🧮 전류 밀도 계산: A/mm
  return maxCurrent / W_mm;
};