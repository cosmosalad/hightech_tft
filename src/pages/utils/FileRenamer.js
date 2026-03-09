export const TFT_SUFFIXES = {
  IDVD: '_IDVD',
  IDVG_LINEAR: '_IDVG_Linear',
  IDVG_SATURATION: '_IDVG_Saturation', 
  IDVG_HYSTERESIS: '_IDVG_Linear_Hysteresis'
};

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

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const createSafeFileName = (fileName) => {
  return fileName.replace(/[<>:"/\\|?*]/g, '_');
};

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
    if (selectedOnly && !file.selected) {
      return file;
    }

    let newNameWithoutExt;
    
    if (replaceOriginal && newBaseName.trim()) {
      newNameWithoutExt = newBaseName.trim();
    } else {
      newNameWithoutExt = file.nameWithoutExt;
    }

    if (prefix.trim()) {
      newNameWithoutExt = prefix.trim() + newNameWithoutExt;
    }

    if (suffix.trim()) {
      newNameWithoutExt = newNameWithoutExt + suffix.trim();
    }

    if (addTftSuffix && TFT_SUFFIXES[addTftSuffix]) {
      newNameWithoutExt = newNameWithoutExt + TFT_SUFFIXES[addTftSuffix];
    }

    const safeName = createSafeFileName(newNameWithoutExt);
    const newName = safeName + file.extension;

    return {
      ...file,
      newName
    };
  });
};

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
    if (selectedOnly && !file.selected) {
      return file;
    }

    let formattedNumber;
    if (numberFormat === '###') {
      formattedNumber = counter.toString().padStart(3, '0');
    } else if (numberFormat === '##') {
      formattedNumber = counter.toString().padStart(2, '0');
    } else if (numberFormat === '#') {
      formattedNumber = counter.toString();
    } else {
      formattedNumber = counter.toString();
    }

    let newNameWithoutExt = file.nameWithoutExt;

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

export const toggleAllFileSelection = (files, selectAll) => {
  return files.map(file => ({
    ...file,
    selected: selectAll
  }));
};

export const removeSelectedFiles = (files) => {
  return files.filter(file => !file.selected);
};

export const downloadRenamedFiles = async (files, zipFileName = 'renamed_files.zip') => {
  try {
    const renamedFiles = files.filter(file => file.newName !== file.originalName);
    
    if (renamedFiles.length === 0) {
      throw new Error('변경된 파일이 없습니다.');
    }

    for (const file of renamedFiles) {
      await downloadSingleRenamedFile(file);
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