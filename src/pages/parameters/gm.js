export const calculateGm = (chartData) => {
/**
 * 📊 gm (Transconductance) 계산 모듈
 * 
 * 📖 물리적 의미:
 * - 게이트 전압이 드레인 전류를 얼마나 효과적으로 제어하는지를 정량화
 * - 소자의 전류 증폭 능력을 나타내는 척도
 * - gm 값이 높을수록 게이트 제어가 우수하고 증폭 능력이 강함
 * 
 * 📏 측정 데이터: IDVG-Linear 또는 IDVG-Saturation
 * - 엑셀 파일에 gm 데이터가 포함되어 있으면 그것을 사용
 * - 없으면 ID-VG 데이터로부터 수치 미분으로 계산
 * 
 * 🧮 계산 수식: gm = ΔID / ΔVG (미분)
 * - 수치 미분: 3점을 사용한 중앙 차분법
 * - gm[i] = (ID[i+1] - ID[i-1]) / (VG[i+1] - VG[i-1])
 * - 노이즈를 줄이고 정확도를 높이는 방법
 * 
 * 📊 단위: S (지멘스) = A/V
 */


  // 입력 데이터 유효성 검사 (최소 3개 점 필요)
  if (!chartData || chartData.length < 3) return [];
  
  const gmData = [];
  
  // 🧮 수치 미분으로 gm 계산 (3점 중앙 차분법)
  // 첫 번째와 마지막 점은 제외 (미분 계산을 위해 양쪽 점이 필요)
  for (let i = 1; i < chartData.length - 1; i++) {
    // VG 간격 계산 (전체 간격을 사용하여 정확도 향상)
    const deltaVG = chartData[i+1].VG - chartData[i-1].VG;
    
    // ID 변화량 계산
    const deltaID = chartData[i+1].ID - chartData[i-1].ID;
    
    // gm 계산: gm = ΔID / ΔVG
    if (deltaVG !== 0) {
      const gm = Math.abs(deltaID / deltaVG);  // 절대값 사용 (방향성보다 크기 중요)
      gmData.push({ 
        VG: chartData[i].VG,  // 중앙점의 VG 값
        gm: gm 
      });
    }
  }
  
  return gmData;
};