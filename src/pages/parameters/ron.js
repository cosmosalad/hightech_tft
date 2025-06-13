import { linearRegression } from './utils.js';

export const calculateRon = (chartData, gateVoltages) => {
  if (!chartData || !gateVoltages || gateVoltages.length === 0) return 0;
  
  // 최고 게이트 전압에서의 데이터
  const highestVG = gateVoltages[gateVoltages.length - 1];
  const dataKey = `VG_${highestVG}V`;
  
  // 초반 선형 구간 (1-5번째 점)
  const linearPoints = chartData.slice(1, 6);
  if (linearPoints.length < 3) return 0;
  
  const vd = linearPoints.map(p => p.VD);
  const id = linearPoints.map(p => p[dataKey] || 1e-12);
  const slope = linearRegression(vd, id).slope;
  
  return slope > 0 ? 1 / slope : 0; // Ron = 1/slope
};