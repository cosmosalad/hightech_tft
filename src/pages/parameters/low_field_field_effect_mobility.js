import { linearRegression, calculateCox } from './utils.js';

export const calculateMu0 = (chartData, gmData, deviceParams, vth, vds) => {
  if (!chartData || !gmData || !vth) return { mu0: 0, quality: 'Poor' };

  const { W, L, tox } = deviceParams;
  const cox = calculateCox(tox);
  
  const yData = [];
  
  // Y-function: Y = ID/√gm
  for (let i = 0; i < chartData.length; i++) {
    const vgs = chartData[i].VG;
    const id = chartData[i].ID;
    const gmPoint = gmData.find(g => Math.abs(g.VG - vgs) < 0.05);
    
    if (gmPoint && vgs > vth && id > 1e-12) {
      const y = id / Math.sqrt(gmPoint.gm);
      const x = vgs - vth;
      yData.push({ x, y });
    }
  }
  
  if (yData.length < 5) return { mu0: 0, quality: 'Poor' };
  
  // 선형 회귀
  const x = yData.map(d => d.x);
  const y = yData.map(d => d.y);
  const slope = linearRegression(x, y).slope;
  
  // μ0 = A²L/(Cox×VD×W)
  const mu0 = (slope * slope * L) / (cox * vds * W) * 1e4;
  
  return { mu0, quality: 'Good' };
};