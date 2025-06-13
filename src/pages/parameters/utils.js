export const linearRegression = (x, y) => {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
};

export const calculateCox = (tox) => {
  const epsilon_0 = 8.854e-12;
  const epsilon_r = 3.9; // SiO2
  return (epsilon_0 * epsilon_r) / tox;
};

export const CONSTANTS = {
  EPSILON_0: 8.854e-12,
  EPSILON_R_SIO2: 3.9,
  ELEMENTARY_CHARGE: 1.602e-19,
  BOLTZMANN: 1.380649e-23,
  ROOM_TEMP: 300
};