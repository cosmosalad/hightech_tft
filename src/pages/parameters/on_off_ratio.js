export const calculateOnOffRatio = (chartData) => {
  if (!chartData || chartData.length === 0) {
    return { ion: 0, ioff: 0, ratio: 0 };
  }
  
  // VG 순서로 정렬
  const sortedData = [...chartData].sort((a, b) => a.VG - b.VG);
  
  // Ion: 전체 범위에서 최대 전류 (mobility degradation 고려)
  const ion = Math.abs(sortedData[sortedData.length - 1].ID);
  
  // Ioff: 가장 낮은 VG에서의 전류  
  const ioff = Math.abs(sortedData[0].ID);
  
  return { 
    ion, 
    ioff, 
    ratio: ioff > 0 ? ion / ioff : 0 
  };
};