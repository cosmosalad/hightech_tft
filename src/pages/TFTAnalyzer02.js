// src/pages/TFTAnalyzer02.js

import React, { useState, useEffect, useCallback } from 'react';

// 모듈화된 컴포넌트들 import
import AnalysisResultsDisplay from './components/AnalysisResultsDisplay';
import HomePage from './components/HomePage';

// 분석 로직 모듈들 import
import { analyzeFiles, performCompleteAnalysis } from './analysis/analysisEngine';
// 📋 수정된 import문
import { detectFileType, generateSampleName } from './utils/fileUtils';

// 1. Import 수정 - 불필요한 함수 제거
import {
  exportMultipleSessions
} from './utils/analysisExportImport';

// Analytics import 추가
import {
  trackPageView,
  trackAnalysisStart,
  trackAnalysisComplete,
  trackError,
  trackPerformance,
  trackParameterMode
} from './utils/analytics';

const TFTAnalyzer = ({ onNavigateHome, onNavigateBack }) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisSessions, setAnalysisSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);
  const [deviceParams, setDeviceParams] = useState({
    W: 1000e-6,        // 채널 폭 (m)
    L: 1200e-6,         // 채널 길이 (m)  
    tox: 100e-9,       // 산화막 두께 (m)
    Cox: 3.45e-7      // 산화막 정전용량 (F/cm²)
  });
  const [showParamInput, setShowParamInput] = useState(false);
  const [parameterMode, setParameterMode] = useState('single');

  // 페이지 변경 시 스크롤 및 Analytics 추적
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const pageMapping = {
      'home': { title: 'TFT Analyzer - Home', path: '/tft-analyzer' },
      'analyzer': { title: 'TFT Analyzer - Analysis Results', path: '/tft-analyzer/results' }
    };
    
    const pageInfo = pageMapping[currentPage];
    if (pageInfo) {
      trackPageView(pageInfo.path, pageInfo.title);
    }
  }, [currentPage]);

  // 파라미터 모드 변경 시 Analytics 추적
  useEffect(() => {
    if (parameterMode !== 'single') {
      trackParameterMode(parameterMode, deviceParams);
    }
  }, [parameterMode, deviceParams]);

  const handleGoBack = () => {
    if (currentPage === 'analyzer') {
      setCurrentPage('home');
    } else {
      onNavigateBack();
    }
  };

  const handleGoToMainHome = () => {
    onNavigateHome();
  };

  // ✅ 수정된 handleFileUpload 함수
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      file,
      name: file.name,
      type: detectFileType(file.name),
      id: Date.now() + Math.random(),
      alias: generateSampleName(file.name), // ← 🔥 수정: 자동으로 샘플명 생성
      source: 'local' // ← 🆕 추가: 파일 소스 구분
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleGitHubFilesLoaded = (newFiles) => {
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateFileAlias = (id, alias) => {
    setUploadedFiles(prev => 
      prev.map(file => 
        file.id === id ? { ...file, alias } : file
      )
    );
  };

  // 새로운 콜백 함수: 특정 세션의 분석 결과 업데이트
  const updateSessionResults = useCallback((sessionId, updatedAnalysisResults, updatedCompleteAnalysisResults) => {
    setAnalysisSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === sessionId
          ? {
              ...session,
              analysisResults: updatedAnalysisResults,
              completeAnalysisResults: updatedCompleteAnalysisResults,
            }
          : session
      )
    );
  }, []);

  // 새로운 콜백 함수: 특정 세션의 이름 업데이트
  const updateSessionName = useCallback((sessionId, newName) => {
    setAnalysisSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === sessionId
          ? { ...session, name: newName }
          : session
      )
    );
  }, []);

  // 2. 불필요한 함수들 제거 및 간소화
  const handleExportAllSessions = async (sessions) => {
    if (sessions.length === 0) {
      alert('내보낼 세션이 없습니다.');
      return;
    }
    try {
      const result = await exportMultipleSessions(sessions, false);
      if (result.success) {
        alert(result.message);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('내보내기 중 오류가 발생했습니다.');
    }
  };

  // 🆕 분석기록 불러오기 핸들러 함수
  const handleImportAnalysisSession = (sessions) => {
    setAnalysisSessions(prev => [...prev, ...sessions]);
    if (sessions.length > 0) {
      setCurrentSessionId(sessions[0].id);
    }
  };

  // startAnalysis 함수에 overwriteExistingSession 인자 추가
  const startAnalysis = async (overwriteExistingSession = false) => {
    if (uploadedFiles.length === 0) {
      alert('먼저 엑셀 파일을 업로드해주세요.');
      return;
    }
    
    const startTime = performance.now();
    
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
    
    setIsAnalyzing(true);
    
    try {
      const sampleNames = [...new Set(uploadedFiles.map(f => f.alias || f.name))];
      const hasIndividualParams = uploadedFiles.some(f => f.individualParams);
      
      trackAnalysisStart(uploadedFiles.length, sampleNames.length, hasIndividualParams);
      
      const results = await analyzeFiles(uploadedFiles, deviceParams);
      const completeResults = performCompleteAnalysis(results, deviceParams, uploadedFiles);
      
      if (overwriteExistingSession && currentSessionId) {
        // 기존 세션 덮어쓰기
        setAnalysisSessions(prev =>
          prev.map(session =>
            session.id === currentSessionId
              ? {
                  ...session,
                  analysisResults: results,
                  completeAnalysisResults: completeResults,
                  // 덮어쓰기 시 파일 목록과 파라미터도 업데이트
                  uploadedFiles: uploadedFiles, 
                  deviceParams: deviceParams,
                  parameterMode: parameterMode, // 🆕 추가
                  name: session.name // 이름은 유지
                }
              : session
          )
        );
      } else {
        // 새로운 세션 생성
        const newSession = {
          id: Date.now(),
          name: `분석 기록 ${analysisSessions.length + 1}`,
          createdAt: new Date().toISOString(), // 🆕 추가
          analysisResults: results,
          completeAnalysisResults: completeResults,
          uploadedFiles: uploadedFiles,
          deviceParams: deviceParams,
          parameterMode: parameterMode // 🆕 추가
        };
        setAnalysisSessions(prev => [...prev, newSession]);
        setCurrentSessionId(newSession.id);
      }
      
      const duration = performance.now() - startTime;
      const successCount = Object.keys(results).length;
      const errorCount = uploadedFiles.length - successCount;
      
      trackAnalysisComplete(duration, uploadedFiles.length, successCount, errorCount);
      trackPerformance('analysis_complete', duration, {
        sample_count: sampleNames.length,
        parameter_mode: parameterMode,
        has_individual_params: hasIndividualParams
      });
      
      setCurrentPage('analyzer');
      
    } catch (error) {
      console.error('분석 중 오류 발생:', error);
      trackError('analysis', error.message, `${uploadedFiles.length} files`);
      alert('파일 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeAnalysisSession = (idToRemove) => {
    setAnalysisSessions(prevSessions => {
      const updatedSessions = prevSessions.filter(session => session.id !== idToRemove);
      if (currentSessionId === idToRemove) {
        setCurrentSessionId(updatedSessions.length > 0 ? updatedSessions[0].id : null);
      }
      return updatedSessions;
    });
  };

  // 4. renderHomePage에서 props 간소화
  const renderHomePage = () => (
    <HomePage
      uploadedFiles={uploadedFiles}
      deviceParams={deviceParams}
      showParamInput={showParamInput}
      isAnalyzing={isAnalyzing}
      handleFileUpload={handleFileUpload}
      removeFile={removeFile}
      updateFileAlias={updateFileAlias}
      handleGitHubFilesLoaded={handleGitHubFilesLoaded}
      setShowParamInput={setShowParamInput}
      setDeviceParams={setDeviceParams}
      setUploadedFiles={setUploadedFiles}
      startAnalysis={startAnalysis}
      handleGoToMainHome={handleGoToMainHome}
      parameterMode={parameterMode}
      setParameterMode={setParameterMode}
      hasExistingSessions={analysisSessions.length > 0}
      currentSessionName={currentSessionId ? analysisSessions.find(s => s.id === currentSessionId)?.name : null}
      onImportAnalysisSession={handleImportAnalysisSession}
      setCurrentPage={setCurrentPage}
    />
  );

  // 3. renderAnalyzerPage에서 props 간소화
  const renderAnalyzerPage = () => (
    <AnalysisResultsDisplay
      allAnalysisSessions={analysisSessions}
      currentSessionId={currentSessionId}
      setCurrentSessionId={setCurrentSessionId}
      updateSessionResults={updateSessionResults}
      updateSessionName={updateSessionName}
      showDataTable={showDataTable}
      setShowDataTable={setShowDataTable}
      setCurrentPage={setCurrentPage}
      handleGoToMainHome={handleGoToMainHome}
      removeAnalysisSession={removeAnalysisSession}
      onExportAllSessions={handleExportAllSessions}
    />
  );

  return (
    <div>
      {currentPage === 'home' && renderHomePage()}
      {currentPage === 'analyzer' && renderAnalyzerPage()}
    </div>
  );
};

export default TFTAnalyzer;