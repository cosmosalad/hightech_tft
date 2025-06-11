import { 
  calculateCox, 
  calculateLinearRegression, 
  calculateMuFE,
  calculateSubthresholdSwing,
  calculateThresholdVoltage,
  calculateDit,
  calculateGm,
  calculateTheta,
  calculateMuEff
} from './calculationUtils';

// 🔥 중앙화된 상수 import
import { PHYSICAL_CONSTANTS } from '../utils/constants';

// IDVD 분석 (PDF 기준)
export const analyzeIDVD = (headers, dataRows, filename, deviceParams) => {
  const chartData = [];
  const gateVoltages = [];
  
  // 헤더에서 Gate Voltage 추출
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

  // 🔥 PDF 기준 Ron 계산: Ron = (dVD/dID)^(-1)
  let ron = 0;
  if (chartData_fixed.length > 2 && gateVoltages.length > 0) {
    // 가장 높은 VG에서 초반 선형 영역의 기울기
    const highestVG = gateVoltages[gateVoltages.length - 1];
    const dataKey = `VG_${highestVG}V`;
    
    // 초반 3-5개 점에서 선형 회귀
    const linearPoints = chartData_fixed.slice(1, 6); // 0V 제외하고 처음 5개점
    
    if (linearPoints.length >= 3) {
      const vd_values = linearPoints.map(p => p.VD);
      const id_values = linearPoints.map(p => p[dataKey] || 1e-12);
      
      const regression = calculateLinearRegression(vd_values, id_values);
      
      // Ron = 1/slope (기울기의 역수)
      if (regression.slope > 0) {
        ron = 1 / regression.slope;
      }
    }
  }

  return {
    chartData: chartData_fixed,
    gateVoltages,
    parameters: {
      Ron: ron > 0 ? ron.toExponential(2) + ' Ω' : 'N/A'
    }
  };
};

// IDVG Linear 분석 (PDF 기준)
export const analyzeIDVGLinear = (headers, dataRows, filename, deviceParams) => {
  let vgIndex = -1, idIndex = -1, vdIndex = -1, gmIndex = -1;

  // 헤더 인덱스 찾기
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

  // 기본값 설정
  if (vgIndex === -1) vgIndex = 3;
  if (idIndex === -1) idIndex = 0;
  if (vdIndex === -1) vdIndex = 1;

  const vdsLinear = dataRows.length > 0 ? Math.abs(dataRows[0][vdIndex] || 0.1) : 0.1;

  // 데이터 정리
  const uniqueVGPoints = new Map();
  
  for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
    const row = dataRows[rowIdx];
    const vg = row[vgIndex] || 0;
    const id = Math.abs(row[idIndex]) || 1e-12;
    const gm_measured = gmIndex !== -1 ? Math.abs(row[gmIndex]) || 0 : null;
    
    if (!isNaN(vg) && !isNaN(id) && !uniqueVGPoints.has(vg)) {
      uniqueVGPoints.set(vg, {
        VG: vg,
        ID: id,
        VD: Math.abs(row[vdIndex]) || 0,
        sqrtID: Math.sqrt(id),
        logID: Math.log10(id),
        gm_measured: gm_measured
      });
    }
  }
  
  const chartData = Array.from(uniqueVGPoints.values()).sort((a, b) => a.VG - b.VG);

  // gm 계산 - 엑셀에 있으면 사용, 없으면 수치 미분
  let gmData = [];
  let maxGm = 0;
  let useExcelGm = false;

  if (gmIndex !== -1 && chartData.some(d => d.gm_measured && d.gm_measured > 0)) {
    // 엑셀의 gm 값 사용
    useExcelGm = true;
    chartData.forEach((point, i) => {
      if (point.gm_measured && point.gm_measured > 0) {
        const roundedVG = Math.round(point.VG * 10) / 10;
        gmData.push({ VG: roundedVG, gm: point.gm_measured });
        if (point.gm_measured > maxGm) {
          maxGm = point.gm_measured;
        }
      }
    });
  } else {
    // 수치 미분으로 gm 계산: gm = ΔID / ΔVG
    gmData = calculateGm(chartData);
    maxGm = gmData.length > 0 ? Math.max(...gmData.map(d => d.gm)) : 0;
  }

  // 🔥 PDF 기준 Ion, Ioff 계산
  // Ion: 최대 ID값 (가장 높은 VG에서)
  const ion = Math.max(...chartData.map(d => d.ID));
  
  // Ioff: 최소 ID값 (가장 낮은 VG에서)
  const minCurrents = chartData.filter(d => d.ID > 0).map(d => d.ID);
  const ioff = minCurrents.length > 0 ? Math.min(...minCurrents) : 1e-12;
  const ionIoffRatio = ion / (ioff || 1e-12);

  // 🔥 PDF 기준 μFE 계산
  const muFE = calculateMuFE(maxGm, deviceParams, vdsLinear);

  return {
    chartData,
    gmData,
    measuredVDS: vdsLinear,
    parameters: {
      'VDS (측정값)': vdsLinear.toFixed(2) + ' V',
      Ion: ion.toExponential(2) + ' A',
      Ioff: ioff.toExponential(2) + ' A',
      'Ion/Ioff': ionIoffRatio.toExponential(2),
      'gm_max': maxGm.toExponential(2) + ' S',
      'gm 데이터 출처': useExcelGm ? 'Excel 파일' : '수치 계산',
      μFE: muFE > 0 ? muFE.toExponential(2) + ' cm²/V·s' : 'N/A (파라미터 입력 필요)'
    }
  };
};

