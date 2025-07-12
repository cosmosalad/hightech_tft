// FileRenamer.js
// 다중 파일의 이름을 일괄적으로 변경하는 유틸리티

/**
 * 🔧 File Renamer 유틸리티
 * 
 * 📖 기능:
 * - 일괄 파일명 변경
 * - 선택적 파일명 변경
 * - 접두사/접미사 추가
 * - TFT 측정 타입 접미사 자동 추가
 * - 원본 파일 다운로드 지원
 */

/**
 * TFT 측정 타입 접미사 정의
 */
export const TFT_SUFFIXES = {
  IDVD: '_IDVD',
  IDVG_LINEAR: '_IDVG_Linear',
  IDVG_SATURATION: '_IDVG_Saturation', 
  IDVG_HYSTERESIS: '_IDVG_Linear_Hysteresis'
};

/**
 * 파일 정보 객체 생성
 * @param {File} file - 원본 파일
 * @param {number} index - 파일 인덱스
 * @returns {Object} 파일 정보 객체
 */
export const createFileInfo = (file, index) => {
  const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
  const extension = file.name.substring(file.name.lastIndexOf('.'));
  
  return {
    id: `file_${index}_${Date.now()}`,
    originalFile: file,
    originalName: file.name,
    nameWithoutExt,
    extension,
    newName: file.name,
    selected: false,
    size: file.size,
    lastModified: file.lastModified
  };
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
 * 안전한 파일명 생성 (특수문자 제거)
 * @param {string} fileName - 원본 파일명
 * @returns {string} 안전한 파일명
 */
export const createSafeFileName = (fileName) => {
  return fileName.replace(/[<>:"/\\|?*]/g, '_');
};

/**
 * 일괄 이름 변경 적용
 * @param {Array} files - 파일 정보 배열
 * @param {Object} options - 변경 옵션
 * @returns {Array} 업데이트된 파일 정보 배열
 */
export const applyBulkRename = (files, options) => {
  const { 
    prefix = '', 
    suffix = '', 
    newBaseName = '',
    selectedOnly = false,
    replaceOriginal = false,
    addTftSuffix = null
  } = options;

  return files.map(file => {
    // 선택된 파일만 처리하는 경우
    if (selectedOnly && !file.selected) {
      return file;
    }

    let newNameWithoutExt;
    
    if (replaceOriginal && newBaseName.trim()) {
      // 완전히 새로운 이름으로 교체
      newNameWithoutExt = newBaseName.trim();
    } else {
      // 기존 이름 기반으로 수정
      newNameWithoutExt = file.nameWithoutExt;
    }

    // 접두사 추가
    if (prefix.trim()) {
      newNameWithoutExt = prefix.trim() + newNameWithoutExt;
    }

    // 접미사 추가
    if (suffix.trim()) {
      newNameWithoutExt = newNameWithoutExt + suffix.trim();
    }

    // TFT 접미사 추가
    if (addTftSuffix && TFT_SUFFIXES[addTftSuffix]) {
      newNameWithoutExt = newNameWithoutExt + TFT_SUFFIXES[addTftSuffix];
    }

    // 안전한 파일명으로 변환
    const safeName = createSafeFileName(newNameWithoutExt);
    const newName = safeName + file.extension;

    return {
      ...file,
      newName
    };
  });
};

/**
 * 일괄 번호 매기기 적용
 * @param {Array} files - 파일 정보 배열
 * @param {Object} options - 번호 매기기 옵션
 * @returns {Array} 업데이트된 파일 정보 배열
 */
export const applyNumbering = (files, options) => {
  const { 
    startNumber = 1, 
    numberFormat = '###',
    position = 'suffix',
    selectedOnly = false,
    separator = '_'
  } = options;

  let counter = startNumber;
  
  return files.map(file => {
    // 선택된 파일만 처리하는 경우
    if (selectedOnly && !file.selected) {
      return file;
    }

    // 번호 포맷팅
    let formattedNumber;
    if (numberFormat === '###') {
      formattedNumber = counter.toString().padStart(3, '0'); // 001, 002, 003
    } else if (numberFormat === '##') {
      formattedNumber = counter.toString().padStart(2, '0'); // 01, 02, 03
    } else if (numberFormat === '#') {
      formattedNumber = counter.toString(); // 1, 2, 3
    } else {
      formattedNumber = counter.toString();
    }

    let newNameWithoutExt = file.nameWithoutExt;

    // 번호 위치에 따라 추가
    if (position === 'prefix') {
      newNameWithoutExt = formattedNumber + separator + newNameWithoutExt;
    } else {
      newNameWithoutExt = newNameWithoutExt + separator + formattedNumber;
    }

    const safeName = createSafeFileName(newNameWithoutExt);
    const newName = safeName + file.extension;

    counter++;

    return {
      ...file,
      newName
    };
  });
};

/**
 * 개별 파일명 변경
 * @param {Array} files - 파일 정보 배열  
 * @param {string} fileId - 변경할 파일 ID
 * @param {string} newName - 새로운 파일명 (확장자 포함)
 * @returns {Array} 업데이트된 파일 정보 배열
 */
export const updateSingleFileName = (files, fileId, newName) => {
  return files.map(file => {
    if (file.id === fileId) {
      return {
        ...file,
        newName: createSafeFileName(newName)
      };
    }
    return file;
  });
};

/**
 * 파일 선택 상태 토글
 * @param {Array} files - 파일 정보 배열
 * @param {string} fileId - 토글할 파일 ID
 * @returns {Array} 업데이트된 파일 정보 배열
 */
export const toggleFileSelection = (files, fileId) => {
  return files.map(file => {
    if (file.id === fileId) {
      return {
        ...file,
        selected: !file.selected
      };
    }
    return file;
  });
};

/**
 * 모든 파일 선택/해제
 * @param {Array} files - 파일 정보 배열
 * @param {boolean} selectAll - 전체 선택 여부
 * @returns {Array} 업데이트된 파일 정보 배열
 */
export const toggleAllFileSelection = (files, selectAll) => {
  return files.map(file => ({
    ...file,
    selected: selectAll
  }));
};

/**
 * 선택된 파일들 삭제
 * @param {Array} files - 파일 정보 배열
 * @returns {Array} 필터링된 파일 정보 배열
 */
export const removeSelectedFiles = (files) => {
  return files.filter(file => !file.selected);
};

/**
 * 변경된 파일들을 ZIP으로 다운로드
 * @param {Array} files - 파일 정보 배열
 * @param {string} zipFileName - ZIP 파일명
 */
export const downloadRenamedFiles = async (files, zipFileName = 'renamed_files.zip') => {
  try {
    // JSZip 라이브러리가 필요 (실제 프로젝트에서는 npm install jszip 필요)
    // 여기서는 개별 파일 다운로드로 구현
    
    const renamedFiles = files.filter(file => file.newName !== file.originalName);
    
    if (renamedFiles.length === 0) {
      throw new Error('변경된 파일이 없습니다.');
    }

    // 개별 파일 다운로드 (실제로는 ZIP으로 구현 권장)
    for (const file of renamedFiles) {
      await downloadSingleRenamedFile(file);
      // 브라우저 다운로드 제한을 위한 지연
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return {
      success: true,
      message: `${renamedFiles.length}개 파일이 다운로드되었습니다.`
    };

  } catch (error) {
    console.error('파일 다운로드 오류:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 개별 파일 다운로드 (이름 변경된)
 * @param {Object} fileInfo - 파일 정보 객체
 */
export const downloadSingleRenamedFile = async (fileInfo) => {
  try {
    const url = URL.createObjectURL(fileInfo.originalFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileInfo.newName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error(`파일 "${fileInfo.originalName}" 다운로드 오류:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * 파일명 중복 검사
 * @param {Array} files - 파일 정보 배열
 * @returns {Array} 중복된 파일명 배열
 */
export const checkDuplicateNames = (files) => {
  const nameCount = {};
  const duplicates = [];

  files.forEach(file => {
    const name = file.newName.toLowerCase();
    nameCount[name] = (nameCount[name] || 0) + 1;
  });

  Object.keys(nameCount).forEach(name => {
    if (nameCount[name] > 1) {
      duplicates.push(name);
    }
  });

  return duplicates;
};

/**
 * 파일명 유효성 검사
 * @param {string} fileName - 검사할 파일명
 * @returns {Object} 검사 결과
 */
export const validateFileName = (fileName) => {
  const invalidChars = /[<>:"/\\|?*]/;
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  
  const errors = [];
  
  if (!fileName.trim()) {
    errors.push('파일명이 비어있습니다.');
  }
  
  if (invalidChars.test(fileName)) {
    errors.push('사용할 수 없는 문자가 포함되어 있습니다: < > : " / \\ | ? *');
  }
  
  if (reservedNames.includes(fileName.toUpperCase().split('.')[0])) {
    errors.push('예약된 파일명입니다.');
  }
  
  if (fileName.length > 255) {
    errors.push('파일명이 너무 깁니다. (최대 255자)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};