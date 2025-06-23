// 💡 FormulaCodeInspector.js - UI/UX 개선 버전 (framer-motion 적용)

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Code, Eye, ChevronRight, Calculator, Zap,
  AlertTriangle, Github, Activity, BarChart3, TrendingUp, Layers,
  FileText, Microscope, Loader2
} from 'lucide-react';
// ✨ 애니메이션을 위한 라이브러리 import
import { motion, AnimatePresence } from 'framer-motion';

// 🎯 실제 코드에서 파라미터 모듈들을 import
// 이 경로는 실제 프로젝트 구조에 맞게 확인 및 수정이 필요할 수 있습니다.
import * as TFTParams from '../parameters/index.js';

// ✨ 부드러운 패널 전환을 위한 애니메이션 컴포넌트
const AnimatedPanel = ({ children }) => (
  <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: 'auto', opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
    style={{ overflow: 'hidden' }}
  >
    {children}
  </motion.div>
);

// 💀 코드 로딩 중 표시될 스켈레톤 UI 컴포넌트
const CodeSkeleton = () => (
  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto animate-pulse">
    <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
    <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
    <div className="h-3 bg-gray-700 rounded w-5/6 mb-2"></div>
    <div className="h-3 bg-gray-700 rounded w-full mb-4"></div>
    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
  </div>
);


