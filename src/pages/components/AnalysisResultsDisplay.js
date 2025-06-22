// C:\Users\HYUN\hightech_tft\src\pages\components\AnalysisResultsDisplay.js

import React, { useState, useEffect } from 'react'; // useEffect 추가
import { ArrowLeft, Home, Table, Star, Edit3, CheckCircle, AlertTriangle, BarChart3, ChevronUp, ChevronDown } from 'lucide-react'; // 아이콘 추가
import SSRangeEditor from './SSRangeEditor';
import { calculateDit } from '../parameters/index.js';
import {
  IDVDCharts,
  HysteresisCharts,
  IDVGCharts,
  GmCharts
} from './ChartComponents';

const AnalysisResultsDisplay = ({
  analysisResults,
  completeAnalysisResults,
  deviceParams,
  showDataTable,
  setShowDataTable,
  setCurrentPage,
  handleGoToMainHome,
  setAnalysisResults,
  setCompleteAnalysisResults,
  uploadedFiles
}) => {
  const [showLogScale, setShowLogScale] = useState(true);
  const [sortByValue, setSortByValue] = useState(false);
  const [ssEditorState, setSSEditorState] = useState({
    isOpen: false,
    currentSample: null,
    currentMeasurement: null,
    chartData: null,
    currentSS: null
  });
  // 👇 이 부분 추가
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      // 스크롤이 있을 때만 버튼 표시
      setShowScrollButtons(scrollHeight > clientHeight + 100);

      // 위로 스크롤 가능한지 확인
      setCanScrollUp(scrollTop > 300);

      // 아래로 스크롤 가능한지 확인
      setCanScrollDown(scrollTop < scrollHeight - clientHeight - 100);
    };
    // 초기 체크
    handleScroll();

    // 스크롤 이벤트 리스너 추가
    window.addEventListener('scroll', handleScroll);

    // 리사이즈 이벤트도 감지 (내용이 변경될 때)
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const formatLinearCurrent = (value) => {
    if (value >= 1e-3) return `${parseFloat((value * 1000).toFixed(1))}m`;
    if (value >= 1e-6) return `${parseFloat((value * 1000000).toFixed(1))}μ`;
    if (value >= 1e-9) return `${parseFloat((value * 1000000000).toFixed(1))}n`;
    if (value >= 1e-12) return `${parseFloat((value * 1000000000000).toFixed(1))}p`;
    return `${value.toExponential(1)}`;
  };

  const openSSEditor = (sampleName, measurementType, chartData, currentSS) => {
    setSSEditorState({
      isOpen: true,
      currentSample: sampleName,
      currentMeasurement: measurementType,
      chartData: chartData,
      currentSS: parseFloat(currentSS.split(' ')[0])
    });
  };

  const handleSSUpdate = async (result) => {
    const { newSS } = result;
    const updatedResults = { ...analysisResults };
    const measurementType = ssEditorState.currentMeasurement;
    const sampleIndex = updatedResults[measurementType].findIndex(r => r.displayName === ssEditorState.currentSample);

    if (sampleIndex !== -1) {
      updatedResults[measurementType][sampleIndex].parameters.SS = `${newSS.toFixed(1)} mV/decade (범위 조정)`;
      const newDit = calculateDit(newSS, deviceParams);
      if (newDit > 0) {
        updatedResults[measurementType][sampleIndex].parameters.Dit = `${newDit.toExponential(2)} cm⁻²eV⁻¹ (SS 기반 재계산)`;
      } else {
        updatedResults[measurementType][sampleIndex].parameters.Dit = 'N/A (계산 실패)';
      }
      setAnalysisResults(updatedResults);

      if (completeAnalysisResults && setCompleteAnalysisResults) {
        try {
          const { evaluateDataQuality } = await import('../analysis/analysisEngine.js');
          const updatedCompleteResults = { ...completeAnalysisResults };
          if (updatedCompleteResults[ssEditorState.currentSample]) {
            updatedCompleteResults[ssEditorState.currentSample].parameters['SS (Linear 기준)'] = `${newSS.toFixed(1)} mV/decade (범위 조정)`;
            const newDitComplete = calculateDit(newSS, deviceParams);
            if (newDitComplete > 0) {
              updatedCompleteResults[ssEditorState.currentSample].parameters['Dit (Linear 기준)'] = `${newDitComplete.toExponential(2)} cm⁻²eV⁻¹ (재계산)`;
            }
            const newQuality = evaluateDataQuality(
              updatedCompleteResults[ssEditorState.currentSample].parameters,
              updatedCompleteResults[ssEditorState.currentSample].warnings || [],
              {
                hasLinear: updatedCompleteResults[ssEditorState.currentSample].hasLinear,
                hasSaturation: updatedCompleteResults[ssEditorState.currentSample].hasSaturation,
                hasIDVD: updatedCompleteResults[ssEditorState.currentSample].hasIDVD,
                hasHysteresis: updatedCompleteResults[ssEditorState.currentSample].hasHysteresis
              }
            );
            updatedCompleteResults[ssEditorState.currentSample].quality = newQuality;
            setCompleteAnalysisResults(updatedCompleteResults);
          }
        } catch (error) {
          console.error('통합 분석 결과 업데이트 실패:', error);
        }
      }
    }

    setSSEditorState({ isOpen: false, currentSample: null, currentMeasurement: null, chartData: null, currentSS: null });
    alert(`SS 값이 ${ssEditorState.currentSS} → ${newSS.toFixed(1)} mV/decade로 업데이트되었습니다!`);
  };

  const getSSQualityIcon = (ssValue) => {
    if (!ssValue) return null;
    const ssNumeric = parseFloat(ssValue.split(' ')[0]);
    if (ssNumeric < 100) return <CheckCircle className="w-4 h-4 text-green-500" title="우수한 SS 값 (<100 mV/decade)" />;
    if (ssNumeric < 500) return <CheckCircle className="w-4 h-4 text-green-500" title="양호한 SS 값 (100-500 mV/decade)" />;
    if (ssNumeric < 1000) return <CheckCircle className="w-4 h-4 text-yellow-500" title="보통 SS 값 (500-1000 mV/decade)" />;
    if (ssNumeric < 1500) return <AlertTriangle className="w-4 h-4 text-orange-500" title="미흡한 SS 값 (1000-1500 mV/decade)" />;
    return <AlertTriangle className="w-4 h-4 text-red-500" title="매우 미흡한 SS 값 (>1500 mV/decade)" />;
  };

  // 스크롤 함수들
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };
  const scrollDown = () => {
    window.scrollBy({
      top: window.innerHeight * 0.8, // 화면 높이의 80%만큼 스크롤
      behavior: 'smooth'
    });
  };
  const scrollUp = () => {
    window.scrollBy({
      top: -window.innerHeight * 0.8, // 화면 높이의 80%만큼 위로 스크롤
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">TFT 통합 분석 결과</h1>
          <div className="flex items-center space-x-4">
            <div className="relative flex items-center space-x-2">
              <button onClick={() => setSortByValue(!sortByValue)} className={`group relative overflow-hidden px-4 py-2.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${sortByValue ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'}`} title="Tooltip에서 값 크기순으로 정렬">
                <div className="flex items-center space-x-2">
                  <BarChart3 className={`w-4 h-4 transition-all duration-300 ${sortByValue ? 'text-white' : 'text-gray-600 group-hover:text-gray-800'}`} />
                  <span className="font-medium text-sm">{sortByValue ? '값 정렬 활성' : '값 정렬 비활성'}</span>
                </div>
                {sortByValue && <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-lg"></div>}
                <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 ${sortByValue ? 'bg-white/10 group-hover:opacity-100' : 'bg-gradient-to-r from-emerald-50 to-teal-50 group-hover:opacity-100'}`}></div>
              </button>
            </div>
            <button onClick={() => setCurrentPage('home')} className="flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"><ArrowLeft className="w-4 h-4 mr-2" />분석기 홈으로</button>
            <button onClick={handleGoToMainHome} className="flex items-center px-4 py-2.5 bg-gradient-to-r from-gray-600 to-slate-600 text-white rounded-xl hover:from-gray-700 hover:to-slate-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"><Home className="w-4 h-4 mr-2" />메인 홈으로</button>
          </div>
        </div>

        {completeAnalysisResults && Object.keys(completeAnalysisResults).length > 0 && (
          <CompleteAnalysisSection
            completeAnalysisResults={completeAnalysisResults}
            deviceParams={deviceParams}
            analysisResults={analysisResults}
            openSSEditor={openSSEditor}
            uploadedFiles={uploadedFiles}
          />
        )}

        {analysisResults && Object.keys(analysisResults).map((type) => {
          const resultArray = analysisResults[type];
          if (resultArray.length === 0) return null;
          return (
            <IndividualAnalysisSection
              key={type}
              type={type}
              resultArray={resultArray}
              openSSEditor={openSSEditor}
              getSSQualityIcon={getSSQualityIcon}
              sortByValue={sortByValue}
              showLogScale={showLogScale}
              setShowLogScale={setShowLogScale}
              formatLinearCurrent={formatLinearCurrent}
            />
          );
        })}

        {completeAnalysisResults && Object.keys(completeAnalysisResults).length > 0 && (
          <>
            <div className="text-center mb-8">
              <button onClick={() => setShowDataTable(!showDataTable)} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center mx-auto">
                <Table className="w-5 h-5 mr-2" />
                {showDataTable ? '통합 결과표 숨기기' : '통합 결과표 보기'}
              </button>
            </div>
            {/* ▼▼▼ 수정된 부분 ▼▼▼ */}
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showDataTable ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <IntegratedResultsTable completeAnalysisResults={completeAnalysisResults} />
            </div>
            {/* ▲▲▲ 여기까지 수정 ▲▲▲ */}
          </>
        )}

        <SSRangeEditor isOpen={ssEditorState.isOpen} onClose={() => setSSEditorState(prev => ({ ...prev, isOpen: false }))} chartData={ssEditorState.chartData} currentSS={ssEditorState.currentSS} sampleName={ssEditorState.currentSample} onApplyResult={handleSSUpdate} />
        {/* 👇 스크롤 버튼들 추가 */}
        {showScrollButtons && (
          <div className="fixed right-6 bottom-6 flex flex-col space-y-2 z-50">
            {/* 위로 스크롤 버튼 */}
            {canScrollUp && (
              <button
                onClick={scrollToTop}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                className="group bg-white hover:bg-blue-50 text-gray-600 hover:text-blue-600 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300"
                title="맨 위로"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            )}

            {/* 아래로 스크롤 버튼 */}
            {canScrollDown && (
              <button
                onClick={scrollToBottom}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                className="group bg-white hover:bg-blue-50 text-gray-600 hover:text-blue-600 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300"
                title="맨 아래로"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// 분석 결과 섹션
const CompleteAnalysisSection = ({ completeAnalysisResults, deviceParams, analysisResults, openSSEditor, uploadedFiles }) => {

 // 샘플별 개별 파라미터 가져오는 함수
 const getSampleParams = (sampleName) => {
   if (!uploadedFiles) return deviceParams;
   const sampleFile = uploadedFiles.find(f => (f.alias || f.name) === sampleName);
   return sampleFile?.individualParams || deviceParams;
 };

 return (
   <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-lg p-8 mb-8">
     <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center"><Star className="w-8 h-8 text-yellow-500 mr-3" />통합 분석 결과</h2>
     <div className="grid gap-6">
       {Object.entries(completeAnalysisResults).map(([sampleName, result]) => {
         const sampleParams = getSampleParams(sampleName); // 개별 파라미터 가져오기

         return (
           <div key={sampleName} className="bg-white rounded-lg p-6 shadow-md">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-xl font-bold text-gray-800">
                 {sampleName}
                 <span className="text-sm font-normal text-gray-600 ml-3">
                   (W={(sampleParams.W * 1e6).toFixed(1)}μm, L={(sampleParams.L * 1e6).toFixed(1)}μm, tox={(sampleParams.tox * 1e9).toFixed(1)}nm)
                 </span>
               </h3>
               <div className="flex items-center space-x-4">
                 <span className={`px-3 py-1 rounded-full text-sm font-semibold ${result.quality.grade === 'A' ? 'bg-green-100 text-green-800' : result.quality.grade === 'B' ? 'bg-blue-100 text-blue-800' : result.quality.grade === 'C' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>품질: {result.quality.grade} ({result.quality.score}점)</span>
                 <div className="flex space-x-2">
                   {result.hasLinear && <span className="w-3 h-3 bg-blue-500 rounded-full" title="Linear"></span>}
                   {result.hasSaturation && <span className="w-3 h-3 bg-green-500 rounded-full" title="Saturation"></span>}
                   {result.hasIDVD && <span className="w-3 h-3 bg-purple-500 rounded-full" title="IDVD"></span>}
                   {result.hasHysteresis && <span className="w-3 h-3 bg-orange-500 rounded-full" title="Hysteresis"></span>}
                 </div>
               </div>
             </div>

             <div className="grid md:grid-cols-3 gap-6">

               {/* 1️⃣ 기본 전기 특성 - 가장 중요한 기본 파라미터들 */}
               <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg">
                 <h4 className="font-semibold text-blue-800 mb-3">⚡ 기본 전기 특성</h4>
                 <div className="space-y-2 text-sm">
                   {['Vth (Linear 기준)', 'gm_max (Linear 기준)', 'μFE (통합 계산)', 'Ion/Ioff'].map((key) => (
                     <div key={key} className="flex justify-between items-center">
                       <span className="text-gray-600">{key.split(' ')[0]}:</span>
                       <div className="flex items-center space-x-1">
                         <span className="font-mono text-xs">{result.parameters[key]}</span>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

               {/* 2️⃣ 품질 & 안정성 - 소자의 품질과 안정성 지표들 */}
               <div className="bg-gradient-to-br from-green-50 to-yellow-50 p-4 rounded-lg">
                 <h4 className="font-semibold text-green-800 mb-3">📊 품질 & 안정성</h4>
                 <div className="space-y-2 text-sm">
                   {['SS (Linear 기준)', 'Dit (Linear 기준)', 'ΔVth (Hysteresis)', 'Stability'].map((key) => (
                     <div key={key} className="flex justify-between items-center">
                       <span className="text-gray-600">{key.split(' ')[0]}:</span>
                       <div className="flex items-center space-x-1">
                         <span className="font-mono text-xs">{result.parameters[key]}</span>
                         {key.includes('SS') && result.hasLinear && (
                           <button onClick={() => { const linearResult = analysisResults['IDVG-Linear']?.find(r => r.displayName === sampleName); if (linearResult) openSSEditor(sampleName, 'IDVG-Linear', linearResult.chartData, result.parameters[key]); }} className="p-1 hover:bg-blue-100 rounded transition-colors" title="SS 값 수정하기"><Edit3 className="w-3 h-3 text-blue-600" /></button>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

               {/* 3️⃣ 고급 이동도 분석 - 이동도 물리 모델 파라미터들 */}
               <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
                 <h4 className="font-semibold text-purple-800 mb-3">🔬 고급 이동도 분석</h4>
                 <div className="space-y-2 text-sm">
                   {['μ0 (Y-function)', 'μeff (정확 계산)', 'θ (계산값)', 'Ron'].map((key) => (
                     <div key={key} className="flex justify-between items-center">
                       <span className="text-gray-600">{key.split(' ')[0]}:</span>
                       <div className="flex items-center space-x-1">
                         <span className="font-mono text-xs">{result.parameters[key]}</span>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

             </div>

             {/* 경고 및 품질 문제 표시는 그대로 유지 */}
             {result.warnings && result.warnings.length > 0 && (
               <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                 <h5 className="font-semibold text-yellow-800 mb-2">⚠️ 주의사항:</h5>
                 <ul className="text-sm text-yellow-700 space-y-1">{result.warnings.map((warning, index) => (<li key={index}>• {warning}</li>))}</ul>
               </div>
             )}
             {result.quality.issues.length > 0 && (
               <div className="mt-2 p-3 bg-red-50 border-l-4 border-red-400 rounded">
                 <h5 className="font-semibold text-red-800 mb-2">❌ 품질 문제:</h5>
                 <ul className="text-sm text-red-700 space-y-1">{result.quality.issues.map((issue, index) => (<li key={index}>• {issue}</li>))}</ul>
               </div>
             )}
           </div>
         );
       })}
     </div>
   </div>
 );
};

// 개별 분석 섹션
const IndividualAnalysisSection = ({ type, resultArray, openSSEditor, getSSQualityIcon, sortByValue, showLogScale, setShowLogScale, formatLinearCurrent }) => {
  const hasMultipleFiles = resultArray.length > 1;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{type} 개별 분석 {hasMultipleFiles ? `(${resultArray.length}개 파일)` : ''}</h2>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">측정 데이터 그래프</h3>
          {type === 'IDVD' && <IDVDCharts resultArray={resultArray} hasMultipleFiles={hasMultipleFiles} sortByValue={sortByValue} />}
          {type === 'IDVG-Hysteresis' && <HysteresisCharts resultArray={resultArray} hasMultipleFiles={hasMultipleFiles} sortByValue={sortByValue} />}
          {(type === 'IDVG-Linear' || type === 'IDVG-Saturation') && (
            <>
              <IDVGCharts resultArray={resultArray} type={type} sortByValue={sortByValue} showLogScale={showLogScale} setShowLogScale={setShowLogScale} formatLinearCurrent={formatLinearCurrent} />
              {resultArray.some(result => result.gmData) && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">gm (Transconductance) 그래프</h3>
                  <GmCharts resultArray={resultArray} sortByValue={sortByValue} />
                </div>
              )}
            </>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">개별 계산 파라미터</h3>
          {resultArray.map((result, index) => (
            <div key={index} className="mb-6">
              {hasMultipleFiles && <h4 className="font-medium text-gray-700 mb-2 bg-gray-100 p-2 rounded text-sm">{result.displayName}</h4>}
              <div className="bg-gray-50 p-4 rounded-lg">
                {Object.entries(result.parameters).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                    <span className="font-medium text-gray-700 text-sm">{key}:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 font-mono text-xs">{value}</span>
                      {key === 'SS' && (type === 'IDVG-Linear' || type === 'IDVG-Saturation') && (
                        <div className="flex items-center space-x-1">
                          {getSSQualityIcon(value)}
                          <button onClick={() => openSSEditor(result.displayName, type, result.chartData, value)} className="p-1 hover:bg-blue-100 rounded transition-colors group" title="SS 값 수정하기"><Edit3 className="w-3 h-3 text-blue-600 group-hover:text-blue-800" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 통합 결과 테이블 컴포넌트
const IntegratedResultsTable = ({ completeAnalysisResults }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
    <h2 className="text-2xl font-bold text-gray-800 mb-6">🎯 통합 분석 결과표</h2>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-purple-100 to-blue-100">
            <th className="border border-gray-300 px-3 py-3 text-left font-semibold">샘플명</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">품질</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Vth (V)</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">gm_max (S)</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">μFE (cm²/V·s)</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">μ0 (cm²/V·s)</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">μeff (cm²/V·s)</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">θ (V⁻¹)</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">SS (V/Dec)</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Dit (cm⁻²eV⁻¹)</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Ion/Ioff</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">ΔVth (V)</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Ron (Ω)</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">데이터 소스</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(completeAnalysisResults).map(([sampleName, result]) => (
            <tr key={sampleName} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-3 py-2 font-medium bg-blue-50">{sampleName}</td>
              <td className="border border-gray-300 px-2 py-2 text-center">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${result.quality.grade === 'A' ? 'bg-green-100 text-green-800' : result.quality.grade === 'B' ? 'bg-blue-100 text-blue-800' : result.quality.grade === 'C' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{result.quality.grade}</span>
              </td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">{result.parameters['Vth (Linear 기준)']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">{result.parameters['gm_max (Linear 기준)']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs font-bold text-blue-700">{result.parameters['μFE (통합 계산)']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">{result.parameters['μ0 (Y-function)']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">{result.parameters['μeff (정확 계산)']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">{result.parameters['θ (계산값)']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">{result.parameters['SS (Linear 기준)']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">{result.parameters['Dit (Linear 기준)']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">{result.parameters['Ion/Ioff']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">{result.parameters['ΔVth (Hysteresis)']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">{result.parameters['Ron']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center text-xs">
                <div className="flex justify-center space-x-1">
                  {result.hasLinear && <span className="w-2 h-2 bg-blue-500 rounded-full" title="Linear"></span>}
                  {result.hasSaturation && <span className="w-2 h-2 bg-green-500 rounded-full" title="Saturation"></span>}
                  {result.hasIDVD && <span className="w-2 h-2 bg-purple-500 rounded-full" title="IDVD"></span>}
                  {result.hasHysteresis && <span className="w-2 h-2 bg-orange-500 rounded-full" title="Hysteresis"></span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default AnalysisResultsDisplay;