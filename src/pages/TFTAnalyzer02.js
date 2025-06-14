// src/pages/TFTAnalyzer02.js (업데이트된 메인 컴포넌트)
import React, { useState, useEffect } from 'react';

// 모듈화된 컴포넌트들 import
import AnalysisResultsDisplay from './components/AnalysisResultsDisplay';
import HomePage from './components/HomePage';

// 분석 로직 모듈들 import
import { analyzeFiles, performCompleteAnalysis } from './analysis/analysisEngine';
import { detectFileType } from './utils/fileUtils';

const TFTAnalyzer = ({ onNavigateHome, onNavigateBack }) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [completeAnalysisResults, setCompleteAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);
  const [deviceParams, setDeviceParams] = useState({
    W: 100e-6,        // 채널 폭 (m)
    L: 50e-6,         // 채널 길이 (m)  
    tox: 20e-9,       // 산화막 두께 (m)
    Cox: 3.45e-7      // 산화막 정전용량 (F/cm²)
  });
  const [showParamInput, setShowParamInput] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

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

  // 파일 업로드 핸들러
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      file,
      name: file.name,
      type: detectFileType(file.name),
      id: Date.now() + Math.random(),
      alias: '' // 사용자 정의 샘플명
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  // 파일 제거
  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  // 파일 샘플명 업데이트
  const updateFileAlias = (id, alias) => {
    setUploadedFiles(prev => 
      prev.map(file => 
        file.id === id ? { ...file, alias } : file
      )
    );
  };

  // 분석 시작
  const startAnalysis = async () => {
    if (uploadedFiles.length === 0) {
      alert('먼저 엑셀 파일을 업로드해주세요.');
      return;
    }
    
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
    
    setIsAnalyzing(true);
    try {
      // 모듈화된 분석 엔진 사용
      const results = await analyzeFiles(uploadedFiles, deviceParams);
      setAnalysisResults(results);
      
      // 통합 분석 수행
      const completeResults = performCompleteAnalysis(results, deviceParams);
      setCompleteAnalysisResults(completeResults);
      
      setCurrentPage('analyzer');
    } catch (error) {
      console.error('분석 중 오류 발생:', error);
      alert('파일 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 홈 페이지 렌더링
  const renderHomePage = () => (
    <HomePage
      uploadedFiles={uploadedFiles}
      deviceParams={deviceParams}
      showParamInput={showParamInput}
      isAnalyzing={isAnalyzing}
      handleFileUpload={handleFileUpload}
      removeFile={removeFile}
      updateFileAlias={updateFileAlias}
      setShowParamInput={setShowParamInput}
      setDeviceParams={setDeviceParams}
      startAnalysis={startAnalysis}
      handleGoToMainHome={handleGoToMainHome}
    />
  );

  // 분석 페이지 렌더링
  const renderAnalyzerPage = () => (
    <AnalysisResultsDisplay
      analysisResults={analysisResults}
      setAnalysisResults={setAnalysisResults} 
      completeAnalysisResults={completeAnalysisResults}
      setCompleteAnalysisResults={setCompleteAnalysisResults}
      deviceParams={deviceParams}
      showDataTable={showDataTable}
      setShowDataTable={setShowDataTable}
      setCurrentPage={setCurrentPage}
      handleGoToMainHome={handleGoToMainHome}
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