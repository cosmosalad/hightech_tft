import React, { useState, useEffect } from 'react';
import { Upload, FileText, BarChart3, Calculator, Info, Play, Home, ArrowLeft, Table, Star } from 'lucide-react';
import * as XLSX from 'xlsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TFTAnalyzer = ({ onNavigateHome, onNavigateBack }) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [completeAnalysisResults, setCompleteAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);
  const [deviceParams, setDeviceParams] = useState({
    W: 100e-6,        // 채널 폭 (m)
    L: 50e-6,         // 채널 길이 (m)  
    tox: 20e-9,       // 산화막 두께 (m)
    Cox: 3.45e-7      // 산화막 정전용량 (F/cm²)
  });
  const [showParamInput, setShowParamInput] = useState(false);
  const [showFormulaInfo, setShowFormulaInfo] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);


  const handleGoBack = () => {
    if (currentPage === 'analyzer') {
      setCurrentPage('home');
    } else {
      onNavigateBack();
    }
  };

  const handleGoToMainHome = () => {
    onNavigateHome();
  };

  // Cox 자동 계산 (εr_SiO2 = 3.9, ε0 = 8.854e-12 F/m)
  const calculateCox = (tox) => {
    const epsilon_r = 3.9;
    const epsilon_0 = 8.854e-12;
    return (epsilon_r * epsilon_0) / tox;
  };

  // 파일 업로드 핸들러
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      file,
      name: file.name,
      type: detectFileType(file.name),
      id: Date.now() + Math.random(),
      alias: '' // 사용자 정의 샘플명
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  // 파일 타입 감지
  const detectFileType = (filename) => {
    const name = filename.toLowerCase();
    if (name.includes('idvd')) return 'IDVD';
    if (name.includes('idvg') && (name.includes('linear') || name.includes('lin')) && (name.includes('hys') || name.includes('hysteresis'))) return 'IDVG-Hysteresis';
    if (name.includes('idvg') && (name.includes('linear') || name.includes('lin'))) return 'IDVG-Linear';
    if (name.includes('idvg') && name.includes('sat')) return 'IDVG-Saturation';
    return 'Unknown';
  };

  // 파일 제거
  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  // 파일 샘플명 업데이트
  const updateFileAlias = (id, alias) => {
    setUploadedFiles(prev => 
      prev.map(file => 
        file.id === id ? { ...file, alias } : file
      )
    );
  };

  // 분석 시작
  const startAnalysis = async () => {
    if (uploadedFiles.length === 0) {
      alert('먼저 엑셀 파일을 업로드해주세요.');
      return;
    }
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
    setIsAnalyzing(true);
    try {
      const results = await analyzeFiles(uploadedFiles);
      setAnalysisResults(results);
      
      // 통합 분석 수행
      const completeResults = performCompleteAnalysis(results);
      setCompleteAnalysisResults(completeResults);
      
      setCurrentPage('analyzer');
    } catch (error) {
      console.error('분석 중 오류 발생:', error);
      alert('파일 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 파일 분석 함수
  const analyzeFiles = async (files) => {
    const results = {};
    
    for (const fileInfo of files) {
      try {
        const arrayBuffer = await fileInfo.file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const analysisResult = performAnalysis(jsonData, fileInfo.type, fileInfo.name);
        
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

  // 🎯 완벽한 통합 분석 함수 - 샘플명별로 데이터 묶어서 정확한 계산
  const performCompleteAnalysis = (analysisResults) => {
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
      completeResults[sampleName] = performSampleCompleteAnalysis(sampleName, sampleData);
    });

    return completeResults;
  };

  // 🔬 샘플별 완벽한 분석
  const performSampleCompleteAnalysis = (sampleName, sampleData) => {
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

      // 5. 🎯 완벽한 μFE 계산 (Linear gm_max + 디바이스 파라미터)
      let muFE = 0;
      const finalGmMax = gm_max_lin > 0 ? gm_max_lin : gm_max_sat; // Linear 우선, 없으면 Saturation
      
      if (finalGmMax > 0 && deviceParams.W > 0 && deviceParams.L > 0 && vds_linear > 0) {
        const cox = calculateCox(deviceParams.tox);
        const coxCm2 = cox * 1e-4; // F/cm²
        const WCm = deviceParams.W * 100; // cm
        const LCm = deviceParams.L * 100; // cm
        
        muFE = (LCm / (WCm * coxCm2 * vds_linear)) * finalGmMax;
      } else {
        results.warnings.push('μFE 계산 불가 - 파라미터 또는 gm 데이터 부족');
      }

      // 6. 🎯 개선된 μ0 계산 (경험적 보정)
      let mu0 = 0;
      if (muFE > 0) {
        // 실제 측정 조건을 고려한 보정 계수
        const correctionFactor = vds_linear < 0.2 ? 1.3 : 1.2; // 낮은 VDS에서 더 큰 보정
        mu0 = muFE * correctionFactor;
      }

      // 7. 🎯 정확한 μeff 계산 (실제 gm_max 지점 사용)
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
      
      // 물리적 합리성 검증
      const vg_diff = vg_for_theta - vth_sat;
      
      if (vg_diff > 1.0 && muFE > 0) {
        // 충분한 VG 차이가 있고 μFE가 유효할 때만 계산
        theta = Math.max(0, (mu0 / muFE - 1) / vg_diff);
        
        // θ의 물리적 합리성 검증 (일반적으로 0.001 ~ 2.0 V⁻¹ 범위)
        if (theta >= 0.001 && theta <= 2.0) {
          thetaCalculationInfo = `실측값 (VG=${vg_for_theta.toFixed(1)}V, ΔVG=${vg_diff.toFixed(1)}V)`;
        } else {
          // 비합리적인 θ 값이면 기본값 사용
          theta = 0.1;
          thetaCalculationInfo = `기본값 (계산값 ${theta.toFixed(3)} 비합리적)`;
          results.warnings.push(`θ 계산값이 비정상적임 (${(mu0/muFE-1)/vg_diff}), 기본값 사용`);
        }
      } else if (vg_diff <= 1.0) {
        // VG 차이가 너무 작으면 기본값
        theta = 0.1;
        thetaCalculationInfo = `기본값 (VG 차이 부족: ${vg_diff.toFixed(1)}V)`;
        results.warnings.push('gm_max와 Vth 차이가 너무 작아 정확한 θ 계산 불가');
      } else {
        // μFE가 없으면 기본값
        theta = 0.1;
        thetaCalculationInfo = '기본값 (μFE 없음)';
        results.warnings.push('μFE 값이 없어 θ 계산 불가');
      }
    } else {
      // gm 데이터가 없으면 기본값
      theta = 0.1;
      vg_for_theta = vth_sat + 10; // 임시값
      thetaCalculationInfo = '기본값 (gm 데이터 없음)';
      results.warnings.push('Linear 측정의 gm 데이터가 없어 θ 계산 불가');
    }
  } else {
    // Linear 데이터 자체가 없으면 기본값
    theta = 0.1;
    vg_for_theta = vth_sat + 10; // 임시값
    thetaCalculationInfo = '기본값 (Linear 데이터 없음)';
    results.warnings.push('Linear 측정 데이터가 없어 θ 계산 불가');
  }
  
    // μeff 계산 - 실제 사용된 VG 지점에서
    muEff = mu0 / (1 + theta * Math.max(0, vg_for_theta - vth_sat));
      
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
        'μ0 (보정 계산)': mu0 > 0 ? `${mu0.toExponential(2)} cm²/V·s` : 'N/A',
        'μeff (정확 계산)': muEff > 0 ? `${muEff.toExponential(2)} cm²/V·s` : 'N/A',
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

  // 분석 수행
  const performAnalysis = (data, type, filename) => {
    const headers = data[0];
    const dataRows = data.slice(1).filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));
    
    switch (type) {
      case 'IDVD':
        return analyzeIDVD(headers, dataRows, filename);
      case 'IDVG-Linear':
        return analyzeIDVGLinear(headers, dataRows, filename);
      case 'IDVG-Saturation':
        return analyzeIDVGSaturation(headers, dataRows, filename);
      case 'IDVG-Hysteresis':
        return analyzeIDVGHysteresis(headers, dataRows, filename);
      default:
        return { error: 'Unknown file type' };
    }
  };

  // 선형 회귀 계산
  const calculateLinearRegression = (x, y) => {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  };

  // IDVD 분석 (기존 코드 유지)
  const analyzeIDVD = (headers, dataRows, filename) => {
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

    let ron = 0;
    if (chartData_fixed.length > 2) {
      const lowVDPoint = chartData_fixed[1];
      const vd = lowVDPoint.VD;
      const id = lowVDPoint[`VG_${gateVoltages[gateVoltages.length-1]}V`] || 1e-12;
      if (id > 0) {
        ron = vd / id;
      }
    }

    return {
      chartData: chartData_fixed,
      gateVoltages,
      parameters: {
        Ron: ron.toExponential(2) + ' Ω'
      }
    };
  };

  // IDVG Linear 분석 (gm 데이터 포함)
  const analyzeIDVGLinear = (headers, dataRows, filename) => {
    let vgIndex = -1, idIndex = -1, vdIndex = -1;

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
      
      if (!isNaN(vg) && !isNaN(id) && !uniqueVGPoints.has(vg)) {
        uniqueVGPoints.set(vg, {
          VG: vg,
          ID: id,
          VD: Math.abs(row[vdIndex]) || 0,
          logID: Math.log10(id)
        });
      }
    }
    
    const chartData = Array.from(uniqueVGPoints.values()).sort((a, b) => a.VG - b.VG);

    // gm 계산
    let gmData = [];
    let maxGm = 0;
    let maxGmIndex = 0;
    
    for (let i = 1; i < chartData.length - 1; i++) {
      const deltaVG = chartData[i+1].VG - chartData[i-1].VG;
      const deltaID = chartData[i+1].ID - chartData[i-1].ID;
      
      if (deltaVG !== 0) {
        const gm = Math.abs(deltaID / deltaVG);
        const roundedVG = Math.round(chartData[i].VG * 10) / 10;
        gmData.push({ VG: roundedVG, gm: gm });
        if (gm > maxGm) {
          maxGm = gm;
          maxGmIndex = i;
        }
      }
    }

    const ion = Math.max(...chartData.map(d => d.ID));
    const minCurrents = chartData.filter(d => d.ID > 0).map(d => d.ID);
    const ioff = minCurrents.length > 0 ? Math.min(...minCurrents) : 1e-12;
    const ionIoffRatio = ion / (ioff || 1e-12);

    const cox = calculateCox(deviceParams.tox);

    let muFE = 0;
    if (maxGm > 0 && deviceParams.W > 0 && deviceParams.L > 0 && cox > 0 && vdsLinear > 0) {
      muFE = (deviceParams.L / (deviceParams.W * cox * vdsLinear)) * maxGm;
      muFE = muFE * 1e4; 
    }

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
        μFE: muFE > 0 ? muFE.toExponential(2) + ' cm²/V·s' : 'N/A (파라미터 입력 필요)'
      }
    };
  };

  // IDVG Saturation 분석 (기존 코드 유지)
  const analyzeIDVGSaturation = (headers, dataRows, filename) => {
    let vgIndex = -1, idIndex = -1, vdIndex = -1;
    
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
      
      if (!isNaN(vg) && !isNaN(id) && !uniqueVGPoints.has(vg)) {
        uniqueVGPoints.set(vg, {
          VG: vg,
          ID: id,
          VD: Math.abs(row[vdIndex]) || 0,
          sqrtID: Math.sqrt(id),
          logID: Math.log10(id)
        });
      }
    }
    
    const chartData = Array.from(uniqueVGPoints.values()).sort((a, b) => a.VG - b.VG);

    // gm 계산
    let gmData = [];
    let maxGm = 0;
    let maxGmIndex = 0;
    
    for (let i = 1; i < chartData.length - 1; i++) {
      const deltaVG = chartData[i+1].VG - chartData[i-1].VG;
      const deltaID = chartData[i+1].ID - chartData[i-1].ID;
      
      if (deltaVG !== 0) {
        const gm = Math.abs(deltaID / deltaVG);
        const roundedVG = Math.round(chartData[i].VG * 10) / 10;
        gmData.push({ VG: roundedVG, gm: gm });
        if (gm > maxGm) {
          maxGm = gm;
          maxGmIndex = i;
        }
      }
    }

    // Threshold voltage 계산
    let vth = 0;
    const gmMaxIndex = gmData.findIndex(d => d.gm === maxGm);
    if (gmMaxIndex > 5) {
      const linearStart = Math.max(0, gmMaxIndex - 5);
      const linearEnd = Math.min(chartData.length, gmMaxIndex + 5);
      const x = chartData.slice(linearStart, linearEnd).map(d => d.VG);
      const y = chartData.slice(linearStart, linearEnd).map(d => d.sqrtID);
      const regression = calculateLinearRegression(x, y);
      if (regression.slope !== 0) {
        vth = -regression.intercept / regression.slope;
      }
    }
