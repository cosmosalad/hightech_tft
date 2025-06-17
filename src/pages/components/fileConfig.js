// fileConfig.js - 중첩 폴더 구조 지원 버전 (수정 제안 반영)

// GitHub 기본 설정
export const GITHUB_CONFIG = {
  username: 'cosmosalad',
  repo: 'hightech_tft',
  branch: 'main'
};

// 📁 중첩 폴더 구조 정의
export const FOLDER_STRUCTURE = {
  '2023sample': {
    type: 'folder',
    description: 'sample',
    files: [
      '0711_TFT_IDVD_IZO25nm.xls',
      '0711_TFT_IDVG_Linear_Hys_IZO25nm.xls',
      '0711_TFT_IDVG_Linear_IZO25nm.xls',
      '0711_TFT_IDVG_Sat_IZO25nm.xls'
    ]
  },
  '공통': {
    type: 'folder',
    children: {
      '0613': {
        type: 'folder',
        description: 'Pressure: 7mTorr\nPower: 70W\nsputtering time: 8m15s\nMesured\nTHickness: 28nm', // 설명 추가
        files: [
          '0614_IDVG_Lin_0sccm_300.xls',
          '0614_IDVG_Lin_0sccm_350.xls'
        ]
      },
      '0614': {
        type: 'folder',
        description: 'Pressure: 5mTorr\nPower: 100W\nsputtering time: 7m30s\nMesured\nTHickness: 38nm', // 설명 추가
        files: [
          '0614_IDVG_Lin_0sccm_300.xls',
          '0614_IDVG_Lin_0sccm_350.xls',
          '0614_IDVG_Lin_1sccm_000.xls',
          '0614_IDVG_Lin_1sccm_050.xls',
          '0614_IDVG_Lin_1sccm_100.xls',
          '0614_IDVG_Lin_1sccm_150.xls',
          '0614_IDVG_Lin_1sccm_200.xls',
          '0614_IDVG_Lin_1sccm_300.xls'
        ]
      },
      '0616': {
        type: 'folder',
        description: 'Pressure: 5mTorr\nPower: 100W\nsputtering time: 7m30s\nMesured\nTHickness: 36nm', // 설명 추가
        files: [
          '0616_IDVD_1sccm_000.xls',
          '0616_IDVD_1sccm_100.xls',
          '0616_IDVD_1sccm_200.xls',
          '0616_IDVD_1sccm_300.xls',
          '0616_IDVG_Lin_1sccm_000.xls',
          '0616_IDVG_Lin_1sccm_100.xls',
          '0616_IDVG_Lin_1sccm_200.xls',
          '0616_IDVG_Lin_1sccm_300.xls',
          '0616_IDVG_Lin_Hys_1sccm_000.xls',
          '0616_IDVG_Lin_Hys_1sccm_100.xls',
          '0616_IDVG_Lin_Hys_1sccm_200.xls',
          '0616_IDVG_Lin_Hys_1sccm_300.xls',
          '0616_IDVG_Sat_1sccm_000.xls',
          '0616_IDVG_Sat_1sccm_100.xls',
          '0616_IDVG_Sat_1sccm_200.xls',
          '0616_IDVG_Sat_1sccm_300.xls'
        ]
      }
    }
  },
  '1team': {
    type: 'folder',
    children: {
      'IDVG': {
        type: 'folder',
        files: []
      },
      'IDVD': {
        type: 'folder',
        files: []
      }
    }
  },
  '2team': {
    type: 'folder',
    children: {
      'linear': {
        type: 'folder',
        files: []
      },
      'saturation': {
        type: 'folder',
        files: []
      }
    }
  },
  '3team': {
    type: 'folder',
    children: {
      'linear': {
        type: 'folder',
        files: []
      },
      'saturation': {
        type: 'folder',
        files: []
      }
    }
  },
  '4team': {
    type: 'folder',
    children: {
      'linear': {
        type: 'folder',
        files: []
      },
      'saturation': {
        type: 'folder',
        files: []
      }
    }
  }
};


