import React, { useState } from 'react';
import { 
  Play, 
  ArrowRight, 
  Home, 
  Zap, 
  Target, 
  Flame, 
  Layers, 
  Microscope,
  ChevronRight,
  Settings,
  BarChart3,
  Eye,
  Thermometer,
  Gauge,
  Clock,
  Cpu,
  Atom,
  Beaker
} from 'lucide-react';

const SimulatorIntro = ({ onNavigateHome, onNavigateToSimulator }) => {
  const [activeFeature, setActiveFeature] = useState(null);

  const processSteps = [
    {
      id: 'oxidation',
      icon: <Flame className="w-8 h-8" />,
      title: '열산화 (Thermal Oxidation)',
      description: 'SiO₂ 게이트 절연층 형성',
      details: 'Si 기판 위에 고품질 SiO₂ 절연층을 성장시켜 TFT의 게이트 절연막을 형성합니다.',
      color: 'from-red-400 to-orange-500'
    },
    {
      id: 'sputtering',
      icon: <Target className="w-8 h-8" />,
      title: 'RF 스퍼터링',
      description: 'IZO 반도체 채널층 증착',
      details: 'RF 플라즈마를 이용하여 IZO, ITO 등 투명 반도체 박막을 균일하게 증착합니다.',
      color: 'from-purple-400 to-pink-500'
    },
    {
      id: 'evaporation',
      icon: <Zap className="w-8 h-8" />,
      title: 'E-beam 증착',
      description: 'Al 전극 형성',
      details: '전자빔을 이용하여 Source/Drain 전극용 금속 박막을 고순도로 증착합니다.',
      color: 'from-blue-400 to-cyan-500'
    },
  ];

  const features = [
    {
      icon: <Eye className="w-6 h-6" />,
      title: '실시간 공정 시각화',
      description: '각 공정 단계별 챔버 내부와 박막 성장을 실시간으로 관찰',
      details: [
        '3D 장비 모델링으로 실제 fab 환경 재현',
        '플라즈마, 가스 플로우, 입자 움직임 애니메이션',
        '실시간 단면도를 통한 박막 성장 과정 모니터링'
      ]
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: '정밀한 공정 제어',
      description: '온도, 압력, 전력 등 실제 공정 파라미터 세밀 조정',
      details: [
        '실제 fab에서 사용하는 레시피 파라미터',
        '공정 조건 변화에 따른 결과 실시간 반영',
        'PID 제어 시뮬레이션으로 안정성 확인'
      ]
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: '물리 기반 모델링',
      description: '실제 물리 방정식을 기반으로 한 정확한 공정 시뮬레이션',
      details: [
        'Arrhenius 방정식 기반 온도 의존성',
        '증착율, 식각율의 정밀한 계산',
        '재료별 물성 데이터베이스 활용'
      ]
    },
    {
      icon: <Microscope className="w-6 h-6" />,
      title: '전기적 특성 분석',
      description: '완성된 TFT의 IDVG, IDVD 특성 예측 및 분석',
      details: [
        'Threshold voltage, mobility 실시간 계산',
        'Subthreshold swing, On/Off ratio 분석',
        '실험 데이터와 시뮬레이션 결과 비교'
      ]
    }
  ];

  const advantages = [
    {
      icon: <Clock className="w-5 h-5" />,
      title: '시간 절약',
      description: '실제 공정 대비 1000배 빠른 시뮬레이션으로 빠른 프로토타이핑'
    },
    {
      icon: <Cpu className="w-5 h-5" />,
      title: '비용 절감',
      description: '가상 실험으로 웨이퍼 및 시약 비용 없이 다양한 조건 테스트'
    },
    {
      icon: <Atom className="w-5 h-5" />,
      title: '안전성',
      description: '위험한 화학물질이나 고온 환경 없이 안전한 학습'
    },
    {
      icon: <Beaker className="w-5 h-5" />,
      title: '반복 학습',
      description: '무제한 반복 실험으로 공정 이해도 향상'
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
            <Microscope className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            TFT Process Simulator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            실제 반도체 fab 환경을 가상으로 재현한 <strong>TFT 공정 시뮬레이터</strong>입니다. 
            열산화부터 전극 증착까지 전체 공정을 체험하며 반도체 제조의 핵심을 학습하세요.
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
            ⚡ 핵심 기능
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

        {/* 장점 */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            🎯 시뮬레이터의 장점
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {advantages.map((advantage, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                  {advantage.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{advantage.title}</h3>
                <p className="text-gray-600 text-sm">{advantage.description}</p>
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
                <p className="text-gray-600">시뮬레이션할 공정 장비들을 선택하고 순서를 정합니다.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">레시피 설정</h3>
                <p className="text-gray-600">각 공정의 온도, 압력, 시간 등 세부 파라미터를 조정합니다.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">시뮬레이션</h3>
                <p className="text-gray-600">실시간 애니메이션으로 공정을 관찰하고 결과를 분석합니다.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA 섹션 */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">지금 바로 시작해보세요!</h2>
          <p className="text-xl mb-8 opacity-90">
            실제 fab 환경을 가상으로 체험하며 TFT 제조 공정의 전문가가 되어보세요.
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
              <Thermometer className="w-5 h-5" />
              <span className="text-sm">실시간 공정 모니터링</span>
            </div>
            
            <div className="flex items-center space-x-2 text-white/80">
              <Gauge className="w-5 h-5" />
              <span className="text-sm">정밀한 파라미터 제어</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulatorIntro;