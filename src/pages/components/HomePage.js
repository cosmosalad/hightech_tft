// C:\Users\HYUN\hightech_tft\src\pages\components\HomePage.js

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  ArrowRight, Star, Calculator, Play, Home, Upload, Github, X, Download,
  CheckCircle, AlertTriangle, Search, Folder, FolderOpen, FileText, PlusCircle, Save, Trash2,
  Database, FileUp, Info
} from 'lucide-react';
import ParameterInputSection from './ParameterInputSection';
import FormulaCodeInspector from './FormulaCodeInspector';

// 1. Import 수정 (템플릿 관련 제거)
import {
  importAnalysisSession
} from '../utils/analysisExportImport';

// 설정 파일에서 import
import {
  GITHUB_CONFIG,
  getFilesFromPath,
  searchFiles,
  detectFileType,
  generateSampleName,
  getFileTypeIcon,
  getFileTypeColor,
  getFolderTree,
  loadFolderStructure
} from './fileConfig';

// Analytics import 추가
import {
  trackPageView,
  trackFileUpload,
  trackGitHubLoad,
  trackSearch,
  trackError,
  trackPerformance,
  initializeSession,
  trackFeatureUsage
} from '../utils/analytics';
import TFTUsageGuide from './TFTUsageGuide';
import { motion } from 'framer-motion';


