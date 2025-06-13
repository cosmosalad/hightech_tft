export const calculateGm = (chartData) => {
  if (!chartData || chartData.length < 3) return [];
  
  const gmData = [];
  for (let i = 1; i < chartData.length - 1; i++) {
    const deltaVG = chartData[i+1].VG - chartData[i-1].VG;
    const deltaID = chartData[i+1].ID - chartData[i-1].ID;
    
    if (deltaVG !== 0) {
      const gm = Math.abs(deltaID / deltaVG);
      gmData.push({ VG: chartData[i].VG, gm: gm });
    }
  }
  return gmData;
};