import React, { useState } from 'react';
import { Calculator, Upload, Database, Settings, FileText } from 'lucide-react';

// Cox 자동 계산 (εr_SiO2 = 3.9, ε0 = 8.854e-12 F/m)
const calculateCox = (tox) => {
  const epsilon_r = 3.9;
  const epsilon_0 = 8.854e-12;
  return (epsilon_r * epsilon_0) / tox;
};

const ParameterInputSection = ({ 
  deviceParams, 
  setDeviceParams, 
  showParamInput,
  uploadedFiles,
  setUploadedFiles // 파일별 파라미터 저장을 위해 추가
}) => {
  const [selectedMethod, setSelectedMethod] = useState('single');

  if (!showParamInput) return null;

  const methods = [
    {
      id: 'single',
      title: '단일 파라미터\n(전체 파일 적용)',
      icon: Calculator,
      description: '모든 파일에 동일한 파라미터 적용',
      disabled: false
    },
    {
      id: 'individual',
      title: '파일별 파라미\n터 입력',
      icon: Upload,
      description: '각 파일마다 개별 파라미터 설정',
      disabled: false // 이제 활성화!
    }
  ];

  const handleMethodSelect = (methodId) => {
    setSelectedMethod(methodId);
    
    // 파일별 파라미터 방식으로 변경할 때, 기존 파일들에 기본 파라미터 설정
    if (methodId === 'individual' && uploadedFiles) {
      const updatedFiles = uploadedFiles.map(file => ({
        ...file,
        individualParams: file.individualParams || {
          W: deviceParams.W,
          L: deviceParams.L,
          tox: deviceParams.tox,
          Cox: deviceParams.Cox
        }
      }));
      setUploadedFiles && setUploadedFiles(updatedFiles);
    }
  };

  // 개별 파일의 파라미터 업데이트
  const updateFileParameter = (fileId, paramName, value) => {
    if (!setUploadedFiles) return;
    
    const updatedFiles = uploadedFiles.map(file => {
      if (file.id === fileId) {
        const updatedParams = { ...file.individualParams };
        
        if (paramName === 'W') {
          updatedParams.W = parseFloat(value) * 1e-6;
        } else if (paramName === 'L') {
          updatedParams.L = parseFloat(value) * 1e-6;
        } else if (paramName === 'tox') {
          const newTox = parseFloat(value) * 1e-9;
          const newCox = calculateCox(newTox) * 1e-4;
          updatedParams.tox = newTox;
          updatedParams.Cox = newCox;
        }
        
        return {
          ...file,
          individualParams: updatedParams
        };
      }
      return file;
    });
    
    setUploadedFiles(updatedFiles);
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
    <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
      {/* 제목 */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">
          디바이스 파라미터 입력 방식:
        </h3>
      </div>

      {/* 방식 선택 카드들 */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {methods.map((method) => {
          const IconComponent = method.icon;
          return (
            <div
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                ${method.disabled ? 
                  'border-gray-200 cursor-not-allowed opacity-60 bg-gray-50' : 
                  selectedMethod === method.id ? 
                    'border-blue-500 bg-blue-50 shadow-md' : 
                    'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
                }
              `}
            >              
              <div className="flex flex-col items-center text-center">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center mb-3
                  ${method.disabled ? 'bg-gray-100' : 'bg-white shadow-lg'}
                `}>
                  <IconComponent className={`w-6 h-6 ${method.disabled ? 'text-gray-400' : 'text-blue-600'}`} />
                </div>
                
                <h4 className={`
                  text-sm font-bold mb-1 whitespace-pre-line
                  ${method.disabled ? 'text-gray-400' : 'text-gray-800'}
                `}>
                  {method.title}
                </h4>
                
                <p className={`
                  text-xs
                  ${method.disabled ? 'text-gray-400' : 'text-gray-600'}
                `}>
                  {method.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 단일 파라미터 입력 섹션 */}
      {selectedMethod === 'single' && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-center mb-4">
            <Database className="w-6 h-6 mr-2" />
            <h4 className="text-lg font-bold">디바이스 파라미터 입력</h4>
          </div>
          
          <p className="text-center text-sm mb-4 opacity-90">
            정확한 이동도(mobility) 계산을 위해 아래 파라미터들을 입력하세요.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
              <label className="block text-sm font-medium mb-2">
                채널 폭 (W) [μm]
              </label>
              <input
                type="number"
                value={Math.round(deviceParams.W * 1e6 * 10) / 10}
                onChange={(e) => {
                  const newW = parseFloat(e.target.value) * 1e-6;
                  setDeviceParams({...deviceParams, W: newW});
                }}
                className="w-full p-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="예: 100"
                max="10000"
                step="0.1"
              />
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
              <label className="block text-sm font-medium mb-2">
                채널 길이 (L) [μm]
              </label>
              <input
                type="number"
                value={Math.round(deviceParams.L * 1e6 * 10) / 10}
                onChange={(e) => {
                  const newL = parseFloat(e.target.value) * 1e-6;
                  setDeviceParams({...deviceParams, L: newL});
                }}
                className="w-full p-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="예: 50, 4200"
                max="10000"
                step="0.1"
              />
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
              <label className="block text-sm font-medium mb-2">
                산화막 두께 (tox) [nm]
              </label>
              <input
                type="number"
                value={Math.round(deviceParams.tox * 1e9 * 10) / 10}
                onChange={(e) => {
                  const newTox = parseFloat(e.target.value) * 1e-9;
                  const newCox = calculateCox(newTox) * 1e-4;
                  setDeviceParams({...deviceParams, tox: newTox, Cox: newCox});
                }}
                className="w-full p-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="예: 20, 60, 100"
                max="10000"
                step="0.1"
              />
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg">
            <p className="text-sm">
              <strong>계산된 Cox:</strong> {(calculateCox(deviceParams.tox) * 1e-4).toExponential(2)} F/cm²
            </p>
            <p className="text-xs mt-1 opacity-80">
              Cox는 tox 값으로부터 자동 계산됩니다 (SiO₂ 기준, εᵣ = 3.9)
            </p>
          </div>
        </div>
      )}

      {/* 파일별 개별 파라미터 입력 섹션 */}
      {selectedMethod === 'individual' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 p-4 rounded-xl text-white text-center">
            <div className="flex items-center justify-center mb-2">
              <Settings className="w-6 h-6 mr-2" />
              <h4 className="text-lg font-bold">업로드된 파일별 개별 파라미터 설정</h4>
            </div>
            <p className="text-sm opacity-90">
              현재 업로드된 각 파일마다 서로 다른 디바이스 파라미터를 개별적으로 설정하세요
            </p>
          </div>

          {uploadedFiles && uploadedFiles.length > 0 ? (
            <div className="space-y-4">
              <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>💡 안내:</strong> 업로드된 {uploadedFiles.length}개 파일 각각에 대해 개별 파라미터를 설정할 수 있습니다. 
                  같은 샘플명이라도 파일마다 다른 파라미터를 적용할 수 있습니다.
                </p>
              </div>

              {uploadedFiles.map((file, index) => {
                const params = file.individualParams || deviceParams;
                return (
                  <div key={file.id} className="border-2 border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                    {/* 파일 정보 헤더 */}
                    <div className="flex items-center mb-4 pb-3 border-b-2 border-gray-100">
                      <div className="flex items-center bg-gray-100 rounded-full px-3 py-1 mr-4">
                        <span className="text-sm font-bold text-gray-600">#{index + 1}</span>
                      </div>
                      <span className="text-lg mr-3">{getFileTypeIcon(file.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <FileText className="w-4 h-4 text-gray-600" />
                          <span className="font-bold text-gray-800">{file.name}</span>
                          <span className={`px-2 py-1 text-xs rounded font-medium ${getFileTypeColor(file.type)}`}>
                            {file.type}
                          </span>
                          {file.source === 'github' && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                              GitHub: {file.folder}
                            </span>
                          )}
                        </div>
                        {file.alias && (
                          <p className="text-sm text-gray-600">
                            📝 샘플명: <strong className="text-blue-600">{file.alias}</strong>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 파라미터 입력 그리드 */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <label className="block text-sm font-bold text-blue-800 mb-2">
                          📏 채널 폭 (W) [μm]
                        </label>
                        <input
                          type="number"
                          value={Math.round(params.W * 1e6 * 10) / 10}
                          onChange={(e) => updateFileParameter(file.id, 'W', e.target.value)}
                          className="w-full p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-medium"
                          placeholder="예: 100"
                          max="10000"
                          step="0.1"
                        />
                      </div>
                      
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <label className="block text-sm font-bold text-green-800 mb-2">
                          📐 채널 길이 (L) [μm]
                        </label>
                        <input
                          type="number"
                          value={Math.round(params.L * 1e6 * 10) / 10}
                          onChange={(e) => updateFileParameter(file.id, 'L', e.target.value)}
                          className="w-full p-2 border border-green-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center font-medium"
                          placeholder="예: 50, 4200"
                          max="10000"
                          step="0.1"
                        />
                      </div>
                      
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <label className="block text-sm font-bold text-purple-800 mb-2">
                          🔬 산화막 두께 (tox) [nm]
                        </label>
                        <input
                          type="number"
                          value={Math.round(params.tox * 1e9 * 10) / 10}
                          onChange={(e) => updateFileParameter(file.id, 'tox', e.target.value)}
                          className="w-full p-2 border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center font-medium"
                          placeholder="예: 20, 60, 100"
                          max="10000"
                          step="0.1"
                        />
                      </div>
                    </div>

                    {/* Cox 계산 결과 */}
                    <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-gray-800">
                        ⚡ <strong>자동 계산된 Cox:</strong> 
                        <span className="text-blue-600 font-mono ml-2">
                          {(calculateCox(params.tox) * 1e-4).toExponential(2)} F/cm²
                        </span>
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        SiO₂ 기준 (εᵣ = 3.9) 자동 계산
                      </p>
                    </div>
                  </div>
                );
              })}

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  ✅ <strong>설정 완료:</strong> {uploadedFiles.length}개 파일의 개별 파라미터가 설정되었습니다. 
                  이제 각 파일마다 고유한 디바이스 특성으로 분석이 진행됩니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">
                📂 먼저 파일을 업로드해주세요
              </p>
              <p className="text-sm text-gray-500 mt-2">
                파일을 업로드하면 각 파일별로 개별 디바이스 파라미터를 설정할 수 있습니다
              </p>
            </div>
          )}
        </div>
      )}

      {/* 안내 메시지 */}
      {!selectedMethod && (
        <div className="text-center p-6 bg-gray-50 rounded-xl">
          <p className="text-gray-600">
            위에서 파라미터 입력 방식을 선택해주세요
          </p>
        </div>
      )}
    </div>
  );
};

export default ParameterInputSection;