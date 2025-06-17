// HomePage.js
import React, { useState, useMemo } from 'react';
import {
  ArrowRight, Star, Calculator, Play, Home, Upload, Github, X, Download,
  CheckCircle, AlertTriangle, Search, Folder, FolderOpen, FileText
} from 'lucide-react';
import ParameterInputSection from './ParameterInputSection';
import FormulaCodeInspector from './FormulaCodeInspector';

// 설정 파일에서 import
import {
  GITHUB_CONFIG,
  getFilesFromPath,
  searchFiles,
  detectFileType,
  generateSampleName,
  getFileTypeIcon,
  getFileTypeColor,
  getFolderTree
} from './fileConfig';

// --- FileTreeItem Component ---
const FileTreeItem = ({ item, level = 0, onSelectFolder, selectedFolder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false); // 툴팁 가시성 상태

  const isFolder = item.type === 'folder';

  const indentStyle = { paddingLeft: `${level * 20}px` };

  const handleFolderClick = () => {
    setIsOpen(!isOpen);
    if (isFolder) {
      onSelectFolder(item.path);
    }
  };

  return (
    <div className="relative"> {/* 툴팁을 위해 relative position 추가 */}
      {isFolder && (
        <div
          className={`flex items-center cursor-pointer py-1 px-2 rounded hover:bg-gray-100 ${selectedFolder === item.path ? 'bg-blue-100 text-blue-800' : ''}`}
          style={indentStyle}
          onClick={handleFolderClick}
          onMouseEnter={() => item.description && setShowTooltip(true)} // 설명이 있을 때만 툴팁 표시
          onMouseLeave={() => setShowTooltip(false)}
        >
          {isOpen ? <FolderOpen className="w-4 h-4 mr-2 text-blue-600" /> : <Folder className="w-4 h-4 mr-2 text-gray-500" />}
          <span className="font-medium text-sm">{item.name}</span>
        </div>
      )}

      {/* 폴더 설명 툴팁 */}
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
const FileTree = ({ folderStructure, onSelectFolder, selectedFolder }) => {
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


// EnhancedFileUploadSection Component
const EnhancedFileUploadSection = ({
  uploadedFiles,
  handleFileUpload,
  removeFile,
  updateFileAlias,
  onGitHubFilesLoaded
}) => {
  const [activeTab, setActiveTab] = useState('local');
  const [selectedFolder, setSelectedFolder] = useState('공통');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showGlobalResults, setShowGlobalResults] = useState(false);

  const folderTreeData = useMemo(() => getFolderTree(), []);

  const currentFolderFiles = useMemo(() => {
    return getFilesFromPath(selectedFolder) || [];
  }, [selectedFolder]);

  const filteredFiles = useMemo(() => {
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
  }, [currentFolderFiles, searchTerm]);

  const globalSearchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return searchFiles(searchTerm);
  }, [searchTerm]);

  const loadFileFromGitHub = async (filename, folder) => {
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
  };

  const loadSelectedFiles = async () => {
    if (selectedFiles.size === 0) {
      alert('불러올 파일을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    const filesToLoad = Array.from(selectedFiles);
    const loadedFiles = [];

    try {
      for (const filename of filesToLoad) {
        try {
          const fileInfo = await loadFileFromGitHub(filename, selectedFolder);
          loadedFiles.push(fileInfo);
        } catch (error) {
          console.error(`파일 로드 실패: ${filename}`, error);
        }
      }

      if (loadedFiles.length > 0) {
        onGitHubFilesLoaded(loadedFiles);
        alert(`${loadedFiles.length}개 파일을 성공적으로 불러왔습니다!`);
        setSelectedFiles(new Set());
      } else {
        alert('파일 로드에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
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

  const toggleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length && filteredFiles.length > 0) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles));
    }
  };

  const handleFolderChange = (folder) => {
    setSelectedFolder(folder);
    setSelectedFiles(new Set());
    setSearchTerm('');
    setShowGlobalResults(false);
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg">
      <div className="flex items-center mb-4">
        <Upload className="w-8 h-8 text-blue-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-800">파일 불러오기</h2>
      </div>

      {/* 탭 선택 */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('local')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
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
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'github'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Github className="w-4 h-4 inline mr-2" />
          GitHub 파일
        </button>
      </div>

      {/* 로컬 파일 업로드 */}
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
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer flex items-center justify-center"
          >
            <Upload className="w-5 h-5 mr-2" />
            엑셀 파일 선택
          </label>
        </div>
      )}

      {/* GitHub 파일 불러오기 */}
      {activeTab === 'github' && (
        <div>
          <p className="text-gray-600 mb-6">
            GitHub 저장소에서 엑셀 파일을 선택해서 불러오세요
          </p>

          {/* Folder Tree Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              폴더 선택:
            </label>
            <FileTree
              folderStructure={folderTreeData}
              onSelectFolder={handleFolderChange}
              selectedFiles={selectedFiles}
              toggleFileSelection={toggleFileSelection}
              selectedFolder={selectedFolder}
            />
          </div>

          {/* 🔍 검색창 추가 */}
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="파일명, 샘플명, 타입으로 검색..."
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
                {/* 검색 결과 수 표시 */}
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
              {/* 🔍 전역 검색 결과 표시 컴포넌트 - UI 개선 */}
              {searchTerm && showGlobalResults && (
                <div className="mb-4">
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
                              setSelectedFolder(result.folderPath);
                              setShowGlobalResults(false);
                              setSearchTerm('');
                              setSelectedFiles(new Set()); // 폴더 이동 시 기존 파일 선택 초기화
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
              )}
              {/* 파일 선택 영역 - 이제 filteredFiles는 선택된 폴더의 파일 + 검색어 필터링 결과입니다. */}
              {filteredFiles.length > 0 ? (
            <div className="mb-4">
              {/* 전체 선택 및 선택 개수 */}
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

              {/* 파일 목록 */}
              <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                {filteredFiles.map((filename) => {
                  const fileType = detectFileType(filename);
                  const sampleName = generateSampleName(filename);
                  const isSelected = selectedFiles.has(filename);

                  return (
                    <label key={filename} className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-100 border border-blue-300' : 'bg-white hover:bg-gray-50 border border-gray-200'
                    }`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleFileSelection(filename)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-lg ml-3 mr-2">{getFileTypeIcon(fileType)}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-800">{filename}</div>
                        <div className="text-xs text-gray-500">
                          샘플명: <strong>{sampleName}</strong>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mb-4 text-center py-8 text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
              📁 해당 폴더에 파일이 없습니다.
            </div>
          )}

          {/* 불러오기 버튼 (단일 버튼) */}
          <button
            onClick={loadSelectedFiles}
            disabled={isLoading || selectedFiles.size === 0}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
          >
            <Download className="w-5 h-5 mr-2" />
            {isLoading ? '불러오는 중...' : `선택한 ${selectedFiles.size}개 파일 불러오기`}
          </button>
        </div>
      )}

      {/* 불러온 파일 목록 */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3">불러온 파일들:</h3>
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
  setUploadedFiles,
  startAnalysis,
  handleGoToMainHome,
  handleGitHubFilesLoaded
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
            <p className="text-lg font-semibold text-purple-800">🎯 통합 분석</p>
            <p className="text-sm text-purple-600">샘플명별로 데이터를 묶어서 정확한 TFT 특성을 계산합니다</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <EnhancedFileUploadSection
            uploadedFiles={uploadedFiles}
            handleFileUpload={handleFileUpload}
            removeFile={removeFile}
            updateFileAlias={updateFileAlias}
            onGitHubFilesLoaded={handleGitHubFilesLoaded}
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
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
        />

        {/* 수식 및 코드 점검 컴포넌트 */}
        {showFormulaInspector && (
          <div className="mb-8">
            <FormulaCodeInspector />
          </div>
        )}
        
        {/* 통합 분석 시작 버튼 */}
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
                  통합 분석 시작 ({uploadedFiles.length}개 파일)
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