import * as XLSX from 'xlsx';
import { 
 analyzeIDVD, 
 analyzeIDVGLinear, 
 analyzeIDVGSaturation, 
 analyzeIDVGHysteresis 
} from './dataAnalysis';
import { 
 calculateMu0UsingYFunction,  // 🔄 SYNC: Y-function 계산 (동적 추출됨)
 calculateLinearRegression,   // 🔄 SYNC: 선형회귀 계산 (동적 추출됨)
 calculateCox,               // 🔄 SYNC: Cox 계산 (동적 추출됨)
 calculateTheta,             // 🔄 SYNC: θ 계산 (동적 추출됨)
 calculateMuEff              // 🔄 SYNC: μeff 계산 (동적 추출됨)
} from './calculationUtils';

// 🔄 SYNC: 물리 상수들 (동적 추출됨)
import { PHYSICAL_CONSTANTS, TFT_CONSTANTS } from '../utils/constants';

export const analyzeFiles = async (files, deviceParams) => {
 const results = {};
 
 for (const fileInfo of files) {
   try {
     const arrayBuffer = await fileInfo.file.arrayBuffer();
     const workbook = XLSX.read(arrayBuffer);
     const worksheet = workbook.Sheets[workbook.SheetNames[0]];
     const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
     
     const analysisResult = performAnalysis(jsonData, fileInfo.type, fileInfo.name, deviceParams);
     
     if (!results[fileInfo.type]) {
       results[fileInfo.type] = [];
     }
     
     results[fileInfo.type].push({
       ...analysisResult,
       filename: fileInfo.name,
       alias: fileInfo.alias || fileInfo.name,
       displayName: fileInfo.alias || fileInfo.name.replace(/\.[^/.]+$/, ""),
       rawData: jsonData
     });
   } catch (error) {
     console.error(`${fileInfo.name} 파일 분석 실패:`, error);
   }
 }
 
 return results;
};

const performAnalysis = (data, type, filename, deviceParams) => {
 const headers = data[0];
 const dataRows = data.slice(1).filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));
 
 switch (type) {
   case 'IDVD':
     return analyzeIDVD(headers, dataRows, filename, deviceParams);        // 🔄 SYNC: IDVD 분석 (동적 추출됨)
   case 'IDVG-Linear':
     return analyzeIDVGLinear(headers, dataRows, filename, deviceParams);  // 🔄 SYNC: Linear 분석 (동적 추출됨)
   case 'IDVG-Saturation':
     return analyzeIDVGSaturation(headers, dataRows, filename, deviceParams); // 🔄 SYNC: Saturation 분석 (동적 추출됨)
   case 'IDVG-Hysteresis':
     return analyzeIDVGHysteresis(headers, dataRows, filename, deviceParams); // 🔄 SYNC: Hysteresis 분석 (동적 추출됨)
   default:
     return { error: 'Unknown file type' };
 }
};

export const performCompleteAnalysis = (analysisResults, deviceParams) => {
 const sampleGroups = {};
 
 Object.entries(analysisResults).forEach(([type, resultArray]) => {
   resultArray.forEach(result => {
     const sampleName = result.displayName;
     if (!sampleGroups[sampleName]) {
       sampleGroups[sampleName] = {};
     }
     sampleGroups[sampleName][type] = result;
   });
 });

 const completeResults = {};
 
 Object.entries(sampleGroups).forEach(([sampleName, sampleData]) => {
   completeResults[sampleName] = performSampleCompleteAnalysis(sampleName, sampleData, deviceParams);
 });

 return completeResults;
};

