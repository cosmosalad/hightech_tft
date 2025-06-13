import { linearRegression } from './utils.js';
export const calculateSS = (chartData) => {
  if (!chartData || chartData.length < 10) return 0;
  
  const logData = chartData.map(d => ({
    VG: d.VG,
    logID: Math.log10(Math.abs(d.ID))
  })).filter(d => isFinite(d.logID));
  
  if (logData.length < 5) return 0;
  
  // 스위칭 구간 우선 선택
  const switchingData = logData.filter(d => d.VG >= -1 && d.VG <= 1);
  const subthresholdData = logData.filter(d => d.logID > -12 && d.logID < -6);
  
  let selectedData;
  if (switchingData.length >= 10) {
    selectedData = switchingData;
  } else if (subthresholdData.length >= 5) {
    selectedData = subthresholdData;
  } else {
    const start = Math.floor(logData.length * 0.3);
    const end = Math.floor(logData.length * 0.7);
    selectedData = logData.slice(start, end);
  }
  
  const x = selectedData.map(d => d.VG);
  const y = selectedData.map(d => d.logID);
  const { slope } = linearRegression(x, y);
  
  return slope > 0 ? (1 / slope) * 1000 : 0;
};