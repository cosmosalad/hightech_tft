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
  calculateCox
} from './calculationUtils';

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

// 🎯 완벽한 통합 분석 함수 - 샘플명별로 데이터 묶어서 정확한 계산
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

// 🟢 헬퍼 함수들 추가
const calculateFallbackTheta = (deviceParams, vg_diff) => {
  const tox = deviceParams.tox || 5e-9;
  
  if (tox < 3e-9) return 0.3;      // 얇은 산화막 - 높은 field effect
  else if (tox < 10e-9) return 0.1; // 중간 두께
  else return 0.05;                 // 두꺼운 산화막 - 낮은 field effect
};

const calculateAlternativeTheta = (mu0, muFE, vg_diff, deviceParams) => {
  // VG 차이가 작을 때 대안 계산법
  const mobility_ratio = mu0 / muFE;
  const base_theta = (mobility_ratio - 1) / vg_diff;
  
  // VG 차이에 대한 보정 인수 적용
  const correction_factor = Math.min(2.0, vg_diff / 1.0);
  
  return Math.max(0.01, Math.min(1.5, base_theta * correction_factor));
};

const estimateThetaFromDevice = (deviceParams) => {
  const W = deviceParams.W || 10e-6;
  const L = deviceParams.L || 1e-6;
  const tox = deviceParams.tox || 5e-9;
  
  // Aspect ratio와 oxide thickness 기반 추정
  const aspect_ratio = W / L;
  const thickness_factor = tox / 5e-9; // 5nm 기준 정규화
  
  return 0.05 + (0.05 * Math.log10(aspect_ratio)) + (0.02 * thickness_factor);
};

const estimateThetaFromSaturation = (mu0, muFE, deviceParams) => {
  if (muFE > 0) {
    const mobility_ratio = mu0 / muFE;
    return Math.max(0.02, Math.min(0.5, (mobility_ratio - 1) / 10.0));
  }
  return 0.1;
};

