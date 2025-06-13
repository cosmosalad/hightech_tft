import { linearRegression, calculateCox } from './utils.js';

export const calculateTheta = (mu0, deviceParams, chartData, vth, vds) => {
  if (!mu0 || !vth || !chartData) return { theta: 0.1, method: 'Default' };

  const { W, L, tox } = deviceParams;
  const cox = calculateCox(tox);
  
  const points = [];
  
  for (const point of chartData) {
    const vg = point.VG;
    const id = point.ID;
    
    if (vg > vth + 1.0 && id > 1e-12) {
      const xcal = 1 / (vg - vth);
      const ycal = (mu0 * W * cox * vds) / (id * L);
      points.push({ xcal, ycal });
    }
  }
  
  if (points.length < 3) return { theta: 0.1, method: 'Insufficient data' };
  
  const x = points.map(p => p.xcal);
  const y = points.map(p => p.ycal);
  const theta = linearRegression(x, y).intercept; // Y-intercept
  
  return { theta: theta > 0 && theta < 2 ? theta : 0.1, method: 'Calculated' };
};