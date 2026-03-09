export const GITHUB_CONFIG = {
  username: 'cosmosalad',
  repo: 'hightech_tft',
  branch: 'main'
};

let TLM_FOLDER_STRUCTURE_DATA = null;

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

export const getTLMFilesFromPath = (folderPath) => {
  if (!TLM_FOLDER_STRUCTURE_DATA) {
    console.warn("TLM_FOLDER_STRUCTURE_DATA not loaded yet. Call loadTLMFolderStructure() first.");
    return [];
  }
  const pathParts = folderPath.split('/').filter(part => part !== '');
  let current = TLM_FOLDER_STRUCTURE_DATA;

  for (const part of pathParts) {
    if (current && current[part]) {
      current = current[part].children ? current[part].children : current[part];
    } else if (current && current.children && current.children[part]) {
       current = current.children[part];
    }
    else {
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


export const getTLMFolderTree = () => {
  if (!TLM_FOLDER_STRUCTURE_DATA) {
    console.warn("TLM_FOLDER_STRUCTURE_DATA not loaded yet.");
    return [];
  }

  const buildTree = (data, currentPath = '') => {
    return Object.entries(data)
      .filter(([key, value]) => value.type === 'folder')
      .map(([key, value]) => {
        const newPath = currentPath ? `${currentPath}/${key}` : key;
        const node = {
          name: key,
          path: newPath,
          children: value.children ? buildTree(value.children, newPath) : []
        };
        return node;
      });
  };

  return buildTree(TLM_FOLDER_STRUCTURE_DATA);
};


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

export const generateTLMSampleName = (filename) => {
  let sampleName = filename.replace(/\.[^/.]+$/, "");
  
  return sampleName;
};

export const getTLMFileTypeIcon = () => {
  return '📊';
};

export const getTLMFileTypeColor = () => {
  return 'bg-orange-100 text-orange-800';
};

export const loadTLMFileFromGitHub = async (filename, folder) => {
  const fullPath = `excel/TLM/${folder}`;
  const folderPath = fullPath.split('/').map(part => encodeURIComponent(part)).join('/');
  const rawUrl = `https://raw.githubusercontent.com/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${folderPath}/${encodeURIComponent(filename)}`;

  console.log('TLM 파일 다운로드 시도:', rawUrl);

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