// 🔬 샘플별 완벽한 분석 (수정된 버전)
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
    // 1. Saturation에서 정확한 Vth, SS, Dit 추출
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

    // 2. Linear에서 정확한 gm_max, VDS, Ion/Ioff 추출
    let gm_max_lin = 0, vds_linear = 0, ion = 0, ioff = 0, ion_ioff_ratio = 0;
    if (sampleData['IDVG-Linear']) {
      const linParams = sampleData['IDVG-Linear'].parameters;
      vds_linear = parseFloat(linParams['VDS (측정값)']?.split(' ')[0]) || 0.1;
      ion = parseFloat(linParams.Ion?.split(' ')[0]) || 0;
      ioff = parseFloat(linParams.Ioff?.split(' ')[0]) || 0;
      ion_ioff_ratio = parseFloat(linParams['Ion/Ioff']?.split(' ')[0]) || 0;
      
      // Linear 데이터에서 gm_max 재계산 (더 정확)
      const linData = sampleData['IDVG-Linear'];
      gm_max_lin = calculateGmMaxFromLinear(linData);
    } else {
      results.warnings.push('Linear 데이터 없음 - gm_max, Ion/Ioff 계산 불가');
    }

    // 3. IDVD에서 Ron 추출
    let ron = 0;
    if (sampleData['IDVD']) {
      const idvdParams = sampleData['IDVD'].parameters;
      ron = parseFloat(idvdParams.Ron?.split(' ')[0]) || 0;
    } else {
      results.warnings.push('IDVD 데이터 없음 - Ron 계산 불가');
    }

    // 4. Hysteresis에서 ΔVth 추출
    let delta_vth = 0, stability = 'N/A';
    if (sampleData['IDVG-Hysteresis']) {
      const hysParams = sampleData['IDVG-Hysteresis'].parameters;
      delta_vth = parseFloat(hysParams['Hysteresis (ΔVth)']?.split(' ')[0]) || 0;
      stability = hysParams.Stability || 'N/A';
    } else {
      results.warnings.push('Hysteresis 데이터 없음 - 안정성 평가 불가');
    }

    // 5. 🎯 μFE 계산 (개선된 버전 - SI 단위 일관성)
    let muFE = 0;
    const finalGmMax = gm_max_lin > 0 ? gm_max_lin : gm_max_sat; // Linear 우선, 없으면 Saturation
    
    if (finalGmMax > 0 && deviceParams.W > 0 && deviceParams.L > 0 && vds_linear > 0) {
      const cox = calculateCox(deviceParams.tox); // F/m² 단위
      
      // SI 단위로 일관성 있게 계산
      muFE = (finalGmMax * deviceParams.L) / (cox * deviceParams.W * vds_linear); // m²/V·s
      muFE = muFE * 1e4; // cm²/V·s로 변환
    } else {
      results.warnings.push('μFE 계산 불가 - 파라미터 또는 gm 데이터 부족');
    }

    // 6. 🎯 Y-function method로 정확한 μ0 계산
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
      // Linear 데이터가 없는 경우 기존 방식
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

    // 7. 🟢 정확한 μeff 계산 (개선된 θ 계산 로직)
    let muEff = 0, theta = 0, vg_for_theta = 0, thetaCalculationInfo = '';

    if (mu0 > 0 && vth_sat !== 0) {
      // Linear 데이터에서 실제 gm_max 지점 찾기
      if (sampleData['IDVG-Linear'] && sampleData['IDVG-Linear'].gmData) {
        const gmData = sampleData['IDVG-Linear'].gmData;
        
        if (gmData.length > 0) {
          // gm_max가 발생한 실제 VG 지점 찾기
          const maxGmPoint = gmData.reduce((max, current) => 
            current.gm > max.gm ? current : max
          );
          vg_for_theta = maxGmPoint.VG;
          
          // 🟢 개선: 물리적 타당성 검증 강화
          const vg_diff = vg_for_theta - vth_sat;
          
          // 🟢 개선 1: 더 엄격한 조건 + μ0 > μFE 확인
          if (vg_diff > 2.0 && muFE > 0 && mu0 > muFE) {
            const theta_raw = (mu0 / muFE - 1) / vg_diff;
            
            // 🟢 개선 2: θ 범위 엄격 검증
            if (theta_raw >= 0.001 && theta_raw <= 2.0) {
              theta = theta_raw;
              thetaCalculationInfo = `실측값 (VG=${vg_for_theta.toFixed(1)}V, ΔVG=${vg_diff.toFixed(1)}V)`;
            } else {
              // 🟢 개선 3: 물리적 근거 있는 기본값
              theta = calculateFallbackTheta(deviceParams, vg_diff);
              thetaCalculationInfo = `보정값 (계산값 ${theta_raw.toFixed(4)} 범위초과)`;
              results.warnings.push(`θ 계산값 범위초과 (${theta_raw.toFixed(4)} V⁻¹), 보정값 사용`);
            }
          } else if (vg_diff > 0.5 && vg_diff <= 2.0 && muFE > 0 && mu0 > muFE) {
            // 🟢 개선 4: VG 차이 작을 때 대안 계산
            theta = calculateAlternativeTheta(mu0, muFE, vg_diff, deviceParams);
            thetaCalculationInfo = `대안계산 (VG차이=${vg_diff.toFixed(1)}V 부족)`;
            results.warnings.push('VG 차이가 작아 대안 θ 계산법 사용');
          } else {
            // 🟢 개선 5: 조건별 세분화된 처리
            if (vg_diff <= 0.5) {
              theta = 0.05;
              thetaCalculationInfo = `보수적값 (VG차이=${vg_diff.toFixed(1)}V 과소)`;
              results.warnings.push('VG 차이가 너무 작아 보수적 θ 값 사용');
            } else if (mu0 <= muFE) {
              theta = 0.01;
              thetaCalculationInfo = `최소값 (μ0≤μFE: ${mu0.toFixed(0)}≤${muFE.toFixed(0)})`;
              results.warnings.push('μ0 ≤ μFE로 인해 최소 θ 값 사용');
            } else {
              theta = 0.1;
              thetaCalculationInfo = `표준값 (조건불만족)`;
              results.warnings.push(`θ 계산 조건 불만족: VG차이=${vg_diff.toFixed(1)}V, μ0=${mu0.toFixed(0)}, μFE=${muFE.toFixed(0)}`);
            }
          }
        } else {
          // 🟢 개선 6: gm 데이터 없을 때 디바이스 파라미터 기반 추정
          theta = estimateThetaFromDevice(deviceParams);
          vg_for_theta = vth_sat + 5; // 임시값
          thetaCalculationInfo = `추정값 (gm데이터없음)`;
          results.warnings.push('gm 데이터 없음 - 디바이스 파라미터 기반 θ 추정');
        }
      } else {
        // 🟢 개선 7: Linear 데이터 없을 때 Saturation 데이터 활용
        if (sampleData['IDVG-Saturation'] && gm_max_sat > 0) {
          theta = estimateThetaFromSaturation(mu0, muFE, deviceParams);
          vg_for_theta = vth_sat + 8; // Saturation 영역 추정값
          thetaCalculationInfo = `Saturation기반 (Linear데이터없음)`;
          results.warnings.push('Linear 데이터 없음 - Saturation 데이터로 θ 추정');
        } else {
          theta = 0.1;
          vg_for_theta = vth_sat + 10;
          thetaCalculationInfo = `기본값 (모든데이터없음)`;
          results.warnings.push('측정 데이터 부족으로 기본 θ 값 사용');
        }
      }
      
      // 🟢 개선 8: μeff 계산 시 추가 검증
      const vg_effective = Math.max(0, vg_for_theta - vth_sat);
      muEff = mu0 / (1 + theta * vg_effective);
      
      // 🟢 개선 9: μeff와 μFE의 물리적 관계 검증
      if (muFE > 0 && muEff > 0) {
        const relativeDiff = Math.abs(muEff - muFE) / muFE;
        if (relativeDiff < 0.005) { // 0.5%로 더 엄격하게
          muEff = 0;
          thetaCalculationInfo += ' (μeff≈μFE)';
          results.warnings.push('μeff ≈ μFE: 이동도 감소 효과 미미하여 측정불가');
        } else if (muEff > muFE * 1.1) { // μeff > μFE 검증
          muEff = muFE * 0.9; // 물리적으로 합리적인 범위로 제한
          thetaCalculationInfo += ' (μeff>μFE보정)';
          results.warnings.push('μeff > μFE 발생, 물리적 범위로 보정');
        }
      }
    } else {
      results.warnings.push('μ0 또는 Vth 없음 - μeff 계산 불가');
    }

    // 8. 🎯 정확한 Dit 계산 (Saturation SS + 디바이스 파라미터)
    let dit_calculated = 0;
    if (ss > 0) {
      const kT_q = 0.0259; // V at room temperature
      const cox = calculateCox(deviceParams.tox) * 1e-4; // F/cm²
      const q = 1.602e-19; // C
      dit_calculated = (cox / q) * (ss / (2.3 * kT_q) - 1);
    }

    // 최종 결과 정리
    results.parameters = {
      // 🔥 핵심 파라미터 (여러 데이터 조합)
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

  // 경고 개수에 따른 점수 차감
  score -= warnings.length * 5;

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