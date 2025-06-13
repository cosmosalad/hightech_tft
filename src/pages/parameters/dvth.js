import { linearRegression } from './utils.js';

export const calculateDeltaVth = (forwardData, backwardData) => {
  if (!forwardData || !backwardData) return { deltaVth: 0, vthForward: 0, vthBackward: 0 };
  
  const vthForward = calculateVthFromSqrt(forwardData);
  const vthBackward = calculateVthFromSqrt(backwardData);
  const deltaVth = Math.abs(vthForward - vthBackward);
  
  return { deltaVth, vthForward, vthBackward };
};

const calculateVthFromSqrt = (data) => {
  if (data.length < 10) return 0;
  
  const start = Math.floor(data.length * 0.3);
  const end = Math.floor(data.length * 0.7);
  const selectedData = data.slice(start, end);
  
  const x = selectedData.map(d => d.VG);
  const y = selectedData.map(d => Math.sqrt(Math.abs(d.ID)));
  const { slope, intercept } = linearRegression(x, y);
  
  return slope !== 0 ? -intercept / slope : 0;
};