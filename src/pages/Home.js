import React from 'react';
import { ArrowRight, Star, BarChart3, Zap, Settings, Users } from 'lucide-react';

const Home = ({ onNavigate }) => {
  const navigateToAnalyzer = (version) => {
    if (version === 'basic') {
      onNavigate('basic');
    } else if (version === 'advanced') {
      onNavigate('advanced');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 섹션 */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-800 mb-6">
            TFT 전기적 특성 분석기
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Probe Station 측정 데이터를 분석하여 TFT 파라미터를 자동으로 계산합니다
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <Zap className="w-4 h-4 mr-2" />
            두 가지 분석 모드를 제공합니다
          </div>
        </div>

        {/* 버전 선택 카드 */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* 기본 분석 버전 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-blue-200">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">기본 분석 모드</h2>
                <p className="text-sm text-gray-500">개별 파일 분석</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">✨ 특징</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
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
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">gm</span>
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">Vth</span>
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">μFE</span>
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">SS</span>
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">Ion/Ioff</span>
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">Ron</span>
              </div>
            </div>

            <button
              onClick={() => navigateToAnalyzer('basic')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center group"
            >
              기본 분석 시작
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* 통합 분석 버전 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border-2 border-purple-200 hover:border-purple-300 relative overflow-hidden">
            {/* 추천 배지 */}
            <div className="absolute top-4 right-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center">
                <Star className="w-3 h-3 mr-1" />
                추천
              </div>
            </div>

            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mr-4">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">통합 분석 모드</h2>
                <p className="text-sm text-purple-600 font-medium">별명 기반 데이터 융합</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">🎯 고급 특징</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <strong>별명별 데이터 그룹화</strong> - 같은 샘플의 다양한 측정 통합
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
                <span className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 px-2 py-1 rounded">μFE (통합)</span>
                <span className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 px-2 py-1 rounded">μeff (정확)</span>
                <span className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 px-2 py-1 rounded">θ (실측)</span>
                <span className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 px-2 py-1 rounded">Dit (계산)</span>
                <span className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 px-2 py-1 rounded">품질등급</span>
                <span className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 px-2 py-1 rounded">경고시스템</span>
              </div>
            </div>

            <button
              onClick={() => navigateToAnalyzer('advanced')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center group shadow-lg"
            >
              <Star className="w-5 h-5 mr-2" />
              통합 분석 시작
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* 비교 표 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">버전별 기능 비교</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">기능</th>
                  <th className="text-center py-3 px-4 font-semibold text-blue-700">기본 분석</th>
                  <th className="text-center py-3 px-4 font-semibold text-purple-700">통합 분석</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-4 font-medium">파일별 독립 분석</td>
                  <td className="py-3 px-4 text-center">✅</td>
                  <td className="py-3 px-4 text-center">✅</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">별명 기반 데이터 융합</td>
                  <td className="py-3 px-4 text-center">❌</td>
                  <td className="py-3 px-4 text-center">✅</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">정확한 μeff 계산</td>
                  <td className="py-3 px-4 text-center">⚠️ 기본</td>
                  <td className="py-3 px-4 text-center">✅ 고급</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">실제 θ 값 계산</td>
                  <td className="py-3 px-4 text-center">❌ 고정값</td>
                  <td className="py-3 px-4 text-center">✅ 실측값</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">품질 평가 시스템</td>
                  <td className="py-3 px-4 text-center">❌</td>
                  <td className="py-3 px-4 text-center">✅</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">경고 및 검증</td>
                  <td className="py-3 px-4 text-center">❌</td>
                  <td className="py-3 px-4 text-center">✅</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">분석 속도</td>
                  <td className="py-3 px-4 text-center">🚀 빠름</td>
                  <td className="py-3 px-4 text-center">⚡ 보통</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">정확도</td>
                  <td className="py-3 px-4 text-center">📊 기본</td>
                  <td className="py-3 px-4 text-center">🎯 연구급</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 사용 가이드 */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              기본 분석 모드 추천 대상
            </h3>
            <ul className="space-y-2 text-blue-700 text-sm">
              <li>• TFT 특성 분석을 처음 접하는 사용자</li>
              <li>• 빠른 결과 확인이 필요한 경우</li>
              <li>• 교육 및 학습 목적</li>
              <li>• 간단한 품질 체크</li>
            </ul>
          </div>

          <div className="bg-purple-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              통합 분석 모드 추천 대상
            </h3>
            <ul className="space-y-2 text-purple-700 text-sm">
              <li>• 연구 및 개발 프로젝트</li>
              <li>• 정확한 mobility 특성 분석 필요</li>
              <li>• 논문 작성 및 발표용 데이터</li>
              <li>• 상세한 품질 평가 및 검증</li>
            </ul>
          </div>
        </div>

        {/* 푸터 */}
        <div className="text-center mt-16 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            © 2025 <a href="https://www.kopo.ac.kr/seongnam/content.do?menu=11163" className="text-blue-600 hover:underline">폴리텍 성남캠퍼스 하이테크 반도체공정 </a>. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;