import React, { useState } from 'react';
import { ArrowRight, Star, Calculator, Play, Home } from 'lucide-react';
import FileUploadSection from './FileUploadSection';
import ParameterInputSection from './ParameterInputSection';
import FormulaCodeInspector from './FormulaCodeInspector';

const HomePage = ({
  uploadedFiles,
  deviceParams,
  showParamInput,
  isAnalyzing,
  handleFileUpload,
  removeFile,
  updateFileAlias,
  setShowParamInput,
  setDeviceParams,
  startAnalysis,
  handleGoToMainHome
}) => {
  const [showFormulaInspector, setShowFormulaInspector] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleGoToMainHome}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            메인 홈으로
          </button>
        </div>
        
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            TFT Electrical Characterization Analyzer
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Probe Station 측정 데이터를 분석하여 TFT 파라미터를 자동으로 계산합니다
          </p>
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-lg">
            <p className="text-lg font-semibold text-purple-800">🎯 완벽한 통합 분석</p>
            <p className="text-sm text-purple-600">샘플명별로 데이터를 묶어서 정확한 TFT 특성을 계산합니다</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <FileUploadSection
            uploadedFiles={uploadedFiles}
            handleFileUpload={handleFileUpload}
            removeFile={removeFile}
            updateFileAlias={updateFileAlias}
          />

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="flex items-center mb-4">
              <Star className="w-8 h-8 text-green-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">새로운 분석 방식</h2>
            </div>
            <div className="space-y-4 text-gray-600">
              <div className="flex items-start">
                <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1">1</span>
                <p><strong>샘플명으로 그룹화:</strong> 같은 샘플명의 파일들을 하나의 샘플로 인식</p>
              </div>
              <div className="flex items-start">
                <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1">2</span>
                <p><strong>데이터 융합:</strong> Linear의 gm_max + Vth + Y-function μ0 = μeff</p>
              </div>
              <div className="flex items-start">
                <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1">3</span>
                <p><strong>완벽한 계산:</strong> 각 측정의 장점을 조합하여 최고 정확도</p>
              </div>
              <div className="flex items-start">
                <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1">4</span>
                <p><strong>품질 평가:</strong> 데이터 완성도와 신뢰도 자동 평가</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">📁 파일명 규칙</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p><strong>• IDVD 측정:</strong> 파일명에 "IDVD" 포함 (예: T1_IDVD.xlsx)</p>
                <p><strong>• Linear 측정:</strong> "IDVG"와 "Linear" 또는 "Lin" 포함 (예: T1_IDVG_Linear.xlsx)</p>
                <p><strong>• Saturation 측정:</strong> "IDVG"와 "Sat" 포함 (예: T1_IDVG_Sat.xlsx)</p>
                <p><strong>• Hysteresis 측정:</strong> "IDVG", "Linear", "Hys" 모두 포함 (예: T1_IDVG_Linear_Hys.xlsx)</p>
                <p className="text-xs text-yellow-600 mt-2">💡 같은 샘플명의 파일들이 하나로 통합 분석됩니다</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowParamInput(!showParamInput)}
              className="w-full mt-6 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center"
            >
              <Calculator className="w-5 h-5 mr-2" />
              {showParamInput ? '파라미터 입력 숨기기' : '디바이스 파라미터 입력'}
            </button>
          </div>
        </div>

        <ParameterInputSection
          deviceParams={deviceParams}
          setDeviceParams={setDeviceParams}
          showParamInput={showParamInput}
        />

        {/* 수식 및 코드 점검 컴포넌트 */}
        {showFormulaInspector && (
          <div className="mb-8">
            <FormulaCodeInspector />
          </div>
        )}

        <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🔬 통합 분석의 장점</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 text-blue-800">기존 방식의 문제점</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>• 단일 측정: SS 영역 선택 부정확</li>
                <li>• 기존 θ: 고정값 사용으로 μeff 부정확</li>
                <li>• 각각 독립적 계산으로 일관성 부족</li>
                <li>• 실제 물리적 연관성 무시</li>
              </ul>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 text-green-800">통합 분석의 해결책</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>• ✅ Linear → 정확한 Vth, gm_max, SS</li>
                <li>• ✅ Y-function → 정확한 μ0</li>
                <li>• ✅ 실제 θ 값 계산으로 정확한 μeff</li>
                <li>• ✅ 물리적으로 일관된 결과</li>
              </ul>
            </div>
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="text-center">
            <button
              onClick={startAnalysis}
              disabled={isAnalyzing}
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-8 rounded-lg font-bold text-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center mx-auto shadow-lg"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  통합 분석 중...
                </>
              ) : (
                <>
                  <Star className="w-5 h-5 mr-2" />
                  완벽한 통합 분석 시작
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;