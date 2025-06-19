import React, { useState } from 'react';
import { Play, Settings, Gauge, ChevronRight } from 'lucide-react';
import { EquipmentSelector, RecipeConfiguration } from './SetupSteps';
import ProcessAnimation from './ProcessAnimation';
import { equipmentTypes } from './simulatorData'; // 장비 데이터 import

const CORRECT_ORDER = ['oxidation', 'sputtering', 'evaporation'];

// 메인 시뮬레이터 컴포넌트: 전체 상태와 흐름을 제어합니다.
const TFTProcessSimulator = () => {
    const [currentStep, setCurrentStep] = useState('equipment'); 
    const [selectedEquipments, setSelectedEquipments] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [selectionError, setSelectionError] = useState(''); 

    const handleEquipmentChange = (equipment) => {
        setSelectionError('');

        const { id } = equipment;
        const currentIndex = selectedEquipments.findIndex(eq => eq.id === id);
        const isSelected = currentIndex !== -1;
        
        if (isSelected) {
            if (currentIndex === selectedEquipments.length - 1) {
                setSelectedEquipments(prev => prev.slice(0, -1));
            } else {
                setSelectionError('선택 해제는 마지막 단계부터 순서대로만 가능합니다.');
            }
            return;
        }

        const expectedId = CORRECT_ORDER[selectedEquipments.length];
        
        if (id === expectedId) {
            setSelectedEquipments(prev => [...prev, equipment]);
        } else {
            // ### 오류 메시지를 일반적인 내용으로 변경 ###
            if (expectedId) {
                setSelectionError('공정 순서가 올바르지 않습니다. 다시 선택해주세요.');
            } else {
                setSelectionError('모든 공정 장비 선택이 완료되었습니다.');
            }
        }
    };

    const handleEquipmentNext = () => {
        setRecipes(new Array(selectedEquipments.length).fill({}));
        setCurrentStep('recipe');
    };

    const handleRecipeBack = () => {
        setSelectionError(''); 
        setCurrentStep('equipment');
    };

    const handleRecipeNext = () => {
        setCurrentStep('simulation');
    };

    const handleStartOver = () => {
        setCurrentStep('equipment');
        setSelectedEquipments([]);
        setRecipes([]);
        setSelectionError('');
    };

    const renderStepComponent = () => {
        const isSelectionComplete = selectedEquipments.length === CORRECT_ORDER.length;

        switch (currentStep) {
            case 'equipment':
                return (
                    <EquipmentSelector
                        selectedEquipments={selectedEquipments}
                        onEquipmentChange={handleEquipmentChange}
                        onNext={handleEquipmentNext}
                        selectionError={selectionError}
                        isSelectionComplete={isSelectionComplete} 
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

            {renderStepComponent()}
        </div>
    );
};

export default TFTProcessSimulator;