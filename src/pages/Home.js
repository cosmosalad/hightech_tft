import React, { useState, useMemo } from 'react';
import { ArrowRight, Star, BarChart3, Zap, Settings, Users, Play } from 'lucide-react';
import TFTProcessAnimation from './TFTProcessAnimation';

const TFTAnalyzerHome = ({ onNavigate }) => {
  const [showProcessModal, setShowProcessModal] = useState(false);

  const navigateToAnalyzer = (version) => {
    if (version === 'basic') {
      onNavigate('basic');
    } else if (version === 'advanced') {
      onNavigate('advanced');
    }
  };

  const openProcessModal = () => {
    setShowProcessModal(true);
  };

  const closeProcessModal = () => {
    setShowProcessModal(false);
  };

  // 테이블 데이터를 useMemo로 최적화
  const comparisonData = useMemo(() => [
    { feature: "파일별 독립 분석", basic: "✅", advanced: "✅" },
    { feature: "샘플명 기반 데이터 융합", basic: "❌", advanced: "✅" },
    { feature: "정확한 μeff 계산", basic: "⚠️ 기본", advanced: "✅ 고급" },
    { feature: "실제 θ 값 계산", basic: "❌ 고정값", advanced: "✅ 실측값" },
    { feature: "품질 평가 시스템", basic: "❌", advanced: "✅" },
    { feature: "경고 및 검증", basic: "❌", advanced: "✅" },
    { feature: "분석 속도", basic: "🚀 빠름", advanced: "⚡ 보통" },
    { feature: "정확도", basic: "📊 기본", advanced: "🎯 연구급" }
  ], []);

  // 기본 분석 파라미터
  const basicParams = useMemo(() => ['gm', 'Vth', 'μFE', 'SS', 'Ion/Ioff', 'Ron'], []);
  
  // 고급 분석 파라미터
  const advancedParams = useMemo(() => ['μFE (통합)', 'μeff (정확)', 'θ (실측)', 'Dit (계산)', '품질등급', '경고시스템'], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* 배경 장식 - will-change 제거하고 transform3d 추가로 GPU 가속 최적화 */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          style={{ transform: 'translate3d(0,0,0)' }}
        ></div>
        <div 
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          style={{ transform: 'translate3d(0,0,0)' }}
        ></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-8">
        {/* 헤더 섹션 */}
        <header className="text-center mb-16">
          <div className="mb-8">
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight mb-4">
              TFT Electrical
            </h1>
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
              Characterization Analyzer
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-8 font-light leading-relaxed max-w-4xl mx-auto">
            Probe Station 측정 데이터를 분석하여 TFT 파라미터를 자동으로 계산합니다
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 mb-8">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800 rounded-full text-lg font-medium shadow-lg border border-white/50">
              <Zap className="w-5 h-5 mr-2 text-yellow-500" />
              두 가지 분석 모드를 제공합니다
            </div>
            
            <button
              onClick={openProcessModal}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:from-green-600 hover:to-blue-600 transform hover:scale-105"
            >
              <Play className="w-5 h-5 mr-2" />
              공정 과정
            </button>
          </div>
        </header>

        {/* 버전 선택 카드 */}
        <section className="grid md:grid-cols-2 gap-8 mb-12">
          {/* 기본 분석 버전 */}
          <article className="group relative transform hover:scale-105 transition-transform duration-300">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border-2 border-gray-100 hover:border-blue-200 hover:shadow-2xl relative overflow-hidden transition-all duration-300">
              {/* 호버 효과를 CSS로 최적화 */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">기본 분석 모드</h2>
                    <p className="text-sm text-gray-500">개별 파일 분석</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">✨ 특징</h3>
                  <ul className="space-y-3 text-gray-600 text-sm">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      각 파일을 독립적으로 분석
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      빠르고 간단한 분석
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      기본적인 TFT 파라미터 계산
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      학습용 및 빠른 확인에 적합
                    </li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">📊 분석 항목</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {basicParams.map((param) => (
                      <span 
                        key={param}
                        className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-center"
                      >
                        {param}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => navigateToAnalyzer('basic')}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-800 transition-all duration-300 flex items-center justify-center group shadow-lg hover:shadow-xl"
                >
                  기본 분석 시작
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </article>

          {/* 통합 분석 버전 */}
          <article className="group relative transform hover:scale-105 transition-transform duration-300">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border-2 border-purple-200 hover:border-purple-300 relative overflow-hidden transition-all duration-300">
              {/* 추천 배지 */}
              <div className="absolute top-4 right-4 z-20">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center shadow-lg">
                  <Star className="w-3 h-3 mr-1" />
                  추천
                </div>
              </div>

              {/* 호버 효과 */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors">통합 분석 모드</h2>
                    <p className="text-sm text-purple-600 font-medium">샘플 기반 데이터 융합</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">🎯 고급 특징</h3>
                  <ul className="space-y-3 text-gray-600 text-sm">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <strong>샘플명별 데이터 그룹화</strong> - 같은 샘플의 다양한 측정 통합
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <strong>정확한 μeff 계산</strong> - Linear gm + Saturation Vth 조합
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <strong>실제 θ 값 계산</strong> - 측정 데이터 기반
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <strong>품질 평가 시스템</strong> - 데이터 신뢰도 자동 평가
                    </li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">🔬 연구급 파라미터</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {advancedParams.map((param) => (
                      <span 
                        key={param}
                        className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 px-2 py-1 rounded text-center"
                      >
                        {param}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => navigateToAnalyzer('advanced')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-300 flex items-center justify-center group shadow-xl hover:shadow-2xl"
                >
                  <Star className="w-5 h-5 mr-2" />
                  통합 분석 시작
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </article>
        </section>

        {/* 비교 표 */}
        <section className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-12 border border-white/20">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            버전별 기능 비교
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">기능</th>
                  <th className="text-center py-4 px-4 font-semibold text-blue-700">기본 분석</th>
                  <th className="text-center py-4 px-4 font-semibold text-purple-700">통합 분석</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparisonData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-4 px-4 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center">{row.basic}</td>
                    <td className="py-4 px-4 text-center">{row.advanced}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 사용 가이드 */}
        <section className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-6 border border-blue-100/50">
            <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              기본 분석 모드 추천 대상
            </h3>
            <ul className="space-y-3 text-blue-700 text-sm">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                TFT 특성 분석을 처음 접하는 사용자
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                빠른 결과 확인이 필요한 경우
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                교육 및 학습 목적
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                간단한 품질 체크
              </li>
            </ul>
          </div>

          <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl p-6 border border-purple-100/50">
            <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              통합 분석 모드 추천 대상
            </h3>
            <ul className="space-y-3 text-purple-700 text-sm">
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                연구 및 개발 프로젝트
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                정확한 mobility 특성 분석 필요
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                논문 작성 및 발표용 데이터
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                상세한 품질 평가 및 검증
              </li>
            </ul>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="text-center mt-16 pt-8 border-t border-gray-200/50">
          <p className="text-gray-500 text-sm">
            © 2025 <a href="https://www.kopo.ac.kr/seongnam/content.do?menu=11163" className="text-blue-600 hover:underline transition-colors">폴리텍 성남캠퍼스 하이테크 반도체공정 </a>. All rights reserved.
          </p>
        </footer>
      </div>

      {/* TFT 공정 모달 */}
      {showProcessModal && (
        <TFTProcessAnimation onClose={closeProcessModal} />
      )}
    </div>
  );
};

export default TFTAnalyzerHome;