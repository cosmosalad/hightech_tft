import { linearRegression } from './utils.js';

export const calculateSS = (chartData) => {
  if (!chartData || chartData.length < 10) return 0;
  
  // log(ID) vs VG 데이터 준비
  const logData = chartData.map(d => ({
    VG: d.VG,
    logID: Math.log10(Math.abs(d.ID))
  })).filter(d => isFinite(d.logID));
  
  if (logData.length < 5) return 0;
  
  // 중간 구간 선택 (30-70%)
  const start = Math.floor(logData.length * 0.3);
  const end = Math.floor(logData.length * 0.7);
  const subData = logData.slice(start, end);
  
  const x = subData.map(d => d.VG);
  const y = subData.map(d => d.logID);
  const slope = linearRegression(x, y).slope;
  
  return slope > 0 ? 1 / slope : 0;
};