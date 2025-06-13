export const calculateVth = (chartData, gmData) => {
  if (!gmData || gmData.length === 0) return 0;
  
  // gm_max 지점 찾기
  const maxGmPoint = gmData.reduce((max, current) => 
    current.gm > max.gm ? current : max
  );
  
  const vg_max = maxGmPoint.VG;
  const gm_max = maxGmPoint.gm;
  
  // gm_max 지점의 ID 찾기
  const currentPoint = chartData.find(d => Math.abs(d.VG - vg_max) < 0.1);
  if (!currentPoint) return 0;
  
  const id_max = currentPoint.ID;
  
  // Linear Extrapolation: Vth = VG_max - ID_max/gm_max
  return vg_max - (id_max / gm_max);
};