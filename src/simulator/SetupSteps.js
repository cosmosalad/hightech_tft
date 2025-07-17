import React from 'react';
import { ChevronRight } from 'lucide-react';
import { equipmentTypes, getParameterFields } from './simulatorData'; // 데이터 import

// 1. 장비 선택 컴포넌트
export const EquipmentSelector = ({ selectedEquipments, onEquipmentChange, onNext, selectionError, isSelectionComplete }) => {
  const getColorClasses = (color, selected) => {
    const baseClasses = selected ? 'ring-4 scale-105' : 'hover:scale-102';
    switch (color) {
      case 'red':
        return `${baseClasses} ${selected ? 'ring-red-300 bg-red-50 border-red-400' : 'hover:border-red-300 hover:bg-red-25'}`;
      case 'purple':
        return `${baseClasses} ${selected ? 'ring-purple-300 bg-purple-50 border-purple-400' : 'hover:border-purple-300 hover:bg-purple-25'}`;
      case 'blue':
        return `${baseClasses} ${selected ? 'ring-blue-300 bg-blue-50 border-blue-400' : 'hover:border-blue-300 hover:bg-blue-25'}`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">TFT 공정 장비 선택</h2>
        <p className="text-gray-600">시뮬레이션할 장비들을 순서에 맞게 선택하세요</p>
        {/* ### 아래 안내 문구를 삭제했습니다 ### */}
      </div>

      {selectionError && (
        <div className="text-center mb-6 bg-red-100 border-2 border-red-300 text-red-700 font-bold p-4 rounded-xl shadow-md">
          {selectionError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {equipmentTypes.map((equipment) => {
          const isSelected = selectedEquipments.some(eq => eq.id === equipment.id);
          return (
            <div key={equipment.id} className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 ${getColorClasses(equipment.color, isSelected)}`} onClick={() => onEquipmentChange(equipment)}>
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${equipment.color === 'red' ? 'bg-red-100 text-red-600' : equipment.color === 'purple' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{equipment.icon}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{equipment.name}</h3>
                  <p className="text-gray-600 mb-3">{equipment.description}</p>
                  <div className="space-y-2">
                    <div><span className="text-sm font-medium text-gray-700">재료: </span><span className="text-sm text-gray-600">{equipment.materials.join(', ')}</span></div>
                    <div><span className="text-sm font-medium text-gray-700">공정: </span><span className="text-sm text-gray-600">{equipment.processes.join(', ')}</span></div>
                  </div>
                </div>
                {isSelected && (<div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full"><span className="text-white font-bold text-sm">{selectedEquipments.findIndex(eq => eq.id === equipment.id) + 1}</span></div>)}
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
                <div className={`px-4 py-2 rounded-lg border-2 ${equipment.color === 'red' ? 'bg-red-100 border-red-300 text-red-700' : equipment.color === 'purple' ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-blue-100 border-blue-300 text-blue-700'}`}><span className="font-medium">{index + 1}. {equipment.name}</span></div>
                {index < selectedEquipments.length - 1 && (<ChevronRight className="w-5 h-5 text-gray-400" />)}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
      <div className="text-center">
        <button onClick={onNext} disabled={!isSelectionComplete} className={`px-8 py-3 rounded-xl font-bold text-lg transition-all duration-300 ${isSelectionComplete ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>레시피 설정 단계로 →</button>
      </div>
    </div>
  );
};

// ... RecipeConfiguration 컴포넌트는 그대로 ...
export const RecipeConfiguration = ({ selectedEquipments, recipes, onRecipeChange, onNext, onBack }) => {
  const handleParameterChange = (equipmentIndex, parameter, value) => {
    const newRecipes = [...recipes];
    newRecipes[equipmentIndex] = { ...newRecipes[equipmentIndex], [parameter]: value };
    onRecipeChange(newRecipes);
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
                <div className={`p-3 rounded-lg mr-4 ${equipment.color === 'red' ? 'bg-red-100 text-red-600' : equipment.color === 'purple' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{equipment.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Step {index + 1}: {equipment.name}</h3>
                  <p className="text-gray-600">{equipment.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {parameters.map((param) => (
                  <div key={param.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">{param.label}</label>
                    {param.type === 'select' ? (<select value={currentRecipe[param.key] || param.default} onChange={(e) => handleParameterChange(index, param.key, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">{param.options.map((option) => (<option key={option} value={option}>{option}</option>))}</select>) : (<div className="relative"><input type="number" min={param.min} max={param.max} step={param.step || 1} value={currentRecipe[param.key] || param.default} 
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? '' : Number(value);
                      handleParameterChange(index, param.key, numValue);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12" /><span className="absolute right-3 top-2 text-sm text-gray-500">{param.unit}</span></div>)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between">
        <button onClick={onBack} className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-400 transition-colors">← 장비 선택으로 돌아가기</button>
        <button onClick={onNext} className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">시뮬레이션 시작 🚀</button>
      </div>
    </div>
  );
};