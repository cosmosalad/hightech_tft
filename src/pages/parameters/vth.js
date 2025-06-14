export const calculateVth = (chartData, gmData) => {
/**
 * ⚡ Vth (Threshold Voltage) 계산 모듈
 * 
 * 📖 물리적 의미:
 * - Source-Drain 사이에 전도성 채널을 형성하여 MOSFET을 "ON"으로 만드는 최소 게이트 전압
 * - TFT의 스위칭 특성을 결정하는 핵심 파라미터
 * - 회로 설계시 동작 전압 결정에 직접적 영향
 * 
 * 📏 측정 데이터: IDVG-Linear
 * - 드레인 전압: 0.1V (일정)
 * - gm(transconductance) 데이터 필요
 * 
 * 🧮 계산 방법: Linear Extrapolation Method (선형 외삽법)
 * - gm이 최대인 지점(gm_max)에서의 접선을 구함
 * - 이 접선을 x축(VG축)으로 연장하여 만나는 점이 Vth
 * - 수식: Vth = VG_at_gm_max - (ID_at_gm_max / gm_max)
 * 
 * 📊 일반적 범위: ±1V 이내 (이상적), ±5V 이내 (허용 가능)
 */

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
  
  const id_max = currentPoint.ID;    // gm_max 지점에서의 드레인 전류
  
  // 🧮 Step 3: Linear Extrapolation 계산
  // 접선의 방정식: ID = gm_max × (VG - Vth)
  // gm_max 지점을 지나므로: id_max = gm_max × (vg_max - Vth)
  // 따라서: Vth = vg_max - id_max/gm_max
  return vg_max - (id_max / gm_max);
};