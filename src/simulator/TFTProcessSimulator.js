import React, { useState } from 'react';
import { Play, Settings, Gauge, ChevronRight, Terminal, Activity } from 'lucide-react';
import { EquipmentSelector, RecipeConfiguration } from './SetupSteps';
import ProcessAnimation from './ProcessAnimation';
import { equipmentTypes } from './simulatorData';

const CORRECT_ORDER = ['oxidation', 'sputtering', 'evaporation'];

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
        <div className="min-h-screen bg-slate-900 text-slate-300 font-sans selection:bg-cyan-900 selection:text-cyan-100 flex flex-col">
            {/* 상단 컨트롤 패널 헤더 */}
            <div className="bg-slate-900/90 border-b border-cyan-900/50 shadow-[0_4px_30px_rgba(0,0,0,0.5)] z-20 sticky top-0 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-3 mb-4 md:mb-0">
                        <Activity className="w-6 h-6 text-cyan-400 animate-pulse" />
                        <h2 className="text-xl font-mono font-bold text-white tracking-widest uppercase">
                            FAB <span className="text-cyan-500">Operation</span> Console
                        </h2>
                    </div>

                    {/* 스텝 네비게이터 (다크 테마 탭) */}
                    <div className="flex items-center justify-center space-x-2 md:space-x-4">
                        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-mono text-sm transition-all duration-300 border ${
                            currentStep === 'equipment' 
                                ? 'bg-cyan-900/30 text-cyan-300 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                                : selectedEquipments.length > 0 
                                    ? 'bg-slate-800 text-green-400 border-green-900/50' 
                                    : 'bg-slate-800/50 text-slate-500 border-slate-800'
                        }`}>
                            <Settings className={`w-4 h-4 ${currentStep === 'equipment' ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
                            <span className="font-bold">STEP 01: EQUIPMENT</span>
                        </div>
                        
                        <ChevronRight className={`w-4 h-4 ${selectedEquipments.length > 0 ? 'text-cyan-500' : 'text-slate-600'}`} />
                        
                        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-mono text-sm transition-all duration-300 border ${
                            currentStep === 'recipe' 
                                ? 'bg-purple-900/30 text-purple-300 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                                : recipes.length > 0 
                                    ? 'bg-slate-800 text-green-400 border-green-900/50' 
                                    : 'bg-slate-800/50 text-slate-500 border-slate-800'
                        }`}>
                            <Gauge className={`w-4 h-4 ${currentStep === 'recipe' ? 'animate-pulse' : ''}`} />
                            <span className="font-bold">STEP 02: RECIPE</span>
                        </div>
                        
                        <ChevronRight className={`w-4 h-4 ${recipes.length > 0 ? 'text-purple-500' : 'text-slate-600'}`} />
                        
                        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-mono text-sm transition-all duration-300 border ${
                            currentStep === 'simulation' 
                                ? 'bg-blue-900/30 text-blue-300 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                                : 'bg-slate-800/50 text-slate-500 border-slate-800'
                        }`}>
                            <Play className={`w-4 h-4 ${currentStep === 'simulation' ? 'fill-blue-400 animate-pulse' : ''}`} />
                            <span className="font-bold">STEP 03: EXECUTE</span>
                        </div>
                    </div>
                </div>
                
                {/* 터미널 출력 느낌의 하단 장식 줄 */}
                <div className="w-full h-1 bg-gradient-to-r from-cyan-900 via-cyan-400 to-purple-900 opacity-50"></div>
            </div>

            {/* 메인 뷰포트 - 사이버 공간 컨셉 */}
            <div className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
                {/* 배경 그리드 장식 */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>

                <div className="relative z-10 w-full h-full p-4 lg:p-8 overflow-y-auto">
                    {renderStepComponent()}
                </div>
            </div>
        </div>
    );
};

export default TFTProcessSimulator;