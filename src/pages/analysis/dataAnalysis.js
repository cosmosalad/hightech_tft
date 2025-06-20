import * as TFTParams from '../parameters/index.js';

// IDVD 분석
export const analyzeIDVD = (headers, dataRows, filename, deviceParams) => {
  const chartData = [];
  const gateVoltages = [];
  
  // 게이트 전압 추출
  for (let i = 0; i < headers.length; i += 5) {
    if (headers[i] && headers[i].includes('DrainI')) {
      const gateVIndex = i + 3;
      if (dataRows.length > 0 && dataRows[0][gateVIndex] !== undefined) {
        gateVoltages.push(dataRows[0][gateVIndex]);
      }
    }
  }

  // 차트 데이터 생성
  const uniqueVDPoints = new Map();
  
  for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
    const row = dataRows[rowIdx];
    const vd = row[1] || 0;
    
    if (!uniqueVDPoints.has(vd)) {
      const dataPoint = { VD: vd };
      
      for (let i = 0; i < gateVoltages.length; i++) {
        const drainIIndex = i * 5;
        if (row[drainIIndex] !== undefined) {
          dataPoint[`VG_${gateVoltages[i]}V`] = Math.abs(row[drainIIndex]) || 1e-12;
        }
      }
      uniqueVDPoints.set(vd, dataPoint);
    }
  }
  
  const chartData_fixed = Array.from(uniqueVDPoints.values()).sort((a, b) => a.VD - b.VD);

  // Ron 계산 (새 모듈 사용)
  const ron = TFTParams.calculateRon(chartData_fixed, gateVoltages);

  return {
    chartData: chartData_fixed,
    gateVoltages,
    parameters: {
      Ron: ron > 0 ? ron.toExponential(2) + ' Ω' : 'N/A'
    }
  };
};

// IDVG Linear 분석
export const analyzeIDVGLinear = (headers, dataRows, filename, deviceParams) => {
  let vgIndex = -1, idIndex = -1, vdIndex = -1, gmIndex = -1, igIndex = -1;

  // 헤더 분석
  headers.forEach((header, idx) => {
    if (header && typeof header === 'string') {
      const headerLower = header.toLowerCase();
      if (headerLower.includes('gatev') || headerLower.includes('vg')) {
        vgIndex = idx;
      }
      if (headerLower.includes('draini') || headerLower.includes('id')) {
        idIndex = idx;
      }
      if (headerLower.includes('drainv') || headerLower.includes('vd')) {
        vdIndex = idx;
      }
      if (headerLower.includes('gatei') || headerLower.includes('ig')) {
        igIndex = idx;
      }
      if (headerLower.includes('gm') || headerLower.includes('transconductance')) {
        gmIndex = idx;
      }
    }
  });

  // 기본값 설정
  if (vgIndex === -1) vgIndex = 3;
  if (idIndex === -1) idIndex = 0;
  if (vdIndex === -1) vdIndex = 1;

  const vdsLinear = dataRows.length > 0 ? Math.abs(dataRows[0][vdIndex] || 0.1) : 0.1;

  // 차트 데이터 생성
  const uniqueVGPoints = new Map();

  for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
    const row = dataRows[rowIdx];
    const vg = row[vgIndex] || 0;
    const id = Math.abs(row[idIndex]) || 1e-12;
    const ig = igIndex !== -1 ? Math.abs(row[igIndex]) || 1e-12 : 1e-12; // 🆕 IG 데이터 추가
    const gm_measured = gmIndex !== -1 ? Math.abs(row[gmIndex]) || 0 : null;
    
    if (!isNaN(vg) && !isNaN(id) && !uniqueVGPoints.has(vg)) {
      uniqueVGPoints.set(vg, {
        VG: vg,
        ID: id,
        IG: ig, // IG 데이터 포함
        VD: Math.abs(row[vdIndex]) || 0,
        sqrtID: Math.sqrt(id),
        logID: Math.log10(id),
        gm_measured: gm_measured
      });
    }
  }
  
  const chartData = Array.from(uniqueVGPoints.values()).sort((a, b) => a.VG - b.VG);

  // 새 모듈들 사용해서 계산
  let gmData = [];
  let useExcelGm = false;

  // Excel에 gm 데이터가 있는지 확인
  if (gmIndex !== -1 && chartData.some(d => d.gm_measured && d.gm_measured > 0)) {
    useExcelGm = true;
    chartData.forEach((point, i) => {
      if (point.gm_measured && point.gm_measured > 0) {
        gmData.push({ VG: point.VG, gm: point.gm_measured });
      }
    });
  } else {
    // 수치 계산으로 gm 구하기
    gmData = TFTParams.calculateGm(chartData);
  }

  // 각 파라미터 계산
  const gmMax = TFTParams.calculateGmMax(gmData);
  const vth = TFTParams.calculateVth(chartData, gmData);
  const ss = TFTParams.calculateSS(chartData);
  const dit = TFTParams.calculateDit(ss, deviceParams);
  const muFE = TFTParams.calculateMuFE(gmMax.value, deviceParams, vdsLinear);
  const { ion, ioff, ratio } = TFTParams.calculateOnOffRatio(chartData);

  return {
    chartData,
    gmData,
    measuredVDS: vdsLinear,
    parameters: {
      'VDS (측정값)': vdsLinear.toFixed(2) + ' V',
      Ion: ion.toExponential(2) + ' A',
      Ioff: ioff.toExponential(2) + ' A',
      'Ion/Ioff': ratio.toExponential(2),
      'gm_max': gmMax.value.toExponential(2) + ' S',
      μFE: muFE > 0 ? muFE.toExponential(2) + ' cm²/V·s' : 'N/A (파라미터 입력 필요)',
      Vth: vth.toFixed(2) + ' V',
      SS: ss.toFixed(3) + ' mV/decade',
      Dit: dit > 0 ? dit.toExponential(2) + ' cm⁻²eV⁻¹' : 'N/A (파라미터 입력 필요)'
    }
  };
};

