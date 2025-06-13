import { linearRegression, calculateCox } from './utils.js';

export const calculateMu0 = (chartData, gmData, deviceParams, vth, vds) => {
  if (!chartData || !gmData || !vth || !deviceParams) {
    return { mu0: 0, quality: 'Poor', error: 'Insufficient input data' };
  }

  const { W, L, tox } = deviceParams;
  const cox = calculateCox(tox);
  
  if (!cox || cox <= 0) {
    return { mu0: 0, quality: 'Poor', error: 'Invalid Cox value' };
  }

  const yData = [];

  // Y-function 데이터 수집 (더 엄격한 조건)
  for (let i = 0; i < chartData.length; i++) {
    const vgs = chartData[i].VG;
    const id = chartData[i].ID;
    const gmPoint = gmData.find(g => Math.abs(g.VG - vgs) < 0.05);

    // 🔥 개선된 조건들
    if (gmPoint && 
        vgs > vth + 0.5 &&           // 최소 Vth + 0.5V (강한 반전 영역)
        id > 1e-12 && 
        gmPoint.gm > 1e-12 &&        // gm이 양수이고 의미있는 값
        isFinite(id) && 
        isFinite(gmPoint.gm) && 
        isFinite(vgs)) {
      
      const y = id / Math.sqrt(gmPoint.gm);
      const x = vgs - vth;
      
      if (isFinite(y) && isFinite(x) && y > 0) {
        yData.push({ x, y });
      }
    }
  }

  // 🔥 더 엄격한 데이터 포인트 기준
  if (yData.length < 10) {
    return { mu0: 0, quality: 'Poor', error: `Insufficient data points: ${yData.length}` };
  }

  // 선형 회귀 및 R² 계산
  const x = yData.map(d => d.x);
  const y = yData.map(d => d.y);
  const regression = linearRegression(x, y);
  const slope = regression.slope;
  const rSquared = calculateRSquared(x, y, regression);

  // 🔥 R² 검증 (Y-function은 선형성이 핵심!)
  if (rSquared < 0.90) {
    return { 
      mu0: 0, 
      quality: 'Poor', 
      error: `Poor linearity: R² = ${rSquared.toFixed(3)}`,
      rSquared 
    };
  }

  // 🔥 기울기 검증
  if (slope <= 0 || !isFinite(slope)) {
    return { mu0: 0, quality: 'Poor', error: 'Invalid slope' };
  }

  // μ0 계산
  const mu0_raw = (slope * slope * L) / (cox * vds * W);
  const mu0 = mu0_raw * 1e4; // m²/V·s → cm²/V·s

  // 🔥 물리적 타당성 검증
  if (mu0 <= 0 || mu0 > 200) { // TFT 일반적 범위
    return { 
      mu0: 0, 
      quality: 'Poor', 
      error: `Unphysical μ0 value: ${mu0.toFixed(2)} cm²/V·s` 
    };
  }

  // 🔥 품질 평가 (R²와 데이터 포인트 수 기반)
  let quality = 'Good';
  if (rSquared > 0.98 && yData.length >= 15) {
    quality = 'Excellent';
  } else if (rSquared < 0.95 || yData.length < 12) {
    quality = 'Fair';
  }

  return {
    mu0: parseFloat(mu0.toFixed(3)),
    quality,
    rSquared: parseFloat(rSquared.toFixed(4)),
    dataPoints: yData.length,
    slope: parseFloat(slope.toFixed(6)),
    method: 'Y-function'
  };
};

// 🔥 R² 계산 함수 추가
const calculateRSquared = (x, y, regression) => {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const yMean = y.reduce((sum, val) => sum + val, 0) / y.length;
  const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
  
  if (ssTotal === 0) return 1; // 모든 y값이 같은 경우
  
  const ssResidual = x.reduce((sum, xi, i) => {
    const predicted = regression.slope * xi + regression.intercept;
    return sum + Math.pow(y[i] - predicted, 2);
  }, 0);
  
  return Math.max(0, Math.min(1, 1 - (ssResidual / ssTotal)));
};