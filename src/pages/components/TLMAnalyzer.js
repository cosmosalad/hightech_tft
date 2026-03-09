import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  X, Upload, FileSpreadsheet, BarChart3, Play, Trash2,
  AlertCircle, CheckCircle, Loader2, Settings, Info, Github, Download,
  Search, Folder, FolderOpen, AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import TLMChartDisplay from './TLMChartDisplay';
import { performTLMAnalysis } from '../parameters/tlm';
import {
  loadTLMFolderStructure,
  getTLMFilesFromPath,
  getTLMFolderTree,
  searchTLMFiles,
  generateTLMSampleName,
  getTLMFileTypeIcon,
  loadTLMFileFromGitHub,
  formatFileSize
} from './fileConfig_tlm';


const TLMFileTree = ({ folderStructure, onSelectFolder, selectedFolder, isFolderStructureLoading, hasLoadError }) => {

  const FolderNode = ({ node, level }) => {
    const [isOpen, setIsOpen] = useState(selectedFolder.startsWith(node.path));
    const isSelected = selectedFolder === node.path;
    const hasChildren = node.children && node.children.length > 0;

    const handleToggle = () => {
      setIsOpen(!isOpen);
      onSelectFolder(node.path);
    };

    return (
      <div>
        <div
          className={`flex items-center cursor-pointer py-2 px-3 rounded hover:bg-gray-100 transition-colors duration-150 ${
            isSelected ? 'bg-orange-100 text-orange-800' : ''
          }`}
          style={{ paddingLeft: `${12 + level * 20}px` }}
          onClick={handleToggle}
          title={node.path}
        >
          {hasChildren ? (
            (isOpen || isSelected) ? (
              <FolderOpen className="w-4 h-4 mr-2 text-orange-600 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 mr-2 text-orange-600 flex-shrink-0" />
            )
          ) : (
            isSelected ? (
              <FolderOpen className="w-4 h-4 mr-2 text-orange-600 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
            )
          )}
          <span className="font-medium text-sm truncate">{node.name}</span>
        </div>

        {isOpen && hasChildren && (
          <div className="mt-1">
            {node.children.map(childNode => (
              <FolderNode key={childNode.path} node={childNode} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isFolderStructureLoading) {
    return (
      <div className="border border-gray-200 rounded-md p-2 max-h-60 overflow-y-auto bg-white flex justify-center items-center" style={{ minHeight: '100px' }}>
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600 mr-2"></div>
        <span className="text-gray-600">TLM 폴더 구조 로딩 중...</span>
      </div>
    );
  }

  if (hasLoadError) {
    return (
      <div className="border border-red-300 rounded-md p-2 max-h-60 overflow-y-auto bg-red-50 text-red-700 text-center flex justify-center items-center" style={{ minHeight: '100px' }}>
        <AlertTriangle className="w-5 h-5 mr-2" />
        TLM 폴더 구조를 불러오는데 실패했습니다.
      </div>
    );
  }

  if (!folderStructure || folderStructure.length === 0) {
    return (
      <div className="border border-gray-200 rounded-md p-2 max-h-60 overflow-y-auto bg-gray-50 text-gray-500 text-center flex justify-center items-center" style={{ minHeight: '100px' }}>
        <Folder className="w-5 h-5 mr-2" />
        표시할 TLM 폴더가 없습니다.
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-md p-2 max-h-60 overflow-y-auto bg-white">
      <div className="space-y-1">
        {folderStructure.map(node => (
          <FolderNode key={node.path} node={node} level={0} />
        ))}
      </div>
    </div>
  );
};


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

  const [activeTab, setActiveTab] = useState('local');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showGlobalResults, setShowGlobalResults] = useState(false);
  const [isFolderStructureLoading, setIsFolderStructureLoading] = useState(false);
  const [hasFolderLoadError, setHasFolderLoadError] = useState(false);
  const [folderTreeData, setFolderTreeData] = useState([]);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    const fetchTLMFolderStructure = async () => {
      setIsFolderStructureLoading(true);
      setHasFolderLoadError(false);
      try {
        const data = await loadTLMFolderStructure();
        if (data) {
          const tree = getTLMFolderTree();
          setFolderTreeData(tree);
        } else {
          setHasFolderLoadError(true);
          setFolderTreeData([]);
          setSelectedFolder('');
        }
      } catch (error) {
        console.error("Error in fetching TLM folder structure:", error);
        setHasFolderLoadError(true);
        setFolderTreeData([]);
        setSelectedFolder('');
      } finally {
        setIsFolderStructureLoading(false);
      }
    };

    if (activeTab === 'github') {
      fetchTLMFolderStructure();
    }
  }, [activeTab]);

  const currentFolderFiles = useMemo(() => {
    if (isFolderStructureLoading || hasFolderLoadError || !selectedFolder) return [];
    return getTLMFilesFromPath(selectedFolder) || [];
  }, [selectedFolder, isFolderStructureLoading, hasFolderLoadError, folderTreeData]);

  const filteredFiles = useMemo(() => {
    if (isFolderStructureLoading || hasFolderLoadError) return [];
    if (!searchTerm.trim()) {
      return currentFolderFiles;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return currentFolderFiles.filter(filename => {
      const filenameLower = filename.toLowerCase();
      const sampleName = generateTLMSampleName(filename).toLowerCase();
      return filenameLower.includes(searchLower) || sampleName.includes(searchLower);
    });
  }, [currentFolderFiles, searchTerm, isFolderStructureLoading, hasFolderLoadError]);

  const globalSearchResults = useMemo(() => {
    if (isFolderStructureLoading || hasFolderLoadError) return [];
    if (!searchTerm.trim()) return [];
    return searchTLMFiles(searchTerm);
  }, [searchTerm, isFolderStructureLoading, hasFolderLoadError]);

  const validateFile = (file) => {
    const validExtensions = ['.xls', '.xlsx'];
    return validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

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
      status: 'ready',
      source: 'local',
      alias: generateTLMSampleName(file.name)
    }));

    setUploadedFiles(prev => [...prev, ...fileInfos]);
    setErrorMessage('');
  }, [uploadedFiles]);

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

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setAnalysisResults(null);
    setShowResults(false);
    setErrorMessage('');
  };

  const updateFileAlias = (fileId, newAlias) => {
    setUploadedFiles(prev =>
      prev.map(file =>
        file.id === fileId ? { ...file, alias: newAlias } : file
      )
    );
  };

  const toggleFileSelection = (filename) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filename)) {
        newSet.delete(filename);
      } else {
        newSet.add(filename);
      }
      return newSet;
    });
  };

  const toggleSelectAll = useCallback(() => {
    if (filteredFiles.length === 0) return;
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles));
    }
  }, [selectedFiles.size, filteredFiles]);

  const handleFolderChange = (folder) => {
    setSelectedFolder(folder);
    setSelectedFiles(new Set());
    setSearchTerm('');
    setShowGlobalResults(false);
  };

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const loadSelectedFiles = async () => {
    if (selectedFiles.size === 0) {
      setErrorMessage('불러올 파일을 선택해주세요.');
      return;
    }

    setIsLoadingFiles(true);
    const filesToLoad = Array.from(selectedFiles);
    const loadedFiles = [];

    try {
      for (const filename of filesToLoad) {
        try {
          const fileInfo = await loadTLMFileFromGitHub(filename, selectedFolder);
          loadedFiles.push(fileInfo);
        } catch (error) {
          console.error(`TLM 파일 로드 실패: ${filename}`, error);
          setErrorMessage(`파일 '${filename}' 로드에 실패했습니다.`);
        }
      }

      if (loadedFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...loadedFiles]);
        setErrorMessage('');
        setSelectedFiles(new Set());
      }
    } catch (error)      {
      setErrorMessage(`파일 로드 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const executeAnalysis = async () => {
    if (uploadedFiles.length === 0) {
      setErrorMessage('분석할 파일을 업로드해주세요.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage('');

    try {
      setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'processing' })));

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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready': return <FileSpreadsheet className="w-4 h-4 text-blue-500" />;
      case 'processing': return <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <FileSpreadsheet className="w-4 h-4 text-gray-500" />;
    }
  };

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4"
        style={{
          maxHeight: '90vh',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {}
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

        {}
        <div
          className="overflow-y-auto"
          style={{
            maxHeight: 'calc(90vh - 120px)',
            scrollbarWidth: 'thin',
            scrollbarColor: '#fb923c #f3f4f6'
          }}
        >
          <div className="p-6">
            {}
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
              </div>
            </div>

            {}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                파일 불러오기
              </h3>
              <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('local')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'local'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  로컬 파일
                </button>
                <button
                  onClick={() => setActiveTab('github')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'github'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Github className="w-4 h-4 inline mr-2" />
                  GitHub TLM 파일
                </button>
              </div>

              {}
              {activeTab === 'local' && (
                <div>
                  <p className="text-gray-600 mb-6">
                    컴퓨터에서 TLM 측정 엑셀 파일을 직접 업로드하세요
                  </p>
                  <input
                    type="file"
                    accept=".xls,.xlsx"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="tlm-file-upload"
                    ref={fileInputRef}
                  />
                  <label
                    htmlFor="tlm-file-upload"
                    className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-700 transition-colors cursor-pointer flex items-center justify-center mb-4"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    TLM 엑셀 파일 선택
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      w-full border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                      ${dragOver
                        ? 'border-orange-500 bg-orange-50 scale-105'
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                      }
                    `}
                  >
                    <div className={`flex flex-col items-center space-y-3 ${dragOver ? 'text-orange-600' : 'text-gray-500'}`}>
                      <Upload className={`w-12 h-12 ${dragOver ? 'animate-bounce' : ''}`} />
                      <div className="space-y-1">
                        <p className="text-lg font-medium">
                          {dragOver ? '파일을 놓아주세요!' : 'TLM 파일을 여기로 드래그하세요'}
                        </p>
                        <p className="text-sm">
                          또는 위의 버튼을 클릭하여 파일을 선택하세요
                        </p>
                        <p className="text-xs text-gray-400">
                          지원 형식: .xls, .xlsx
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {}
              {activeTab === 'github' && (
                <div>
                  <p className="text-gray-600 mb-6">
                    GitHub 저장소에서 TLM 측정 파일을 선택해서 불러오세요
                  </p>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TLM 폴더 선택:
                    </label>
                    <TLMFileTree
                      folderStructure={folderTreeData}
                      onSelectFolder={handleFolderChange}
                      selectedFolder={selectedFolder}
                      isFolderStructureLoading={isFolderStructureLoading}
                      hasLoadError={hasFolderLoadError}
                    />
                  </div>

                  {!hasFolderLoadError && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        TLM 파일 검색:
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          placeholder="파일명, 샘플명으로 검색..."
                          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        {searchTerm && (
                          <button
                            onClick={() => handleSearchChange('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>
                      {searchTerm && (
                        <div className="text-sm text-gray-500 mt-1 space-y-1">
                          <p>"{searchTerm}" 현재 폴더 검색 결과: {filteredFiles.length}개 파일</p>
                          {globalSearchResults.length > filteredFiles.length && (
                            <p className="text-orange-600">
                              전체에서 {globalSearchResults.length}개 파일 발견
                              <button
                                onClick={() => setShowGlobalResults(!showGlobalResults)}
                                className="ml-2 text-xs underline hover:no-underline"
                              >
                                {showGlobalResults ? '숨기기' : '전체 결과 보기'}
                              </button>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {}
                  <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    searchTerm && showGlobalResults && !hasFolderLoadError
                      ? 'max-h-96 opacity-100 mb-4'
                      : 'max-h-0 opacity-0'
                  }`}>
                    <h4 className="text-sm font-bold text-gray-800 mb-2 p-2 bg-orange-50 rounded-md border border-orange-200">
                      🔍 전체 폴더 검색 결과 "{searchTerm}" ({globalSearchResults.length}개)
                    </h4>
                    {globalSearchResults.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-orange-200 rounded-lg p-3 bg-orange-50">
                        {globalSearchResults.map((result, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                            <div className="flex items-center min-w-0">
                              <span className="text-lg mr-2 flex-shrink-0">{getTLMFileTypeIcon()}</span>
                              <div className="min-w-0">
                                <div className="font-medium text-sm text-gray-800 truncate" title={result.filename}>
                                  {result.filename}
                                </div>
                                <div className="text-xs text-gray-500 truncate" title={`📁 ${result.folderPath}`}>
                                  📁 {result.folderPath} · 샘플: {result.sampleName}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                handleFolderChange(result.folderPath);
                                setShowGlobalResults(false);
                              }}
                              className="text-xs bg-orange-600 text-white px-3 py-1 rounded-md hover:bg-orange-700 transition-colors flex-shrink-0"
                            >
                              폴더로 이동
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 bg-orange-50 border border-orange-200 rounded-lg">
                        검색어 "{searchTerm}"에 대한 TLM 파일이 전체 폴더에서 발견되지 않았습니다.
                      </div>
                    )}
                  </div>

                  {}
                  {!hasFolderLoadError && selectedFolder ? (
                    filteredFiles.length > 0 ? (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                              onChange={toggleSelectAll}
                              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">전체 선택</span>
                          </label>
                          <span className="text-sm text-orange-600 font-medium">
                            {selectedFiles.size}개 선택됨
                          </span>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                          {filteredFiles.map((filename) => {
                            const isSelected = selectedFiles.has(filename);
                            return (
                              <label key={filename} className={`flex items-center p-2 cursor-pointer transition-colors duration-150 rounded-lg ${
                                isSelected ? 'bg-orange-50 border border-orange-200' : 'hover:bg-gray-50'
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleFileSelection(filename)}
                                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 mr-3"
                                />
                                <span className="text-lg mr-2">{getTLMFileTypeIcon()}</span>
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-800">{filename}</div>
                                  <div className="text-xs text-gray-500">
                                    샘플: {generateTLMSampleName(filename)}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4 text-center py-8 text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                        📁 해당 폴더에 TLM 파일이 없습니다.
                      </div>
                    )
                  ) : (
                    !isFolderStructureLoading && !hasFolderLoadError && (
                       <div className="mb-4 text-center py-8 text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                        ← 좌측 트리에서 파일을 보려는 폴더를 선택하세요.
                      </div>
                    )
                  )}


                  <button
                    onClick={loadSelectedFiles}
                    disabled={isLoadingFiles || selectedFiles.size === 0 || hasFolderLoadError}
                    className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    {isLoadingFiles ? '불러오는 중...' : `선택한 ${selectedFiles.size}개 파일 불러오기`}
                  </button>
                </div>
              )}
            </div>

            {}
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
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center flex-1">
                        {getStatusIcon(file.status)}
                        <div className="ml-3 flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">{file.name}</span>
                            {file.source === 'github' && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded flex items-center">
                                <Github className="w-3 h-3 mr-1" />
                                {file.folder}
                              </span>
                            )}
                          </div>
                          <div className="mt-2">
                            <label className="text-xs text-gray-600">샘플명:</label>
                            <input
                              type="text"
                              value={file.alias}
                              onChange={(e) => updateFileAlias(file.id, e.target.value)}
                              placeholder="샘플명 입력"
                              className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                            />
                          </div>
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

            {}
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

                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 워크시트명에 거리값 포함 필수: {distanceStep || 0.5}, {((distanceStep || 0.5) * 2).toFixed(1)}, {((distanceStep || 0.5) * 3).toFixed(1)} 등</li>
                  <li>• 각 워크시트에 AV(전압), AI(전류) 컬럼 필요</li>
                  <li>• Excel 파일명은 자유롭게 설정 가능</li>
                </ul>

                {showUsageGuide && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 space-y-4"
                  >
                    {}
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

                    {}
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

                    {}
                    <div>
                      <h5 className="font-medium text-blue-700 mb-2">📋 3. 데이터 형식 요구사항</h5>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• 각 워크시트에 <strong>AV(전압)</strong>, <strong>AI(전류)</strong> 컬럼 필수</li>
                        <li>• -2V ~ +2V 범위에서 선형 회귀를 통해 저항값 계산</li>
                        <li>• 거리 간격은 설정한 값({distanceStep || 0.5}mm)의 배수로 인식</li>
                        <li>• 최종적으로 저항 vs 거리 그래프로 TLM 파라미터 추출</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {}
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-red-700">{errorMessage}</p>
                </div>
              </div>
            )}

            {}
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
        </div>
      </motion.div>
    </div>
  );
};

export default TLMAnalyzer;