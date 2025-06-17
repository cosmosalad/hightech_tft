import React, { useState } from 'react';
import { ArrowLeft, Home, Table, Star, Edit3, CheckCircle, AlertTriangle, BarChart3, Eye, EyeOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import SSRangeEditor from './SSRangeEditor';
import { evaluateSSQuality, calculateDit } from '../parameters/index.js';

const SampleNameTooltip = ({ active, payload, label, xAxisLabel, yAxisUnit, sortByValue, showLogScale, formatLinearCurrent }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border-2 border-gray-400 rounded-lg shadow-xl min-w-[250px]" style={{ backgroundColor: '#ffffff', opacity: 1, zIndex: 9999 }}>
        <p className="font-bold text-gray-800 mb-3 text-center border-b pb-2">
          {xAxisLabel}: {typeof label === 'number' ? label.toFixed(3) : label} V
        </p>
        <div className="space-y-2">
          {(sortByValue ?
            [...payload].sort((a, b) => (b.value || 0) - (a.value || 0)) :
            payload
          ).map((entry, index) => {
            if (entry.value === null || entry.value === undefined) return null;
            
            // 🆕 접선 데이터는 Tooltip에서 제외
            if (entry.dataKey && entry.dataKey.includes('_tangent')) return null;

            let sampleName = entry.dataKey;
            let measurementInfo = '';

            if (entry.dataKey.includes('_gm')) {
              sampleName = entry.dataKey.replace('_gm', '');
              measurementInfo = ' - gm';
            } else if (entry.dataKey.includes('VG_')) {
              const vgMatch = entry.dataKey.match(/VG_(.+)V/);
              if (vgMatch) {
                sampleName = entry.name ? entry.name.split(' ')[0] : entry.dataKey;
                measurementInfo = ` - VG=${vgMatch[1]}V`;
              }
            } else if (entry.dataKey === 'Forward' || entry.dataKey === 'Backward') {
              sampleName = entry.name ? entry.name.replace(` ${entry.dataKey}`, '') : 'Sample';
              measurementInfo = ` - ${entry.dataKey}`;
            } else {
              const nameMatch = entry.name ? entry.name.match(/(.+?)\s*\((.+?)\)/) : null;
              if (nameMatch) {
                sampleName = nameMatch[1];
                measurementInfo = ` - ${nameMatch[2]}`;
              }
            }

            return (
              <div key={index} className="flex items-center justify-between p-2 rounded">
                <div className="flex items-center flex-1">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: entry.color }}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">
                      {sampleName || 'Unknown Sample'}
                    </div>
                    {measurementInfo && (
                      <div className="text-xs text-gray-500">
                        {measurementInfo}
                      </div>
                    )}
                  </div>
                </div>
                <div className="font-mono text-sm text-gray-900 ml-3">
                  {showLogScale ?
                    entry.value.toExponential(2) :
                    formatLinearCurrent ? formatLinearCurrent(entry.value) : entry.value.toExponential(2)
                  } {yAxisUnit}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const AnalysisResultsDisplay = ({
  analysisResults,
  completeAnalysisResults,
  deviceParams,
  showDataTable,
  setShowDataTable,
  setCurrentPage,
  handleGoToMainHome,
  setAnalysisResults,
  setCompleteAnalysisResults
}) => {
  // 로그 스케일 기본값
  const [showLogScale, setShowLogScale] = useState(true);
  const formatLinearCurrent = (value) => {
    if (value >= 1e-3) return `${parseFloat((value * 1000).toFixed(1))}m`;
    if (value >= 1e-6) return `${parseFloat((value * 1000000).toFixed(1))}μ`;
    if (value >= 1e-9) return `${parseFloat((value * 1000000000).toFixed(1))}n`;
    if (value >= 1e-12) return `${parseFloat((value * 1000000000000).toFixed(1))}p`;
    return `${value.toExponential(1)}`;
  };
  // SS Editor용 state
  const [sortByValue, setSortByValue] = useState(false);
  const [ssEditorState, setSSEditorState] = useState({
    isOpen: false,
    currentSample: null,
    currentMeasurement: null,
    chartData: null,
    currentSS: null
  });

  // SS 수정기 열기 함수
  const openSSEditor = (sampleName, measurementType, chartData, currentSS) => {
    setSSEditorState({
      isOpen: true,
      currentSample: sampleName,
      currentMeasurement: measurementType,
      chartData: chartData,
      currentSS: parseFloat(currentSS.split(' ')[0]) // "150.2 mV/decade"에서 숫자만 추출
    });
  };

  // 🆕 SS 업데이트 핸들러
const handleSSUpdate = async (result) => {
  const { newSS, rSquared, dataPoints, range } = result;

  // analysisResults 업데이트
  const updatedResults = { ...analysisResults };
  const measurementType = ssEditorState.currentMeasurement;

  const sampleIndex = updatedResults[measurementType].findIndex(
    r => r.displayName === ssEditorState.currentSample
  );

  if (sampleIndex !== -1) {
    // SS 값 업데이트
    updatedResults[measurementType][sampleIndex].parameters.SS =
      `${newSS.toFixed(1)} mV/decade (범위 조정)`;

    // 🔥 Dit 강제 추가/업데이트 (단위 변환 수정)
    const newDit = calculateDit(newSS, deviceParams);
    if (newDit > 0) {
      updatedResults[measurementType][sampleIndex].parameters.Dit =
        `${newDit.toExponential(2)} cm⁻²eV⁻¹ (SS 기반 재계산)`;
    } else {
      updatedResults[measurementType][sampleIndex].parameters.Dit = 'N/A (계산 실패)';
    }

    setAnalysisResults(updatedResults);

    // 🔥 통합 분석 결과 업데이트 (async/await 사용)
    if (completeAnalysisResults && setCompleteAnalysisResults) {
      try {
        const { evaluateDataQuality } = await import('../analysis/analysisEngine.js');

        const updatedCompleteResults = { ...completeAnalysisResults };
        if (updatedCompleteResults[ssEditorState.currentSample]) {
          // SS, Dit 업데이트
          updatedCompleteResults[ssEditorState.currentSample].parameters['SS (Linear 기준)'] =
            `${newSS.toFixed(1)} mV/decade (범위 조정)`;

          const newDit = calculateDit(newSS, deviceParams);
          if (newDit > 0) {
            updatedCompleteResults[ssEditorState.currentSample].parameters['Dit (Linear 기준)'] =
              `${newDit.toExponential(2)} cm⁻²eV⁻¹ (재계산)`;
          }

          // 품질 평가 재계산
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

          // 🔥 즉시 state 업데이트
          setCompleteAnalysisResults(updatedCompleteResults);
        }
      } catch (error) {
        console.error('통합 분석 결과 업데이트 실패:', error);
      }
    }
  }

  // SS 에디터 닫기
  setSSEditorState({
    isOpen: false,
    currentSample: null,
    currentMeasurement: null,
    chartData: null,
    currentSS: null
  });

  // 성공 알림
  alert(`SS 값이 ${ssEditorState.currentSS} → ${newSS.toFixed(1)} mV/decade로 업데이트되었습니다!`);
};

  // 🆕 SS 품질 평가 아이콘 함수
  const getSSQualityIcon = (ssValue, chartData) => {
    if (!chartData || !ssValue) return null;

    const ssNumeric = parseFloat(ssValue.split(' ')[0]);

    if (ssNumeric < 100) {
      return <CheckCircle className="w-4 h-4 text-green-500" title="우수한 SS 값 (<100 mV/decade)" />;
    } else if (ssNumeric < 500) {
      return <CheckCircle className="w-4 h-4 text-green-500" title="양호한 SS 값 (100-500 mV/decade)" />;
    } else if (ssNumeric < 1000) {
      return <CheckCircle className="w-4 h-4 text-yellow-500" title="보통 SS 값 (500-1000 mV/decade)" />;
    } else if (ssNumeric < 1500) {
      return <AlertTriangle className="w-4 h-4 text-orange-500" title="미흡한 SS 값 (1000-1500 mV/decade)" />;
    } else {
      return <AlertTriangle className="w-4 h-4 text-red-500" title="매우 미흡한 SS 값 (>1500 mV/decade)" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">TFT 완벽 통합 분석 결과</h1>

          <div className="flex items-center space-x-4">
          {/* 정렬 토글 버튼 */}
            <div className="relative flex items-center space-x-2">
              <button
                onClick={() => setSortByValue(!sortByValue)}
                className={`group relative overflow-hidden px-4 py-2.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  sortByValue 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' 
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
                }`}
                title="Tooltip에서 값 크기순으로 정렬"
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className={`w-4 h-4 transition-all duration-300 ${
                    sortByValue ? 'text-white' : 'text-gray-600 group-hover:text-gray-800'
                  }`} />
                  <span className="font-medium text-sm">
                    {sortByValue ? '값 정렬 활성' : '값 정렬 비활성'}
                  </span>
                </div>

                {/* 활성 상태 표시 점 */}
                {sortByValue && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-lg"></div>
                )}

                {/* 호버 시 배경 효과 */}
                <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 ${
                  sortByValue
                    ? 'bg-white/10 group-hover:opacity-100'
                    : 'bg-gradient-to-r from-emerald-50 to-teal-50 group-hover:opacity-100'
                }`}></div>
              </button>
            </div>

            {/* 네비게이션 버튼들 */}
            <button
              onClick={() => setCurrentPage('home')}
              className="flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              분석기 홈으로
            </button>

            <button
              onClick={handleGoToMainHome}
              className="flex items-center px-4 py-2.5 bg-gradient-to-r from-gray-600 to-slate-600 text-white rounded-xl hover:from-gray-700 hover:to-slate-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
            >
              <Home className="w-4 h-4 mr-2" />
              메인 홈으로
            </button>
          </div>
        </div>

        {/* 🎯 통합 분석 결과 (메인 섹션) */}
        {completeAnalysisResults && Object.keys(completeAnalysisResults).length > 0 && (
          <CompleteAnalysisSection
            completeAnalysisResults={completeAnalysisResults}
            deviceParams={deviceParams}
            analysisResults={analysisResults}
            openSSEditor={openSSEditor}
          />
        )}

        {/* 기존 개별 분석 결과 */}
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

        {/* 통합 결과 요약표 */}
        {completeAnalysisResults && Object.keys(completeAnalysisResults).length > 0 && (
          <>
            <div className="text-center mb-8">
              <button
                onClick={() => setShowDataTable(!showDataTable)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center mx-auto"
              >
                <Table className="w-5 h-5 mr-2" />
                {showDataTable ? '통합 결과표 숨기기' : '통합 결과표 보기'}
              </button>
            </div>

            {showDataTable && (
              <IntegratedResultsTable
                completeAnalysisResults={completeAnalysisResults}
              />
            )}
          </>
        )}

        {/* 🆕 SS Range Editor 모달 */}
        <SSRangeEditor
          isOpen={ssEditorState.isOpen}
          onClose={() => setSSEditorState(prev => ({ ...prev, isOpen: false }))}
          chartData={ssEditorState.chartData}
          currentSS={ssEditorState.currentSS}
          sampleName={ssEditorState.currentSample}
          onApplyResult={handleSSUpdate}
        />
      </div>
    </div>
  );
};

// ... (이하 나머지 컴포넌트 코드는 동일)
// CompleteAnalysisSection, IndividualAnalysisSection, IDVDCharts, HysteresisCharts, IDVGCharts, GmCharts, IntegratedResultsTable

// 완전 분석 결과 섹션
const CompleteAnalysisSection = ({ completeAnalysisResults, deviceParams, analysisResults, openSSEditor }) => (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-lg p-8 mb-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <Star className="w-8 h-8 text-yellow-500 mr-3" />
        완벽한 통합 분석 결과
      </h2>

      <div className="grid gap-6">
        {Object.entries(completeAnalysisResults).map(([sampleName, result]) => (
          <div key={sampleName} className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {sampleName}
                <span className="text-sm font-normal text-gray-600 ml-3">
                  (W={(deviceParams.W * 1e6).toFixed(1)}μm, L={(deviceParams.L * 1e6).toFixed(1)}μm, tox={(deviceParams.tox * 1e9).toFixed(1)}nm)
                </span>
              </h3>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  result.quality.grade === 'A' ? 'bg-green-100 text-green-800' :
                  result.quality.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                  result.quality.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  품질: {result.quality.grade} ({result.quality.score}점)
                </span>
                <div className="flex space-x-2">
                  {result.hasLinear && <span className="w-3 h-3 bg-blue-500 rounded-full" title="Linear"></span>}
                  {result.hasSaturation && <span className="w-3 h-3 bg-green-500 rounded-full" title="Saturation"></span>}
                  {result.hasIDVD && <span className="w-3 h-3 bg-purple-500 rounded-full" title="IDVD"></span>}
                  {result.hasHysteresis && <span className="w-3 h-3 bg-orange-500 rounded-full" title="Hysteresis"></span>}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* 핵심 파라미터 */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-3">🎯 핵심 파라미터</h4>
                <div className="space-y-2 text-sm">
                  {['Vth (Linear 기준)', 'gm_max (Linear 기준)', 'μFE (통합 계산)', 'μeff (정확 계산)'].map((key) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-gray-600">{key.split(' ')[0]}:</span>
                      <div className="flex items-center space-x-1">
                        <span className="font-mono text-xs">{result.parameters[key]}</span>
                        {/* 🆕 SS/Dit 관련 파라미터에 수정 버튼 */}
                        {(key.includes('SS') || key.includes('Dit')) && result.hasLinear && (
                          <button
                            onClick={() => {
                              const linearResult = analysisResults['IDVG-Linear']?.find(
                                r => r.displayName === sampleName
                              );
                              if (linearResult) {
                                openSSEditor(sampleName, 'IDVG-Linear', linearResult.chartData, result.parameters[key]);
                              }
                            }}
                            className="p-1 hover:bg-blue-100 rounded transition-colors"
                            title={`${key} 수정하기`}
                          >
                            <Edit3 className="w-3 h-3 text-blue-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 품질 지표 */}
              <div className="bg-gradient-to-br from-green-50 to-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-3">📊 품질 지표</h4>
                <div className="space-y-2 text-sm">
                  {['SS (Linear 기준)', 'Ion/Ioff', 'ΔVth (Hysteresis)', 'Stability'].map((key) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-gray-600">{key.split(' ')[0]}:</span>
                      <div className="flex items-center space-x-1">
                        <span className="font-mono text-xs">{result.parameters[key]}</span>
                        {/* 🆕 SS 파라미터에 수정 버튼 */}
                        {key.includes('SS') && result.hasLinear && (
                          <button
                            onClick={() => {
                              const linearResult = analysisResults['IDVG-Linear']?.find(
                                r => r.displayName === sampleName
                              );
                              if (linearResult) {
                                openSSEditor(sampleName, 'IDVG-Linear', linearResult.chartData, result.parameters[key]);
                              }
                            }}
                            className="p-1 hover:bg-blue-100 rounded transition-colors"
                            title="SS 값 수정하기"
                          >
                            <Edit3 className="w-3 h-3 text-blue-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 계산 상세 */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-3">🔬 계산 상세</h4>
                <div className="space-y-2 text-sm">
                  {['μ0 (Y-function)', 'θ (계산값)', 'SS (Linear 기준)', 'Ron'].map((key) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-gray-600">{key.split(' ')[0]}:</span>
                      <div className="flex items-center space-x-1">
                        <span className="font-mono text-xs">{result.parameters[key]}</span>
                        {/* 🆕 Dit 파라미터에 수정 버튼 (SS 의존적이므로) */}
                        {key.includes('SS') && result.hasLinear && (
                          <button
                            onClick={() => {
                              const linearResult = analysisResults['IDVG-Linear']?.find(
                                r => r.displayName === sampleName
                              );
                              if (linearResult) {
                                openSSEditor(sampleName, 'IDVG-Linear', linearResult.chartData, result.parameters['SS (Linear 기준)']);
                              }
                            }}
                            className="p-1 hover:bg-blue-100 rounded transition-colors"
                            title="SS를 통해 Dit 수정하기"
                          >
                            <Edit3 className="w-3 h-3 text-blue-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 경고 및 품질 문제 */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <h5 className="font-semibold text-yellow-800 mb-2">⚠️ 주의사항:</h5>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {result.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.quality.issues.length > 0 && (
              <div className="mt-2 p-3 bg-red-50 border-l-4 border-red-400 rounded">
                <h5 className="font-semibold text-red-800 mb-2">❌ 품질 문제:</h5>
                <ul className="text-sm text-red-700 space-y-1">
                  {result.quality.issues.map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // 개별 분석 섹션
  const IndividualAnalysisSection = ({ type, resultArray, openSSEditor, getSSQualityIcon, sortByValue, showLogScale, setShowLogScale, formatLinearCurrent }) => {
    const hasMultipleFiles = resultArray.length > 1;

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {type} 개별 분석 {hasMultipleFiles ? `(${resultArray.length}개 파일)` : ''}
        </h2>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">측정 데이터 그래프</h3>

            {/* IDVD 차트 */}
            {type === 'IDVD' && (
              <IDVDCharts resultArray={resultArray} hasMultipleFiles={hasMultipleFiles} sortByValue={sortByValue} />
            )}

            {/* IDVG-Hysteresis 차트 */}
            {type === 'IDVG-Hysteresis' && (
              <HysteresisCharts resultArray={resultArray} hasMultipleFiles={hasMultipleFiles} sortByValue={sortByValue} />
            )}

            {/* IDVG-Linear, IDVG-Saturation 차트 */}
            {(type === 'IDVG-Linear' || type === 'IDVG-Saturation') && (
              <>
                <IDVGCharts
                  resultArray={resultArray}
                  type={type}
                  sortByValue={sortByValue}
                  showLogScale={showLogScale}
                  setShowLogScale={setShowLogScale}
                  formatLinearCurrent={formatLinearCurrent}
                />
                {/* gm 차트 */}
                {resultArray.some(result => result.gmData) && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">gm (Transconductance) 그래프</h3>
                    <GmCharts resultArray={resultArray} sortByValue={sortByValue} />
                  </div>
                )}
              </>
            )}
          </div>

          {/* 파라미터 표시 영역 - 🆕 SS 수정 기능 추가 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">개별 계산 파라미터</h3>
            {resultArray.map((result, index) => (
              <div key={index} className="mb-6">
                {hasMultipleFiles && (
                  <h4 className="font-medium text-gray-700 mb-2 bg-gray-100 p-2 rounded text-sm">
                    {result.displayName}
                  </h4>
                )}
                <div className="bg-gray-50 p-4 rounded-lg">
                  {Object.entries(result.parameters).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <span className="font-medium text-gray-700 text-sm">{key}:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-900 font-mono text-xs">{value}</span>

                        {/* 🆕 SS 수정 버튼 추가 */}
                        {key === 'SS' && (type === 'IDVG-Linear' || type === 'IDVG-Saturation') && (
                          <div className="flex items-center space-x-1">
                            {getSSQualityIcon(value, result.chartData)}
                            <button
                              onClick={() => openSSEditor(
                                result.displayName,
                                type,
                                result.chartData,
                                value
                              )}
                              className="p-1 hover:bg-blue-100 rounded transition-colors group"
                              title="SS 값 수정하기"
                            >
                              <Edit3 className="w-3 h-3 text-blue-600 group-hover:text-blue-800" />
                            </button>
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

  // IDVD 차트 컴포넌트
  const IDVDCharts = ({ resultArray, hasMultipleFiles, sortByValue }) => {
    // 🆕 라인 표시/숨김 state 추가
    const [hiddenLines, setHiddenLines] = useState(new Set());
    
    // 🆕 Legend 클릭 핸들러
    const handleLegendClick = (data) => {
      const { dataKey } = data;
      setHiddenLines(prev => {
        const newSet = new Set(prev);
        if (newSet.has(dataKey)) {
          newSet.delete(dataKey);
        } else {
          newSet.add(dataKey);
        }
        return newSet;
      });
    };

    return (
      <div className="space-y-8">
        {resultArray.map((result, fileIndex) => {
          if (!result || !result.chartData) return null;

          return (
            <div key={fileIndex} className="relative">
              {hasMultipleFiles && (
                <h4 className="text-md font-medium mb-3 text-gray-700 bg-gray-100 p-2 rounded">
                  {result.displayName}
                </h4>
              )}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
                  <LineChart data={result.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="VD"
                      label={{ value: 'VD (V)', position: 'insideBottom', offset: -10 }}
                      domain={[0, 'dataMax']}
                    />
                    <YAxis
                      scale="linear"
                      domain={[0, 'dataMax']}
                      label={{ value: 'ID (A)', angle: -90, position: 'insideLeft', offset: 5 }}
                      tickFormatter={(value) => value.toExponential(0)}
                    />
                    <Tooltip content={<SampleNameTooltip xAxisLabel="VD" yAxisUnit="A" sortByValue={sortByValue} />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '10px' }}
                      onClick={handleLegendClick}
                      iconType="line"
                    />
                    {result.gateVoltages && result.gateVoltages.map((vg, vgIndex) => {
                      const lineKey = `VG_${vg}V`;
                      return (
                        <Line
                          key={vg}
                          type="monotone"
                          dataKey={lineKey}
                          stroke={`hsl(${(vgIndex * 60) % 360}, 70%, 50%)`}
                          strokeWidth={2}
                          dot={false}
                          name={`${result.displayName} VG=${vg}V`}
                          hide={hiddenLines.has(lineKey)}  // 숨김 상태 적용
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  // Hysteresis 차트 컴포넌트
  const HysteresisCharts = ({ resultArray, hasMultipleFiles, sortByValue }) => (
    <div className="space-y-8">
      {resultArray.map((result, index) => {
        if (!result.forwardData || !result.backwardData) return null;

        const allVGValues = [...new Set([
          ...result.forwardData.map(d => d.VG),
          ...result.backwardData.map(d => d.VG)
        ])].sort((a, b) => a - b);

        const combinedData = allVGValues.map(vg => {
          const forwardPoint = result.forwardData.find(d => Math.abs(d.VG - vg) < 0.01);
          const backwardPoint = result.backwardData.find(d => Math.abs(d.VG - vg) < 0.01);
          return {
            VG: vg,
            Forward: forwardPoint?.ID || null,
            Backward: backwardPoint?.ID || null
          };
        });

        return (
          <div key={index} className="relative">
            {hasMultipleFiles && (
              <h4 className="text-md font-medium mb-3 text-gray-700 bg-gray-100 p-2 rounded">
                {result.displayName}
              </h4>
            )}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
                <LineChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="VG"
                    label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis
                    scale="log"
                    domain={[1e-12, 1e-3]}
                    label={{ value: 'ID (A)', angle: -90, position: 'insideLeft', offset: 15 }}
                    tickFormatter={(value) => value.toExponential(0)}
                  />
                  <Tooltip content={<SampleNameTooltip xAxisLabel="VG" yAxisUnit="A" sortByValue={sortByValue} />} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }}/>
                  <Line
                    type="monotone"
                    dataKey="Forward"
                    stroke="#2563eb"
                    name={`${result.displayName} Forward`}
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Backward"
                    stroke="#dc2626"
                    name={`${result.displayName} Backward`}
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
  // IDVG 차트 컴포넌트 - Vth 접선 기능 추가
  const IDVGCharts = ({ resultArray, type, sortByValue, showLogScale, setShowLogScale, formatLinearCurrent }) => {
    // Vth 접선 표시 토글 state 추가
  const [showVthTangent, setShowVthTangent] = useState(false);
  
  // 🆕 라인 표시/숨김 state 추가
  const [hiddenLines, setHiddenLines] = useState(new Set());
  
  // 🆕 Legend 클릭 핸들러
  const handleLegendClick = (data) => {
    const { dataKey } = data;
    setHiddenLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) {
        newSet.delete(dataKey);
      } else {
        newSet.add(dataKey);
      }
      return newSet;
    });
  };

    // Vth 접선 계산 함수
    const calculateVthTangentInfo = (chartData, parameters) => {
      if (!chartData || !parameters || type !== 'IDVG-Linear') return null;
      
      const vthStr = parameters.Vth;
      const gmMaxStr = parameters.gm_max;
      
      if (!vthStr || !gmMaxStr) return null;
      
      const vth = parseFloat(vthStr.split(' ')[0]);
      const gmMax = parseFloat(gmMaxStr.split(' ')[0]);
      
      if (isNaN(vth) || isNaN(gmMax)) return null;
      
      // gm_max 지점의 VG 추정 (일반적으로 Vth + 1~3V)
      let gmMaxVG = vth + 2;
      let gmMaxID = 0;
      
      // chartData에서 해당 지점 찾기
      const gmMaxPoint = chartData.find(d => Math.abs(d.VG - gmMaxVG) < 0.5);
      if (gmMaxPoint) {
        gmMaxID = gmMaxPoint.ID;
        gmMaxVG = gmMaxPoint.VG;
      } else {
        const candidatePoints = chartData.filter(d => d.VG >= vth + 1 && d.VG <= vth + 3);
        if (candidatePoints.length > 0) {
          const selectedPoint = candidatePoints[Math.floor(candidatePoints.length / 2)];
          gmMaxVG = selectedPoint.VG;
          gmMaxID = selectedPoint.ID;
        }
      }
      
      // 접선 데이터 생성: ID = gm_max × (VG - vth)
      const vgMin = Math.min(...chartData.map(d => d.VG));
      const vgMax = Math.max(...chartData.map(d => d.VG));
      
      const tangentData = [];
      for (let vg = vgMin; vg <= vgMax; vg += 0.1) {
        const idTangent = gmMax * (vg - vth);
        tangentData.push({ 
          VG: parseFloat(vg.toFixed(1)), 
          ID_tangent: idTangent > 0 ? idTangent : null 
        });
      }
      
      return { vth, gmMax, gmMaxVG, gmMaxID, tangentData };
    };

    const allVGValues = [...new Set(
      resultArray.flatMap(result => result.chartData ? 
        result.chartData.map(d => d.VG) : [])
    )].sort((a, b) => a - b);

    if (allVGValues.length === 0) return null;

    // 차트 데이터 합성
    const combinedData = allVGValues.map(vg => {
      const dataPoint = { VG: vg };
      
      resultArray.forEach((result, index) => {
        if (result.chartData) {
          const point = result.chartData.find(d => Math.abs(d.VG - vg) < 0.01);
          const key = result.displayName || `File${index + 1}`;
          dataPoint[key] = point?.ID || null;
          
          // 접선 데이터 추가 (IDVG-Linear인 경우만)
          if (showVthTangent && type === 'IDVG-Linear') {
            const tangentInfo = calculateVthTangentInfo(result.chartData, result.parameters);
            if (tangentInfo) {
              const tangentPoint = tangentInfo.tangentData.find(d => Math.abs(d.VG - vg) < 0.05);
              dataPoint[`${key}_tangent`] = tangentPoint?.ID_tangent || null;
            }
          }
        }
      });
      return dataPoint;
    });
  const renderCustomLegend = ({ payload, onClick }) => {
        return (
          <div style={{ textAlign: 'center', paddingTop: '10px' }}>
            {payload.map((entry, index) => {
              // dataKey에 '_tangent'가 포함된 항목은 완전히 건너뜀
              if (entry.dataKey && entry.dataKey.includes('_tangent')) {
                return null;
              }
              
              return (
                <span 
                  key={`item-${index}`} 
                  onClick={() => onClick(entry)}
                  style={{ 
                    margin: '0 10px', 
                    cursor: 'pointer',
                    color: entry.inactive ? '#ccc' : entry.color, // 비활성화 시 회색 처리
                    textDecoration: entry.inactive ? 'line-through' : 'none'
                  }}
                >
                  <svg width="14" height="14" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                    <line x1="0" y1="7" x2="14" y2="7" stroke={entry.color} strokeWidth="2" />
                  </svg>
                  {entry.value}
                </span>
              );
            })}
          </div>
        );
      };
    return (
      <div>
        {/* 토글 버튼들 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">ID-VG 특성 그래프</h3>
          
          <div className="flex items-center space-x-6">
            {/* Vth 접선 토글 버튼 (IDVG-Linear인 경우만 표시) */}
            {type === 'IDVG-Linear' && (
              <div className="flex items-center space-x-3">
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  !showVthTangent ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  접선 숨김
                </span>
                
                <button
                  onClick={() => setShowVthTangent(!showVthTangent)}
                  className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                    showVthTangent ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gray-300'
                  }`}
                  title="Vth 계산용 접선 표시/숨김"
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                      showVthTangent ? 'translate-x-9' : 'translate-x-1'
                    }`}
                  >
                    <div className="flex items-center justify-center h-full">
                      {showVthTangent ? (
                        <Eye className="w-3 h-3 text-orange-600" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-gray-600" />
                      )}
                    </div>
                  </span>
                </button>
                
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  showVthTangent ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  접선 표시
                </span>
              </div>
            )}

            {/* 기존 로그/선형 토글 */}
            <div className="flex items-center space-x-4">
              <span className={`text-sm font-medium transition-colors duration-300 ${
                !showLogScale ? 'text-gray-900' : 'text-gray-400'
              }`}>
                실제값
              </span>

              <button
                onClick={() => setShowLogScale(!showLogScale)}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  showLogScale ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                    showLogScale ? 'translate-x-9' : 'translate-x-1'
                  }`}
                >
                  <div className="flex items-center justify-center h-full">
                    {showLogScale ? (
                      <span className="text-xs text-blue-600 font-bold">log</span>
                    ) : (
                      <span className="text-xs text-gray-600 font-bold">lin</span>
                    )}
                  </div>
                </span>
              </button>

              <span className={`text-sm font-medium transition-colors duration-300 ${
                showLogScale ? 'text-gray-900' : 'text-gray-400'
              }`}>
                로그값
              </span>
            </div>
          </div>
        </div>

        {/* 차트 */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="VG"
                label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                scale={showLogScale ? "log" : "linear"}
                domain={showLogScale ? [1e-12, 1e-3] : ['auto', 'auto']}
                label={{
                  value: showLogScale ? 'ID (A)' : 'ID (A)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 5
                }}
                tickFormatter={(value) => showLogScale ?
                  value.toExponential(0) : formatLinearCurrent(value)
                }
              />
              <Tooltip 
                content={<SampleNameTooltip 
                  xAxisLabel="VG" 
                  yAxisUnit="A" 
                  sortByValue={sortByValue} 
                  showLogScale={showLogScale} 
                  formatLinearCurrent={formatLinearCurrent} 
                />} 
              />
              <Legend 
                wrapperStyle={{ paddingTop: '10px' }}
                onClick={handleLegendClick}
                iconType="line"
                formatter={(value) => {
                  // "_tangent"가 포함된 이름의 범례 항목은 숨깁니다.
                  if (value && value.includes('_tangent')) {
                    return null;
                  }
                  return value;
                }}
              />
              
              {/* 원본 데이터 라인들 */}
              {resultArray.map((result, index) => {
                const key = result.displayName || `File${index + 1}`;
                return (
                  <Line
                    key={index}
                    type="monotone"
                    dataKey={key}
                    stroke={`hsl(${index * 120}, 70%, 50%)`}
                    strokeWidth={2}
                    dot={false}
                    name={key}
                    connectNulls={false}
                    hide={hiddenLines.has(key)}  // 🆕 숨김 상태 적용
                  />
                );
              })}
              
              {/* 접선 라인들 (IDVG-Linear이고 토글이 켜진 경우) */}
              {showVthTangent && type === 'IDVG-Linear' && resultArray.map((result, index) => {
                const key = result.displayName || `File${index + 1}`;
                const tangentInfo = calculateVthTangentInfo(result.chartData, result.parameters);
                
                if (!tangentInfo) return null;
                
                return (
                  <Line
                    key={`tangent-${index}`}
                    type="monotone"
                    dataKey={`${key}_tangent`}
                    stroke={`hsl(${index * 120 + 30}, 80%, 45%)`}
                    strokeWidth={2}
                    strokeDasharray="8 4"  // 점선
                    dot={false}
                    legendType="none"      // Legend에서 완전히 제거
                    connectNulls={false}
                    hide={hiddenLines.has(key)}  // 🆕 원본 라인이 숨겨지면 접선도 같이 숨김
                  />
                );
              })}
                            
              {/* Reference Lines (IDVG-Linear이고 토글이 켜진 경우) */}
                {showVthTangent && type === 'IDVG-Linear' && resultArray.map((result, index) => {
                  const tangentInfo = calculateVthTangentInfo(result.chartData, result.parameters);
                  if (!tangentInfo) return null;
                  
                  return (
                    <React.Fragment key={`ref-${index}`}>
                      {/* gm_max VG 수직선 */}
                      <ReferenceLine 
                        x={tangentInfo.gmMaxVG} 
                        stroke={`hsl(${index * 120}, 60%, 40%)`} 
                        strokeDasharray="4 4"
                        strokeWidth={1}
                        label={{ 
                          value: `gm_max VG`, 
                          position: "topLeft",
                          style: { fontSize: '10px' }
                        }}
                      />
                      
                      {/* Vth 수직선 */}
                      <ReferenceLine 
                        x={tangentInfo.vth} 
                        stroke={`hsl(${index * 120 + 60}, 70%, 35%)`} 
                        strokeDasharray="4 4"
                        strokeWidth={2}
                        label={{ 
                          value: `Vth=${tangentInfo.vth.toFixed(2)}V`, 
                          position: "bottomRight",
                          style: { fontSize: '11px', fontWeight: 'bold' }
                        }}
                      />
                      
                      {/* 🆕 Vth 포인트 표시 */}
                      <ReferenceLine 
                        x={tangentInfo.vth} 
                        y={0}
                        stroke="transparent"
                        dot={{
                          fill: `hsl(${index * 120 + 60}, 80%, 40%)`,
                          stroke: `hsl(${index * 120 + 60}, 90%, 20%)`,
                          strokeWidth: 2,
                          r: 6
                        }}
                      />
                    </React.Fragment>
                  );
                })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // 통합 결과 테이블 컴포넌트
  const IntegratedResultsTable = ({ completeAnalysisResults }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🎯 완벽한 통합 분석 결과표</h2>
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
                <td className="border border-gray-300 px-3 py-2 font-medium bg-blue-50">
                  {sampleName}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    result.quality.grade === 'A' ? 'bg-green-100 text-green-800' :
                    result.quality.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                    result.quality.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {result.quality.grade}
                  </span>
                </td>
                <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                  {result.parameters['Vth (Linear 기준)']}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                  {result.parameters['gm_max (Linear 기준)']}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs font-bold text-blue-700">
                  {result.parameters['μFE (통합 계산)']}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                  {result.parameters['μ0 (Y-function)']}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                  {result.parameters['μeff (정확 계산)']}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                  {result.parameters['θ (계산값)']}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                  {result.parameters['SS (Linear 기준)']}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                  {result.parameters['Dit (Linear 기준)']}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                  {result.parameters['Ion/Ioff']}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                  {result.parameters['ΔVth (Hysteresis)']}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                  {result.parameters['Ron']}
                </td>
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

  const GmCharts = ({ resultArray, sortByValue }) => {
  // 라인 표시/숨김 state 추가
  const [hiddenLines, setHiddenLines] = useState(new Set());
  
  // Legend 클릭 핸들러
  const handleLegendClick = (data) => {
    const { dataKey } = data;
    setHiddenLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) {
        newSet.delete(dataKey);
      } else {
        newSet.add(dataKey);
      }
      return newSet;
    });
  };
    const allVGValues = [...new Set(
      resultArray.flatMap(result => result.gmData ? result.gmData.map(d => d.VG) : [])
    )].sort((a, b) => a - b);

    if (allVGValues.length === 0) return null;

    const combinedGmData = allVGValues.map(vg => {
      const dataPoint = { VG: vg };
      resultArray.forEach((result, index) => {
        if (result.gmData) {
          const point = result.gmData.find(d => Math.abs(d.VG - vg) < 0.01);
          const key = result.displayName || `File${index + 1}`;
          dataPoint[`${key}_gm`] = point?.gm || null;
        }
      });
      return dataPoint;
    });

    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={combinedGmData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="VG"
              label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              scale="linear"
              domain={['auto', 'auto']}
              label={{
                value: 'gm (S)',
                angle: -90,
                position: 'insideLeft',
                offset: 5
              }}
              tickFormatter={(value) => value.toExponential(1)}
            />
            <Tooltip 
              content={<SampleNameTooltip 
                xAxisLabel="VG" 
                yAxisUnit="S" 
                sortByValue={sortByValue} 
                showLogScale={false}
                formatLinearCurrent={(value) => value.toExponential(2)}
              />} 
            />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              onClick={handleLegendClick}
              iconType="line"
            />
            
            {resultArray.map((result, index) => {
              if (!result.gmData) return null;
              const key = result.displayName || `File${index + 1}`;
              return (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={`${key}_gm`}
                  stroke={`hsl(${index * 120 + 180}, 70%, 50%)`}
                  strokeWidth={2}
                  dot={false}
                  name={`${key} - gm`}
                  connectNulls={false}
                  hide={hiddenLines.has(`${key}_gm`)}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  export default AnalysisResultsDisplay;