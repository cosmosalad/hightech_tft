import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Eye, Download, BarChart3, Zap, Thermometer, Gauge } from 'lucide-react';

const ProcessAnimation = ({ selectedEquipments, recipes, onStartOver }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [layerThickness, setLayerThickness] = useState([]);
  const [currentParams, setCurrentParams] = useState({});
  const [completedCycles, setCompletedCycles] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showParticles, setShowParticles] = useState(true);
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
        setAnimationPhase(prev => (prev + 1) % 8);
        setLayerThickness(prev => {
          const newThickness = [...prev];
          const increment = 100 / (duration / 100);
          newThickness[currentStep] = Math.min(100, newThickness[currentStep] + increment);
          return newThickness;
        });
      }, 100);
      
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

  const CrossSectionView = () => (
    <div className="absolute bottom-4 right-4 w-52 h-36 bg-white/95 rounded-lg border-2 border-gray-300 shadow-lg z-10">
      <div className="text-xs font-bold text-center py-1 bg-gray-100 rounded-t-lg">실시간 단면도</div>
      <div className="relative p-4 h-28">
        <div className="absolute bottom-0 left-4 right-4 h-8 bg-gray-600 rounded-b flex items-center justify-center"><span className="text-xs text-white font-bold">Si 기판</span></div>
        {selectedEquipments.map((equipment, index) => {
          const thickness = layerThickness[index] || 0;
          if (thickness === 0) return null;
          const previousThickness = selectedEquipments.slice(0, index).reduce((total, _, prevIndex) => total + Math.max(2, (layerThickness[prevIndex] || 0) / 10), 0);
          let layerHeight, layerColor, layerName, layerWidth = '100%', layerLeft = '0%';
          switch (equipment.id) {
            case 'oxidation': layerHeight = Math.max(2, thickness / 10); layerColor = 'bg-blue-400'; layerName = 'SiO₂'; break;
            case 'sputtering': layerHeight = Math.max(2, thickness / 8); layerColor = 'bg-purple-400'; layerName = recipes[index]?.material || 'IZO'; layerWidth = '40%'; layerLeft = '30%'; break;
            case 'evaporation':
              layerHeight = Math.max(2, thickness / 6); layerColor = 'bg-gray-400';
              return (<React.Fragment key={`layer-${index}`}>
                  <div className={`absolute ${layerColor} transition-all duration-500 flex items-center justify-center text-xs text-white font-bold`} style={{ left: '16px', width: '32px', bottom: `${32 + previousThickness}px`, height: `${layerHeight}px` }}>{layerHeight > 6 && 'S'}</div>
                  <div className={`absolute ${layerColor} transition-all duration-500 flex items-center justify-center text-xs text-white font-bold`} style={{ right: '16px', width: '32px', bottom: `${32 + previousThickness}px`, height: `${layerHeight}px` }}>{layerHeight > 6 && 'D'}</div>
              </React.Fragment>);
            default: layerHeight = Math.max(2, thickness / 10); layerColor = 'bg-gray-400'; layerName = '기타';
          }
          return (<div key={`layer-${index}`} className={`absolute ${layerColor} transition-all duration-500 flex items-center justify-center text-xs text-white font-bold`} style={{ left: layerLeft, width: layerWidth, bottom: `${32 + previousThickness}px`, height: `${layerHeight}px` }}>{layerHeight > 6 && layerName}</div>);
        })}
        <div className="absolute right-1 bottom-0 text-xs space-y-1 flex flex-col justify-end h-full pb-2">
          {selectedEquipments.map((equipment, index) => {
            if ((layerThickness[index] || 0) === 0) return null;
            let layerName, layerColor;
            switch (equipment.id) {
              case 'oxidation': layerName = 'SiO₂'; layerColor = 'text-blue-600'; break;
              case 'sputtering': layerName = recipes[index]?.material || 'IZO'; layerColor = 'text-purple-600'; break;
              case 'evaporation': layerName = `${recipes[index]?.material || 'Al'} (S/D)`; layerColor = 'text-gray-600'; break;
              default: layerName = '기타'; layerColor = 'text-gray-600';
            }
            return (<div key={`label-${index}`} className={`${layerColor} text-right text-xs`}>{layerName}</div>);
          })}
          <div className="text-gray-800 text-right">Si</div>
        </div>
      </div>
    </div>
  );
  
  const ParameterMonitor = () => (
    <div className="absolute top-4 left-4 space-y-2 z-10">
        <div className="flex items-center space-x-2 bg-black/80 text-white px-3 py-2 rounded-lg backdrop-blur"><Thermometer className="w-4 h-4" /><span className="text-sm font-mono">{currentRecipe.temperature || 25}°C</span><div className={`w-2 h-2 rounded-full ${(currentRecipe.temperature || 25) > 500 ? 'bg-red-500' : (currentRecipe.temperature || 25) > 100 ? 'bg-yellow-500' : 'bg-blue-500'} animate-pulse`}></div></div>
        <div className="flex items-center space-x-2 bg-black/80 text-white px-3 py-2 rounded-lg backdrop-blur"><Gauge className="w-4 h-4" /><span className="text-sm font-mono">{currentRecipe.pressure || 1} {currentEquipment?.id === 'sputtering' ? 'mTorr' : 'Torr'}</span></div>
        {currentRecipe.power && (<div className="flex items-center space-x-2 bg-black/80 text-white px-3 py-2 rounded-lg backdrop-blur"><Zap className="w-4 h-4" /><span className="text-sm font-mono">{currentRecipe.power}{currentEquipment?.id === 'evaporation' ? 'kW' : 'W'}</span><div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div></div>)}
        <div className="flex items-center space-x-2 bg-black/80 text-white px-3 py-2 rounded-lg backdrop-blur"><BarChart3 className="w-4 h-4" /><span className="text-sm font-mono">Cycle: {completedCycles}</span></div>
    </div>
  );

  const EquipmentAnimation = () => {
    if (!currentEquipment) return null;
    const { id } = currentEquipment;
    const thickness = layerThickness[currentStep] || 0;
    switch (id) {
        case 'oxidation': return (<div className="absolute inset-0"><div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-80 h-64 bg-gradient-to-t from-red-700 via-orange-500 to-yellow-400 rounded-t-[3rem] shadow-2xl"><div className="absolute inset-3 bg-gradient-to-t from-yellow-300 via-orange-400 to-red-400 rounded-t-[3rem] animate-pulse opacity-90" />{showParticles && [...Array(8)].map((_, i) => (<div key={`o2-${i}`} className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-70" style={{left: `${20 + (i % 4) * 15}%`, top: `${15 + (i % 2) * 10}%`, animation: `float ${2 + (i % 3) * 0.5}s ease-in-out infinite`, animationDelay: `${i * 0.3}s`}}/>))}<div className="absolute bottom-12 left-1/2 transform -translate-x-1/2"><div className="w-32 h-6 bg-gradient-to-r from-gray-300 to-gray-500 rounded-lg shadow-2xl relative"><div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-28 h-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-lg"><div className="absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-300 via-blue-400 to-blue-600 rounded-t-lg transition-all duration-1000" style={{ width: `${thickness}%` }}/></div></div></div><div className="absolute top-6 left-6 text-yellow-300 font-mono text-sm bg-black/60 px-3 py-2 rounded-lg">🌡️ {currentRecipe.temperature || 1000}°C</div></div></div>);
        case 'sputtering': return (<div className="absolute inset-0"><div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-80 h-64 bg-gradient-to-t from-gray-900 via-gray-700 to-gray-500 rounded-t-[3rem] shadow-2xl"><div className="absolute inset-3 bg-gradient-to-t from-purple-900 via-purple-700 to-purple-500 rounded-t-[3rem]" /><div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-lg shadow-lg"><div className="text-xs text-center text-white font-bold py-1">{currentRecipe.material || 'IZO'} Target</div></div><div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-20 h-12 bg-purple-400 rounded-full opacity-60 animate-pulse"><div className="w-full h-full bg-gradient-to-r from-purple-300 via-white to-purple-300 rounded-full animate-spin opacity-50" /></div>{showParticles && [...Array(12)].map((_, i) => (<div key={`sput-${i}`} className="absolute w-1 h-1 bg-green-300 rounded-full" style={{left: `${40 + (i % 4) * 5}%`, top: `${25 + (i % 3) * 8}%`, animation: `sputter ${1.5 + (i % 3) * 0.5}s ease-out infinite`, animationDelay: `${i * 0.2}s`}}/>))}<div className="absolute bottom-12 left-1/2 transform -translate-x-1/2"><div className="w-32 h-6 bg-gradient-to-r from-gray-300 to-gray-500 rounded-lg shadow-2xl relative"><div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-28 h-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-lg"><div className="absolute top-1 left-0 h-1 bg-gradient-to-r from-green-300 via-green-400 to-green-500 transition-all duration-1000" style={{ width: `${thickness}%` }}/></div></div></div><div className="absolute top-6 right-6 bg-purple-600 text-white px-3 py-2 rounded-lg font-mono text-sm animate-pulse">⚡ RF: {currentRecipe.power || 150}W</div></div></div>);
        case 'evaporation': return (<div className="absolute inset-0"><div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-80 h-64 bg-gradient-to-t from-black via-gray-800 to-gray-600 rounded-t-[3rem] shadow-2xl"><div className="absolute inset-3 bg-gradient-to-t from-black via-gray-900 to-gray-700 rounded-t-[3rem]" /><div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-8 h-16 bg-gradient-to-b from-gray-300 via-gray-500 to-gray-700 rounded-b-lg shadow-lg"><div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full animate-ping" /><div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-1 h-16 bg-gradient-to-b from-cyan-400 to-transparent animate-pulse" /></div><div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-16 h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 rounded-lg shadow-lg"><div className="text-xs text-center text-gray-800 font-bold py-2">{currentRecipe.material || 'Al'} Source</div></div>{showParticles && [...Array(10)].map((_, i) => (<div key={`evap-${i}`} className="absolute w-1 h-1 bg-gray-400 rounded-full" style={{left: `${42 + (i % 3) * 4}%`, top: `${30 + (i % 4) * 6}%`, animation: `evaporate ${2 + (i % 3) * 0.5}s ease-out infinite`, animationDelay: `${i * 0.3}s`}}/>))}<div className="absolute bottom-12 left-1/2 transform -translate-x-1/2"><div className="w-32 h-6 bg-gradient-to-r from-gray-300 to-gray-500 rounded-lg shadow-2xl relative"><div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-28 h-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-lg">{thickness > 0 && (<><div className="absolute top-0.5 left-0 h-1 bg-gradient-to-r from-gray-300 to-gray-400 transition-all duration-1000" style={{ width: `${Math.min(35, thickness * 0.35)}%` }}/><div className="absolute top-0.5 right-0 h-1 bg-gradient-to-l from-gray-300 to-gray-400 transition-all duration-1000" style={{ width: `${Math.min(35, thickness * 0.35)}%` }}/></>)}</div></div></div><div className="absolute top-6 right-6 text-cyan-300 font-mono text-sm bg-black/70 px-3 py-2 rounded-lg">🔬 E-Beam: {currentRecipe.power || 3}kW</div></div></div>);
        default: return <div className="flex items-center justify-center h-full text-gray-500">Unknown Equipment</div>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center"><Play className="w-6 h-6 mr-2 text-green-500" />실시간 공정 시뮬레이션</h2>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow"><button onClick={togglePlay} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title={isPlaying ? "일시정지" : "재생"}>{isPlaying ? <Pause className="w-5 h-5 text-red-500" /> : <Play className="w-5 h-5 text-green-500" />}</button><button onClick={resetAnimation} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="초기화"><RotateCcw className="w-5 h-5 text-blue-500" /></button></div>
          <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow"><span className="text-sm font-medium">속도:</span><select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="text-sm border rounded px-2 py-1 bg-white"><option value={0.5}>0.5x</option><option value={1}>1x</option><option value={2}>2x</option><option value={4}>4x</option></select></div>
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="설정"><Settings className="w-5 h-5 text-gray-600" /></button>
        </div>
      </div>
      {showSettings && (<div className="absolute top-20 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 p-4 w-64 z-30"><h3 className="font-bold text-lg mb-4 text-gray-800">애니메이션 설정</h3><div className="space-y-3"><label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={showParticles} onChange={(e) => setShowParticles(e.target.checked)} className="rounded"/><span className="text-sm">파티클 효과</span></label></div></div>)}
      <div className="flex justify-center mb-6 space-x-3 bg-white p-4 rounded-lg shadow">
        {selectedEquipments.map((equipment, index) => (<div key={index} className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-500 ${index === currentStep ? equipment.color === 'red' ? 'bg-gradient-to-r from-red-400 to-red-600 text-white shadow-xl scale-110' : equipment.color === 'purple' ? 'bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-xl scale-110' : 'bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-xl scale-110' : index < currentStep ? equipment.color === 'red' ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 shadow-md' : equipment.color === 'purple' ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 shadow-md' : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-md' : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-500 shadow'}`}><div className="flex items-center space-x-2"><span className="font-bold">{index + 1}.</span><span>{equipment.name}</span></div>{index === currentStep && (<div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />)}</div>))}
      </div>
      <div className="relative mx-auto w-full h-[400px] bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 rounded-2xl border-2 border-gray-300 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-5"><div className="w-full h-full" style={{backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px'}} /></div>
        <ParameterMonitor />
        {currentEquipment && (<div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-xl border border-blue-200 max-w-xs"><div className={`text-lg font-bold mb-2 flex items-center ${currentEquipment.color === 'red' ? 'text-red-600' : currentEquipment.color === 'purple' ? 'text-purple-600' : 'text-blue-600'}`}>{currentEquipment.name}<div className={`ml-2 w-2 h-2 rounded-full animate-pulse ${currentEquipment.color === 'red' ? 'bg-red-500' : currentEquipment.color === 'purple' ? 'bg-purple-500' : 'bg-blue-500'}`} /></div><div className="space-y-1 text-sm"><div className="text-gray-600">재료: {currentRecipe.material || '기본'}</div><div className="text-gray-600">목표: {currentRecipe.targetThickness || 100}nm</div><div className={`${currentEquipment.color === 'red' ? 'text-red-600' : currentEquipment.color === 'purple' ? 'text-purple-600' : 'text-blue-600'}`}>{currentEquipment.description}</div><div className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1">진행률: {Math.round(layerThickness[currentStep] || 0)}%</div></div></div>)}
        <CrossSectionView />
        <EquipmentAnimation />
      </div>
      <div className="mt-6 space-y-4">
        <div className="space-y-2"><div className="flex justify-between items-center"><span className="text-sm font-medium text-gray-700">전체 공정 진행률</span><span className="text-sm text-gray-500">{Math.round((currentStep + (layerThickness[currentStep] || 0) / 100) / selectedEquipments.length * 100)}%</span></div><div className="w-full bg-gray-200 rounded-full h-3 shadow-inner"><div className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-3 rounded-full transition-all duration-1000 shadow-lg" style={{ width: `${(currentStep + (layerThickness[currentStep] || 0) / 100) / selectedEquipments.length * 100}%` }}/></div></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{selectedEquipments.map((equipment, index) => (<div key={index} className="bg-white rounded-lg p-4 shadow border"><div className="flex items-center justify-between mb-2"><span className={`text-sm font-medium ${equipment.color === 'red' ? 'text-red-600' : equipment.color === 'purple' ? 'text-purple-600' : 'text-blue-600'}`}>{equipment.name.split(' ')[0]}</span><span className="text-xs text-gray-500">{Math.round(layerThickness[index] || 0)}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className={`${equipment.color === 'red' ? 'bg-red-500' : equipment.color === 'purple' ? 'bg-purple-500' : 'bg-blue-500'} h-2 rounded-full transition-all duration-500`} style={{ width: `${layerThickness[index] || 0}%` }}/></div></div>))}</div>
      </div>
      <div className="flex justify-between items-center mt-8 p-4 bg-white rounded-xl shadow border">
        <div className="flex items-center space-x-4"><div className="text-center"><div className="text-2xl font-bold text-blue-600">{currentStep + 1}</div><div className="text-sm text-gray-600">현재 단계</div></div><div className="text-center"><div className="text-2xl font-bold text-purple-600">{completedCycles}</div><div className="text-sm text-gray-600">완료 사이클</div></div><div className="text-center"><div className="text-2xl font-bold text-green-600">{selectedEquipments.length}</div><div className="text-sm text-gray-600">총 단계</div></div></div>
        <div className="flex space-x-3"><button onClick={onStartOver} className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-400 transition-colors">처음부터 다시 설정</button><button onClick={() => console.log('시뮬레이션 데이터:', {equipment: selectedEquipments, recipes: recipes, progress: layerThickness, cycles: completedCycles})} className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center"><Download className="w-4 h-4 mr-2" />데이터 내보내기</button></div>
      </div>
      <style jsx>{`@keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; } 50% { transform: translateY(-10px) rotate(180deg); opacity: 1; } } @keyframes sputter { 0% { transform: translate(0, 0) scale(0.5); opacity: 0; } 50% { transform: translate(5px, 15px) scale(1); opacity: 1; } 100% { transform: translate(10px, 30px) scale(0.3); opacity: 0; } } @keyframes evaporate { 0% { transform: translate(0, 0) scale(0.3); opacity: 0; } 30% { transform: translate(2px, -8px) scale(0.8); opacity: 0.7; } 70% { transform: translate(4px, -16px) scale(1.2); opacity: 0.5; } 100% { transform: translate(6px, -24px) scale(1.5); opacity: 0; } }`}</style>
    </div>
  );
};

export default ProcessAnimation;