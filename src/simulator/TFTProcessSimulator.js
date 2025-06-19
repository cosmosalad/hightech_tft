import React, { useState } from 'react';
import { Play, Settings, Gauge, ChevronRight } from 'lucide-react';
import { EquipmentSelector, RecipeConfiguration } from './SetupSteps';
import ProcessAnimation from './ProcessAnimation';

// 메인 시뮬레이터 컴포넌트: 전체 상태와 흐름을 제어합니다.
const TFTProcessSimulator = () => {
    const [currentStep, setCurrentStep] = useState('equipment'); // 'equipment', 'recipe', 'simulation'
    const [selectedEquipments, setSelectedEquipments] = useState([]);
    const [recipes, setRecipes] = useState([]);

    // 장비 선택/해제 핸들러
    const handleEquipmentChange = (equipment) => {
        const isSelected = selectedEquipments.some(eq => eq.id === equipment.id);
        if (isSelected) {
            setSelectedEquipments(prev => prev.filter(eq => eq.id !== equipment.id));
        } else {
            setSelectedEquipments(prev => [...prev, equipment]);
        }
    };

    // 장비 선택 후 다음 단계로 이동
    const handleEquipmentNext = () => {
        setRecipes(new Array(selectedEquipments.length).fill({}));
        setCurrentStep('recipe');
    };

    // 레시피 설정에서 이전 단계로 이동
    const handleRecipeBack = () => {
        setCurrentStep('equipment');
    };

    // 레시피 설정 후 다음 단계로 이동
    const handleRecipeNext = () => {
        setCurrentStep('simulation');
    };

    // 시뮬레이션 완료 후 처음부터 다시 시작
    const handleStartOver = () => {
        setCurrentStep('equipment');
        setSelectedEquipments([]);
        setRecipes([]);
    };

    // 현재 단계에 맞는 컴포넌트를 렌더링하는 함수
    const renderStepComponent = () => {
        switch (currentStep) {
            case 'equipment':
                return (
                    <EquipmentSelector
                        selectedEquipments={selectedEquipments}
                        onEquipmentChange={handleEquipmentChange}
                        onNext={handleEquipmentNext}
                    />
                );
            case 'recipe':
                return (
                    <RecipeConfiguration
                        selectedEquipments={selectedEquipments}
                        recipes={recipes}
                        onRecipeChange={setRecipes}
                        onNext={handleRecipeNext}
                        onBack={handleRecipeBack}
                    />
                );
            case 'simulation':
                return (
                    <ProcessAnimation 
                        selectedEquipments={selectedEquipments}
                        recipes={recipes}
                        onStartOver={handleStartOver}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="py-8">
            {/* 상단 진행 단계 표시 */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${currentStep === 'equipment' ? 'bg-blue-100 text-blue-700' : selectedEquipments.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">장비 선택</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${currentStep === 'recipe' ? 'bg-blue-100 text-blue-700' : recipes.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                <Gauge className="w-4 h-4" />
                <span className="text-sm font-medium">레시피 설정</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${currentStep === 'simulation' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                <Play className="w-4 h-4" />
                <span className="text-sm font-medium">시뮬레이션</span>
              </div>
            </div>

            {/* 현재 단계에 맞는 컴포넌트를 렌더링 */}
            {renderStepComponent()}
        </div>
    );
};

export default TFTProcessSimulator;