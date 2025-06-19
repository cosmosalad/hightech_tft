import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Home, 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Download, 
  ChevronRight, 
  Zap, 
  Target, 
  Flame, 
  Thermometer, 
  Gauge, 
  BarChart3,
  Microscope
} from 'lucide-react';

// 새로운 모듈들 import
import { PhysicsEngine } from '../simulator/core/PhysicsEngine';
import { ProcessModels } from '../simulator/core/ProcessModels';
import { MaterialDatabase } from '../simulator/core/MaterialDatabase';
import { Furnace } from '../simulator/equipment/Furnace';
import { Sputterer } from '../simulator/equipment/Sputterer';
import { EBeam } from '../simulator/equipment/EBeam';
import { ElectricalAnalysis } from '../simulator/analysis/ElectricalAnalysis';

const ProcessSimulator = ({ onNavigateHome, onNavigateBack }) => {
  // 시뮬레이터 상태
  const [currentStep, setCurrentStep] = useState('equipment'); // 'equipment', 'recipe', 'simulation'
  const [selectedEquipments, setSelectedEquipments] = useState([]);
  const [recipes, setRecipes] = useState([]);
  
  // 애니메이션 상태
  const [animationStep, setAnimationStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [layerThickness, setLayerThickness] = useState([]);
  const [currentParams, setCurrentParams] = useState({});
  const [completedCycles, setCompletedCycles] = useState(0);
  const [processResults, setProcessResults] = useState([]);
  
  // 장비 인스턴스들
  const [equipmentInstances] = useState({
    furnace: new Furnace(),
    sputterer: new Sputterer(),
    ebeam: new EBeam()
  });
  
  const intervalRef = useRef(null);
  const stepTimerRef = useRef(null);

  // 장비 타입 정의 (MaterialDatabase 사용)
  const equipmentTypes = [
    {
      id: 'oxidation',
      name: '열산화 (Furnace)',
      icon: <Flame className="w-8 h-8" />,
      description: 'SiO₂ 절연층 형성',
      materials: ['SiO₂'],
      color: 'red',
      instance: equipmentInstances.furnace
    },
    {
      id: 'sputtering',
      name: 'RF 스퍼터링',
      icon: <Target className="w-8 h-8" />,
      description: '반도체/금속 박막 증착',
      materials: ['IZO', 'ITO', 'AZO'],
      color: 'purple',
      instance: equipmentInstances.sputterer
    },
    {
      id: 'evaporation',
      name: 'E-beam 증착',
      icon: <Zap className="w-8 h-8" />,
      description: '금속 전극 형성',
      materials: ['Al', 'Au', 'Ti', 'Cr'],
      color: 'blue',
      instance: equipmentInstances.ebeam
    }
  ];

  // 실제 물리 계산 함수들
  const calculateProcessResults = () => {
    const results = [];
    let totalLayers = [];
    
    selectedEquipments.forEach((equipment, index) => {
      const recipe = recipes[index] || {};
      let result;
      
      // 실제 PhysicsEngine과 ProcessModels 사용
      switch (equipment.id) {
        case 'oxidation':
          result = ProcessModels.oxidationModel(recipe);
          break;
        case 'sputtering':
          result = ProcessModels.sputteringModel(recipe);
          break;
        case 'evaporation':
          result = ProcessModels.evaporationModel(recipe);
          break;
        default:
          result = { thickness: 50, uniformity: 90 };
      }
      
      results.push(result);
      totalLayers.push({
        material: recipe.material || 'Unknown',
        thickness: result.thickness,
        properties: result
      });
    });
    
    setProcessResults(results);
    
    // 전기적 특성 계산
    const tftProps = ElectricalAnalysis.calculateTFTParameters(totalLayers);
    console.log('계산된 TFT 특성:', tftProps);
    
    return results;
  };

  // 장비 선택 핸들러
  const handleEquipmentChange = (equipment) => {
    const isSelected = selectedEquipments.some(eq => eq.id === equipment.id);
    
    if (isSelected) {
      setSelectedEquipments(prev => prev.filter(eq => eq.id !== equipment.id));
    } else {
      setSelectedEquipments(prev => [...prev, equipment]);
    }
  };

  // 단계별 네비게이션
  const handleEquipmentNext = () => {
    setRecipes(new Array(selectedEquipments.length).fill({}));
    setCurrentStep('recipe');
  };

  const handleRecipeNext = () => {
    calculateProcessResults(); // 실제 물리 계산 실행
    setCurrentStep('simulation');
  };

  const handleStartOver = () => {
    setCurrentStep('equipment');
    setSelectedEquipments([]);
    setRecipes([]);
    setProcessResults([]);
  };

  // 레시피 파라미터 변경
  const handleParameterChange = (equipmentIndex, parameter, value) => {
    const newRecipes = [...recipes];
    newRecipes[equipmentIndex] = {
      ...newRecipes[equipmentIndex],
      [parameter]: value
    };
    setRecipes(newRecipes);
  };

  // 공정별 파라미터 필드
  const getParameterFields = (equipment) => {
    switch (equipment.id) {
      case 'oxidation':
        return [
          { key: 'temperature', label: '온도 (°C)', min: 800, max: 1200, default: 1000 },
          { key: 'time', label: '시간 (분)', min: 30, max: 480, default: 120 },
          { key: 'atmosphere', label: '분위기', type: 'select', options: ['O₂', 'H₂O + O₂', 'Dry O₂'], default: 'O₂' }
        ];
      case 'sputtering':
        return [
          { key: 'power', label: 'RF 파워 (W)', min: 50, max: 500, default: 150 },
          { key: 'pressure', label: '압력 (mTorr)', min: 1, max: 20, default: 5, step: 0.1 },
          { key: 'temperature', label: '온도 (°C)', min: 25, max: 300, default: 100 },
          { key: 'time', label: '시간 (분)', min: 5, max: 120, default: 30 },
          { key: 'material', label: '타겟 재료', type: 'select', options: ['IZO', 'ITO', 'AZO'], default: 'IZO' }
        ];
      case 'evaporation':
        return [
          { key: 'power', label: 'E-beam 파워 (kW)', min: 1, max: 10, default: 3, step: 0.1 },
          { key: 'pressure', label: '진공도 (Torr)', min: 1e-7, max: 1e-5, default: 1e-6, step: 1e-7 },
          { key: 'temperature', label: '온도 (°C)', min: 25, max: 100, default: 25 },
          { key: 'time', label: '시간 (분)', min: 5, max: 60, default: 15 },
          { key: 'material', label: '재료', type: 'select', options: ['Al', 'Au', 'Ti', 'Cr'], default: 'Al' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 네비게이션 헤더 */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onNavigateBack}
                className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                소개로 돌아가기
              </button>
              
              <button
                onClick={onNavigateHome}
                className="flex items-center px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm"
              >
                <Home className="w-4 h-4 mr-2" />
                홈으로
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              TFT Process Simulator v2.0 - Physics Engine
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-6xl mx-auto p-6">
        
        {/* 진행 단계 표시 */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            currentStep === 'equipment' ? 'bg-blue-100 text-blue-700' : 
            selectedEquipments.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">장비 선택</span>
          </div>
          
          <ChevronRight className="w-4 h-4 text-gray-400" />
          
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            currentStep === 'recipe' ? 'bg-blue-100 text-blue-700' : 
            recipes.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <Gauge className="w-4 h-4" />
            <span className="text-sm font-medium">레시피 설정</span>
          </div>
          
          <ChevronRight className="w-4 h-4 text-gray-400" />
          
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            currentStep === 'simulation' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <Play className="w-4 h-4" />
            <span className="text-sm font-medium">시뮬레이션</span>
          </div>
        </div>

        {/* 장비 선택 단계 */}
        {currentStep === 'equipment' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">TFT 공정 장비 선택</h2>
              <p className="text-gray-600">물리 엔진 기반 정밀 시뮬레이션을 위한 장비를 선택하세요</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {equipmentTypes.map((equipment) => {
                const isSelected = selectedEquipments.some(eq => eq.id === equipment.id);
                
                return (
                  <div
                    key={equipment.id}
                    className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                      isSelected ? 'ring-4 scale-105 bg-blue-50 border-blue-400 ring-blue-300' : 'hover:scale-102 hover:shadow-lg'
                    }`}
                    onClick={() => handleEquipmentChange(equipment)}
                  >
                    <div className="text-center">
                      <div className={`p-4 rounded-lg mb-4 mx-auto w-fit ${
                        equipment.color === 'red' ? 'bg-red-100 text-red-600' :
                        equipment.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {equipment.icon}
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{equipment.name}</h3>
                      <p className="text-gray-600 mb-4">{equipment.description}</p>
                      
                      <div className="text-sm text-gray-500 mb-4">
                        재료: {equipment.materials.join(', ')}
                      </div>

                      {isSelected && (
                        <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full mx-auto">
                          <span className="text-white font-bold text-sm">
                            {selectedEquipments.findIndex(eq => eq.id === equipment.id) + 1}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center">
              <button
                onClick={handleEquipmentNext}
                disabled={selectedEquipments.length === 0}
                className={`px-8 py-3 rounded-xl font-bold text-lg transition-all duration-300 ${
                  selectedEquipments.length > 0
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                레시피 설정 단계로 →
              </button>
            </div>
          </div>
        )}

        {/* 레시피 설정 단계 */}
        {currentStep === 'recipe' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">공정 레시피 설정</h2>
              <p className="text-gray-600">Arrhenius 방정식 기반 정밀 계산을 위한 파라미터 설정</p>
            </div>

            <div className="space-y-6 mb-8">
              {selectedEquipments.map((equipment, index) => {
                const parameters = getParameterFields(equipment);
                const currentRecipe = recipes[index] || {};

                return (
                  <div key={`recipe-${equipment.id}-${index}`} className="bg-white rounded-xl shadow-lg border p-6">
                    <div className="flex items-center mb-6">
                      <div className={`p-3 rounded-lg mr-4 ${
                        equipment.color === 'red' ? 'bg-red-100 text-red-600' :
                        equipment.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {equipment.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Step {index + 1}: {equipment.name}</h3>
                        <p className="text-gray-600">{equipment.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {parameters.map((param) => (
                        <div key={param.key} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {param.label}
                          </label>
                          {param.type === 'select' ? (
                            <select
                              value={currentRecipe[param.key] || param.default}
                              onChange={(e) => handleParameterChange(index, param.key, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {param.options.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="number"
                              min={param.min}
                              max={param.max}
                              step={param.step || 1}
                              value={currentRecipe[param.key] || param.default}
                              onChange={(e) => handleParameterChange(index, param.key, Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep('equipment')}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-400 transition-colors"
              >
                ← 장비 선택으로 돌아가기
              </button>
              
              <button
                onClick={handleRecipeNext}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                물리 시뮬레이션 시작 🚀
              </button>
            </div>
          </div>
        )}

        {/* 시뮬레이션 결과 단계 */}
        {currentStep === 'simulation' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">시뮬레이션 결과</h2>
              <p className="text-gray-600">물리 엔진 계산 결과</p>
            </div>

            {/* 결과 표시 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {processResults.map((result, index) => {
                const equipment = selectedEquipments[index];
                const recipe = recipes[index];
                
                return (
                  <div key={index} className="bg-white rounded-xl shadow-lg border p-6">
                    <div className="flex items-center mb-4">
                      <div className={`p-2 rounded-lg mr-3 ${
                        equipment.color === 'red' ? 'bg-red-100 text-red-600' :
                        equipment.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {equipment.icon}
                      </div>
                      <h3 className="text-lg font-bold">{equipment.name}</h3>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>두께:</span>
                        <span className="font-mono">{result.thickness?.toFixed(1)} nm</span>
                      </div>
                      <div className="flex justify-between">
                        <span>균일성:</span>
                        <span className="font-mono">{result.uniformity?.toFixed(1)}%</span>
                      </div>
                      {result.resistivity && (
                        <div className="flex justify-between">
                          <span>저항률:</span>
                          <span className="font-mono">{result.resistivity?.toExponential(2)} Ω·cm</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>재료:</span>
                        <span className="font-mono">{recipe.material || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center">
              <button
                onClick={handleStartOver}
                className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                새로운 시뮬레이션 시작
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessSimulator;