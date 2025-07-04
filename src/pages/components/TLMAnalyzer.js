import React, { useState, useRef, useCallback } from 'react';
import { 
  X, Upload, FileSpreadsheet, BarChart3, Play, Trash2, 
  AlertCircle, CheckCircle, Loader2, Settings, Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import TLMChartDisplay from './TLMChartDisplay';
import { performTLMAnalysis } from '../parameters/tlm';

const TLMAnalyzer = ({ onClose }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [contactWidth, setContactWidth] = useState(1.0);
  const [distanceStep, setDistanceStep] = useState(0.5);
  const [showUsageGuide, setShowUsageGuide] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef(null);

  // 파일 검증
  const validateFile = (file) => {
    const validExtensions = ['.xls', '.xlsx'];
    return validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  // 파일 업로드 처리
  const handleFileUpload = useCallback((files) => {
    const validFiles = Array.from(files).filter(validateFile);
    
    if (validFiles.length === 0) {
      setErrorMessage('Excel 파일(.xls, .xlsx)만 업로드 가능합니다.');
      return;
    }

    const existingNames = uploadedFiles.map(f => f.name);
    const newFiles = validFiles.filter(file => !existingNames.includes(file.name));
    
    if (newFiles.length === 0) {
      setErrorMessage('이미 업로드된 파일입니다.');
      return;
    }

    const fileInfos = newFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      status: 'ready'
    }));

    setUploadedFiles(prev => [...prev, ...fileInfos]);
    setErrorMessage('');
  }, [uploadedFiles]);

  // 드래그 앤 드롭 이벤트
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  }, [handleFileUpload]);

  // 파일 제거
  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setAnalysisResults(null);
    setShowResults(false);
    setErrorMessage('');
  };

  // TLM 분석 실행
  const executeAnalysis = async () => {
    if (uploadedFiles.length === 0) {
      setErrorMessage('분석할 파일을 업로드해주세요.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage('');

    try {
      // 파일 상태 업데이트
      setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'processing' })));

      // TLM 분석 수행
      const finalContactWidth = contactWidth || 1.0;
      const finalDistanceStep = distanceStep || 0.5;
      const results = await performTLMAnalysis(uploadedFiles, finalContactWidth, finalDistanceStep);
      
      setAnalysisResults(results);
      setShowResults(true);
      setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'completed' })));
      
    } catch (error) {
      console.error('TLM 분석 오류:', error);
      setErrorMessage(`분석 중 오류가 발생했습니다: ${error.message}`);
      setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 파일 상태 아이콘
  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready': return <FileSpreadsheet className="w-4 h-4 text-blue-500" />;
      case 'processing': return <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <FileSpreadsheet className="w-4 h-4 text-gray-500" />;
    }
  };

  // 결과 표시 중일 때
  if (showResults && analysisResults) {
    return (
      <TLMChartDisplay
        results={analysisResults}
        onClose={onClose}
        onBack={() => setShowResults(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart3 className="w-6 h-6 mr-3" />
              <h2 className="text-xl font-bold">TLM 분석기</h2>
              <span className="ml-3 px-3 py-1 bg-white/20 rounded-full text-sm">
                Transfer Length Method
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/20 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* 분석 파라미터 설정 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              분석 파라미터
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    접촉 폭 (Contact Width)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={contactWidth}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setContactWidth('');
                        } else {
                          setContactWidth(parseFloat(value) || 0);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      step="0.1"
                      min="0.1"
                      placeholder="1.0"
                    />
                    <span className="absolute right-3 top-2 text-gray-500 text-sm">mm</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    거리 간격 (Distance Step)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={distanceStep}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setDistanceStep('');
                        } else {
                          setDistanceStep(parseFloat(value) || 0);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      step="0.1"
                      min="0.1"
                      max="2.0"
                      placeholder="0.5"
                    />
                    <span className="absolute right-3 top-2 text-gray-500 text-sm">mm</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-700">
                    접촉 폭은 면저항(Rsh) 계산에 사용됩니다.
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-green-700">
                    거리 간격: {distanceStep || 0.5}mm 기준으로 워크시트를 인식합니다.<br />
                    (예: {distanceStep || 0.5}, {((distanceStep || 0.5) * 2).toFixed(1)}, {((distanceStep || 0.5) * 3).toFixed(1)}, {((distanceStep || 0.5) * 4).toFixed(1)} ...)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 파일 업로드 영역 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Excel 파일 업로드
            </h3>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                dragOver
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Excel 파일을 여기에 끌어다 놓거나 클릭하여 선택하세요
              </p>
              <p className="text-sm text-gray-500 mb-4">
                지원 형식: .xls, .xlsx<br />
                각 파일의 워크시트 이름은 거리({distanceStep || 0.5}, {((distanceStep || 0.5) * 2).toFixed(1)}, {((distanceStep || 0.5) * 3).toFixed(1)}, {((distanceStep || 0.5) * 4).toFixed(1)} 등)로 설정해주세요
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                파일 선택
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* 업로드된 파일 목록 */}
          {uploadedFiles.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FileSpreadsheet className="w-5 h-5 mr-2" />
                  업로드된 파일 ({uploadedFiles.length}개)
                </h3>
                <button
                  onClick={clearAllFiles}
                  className="text-red-600 hover:text-red-700 text-sm flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  모두 제거
                </button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center flex-1">
                      {getStatusIcon(file.status)}
                      <div className="ml-3 flex-1">
                        <p className="font-medium text-gray-800">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 분석 방법 안내 - 간단 버전 + 토글 버튼 */}
          <div className="mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-blue-800 flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  TLM 분석 요구사항
                </h4>
                <button
                  onClick={() => setShowUsageGuide(!showUsageGuide)}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all duration-200 border border-blue-200 hover:border-blue-300 shadow-sm"
                >
                  <Info className="w-4 h-4 mr-2" />
                  {showUsageGuide ? '상세 가이드 숨기기' : '📖 상세 사용법 보기'}
                  <motion.div
                    animate={{ rotate: showUsageGuide ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-2"
                  >
                    ▼
                  </motion.div>
                </button>
              </div>
              
              {/* 기본 요구사항 (항상 표시) */}
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 워크시트명에 거리값 포함 필수: {distanceStep || 0.5}, {((distanceStep || 0.5) * 2).toFixed(1)}, {((distanceStep || 0.5) * 3).toFixed(1)} 등</li>
                <li>• 각 워크시트에 AV(전압), AI(전류) 컬럼 필요</li>
                <li>• Excel 파일명은 자유롭게 설정 가능</li>
              </ul>

              {/* 상세 사용방법 (토글) */}
              <motion.div
                initial={false}
                animate={{ 
                  height: showUsageGuide ? 'auto' : 0,
                  opacity: showUsageGuide ? 1 : 0 
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div className="mt-4 space-y-4">
                  {/* 파일명 예시 */}
                  <div>
                    <h5 className="font-medium text-blue-700 mb-2">✅ 1. Excel 파일명은 자유롭게 설정 가능</h5>
                    <div className="bg-white p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-center p-2 bg-green-50 rounded-lg border border-green-200">
                          <div className="w-10 h-10 bg-green-100 rounded border border-green-300 flex items-center justify-center relative">
                            <span className="text-xs font-bold text-green-700">XL</span>
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-gray-300 transform rotate-45"></div>
                          </div>
                          <p className="text-xs font-medium text-green-700 mt-1">T1_Ti_Al_000</p>
                        </div>
                        <div className="text-gray-500">
                          <span className="text-sm">← 파일명은 원하는 대로 설정하세요</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 워크시트 구조 예시 */}
                  <div>
                    <h5 className="font-medium text-blue-700 mb-2">⚠️ 2. 워크시트명은 반드시 거리값으로 설정</h5>
                    <div className="bg-white p-3 rounded-lg border border-blue-200 mb-3">
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        <div className="bg-gray-100 p-2 rounded text-center border">
                          <p className="text-xs font-medium">T1_Ti_Al_000_2.0</p>
                        </div>
                        <div className="bg-gray-100 p-2 rounded text-center border">
                          <p className="text-xs font-medium">T1_Ti_Al_000_1.5</p>
                        </div>
                        <div className="bg-gray-100 p-2 rounded text-center border">
                          <p className="text-xs font-medium">T1_Ti_Al_000_1.0</p>
                        </div>
                        <div className="bg-gray-100 p-2 rounded text-center border">
                          <p className="text-xs font-medium">T1_Ti_Al_000_0.5</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-xs text-gray-500">↑ Excel 파일 내부의 워크시트 탭들</span>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <p className="text-sm text-amber-700 mb-2">
                        <strong>중요:</strong> 워크시트명에 거리값이 포함되어야 합니다!
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="font-medium text-green-700">✅ 올바른 예시:</p>
                          <ul className="text-green-600 ml-3">
                            <li>• {distanceStep || 0.5}</li>
                            <li>• {((distanceStep || 0.5) * 2).toFixed(1)}</li>
                            <li>• Sample_{distanceStep || 0.5}</li>
                            <li>• Data_{((distanceStep || 0.5) * 2).toFixed(1)}mm</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium text-red-700">❌ 잘못된 예시:</p>
                          <ul className="text-red-600 ml-3">
                            <li>• Sheet1</li>
                            <li>• Data</li>
                            <li>• Sample_A</li>
                            <li>• 측정결과</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 추가 요구사항 */}
                  <div>
                    <h5 className="font-medium text-blue-700 mb-2">📋 3. 데이터 형식 요구사항</h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• 각 워크시트에 <strong>AV(전압)</strong>, <strong>AI(전류)</strong> 컬럼 필수</li>
                      <li>• -2V ~ +2V 범위에서 선형 회귀를 통해 저항값 계산</li>
                      <li>• 거리 간격은 설정한 값({distanceStep || 0.5}mm)의 배수로 인식</li>
                      <li>• 최종적으로 저항 vs 거리 그래프로 TLM 파라미터 추출</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* 분석 실행 버튼 */}
          <div className="flex gap-4">
            <button
              onClick={executeAnalysis}
              disabled={uploadedFiles.length === 0 || isAnalyzing}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 flex items-center justify-center"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  TLM 분석 시작
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TLMAnalyzer;