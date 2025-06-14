import React, { useState } from 'react';
import { ArrowRight, Star, Calculator, Play, Home, Upload, Github, X } from 'lucide-react';
import ParameterInputSection from './ParameterInputSection';
import FormulaCodeInspector from './FormulaCodeInspector';

// Enhanced FileUploadSection with GitHub integration
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

  // GitHub 기본 설정 - 실제 GitHub 정보로 변경하세요
  const GITHUB_CONFIG = {
    username: 'cosmosalad',
    repo: 'hightech_tft',
    branch: 'main'
  };

  // 폴더별 파일 목록
  const FOLDER_FILES = {
    '공통': [
      '0614_IDVG_Linear_0sccm_300.xls',
      '0614_IDVG_Linear_0sccm_350.xls',
      '0614_IDVG_Linear_1sccm_0.xls',
      '0614_IDVG_Linear_1sccm_50.xls',
      '0614_IDVG_Linear_1sccm_100.xls',
      '0614_IDVG_Linear_1sccm_150.xls',
      '0614_IDVG_Linear_1sccm_200.xls',
      '0614_IDVG_Linear_1sccm_300.xls'
    ],
    '1조': []
  };

  // 파일 타입 감지
  const detectFileType = (filename) => {
    const name = filename.toLowerCase();
    
    if (name.includes('idvd')) {
      return 'IDVD';
    }
    
    if (name.includes('idvg') && 
        (name.includes('linear') || name.includes('lin')) && 
        (name.includes('hys') || name.includes('hysteresis'))) {
      return 'IDVG-Hysteresis';
    }
    
    if (name.includes('idvg') && 
        (name.includes('linear') || name.includes('lin'))) {
      return 'IDVG-Linear';
    }
    
    if (name.includes('idvg') && 
        (name.includes('sat') || name.includes('saturation'))) {
      return 'IDVG-Saturation';
    }
    
    return 'Unknown';
  };

  // 샘플명 자동 생성
  const generateSampleName = (filename) => {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    const parts = nameWithoutExt.split('_');
    if (parts.length >= 4) {
      const conditions = parts.slice(3).join('_');
      return conditions;
    }
    return nameWithoutExt;
  };

  // GitHub에서 파일 다운로드
  const loadFileFromGitHub = async (filename, folder) => {
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/excel/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`;
    
    try {
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

      if (onGitHubFilesLoaded) {
        onGitHubFilesLoaded([fileInfo]);
      }
      
      return fileInfo;
    } catch (error) {
      console.error(`GitHub 파일 로드 오류 (${filename}):`, error);
      throw error;
    }
  };

  // 전체 폴더 로드
  const loadAllFilesInFolder = async () => {
    const files = FOLDER_FILES[selectedFolder] || [];
    if (files.length === 0) {
      alert('해당 폴더에 파일이 없습니다.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      for (const filename of files) {
        await loadFileFromGitHub(filename, selectedFolder);
      }
      alert(`${files.length}개 파일을 성공적으로 불러왔습니다!`);
    } catch (error) {
      alert(`파일 로드 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 파일 타입별 아이콘
  const getFileTypeIcon = (fileType) => {
    switch (fileType) {
      case 'IDVD': return '📊';
      case 'IDVG-Linear': return '📈';
      case 'IDVG-Saturation': return '📉';
      case 'IDVG-Hysteresis': return '🔄';
      default: return '📄';
    }
  };

  // 파일 타입별 색상
  const getFileTypeColor = (fileType) => {
    switch (fileType) {
      case 'IDVD': return 'bg-purple-100 text-purple-800';
      case 'IDVG-Linear': return 'bg-blue-100 text-blue-800';
      case 'IDVG-Saturation': return 'bg-green-100 text-green-800';
      case 'IDVG-Hysteresis': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
            GitHub 저장소에서 엑셀 파일을 불러오세요
          </p>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              폴더 선택:
            </label>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="공통">📁 공통</option>
              <option value="1조">📁 1조</option>
            </select>
          </div>

          <button
            onClick={loadAllFilesInFolder}
            disabled={isLoading || !FOLDER_FILES[selectedFolder]?.length}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
          >
            <Github className="w-5 h-5 mr-2" />
            {isLoading ? '불러오는 중...' : `📁 ${selectedFolder} 폴더 전체 파일 불러오기`}
          </button>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-700">
              <p><strong>📁 {selectedFolder} 폴더 파일 목록:</strong></p>
              <ul className="mt-2 list-disc list-inside">
                {FOLDER_FILES[selectedFolder]?.map((filename) => (
                  <li key={filename} className="text-xs">{filename}</li>
                )) || <li className="text-xs text-gray-500">파일이 없습니다.</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* 업로드된 파일 목록 */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3">업로드된 파일:</h3>
          <div className="space-y-3">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{getFileTypeIcon(file.type)}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{file.name}</span>
                        {file.source === 'github' && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                            <Github className="w-3 h-3 inline mr-1" />
                            {file.folder}
                          </span>
                        )}
                      </div>
                      <span className={`inline-block mt-1 px-2 py-1 text-xs rounded ${getFileTypeColor(file.type)}`}>
                        {file.type}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap">샘플명:</label>
                  <input
                    type="text"
                    value={file.alias}
                    onChange={(e) => updateFileAlias(file.id, e.target.value)}
                    placeholder="샘플명 (예: 0sccm_300, 1sccm_100) - 같은 샘플명끼리 묶여서 분석됩니다"
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
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
            <p className="text-lg font-semibold text-purple-800">🎯 완벽한 통합 분석</p>
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
        />

        {/* 수식 및 코드 점검 컴포넌트 */}
        {showFormulaInspector && (
          <div className="mb-8">
            <FormulaCodeInspector />
          </div>
        )}

        <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🔬 통합 분석의 장점</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 text-blue-800">기존 방식의 문제점</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>• 단일 측정: SS 영역 선택 부정확</li>
                <li>• 기존 θ: 고정값 사용으로 μeff 부정확</li>
                <li>• 각각 독립적 계산으로 일관성 부족</li>
                <li>• 실제 물리적 연관성 무시</li>
              </ul>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 text-green-800">통합 분석의 해결책</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>• ✅ Linear → 정확한 Vth, gm_max, SS</li>
                <li>• ✅ Y-function → 정확한 μ0</li>
                <li>• ✅ 실제 θ 값 계산으로 정확한 μeff</li>
                <li>• ✅ 물리적으로 일관된 결과</li>
              </ul>
            </div>
          </div>
        </div>

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
                  완벽한 통합 분석 시작
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