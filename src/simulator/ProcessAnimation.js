import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Eye, Download, BarChart3, Zap, Thermometer, Gauge } from 'lucide-react';

const ProcessAnimation = ({ selectedEquipments, recipes, onStartOver }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(2);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [layerThickness, setLayerThickness] = useState([]);
  const [currentParams, setCurrentParams] = useState({});
  const [completedCycles, setCompletedCycles] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showParticles, setShowParticles] = useState(true);
  const [showEnergyWaves, setShowEnergyWaves] = useState(true);
  const [showPlasmaEffects, setShowPlasmaEffects] = useState(true);
  const [intensityLevel, setIntensityLevel] = useState(1);
  
  const intervalRef = useRef(null);
  const stepTimerRef = useRef(null);

  useEffect(() => {
    setLayerThickness(new Array(selectedEquipments.length).fill(0));
    if (recipes[0]) setCurrentParams(recipes[0]);
  }, [selectedEquipments, recipes]);

  const clearTimers = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
  };

  useEffect(() => {
    clearTimers();
    if (isPlaying && selectedEquipments.length > 0) {
      const recipe = recipes[currentStep] || {};
      const baseTime = recipe.time || 60;
      const duration = (baseTime * 1000) / speed;
      
      setCurrentParams(recipe);
      
      intervalRef.current = setInterval(() => {
        setAnimationPhase(prev => (prev + 1) % 16); // 더 많은 프레임
        setLayerThickness(prev => {
          const newThickness = [...prev];
          const increment = 100 / (duration / 50); // 50ms 간격으로 업데이트
          newThickness[currentStep] = Math.min(100, newThickness[currentStep] + increment);
          return newThickness;
        });
      }, 50); // 더 부드러운 애니메이션
      
      stepTimerRef.current = setTimeout(() => {
        setCurrentStep(prev => {
          const next = (prev + 1) % selectedEquipments.length;
          if (next === 0) {
            setCompletedCycles(c => c + 1);
            setLayerThickness(new Array(selectedEquipments.length).fill(0));
          }
          return next;
        });
      }, duration);
    }
    return clearTimers;
  }, [currentStep, isPlaying, speed, selectedEquipments, recipes]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const resetAnimation = () => {
    clearTimers();
    setCurrentStep(0);
    setCompletedCycles(0);
    setAnimationPhase(0);
    setLayerThickness(new Array(selectedEquipments.length).fill(0));
  };

  const currentEquipment = selectedEquipments[currentStep];
  const currentRecipe = recipes[currentStep] || {};

  // 기존 단면도 그대로 유지
  const CrossSectionView = () => {
    const scale = 1.4;
    const substrateHeight = 32;

    const visualHeights = recipes.map(recipe => (recipe.targetThickness || 50) * 0.2);
    const cumulativeHeights = visualHeights.reduce((acc, height, i) => {
      acc.push((acc[i-1] || 0) + height);
      return acc;
    }, []);

    const fillingStyle = (color, thickness) => ({
      background: `linear-gradient(to top, ${color} ${thickness}%, transparent ${thickness}%)`
    });

    return (
      <div 
        className="absolute bottom-4 right-4 w-52 h-36 bg-white/95 rounded-lg border-2 border-gray-300 shadow-lg z-10"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'bottom right'
        }}
      >
        <div className="text-xs font-bold text-center py-1 bg-gray-100 rounded-t-lg">실시간 단면도</div>
        <div className="relative p-4 h-28">
          <div className="absolute bottom-0 left-4 right-4 flex items-center justify-center bg-gray-600 rounded-b" style={{ height: `${substrateHeight}px` }}>
            <span className="text-xs text-white font-bold">Si 기판</span>
          </div>
          
          {selectedEquipments.map((equipment, index) => {
            const thickness = layerThickness[index] || 0;
            if (thickness === 0) return null;

            const maxLayerHeight = visualHeights[index];
            const bottomBase = substrateHeight + (cumulativeHeights[index-1] || 0);
            
            const recipe = recipes[index] || {};
            let layerColor, layerName;
            
            switch (equipment.id) {
              case 'oxidation':
                layerColor = '#60a5fa'; layerName = 'SiO₂';
                return (
                  <div key={`layer-${index}`} className="absolute" style={{ left: '1rem', right: '1rem', bottom: `${bottomBase}px`, height: `${maxLayerHeight}px`, ...fillingStyle(layerColor, thickness) }}>
                    <div className="w-full h-full flex items-center justify-center text-xs text-white font-bold">{thickness > 50 && layerName}</div>
                  </div>
                );

              case 'sputtering':
                layerColor = '#a855f7';
                layerName = recipe.material || 'IZO';
                
                if (thickness === 0) return null;
                
                return (
                  <div key={`layer-${index}`} className="absolute" style={{ 
                    left: '30%', 
                    width: '40%', 
                    bottom: `${bottomBase}px`, 
                    height: `${maxLayerHeight * thickness / 100}px`,
                    backgroundColor: layerColor,
                    transition: 'height 0.3s ease-in-out'
                  }}>
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">
                      {thickness > 30 && layerName}
                    </div>
                  </div>
                );

              case 'evaporation':
                layerColor = '#9ca3af';
                layerName = recipe.material || 'Al';
                
                if (thickness === 0) return null;
                
                const sputteringIndex = selectedEquipments.findIndex(eq => eq.id === 'sputtering');
                const sputteringBottomBase = substrateHeight + (cumulativeHeights[sputteringIndex-1] || 0);
                const actualHeight = maxLayerHeight * thickness / 100;
                
                return (
                  <React.Fragment key={`layer-${index}`}>
                    <div className="absolute" style={{ 
                      left: '15%', 
                      width: '15%', 
                      bottom: `${sputteringBottomBase}px`, 
                      height: `${visualHeights[sputteringIndex] * (thickness * 1.2) / 100}px`,
                      backgroundColor: layerColor,
                      transition: 'height 0.3s ease-in-out'
                    }} />
                    
                    <div className="absolute" style={{ 
                      right: '15%', 
                      width: '15%', 
                      bottom: `${sputteringBottomBase}px`, 
                      height: `${visualHeights[sputteringIndex] * thickness / 100}px`,
                      backgroundColor: layerColor,
                      transition: 'height 0.3s ease-in-out'
                    }} />
                    
                    <div className="absolute" style={{ 
                      left: '30%',
                      width: '15%', 
                      bottom: `${bottomBase}px`, 
                      height: `${actualHeight}px`,
                      backgroundColor: layerColor,
                      transition: 'height 0.3s ease-in-out'
                    }}>
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">
                        {thickness > 30 && 'S'}
                      </div>
                    </div>

                    <div className="absolute" style={{ 
                      left: '55%',
                      width: '15%', 
                      bottom: `${bottomBase}px`, 
                      height: `${actualHeight}px`,
                      backgroundColor: layerColor,
                      transition: 'height 0.3s ease-in-out'
                    }}>
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">
                        {thickness > 30 && 'D'}
                      </div>
                    </div>
                  </React.Fragment>
                );

              default:
                return null;
            }
          })}
        </div>
      </div>
    );
  };

  // 애니메이션
  const EnhancedEquipmentAnimation = () => {
    if (!currentEquipment) return null;
    
    const { id } = currentEquipment;
    const thickness = layerThickness[currentStep] || 0;
    const intensity = intensityLevel * (1 + thickness / 100);
    
    switch (id) {
      case 'oxidation':
        return (
          <div className="absolute inset-0">
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-80 h-64 rounded-t-[3rem] shadow-2xl overflow-hidden"
                 style={{
                   background: `linear-gradient(${animationPhase * 5}deg, 
                     #dc2626 0%, #ea580c 20%, #f59e0b 40%, #eab308 60%, #f59e0b 80%, #ea580c 100%)`,
                   animation: `furnaceGlow ${2 / speed}s ease-in-out infinite`
                 }}>
              
              <div className="absolute inset-3 rounded-t-[2.5rem] opacity-90"
                   style={{
                     background: `radial-gradient(circle at 50% 80%, 
                       #fbbf24 0%, #f59e0b 30%, #ea580c 60%, #dc2626 100%)`,
                     transform: `scale(${0.95 + Math.sin(animationPhase * 0.4) * 0.1})`,
                     filter: `brightness(${1.2 + Math.sin(animationPhase * 0.3) * 0.3})`
                   }} />
              
              {showEnergyWaves && [...Array(6)].map((_, i) => (
                <div key={`heat-${i}`} 
                     className="absolute rounded-full border-2 border-orange-300"
                     style={{
                       left: '50%',
                       top: '30%',
                       width: `${40 + i * 20}px`,
                       height: `${40 + i * 20}px`,
                       transform: 'translate(-50%, -50%)',
                       opacity: Math.max(0, 0.8 - i * 0.15 - (animationPhase % 8) * 0.1),
                       animation: `heatWave ${3 + i * 0.5}s ease-out infinite`,
                       animationDelay: `${i * 0.3}s`
                     }} />
              ))}
              
              {showParticles && [...Array(16)].map((_, i) => (
                <div key={`o2-${i}`} 
                     className="absolute rounded-full"
                     style={{
                       width: `${2 + (i % 3)}px`,
                       height: `${2 + (i % 3)}px`,
                       background: `radial-gradient(circle, #60a5fa, #3b82f6)`,
                       left: `${15 + (i % 6) * 12}%`,
                       top: `${10 + (i % 4) * 15}%`,
                       boxShadow: '0 0 8px rgba(96, 165, 250, 0.6)',
                       animation: `oxygenFloat ${1.5 + (i % 4) * 0.5}s ease-in-out infinite`,
                       animationDelay: `${i * 0.2}s`,
                       transform: `scale(${0.8 + Math.sin((animationPhase + i) * 0.5) * 0.4}) 
                                  rotate(${animationPhase * 10 + i * 30}deg)`
                     }} />
              ))}
              
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
                <div className="w-32 h-6 bg-gradient-to-r from-gray-300 to-gray-500 rounded-lg shadow-2xl relative overflow-hidden">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-28 h-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-lg">
                    <div className="absolute top-0 left-0 h-2 rounded-t-lg transition-all duration-1000" 
                         style={{ 
                           width: `${thickness}%`,
                           background: `linear-gradient(90deg, #3b82f6 0%, #1d4ed8 50%, #1e3a8a 100%)`,
                           boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
                           filter: `brightness(${1 + thickness / 200})`
                         }}/>
                  </div>
                  
                  <div className="absolute inset-0 opacity-50"
                       style={{
                         background: `linear-gradient(90deg, transparent 0%, 
                           rgba(251, 191, 36, ${0.3 + Math.sin(animationPhase * 0.5) * 0.2}) 50%, 
                           transparent 100%)`,
                         transform: `translateX(${animationPhase * 5}%)`
                       }} />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'sputtering':
        return (
          <div className="absolute inset-0">
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-80 h-64 rounded-t-[3rem] shadow-2xl overflow-hidden"
                 style={{
                   background: `linear-gradient(${animationPhase * 3}deg, 
                     #1f2937 0%, #374151 30%, #4b5563 50%, #374151 70%, #1f2937 100%)`
                 }}>
              
              <div className="absolute inset-3 rounded-t-[2.5rem]"
                   style={{
                     background: `radial-gradient(ellipse at 50% 60%, 
                       rgba(147, 51, 234, ${0.8 + Math.sin(animationPhase * 0.6) * 0.2}) 0%,
                       rgba(126, 34, 206, ${0.6 + Math.sin(animationPhase * 0.4) * 0.3}) 30%,
                       rgba(88, 28, 135, 0.4) 60%,
                       transparent 100%)`,
                     animation: `plasmaFlicker ${1 / speed}s ease-in-out infinite`
                   }} />
              
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-24 h-6 rounded-lg shadow-lg overflow-hidden"
                   style={{
                     background: `linear-gradient(45deg, #10b981, #059669, #047857)`,
                     boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)'
                   }}>
                <div className="text-xs text-center text-white font-bold py-1">{currentRecipe.material || 'IZO'} Target</div>
                
                {showParticles && [...Array(8)].map((_, i) => (
                  <div key={`target-atom-${i}`}
                       className="absolute w-1 h-1 rounded-full"
                       style={{
                         background: '#10b981',
                         left: `${20 + (i % 4) * 15}%`,
                         top: '100%',
                         boxShadow: '0 0 4px #10b981',
                         animation: `targetSputter ${0.8 + (i % 3) * 0.2}s ease-out infinite`,
                         animationDelay: `${i * 0.1}s`
                       }} />
                ))}
              </div>
              
              {showPlasmaEffects && (
                <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-20 h-12 rounded-full opacity-60">
                  <div className="w-full h-full rounded-full relative"
                       style={{
                         background: `radial-gradient(circle, 
                           rgba(168, 85, 247, ${0.8 + Math.sin(animationPhase * 0.8) * 0.2}), 
                           rgba(147, 51, 234, 0.4), 
                           transparent)`,
                         filter: `brightness(${1.5 + Math.sin(animationPhase * 0.7) * 0.5})`
                       }}>
                    
                    {[...Array(12)].map((_, i) => (
                      <div key={`spark-${i}`}
                           className="absolute w-0.5 h-0.5 bg-white rounded-full"
                           style={{
                             left: `${20 + (i % 6) * 10}%`,
                             top: `${20 + (i % 4) * 15}%`,
                             opacity: Math.random() > 0.5 ? 1 : 0,
                             animation: `sparkle ${0.3 + Math.random() * 0.4}s ease-in-out infinite`,
                             animationDelay: `${Math.random() * 0.5}s`
                           }} />
                    ))}
                  </div>
                </div>
              )}
              
              {showParticles && [...Array(20)].map((_, i) => (
                <div key={`sput-${i}`} 
                     className="absolute rounded-full"
                     style={{
                       width: `${1 + (i % 2)}px`,
                       height: `${1 + (i % 2)}px`,
                       background: `radial-gradient(circle, #10b981, #059669)`,
                       left: `${35 + (i % 6) * 5}%`,
                       top: `${20 + (i % 5) * 6}%`,
                       boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)',
                       animation: `superSputter ${1.2 + (i % 4) * 0.3}s ease-out infinite`,
                       animationDelay: `${i * 0.1}s`,
                       transform: `scale(${0.5 + Math.sin((animationPhase + i) * 0.3) * 0.5})`
                     }} />
              ))}
              
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
                <div className="w-32 h-6 bg-gradient-to-r from-gray-300 to-gray-500 rounded-lg shadow-2xl relative overflow-hidden">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-28 h-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-lg">
                    <div className="absolute top-1 left-0 h-1 rounded transition-all duration-1000" 
                         style={{ 
                           width: `${thickness}%`,
                           background: `linear-gradient(90deg, #10b981, #059669, #047857)`,
                           boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
                         }}/>
                  </div>
                  
                  <div className="absolute inset-0 opacity-30"
                       style={{
                         background: `linear-gradient(90deg, transparent 0%, 
                           rgba(168, 85, 247, ${0.4 + Math.sin(animationPhase * 0.4) * 0.2}) 50%, 
                           transparent 100%)`,
                         transform: `translateX(${(animationPhase * 3) % 100}%)`
                       }} />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'evaporation':
        return (
          <div className="absolute inset-0">
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-80 h-64 rounded-t-[3rem] shadow-2xl overflow-hidden"
                 style={{
                   background: `linear-gradient(${animationPhase * 2}deg, 
                     #000000 0%, #1f2937 20%, #374151 40%, #1f2937 60%, #000000 100%)`
                 }}>
              
              <div className="absolute inset-3 rounded-t-[2.5rem]"
                   style={{
                     background: `radial-gradient(ellipse at 50% 90%, 
                       rgba(17, 24, 39, 0.9) 0%,
                       rgba(31, 41, 55, 0.7) 50%,
                       rgba(55, 65, 81, 0.5) 100%)`
                   }} />
              
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-8 h-16 rounded-b-lg shadow-lg"
                   style={{
                     background: `linear-gradient(180deg, #6b7280, #4b5563, #374151)`,
                     boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
                   }}>
                
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full"
                     style={{
                       background: `radial-gradient(circle, #06b6d4, #0891b2)`,
                       boxShadow: `0 0 ${15 + Math.sin(animationPhase * 0.8) * 10}px #06b6d4`,
                       animation: `ebeamPulse ${0.5 / speed}s ease-in-out infinite`
                     }} />
                
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-1 h-16"
                     style={{
                       background: `linear-gradient(180deg, 
                         rgba(6, 182, 212, ${0.8 + Math.sin(animationPhase * 0.6) * 0.2}), 
                         rgba(8, 145, 178, 0.6), 
                         transparent)`,
                       boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)',
                       animation: `beamPath ${1 / speed}s linear infinite`
                     }} />
              </div>
              
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-16 h-8 rounded-lg shadow-lg overflow-hidden"
                   style={{
                     background: `linear-gradient(45deg, #d1d5db, #9ca3af, #6b7280)`,
                     boxShadow: '0 0 15px rgba(156, 163, 175, 0.5)'
                   }}>
                <div className="text-xs text-center text-gray-800 font-bold py-2">{currentRecipe.material || 'Al'} Source</div>
                
                <div className="absolute inset-0 opacity-60"
                     style={{
                       background: `radial-gradient(circle at 50% 80%, 
                         rgba(251, 191, 36, ${0.4 + Math.sin(animationPhase * 0.5) * 0.3}) 0%,
                         rgba(245, 158, 11, 0.2) 50%,
                         transparent 100%)`
                     }} />
              </div>
              
              {showParticles && [...Array(24)].map((_, i) => (
                <div key={`evap-${i}`} 
                     className="absolute rounded-full"
                     style={{
                       width: `${0.5 + (i % 3) * 0.5}px`,
                       height: `${0.5 + (i % 3) * 0.5}px`,
                       background: `radial-gradient(circle, #9ca3af, #6b7280)`,
                       left: `${38 + (i % 5) * 5}%`,
                       top: `${25 + (i % 6) * 8}%`,
                       boxShadow: '0 0 4px rgba(156, 163, 175, 0.6)',
                       animation: `superEvaporate ${1.8 + (i % 4) * 0.4}s ease-out infinite`,
                       animationDelay: `${i * 0.08}s`,
                       opacity: 0.7 + Math.sin((animationPhase + i) * 0.4) * 0.3
                     }} />
              ))}
              
              {showEnergyWaves && [...Array(3)].map((_, i) => (
                <div key={`beam-${i}`}
                     className="absolute left-1/2 transform -translate-x-1/2"
                     style={{
                       top: `${50 + i * 15}%`,
                       width: `${10 + i * 5}px`,
                       height: '2px',
                       background: `linear-gradient(90deg, 
                         transparent 0%, 
                         rgba(156, 163, 175, ${0.6 - i * 0.2}) 50%, 
                         transparent 100%)`,
                       animation: `molecularBeam ${2 + i * 0.3}s ease-in-out infinite`,
                       animationDelay: `${i * 0.2}s`
                     }} />
              ))}
              
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
                <div className="w-32 h-6 bg-gradient-to-r from-gray-300 to-gray-500 rounded-lg shadow-2xl relative overflow-hidden">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-28 h-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-lg">
                    {thickness > 0 && (
                      <>
                        <div className="absolute top-0.5 left-0 h-1 rounded transition-all duration-1000" 
                             style={{ 
                               width: `${Math.min(35, thickness * 0.35)}%`,
                               background: `linear-gradient(90deg, #9ca3af, #6b7280, #4b5563)`,
                               boxShadow: '0 0 6px rgba(156, 163, 175, 0.5)'
                             }}/>
                        <div className="absolute top-0.5 right-0 h-1 rounded transition-all duration-1000" 
                             style={{ 
                               width: `${Math.min(35, thickness * 0.35)}%`,
                               background: `linear-gradient(270deg, #9ca3af, #6b7280, #4b5563)`,
                               boxShadow: '0 0 6px rgba(156, 163, 175, 0.5)'
                             }}/>
                      </>
                    )}
                  </div>
                  
                  <div className="absolute inset-0 opacity-25"
                       style={{
                         background: `linear-gradient(90deg, transparent 0%, 
                           rgba(6, 182, 212, ${0.5 + Math.sin(animationPhase * 0.3) * 0.3}) 50%, 
                           transparent 100%)`,
                         transform: `translateX(${(animationPhase * 2) % 100}%)`
                       }} />
                </div>
              </div>
            </div>
          </div>
        );
        
      default: 
        return <div className="flex items-center justify-center h-full text-gray-500">Unknown Equipment</div>;
    }
  };

  const ParameterMonitor = () => (
    <div className="absolute top-4 left-4 space-y-2 z-10">
      <div className="flex items-center space-x-2 bg-black/80 text-white px-3 py-2 rounded-lg backdrop-blur">
        <Thermometer className="w-4 h-4" />
        <span className="text-sm font-mono">{currentRecipe.temperature || 25}°C</span>
        <div className={`w-2 h-2 rounded-full ${(currentRecipe.temperature || 25) > 500 ? 'bg-red-500' : (currentRecipe.temperature || 25) > 100 ? 'bg-yellow-500' : 'bg-blue-500'} animate-pulse`}></div>
      </div>
      <div className="flex items-center space-x-2 bg-black/80 text-white px-3 py-2 rounded-lg backdrop-blur">
        <Gauge className="w-4 h-4" />
        <span className="text-sm font-mono">{currentRecipe.pressure || 1} {currentEquipment?.id === 'sputtering' ? 'mTorr' : 'Torr'}</span>
      </div>
      {currentRecipe.power && (
        <div className="flex items-center space-x-2 bg-black/80 text-white px-3 py-2 rounded-lg backdrop-blur">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-mono">{currentRecipe.power}{currentEquipment?.id === 'evaporation' ? 'kW' : 'W'}</span>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
        </div>
      )}
      <div className="flex items-center space-x-2 bg-black/80 text-white px-3 py-2 rounded-lg backdrop-blur">
        <BarChart3 className="w-4 h-4" />
        <span className="text-sm font-mono">Cycle: {completedCycles}</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
          <Play className="w-6 h-6 mr-2 text-green-500" />
          공정 시뮬레이션
        </h2>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow">
            <button onClick={togglePlay} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title={isPlaying ? "일시정지" : "재생"}>
              {isPlaying ? <Pause className="w-5 h-5 text-red-500" /> : <Play className="w-5 h-5 text-green-500" />}
            </button>
            <button onClick={resetAnimation} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="초기화">
              <RotateCcw className="w-5 h-5 text-blue-500" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow">
            <span className="text-sm font-medium">속도:</span>
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="text-sm border rounded px-2 py-1 bg-white">
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
              <option value={8}>8x</option>
            </select>
          </div>
          
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="애니메이션 설정">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="absolute top-20 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 p-4 w-72 z-30">
          <h3 className="font-bold text-lg mb-4 text-gray-800">🎬 애니메이션 설정</h3>
          <div className="space-y-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={showParticles} onChange={(e) => setShowParticles(e.target.checked)} className="rounded"/>
              <span className="text-sm">🔸 파티클 효과</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={showEnergyWaves} onChange={(e) => setShowEnergyWaves(e.target.checked)} className="rounded"/>
              <span className="text-sm">🌊 에너지 웨이브</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={showPlasmaEffects} onChange={(e) => setShowPlasmaEffects(e.target.checked)} className="rounded"/>
              <span className="text-sm">⚡ 플라즈마 효과</span>
            </label>
            <div className="space-y-2">
              <span className="text-sm font-medium">🔥 강도 레벨:</span>
              <input 
                type="range" 
                min="0.5" 
                max="2" 
                step="0.1" 
                value={intensityLevel} 
                onChange={(e) => setIntensityLevel(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center">{intensityLevel}x</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center mb-6 space-x-3 bg-white p-4 rounded-lg shadow">
        {selectedEquipments.map((equipment, index) => (
          <div key={index} className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-500 ${
            index === currentStep ? 
              `${equipment.color === 'red' ? 'bg-gradient-to-r from-red-400 to-red-600' : equipment.color === 'purple' ? 'bg-gradient-to-r from-purple-400 to-purple-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'} text-white shadow-xl scale-110` :
            index < currentStep ? 
              `${equipment.color === 'red' ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800' : equipment.color === 'purple' ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800' : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800'} shadow-md` :
              'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-500 shadow'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="font-bold">{index + 1}.</span>
              <span>{equipment.name}</span>
            </div>
            {index === currentStep && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
            )}
          </div>
        ))}
      </div>

      <div className="relative mx-auto w-full h-[400px] bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 rounded-2xl border-2 border-gray-300 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)', 
            backgroundSize: '20px 20px'
          }} />
        </div>

        <ParameterMonitor />
        
        {currentEquipment && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-xl border border-blue-200 max-w-xs">
            <div className={`text-lg font-bold mb-2 flex items-center ${
              currentEquipment.color === 'red' ? 'text-red-600' : 
              currentEquipment.color === 'purple' ? 'text-purple-600' : 'text-blue-600'
            }`}>
              {currentEquipment.name}
              <div className={`ml-2 w-2 h-2 rounded-full animate-pulse ${
                currentEquipment.color === 'red' ? 'bg-red-500' : 
                currentEquipment.color === 'purple' ? 'bg-purple-500' : 'bg-blue-500'
              }`} />
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 bg-gray-100 rounded px-2 py-1">
                진행률: {Math.round(layerThickness[currentStep] || 0)}%
              </div>
            </div>
          </div>
        )}

        <CrossSectionView />
        <EnhancedEquipmentAnimation />
      </div>

      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">전체 공정 진행률</span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep + (layerThickness[currentStep] || 0) / 100) / selectedEquipments.length * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div 
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-3 rounded-full transition-all duration-1000 shadow-lg" 
              style={{ width: `${(currentStep + (layerThickness[currentStep] || 0) / 100) / selectedEquipments.length * 100}%` }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {selectedEquipments.map((equipment, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow border">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${
                  equipment.color === 'red' ? 'text-red-600' : 
                  equipment.color === 'purple' ? 'text-purple-600' : 'text-blue-600'
                }`}>
                  {equipment.name.split(' ')[0]}
                </span>
                <span className="text-xs text-gray-500">{Math.round(layerThickness[index] || 0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${
                    equipment.color === 'red' ? 'bg-red-500' : 
                    equipment.color === 'purple' ? 'bg-purple-500' : 'bg-blue-500'
                  } h-2 rounded-full transition-all duration-500`} 
                  style={{ width: `${layerThickness[index] || 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center mt-8 p-4 bg-white rounded-xl shadow border">
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{currentStep + 1}</div>
            <div className="text-sm text-gray-600">현재 단계</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{completedCycles}</div>
            <div className="text-sm text-gray-600">완료 사이클</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{selectedEquipments.length}</div>
            <div className="text-sm text-gray-600">총 단계</div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={onStartOver} 
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-400 transition-colors"
          >
            처음부터 다시 설정
          </button>
          
          <button 
            onClick={() => console.log('시뮬레이션 데이터:', {
              equipment: selectedEquipments, 
              recipes: recipes, 
              progress: layerThickness, 
              cycles: completedCycles,
              animationSettings: { showParticles, showEnergyWaves, showPlasmaEffects, intensityLevel }
            })} 
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            데이터 내보내기
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes furnaceGlow { 
          0%, 100% { filter: brightness(1) hue-rotate(0deg); } 
          50% { filter: brightness(1.3) hue-rotate(10deg); } 
        }
        
        @keyframes heatWave { 
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; } 
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; } 
        }
        
        @keyframes oxygenFloat { 
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); opacity: 0.7; } 
          25% { transform: translateY(-8px) rotate(90deg) scale(1.2); opacity: 1; }
          50% { transform: translateY(-15px) rotate(180deg) scale(0.8); opacity: 0.9; }
          75% { transform: translateY(-8px) rotate(270deg) scale(1.1); opacity: 1; }
        }
        
        @keyframes plasmaFlicker { 
          0%, 100% { filter: brightness(1) contrast(1); } 
          25% { filter: brightness(1.4) contrast(1.2); }
          50% { filter: brightness(0.8) contrast(0.9); }
          75% { filter: brightness(1.2) contrast(1.1); }
        }
        
        @keyframes targetSputter { 
          0% { transform: translateY(0) scale(1); opacity: 1; } 
          100% { transform: translateY(40px) scale(0.3); opacity: 0; } 
        }
        
        @keyframes sparkle { 
          0%, 100% { opacity: 0; transform: scale(0.5); } 
          50% { opacity: 1; transform: scale(1.5); } 
        }
        
        @keyframes superSputter { 
          0% { transform: translate(0, 0) scale(0.5); opacity: 0; } 
          20% { transform: translate(2px, 8px) scale(1.2); opacity: 0.8; }
          50% { transform: translate(8px, 20px) scale(1); opacity: 1; } 
          80% { transform: translate(15px, 35px) scale(0.7); opacity: 0.6; }
          100% { transform: translate(25px, 50px) scale(0.2); opacity: 0; } 
        }
        
        @keyframes ebeamPulse { 
          0%, 100% { transform: scale(1); filter: brightness(1); } 
          50% { transform: scale(1.3); filter: brightness(1.8); } 
        }
        
        @keyframes beamPath { 
          0% { opacity: 0; transform: scaleY(0); } 
          50% { opacity: 1; transform: scaleY(1); } 
          100% { opacity: 0; transform: scaleY(0); } 
        }
        
        @keyframes superEvaporate { 
          0% { transform: translate(0, 0) scale(0.3); opacity: 0; } 
          15% { transform: translate(1px, -5px) scale(0.8); opacity: 0.7; }
          30% { transform: translate(3px, -12px) scale(1.2); opacity: 1; } 
          50% { transform: translate(6px, -20px) scale(1); opacity: 0.8; }
          70% { transform: translate(10px, -30px) scale(0.6); opacity: 0.5; }
          100% { transform: translate(15px, -45px) scale(0.2); opacity: 0; } 
        }
        
        @keyframes molecularBeam { 
          0%, 100% { opacity: 0; transform: scaleX(0); } 
          50% { opacity: 0.8; transform: scaleX(1); } 
        }
      `}</style>
    </div>
  );
};

export default ProcessAnimation;