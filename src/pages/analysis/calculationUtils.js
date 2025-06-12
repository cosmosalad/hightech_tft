// 🔄 SYNC: 중앙화된 상수 import (동적 추출됨)
import { PHYSICAL_CONSTANTS, UNIT_CONVERSIONS, TFT_CONSTANTS } from '../utils/constants';

// 🔄 SYNC: Cox 자동 계산 (동적 추출됨)
export const calculateCox = (tox) => {
 return (PHYSICAL_CONSTANTS.EPSILON_0 * PHYSICAL_CONSTANTS.EPSILON_R.SiO2) / tox;
};

// 🔄 SYNC: 선형 회귀 계산 (동적 추출됨)
export const calculateLinearRegression = (x, y) => {
 const n = x.length;
 const sumX = x.reduce((a, b) => a + b, 0);
 const sumY = y.reduce((a, b) => a + b, 0);
 const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
 const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
 
 const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
 const intercept = (sumY - slope * sumX) / n;
 
 return { slope, intercept };
};

// 🔄 SYNC: Y-function method로 μ0 계산 (동적 추출됨)
export const calculateMu0UsingYFunction = (linearData, deviceParams, vth) => {
 if (!linearData || !linearData.chartData || !linearData.gmData || !vth) {
   return {
     mu0: 0,
     error: 'Linear 데이터, gm 데이터 또는 Vth 값 없음',
     yFunctionData: []
   };
 }

 const { chartData, gmData } = linearData;
 const vd = linearData.measuredVDS || 0.1;
 const { W, L, tox } = deviceParams;
 
 const cox = calculateCox(tox);  // 🔄 SYNC: Cox 계산 호출
 
 const yFunctionData = [];
 
 for (let i = 0; i < chartData.length; i++) {
   const vgs = chartData[i].VG;
   const id = chartData[i].ID;
   
   const gmPoint = gmData.find(g => Math.abs(g.VG - vgs) < 0.05);
   
   if (gmPoint && gmPoint.gm > 1e-12 && vgs > vth && id > 1e-12) {
     // 🔥 PDF 수식 기준: Y = ID/√gm
     const y = id / Math.sqrt(gmPoint.gm);
     const x = vgs - vth;
     
     yFunctionData.push({ 
       x: x,
       y: y,
       vgs: vgs,
       id: id,
       gm: gmPoint.gm
     });
   }
 }
 
 if (yFunctionData.length < 5) {
   return {
     mu0: 0,
     error: 'Y-function 계산을 위한 충분한 데이터 부족',
     yFunctionData: yFunctionData
   };
 }
 
 const startIdx = Math.floor(yFunctionData.length * 0.2);
 const endIdx = Math.floor(yFunctionData.length * 0.8);
 const linearRegion = yFunctionData.slice(startIdx, endIdx);
 
 if (linearRegion.length < 3) {
   return {
     mu0: 0,
     error: '선형 구간 데이터 부족',
     yFunctionData: yFunctionData
   };
 }
 
 const x_values = linearRegion.map(d => d.x);
 const y_values = linearRegion.map(d => d.y);
 const regression = calculateLinearRegression(x_values, y_values);  // 🔄 SYNC: 선형회귀 호출
 
 // 🔥 PDF 수식: μ0 = A²L/(Cox×VD×W)
 const A = regression.slope;
 const mu0 = (A * A * L) / (cox * vd * W) * 1e4;
 
 const y_predicted = x_values.map(x => regression.slope * x + regression.intercept);
 const ss_res = y_values.reduce((sum, y, i) => sum + Math.pow(y - y_predicted[i], 2), 0);
 const y_mean = y_values.reduce((sum, y) => sum + y, 0) / y_values.length;
 const ss_tot = y_values.reduce((sum, y) => sum + Math.pow(y - y_mean, 2), 0);
 const r_squared = ss_tot > 0 ? 1 - (ss_res / ss_tot) : 0;
 
 return {
   mu0: mu0,
   slope: regression.slope,
   intercept: regression.intercept,
   r_squared: r_squared,
   dataPoints: yFunctionData.length,
   linearRegionPoints: linearRegion.length,
   yFunctionData: yFunctionData,
   linearRegion: linearRegion,
   quality: r_squared > 0.95 ? 'Excellent' : 
            r_squared > 0.9 ? 'Good' : 
            r_squared > 0.8 ? 'Fair' : 'Poor'
 };
};

// 🔄 SYNC: μFE 계산 (동적 추출됨)
export const calculateMuFE = (gm_max, deviceParams, vds) => {
 if (!gm_max || !deviceParams.W || !deviceParams.L || !vds) {
   return 0;
 }

 // PDF 수식: μFE = L/(W×Cox×VDS) × gm,max
 const cox = calculateCox(deviceParams.tox);  // 🔄 SYNC: Cox 계산 호출
 const { W, L } = deviceParams;
 
 const muFE_SI = (L / (W * cox * vds)) * gm_max;
 const muFE_cm2 = UNIT_CONVERSIONS.mobility_m2Vs_to_cm2Vs(muFE_SI);  // 🔄 SYNC: 단위변환 사용
 
 return muFE_cm2;
};

// 🔄 SYNC: Subthreshold Swing 계산 (동적 추출됨)
export const calculateSubthresholdSwing = (chartData) => {
 const subthresholdData = chartData.filter(d => {
   const logID = Math.log10(Math.abs(d.ID));
   return logID > -10 && logID < -6;
 });
 
 if (subthresholdData.length < 5) {
   return 0;
 }
 
 const x = subthresholdData.map(d => d.VG);
 const y = subthresholdData.map(d => Math.log10(Math.abs(d.ID)));
 const regression = calculateLinearRegression(x, y);  // 🔄 SYNC: 선형회귀 호출
 
 if (regression.slope === 0) {
   return 0;
 }
 
 // PDF 수식: SS = dVG/d(log ID) = 1/slope
 const ss_V_per_decade = 1 / regression.slope;
 
 return Math.abs(ss_V_per_decade);
};

