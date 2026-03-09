import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Settings, Download, BarChart3, Zap, Thermometer, Gauge, X, ZoomIn, Activity } from 'lucide-react';

const CrossSectionView = ({ isExpanded, onToggle, recipes, selectedEquipments, layerThickness }) => {
  const scale = 1.4;
  
  const substrateHeight = isExpanded ? 80 : 32;
  const titleClass = isExpanded ? "text-xl" : "text-xs";
  const labelClass = isExpanded ? "text-lg" : "text-xs";

  const visualHeights = recipes.map(recipe => (recipe.targetThickness || 50) * (isExpanded ? 0.5 : 0.2));
  const cumulativeHeights = visualHeights.reduce((acc, height, i) => {
    acc.push((acc[i-1] || 0) + height);
    return acc;
  }, []);

  const fillingStyle = (color, thickness) => ({
    background: `linear-gradient(to top, ${color} ${thickness}%, transparent ${thickness}%)`
  });
  
  const containerBaseClasses = "bg-slate-900 border border-slate-700 shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all overflow-hidden flex flex-col";
  const containerDynamicClasses = isExpanded
    ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[1000px] h-[70vh] z-50 rounded-xl"
    : `absolute bottom-6 right-6 w-64 h-48 z-20 rounded-lg cursor-pointer hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:border-cyan-500/50 backdrop-blur-md bg-slate-900/80`;

  const containerDynamicStyles = isExpanded 
    ? {} 
    : { transform: `scale(${scale})`, transformOrigin: 'bottom right' };

  const renderDrawing = () => (
    <>
      <div className={`${titleClass} font-mono font-bold text-center py-2 bg-slate-800 text-cyan-400 border-b border-slate-700 relative flex items-center justify-center uppercase tracking-widest`}>
        {!isExpanded && <ZoomIn className="w-4 h-4 mr-2 text-cyan-500 animate-pulse" />}
        Cross-Section Analysis
        {isExpanded && (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-xl font-light text-slate-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className={`relative p-4 ${isExpanded ? 'flex-grow' : 'h-28'} bg-[#0a0f18] overflow-hidden`}>
        {/* 그리드 배경 */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
        
        <div className="absolute bottom-0 left-4 right-4 flex items-center justify-center bg-slate-800 border-t-2 border-slate-600 rounded-b" style={{ height: `${substrateHeight}px`, boxShadow: '0 -4px 20px rgba(0,0,0,0.5)' }}>
          <span className={`${labelClass} text-slate-400 font-bold font-mono tracking-wider`}>Si Substrate</span>
        </div>
        
        {selectedEquipments.map((equipment, index) => {
          const thickness = layerThickness[index] || 0;
          if (thickness === 0 && !isExpanded) return null;

          const maxLayerHeight = visualHeights[index];
          const bottomBase = substrateHeight + (cumulativeHeights[index-1] || 0);
          
          const recipe = recipes[index] || {};
          let layerColor, layerName;
          
          switch (equipment.id) {
            case 'oxidation':
              layerColor = 'rgba(56, 189, 248, 0.6)'; layerName = 'SiO₂';
              if (thickness === 0) return null;
              return (
                <div key={`layer-${index}`} className="absolute border-t border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]" style={{ left: '1rem', right: '1rem', bottom: `${bottomBase}px`, height: `${maxLayerHeight}px`, ...fillingStyle(layerColor, thickness), backdropFilter: 'blur(2px)' }}>
                  <div className={`w-full h-full flex items-center justify-center ${labelClass} text-white font-mono font-bold text-shadow`}>{thickness > 50 && layerName}</div>
                </div>
              );
            case 'sputtering':
              layerColor = 'rgba(168, 85, 247, 0.7)';
              layerName = recipe.material || 'IZO';
              return (
                <div key={`layer-${index}`} className={`absolute ${thickness > 0 ? 'border-x border-t border-purple-400' : ''} shadow-[0_0_15px_rgba(168,85,247,0.5)]`} style={{ 
                  left: '30%', 
                  width: '40%', 
                  bottom: `${bottomBase}px`, 
                  height: `${maxLayerHeight * thickness / 100}px`,
                  backgroundColor: layerColor,
                  transition: 'height 0.3s ease-out',
                  backdropFilter: 'blur(3px)'
                }}>
                  <div className={`absolute inset-0 flex items-center justify-center ${labelClass} text-white font-mono font-bold text-shadow`}>
                    {thickness > 30 && layerName}
                  </div>
                </div>
              );
            case 'evaporation':
              layerColor = 'rgba(203, 213, 225, 0.9)';
              layerName = recipe.material || 'Al';
              const sputteringIndex = selectedEquipments.findIndex(eq => eq.id === 'sputtering');
              if (sputteringIndex === -1) return null;
              const sputteringBottomBase = substrateHeight + (cumulativeHeights[sputteringIndex - 1] || 0);
              const sputteringVisualHeight = visualHeights[sputteringIndex];
              const actualHeight = maxLayerHeight * thickness / 100;
              return (
                <React.Fragment key={`layer-${index}`}>
                  <div className={`absolute ${thickness > 0 ? 'border border-slate-300' : ''} shadow-[0_0_10px_rgba(203,213,225,0.8)]`} style={{ 
                    left: '15%', width: '15%', bottom: `${sputteringBottomBase}px`, 
                    height: `${sputteringVisualHeight * (thickness * 1.2) / 100}px`,
                    backgroundColor: layerColor, transition: 'height 0.3s ease-out'
                  }} />
                  <div className={`absolute ${thickness > 0 ? 'border border-slate-300' : ''} shadow-[0_0_10px_rgba(203,213,225,0.8)]`} style={{ 
                    right: '15%', width: '15%', bottom: `${sputteringBottomBase}px`, 
                    height: `${sputteringVisualHeight * (thickness * 1.2) / 100}px`,
                    backgroundColor: layerColor, transition: 'height 0.3s ease-out'
                  }} />
                  <div className={`absolute ${thickness > 0 ? 'border-t border-x border-slate-300' : ''} shadow-[0_0_10px_rgba(203,213,225,0.8)]`} style={{ 
                    left: '30%', width: '15%', bottom: `${bottomBase}px`, height: `${actualHeight}px`,
                    backgroundColor: layerColor, transition: 'height 0.3s ease-out'
                  }}>
                    <div className={`absolute inset-0 flex items-center justify-center ${labelClass} text-slate-800 font-black font-mono`}>{thickness > 30 && layerName && 'S'}</div>
                  </div>
                  <div className={`absolute ${thickness > 0 ? 'border-t border-x border-slate-300' : ''} shadow-[0_0_10px_rgba(203,213,225,0.8)]`} style={{ 
                    left: '55%', width: '15%', bottom: `${bottomBase}px`, height: `${actualHeight}px`,
                    backgroundColor: layerColor, transition: 'height 0.3s ease-out'
                  }}>
                    <div className={`absolute inset-0 flex items-center justify-center ${labelClass} text-slate-800 font-black font-mono`}>{thickness > 30 && layerName && 'D'}</div>
                  </div>
                </React.Fragment>
              );
            default:
              return null;
          }
        })}
      </div>
    </>
  );

  return (
    <React.Fragment>
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
          onClick={onToggle}
        />
      )}
      <div 
        className={`${containerBaseClasses} ${containerDynamicClasses}`}
        style={containerDynamicStyles}
        onClick={!isExpanded ? onToggle : undefined}
      >
        {renderDrawing()}
      </div>
    </React.Fragment>
  );
};

const EnhancedEquipmentAnimation = ({ currentEquipment, layerThickness, currentStep, speed, animationPhase, showParticles, showEnergyWaves, showPlasmaEffects, currentRecipe }) => {
  if (!currentEquipment) return null;
    
  const { id } = currentEquipment;
  const thickness = layerThickness[currentStep] || 0;
  
  switch (id) {
    case 'oxidation':
      return (
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-80 h-64 border-x border-t border-orange-500/30 rounded-t-[3rem] shadow-[0_0_40px_rgba(234,88,12,0.3)] overflow-hidden"
               style={{
                 background: `linear-gradient(${animationPhase * 5}deg, rgba(15,23,42,0.9) 0%, rgba(30,10,10,0.8) 50%, rgba(15,23,42,0.9) 100%)`,
                 animation: `furnaceGlow ${2 / speed}s ease-in-out infinite`
               }}>
            {/* 챔버 내부 발광 효과 */}
            <div className="absolute inset-2 rounded-t-[2.5rem] opacity-80"
                 style={{
                   background: `radial-gradient(ellipse at 50% 100%, rgba(249,115,22,0.4) 0%, rgba(239,68,68,0.2) 40%, transparent 80%)`,
                   transform: `scale(${0.95 + Math.sin(animationPhase * 0.4) * 0.1})`,
                   filter: `blur(8px)`
                 }} />
            
            {/* 가열 코일 */}
            {[...Array(5)].map((_, i) => (
              <div key={`coil-${i}`} className="absolute w-64 h-2 left-1/2 -translate-x-1/2 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                   style={{ 
                     top: `${20 + i * 15}%`, 
                     background: `linear-gradient(90deg, #7f1d1d, #ef4444, #7f1d1d)`,
                     opacity: 0.6 + Math.sin(animationPhase * 0.5 + i) * 0.4
                   }} />
            ))}

            {showEnergyWaves && [...Array(6)].map((_, i) => (
              <div key={`heat-${i}`} className="absolute rounded-full border border-orange-400/50" style={{
                 left: '50%', top: '60%', width: `${40 + i * 20}px`, height: `${40 + i * 20}px`,
                 transform: 'translate(-50%, -50%)',
                 opacity: Math.max(0, 0.6 - i * 0.1 - (animationPhase % 8) * 0.1),
                 animation: `heatWave ${3 + i * 0.5}s ease-out infinite`, animationDelay: `${i * 0.3}s`
               }} />
            ))}

            {showParticles && [...Array(24)].map((_, i) => (
              <div key={`o2-${i}`} className="absolute rounded-full" style={{
                 width: `${1 + (i % 3)}px`, height: `${1 + (i % 3)}px`,
                 background: `rgba(96,165,250,${0.6 + Math.random()*0.4})`,
                 left: `${15 + (i % 8) * 10}%`, top: `${10 + (i % 6) * 10}%`,
                 boxShadow: '0 0 10px rgba(96, 165, 250, 0.8)',
                 animation: `oxygenFloat ${1.5 + (i % 4) * 0.5}s ease-in-out infinite`, animationDelay: `${i * 0.1}s`,
                 transform: `scale(${0.8 + Math.sin((animationPhase + i) * 0.5) * 0.4})`
               }} />
            ))}
            
            {/* 기판 및 웨이퍼 컨테이너 */}
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
              <div className="w-40 h-8 bg-slate-800 border-x border-t border-slate-600 rounded-t-xl shadow-[0_-5px_20px_rgba(0,0,0,0.8)] relative flex justify-center items-end pb-2">
                <div className="w-32 h-2 bg-slate-700 rounded-sm relative">
                  <motion.div className="absolute bottom-full left-0 w-full rounded-t-sm origin-bottom" 
                    initial={{ height: 0 }}
                    animate={{ height: thickness * 0.2 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    style={{ 
                     background: `linear-gradient(90deg, rgba(6,182,212,0.8), rgba(56,189,248,0.9), rgba(6,182,212,0.8))`,
                     boxShadow: '0 0 15px rgba(56, 189, 248, 0.6)', filter: `brightness(${1 + thickness / 200})`
                   }}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    case 'sputtering':
      return (
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-80 h-64 border-x border-t border-purple-500/30 rounded-t-[3rem] shadow-[0_0_40px_rgba(168,85,247,0.2)] overflow-hidden" style={{
            background: `linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(30,10,40,0.85) 100%)`
          }}>
            {/* 배경 플라즈마 글로우 */}
            <div className="absolute inset-3 rounded-t-[2.5rem]" style={{
              background: `radial-gradient(ellipse at 50% 40%, rgba(168, 85, 247, ${0.4 + Math.sin(animationPhase * 0.6) * 0.2}) 0%, rgba(147, 51, 234, ${0.2 + Math.sin(animationPhase * 0.4) * 0.1}) 40%, transparent 70%)`,
              animation: `plasmaFlicker ${1 / speed}s ease-in-out infinite`
            }} />
            
            {/* 상단 타겟 전극 */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-32 h-6 border border-purple-400 bg-slate-800 rounded shadow-[0_0_20px_rgba(168,85,247,0.5)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-purple-400/50 opacity-50 animate-pulse"></div>
              <div className="text-[10px] text-center text-purple-200 font-mono tracking-widest leading-6 uppercase">{currentRecipe.material || 'TARGET'} MATERIAL</div>
              {showParticles && [...Array(10)].map((_, i) => (
                <div key={`target-atom-${i}`} className="absolute w-1 h-3 rounded-full" style={{
                  background: 'rgba(192,132,252,0.8)', left: `${10 + (i % 5) * 20}%`, top: '100%', boxShadow: '0 0 10px #c084fc',
                  animation: `targetSputter ${0.5 + Math.random() * 0.5}s linear infinite`, animationDelay: `${Math.random() * 0.5}s`
                }} />
              ))}
            </div>

            {showPlasmaEffects && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-48 h-20 opacity-80 mix-blend-screen">
                <div className="w-full h-full relative" style={{
                  background: `radial-gradient(ellipse, rgba(168, 85, 247, ${0.6 + Math.sin(animationPhase * 0.8) * 0.2}), transparent 70%)`,
                  filter: `blur(5px)`
                }}>
                  {[...Array(20)].map((_, i) => (
                    <div key={`spark-${i}`} className="absolute w-1 h-1 bg-white rounded-full" style={{
                      left: `${10 + (i % 10) * 8}%`, top: `${10 + (i % 5) * 20}%`, 
                      boxShadow: '0 0 5px #fff, 0 0 10px #c084fc',
                      animation: `sparkle ${0.1 + Math.random() * 0.3}s ease-in-out infinite`, animationDelay: `${Math.random() * 0.2}s`
                    }} />
                  ))}
                </div>
              </div>
            )}

            {showParticles && [...Array(30)].map((_, i) => (
              <div key={`sput-${i}`} className="absolute w-1 h-1 rounded-full" style={{
                background: `#e9d5ff`, left: `${20 + (i % 8) * 8}%`, top: `${20 + (i % 5) * 10}%`, 
                boxShadow: '0 0 8px #d8b4fe',
                animation: `superSputter ${0.8 + Math.random() * 0.5}s ease-in infinite`, animationDelay: `${Math.random() * 0.5}s`
              }} />
            ))}
            
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
              <div className="w-40 h-8 bg-slate-800 border border-slate-600 rounded-t-xl shadow-[0_0_20px_rgba(0,0,0,1)] relative flex justify-center items-end pb-2">
                <div className="w-32 h-2 bg-slate-700 rounded-sm relative">
                  <motion.div className="absolute bottom-full left-0 w-full rounded-t-sm origin-bottom" 
                    initial={{ height: 0 }}
                    animate={{ height: thickness * 0.2 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    style={{ 
                     background: `linear-gradient(90deg, rgba(168,85,247,0.8), rgba(192,132,252,0.9), rgba(168,85,247,0.8))`,
                     boxShadow: '0 0 15px rgba(192, 132, 252, 0.6)'
                   }}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    case 'evaporation':
      return (
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-80 h-64 border-x border-t border-slate-700 rounded-t-[3rem] shadow-[0_0_30px_rgba(255,255,255,0.05)] overflow-hidden" style={{
            background: `linear-gradient(180deg, rgba(10,15,25,0.95) 0%, rgba(20,25,35,0.95) 100%)`
          }}>
            {/* E-beam 건 (하단) */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-10 border border-slate-600 bg-slate-800 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.8)] z-10 flex flex-col justify-end items-center pb-2">
              <div className="text-[10px] text-slate-400 font-mono tracking-widest">{currentRecipe.material || 'Al'} SOURCE</div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,1)] animate-pulse"></div>
            </div>

            {/* 레이저 빔 이펙트 */}
            {showEnergyWaves && (
              <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 w-1 h-[70%]" style={{
                background: `linear-gradient(0deg, rgba(34,211,238,0.9) 0%, rgba(14,165,233,0.5) 40%, transparent 100%)`,
                boxShadow: `0 0 ${15 + Math.sin(animationPhase)*10}px rgba(34,211,238,0.8)`,
                animation: `beamFlicker ${0.1 / speed}s infinite`
              }}></div>
            )}

            {/* 증발 파티클 */}
            {showParticles && [...Array(40)].map((_, i) => (
              <div key={`evap-${i}`} className="absolute w-[2px] h-[6px] rounded-full bg-slate-200" style={{
                left: `${35 + Math.random() * 30}%`, 
                bottom: '15%', 
                boxShadow: '0 0 5px rgba(255,255,255,0.8)',
                animation: `superEvaporate ${0.8 + Math.random()}s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite`, 
                animationDelay: `${Math.random()}s`,
                opacity: 0
              }} />
            ))}

            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-48 h-10 border border-slate-600 bg-slate-800 rounded-b-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex justify-center items-start pt-2">
              <div className="w-40 h-2 bg-slate-700 rounded-full relative overflow-hidden">
                <motion.div className="absolute left-1/4 w-1/4 bottom-0 bg-slate-300 origin-bottom" 
                  initial={{ height: '20%' }}
                  animate={{ height: `${Math.max(20, thickness)}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  style={{ 
                  boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)'
                }}/>
                <motion.div className="absolute right-1/4 w-1/4 bottom-0 bg-slate-300 origin-bottom" 
                  initial={{ height: '20%' }}
                  animate={{ height: `${Math.max(20, thickness)}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  style={{ 
                  boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)'
                }}/>
              </div>
            </div>
            
            {/* 플라즈마 클라우드 느낌 */}
            <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-40 h-20 bg-cyan-500/10 rounded-full mix-blend-screen filter blur-xl animate-pulse"></div>
          </div>
        </div>
      );
    default: 
      return <div className="flex items-center justify-center h-full text-gray-500">Unknown Equipment</div>;
  }
};