// --- FileTreeItem Component ---
const FileTreeItem = ({ item, level = 0, onSelectFolder, selectedFolder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const isFolder = item.type === 'folder';

  const indentStyle = { paddingLeft: `${level * 20}px` };

  const handleFolderClick = () => {
    setIsOpen(!isOpen);
    if (isFolder) {
      onSelectFolder(item.path);
    }
  };

  return (
    <div className="relative">
      {isFolder && (
        <div
          className={`flex items-center cursor-pointer py-1 px-2 rounded hover:bg-gray-100 transition-colors duration-150 ${selectedFolder === item.path ? 'bg-blue-100 text-blue-800' : ''}`}
          style={indentStyle}
          onClick={handleFolderClick}
          onMouseEnter={() => item.description && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {isOpen ? <FolderOpen className="w-4 h-4 mr-2 text-blue-600" /> : <Folder className="w-4 h-4 mr-2 text-gray-500" />}
          <span className="font-medium text-sm">{item.name}</span>
        </div>
      )}

      {isFolder && item.description && showTooltip && (
        <div
          className="absolute z-10 bg-gray-800 text-white text-xs p-2 rounded-md shadow-lg"
          style={{ left: `${level * 20 + 200}px`, top: '50%', transform: 'translateY(-50%)', whiteSpace: 'pre-wrap' }}
        >
          {item.description}
        </div>
      )}

      {isFolder && isOpen && item.children && item.children.length > 0 && (
        <div className="ml-4 border-l border-gray-200">
          {item.children.map((child) => (
            <FileTreeItem
              key={child.path}
              item={child}
              level={level + 1}
              onSelectFolder={onSelectFolder}
              selectedFolder={selectedFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};


// --- FileTree Component ---
const FileTree = ({ folderStructure, onSelectFolder, selectedFolder, isFolderStructureLoading, hasLoadError }) => {
  if (isFolderStructureLoading) {
    return (
      <div className="border border-gray-200 rounded-md p-2 max-h-60 overflow-y-auto bg-white flex justify-center items-center" style={{ minHeight: '100px' }}>
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
        <span className="text-gray-600">폴더 구조 로딩 중...</span>
      </div>
    );
  }

  if (hasLoadError) {
    return (
      <div className="border border-red-300 rounded-md p-2 max-h-60 overflow-y-auto bg-red-50 text-red-700 text-center flex justify-center items-center" style={{ minHeight: '100px' }}>
        <AlertTriangle className="w-5 h-5 mr-2" />
        폴더 구조를 불러오는데 실패했습니다.
      </div>
    );
  }

  if (folderStructure.length === 0) {
    return (
      <div className="border border-gray-200 rounded-md p-2 max-h-60 overflow-y-auto bg-gray-50 text-gray-500 text-center flex justify-center items-center" style={{ minHeight: '100px' }}>
        <Folder className="w-5 h-5 mr-2" />
        표시할 폴더가 없습니다.
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-md p-2 max-h-60 overflow-y-auto bg-white">
      {folderStructure.map((item) => (
        <FileTreeItem
          key={item.path}
          item={item}
          onSelectFolder={onSelectFolder}
          selectedFolder={selectedFolder}
        />
      ))}
    </div>
  );
};


// 2. EnhancedFileUploadSection Props 제거 (템플릿 관련)
const EnhancedFileUploadSection = ({
  uploadedFiles,
  handleFileUpload,
  removeFile,
  updateFileAlias,
  onGitHubFilesLoaded,
  setUploadedFiles,
  onImportAnalysisSession
}) => {
  const [activeTab, setActiveTab] = useState('local');
  const [selectedFolder, setSelectedFolder] = useState('공통'); // 초기 폴더 설정
  const [isLoadingFiles, setIsLoadingFiles] = useState(false); // GitHub 파일 로딩 중 상태
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showGlobalResults, setShowGlobalResults] = useState(false);
  const [isFolderStructureLoading, setIsFolderStructureLoading] = useState(true); // 폴더 구조 자체 로딩 상태
  const [hasFolderLoadError, setHasFolderLoadError] = useState(false); // 폴더 구조 로딩 오류 상태
  const [folderTreeData, setFolderTreeData] = useState([]); // 폴더 트리 데이터 상태
  const [isDragging, setIsDragging] = useState(false);

  // 3. 상태 변수 제거 (템플릿 관련)
  const [isImportingSession, setIsImportingSession] = useState(false);
  const [notification, setNotification] = useState(null);
  const analysisFileInputRef = useRef(null);

  // 🆕 알림 표시 함수
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const excelFiles = files.filter(file =>
      file.name.toLowerCase().endsWith('.xls') ||
      file.name.toLowerCase().endsWith('.xlsx')
    );
    if (excelFiles.length > 0) {
      const event = { target: { files: excelFiles } };
      handleFileUpload(event);
    } else {
      alert('엑셀 파일(.xls, .xlsx)만 업로드 가능합니다.');
    }
  };

  // 🆕 분석기록 불러오기 함수
  const handleImportAnalysisFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImportingSession(true);
    try {
      const result = await importAnalysisSession(file);
      
      if (result.success) {
        onImportAnalysisSession(result.sessions);
        showNotification(result.message, 'success');
      } else {
        showNotification(result.message, 'error');
      }
    } catch (error) {
      showNotification('파일 불러오기 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsImportingSession(false);
      event.target.value = ''; // 파일 입력 초기화
    }
  };
  
  // 4. 불필요한 함수들 제거 (handleImportTemplateFile, handleExportTemplate)

  // 컴포넌트 마운트 시 폴더 구조를 비동기적으로 불러옴
  useEffect(() => {
    const fetchFolderStructure = async () => {
      setIsFolderStructureLoading(true);
      setHasFolderLoadError(false); // 새로운 로딩 시작 시 에러 상태 초기화
      try {
        const data = await loadFolderStructure();
        if (data) {
          setFolderTreeData(getFolderTree()); // 로드된 데이터로 트리 생성
          // 초기 selectedFolder가 유효한지 확인하고, 유효하지 않다면 첫 번째 루트 폴더로 설정
          const allFolderPaths = getFolderTree().map(item => item.path); // 루트 폴더 경로만 가져옴
          if (!allFolderPaths.includes(selectedFolder)) {
            if (allFolderPaths.length > 0) {
              setSelectedFolder(allFolderPaths[0]); // 첫 번째 루트 폴더로 설정
            } else {
              setSelectedFolder(''); // 폴더가 없을 경우 빈 문자열로 설정
            }
          }
        } else {
          setHasFolderLoadError(true); // 데이터 로드 실패 시 에러 상태 설정
          setFolderTreeData([]); // 데이터가 없으므로 빈 배열로 설정
          setSelectedFolder(''); // 폴더 선택도 초기화
        }
      } catch (error) {
        console.error("Error in fetching and setting folder structure:", error);
        setHasFolderLoadError(true);
        setFolderTreeData([]);
        setSelectedFolder('');
      } finally {
        setIsFolderStructureLoading(false);
      }
    };
    fetchFolderStructure();
  }, []); // 의존성 배열 비워 초기 1회만 실행

  const currentFolderFiles = useMemo(() => {
    if (isFolderStructureLoading || hasFolderLoadError) return [];
    return getFilesFromPath(selectedFolder) || [];
  }, [selectedFolder, isFolderStructureLoading, hasFolderLoadError]);

  const filteredFiles = useMemo(() => {
    if (isFolderStructureLoading || hasFolderLoadError) return [];
    if (!searchTerm.trim()) {
      return currentFolderFiles;
    }

    const searchLower = searchTerm.toLowerCase().trim();

    return currentFolderFiles.filter(filename => {
      const filenameLower = filename.toLowerCase();
      const sampleName = generateSampleName(filename).toLowerCase();
      const fileType = detectFileType(filename).toLowerCase();

      return filenameLower.includes(searchLower) ||
             sampleName.includes(searchLower) ||
             fileType.includes(searchLower);
    });
  }, [currentFolderFiles, searchTerm, isFolderStructureLoading, hasFolderLoadError]);

  // 샘플명 기준으로 파일을 그룹화하는 로직
  const groupedFilesBySampleName = useMemo(() => {
    if (isFolderStructureLoading || hasFolderLoadError) return new Map();
    const grouped = new Map();
    filteredFiles.forEach(filename => {
      const sampleName = generateSampleName(filename);
      if (!grouped.has(sampleName)) {
        grouped.set(sampleName, []);
      }
      grouped.get(sampleName).push(filename);
    });
    return grouped;
  }, [filteredFiles, isFolderStructureLoading, hasFolderLoadError]);

  const globalSearchResults = useMemo(() => {
    if (isFolderStructureLoading || hasFolderLoadError) return [];
    if (!searchTerm.trim()) return [];
    return searchFiles(searchTerm);
  }, [searchTerm, isFolderStructureLoading, hasFolderLoadError]);

  // 검색어 변경 시 Analytics 추적
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    if (value.trim()) {
      const results = searchFiles(value);
      trackSearch(value, results.length, 'github_files');
    }
  }, []);

  const loadFileFromGitHub = useCallback(async (filename, folder) => {
    const folderPath = folder.split('/').map(part => encodeURIComponent(part)).join('/');
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/excel/${folderPath}/${encodeURIComponent(filename)}`;

    const response = await fetch(rawUrl);

    if (!response.ok) {
      throw new Error(`파일을 불러올 수 없습니다: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const file = new File([arrayBuffer], filename, {
      type: 'application/vnd.ms-excel'
    });

    const fileInfo = {
      file,
      name: filename,
      type: detectFileType(filename),
      id: Date.now() + Math.random(),
      source: 'github',
      folder: folder,
      url: rawUrl,
      alias: generateSampleName(filename)
    };

    return fileInfo;
  }, [GITHUB_CONFIG.username, GITHUB_CONFIG.repo, GITHUB_CONFIG.branch]);

  // 향상된 GitHub 파일 로드 함수
  const loadSelectedFiles = async () => {
    if (selectedFiles.size === 0) {
      alert('불러올 파일을 선택해주세요.');
      return;
    }

    const startTime = performance.now();
    setIsLoadingFiles(true);
    const filesToLoad = Array.from(selectedFiles);
    const loadedFiles = [];

    try {
      for (const filename of filesToLoad) {
        try {
          const fileInfo = await loadFileFromGitHub(filename, selectedFolder);
          loadedFiles.push(fileInfo);
        } catch (error) {
          console.error(`파일 로드 실패: ${filename}`, error);
          trackError('github_load', error.message, filename);
          alert(`파일 '${filename}' 로드에 실패했습니다. 콘솔을 확인하세요.`);
        }
      }

      if (loadedFiles.length > 0) {
        onGitHubFilesLoaded(loadedFiles);
        
        trackGitHubLoad(selectedFolder, loadedFiles.length, performance.now() - startTime);
        trackPerformance('github_load', performance.now() - startTime, { 
          success_count: loadedFiles.length,
          total_count: filesToLoad.length 
        });
        
        alert(`${loadedFiles.length}개 파일을 성공적으로 불러왔습니다!`);
        setSelectedFiles(new Set()); // 성공적으로 불러왔으면 선택 상태 초기화
      } else {
        trackError('github_load', 'All files failed to load', selectedFolder);
        alert('선택한 파일 중 로드에 성공한 파일이 없습니다.');
      }
    } catch (error) {
      trackError('github_load', error.message, selectedFolder);
      throw error;
    } finally {
      setIsLoadingFiles(false);
    }
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

  const toggleSampleGroupSelection = useCallback((sampleName, filenamesInGroup) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      const allSelectedInGroup = filenamesInGroup.every(filename => newSet.has(filename));

      if (allSelectedInGroup) {
        filenamesInGroup.forEach(filename => newSet.delete(filename));
      } else {
        filenamesInGroup.forEach(filename => newSet.add(filename));
      }
      return newSet;
    });
  }, []);

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

  // 모든 불러온 파일 삭제 핸들러
  const handleClearAllFiles = () => {
    if (window.confirm('현재 불러온 모든 파일(' + uploadedFiles.length + '개)을 목록에서 삭제하시겠습니까?')) {
      setUploadedFiles([]); // 상위 컴포넌트의 상태 업데이트 함수 호출
      trackFeatureUsage('clear_all_uploaded_files', uploadedFiles.length); // Analytics 추적
    }
  };

  if (isFolderStructureLoading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg flex justify-center items-center" style={{ minHeight: '400px' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mr-3"></div>
        <span className="text-xl text-gray-600">파일 시스템 구조 로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg">
      <div className="flex items-center mb-4">
        <Upload className="w-8 h-8 text-blue-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-800">파일 불러오기</h2>
      </div>

      {/* 🆕 알림 메시지 */}
      {notification && (
        <div className={`mb-4 p-4 rounded-lg border ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' 
              ? <CheckCircle className="w-5 h-5 mr-2" />
              : <AlertTriangle className="w-5 h-5 mr-2" />
            }
            {notification.message}
          </div>
        </div>
      )}

      {/* 탭 메뉴 확장 */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('local')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'local'
              ? 'bg-white text-blue-600 shadow-sm'
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
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Github className="w-4 h-4 inline mr-2" />
          GitHub 파일
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'analysis'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Database className="w-4 h-4 inline mr-2" />
          분석기록
        </button>
      </div>

      {activeTab === 'local' && (
        <div>
          <p className="text-gray-600 mb-6">
            컴퓨터에서 엑셀 파일을 직접 업로드하세요
          </p>
          <input
            type="file"
            accept=".xls,.xlsx"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer flex items-center justify-center mb-4"
          >
            <Upload className="w-5 h-5 mr-2" />
            엑셀 파일 선택
          </label>
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
              w-full border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
              ${isDragging
                ? 'border-blue-500 bg-blue-50 scale-105'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
              }
            `}
          >
            <div className={`flex flex-col items-center space-y-3 ${isDragging ? 'text-blue-600' : 'text-gray-500'}`}>
              <Upload className={`w-12 h-12 ${isDragging ? 'animate-bounce' : ''}`} />
              <div className="space-y-1">
                <p className="text-lg font-medium">
                  {isDragging ? '파일을 놓아주세요!' : '파일을 여기로 드래그하세요'}
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

      {activeTab === 'github' && (
        <div>
          <p className="text-gray-600 mb-6">
            GitHub 저장소에서 엑셀 파일을 선택해서 불러오세요
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              폴더 선택:
            </label>
            <FileTree
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
                    파일 검색:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="파일명, 샘플명, 타입으로 검색..."
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <p className="text-blue-600">
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

              <div className={`transition-all duration-500 ease-in-out overflow-hidden ${searchTerm && showGlobalResults && !hasFolderLoadError ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                <h4 className="text-sm font-bold text-gray-800 mb-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                  🔍 전체 폴더 검색 결과 "{searchTerm}" ({globalSearchResults.length}개)
                </h4>
                {globalSearchResults.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-blue-200 rounded-lg p-3 bg-blue-50">
                    {globalSearchResults.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex items-center min-w-0">
                          <span className="text-lg mr-2 flex-shrink-0">{getFileTypeIcon(result.fileType)}</span>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-gray-800 truncate" title={result.filename}>{result.filename}</div>
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
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors flex-shrink-0"
                        >
                          폴더로 이동
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 bg-blue-50 border border-blue-200 rounded-lg">
                    검색어 "{searchTerm}"에 대한 파일이 전체 폴더에서 발견되지 않았습니다.
                  </div>
                )}
              </div>

              {!hasFolderLoadError && groupedFilesBySampleName.size > 0 ? (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">전체 선택</span>
                    </label>
                    <span className="text-sm text-blue-600 font-medium">
                      {selectedFiles.size}개 선택됨
                    </span>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {Array.from(groupedFilesBySampleName.entries()).map(([sampleName, filenamesInGroup]) => (
                      <div key={sampleName} className="border border-gray-100 rounded-lg shadow-sm bg-white overflow-hidden">
                        <div className="flex items-center justify-between p-3 bg-gray-100 border-b border-gray-200">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filenamesInGroup.every(filename => selectedFiles.has(filename))}
                              onChange={() => toggleSampleGroupSelection(sampleName, filenamesInGroup)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                            />
                            <span className="font-semibold text-sm text-gray-800">
                              샘플: {sampleName} ({filenamesInGroup.length}개 파일)
                            </span>
                          </label>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {filenamesInGroup.map((filename) => {
                            const fileType = detectFileType(filename);
                            const isSelected = selectedFiles.has(filename);
                            return (
                              <label key={filename} className={`flex items-center p-2 cursor-pointer transition-colors duration-150 ${
                                isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleFileSelection(filename)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                                />
                                <span className="text-lg mr-2">{getFileTypeIcon(fileType)}</span>
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-800">{filename}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                !hasFolderLoadError && (
                  <div className="mb-4 text-center py-8 text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                    📁 해당 폴더에 파일이 없습니다.
                  </div>
                )
              )}

              <button
                onClick={loadSelectedFiles}
                disabled={isLoadingFiles || selectedFiles.size === 0 || hasFolderLoadError}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
              >
                <Download className="w-5 h-5 mr-2" />
                {isLoadingFiles ? '불러오는 중...' : `선택한 ${selectedFiles.size}개 파일 불러오기`}
              </button>
            </div>
          )}

          {/* 5. 분석기록 탭 간소화 */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <p className="text-gray-600 mb-6">
                이전에 저장한 분석기록을 불러오세요
              </p>
              {/* 분석기록 불러오기만 */}
              <div className="border border-purple-200 rounded-lg p-6 bg-purple-50">
                <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                  <FileUp className="w-5 h-5 mr-2" />
                  분석기록 불러오기
                </h3>
                <p className="text-purple-700 mb-4 text-sm">
                  이전에 내보낸 분석기록 파일(.json)을 불러와서 세션을 복원합니다.
                </p>
                
                <input
                  ref={analysisFileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportAnalysisFile}
                  className="hidden"
                />
                
                <button
                  onClick={() => analysisFileInputRef.current?.click()}
                  disabled={isImportingSession}
                  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
                >
                  {isImportingSession ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      불러오는 중...
                    </>
                  ) : (
                    <>
                      <FileUp className="w-5 h-5 mr-2" />
                      분석기록 파일 선택
                    </>
                  )}
                </button>
              </div>
              {/* 간단한 사용 가이드 */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">📖 사용법</h3>
                <p className="text-sm text-gray-600">
                  이전에 "전체 세션 내보내기"로 저장한 JSON 파일을 선택하면 모든 분석 세션이 복원됩니다.
                </p>
              </div>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">불러온 파일들: ({uploadedFiles.length}개)</h3>
                <button
                  onClick={handleClearAllFiles}
                  className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors flex items-center justify-center group"
                  title="모든 파일 목록에서 삭제"
                >
                  <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="sr-only">모든 파일 삭제</span>
                </button>
              </div>
              <div className="space-y-3">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="flex items-start flex-1 min-w-0">
                        <span className="text-lg mr-2 flex-shrink-0">{getFileTypeIcon(file.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm truncate max-w-full" title={file.name}>
                              {file.name}
                           </span>
                         </div>
                         <div className="flex items-center space-x-2">
                           <span className={`inline-block px-2 py-1 text-xs rounded ${getFileTypeColor(file.type)}`}>
                             {file.type}
                           </span>
                           {file.source === 'github' && (
                             <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                               <Github className="w-3 h-3 inline mr-1" />
                               {file.folder}
                             </span>
                           )}
                         </div>
                       </div>
                     </div>
                     <button
                       onClick={() => removeFile(file.id)}
                       className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors flex-shrink-0"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600 whitespace-nowrap flex-shrink-0">샘플명:</label>
                      <input
                        type="text"
                        value={file.alias}
                        onChange={(e) => updateFileAlias(file.id, e.target.value)}
                        placeholder="샘플명 (예: IZO25nm, condition_A)"
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent min-w-0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    };

    // 6. HomePage 컴포넌트 Props 제거 (템플릿 관련)
    const HomePage = ({
      uploadedFiles,
      deviceParams,
      showParamInput,
      isAnalyzing,
      handleFileUpload: originalHandleFileUpload,
      removeFile,
      updateFileAlias,
      setShowParamInput,
      setDeviceParams,
      setUploadedFiles, // Added for clearing all files
      startAnalysis,
      handleGoToMainHome,
      handleGitHubFilesLoaded,
      parameterMode,
      setParameterMode,
      hasExistingSessions,
      currentSessionName,
      onImportAnalysisSession,
      setCurrentPage
    }) => {
      const [showFormulaInspector, setShowFormulaInspector] = useState(false);
      const [showAnalysisOptionsModal, setShowAnalysisOptionsModal] = useState(false);
      // TFTUsageGuide 모달 상태 추가 (기존 showUsageGuide와 별도로 관리)
      const [showUsageGuideModal, setShowUsageGuideModal] = useState(false);

      useEffect(() => {
        trackPageView('/tft-analyzer/home', 'TFT Analyzer - File Upload & Configuration');
        initializeSession();
      }, []);

      // 모달 열릴 때 body 스크롤 방지
      useEffect(() => {
        if (showUsageGuideModal) {
          const originalOverflow = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
      
          return () => {
            document.body.style.overflow = originalOverflow;
          };
        }
      }, [showUsageGuideModal]);

      // ESC 키로 모달 닫기
      useEffect(() => {
        const handleEscape = (event) => {
          if (event.key === 'Escape' && showUsageGuideModal) {
            setShowUsageGuideModal(false);
          }
        };
      
        document.addEventListener('keydown', handleEscape);
        return () => {
          document.removeEventListener('keydown', handleEscape);
        };
      }, [showUsageGuideModal]);


      const handleFileUpload = useCallback((event) => {
        const startTime = performance.now();
        const files = Array.from(event.target.files);
        
        try {
          originalHandleFileUpload(event);
          
          const fileTypes = files.map(file => detectFileType(file.name));
          const uniqueTypes = [...new Set(fileTypes)];
          
          trackFileUpload(uniqueTypes, files.length, 'local');
          
          const duration = performance.now() - startTime;
          const totalSize = files.reduce((sum, file) => sum + file.size, 0);
          trackPerformance('file_upload', duration, { file_size_mb: Math.round(totalSize / (1024 * 1024) * 100) / 100 });
          
        } catch (error) {
          trackError('file_upload', error.message);
          throw error;
        }
      }, [originalHandleFileUpload]);

      // 🆕 분석기록 불러오기 핸들러
      const handleImportAnalysisSession = (sessions) => {
        onImportAnalysisSession(sessions);
        // 불러온 후 바로 분석 결과 페이지로 이동
        setCurrentPage('analyzer');
      };

      // 7. 불필요한 핸들러 함수 제거 (handleImportTemplate)

      const handleStartAnalysisClick = () => {
        if (uploadedFiles.length === 0) {
          alert('먼저 엑셀 파일을 업로드해주세요.');
          return;
        }
        if (hasExistingSessions) {
          setShowAnalysisOptionsModal(true);
        } else {
          startAnalysis(false);
        }
      };

      const handleAnalysisOptionSelect = (overwrite) => {
        setShowAnalysisOptionsModal(false);
        startAnalysis(overwrite);
        trackFeatureUsage('analysis_start_option', overwrite ? 'overwrite_session' : 'new_session');
      };


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
              <h1 className="title-font text-5xl font-bold text-gray-800 mb-4">
                TFT Electrical Characterization Analyzer
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Probe Station 측정 데이터를 분석하여 TFT 파라미터를 자동으로 계산해 보세요!
              </p>
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-lg">
                <p className="text-lg font-semibold text-purple-800">🎯 통합 분석</p>
                <p className="text-sm text-purple-600">샘플명별로 데이터를 묶어서 정확한 TFT 특성을 계산합니다</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* 8. EnhancedFileUploadSection 호출부 수정 */}
              <EnhancedFileUploadSection
                uploadedFiles={uploadedFiles}
                handleFileUpload={handleFileUpload}
                removeFile={removeFile}
                updateFileAlias={updateFileAlias}
                onGitHubFilesLoaded={handleGitHubFilesLoaded}
                setUploadedFiles={setUploadedFiles}
                onImportAnalysisSession={handleImportAnalysisSession}
              />

              <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  <Star className="w-8 h-8 text-green-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">새로운 분석 방식</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <div className="flex items-start">
                    <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 min-w-6 flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">1</span>
                    <div>
                      <p className="font-bold text-gray-800 text-left">샘플명으로 그룹화</p>
                      <p className="text-sm">같은 샘플명의 파일들을 하나의 샘플로 인식</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 min-w-6 flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">2</span>
                    <div>
                      <p className="font-bold text-gray-800 text-left">다중 측정값 분석</p>
                      <p className="text-sm">Linear, Saturation, IDVD, Hysteresis 특성 추출</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 min-w-6 flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">3</span>
                    <div>
                      <p className="font-bold text-gray-800 text-left">통합 파라미터 계산</p>
                      <p className="text-sm">Vth, SS, μFE, Ion/Ioff, Ron 등 자동 산출</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 min-w-6 flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">4</span>
                    <div>
                      <p className="font-bold text-gray-800 text-left">품질 평가 및 검증</p>
                      <p className="text-sm">데이터 완성도와 신뢰도 자동 평가</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-yellow-800">📁 파일명 규칙</h4>
                    <button
                      onClick={() => setShowUsageGuideModal(true)}
                      className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1 rounded-lg text-xs font-medium flex items-center transition-all duration-200 border border-yellow-200 hover:border-yellow-300 shadow-sm"
                    >
                      <Info className="w-3 h-3 mr-1" />
                      📖 상세 사용법 보기
                    </button>
                  </div>
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

            <div className={`transition-all duration-500 ease-in-out ${showParamInput ? 'max-h-none opacity-100 mb-12' : 'max-h-0 opacity-0 overflow-hidden'}`}>
              <ParameterInputSection
                deviceParams={deviceParams}
                setDeviceParams={setDeviceParams}
                showParamInput={showParamInput}
                uploadedFiles={uploadedFiles}
                setUploadedFiles={setUploadedFiles}
                parameterMode={parameterMode}
                setParameterMode={setParameterMode}
              />
            </div>

            {showFormulaInspector && (
              <div className="mb-8">
                <FormulaCodeInspector />
              </div>
            )}
            {uploadedFiles.length > 0 && (
              <div className="text-center">
                <button
                  onClick={handleStartAnalysisClick}
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
                      통합 분석 시작 ({uploadedFiles.length}개 파일)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* 분석 옵션 선택 모달 */}
          {showAnalysisOptionsModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center transform transition-all duration-300 scale-100 opacity-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">분석 결과 저장 방식 선택</h3>
                <p className="text-gray-600 mb-8">
                  현재 업로드된 파일들로 새로운 분석을 시작하거나, 기존 세션에 결과를 덮어쓸 수 있습니다.
                </p>
                
                <div className="space-y-4">
                  <button
                    onClick={() => handleAnalysisOptionSelect(false)}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center shadow-md"
                  >
                    <PlusCircle className="w-5 h-5 mr-2" />
                    새로운 분석 세션으로 시작
                  </button>
                  {hasExistingSessions && currentSessionName && (
                    <button
                      onClick={() => handleAnalysisOptionSelect(true)}
                      className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center shadow-md"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      '{currentSessionName}' 세션에 덮어쓰기
                    </button>
                  )}
                  <button
                    onClick={() => setShowAnalysisOptionsModal(false)}
                    className="w-full bg-gray-300 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400 transition-colors flex items-center justify-center mt-4"
                  >
                    <X className="w-5 h-5 mr-2" />
                    취소
                  </button>
                </div>

                {hasExistingSessions && (
                  <p className="text-xs text-gray-500 mt-6">
                    <AlertTriangle className="w-4 h-4 inline-block mr-1 text-orange-500" />
                    **경고:** 기존 세션에 덮어쓰면 이전 결과는 복구할 수 없습니다.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TFT 사용법 모달 */}
          {showUsageGuideModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
                 onClick={(e) => {
                   if (e.target === e.currentTarget) {
                     setShowUsageGuideModal(false);
                   }
                 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 모달 헤더 */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Info className="w-6 h-6 mr-3" />
                      <h2 className="text-xl font-bold">TFT 분석기 사용 가이드</h2>
                    </div>
                    <button
                      onClick={() => setShowUsageGuideModal(false)}
                      className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/20 rounded-lg"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                      
                {/* 스크롤 가능한 컨텐츠 영역 */}
                <div className="overflow-y-auto p-6">
                  <TFTUsageGuide
                     showUsageGuide={true}
                     setShowUsageGuide={() => {}} // 모달에서는 사용하지 않음
                  />
                </div>
              </motion.div>
            </div>
          )}
        </div>
      );
    };

    export default HomePage;