// IDVG Saturation 분석
export const analyzeIDVGSaturation = (headers, dataRows, filename, deviceParams) => {
  let vgIndex = -1, idIndex = -1, vdIndex = -1, gmIndex = -1, igIndex = -1;
  
  // 헤더 분석 (Linear와 동일)
  headers.forEach((header, idx) => {
    if (header && typeof header === 'string') {
      const headerLower = header.toLowerCase();
      if (headerLower.includes('gatev') || headerLower.includes('vg')) {
        vgIndex = idx;
      }
      if (headerLower.includes('draini') || headerLower.includes('id')) {
        idIndex = idx;
      }
      if (headerLower.includes('drainv') || headerLower.includes('vd')) {
        vdIndex = idx;
      }
      if (headerLower.includes('gm') || headerLower.includes('transconductance')) {
        gmIndex = idx;
      }
    }
  });

  if (vgIndex === -1) vgIndex = 3;
  if (idIndex === -1) idIndex = 0;
  if (vdIndex === -1) vdIndex = 1;

  const vdsSat = dataRows.length > 0 ? Math.abs(dataRows[0][vdIndex] || 20) : 20;

  // 차트 데이터 생성
  const uniqueVGPoints = new Map();

  for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
    const row = dataRows[rowIdx];
    const vg = row[vgIndex] || 0;
    const id = Math.abs(row[idIndex]) || 1e-12;
    const ig = igIndex !== -1 ? Math.abs(row[igIndex]) || 1e-12 : 1e-12; // 🆕 IG 데이터 추가
    const gm_measured = gmIndex !== -1 ? Math.abs(row[gmIndex]) || 0 : null;
    
    if (!isNaN(vg) && !isNaN(id) && !uniqueVGPoints.has(vg)) {
      uniqueVGPoints.set(vg, {
        VG: vg,
        ID: id,
        IG: ig, // IG 데이터 포함
        VD: Math.abs(row[vdIndex]) || 0,
        sqrtID: Math.sqrt(id),
        logID: Math.log10(id),
        gm_measured: gm_measured
      });
    }
  }
  
  const chartData = Array.from(uniqueVGPoints.values()).sort((a, b) => a.VG - b.VG);

  // gm 데이터 처리
  let gmData = [];
  let useExcelGm = false;

  if (gmIndex !== -1 && chartData.some(d => d.gm_measured && d.gm_measured > 0)) {
    useExcelGm = true;
    chartData.forEach((point, i) => {
      if (point.gm_measured && point.gm_measured > 0) {
        gmData.push({ VG: point.VG, gm: point.gm_measured });
      }
    });
  } else {
    gmData = TFTParams.calculateGmSat(chartData);
  }

  // 파라미터 계산
  const gmMax = TFTParams.calculateGmMax(gmData);
  const idSat = TFTParams.calculateIDSat(chartData, deviceParams);

  return {
    chartData,
    gmData,
    measuredVDS: vdsSat,
    parameters: {
      'VDS (측정값)': vdsSat.toFixed(1) + ' V',
      ID_sat: idSat.toExponential(2) + ' A/mm',
      gm_max: (gmMax.value * 1e6).toFixed(0) + ' µS',
    }
  };
};

