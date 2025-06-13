import * as XLSX from 'xlsx';
import { 
  analyzeIDVD, 
  analyzeIDVGLinear, 
  analyzeIDVGSaturation, 
  analyzeIDVGHysteresis 
} from './dataAnalysis.js';
import * as TFTParams from '../parameters/index.js';

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

// 통합 분석 함수 (기존과 동일하지만 새 모듈 사용)
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

export const calculateGmMaxFromLinear = (linearResult) => {
  if (!linearResult.gmData || linearResult.gmData.length === 0) {
    return 0;
  }
  
  const maxGmPoint = linearResult.gmData.reduce((max, current) => 
    current.gm > max.gm ? current : max
  );
  
  return maxGmPoint.gm;
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
    // Linear 분석 결과에서 파라미터 추출
    let vth_lin = 0, ss = 0, dit = 0, gm_max_lin = 0;
    if (sampleData['IDVG-Linear']) {
      const linParams = sampleData['IDVG-Linear'].parameters;
      vth_lin = parseFloat(linParams.Vth?.split(' ')[0]) || 0;
      ss = parseFloat(linParams.SS?.split(' ')[0]) || 0;
      dit = parseFloat(linParams.Dit?.split(' ')[0]) || 0;
      gm_max_lin = parseFloat(linParams['gm_max']?.split(' ')[0]) || 0;
    } else {
      results.warnings.push('Linear 데이터 없음');
    }

    // Saturation 결과 추출
    let id_sat_raw = 0;
    if (sampleData['IDVG-Saturation']) {
      const satParams = sampleData['IDVG-Saturation'].parameters;
      id_sat_raw = parseFloat(satParams.ID_sat?.split(' ')[0]) || 0;
    }

    // Linear에서 추가 파라미터 추출
    let vds_linear = 0, ion = 0, ioff = 0, ion_ioff_ratio = 0;
    if (sampleData['IDVG-Linear']) {
      const linParams = sampleData['IDVG-Linear'].parameters;
      vds_linear = parseFloat(linParams['VDS (측정값)']?.split(' ')[0]) || 0.1;
      ion = parseFloat(linParams.Ion?.split(' ')[0]) || 0;
      ioff = parseFloat(linParams.Ioff?.split(' ')[0]) || 0;
      ion_ioff_ratio = parseFloat(linParams['Ion/Ioff']?.split(' ')[0]) || 0;
    }

    // Ron 추출
    let ron = 0;
    if (sampleData['IDVD']) {
      const idvdParams = sampleData['IDVD'].parameters;
      ron = parseFloat(idvdParams.Ron?.split(' ')[0]) || 0;
    } else {
      results.warnings.push('IDVD 데이터 없음');
    }

    // Hysteresis 추출
    let delta_vth = 0, stability = 'N/A';
    if (sampleData['IDVG-Hysteresis']) {
      const hysParams = sampleData['IDVG-Hysteresis'].parameters;
      delta_vth = parseFloat(hysParams['Hysteresis (ΔVth)']?.split(' ')[0]) || 0;
      stability = hysParams.Stability || 'N/A';
    } else {
      results.warnings.push('Hysteresis 데이터 없음');
    }

    // μFE 재계산
    let muFE = 0;
    if (gm_max_lin > 0) {
      muFE = TFTParams.calculateMuFE(gm_max_lin, deviceParams, vds_linear);
    }

    // Y-function으로 μ0 계산
    let mu0 = 0, mu0_quality = 'N/A';
    if (sampleData['IDVG-Linear'] && vth_lin !== 0) {
      const linearData = sampleData['IDVG-Linear'];
      const mu0Result = TFTParams.calculateMu0(
        linearData.chartData, 
        linearData.gmData, 
        deviceParams, 
        vth_lin, 
        vds_linear
      );
      mu0 = mu0Result.mu0;
      mu0_quality = mu0Result.quality;
      
      if (mu0Result.quality === 'Poor' && muFE > 0) {
        mu0 = muFE * 1.2; // Fallback
        mu0_quality = 'Fallback';
        results.warnings.push('Y-function 실패, Fallback 방법 사용');
      }
    }

    // θ 계산
    let theta = 0.1, muEff = 0;
    if (mu0 > 0 && vth_lin !== 0 && sampleData['IDVG-Linear']) {
      const linearData = sampleData['IDVG-Linear'];
      const thetaResult = TFTParams.calculateTheta(
        mu0, 
        deviceParams, 
        linearData.chartData, 
        vth_lin, 
        vds_linear
      );
      theta = thetaResult.theta;
      
      // μeff 계산
      if (linearData.gmData && linearData.gmData.length > 0) {
        const maxGmPoint = linearData.gmData.reduce((max, current) => 
          current.gm > max.gm ? current : max
        );
        const vg_for_mueff = maxGmPoint.VG;
        muEff = TFTParams.calculateMuEff(mu0, theta, vg_for_mueff, vth_lin);
      }
    }

    // 결과 구성
    results.parameters = {
      'Vth (Linear 기준)': vth_lin !== 0 ? `${vth_lin.toFixed(2)} V` : 'N/A',
      'gm_max (Linear 기준)': gm_max_lin > 0 ? `${gm_max_lin.toExponential(2)} S` : 'N/A',
      'μFE (통합 계산)': muFE > 0 ? `${muFE.toExponential(2)} cm²/V·s` : 'N/A',
      'μ0 (Y-function)': mu0 > 0 ? `${mu0.toExponential(2)} cm²/V·s` : 'N/A',
      'μ0 품질': mu0_quality,
      'μeff (정확 계산)': muEff > 0 ? `${muEff.toExponential(2)} cm²/V·s` : 'N/A',
      'θ (계산값)': `${theta.toExponential(2)} V⁻¹`,
      'SS (Linear 기준)': ss > 0 ? `${ss.toFixed(3)} mV/decade` : 'N/A',
      'Dit (Linear 기준)': dit > 0 ? `${dit.toExponential(2)} cm⁻²eV⁻¹` : 'N/A',
      'Ron': ron > 0 ? `${ron.toExponential(2)} Ω` : 'N/A',
      'Ion': ion > 0 ? `${ion.toExponential(2)} A` : 'N/A',
      'Ioff': ioff > 0 ? `${ioff.toExponential(2)} A` : 'N/A',
      'Ion/Ioff': ion_ioff_ratio > 0 ? `${ion_ioff_ratio.toExponential(2)}` : 'N/A',
      'ΔVth (Hysteresis)': delta_vth > 0 ? `${delta_vth.toFixed(3)} V` : 'N/A',
      'Stability': stability,
      'ID_sat (A/mm)': id_sat_raw > 0 ? `${id_sat_raw.toExponential(2)} A/mm` : 'N/A',
      'VDS (Linear)': vds_linear > 0 ? `${vds_linear.toFixed(2)} V` : 'N/A'
    };

    results.quality = evaluateDataQuality(results.parameters, results.warnings);

  } catch (error) {
    console.error(`${sampleName} 완전 분석 실패:`, error);
    results.warnings.push(`분석 중 오류 발생: ${error.message}`);
  }

  return results;
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

  if (params['μ0 품질'] === 'Poor') {
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