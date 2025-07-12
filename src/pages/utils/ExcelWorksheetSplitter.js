// ExcelWorksheetSplitter.js
// 엑셀 파일의 각 워크시트를 개별 파일로 분할하는 유틸리티

import * as XLSX from 'xlsx';

/**
 * 🔧 Excel Worksheet Splitter 유틸리티
 * 
 * 📖 기능:
 * - 단일 엑셀 파일에서 각 워크시트를 개별 파일로 분할
 * - 워크시트 이름을 파일명으로 사용
 * - 원본 데이터 형식 보존
 * - 일괄 다운로드 지원
 */

/**
 * 엑셀 파일을 읽고 워크시트 정보를 추출하는 함수
 * @param {File} file - 업로드된 엑셀 파일
 * @returns {Promise<Object>} 워크북 정보와 워크시트 목록
 */
export const parseExcelFile = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, {
      cellStyles: true,
      cellFormulas: true,
      cellDates: true,
      cellNF: true,
      sheetStubs: true
    });

    const worksheetInfo = workbook.SheetNames.map(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const rowCount = range.e.r - range.s.r + 1;
      const colCount = range.e.c - range.s.c + 1;
      
      return {
        name: sheetName,
        rowCount,
        colCount,
        hasData: rowCount > 1 || colCount > 1
      };
    });

    return {
      success: true,
      workbook,
      worksheetInfo,
      totalSheets: workbook.SheetNames.length,
      fileName: file.name
    };

  } catch (error) {
    console.error('Excel 파일 파싱 오류:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 개별 워크시트를 엑셀 파일로 변환하는 함수
 * @param {Object} workbook - 원본 워크북
 * @param {string} sheetName - 추출할 워크시트 이름
 * @param {string} originalFileName - 원본 파일명
 * @returns {Blob} 생성된 엑셀 파일 Blob
 */
export const createSingleWorksheetFile = (workbook, sheetName, originalFileName) => {
  try {
    // 새 워크북 생성
    const newWorkbook = XLSX.utils.book_new();
    
    // 원본 워크시트 복사
    const originalWorksheet = workbook.Sheets[sheetName];
    const newWorksheet = Object.assign({}, originalWorksheet);
    
    // 새 워크북에 워크시트 추가
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName);
    
    // 엑셀 파일로 변환
    const excelBuffer = XLSX.write(newWorkbook, {
      bookType: 'xlsx',
      type: 'array',
      cellStyles: true,
      cellFormulas: true,
      cellDates: true
    });
    
    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

  } catch (error) {
    console.error(`워크시트 "${sheetName}" 생성 오류:`, error);
    throw error;
  }
};

/**
 * 안전한 파일명 생성 함수
 * @param {string} sheetName - 워크시트 이름
 * @param {string} originalFileName - 원본 파일명
 * @param {boolean} includeOriginalName - 원본 파일명 포함 여부
 * @returns {string} 안전한 파일명
 */
export const createSafeFileName = (sheetName, originalFileName, includeOriginalName = true) => {
  // 파일명에 사용할 수 없는 문자 제거
  const safeName = sheetName.replace(/[<>:"/\\|?*]/g, '_');
  
  if (includeOriginalName) {
    // 원본 파일명에서 확장자 제거
    const baseName = originalFileName.replace(/\.[^/.]+$/, '');
    return `${baseName}_${safeName}.xlsx`;
  } else {
    // 워크시트 이름만 사용
    return `${safeName}.xlsx`;
  }
};

/**
 * 개별 워크시트 파일 다운로드 함수
 * @param {Object} workbook - 워크북
 * @param {string} sheetName - 워크시트 이름
 * @param {string} originalFileName - 원본 파일명
 * @param {boolean} includeOriginalName - 원본 파일명 포함 여부
 */
export const downloadSingleWorksheet = (workbook, sheetName, originalFileName, includeOriginalName = true) => {
  try {
    const blob = createSingleWorksheetFile(workbook, sheetName, originalFileName);
    const fileName = createSafeFileName(sheetName, originalFileName, includeOriginalName);
    
    // 다운로드 링크 생성
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return { success: true, fileName };

  } catch (error) {
    console.error('워크시트 다운로드 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 모든 워크시트를 개별 파일로 일괄 다운로드하는 함수
 * @param {Object} workbook - 워크북
 * @param {string} originalFileName - 원본 파일명
 * @param {Function} onProgress - 진행률 콜백 함수
 * @param {boolean} includeOriginalName - 원본 파일명 포함 여부
 */
export const downloadAllWorksheets = async (workbook, originalFileName, onProgress, includeOriginalName = true) => {
  const results = [];
  const sheetNames = workbook.SheetNames;
  
  for (let i = 0; i < sheetNames.length; i++) {
    const sheetName = sheetNames[i];
    
    try {
      // 진행률 업데이트
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: sheetNames.length,
          currentSheet: sheetName,
          progress: Math.round(((i + 1) / sheetNames.length) * 100)
        });
      }
      
      const result = downloadSingleWorksheet(workbook, sheetName, originalFileName, includeOriginalName);
      results.push({
        sheetName,
        ...result
      });
      
      // 브라우저가 다운로드를 처리할 시간을 주기 위해 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`워크시트 "${sheetName}" 처리 오류:`, error);
      results.push({
        sheetName,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
};

/**
 * 파일 크기를 사람이 읽기 쉬운 형태로 변환
 * @param {number} bytes - 바이트 수
 * @returns {string} 포맷된 파일 크기
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 워크시트 데이터 미리보기 생성
 * @param {Object} worksheet - 워크시트 객체
 * @param {number} maxRows - 최대 행 수 (기본값: 5)
 * @param {number} maxCols - 최대 열 수 (기본값: 10)
 * @returns {Array} 미리보기 데이터 배열
 */
export const generateWorksheetPreview = (worksheet, maxRows = 5, maxCols = 10) => {
  try {
    if (!worksheet['!ref']) {
      return [];
    }
    
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const previewData = [];
    
    const endRow = Math.min(range.s.r + maxRows - 1, range.e.r);
    const endCol = Math.min(range.s.c + maxCols - 1, range.e.c);
    
    for (let row = range.s.r; row <= endRow; row++) {
      const rowData = [];
      for (let col = range.s.c; col <= endCol; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        rowData.push(cell ? cell.v : '');
      }
      previewData.push(rowData);
    }
    
    return previewData;

  } catch (error) {
    console.error('워크시트 미리보기 생성 오류:', error);
    return [];
  }
};

/**
 * 엑셀 파일 유효성 검사
 * @param {File} file - 업로드된 파일
 * @returns {Object} 검사 결과
 */
export const validateExcelFile = (file) => {
  const validExtensions = ['.xlsx', '.xls', '.xlsm'];
  const validMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.ms-excel.sheet.macroEnabled.12'
  ];
  
  // 파일 확장자 검사
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  const hasValidExtension = validExtensions.includes(fileExtension);
  
  // MIME 타입 검사
  const hasValidMimeType = validMimeTypes.includes(file.type);
  
  // 파일 크기 검사 (최대 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  const isValidSize = file.size <= maxSize;
  
  return {
    isValid: hasValidExtension && isValidSize,
    hasValidExtension,
    hasValidMimeType,
    isValidSize,
    fileSize: file.size,
    fileExtension,
    mimeType: file.type,
    errors: [
      !hasValidExtension && '지원되지 않는 파일 형식입니다. (.xlsx, .xls, .xlsm 파일만 지원)',
      !isValidSize && '파일 크기가 너무 큽니다. (최대 50MB)',
    ].filter(Boolean)
  };
};