// IDVG Hysteresis 분석
export const analyzeIDVGHysteresis = (headers, dataRows, filename, deviceParams) => {
  let vgIndex = -1, idIndex = -1, igIndex = -1;
  
  headers.forEach((header, idx) => {
    if (header && typeof header === 'string') {
      const headerLower = header.toLowerCase();
      if (headerLower.includes('gatev') || headerLower.includes('vg')) {
        vgIndex = idx;
      }
      if (headerLower.includes('draini') || headerLower.includes('id')) {
        idIndex = idx;
      }
      if (headerLower.includes('gatei') || headerLower.includes('ig')) {
        igIndex = idx;
      }
    }
  });

  if (vgIndex === -1) vgIndex = 3;
  if (idIndex === -1) idIndex = 0;

  // Forward/Backward 데이터 분리
  const vgValues = dataRows.map(row => row[vgIndex] || 0);
  let maxVgIndex = 0;
  for (let i = 1; i < vgValues.length; i++) {
    if (vgValues[i] > vgValues[maxVgIndex]) {
      maxVgIndex = i;
    }
  }
  
  // Forward 데이터
  const forwardVGMap = new Map();
  for (let i = 0; i <= maxVgIndex; i++) {
    const vg = dataRows[i][vgIndex] || 0;
    const id = Math.abs(dataRows[i][idIndex]) || 1e-12;
    const ig = igIndex !== -1 ? Math.abs(dataRows[i][igIndex]) || 1e-12 : 1e-12; // 🆕
    if (!forwardVGMap.has(vg)) {
      forwardVGMap.set(vg, {
        VG: vg,
        ID: id,
        IG: ig,
        sqrtID: Math.sqrt(id),
        logID: Math.log10(id)
      });
    }
  }
  const forwardData = Array.from(forwardVGMap.values()).sort((a, b) => a.VG - b.VG);
  
  // Backward 데이터
  const backwardVGMap = new Map();
  for (let i = maxVgIndex; i < dataRows.length; i++) {
    const vg = dataRows[i][vgIndex] || 0;
    const id = Math.abs(dataRows[i][idIndex]) || 1e-12;
    const ig = igIndex !== -1 ? Math.abs(dataRows[i][igIndex]) || 1e-12 : 1e-12;
    if (!backwardVGMap.has(vg)) {
      backwardVGMap.set(vg, {
        VG: vg,
        ID: id,
        IG: ig,
        sqrtID: Math.sqrt(id),
        logID: Math.log10(id)
      });
    }
  }
  const backwardData = Array.from(backwardVGMap.values()).sort((a, b) => b.VG - a.VG);

  // Hysteresis 계산 (새 모듈 사용)
  const { deltaVth, vthForward, vthBackward } = TFTParams.calculateDeltaVth(forwardData, backwardData);

  // 안정성 평가
  let stability = 'Excellent';
  if (deltaVth < 0.5) {
    stability = 'Excellent';
  } else if (deltaVth < 1.0) {
    stability = 'Good';
  } else if (deltaVth < 2.0) {
    stability = 'Fair';
  } else if (deltaVth < 3.0) {
    stability = 'Poor';
  } else {
    stability = 'Very Poor';
  }

  return {
    forwardData,
    backwardData,
    parameters: {
      'Hysteresis (ΔVth)': deltaVth.toFixed(3) + ' V',
      'Forward_Vth': vthForward.toFixed(2) + ' V',
      'Backward_Vth': vthBackward.toFixed(2) + ' V',
      'Stability': stability
    }
  };
};

export const calculateIonIoff = TFTParams.calculateOnOffRatio;
export const calculateRon = TFTParams.calculateRon;
export const calculateHysteresis = TFTParams.calculateDeltaVth;