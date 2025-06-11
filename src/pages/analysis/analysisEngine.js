import * as XLSX from 'xlsx';
import { 
  analyzeIDVD, 
  analyzeIDVGLinear, 
  analyzeIDVGSaturation, 
  analyzeIDVGHysteresis 
} from './dataAnalysis';
import { 
  calculateMu0UsingYFunction,
  calculateLinearRegression,
  calculateCox,
  calculateTheta,
  calculateMuEff
} from './calculationUtils';

// 🔥 중앙화된 상수 import
import { PHYSICAL_CONSTANTS, TFT_CONSTANTS } from '../utils/constants';

// 파일 분석 함수
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

// 분석 수행
const performAnalysis = (data, type, filename, deviceParams) => {
  const headers = data[0];
  const dataRows = data.slice(1).filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));
  
  switch (type) {
    case 'IDVD':
      return analyzeIDVD(headers, dataRows, filename, deviceParams);
    case 'IDVG-Linear':
      return analyzeIDVGLinear(headers, dataRows, filename, deviceParams);
    case 'IDVG-Saturation':
      return analyzeIDVGSaturation(headers, dataRows, filename, deviceParams);
    case 'IDVG-Hysteresis':
      return analyzeIDVGHysteresis(headers, dataRows, filename, deviceParams);
    default:
      return { error: 'Unknown file type' };
  }
};

// 🎯 PDF 기준 완벽한 통합 분석 함수
export const performCompleteAnalysis = (analysisResults, deviceParams) => {
  // 1. 샘플명별로 데이터 그룹화
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

  // 2. 각 샘플별 완전 분석 수행
  const completeResults = {};
  
  Object.entries(sampleGroups).forEach(([sampleName, sampleData]) => {
    completeResults[sampleName] = performSampleCompleteAnalysis(sampleName, sampleData, deviceParams);
  });

  return completeResults;
};

