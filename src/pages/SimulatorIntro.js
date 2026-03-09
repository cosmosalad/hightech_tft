import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  ArrowRight, 
  Home, 
  Zap, 
  Target, 
  Flame, 
  ChevronRight,
  Settings,
  Eye,
  ShieldAlert,
  Terminal,
  Cpu,
  Fingerprint
} from 'lucide-react';

const SimulatorIntro = ({ onNavigateHome, onNavigateToSimulator }) => {
  const [activeFeature, setActiveFeature] = useState(null);
  const [bootSequence, setBootSequence] = useState(0);
  const [isEnteringCleanroom, setIsEnteringCleanroom] = useState(false);

  const handleEnterCleanroom = () => {
    setIsEnteringCleanroom(true);
    setTimeout(() => {
      onNavigateToSimulator();
    }, 2500); // 2.5초 후 실제 이동
  };

  useEffect(() => {
    // 팹 진입 부팅 시퀀스 시뮬레이션
    const timer = setInterval(() => {
      setBootSequence(prev => {
        if (prev >= 4) {
          clearInterval(timer);
          return 4;
        }
        return prev + 1;
      });
    }, 800);
    return () => clearInterval(timer);
  }, []);

  const processSteps = [
    {
      id: 'oxidation',
      icon: <Flame className="w-8 h-8" />,
      title: '열산화 (Thermal Oxidation)',
      description: 'SiO₂ 게이트 절연층 형성',
      details: 'Si 기판 위에 SiO₂ 절연층을 성장시켜 TFT의 게이트 절연막을 형성합니다.',
      color: 'from-red-400 to-orange-500'
    },
    {
      id: 'sputtering',
      icon: <Target className="w-8 h-8" />,
      title: 'RF 스퍼터링',
      description: 'IZO 반도체 채널층 증착',
      details: 'RF 플라즈마를 이용하여 IZO 등 투명 반도체 박막을 증착합니다.',
      color: 'from-purple-400 to-pink-500'
    },
    {
      id: 'evaporation',
      icon: <Zap className="w-8 h-8" />,
      title: 'E-beam 증착',
      description: 'Al 전극 형성',
      details: '전자빔을 이용하여 Source/Drain 전극용 금속 박막을 증착합니다.',
      color: 'from-blue-400 to-cyan-500'
    },
  ];

  const features = [
    {
      icon: <Eye className="w-6 h-6" />,
      title: '시각적 공정 애니메이션',
      description: '각 공정 단계별 장비 애니메이션과 박막 성장 과정을 시각화',
      details: [
        '열산화, 스퍼터링, 증착 장비의 애니메이션 효과',
        '파티클, 플라즈마, 에너지 웨이브 시각 효과',
        '실시간 단면도를 통한 박막 성장 과정 표시'
      ]
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: '공정 파라미터 설정',
      description: '온도, 압력, 전력, 시간 등 기본적인 공정 조건 조정',
      details: [
        '각 공정별 온도, 압력, 시간 설정',
        '재료 선택 (IZO, Al 등)',
        '애니메이션 속도 및 효과 조절'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 font-sans selection:bg-cyan-900 selection:text-cyan-100 overflow-hidden relative">
      {/* 배경 장식 (홀로그램 그리드 및 레이저) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.9),rgba(15,23,42,0.9)),url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50 shadow-[0_0_15px_rgba(6,182,212,0.8)]"></div>
        {/* 스캔 라인 이펙트 */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20"></div>
      </div>

      {/* 네비게이션 바 (다크 테마) */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-cyan-900/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onNavigateHome}
                className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition-colors border border-cyan-900/50"
              >
                <Home className="w-4 h-4 mr-2" />
                SYSTEM_HOME
              </button>
              <div className="flex items-center text-sm text-slate-500 font-mono">
                <span>ROOT</span>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="text-cyan-500 animate-pulse">FAB_SIMULATION</span>
              </div>
            </div>
            
            <button
              onClick={handleEnterCleanroom}
              className={`flex items-center px-6 py-3 rounded-xl font-bold font-mono transition-all duration-500 ${
                bootSequence >= 4 
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
              disabled={bootSequence < 4}
            >
              {bootSequence < 4 ? (
                <>
                  <Fingerprint className="w-5 h-5 mr-2 animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2 fill-slate-900" />
                  INITIALIZE_PROCESS
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        
        {/* 스토리텔링 인트로 헤더 */}
        <div className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <ShieldAlert className="w-8 h-8 text-yellow-500 animate-pulse" />
                <span className="text-yellow-500 font-mono text-sm tracking-widest border border-yellow-500/30 px-3 py-1 rounded bg-yellow-500/10">
                  SECURITY LEVEL: CLEARANCE REQUIRED
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight">
                WELCOME TO <br/>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">
                  VIRTUAL FAB
                </span>
              </h1>
              
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 font-mono text-sm text-cyan-100/80 mb-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                <p className="mb-3 flex items-center">
                  <Terminal className="w-4 h-4 mr-3 text-cyan-400" />
                  {bootSequence >= 1 ? "> System Boot Sequence Initiated..." : "..."}
                </p>
                <p className="mb-3 flex items-center opacity-90">
                  <Terminal className="w-4 h-4 mr-3 text-cyan-400" />
                  {bootSequence >= 2 ? "> Establishing connection to Cleanroom Sector 7..." : "..."}
                </p>
                <p className="mb-3 flex items-center opacity-80">
                  <Terminal className="w-4 h-4 mr-3 text-cyan-400" />
                  {bootSequence >= 3 ? "> Loading TFT Fabrication Protocols..." : "..."}
                </p>
                <p className={`flex items-center ${bootSequence >= 4 ? 'text-green-400 font-bold' : 'opacity-70'}`}>
                  <Terminal className="w-4 h-4 mr-3 text-cyan-400" />
                  {bootSequence >= 4 ? "> ACCESS GRANTED. Operator, you are cleared to proceed." : "..."}
                </p>
              </div>

              <p className="text-xl text-slate-400 leading-relaxed font-light">
                가상 디스플레이 제조 공정(Virtual FAB)에 오신 것을 환영합니다. 
                본 시뮬레이터는 실제 장비(Thermal Furnace, Sputter, E-beam Evaporator)를 제어하고 박막 트랜지스터(TFT)를 제작하는 과정을 사실적으로 체험할 수 있도록 설계된 <strong className="text-cyan-400">오퍼레이터 훈련 시스템</strong>입니다.
              </p>
            </div>
            
            {/* 3D 느낌의 사이버 콘솔 그래픽 장식 */}
            <div className="relative h-96 hidden lg:flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="relative w-64 h-64 border-4 border-cyan-500/30 rounded-full flex items-center justify-center animate-[spin_20s_linear_infinite]">
                 <div className="absolute w-72 h-72 border border-dashed border-purple-500/40 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                 <div className="absolute inset-2 border-2 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-[spin_3s_linear_infinite]"></div>
              </div>
              <Cpu className="absolute w-24 h-24 text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
            </div>
          </div>
        </div>
        {/* 공정 플로우 - 테크니컬 디자인 */}
        <div className="mb-24 relative">
          <div className="flex items-center mb-12">
            <div className="w-12 h-1 bg-cyan-500 mr-4"></div>
            <h2 className="text-3xl font-black text-white tracking-widest uppercase">
              TFT Fabrication Protocols
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {processSteps.map((step, index) => (
              <div key={step.id} className="relative group perspective-1000">
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-8 shadow-2xl transition-all duration-500 border border-slate-700 group-hover:border-cyan-500/50 group-hover:-translate-y-2 group-hover:shadow-[0_15px_30px_rgba(6,182,212,0.15)] relative overflow-hidden h-full">
                  {/* 숫자 워터마크 배경 */}
                  <div className="absolute -bottom-4 -right-4 text-9xl font-black text-slate-700/30 select-none pointer-events-none transition-transform duration-500 group-hover:scale-110">
                    0{index + 1}
                  </div>
                  
                  <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center text-white mb-6 shadow-lg rotate-3 group-hover:rotate-0 transition-transform duration-300`}>
                    {step.icon}
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white mb-2 font-mono uppercase tracking-wide flex items-center">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse"></span>
                      {step.title}
                    </h3>
                    <div className="h-px w-full bg-gradient-to-r from-slate-600 to-transparent my-4"></div>
                    <p className="text-cyan-400 font-bold mb-3 text-sm">{step.description}</p>
                    <p className="text-slate-400 text-sm leading-relaxed">{step.details}</p>
                  </div>
                </div>
                
                {/* 화살표 가이드 라인 (연결선) */}
                {index < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-[50%] -right-4 w-8 h-px bg-cyan-900 z-0">
                     <div className="absolute right-0 -top-1.5 w-3 h-3 border-t-2 border-r-2 border-cyan-700 rotate-45 animate-[pulse_2s_infinite]"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* 시스템 특장점 - 레이더 뷰 컨셉 */}
        <div className="mb-24 relative">
           <div className="flex items-center mb-12 justify-end">
            <h2 className="text-3xl font-black text-white tracking-widest uppercase text-right">
              System Specifications
            </h2>
            <div className="w-12 h-1 bg-purple-500 ml-4"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-slate-700/50 cursor-pointer overflow-hidden relative group"
                onMouseEnter={() => setActiveFeature(index)}
                onMouseLeave={() => setActiveFeature(null)}
              >
                {/* 스캔 라인 이펙트 마우스 호버시 활성화 */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-full w-full -translate-y-full group-hover:animate-[scan_2s_ease-in-out_infinite]"></div>
                
                <div className="flex items-start space-x-6 relative z-10">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-slate-900 font-bold bg-gradient-to-br ${index === 0 ? 'from-cyan-400 to-blue-500' : 'from-purple-400 to-pink-500'} flex-shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 font-mono">{feature.title}</h3>
                    <p className="text-slate-400 mb-4 text-sm">{feature.description}</p>
                    
                    <div className={`transition-all duration-500 ease-in-out ${
                      activeFeature === index ? 'max-h-48 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'
                    } overflow-hidden`}>
                      <ul className="space-y-3 mt-4 border-t border-slate-700/50 pt-4">
                        {feature.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start space-x-3">
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 shadow-[0_0_5px_currentColor] ${index === 0 ? 'bg-cyan-400 text-cyan-400' : 'bg-purple-400 text-purple-400'}`}></div>
                            <span className="text-sm text-slate-300">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 사용 가이드 - 터미널 스타일 */}
        <div className="mb-16 relative">
          <div className="bg-black/60 rounded-lg p-1 border border-cyan-900/50 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* 맥 OS 스타일 터미널 헤더 */}
            <div className="flex items-center px-4 py-3 bg-slate-900/80 border-b border-cyan-900/50">
               <div className="flex space-x-2">
                 <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                 <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                 <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
               </div>
               <div className="mx-auto text-xs text-slate-400 font-mono tracking-widest hidden sm:block">
                 vfab@hightech-politech: ~/protocols/manual
               </div>
            </div>
            
            <div className="p-8 font-mono">
              <div className="mb-6"><span className="text-green-400">root@vfab:~$</span> <span className="text-white">cat operator_manual.txt</span></div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                <div className="border-l-2 border-cyan-800 pl-4 py-2 hover:border-cyan-400 transition-colors">
                  <div className="text-cyan-500 font-bold mb-2">STEP 01: EQUIPMENT_SELECT</div>
                  <p className="text-slate-400">팹 내 장비(Furnace, Sputter, E-beam)를 공정 순서에 따라 올바르게 라우팅합니다.</p>
                </div>
                
                <div className="border-l-2 border-purple-800 pl-4 py-2 hover:border-purple-400 transition-colors">
                  <div className="text-purple-400 font-bold mb-2">STEP 02: RECIPE_CONFIG</div>
                  <p className="text-slate-400">챔버 내 진공도(Pressure), 인가 전력(Power), 반응 온도(Temp)를 설정합니다.</p>
                </div>
                
                <div className="border-l-2 border-green-800 pl-4 py-2 hover:border-green-400 transition-colors">
                  <div className="text-green-400 font-bold mb-2">STEP 03: EXECUTE_PROCESS</div>
                  <p className="text-slate-400">오퍼레이터 승인 하에 공정을 가동하고 단면도를 통해 박막 성장 상태를 모니터링합니다.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* 하단 진입 버튼 (보안 게이트 컨셉) */}
        <div className="relative rounded-2xl p-1 overflow-hidden mt-16 max-w-4xl mx-auto">
          {/* 사이버 테두리 애니메이션 */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-blue-500 animate-[spin_4s_linear_infinite] opacity-50"></div>
          <div className="absolute inset-1 bg-slate-900 rounded-xl z-0"></div>
          
          <div className="relative z-10 p-12 text-center text-white">
            <h2 className="text-3xl font-black mb-4 tracking-wider uppercase font-mono">
              Authorization Required
            </h2>
            <p className="text-slate-400 mb-10 font-mono text-sm max-w-2xl mx-auto">
              WARNING: YOU ARE ABOUT TO ENTER A CLASS 100 CLEANROOM FACILITY. 
              ENSURE ALL SUITS AND MASKS ARE SECURED.
            </p>
            
            <button
              onClick={handleEnterCleanroom}
              disabled={bootSequence < 4}
              className={`inline-flex items-center px-8 py-4 rounded-lg font-bold font-mono tracking-widest transition-all duration-300 relative overflow-hidden group ${
                bootSequence >= 4
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.5)] cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-wait border border-slate-700'
              }`}
            >
              {/* 스캔 이펙트 */}
              {bootSequence >= 4 && (
                <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 -translate-x-full group-hover:animate-[scan_1s_ease-in-out]"></div>
              )}
              {bootSequence < 4 ? (
                <>LOADING SYSTEM...</>
              ) : (
                <>
                  ENTER CLEANROOM <ArrowRight className="w-6 h-6 ml-3" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* 클린룸 진입 애니메이션 오버레이 */}
      <AnimatePresence>
        {isEnteringCleanroom && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden"
          >
            {/* 왼쪽 문 */}
            <motion.div 
              initial={{ x: 0 }}
              animate={{ x: '-100%' }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
              className="absolute left-0 top-0 bottom-0 w-1/2 bg-slate-800 border-r-4 border-cyan-500 shadow-[20px_0_50px_rgba(6,182,212,0.5)] z-10 flex items-center justify-end pr-8"
            >
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black/50 to-transparent"></div>
              <div className="w-2 h-32 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,211,238,0.8)] mr-4"></div>
              <div className="w-0.5 h-full bg-cyan-900/50 absolute right-10"></div>
            </motion.div>

            {/* 오른쪽 문 */}
            <motion.div 
              initial={{ x: 0 }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
              className="absolute right-0 top-0 bottom-0 w-1/2 bg-slate-800 border-l-4 border-cyan-500 shadow-[-20px_0_50px_rgba(6,182,212,0.5)] z-10 flex items-center justify-start pl-8"
            >
              <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black/50 to-transparent"></div>
              <div className="w-2 h-32 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,211,238,0.8)] ml-4"></div>
              <div className="w-0.5 h-full bg-cyan-900/50 absolute left-10"></div>
            </motion.div>

            {/* 문 틈새 빛 효과 */}
            <motion.div 
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: [0, 1, 0], scaleX: [0, 1, 5] }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="absolute z-20 w-2 h-full bg-cyan-300 shadow-[0_0_150px_50px_rgba(34,211,238,1)]"
            />

            {/* 내부 클린룸 홀로그램 텍스트 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="relative z-0 text-center flex flex-col items-center"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-20 animate-pulse"></div>
                <ShieldAlert className="w-32 h-32 text-cyan-400 relative z-10" strokeWidth={1.5} />
              </div>
              <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-widest font-mono mb-6 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">CLASS 100</h2>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-px bg-cyan-500"></div>
                <p className="text-2xl text-cyan-400 tracking-widest animate-[pulse_1s_ease-in-out_infinite] font-mono font-bold">CLEANROOM ENTERING...</p>
                <div className="w-12 h-px bg-cyan-500"></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 스타일 강제 주입 */}
      <style>{`
        @keyframes scan {
          0% { transform: translateX(-150%) skewX(-12deg); }
          100% { transform: translateX(250%) skewX(-12deg); }
        }
      `}</style>
    </div>
  );
};

export default SimulatorIntro;