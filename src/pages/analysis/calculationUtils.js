// Cox 자동 계산 (εr_SiO2 = 3.9, ε0 = 8.854e-12 F/m)
export const calculateCox = (tox) => {
  const epsilon_r = 3.9;
  const epsilon_0 = 8.854e-12;
  return (epsilon_r * epsilon_0) / tox;
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

// Y-function method로 정확한 μ0 계산
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
  
  // Cox 계산 (F/cm²)
  const cox = calculateCox(tox);
  
  // Y-function 데이터 계산
  const yFunctionData = [];
  
  for (let i = 0; i < chartData.length; i++) {
    const vgs = chartData[i].VG;
    const id = chartData[i].ID;
    
    const gmPoint = gmData.find(g => Math.abs(g.VG - vgs) < 0.05);
    
    if (gmPoint && gmPoint.gm > 1e-12 && vgs > vth && id > 1e-12) {
      const y = id / Math.sqrt(gmPoint.gm);  // ✅ 올바른 Y
      const x = vgs - vth;  // 🔥 수정: (VG - Vth)가 맞음!
      
      yFunctionData.push({ 
        x: x,  // (VG - Vth)
        y: y,  // ID / √gm
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
  
  // μ0 = slope² / (Cox × W/L × VDS)
  const mu0 = (regression.slope * regression.slope * L) / (cox * vd * W) * 1e4;
  
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

// μFE 계산 함수
export const calculateMuFE = (gm_max, deviceParams, vds) => {
  if (!gm_max || !deviceParams.W || !deviceParams.L || !vds) {
    return 0;
  }

  const cox_F_per_m2 = calculateCox(deviceParams.tox); // F/m² 단위 
  // F/m²를 F/cm²로 변환 (1 m² = 1e4 cm²) 
  const cox_F_per_cm2 = cox_F_per_m2 * 1e-4; 
  
  // 채널 폭(W)과 길이(L)를 m에서 cm로 변환 
  const W_cm = deviceParams.W * 100; // cm 
  const L_cm = deviceParams.L * 100; // cm 
  
  // µFE = gm_max * L / (Cox * W * VDS) 공식 적용 
  return (L_cm / (W_cm * cox_F_per_cm2 * vds)) * gm_max;
};

// Subthreshold Swing 계산
export const calculateSubthresholdSwing = (chartData) => {
  const subthresholdData = chartData.filter(d => d.logID > -10 && d.logID < -6);
  let ss = 0;
  if (subthresholdData.length > 5) {
    const x = subthresholdData.map(d => d.VG);
    const y = subthresholdData.map(d => d.logID);
    const slope = calculateLinearRegression(x, y).slope;
    if (slope !== 0) {
      ss = 1 / slope;
    }
  }
  return ss;
};

// Threshold Voltage 계산 (√ID vs VG 방법)
export const calculateThresholdVoltage = (chartData, gmData) => {
  let vth = 0;
  const maxGmPoint = gmData.reduce((max, current) => 
    current.gm > max.gm ? current : max, gmData[0]
  );
  
  const gmMaxIndex = chartData.findIndex(d => Math.abs(d.VG - maxGmPoint.VG) < 0.1);
  
  if (gmMaxIndex > 5) {
    const linearStart = Math.max(0, gmMaxIndex - 5);
    const linearEnd = Math.min(chartData.length, gmMaxIndex + 5);
    const x = chartData.slice(linearStart, linearEnd).map(d => d.VG);
    const y = chartData.slice(linearStart, linearEnd).map(d => d.sqrtID);
    const regression = calculateLinearRegression(x, y);
    if (regression.slope !== 0) {
      vth = -regression.intercept / regression.slope;
    }
  }
  return vth;
};

// Interface Trap Density 계산
export const calculateDit = (ss, deviceParams) => {
  if (!ss || ss <= 0) return 0;
  
  const kT_q = 0.0259; // V at room temperature
  const cox = calculateCox(deviceParams.tox) * 1e-4; // F/cm²
  const q = 1.602e-19; // C
  
  return (cox / q) * (ss / (2.3 * kT_q) - 1);
};

// gm 계산 (수치 미분)
export const calculateGm = (chartData, useNumericDifferentiation = true) => {
  const gmData = [];
  
  if (useNumericDifferentiation) {
    // 수치 미분으로 gm 계산
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