import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ArrowLeft, Home, Table, Star, Edit3, CheckCircle, AlertTriangle, BarChart3, ChevronUp, ChevronDown, X, Trash2, Edit, ChevronRight, ChevronLeft, Pin, PinOff, Download } from 'lucide-react';
import SSRangeEditor from './SSRangeEditor';
import { calculateDit } from '../parameters/index.js';
import { performCompleteAnalysis } from '../analysis/analysisEngine.js';
import {
  IDVDCharts,
  HysteresisCharts,
  IDVGCharts,
  GmCharts
} from './ChartComponents';

import {
  trackChartInteraction,
  trackDataTableView,
  trackFormulaInspection,
  trackFeatureUsage,
  trackEngagement
} from '../utils/analytics';

// 사이드바의 축소된 너비와 확장된 너비 정의
const COLLAPSED_WIDTH = 64; // px 단위로 변경
const EXPANDED_WIDTH = 240; // px 단위로 변경

const AnalysisResultsDisplay = ({
  allAnalysisSessions,
  currentSessionId,
  setCurrentSessionId,
  updateSessionResults,
  updateSessionName,
  showDataTable,
  setShowDataTable,
  setCurrentPage,
  handleGoToMainHome,
  removeAnalysisSession,
  onExportAllSessions
}) => {
  const [showLogScale, setShowLogScale] = useState(true);
  const [sortByValue, setSortByValue] = useState(false);
  
  // 새로 추가: 통합 분석 결과 표시 상태
  const [showCompleteAnalysis, setShowCompleteAnalysis] = useState(true);
  
  const [ssEditorState, setSSEditorState] = useState({
    isOpen: false,
    currentSample: null,
    currentMeasurement: null,
    chartData: null,
    currentSS: null
  });
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  // 세션 이름 수정 상태
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [newSessionName, setNewSessionName] = useState('');
  const nameInputRef = useRef(null);

  // 사이드바 상태 관리 - 성능 최적화
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  
  // 디바운싱을 위한 타이머 ref
  const hoverTimerRef = useRef(null);
  const contentWrapperRef = useRef(null);

  // 현재 세션 데이터를 useMemo로 캐싱
  const currentSession = useMemo(() => {
    return allAnalysisSessions.find(session => session.id === currentSessionId);
  }, [allAnalysisSessions, currentSessionId]);

  // 사이드바 hover 디바운싱 처리
  const handleSidebarMouseEnter = useCallback(() => {
    if (isSidebarPinned) return;
    
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    
    hoverTimerRef.current = setTimeout(() => {
      setIsSidebarOpen(true);
    }, 100); // 100ms 지연
  }, [isSidebarPinned]);

  const handleSidebarMouseLeave = useCallback(() => {
    if (isSidebarPinned) return;
    
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    
    hoverTimerRef.current = setTimeout(() => {
      setIsSidebarOpen(false);
    }, 150); // 150ms 지연으로 너무 빠른 닫힘 방지
  }, [isSidebarPinned]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  // 스크롤 감지
  useEffect(() => {
    if (!currentSession) {
      setShowScrollButtons(false);
      return;
    }
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      setShowScrollButtons(scrollHeight > clientHeight + 100);
      setCanScrollUp(scrollTop > 300);
      setCanScrollDown(scrollTop < scrollHeight - clientHeight - 100);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [currentSession]);

  // 세션 이름 수정 모드 시작
  const startEditingSessionName = (session) => {
    setEditingSessionId(session.id);
    setNewSessionName(session.name);
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 0);
  };

  // 세션 이름 저장
  const saveSessionName = useCallback((sessionId) => {
    const trimmedNewName = newSessionName.trim();
    if (editingSessionId === sessionId && trimmedNewName && trimmedNewName !== allAnalysisSessions.find(s => s.id === sessionId)?.name) {
      updateSessionName(sessionId, trimmedNewName);
      trackFeatureUsage('session_name_edit', 1);
    }
    setEditingSessionId(null);
    setNewSessionName('');
  }, [editingSessionId, newSessionName, allAnalysisSessions, updateSessionName]);

  // 세션 이름 입력 중 Enter 키 처리
  const handleNameInputKeyPress = (e, sessionId) => {
    if (e.key === 'Enter') {
      saveSessionName(sessionId);
    }
  };

  // 입력 필드 외부 클릭 감지 (수정 모드 종료)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editingSessionId && nameInputRef.current && !nameInputRef.current.contains(event.target)) {
        saveSessionName(editingSessionId);
      }
    };
    if (editingSessionId) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingSessionId, saveSessionName]);

  // 사이드바 너비 계산 - 성능 최적화
  const isExpanded = isSidebarOpen || isSidebarPinned;
  const sidebarWidth = isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH;

  // 사이드바 배경색 및 텍스트 색상 조정
  const sidebarBg = 'bg-gray-800';
  const headerTextColor = 'text-blue-400';
  const defaultTextColor = 'text-gray-200';
  const hoverBgColor = 'hover:bg-gray-700';
  const selectedBgColor = 'bg-blue-600';

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center text-gray-600">
          <p className="text-xl font-medium mb-4">선택된 분석 결과가 없습니다.</p>
          <button
            onClick={() => setCurrentPage('home')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가 분석 시작
          </button>
        </div>
      </div>
    );
  }

  const { analysisResults, completeAnalysisResults, uploadedFiles, deviceParams } = currentSession;

  const formatLinearCurrent = (value) => {
    if (value >= 1e-3) return `${parseFloat((value * 1000).toFixed(1))}m`;
    if (value >= 1e-6) return `${parseFloat((value * 1000000).toFixed(1))}μ`;
    if (value >= 1e-9) return `${parseFloat((value * 1000000000).toFixed(1))}n`;
    if (value >= 1e-12) return `${parseFloat((value * 1000000000000).toFixed(1))}p`;
    return `${value.toExponential(1)}`;
  };

  const openSSEditor = (sampleName, measurementType, chartData, currentSS) => {
    trackFeatureUsage('ss_editor_open', 1);
    trackFormulaInspection('SS', 'interactive_editor');
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
    const measurementType = ssEditorState.currentMeasurement;
    const sampleName = ssEditorState.currentSample;
    const updatedAnalysisResults = { ...currentSession.analysisResults };
    const sampleIndex = updatedAnalysisResults[measurementType].findIndex(r => r.displayName === sampleName);
    if (sampleIndex !== -1) {
      updatedAnalysisResults[measurementType][sampleIndex].parameters.SS = `${newSS.toFixed(1)} mV/decade (범위 조정)`;
      const newDit = calculateDit(newSS, currentSession.deviceParams);
      if (newDit > 0) {
        updatedAnalysisResults[measurementType][sampleIndex].parameters.Dit = `${newDit.toExponential(2)} cm⁻²eV⁻¹ (SS 기반 재계산)`;
      } else {
        updatedAnalysisResults[measurementType][sampleIndex].parameters.Dit = 'N/A (계산 실패)';
      }
      const updatedCompleteResults = performCompleteAnalysis(
        updatedAnalysisResults,
        currentSession.deviceParams,
        currentSession.uploadedFiles
      );
      updateSessionResults(currentSession.id, updatedAnalysisResults, updatedCompleteResults);
      trackFeatureUsage('ss_editor_update', 1);
      trackEngagement('parameter_modification', 1, 'SS_adjustment');
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

  const handleLogScaleToggle = (chartType) => {
    setShowLogScale(!showLogScale);
    trackChartInteraction(chartType, 'toggle_log_scale', { new_state: !showLogScale });
  };

  const handleSortToggle = () => {
    setSortByValue(!sortByValue);
    trackChartInteraction('all_charts', 'toggle_sort_by_value', { new_state: !sortByValue });
    trackFeatureUsage('sort_by_value', 1);
  };

  // 새로 추가: 통합 분석 결과 토글 함수
  const handleCompleteAnalysisToggle = () => {
    setShowCompleteAnalysis(!showCompleteAnalysis);
    trackFeatureUsage('complete_analysis_toggle', 1);
    trackEngagement('section_toggle', 1, showCompleteAnalysis ? 'hide' : 'show');
  };

  const handleDataTableToggle = () => {
    setShowDataTable(!showDataTable);
    if (!showDataTable) {
      const measurementTypes = Object.keys(analysisResults || {});
      const sampleCount = Object.keys(completeAnalysisResults || {}).length;
      trackDataTableView(measurementTypes, sampleCount);
      trackFeatureUsage('integrated_results_table', 1);
    }
  };

  const scrollToTop = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); trackEngagement('scroll_navigation', 1, 'to_top'); };
  const scrollToBottom = () => { window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }); trackEngagement('scroll_navigation', 1, 'to_bottom'); };
  const scrollDown = () => { window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' }); trackEngagement('scroll_navigation', 1, 'page_down'); };
  const scrollUp = () => { window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' }); trackEngagement('scroll_navigation', 1, 'page_up'); };
 
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 컨테이너 - 성능 최적화 */}
      <div
        className={`fixed top-0 left-0 h-full ${sidebarBg} shadow-lg flex flex-col z-40 transition-all duration-300 ease-in-out`}
        style={{ width: `${sidebarWidth}px` }}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        {/* 사이드바 헤더 및 토글 버튼 */}
        <div className={`flex items-center ${isExpanded ? 'justify-between px-4 py-4 border-b border-gray-700' : 'justify-center py-4'}`}>
          {isExpanded ? (
            <>
              <h2 className={`text-xl font-bold ${headerTextColor} whitespace-nowrap`}>분석 기록</h2>
              <button
                onClick={() => setIsSidebarPinned(!isSidebarPinned)}
                className="p-1 rounded-full text-gray-400 hover:text-blue-200 hover:bg-gray-700 transition-colors"
                title={isSidebarPinned ? '사이드바 고정 해제' : '사이드바 고정'}
              >
                {isSidebarPinned ? <PinOff className="w-5 h-5" /> : <Pin className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-1">
              <ChevronRight className={`w-8 h-8 ${headerTextColor} transition-all duration-300`} title="분석 기록 열기" />
              <span className={`text-xs font-semibold ${headerTextColor} transition-opacity duration-300`}>Tab</span>
            </div>
          )}
        </div>

        {/* 세션 목록 및 하단 탐색 버튼 */}
        {isExpanded && (
          <div className="flex-grow flex flex-col transition-opacity duration-300 ease-in-out opacity-100">
            <div className="flex-grow overflow-y-auto px-4 pr-2 custom-scrollbar py-4">
              <div className="space-y-2">
                {allAnalysisSessions.map(session => (
                  <div
                    key={session.id}
                    className={`relative flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-200 group
                      ${session.id === currentSessionId
                        ? selectedBgColor + ' text-white shadow-md'
                        : defaultTextColor + ' ' + hoverBgColor
                      }`}
                    onClick={() => setCurrentSessionId(session.id)}
                  >
                    {editingSessionId === session.id ? (
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={newSessionName}
                        onChange={(e) => setNewSessionName(e.target.value)}
                        onBlur={() => saveSessionName(session.id)}
                        onKeyPress={(e) => handleNameInputKeyPress(e, session.id)}
                        className="w-full bg-gray-700 text-white px-2 py-1 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium pr-2 truncate" onDoubleClick={() => startEditingSessionName(session)} title={session.name}>
                          {session.name}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditingSessionName(session); }}
                          className="ml-2 p-1 rounded-full text-gray-400 hover:text-blue-200 hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="세션 이름 수정"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {allAnalysisSessions.length > 1 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeAnalysisSession(session.id); }}
                            className="ml-1 p-1 rounded-full text-red-400 hover:text-red-300 hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="세션 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 사이드바 하단 버튼 */}
            <div className="mt-auto space-y-3 py-4 border-t border-gray-700 px-4">
              <button
                onClick={() => onExportAllSessions && onExportAllSessions(allAnalysisSessions)}
                disabled={allAnalysisSessions.length === 0}
                className="w-full flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                전체 세션 내보내기
              </button>

              <button
                onClick={() => setCurrentPage('home')}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors shadow-md"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                분석기 홈
              </button>
              <button
                onClick={handleGoToMainHome}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors shadow-md"
              >
                <Home className="w-4 h-4 mr-2" />
                메인 홈
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 메인 콘텐츠 - 성능 최적화된 레이아웃 */}
      <div 
        ref={contentWrapperRef}
        className="flex-1 p-8 transition-all duration-300 ease-in-out will-change-auto"
        style={{ 
          marginLeft: `${sidebarWidth}px`,
          // GPU 가속을 위한 transform 사용
          transform: 'translateZ(0)'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">TFT 통합 분석 결과</h1>
          
          {/* 버튼 그룹 */}
          <div className="flex items-center justify-end mb-8 space-x-4">
            <div className="relative flex items-center space-x-3">
              {/* 통합 분석 결과 토글 버튼 */}
              <button 
                onClick={handleCompleteAnalysisToggle} 
                className={`group relative overflow-hidden px-4 py-2.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  showCompleteAnalysis 
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white' 
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
                }`} 
                title="통합 분석 결과 섹션 표시/숨기기"
              >
                <div className="flex items-center space-x-2">
                  <Star className={`w-4 h-4 transition-all duration-300 ${
                    showCompleteAnalysis ? 'text-white' : 'text-gray-600 group-hover:text-gray-800'
                  }`} />
                  <span className="font-medium text-sm">
                    {showCompleteAnalysis ? '통합 결과 표시' : '통합 결과 숨김'}
                  </span>
                </div>
                {showCompleteAnalysis && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-lg"></div>
                )}
                <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 ${
                  showCompleteAnalysis 
                    ? 'bg-white/10 group-hover:opacity-100' 
                    : 'bg-gradient-to-r from-purple-50 to-indigo-50 group-hover:opacity-100'
                }`}></div>
              </button>

              {/* 값 정렬 버튼 */}
              <button 
                onClick={handleSortToggle} 
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
                {sortByValue && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-lg"></div>
                )}
                <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 ${
                  sortByValue 
                    ? 'bg-white/10 group-hover:opacity-100' 
                    : 'bg-gradient-to-r from-emerald-50 to-teal-50 group-hover:opacity-100'
                }`}></div>
              </button>
            </div>
          </div>

          {/* 통합 분석 결과 섹션 - 조건부 렌더링 */}
          {completeAnalysisResults && Object.keys(completeAnalysisResults).length > 0 && (
            <div className={`transition-all duration-500 ease-in-out ${showCompleteAnalysis ? 'max-h-none opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
              <CompleteAnalysisSection
                completeAnalysisResults={completeAnalysisResults}
                deviceParams={deviceParams}
                analysisResults={analysisResults}
                openSSEditor={openSSEditor}
                uploadedFiles={uploadedFiles}
              />
            </div>
          )}

          {/* 개별 분석 결과 섹션들 */}
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
                setShowLogScale={(newValue) => handleLogScaleToggle(type)}
                formatLinearCurrent={formatLinearCurrent}
              />
            );
          })}

          {/* 통합 결과표 섹션 */}
          {completeAnalysisResults && Object.keys(completeAnalysisResults).length > 0 && (
            <>
              <div className="text-center mb-8">
                <button 
                  onClick={handleDataTableToggle} 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center mx-auto"
                >
                  <Table className="w-5 h-5 mr-2" />
                  {showDataTable ? '통합 결과표 숨기기' : '통합 결과표 보기'}
                </button>
              </div>
              <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showDataTable ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <IntegratedResultsTable completeAnalysisResults={completeAnalysisResults} />
              </div>
            </>
          )}

          <SSRangeEditor 
            isOpen={ssEditorState.isOpen} 
            onClose={() => setSSEditorState(prev => ({ ...prev, isOpen: false }))} 
            chartData={ssEditorState.chartData} 
            currentSS={ssEditorState.currentSS} 
            sampleName={ssEditorState.currentSample} 
            onApplyResult={handleSSUpdate} 
          />
          
          {/* 스크롤 버튼들 */}
          {showScrollButtons && (
            <div className="fixed right-6 bottom-6 flex flex-col space-y-2 z-50">
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
    </div>
  );
};

// CompleteAnalysisSection 컴포넌트
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
         const sampleParams = getSampleParams(sampleName);

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
                 <span className={`px-3 py-1 rounded-full text-sm font-semibold ${result.quality.grade === 'A' ? 'bg-green-100 text-green-800' : result.quality.grade === 'B' ? 'bg-blue-100 text-blue-800' : result.quality.grade === 'C' ? 'bg-yellow-100 text-yellow-800' : result.quality.grade === 'D' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>{result.quality.grade}</span>
                 <div className="flex space-x-2">
                   {result.hasLinear && <span className="w-3 h-3 bg-blue-500 rounded-full" title="Linear"></span>}
                   {result.hasSaturation && <span className="w-3 h-3 bg-green-500 rounded-full" title="Saturation"></span>}
                   {result.hasIDVD && <span className="w-3 h-3 bg-purple-500 rounded-full" title="IDVD"></span>}
                   {result.hasHysteresis && <span className="w-3 h-3 bg-orange-500 rounded-full" title="Hysteresis"></span>}
                 </div>
               </div>
             </div>

             <div className="grid md:grid-cols-3 gap-6">

               <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg">
                 <h4 className="font-semibold text-blue-800 mb-3">⚡ 기본 전기 특성</h4>
                 <div className="space-y-2 text-sm">
                   {['Vth (Linear 기준)', 'gm_max (Linear 기준)', 'μFE (통합 계산)', 'Ion/Ioff'].map((key) => (
                     <div key={key} className="flex justify-between items-center">
                       <span className="text-gray-600">{key.split(' ')[0]}:</span>
                       <div className="flex items-center space-x-1">
                         <span className="text-xs font-medium">{result.parameters[key]}</span>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

               <div className="bg-gradient-to-br from-green-50 to-yellow-50 p-4 rounded-lg">
                 <h4 className="font-semibold text-green-800 mb-3">📊 품질 & 안정성</h4>
                 <div className="space-y-2 text-sm">
                   {['SS (Linear 기준)', 'Dit (Linear 기준)', 'ΔVth (Hysteresis)', 'Stability'].map((key) => (
                     <div key={key} className="flex justify-between items-center">
                       <span className="text-gray-600">{key.split(' ')[0]}:</span>
                       <div className="flex items-center space-x-1">
                         <span className="text-xs font-medium">{result.parameters[key]}</span>
                         {key.includes('SS') && result.hasLinear && (
                           <button onClick={() => { const linearResult = analysisResults['IDVG-Linear']?.find(r => r.displayName === sampleName); if (linearResult) openSSEditor(sampleName, 'IDVG-Linear', linearResult.chartData, result.parameters[key]); }} className="p-1 hover:bg-blue-100 rounded transition-colors" title="SS 값 수정하기"><Edit3 className="w-3 h-3 text-blue-600" /></button>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

               <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
                 <h4 className="font-semibold text-purple-800 mb-3">🔬 고급 이동도 분석</h4>
                 <div className="space-y-2 text-sm">
                   {['μ0 (Y-function)', 'μeff (정확 계산)', 'θ (계산값)', 'Ron'].map((key) => (
                     <div key={key} className="flex justify-between items-center">
                       <span className="text-gray-600">{key.split(' ')[0]}:</span>
                       <div className="flex items-center space-x-1">
                         <span className="text-xs font-medium">{result.parameters[key]}</span>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

             </div>

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

// IndividualAnalysisSection 컴포넌트
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
                      <span className="text-gray-900 text-xs font-medium">{value}</span>
                      {key === 'SS' && (type === 'IDVG-Linear' || type === 'IDVG-Saturation') && (
                        <div className="flex items-center space-x-1">
                          {getSSQualityIcon(value)}
                          <button onClick={() => openSSEditor(result.displayName, type, result.chartData, value)} className="p-1 hover:bg-blue-100 rounded transition-colors group" title="SS 값 수정하기"><Edit3 className="w-3 h-3 text-blue-600" /></button>
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

// IntegratedResultsTable 컴포넌트
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
                <span className={`px-2 py-1 rounded text-xs font-semibold ${result.quality.grade === 'A' ? 'bg-green-100 text-green-800' : result.quality.grade === 'B' ? 'bg-blue-100 text-blue-800' : result.quality.grade === 'C' ? 'bg-yellow-100 text-yellow-800' : result.quality.grade === 'D' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>{result.quality.grade}</span>
              </td>
              <td className="border border-gray-300 px-2 py-2 text-center text-xs font-medium">{result.parameters['Vth (Linear 기준)']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center text-xs font-medium">{result.parameters['gm_max (Linear 기준)']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-blue-700">{result.parameters['μFE (통합 계산)']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center text-xs font-medium">{result.parameters['μ0 (Y-function)']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center text-xs font-medium">{result.parameters['μeff (정확 계산)']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center text-xs font-medium">{result.parameters['θ (계산값)']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center text-xs font-medium">{result.parameters['SS (Linear 기준)']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center text-xs font-medium">{result.parameters['Dit (Linear 기준)']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center text-xs font-medium">{result.parameters['Ion/Ioff']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center text-xs font-medium">{result.parameters['ΔVth (Hysteresis)']}</td>
              <td className="border border-gray-300 px-2 py-2 text-center text-xs font-medium">{result.parameters['Ron']}</td>
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