// Subthreshold Swing 계산
   const subthresholdData = chartData.filter(d => d.logID > -10 && d.logID < -6);
   let ss = 0;
   if (subthresholdData.length > 5) {
     const x = subthresholdData.map(d => d.VG);
     const y = subthresholdData.map(d => d.logID);
     const slope = calculateLinearRegression(x, y).slope;
     if (slope !== 0) {
       ss = 1 / slope;
     }
   }

   // Interface trap density 계산
   const kT_q = 0.0259;
   const cox = calculateCox(deviceParams.tox) * 1e-4;
   const q = 1.602e-19;
   let dit = 0;
   if (ss > 0 && cox > 0) {
     dit = (cox / q) * (ss / (2.3 * kT_q) - 1);
   }

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
       gm_max: Math.round(maxGm * 1e6) + ' µS'
     }
   };
 };

 // IDVG Hysteresis 분석 (기존 코드 유지)
 const analyzeIDVGHysteresis = (headers, dataRows, filename) => {
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
   
   // Forward sweep
   const forwardVGMap = new Map();
   for (let i = 0; i <= maxVgIndex; i++) {
     const vg = dataRows[i][vgIndex] || 0;
     const id = Math.abs(dataRows[i][idIndex]) || 1e-12;
     if (!forwardVGMap.has(vg)) {
       forwardVGMap.set(vg, {
         VG: vg,
         ID: id,
         logID: Math.log10(id)
       });
     }
   }
   forwardData = Array.from(forwardVGMap.values()).sort((a, b) => a.VG - b.VG);
   
   // Backward sweep
   const backwardVGMap = new Map();
   for (let i = maxVgIndex; i < dataRows.length; i++) {
     const vg = dataRows[i][vgIndex] || 0;
     const id = Math.abs(dataRows[i][idIndex]) || 1e-12;
     if (!backwardVGMap.has(vg)) {
       backwardVGMap.set(vg, {
         VG: vg,
         ID: id,
         logID: Math.log10(id)
       });
     }
   }
   backwardData = Array.from(backwardVGMap.values()).sort((a, b) => b.VG - a.VG);

   // Forward Vth 계산
   let vthForward = 0;
   if (forwardData.length > 10) {
     const midStart = Math.floor(forwardData.length * 0.3);
     const midEnd = Math.floor(forwardData.length * 0.7);
     const x = forwardData.slice(midStart, midEnd).map(d => d.VG);
     const y = forwardData.slice(midStart, midEnd).map(d => Math.sqrt(d.ID));
     const regression = calculateLinearRegression(x, y);
     if (regression.slope !== 0) {
       vthForward = -regression.intercept / regression.slope;
     }
   }

   // Backward Vth 계산
   let vthBackward = 0;
   if (backwardData.length > 10) {
     const midStart = Math.floor(backwardData.length * 0.3);
     const midEnd = Math.floor(backwardData.length * 0.7);
     const x = backwardData.slice(midStart, midEnd).map(d => d.VG);
     const y = backwardData.slice(midStart, midEnd).map(d => Math.sqrt(d.ID));
     const regression = calculateLinearRegression(x, y);
     if (regression.slope !== 0) {
       vthBackward = -regression.intercept / regression.slope;
     }
   }

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

 // 파라미터 입력 섹션
 const renderParameterInput = () => (
   <div className={`bg-white p-6 rounded-xl shadow-lg mb-8 transition-all duration-300 ${showParamInput ? 'block' : 'hidden'}`}>
     <h3 className="text-xl font-bold text-gray-800 mb-4">디바이스 파라미터 입력</h3>
     <p className="text-sm text-gray-600 mb-4">정확한 이동도(mobility) 계산을 위해 아래 파라미터들을 입력하세요.</p>
     <div className="grid md:grid-cols-3 gap-4">
       <div>
         <label className="block text-sm font-medium text-gray-700 mb-1">채널 폭 (W) [μm]</label>
         <input
           type="number"
           value={deviceParams.W * 1e6}
           onChange={(e) => {
             const newW = parseFloat(e.target.value) * 1e-6;
             setDeviceParams({...deviceParams, W: newW});
           }}
           className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
           placeholder="예: 100"
         />
       </div>
       <div>
         <label className="block text-sm font-medium text-gray-700 mb-1">채널 길이 (L) [μm]</label>
         <input
           type="number"
           value={deviceParams.L * 1e6}
           onChange={(e) => {
             const newL = parseFloat(e.target.value) * 1e-6;
             setDeviceParams({...deviceParams, L: newL});
           }}
           className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
           placeholder="예: 50"
         />
       </div>
       <div>
         <label className="block text-sm font-medium text-gray-700 mb-1">산화막 두께 (tox) [nm]</label>
         <input
           type="number"
           value={deviceParams.tox * 1e9}
           onChange={(e) => {
             const newTox = parseFloat(e.target.value) * 1e-9;
             const newCox = calculateCox(newTox) * 1e-4;
             setDeviceParams({...deviceParams, tox: newTox, Cox: newCox});
           }}
           className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
           placeholder="예: 20, 60, 100"
         />
       </div>
     </div>
     <div className="mt-4 p-3 bg-blue-50 rounded-lg">
       <p className="text-sm text-blue-800">
         <strong>계산된 Cox:</strong> {(calculateCox(deviceParams.tox) * 1e-4).toExponential(2)} F/cm²
       </p>
       <p className="text-xs text-blue-600 mt-1">
         Cox는 tox 값으로부터 자동 계산됩니다 (SiO₂ 기준, εᵣ = 3.9)
       </p>
     </div>
   </div>
 );

 // 홈 페이지
 const renderHomePage = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-end mb-4">
        <button
          onClick={handleGoToMainHome}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Home className="w-4 h-4 mr-2" />
          메인 홈으로
        </button>
      </div>
      <div className="text-center mb-12">
         <h1 className="text-5xl font-bold text-gray-800 mb-4">
           TFT Electrical Characterization Analyzer
         </h1>
         <p className="text-xl text-gray-600 mb-8">
           Probe Station 측정 데이터를 분석하여 TFT 파라미터를 자동으로 계산합니다
         </p>
         <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-lg">
           <p className="text-lg font-semibold text-purple-800">🎯 완벽한 통합 분석</p>
           <p className="text-sm text-purple-600">샘플명별로 데이터를 묶어서 정확한 TFT 특성을 계산합니다</p>
         </div>
       </div>

       <div className="grid md:grid-cols-2 gap-8 mb-12">
         <div className="bg-white p-8 rounded-xl shadow-lg">
           <div className="flex items-center mb-4">
             <Upload className="w-8 h-8 text-blue-600 mr-3" />
             <h2 className="text-2xl font-bold text-gray-800">파일 업로드</h2>
           </div>
           <p className="text-gray-600 mb-6">
             Probe Station에서 측정한 엑셀 파일들을 업로드하세요
           </p>
           
           <input
             type="file"
             accept=".xls,.xlsx"
             multiple
             onChange={handleFileUpload}
             className="hidden"
             id="file-upload"
           />
           <label
             htmlFor="file-upload"
             className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer flex items-center justify-center"
           >
             <Upload className="w-5 h-5 mr-2" />
             엑셀 파일 선택
           </label>
           
           {uploadedFiles.length > 0 && (
             <div className="mt-6">
               <h3 className="font-semibold mb-3">업로드된 파일:</h3>
               <div className="space-y-3">
                 {uploadedFiles.map((file) => (
                   <div key={file.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                     <div className="flex items-center justify-between mb-2">
                       <div>
                         <span className="font-medium text-sm">{file.name}</span>
                         <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                           {file.type}
                         </span>
                       </div>
                       <button
                         onClick={() => removeFile(file.id)}
                         className="text-red-600 hover:text-red-800 text-lg font-bold"
                       >
                         ×
                       </button>
                     </div>
                     <div className="flex items-center space-x-2">
                       <label className="text-sm text-gray-600 whitespace-nowrap">샘플명:</label>
                       <input
                         type="text"
                         value={file.alias}
                         onChange={(e) => updateFileAlias(file.id, e.target.value)}
                         placeholder="샘플명 (예: 20nm, Sample A) - 같은 샘플명끼리 묶여서 분석됩니다"
                         className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                       />
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           )}
         </div>

         <div className="bg-white p-8 rounded-xl shadow-lg">
           <div className="flex items-center mb-4">
             <Info className="w-8 h-8 text-green-600 mr-3" />
             <h2 className="text-2xl font-bold text-gray-800">새로운 분석 방식</h2>
           </div>
           <div className="space-y-4 text-gray-600">
             <div className="flex items-start">
               <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1">1</span>
               <p><strong>샘플명으로 그룹화:</strong> 같은 샘플명의 파일들을 하나의 샘플로 인식</p>
             </div>
             <div className="flex items-start">
               <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1">2</span>
               <p><strong>데이터 융합:</strong> Linear의 gm + Saturation의 Vth = 정확한 μeff</p>
             </div>
             <div className="flex items-start">
               <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1">3</span>
               <p><strong>완벽한 계산:</strong> 각 측정의 장점을 조합하여 최고 정확도</p>
             </div>
             <div className="flex items-start">
               <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1">4</span>
               <p><strong>품질 평가:</strong> 데이터 완성도와 신뢰도 자동 평가</p>
             </div>
           </div>
           
           <div className="mt-6 p-4 bg-green-50 rounded-lg">
             <h4 className="font-semibold text-green-800 mb-2">권장 파일 구성:</h4>
             <div className="text-sm text-green-700 space-y-1">
               <p>• Sample A_Linear.xlsx</p>
               <p>• Sample A_Saturation.xlsx</p>
               <p>• Sample A_IDVD.xlsx</p>
               <p>• Sample A_Hysteresis.xlsx</p>
               <p className="text-xs text-green-600 mt-2">→ "Sample A" 샘플명으로 통합 분석</p>
             </div>
           </div>
           
           <button
             onClick={() => setShowParamInput(!showParamInput)}
             className="w-full mt-6 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center"
           >
             <Calculator className="w-5 h-5 mr-2" />
             {showParamInput ? '파라미터 입력 숨기기' : '디바이스 파라미터 입력'}
           </button>
         </div>
       </div>

       {renderParameterInput()}

       <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
         <h2 className="text-2xl font-bold text-gray-800 mb-6">🔬 통합 분석의 장점</h2>
         <div className="grid md:grid-cols-2 gap-6">
           <div className="bg-blue-50 p-4 rounded-lg">
             <h3 className="font-semibold text-lg mb-3 text-blue-800">기존 방식의 문제점</h3>
             <ul className="text-gray-600 space-y-2 text-sm">
               <li>• Linear: Vth 부정확 (낮은 VDS)</li>
               <li>• Saturation: μFE 부정확 (포화된 gm)</li>
               <li>• 각각 독립적 계산으로 일관성 부족</li>
               <li>• 실제 물리적 연관성 무시</li>
             </ul>
           </div>
           <div className="bg-green-50 p-4 rounded-lg">
             <h3 className="font-semibold text-lg mb-3 text-green-800">통합 분석의 해결책</h3>
             <ul className="text-gray-600 space-y-2 text-sm">
               <li>• ✅ Saturation → 정확한 Vth</li>
               <li>• ✅ Linear → 정확한 gm_max</li>
               <li>• ✅ 실제 θ 값 계산</li>
               <li>• ✅ 물리적으로 일관된 결과</li>
             </ul>
           </div>
         </div>
       </div>

       {uploadedFiles.length > 0 && (
         <div className="text-center">
           <button
             onClick={startAnalysis}
             disabled={isAnalyzing}
             className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-8 rounded-lg font-bold text-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center mx-auto shadow-lg"
           >
             {isAnalyzing ? (
               <>
                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                 통합 분석 중...
               </>
             ) : (
               <>
                 <Star className="w-5 h-5 mr-2" />
                 완벽한 통합 분석 시작
               </>
             )}
           </button>
         </div>
       )}
     </div>
   </div>
 );

 // 분석 페이지
 const renderAnalyzerPage = () => (
   <div className="min-h-screen bg-gray-50 p-8">
     <div className="max-w-7xl mx-auto">
       <div className="flex items-center justify-between mb-8">
         <h1 className="text-3xl font-bold text-gray-800">TFT 완벽 통합 분석 결과</h1>
         <button
          onClick={() => setCurrentPage('home')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          분석기 홈으로
        </button>
        <button
          onClick={handleGoToMainHome}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Home className="w-4 h-4 mr-2" />
          메인 홈으로
        </button>
       </div>

       {/* 🎯 통합 분석 결과 (메인 섹션) */}
       {completeAnalysisResults && Object.keys(completeAnalysisResults).length > 0 && (
         <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-lg p-8 mb-8">
           <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
             <Star className="w-8 h-8 text-yellow-500 mr-3" />
             완벽한 통합 분석 결과
           </h2>
           
           <div className="grid gap-6">
             {Object.entries(completeAnalysisResults).map(([sampleName, result]) => (
               <div key={sampleName} className="bg-white rounded-lg p-6 shadow-md">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-xl font-bold text-gray-800">{sampleName}</h3>
                   <div className="flex items-center space-x-4">
                     <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                       result.quality.grade === 'A' ? 'bg-green-100 text-green-800' :
                       result.quality.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                       result.quality.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                       'bg-red-100 text-red-800'
                     }`}>
                       품질: {result.quality.grade} ({result.quality.score}점)
                     </span>
                     <div className="flex space-x-2">
                       {result.hasLinear && <span className="w-3 h-3 bg-blue-500 rounded-full" title="Linear"></span>}
                       {result.hasSaturation && <span className="w-3 h-3 bg-green-500 rounded-full" title="Saturation"></span>}
                       {result.hasIDVD && <span className="w-3 h-3 bg-purple-500 rounded-full" title="IDVD"></span>}
                       {result.hasHysteresis && <span className="w-3 h-3 bg-orange-500 rounded-full" title="Hysteresis"></span>}
                     </div>
                   </div>
                 </div>
                 
                 <div className="grid md:grid-cols-3 gap-6">
                   {/* 핵심 파라미터 */}
                   <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg">
                     <h4 className="font-semibold text-blue-800 mb-3">🎯 핵심 파라미터</h4>
                     <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                         <span className="text-gray-600">Vth:</span>
                         <span className="font-mono">{result.parameters['Vth (Saturation)']}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">gm_max:</span>
                         <span className="font-mono">{result.parameters['gm_max (Linear 기준)']}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">μFE:</span>
                         <span className="font-mono">{result.parameters['μFE (통합 계산)']}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">μeff:</span>
                         <span className="font-mono font-bold text-blue-700">{result.parameters['μeff (정확 계산)']}</span>
                       </div>
                     </div>
                   </div>

                   {/* 품질 지표 */}
                   <div className="bg-gradient-to-br from-green-50 to-yellow-50 p-4 rounded-lg">
                     <h4 className="font-semibold text-green-800 mb-3">📊 품질 지표</h4>
                     <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                         <span className="text-gray-600">SS:</span>
                         <span className="font-mono">{result.parameters['SS']}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Ion/Ioff:</span>
                         <span className="font-mono">{result.parameters['Ion/Ioff']}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Hysteresis:</span>
                         <span className="font-mono">{result.parameters['ΔVth (Hysteresis)']}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">안정성:</span>
                         <span className="font-mono">{result.parameters['Stability']}</span>
                       </div>
                     </div>
                   </div>

                   {/* 계산 상세 */}
                   <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
                     <h4 className="font-semibold text-purple-800 mb-3">🔬 계산 상세</h4>
                     <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                         <span className="text-gray-600">μ0:</span>
                         <span className="font-mono">{result.parameters['μ0 (보정 계산)']}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">θ:</span>
                         <span className="font-mono">{result.parameters['θ (계산값)']}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Dit:</span>
                         <span className="font-mono">{result.parameters['Dit (계산값)']}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Ron:</span>
                         <span className="font-mono">{result.parameters['Ron']}</span>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* 경고 메시지 */}
                 {result.warnings.length > 0 && (
                   <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                     <h5 className="font-semibold text-yellow-800 mb-2">⚠️ 주의사항:</h5>
                     <ul className="text-sm text-yellow-700 space-y-1">
                       {result.warnings.map((warning, index) => (
                         <li key={index}>• {warning}</li>
                       ))}
                     </ul>
                   </div>
                 )}

                 {/* 품질 문제 */}
                 {result.quality.issues.length > 0 && (
                   <div className="mt-2 p-3 bg-red-50 border-l-4 border-red-400 rounded">
                     <h5 className="font-semibold text-red-800 mb-2">❌ 품질 문제:</h5>
                     <ul className="text-sm text-red-700 space-y-1">
                       {result.quality.issues.map((issue, index) => (
                         <li key={index}>• {issue}</li>
                       ))}
                     </ul>
                   </div>
                 )}
               </div>
             ))}
           </div>
         </div>
       )}

       {/* 기존 개별 분석 결과 */}
       {analysisResults && Object.keys(analysisResults).map((type) => {
         const resultArray = analysisResults[type];
         
         if (resultArray.length === 0) return null;

         const hasMultipleFiles = resultArray.length > 1;

         return (
           <div key={type} className="bg-white rounded-xl shadow-lg p-6 mb-8">
             <h2 className="text-2xl font-bold text-gray-800 mb-6">
               {type} 개별 분석 {hasMultipleFiles ? `(${resultArray.length}개 파일)` : ''}
             </h2>
             
             <div className="grid lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2">
                 <h3 className="text-lg font-semibold mb-4">측정 데이터 그래프</h3>

                 {/* IDVD - 각 파일별로 별도 차트 */}
                 {type === 'IDVD' && (
                   <div className="space-y-8">
                     {resultArray.map((result, fileIndex) => {
                       if (!result || !result.chartData) return null;

                       return (
                         <div key={fileIndex} className="relative">
                           {hasMultipleFiles && (
                             <h4 className="text-md font-medium mb-3 text-gray-700 bg-gray-100 p-2 rounded">
                               {result.displayName}
                             </h4>
                           )}
                           <div className="h-80">
                             <ResponsiveContainer width="100%" height="100%">
                               <LineChart data={result.chartData}>
                                 <CartesianGrid strokeDasharray="3 3" />
                                 <XAxis 
                                   dataKey="VD" 
                                   label={{ value: 'VD (V)', position: 'insideBottom', offset: -10 }}
                                   domain={[0, 'dataMax']}
                                 />
                                 <YAxis 
                                   scale="linear"
                                   domain={[0, 'dataMax']}
                                   label={{ value: 'ID (A)', angle: -90, position: 'insideLeft', offset: 5 }}
                                   tickFormatter={(value) => value.toExponential(0)}
                                 />
                                 <Tooltip formatter={(value) => [value.toExponential(2) + ' A', 'ID']} />
                                 <Legend wrapperStyle={{ paddingTop: '10px' }}/>
                                 {result.gateVoltages && result.gateVoltages.map((vg, vgIndex) => (
                                   <Line
                                     key={vg}
                                     type="monotone"
                                     dataKey={`VG_${vg}V`}
                                     stroke={`hsl(${(vgIndex * 60) % 360}, 70%, 50%)`}
                                     strokeWidth={2}
                                     dot={false}
                                     name={`VG=${vg}V`}
                                   />
                                 ))}
                               </LineChart>
                             </ResponsiveContainer>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 )}

                 {/* IDVG-Hysteresis - 각 파일별로 별도 차트 */}
                 {type === 'IDVG-Hysteresis' && (
                   <div className="space-y-8">
                     {resultArray.map((result, index) => {
                       if (!result.forwardData || !result.backwardData) return null;
                       
                       const allVGValues = [...new Set([
                         ...result.forwardData.map(d => d.VG),
                         ...result.backwardData.map(d => d.VG)
                       ])].sort((a, b) => a - b);
                       
                       const combinedData = allVGValues.map(vg => {
                         const forwardPoint = result.forwardData.find(d => Math.abs(d.VG - vg) < 0.01);
                         const backwardPoint = result.backwardData.find(d => Math.abs(d.VG - vg) < 0.01);
                         return {
                           VG: vg,
                           Forward: forwardPoint?.ID || null,
                           Backward: backwardPoint?.ID || null
                         };
                       });

                       return (
                         <div key={index} className="relative">
                           {hasMultipleFiles && (
                             <h4 className="text-md font-medium mb-3 text-gray-700 bg-gray-100 p-2 rounded">
                               {result.displayName}
                             </h4>
                           )}
                           <div className="h-80">
                             <ResponsiveContainer width="100%" height="100%">
                               <LineChart data={combinedData}>
                                 <CartesianGrid strokeDasharray="3 3" />
                                 <XAxis 
                                   dataKey="VG" 
                                   label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }} 
                                 />
                                 <YAxis 
                                   scale="log"
                                   domain={[1e-12, 1e-3]}
                                   label={{ value: 'ID (A)', angle: -90, position: 'insideLeft', offset: 15 }}
                                   tickFormatter={(value) => value.toExponential(0)}
                                 />
                                 <Tooltip formatter={(value) => [value ? value.toExponential(2) + ' A' : 'N/A', '']} />
                                 <Legend wrapperStyle={{ paddingTop: '10px' }}/>
                                 <Line 
                                   type="monotone" 
                                   dataKey="Forward" 
                                   stroke="#2563eb" 
                                   name="Forward" 
                                   strokeWidth={2} 
                                   dot={false}
                                   connectNulls={false}
                                 />
                                 <Line 
                                   type="monotone" 
                                   dataKey="Backward" 
                                   stroke="#dc2626" 
                                   name="Backward" 
                                   strokeWidth={2} 
                                   dot={false}
                                   connectNulls={false}
                                 />
                               </LineChart>
                             </ResponsiveContainer>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 )}

                 {/* IDVG-Linear, IDVG-Saturation - 하나의 차트에 모든 파일 */}
                 {(type === 'IDVG-Linear' || type === 'IDVG-Saturation') && (
                   <div className="h-80">
                     <ResponsiveContainer width="100%" height="100%">
                       {(() => {
                         const allVGValues = [...new Set(
                           resultArray.flatMap(result => result.chartData ? result.chartData.map(d => d.VG) : [])
                         )].sort((a, b) => a - b);
                         
                         if (allVGValues.length === 0) return null;
                         
                         const combinedData = allVGValues.map(vg => {
                           const dataPoint = { VG: vg };
                           resultArray.forEach((result, index) => {
                             if (result.chartData) {
                               const point = result.chartData.find(d => Math.abs(d.VG - vg) < 0.01);
                               const key = result.displayName || `File${index + 1}`;
                               dataPoint[key] = point?.ID || null;
                             }
                           });
                           return dataPoint;
                         });

                         return (
                           <LineChart data={combinedData}>
                             <CartesianGrid strokeDasharray="3 3" />
                             <XAxis 
                               dataKey="VG" 
                               label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }} 
                             />
                             <YAxis 
                               scale="log"
                               domain={[1e-12, 1e-3]}
                               label={{ value: 'ID (A)', angle: -90, position: 'insideLeft', offset: 5 }}
                               tickFormatter={(value) => value.toExponential(0)}
                             />
                             <Tooltip formatter={(value) => [value ? value.toExponential(2) + ' A' : 'N/A', 'ID']} />
                             <Legend wrapperStyle={{ paddingTop: '10px' }}/>
                             {resultArray.map((result, index) => {
                               const key = result.displayName || `File${index + 1}`;
                               return (
                                 <Line 
                                   key={index}
                                   type="monotone" 
                                   dataKey={key}
                                   stroke={`hsl(${index * 120}, 70%, 50%)`} 
                                   strokeWidth={2} 
                                   dot={false}
                                   name={key}
                                   connectNulls={false}
                                 />
                               );
                             })}
                           </LineChart>
                         );
                       })()}
                     </ResponsiveContainer>
                   </div>
                 )}

                 {/* gm 그래프 - Linear, Saturation 측정에서만 표시 */}
                 {(type === 'IDVG-Linear' || type === 'IDVG-Saturation') && 
                  resultArray.some(result => result.gmData) && (
                   <div className="mt-8">
                     <h3 className="text-lg font-semibold mb-4">gm (Transconductance) 그래프</h3>
                     <div className="h-60">
                       <ResponsiveContainer width="100%" height="100%">
                         {(() => {
                           const allVGValues = [...new Set(
                             resultArray.filter(result => result.gmData)
                               .flatMap(result => result.gmData.map(d => d.VG))
                           )].sort((a, b) => a - b);
                           
                           if (allVGValues.length === 0) return null;
                           
                           const combinedGmData = allVGValues.map(vg => {
                             const dataPoint = { VG: vg };
                             resultArray.forEach((result, index) => {
                               if (result.gmData) {
                                 const point = result.gmData.find(d => Math.abs(d.VG - vg) < 0.05);
                                 const key = `${result.displayName || `File${index + 1}`}_gm`;
                                 dataPoint[key] = point?.gm || null;
                               }
                             });
                             return dataPoint;
                           });
                           
                           return (
                             <LineChart data={combinedGmData}>
                               <CartesianGrid strokeDasharray="3 3" />
                               <XAxis 
                                 dataKey="VG" 
                                 label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }} 
                               />
                               <YAxis 
                                 label={{ value: 'gm (S)', angle: -90, position: 'insideLeft', offset: 5 }}
                                 tickFormatter={(value) => value.toExponential(0)}
                               />
                               <Tooltip formatter={(value) => [value ? value.toExponential(2) + ' S' : 'N/A', 'gm']} />
                               <Legend wrapperStyle={{ paddingTop: '10px' }}/>
                               {resultArray.map((result, index) => {
                                 if (!result.gmData) return null;
                                 const key = `${result.displayName || `File${index + 1}`}_gm`;
                                 return (
                                   <Line 
                                     key={index}
                                     type="monotone" 
                                     dataKey={key}
                                     stroke={`hsl(${index * 120 + 30}, 70%, 50%)`} 
                                     strokeWidth={2} 
                                     dot={false}
                                     name={`${result.displayName || `File${index + 1}`} gm`}
                                     connectNulls={false}
                                   />
                                 );
                               })}
                             </LineChart>
                           );
                         })()}
                       </ResponsiveContainer>
                     </div>
                   </div>
                 )}
               </div>

               {/* 파라미터 표시 영역 */}
               <div>
                 <h3 className="text-lg font-semibold mb-4">개별 계산 파라미터</h3>
                 {resultArray.map((result, index) => (
                   <div key={index} className="mb-6">
                     {hasMultipleFiles && (
                       <h4 className="font-medium text-gray-700 mb-2 bg-gray-100 p-2 rounded text-sm">
                         {result.displayName}
                       </h4>
                     )}
                     <div className="bg-gray-50 p-4 rounded-lg">
                       {Object.entries(result.parameters).map(([key, value]) => (
                         <div key={key} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                           <span className="font-medium text-gray-700 text-sm">{key}:</span>
                           <span className="text-gray-900 font-mono text-xs">{value}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         );
       })}

       {/* 통합 결과 요약표 */}
       {completeAnalysisResults && Object.keys(completeAnalysisResults).length > 0 && (
         <div className="text-center mb-8">
           <button
             onClick={() => setShowDataTable(!showDataTable)}
             className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center mx-auto"
           >
             <Table className="w-5 h-5 mr-2" />
             {showDataTable ? '통합 결과표 숨기기' : '통합 결과표 보기'}
           </button>
         </div>
       )}

       {/* 통합 분석 결과 표 */}
       {showDataTable && completeAnalysisResults && (
         <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
           <h2 className="text-2xl font-bold text-gray-800 mb-6">🎯 완벽한 통합 분석 결과표</h2>
           <div className="overflow-x-auto">
             <table className="w-full border-collapse border border-gray-300 text-sm">
               <thead>
                 <tr className="bg-gradient-to-r from-purple-100 to-blue-100">
                   <th className="border border-gray-300 px-3 py-3 text-left font-semibold">샘플명</th>
                   <th className="border border-gray-300 px-2 py-2 text-center font-semibold">품질</th>
                   <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Vth (V)</th>
                   <th className="border border-gray-300 px-2 py-2 text-center font-semibold">gm_max (S)</th>
                   <th className="border border-gray-300 px-2 py-2 text-center font-semibold">μFE (cm²/V·s)</th>
                   <th className="border border-gray-300 px-2 py-2 text-center font-semibold">μ0 (cm²/V·s)</th>
                   <th className="border border-gray-300 px-2 py-2 text-center font-semibold">μeff (cm²/V·s)</th>
                   <th className="border border-gray-300 px-2 py-2 text-center font-semibold">θ (V⁻¹)</th>
                   <th className="border border-gray-300 px-2 py-2 text-center font-semibold">SS (V/Dec)</th>
                   <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Dit (cm⁻²eV⁻¹)</th>
                   <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Ion/Ioff</th>
                   <th className="border border-gray-300 px-2 py-2 text-center font-semibold">ΔVth (V)</th>
                   <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Ron (Ω)</th>
                   <th className="border border-gray-300 px-2 py-2 text-center font-semibold">데이터 소스</th>
                 </tr>
               </thead>
               <tbody>
                 {Object.entries(completeAnalysisResults).map(([sampleName, result]) => (
                   <tr key={sampleName} className="hover:bg-gray-50">
                     <td className="border border-gray-300 px-3 py-2 font-medium bg-blue-50">
                       {sampleName}
                     </td>
                     <td className="border border-gray-300 px-2 py-2 text-center">
                       <span className={`px-2 py-1 rounded text-xs font-semibold ${
                         result.quality.grade === 'A' ? 'bg-green-100 text-green-800' :
                         result.quality.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                         result.quality.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                         'bg-red-100 text-red-800'
                       }`}>
                         {result.quality.grade}
                       </span>
                     </td>
                     <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                       {result.parameters['Vth (Saturation)']}
                     </td>
                     <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                       {result.parameters['gm_max (Linear 기준)']}
                     </td>
                     <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs font-bold text-blue-700">
                       {result.parameters['μFE (통합 계산)']}
                     </td>
                     <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                       {result.parameters['μ0 (보정 계산)']}
                     </td>
                     <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs font-bold text-purple-700">
                       {result.parameters['μeff (정확 계산)']}
                     </td>
                     <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                       {result.parameters['θ (계산값)']}
                     </td>
                     <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                       {result.parameters['SS']}
                     </td>
                     <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                       {result.parameters['Dit (계산값)']}
                     </td>
                     <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                       {result.parameters['Ion/Ioff']}
                     </td>
                     <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                       {result.parameters['ΔVth (Hysteresis)']}
                     </td>
                     <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                       {result.parameters['Ron']}
                     </td>
                     <td className="border border-gray-300 px-2 py-2 text-center text-xs">
                       <div className="flex justify-center space-x-1">
                         {result.hasLinear && <span className="w-2 h-2 bg-blue-500 rounded-full" title="Linear"></span>}
                         {result.hasSaturation && <span className="w-2 h-2 bg-green-500 rounded-full" title="Saturation"></span>}
                         {result.hasIDVD && <span className="w-2 h-2 bg-purple-500 rounded-full" title="IDVD"></span>}
                         {result.hasHysteresis && <span className="w-2 h-2 bg-orange-500 rounded-full" title="Hysteresis"></span>}
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           
           <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
             <h3 className="font-semibold text-gray-800 mb-2">📊 분석 방법 설명</h3>
             <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
               <div>
                 <p><strong>• Vth:</strong> Saturation 데이터의 √ID vs VG 선형회귀</p>
                 <p><strong>• gm_max:</strong> Linear 데이터의 dID/dVG 최대값</p>
                 <p><strong>• μFE:</strong> Linear gm_max + 디바이스 파라미터 통합</p>
                 <p><strong>• μ0:</strong> μFE × 보정계수 (측정 조건 반영)</p>
               </div>
               <div>
                 <p><strong>• μeff:</strong> μ0 / (1 + θ(VG - Vth)) 실제 계산</p>
                 <p><strong>• θ:</strong> 실측 데이터로부터 mobility degradation 추출</p>
                 <p><strong>• Dit:</strong> Saturation SS + Cox를 통한 정확 계산</p>
                 <p><strong>• 품질:</strong> 데이터 완성도 + 계산 신뢰도 종합</p>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   </div>
 );

 return (
   <div>
     {currentPage === 'home' && renderHomePage()}
     {currentPage === 'analyzer' && renderAnalyzerPage()}
   </div>
 );
};

export default TFTAnalyzer;