// 🔬 PDF 기준 샘플별 완벽한 분석
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
    // 1. 🔥 Saturation에서 정확한 Vth, SS, Dit 추출 (PDF 방식)
    let vth_sat = 0, ss = 0, dit = 0, gm_max_sat = 0;
    if (sampleData['IDVG-Saturation']) {
      const satParams = sampleData['IDVG-Saturation'].parameters;
      vth_sat = parseFloat(satParams.Vth?.split(' ')[0]) || 0;
      ss = parseFloat(satParams.SS?.split(' ')[0]) || 0;
      dit = parseFloat(satParams.Dit?.split(' ')[0]) || 0;
      gm_max_sat = parseFloat(satParams.gm_max?.split(' ')[0]) || 0;
      if (satParams.gm_max?.includes('µS')) {
        gm_max_sat = gm_max_sat * 1e-6; // µS를 S로 변환
      }
    } else {
      results.warnings.push('Saturation 데이터 없음 - Vth, SS, Dit 계산 불가');
    }

    // 2. 🔥 Linear에서 정확한 gm_max, VDS, Ion/Ioff 추출 (PDF 방식)
    let gm_max_lin = 0, vds_linear = 0, ion = 0, ioff = 0, ion_ioff_ratio = 0;
    if (sampleData['IDVG-Linear']) {
      const linParams = sampleData['IDVG-Linear'].parameters;
      vds_linear = parseFloat(linParams['VDS (측정값)']?.split(' ')[0]) || 0.1;
      ion = parseFloat(linParams.Ion?.split(' ')[0]) || 0;
      ioff = parseFloat(linParams.Ioff?.split(' ')[0]) || 0;
      ion_ioff_ratio = parseFloat(linParams['Ion/Ioff']?.split(' ')[0]) || 0;
      
      // Linear 데이터에서 gm_max 재계산
      const linData = sampleData['IDVG-Linear'];
      gm_max_lin = calculateGmMaxFromLinear(linData);
    } else {
      results.warnings.push('Linear 데이터 없음 - gm_max, Ion/Ioff 계산 불가');
    }

    // 3. 🔥 IDVD에서 Ron 추출 (PDF 방식)
    let ron = 0;
    if (sampleData['IDVD']) {
      const idvdParams = sampleData['IDVD'].parameters;
      ron = parseFloat(idvdParams.Ron?.split(' ')[0]) || 0;
    } else {
      results.warnings.push('IDVD 데이터 없음 - Ron 계산 불가');
    }

    // 4. 🔥 Hysteresis에서 ΔVth 추출 (PDF 방식)
    let delta_vth = 0, stability = 'N/A';
    if (sampleData['IDVG-Hysteresis']) {
      const hysParams = sampleData['IDVG-Hysteresis'].parameters;
      delta_vth = parseFloat(hysParams['Hysteresis (ΔVth)']?.split(' ')[0]) || 0;
      stability = hysParams.Stability || 'N/A';
    } else {
      results.warnings.push('Hysteresis 데이터 없음 - 안정성 평가 불가');
    }

    // 5. 🔥 PDF 기준 μFE 계산 (정확한 수식)
    let muFE = 0;
    const finalGmMax = gm_max_lin > 0 ? gm_max_lin : gm_max_sat; // Linear 우선
    
    if (finalGmMax > 0 && deviceParams.W > 0 && deviceParams.L > 0 && vds_linear > 0) {
      // PDF 수식: μFE = L/(W×Cox×VDS) × gm,max
      const cox = calculateCox(deviceParams.tox); // F/m²
      muFE = (deviceParams.L / (deviceParams.W * cox * vds_linear)) * finalGmMax;
      muFE = muFE * 1e4; // cm²/V·s로 변환
    } else {
      results.warnings.push('μFE 계산 불가 - 파라미터 또는 gm 데이터 부족');
    }

    // 6. 🔥 PDF 기준 Y-function method로 정확한 μ0 계산
    let mu0 = 0, mu0CalculationInfo = '', yFunctionQuality = 'N/A';

    if (sampleData['IDVG-Linear']) {
      const yFunctionResult = calculateMu0UsingYFunction(sampleData['IDVG-Linear'], deviceParams, vth_sat);
      
      if (yFunctionResult.mu0 > 0 && yFunctionResult.quality !== 'Poor') {
        mu0 = yFunctionResult.mu0;
        mu0CalculationInfo = `Y-function method (R²=${yFunctionResult.r_squared.toFixed(3)})`;
        yFunctionQuality = yFunctionResult.quality;
      } else {
        // Y-function 실패시 fallback
        if (muFE > 0) {
          const correctionFactor = vds_linear < 0.2 ? 1.3 : 1.2;
          mu0 = muFE * correctionFactor;
          mu0CalculationInfo = 'Fallback method (Y-function 실패)';
          yFunctionQuality = 'Failed';
          results.warnings.push(`Y-function 계산 실패: ${yFunctionResult.error || '품질 불량'}`);
        } else {
          mu0CalculationInfo = 'N/A (데이터 부족)';
          results.warnings.push('μ0 계산 불가 - Saturation 또는 μFE 데이터 부족');
        }
      }
    } else {
      if (muFE > 0) {
        const correctionFactor = vds_linear < 0.2 ? 1.3 : 1.2;
        mu0 = muFE * correctionFactor;
        mu0CalculationInfo = 'Fallback method (Linear 데이터 없음)';
        results.warnings.push('Linear 데이터 없음 - Y-function 계산 불가');
      } else {
        mu0CalculationInfo = 'N/A (데이터 부족)';
        results.warnings.push('μ0 계산 불가 - 모든 데이터 부족');
      }
    }

    // 7. 🔥 PDF 기준 정확한 θ (theta) 계산
    let muEff = 0, theta = 0, vg_for_theta = 0, thetaCalculationInfo = '';

    if (mu0 > 0 && vth_sat !== 0 && sampleData['IDVG-Linear']) {
      const linearData = sampleData['IDVG-Linear'];
      
      // PDF 기준 θ 계산
      const thetaResult = calculateTheta(
        mu0, 
        deviceParams, 
        linearData.chartData, 
        linearData.gmData, 
        vth_sat, 
        vds_linear
      );
      
      theta = thetaResult.theta;
      thetaCalculationInfo = thetaResult.method;
      
      if (thetaResult.dataPoints) {
        thetaCalculationInfo += ` (${thetaResult.dataPoints}개 점)`;
      }
      
      // gm_max가 발생한 VG 지점 찾기
      if (linearData.gmData && linearData.gmData.length > 0) {
        const maxGmPoint = linearData.gmData.reduce((max, current) => 
          current.gm > max.gm ? current : max
        );
        vg_for_theta = maxGmPoint.VG;
      } else {
        vg_for_theta = vth_sat + 5; // 추정값
      }
      
      // 🔥 PDF 수식: μeff = μ0 / (1 + θ(VG - Vth))
      muEff = calculateMuEff(mu0, theta, vg_for_theta, vth_sat);
      
      // μeff와 μFE의 물리적 관계 검증
      if (muFE > 0 && muEff > 0) {
        const relativeDiff = Math.abs(muEff - muFE) / muFE;
        if (relativeDiff < 0.01) { // 1%
          muEff = 0;
          thetaCalculationInfo += ' (μeff≈μFE)';
          results.warnings.push('μeff ≈ μFE: 이동도 감소 효과 미미');
        } else if (muEff > muFE * 1.05) { // μeff > μFE 검증
          muEff = muFE * 0.95;
          thetaCalculationInfo += ' (물리적 보정)';
          results.warnings.push('μeff > μFE 발생, 물리적 범위로 보정');
        }
      }
    } else {
      theta = 0.1; // 기본값
      thetaCalculationInfo = '기본값 (데이터 부족)';
      results.warnings.push('θ 계산 불가 - 데이터 부족으로 기본값 사용');
    }

    // 8. 🔥 PDF 기준 정확한 Dit 계산
    let dit_calculated = 0;
    if (ss > 0) {
      // PDF 수식: Dit = (Cox/q) × (SS/(2.3×kT/q) - 1)
      const kT_q = PHYSICAL_CONSTANTS.THERMAL_VOLTAGE_300K; // V at 300K
      const cox = calculateCox(deviceParams.tox) * 1e-4; // F/cm²
      const q = PHYSICAL_CONSTANTS.ELEMENTARY_CHARGE; // C
      dit_calculated = (cox / q) * (ss / (2.3 * kT_q) - 1);
    }

    // 9. 🔥 PDF 기준 ID_sat 계산 (A/mm)
    let id_sat_normalized = 0;
    if (sampleData['IDVG-Saturation'] && deviceParams.W) {
      const satParams = sampleData['IDVG-Saturation'].parameters;
      const id_sat_raw = parseFloat(satParams.ID_sat?.split(' ')[0]) || 0;
      const W_mm = deviceParams.W * 1000; // m를 mm로 변환
      id_sat_normalized = id_sat_raw / W_mm; // A/mm
    }

    // 최종 결과 정리
    results.parameters = {
      // 🔥 핵심 파라미터 (PDF 기준)
      'Vth (Saturation)': vth_sat !== 0 ? `${vth_sat.toFixed(2)} V` : 'N/A',
      'gm_max (Linear 기준)': finalGmMax > 0 ? `${finalGmMax.toExponential(2)} S` : 'N/A',
      'μFE (통합 계산)': muFE > 0 ? `${muFE.toExponential(2)} cm²/V·s` : 'N/A',
      'μ0 (Y-function)': mu0 > 0 ? `${mu0.toExponential(2)} cm²/V·s` : 'N/A',
      'μ0 계산 방법': mu0CalculationInfo,
      'Y-function 품질': yFunctionQuality,
      'μeff (정확 계산)': muEff > 0 ? `${muEff.toExponential(2)} cm²/V·s` : '측정불가',
      'θ (계산값)': theta > 0 ? `${theta.toExponential(2)} V⁻¹` : 'N/A',
      'θ 계산 방법': thetaCalculationInfo,
      'VG@gm_max': vg_for_theta > 0 ? `${vg_for_theta.toFixed(1)} V` : 'N/A',
      
      // 개별 측정 파라미터
      'SS': ss > 0 ? `${ss.toFixed(3)} V/decade` : 'N/A',
      'Dit (계산값)': dit_calculated > 0 ? `${dit_calculated.toExponential(2)} cm⁻²eV⁻¹` : 'N/A',
      'Ron': ron > 0 ? `${ron.toExponential(2)} Ω` : 'N/A',
      'Ion': ion > 0 ? `${ion.toExponential(2)} A` : 'N/A',
      'Ioff': ioff > 0 ? `${ioff.toExponential(2)} A` : 'N/A',
      'Ion/Ioff': ion_ioff_ratio > 0 ? `${ion_ioff_ratio.toExponential(2)}` : 'N/A',
      'ΔVth (Hysteresis)': delta_vth > 0 ? `${delta_vth.toFixed(3)} V` : 'N/A',
      'Stability': stability,
      'ID_sat (A/mm)': id_sat_normalized > 0 ? `${id_sat_normalized.toExponential(2)} A/mm` : 'N/A',
      
      // 측정 조건
      'VDS (Linear)': vds_linear > 0 ? `${vds_linear.toFixed(2)} V` : 'N/A',
      'Data Sources': `${Object.keys(sampleData).join(', ')}`
    };

    // 품질 평가
    results.quality = evaluateDataQuality(results.parameters, results.warnings);

  } catch (error) {
    console.error(`${sampleName} 완전 분석 실패:`, error);
    results.warnings.push(`분석 중 오류 발생: ${error.message}`);
  }

  return results;
};

// Linear 데이터에서 정확한 gm_max 재계산
const calculateGmMaxFromLinear = (linearResult) => {
  if (!linearResult.gmData || linearResult.gmData.length === 0) {
    return 0;
  }
  
  // gmData에서 최대값 찾기
  const maxGmPoint = linearResult.gmData.reduce((max, current) => 
    current.gm > max.gm ? current : max
  );
  
  return maxGmPoint.gm;
};

// 데이터 품질 평가
const evaluateDataQuality = (params, warnings) => {
  let score = 100;
  let issues = [];

  // 필수 파라미터 체크
  if (params['Vth (Saturation)'] === 'N/A') {
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

  // Y-function 품질 평가
  if (params['Y-function 품질'] === 'Poor' || params['Y-function 품질'] === 'Failed') {
    score -= 10;
    issues.push('Y-function 품질 불량');
  }

  // 경고 개수에 따른 점수 차감
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