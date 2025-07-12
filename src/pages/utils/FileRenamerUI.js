// FileRenamerUI.js
import React, { useState, useCallback, useEffect } from 'react';
import { 
  Upload, 
  File, 
  Download, 
  Edit3, 
  CheckCircle, 
  Square, 
  AlertCircle, 
  X,
  FileDown,
  Package,
  RotateCcw,
  Plus,
  Type,
  Tag
} from 'lucide-react';
import {
  createFileInfo,
  formatFileSize,
  applyBulkRename,
  applyNumbering,
  removeSelectedFiles,
  updateSingleFileName,
  toggleFileSelection,
  toggleAllFileSelection,
  downloadRenamedFiles,
  downloadSingleRenamedFile,
  checkDuplicateNames,
  validateFileName,
  TFT_SUFFIXES
} from './FileRenamer';

const FileRenamerUI = ({ isOpen, onClose }) => {
  const [files, setFiles] = useState([]);
  const [bulkOptions, setBulkOptions] = useState({
    prefix: '',
    suffix: '',
    newBaseName: '',
    selectedOnly: false,
    replaceOriginal: false,
    addTftSuffix: null
  });
  const [numberingOptions, setNumberingOptions] = useState({
    startNumber: 1,
    numberFormat: '###',
    position: 'suffix',
    selectedOnly: false,
    separator: '_'
  });
  const [editingFile, setEditingFile] = useState(null);
  const [tempName, setTempName] = useState('');
  const [activeTab, setActiveTab] = useState('numbering');
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);

  // 모달이 열릴 때 배경 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 파일 업로드 처리
  const handleFileUpload = useCallback((uploadedFiles) => {
    const fileArray = Array.from(uploadedFiles);
    const newFiles = fileArray.map((file, index) => createFileInfo(file, files.length + index));
    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
  }, [files.length]);

  // 드래그 앤 드롭 처리
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileUpload(droppedFiles);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  // 일괄 번호 매기기 적용
  const handleNumbering = () => {
    try {
      const updatedFiles = applyNumbering(files, numberingOptions);
      setFiles(updatedFiles);
      
      const duplicates = checkDuplicateNames(updatedFiles);
      if (duplicates.length > 0) {
        setError(`중복된 파일명이 있습니다: ${duplicates.join(', ')}`);
      } else {
        setError(null);
      }
    } catch (err) {
      setError(`번호 매기기 중 오류: ${err.message}`);
    }
  };

  // 선택된 파일들 삭제
  const handleDeleteSelected = () => {
    const selectedCount = files.filter(file => file.selected).length;
    
    if (selectedCount === 0) {
      setError('삭제할 파일을 선택해주세요.');
      return;
    }

    if (window.confirm(`선택된 ${selectedCount}개 파일을 목록에서 제거하시겠습니까?`)) {
      setFiles(removeSelectedFiles(files));
      setError(null);
    }
  };

  // 텍스트/태그 변경 적용
  const handleBulkRename = () => {
    try {
      const updatedFiles = applyBulkRename(files, bulkOptions);
      setFiles(updatedFiles);
      
      const duplicates = checkDuplicateNames(updatedFiles);
      if (duplicates.length > 0) {
        setError(`중복된 파일명이 있습니다: ${duplicates.join(', ')}`);
      } else {
        setError(null);
      }
    } catch (err) {
      setError(`이름 변경 중 오류: ${err.message}`);
    }
  };
  
  // 오른쪽 패널의 '적용' 버튼 통합 핸들러
  const handleApplyChanges = () => {
    if (activeTab === 'numbering') {
      handleNumbering();
    } else { // 'text' 또는 'tft' 탭
      handleBulkRename();
    }
  };

  // 개별 파일명 편집 시작
  const startEditing = (file) => {
    setEditingFile(file.id);
    setTempName(file.newName);
  };

  // 개별 파일명 편집 완료
  const finishEditing = () => {
    if (editingFile && tempName.trim()) {
      const validation = validateFileName(tempName);
      if (validation.isValid) {
        setFiles(updateSingleFileName(files, editingFile, tempName.trim()));
        setEditingFile(null);
        setTempName('');
        setError(null);
      } else {
        setError(validation.errors.join(' '));
      }
    } else {
      setEditingFile(null);
      setTempName('');
    }
  };

  // 파일 선택 토글
  const handleFileToggle = (fileId) => {
    setFiles(toggleFileSelection(files, fileId));
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    const allSelected = files.every(file => file.selected);
    setFiles(toggleAllFileSelection(files, !allSelected));
  };

  // TFT 접미사 추가
  const handleTftSuffix = (suffixType) => {
    setBulkOptions(prev => ({
      ...prev,
      addTftSuffix: suffixType
    }));
  };

  // 다운로드 처리
  const handleDownload = async (single = null) => {
    setIsDownloading(true);
    try {
      if (single) {
        await downloadSingleRenamedFile(single);
      } else {
        const result = await downloadRenamedFiles(files);
        if (!result.success) {
          setError(result.error);
        }
      }
    } catch (err) {
      setError(`다운로드 중 오류: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // 초기화
  const handleReset = () => {
    setFiles([]);
    setBulkOptions({
      prefix: '',
      suffix: '',
      newBaseName: '',
      selectedOnly: false,
      replaceOriginal: false,
      addTftSuffix: null
    });
    setEditingFile(null);
    setTempName('');
    setError(null);
  };

  if (!isOpen) return null;

  const selectedCount = files.filter(file => file.selected).length;
  const changedCount = files.filter(file => file.newName !== file.originalName).length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Edit3 className="w-8 h-8 mr-3" />
              <div>
                <h2 className="text-2xl font-bold">파일명 일괄 변경</h2>
                <p className="text-blue-100 mt-1">여러 파일의 이름을 한 번에 변경하세요</p>
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

        <div className="flex h-[calc(90vh-120px)]">
          {/* 왼쪽: 파일 업로드 및 목록 */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-gray-200">
            {/* 파일 업로드 영역 */}
            {files.length === 0 ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg cursor-pointer group"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <Upload className="w-12 h-12 text-gray-400 mb-4 group-hover:text-blue-500 group-hover:scale-110 transition-all duration-300 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2 group-hover:text-blue-700 transition-colors">
                  파일들을 업로드하세요
                </h3>
                <p className="text-gray-500 mb-4 group-hover:text-gray-600 transition-colors">
                  파일을 드래그하여 놓거나 클릭하여 선택하세요
                </p>
                <input
                  type="file"
                  multiple
                  onChange={(e) => e.target.files.length > 0 && handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transform hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
                >
                  파일 선택
                </label>
              </div>
            ) : (
              <>
                {/* 파일 목록 헤더 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-bold text-gray-800">
                      파일 목록 ({files.length}개)
                    </h3>
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {files.every(file => file.selected) ? (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      ) : (
                        <Square className="w-4 h-4 mr-1" />
                      )}
                      전체 선택
                    </button>
                    {selectedCount > 0 && (
                      <span className="text-sm text-gray-600">
                        {selectedCount}개 선택됨
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => e.target.files.length > 0 && handleFileUpload(e.target.files)}
                      className="hidden"
                      id="add-files"
                    />
                    <label
                      htmlFor="add-files"
                      className="flex items-center text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-200 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      파일 추가
                    </label>
                    <button
                      onClick={handleReset}
                      className="flex items-center text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      초기화
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      disabled={selectedCount === 0}
                      className="flex items-center text-sm bg-red-100 text-red-700 px-3 py-1.5 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4 mr-1" />
                      선택 삭제 ({selectedCount})
                    </button>
                  </div>
                </div>

                {/* 파일 현황 & 다운로드 - 왼쪽 */}
                <div className="mb-4 bg-gradient-to-r from-slate-50 to-gray-100 p-4 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    📊 파일 현황
                  </h4>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                      <div className="text-xl font-bold text-blue-700">{files.length}</div>
                      <div className="text-xs text-blue-600 font-medium">전체 파일</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-200 shadow-sm">
                      <div className="text-xl font-bold text-green-700">{selectedCount}</div>
                      <div className="text-xs text-green-600 font-medium">선택됨</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-orange-200 shadow-sm">
                      <div className="text-xl font-bold text-orange-700">{changedCount}</div>
                      <div className="text-xs text-orange-600 font-medium">변경됨</div>
                    </div>
                  </div>
                  
                  {/* 다운로드 버튼 */}
                  {changedCount > 0 && (
                    <button
                      onClick={() => handleDownload()}
                      disabled={isDownloading}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center shadow-lg hover:shadow-xl text-sm"
                    >
                      {isDownloading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          다운로드 중...
                        </>
                      ) : (
                        <>
                          <Package className="w-4 h-4 mr-2" />
                          💾 다운로드 ({changedCount}개)
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* 파일 목록 */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleFileToggle(file.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {file.selected ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                        
                        <File className="w-5 h-5 text-gray-400" />
                        
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-600 mb-1">
                            원본: {file.originalName}
                          </div>
                          
                          {editingFile === file.id ? (
                            <input
                              type="text"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              onBlur={finishEditing}
                              onKeyPress={(e) => e.key === 'Enter' && finishEditing()}
                              className="w-full text-sm font-medium bg-blue-50 border border-blue-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                          ) : (
                            <div
                              onClick={() => startEditing(file)}
                              className={`text-sm font-medium cursor-pointer hover:bg-gray-50 px-2 py-1 rounded ${
                                file.newName !== file.originalName ? 'text-green-700 bg-green-50' : 'text-gray-800'
                              }`}
                            >
                              변경 후: {file.newName}
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleDownload(file)}
                          disabled={isDownloading}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="개별 다운로드"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 오른쪽: 이름 변경 옵션 */}
          {files.length > 0 && (
            <div className="w-80 p-4 bg-gray-50 overflow-y-auto flex flex-col">
              <div>
                <h3 className="text-base font-bold text-gray-800 mb-4 text-center">📝 파일명 변경 도구</h3>
                
                {/* 탭 메뉴 */}
                <div className="mb-4">
                  <div className="flex bg-gray-200 rounded-lg p-1">
                    <button
                      onClick={() => setActiveTab('numbering')}
                      className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all duration-200 ${
                        activeTab === 'numbering'
                          ? 'bg-white text-gray-800 shadow-md'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      🔢 번호
                    </button>
                    <button
                      onClick={() => setActiveTab('text')}
                      className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all duration-200 ${
                        activeTab === 'text'
                          ? 'bg-white text-gray-800 shadow-md'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      📝 텍스트
                    </button>
                    <button
                      onClick={() => setActiveTab('tft')}
                      className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all duration-200 ${
                        activeTab === 'tft'
                          ? 'bg-white text-gray-800 shadow-md'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      🔬 TFT
                    </button>
                  </div>
                </div>

                {/* 번호 매기기 탭 */}
                {activeTab === 'numbering' && (
                  <div className="bg-white p-3 rounded-xl border border-gray-200 mb-4">
                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                      🔢 자동 번호 매기기
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">🎯 시작 번호</label>
                          <input
                            type="number"
                            value={numberingOptions.startNumber}
                            onChange={(e) => setNumberingOptions(prev => ({ ...prev, startNumber: parseInt(e.target.value) || 1 }))}
                            min="0"
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">📊 번호 모양</label>
                          <select
                            value={numberingOptions.numberFormat}
                            onChange={(e) => setNumberingOptions(prev => ({ ...prev, numberFormat: e.target.value }))}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="###">001, 002, 003</option>
                            <option value="##">01, 02, 03</option>
                            <option value="#">1, 2, 3</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">📍 번호 위치</label>
                          <select
                            value={numberingOptions.position}
                            onChange={(e) => setNumberingOptions(prev => ({ ...prev, position: e.target.value }))}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="suffix">📄이름_001</option>
                            <option value="prefix">001_📄이름</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">🔗 연결 문자</label>
                          <input
                            type="text"
                            value={numberingOptions.separator}
                            onChange={(e) => setNumberingOptions(prev => ({ ...prev, separator: e.target.value }))}
                            placeholder="_"
                            maxLength={3}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="bg-blue-50 p-2 rounded-lg">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={numberingOptions.selectedOnly}
                            onChange={(e) => setNumberingOptions(prev => ({ ...prev, selectedOnly: e.target.checked }))}
                            className="w-3 h-3 text-blue-600 rounded"
                          />
                          <span className="ml-2 text-xs text-gray-700">✅ 선택된 파일만 번호 매기기</span>
                        </label>
                      </div>

                      <div className="bg-gray-100 p-2 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">📋 미리보기:</p>
                        <p className="text-xs font-mono bg-white p-1.5 rounded border">
                          파일이름{numberingOptions.separator}{numberingOptions.numberFormat.replace(/#/g, '0')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 텍스트 수정 탭 */}
                {activeTab === 'text' && (
                  <div className="bg-white p-3 rounded-xl border border-gray-200 mb-4">
                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                      📝 텍스트 추가/변경
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="text-blue-500 mr-1">⬅️</span>
                          앞에 추가할 텍스트
                        </label>
                        <input
                          type="text"
                          value={bulkOptions.prefix}
                          onChange={(e) => setBulkOptions(prev => ({ ...prev, prefix: e.target.value }))}
                          placeholder="예: NEW_, 2024_, 실험_"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">결과: <span className="font-mono bg-gray-100 px-1">접두사파일이름.확장자</span></p>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="text-green-500 mr-1">➡️</span>
                          뒤에 추가할 텍스트
                        </label>
                        <input
                          type="text"
                          value={bulkOptions.suffix}
                          onChange={(e) => setBulkOptions(prev => ({ ...prev, suffix: e.target.value }))}
                          placeholder="예: _완료, _백업, _수정본"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">결과: <span className="font-mono bg-gray-100 px-1">파일이름접미사.확장자</span></p>
                      </div>

                      <div className="border-t pt-3">
                        <label className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            checked={bulkOptions.replaceOriginal}
                            onChange={(e) => setBulkOptions(prev => ({ ...prev, replaceOriginal: e.target.checked }))}
                            className="w-3 h-3 text-red-600 rounded"
                          />
                          <span className="ml-2 text-xs font-medium text-gray-700">🔄 완전히 새로운 이름으로 바꾸기</span>
                        </label>
                        {bulkOptions.replaceOriginal && (
                          <div>
                            <input
                              type="text"
                              value={bulkOptions.newBaseName}
                              onChange={(e) => setBulkOptions(prev => ({ ...prev, newBaseName: e.target.value }))}
                              placeholder="새로운 파일 이름 (기존 이름 완전 대체)"
                              className="w-full px-2 py-1.5 text-xs border border-red-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                            />
                            <p className="text-xs text-red-500 mt-1">⚠️ 모든 파일이 같은 이름으로 변경됩니다</p>
                          </div>
                        )}
                      </div>

                      <div className="bg-green-50 p-2 rounded-lg">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={bulkOptions.selectedOnly}
                            onChange={(e) => setBulkOptions(prev => ({ ...prev, selectedOnly: e.target.checked }))}
                            className="w-3 h-3 text-green-600 rounded"
                          />
                          <span className="ml-2 text-xs text-gray-700">✅ 선택된 파일만 변경하기</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* TFT 태그 탭 */}
                {activeTab === 'tft' && (
                  <div className="bg-white p-3 rounded-xl border border-gray-200 mb-4">
                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                      🔬 TFT 측정 태그 추가
                    </h4>
                    
                    <p className="text-xs text-gray-600 mb-3">📋 파일명 뒤에 측정 타입을 자동으로 추가합니다</p>
                    
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(TFT_SUFFIXES).map(([key, suffix]) => (
                        <button
                          key={key}
                          onClick={() => handleTftSuffix(key)}
                          className={`text-left px-3 py-2 rounded-lg text-xs transition-all duration-200 border-2 ${
                            bulkOptions.addTftSuffix === key
                              ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-md'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">{suffix}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {key === 'IDVD' && '드레인 전압-전류 특성'}
                            {key === 'IDVG_LINEAR' && '선형 영역 게이트 특성'}
                            {key === 'IDVG_SATURATION' && '포화 영역 게이트 특성'}
                            {key === 'IDVG_HYSTERESIS' && '히스테리시스 특성'}
                          </div>
                        </button>
                      ))}
                      
                      {bulkOptions.addTftSuffix && (
                        <button
                          onClick={() => setBulkOptions(prev => ({ ...prev, addTftSuffix: null }))}
                          className="text-left px-3 py-2 rounded-lg text-xs bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 hover:border-red-300 transition-all duration-200"
                        >
                          <div className="font-medium">❌ 태그 제거</div>
                          <div className="text-xs text-red-500 mt-1">선택된 TFT 태그를 제거합니다</div>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* 하단 통합 액션 버튼 */}
              <div className="mt-auto pt-3">
                  <button
                    onClick={handleApplyChanges}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2.5 px-3 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center text-sm"
                  >
                    ⚙️ 변경사항 적용
                  </button>
              </div>

            </div>
          )}
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="p-4 bg-red-50 border-t border-red-200">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileRenamerUI;