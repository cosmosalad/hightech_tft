export const calculateIDSat = (chartData, deviceParams) => {
  if (!chartData || !deviceParams.W) return 0;
  
  const maxCurrent = Math.max(...chartData.map(d => d.ID));
  const W_mm = deviceParams.W * 1000; // m → mm
  
  return maxCurrent / W_mm; // A/mm
};