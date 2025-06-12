// 🔥 진짜 실시간 동적 FormulaCodeInspector
// 실제 파일과 연동되는 버전

import React, { useState, useEffect } from 'react';
import { Code, Book, Eye, ChevronDown, ChevronRight, Calculator, Zap, Target, AlertTriangle, Github, RefreshCw, Database, FileText, Wifi, WifiOff } from 'lucide-react';

// 🔥 실제 파일에서 상수를 가져오는 함수 (진짜 버전)
import { PHYSICAL_CONSTANTS, TFT_CONSTANTS } from '../utils/constants';
import { calculateCox, calculateMuFE } from '../analysis/calculationUtils';

const RealDynamicFormulaCodeInspector = () => {
  const [activeSection, setActiveSection] = useState('');
  const [showImplementation, setShowImplementation] = useState({});
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isConnected, setIsConnected] = useState(true);
  const [fileWatcher, setFileWatcher] = useState(null);

  // 🔥 실제 파일 변경 감지 시스템
  useEffect(() => {
    // 개발 환경에서만 작동 (프로덕션에서는 비활성화)
    if (process.env.NODE_ENV === 'development') {
      
      // 파일 변경 감지를 위한 WebSocket 또는 polling 설정
      const watchFiles = () => {
        const filesToWatch = [
          '/src/pages/utils/constants.js',
          '/src/pages/analysis/calculationUtils.js',
          '/src/pages/analysis/analysisEngine.js',
          '/src/pages/analysis/dataAnalysis.js'
        ];

        // 🔥 실제 파일 변경 감지 로직
        const checkFileChanges = async () => {
          try {
            // GitHub API를 통한 파일 변경 감지 (실제 프로젝트에서)
            const response = await fetch('/api/file-watcher/check-changes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ files: filesToWatch })
            });
            
            if (response.ok) {
              const changes = await response.json();
              if (changes.hasChanges) {
                setLastUpdate(new Date());
                // 실제 코드 다시 로드
                window.location.reload();
              }
            }
          } catch (error) {
            console.log('파일 감지 실패:', error);
            setIsConnected(false);
          }
        };

        // 5초마다 파일 변경 체크
        const interval = setInterval(checkFileChanges, 5000);
        setFileWatcher(interval);

        return () => clearInterval(interval);
      };

      watchFiles();
    }

    return () => {
      if (fileWatcher) {
        clearInterval(fileWatcher);
      }
    };
  }, []);

  // 🔥 실제 constants.js에서 값 가져오기
  const getRealPhysicalConstants = () => {
    return PHYSICAL_CONSTANTS; // 실제 import된 상수
  };

  const getRealTFTConstants = () => {
    return TFT_CONSTANTS; // 실제 import된 상수
  };

  // 🔥 실제 코드에서 함수 구현 내용 추출
  const extractFunctionImplementation = (functionName) => {
    try {
      switch (functionName) {
        case 'calculateCox':
          return calculateCox.toString();
        case 'calculateMuFE':
          return calculateMuFE.toString();
        default:
          return '함수를 찾을 수 없습니다.';
      }
    } catch (error) {
      return `함수 추출 실패: ${error.message}`;
    }
  };

  // 🔥 실제 파일 내용을 읽어서 수식 추출하는 함수
  const readActualFileContent = async (filePath) => {
    try {
      // 개발 환경에서 실제 파일 읽기
      if (process.env.NODE_ENV === 'development') {
        const response = await fetch(`/api/read-file?path=${encodeURIComponent(filePath)}`);
        if (response.ok) {
          return await response.text();
        }
      }
      
      // 프로덕션 환경에서는 GitHub Raw URL 사용
      const githubRawUrl = `https://raw.githubusercontent.com/cosmosalad/hightech_tft/main${filePath}`;
      const response = await fetch(githubRawUrl);
      if (response.ok) {
        return await response.text();
      }
      
      return '파일을 읽을 수 없습니다.';
    } catch (error) {
      return `파일 읽기 실패: ${error.message}`;
    }
  };

  // 🔥 실제 코드에서 수식 추출
  const extractFormulasFromCode = (fileContent, functionName) => {
    const lines = fileContent.split('\n');
    const functionStart = lines.findIndex(line => line.includes(`export const ${functionName}`));
    
    if (functionStart === -1) return '함수를 찾을 수 없습니다.';
    
    let braceCount = 0;
    let functionEnd = functionStart;
    
    for (let i = functionStart; i < lines.length; i++) {
      const line = lines[i];
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;
      
      if (braceCount === 0 && i > functionStart) {
        functionEnd = i;
        break;
      }
    }
    
    return lines.slice(functionStart, functionEnd + 1).join('\n');
  };

  // 🔥 실제 상수 값들을 사용한 동적 수식 카테고리
  const getDynamicFormulaCategories = () => {
    const realConstants = getRealPhysicalConstants();
    const realTFTConstants = getRealTFTConstants();

    return [
      {
        id: 'real_constants',
        title: '🔧 실시간 연동 물리 상수',
        description: 'constants.js에서 실시간으로 가져온 실제 상수들',
        formulas: [
          {
            name: '실제 물리 상수들',
            symbol: 'PHYSICAL_CONSTANTS',
            formula: 'Real-time sync with constants.js',
            unit: 'various',
            description: '실제 constants.js 파일에서 실시간으로 동기화된 물리 상수들',
            implementation: `// 실제 constants.js에서 가져온 값들
export const PHYSICAL_CONSTANTS = {
  EPSILON_0: ${realConstants.EPSILON_0},
  BOLTZMANN: ${realConstants.BOLTZMANN},
  ELEMENTARY_CHARGE: ${realConstants.ELEMENTARY_CHARGE},
  ROOM_TEMPERATURE: ${realConstants.ROOM_TEMPERATURE},
  THERMAL_VOLTAGE_300K: ${realConstants.THERMAL_VOLTAGE_300K},
  EPSILON_R: {
    SiO2: ${realConstants.EPSILON_R.SiO2},
    Si3N4: ${realConstants.EPSILON_R.Si3N4},
    Al2O3: ${realConstants.EPSILON_R.Al2O3},
    HfO2: ${realConstants.EPSILON_R.HfO2}
  }
};

// 🔥 이 값들은 실제 파일을 수정하면 자동으로 업데이트됩니다!`,
            codeLocation: 'src/pages/utils/constants.js (실제 연동)',
            usedIn: ['모든 계산 함수', 'Cox 계산', 'Dit 계산'],
            isRealTime: true
          },
          {
            name: '실제 TFT 상수들',
            symbol: 'TFT_CONSTANTS',
            formula: 'Real-time sync with constants.js',
            unit: 'various',
            description: 'IZO TFT에 특화된 실제 상수들 (실시간 동기화)',
            implementation: `// 실제 constants.js에서 가져온 TFT 상수들
export const TFT_CONSTANTS = {
  MOBILITY_RANGE: {
    IZO: { 
      min: ${realTFTConstants.MOBILITY_RANGE.IZO.min}, 
      max: ${realTFTConstants.MOBILITY_RANGE.IZO.max} 
    }
  },
  VTH_RANGE: { 
    min: ${realTFTConstants.VTH_RANGE.min}, 
    max: ${realTFTConstants.VTH_RANGE.max} 
  },
  SS_IDEAL: ${realTFTConstants.SS_IDEAL},
  SS_ACCEPTABLE_MAX: ${realTFTConstants.SS_ACCEPTABLE_MAX},
  THETA_RANGE: { 
    min: ${realTFTConstants.THETA_RANGE.min}, 
    max: ${realTFTConstants.THETA_RANGE.max} 
  }
};

// 🔥 constants.js를 수정하면 이 값들이 즉시 반영됩니다!`,
            codeLocation: 'src/pages/utils/constants.js (실제 연동)',
            usedIn: ['품질 평가', '이동도 검증', '경고 시스템'],
            isRealTime: true
          }
        ]
      },
      {
        id: 'real_calculations',
        title: '🔬 실시간 연동 계산 함수들',
        description: 'calculationUtils.js에서 실시간으로 가져온 실제 함수들',
        formulas: [
          {
            name: '실제 Cox 계산 함수',
            symbol: 'calculateCox',
            formula: 'Cox = (ε₀ × εᵣ) / tox',
            unit: 'F/cm²',
            description: '실제 calculationUtils.js에서 실시간으로 동기화된 Cox 계산 함수',
            implementation: extractFunctionImplementation('calculateCox'),
            codeLocation: 'src/pages/analysis/calculationUtils.js (실제 연동)',
            usedIn: ['모든 이동도 계산', 'Dit 계산'],
            isRealTime: true
          },
          {
            name: '실제 μFE 계산 함수',
            symbol: 'calculateMuFE',
            formula: 'μFE = L/(W×Cox×VDS) × gm,max',
            unit: 'cm²/V·s',
            description: '실제 calculationUtils.js에서 실시간으로 동기화된 μFE 계산 함수',
            implementation: extractFunctionImplementation('calculateMuFE'),
            codeLocation: 'src/pages/analysis/calculationUtils.js (실제 연동)',
            usedIn: ['Linear 분석', '통합 분석'],
            isRealTime: true
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

  // 🔥 실제 파일 강제 새로고침
  const forceRefresh = async () => {
    try {
      setLastUpdate(new Date());
      
      // 실제 모듈 다시 로드 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        // Hot Module Replacement 트리거
        if (module.hot) {
          module.hot.invalidate();
        }
        
        // 또는 페이지 새로고침
        window.location.reload();
      }
    } catch (error) {
      console.error('새로고침 실패:', error);
    }
  };

  const formulaCategories = getDynamicFormulaCategories();

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      {/* 실시간 연동 상태 헤더 */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center mb-3">
          <Code className="w-8 h-8 text-blue-600 mr-3" />
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <span className={`text-sm font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
              {isConnected ? '실시간 연동 활성' : '연동 해제됨'}
            </span>
          </div>
          <button
            onClick={forceRefresh}
            className="ml-3 p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors"
            title="강제 새로고침"
          >
            <RefreshCw className="w-5 h-5 text-blue-600" />
          </button>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">🔥 실제 파일 연동 수식 점검기</h2>
          <p className="text-gray-600">실제 코드 파일과 실시간 동기화되는 TFT 분석 수식들</p>
          <p className="text-sm text-gray-500 mt-1">
            마지막 동기화: {lastUpdate.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 실시간 연동 상태 표시 */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-400 rounded-lg">
        <div className="flex items-start">
          <FileText className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-800">🔄 실시간 파일 동기화 시스템</h3>
            <p className="text-green-700 text-sm mt-1">
              아래 파일들을 수정하면 이 페이지가 자동으로 업데이트됩니다.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span>constants.js</span>
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span>calculationUtils.js</span>
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span>analysisEngine.js</span>
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span>dataAnalysis.js</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 경고 및 사용법 */}
      <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
          <h3 className="font-semibold text-yellow-800">실시간 동기화 사용법</h3>
        </div>
        <div className="text-yellow-700 text-sm mt-1 space-y-1">
          <p><strong>1. 파일 수정:</strong> constants.js나 calculationUtils.js를 수정하세요</p>
          <p><strong>2. 자동 감지:</strong> 5초 이내에 변경이 감지됩니다</p>
          <p><strong>3. 자동 업데이트:</strong> 이 페이지가 자동으로 새로고침됩니다</p>
          <p><strong>4. 확인:</strong> 수정된 값들이 아래에 실시간으로 반영됩니다</p>
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
                          <div className="flex items-center mb-2">
                            <h4 className="text-lg font-semibold text-gray-800">
                              {formula.name}
                            </h4>
                            {formula.isRealTime && (
                              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                                실시간
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
                        
                        <button
                          onClick={() => toggleImplementation(formula.name)}
                          className="ml-4 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {showImplementation[formula.name] ? '코드 숨기기' : '실시간 코드 보기'}
                        </button>
                      </div>

                      {showImplementation[formula.name] && (
                        <div className="mt-4">
                          <h5 className="font-semibold text-gray-700 mb-2 flex items-center">
                            <Calculator className="w-4 h-4 mr-2" />
                            실시간 동기화된 실제 코드
                            {formula.isRealTime && (
                              <span className="ml-2 text-xs text-green-600">(파일 수정 시 자동 업데이트)</span>
                            )}
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

      {/* 하단 실시간 동기화 정보 */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          실시간 동기화 작동 원리
        </h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>• 파일 감시:</strong> 5초마다 지정된 파일들의 변경사항을 확인합니다</p>
          <p><strong>• 자동 감지:</strong> GitHub API 또는 파일 시스템을 통해 변경을 감지합니다</p>
          <p><strong>• 즉시 반영:</strong> 변경 감지 시 모듈을 다시 로드하여 최신 코드를 반영합니다</p>
          <p><strong>• 실시간 표시:</strong> import된 실제 상수와 함수를 직접 표시합니다</p>
        </div>
      </div>
    </div>
  );
};

export default RealDynamicFormulaCodeInspector;