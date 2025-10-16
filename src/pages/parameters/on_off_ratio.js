export const calculateOnOffRatio = (chartData) => {
/**
 * ⚡ Ion/Ioff (On/Off Current Ratio) 계산 모듈
 * 
 * 📖 물리적 의미:
 * - 소자가 완전히 켜졌을 때와 꺼졌을 때 전류의 비율
 * - 디지털 스위칭 성능을 나타내는 핵심 지표
 * - 높은 비율 → 명확한 ON/OFF 구분 → 좋은 스위칭 특성
 * 
 * 📏 측정 데이터: IDVG-Linear
 * - 드레인 전압: 0.1V (일정)
 * - 전체 VG 범위에서 최대/최소 전류 추출
 * 
 * 🧮 계산 방법:
 * - Ion: 가장 높은 VG에서의 전류 (ON 상태)
 * - Ioff: 가장 낮은 VG 근처 3개 점의 평균 (OFF 상태, 노이즈 고려)
 * - Ratio = Ion / Ioff
 * 
 * 📊 성능 기준:
 * - > 10⁶: 우수한 스위칭 (디스플레이, 메모리)
 * - 10⁴ ~ 10⁶: 양호한 스위칭 (일반 로직)
 * - 10² ~ 10⁴: 보통 스위칭
 * - < 10²: 불량한 스위칭
 */

  // 입력 데이터 유효성 검사
  if (!chartData || chartData.length === 0) {
    return { ion: 0, ioff: 0, ratio: 0 };
  }
  
  // 📊 VG 순서로 데이터 정렬 (낮은 VG → 높은 VG)
  const sortedData = [...chartData].sort((a, b) => a.VG - b.VG);
  
  // ⚡ Ion: 전체 범위에서 최대 전류
  // 주의: mobility degradation 때문에 마지막 점이 항상 최대는 아님
  // 따라서 전체 데이터에서 절대 최대값을 찾음
  const ion = Math.max(...sortedData.map(d => Math.abs(d.ID)));
  
  // 🔒 Ioff: 가장 낮은 VG에서의 전류값 3개의 평균 (OFF 상태, 노이즈 고려함) / 20개로 늘림
  // 일반적으로 VG가 가장 낮을 때가 OFF 상태
  const allCurrents = sortedData.map(d => Math.abs(d.ID)).sort((a, b) => a - b);
  const smallestThree = allCurrents.slice(0, 20);
  const ioff = smallestThree.reduce((sum, current) => sum + current, 0) / smallestThree.length;
  
  // 📈 On/Off 비율 계산
  const ratio = ioff > 0 ? ion / ioff : 0;
  
  return { 
    ion,      // ON 전류 (A)
    ioff,     // OFF 전류 (A) 
    ratio     // Ion/Ioff 비율 (무차원)
  };
};