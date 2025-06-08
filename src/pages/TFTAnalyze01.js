import React, { useState } from 'react';
import { Upload, FileText, BarChart3, Calculator, Info, Play, Home, ArrowLeft, Table } from 'lucide-react';
import * as XLSX from 'xlsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TFTAnalyzer = ({ onNavigateHome, onNavigateBack }) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisResults, setAnalysisResults] = useState(null);
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
      alias: '' // 사용자 정의 별명
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

  // 파일 별명 업데이트
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

    setIsAnalyzing(true);
    try {
      const results = await analyzeFiles(uploadedFiles);
      setAnalysisResults(results);
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
          alias: fileInfo.alias || fileInfo.name, // 별명이 있으면 별명, 없으면 파일명
          displayName: fileInfo.alias || fileInfo.name.replace(/\.[^/.]+$/, ""), // 확장자 제거
          rawData: jsonData
        });
      } catch (error) {
        console.error(`${fileInfo.name} 파일 분석 실패:`, error);
      }
    }
    
    return results;
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

  // IDVD 분석
  const analyzeIDVD = (headers, dataRows, filename) => {
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

    // Ron 계산
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

  // IDVG Linear 분석
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

    let mu0 = 0;
    if (muFE > 0 && maxGmIndex > 0 && gmData[maxGmIndex-1]) {
      mu0 = muFE * 1.2;
    }

    let muEff = 0;
    if (mu0 > 0 && maxGmIndex < chartData.length) {
      const theta = 0.1;
      const vth = 2.0;
      const vgValue = chartData[maxGmIndex] ? chartData[maxGmIndex].VG : 0;
      muEff = mu0 / (1 + theta * Math.max(0, vgValue - vth));
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
        μFE: muFE > 0 ? muFE.toExponential(2) + ' cm²/V·s' : 'N/A (파라미터 입력 필요)',
        μ0: mu0 > 0 ? mu0.toExponential(2) + ' cm²/V·s' : 'N/A (파라미터 입력 필요)',
        μeff: muEff > 0 ? muEff.toExponential(2) + ' cm²/V·s' : 'N/A (파라미터 입력 필요)'
      }
    };
  };

  // IDVG Saturation 분석
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

  // IDVG Hysteresis 분석
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
            TFT 전기적 특성 분석기
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Probe Station 측정 데이터를 분석하여 TFT 파라미터를 자동으로 계산합니다
          </p>
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
                        <label className="text-sm text-gray-600 whitespace-nowrap">별명:</label>
                        <input
                          type="text"
                          value={file.alias}
                          onChange={(e) => updateFileAlias(file.id, e.target.value)}
                          placeholder="그래프에 표시될 이름 (예: 20nm, Sample A)"
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
              <h2 className="text-2xl font-bold text-gray-800">사용방법</h2>
            </div>
            <div className="space-y-4 text-gray-600">
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1">1</span>
                <p>제목에 IDVD, IDVG-Lin, IDVG-Sat, IDVG-Hys 가 포함된 파일을 업로드하세요</p>
              </div>
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1">2</span>
                <p>각 파일에 별명을 입력하여 그래프에서 쉽게 구분하세요</p>
              </div>
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1">3</span>
                <p>정확한 계산을 위해 디바이스 파라미터를 입력하세요</p>
              </div>
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1">4</span>
                <p>분석 시작 버튼을 클릭하여 자동 분석을 시작하세요</p>
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">측정 파라미터 정보</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer" 
                 onClick={() => setShowFormulaInfo(showFormulaInfo === 'linear' ? '' : 'linear')}>
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                IDVG-Linear 측정 
                <span className="ml-2 text-blue-600">📋</span>
              </h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• gm (Transconductance)</li>
                <li>• μFE (Field-effect mobility)</li>
                <li>• μ0, μeff (Mobility parameters)</li>
                <li>• Ion, Ioff (On/Off current)</li>
                <li>• VDS: 파일에서 자동 감지 (일반적으로 0.1V)</li>
              </ul>
              {showFormulaInfo === 'linear' && (
                <div className="mt-4 p-3 bg-white rounded border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-800 mb-2">사용된 수식:</h4>
                  <div className="text-xs space-y-1">
                    <p><strong>gm:</strong> gm = dID/dVG (미분으로 계산)</p>
                    <p><strong>μFE:</strong> μFE = (L / (W × Cox × VDS)) × gm_max</p>
                    <p><strong>μ0:</strong> Y-function 접근법 (μ0 ≈ μFE × 1.2)</p>
                    <p><strong>μeff:</strong> μeff = μ0 / (1 + θ(VG - Vth))</p>
                    <p><strong>Ion/Ioff:</strong> 최대전류 / 최소전류</p>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-green-50 p-4 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
                 onClick={() => setShowFormulaInfo(showFormulaInfo === 'saturation' ? '' : 'saturation')}>
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                IDVG-Saturation 측정
                <span className="ml-2 text-green-600">📋</span>
              </h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Vth (Threshold voltage)</li>
                <li>• SS (Subthreshold swing)</li>
                <li>• Dit (Interface trap density)</li>
                <li>• ID sat (Saturation current)</li>
                <li>• VDS: 파일에서 자동 감지 (일반적으로 20V)</li>
              </ul>
              {showFormulaInfo === 'saturation' && (
                <div className="mt-4 p-3 bg-white rounded border-l-4 border-green-500">
                  <h4 className="font-semibold text-green-800 mb-2">사용된 수식:</h4>
                  <div className="text-xs space-y-1">
                    <p><strong>Vth:</strong> gm_max 기준 √ID vs VG 선형외삽법</p>
                    <p><strong>SS:</strong> SS = (d(log₁₀ID)/dVG)⁻¹</p>
                    <p><strong>Dit:</strong> Dit = (Cox/q) × (SS/(2.3×kT/q) - 1)</p>
                    <p><strong>ID_sat:</strong> 포화영역 최대전류</p>
                    <p><strong>gm_max:</strong> gm = dID/dVG의 최대값</p>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer"
                 onClick={() => setShowFormulaInfo(showFormulaInfo === 'idvd' ? '' : 'idvd')}>
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                IDVD 측정
                <span className="ml-2 text-purple-600">📋</span>
              </h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Ron (On-resistance)</li>
                <li>• 다양한 VG에서의 I-V 특성</li>
              </ul>
              {showFormulaInfo === 'idvd' && (
                <div className="mt-4 p-3 bg-white rounded border-l-4 border-purple-500">
                  <h4 className="font-semibold text-purple-800 mb-2">사용된 수식:</h4>
                  <div className="text-xs space-y-1">
                    <p><strong>Ron:</strong> Ron = VDS / ID (낮은 VD에서의 저항)</p>
                    <p><strong>I-V 특성:</strong> 각 게이트 전압별 드레인 특성</p>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-orange-50 p-4 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
                 onClick={() => setShowFormulaInfo(showFormulaInfo === 'hysteresis' ? '' : 'hysteresis')}>
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                IDVG-Hysteresis 측정
                <span className="ml-2 text-orange-600">📋</span>
              </h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Hysteresis (ΔVth)</li>
                <li>• 안정성 관련 평가</li>
                <li>• Forward/Backward sweep 비교</li>
              </ul>
              {showFormulaInfo === 'hysteresis' && (
                <div className="mt-4 p-3 bg-white rounded border-l-4 border-orange-500">
                  <h4 className="font-semibold text-orange-800 mb-2">사용된 수식:</h4>
                  <div className="text-xs space-y-1">
                    <p><strong>ΔVth:</strong> |Vth_forward - Vth_backward|</p>
                    <p><strong>Vth:</strong> √ID vs VG 선형회귀 x절편</p>
                    <p><strong>안정성:</strong> ΔVth &lt; 1V: Good, &lt; 2V: Fair, ≥ 2V: Poor</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="text-center">
            <button
              onClick={startAnalysis}
              disabled={isAnalyzing}
              className="bg-green-600 text-white py-4 px-8 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center mx-auto"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  분석 중...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  분석 시작
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
        <h1 className="text-3xl font-bold text-gray-800">TFT 분석 결과</h1>
        <div className="flex space-x-3">
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
      </div>

        {analysisResults && Object.keys(analysisResults).map((type) => {
          const resultArray = analysisResults[type];
          
          if (resultArray.length === 0) return null;

          const hasMultipleFiles = resultArray.length > 1;

          return (
            <div key={type} className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {type} 분석 {hasMultipleFiles ? `(${resultArray.length}개 파일)` : ''}
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
                  <h3 className="text-lg font-semibold mb-4">계산된 파라미터</h3>
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

        {/* 데이터 표 버튼 */}
        {analysisResults && Object.keys(analysisResults).length > 0 && (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowDataTable(!showDataTable)}
              className="bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center mx-auto"
            >
              <Table className="w-5 h-5 mr-2" />
              {showDataTable ? '표 숨기기' : '데이터 표로 보기'}
            </button>
          </div>
        )}

        {/* 데이터 표 */}
        {showDataTable && analysisResults && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">분석 결과 요약표</h2>
            <div className="overflow-x-auto">
              {(() => {
                // 샘플별로 데이터 그룹화
                const sampleGroups = {};
                
                Object.entries(analysisResults).forEach(([type, resultArray]) => {
                  resultArray.forEach(result => {
                    const sampleName = result.displayName;
                    if (!sampleGroups[sampleName]) {
                      sampleGroups[sampleName] = {};
                    }
                    sampleGroups[sampleName][type] = result.parameters;
                  });
                });

                return (
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-2 text-left font-semibold">샘플명</th>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">gm_max (S)</th>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Vth (V)</th>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">SS (V/Dec)</th>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Ron (Ω)</th>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Ion (A)</th>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Ioff (A)</th>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">On/Off ratio</th>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">μeff (cm²/V·s)</th>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">μFE (cm²/V·s)</th>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">ΔVth (V)</th>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Dit (cm⁻²eV⁻¹)</th>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">ID_sat (A)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(sampleGroups).map(([sampleName, sampleData]) => {
                        // 각 샘플의 주요 파라미터 추출
                        const gmMax = sampleData['IDVG-Saturation']?.['gm_max'] || 
                                     sampleData['IDVG-Linear']?.['gm_max'] || 'N/A';
                        const vth = sampleData['IDVG-Saturation']?.['Vth'] || 'N/A';
                        const ss = sampleData['IDVG-Saturation']?.['SS'] || 'N/A';
                        const ron = sampleData['IDVD']?.['Ron'] || 'N/A';
                        const ion = sampleData['IDVG-Linear']?.['Ion'] || 'N/A';
                        const ioff = sampleData['IDVG-Linear']?.['Ioff'] || 'N/A';
                        const onOffRatio = sampleData['IDVG-Linear']?.['Ion/Ioff'] || 'N/A';
                        const muEff = sampleData['IDVG-Linear']?.['μeff'] || 'N/A';
                        const muFE = sampleData['IDVG-Linear']?.['μFE'] || 'N/A';
                        const deltaVth = sampleData['IDVG-Hysteresis']?.['Hysteresis (ΔVth)'] || 'N/A';
                        const dit = sampleData['IDVG-Saturation']?.['Dit'] || 'N/A';
                        const idSat = sampleData['IDVG-Saturation']?.['ID_sat'] || 'N/A';

                        return (
                          <tr key={sampleName} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-2 py-2 font-medium bg-blue-50">
                              {sampleName}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                              {gmMax}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                              {vth}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                              {ss}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                              {ron}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                              {ion}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                              {ioff}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                              {onOffRatio}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                              {muEff}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                              {muFE}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                              {deltaVth}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                              {dit}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                              {idSat}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
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