// 📁 폴더 경로를 기반으로 파일 목록을 가져오는 함수
export const getFilesFromPath = (folderPath) => {
  const pathParts = folderPath.split('/').filter(part => part !== '');
  let current = FOLDER_STRUCTURE;
  
  for (const part of pathParts) {
    if (current[part]) {
      current = current[part];
      if (current.children) {
        current = current.children;
      }
    } else {
      return [];
    }
  }
  
  return current.files || [];
};

// 📁 모든 폴더 경로를 평면화해서 가져오는 함수 (모든 폴더 포함)
export const getAllFolderPaths = () => {
  const paths = [];
  
  const traverse = (obj, currentPath = '') => {
    Object.keys(obj).forEach(key => {
      const item = obj[key];
      const newPath = currentPath ? `${currentPath}/${key}` : key;
      
      if (item.type === 'folder') {
        paths.push(newPath); // 파일 유무와 상관없이 모든 폴더 경로를 추가
        
        if (item.children) {
          traverse(item.children, newPath);
        }
      }
    });
  };
  
  traverse(FOLDER_STRUCTURE);
  return paths;
};

// 📁 폴더 트리 구조를 가져오는 함수 (FileTree 컴포넌트에서 사용)
export const getFolderTree = () => {
  const buildTree = (obj, currentPath = '', level = 0) => {
    return Object.keys(obj).map(key => {
      const item = obj[key];
      const newPath = currentPath ? `${currentPath}/${key}` : key;

      const node = {
        name: key,
        path: newPath, // 전체 경로를 path로 저장
        type: item.type,
        level: level, // level 정보도 함께 저장
        description: item.description || null // description 필드 추가
      };
      
      if (item.type === 'folder') {
        if (item.children) {
          node.children = buildTree(item.children, newPath, level + 1);
        }
        if (item.files) {
          // 폴더 안에 직접 파일이 있는 경우도 처리
          node.children = [
            ...(node.children || []),
            ...item.files.map(filename => ({
              name: filename,
              path: `${newPath}/${filename}`, // 파일의 전체 경로
              type: 'file'
            }))
          ];
        }
      }
      return node;
    });
  };
  
  return buildTree(FOLDER_STRUCTURE);
};


// 📁 경로 표시를 위한 브레드크럼 생성
export const generateBreadcrumb = (folderPath) => {
  if (!folderPath) return [];
  
  const parts = folderPath.split('/').filter(part => part !== '');
  const breadcrumb = [];
  
  for (let i = 0; i < parts.length; i++) {
    breadcrumb.push({
      name: parts[i],
      path: parts.slice(0, i + 1).join('/'),
      isLast: i === parts.length - 1
    });
  }
  
  return breadcrumb;
};

// 🔍 검색 기능 - 모든 폴더에서 파일 검색
export const searchFiles = (searchTerm) => {
  const results = [];
  const searchLower = searchTerm.toLowerCase();
  
  const searchInFolder = (obj, currentPath = '') => {
    Object.keys(obj).forEach(key => {
      const item = obj[key];
      const newPath = currentPath ? `${currentPath}/${key}` : key;
      
      if (item.type === 'folder') {
        if (item.files) {
          item.files.forEach(filename => {
            const filenameLower = filename.toLowerCase();
            const sampleName = generateSampleName(filename).toLowerCase();
            const fileType = detectFileType(filename).toLowerCase();
            
            if (filenameLower.includes(searchLower) || 
                sampleName.includes(searchLower) ||
                fileType.includes(searchLower)) {
              results.push({
                filename,
                folderPath: newPath, // 파일이 속한 폴더의 전체 경로
                sampleName: generateSampleName(filename),
                fileType: detectFileType(filename)
              });
            }
          });
        }
        
        if (item.children) {
          searchInFolder(item.children, newPath);
        }
      }
    });
  };
  
  searchInFolder(FOLDER_STRUCTURE);
  return results;
};

