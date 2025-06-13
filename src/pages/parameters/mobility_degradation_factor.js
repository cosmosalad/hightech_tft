import { linearRegression, calculateCox } from './utils.js';

export const calculateTheta = (mu0, deviceParams, chartData, vth, vds) => {
  // 🔒 강화된 입력 검증
  
  // μ0 검증
  if (!mu0 || !isFinite(mu0) || mu0 <= 0) {
    return { theta: 0, method: 'Invalid μ0 value', error: `μ0: ${mu0}` };
  }
  if (mu0 > 200) {
    return { theta: 0, method: 'μ0 too high - check units', error: `μ0: ${mu0} cm²/V·s` };
  }
  
  // Vth 검증
  if (!isFinite(vth)) {
    return { theta: 0, method: 'Invalid Vth value', error: `Vth: ${vth}` };
  }
  if (Math.abs(vth) > 50) {
    return { theta: 0, method: 'Vth too extreme', error: `Vth: ${vth} V` };
  }
  
  // VDS 검증
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
  
  // W 검증
  if (!W || !isFinite(W) || W <= 0) {
    return { theta: 0, method: 'Invalid channel width (W)', error: `W: ${W}` };
  }
  if (W > 0.01) {  // 10mm
    return { theta: 0, method: 'W too large - check units', error: `W: ${W} m (should be μm level)` };
  }
  
  // L 검증
  if (!L || !isFinite(L) || L <= 0) {
    return { theta: 0, method: 'Invalid channel length (L)', error: `L: ${L}` };
  }
  if (L > 0.01) {  // 10mm
    return { theta: 0, method: 'L too large - check units', error: `L: ${L} m (should be μm level)` };
  }
  if (L > W * 1000) {  // L >> W는 비현실적
    return { theta: 0, method: 'L/W ratio unrealistic', error: `W: ${W*1e6}μm, L: ${L*1e6}μm` };
  }
  
  // tox 검증
  if (!tox || !isFinite(tox) || tox <= 0) {
    return { theta: 0, method: 'Invalid oxide thickness (tox)', error: `tox: ${tox}` };
  }
  if (tox > 1e-6) {  // 1μm
    return { theta: 0, method: 'tox too large - check units', error: `tox: ${tox} m (should be nm level)` };
  }
  if (tox < 1e-9) {  // 1nm
    return { theta: 0, method: 'tox too small - unrealistic', error: `tox: ${tox*1e9} nm` };
  }
  
  // chartData 검증
  if (!chartData || !Array.isArray(chartData)) {
    return { theta: 0, method: 'Invalid chart data', error: 'chartData not an array' };
  }
  if (chartData.length === 0) {
    return { theta: 0, method: 'No chart data', error: 'empty chartData array' };
  }
  
  // chartData 구조 검증
  const samplePoint = chartData[0];
  if (!samplePoint || typeof samplePoint !== 'object') {
    return { theta: 0, method: 'Invalid chart data structure', error: 'chart points not objects' };
  }
  if (!('VG' in samplePoint) || !('ID' in samplePoint)) {
    return { theta: 0, method: 'Missing VG or ID in chart data', error: 'required fields: VG, ID' };
  }
  
  // Cox 계산 및 검증
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
  
  for (const point of chartData) {
    totalPoints++;
    
    // 데이터 포인트 검증
    if (!point || typeof point !== 'object') continue;
    
    const vg = point.VG;
    const id = point.ID;
    
    // VG, ID 유효성 검증
    if (!isFinite(vg) || !isFinite(id)) continue;
    
    if (vg > vth + 1.0) {
      validVGPoints++;
      if (id > 1e-12) {
        validCurrentPoints++;
        
        // 계산값 검증
        const xcal = 1 / (vg - vth);                                    
        const ycal = (mu0_SI * W_SI * cox_SI * vds) / (id * L_SI);     
        
        if (isFinite(xcal) && isFinite(ycal) && xcal > 0 && ycal > 0) {
          points.push({ xcal, ycal });
        }
      }
    }
  }
  
  // 데이터 충분성 검증
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
  
  if (validCurrentPoints < 3) {
    return { 
      theta: 0, 
      method: 'Cannot measure - insufficient valid current data', 
      error: `Only ${validCurrentPoints} points with valid current` 
    };
  }
  
  if (points.length < 3) {
    return { 
      theta: 0, 
      method: 'Cannot measure - calculation failed', 
      error: `Only ${points.length} valid calculation points` 
    };
  }
  
  // 선형 회귀 계산
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
  
  const theta = regression.intercept;
  
  // 물리적 타당성 최종 검증
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