// IDVG Saturation 분석 (PDF 기준)
export const analyzeIDVGSaturation = (headers, dataRows, filename, deviceParams) => {
  let vgIndex = -1, idIndex = -1, vdIndex = -1, gmIndex = -1;
  
  // 헤더 인덱스 찾기
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

  // 기본값 설정
  if (vgIndex === -1) vgIndex = 3;
  if (idIndex === -1) idIndex = 0;
  if (vdIndex === -1) vdIndex = 1;

  const vdsSat = dataRows.length > 0 ? Math.abs(dataRows[0][vdIndex] || 20) : 20;

  // 데이터 정리
  const uniqueVGPoints = new Map();
  
  for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
    const row = dataRows[rowIdx];
    const vg = row[vgIndex] || 0;
    const id = Math.abs(row[idIndex]) || 1e-12;
    const gm_measured = gmIndex !== -1 ? Math.abs(row[gmIndex]) || 0 : null;
    
    if (!isNaN(vg) && !isNaN(id) && !uniqueVGPoints.has(vg)) {
      uniqueVGPoints.set(vg, {
        VG: vg,
        ID: id,
        VD: Math.abs(row[vdIndex]) || 0,
        sqrtID: Math.sqrt(id),
        logID: Math.log10(id),
        gm_measured: gm_measured
      });
    }
  }
  
  const chartData = Array.from(uniqueVGPoints.values()).sort((a, b) => a.VG - b.VG);

  // gm 계산
  let gmData = [];
  let maxGm = 0;
  let useExcelGm = false;

  if (gmIndex !== -1 && chartData.some(d => d.gm_measured && d.gm_measured > 0)) {
    // 엑셀의 gm 값 사용
    useExcelGm = true;
    chartData.forEach((point, i) => {
      if (point.gm_measured && point.gm_measured > 0) {
        const roundedVG = Math.round(point.VG * 10) / 10;
        gmData.push({ VG: roundedVG, gm: point.gm_measured });
        if (point.gm_measured > maxGm) {
          maxGm = point.gm_measured;
        }
      }
    });
  } else {
    // 수치 미분으로 gm 계산
    gmData = calculateGm(chartData);
    maxGm = gmData.length > 0 ? Math.max(...gmData.map(d => d.gm)) : 0;
  }

  // 🔥 PDF 기준 Threshold voltage 계산 (gm_max 기준 선형 외삽법)
  const vth = calculateThresholdVoltage(chartData, gmData);

  // 🔥 PDF 기준 Subthreshold Swing 계산
  const ss = calculateSubthresholdSwing(chartData);

  // 🔥 PDF 기준 Interface trap density 계산
  const dit = calculateDit(ss, deviceParams);

  // ID_sat: 포화 영역의 최대 전류
  const idSat = Math.max(...chartData.map(d => d.ID));

  return {
    chartData,
    gmData,
    measuredVDS: vdsSat,
    parameters: {
      'VDS (측정값)': vdsSat.toFixed(1) + ' V',
      Vth: vth.toFixed(2) + ' V',
      SS: ss.toFixed(3) + ' V/decade',
      Dit: dit > 0 ? dit.toExponential(2) + ' cm⁻²eV⁻¹' : 'N/A (파라미터 입력 필요)',
      ID_sat: idSat.toExponential(2) + ' A',
      gm_max: Math.round(maxGm * 1e6) + ' µS',
      'gm 데이터 출처': useExcelGm ? 'Excel 파일' : '수치 계산'
    }
  };
};

