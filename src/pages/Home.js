import React, { useState, useMemo } from 'react';
import { ArrowRight, Star, BarChart3, Zap, Settings, Users, Calculator, Search, X, ExternalLink, Eye } from 'lucide-react';
// ✨ framer-motion 라이브러리 import
import { motion, AnimatePresence } from 'framer-motion';
import FormulaCodeInspector from './components/FormulaCodeInspector';
import MaskPictureViewer from './components/MaskPictureViewer';

const TFTAnalyzerHome = ({ onNavigate }) => {
  const [showFormulaInspector, setShowFormulaInspector] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [showMaskViewer, setShowMaskViewer] = useState(false);

  const navigateToAnalyzer = (version) => {
    if (version === 'basic') {
      onNavigate('basic');
    } else if (version === 'advanced') {
      onNavigate('advanced');
    }
  };

  const openSearchModal = () => {
    setIsSearchModalOpen(true);
  };

  const closeSearchModal = () => {
    setIsSearchModalOpen(false);
  };

  const handlePerplexityClick = () => {
    window.open('https://www.perplexity.ai/collections/tft-electrical-characterizatio-o0IzZp54QHm0KZql5Vbvfw', '_blank');
    closeSearchModal();
  };

  const comparisonData = useMemo(() => [
    { feature: "파일별 독립 분석", basic: "✅", advanced: "✅" },
    { feature: "샘플명 기반 데이터 융합", basic: "❌", advanced: "✅" },
    { feature: "μeff 계산", basic: "⚠️ 기본", advanced: "✅ 고급" },
    { feature: "실제 θ 값 계산", basic: "❌ 고정값", advanced: "✅ 실측값" },
    { feature: "품질 평가 시스템", basic: "❌", advanced: "✅" },
    { feature: "경고 및 검증", basic: "❌", advanced: "✅" },
    { feature: "분석 속도", basic: "🚀 빠름", advanced: "⚡ 보통" },
    { feature: "정확도", basic: "📊 기본", advanced: "🎯 연구급" }
  ], []);

  const basicParams = useMemo(() => ['gm', 'Vth', 'μFE', 'SS', 'Ion/Ioff', 'Ron'], []);
  const advancedParams = useMemo(() => ['μFE (통합)', 'μeff (정확)', 'θ (실측)', 'Dit (계산)', '품질등급', '경고시스템'], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* 배경 장식 */}
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
            <h1 className="title-font text-6xl md:text-7xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight mb-4 py-1">
              TFT Electrical
            </h1>
            <h1 className="title-font text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight py-1">
              Characterization Analyzer
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-8 font-light leading-relaxed max-w-4xl mx-auto">
            Probe Station 측정 데이터를 분석하여 TFT 파라미터를 자동으로 계산합니다
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 mb-8">
            <button
              onClick={() => onNavigate('simulator-intro')}
              className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 text-white px-6 py-4 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative z-10 flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mr-3 group-hover:bg-white/30 transition-colors">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold mb-1">공정 시뮬레이터</h3>
                  <p className="text-purple-100 text-sm">TFT 제조 공정을 시각화로 학습</p>
                </div>
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
            
            <button
              onClick={() => setShowMaskViewer(true)}
              className="group relative overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-600 text-white px-6 py-4 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative z-10 flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mr-3 group-hover:bg-white/30 transition-colors">
                  <Eye className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold mb-1">Mask/Image Viewer</h3>
                  <p className="text-cyan-100 text-sm">마스크 및 이미지 뷰어</p>
                </div>
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800 rounded-full text-lg font-medium shadow-lg border border-white/50">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            두 가지 분석 모드를 제공합니다
          </div>
        </header>

        {/* 버전 선택 카드 */}
        <section className="grid md:grid-cols-2 gap-8 mb-12">
          {/* 기본 분석 버전 */}
          <article className="group relative transform hover:scale-105 transition-transform duration-300">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border-2 border-gray-100 hover:border-blue-200 hover:shadow-2xl relative overflow-hidden transition-all duration-300">
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
                    <li className="flex items-start"><span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>각 파일을 독립적으로 분석</li>
                    <li className="flex items-start"><span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>빠르고 간단한 분석</li>
                    <li className="flex items-start"><span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>기본적인 TFT 파라미터 계산</li>
                    <li className="flex items-start"><span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>학습용 및 빠른 확인에 적합</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">📊 분석 항목</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {basicParams.map((param) => (
                      <span key={param} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-center">{param}</span>
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
              <div className="absolute top-4 right-4 z-20">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center shadow-lg">
                  <Star className="w-3 h-3 mr-1" />
                  추천
                </div>
              </div>

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
                    <li className="flex items-start"><span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span><strong>샘플명별 데이터 그룹화</strong> - 같은 샘플의 다양한 측정 통합</li>
                    <li className="flex items-start"><span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span><strong>정확한 μFE 계산</strong> - 각 측정의 최적 파라미터 융합</li>
                    <li className="flex items-start"><span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span><strong>실제 θ 값 계산</strong> - 측정 데이터 기반</li>
                    <li className="flex items-start"><span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span><strong>품질 평가 시스템</strong> - 데이터 신뢰도 자동 평가</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">🔬 연구급 파라미터</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {advancedParams.map((param) => (
                      <span key={param} className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 px-2 py-1 rounded text-center">{param}</span>
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
            <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center"><Users className="w-5 h-5 mr-2" />기본 분석 모드 추천 대상</h3>
            <ul className="space-y-3 text-blue-700 text-sm">
              <li className="flex items-start"><span className="text-blue-500 mr-2">•</span>TFT 특성 분석을 처음 접하는 사용자</li>
              <li className="flex items-start"><span className="text-blue-500 mr-2">•</span>빠른 결과 확인이 필요한 경우</li>
              <li className="flex items-start"><span className="text-blue-500 mr-2">•</span>교육 및 학습 목적</li>
              <li className="flex items-start"><span className="text-blue-500 mr-2">•</span>간단한 품질 체크</li>
            </ul>
          </div>

          <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl p-6 border border-purple-100/50">
            <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center"><Settings className="w-5 h-5 mr-2" />통합 분석 모드 추천 대상</h3>
            <ul className="space-y-3 text-purple-700 text-sm mb-4">
              <li className="flex items-start"><span className="text-purple-500 mr-2">•</span>연구 및 개발 프로젝트</li>
              <li className="flex items-start"><span className="text-purple-500 mr-2">•</span>정확한 mobility 특성 분석 필요</li>
              <li className="flex items-start"><span className="text-purple-500 mr-2">•</span>논문 작성 및 발표용 데이터</li>
              <li className="flex items-start"><span className="text-purple-500 mr-2">•</span>상세한 품질 평가 및 검증</li>
            </ul>

            <div className="pt-3 border-t border-purple-200">
              <button
                onClick={() => setShowFormulaInspector(!showFormulaInspector)}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center text-sm"
              >
                <Calculator className="w-4 h-4 mr-2" />
                {showFormulaInspector ? '수식 점검 숨기기' : '사용된 수식 및 코드 점검'}
              </button>
            </div>
          </div>
        </section>

        {/* ✨ 수식 및 코드 점검 컴포넌트 - AnimatePresence로 감싸고 motion.div로 변경 */}
        <AnimatePresence>
          {showFormulaInspector && (
            <motion.div
              className="mb-12"
              initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <FormulaCodeInspector />
            </motion.div>
          )}
        </AnimatePresence>       

        {/* 검색창 섹션 */}
        <section className="mb-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">TFT 전기적 특성 분석 가이드</h3>
                <p className="text-sm text-gray-600">상세한 이론과 분석 방법을 찾아보세요</p>
              </div>
              
              <button
                onClick={openSearchModal}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center group shadow-lg hover:shadow-xl"
              >
                <Search className="w-5 h-5 mr-3" />
                분석 가이드 및 이론 검색
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="text-center pt-8 border-t border-gray-200/50">
          <p className="text-gray-500 text-sm">
            © 2025 <a href="https://www.kopo.ac.kr/seongnam/content.do?menu=11163" className="text-blue-600 hover:underline transition-colors">폴리텍 성남캠퍼스 하이테크 반도체공정 </a>. All rights reserved.
          </p>
        </footer>
      </div>

      {/* 검색 모달 (기존과 동일) */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Search className="w-6 h-6 mr-3" />
                  <h2 className="text-xl font-bold">TFT 전기적 특성 분석 가이드</h2>
                </div>
                <button
                  onClick={closeSearchModal}
                  className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/20 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
              {/* 모달 컨텐츠 (기존과 동일) */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📚 TFT 전기적 특성 분석 완벽 가이드</h3>
                <p className="text-gray-600 text-sm mb-4">
                  TFT의 전기적 특성 분석에 대한 상세한 이론, 측정 방법, 그리고 데이터 해석 방법을 제공합니다.
                </p>
              </div>

              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center mr-3 text-sm font-bold">1</div>
                  주요 측정 방법
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h5 className="font-semibold text-blue-800 mb-2">IDVG-Linear 측정</h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• 게이트 전압: -10V ~ 20V (0.1V 스텝)</li>
                      <li>• 드레인 전압: 0.1V (낮은 전압)</li>
                      <li>• 측정 파라미터: gm, Vth, μFE, SS</li>
                      <li>• 선형 영역에서의 기본 특성 분석</li>
                    </ul>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <h5 className="font-semibold text-purple-800 mb-2">IDVG-Saturation 측정</h5>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• 게이트 전압: -10V ~ 20V (0.1V 스텝)</li>
                      <li>• 드레인 전압: 20V (높은 전압)</li>
                      <li>• 측정 파라미터: Vth(sat), gm,sat</li>
                      <li>• 포화 영역에서의 특성 분석</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <h5 className="font-semibold text-green-800 mb-2">IDVD 측정</h5>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• 드레인 전압: 0V ~ 30V (1V 스텝)</li>
                      <li>• 게이트 전압: 다양한 고정값</li>
                      <li>• 측정 파라미터: Ron, 출력 특성</li>
                      <li>• 전류-전압 특성 곡선 분석</li>
                    </ul>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                    <h5 className="font-semibold text-orange-800 mb-2">IDVG-Hysteresis 측정</h5>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• 순방향: -10V → 20V</li>
                      <li>• 역방향: 20V → -10V</li>
                      <li>• 측정 파라미터: 히스테리시스</li>
                      <li>• 소자 안정성 평가</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-lg flex items-center justify-center mr-3 text-sm font-bold">2</div>
                  핵심 분석 파라미터
                </h4>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                    <h5 className="font-semibold text-gray-800 mb-2">🔬 Field-Effect Mobility (μFE)</h5>
                    <p className="text-sm text-gray-600 mb-2"><strong>공식:</strong> μFE = (L/W) × (1/Cox) × (1/VD) × (∂ID/∂VG)</p>
                    <p className="text-sm text-gray-600">선형 영역에서 계산되는 기본적인 이동도로, 소자의 전하 수송 능력을 나타냅니다.</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
                    <h5 className="font-semibold text-gray-800 mb-2">⚡ Effective Mobility (μeff)</h5>
                    <p className="text-sm text-gray-600 mb-2"><strong>공식:</strong> μeff = μ0 / (1 + θ × (VG - Vth))</p>
                    <p className="text-sm text-gray-600">실제 소자에서 게이트 전압에 따른 이동도 감소 효과를 고려한 정확한 이동도입니다.</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg border border-green-100">
                    <h5 className="font-semibold text-gray-800 mb-2">🎯 Threshold Voltage (Vth)</h5>
                    <p className="text-sm text-gray-600 mb-2"><strong>추출 방법:</strong> Linear extrapolation, Maximum gm 방법</p>
                    <p className="text-sm text-gray-600">소자가 도통되기 시작하는 게이트 전압으로, 소자의 동작 특성을 결정하는 핵심 파라미터입니다.</p>
                  </div>
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-100">
                    <h5 className="font-semibold text-gray-800 mb-2">📐 Subthreshold Swing (SS)</h5>
                    <p className="text-sm text-gray-600 mb-2"><strong>공식:</strong> SS = dVG/d(log ID) [V/decade]</p>
                    <p className="text-sm text-gray-600">전류가 한 자릿수 변하는데 필요한 게이트 전압으로, 소자의 스위칭 특성을 나타냅니다.</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center mr-3 text-sm font-bold">3</div>
                  데이터 분석 핵심 팁
                </h4>
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-100 mb-4">
                  <h5 className="font-semibold text-gray-800 mb-2">⚠️ 주의사항</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Linear 영역과 Saturation 영역의 측정 조건을 정확히 구분</li>
                    <li>• Contact resistance의 영향을 고려한 정확한 μFE 계산</li>
                    <li>• 온도, 습도 등 환경 조건이 측정에 미치는 영향 고려</li>
                    <li>• 여러 번의 측정을 통한 재현성 확인</li>
                  </ul>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
                  <h5 className="font-semibold text-gray-800 mb-2">💡 고급 분석 기법</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Y-function 방법을 통한 정확한 μ0 및 θ 추출</li>
                    <li>• 샘플명별 데이터 통합으로 신뢰성 있는 결과 도출</li>
                    <li>• 다양한 측정 조건의 데이터를 활용한 종합적 분석</li>
                    <li>• 통계적 방법을 통한 데이터 품질 평가</li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <button
                  onClick={handlePerplexityClick}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center group shadow-lg hover:shadow-xl"
                >
                  <ExternalLink className="w-5 h-5 mr-3" />
                  더 상세한 가이드 보러가기 (Perplexity AI)
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-xs text-gray-500 text-center mt-4">
                  클릭하면 새 창에서 Perplexity AI 컬렉션이 열립니다
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showMaskViewer && (
        <MaskPictureViewer onClose={() => setShowMaskViewer(false)} />
      )}
    </div>
  );
};

export default TFTAnalyzerHome;