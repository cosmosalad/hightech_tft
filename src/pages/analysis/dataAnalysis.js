// 🔄 SYNC: 계산 유틸리티 함수들 import (동적 추출됨)
import { 
 calculateCox,                // 🔄 SYNC: Cox 계산 함수
 calculateLinearRegression,   // 🔄 SYNC: 선형회귀 계산 함수
 calculateMuFE,              // 🔄 SYNC: μFE 계산 함수
 calculateSubthresholdSwing, // 🔄 SYNC: SS 계산 함수
 calculateThresholdVoltage,  // 🔄 SYNC: Vth 계산 함수
 calculateDit,               // 🔄 SYNC: Dit 계산 함수
 calculateGm,                // 🔄 SYNC: gm 계산 함수
 calculateTheta,             // 🔄 SYNC: θ 계산 함수
 calculateMuEff              // 🔄 SYNC: μeff 계산 함수
} from './calculationUtils';

// 🔄 SYNC: 물리 상수 import (동적 추출됨)
import { PHYSICAL_CONSTANTS } from '../utils/constants';

// 🔄 SYNC: IDVD 분석 함수 (동적 추출됨)
export const analyzeIDVD = (headers, dataRows, filename, deviceParams) => {
 const chartData = [];
 const gateVoltages = [];
 
 for (let i = 0; i < headers.length; i += 5) {
   if (headers[i] && headers[i].includes('DrainI')) {
     const gateVIndex = i + 3;
     if (dataRows.length > 0 && dataRows[0][gateVIndex] !== undefined) {
       gateVoltages.push(dataRows[0][gateVIndex]);
     }
   }
 }

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
   const highestVG = gateVoltages[gateVoltages.length - 1];
   const dataKey = `VG_${highestVG}V`;
   
   const linearPoints = chartData_fixed.slice(1, 6);
   
   if (linearPoints.length >= 3) {
     const vd_values = linearPoints.map(p => p.VD);
     const id_values = linearPoints.map(p => p[dataKey] || 1e-12);
     
     const regression = calculateLinearRegression(vd_values, id_values);  // 🔄 SYNC: 선형회귀 호출
     
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

// 🔄 SYNC: IDVG Linear 분석 함수 (동적 추출됨)
export const analyzeIDVGLinear = (headers, dataRows, filename, deviceParams) => {
 let vgIndex = -1, idIndex = -1, vdIndex = -1, gmIndex = -1;

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

 const vdsLinear = dataRows.length > 0 ? Math.abs(dataRows[0][vdIndex] || 0.1) : 0.1;

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

 let gmData = [];
 let maxGm = 0;
 let useExcelGm = false;

 if (gmIndex !== -1 && chartData.some(d => d.gm_measured && d.gm_measured > 0)) {
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
   gmData = calculateGm(chartData);  // 🔄 SYNC: gm 계산 함수 호출
   maxGm = gmData.length > 0 ? Math.max(...gmData.map(d => d.gm)) : 0;
 }

 // 🔥 PDF 기준 Ion, Ioff 계산
 const ion = Math.max(...chartData.map(d => d.ID));
 const minCurrents = chartData.filter(d => d.ID > 0).map(d => d.ID);
 const ioff = minCurrents.length > 0 ? Math.min(...minCurrents) : 1e-12;
 const ionIoffRatio = ion / (ioff || 1e-12);

 const muFE = calculateMuFE(maxGm, deviceParams, vdsLinear);  // 🔄 SYNC: μFE 계산 함수 호출

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

// 🔄 SYNC: IDVG Saturation 분석 함수 (동적 추출됨)
export const analyzeIDVGSaturation = (headers, dataRows, filename, deviceParams) => {
 let vgIndex = -1, idIndex = -1, vdIndex = -1, gmIndex = -1;
 
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

 let gmData = [];
 let maxGm = 0;
 let useExcelGm = false;

 if (gmIndex !== -1 && chartData.some(d => d.gm_measured && d.gm_measured > 0)) {
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
   gmData = calculateGm(chartData);  // 🔄 SYNC: gm 계산 함수 호출
   maxGm = gmData.length > 0 ? Math.max(...gmData.map(d => d.gm)) : 0;
 }

 const vth = calculateThresholdVoltage(chartData, gmData);  // 🔄 SYNC: Vth 계산 함수 호출
 const ss = calculateSubthresholdSwing(chartData);         // 🔄 SYNC: SS 계산 함수 호출
 const dit = calculateDit(ss, deviceParams);              // 🔄 SYNC: Dit 계산 함수 호출

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

// 🔄 SYNC: IDVG Hysteresis 분석 함수 (동적 추출됨)
export const analyzeIDVGHysteresis = (headers, dataRows, filename, deviceParams) => {
 let vgIndex = -1, idIndex = -1;
 
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

 if (vgIndex === -1) vgIndex = 3;
 if (idIndex === -1) idIndex = 0;

 let forwardData = [];
 let backwardData = [];
 
 const vgValues = dataRows.map(row => row[vgIndex] || 0);
 let maxVgIndex = 0;
 for (let i = 1; i < vgValues.length; i++) {
   if (vgValues[i] > vgValues[maxVgIndex]) {
     maxVgIndex = i;
   }
 }
 
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
   const midStart = Math.floor(forwardData.length * 0.3);
   const midEnd = Math.floor(forwardData.length * 0.7);
   const x = forwardData.slice(midStart, midEnd).map(d => d.VG);
   const y = forwardData.slice(midStart, midEnd).map(d => d.sqrtID);
   const regression = calculateLinearRegression(x, y);  // 🔄 SYNC: 선형회귀 호출
   if (regression.slope !== 0) {
     vthForward = -regression.intercept / regression.slope;
   }
 }

 // 🔥 PDF 기준 Backward Vth 계산 (선형 외삽법)
 let vthBackward = 0;
 if (backwardData.length > 10) {
   const midStart = Math.floor(backwardData.length * 0.3);
   const midEnd = Math.floor(backwardData.length * 0.7);
   const x = backwardData.slice(midStart, midEnd).map(d => d.VG);
   const y = backwardData.slice(midStart, midEnd).map(d => d.sqrtID);
   const regression = calculateLinearRegression(x, y);  // 🔄 SYNC: 선형회귀 호출
   if (regression.slope !== 0) {
     vthBackward = -regression.intercept / regression.slope;
   }
 }

 // 🔥 PDF 수식: ΔVth = |Vth_forward - Vth_backward|
 const deltaVth = Math.abs(vthForward - vthBackward);

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