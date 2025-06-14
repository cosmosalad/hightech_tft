import { linearRegression, calculateCox } from './utils.js';

export const calculateTheta = (mu0, deviceParams, chartData, vth, vds) => {
/**
 * 📉 θ (Mobility Degradation Factor) 계산 모듈
 * 
 * 📖 물리적 의미:
 * - 게이트 전압이 증가함에 따라 MOSFET 채널 내에서 발생하는 carrier 유효 이동도(μeff) 감소 현상을 정량화하는 계수
 * - 높은 게이트 전압 → 강한 수직 전기장 → 표면 산란 증가 → 이동도 감소
 * - θ가 클수록 이동도 저하가 심함
 * 
 * 📏 측정 데이터: IDVG-Linear
 * - 저전계 조건 (VD < 1V)에서 측정
 * - μ0 (Y-function으로 구한 값) 필요
 * - VG > Vth + 1V 영역의 데이터 사용 (높은 게이트 전압에서 선형성 확인)
 * 
 * 🧮 계산 수식: θ = (μ0×W×Cox×VD)/(ID×L) - 1/(VG-Vth)
 * - 이론적 배경: μeff = μ0 / (1 + θ(VG-Vth))
 * - 변형하면: (μ0×W×Cox×VD)/(ID×L) = θ + 1/(VG-Vth)
 * - Ycal = θ + Xcal 형태로 선형 회귀하여 y절편이 θ
 * 
 * 📊 일반적 범위: 0.001 ~ 2.0 V⁻¹
 */

  // 🔒 강화된 입력 검증
  
  // μ0 검증 (Y-function으로 구한 저전계 이동도)
  if (!mu0 || !isFinite(mu0) || mu0 <= 0) {
    return { theta: 0, method: 'Invalid μ0 value', error: `μ0: ${mu0}` };
  }
  if (mu0 > 200) {
    return { theta: 0, method: 'μ0 too high - check units', error: `μ0: ${mu0} cm²/V·s` };
  }
  
  // Vth 검증 (문턱 전압)
  if (!isFinite(vth)) {
    return { theta: 0, method: 'Invalid Vth value', error: `Vth: ${vth}` };
  }
  if (Math.abs(vth) > 50) {
    return { theta: 0, method: 'Vth too extreme', error: `Vth: ${vth} V` };
  }
  
  // VDS 검증 (저전계 조건 확인)
  if (!vds || !isFinite(vds) || vds <= 0) {
    return { theta: 0, method: 'Invalid VDS value', error: `VDS: ${vds}` };
  }
  if (vds > 1.0) {
    return { theta: 0, method: 'VDS too high for θ calculation', error: `VDS: ${vds} V (should be < 1V)` };
  }
  
  // deviceParams 검증
  if (!deviceParams || typeof deviceParams !== 'object') {
    return { theta: 0, method: 'Invalid device parameters', error: 'deviceParams missing' };
  }
  
  const { W, L, tox } = deviceParams;
  
  // 기하학적 파라미터 검증
  if (!W || !isFinite(W) || W <= 0 || W > 0.01) {  // W > 10mm는 비현실적
    return { theta: 0, method: 'Invalid channel width (W)', error: `W: ${W} m` };
  }
  
  if (!L || !isFinite(L) || L <= 0 || L > 0.01) {  // L > 10mm는 비현실적
    return { theta: 0, method: 'Invalid channel length (L)', error: `L: ${L} m` };
  }
  
  if (!tox || !isFinite(tox) || tox <= 0 || tox > 1e-6 || tox < 1e-9) {
    return { theta: 0, method: 'Invalid oxide thickness (tox)', error: `tox: ${tox*1e9} nm` };
  }
  
  // chartData 검증
  if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
    return { theta: 0, method: 'Invalid chart data', error: 'chartData missing or empty' };
  }
  
  // Cox 계산
  let cox;
  try {
    cox = calculateCox(tox);
    if (!cox || !isFinite(cox) || cox <= 0) {
      return { theta: 0, method: 'Cox calculation failed', error: `Cox: ${cox}` };
    }
  } catch (error) {
    return { theta: 0, method: 'Cox calculation error', error: error.message };
  }
  
  // 🔧 실제 θ 계산 시작
  
  // 단위 통일 (모두 SI 단위로)
  const mu0_SI = mu0 * 1e-4;        // cm²/V·s → m²/V·s
  const W_SI = W;                   // 이미 m 단위
  const L_SI = L;                   // 이미 m 단위
  const cox_SI = cox;               // 이미 F/m² 단위
  
  const points = [];
  let totalPoints = 0;
  let validVGPoints = 0;
  let validCurrentPoints = 0;
  
  // 📊 선형 회귀용 데이터 수집
  for (const point of chartData) {
    totalPoints++;
    
    if (!point || typeof point !== 'object') continue;
    
    const vg = point.VG;
    const id = point.ID;
    
    // VG, ID 유효성 검증
    if (!isFinite(vg) || !isFinite(id)) continue;
    
    // 🎯 높은 VG 영역만 사용 (VG > Vth + 1V)
    // 이 영역에서 θ의 효과가 선형적으로 나타남
    if (vg > vth + 1.0) {
      validVGPoints++;
      if (id > 1e-12) {  // 의미있는 전류 값
        validCurrentPoints++;
        
        // 🧮 선형 회귀용 x, y 계산
        // 수식: (μ0×W×Cox×VD)/(ID×L) = θ + 1/(VG-Vth)
        const xcal = 1 / (vg - vth);                                    // X축: 1/(VG-Vth)
        const ycal = (mu0_SI * W_SI * cox_SI * vds) / (id * L_SI);     // Y축: 이론값
        
        if (isFinite(xcal) && isFinite(ycal) && xcal > 0 && ycal > 0) {
          points.push({ xcal, ycal });
        }
      }
    }
  }
  
  // 📈 데이터 충분성 검증
  if (totalPoints < 10) {
    return { 
      theta: 0, 
      method: 'Insufficient total data', 
      error: `Only ${totalPoints} data points (need > 10)` 
    };
  }
  
  if (validVGPoints < 3) {
    return { 
      theta: 0, 
      method: 'Cannot measure - insufficient high VG data', 
      error: `Only ${validVGPoints} points with VG > ${(vth + 1.0).toFixed(1)}V` 
    };
  }
  
  if (points.length < 3) {
    return { 
      theta: 0, 
      method: 'Cannot measure - calculation failed', 
      error: `Only ${points.length} valid calculation points` 
    };
  }
  
  // 📐 선형 회귀 계산
  const x = points.map(p => p.xcal);
  const y = points.map(p => p.ycal);
  
  let regression;
  try {
    regression = linearRegression(x, y);
    if (!regression || !isFinite(regression.intercept) || !isFinite(regression.slope)) {
      return { theta: 0, method: 'Linear regression failed', error: 'Invalid regression result' };
    }
  } catch (error) {
    return { theta: 0, method: 'Linear regression error', error: error.message };
  }
  
  // 🎯 θ = y절편 (수식: Ycal = θ + Xcal에서 y절편이 θ)
  const theta = regression.intercept;
  
  // ✅ 물리적 타당성 최종 검증
  if (theta <= 0) {
    return { 
      theta: 0, 
      method: 'Cannot measure - negative θ', 
      error: `θ = ${theta.toExponential(3)} (should be > 0)` 
    };
  }
  
  if (theta > 2) {
    return { 
      theta: 0, 
      method: 'Cannot measure - θ too high', 
      error: `θ = ${theta.toExponential(3)} V⁻¹ (should be < 2)` 
    };
  }
  
  // 🎯 성공적인 계산 완료
  return { 
    theta: theta, 
    method: 'Calculated',
    dataPoints: points.length,
    validVGPoints: validVGPoints,
    totalPoints: totalPoints
  };
};