const performSampleCompleteAnalysis = (sampleName, sampleData, deviceParams) => {
 const results = {
   sampleName,
   hasLinear: !!sampleData['IDVG-Linear'],
   hasSaturation: !!sampleData['IDVG-Saturation'],
   hasIDVD: !!sampleData['IDVD'],
   hasHysteresis: !!sampleData['IDVG-Hysteresis'],
   parameters: {},
   warnings: []
 };

 try {
   // 🔥 변경: Linear에서 정확한 Vth, SS, Dit 추출
   let vth_lin = 0, ss = 0, dit = 0, gm_max_lin = 0;
   if (sampleData['IDVG-Linear']) {
     const linParams = sampleData['IDVG-Linear'].parameters;
     // Linear에서 Vth 추출 (기존 Linear 분석에 추가 필요)
     const linData = sampleData['IDVG-Linear'];
     
     // Linear 데이터에서 Vth 계산
     if (linData.gmData && linData.gmData.length > 0) {
       vth_lin = calculateVthFromLinear(linData.chartData, linData.gmData);
     }
     
     // Linear 데이터에서 SS 계산
     ss = calculateSSFromLinear(linData.chartData);
     
     // Linear 데이터에서 Dit 계산
     dit = calculateDitFromLinear(ss, deviceParams);
     
     gm_max_lin = calculateGmMaxFromLinear(linData);
   } else {
     results.warnings.push('Linear 데이터 없음 - Vth, SS, Dit, gm_max 계산 불가');
   }

   // Saturation에서는 ID_sat만 추출 (기존 역할 축소)
   let id_sat_raw = 0, gm_max_sat = 0;
   if (sampleData['IDVG-Saturation']) {
     const satParams = sampleData['IDVG-Saturation'].parameters;
     id_sat_raw = parseFloat(satParams.ID_sat?.split(' ')[0]) || 0;
     gm_max_sat = parseFloat(satParams.gm_max?.split(' ')[0]) || 0;
     if (satParams.gm_max?.includes('µS')) {
       gm_max_sat = gm_max_sat * 1e-6;
     }
   }

   // Linear에서 VDS, Ion/Ioff 추출
   let vds_linear = 0, ion = 0, ioff = 0, ion_ioff_ratio = 0;
   if (sampleData['IDVG-Linear']) {
     const linParams = sampleData['IDVG-Linear'].parameters;
     vds_linear = parseFloat(linParams['VDS (측정값)']?.split(' ')[0]) || 0.1;
     ion = parseFloat(linParams.Ion?.split(' ')[0]) || 0;
     ioff = parseFloat(linParams.Ioff?.split(' ')[0]) || 0;
     ion_ioff_ratio = parseFloat(linParams['Ion/Ioff']?.split(' ')[0]) || 0;
   }

   // IDVD에서 Ron 추출
   let ron = 0;
   if (sampleData['IDVD']) {
     const idvdParams = sampleData['IDVD'].parameters;
     ron = parseFloat(idvdParams.Ron?.split(' ')[0]) || 0;
   } else {
     results.warnings.push('IDVD 데이터 없음 - Ron 계산 불가');
   }

   // Hysteresis에서 ΔVth 추출
   let delta_vth = 0, stability = 'N/A';
   if (sampleData['IDVG-Hysteresis']) {
     const hysParams = sampleData['IDVG-Hysteresis'].parameters;
     delta_vth = parseFloat(hysParams['Hysteresis (ΔVth)']?.split(' ')[0]) || 0;
     stability = hysParams.Stability || 'N/A';
   } else {
     results.warnings.push('Hysteresis 데이터 없음 - 안정성 평가 불가');
   }

   // 🔄 SYNC: μFE 계산 (Linear 기준으로 수정)
   let muFE = 0;
   const finalGmMax = gm_max_lin > 0 ? gm_max_lin : gm_max_sat;
   
   if (finalGmMax > 0 && deviceParams.W > 0 && deviceParams.L > 0 && vds_linear > 0) {
     const cox = calculateCox(deviceParams.tox);  // 🔄 SYNC: Cox 계산 함수
     muFE = (deviceParams.L / (deviceParams.W * cox * vds_linear)) * finalGmMax;
     muFE = muFE * 1e4;
   } else {
     results.warnings.push('μFE 계산 불가 - 파라미터 또는 gm 데이터 부족');
   }

   // 🔄 SYNC: Y-function method로 정확한 μ0 계산 (Linear Vth 사용)
   let mu0 = 0, mu0CalculationInfo = '', yFunctionQuality = 'N/A';

   if (sampleData['IDVG-Linear']) {
     const yFunctionResult = calculateMu0UsingYFunction(sampleData['IDVG-Linear'], deviceParams, vth_lin); // 🔥 변경: vth_lin 사용
     
     if (yFunctionResult.mu0 > 0 && yFunctionResult.quality !== 'Poor') {
       mu0 = yFunctionResult.mu0;
       mu0CalculationInfo = `Y-function method (R²=${yFunctionResult.r_squared.toFixed(3)})`;
       yFunctionQuality = yFunctionResult.quality;
     } else {
       if (muFE > 0) {
         const correctionFactor = vds_linear < 0.2 ? 1.3 : 1.2;
         mu0 = muFE * correctionFactor;
         mu0CalculationInfo = 'Fallback method (Y-function 실패)';
         yFunctionQuality = 'Failed';
         results.warnings.push(`Y-function 계산 실패: ${yFunctionResult.error || '품질 불량'}`);
       } else {
         mu0CalculationInfo = 'N/A (데이터 부족)';
         results.warnings.push('μ0 계산 불가 - Linear 또는 μFE 데이터 부족');
       }
     }
   } else {
     mu0CalculationInfo = 'N/A (Linear 데이터 없음)';
     results.warnings.push('Linear 데이터 없음 - Y-function 계산 불가');
   }

   // 🔄 SYNC: 정확한 θ (theta) 계산 (Linear Vth 사용)
   let muEff = 0, theta = 0, vg_for_theta = 0, thetaCalculationInfo = '';

   if (mu0 > 0 && vth_lin !== 0 && sampleData['IDVG-Linear']) {
     const linearData = sampleData['IDVG-Linear'];
     
     const thetaResult = calculateTheta(  // 🔄 SYNC: θ 계산 함수
       mu0, 
       deviceParams, 
       linearData.chartData, 
       linearData.gmData, 
       vth_lin,  // 🔥 변경: vth_lin 사용
       vds_linear
     );
     
     theta = thetaResult.theta;
     thetaCalculationInfo = thetaResult.method;
     
     if (thetaResult.dataPoints) {
       thetaCalculationInfo += ` (${thetaResult.dataPoints}개 점)`;
     }
     
     if (linearData.gmData && linearData.gmData.length > 0) {
       const maxGmPoint = linearData.gmData.reduce((max, current) => 
         current.gm > max.gm ? current : max
       );
       vg_for_theta = maxGmPoint.VG;
     } else {
       vg_for_theta = vth_lin + 5;
     }
     
     muEff = calculateMuEff(mu0, theta, vg_for_theta, vth_lin);  // 🔥 변경: vth_lin 사용
     
     if (muFE > 0 && muEff > 0) {
       const relativeDiff = Math.abs(muEff - muFE) / muFE;
       if (relativeDiff < 0.01) {
         muEff = 0;
         thetaCalculationInfo += ' (μeff≈μFE)';
         results.warnings.push('μeff ≈ μFE: 이동도 감소 효과 미미');
       } else if (muEff > muFE * 1.05) {
         muEff = muFE * 0.95;
         thetaCalculationInfo += ' (물리적 보정)';
         results.warnings.push('μeff > μFE 발생, 물리적 범위로 보정');
       }
     }
   } else {
     theta = 0.1;
     thetaCalculationInfo = '기본값 (데이터 부족)';
     results.warnings.push('θ 계산 불가 - 데이터 부족으로 기본값 사용');
   }

   // ID_sat 계산
   let id_sat_normalized = 0;
   if (id_sat_raw > 0 && deviceParams.W) {
     const W_mm = deviceParams.W * 1000;
     id_sat_normalized = id_sat_raw / W_mm;
   }

   results.parameters = {
     'Vth (Linear 기준)': vth_lin !== 0 ? `${vth_lin.toFixed(2)} V` : 'N/A',  // 🔥 변경: Linear 기준으로 표시
     'gm_max (Linear 기준)': finalGmMax > 0 ? `${finalGmMax.toExponential(2)} S` : 'N/A',
     'μFE (통합 계산)': muFE > 0 ? `${muFE.toExponential(2)} cm²/V·s` : 'N/A',
     'μ0 (Y-function)': mu0 > 0 ? `${mu0.toExponential(2)} cm²/V·s` : 'N/A',
     'μ0 계산 방법': mu0CalculationInfo,
     'Y-function 품질': yFunctionQuality,
     'μeff (정확 계산)': muEff > 0 ? `${muEff.toExponential(2)} cm²/V·s` : '측정불가',
     'θ (계산값)': theta > 0 ? `${theta.toExponential(2)} V⁻¹` : 'N/A',
     'θ 계산 방법': thetaCalculationInfo,
     'VG@gm_max': vg_for_theta > 0 ? `${vg_for_theta.toFixed(1)} V` : 'N/A',
     'SS (Linear 기준)': ss > 0 ? `${ss.toFixed(3)} V/decade` : 'N/A',  // 🔥 변경: Linear 기준으로 표시
     'Dit (Linear 기준)': dit > 0 ? `${dit.toExponential(2)} cm⁻²eV⁻¹` : 'N/A',  // 🔥 변경: Linear 기준으로 표시
     'Ron': ron > 0 ? `${ron.toExponential(2)} Ω` : 'N/A',
     'Ion': ion > 0 ? `${ion.toExponential(2)} A` : 'N/A',
     'Ioff': ioff > 0 ? `${ioff.toExponential(2)} A` : 'N/A',
     'Ion/Ioff': ion_ioff_ratio > 0 ? `${ion_ioff_ratio.toExponential(2)}` : 'N/A',
     'ΔVth (Hysteresis)': delta_vth > 0 ? `${delta_vth.toFixed(3)} V` : 'N/A',
     'Stability': stability,
     'ID_sat (A/mm)': id_sat_normalized > 0 ? `${id_sat_normalized.toExponential(2)} A/mm` : 'N/A',
     'VDS (Linear)': vds_linear > 0 ? `${vds_linear.toFixed(2)} V` : 'N/A',
     'Data Sources': `${Object.keys(sampleData).join(', ')}`
   };

   results.quality = evaluateDataQuality(results.parameters, results.warnings);

 } catch (error) {
   console.error(`${sampleName} 완전 분석 실패:`, error);
   results.warnings.push(`분석 중 오류 발생: ${error.message}`);
 }

 return results;
};

