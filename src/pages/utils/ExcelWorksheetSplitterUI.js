// ExcelWorksheetSplitterUI.js
import React, { useState, useCallback } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  X,
  FileDown,
  Package,
  Info
} from 'lucide-react';
import {
  parseExcelFile,
  downloadSingleWorksheet,
  downloadAllWorksheets,
  formatFileSize,
  generateWorksheetPreview,
  validateExcelFile
} from './ExcelWorksheetSplitter';

const ExcelWorksheetSplitterUI = ({ isOpen, onClose }) => {
  const [file, setFile] = useState(null);
  const [workbookData, setWorkbookData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [previewSheet, setPreviewSheet] = useState(null);
  const [error, setError] = useState(null);
  const [includeOriginalName, setIncludeOriginalName] = useState(true); // 새로 추가

  // 파일 업로드 처리
  const handleFileUpload = useCallback(async (uploadedFile) => {
    setError(null);
    setWorkbookData(null);
    
    // 파일 유효성 검사
    const validation = validateExcelFile(uploadedFile);
    if (!validation.isValid) {
      setError(validation.errors.join(' '));
      return;
    }

    setFile(uploadedFile);
    setIsProcessing(true);

    try {
      const result = await parseExcelFile(uploadedFile);
      
      if (result.success) {
        setWorkbookData(result);
      } else {
        setError(`파일 처리 중 오류가 발생했습니다: ${result.error}`);
      }
    } catch (err) {
      setError(`예상치 못한 오류가 발생했습니다: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // 드래그 앤 드롭 처리
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileUpload(droppedFile);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  // 개별 워크시트 다운로드
  const handleSingleDownload = (sheetName) => {
    try {
      const result = downloadSingleWorksheet(workbookData.workbook, sheetName, workbookData.fileName, includeOriginalName);
      if (!result.success) {
        setError(`다운로드 실패: ${result.error}`);
      }
    } catch (err) {
      setError(`다운로드 중 오류: ${err.message}`);
    }
  };

  // 전체 워크시트 일괄 다운로드
  const handleBulkDownload = async () => {
    setDownloadProgress({ current: 0, total: workbookData.worksheetInfo.length, progress: 0 });
    
    try {
      const results = await downloadAllWorksheets(
        workbookData.workbook,
        workbookData.fileName,
        (progress) => setDownloadProgress(progress),
        includeOriginalName
      );
      
      const failedDownloads = results.filter(r => !r.success);
      if (failedDownloads.length > 0) {
        setError(`일부 파일 다운로드 실패: ${failedDownloads.map(f => f.sheetName).join(', ')}`);
      }
    } catch (err) {
      setError(`일괄 다운로드 중 오류: ${err.message}`);
    } finally {
      setDownloadProgress(null);
    }
  };

  // 워크시트 미리보기
  const showPreview = (sheetName) => {
    const worksheet = workbookData.workbook.Sheets[sheetName];
    const previewData = generateWorksheetPreview(worksheet);
    setPreviewSheet({ name: sheetName, data: previewData });
  };

  // 초기화
  const handleReset = () => {
    setFile(null);
    setWorkbookData(null);
    setPreviewSheet(null);
    setError(null);
    setDownloadProgress(null);
    setIncludeOriginalName(true); // 토글도 초기화
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileSpreadsheet className="w-8 h-8 mr-3" />
              <div>
                <h2 className="text-2xl font-bold">엑셀 워크시트 분할기</h2>
                <p className="text-green-100 mt-1">각 워크시트를 개별 파일로 분할합니다</p>
              </div>
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
          {/* 파일 업로드 영역 */}
          {!workbookData && (
            <div className="mb-8">
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 hover:bg-green-50/30 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg cursor-pointer group"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div className="flex flex-col items-center">
                  <Upload className="w-12 h-12 text-gray-400 mb-4 group-hover:text-green-500 group-hover:scale-110 transition-all duration-300" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2 group-hover:text-green-700 transition-colors">
                    엑셀 파일을 업로드하세요
                  </h3>
                  <p className="text-gray-500 mb-4 group-hover:text-gray-600 transition-colors">
                    파일을 드래그하여 놓거나 클릭하여 선택하세요
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.xlsm"
                    onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transform hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
                  >
                    파일 선택
                  </label>
                  <p className="text-xs text-gray-400 mt-2">
                    지원 형식: .xlsx, .xls, .xlsm (최대 50MB)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 로딩 상태 */}
          {isProcessing && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-500 mr-3" />
              <span className="text-lg text-gray-600">파일을 분석 중입니다...</span>
            </div>
          )}

          {/* 오류 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* 워크북 정보 및 워크시트 목록 */}
          {workbookData && (
            <div className="space-y-6">
              {/* 파일 정보 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-green-800">파일 정보</h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleReset}
                      className="flex items-center text-green-600 hover:text-green-800 text-sm font-medium bg-white px-3 py-1.5 rounded-md border border-green-200 hover:border-green-300 transition-all duration-300 hover:shadow-md"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      다른 파일 선택
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">파일명:</span>
                    <p className="font-medium">{workbookData.fileName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">워크시트 수:</span>
                    <p className="font-medium">{workbookData.totalSheets}개</p>
                  </div>
                  <div>
                    <span className="text-gray-600">파일 크기:</span>
                    <p className="font-medium">{formatFileSize(file.size)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">파일 형식:</span>
                    <p className="font-medium">{file.name.split('.').pop().toUpperCase()}</p>
                  </div>
                </div>
              </div>

              {/* 파일명 옵션 토글 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-bold text-blue-800 mb-3">📝 파일명 설정</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium mb-1">
                      {includeOriginalName ? '원본파일명_워크시트명.xlsx' : '워크시트명.xlsx'}
                    </p>
                    <p className="text-xs text-blue-600">
                      {includeOriginalName 
                        ? `예: ${workbookData.fileName.replace(/\.[^/.]+$/, '')}_Sheet1.xlsx`
                        : '예: Sheet1.xlsx'
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => setIncludeOriginalName(!includeOriginalName)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      includeOriginalName ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        includeOriginalName ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  토글을 눌러 파일명 형식을 변경할 수 있습니다
                </p>
              </div>

              {/* 일괄 다운로드 버튼 */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">워크시트 목록</h3>
                <button
                  onClick={handleBulkDownload}
                  disabled={downloadProgress}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center"
                >
                  <Package className="w-4 h-4 mr-2" />
                  전체 다운로드
                </button>
              </div>

              {/* 다운로드 진행률 */}
              {downloadProgress && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-800 font-medium">다운로드 중...</span>
                    <span className="text-blue-600">{downloadProgress.progress}%</span>
                  </div>
                  <div className="bg-blue-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-blue-600">
                    {downloadProgress.current}/{downloadProgress.total} - {downloadProgress.currentSheet}
                  </p>
                </div>
              )}

              {/* 워크시트 목록 */}
              <div className="grid gap-4">
                {workbookData.worksheetInfo.map((sheet, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-1">{sheet.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{sheet.rowCount}행</span>
                          <span>{sheet.colCount}열</span>
                          <span className={`flex items-center ${sheet.hasData ? 'text-green-600' : 'text-gray-400'}`}>
                            {sheet.hasData ? <CheckCircle className="w-4 h-4 mr-1" /> : <Info className="w-4 h-4 mr-1" />}
                            {sheet.hasData ? '데이터 있음' : '빈 시트'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => showPreview(sheet.name)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="미리보기"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSingleDownload(sheet.name)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="다운로드"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 미리보기 모달 */}
          {previewSheet && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
                <div className="bg-gray-100 p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">미리보기: {previewSheet.name}</h3>
                    <button
                      onClick={() => setPreviewSheet(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-4 overflow-auto max-h-[60vh]">
                  {previewSheet.data.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 text-sm">
                        <tbody>
                          {previewSheet.data.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className="border border-gray-300 px-2 py-1 max-w-[150px] truncate"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      데이터가 없거나 미리보기를 생성할 수 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 사용 안내 */}
          <div className="mt-8 p-6 bg-gray-50 rounded-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">사용 안내</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">📋 지원 형식</h4>
                <ul className="space-y-1">
                  <li>• Excel 2007 이상 (.xlsx)</li>
                  <li>• Excel 97-2003 (.xls)</li>
                  <li>• Excel 매크로 파일 (.xlsm)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">🔧 기능</h4>
                <ul className="space-y-1">
                  <li>• 각 워크시트를 개별 파일로 분할</li>
                  <li>• 워크시트 이름으로 파일명 생성</li>
                  <li>• 원본 데이터 형식 완전 보존</li>
                  <li>• 일괄 다운로드 지원</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelWorksheetSplitterUI;