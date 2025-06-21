export const GITHUB_CONFIG = {
  username: 'cosmosalad',
  repo: 'hightech_tft',
  branch: 'main'
};

// FOLDER_STRUCTURE를 동적으로 불러오기 위한 변수 (초기에는 null)
let FOLDER_STRUCTURE_DATA = null;

// JSON 파일을 불러오는 비동기 함수
export const loadFolderStructure = async () => {
  if (FOLDER_STRUCTURE_DATA) {
    console.log("Folder structure already loaded. Returning cached data."); // 캐시된 데이터 반환 로그
    return FOLDER_STRUCTURE_DATA; // 이미 로드되었다면 기존 데이터 반환
  }
  try {
    // GitHub Raw 콘텐츠 URL로 변경
    const githubRawUrl = `https://raw.githubusercontent.com/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/public/folderStructureData.json`;
    console.log(`Attempting to load folderStructureData.json from: ${githubRawUrl}`); // 로드 시도 로그

    const response = await fetch(githubRawUrl);

    if (!response.ok) {
      const errorText = await response.text(); // 오류 응답 텍스트 읽기
      console.error(`Failed to load folder structure: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to load folder structure: ${response.status} ${response.statusText}`);
    }

    FOLDER_STRUCTURE_DATA = await response.json();
    console.log("Folder structure loaded successfully:", FOLDER_STRUCTURE_DATA); // 성공 로그
    return FOLDER_STRUCTURE_DATA;
  } catch (error) {
    console.error("Error loading folder structure:", error); // 에러 발생 시 로그
    return null; // 에러 발생 시 null 반환
  }
};

// --- 이하 함수들은 FOLDER_STRUCTURE_DATA가 로드되었다고 가정하고 동작 ---
// 각 함수 내에서 FOLDER_STRUCTURE_DATA가 null일 경우 경고 메시지 출력은 유지

// 📁 폴더 경로를 기반으로 파일 목록을 가져오는 함수
export const getFilesFromPath = (folderPath) => {
  if (!FOLDER_STRUCTURE_DATA) {
    console.warn("FOLDER_STRUCTURE_DATA not loaded yet. Call loadFolderStructure() first.");
    return [];
  }
  const pathParts = folderPath.split('/').filter(part => part !== '');
  let current = FOLDER_STRUCTURE_DATA;

  for (const part of pathParts) {
    if (current && current[part]) { // current가 유효한지 확인
      current = current[part];
      if (current.children) {
        current = current.children;
      }
    } else {
      return [];
    }
  }

  return current && current.files || []; // current가 유효한지 확인
};

// 📁 모든 폴더 경로를 평면화해서 가져오는 함수 (모든 폴더 포함)
export const getAllFolderPaths = () => {
  if (!FOLDER_STRUCTURE_DATA) {
    console.warn("FOLDER_STRUCTURE_DATA not loaded yet. Call loadFolderStructure() first.");
    return [];
  }
  const paths = [];

  const traverse = (obj, currentPath = '') => {
    if (!obj) return; // obj가 null/undefined일 경우 예외 처리
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

  traverse(FOLDER_STRUCTURE_DATA);
  return paths;
};

// 📁 폴더 트리 구조를 가져오는 함수 (FileTree 컴포넌트에서 사용)
export const getFolderTree = () => {
  if (!FOLDER_STRUCTURE_DATA) {
    console.warn("FOLDER_STRUCTURE_DATA not loaded yet. Call loadFolderStructure() first.");
    return [];
  }
  const buildTree = (obj, currentPath = '', level = 0) => {
    if (!obj) return []; // obj가 null/undefined일 경우 예외 처리
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
          // 폴더 안에 직접 파일이 있는 경우도 처리 (files가 배열인지 확인)
          node.children = [
            ...(node.children || []),
            ...(Array.isArray(item.files) ? item.files.map(filename => ({
              name: filename,
              path: `${newPath}/${filename}`, // 파일의 전체 경로
              type: 'file'
            })) : [])
          ];
        }
      }
      return node;
    });
  };

  return buildTree(FOLDER_STRUCTURE_DATA);
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
  if (!FOLDER_STRUCTURE_DATA) {
    console.warn("FOLDER_STRUCTURE_DATA not loaded yet. Call loadFolderStructure() first.");
    return [];
  }
  const results = [];
  const searchLower = searchTerm.toLowerCase();

  const searchInFolder = (obj, currentPath = '') => {
    if (!obj) return; // obj가 null/undefined일 경우 예외 처리
    Object.keys(obj).forEach(key => {
      const item = obj[key];
      const newPath = currentPath ? `${currentPath}/${key}` : key;

      if (item.type === 'folder') {
        if (item.files && Array.isArray(item.files)) { // files가 배열인지 확인
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

  searchInFolder(FOLDER_STRUCTURE_DATA);
  return results;
};

// 📁 폴더에 새 파일 추가 (개발용)
export const addFileToPath = (folderPath, filename) => {
  if (!FOLDER_STRUCTURE_DATA) {
    console.warn("FOLDER_STRUCTURE_DATA not loaded yet.");
    return false;
  }
  const pathParts = folderPath.split('/').filter(part => part !== '');
  let current = FOLDER_STRUCTURE_DATA;

  // 경로를 따라가며 폴더 찾기
  for (const part of pathParts) {
    if (current && current[part]) { // current가 유효한지 확인
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
  if (!FOLDER_STRUCTURE_DATA) {
    console.warn("FOLDER_STRUCTURE_DATA not loaded yet.");
    return false;
  }
  const pathParts = parentPath ? parentPath.split('/').filter(part => part !== '') : [];
  let current = FOLDER_STRUCTURE_DATA;

  // 부모 폴더 찾기
  for (const part of pathParts) {
    if (current && current[part]) { // current가 유효한지 확인
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
  if (current && !current[folderName]) { // current가 유효한지 확인
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

  if (
  name.includes('idvg') &&
  (
    (name.includes('linear') || name.includes('lin')) &&
    (name.includes('hys') || name.includes('hysteresis'))
  ) || (
    name.includes('idvg') &&
    (name.includes('hys') || name.includes('hysteresis'))
  )
) {
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

export const getFileTypeColor = (fileType) => {
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

// 📊 폴더별 통계 정보
export const getFolderStats = () => {
  if (!FOLDER_STRUCTURE_DATA) {
    console.warn("FOLDER_STRUCTURE_DATA not loaded yet.");
    return {
      totalFolders: 0,
      totalFiles: 0,
      fileTypeDistribution: {},
      folderFileCount: {}
    };
  }
  const stats = {
    totalFolders: 0,
    totalFiles: 0,
    fileTypeDistribution: {},
    folderFileCount: {}
  };

  const countInFolder = (obj, currentPath = '') => {
    if (!obj) return; // obj가 null/undefined일 경우 예외 처리
    Object.keys(obj).forEach(key => {
      const item = obj[key];
      const newPath = currentPath ? `${currentPath}/${key}` : key;

      if (item.type === 'folder') {
        stats.totalFolders++;

        if (item.files && Array.isArray(item.files)) { // files가 배열인지 확인
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

  countInFolder(FOLDER_STRUCTURE_DATA);
  return stats;
};