// fileConfig.js - 중첩 폴더 구조 지원 버전 (JSON 파일 로드 기능 추가)

// GitHub 기본 설정
export const GITHUB_CONFIG = {
  username: 'cosmosalad',
  repo: 'hightech_tft',
  branch: 'main'
};

// 📁 중첩 폴더 구조 데이터를 저장할 내부 변수
let _folderStructure = null;

// 📁 JSON 파일에서 폴더 구조를 비동기적으로 불러오는 함수
export const loadFolderStructure = async () => {
  if (_folderStructure) {
    return _folderStructure;
  }
  try {
    // 경로 수정: process.env.PUBLIC_URL 사용
    // React 앱이 서브 경로에 배포될 때 올바른 루트 경로를 잡아줍니다.
    const jsonPath = `${process.env.PUBLIC_URL}/folderStructureData.json`;
    const response = await fetch(jsonPath);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    _folderStructure = await response.json();
    return _folderStructure;
  } catch (error) {
    console.error("Error loading folder structure:", error);
    _folderStructure = {};
    return _folderStructure;
  }
};

// 모든 파일 관련 함수들은 _folderStructure가 로드된 후에 호출되어야 합니다.
// 이를 위해 각 함수 내에서 _folderStructure가 있는지 확인하거나,
// HomePage.js에서 loadFolderStructure를 먼저 호출하도록 합니다.

// 📁 폴더 경로를 기반으로 파일 목록을 가져오는 함수
export const getFilesFromPath = (folderPath) => {
  if (!_folderStructure) { // 데이터가 로드되지 않았다면 빈 배열 반환
    console.warn("Folder structure not loaded yet.");
    return [];
  }
  const pathParts = folderPath.split('/').filter(part => part !== '');
  let current = _folderStructure;
  
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
  if (!_folderStructure) { // 데이터가 로드되지 않았다면 빈 배열 반환
    console.warn("Folder structure not loaded yet.");
    return [];
  }
  const paths = [];
  
  const traverse = (obj, currentPath = '') => {
    Object.keys(obj).forEach(key => {
      const item = obj[key];
      const newPath = currentPath ? `${currentPath}/${key}` : key;
      
      if (item.type === 'folder') {
        paths.push(newPath);
        
        if (item.children) {
          traverse(item.children, newPath);
        }
      }
    });
  };
  
  traverse(_folderStructure);
  return paths;
};

// 📁 폴더 트리 구조를 가져오는 함수 (FileTree 컴포넌트에서 사용)
export const getFolderTree = () => {
  if (!_folderStructure) { // 데이터가 로드되지 않았다면 빈 배열 반환
    console.warn("Folder structure not loaded yet.");
    return [];
  }
  const buildTree = (obj, currentPath = '', level = 0) => {
    return Object.keys(obj).map(key => {
      const item = obj[key];
      const newPath = currentPath ? `${currentPath}/${key}` : key;

      const node = {
        name: key,
        path: newPath,
        type: item.type,
        level: level,
        description: item.description || null
      };
      
      if (item.type === 'folder') {
        if (item.children) {
          node.children = buildTree(item.children, newPath, level + 1);
        }
        if (item.files) {
          node.children = [
            ...(node.children || []),
            ...item.files.map(filename => ({
              name: filename,
              path: `${newPath}/${filename}`,
              type: 'file'
            }))
          ];
        }
      }
      return node;
    });
  };
  
  return buildTree(_folderStructure);
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
  if (!_folderStructure) { // 데이터가 로드되지 않았다면 빈 배열 반환
    console.warn("Folder structure not loaded yet.");
    return [];
  }
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
  
  searchInFolder(_folderStructure);
  return results;
};

// 📁 폴더에 새 파일 추가 (개발용)
export const addFileToPath = (folderPath, filename) => {
  if (!_folderStructure) { // 데이터가 로드되지 않았다면 작업 수행 불가
    console.warn("Folder structure not loaded yet. Cannot add file.");
    return false;
  }
  const pathParts = folderPath.split('/').filter(part => part !== '');
  let current = _folderStructure;
  
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
  if (!_folderStructure) { // 데이터가 로드되지 않았다면 작업 수행 불가
    console.warn("Folder structure not loaded yet. Cannot create folder.");
    return false;
  }
  const pathParts = parentPath ? parentPath.split('/').filter(part => part !== '') : [];
  let current = _folderStructure;
  
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
  if (!_folderStructure) { // 데이터가 로드되지 않았다면 빈 객체 반환
    console.warn("Folder structure not loaded yet.");
    return { totalFolders: 0, totalFiles: 0, fileTypeDistribution: {}, folderFileCount: {} };
  }
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
  
  countInFolder(_folderStructure);
  return stats;
};

// 레거시 호환성을 위한 함수 (기존 코드가 동작하도록)
export const FOLDER_FILES = {
  get '2023sample'() {
    // FOLDER_STRUCTURE 대신 _folderStructure를 사용하도록 변경
    if (!_folderStructure) {
      console.warn("Folder structure not loaded yet. Cannot access FOLDER_FILES['2023sample'].");
      return [];
    }
    return getFilesFromPath('2023sample');
  },
  get '공통'() {
    if (!_folderStructure) {
      console.warn("Folder structure not loaded yet. Cannot access FOLDER_FILES['공통'].");
      return [];
    }
    return getFilesFromPath('공통');
  },
  get '1team'() {
    if (!_folderStructure) {
      console.warn("Folder structure not loaded yet. Cannot access FOLDER_FILES['1team'].");
      return [];
    }
    return getFilesFromPath('1team');
  },
  get '2team'() {
    if (!_folderStructure) {
      console.warn("Folder structure not loaded yet. Cannot access FOLDER_FILES['2team'].");
      return [];
    }
    return getFilesFromPath('2team');
  }
};