// IDVG Hysteresis 분석 (PDF 기준)
export const analyzeIDVGHysteresis = (headers, dataRows, filename, deviceParams) => {
  let vgIndex = -1, idIndex = -1;
  
  // 헤더 인덱스 찾기
  headers.forEach((header, idx) => {
    if (header && typeof header === 'string') {
      const headerLower = header.toLowerCase();
      if (headerLower.includes('gatev') || headerLower.includes('vg')) {
        vgIndex = idx;
      }
      if (headerLower.includes('draini') || headerLower.includes('id')) {
        idIndex = idx;
      }
    }
  });

  // 기본값 설정
  if (vgIndex === -1) vgIndex = 3;
  if (idIndex === -1) idIndex = 0;

  let forwardData = [];
  let backwardData = [];
  
  // Forward/Backward 구분
  const vgValues = dataRows.map(row => row[vgIndex] || 0);
  let maxVgIndex = 0;
  for (let i = 1; i < vgValues.length; i++) {
    if (vgValues[i] > vgValues[maxVgIndex]) {
      maxVgIndex = i;
    }
  }
  
  // Forward sweep (음에서 양으로)
  const forwardVGMap = new Map();
  for (let i = 0; i <= maxVgIndex; i++) {
    const vg = dataRows[i][vgIndex] || 0;
    const id = Math.abs(dataRows[i][idIndex]) || 1e-12;
    if (!forwardVGMap.has(vg)) {
      forwardVGMap.set(vg, {
        VG: vg,
        ID: id,
        sqrtID: Math.sqrt(id),
        logID: Math.log10(id)
      });
    }
  }
  forwardData = Array.from(forwardVGMap.values()).sort((a, b) => a.VG - b.VG);
  
  // Backward sweep (양에서 음으로)
  const backwardVGMap = new Map();
  for (let i = maxVgIndex; i < dataRows.length; i++) {
    const vg = dataRows[i][vgIndex] || 0;
    const id = Math.abs(dataRows[i][idIndex]) || 1e-12;
    if (!backwardVGMap.has(vg)) {
      backwardVGMap.set(vg, {
        VG: vg,
        ID: id,
        sqrtID: Math.sqrt(id),
        logID: Math.log10(id)
      });
    }
  }
  backwardData = Array.from(backwardVGMap.values()).sort((a, b) => b.VG - a.VG);

  // 🔥 PDF 기준 Forward Vth 계산 (선형 외삽법)
  let vthForward = 0;
  if (forwardData.length > 10) {
    // 중간 영역에서 √ID vs VG 선형 회귀
    const midStart = Math.floor(forwardData.length * 0.3);
    const midEnd = Math.floor(forwardData.length * 0.7);
    const x = forwardData.slice(midStart, midEnd).map(d => d.VG);
    const y = forwardData.slice(midStart, midEnd).map(d => d.sqrtID);
    const regression = calculateLinearRegression(x, y);
    if (regression.slope !== 0) {
      // √ID = 0일 때의 VG 값이 Vth
      vthForward = -regression.intercept / regression.slope;
    }
  }

  // 🔥 PDF 기준 Backward Vth 계산 (선형 외삽법)
  let vthBackward = 0;
  if (backwardData.length > 10) {
    // 중간 영역에서 √ID vs VG 선형 회귀
    const midStart = Math.floor(backwardData.length * 0.3);
    const midEnd = Math.floor(backwardData.length * 0.7);
    const x = backwardData.slice(midStart, midEnd).map(d => d.VG);
    const y = backwardData.slice(midStart, midEnd).map(d => d.sqrtID);
    const regression = calculateLinearRegression(x, y);
    if (regression.slope !== 0) {
      vthBackward = -regression.intercept / regression.slope;
    }
  }

  // 🔥 PDF 수식: ΔVth = |Vth_forward - Vth_backward|
  const deltaVth = Math.abs(vthForward - vthBackward);

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