const DynamicFormulaInspector = () => {
  const [activeSection, setActiveSection] = useState('');
  const [showImplementation, setShowImplementation] = useState({});
  const [sourceCodeCache, setSourceCodeCache] = useState({});
  const [loadingStates, setLoadingStates] = useState({});

  const fetchSourceCodeFromGitHub = useCallback(async (fileName) => {
    if (sourceCodeCache[fileName]) {
      return sourceCodeCache[fileName];
    }

    setLoadingStates(prev => ({ ...prev, [fileName]: true }));

    // 실제 GitHub 파일명 매핑 (기존 코드와 동일)
    const fileNameMapping = {
        'gm.js': 'gm.js', 'gm_max.js': 'gm_max.js', 'gm_sat.js': 'gm_sat.js',
        'field_effect_mobility.js': 'field_effect_mobility.js',
        'low_field_field_effect_mobility.js': 'low_field_field_effect_mobility.js',
        'effective_mobility.js': 'effective_mobility.js',
        'mobility_degradation_factor.js': 'mobility_degradation_factor.js',
        'vth.js': 'vth.js', 'ss.js': 'ss.js', 'dit.js': 'dit.js',
        'on_off_ratio.js': 'on_off_ratio.js', 'ron.js': 'ron.js',
        'ID_sat.js': 'ID_sat.js', 'dvth.js': 'dvth.js', 'utils.js': 'utils.js'
    };
    const actualFileName = fileNameMapping[fileName] || fileName;

    try {
        const response = await fetch(`https://raw.githubusercontent.com/cosmosalad/hightech_tft/main/src/pages/parameters/${actualFileName}`);
        if (!response.ok) {
            const indexResponse = await fetch(`https://raw.githubusercontent.com/cosmosalad/hightech_tft/main/src/pages/parameters/index.js`);
            if (indexResponse.ok) {
                const indexContent = await indexResponse.text();
                const result = `// ⚠️ ${fileName} 파일을 찾을 수 없어서 index.js에서 가져왔습니다.\n// 🔗 실제 파일 확인: https://github.com/cosmosalad/hightech_tft/tree/main/src/pages/parameters\n\n${indexContent}`;
                setSourceCodeCache(prev => ({ ...prev, [fileName]: result }));
                return result;
            }
            throw new Error(`HTTP ${response.status}`);
        }
        const sourceCode = await response.text();
        setSourceCodeCache(prev => ({ ...prev, [fileName]: sourceCode }));
        return sourceCode;
    } catch (error) {
        console.error(`Failed to fetch ${fileName}:`, error);
        const errorMsg = `// ❌ GitHub에서 소스코드를 불러오는데 실패했습니다.\n// Error: ${error.message}`;
        // 실패한 경우에도 캐시에 저장하여 반복 요청 방지
        setSourceCodeCache(prev => ({ ...prev, [fileName]: errorMsg }));
        return errorMsg;
    } finally {
        // ✨ 실제 로딩이 끝난 후 약간의 딜레이를 주어 UI가 안정적으로 보이게 함
        setTimeout(() => setLoadingStates(prev => ({ ...prev, [fileName]: false })), 500);
    }
  }, [sourceCodeCache]);

  const extractFunctionCode = useCallback(async (func, fileName) => {
    try {
      return await fetchSourceCodeFromGitHub(fileName);
    } catch (error) {
      // GitHub 접근 실패 시에도 로컬 함수 코드를 문자열로 반환
      return func.toString();
    }
  }, [fetchSourceCodeFromGitHub]);

  const highlightCode = (code) => {
    if (!code) return '';
    return code.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      let className = 'text-gray-100';
      if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
        className = 'text-green-400';
      } else if (trimmedLine.match(/\b(export|const|function|return|import|from|async|await|new|throw|let|var)\b/)) {
        className = 'text-blue-300';
      } else if (trimmedLine.includes('"') || trimmedLine.includes("'") || trimmedLine.includes('`')) {
        className = 'text-yellow-300';
      }
      return <div key={index} className={className} style={{ textAlign: 'left' }}>{line}</div>;
    });
  };

  // 🔥 코드 표시 컴포넌트 - 로딩 및 표시 로직 개선
  const CodeDisplay = ({ param }) => {
    const [displayCode, setDisplayCode] = useState('');
    const isLoading = loadingStates[param.fileName];
    const isVisible = showImplementation[param.name];

    useEffect(() => {
      if (isVisible && !sourceCodeCache[param.fileName]) {
        extractFunctionCode(param.actualFunction, param.fileName)
          .then(code => setDisplayCode(code));
      } else if (isVisible) {
        setDisplayCode(sourceCodeCache[param.fileName]);
      }
    }, [isVisible, param.actualFunction, param.fileName, sourceCodeCache, extractFunctionCode]);

    return (
      <AnimatePresence>
        {isVisible && (
          <AnimatedPanel>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                 <h5 className="font-bold text-gray-700 flex items-center">
                   <Microscope className="w-5 h-5 mr-2" />
                   실제 동작 코드 ({param.fileName})
                 </h5>
                 <a
                   href={`https://github.com/cosmosalad/hightech_tft/blob/main/src/pages/parameters/${param.fileName}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                 >
                   <Github className="w-3 h-3 mr-1" />
                   GitHub에서 보기
                 </a>
              </div>

              {/* ✨ 로딩 중일 때는 스켈레톤 UI, 로딩 완료되면 코드 표시 */}
              {isLoading || (!displayCode && isVisible) ? (
                <CodeSkeleton />
              ) : (
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm font-mono" style={{ textAlign: 'left' }}>
                    {highlightCode(displayCode)}
                  </pre>
                </div>
              )}
            </div>
          </AnimatedPanel>
        )}
      </AnimatePresence>
    );
  };

  const formulaCategories = useMemo(() => [
      {
        id: 'transconductance_group',
        title: '📊 Transconductance 그룹',
        description: 'gm, gm_max, gm_sat - 게이트 제어 효율을 나타내는 파라미터들',
        icon: <Activity className="w-6 h-6" />,
        color: 'blue',
        parameters: [
          { name: 'gm (Transconductance)', fileName: 'gm.js', measurement: 'IDVG-Linear, IDVG-Saturation', formula: 'gm = ΔID / ΔVG', unit: 'S (지멘스)', description: '게이트 전압 변화에 대한 드레인 전류 변화율', actualFunction: TFTParams.calculateGm, codeLocation: 'src/pages/parameters/gm.js' },
          { name: 'gm_max (Maximum Transconductance)', fileName: 'gm_max.js', measurement: 'IDVG-Linear', formula: 'gm_max = max(gm)', unit: 'S (지멘스)', description: 'gm 배열에서 최대값 - μFE 계산에 핵심', actualFunction: TFTParams.calculateGmMax, codeLocation: 'src/pages/parameters/gm_max.js' },
          { name: 'gm_sat (Saturation Transconductance)', fileName: 'gm_sat.js', measurement: 'IDVG-Saturation', formula: 'gm_sat = ΔID / ΔVG', unit: 'S (지멘스)', description: '포화 영역에서의 transconductance', actualFunction: TFTParams.calculateGmSat, codeLocation: 'src/pages/parameters/gm_sat.js' }
        ]
      },
      {
        id: 'mobility_group',
        title: '🔬 Mobility 그룹',
        description: 'μFE, μ0, μeff, θ - 이동도 관련 파라미터들',
        icon: <TrendingUp className="w-6 h-6" />,
        color: 'purple',
        parameters: [
          { name: 'μFE (Field-Effect Mobility)', fileName: 'field_effect_mobility.js', measurement: 'IDVG-Linear', formula: 'μFE = L/(W×Cox×VDS) × gm_max', unit: 'cm²/V·s', description: 'Linear 측정에서 계산되는 기본 이동도', actualFunction: TFTParams.calculateMuFE, codeLocation: 'src/pages/parameters/field_effect_mobility.js' },
          { name: 'μ0 (Low-field Mobility)', fileName: 'low_field_field_effect_mobility.js', measurement: 'IDVG-Linear (Y-function)', formula: 'μ0 = A²L/(Cox×VD×W)', unit: 'cm²/V·s', description: 'Y-function method를 사용한 저전계 이동도', actualFunction: TFTParams.calculateMu0, codeLocation: 'src/pages/parameters/low_field_field_effect_mobility.js' },
          { name: 'μeff (Effective Mobility)', fileName: 'effective_mobility.js', measurement: 'IDVG-Linear', formula: 'μeff = μ0 / (1 + θ(VG - Vth))', unit: 'cm²/V·s', description: '실제 동작 조건에서의 유효 이동도', actualFunction: TFTParams.calculateMuEff, codeLocation: 'src/pages/parameters/effective_mobility.js' },
          { name: 'θ (Mobility Degradation Factor)', fileName: 'mobility_degradation_factor.js', measurement: 'IDVG-Linear', formula: 'θ = (μ0×W×Cox×VD)/(ID×L) - 1/(VG-Vth)', unit: 'V⁻¹', description: '게이트 전압 증가에 따른 이동도 감소 계수', actualFunction: TFTParams.calculateTheta, codeLocation: 'src/pages/parameters/mobility_degradation_factor.js' }
        ]
      },
       {
        id: 'threshold_switching_group',
        title: '⚡ Threshold & Switching 그룹',
        description: 'Vth, SS, Dit - 문턱전압 및 스위칭 특성',
        icon: <Zap className="w-6 h-6" />,
        color: 'yellow',
        parameters: [
          { name: 'Vth (Threshold Voltage)', fileName: 'vth.js', measurement: 'IDVG-Linear', formula: 'Vth = VG_at_gm_max - ID_at_gm_max / gm_max', unit: 'V', description: 'Linear Extrapolation Method로 계산된 문턱전압', actualFunction: TFTParams.calculateVth, codeLocation: 'src/pages/parameters/vth.js' },
          { name: 'SS (Subthreshold Swing)', fileName: 'ss.js', measurement: 'IDVG-Linear', formula: 'SS = 1/slope × 1000 (mV/decade)', unit: 'mV/decade', description: '전류를 10배 증가시키는 데 필요한 게이트 전압', actualFunction: TFTParams.calculateSS, codeLocation: 'src/pages/parameters/ss.js' },
          { name: 'Dit (Interface Trap Density)', fileName: 'dit.js', measurement: 'IDVG-Linear (SS 기반)', formula: 'Dit = (Cox/q) × (SS/(2.3×kT/q) - 1)', unit: 'cm⁻²eV⁻¹', description: '계면 트랩 밀도', actualFunction: TFTParams.calculateDit, codeLocation: 'src/pages/parameters/dit.js' }
        ]
      },
      {
        id: 'performance_group',
        title: '📈 Performance 그룹',
        description: 'Ion/Ioff, Ron, ID_sat - 성능 파라미터들',
        icon: <BarChart3 className="w-6 h-6" />,
        color: 'green',
        parameters: [
          { name: 'Ion/Ioff (On/Off Current Ratio)', fileName: 'on_off_ratio.js', measurement: 'IDVG-Linear', formula: 'Ion = max(ID), Ioff = min(ID)', unit: '무차원', description: '최대/최소 드레인 전류 비율', actualFunction: TFTParams.calculateOnOffRatio, codeLocation: 'src/pages/parameters/on_off_ratio.js' },
          { name: 'Ron (On Resistance)', fileName: 'ron.js', measurement: 'IDVD', formula: 'Ron = 1/slope = dVD/dID', unit: 'Ω', description: '선형 영역에서의 드레인 저항', actualFunction: TFTParams.calculateRon, codeLocation: 'src/pages/parameters/ron.js' },
          { name: 'ID_sat (Saturation Current Density)', fileName: 'ID_sat.js', measurement: 'IDVG-Saturation', formula: 'ID_sat = ID_max / W', unit: 'A/mm', description: '단위 폭당 포화 전류', actualFunction: TFTParams.calculateIDSat, codeLocation: 'src/pages/parameters/ID_sat.js' }
        ]
      },
       {
        id: 'stability_group',
        title: '🔄 Stability 그룹',
        description: 'ΔVth - 안정성 파라미터',
        icon: <Layers className="w-6 h-6" />,
        color: 'orange',
        parameters: [
          { name: 'ΔVth (Hysteresis)', fileName: 'dvth.js', measurement: 'IDVG-Linear-Hysteresis', formula: 'ΔVth = |Vth_forward - Vth_backward|', unit: 'V', description: 'Forward/Backward sweep에서의 문턱전압 차이', actualFunction: TFTParams.calculateDeltaVth, codeLocation: 'src/pages/parameters/dvth.js' }
        ]
      },
      {
        id: 'utilities_group',
        title: '🧮 Core Utilities',
        description: 'Cox, 선형회귀 등 핵심 유틸리티',
        icon: <Calculator className="w-6 h-6" />,
        color: 'gray',
        parameters: [
          { name: 'Cox (Gate Capacitance)', fileName: 'utils.js', measurement: '디바이스 파라미터', formula: 'Cox = (ε₀ × εr) / tox', unit: 'F/m²', description: '게이트 산화막 정전용량', actualFunction: TFTParams.calculateCox, codeLocation: 'src/pages/parameters/utils.js' },
          { name: 'Linear Regression', fileName: 'utils.js', measurement: '수학적 계산', formula: 'y = mx + b', unit: '', description: '선형 회귀 계산 (모든 외삽법의 기초)', actualFunction: TFTParams.linearRegression, codeLocation: 'src/pages/parameters/utils.js' },
          { name: 'CONSTANTS (Physical Constants)', fileName: 'utils.js', measurement: '물리 상수', formula: 'ε₀, εᵣ, q, kᵦ, T', unit: '다양', description: '정확한 계산을 위한 표준 물리 상수들', actualFunction: () => TFTParams.CONSTANTS, codeLocation: 'src/pages/parameters/utils.js' }
        ]
      }
  ], []);

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? '' : section);
  };

  const toggleImplementation = (paramName) => {
    setShowImplementation(prev => ({ ...prev, [paramName]: !prev[paramName] }));
  };

  const getColorClasses = (color) => {
      const colors = {
          blue: 'from-blue-50 to-blue-100 border-blue-200',
          purple: 'from-purple-50 to-purple-100 border-purple-200',
          yellow: 'from-yellow-50 to-yellow-100 border-yellow-200',
          green: 'from-green-50 to-green-100 border-green-200',
          orange: 'from-orange-50 to-orange-100 border-orange-200',
          gray: 'from-gray-50 to-gray-100 border-gray-200'
      };
      return colors[color] || colors.gray;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Code className="w-8 h-8 text-blue-600 mr-3" />
          <h2 className="text-3xl font-bold text-gray-800">🔥 TFT 파라미터 코드 점검기</h2>
        </div>
        <p className="text-gray-600 text-lg">GitHub 원본 파일의 수식을 점검해보세요.</p>
      </div>

      <div className="space-y-4">
        {formulaCategories.map((category) => (
          <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection(category.id)}
              className={`w-full px-4 sm:px-6 py-4 bg-gradient-to-r ${getColorClasses(category.color)} hover:opacity-90 transition-all text-left flex items-center justify-between`}
            >
              <div className="flex items-center">
                {category.icon}
                <div className="ml-3">
                  <h3 className="text-xl font-bold text-gray-800">{category.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                </div>
              </div>
              <motion.div animate={{ rotate: activeSection === category.id ? 90 : 0 }}>
                <ChevronRight className="w-6 h-6 text-gray-500" />
              </motion.div>
            </button>

            <AnimatePresence>
              {activeSection === category.id && (
                <AnimatedPanel>
                  <div className="p-4 sm:p-6 bg-white">
                    <div className="space-y-6">
                      {category.parameters.map((param) => (
                        <div key={param.name} className="border border-gray-100 rounded-lg p-4 transition-shadow hover:shadow-md">
                          <div className="flex flex-col sm:flex-row items-start justify-between mb-4">
                            <div className="flex-1 pr-0 sm:pr-4 mb-4 sm:mb-0">
                               <div className="flex items-center mb-3">
                                  <FileText className="w-5 h-5 text-blue-600 mr-2" />
                                  <h4 className="text-lg font-bold text-gray-800">{param.name}</h4>
                                  <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 text-xs sm:text-sm rounded-full whitespace-nowrap">📁 {param.fileName}</span>
                               </div>
                               <div className="grid md:grid-cols-2 gap-4 mb-4">
                                  <div className="bg-blue-50 p-3 rounded-lg">
                                    <div className="font-mono text-base sm:text-lg text-blue-800 mb-1">{param.formula}</div>
                                    <div className="text-sm text-blue-600">단위: {param.unit || 'N/A'}</div>
                                  </div>
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-sm text-gray-700"><strong>📏 측정:</strong> {param.measurement}</div>
                                    <div className="text-sm text-gray-700 mt-1"><strong>📁 위치:</strong> {param.codeLocation}</div>
                                  </div>
                               </div>
                               <p className="text-gray-600 text-sm mb-3">{param.description}</p>
                            </div>
                            <button
                              onClick={() => toggleImplementation(param.name)}
                              className="ml-auto sm:ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center whitespace-nowrap self-start"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              {showImplementation[param.name] ? '코드 숨기기' : '실제 코드 보기'}
                            </button>
                          </div>
                          <CodeDisplay param={param} />
                        </div>
                      ))}
                    </div>
                  </div>
                </AnimatedPanel>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

       <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
        <a href="https://github.com/cosmosalad/hightech_tft/tree/main/src/pages/parameters" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">
          <Github className="w-5 h-5 mr-2" />
          GitHub 소스코드 보기
        </a>
        <button onClick={() => window.open('https://github.com/cosmosalad/hightech_tft/issues', '_blank')} className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          <AlertTriangle className="w-5 h-5 mr-2" />
          수식/코드 오류 신고
        </button>
      </div>
    </div>
  );
};

export default DynamicFormulaInspector;