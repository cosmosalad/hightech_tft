import React, { useState } from 'react';
import { Code, Book, Eye, ChevronDown, ChevronRight, Calculator, Zap, Target, AlertTriangle, Github } from 'lucide-react';

const FormulaCodeInspector = () => {
  const [activeSection, setActiveSection] = useState('');
  const [showImplementation, setShowImplementation] = useState({});

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? '' : section);
  };

  const toggleImplementation = (formula) => {
    setShowImplementation(prev => ({
      ...prev,
      [formula]: !prev[formula]
    }));
  };

  // 🔥 실제 코드에서 사용되는 수식들 정리
  const formulaCategories = [
    {
      id: 'basic',
      title: '📊 기본 TFT 파라미터',
      description: '모든 TFT 분석의 기초가 되는 핵심 파라미터들',
      formulas: [
        {
          name: 'Cox (산화막 정전용량)',
          symbol: 'Cox',
          formula: 'Cox = (ε₀ × εᵣ) / tox',
          unit: 'F/cm²',
          description: '산화막 두께로부터 단위면적당 정전용량 계산',
          implementation: `// calculateCox 함수 (calculationUtils.js)
export const calculateCox = (tox) => {
  return (PHYSICAL_CONSTANTS.EPSILON_0 * PHYSICAL_CONSTANTS.EPSILON_R.SiO2) / tox;
};

// 사용된 상수
EPSILON_0: 8.854e-12 F/m (진공 유전율)
EPSILON_R.SiO2: 3.9 (SiO₂ 상대유전율)`,
          codeLocation: 'src/pages/analysis/calculationUtils.js',
          usedIn: ['모든 이동도 계산', 'Dit 계산']
        },
        {
          name: 'gm (Transconductance)',
          symbol: 'gm',
          formula: 'gm = ΔID / ΔVG',
          unit: 'S (지멘스)',
          description: '게이트 전압 변화에 대한 드레인 전류 변화율',
          implementation: `// calculateGm 함수 (calculationUtils.js)
export const calculateGm = (chartData, useNumericDifferentiation = true) => {
  const gmData = [];
  
  if (useNumericDifferentiation) {
    // 수치 미분: gm = ΔID / ΔVG
    for (let i = 1; i < chartData.length - 1; i++) {
      const deltaVG = chartData[i+1].VG - chartData[i-1].VG;
      const deltaID = chartData[i+1].ID - chartData[i-1].ID;
      
      if (deltaVG !== 0) {
        const gm = Math.abs(deltaID / deltaVG);
        gmData.push({ VG: chartData[i].VG, gm: gm });
      }
    }
  }
  return gmData;
};`,
          codeLocation: 'src/pages/analysis/calculationUtils.js',
          usedIn: ['Linear 분석', 'Saturation 분석', 'μFE 계산']
        }
      ]
    },
    {
      id: 'mobility',
      title: '🔬 이동도 (Mobility) 계산',
      description: 'TFT 성능의 핵심인 전하 운반자 이동도 관련 수식들',
      formulas: [
        {
          name: 'μFE (Field-Effect Mobility)',
          symbol: 'μFE',
          formula: 'μFE = L/(W×Cox×VDS) × gm,max',
          unit: 'cm²/V·s',
          description: 'Linear 측정에서 얻은 gm_max를 이용한 기본 이동도',
          implementation: `// calculateMuFE 함수 (calculationUtils.js)
export const calculateMuFE = (gm_max, deviceParams, vds) => {
  if (!gm_max || !deviceParams.W || !deviceParams.L || !vds) {
    return 0;
  }

  // PDF 수식: μFE = L/(W×Cox×VDS) × gm,max
  const cox = calculateCox(deviceParams.tox); // F/m²
  const { W, L } = deviceParams;
  
  // 직접적인 계산 (SI 단위)
  const muFE_SI = (L / (W * cox * vds)) * gm_max; // m²/V·s
  const muFE_cm2 = UNIT_CONVERSIONS.mobility_m2Vs_to_cm2Vs(muFE_SI);
  
  return muFE_cm2;
};`,
          codeLocation: 'src/pages/analysis/calculationUtils.js',
          usedIn: ['Linear 분석', '통합 분석']
        },
        {
          name: 'μ0 (Low-field Mobility)',
          symbol: 'μ0',
          formula: 'Y = A×(VG-Vth), μ0 = A²L/(Cox×VD×W)',
          unit: 'cm²/V·s',
          description: 'Y-function method를 사용한 저전계 이동도',
          implementation: `// calculateMu0UsingYFunction 함수 (calculationUtils.js)
export const calculateMu0UsingYFunction = (linearData, deviceParams, vth) => {
  // Y-function 데이터 계산
  const yFunctionData = [];
  
  for (let i = 0; i < chartData.length; i++) {
    const vgs = chartData[i].VG;
    const id = chartData[i].ID;
    const gmPoint = gmData.find(g => Math.abs(g.VG - vgs) < 0.05);
    
    if (gmPoint && gmPoint.gm > 1e-12 && vgs > vth && id > 1e-12) {
      // 🔥 PDF 수식 기준: Y = ID/√gm
      const y = id / Math.sqrt(gmPoint.gm);
      const x = vgs - vth;  // (VG - Vth)
      
      yFunctionData.push({ x: x, y: y });
    }
  }
  
  // 선형 회귀로 기울기 계산
  const regression = calculateLinearRegression(x_values, y_values);
  
  // 🔥 PDF 수식: μ0 = A²L/(Cox×VD×W)
  const A = regression.slope;
  const mu0 = (A * A * L) / (cox * vd * W) * 1e4; // cm²/V·s로 변환
  
  return { mu0, quality, r_squared };
};`,
          codeLocation: 'src/pages/analysis/calculationUtils.js',
          usedIn: ['통합 분석', 'μeff 계산']
        },
        {
          name: 'θ (Mobility Degradation Factor)',
          symbol: 'θ',
          formula: 'θ = (μ0×W×Cox×VD)/(ID×L) - 1/(VG-Vth)',
          unit: 'V⁻¹',
          description: '게이트 전압 증가에 따른 이동도 감소 계수',
          implementation: `// calculateTheta 함수 (calculationUtils.js)
export const calculateTheta = (mu0, deviceParams, chartData, gmData, vth, vds) => {
  const { W, L } = deviceParams;
  const cox = calculateCox(deviceParams.tox);
  
  // PDF 수식: θ = (μ0×W×Cox×VD)/(ID×L) - 1/(VG-Vth)
  // 조건: VG > Vth + 1V
  
  const validPoints = [];
  
  for (let i = 0; i < chartData.length; i++) {
    const point = chartData[i];
    const vg = point.VG;
    const id = point.ID;
    
    // 조건 확인: VG > Vth + 1V
    if (vg > vth + 1.0 && id > 1e-12) {
      // Xcal = 1/(VG - Vth)
      const xcal = 1 / (vg - vth);
      
      // Ycal = (μ0×W×Cox×VD)/(ID×L)
      const ycal = (mu0 * W * cox * vds) / (id * L);
      
      validPoints.push({ xcal, ycal });
    }
  }
  
  // 선형 회귀: Ycal = θ + Xcal
  const regression = calculateLinearRegression(x_values, y_values);
  
  // θ는 Y-intercept
  const theta = regression.intercept;
  
  return { theta, method: 'PDF calculation method' };
};`,
          codeLocation: 'src/pages/analysis/calculationUtils.js',
          usedIn: ['통합 분석', 'μeff 계산']
        },
        {
          name: 'μeff (Effective Mobility)',
          symbol: 'μeff',
          formula: 'μeff = μ0 / (1 + θ(VG - Vth))',
          unit: 'cm²/V·s',
          description: '실제 동작 조건에서의 유효 이동도',
          implementation: `// calculateMuEff 함수 (calculationUtils.js)
export const calculateMuEff = (mu0, theta, vg, vth) => {
  if (!mu0 || !theta || vg <= vth) {
    return 0;
  }
  
  // PDF 수식: μeff = μ0 / (1 + θ(VG - Vth))
  const muEff = mu0 / (1 + theta * (vg - vth));
  
  return muEff;
};`,
          codeLocation: 'src/pages/analysis/calculationUtils.js',
          usedIn: ['통합 분석']
        }
      ]
    },
    {
      id: 'threshold',
      title: '⚡ 문턱전압 및 스위칭 특성',
      description: 'TFT의 스위칭 특성을 결정하는 핵심 파라미터들',
      formulas: [
        {
          name: 'Vth (Threshold Voltage)',
          symbol: 'Vth',
          formula: 'Vth = VG_max - log(ID_max) / slope',
          unit: 'V',
          description: 'gm_max 기준 선형 외삽법으로 계산',
          implementation: `// calculateThresholdVoltage 함수 (calculationUtils.js)
export const calculateThresholdVoltage = (chartData, gmData) => {
  // gm_max 지점 찾기
  const maxGmPoint = gmData.reduce((max, current) => 
    current.gm > max.gm ? current : max
  );
  
  const vg_max = maxGmPoint.VG;
  
  // gm_max 지점에서의 ID 찾기
  const currentPoint = chartData.find(d => Math.abs(d.VG - vg_max) < 0.1);
  const id_max = currentPoint.ID;
  const log_id_max = Math.log10(Math.abs(id_max));
  
  // PDF 수식: slope = gm_max / ID_max
  const slope = maxGmPoint.gm / id_max;
  
  // 접선 방정식에서 Vth 계산
  // Vth = VG_max - log(ID_max) / slope
  const vth = vg_max - (log_id_max / slope);
  
  return vth;
};`,
          codeLocation: 'src/pages/analysis/calculationUtils.js',
          usedIn: ['Saturation 분석', '통합 분석']
        },
        {
          name: 'SS (Subthreshold Swing)',
          symbol: 'SS',
          formula: 'SS = dVG/d(log ID) = 1/slope',
          unit: 'V/decade',
          description: '전류 10배 변화에 필요한 게이트 전압',
          implementation: `// calculateSubthresholdSwing 함수 (calculationUtils.js)
export const calculateSubthresholdSwing = (chartData) => {
  // IDVG 데이터에서 subthreshold 영역 식별
  const subthresholdData = chartData.filter(d => {
    const logID = Math.log10(Math.abs(d.ID));
    return logID > -10 && logID < -6; // 적절한 subthreshold 범위
  });
  
  if (subthresholdData.length < 5) {
    return 0;
  }
  
  // log(ID) vs VG의 선형 회귀
  const x = subthresholdData.map(d => d.VG);
  const y = subthresholdData.map(d => Math.log10(Math.abs(d.ID)));
  const regression = calculateLinearRegression(x, y);
  
  // PDF 수식: SS = dVG/d(log ID) = 1/slope
  const ss_V_per_decade = 1 / regression.slope;
  
  return Math.abs(ss_V_per_decade); // V/decade
};`,
          codeLocation: 'src/pages/analysis/calculationUtils.js',
          usedIn: ['Saturation 분석', 'Dit 계산']
        },
        {
          name: 'Dit (Interface Trap Density)',
          symbol: 'Dit',
          formula: 'Dit = (Cox/q) × (SS/(2.3×kT/q) - 1)',
          unit: 'cm⁻²eV⁻¹',
          description: '산화막-반도체 계면의 트랩 밀도',
          implementation: `// calculateDit 함수 (calculationUtils.js)
export const calculateDit = (ss, deviceParams) => {
  if (!ss || ss <= 0) return 0;
  
  // PDF 수식: Dit = (Cox/q) × (SS/(2.3 * kT/q) - 1)
  const kT_q = PHYSICAL_CONSTANTS.THERMAL_VOLTAGE_300K; // V at 300K
  const cox = calculateCox(deviceParams.tox) * 1e-4; // F/cm²로 변환
  const q = PHYSICAL_CONSTANTS.ELEMENTARY_CHARGE; // C
  
  const dit = (cox / q) * (ss / (2.3 * kT_q) - 1);
  
  return Math.max(0, dit); // 음수 방지
};

// 사용된 상수
THERMAL_VOLTAGE_300K: 0.0259 V (kT/q at 300K)
ELEMENTARY_CHARGE: 1.602e-19 C`,
          codeLocation: 'src/pages/analysis/calculationUtils.js',
          usedIn: ['Saturation 분석', '통합 분석']
        }
      ]
    },
    {
      id: 'performance',
      title: '📈 성능 평가 파라미터',
      description: 'TFT의 전기적 성능을 평가하는 파라미터들',
      formulas: [
        {
          name: 'Ron (On-Resistance)',
          symbol: 'Ron',
          formula: 'Ron = 1/slope = dVD/dID',
          unit: 'Ω',
          description: '선형 영역에서의 드레인 저항',
          implementation: `// analyzeIDVD 함수에서 Ron 계산 (dataAnalysis.js)
let ron = 0;
if (chartData_fixed.length > 2 && gateVoltages.length > 0) {
  // 가장 높은 VG에서 초반 선형 영역의 기울기
  const highestVG = gateVoltages[gateVoltages.length - 1];
  const dataKey = \`VG_\${highestVG}V\`;
  
  // 초반 3-5개 점에서 선형 회귀
  const linearPoints = chartData_fixed.slice(1, 6);
  
  if (linearPoints.length >= 3) {
    const vd_values = linearPoints.map(p => p.VD);
    const id_values = linearPoints.map(p => p[dataKey] || 1e-12);
    
    const regression = calculateLinearRegression(vd_values, id_values);
    
    // Ron = 1/slope (기울기의 역수)
    if (regression.slope > 0) {
      ron = 1 / regression.slope;
    }
  }
}`,
          codeLocation: 'src/pages/analysis/dataAnalysis.js',
          usedIn: ['IDVD 분석']
        },
        {
          name: 'Ion/Ioff Ratio',
          symbol: 'Ion/Ioff',
          formula: 'Ion/Ioff = ID_max / ID_min',
          unit: '무차원',
          description: 'On 전류와 Off 전류의 비율 (스위칭 성능)',
          implementation: `// analyzeIDVGLinear 함수에서 Ion/Ioff 계산 (dataAnalysis.js)
// Ion: 최대 ID값 (가장 높은 VG에서)
const ion = Math.max(...chartData.map(d => d.ID));

// Ioff: 최소 ID값 (가장 낮은 VG에서)
const minCurrents = chartData.filter(d => d.ID > 0).map(d => d.ID);
const ioff = minCurrents.length > 0 ? Math.min(...minCurrents) : 1e-12;
const ionIoffRatio = ion / (ioff || 1e-12);`,
          codeLocation: 'src/pages/analysis/dataAnalysis.js',
          usedIn: ['Linear 분석', '통합 분석']
        },
        {
          name: 'ΔVth (Hysteresis)',
          symbol: 'ΔVth',
          formula: 'ΔVth = |Vth_forward - Vth_backward|',
          unit: 'V',
          description: 'Forward/Backward sweep에서의 문턱전압 차이',
          implementation: `// analyzeIDVGHysteresis 함수에서 ΔVth 계산 (dataAnalysis.js)
// Forward Vth 계산 (선형 외삽법)
const midStart = Math.floor(forwardData.length * 0.3);
const midEnd = Math.floor(forwardData.length * 0.7);
const x = forwardData.slice(midStart, midEnd).map(d => d.VG);
const y = forwardData.slice(midStart, midEnd).map(d => d.sqrtID);
const regression = calculateLinearRegression(x, y);
const vthForward = -regression.intercept / regression.slope;

// Backward Vth 계산 (동일한 방법)
// ... 유사한 계산 ...

// PDF 수식: ΔVth = |Vth_forward - Vth_backward|
const deltaVth = Math.abs(vthForward - vthBackward);`,
          codeLocation: 'src/pages/analysis/dataAnalysis.js',
          usedIn: ['Hysteresis 분석', '통합 분석']
        }
      ]
    },
    {
      id: 'integration',
      title: '🎯 통합 분석 알고리즘',
      description: '여러 측정 데이터를 통합하여 정확한 파라미터를 계산하는 알고리즘',
      formulas: [
        {
          name: '샘플별 데이터 그룹화',
          symbol: 'Data Fusion',
          formula: 'groupBy(sampleName) → Combined Analysis',
          unit: '-',
          description: '같은 샘플명의 다양한 측정 데이터를 하나로 통합',
          implementation: `// performCompleteAnalysis 함수 (analysisEngine.js)
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
    completeResults[sampleName] = performSampleCompleteAnalysis(
      sampleName, sampleData, deviceParams
    );
  });

  return completeResults;
};`,
          codeLocation: 'src/pages/analysis/analysisEngine.js',
          usedIn: ['통합 분석 메인 로직']
        },
        {
          name: '데이터 우선순위 결정',
          symbol: 'Priority Logic',
          formula: 'Saturation(Vth) + Linear(gm) → Optimal μFE',
          unit: '-',
          description: 'Saturation에서 정확한 Vth, Linear에서 정확한 gm을 추출',
          implementation: `// performSampleCompleteAnalysis 함수 (analysisEngine.js)
// 1. Saturation에서 정확한 Vth, SS, Dit 추출
let vth_sat = 0, ss = 0, dit = 0;
if (sampleData['IDVG-Saturation']) {
  const satParams = sampleData['IDVG-Saturation'].parameters;
  vth_sat = parseFloat(satParams.Vth?.split(' ')[0]) || 0;
  ss = parseFloat(satParams.SS?.split(' ')[0]) || 0;
  dit = parseFloat(satParams.Dit?.split(' ')[0]) || 0;
}

// 2. Linear에서 정확한 gm_max 추출
let gm_max_lin = 0;
if (sampleData['IDVG-Linear']) {
  const linData = sampleData['IDVG-Linear'];
  gm_max_lin = calculateGmMaxFromLinear(linData);
}

// 3. 우선순위: Linear gm > Saturation gm
const finalGmMax = gm_max_lin > 0 ? gm_max_lin : gm_max_sat;`,
          codeLocation: 'src/pages/analysis/analysisEngine.js',
          usedIn: ['통합 분석 데이터 융합']
        },
        {
          name: '품질 평가 시스템',
          symbol: 'Quality Score',
          formula: 'Score = f(DataCompleteness, CalculationReliability)',
          unit: '점수 (0-100)',
          description: '데이터 완성도와 계산 신뢰도를 종합하여 품질 등급 부여',
          implementation: `// evaluateDataQuality 함수 (analysisEngine.js)
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
  if (params['Y-function 품질'] === 'Poor') {
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

  return { score: Math.max(0, score), grade, issues };
};`,
          codeLocation: 'src/pages/analysis/analysisEngine.js',
          usedIn: ['통합 분석 품질 관리']
        }
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="flex flex-col items-center mb-6"> {/* flex-col과 items-center 추가 */}
        <Code className="w-8 h-8 text-blue-600 mb-3" /> {/* mb-3 추가 */}
        <div className="text-center"> {/* text-center 추가 */}
          <h2 className="text-2xl font-bold text-gray-800">수식 및 코드 점검</h2>
          <p className="text-gray-600">실제 코드에서 사용되는 TFT 분석 수식들을 확인하고 검증하세요</p>
        </div>
      </div>

      {/* 경고 메시지 */}
      <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
          <h3 className="font-semibold text-yellow-800">수식 검증 요청</h3>
        </div>
        <p className="text-yellow-700 text-sm mt-1">
          아래 수식들이 올바른지 확인해 주세요. 잘못된 수식이나 개선점이 있다면 GitHub Issues에 리포트해 주시기 바랍니다.
        </p>
      </div>

      {/* 카테고리별 수식 목록 */}
      <div className="space-y-4">
        {formulaCategories.map((category) => (
          <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection(category.id)}
              className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left flex items-center justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{category.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
              </div>
              {activeSection === category.id ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {activeSection === category.id && (
              <div className="p-6 bg-white">
                <div className="space-y-6">
                  {category.formulas.map((formula, index) => (
                    <div key={index} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-800 mb-2">
                            {formula.name}
                          </h4>
                          <div className="bg-blue-50 p-3 rounded-lg mb-3">
                            <div className="font-mono text-lg text-blue-800 mb-1">
                              {formula.formula}
                            </div>
                            <div className="text-sm text-blue-600">
                              단위: {formula.unit}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{formula.description}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              📁 {formula.codeLocation}
                            </span>
                            {formula.usedIn.map((usage, i) => (
                              <span key={i} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                🔧 {usage}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => toggleImplementation(formula.name)}
                          className="ml-4 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {showImplementation[formula.name] ? '코드 숨기기' : '코드 보기'}
                        </button>
                      </div>

                      {showImplementation[formula.name] && (
                        <div className="mt-4">
                          <h5 className="font-semibold text-gray-700 mb-2 flex items-center">
                            <Calculator className="w-4 h-4 mr-2" />
                            실제 구현 코드
                          </h5>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                            <code>{formula.implementation.trim()}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 하단 정보 */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
          <Book className="w-5 h-5 mr-2" />
          코드 구조 정보
        </h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>• 상수 정의:</strong> src/pages/utils/constants.js에서 모든 물리 상수 관리</p>
          <p><strong>• 계산 함수:</strong> src/pages/analysis/calculationUtils.js에서 핵심 계산 로직</p>
          <p><strong>• 분석 엔진:</strong> src/pages/analysis/analysisEngine.js에서 통합 분석 로직</p>
          <p><strong>• 데이터 분석:</strong> src/pages/analysis/dataAnalysis.js에서 개별 측정 분석</p>
          <p><strong>• 파일 처리:</strong> src/pages/utils/fileUtils.js에서 파일 타입 감지 및 처리</p>
        </div>
      </div>

      {/* GitHub 링크 */}
      <div className="mt-6 text-center">
        <a
          href="https://github.com/cosmosalad/hightech_tft"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
        >
          <Github className="w-4 h-4 mr-2" />
          GitHub에서 전체 코드 확인 및 Issues 리포트
        </a>
      </div>

      {/* 수식 참고 자료 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">📚 수식 참고 자료</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>• TFT 수식 정리:</strong> 첨부된 PDF 문서 기준으로 구현</p>
          <p><strong>• Y-function Method:</strong> Ghibaudo, G. (1988). New method for the extraction of MOSFET parameters.</p>
          <p><strong>• Mobility Degradation:</strong> Schroder, D. K. (2006). Semiconductor Material and Device Characterization.</p>
          <p><strong>• Interface Trap Density:</strong> Nicollian, E. H., & Brews, J. R. (1982). MOS Physics and Technology.</p>
        </div>
      </div>
    </div>
  );
};

export default FormulaCodeInspector;