// 🔄 SYNC: Threshold Voltage 계산 (동적 추출됨)
export const calculateThresholdVoltage = (chartData, gmData) => {
 if (!gmData || gmData.length === 0) {
   return 0;
 }
 
 const maxGmPoint = gmData.reduce((max, current) => 
   current.gm > max.gm ? current : max
 );
 
 const vg_max = maxGmPoint.VG;
 
 const currentPoint = chartData.find(d => Math.abs(d.VG - vg_max) < 0.1);
 if (!currentPoint) {
   return 0;
 }
 
 const id_max = currentPoint.ID;
 const log_id_max = Math.log10(Math.abs(id_max));
 
 // PDF 수식: slope = gm_max / ID_max
 const slope = maxGmPoint.gm / id_max;
 
 // Vth = VG_max - log(ID_max) / slope
 const vth = vg_max - (log_id_max / slope);
 
 return vth;
};

// 🔄 SYNC: Interface Trap Density 계산 (동적 추출됨)
export const calculateDit = (ss, deviceParams) => {
 if (!ss || ss <= 0) return 0;
 
 // PDF 수식: Dit = (Cox/q) × (SS/(2.3×kT/q) - 1)
 const kT_q = PHYSICAL_CONSTANTS.THERMAL_VOLTAGE_300K;  // 🔄 SYNC: 물리상수 사용
 const cox = calculateCox(deviceParams.tox) * 1e-4;     // 🔄 SYNC: Cox 계산 호출
 const q = PHYSICAL_CONSTANTS.ELEMENTARY_CHARGE;        // 🔄 SYNC: 물리상수 사용
 
 const dit = (cox / q) * (ss / (2.3 * kT_q) - 1);
 
 return Math.max(0, dit);
};

// 🔄 SYNC: θ (theta) 계산 (동적 추출됨)
export const calculateTheta = (mu0, deviceParams, chartData, gmData, vth, vds) => {
 if (!mu0 || !vth || !chartData || !gmData) {
   return { theta: 0.1, method: 'Default value' };
 }
 
 const { W, L } = deviceParams;
 const cox = calculateCox(deviceParams.tox);  // 🔄 SYNC: Cox 계산 호출
 
 // PDF 수식: θ = (μ0×W×Cox×VD)/(ID×L) - 1/(VG-Vth)
 const validPoints = [];
 
 for (let i = 0; i < chartData.length; i++) {
   const point = chartData[i];
   const vg = point.VG;
   const id = point.ID;
   
   if (vg > vth + 1.0 && id > 1e-12) {
     const gmPoint = gmData.find(g => Math.abs(g.VG - vg) < 0.05);
     if (gmPoint) {
       const xcal = 1 / (vg - vth);
       const ycal = (mu0 * W * cox * vds) / (id * L);
       
       validPoints.push({ xcal, ycal, vg, id });
     }
   }
 }
 
 if (validPoints.length < 3) {
   return { theta: 0.1, method: 'Insufficient data points' };
 }
 
 const x_values = validPoints.map(p => p.xcal);
 const y_values = validPoints.map(p => p.ycal);
 const regression = calculateLinearRegression(x_values, y_values);  // 🔄 SYNC: 선형회귀 호출
 
 const theta = regression.intercept;
 
 // 🔄 SYNC: TFT 상수를 사용한 물리적 타당성 검증
 if (theta < TFT_CONSTANTS.THETA_RANGE.min || theta > TFT_CONSTANTS.THETA_RANGE.max) {
   return { theta: 0.1, method: 'Out of physical range, using default' };
 }
 
 return { 
   theta: theta, 
   method: 'PDF calculation method',
   r_squared: calculateRSquared(x_values, y_values, regression),
   dataPoints: validPoints.length
 };
};

const calculateRSquared = (x_values, y_values, regression) => {
 const y_predicted = x_values.map(x => regression.slope * x + regression.intercept);
 const ss_res = y_values.reduce((sum, y, i) => sum + Math.pow(y - y_predicted[i], 2), 0);
 const y_mean = y_values.reduce((sum, y) => sum + y, 0) / y_values.length;
 const ss_tot = y_values.reduce((sum, y) => sum + Math.pow(y - y_mean, 2), 0);
 return ss_tot > 0 ? 1 - (ss_res / ss_tot) : 0;
};

// 🔄 SYNC: gm 계산 (동적 추출됨)
export const calculateGm = (chartData, useNumericDifferentiation = true) => {
 const gmData = [];
 
 if (useNumericDifferentiation) {
   // 수치 미분: gm = ΔID / ΔVG
   for (let i = 1; i < chartData.length - 1; i++) {
     const deltaVG = chartData[i+1].VG - chartData[i-1].VG;
     const deltaID = chartData[i+1].ID - chartData[i-1].ID;
     
     if (deltaVG !== 0) {
       const gm = Math.abs(deltaID / deltaVG);
       const roundedVG = Math.round(chartData[i].VG * 10) / 10;
       gmData.push({ VG: roundedVG, gm: gm });
     }
   }
 }
 
 return gmData;
};

// 🔄 SYNC: μeff 계산 (동적 추출됨)
export const calculateMuEff = (mu0, theta, vg, vth) => {
 if (!mu0 || !theta || vg <= vth) {
   return 0;
 }
 
 // PDF 수식: μeff = μ0 / (1 + θ(VG - Vth))
 const muEff = mu0 / (1 + theta * (vg - vth));
 
 return muEff;
};