// 🔥 수정: Linear 데이터에서 Vth 계산 함수 (Linear Extrapolation Method)
export const calculateVthFromLinear = (chartData, gmData) => {
 if (!gmData || gmData.length === 0) {
   return 0;
 }
 
 // gm_max 지점 찾기
 const maxGmPoint = gmData.reduce((max, current) => 
   current.gm > max.gm ? current : max
 );
 
 const vg_max = maxGmPoint.VG;
 const gm_max = maxGmPoint.gm;
 
 // gm_max 지점에서의 ID 찾기
 const currentPoint = chartData.find(d => Math.abs(d.VG - vg_max) < 0.1);
 if (!currentPoint) {
   return 0;
 }
 
 const id_max = currentPoint.ID;
 
 // 🔥 수정: Linear Extrapolation Method
 // Vth = VG_max - ID_max / gm_max (선형 외삽법)
 const vth = vg_max - (id_max / gm_max);
 
 return vth;
};

// 🔥 추가: Linear 데이터에서 SS 계산 함수
const calculateSSFromLinear = (chartData) => {
 const subthresholdData = chartData.filter(d => {
   const logID = Math.log10(Math.abs(d.ID));
   return logID > -10 && logID < -6;
 });
 
 if (subthresholdData.length < 5) {
   return 0;
 }
 
 const x = subthresholdData.map(d => d.VG);
 const y = subthresholdData.map(d => Math.log10(Math.abs(d.ID)));
 const regression = calculateLinearRegression(x, y);
 
 if (regression.slope === 0) {
   return 0;
 }
 
 // SS = dVG/d(log ID) = 1/slope
 const ss_V_per_decade = 1 / regression.slope;
 
 return Math.abs(ss_V_per_decade);
};

