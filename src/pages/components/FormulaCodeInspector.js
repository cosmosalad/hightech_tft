// 🔥 Dynamic Formula Code Inspector
// 실제 코드에서 동적으로 수식을 추출하는 시스템

import React, { useState, useMemo } from 'react';
import { Code, Book, Eye, ChevronDown, ChevronRight, Calculator, Zap, Target, AlertTriangle, Github, Activity, BarChart3, TrendingUp, Layers } from 'lucide-react';

// 🎯 실제 코드에서 수식 메타데이터를 추출하는 중앙 관리 시스템
import * as CalculationUtils from '../analysis/calculationUtils';
import * as DataAnalysis from '../analysis/dataAnalysis';
import * as AnalysisEngine from '../analysis/analysisEngine';
import * as Constants from '../utils/constants';

const DynamicFormulaInspector = () => {
  const [activeSection, setActiveSection] = useState('');
  const [showImplementation, setShowImplementation] = useState({});

  // 🔥 상수 객체에서 실제 값들을 동적으로 추출하는 헬퍼
  const extractConstantValue = (constantObj, path = '') => {
    if (typeof constantObj === 'object' && constantObj !== null) {
      return JSON.stringify(constantObj, null, 2);
    }
    return constantObj?.toString() || 'Constant not found';
  };

  // 🔥 실제 함수에서 코드를 동적으로 추출하는 헬퍼
  const extractFunctionCode = (func) => {
    if (typeof func !== 'function') return 'Function not found';
    return func.toString();
  };

  // 🔥 모듈 내 함수 코드를 추출하는 안전한 헬퍼
  const extractModuleFunctionCode = (funcName, fallbackCode) => {
    try {
      // 실제 함수가 존재하면 추출
      if (typeof window !== 'undefined' && window[funcName]) {
        return extractFunctionCode(window[funcName]);
      }
      // fallback으로 하드코딩된 코드 반환
      return fallbackCode;
    } catch (error) {
      return fallbackCode;
    }
  };

  // 🔥 실제 코드 기반 수식 카테고리 생성
  const getFormulaCategories = useMemo(() => {
    return [
      {
        id: 'constants_group',
        title: '🔧 물리 상수 & 변환 유틸리티',
        description: '물리 상수, 단위 변환, TFT 상수 - 모든 계산의 기반이 되는 상수들',
        icon: <Target className="w-6 h-6" />,
        formulas: [
          {
            name: 'PHYSICAL_CONSTANTS',
            symbol: 'ε₀, q, k, T 등',
            formula: '물리학 기본 상수들',
            unit: '다양함',
            description: '진공 유전율, 기본 전하량, 볼츠만 상수, 열전압 등',
            getImplementation: () => extractConstantValue(Constants.PHYSICAL_CONSTANTS),
            codeLocation: 'src/pages/utils/constants.js',
            usedIn: ['Cox 계산', 'Dit 계산', '열전압 계산'],
            actualConstant: Constants.PHYSICAL_CONSTANTS
          },
          {
            name: 'UNIT_CONVERSIONS',
            symbol: 'nm→m, cm²→m², 등',
            formula: '단위 변환 함수들',
            unit: '변환 함수',
            description: '길이, 면적, 이동도, 전류 등의 단위 변환',
            getImplementation: () => extractConstantValue(Constants.UNIT_CONVERSIONS),
            codeLocation: 'src/pages/utils/constants.js',
            usedIn: ['모든 계산', '단위 통일'],
            actualConstant: Constants.UNIT_CONVERSIONS
          },
          {
            name: 'TFT_CONSTANTS',
            symbol: 'μ 범위, Vth 범위, SS 등',
            formula: 'TFT 파라미터 일반적 범위',
            unit: '다양함',
            description: '이동도 범위, 문턱전압 범위, SS 이상값, θ 범위 등',
            getImplementation: () => extractConstantValue(Constants.TFT_CONSTANTS),
            codeLocation: 'src/pages/utils/constants.js',
            usedIn: ['물리적 타당성 검증', '품질 평가'],
            actualConstant: Constants.TFT_CONSTANTS
          },
          {
            name: 'validatePhysicalParameters',
            symbol: '검증 함수들',
            formula: 'TFT 파라미터 유효성 검증',
            unit: '검증 결과',
            description: '이동도, Vth, SS, θ 등의 물리적 타당성 검증',
            getImplementation: () => extractConstantValue(Constants.validatePhysicalParameters),
            codeLocation: 'src/pages/utils/constants.js',
            usedIn: ['품질 평가', '결과 검증'],
            actualConstant: Constants.validatePhysicalParameters
          },
          {
            name: 'getThermalVoltage',
            symbol: 'kT/q = f(T)',
            formula: 'getThermalVoltage(temperature_K)',
            unit: 'V',
            description: '온도별 열전압 계산 함수',
            getImplementation: () => extractFunctionCode(Constants.getThermalVoltage),
            codeLocation: 'src/pages/utils/constants.js',
            usedIn: ['온도 의존성 계산'],
            actualFunction: Constants.getThermalVoltage
          },
          {
            name: 'calculateCoxForMaterial',
            symbol: 'Cox = f(재료, 두께)',
            formula: 'calculateCoxForMaterial(thickness_m, material)',
            unit: 'F/m²',
            description: '재료별 Cox 계산 (SiO₂, Si₃N₄, Al₂O₃, HfO₂)',
            getImplementation: () => extractFunctionCode(Constants.calculateCoxForMaterial),
            codeLocation: 'src/pages/utils/constants.js',
            usedIn: ['다양한 절연막 대응'],
            actualFunction: Constants.calculateCoxForMaterial
          }
        ]
      },
      {
        id: 'transconductance_group',
        title: '📊 Transconductance 그룹',
        description: 'gm, gm_max, gm_sat - 실제 동작하는 transconductance 관련 파라미터들',
        icon: <Activity className="w-6 h-6" />,
        formulas: [
          {
            name: 'gm (Transconductance)',
            symbol: 'gm = ΔID / ΔVG',
            formula: 'gm = ΔID / ΔVG',
            unit: 'S (지멘스)',
            description: '게이트 전압 변화에 대한 드레인 전류 변화율',
            getImplementation: () => extractFunctionCode(CalculationUtils.calculateGm),
            codeLocation: 'src/pages/analysis/calculationUtils.js',
            usedIn: ['IDVG-Linear 분석', 'IDVG-Saturation 분석'],
            actualFunction: CalculationUtils.calculateGm
          },
          {
            name: 'gm_max (Maximum Transconductance)',
            symbol: 'gm_max = max(gm)',
            formula: 'gm_max = maximum value from gm array',
            unit: 'S (지멘스)',
            description: 'gm 배열에서 최대값 - μFE 계산에 핵심',
            getImplementation: () => extractFunctionCode(AnalysisEngine.calculateGmMaxFromLinear),
            codeLocation: 'src/pages/analysis/analysisEngine.js',
            usedIn: ['통합 분석', 'μFE 계산'],
            actualFunction: AnalysisEngine.calculateGmMaxFromLinear
          }
        ]
      },
      {
        id: 'mobility_group',
        title: '🔬 Mobility 그룹',
        description: 'μFE, μ0, μeff, θ - 실제 동작하는 이동도 관련 파라미터들',
        icon: <TrendingUp className="w-6 h-6" />,
        formulas: [
          {
            name: 'μFE (Field-Effect Mobility)',
            symbol: 'μFE = L/(W×Cox×VDS) × gm_max',
            formula: 'μFE = L/(W×Cox×VDS) × gm_max',
            unit: 'cm²/V·s',
            description: 'Linear 측정에서 계산되는 기본 이동도',
            getImplementation: () => extractFunctionCode(CalculationUtils.calculateMuFE),
            codeLocation: 'src/pages/analysis/calculationUtils.js',
            usedIn: ['Linear 분석', '통합 분석'],
            actualFunction: CalculationUtils.calculateMuFE
          },
          {
            name: 'μ0 (Low-field Mobility)',
            symbol: 'μ0 = A²L/(Cox×VD×W)',
            formula: 'Y-function method로 계산: μ0 = A²L/(Cox×VD×W)',
            unit: 'cm²/V·s',
            description: 'Y-function method를 사용한 저전계 이동도',
            getImplementation: () => extractFunctionCode(CalculationUtils.calculateMu0UsingYFunction),
            codeLocation: 'src/pages/analysis/calculationUtils.js',
            usedIn: ['통합 분석', 'μeff 계산'],
            actualFunction: CalculationUtils.calculateMu0UsingYFunction
          },
          {
            name: 'μeff (Effective Mobility)',
            symbol: 'μeff = μ0 / (1 + θ(VG - Vth))',
            formula: 'μeff = μ0 / (1 + θ(VG - Vth))',
            unit: 'cm²/V·s',
            description: '실제 동작 조건에서의 유효 이동도',
            getImplementation: () => extractFunctionCode(CalculationUtils.calculateMuEff),
            codeLocation: 'src/pages/analysis/calculationUtils.js',
            usedIn: ['통합 분석'],
            actualFunction: CalculationUtils.calculateMuEff
          },
          {
            name: 'θ (Mobility Degradation Factor)',
            symbol: 'θ = (μ0×W×Cox×VD)/(ID×L) - 1/(VG-Vth)',
            formula: 'θ = (μ0×W×Cox×VD)/(ID×L) - 1/(VG-Vth)',
            unit: 'V⁻¹',
            description: '게이트 전압 증가에 따른 이동도 감소 계수',
            getImplementation: () => extractFunctionCode(CalculationUtils.calculateTheta),
            codeLocation: 'src/pages/analysis/calculationUtils.js',
            usedIn: ['통합 분석'],
            actualFunction: CalculationUtils.calculateTheta
          }
        ]
      },
      {
        id: 'threshold_switching_group',
        title: '⚡ Threshold & Switching 그룹',
        description: 'Vth, SS, Dit - 실제 동작하는 문턱전압 및 스위칭 특성',
        icon: <Zap className="w-6 h-6" />,
        formulas: [
          {
            name: 'Vth (Threshold Voltage)',
            symbol: 'Vth = Vg_at_gm_max - Id_at_gm_max / gm_max',
            formula: 'Linear Extrapolation Method (선형 외삽법)',
            unit: 'V',
            description: 'Linear 측정 데이터의 gm_max 지점의 접선을 이용해 문턱전압을 계산합니다.',
            getImplementation: () => extractFunctionCode(AnalysisEngine.calculateVthFromLinear),
            codeLocation: 'src/pages/analysis/analysisEngine.js',
            usedIn: ['Linear 분석', '통합 분석'],
            actualFunction: AnalysisEngine.calculateVthFromLinear
          },
          {
            name: 'SS (Subthreshold Swing)',
            symbol: 'SS = [d(log₁₀|I_D|)/dV_G]⁻¹',
            formula: 'SS = 1 / slope_of_logID_vs_VG',
            unit: 'V/decade',
            description: 'Linear 측정 데이터의 Subthreshold 영역에서 전류를 10배 증가시키는 데 필요한 게이트 전압입니다.',
            getImplementation: () => extractFunctionCode(CalculationUtils.calculateSubthresholdSwing),
            codeLocation: 'src/pages/analysis/calculationUtils.js',
            usedIn: ['Linear 분석', 'Dit 계산', '통합 분석'],
            actualFunction: CalculationUtils.calculateSubthresholdSwing
          },
          {
            name: 'Dit (Interface Trap Density)',
            symbol: 'Dit = [SS·q/(k_B·T·ln10) - 1] · C_ox/q',
            formula: 'Dit = (Cox/q) × (SS/(2.3×kT/q) - 1)',
            unit: 'cm⁻²eV⁻¹',
            description: 'Linear 측정에서 계산된 SS 값을 이용하여 산화막-반도체 계면의 트랩 밀도를 추정합니다.',
            getImplementation: () => extractFunctionCode(CalculationUtils.calculateDit),
            codeLocation: 'src/pages/analysis/calculationUtils.js',
            usedIn: ['Linear 분석', '통합 분석'],
            actualFunction: CalculationUtils.calculateDit
          }
        ]
      },
      {
        id: 'performance_group',
        title: '📈 Performance 그룹',
        description: 'Ion, Ioff, On/Off ratio, Ron, ID_sat - 실제 동작하는 성능 파라미터들',
        icon: <BarChart3 className="w-6 h-6" />,
        formulas: [
          {
            name: 'Ion & Ioff (On/Off Current)',
            symbol: 'Ion = max(ID), Ioff = min(ID)',
            formula: 'Ion = maximum ID value, Ioff = minimum ID value',
            unit: 'A',
            description: '최대/최소 드레인 전류',
            getImplementation: () => extractFunctionCode(DataAnalysis.calculateIonIoff),
            codeLocation: 'src/pages/analysis/dataAnalysis.js',
            usedIn: ['Linear 분석', '통합 분석'],
            actualFunction: DataAnalysis.calculateIonIoff
          },
          {
            name: 'Ron (On Resistance)',
            symbol: 'Ron = 1/slope = dVD/dID',
            formula: 'Ron = 1/slope (선형 영역)',
            unit: 'Ω',
            description: '선형 영역에서의 드레인 저항',
            getImplementation: () => extractFunctionCode(DataAnalysis.calculateRon),
            codeLocation: 'src/pages/analysis/dataAnalysis.js',
            usedIn: ['IDVD 분석'],
            actualFunction: DataAnalysis.calculateRon
          }
        ]
      },
      {
        id: 'stability_group',
        title: '🔄 Stability 그룹',
        description: 'ΔVth - 실제 동작하는 안정성 파라미터',
        icon: <Layers className="w-6 h-6" />,
        formulas: [
          {
            name: 'ΔVth (Hysteresis)',
            symbol: 'ΔVth = |Vth_forward - Vth_backward|',
            formula: 'ΔVth = |Vth_forward - Vth_backward|',
            unit: 'V',
            description: 'Forward/Backward sweep에서의 문턱전압 차이',
            getImplementation: () => extractFunctionCode(DataAnalysis.calculateHysteresis),
            codeLocation: 'src/pages/analysis/dataAnalysis.js',
            usedIn: ['Hysteresis 분석', '통합 분석'],
            actualFunction: DataAnalysis.calculateHysteresis
          }
        ]
      },
      {
        id: 'core_utilities',
        title: '🧮 Core Utilities',
        description: '핵심 유틸리티 함수들 - Cox, 선형회귀 등',
        icon: <Calculator className="w-6 h-6" />,
        formulas: [
          {
            name: 'Cox (Gate Capacitance)',
            symbol: 'Cox = (ε0 × εr) / tox',
            formula: 'Cox = (ε0 × εr) / tox',
            unit: 'F/m²',
            description: '게이트 산화막 정전용량',
            getImplementation: () => extractFunctionCode(CalculationUtils.calculateCox),
            codeLocation: 'src/pages/analysis/calculationUtils.js',
            usedIn: ['모든 이동도 계산', 'Dit 계산'],
            actualFunction: CalculationUtils.calculateCox
          },
          {
            name: 'Linear Regression',
            symbol: 'y = mx + b',
            formula: 'slope = (nΣxy - ΣxΣy) / (nΣx² - (Σx)²)',
            unit: '무차원',
            description: '선형 회귀 계산 (모든 외삽법의 기초)',
            getImplementation: () => extractFunctionCode(CalculationUtils.calculateLinearRegression),
            codeLocation: 'src/pages/analysis/calculationUtils.js',
            usedIn: ['Vth 계산', 'Y-function', 'θ 계산'],
            actualFunction: CalculationUtils.calculateLinearRegression
          }
        ]
      }
    ];
  }, []);

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? '' : section);
  };

  const toggleImplementation = (formulaName) => {
    setShowImplementation(prev => ({
      ...prev,
      [formulaName]: !prev[formulaName]
    }));
  };

  // 🔥 실제 함수/상수 실행 테스트 (개발용)
  const testFunction = (formula) => {
    if (formula.actualFunction) {
      console.log(`Testing Function ${formula.name}:`, formula.actualFunction);
      return `✅ Function ${formula.name} is available`;
    } else if (formula.actualConstant) {
      console.log(`Testing Constant ${formula.name}:`, formula.actualConstant);
      return `✅ Constant ${formula.name} is available`;
    }
    return `⚠️ ${formula.name} not directly testable`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      {/* 헤더 */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center mb-3">
          <Code className="w-8 h-8 text-blue-600 mr-3" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">🔥 Dynamic TFT 파라미터 코드 점검기</h2>
          <p className="text-gray-600">실제 동작하는 코드에서 동적으로 추출된 TFT 분석 파라미터들</p>
          <div className="mt-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg inline-block">
            <strong>✨ 자동 동기화:</strong> 실제 코드 수정 시 자동으로 반영됩니다
          </div>
        </div>
      </div>

      {/* 수식 카테고리들 */}
      <div className="space-y-4">
        {getFormulaCategories.map((category) => (
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
                            {formula.actualFunction && (
                              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                🔗 Live Function
                              </span>
                            )}
                            {formula.actualConstant && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                📊 Live Constant
                              </span>
                            )}
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
                        
                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => toggleImplementation(formula.name)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {showImplementation[formula.name] ? '코드 숨기기' : '실제 코드 보기'}
                          </button>
                        </div>
                      </div>

                      {showImplementation[formula.name] && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-gray-700 flex items-center">
                              <Calculator className="w-4 h-4 mr-2" />
                              실제 동작 코드 (실시간 추출됨)
                            </h5>
                          </div>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                            <code>{formula.getImplementation()}</code>
                          </pre>
                          
                          {/* 함수/상수 메타데이터 표시 */}
                          {formula.actualFunction && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <h6 className="font-semibold text-blue-800 mb-2">🔍 함수 메타데이터</h6>
                              <div className="text-sm text-blue-700 space-y-1">
                                <p><strong>함수명:</strong> {formula.actualFunction.name}</p>
                                <p><strong>파라미터 개수:</strong> {formula.actualFunction.length}</p>
                                <p><strong>타입:</strong> {typeof formula.actualFunction}</p>
                                <p><strong>코드 길이:</strong> {formula.actualFunction.toString().length} 문자</p>
                              </div>
                            </div>
                          )}
                          
                          {formula.actualConstant && (
                            <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                              <h6 className="font-semibold text-purple-800 mb-2">📊 상수 메타데이터</h6>
                              <div className="text-sm text-purple-700 space-y-1">
                                <p><strong>타입:</strong> {typeof formula.actualConstant}</p>
                                <p><strong>키 개수:</strong> {Object.keys(formula.actualConstant || {}).length}</p>
                                <p><strong>최종 수정:</strong> 실시간 동기화됨</p>
                                {Object.keys(formula.actualConstant || {}).length > 0 && (
                                  <p><strong>주요 키:</strong> {Object.keys(formula.actualConstant).slice(0, 3).join(', ')}{Object.keys(formula.actualConstant).length > 3 ? '...' : ''}</p>
                                )}
                              </div>
                            </div>
                          )}
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
          <p><strong>• TFT 수식 정리:</strong> PDF 문서 기준으로 구현</p>
          <p><strong>• Y-function Method:</strong> Ghibaudo, G. (1988). New method for the extraction of MOSFET parameters.</p>
          <p><strong>• Mobility Degradation:</strong> Schroder, D. K. (2006). Semiconductor Material and Device Characterization.</p>
          <p><strong>• Interface Trap Density:</strong> Nicollian, E. H., & Brews, J. R. (1982). MOS Physics and Technology.</p>
          <p><strong>• 동적 코드 추출:</strong> ES6 함수 참조 및 toString() 메소드 활용</p>
        </div>
      </div>
    </div>
  );
};

export default DynamicFormulaInspector;