import { linearRegression, calculateCox } from './utils.js';

export const calculateMu0 = (chartData, gmData, deviceParams, vth, vds) => {
/**
 * 🎯 μ0 (Low-field Field-effect Mobility) 계산 모듈 - Y-function Method
 * 
 * 📖 물리적 의미:
 * - 산란 또는 이동도 저하 효과의 영향 없이 채널 내의 본질적인 carrier 이동도
 * - 매우 낮은 전기장에서 carrier가 달성할 수 있는 "최대" 이동도
 * - 소재 고유의 이동도 특성을 나타냄
 * 
 * 📏 측정 데이터: IDVG-Linear
 * - VD는 저전계 조건을 보장하기 위해 매우 작아야 함 (10mV ~ 100mV)
 * - 강한 반전 영역(VG > Vth + 0.5V)의 데이터 사용
 * - Y-function의 선형성이 핵심
 * 
 * 🧮 Y-function Method:
 * - Y = ID / √gm = √(μ0×Cox×VD×W/L) × (VG - Vth)
 * - Y와 (VG - Vth)가 선형 관계를 가짐
 * - 기울기 A = √(μ0×Cox×VD×W/L)
 * - 따라서: μ0 = A²L/(Cox×VD×W)
 * 
 * 📊 정확도 기준:
 * - R² > 0.90: 선형성 확보 필수
 * - 데이터 포인트 ≥ 10개: 통계적 신뢰성
 * - VG > Vth + 0.5V: 강한 반전 영역
 */

  // 🔍 R² 계산 함수 (선형성 평가) - 함수 내부에 정의
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

  // 🔒 기본 입력값 검증
  if (!chartData || !gmData || !vth || !deviceParams) {
    return { mu0: 0, quality: 'Poor', error: 'Insufficient input data' };
  }

  const { W, L, tox } = deviceParams;
  const cox = calculateCox(tox);
  
  if (!cox || cox <= 0) {
    return { mu0: 0, quality: 'Poor', error: 'Invalid Cox value' };
  }

  const yData = [];

  // 📊 Y-function 데이터 수집
  for (let i = 0; i < chartData.length; i++) {
    const vgs = chartData[i].VG;
    const id = chartData[i].ID;
    const gmPoint = gmData.find(g => Math.abs(g.VG - vgs) < 0.05);

    // 🎯 데이터 선택 조건 (Y-function의 정확도를 위해 엄격)
    if (gmPoint && 
        vgs > vth + 0.5 &&           // 강한 반전 영역 (Vth + 0.5V 이상)
        id > 1e-12 && 
        gmPoint.gm > 1e-12 &&        // gm이 양수이고 의미있는 값
        isFinite(id) && 
        isFinite(gmPoint.gm) && 
        isFinite(vgs)) {
      
      // 🧮 Y-function 계산: Y = ID / √gm
      const y = id / Math.sqrt(gmPoint.gm);
      const x = vgs - vth;           // 유효 게이트 전압
      
      if (isFinite(y) && isFinite(x) && y > 0) {
        yData.push({ x, y });
      }
    }
  }

  // ⚠️ 데이터 충분성 검증 (Y-function은 선형성이 핵심)
  if (yData.length < 10) {
    return { mu0: 0, quality: 'Poor', error: `Insufficient data points: ${yData.length}` };
  }

  // 📐 선형 회귀 및 R² 계산
  const x = yData.map(d => d.x);
  const y = yData.map(d => d.y);
  const regression = linearRegression(x, y);
  const slope = regression.slope;
  const rSquared = calculateRSquared(x, y, regression); // 내부 함수 호출

  // 🔍 R² 검증 (Y-function은 선형성이 핵심!)
  if (rSquared < 0.90) {
    return { 
      mu0: 0, 
      quality: 'Poor', 
      error: `Poor linearity: R² = ${rSquared.toFixed(3)}`,
      rSquared 
    };
  }

  // 🔒 기울기 검증
  if (slope <= 0 || !isFinite(slope)) {
    return { mu0: 0, quality: 'Poor', error: 'Invalid slope' };
  }

  // 🧮 μ0 계산: μ0 = A²L/(Cox×VD×W)
  // A = slope = √(μ0×Cox×VD×W/L)
  // 따라서: μ0 = A²L/(Cox×VD×W)
  const mu0_raw = (slope * slope * L) / (cox * vds * W);
  const mu0 = mu0_raw * 1e4; // m²/V·s → cm²/V·s 변환

  // ✅ 물리적 타당성 검증
  if (mu0 <= 0 || mu0 > 200) { // TFT 일반적 범위
    return { 
      mu0: 0, 
      quality: 'Poor', 
      error: `Unphysical μ0 value: ${mu0.toFixed(2)} cm²/V·s` 
    };
  }

  // 📊 품질 평가 (R²와 데이터 포인트 수 기반)
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