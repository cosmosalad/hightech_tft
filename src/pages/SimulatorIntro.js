import React, { useState } from 'react';
import { 
  Play, 
  ArrowRight, 
  Home, 
  Zap, 
  Target, 
  Flame, 
  ChevronRight,
  Settings,
  Eye
} from 'lucide-react';

const SimulatorIntro = ({ onNavigateHome, onNavigateToSimulator }) => {
  const [activeFeature, setActiveFeature] = useState(null);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* 헤더 */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onNavigateHome}
                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                홈으로
              </button>
              <div className="flex items-center text-sm text-gray-600">
                <span>홈</span>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="font-semibold text-blue-600">공정 시뮬레이터</span>
              </div>
            </div>
            
            <button
              onClick={onNavigateToSimulator}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Play className="w-5 h-5 mr-2" />
              시뮬레이션 시작
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* 타이틀 섹션 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-xl">
            <Play className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            TFT Process Simulator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            TFT 제조 공정의 기본 흐름을 시각적으로 학습할 수 있는 <strong>교육용 시뮬레이터</strong>입니다. 
            열산화부터 전극 증착까지 주요 공정들을 애니메이션으로 체험해보세요.
          </p>
        </div>

        {/* 공정 플로우 */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            🔬 TFT 제조 공정 플로우
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {processSteps.map((step, index) => (
              <div key={step.id} className="relative">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                  <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center text-white mb-4 shadow-lg`}>
                    {step.icon}
                  </div>
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">{step.title}</h3>
                  </div>
                  <p className="text-blue-600 font-medium mb-3">{step.description}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.details}</p>
                </div>
                
                {/* 화살표 */}
                {index < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 주요 기능 */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            ⚡ 주요 기능
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer"
                onMouseEnter={() => setActiveFeature(index)}
                onMouseLeave={() => setActiveFeature(null)}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    
                    <div className={`transition-all duration-300 ${
                      activeFeature === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                    } overflow-hidden`}>
                      <ul className="space-y-2">
                        {feature.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700">{detail}</span>
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

        {/* 사용법 안내 */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            📋 사용법 안내
          </h2>
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">장비 선택</h3>
                <p className="text-gray-600">시뮬레이션할 공정 장비들을 순서대로 선택합니다.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">파라미터 설정</h3>
                <p className="text-gray-600">각 공정의 온도, 압력, 시간 등 기본 조건을 설정합니다.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">시뮬레이션</h3>
                <p className="text-gray-600">애니메이션으로 공정 과정을 관찰하고 학습합니다.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA 섹션 */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">지금 바로 시작해보세요!</h2>
          <p className="text-xl mb-8 opacity-90">
            TFT 제조 공정의 기본 원리를 시각적으로 학습해보세요.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onNavigateToSimulator}
              className="flex items-center px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-gray-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Play className="w-6 h-6 mr-3" />
              시뮬레이션 시작하기
              <ArrowRight className="w-6 h-6 ml-3" />
            </button>
            
            <div className="flex items-center space-x-2 text-white/80">
              <Eye className="w-5 h-5" />
              <span className="text-sm">시각적 학습 도구</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulatorIntro;