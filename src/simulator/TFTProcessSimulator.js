import React, { useState } from 'react';
import { Play, Settings, Zap, Thermometer, Gauge, Clock, ChevronRight, Layers, Microscope, Target, Flame } from 'lucide-react';
import ProcessAnimationEngine from './ProcessAnimationEngine'; // 경로 수정

// 장비 선택 모듈 (기존과 동일)
const EquipmentSelector = ({ selectedEquipments, onEquipmentChange, onNext }) => {
  // ... 기존 코드 그대로
  const equipmentTypes = [
    {
      id: 'oxidation',
      name: '열산화 (Furnace)',
      icon: <Flame className="w-8 h-8" />,
      description: 'SiO₂ 절연층 형성',
      materials: ['SiO₂'],
      processes: ['Dry Oxidation', 'Wet Oxidation', 'Steam Oxidation'],
      color: 'red'
    },
    {
      id: 'sputtering',
      name: 'RF 스퍼터링',
      icon: <Target className="w-8 h-8" />,
      description: '반도체/금속 박막 증착',
      materials: ['IZO', 'ITO', 'AZO', 'Al', 'Ti', 'Mo'],
      processes: ['RF Sputtering', 'DC Sputtering', 'Reactive Sputtering'],
      color: 'purple'
    },
    {
      id: 'evaporation',
      name: 'E-beam 증착',
      icon: <Zap className="w-8 h-8" />,
      description: '금속 전극 형성',
      materials: ['Al', 'Au', 'Ti', 'Cr', 'Cu'],
      processes: ['E-beam Evaporation', 'Thermal Evaporation'],
      color: 'blue'
    },
    {
      id: 'pecvd',
      name: 'PECVD',
      icon: <Layers className="w-8 h-8" />,
      description: '플라즈마 화학기상증착',
      materials: ['SiNx', 'SiO₂', 'a-Si:H'],
      processes: ['PECVD', 'RF PECVD', 'MW PECVD'],
      color: 'green'
    },
    {
      id: 'etching',
      name: '플라즈마 식각',
      icon: <Zap className="w-8 h-8" />,
      description: '선택적 레이어 제거',
      materials: ['Dry Etch', 'Wet Etch', 'RIE'],
      processes: ['RIE', 'ICP', 'CCP Etching'],
      color: 'orange'
    }
  ];

  const getColorClasses = (color, selected) => {
    const baseClasses = selected ? 'ring-4 scale-105' : 'hover:scale-102';
    switch (color) {
      case 'red':
        return `${baseClasses} ${selected ? 'ring-red-300 bg-red-50 border-red-400' : 'hover:border-red-300 hover:bg-red-25'}`;
      case 'purple':
        return `${baseClasses} ${selected ? 'ring-purple-300 bg-purple-50 border-purple-400' : 'hover:border-purple-300 hover:bg-purple-25'}`;
      case 'blue':
        return `${baseClasses} ${selected ? 'ring-blue-300 bg-blue-50 border-blue-400' : 'hover:border-blue-300 hover:bg-blue-25'}`;
      case 'green':
        return `${baseClasses} ${selected ? 'ring-green-300 bg-green-50 border-green-400' : 'hover:border-green-300 hover:bg-green-25'}`;
      case 'orange':
        return `${baseClasses} ${selected ? 'ring-orange-300 bg-orange-50 border-orange-400' : 'hover:border-orange-300 hover:bg-orange-25'}`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">TFT 공정 장비 선택</h2>
        <p className="text-gray-600">시뮬레이션할 장비들을 선택하고 순서를 정하세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {equipmentTypes.map((equipment) => {
          const isSelected = selectedEquipments.some(eq => eq.id === equipment.id);
          
          return (
            <div
              key={equipment.id}
              className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 ${getColorClasses(equipment.color, isSelected)}`}
              onClick={() => onEquipmentChange(equipment)}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${
                  equipment.color === 'red' ? 'bg-red-100 text-red-600' :
                  equipment.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                  equipment.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  equipment.color === 'green' ? 'bg-green-100 text-green-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  {equipment.icon}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{equipment.name}</h3>
                  <p className="text-gray-600 mb-3">{equipment.description}</p>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">재료: </span>
                      <span className="text-sm text-gray-600">{equipment.materials.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">공정: </span>
                      <span className="text-sm text-gray-600">{equipment.processes.join(', ')}</span>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full">
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

      {selectedEquipments.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">선택된 공정 순서</h3>
          <div className="flex flex-wrap items-center gap-2">
            {selectedEquipments.map((equipment, index) => (
              <React.Fragment key={`${equipment.id}-${index}`}>
                <div className={`px-4 py-2 rounded-lg border-2 ${
                  equipment.color === 'red' ? 'bg-red-100 border-red-300 text-red-700' :
                  equipment.color === 'purple' ? 'bg-purple-100 border-purple-300 text-purple-700' :
                  equipment.color === 'blue' ? 'bg-blue-100 border-blue-300 text-blue-700' :
                  equipment.color === 'green' ? 'bg-green-100 border-green-300 text-green-700' :
                  'bg-orange-100 border-orange-300 text-orange-700'
                }`}>
                  <span className="font-medium">{index + 1}. {equipment.name}</span>
                </div>
                {index < selectedEquipments.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={onNext}
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
  );
};

// 레시피 설정 모듈 (기존과 동일)
const RecipeConfiguration = ({ selectedEquipments, recipes, onRecipeChange, onNext, onBack }) => {
  const handleParameterChange = (equipmentIndex, parameter, value) => {
    const newRecipes = [...recipes];
    newRecipes[equipmentIndex] = {
      ...newRecipes[equipmentIndex],
      [parameter]: value
    };
    onRecipeChange(newRecipes);
  };

  const getParameterFields = (equipment) => {
    switch (equipment.id) {
      case 'oxidation':
        return [
          { key: 'temperature', label: '온도 (°C)', min: 800, max: 1200, default: 1000, unit: '°C' },
          { key: 'time', label: '시간 (분)', min: 30, max: 480, default: 120, unit: 'min' },
          { key: 'atmosphere', label: '분위기', type: 'select', options: ['O₂', 'H₂O + O₂', 'Dry O₂'], default: 'O₂' },
          { key: 'targetThickness', label: '목표 두께 (nm)', min: 10, max: 200, default: 50, unit: 'nm' }
        ];
      case 'sputtering':
        return [
          { key: 'power', label: 'RF 파워 (W)', min: 50, max: 500, default: 150, unit: 'W' },
          { key: 'pressure', label: '압력 (mTorr)', min: 1, max: 20, default: 5, unit: 'mTorr', step: 0.1 },
          { key: 'temperature', label: '온도 (°C)', min: 25, max: 300, default: 100, unit: '°C' },
          { key: 'time', label: '시간 (분)', min: 5, max: 120, default: 30, unit: 'min' },
          { key: 'material', label: '타겟 재료', type: 'select', options: ['IZO', 'ITO', 'AZO'], default: 'IZO' },
          { key: 'targetThickness', label: '목표 두께 (nm)', min: 10, max: 100, default: 30, unit: 'nm' }
        ];
      case 'evaporation':
        return [
          { key: 'power', label: 'E-beam 파워 (kW)', min: 1, max: 10, default: 3, unit: 'kW', step: 0.1 },
          { key: 'pressure', label: '진공도 (Torr)', min: 1e-7, max: 1e-5, default: 1e-6, unit: 'Torr', step: 1e-7 },
          { key: 'temperature', label: '온도 (°C)', min: 25, max: 100, default: 25, unit: '°C' },
          { key: 'rate', label: '증착 속도 (Å/s)', min: 0.5, max: 10, default: 2, unit: 'Å/s', step: 0.1 },
          { key: 'material', label: '재료', type: 'select', options: ['Al', 'Au', 'Ti', 'Cr'], default: 'Al' },
          { key: 'targetThickness', label: '목표 두께 (nm)', min: 50, max: 500, default: 100, unit: 'nm' }
        ];
      case 'pecvd':
        return [
          { key: 'power', label: 'RF 파워 (W)', min: 100, max: 1000, default: 300, unit: 'W' },
          { key: 'pressure', label: '압력 (Torr)', min: 0.1, max: 10, default: 1, unit: 'Torr', step: 0.1 },
          { key: 'temperature', label: '온도 (°C)', min: 200, max: 400, default: 300, unit: '°C' },
          { key: 'time', label: '시간 (분)', min: 5, max: 60, default: 20, unit: 'min' },
          { key: 'material', label: '재료', type: 'select', options: ['SiNx', 'SiO₂', 'a-Si:H'], default: 'SiNx' },
          { key: 'targetThickness', label: '목표 두께 (nm)', min: 50, max: 300, default: 100, unit: 'nm' }
        ];
      case 'etching':
        return [
          { key: 'power', label: 'RF 파워 (W)', min: 100, max: 800, default: 200, unit: 'W' },
          { key: 'pressure', label: '압력 (mTorr)', min: 5, max: 100, default: 20, unit: 'mTorr', step: 1 },
          { key: 'temperature', label: '온도 (°C)', min: 25, max: 200, default: 50, unit: '°C' },
          { key: 'time', label: '시간 (분)', min: 1, max: 30, default: 5, unit: 'min' },
          { key: 'etchType', label: '식각 타입', type: 'select', options: ['Dry Etch', 'RIE', 'ICP'], default: 'RIE' },
          { key: 'etchDepth', label: '식각 깊이 (nm)', min: 10, max: 500, default: 50, unit: 'nm' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">공정 레시피 설정</h2>
        <p className="text-gray-600">각 공정 단계의 파라미터를 설정하세요</p>
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
                  equipment.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  equipment.color === 'green' ? 'bg-green-100 text-green-600' :
                  'bg-orange-100 text-orange-600'
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
                      <div className="relative">
                        <input
                          type="number"
                          min={param.min}
                          max={param.max}
                          step={param.step || 1}
                          value={currentRecipe[param.key] || param.default}
                          onChange={(e) => handleParameterChange(index, param.key, Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                        />
                        <span className="absolute right-3 top-2 text-sm text-gray-500">
                          {param.unit}
                        </span>
                      </div>
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
          onClick={onBack}
          className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-400 transition-colors"
        >
          ← 장비 선택으로 돌아가기
        </button>
        
        <button
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          시뮬레이션 시작 🚀
        </button>
      </div>
    </div>
  );
};

// 메인 시뮬레이터 컴포넌트
const TFTProcessSimulator = () => {
  const [currentStep, setCurrentStep] = useState('equipment'); // 'equipment', 'recipe', 'simulation'
  const [selectedEquipments, setSelectedEquipments] = useState([]);
  const [recipes, setRecipes] = useState([]);

  const handleEquipmentChange = (equipment) => {
    const isSelected = selectedEquipments.some(eq => eq.id === equipment.id);
    
    if (isSelected) {
      // 이미 선택된 장비면 제거
      setSelectedEquipments(prev => prev.filter(eq => eq.id !== equipment.id));
    } else {
      // 새로운 장비 추가
      setSelectedEquipments(prev => [...prev, equipment]);
    }
  };

  const handleEquipmentNext = () => {
    // 레시피 배열 초기화
    setRecipes(new Array(selectedEquipments.length).fill({}));
    setCurrentStep('recipe');
  };

  const handleRecipeBack = () => {
    setCurrentStep('equipment');
  };

  const handleRecipeNext = () => {
    setCurrentStep('simulation');
  };

  const handleStartOver = () => {
    setCurrentStep('equipment');
    setSelectedEquipments([]);
    setRecipes([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 헤더 */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
              <Microscope className="w-8 h-8 mr-3 text-blue-500" />
              TFT Process Simulator
            </h1>
            
            {/* 진행 단계 표시 */}
            <div className="flex items-center space-x-4">
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
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="py-8">
        {currentStep === 'equipment' && (
          <EquipmentSelector
            selectedEquipments={selectedEquipments}
            onEquipmentChange={handleEquipmentChange}
            onNext={handleEquipmentNext}
          />
        )}
        
        {currentStep === 'recipe' && (
          <RecipeConfiguration
            selectedEquipments={selectedEquipments}
            recipes={recipes}
            onRecipeChange={setRecipes}
            onNext={handleRecipeNext}
            onBack={handleRecipeBack}
          />
        )}
        
        {currentStep === 'simulation' && (
          <ProcessAnimationEngine 
            selectedEquipments={selectedEquipments}
            recipes={recipes}
            onStartOver={handleStartOver}
          />
        )}
      </div>
    </div>
  );
};

export default TFTProcessSimulator;