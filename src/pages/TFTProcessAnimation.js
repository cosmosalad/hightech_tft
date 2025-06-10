import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, Settings, Zap, Thermometer, Gauge, Camera, Download, Info, Eye, BarChart3 } from 'lucide-react';

const EnhancedTFTProcessAnimation = ({ onClose = () => {} }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState('normal');
  const [showParticles, setShowParticles] = useState(true);
  const [showTemperature, setShowTemperature] = useState(true);
  const [showElectricalField, setShowElectricalField] = useState(false);
  const [showMolecularView, setShowMolecularView] = useState(false);
  const [show3DEffect, setShow3DEffect] = useState(true);
  const [currentTemp, setCurrentTemp] = useState(25);
  const [currentPressure, setCurrentPressure] = useState(1);
  const [currentPower, setCurrentPower] = useState(0);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [layerThickness, setLayerThickness] = useState([0, 0, 0]);
  const intervalRef = useRef(null);
  const stepTimerRef = useRef(null);
  
  const steps = [
    { 
      name: "퍼니스 - SiO₂ 형성", 
      color: "blue", 
      duration: 5000,
      temp: 900,
      pressure: 1,
      power: 0,
      description: "실리콘 기판 위에 절연층 형성",
      chemistry: "Si + O₂ → SiO₂",
      thickness: "20-100nm",
      gas: "O₂",
      process: "열산화"
    },
    { 
      name: "RF 스퍼터링 - IZO 증착", 
      color: "purple", 
      duration: 5000,
      temp: 200,
      pressure: 0.001,
      power: 100,
      description: "투명 반도체 채널층 증착",
      chemistry: "In₂O₃ + ZnO → IZO",
      thickness: "30nm",
      gas: "Ar",
      process: "물리기상증착"
    },
    { 
      name: "E-빔 증착 - Al 전극", 
      color: "orange", 
      duration: 5000,
      temp: 25,
      pressure: 0.0001,
      power: 50,
      description: "소스/드레인 전극 형성",
      chemistry: "Al → Al⁺ + e⁻",
      thickness: "100nm",
      gas: "진공",
      process: "전자빔증착"
    }
  ];

  // 애니메이션 정리 함수
  const clearTimers = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
  };

  useEffect(() => {
    clearTimers();
    
    if (isPlaying) {
      const duration = (steps[currentStep]?.duration || 5000) / speed;
      
      intervalRef.current = setInterval(() => {
        setAnimationPhase(prev => (prev + 1) % 8);
        
        // 레이어 두께 업데이트 - 더 자연스러운 증가율
        setLayerThickness(prev => {
          const newThickness = [...prev];
          if (currentStep < 3) {
            const increment = currentStep === 0 ? 1.2 : currentStep === 1 ? 0.8 : 1.0;
            newThickness[currentStep] = Math.min(100, newThickness[currentStep] + increment);
          }
          return newThickness;
        });
      }, duration / 80);
      
      stepTimerRef.current = setTimeout(() => {
        setCurrentStep((prev) => {
          const next = (prev + 1) % steps.length;
          if (next === 0) {
            setCompletedCycles(c => c + 1);
            setLayerThickness([0, 0, 0]);
          }
          return next;
        });
      }, duration);
    }
    
    // 현재 단계의 파라미터 업데이트
    setCurrentTemp(steps[currentStep]?.temp || 25);
    setCurrentPressure(steps[currentStep]?.pressure || 1);
    setCurrentPower(steps[currentStep]?.power || 0);
    
    return clearTimers;
  }, [currentStep, isPlaying, speed]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const resetAnimation = () => {
    clearTimers();
    setCurrentStep(0);
    setCompletedCycles(0);
    setAnimationPhase(0);
    setLayerThickness([0, 0, 0]);
  };

  const captureFrame = () => {
    console.log('Frame captured at step:', currentStep);
  };

  const downloadReport = () => {
    const report = {
      completedCycles: completedCycles,
      currentStep: steps[currentStep].name,
      parameters: {
        temperature: currentTemp,
        pressure: currentPressure,
        power: currentPower
      },
      layerProgress: layerThickness
    };
    console.log('Report downloaded:', report);
  };

  const ElectricalField = () => (
    <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${showElectricalField ? 'opacity-100' : 'opacity-0'}`}>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse"
          style={{
            top: `${25 + i * 8}%`,
            left: '15%',
            right: '15%',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );

  const MolecularStructure = ({ step }) => {
    const molecules = {
      0: [
        { symbol: 'Si', x: 45, y: 70, color: '#6B7280', size: 3 },
        { symbol: 'O₂', x: 35, y: 45, color: '#EF4444', size: 2 },
        { symbol: 'O₂', x: 55, y: 45, color: '#EF4444', size: 2 },
        { symbol: 'SiO₂', x: 45, y: 55, color: '#3B82F6', size: 2.5 }
      ],
      1: [
        { symbol: 'In³⁺', x: 25, y: 35, color: '#8B5CF6', size: 2.5 },
        { symbol: 'Zn²⁺', x: 45, y: 35, color: '#06B6D4', size: 2.5 },
        { symbol: 'O²⁻', x: 65, y: 35, color: '#EF4444', size: 2 },
        { symbol: 'Ar⁺', x: 35, y: 20, color: '#10B981', size: 1.5 }
      ],
      2: [
        { symbol: 'Al', x: 45, y: 25, color: '#9CA3AF', size: 3 },
        { symbol: 'e⁻', x: 35, y: 15, color: '#FBBF24', size: 1 },
        { symbol: 'e⁻', x: 55, y: 15, color: '#FBBF24', size: 1 },
        { symbol: 'Al⁺', x: 45, y: 40, color: '#F59E0B', size: 2 }
      ]
    };

    return (
      <div className={`absolute top-4 right-4 w-40 h-40 bg-black/90 rounded-xl border-2 border-cyan-400 transition-all duration-500 ${showMolecularView ? 'opacity-100 scale-100' : 'opacity-0 scale-75'} z-20`}>
        <div className="text-xs text-cyan-400 text-center py-2 font-bold">분자 구조</div>
        <div className="relative w-full h-32">
          {molecules[step] && molecules[step].map((mol, i) => (
            <div
              key={`mol-${i}`}
              className="absolute text-xs font-bold animate-bounce flex items-center justify-center rounded-full border"
              style={{ 
                left: `${mol.x}%`, 
                top: `${mol.y}%`,
                width: `${mol.size * 8}px`,
                height: `${mol.size * 8}px`,
                backgroundColor: mol.color,
                color: 'white',
                fontSize: '8px',
                animationDelay: `${i * 0.2}s`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {mol.symbol}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const CrossSectionView = () => {
    const sio2Height = layerThickness[0] > 0 ? Math.max(2, layerThickness[0] / 10) : 0;
    const izoHeight = layerThickness[1] > 0 ? Math.max(2, layerThickness[1] / 8) : 0;
    const alHeight = layerThickness[2] > 0 ? Math.max(2, layerThickness[2] / 6) : 0;
    
    return (
      <div className="absolute bottom-4 right-4 w-52 h-36 bg-white/95 rounded-lg border-2 border-gray-300 shadow-lg z-10">
        <div className="text-xs font-bold text-center py-1 bg-gray-100 rounded-t-lg">단면도 (실시간)</div>
        <div className="relative p-4 h-28">
          {/* 기판 */}
          <div className="absolute bottom-0 left-4 right-4 h-8 bg-gray-600 rounded-b flex items-center justify-center">
            <span className="text-xs text-white font-bold">Si 기판</span>
          </div>
          
          {/* SiO₂ 층 - 전체 */}
          {sio2Height > 0 && (
            <div 
              className="absolute left-4 right-4 bg-blue-400 transition-all duration-500 flex items-center justify-center"
              style={{ 
                bottom: '32px',
                height: `${sio2Height}px`
              }}
            >
              {sio2Height > 6 && <span className="text-xs text-white font-bold">SiO₂</span>}
            </div>
          )}
          
          {/* IZO 층 - 중앙 부분 */}
          {izoHeight > 0 && (
            <div 
              className="absolute bg-purple-400 transition-all duration-500 flex items-center justify-center"
              style={{ 
                left: '30%',
                right: '30%',
                bottom: `${32 + sio2Height}px`,
                height: `${izoHeight}px`
              }}
            >
              {izoHeight > 6 && <span className="text-xs text-white font-bold">IZO</span>}
            </div>
          )}
          
          {/* Al 전극 - 양쪽 끝, IZO와 살짝 겹침 */}
          {alHeight > 0 && (
            <>
              {/* 왼쪽 전극 */}
              <div 
                className="absolute bg-gray-400 transition-all duration-500 flex items-center justify-center"
                style={{ 
                  left: '16px',
                  width: '32px',
                  bottom: `${32 + sio2Height + izoHeight}px`,
                  height: `${alHeight}px`
                }}
              >
                {alHeight > 6 && <span className="text-xs text-white font-bold">S</span>}
              </div>
              
              {/* 오른쪽 전극 */}
              <div 
                className="absolute bg-gray-400 transition-all duration-500 flex items-center justify-center"
                style={{ 
                  right: '16px',
                  width: '32px',
                  bottom: `${32 + sio2Height + izoHeight}px`,
                  height: `${alHeight}px`
                }}
              >
                {alHeight > 6 && <span className="text-xs text-white font-bold">D</span>}
              </div>
            </>
          )}
          
          {/* 층 표시 라벨 */}
          <div className="absolute right-1 bottom-0 text-xs space-y-1 flex flex-col justify-end h-full pb-2">
            {alHeight > 0 && <div className="text-gray-600 text-right">Al (S/D)</div>}
            {izoHeight > 0 && <div className="text-purple-600 text-right">IZO</div>}
            {sio2Height > 0 && <div className="text-blue-600 text-right">SiO₂</div>}
            <div className="text-gray-800 text-right">Si</div>
          </div>
        </div>
      </div>
    );
  };

  const ParameterPanel = () => (
    <div className="absolute top-4 left-4 space-y-2 z-10">
      {showTemperature && (
        <div className="flex items-center space-x-2 bg-black/80 text-white px-3 py-2 rounded-lg backdrop-blur">
          <Thermometer className="w-4 h-4" />
          <span className="text-sm font-mono">{currentTemp}°C</span>
          <div className={`w-2 h-2 rounded-full ${
            currentTemp > 500 ? 'bg-red-500' : 
            currentTemp > 100 ? 'bg-yellow-500' : 'bg-blue-500'
          } animate-pulse`}></div>
        </div>
      )}
      <div className="flex items-center space-x-2 bg-black/80 text-white px-3 py-2 rounded-lg backdrop-blur">
        <Gauge className="w-4 h-4" />
        <span className="text-sm font-mono">{currentPressure} Torr</span>
        <div className={`w-2 h-2 rounded-full ${
          currentPressure < 0.01 ? 'bg-purple-500' : 'bg-green-500'
        } animate-pulse`}></div>
      </div>
      {currentPower > 0 && (
        <div className="flex items-center space-x-2 bg-black/80 text-white px-3 py-2 rounded-lg backdrop-blur">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-mono">{currentPower}W</span>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
        </div>
      )}
      <div className="flex items-center space-x-2 bg-black/80 text-white px-3 py-2 rounded-lg backdrop-blur">
        <BarChart3 className="w-4 h-4" />
        <span className="text-sm font-mono">Cycle: {completedCycles}</span>
      </div>
    </div>
  );

  const ControlPanel = () => (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
        <Play className="w-6 h-6 mr-2 text-green-500" />
        Enhanced TFT Process
      </h2>
      
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow">
          <button
            onClick={togglePlay}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title={isPlaying ? "일시정지" : "재생"}
          >
            {isPlaying ? <Pause className="w-5 h-5 text-red-500" /> : <Play className="w-5 h-5 text-green-500" />}
          </button>
          <button
            onClick={resetAnimation}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="초기화"
          >
            <RotateCcw className="w-5 h-5 text-blue-500" />
          </button>
        </div>

        <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow">
          <span className="text-sm font-medium">속도:</span>
          <select 
            value={speed} 
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="text-sm border rounded px-2 py-1 bg-white"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow">
          <Eye className="w-4 h-4" />
          <select 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value)}
            className="text-sm border rounded px-2 py-1 bg-white"
          >
            <option value="normal">일반 뷰</option>
            <option value="microscopic">현미경 뷰</option>
            <option value="electrical">전기장 뷰</option>
            <option value="molecular">분자 뷰</option>
          </select>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="설정"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>

        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="닫기"
        >
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>
    </div>
  );

  const StepIndicator = () => (
    <div className="flex justify-center mb-6 space-x-3">
      {steps.map((step, index) => (
        <div 
          key={index}
          className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-500 cursor-pointer transform hover:scale-105 ${
            index === currentStep 
              ? step.color === 'blue' ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-xl scale-110'
                : step.color === 'purple' ? 'bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-xl scale-110'
                : 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-xl scale-110'
              : index < currentStep 
                ? step.color === 'blue' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-md'
                  : step.color === 'purple' ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 shadow-md'
                  : 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 shadow-md'
                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-500 shadow'
          }`}
          onClick={() => setCurrentStep(index)}
        >
          <div className="flex items-center space-x-2">
            <span className="font-bold">{index + 1}.</span>
            <span>{step.name}</span>
          </div>
          {index === currentStep && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
          )}
        </div>
      ))}
    </div>
  );

  const SettingsPanel = () => showSettings && (
    <div className="absolute top-20 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 p-4 w-64 z-30">
      <h3 className="font-bold text-lg mb-4 text-gray-800">애니메이션 설정</h3>
      <div className="space-y-3">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={showParticles} 
            onChange={(e) => setShowParticles(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">파티클 효과</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={showTemperature} 
            onChange={(e) => setShowTemperature(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">온도 표시</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={showElectricalField} 
            onChange={(e) => setShowElectricalField(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">전기장 표시</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={showMolecularView} 
            onChange={(e) => setShowMolecularView(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">분자 구조</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={show3DEffect} 
            onChange={(e) => setShow3DEffect(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">3D 효과</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={soundEnabled} 
            onChange={(e) => setSoundEnabled(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">음향 효과</span>
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </label>
      </div>
    </div>
  );

  const ProcessStep = () => {
    const step = steps[currentStep];
    
    if (currentStep === 0) {
      return (
        <div className="absolute inset-0">
          {/* 퍼니스 구조 */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-80 h-64 bg-gradient-to-t from-red-700 via-orange-500 to-yellow-400 rounded-t-[3rem] shadow-2xl">
            <div className="absolute inset-3 bg-gradient-to-t from-yellow-300 via-orange-400 to-red-400 rounded-t-[3rem] animate-pulse opacity-90" />
            
            {/* 산소 입자들 */}
            {showParticles && [...Array(8)].map((_, i) => (
              <div
                key={`o2-${i}`}
                className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-70"
                style={{
                  left: `${20 + (i % 4) * 15}%`,
                  top: `${15 + (i % 2) * 10}%`,
                  animation: `float ${2 + (i % 3) * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`
                }}
              />
            ))}
            
            {/* 기판과 성장하는 SiO2 층 */}
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
              <div className="w-32 h-6 bg-gradient-to-r from-gray-300 to-gray-500 rounded-lg shadow-2xl relative">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-28 h-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-lg">
                  <div 
                    className="absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-300 via-blue-400 to-blue-600 rounded-t-lg transition-all duration-1000"
                    style={{ width: `${layerThickness[0]}%` }}
                  />
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
                    Si 기판
                  </div>
                </div>
              </div>
            </div>
            
            {/* 온도 표시 */}
            <div className="absolute top-6 left-6 text-yellow-300 font-mono text-sm bg-black/60 px-3 py-2 rounded-lg">
              🌡️ {currentTemp}°C
            </div>
          </div>
          
          {/* 공정 정보 패널 */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-xl border border-blue-200 max-w-xs">
            <div className="text-lg font-bold text-blue-600 mb-2 flex items-center">
              🔥 열산화 공정
              <div className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </div>
            <div className="space-y-1 text-sm">
              <div className="text-gray-700 font-medium">{step.chemistry}</div>
              <div className="text-gray-600">가스: {step.gas}</div>
              <div className="text-gray-600">두께: {step.thickness}</div>
              <div className="text-blue-600">{step.description}</div>
              <div className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1">
                진행률: {Math.round(layerThickness[0])}%
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (currentStep === 1) {
      return (
        <div className="absolute inset-0">
          {/* 스퍼터링 챔버 */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-80 h-64 bg-gradient-to-t from-gray-900 via-gray-700 to-gray-500 rounded-t-[3rem] shadow-2xl">
            <div className="absolute inset-3 bg-gradient-to-t from-purple-900 via-purple-700 to-purple-500 rounded-t-[3rem]" />
            
            {/* IZO 타겟 */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-lg shadow-lg">
              <div className="text-xs text-center text-white font-bold py-1">IZO Target</div>
            </div>
            
            {/* 플라즈마 영역 */}
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-20 h-12 bg-purple-400 rounded-full opacity-60 animate-pulse">
              <div className="w-full h-full bg-gradient-to-r from-purple-300 via-white to-purple-300 rounded-full animate-spin opacity-50" />
            </div>
            
            {/* 스퍼터된 입자들 */}
            {showParticles && [...Array(12)].map((_, i) => (
              <div
                key={`izo-${i}`}
                className="absolute w-1 h-1 bg-green-300 rounded-full"
                style={{
                  left: `${40 + (i % 4) * 5}%`,
                  top: `${25 + (i % 3) * 8}%`,
                  animation: `sputter ${1.5 + (i % 3) * 0.5}s ease-out infinite`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
            
            {/* 기판 */}
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
              <div className="w-32 h-6 bg-gradient-to-r from-gray-300 to-gray-500 rounded-lg shadow-2xl relative">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-28 h-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-lg">
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-300 rounded-t" />
                  <div 
                    className="absolute top-1 left-0 h-1 bg-gradient-to-r from-green-300 via-green-400 to-green-500 transition-all duration-1000"
                    style={{ width: `${layerThickness[1]}%` }}
                  />
                </div>
              </div>
            </div>
            
            {/* RF 전력 표시 */}
            <div className="absolute top-6 right-6 bg-purple-600 text-white px-3 py-2 rounded-lg font-mono text-sm animate-pulse">
              ⚡ RF: {currentPower}W
            </div>
          </div>
          
          {/* 공정 정보 패널 */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-xl border border-purple-200 max-w-xs">
            <div className="text-lg font-bold text-purple-600 mb-2 flex items-center">
              ⚡ RF 스퍼터링
              <div className="ml-2 w-2 h-2 bg-purple-500 rounded-full animate-ping" />
            </div>
            <div className="space-y-1 text-sm">
              <div className="text-gray-700 font-medium">{step.chemistry}</div>
              <div className="text-gray-600">가스: {step.gas}</div>
              <div className="text-gray-600">두께: {step.thickness}</div>
              <div className="text-purple-600">{step.description}</div>
              <div className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1">
                진행률: {Math.round(layerThickness[1])}%
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (currentStep === 2) {
      return (
        <div className="absolute inset-0">
          {/* E-빔 증착 챔버 */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-80 h-64 bg-gradient-to-t from-black via-gray-800 to-gray-600 rounded-t-[3rem] shadow-2xl">
            <div className="absolute inset-3 bg-gradient-to-t from-black via-gray-900 to-gray-700 rounded-t-[3rem]" />
            
            {/* 전자빔 총 */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-8 h-16 bg-gradient-to-b from-gray-300 via-gray-500 to-gray-700 rounded-b-lg shadow-lg">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
              
              {/* 전자빔 */}
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-1 h-16 bg-gradient-to-b from-cyan-400 to-transparent animate-pulse" />
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-2 h-16 bg-gradient-to-b from-cyan-200 to-transparent opacity-50 animate-pulse" />
            </div>
            
            {/* Al 소스 */}
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-16 h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 rounded-lg shadow-lg">
              <div className="text-xs text-center text-gray-800 font-bold py-2">Al Source</div>
              
              {/* 증발 효과 */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-t from-orange-400 to-transparent rounded-full opacity-40 animate-pulse" />
            </div>
            
            {/* Al 입자들 */}
            {showParticles && [...Array(10)].map((_, i) => (
              <div
                key={`al-${i}`}
                className="absolute w-1 h-1 bg-gray-400 rounded-full"
                style={{
                  left: `${42 + (i % 3) * 4}%`,
                  top: `${30 + (i % 4) * 6}%`,
                  animation: `evaporate ${2 + (i % 3) * 0.5}s ease-out infinite`,
                  animationDelay: `${i * 0.3}s`
                }}
              />
            ))}
            
            {/* 기판 */}
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
              <div className="w-32 h-6 bg-gradient-to-r from-gray-300 to-gray-500 rounded-lg shadow-2xl relative">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-28 h-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-lg">
                  <div className="absolute top-0 left-0 w-full h-px bg-blue-300" />
                  <div className="absolute top-px left-0 w-full h-px bg-green-300" />
                  
                  {/* Al 전극 - 양쪽 끝에만, IZO와 살짝 겹침 */}
                  {layerThickness[2] > 0 && (
                    <>
                      {/* 왼쪽 전극 (Source) */}
                      <div 
                        className="absolute top-0.5 left-0 h-1 bg-gradient-to-r from-gray-300 to-gray-400 transition-all duration-1000"
                        style={{ width: `${Math.min(35, layerThickness[2] * 0.35)}%` }}
                      />
                      {/* 오른쪽 전극 (Drain) */}
                      <div 
                        className="absolute top-0.5 right-0 h-1 bg-gradient-to-l from-gray-300 to-gray-400 transition-all duration-1000"
                        style={{ width: `${Math.min(35, layerThickness[2] * 0.35)}%` }}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* 전자빔 정보 */}
            <div className="absolute top-6 right-6 text-cyan-300 font-mono text-sm bg-black/70 px-3 py-2 rounded-lg">
              🔬 E-Beam: {currentPower}W
            </div>
          </div>
          
          {/* 공정 정보 패널 */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-xl border border-orange-200 max-w-xs">
            <div className="text-lg font-bold text-orange-600 mb-2 flex items-center">
              🔬 E-Beam 증착
              <div className="ml-2 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
            </div>
            <div className="space-y-1 text-sm">
              <div className="text-gray-700 font-medium">{step.chemistry}</div>
              <div className="text-gray-600">환경: {step.gas}</div>
              <div className="text-gray-600">두께: {step.thickness}</div>
              <div className="text-orange-600">{step.description}</div>
              <div className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1">
                진행률: {Math.round(layerThickness[2])}%
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <ControlPanel />
        <SettingsPanel />

        <div className="p-6">
          <StepIndicator />

          {/* 메인 애니메이션 영역 */}
          <div className={`relative mx-auto w-full h-[400px] bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 rounded-2xl border-2 border-gray-300 overflow-hidden ${show3DEffect ? 'shadow-2xl' : 'shadow-lg'}`}>
            
            {/* 배경 그리드 */}
            <div className="absolute inset-0 opacity-5">
              <div className="w-full h-full" style={{
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />
            </div>

            {/* 전기장 표시 */}
            <ElectricalField />

            {/* 파라미터 패널 */}
            <ParameterPanel />

            {/* 분자 구조 표시 */}
            <MolecularStructure step={currentStep} />

            {/* 단면도 */}
            <CrossSectionView />

            {/* 현재 단계 애니메이션 */}
            <ProcessStep />
          </div>

          {/* 진행률 표시 */}
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">전체 공정 진행률</span>
                <span className="text-sm text-gray-500">
                  {Math.round((currentStep + (layerThickness[currentStep] || 0) / 100) / 3 * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 h-3 rounded-full transition-all duration-1000 shadow-lg"
                  style={{ width: `${(currentStep + (layerThickness[currentStep] || 0) / 100) / 3 * 100}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {steps.map((step, index) => (
                <div key={index} className="bg-white rounded-lg p-4 shadow border">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${
                      step.color === 'blue' ? 'text-blue-600' 
                      : step.color === 'purple' ? 'text-purple-600'
                      : 'text-orange-600'
                    }`}>
                      {step.name.split(' - ')[1]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(layerThickness[index])}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${
                        step.color === 'blue' ? 'bg-blue-500' 
                        : step.color === 'purple' ? 'bg-purple-500'
                        : 'bg-orange-500'
                      } h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${layerThickness[index]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 실시간 데이터 테이블 */}
          <div className="mt-6 bg-white rounded-xl shadow-lg border overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-3 border-b">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                실시간 공정 데이터
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{currentTemp}°C</div>
                  <div className="text-sm text-gray-600">온도</div>
                  <div className={`w-full h-1 rounded-full mt-2 ${
                    currentTemp > 500 ? 'bg-red-500' : 
                    currentTemp > 100 ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{currentPressure}</div>
                  <div className="text-sm text-gray-600">압력 (Torr)</div>
                  <div className={`w-full h-1 rounded-full mt-2 ${
                    currentPressure < 0.01 ? 'bg-purple-500' : 'bg-green-500'
                  }`} />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{currentPower}W</div>
                  <div className="text-sm text-gray-600">전력</div>
                  <div className={`w-full h-1 rounded-full mt-2 ${
                    currentPower > 0 ? 'bg-orange-500' : 'bg-gray-300'
                  }`} />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{completedCycles}</div>
                  <div className="text-sm text-gray-600">완료 사이클</div>
                  <div className="w-full h-1 bg-green-500 rounded-full mt-2" />
                </div>
              </div>
            </div>
          </div>
          
          {/* 현재 단계 상세 정보 */}
          <div className="mt-6 bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Info className="w-6 h-6 mr-2 text-blue-500" />
                현재 공정: {steps[currentStep].name}
              </h3>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={captureFrame}
                  className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  <Camera className="w-4 h-4" />
                  <span>캡처</span>
                </button>
                <button 
                  onClick={downloadReport}
                  className="flex items-center space-x-1 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>리포트</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">공정 유형:</span>
                  <span className="text-gray-600">{steps[currentStep].process}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">화학 반응:</span>
                  <span className="text-gray-600 font-mono text-sm">{steps[currentStep].chemistry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">사용 가스:</span>
                  <span className="text-gray-600">{steps[currentStep].gas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">목표 두께:</span>
                  <span className="text-gray-600">{steps[currentStep].thickness}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2">공정 설명</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {steps[currentStep].description}
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  애니메이션 프레임: {animationPhase + 1}/8 | 속도: {speed}x
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS 애니메이션 */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
          50% { transform: translateY(-10px) rotate(180deg); opacity: 1; }
        }
        
        @keyframes sputter {
          0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
          50% { transform: translate(5px, 15px) scale(1); opacity: 1; }
          100% { transform: translate(10px, 30px) scale(0.3); opacity: 0; }
        }
        
        @keyframes evaporate {
          0% { transform: translate(0, 0) scale(0.3); opacity: 0; }
          30% { transform: translate(2px, -8px) scale(0.8); opacity: 0.7; }
          70% { transform: translate(4px, -16px) scale(1.2); opacity: 0.5; }
          100% { transform: translate(6px, -24px) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default EnhancedTFTProcessAnimation;