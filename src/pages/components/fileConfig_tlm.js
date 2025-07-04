// fileConfig_tlm.js - TLM 전용 파일 설정 및 GitHub 로드

export const GITHUB_CONFIG = {
  username: 'cosmosalad',
  repo: 'hightech_tft',
  branch: 'main'
};

// TLM 전용 폴더 구조 데이터
let TLM_FOLDER_STRUCTURE_DATA = null;

// TLM 폴더 구조 로드 함수
export const loadTLMFolderStructure = async () => {
  if (TLM_FOLDER_STRUCTURE_DATA) {
    console.log("TLM Folder structure already loaded. Returning cached data.");
    return TLM_FOLDER_STRUCTURE_DATA;
  }
  try {
    const githubRawUrl = `https://raw.githubusercontent.com/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/public/folderStructureData_tlm.json`;
    console.log(`Attempting to load TLM folderStructureData from: ${githubRawUrl}`);

    const response = await fetch(githubRawUrl);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to load TLM folder structure: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to load TLM folder structure: ${response.status} ${response.statusText}`);
    }

    TLM_FOLDER_STRUCTURE_DATA = await response.json();
    console.log("TLM Folder structure loaded successfully:", TLM_FOLDER_STRUCTURE_DATA);
    return TLM_FOLDER_STRUCTURE_DATA;
  } catch (error) {
    console.error("Error loading TLM folder structure:", error);
    return null;
  }
};

// TLM 폴더에서 파일 목록 가져오기
export const getTLMFilesFromPath = (folderPath) => {
  if (!TLM_FOLDER_STRUCTURE_DATA) {
    console.warn("TLM_FOLDER_STRUCTURE_DATA not loaded yet. Call loadTLMFolderStructure() first.");
    return [];
  }
  const pathParts = folderPath.split('/').filter(part => part !== '');
  let current = TLM_FOLDER_STRUCTURE_DATA;

  for (const part of pathParts) {
    if (current && current[part]) {
      // 'children'이 있는 경우 한 단계 더 들어갑니다.
      current = current[part].children ? current[part].children : current[part];
    } else if (current && current.children && current.children[part]) {
       // 'children' 객체 내에서 직접 part를 찾습니다.
       current = current.children[part];
    }
    else {
      // 경로의 중간에서 일치하는 폴더를 찾지 못한 경우
       let pathNode = TLM_FOLDER_STRUCTURE_DATA;
       for(const p of pathParts) {
         if(pathNode[p]) {
           pathNode = pathNode[p].children || pathNode[p];
         } else {
           return [];
         }
       }
       current = pathNode;
       break;
    }
  }

  // 최종적으로 도달한 노드에서 'files' 속성을 찾습니다.
  // 이 부분은 제공된 JSON 구조에 따라 조정이 필요할 수 있습니다.
  // 최종 노드가 파일 목록을 직접 가지고 있지 않고, 한 단계 더 들어가야 할 수 있습니다.
   let filesNode = TLM_FOLDER_STRUCTURE_DATA;
   pathParts.forEach(part => {
       if (filesNode && filesNode[part]) {
           filesNode = filesNode[part];
       } else if (filesNode && filesNode.children && filesNode.children[part]) {
           filesNode = filesNode.children[part];
       }
   });


  return filesNode && filesNode.files ? filesNode.files : [];
};


// ✅ [수정됨] TLM 폴더 트리 구조 생성 (계층 구조 유지)
export const getTLMFolderTree = () => {
  if (!TLM_FOLDER_STRUCTURE_DATA) {
    console.warn("TLM_FOLDER_STRUCTURE_DATA not loaded yet.");
    return [];
  }

  // 재귀적으로 폴더 구조를 탐색하여 트리 데이터 생성
  const buildTree = (data, currentPath = '') => {
    return Object.entries(data)
      .filter(([key, value]) => value.type === 'folder') // 폴더 타입만 필터링
      .map(([key, value]) => {
        const newPath = currentPath ? `${currentPath}/${key}` : key;
        const node = {
          name: key,
          path: newPath,
          // 자식 폴더가 있으면 재귀적으로 탐색하여 children 배열 생성
          children: value.children ? buildTree(value.children, newPath) : []
        };
        return node;
      });
  };

  return buildTree(TLM_FOLDER_STRUCTURE_DATA);
};


// TLM 검색 기능
export const searchTLMFiles = (searchTerm) => {
  if (!TLM_FOLDER_STRUCTURE_DATA) {
    console.warn("TLM_FOLDER_STRUCTURE_DATA not loaded yet.");
    return [];
  }
  const results = [];
  const searchLower = searchTerm.toLowerCase();

  const searchInFolder = (obj, currentPath = '') => {
    if (!obj) return;
    Object.keys(obj).forEach(key => {
      const item = obj[key];
      const newPath = currentPath ? `${currentPath}/${key}` : key;

      if (item.type === 'folder') {
        if (item.files && Array.isArray(item.files)) {
          item.files.forEach(filename => {
            const filenameLower = filename.toLowerCase();
            const sampleName = generateTLMSampleName(filename).toLowerCase();

            if (filenameLower.includes(searchLower) || sampleName.includes(searchLower)) {
              results.push({
                filename,
                folderPath: newPath,
                sampleName: generateTLMSampleName(filename)
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

  searchInFolder(TLM_FOLDER_STRUCTURE_DATA);
  return results;
};

// TLM 파일명에서 샘플명 생성
export const generateTLMSampleName = (filename) => {
  // 파일 확장자 제거
  let sampleName = filename.replace(/\.[^/.]+$/, "");
  
  // TLM 파일의 경우 온도 조건 등을 기준으로 샘플명 생성
  // 예: T1_Ti_Al_000.xls → T1_Ti_Al_000
  // 더 복잡한 로직이 필요하면 여기서 처리
  
  return sampleName;
};

// TLM 파일 타입 아이콘
export const getTLMFileTypeIcon = () => {
  return '📊'; // TLM 파일은 모두 동일한 아이콘 사용
};

// TLM 파일 타입 색상
export const getTLMFileTypeColor = () => {
  return 'bg-orange-100 text-orange-800';
};

// GitHub에서 TLM 파일 로드
export const loadTLMFileFromGitHub = async (filename, folder) => {
  // folder 경로에 /excel/TLM/ 접두사 추가
  const fullPath = `excel/TLM/${folder}`;
  const folderPath = fullPath.split('/').map(part => encodeURIComponent(part)).join('/');
  const rawUrl = `https://raw.githubusercontent.com/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${folderPath}/${encodeURIComponent(filename)}`;

  console.log('TLM 파일 다운로드 시도:', rawUrl); // 디버깅용 로그

  const response = await fetch(rawUrl);

  if (!response.ok) {
    throw new Error(`TLM 파일을 불러올 수 없습니다: ${response.status} - ${rawUrl}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const file = new File([arrayBuffer], filename, {
    type: 'application/vnd.ms-excel'
  });

  const fileInfo = {
    file,
    name: filename,
    id: Date.now() + Math.random(),
    source: 'github',
    folder: folder,
    url: rawUrl,
    alias: generateTLMSampleName(filename)
  };

  return fileInfo;
};

// TLM 폴더 통계
export const getTLMFolderStats = () => {
  if (!TLM_FOLDER_STRUCTURE_DATA) {
    return {
      totalFolders: 0,
      totalFiles: 0,
      folderFileCount: {}
    };
  }

  const stats = {
    totalFolders: 0,
    totalFiles: 0,
    folderFileCount: {}
  };

  const countInFolder = (obj, currentPath = '') => {
    if (!obj) return;
    Object.keys(obj).forEach(key => {
      const item = obj[key];
      const newPath = currentPath ? `${currentPath}/${key}` : key;

      if (item.type === 'folder') {
        stats.totalFolders++;

        if (item.files && Array.isArray(item.files)) {
          const fileCount = item.files.length;
          stats.totalFiles += fileCount;
          stats.folderFileCount[newPath] = fileCount;
        }

        if (item.children) {
          countInFolder(item.children, newPath);
        }
      }
    });
  };

  countInFolder(TLM_FOLDER_STRUCTURE_DATA);
  return stats;
};