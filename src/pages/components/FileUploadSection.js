// components/FileUploadSection.js
import React from 'react';
import { Upload, X } from 'lucide-react';

// 파일 타입별 아이콘 반환
const getFileTypeIcon = (fileType) => {
  switch (fileType) {
    case 'IDVD':
      return '📊';
    case 'IDVG-Linear':
      return '📈';
    case 'IDVG-Saturation':
      return '📉';
    case 'IDVG-Hysteresis':
      return '🔄';
    default:
      return '📄';
  }
};

// 파일 타입별 색상 반환
const getFileTypeColor = (fileType) => {
  switch (fileType) {
    case 'IDVD':
      return 'bg-purple-100 text-purple-800';
    case 'IDVG-Linear':
      return 'bg-blue-100 text-blue-800';
    case 'IDVG-Saturation':
      return 'bg-green-100 text-green-800';
    case 'IDVG-Hysteresis':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const FileUploadSection = ({ 
  uploadedFiles, 
  handleFileUpload, 
  removeFile, 
  updateFileAlias 
}) => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg">
      <div className="flex items-center mb-4">
        <Upload className="w-8 h-8 text-blue-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-800">파일 업로드</h2>
      </div>
      <p className="text-gray-600 mb-6">
        Probe Station에서 측정한 엑셀 파일들을 업로드하세요
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
                      <span className="font-medium text-sm">{file.name}</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${getFileTypeColor(file.type)}`}>
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
                    placeholder="샘플명 (예: 20nm, Sample A) - 같은 샘플명끼리 묶여서 분석됩니다"
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

export default FileUploadSection;