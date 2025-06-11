// 🔥 중앙화된 상수 import
import { PHYSICAL_CONSTANTS, UNIT_CONVERSIONS, TFT_CONSTANTS } from '../utils/constants';

// Cox 자동 계산 (중앙화된 상수 사용)
export const calculateCox = (tox) => {
  return (PHYSICAL_CONSTANTS.EPSILON_0 * PHYSICAL_CONSTANTS.EPSILON_R.SiO2) / tox;
};

// 선형 회귀 계산
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

// 🔥 PDF 기준 정확한 Y-function method로 μ0 계산
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
  
  // Cox 계산 (F/m²)
  const cox = calculateCox(tox);
  
  // Y-function 데이터 계산
  const yFunctionData = [];
  
  for (let i = 0; i < chartData.length; i++) {
    const vgs = chartData[i].VG;
    const id = chartData[i].ID;
    
    const gmPoint = gmData.find(g => Math.abs(g.VG - vgs) < 0.05);
    
    if (gmPoint && gmPoint.gm > 1e-12 && vgs > vth && id > 1e-12) {
      // 🔥 PDF 수식 기준: Y = ID/√gm
      const y = id / Math.sqrt(gmPoint.gm);
      const x = vgs - vth;  // (VG - Vth)
      
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
  
  // 선형 구간 선택 (전체 데이터의 20-80% 구간)
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
  
  // 선형 회귀로 기울기 계산
  const x_values = linearRegion.map(d => d.x);
  const y_values = linearRegion.map(d => d.y);
  const regression = calculateLinearRegression(x_values, y_values);
  
  // 🔥 PDF 수식: μ0 = A²L/(Cox×VD×W)
  // Y = A × (VG - Vth)에서 A = slope
  const A = regression.slope;
  const mu0 = (A * A * L) / (cox * vd * W) * 1e4; // cm²/V·s로 변환
  
  // R² 계산으로 선형성 확인
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

// 🔥 PDF 기준 정확한 μFE 계산
export const calculateMuFE = (gm_max, deviceParams, vds) => {
  if (!gm_max || !deviceParams.W || !deviceParams.L || !vds) {
    return 0;
  }

  // PDF 수식: μFE = L/(W×Cox×VDS) × gm,max
  const cox = calculateCox(deviceParams.tox); // F/m²
  const { W, L } = deviceParams;
  
  // 직접적인 계산 (SI 단위)
  const muFE_SI = (L / (W * cox * vds)) * gm_max; // m²/V·s
  const muFE_cm2 = UNIT_CONVERSIONS.mobility_m2Vs_to_cm2Vs(muFE_SI); // cm²/V·s로 변환
  
  return muFE_cm2;
};

// 🔥 PDF 기준 정확한 Subthreshold Swing 계산
export const calculateSubthresholdSwing = (chartData) => {
  // IDVG 데이터에서 subthreshold 영역 식별
  const subthresholdData = chartData.filter(d => {
    const logID = Math.log10(Math.abs(d.ID));
    return logID > -10 && logID < -6; // 적절한 subthreshold 범위
  });
  
  if (subthresholdData.length < 5) {
    return 0;
  }
  
  // log(ID) vs VG의 선형 회귀
  const x = subthresholdData.map(d => d.VG);
  const y = subthresholdData.map(d => Math.log10(Math.abs(d.ID)));
  const regression = calculateLinearRegression(x, y);
  
  if (regression.slope === 0) {
    return 0;
  }
  
  // PDF 수식: SS = dVG/d(log ID) = 1/slope
  const ss_V_per_decade = 1 / regression.slope;
  
  return Math.abs(ss_V_per_decade); // V/decade
};

// 🔥 PDF 기준 정확한 Threshold Voltage 계산 (gm_max 기준 선형 외삽법)
export const calculateThresholdVoltage = (chartData, gmData) => {
  if (!gmData || gmData.length === 0) {
    return 0;
  }
  
  // gm_max 지점 찾기
  const maxGmPoint = gmData.reduce((max, current) => 
    current.gm > max.gm ? current : max
  );
  
  const vg_max = maxGmPoint.VG;
  
  // gm_max 지점에서의 ID 찾기
  const currentPoint = chartData.find(d => Math.abs(d.VG - vg_max) < 0.1);
  if (!currentPoint) {
    return 0;
  }
  
  const id_max = currentPoint.ID;
  const log_id_max = Math.log10(Math.abs(id_max));
  
  // PDF 수식: slope = gm_max / ID_max
  const slope = maxGmPoint.gm / id_max;
  
  // 접선 방정식: log(ID) = slope × (VG - VG_max) + log(ID_max)
  // Vth에서 log(ID) = 0이라고 가정하면:
  // 0 = slope × (Vth - VG_max) + log(ID_max)
  // Vth = VG_max - log(ID_max) / slope
  
  const vth = vg_max - (log_id_max / slope);
  
  return vth;
};

// 🔥 PDF 기준 정확한 Interface Trap Density 계산 (중앙화된 상수 사용)
export const calculateDit = (ss, deviceParams) => {
  if (!ss || ss <= 0) return 0;
  
  // PDF 수식: Dit = (Cox/q) × (SS/(2.3×kT/q) - 1)
  const kT_q = PHYSICAL_CONSTANTS.THERMAL_VOLTAGE_300K; // V at 300K
  const cox = calculateCox(deviceParams.tox) * 1e-4; // F/cm²로 변환
  const q = PHYSICAL_CONSTANTS.ELEMENTARY_CHARGE; // C
  
  const dit = (cox / q) * (ss / (2.3 * kT_q) - 1);
  
  return Math.max(0, dit); // 음수 방지
};

// 🔥 PDF 기준 정확한 θ (theta) 계산
export const calculateTheta = (mu0, deviceParams, chartData, gmData, vth, vds) => {
  if (!mu0 || !vth || !chartData || !gmData) {
    return { theta: 0.1, method: 'Default value' };
  }
  
  const { W, L } = deviceParams;
  const cox = calculateCox(deviceParams.tox);
  
  // PDF 수식: θ = (μ0×W×Cox×VD)/(ID×L) - 1/(VG-Vth)
  // 조건: VG > Vth + 1V 또는 VG > Vth + 3SS
  
  const validPoints = [];
  
  for (let i = 0; i < chartData.length; i++) {
    const point = chartData[i];
    const vg = point.VG;
    const id = point.ID;
    
    // 조건 확인: VG > Vth + 1V
    if (vg > vth + 1.0 && id > 1e-12) {
      const gmPoint = gmData.find(g => Math.abs(g.VG - vg) < 0.05);
      if (gmPoint) {
        // Xcal = 1/(VG - Vth)
        const xcal = 1 / (vg - vth);
        
        // Ycal = (μ0×W×Cox×VD)/(ID×L)
        const ycal = (mu0 * W * cox * vds) / (id * L);
        
        validPoints.push({ xcal, ycal, vg, id });
      }
    }
  }
  
  if (validPoints.length < 3) {
    return { theta: 0.1, method: 'Insufficient data points' };
  }
  
  // 선형 회귀: Ycal = θ + Xcal
  const x_values = validPoints.map(p => p.xcal);
  const y_values = validPoints.map(p => p.ycal);
  const regression = calculateLinearRegression(x_values, y_values);
  
  // θ는 Y-intercept
  const theta = regression.intercept;
  
  // 🔥 중앙화된 상수를 사용한 물리적 타당성 검증
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

// R² 계산 헬퍼 함수
const calculateRSquared = (x_values, y_values, regression) => {
  const y_predicted = x_values.map(x => regression.slope * x + regression.intercept);
  const ss_res = y_values.reduce((sum, y, i) => sum + Math.pow(y - y_predicted[i], 2), 0);
  const y_mean = y_values.reduce((sum, y) => sum + y, 0) / y_values.length;
  const ss_tot = y_values.reduce((sum, y) => sum + Math.pow(y - y_mean, 2), 0);
  return ss_tot > 0 ? 1 - (ss_res / ss_tot) : 0;
};

// gm 계산 (수치 미분)
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

// 🔥 PDF 기준 정확한 μeff 계산
export const calculateMuEff = (mu0, theta, vg, vth) => {
  if (!mu0 || !theta || vg <= vth) {
    return 0;
  }
  
  // PDF 수식: μeff = μ0 / (1 + θ(VG - Vth))
  const muEff = mu0 / (1 + theta * (vg - vth));
  
  return muEff;
};