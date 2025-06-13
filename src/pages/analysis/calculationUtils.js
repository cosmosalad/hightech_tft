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

// 🔥 간단한 SS 계산 - 선형 구간만 찾기
export const calculateSubthresholdSwing = (chartData) => {
  if (!chartData || chartData.length === 0) {
    return 0;
  }
  
  // VG 순으로 정렬
  const sortedData = chartData.sort((a, b) => a.VG - b.VG);
  
  // log(ID) 계산
  const logData = sortedData.map(d => ({
    VG: d.VG,
    ID: Math.abs(d.ID),
    logID: Math.log10(Math.abs(d.ID))
  })).filter(d => d.ID > 1e-15 && isFinite(d.logID));
  
  if (logData.length < 10) {
    return 0;
  }
  
  // 🔥 핵심: 선형 구간 찾기 (이미지처럼)
  // 1. 전류가 급격히 증가하기 시작하는 구간 찾기
  let startIdx = -1;
  let endIdx = -1;
  
  // 첫 번째 방법: 기울기가 일정한 구간 찾기
  const slopes = [];
  for (let i = 1; i < logData.length - 1; i++) {
    const slope = (logData[i+1].logID - logData[i-1].logID) / (logData[i+1].VG - logData[i-1].VG);
    slopes.push({ index: i, slope: slope, vg: logData[i].VG, logID: logData[i].logID });
  }
  
  // 기울기가 0.5 이상인 구간들 찾기 (subthreshold 특성)
  const candidateRegions = slopes.filter(s => s.slope > 0.5 && s.slope < 50);
  
  if (candidateRegions.length >= 5) {
    // 가장 긴 연속 구간 찾기
    let maxLength = 0;
    let bestStart = 0, bestEnd = 0;
    
    for (let i = 0; i < candidateRegions.length - 4; i++) {
      for (let j = i + 4; j < candidateRegions.length; j++) {
        const regionData = candidateRegions.slice(i, j+1);
        const avgSlope = regionData.reduce((sum, r) => sum + r.slope, 0) / regionData.length;
        const slopeVariation = Math.max(...regionData.map(r => r.slope)) - Math.min(...regionData.map(r => r.slope));
        
        // 기울기가 일정하고 충분히 긴 구간
        if (slopeVariation < avgSlope * 0.5 && regionData.length > maxLength) {
          maxLength = regionData.length;
          bestStart = regionData[0].index - 1;
          bestEnd = regionData[regionData.length-1].index + 1;
        }
      }
    }
    
    if (maxLength >= 5) {
      startIdx = Math.max(0, bestStart);
      endIdx = Math.min(logData.length - 1, bestEnd);
    }
  }
  
  // 두 번째 방법: 고정 범위 (이미지 기준)
  if (startIdx === -1) {
    // 이미지에서 보는 것처럼 중간 범위 사용
    const totalRange = logData[logData.length-1].VG - logData[0].VG;
    const startVG = logData[0].VG + totalRange * 0.2;
    const endVG = logData[0].VG + totalRange * 0.6;
    
    startIdx = logData.findIndex(d => d.VG >= startVG);
    endIdx = logData.findIndex(d => d.VG >= endVG);
    
    if (startIdx === -1) startIdx = Math.floor(logData.length * 0.2);
    if (endIdx === -1) endIdx = Math.floor(logData.length * 0.6);
  }
  
  // 세 번째 방법: 전류 범위 기준 (이미지처럼 10^-12 ~ 10^-8 구간)
  if (endIdx - startIdx < 5) {
    const targetRegion = logData.filter(d => d.logID >= -12 && d.logID <= -7);
    if (targetRegion.length >= 5) {
      startIdx = logData.findIndex(d => d.VG === targetRegion[0].VG);
      endIdx = logData.findIndex(d => d.VG === targetRegion[targetRegion.length-1].VG);
    }
  }
  
  // 최종 계산
  if (startIdx >= 0 && endIdx > startIdx && (endIdx - startIdx) >= 3) {
    const selectedData = logData.slice(startIdx, endIdx + 1);
    const x = selectedData.map(d => d.VG);
    const y = selectedData.map(d => d.logID);
    
    const regression = calculateLinearRegression(x, y);
    
    if (regression.slope > 0) {
      const ss = 1 / regression.slope;
      
      if (ss >= 0.05 && ss <= 10) {
        console.log(`SS 계산 성공: ${ss.toFixed(3)} V/decade`);
        console.log(`사용 구간: VG ${x[0].toFixed(2)} ~ ${x[x.length-1].toFixed(2)} V`);
        console.log(`사용 구간: log(ID) ${y[0].toFixed(2)} ~ ${y[y.length-1].toFixed(2)}`);
        console.log(`데이터 포인트: ${selectedData.length}개`);
        return Math.abs(ss);
      }
    }
  }
  
  console.log('SS 계산 실패');
  return 0;
};

// 🔥 간단한 Dit 계산
export const calculateDit = (ss, deviceParams) => {
  if (!ss || ss <= 0 || ss < 0.05 || ss > 10) {
    return 0;
  }
  
  try {
    const kT_q = 0.0259; // 300K에서
    const epsilon_0 = 8.854e-12;
    const epsilon_r = 3.9; // SiO2
    const q = 1.602e-19;
    
    const cox = (epsilon_0 * epsilon_r / deviceParams.tox) * 1e-4; // F/cm²
    const dit = (cox / q) * (ss / (2.3 * kT_q) - 1);
    
    if (dit > 0 && dit < 1e15) {
      console.log(`Dit 계산 성공: ${dit.toExponential(2)} cm⁻²eV⁻¹`);
      return dit;
    }
  } catch (error) {
    console.log('Dit 계산 오류:', error.message);
  }
  
  return 0;
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
 const gm_max = maxGmPoint.gm;
 
 const currentPoint = chartData.find(d => Math.abs(d.VG - vg_max) < 0.1);
 if (!currentPoint) {
   return 0;
 }
 
 const id_max = currentPoint.ID;
 const log_id_max = Math.log10(Math.abs(id_max));
 
 // PDF 수식: slope = gm_max / ID_max
 const slope = gm_max / id_max;
 
 // Vth = VG_max - log(ID_max) / slope
 const vth = vg_max - (log_id_max / slope);
 
 return vth;
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