const ParameterMonitor = ({ currentRecipe, currentEquipment }) => (
  <div className="absolute top-4 left-4 space-y-3 z-10 font-mono">
    <div className="flex items-center space-x-3 bg-slate-900/80 border border-slate-700 text-cyan-400 px-4 py-2.5 rounded-lg backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]">
      <Thermometer className="w-5 h-5 text-red-400" />
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest leading-none mb-1">Temperature</span>
        <span className="text-sm font-bold text-white">{currentRecipe.temperature || 25}°C</span>
      </div>
      <div className={`ml-auto w-2 h-2 rounded-full ${(currentRecipe.temperature || 25) > 500 ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : (currentRecipe.temperature || 25) > 100 ? 'bg-yellow-500 shadow-[0_0_8px_#eab308]' : 'bg-blue-500 shadow-[0_0_8px_#3b82f6]'} animate-pulse`}></div>
    </div>
    <div className="flex items-center space-x-3 bg-slate-900/80 border border-slate-700 text-cyan-400 px-4 py-2.5 rounded-lg backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]">
      <Gauge className="w-5 h-5 text-purple-400" />
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest leading-none mb-1">Chamber Pressure</span>
        <span className="text-sm font-bold text-white">{currentRecipe.pressure || 1} {currentEquipment?.id === 'sputtering' ? 'mTorr' : 'Torr'}</span>
      </div>
    </div>
    {currentRecipe.power && (
      <div className="flex items-center space-x-3 bg-slate-900/80 border border-slate-700 text-cyan-400 px-4 py-2.5 rounded-lg backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <Zap className="w-5 h-5 text-yellow-400" />
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest leading-none mb-1">RF/DC Power</span>
          <span className="text-sm font-bold text-white">{currentRecipe.power}{currentEquipment?.id === 'evaporation' ? 'kW' : 'W'}</span>
        </div>
        <div className="ml-auto w-2 h-2 bg-yellow-400 shadow-[0_0_8px_#facc15] rounded-full animate-ping"></div>
      </div>
    )}
  </div>
);


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
  const [isCrossSectionExpanded, setIsCrossSectionExpanded] = useState(false);

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
        setAnimationPhase(prev => (prev + 1) % 16);
        setLayerThickness(prev => {
          const newThickness = [...prev];
          const increment = 100 / (duration / 50);
          newThickness[currentStep] = Math.min(100, newThickness[currentStep] + increment);
          return newThickness;
        });
      }, 50);
      
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
    setIsPlaying(false);
  };
  
  const toggleCrossSection = () => setIsCrossSectionExpanded(!isCrossSectionExpanded);

  const currentEquipment = selectedEquipments[currentStep];
  const currentRecipe = recipes[currentStep] || {};

  return (
    <div className="max-w-6xl mx-auto p-6 font-sans">
      {/* 컨트롤 헤더 */}
      <div className="flex flex-col md:flex-row items-center justify-between p-5 border-b border-cyan-900/50 bg-slate-800/80 backdrop-blur-md rounded-t-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <h2 className="text-2xl font-black text-white font-mono tracking-widest uppercase flex items-center mb-4 md:mb-0">
          <Play className="w-6 h-6 mr-3 text-cyan-400 fill-current animate-pulse" />
          SIMULATION <span className="text-cyan-500 ml-2">EXECUTION</span>
        </h2>
        
        <div className="flex flex-wrap justify-center items-center gap-3">
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 rounded-lg p-1 shadow-inner">
            <button onClick={togglePlay} className="p-2.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-md transition-colors" title={isPlaying ? "PAUSE" : "START"}>
              {isPlaying ? <Pause className="w-5 h-5 text-red-500 fill-current" /> : <Play className="w-5 h-5 text-green-500 fill-current" />}
            </button>
            <div className="w-px h-6 bg-slate-700"></div>
            <button onClick={resetAnimation} className="p-2.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-md transition-colors" title="RESET">
              <RotateCcw className="w-5 h-5 text-blue-400" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-inner font-mono">
            <span className="text-xs text-cyan-600 uppercase tracking-widest">Rate:</span>
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="text-sm font-bold bg-transparent text-white focus:outline-none cursor-pointer">
              <option value={0.5} className="bg-slate-900">0.5x</option>
              <option value={1} className="bg-slate-900">1.0x</option>
              <option value={2} className="bg-slate-900">2.0x</option>
              <option value={4} className="bg-slate-900">4.0x</option>
              <option value={8} className="bg-slate-900">8.0x</option>
            </select>
          </div>
          
          <button onClick={() => setShowSettings(!showSettings)} className={`p-2.5 rounded-lg border transition-all ${showSettings ? 'bg-cyan-900/40 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'}`} title="SETTINGS">
            <Settings className={`w-5 h-5 ${showSettings ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
          </button>
        </div>
      </div>
      {showSettings && (
        <>
          <div className="fixed inset-0 bg-black/60 z-20 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="absolute top-24 right-6 bg-slate-900/95 backdrop-blur-md rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] border border-cyan-900/80 p-5 w-80 z-30 font-mono">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-3">
              <h3 className="font-bold text-sm tracking-widest text-cyan-400 uppercase flex items-center">
                <Settings className="w-4 h-4 mr-2" /> OVERRIDE CONFIG
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-5">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${showParticles ? 'bg-cyan-600 border-cyan-400' : 'bg-slate-800 border-slate-600'}`}>
                  {showParticles && <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>}
                </div>
                <input type="checkbox" checked={showParticles} onChange={(e) => setShowParticles(e.target.checked)} className="hidden"/>
                <span className={`text-sm tracking-widest uppercase transition-colors ${showParticles ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>PARTICLE SYS</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${showEnergyWaves ? 'bg-cyan-600 border-cyan-400' : 'bg-slate-800 border-slate-600'}`}>
                  {showEnergyWaves && <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>}
                </div>
                <input type="checkbox" checked={showEnergyWaves} onChange={(e) => setShowEnergyWaves(e.target.checked)} className="hidden"/>
                <span className={`text-sm tracking-widest uppercase transition-colors ${showEnergyWaves ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>WAVE EMITTER</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${showPlasmaEffects ? 'bg-cyan-600 border-cyan-400' : 'bg-slate-800 border-slate-600'}`}>
                  {showPlasmaEffects && <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>}
                </div>
                <input type="checkbox" checked={showPlasmaEffects} onChange={(e) => setShowPlasmaEffects(e.target.checked)} className="hidden"/>
                <span className={`text-sm tracking-widest uppercase transition-colors ${showPlasmaEffects ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>PLASMA FIELD</span>
              </label>
              <div className="space-y-3 pt-4 border-t border-slate-700">
                <div className="flex justify-between items-center text-xs tracking-widest text-slate-400 uppercase">
                  <span>OVERDRIVE INTENSITY</span>
                  <span className="text-cyan-400 font-bold">{intensityLevel.toFixed(1)}x</span>
                </div>
                <input type="range" min="0.5" max="2" step="0.1" value={intensityLevel} onChange={(e) => setIntensityLevel(Number(e.target.value))} className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-full appearance-none outline-none" />
              </div>
            </div>
          </div>
        </>
      )}
      {/* 스텝 네비게이터 */}
      <div className="flex justify-center mb-8 px-4 py-6 bg-slate-900 border-x border-b border-cyan-900/30 rounded-b-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex-wrap gap-4 relative overflow-hidden">
        {/* 장식용 스캔라인 */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
        
        {selectedEquipments.map((equipment, index) => (
          <div key={index} className={`relative px-5 py-2.5 rounded border font-mono text-sm tracking-widest uppercase transition-all duration-500 flex items-center ${
            index === currentStep ? 
              `${equipment.color === 'red' ? 'bg-red-900/30 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : equipment.color === 'purple' ? 'bg-purple-900/30 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-blue-900/30 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'} scale-105 z-10` :
            index < currentStep ? 
              `${equipment.color === 'red' ? 'bg-red-900/10 border-red-900/50 text-red-500/70' : equipment.color === 'purple' ? 'bg-purple-900/10 border-purple-900/50 text-purple-500/70' : 'bg-blue-900/10 border-blue-900/50 text-blue-500/70'}` :
              'bg-slate-800 border-slate-700 text-slate-500'
          }`}>
            <span className={`mr-2 font-black ${index === currentStep ? 'opacity-100' : 'opacity-50'}`}>0{index + 1}</span>
            <span className={index === currentStep ? 'font-bold' : ''}>{equipment.name}</span>
            
            {index === currentStep && (
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-cyan-400 rounded-full animate-ping shadow-[0_0_10px_#22d3ee]" />
            )}
          </div>
        ))}
      </div>

      {/* 메인 뷰포트 (애니메이션 컨테이너) */}
      <motion.div 
        animate={
          isPlaying && currentEquipment?.id === 'sputtering' ? {
            x: [0, -2, 2, -1, 1, 0] * intensityLevel,
            y: [0, 1, -1, 2, -2, 0] * intensityLevel
          } : isPlaying && currentEquipment?.id === 'evaporation' ? {
            y: [0, -1, 1, 0] * intensityLevel
          } : {}
        }
        transition={{
          duration: 0.1 / speed,
          repeat: Infinity,
          repeatType: "mirror"
        }}
        className="relative mx-auto w-full h-[450px] bg-slate-900 rounded-2xl border border-cyan-900/50 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] mt-4"
      >
        <AnimatePresence>
          <motion.div 
            key={`flash-${currentStep}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-white z-[60] pointer-events-none mix-blend-overlay"
          />
        </AnimatePresence>
        
        {/* 글로벌 사이버 그리드 */}
        <div className="absolute inset-0 opacity-20 pointer-events-none z-0">
          <div className="w-full h-full" style={{
            backgroundImage: 'linear-gradient(rgba(6,182,212,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.2) 1px, transparent 1px)', 
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        {/* 상단 장식 바 */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-900 via-cyan-500 to-cyan-900 opacity-50 z-10"></div>

        <ParameterMonitor currentRecipe={currentRecipe} currentEquipment={currentEquipment} />
        
        {currentEquipment && (
          <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md rounded-lg px-4 py-3 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-slate-700 max-w-xs z-10 font-mono">
            <div className={`text-sm tracking-widest uppercase font-bold mb-3 flex items-center justify-between ${
              currentEquipment.color === 'red' ? 'text-red-400' : currentEquipment.color === 'purple' ? 'text-purple-400' : 'text-blue-400'
            }`}>
              <span>{currentEquipment.name}</span>
              <div className={`ml-3 w-2 h-2 rounded-full animate-pulse ${
                currentEquipment.color === 'red' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : currentEquipment.color === 'purple' ? 'bg-purple-500 shadow-[0_0_8px_#a855f7]' : 'bg-blue-500 shadow-[0_0_8px_#3b82f6]'
              }`} />
            </div>
            <div className="text-center bg-slate-800 rounded p-2 border border-slate-700 relative overflow-hidden">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-cyan-900/40" 
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(layerThickness[currentStep] || 0)}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              />
              <div className="relative z-10 text-xs text-slate-300 uppercase tracking-widest flex justify-between items-center">
                <span>PROGRESS</span>
                <span className="text-cyan-400 font-bold">{Math.round(layerThickness[currentStep] || 0)}%</span>
              </div>
            </div>
          </div>
        )}
        
        <EnhancedEquipmentAnimation 
          currentEquipment={currentEquipment}
          layerThickness={layerThickness}
          currentStep={currentStep}
          speed={speed}
          animationPhase={animationPhase}
          showParticles={showParticles}
          showEnergyWaves={showEnergyWaves}
          showPlasmaEffects={showPlasmaEffects}
          currentRecipe={currentRecipe}
        />
        <CrossSectionView 
          isExpanded={isCrossSectionExpanded}
          onToggle={toggleCrossSection}
          recipes={recipes}
          selectedEquipments={selectedEquipments}
          layerThickness={layerThickness}
        />
      </motion.div>

      {/* 종합 상태 대시보드 */}
      <div className="mt-8 space-y-6 font-mono">
        <div className="space-y-3">
          <div className="flex justify-between items-center px-2">
            <span className="text-xs font-bold text-cyan-500 uppercase tracking-widest flex items-center">
              <Activity className="w-4 h-4 mr-2" /> TOTAL FABRICATION PROGRESS
            </span>
            <span className="text-sm font-black text-white">
              {Math.round((currentStep + (layerThickness[currentStep] || 0) / 100) / selectedEquipments.length * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-sm h-1.5 border border-slate-700 relative overflow-hidden">
            <div 
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-600 via-blue-500 to-purple-500 transition-all duration-1000 shadow-[0_0_10px_rgba(6,182,212,0.8)]" 
              style={{ width: `${(currentStep + (layerThickness[currentStep] || 0) / 100) / selectedEquipments.length * 100}%` }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {selectedEquipments.map((equipment, index) => (
            <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
                <span className={`text-xs uppercase tracking-widest font-bold ${
                  equipment.color === 'red' ? 'text-red-400' : equipment.color === 'purple' ? 'text-purple-400' : 'text-cyan-400'
                }`}>{equipment.name}</span>
                <span className="text-xs text-white font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">{Math.round(layerThickness[index] || 0)}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-sm h-1">
                <div className={`${
                    equipment.color === 'red' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : equipment.color === 'purple' ? 'bg-purple-500 shadow-[0_0_8px_#a855f7]' : 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]'
                  } h-1 rounded-sm transition-all duration-500 relative`} 
                  style={{ width: `${layerThickness[index] || 0}%` }}
                >
                  {layerThickness[index] > 0 && layerThickness[index] < 100 && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* 하단 제어 패널 */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-12 p-6 bg-slate-900 border border-slate-700 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] font-mono gap-6">
        <div className="flex items-center space-x-8 bg-slate-800 p-4 rounded-lg border border-slate-700">
          <div className="text-center relative">
            <div className="text-3xl font-black text-cyan-400 text-shadow-glow">{currentStep + 1}</div>
            <div className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">ACTIVE STAGE</div>
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-px h-8 bg-slate-700"></div>
          </div>
          <div className="text-center relative">
            <div className="text-3xl font-black text-purple-400 text-shadow-glow">{completedCycles}</div>
            <div className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">COMPLETED CYCLES</div>
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-px h-8 bg-slate-700"></div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-slate-300">{selectedEquipments.length}</div>
            <div className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">TOTAL STAGES</div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <button 
            onClick={onStartOver} 
            className="px-6 py-3 bg-slate-800 text-slate-300 border border-slate-600 hover:border-slate-400 hover:bg-slate-700 rounded-lg text-xs font-bold uppercase tracking-widest transition-all w-full sm:w-auto text-center"
          >
            ABORT & RECONFIGURE
          </button>
          <button 
            onClick={() => console.log('시뮬레이션 데이터:', {
              equipment: selectedEquipments, recipes: recipes, progress: layerThickness, cycles: completedCycles,
              animationSettings: { showParticles, showEnergyWaves, showPlasmaEffects, intensityLevel }
            })} 
            className="px-6 py-3 bg-cyan-900/40 text-cyan-400 border border-cyan-500 hover:bg-cyan-500 hover:text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            EXPORT DATA
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes furnaceGlow { 0%, 100% { filter: brightness(1) hue-rotate(0deg); } 50% { filter: brightness(1.3) hue-rotate(10deg); } }
        @keyframes heatWave { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; } 100% { transform: translate(-50%, -50%) scale(2); opacity: 0; } }
        @keyframes oxygenFloat { 0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); opacity: 0.7; } 25% { transform: translateY(-8px) rotate(90deg) scale(1.2); opacity: 1; } 50% { transform: translateY(-15px) rotate(180deg) scale(0.8); opacity: 0.9; } 75% { transform: translateY(-8px) rotate(270deg) scale(1.1); opacity: 1; } }
        @keyframes plasmaFlicker { 0%, 100% { filter: brightness(1) contrast(1); } 25% { filter: brightness(1.4) contrast(1.2); } 50% { filter: brightness(0.8) contrast(0.9); } 75% { filter: brightness(1.2) contrast(1.1); } }
        @keyframes targetSputter { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(40px) scale(0.3); opacity: 0; } }
        @keyframes sparkle { 0%, 100% { opacity: 0; transform: scale(0.5); } 50% { opacity: 1; transform: scale(1.5); } }
        @keyframes superSputter { 0% { transform: translate(0, 0) scale(0.5); opacity: 0; } 20% { transform: translate(2px, 8px) scale(1.2); opacity: 0.8; } 50% { transform: translate(8px, 20px) scale(1); opacity: 1; } 80% { transform: translate(15px, 35px) scale(0.7); opacity: 0.6; } 100% { transform: translate(25px, 50px) scale(0.2); opacity: 0; } }
        @keyframes ebeamPulse { 0%, 100% { transform: scale(1); filter: brightness(1); } 50% { transform: scale(1.3); filter: brightness(1.8); } }
        @keyframes beamPath { 0% { opacity: 0; transform: scaleY(0); } 50% { opacity: 1; transform: scaleY(1); } 100% { opacity: 0; transform: scaleY(0); } }
        @keyframes superEvaporate { 0% { transform: translate(0, 0) scale(0.3); opacity: 0; } 15% { transform: translate(1px, -5px) scale(0.8); opacity: 0.7; } 30% { transform: translate(3px, -12px) scale(1.2); opacity: 1; } 50% { transform: translate(6px, -20px) scale(1); opacity: 0.8; } 70% { transform: translate(10px, -30px) scale(0.6); opacity: 0.5; } 100% { transform: translate(15px, -45px) scale(0.2); opacity: 0; } }
        @keyframes molecularBeam { 0%, 100% { opacity: 0; transform: scaleX(0); } 50% { opacity: 0.8; transform: scaleX(1); } }
      `}</style>
    </div>
  );
};

export default ProcessAnimation;