// 🔥 추가: Linear 데이터에서 Dit 계산 함수
const calculateDitFromLinear = (ss, deviceParams) => {
 if (!ss || ss <= 0) return 0;
 
 // Dit = (Cox/q) × (SS/(2.3×kT/q) - 1)
 const kT_q = PHYSICAL_CONSTANTS.THERMAL_VOLTAGE_300K;
 const cox = calculateCox(deviceParams.tox) * 1e-4;
 const q = PHYSICAL_CONSTANTS.ELEMENTARY_CHARGE;
 
 const dit = (cox / q) * (ss / (2.3 * kT_q) - 1);
 
 return Math.max(0, dit);
};

// 🔄 SYNC: Linear 데이터에서 정확한 gm_max 재계산 (동적 추출됨)
export const calculateGmMaxFromLinear = (linearResult) => {
 if (!linearResult.gmData || linearResult.gmData.length === 0) {
   return 0;
 }
 
 const maxGmPoint = linearResult.gmData.reduce((max, current) => 
   current.gm > max.gm ? current : max
 );
 
 return maxGmPoint.gm;
};

const evaluateDataQuality = (params, warnings) => {
 let score = 100;
 let issues = [];

 if (params['Vth (Linear 기준)'] === 'N/A') {
   score -= 20;
   issues.push('Vth 없음');
 }
 if (params['gm_max (Linear 기준)'] === 'N/A') {
   score -= 20;
   issues.push('gm_max 없음');
 }
 if (params['μFE (통합 계산)'] === 'N/A') {
   score -= 15;
   issues.push('μFE 계산 불가');
 }

 if (params['Y-function 품질'] === 'Poor' || params['Y-function 품질'] === 'Failed') {
   score -= 10;
   issues.push('Y-function 품질 불량');
 }

 score -= warnings.length * 3;

 let grade = 'A';
 if (score < 90) grade = 'B';
 if (score < 80) grade = 'C';
 if (score < 70) grade = 'D';
 if (score < 60) grade = 'F';

 return {
   score: Math.max(0, score),
   grade,
   issues
 };
};