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

    // ✅ 새로운 품질 평가 시스템 적용
    results.quality = evaluateDataQuality(
      results.parameters, 
      results.warnings,
      {
        hasLinear: results.hasLinear,
        hasSaturation: results.hasSaturation,
        hasIDVD: results.hasIDVD,
        hasHysteresis: results.hasHysteresis
      }
    );

  } catch (error) {
    console.error(`${sampleName} 완전 분석 실패:`, error);
    results.warnings.push(`분석 중 오류 발생: ${error.message}`);
  }

  return results;
};

// ✅ 개선된 품질 평가 함수 (기존 함수 완전 교체)
const evaluateDataQuality = (params, warnings, dataAvailability) => {
  let score = 0; // 0점에서 시작해서 데이터에 따라 가산
  let issues = [];
  
  // 🎯 1. 데이터 완성도 평가 (40점 만점)
  let dataScore = 0;
  let totalMeasurements = 0;
  let completeMeasurements = 0;
  
  // Linear 데이터 (필수) - 15점
  if (dataAvailability.hasLinear) {
    dataScore += 15;
    completeMeasurements++;
    if (params['Vth (Linear 기준)'] === 'N/A') {
      dataScore -= 5;
      issues.push('Linear Vth 계산 실패');
    }
    if (params['gm_max (Linear 기준)'] === 'N/A') {
      dataScore -= 5;
      issues.push('Linear gm_max 계산 실패');
    }
  } else {
    issues.push('Linear 데이터 없음 (치명적)');
  }
  totalMeasurements++;
  
  // Saturation 데이터 - 10점
  if (dataAvailability.hasSaturation) {
    dataScore += 10;
    completeMeasurements++;
  } else {
    issues.push('Saturation 데이터 없음');
  }
  totalMeasurements++;
  
  // IDVD 데이터 - 10점
  if (dataAvailability.hasIDVD) {
    dataScore += 10;
    completeMeasurements++;
    if (params['Ron'] === 'N/A') {
      dataScore -= 3;
      issues.push('Ron 계산 실패');
    }
  } else {
    issues.push('IDVD 데이터 없음');
  }
  totalMeasurements++;
  
  // Hysteresis 데이터 - 5점
  if (dataAvailability.hasHysteresis) {
    dataScore += 5;
    completeMeasurements++;
    if (params['ΔVth (Hysteresis)'] === 'N/A') {
      dataScore -= 2;
      issues.push('Hysteresis 분석 실패');
    }
  } else {
    issues.push('Hysteresis 데이터 없음');
  }
  totalMeasurements++;
  
  score += dataScore;
  
  // 🔬 2. 파라미터 품질 평가 (35점 만점)
  let paramScore = 0;
  
  // μFE 계산 성공 - 10점
  if (params['μFE (통합 계산)'] !== 'N/A') {
    paramScore += 10;
  } else {
    issues.push('μFE 계산 실패');
  }
  
  // μ0 Y-function 품질 - 10점
  if (params['μ0 품질'] === 'Excellent') {
    paramScore += 10;
  } else if (params['μ0 품질'] === 'Good') {
    paramScore += 7;
  } else if (params['μ0 품질'] === 'Fair') {
    paramScore += 4;
  } else if (params['μ0 품질'] === 'Poor') {
    paramScore += 1;
    issues.push('Y-function 품질 불량');
  } else if (params['μ0 품질'] === 'Fallback') {
    paramScore += 3;
    issues.push('Y-function 실패, Fallback 사용');
  } else {
    issues.push('μ0 계산 실패');
  }
  
  // μeff 계산 성공 - 8점
  if (params['μeff (정확 계산)'] !== 'N/A') {
    paramScore += 8;
  } else {
    issues.push('μeff 계산 실패');
  }
  
  // SS 품질 - 7점
  if (params['SS (Linear 기준)'] !== 'N/A') {
    const ssValue = parseFloat(params['SS (Linear 기준)']);
    if (ssValue < 100) {
      paramScore += 7; // 우수
    } else if (ssValue < 300) {
      paramScore += 5; // 양호
    } else if (ssValue < 1000) {
      paramScore += 3; // 보통
    } else {
      paramScore += 1; // 불량
      issues.push('높은 SS 값 (>1V/decade)');
    }
  } else {
    issues.push('SS 계산 실패');
  }
  
  score += paramScore;
  
  // 🚨 3. 경고 및 오류 감점 (25점 감점 가능)
  let warningPenalty = Math.min(warnings.length * 5, 25); // 경고당 5점 감점, 최대 25점
  score -= warningPenalty;
  
  if (warnings.length > 0) {
    issues.push(`${warnings.length}개 경고사항 발생`);
  }
  
  // 🎁 4. 보너스 점수 (20점 가능)
  let bonusScore = 0;
  
  // 완전한 데이터셋 보너스 - 10점
  if (completeMeasurements === totalMeasurements) {
    bonusScore += 10;
  }
  
  // Ion/Ioff 우수 - 5점
  if (params['Ion/Ioff'] !== 'N/A') {
    const ionIoffRatio = parseFloat(params['Ion/Ioff']);
    if (ionIoffRatio > 1e6) {
      bonusScore += 5;
    } else if (ionIoffRatio > 1e4) {
      bonusScore += 3;
    }
  }
  
  // 낮은 Hysteresis - 5점
  if (params['ΔVth (Hysteresis)'] !== 'N/A') {
    const deltaVth = Math.abs(parseFloat(params['ΔVth (Hysteresis)']));
    if (deltaVth < 0.1) {
      bonusScore += 5;
    } else if (deltaVth < 0.5) {
      bonusScore += 2;
    }
  }
  
  score += bonusScore;
  
  // 📊 5. 최종 등급 결정 (엄격한 기준)
  score = Math.max(0, Math.min(100, score)); // 0-100 범위 제한
  
  let grade = 'F';
  if (score >= 95 && completeMeasurements === totalMeasurements) {
    grade = 'A+'; // 완벽한 데이터 + 우수한 품질
  } else if (score >= 90 && completeMeasurements >= 3) {
    grade = 'A';  // 우수 (3개 이상 측정 + 90점 이상)
  } else if (score >= 80 && completeMeasurements >= 2) {
    grade = 'B';  // 양호 (2개 이상 측정 + 80점 이상)
  } else if (score >= 70) {
    grade = 'C';  // 보통 (70점 이상)
  } else if (score >= 60) {
    grade = 'D';  // 미흡 (60점 이상)
  }
  // else F (60점 미만)
  
  // 🎯 추가 등급 조건
  if (!dataAvailability.hasLinear) {
    grade = 'F'; // Linear 데이터 없으면 무조건 F
    issues.push('필수 Linear 데이터 부재');
  }
  
  if (completeMeasurements === 1 && grade !== 'F') {
    // 단일 데이터만 있으면 최대 D등급
    if (grade === 'A+' || grade === 'A' || grade === 'B' || grade === 'C') {
      grade = 'D';
    }
    issues.push('단일 측정 데이터로 제한된 분석');
  }

  return {
    score: Math.round(score),
    grade,
    issues,
    breakdown: {
      dataScore: dataScore,
      paramScore: paramScore,
      warningPenalty: warningPenalty,
      bonusScore: bonusScore,
      completeMeasurements: completeMeasurements,
      totalMeasurements: totalMeasurements
    }
  };
};

// 📋 등급별 기준 명시 (선택사항 - 디버깅용)
export const QUALITY_STANDARDS = {
  'A+': '완벽한 데이터셋(4개) + 모든 파라미터 우수 (95점 이상)',
  'A': '우수한 품질 + 3개 이상 측정 (90-94점)',
  'B': '양호한 품질 + 2개 이상 측정 (80-89점)', 
  'C': '보통 품질 (70-79점)',
  'D': '미흡한 품질 또는 제한된 데이터 (60-69점)',
  'F': '불량한 품질 또는 필수 데이터 부재 (60점 미만)'
};