import React, { useState } from 'react';
import { Code, Book, Eye, ChevronDown, ChevronRight, Calculator, Zap, Target, AlertTriangle, Github, Activity, BarChart3, TrendingUp, Layers } from 'lucide-react';

const TFTFormulaInspector = () => {
  const [activeSection, setActiveSection] = useState('');
  const [showImplementation, setShowImplementation] = useState({});

  // 전체 TFT 파라미터 카테고리
  const getAllTFTParameterCategories = () => {
    return [
      {
        id: 'transconductance_group',
        title: '📊 Transconductance 그룹',
        description: 'gm, gm_max, gm_sat - 실제 코드에서 계산되는 transconductance 관련 파라미터들',
        icon: <Activity className="w-6 h-6" />,
        formulas: [
          {
            name: 'gm (Transconductance)',
            symbol: 'gm = ΔID / ΔVG',
            formula: 'gm = ΔID / ΔVG',
            unit: 'S (지멘스)',
            description: '게이트 전압 변화에 대한 드레인 전류 변화율',
            implementation: `// 실제 calculationUtils.js → calculateGm()
export const calculateGm = (chartData, useNumericDifferentiation = true) => {
  const gmData = [];
  
  if (useNumericDifferentiation) {
    // 수치 미분: gm = ΔID / ΔVG
    for (let i = 1; i < chartData.length - 1; i++) {
      const deltaVG = chartData[i+1].VG - chartData[i-1].VG;
      const deltaID = chartData[i+1].ID - chartData[i-1].ID;
      
      if (deltaVG !== 0) {
        const gm = Math.abs(deltaID / deltaVG);
        const roundedVG = Math.round(chartData[i].VG * 10) / 10;
        gmData.push({ VG: roundedVG, gm: gm });
      }
    }
  }
  
  return gmData;
};`,
            codeLocation: 'src/pages/analysis/calculationUtils.js',
            usedIn: ['IDVG-Linear 분석', 'IDVG-Saturation 분석']
          },
          {
            name: 'gm_max (Maximum Transconductance)',
            symbol: 'gm_max = max(gm)',
            formula: 'gm_max = maximum value from gm array',
            unit: 'S (지멘스)',
            description: 'gm 배열에서 최대값 - μFE 계산에 핵심',
            implementation: `// 실제 analysisEngine.js → calculateGmMaxFromLinear()
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

// 통합 분석에서 사용
const finalGmMax = gm_max_lin > 0 ? gm_max_lin : gm_max_sat;`,
            codeLocation: 'src/pages/analysis/analysisEngine.js',
            usedIn: ['통합 분석', 'μFE 계산']
          },
          {
            name: 'gm_sat (Saturation Transconductance)',
            symbol: 'gm_sat = ΔID / ΔVG',
            formula: 'Saturation 측정에서의 gm_max',
            unit: 'S (지멘스)',
            description: 'Saturation 측정에서 계산된 최대 transconductance',
            implementation: `// 실제 dataAnalysis.js → analyzeIDVGSaturation()
// gm 계산
let gmData = [];
let maxGm = 0;

if (gmIndex !== -1 && chartData.some(d => d.gm_measured && d.gm_measured > 0)) {
  // 엑셀의 gm 값 사용
  chartData.forEach((point) => {
    if (point.gm_measured && point.gm_measured > 0) {
      gmData.push({ VG: Math.round(point.VG * 10) / 10, gm: point.gm_measured });
      if (point.gm_measured > maxGm) {
        maxGm = point.gm_measured;
      }
    }
  });
} else {
  // 수치 미분으로 gm 계산
  gmData = calculateGm(chartData);
  maxGm = gmData.length > 0 ? Math.max(...gmData.map(d => d.gm)) : 0;
}`,
            codeLocation: 'src/pages/analysis/dataAnalysis.js',
            usedIn: ['IDVG-Saturation 분석']
          }
        ]
      },
      {
        id: 'mobility_group',
        title: '🔬 Mobility 그룹',
        description: 'μFE, μ0, μeff, θ - 실제 코드에서 계산되는 이동도 관련 파라미터들',
        icon: <TrendingUp className="w-6 h-6" />,
        formulas: [
          {
            name: 'μFE (Field-Effect Mobility)',
            symbol: 'μFE = L/(W×Cox×VDS) × gm_max',
            formula: 'μFE = L/(W×Cox×VDS) × gm_max',
            unit: 'cm²/V·s',
            description: 'Linear 측정에서 계산되는 기본 이동도',
            implementation: `// 실제 calculationUtils.js → calculateMuFE()
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
            symbol: 'μ0 = A²L/(Cox×VD×W)',
            formula: 'Y-function method로 계산: μ0 = A²L/(Cox×VD×W)',
            unit: 'cm²/V·s',
            description: 'Y-function method를 사용한 저전계 이동도',
            implementation: `// 실제 calculationUtils.js → calculateMu0UsingYFunction()
export const calculateMu0UsingYFunction = (linearData, deviceParams, vth) => {
  // Y-function 데이터 계산
  const yFunctionData = [];
  
  for (let i = 0; i < chartData.length; i++) {
    const vgs = chartData[i].VG;
    const id = chartData[i].ID;
    const gmPoint = gmData.find(g => Math.abs(g.VG - vgs) < 0.05);
    
    if (gmPoint && gmPoint.gm > 1e-12 && vgs > vth && id > 1e-12) {
      // PDF 수식: Y = ID/√gm
      const y = id / Math.sqrt(gmPoint.gm);
      const x = vgs - vth;
      
      yFunctionData.push({ x: x, y: y });
    }
  }
  
  // 선형 회귀로 기울기 계산
  const regression = calculateLinearRegression(x_values, y_values);
  
  // PDF 수식: μ0 = A²L/(Cox×VD×W)
  const A = regression.slope;
  const mu0 = (A * A * L) / (cox * vd * W) * 1e4;
  
  return { mu0, quality, r_squared };
};`,
            codeLocation: 'src/pages/analysis/calculationUtils.js',
            usedIn: ['통합 분석', 'μeff 계산']
          },
          {
            name: 'μeff (Effective Mobility)',
            symbol: 'μeff = μ0 / (1 + θ(VG - Vth))',
            formula: 'μeff = μ0 / (1 + θ(VG - Vth))',
            unit: 'cm²/V·s',
            description: '실제 동작 조건에서의 유효 이동도',
            implementation: `// 실제 calculationUtils.js → calculateMuEff()
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
          },
          {
            name: 'θ (Mobility Degradation Factor)',
            symbol: 'θ = (μ0×W×Cox×VD)/(ID×L) - 1/(VG-Vth)',
            formula: 'θ = (μ0×W×Cox×VD)/(ID×L) - 1/(VG-Vth)',
            unit: 'V⁻¹',
            description: '게이트 전압 증가에 따른 이동도 감소 계수',
            implementation: `// 실제 calculationUtils.js → calculateTheta()
export const calculateTheta = (mu0, deviceParams, chartData, gmData, vth, vds) => {
  const { W, L } = deviceParams;
  const cox = calculateCox(deviceParams.tox);
  
  const validPoints = [];
  
  for (let i = 0; i < chartData.length; i++) {
    const point = chartData[i];
    const vg = point.VG;
    const id = point.ID;
    
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
            usedIn: ['통합 분석']
          }
        ]
      },
      {
        id: 'threshold_switching_group',
        title: '⚡ Threshold & Switching 그룹',
        description: 'Vth, SS, Dit - 실제 코드에서 계산되는 문턱전압 및 스위칭 특성',
        icon: <Zap className="w-6 h-6" />,
        formulas: [
          {
            name: 'Vth (Threshold Voltage)',
            symbol: 'Vth = VG_max - log(ID_max) / slope',
            formula: 'gm_max 기준 선형 외삽법',
            unit: 'V',
            description: 'gm_max 지점에서 선형 외삽법으로 계산',
            implementation: `// 실제 calculationUtils.js → calculateThresholdVoltage()
export const calculateThresholdVoltage = (chartData, gmData) => {
  if (!gmData || gmData.length === 0) {
    return 0;
  }
  
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
  
  // Vth = VG_max - log(ID_max) / slope
  const vth = vg_max - (log_id_max / slope);
  
  return vth;
};`,
            codeLocation: 'src/pages/analysis/calculationUtils.js',
            usedIn: ['Saturation 분석', '통합 분석']
          },
          {
            name: 'SS (Subthreshold Swing)',
            symbol: 'SS = dVG/d(log ID) = 1/slope',
            formula: 'SS = dVG/d(log ID) = 1/slope',
            unit: 'V/decade',
            description: '전류 10배 변화에 필요한 게이트 전압',
            implementation: `// 실제 calculationUtils.js → calculateSubthresholdSwing()
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
  
  return Math.abs(ss_V_per_decade);
};`,
            codeLocation: 'src/pages/analysis/calculationUtils.js',
            usedIn: ['Saturation 분석', 'Dit 계산']
          },
          {
            name: 'Dit (Interface Trap Density)',
            symbol: 'Dit = (Cox/q) × (SS/(2.3×kT/q) - 1)',
            formula: 'Dit = (Cox/q) × (SS/(2.3×kT/q) - 1)',
            unit: 'cm⁻²eV⁻¹',
            description: '산화막-반도체 계면의 트랩 밀도',
            implementation: `// 실제 calculationUtils.js → calculateDit()
export const calculateDit = (ss, deviceParams) => {
  if (!ss || ss <= 0) return 0;
  
  // PDF 수식: Dit = (Cox/q) × (SS/(2.3×kT/q) - 1)
  const kT_q = PHYSICAL_CONSTANTS.THERMAL_VOLTAGE_300K; // V at 300K
  const cox = calculateCox(deviceParams.tox) * 1e-4; // F/cm²로 변환
  const q = PHYSICAL_CONSTANTS.ELEMENTARY_CHARGE; // C
  
  const dit = (cox / q) * (ss / (2.3 * kT_q) - 1);
  
  return Math.max(0, dit); // 음수 방지
};`,
            codeLocation: 'src/pages/analysis/calculationUtils.js',
            usedIn: ['Saturation 분석', '통합 분석']
          }
        ]
      },
      {
        id: 'performance_group',
        title: '📈 Performance 그룹',
        description: 'Ion, Ioff, On/Off ratio, Ron, ID_sat - 실제 코드에서 계산되는 성능 파라미터들',
        icon: <BarChart3 className="w-6 h-6" />,
        formulas: [
          {
            name: 'Ion (On Current)',
            symbol: 'Ion = max(ID)',
            formula: 'Ion = maximum ID value',
            unit: 'A',
            description: '최대 드레인 전류 (높은 VG에서)',
            implementation: `// 실제 dataAnalysis.js → analyzeIDVGLinear()
// Ion: 최대 ID값 (가장 높은 VG에서)
const ion = Math.max(...chartData.map(d => d.ID));`,
            codeLocation: 'src/pages/analysis/dataAnalysis.js',
            usedIn: ['Linear 분석', '통합 분석']
          },
          {
            name: 'Ioff (Off Current)',
            symbol: 'Ioff = min(ID)',
            formula: 'Ioff = minimum ID value',
            unit: 'A',
            description: '최소 드레인 전류 (낮은 VG에서)',
            implementation: `// 실제 dataAnalysis.js → analyzeIDVGLinear()
// Ioff: 최소 ID값 (가장 낮은 VG에서)
const minCurrents = chartData.filter(d => d.ID > 0).map(d => d.ID);
const ioff = minCurrents.length > 0 ? Math.min(...minCurrents) : 1e-12;`,
            codeLocation: 'src/pages/analysis/dataAnalysis.js',
            usedIn: ['Linear 분석', '통합 분석']
          },
          {
            name: 'On/Off ratio',
            symbol: 'On/Off = Ion / Ioff',
            formula: 'On/Off ratio = Ion / Ioff',
            unit: '무차원',
            description: 'On 전류와 Off 전류의 비율',
            implementation: `// 실제 dataAnalysis.js → analyzeIDVGLinear()
const ionIoffRatio = ion / (ioff || 1e-12);`,
            codeLocation: 'src/pages/analysis/dataAnalysis.js',
            usedIn: ['Linear 분석', '통합 분석']
          },
          {
            name: 'Ron (On Resistance)',
            symbol: 'Ron = 1/slope = dVD/dID',
            formula: 'Ron = 1/slope (선형 영역)',
            unit: 'Ω',
            description: '선형 영역에서의 드레인 저항',
            implementation: `// 실제 dataAnalysis.js → analyzeIDVD()
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
}`,
            codeLocation: 'src/pages/analysis/dataAnalysis.js',
            usedIn: ['IDVD 분석']
          },
          {
            name: 'ID_sat (Saturation Current)',
            symbol: 'ID_sat = max(ID) / W',
            formula: 'ID_sat = max(ID) / W (A/mm)',
            unit: 'A/mm',
            description: '포화 영역의 정규화된 최대 전류',
            implementation: `// 실제 analysisEngine.js → performSampleCompleteAnalysis()
// ID_sat: 포화 영역의 최대 전류
const idSat = Math.max(...chartData.map(d => d.ID));

// A/mm로 정규화
let id_sat_normalized = 0;
if (sampleData['IDVG-Saturation'] && deviceParams.W) {
  const satParams = sampleData['IDVG-Saturation'].parameters;
  const id_sat_raw = parseFloat(satParams.ID_sat?.split(' ')[0]) || 0;
  const W_mm = deviceParams.W * 1000; // m를 mm로 변환
  id_sat_normalized = id_sat_raw / W_mm; // A/mm
}`,
            codeLocation: 'src/pages/analysis/analysisEngine.js',
            usedIn: ['Saturation 분석', '통합 분석']
          }
        ]
      },
      {
        id: 'stability_group',
        title: '🔄 Stability 그룹',
        description: 'ΔVth - 실제 코드에서 계산되는 안정성 파라미터',
        icon: <Layers className="w-6 h-6" />,
        formulas: [
          {
            name: 'ΔVth (Hysteresis)',
            symbol: 'ΔVth = |Vth_forward - Vth_backward|',
            formula: 'ΔVth = |Vth_forward - Vth_backward|',
            unit: 'V',
            description: 'Forward/Backward sweep에서의 문턱전압 차이',
            implementation: `// 실제 dataAnalysis.js → analyzeIDVGHysteresis()
// Forward Vth 계산 (선형 외삽법)
let vthForward = 0;
if (forwardData.length > 10) {
  const midStart = Math.floor(forwardData.length * 0.3);
  const midEnd = Math.floor(forwardData.length * 0.7);
  const x = forwardData.slice(midStart, midEnd).map(d => d.VG);
  const y = forwardData.slice(midStart, midEnd).map(d => d.sqrtID);
  const regression = calculateLinearRegression(x, y);
  if (regression.slope !== 0) {
    vthForward = -regression.intercept / regression.slope;
  }
}

// Backward Vth 계산 (동일한 방법)
// ... 동일한 로직 ...

// PDF 수식: ΔVth = |Vth_forward - Vth_backward|
const deltaVth = Math.abs(vthForward - vthBackward);`,
            codeLocation: 'src/pages/analysis/dataAnalysis.js',
            usedIn: ['Hysteresis 분석', '통합 분석']
          }
        ]
      }
    ];
  };

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? '' : section);
  };

  const toggleImplementation = (formula) => {
    setShowImplementation(prev => ({
      ...prev,
      [formula]: !prev[formula]
    }));
  };

  const formulaCategories = getAllTFTParameterCategories();

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      {/* 헤더 */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center mb-3">
          <Code className="w-8 h-8 text-blue-600 mr-3" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">🔥 TFT 파라미터 코드 점검기</h2>
          <p className="text-gray-600">실제 동작하는 모든 TFT 분석 파라미터들의 코드</p>
        </div>
      </div>

      {/* 수식 카테고리들 */}
      <div className="space-y-4">
        {formulaCategories.map((category) => (
          <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection(category.id)}
              className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left flex items-center justify-between"
            >
              <div className="flex items-center">
                {category.icon}
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-800">{category.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                </div>
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
                          <div className="flex items-center mb-2">
                            <h4 className="text-lg font-semibold text-gray-800">
                              {formula.name}
                            </h4>
                          </div>
                          
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
                            <code>{formula.implementation}</code>
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

      {/* GitHub 및 피드백 링크 */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
        <a
          href="https://github.com/cosmosalad/hightech_tft"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
        >
          <Github className="w-5 h-5 mr-2" />
          GitHub에서 전체 코드 확인
        </a>
        
        <button
          onClick={() => window.open('https://github.com/cosmosalad/hightech_tft/issues', '_blank')}
          className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <AlertTriangle className="w-5 h-5 mr-2" />
          수식 오류 신고
        </button>
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

export default TFTFormulaInspector;