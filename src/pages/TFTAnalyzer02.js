import React, { useState, useEffect, useCallback } from 'react';

import AnalysisResultsDisplay from './components/AnalysisResultsDisplay';
import HomePage from './components/HomePage';

import { analyzeFiles, performCompleteAnalysis } from './analysis/analysisEngine';
import { detectFileType, generateSampleName } from './utils/fileUtils';

import { exportMultipleSessions } from './utils/analysisExportImport';

import {
  trackPageView,
  trackAnalysisStart,
  trackAnalysisComplete,
  trackError,
  trackPerformance,
  trackParameterMode,
} from './utils/analytics';

const TFTAnalyzer = ({ onNavigateHome, onNavigateBack }) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisSessions, setAnalysisSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);
  const [deviceParams, setDeviceParams] = useState({
    W: 1000e-6,
    L: 1200e-6,
    tox: 100e-9,
    Cox: 3.45e-7
  });
  const [showParamInput, setShowParamInput] = useState(false);
  const [parameterMode, setParameterMode] = useState('single');

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

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      file,
      name: file.name,
      type: detectFileType(file.name),
      id: Date.now() + Math.random(),
      alias: generateSampleName(file.name),
      source: 'local'
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

  const updateSessionName = useCallback((sessionId, newName) => {
    setAnalysisSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === sessionId
          ? { ...session, name: newName }
          : session
      )
    );
  }, []);

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

  const handleImportAnalysisSession = (sessions) => {
    setAnalysisSessions(prev => [...prev, ...sessions]);
    if (sessions.length > 0) {
      setCurrentSessionId(sessions[0].id);
    }
  };

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
        setAnalysisSessions(prev =>
          prev.map(session =>
            session.id === currentSessionId
              ? {
                  ...session,
                  analysisResults: results,
                  completeAnalysisResults: completeResults,
                  uploadedFiles: uploadedFiles, 
                  deviceParams: deviceParams,
                  parameterMode: parameterMode,
                  name: session.name
                }
              : session
          )
        );
      } else {
        const newSession = {
          id: Date.now(),
          name: `분석 기록 ${analysisSessions.length + 1}`,
          createdAt: new Date().toISOString(),
          analysisResults: results,
          completeAnalysisResults: completeResults,
          uploadedFiles: uploadedFiles,
          deviceParams: deviceParams,
          parameterMode: parameterMode
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