// 📁 폴더에 새 파일 추가 (개발용)
export const addFileToPath = (folderPath, filename) => {
  const pathParts = folderPath.split('/').filter(part => part !== '');
  let current = FOLDER_STRUCTURE;
  
  // 경로를 따라가며 폴더 찾기
  for (const part of pathParts) {
    if (current[part]) {
      current = current[part];
      if (current.children) {
        current = current.children;
      }
    } else {
      console.error(`폴더 경로 "${folderPath}"를 찾을 수 없습니다.`);
      return false;
    }
  }
  
  // 파일 추가
  if (!current.files) {
    current.files = [];
  }
  
  if (!current.files.includes(filename)) {
    current.files.push(filename);
    console.log(`파일 "${filename}"이 "${folderPath}"에 추가되었습니다.`);
    return true;
  } else {
    console.log(`파일 "${filename}"은 이미 "${folderPath}"에 존재합니다.`);
    return false;
  }
};

// 📁 새 폴더 생성 (개발용)
export const createFolder = (parentPath, folderName) => {
  const pathParts = parentPath ? parentPath.split('/').filter(part => part !== '') : [];
  let current = FOLDER_STRUCTURE;
  
  // 부모 폴더 찾기
  for (const part of pathParts) {
    if (current[part]) {
      current = current[part];
      if (current.children) {
        current = current.children;
      }
    } else {
      console.error(`부모 폴더 경로 "${parentPath}"를 찾을 수 없습니다.`);
      return false;
    }
  }
  
  // 새 폴더 생성
  if (!current[folderName]) {
    current[folderName] = {
      type: 'folder',
      files: []
    };
    console.log(`폴더 "${folderName}"이 "${parentPath || 'root'}"에 생성되었습니다.`);
    return true;
  } else {
    console.log(`폴더 "${folderName}"은 이미 존재합니다.`);
    return false;
  }
};

// 기존 함수들 유지
export const detectFileType = (filename) => {
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

export const generateSampleName = (filename) => {
  let sampleName = filename.replace(/\.[^/.]+$/, "");
  
  const keywords = [
    'IDVG', 'Linear', 'Lin', 
    'Saturation', 'Sat', 
    'Hysteresis', 'Hys', 
    'IDVD'
  ];

  keywords.forEach(keyword => {
    const regex = new RegExp(`_?${keyword}_?`, 'ig');
    sampleName = sampleName.replace(regex, '_');
  });
  
  sampleName = sampleName.replace(/__+/g, '_');
  sampleName = sampleName.replace(/^_|_$/g, '');

  return sampleName;
};

export const getFileTypeIcon = (fileType) => {
  switch (fileType) {
    case 'IDVD': return '📊';
    case 'IDVG-Linear': return '📈';
    case 'IDVG-Saturation': return '📉';
    case 'IDVG-Hysteresis': return '🔄';
    default: return '📄';
  }
};

export const getFileTypeColor = (fileType) => {
  switch (fileType) {
    case 'IDVD': return 'bg-purple-100 text-purple-800';
    case 'IDVG-Linear': return 'bg-blue-100 text-blue-800';
    case 'IDVG-Saturation': return 'bg-green-100 text-green-800';
    case 'IDVG-Hysteresis': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// 📊 폴더별 통계 정보
export const getFolderStats = () => {
  const stats = {
    totalFolders: 0,
    totalFiles: 0,
    fileTypeDistribution: {},
    folderFileCount: {}
  };
  
  const countInFolder = (obj, currentPath = '') => {
    Object.keys(obj).forEach(key => {
      const item = obj[key];
      const newPath = currentPath ? `${currentPath}/${key}` : key;
      
      if (item.type === 'folder') {
        stats.totalFolders++;
        
        if (item.files) {
          const fileCount = item.files.length;
          stats.totalFiles += fileCount;
          stats.folderFileCount[newPath] = fileCount;
          
          // 파일 타입별 분포 계산
          item.files.forEach(filename => {
            const fileType = detectFileType(filename);
            stats.fileTypeDistribution[fileType] = 
              (stats.fileTypeDistribution[fileType] || 0) + 1;
          });
        }
        
        if (item.children) {
          countInFolder(item.children, newPath);
        }
      }
    });
  };
  
  countInFolder(FOLDER_STRUCTURE);
  return stats;
};
