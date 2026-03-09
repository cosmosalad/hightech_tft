import * as XLSX from 'xlsx';

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

export const createSingleWorksheetFile = (workbook, sheetName, originalFileName) => {
  try {
    const newWorkbook = XLSX.utils.book_new();
    
    const originalWorksheet = workbook.Sheets[sheetName];
    const newWorksheet = Object.assign({}, originalWorksheet);
    
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName);
    
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

export const createSafeFileName = (sheetName, originalFileName, includeOriginalName = true) => {
  const safeName = sheetName.replace(/[<>:"/\\|?*]/g, '_');
  
  if (includeOriginalName) {
    const baseName = originalFileName.replace(/\.[^/.]+$/, '');
    return `${baseName}_${safeName}.xlsx`;
  } else {
    return `${safeName}.xlsx`;
  }
};

export const downloadSingleWorksheet = (workbook, sheetName, originalFileName, includeOriginalName = true) => {
  try {
    const blob = createSingleWorksheetFile(workbook, sheetName, originalFileName);
    const fileName = createSafeFileName(sheetName, originalFileName, includeOriginalName);
    
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

export const downloadAllWorksheets = async (workbook, originalFileName, onProgress, includeOriginalName = true) => {
  const results = [];
  const sheetNames = workbook.SheetNames;
  
  for (let i = 0; i < sheetNames.length; i++) {
    const sheetName = sheetNames[i];
    
    try {
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

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

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

export const validateExcelFile = (file) => {
  const validExtensions = ['.xlsx', '.xls', '.xlsm'];
  const validMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.ms-excel.sheet.macroEnabled.12'
  ];
  
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  const hasValidExtension = validExtensions.includes(fileExtension);
  
  const hasValidMimeType = validMimeTypes.includes(file.type);
  
  const maxSize = 50 * 1024 * 1024;
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