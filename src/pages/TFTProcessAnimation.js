import React, { useState, useEffect } from 'react';
import { X, Play } from 'lucide-react';

const TFTProcessAnimation = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { name: "퍼니스 - SiO₂ 형성", color: "blue", duration: 4000 },
    { name: "RF 스퍼터링 - IZO 증착", color: "purple", duration: 4000 },
    { name: "E-빔 증착 - Al 전극", color: "orange", duration: 4000 }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, steps[currentStep]?.duration || 4000);
    
    return () => clearInterval(timer);
  }, [currentStep]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center">
            <Play className="w-8 h-8 mr-3 text-green-500" />
            TFT Process
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* 모달 컨텐츠 */}
        <div className="p-6">
          {/* 공정 단계 표시 */}
          <div className="flex justify-center mb-8 space-x-2 md:space-x-4">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`px-2 md:px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-500 ${
                  index === currentStep 
                    ? `bg-${step.color}-500 text-white shadow-lg scale-110` 
                    : index < currentStep 
                      ? `bg-${step.color}-200 text-${step.color}-800`
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                {index + 1}. {step.name}
              </div>
            ))}
          </div>

          {/* 메인 애니메이션 영역 */}
          <div className="relative mx-auto w-full h-96 bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl border-4 border-gray-300 overflow-hidden">
            
            {/* Step 0: 퍼니스 - SiO₂ 형성 */}
            {currentStep === 0 && (
              <div className="absolute inset-0">
                {/* 퍼니스 챔버 */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-80 h-64 bg-gradient-to-t from-red-600 to-orange-500 rounded-t-3xl shadow-2xl">
                  {/* 퍼니스 내부 글로우 */}
                  <div className="absolute inset-4 bg-gradient-to-t from-yellow-400 to-red-400 rounded-t-3xl animate-pulse opacity-80"></div>
                  
                  {/* 온도 표시 */}
                  <div className="absolute top-4 left-4 bg-black/70 text-yellow-300 px-3 py-2 rounded font-mono text-sm">
                    🌡️ 900°C
                  </div>
                  
                  {/* 웨이퍼 홀더 */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="w-32 h-4 bg-gray-300 rounded-lg shadow-lg">
                      {/* 기판 */}
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded shadow-md">
                        {/* SiO₂ 층 성장 */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-300 to-blue-400 rounded-t animate-sio2-growth"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 산소 가스 흐름 */}
                  <div className="absolute top-8 left-8 animate-gas-flow-1">
                    <div className="w-2 h-2 bg-blue-300 rounded-full opacity-70"></div>
                  </div>
                  <div className="absolute top-12 right-8 animate-gas-flow-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
                  </div>
                </div>
                
                {/* 공정 설명 */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
                  <div className="text-lg font-bold text-blue-600 mb-1">🔥 열산화 공정</div>
                  <div className="text-sm text-gray-700">Si + O₂ → SiO₂ (Gate Insulator)</div>
                  <div className="text-xs text-gray-500 mt-1">Temperature: 900°C | Thickness: 20, 60, 100nm</div>
                </div>
              </div>
            )}

            {/* Step 1: RF 스퍼터링 - IZO 증착 */}
            {currentStep === 1 && (
              <div className="absolute inset-0">
                {/* 스퍼터링 챔버 */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-80 h-64 bg-gradient-to-t from-gray-700 to-gray-500 rounded-t-3xl shadow-2xl">
                  {/* 진공 챔버 내부 */}
                  <div className="absolute inset-4 bg-gradient-to-t from-purple-900 to-purple-700 rounded-t-3xl"></div>
                  
                  {/* RF 전원 표시 */}
                  <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-2 rounded font-mono text-sm animate-pulse">
                    ⚡ RF Sputtering
                  </div>
                  
                  {/* IZO 타겟 */}
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-gradient-to-r from-green-400 to-green-600 rounded shadow-lg">
                    <div className="text-xs text-center text-white font-bold">IZO Target</div>
                  </div>
                  
                  {/* 플라즈마 효과 */}
                  <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-16 h-8 bg-purple-400 rounded-full opacity-60 animate-plasma-glow"></div>
                  
                  {/* 스퍼터된 원자들 */}
                  <div className="absolute top-16 left-1/3 animate-sputter-particle-1">
                    <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="absolute top-18 left-2/3 animate-sputter-particle-2">
                    <div className="w-1 h-1 bg-green-300 rounded-full"></div>
                  </div>
                  
                  {/* 기판 */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="w-32 h-4 bg-gray-300 rounded-lg shadow-lg">
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded shadow-md">
                        {/* SiO₂ 층 */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-300 rounded-t"></div>
                        {/* IZO 층 증착 */}
                        <div className="absolute top-1 left-0 w-full h-1 bg-gradient-to-r from-green-300 to-green-400 rounded animate-izo-deposition"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 공정 설명 */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
                  <div className="text-lg font-bold text-purple-600 mb-1">⚡ RF 스퍼터링</div>
                  <div className="text-sm text-gray-700">IZO → Active Channel Layer</div>
                  <div className="text-xs text-gray-500 mt-1">RF Power: 100W | Thickness: 30nm</div>
                </div>
              </div>
            )}

            {/* Step 2: E-빔 증착 - Al 전극 */}
            {currentStep === 2 && (
              <div className="absolute inset-0">
                {/* E-빔 챔버 */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-80 h-64 bg-gradient-to-t from-gray-800 to-gray-600 rounded-t-3xl shadow-2xl">
                  {/* 초고진공 챔버 */}
                  <div className="absolute inset-4 bg-gradient-to-t from-black to-gray-800 rounded-t-3xl"></div>
                  
                  {/* E-빔 총 */}
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-8 h-12 bg-gradient-to-b from-gray-400 to-gray-600 rounded-b-lg">
                    {/* 전자빔 */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-16 bg-gradient-to-b from-cyan-400 to-transparent animate-electron-beam"></div>
                  </div>
                  
                  {/* Al 소스 */}
                  <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-12 h-6 bg-gradient-to-r from-gray-300 to-gray-400 rounded shadow-lg">
                    <div className="text-xs text-center text-gray-800 font-bold mt-1">Al Source</div>
                    {/* 증발 효과 */}
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-orange-400 rounded-full opacity-40 animate-evaporation"></div>
                  </div>
                  
                  {/* Al 원자들 */}
                  <div className="absolute bottom-24 left-1/3 animate-al-atom-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  </div>
                  <div className="absolute bottom-26 left-2/3 animate-al-atom-2">
                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  </div>
                  
                  {/* 기판 */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="w-32 h-4 bg-gray-300 rounded-lg shadow-lg">
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded shadow-md">
                        {/* SiO₂ 층 */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-300 rounded-t"></div>
                        {/* IZO 층 */}
                        <div className="absolute top-1 left-0 w-full h-1 bg-green-300 rounded"></div>
                        {/* Al 전극 증착 */}
                        <div className="absolute top-2 left-0 w-full h-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded animate-al-deposition"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 진공도 표시 */}
                  <div className="absolute top-4 left-4 bg-black/70 text-green-300 px-3 py-2 rounded font-mono text-sm">
                    💨 10⁻⁸ Torr
                  </div>
                </div>
                
                {/* 공정 설명 */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
                  <div className="text-lg font-bold text-orange-600 mb-1">🔬 E-Beam 증착</div>
                  <div className="text-sm text-gray-700">Al → Source/Drain Electrodes</div>
                  <div className="text-xs text-gray-500 mt-1">Thickness: 100nm</div>
                </div>
              </div>
            )}
          </div>

          {/* 진행률 바 */}
          <div className="mt-8 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
          
          <div className="text-center mt-4 text-sm text-gray-600">
            Progress: {currentStep + 1} / {steps.length} - {steps[currentStep]?.name}
          </div>
        </div>
      </div>

      {/* CSS 애니메이션 정의 */}
      <style jsx>{`
        @keyframes sio2-growth {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        @keyframes gas-flow-1 {
          0%, 100% { transform: translate(0, 0); opacity: 0.7; }
          50% { transform: translate(12px, -8px); opacity: 1; }
        }
        
        @keyframes gas-flow-2 {
          0%, 100% { transform: translate(0, 0); opacity: 0.6; }
          50% { transform: translate(-8px, -12px); opacity: 1; }
        }
        
        @keyframes plasma-glow {
          0%, 100% { opacity: 0.4; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.8; transform: translateX(-50%) scale(1.2); }
        }
        
        @keyframes sputter-particle-1 {
          0% { transform: translate(0, 0); opacity: 1; }
          100% { transform: translate(8px, 24px); opacity: 0; }
        }
        
        @keyframes sputter-particle-2 {
          0% { transform: translate(0, 0); opacity: 1; }
          100% { transform: translate(-6px, 20px); opacity: 0; }
        }
        
        @keyframes izo-deposition {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        @keyframes electron-beam {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        @keyframes evaporation {
          0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
          50% { transform: translateX(-50%) scale(1); opacity: 0.6; }
          100% { transform: translateX(-50%) scale(1.5); opacity: 0; }
        }
        
        @keyframes al-atom-1 {
          0% { transform: translate(0, 0); opacity: 1; }
          100% { transform: translate(12px, -32px); opacity: 0; }
        }
        
        @keyframes al-atom-2 {
          0% { transform: translate(0, 0); opacity: 1; }
          100% { transform: translate(-8px, -28px); opacity: 0; }
        }
        
        @keyframes al-deposition {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        @keyframes current-flow {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(120px); }
        }
        
        .animate-sio2-growth {
          animation: sio2-growth 3s ease-out infinite;
        }
        
        .animate-gas-flow-1 {
          animation: gas-flow-1 2s ease-in-out infinite;
        }
        
        .animate-gas-flow-2 {
          animation: gas-flow-2 2.2s ease-in-out infinite;
          animation-delay: 0.3s;
        }
        
        .animate-plasma-glow {
          animation: plasma-glow 1s ease-in-out infinite;
        }
        
        .animate-sputter-particle-1 {
          animation: sputter-particle-1 1.5s linear infinite;
        }
        
        .animate-sputter-particle-2 {
          animation: sputter-particle-2 1.7s linear infinite;
          animation-delay: 0.3s;
        }
        
        .animate-izo-deposition {
          animation: izo-deposition 3s ease-out infinite;
        }
        
        .animate-electron-beam {
          animation: electron-beam 0.5s ease-in-out infinite;
        }
        
        .animate-evaporation {
          animation: evaporation 2s ease-out infinite;
        }
        
        .animate-al-atom-1 {
          animation: al-atom-1 2s linear infinite;
        }
        
        .animate-al-atom-2 {
          animation: al-atom-2 2.2s linear infinite;
          animation-delay: 0.4s;
        }
        
        .animate-al-deposition {
          animation: al-deposition 3s ease-out infinite;
        }
        
        .animate-current-flow {
          animation: current-flow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default TFTProcessAnimation;