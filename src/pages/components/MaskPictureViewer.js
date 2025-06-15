import React, { useState, useRef, useEffect } from 'react';
import { 
  Eye, X, FolderOpen, Image, Ruler, ZoomIn, ZoomOut, 
  RotateCw, MousePointer, Trash2
} from 'lucide-react';

// SVG 뷰어 컴포넌트
const SVGViewer = ({ svgContent, fileName, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [measuring, setMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const handleScreenClick = (e) => {
    if (!measuring) return;
    
    const point = { x: e.clientX, y: e.clientY };
    
    if (measurePoints.length === 0) {
      setMeasurePoints([point]);
    } else if (measurePoints.length === 1) {
      const distance = Math.sqrt(
        Math.pow(point.x - measurePoints[0].x, 2) + 
        Math.pow(point.y - measurePoints[0].y, 2)
      );
      
      setMeasurements([...measurements, {
        id: Date.now(),
        start: measurePoints[0],
        end: point,
        distance: Math.round(distance),
        pixelDistance: Math.round(distance)
      }]);
      
      setMeasurePoints([]);
    }
  };

  const handleMouseDown = (e) => {
    if (measuring) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || measuring) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const zoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const zoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));
  const resetView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const clearMeasurements = () => {
    setMeasurements([]);
    setMeasurePoints([]);
    setMeasuring(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* 뷰어 헤더 */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center">
          <Image className="w-6 h-6 mr-3 text-blue-400" />
          <h3 className="text-lg font-semibold">{fileName}</h3>
          <span className="ml-3 px-2 py-1 bg-gray-700 rounded text-xs">
            SVG 뷰어 - 픽셀 측정
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMeasuring(!measuring)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              measuring 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            title="화면 픽셀 측정 모드"
          >
            <Ruler className="w-5 h-5" />
          </button>
          
          <button onClick={zoomOut} className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
            <ZoomOut className="w-5 h-5" />
          </button>
          
          <div className="px-3 py-2 bg-gray-800 rounded-lg text-sm font-mono">
            {Math.round(zoom * 100)}%
          </div>
          
          <button onClick={zoomIn} className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
            <ZoomIn className="w-5 h-5" />
          </button>
          
          <button onClick={resetView} className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
            <RotateCw className="w-5 h-5" />
          </button>

          {measurements.length > 0 && (
            <button onClick={clearMeasurements} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          
          <button onClick={onClose} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 측정 모드 안내 */}
      {measuring && (
        <div className="bg-blue-600 text-white p-3 text-center shadow-lg">
          <p className="text-sm flex items-center justify-center">
            <MousePointer className="w-4 h-4 mr-2" />
            {measurePoints.length === 0 
              ? "화면에서 첫 번째 점을 클릭하세요" 
              : "두 번째 점을 클릭하여 픽셀 거리를 측정하세요"
            }
          </p>
        </div>
      )}

      {/* SVG 뷰어 영역 */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden relative bg-black"
        style={{ cursor: measuring ? 'crosshair' : isDragging ? 'grabbing' : 'grab' }}
        onClick={handleScreenClick}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          onMouseDown={handleMouseDown}
        >
          <div
            ref={svgRef}
            className="relative bg-black rounded-lg p-4 w-full h-full"
            style={{ 
              width: 'calc(100vw - 200px)', 
              height: 'calc(100vh - 300px)',
              overflow: 'visible',
              pointerEvents: measuring ? 'none' : 'auto'
            }}
          >
            {svgContent ? (
              <div 
                dangerouslySetInnerHTML={{ __html: svgContent }} 
                style={{ 
                  width: '100%', 
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-300">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
                  <p className="text-lg">SVG 로딩 중...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 화면 고정 측정 오버레이 */}
      {measuring && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {measurePoints.map((point, index) => (
            <div
              key={index}
              className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse"
              style={{
                left: point.x - 8,
                top: point.y - 8,
                transform: 'translate(0, 0)'
              }}
            />
          ))}
          
          {measurements.map((measurement) => (
            <div key={measurement.id}>
              <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                <defs>
                  <marker
                    id={`arrowhead-${measurement.id}`}
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                  </marker>
                </defs>
                <line
                  x1={measurement.start.x}
                  y1={measurement.start.y}
                  x2={measurement.end.x}
                  y2={measurement.end.y}
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeDasharray="8,4"
                  markerEnd={`url(#arrowhead-${measurement.id})`}
                />
              </svg>
              
              <div
                className="absolute w-3 h-3 bg-red-500 border-2 border-white rounded-full"
                style={{ left: measurement.start.x - 6, top: measurement.start.y - 6 }}
              />
              
              <div
                className="absolute w-3 h-3 bg-red-500 border-2 border-white rounded-full"
                style={{ left: measurement.end.x - 6, top: measurement.end.y - 6 }}
              />
              
              <div
                className="absolute bg-red-500 text-white px-2 py-1 rounded text-sm font-bold shadow-lg"
                style={{
                  left: (measurement.start.x + measurement.end.x) / 2 - 20,
                  top: (measurement.start.y + measurement.end.y) / 2 - 15
                }}
              >
                {measurement.distance}px
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 측정 결과 패널 */}
      {measurements.length > 0 && (
        <div className="bg-gray-900 text-white p-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center">
              <Ruler className="w-4 h-4 mr-2" />
              픽셀 측정 결과 ({measurements.length}개)
            </h4>
            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-400">
                줌: {Math.round(zoom * 100)}%
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-24 overflow-y-auto">
            {measurements.map((measurement, index) => (
              <div key={measurement.id} className="flex justify-between items-center bg-gray-800 p-2 rounded text-sm">
                <span className="text-gray-300">측정 {index + 1}:</span>
                <span className="font-bold text-blue-400">
                  {measurement.distance}px
                </span>
                <button
                  onClick={() => setMeasurements(measurements.filter(m => m.id !== measurement.id))}
                  className="text-red-400 hover:text-red-300 ml-2 p-1 hover:bg-red-900/30 rounded"
                  title="이 측정 삭제"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 메인 마스크/픽처 뷰어 컴포넌트
const MaskPictureViewer = ({ onClose }) => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState('mask');
  const [files, setFiles] = useState({ mask: [], picture: [] });
  const [selectedFile, setSelectedFile] = useState(null);
  const [svgContent, setSvgContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      loadFileList();
    }
  }, [isModalOpen, selectedFolder]);

  const loadFileList = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.github.com/repos/cosmosalad/hightech_tft/contents/data/${selectedFolder}`
      );
      
      if (response.ok) {
        const fileList = await response.json();
        const svgFiles = fileList
          .filter(file => file.type === 'file' && file.name.endsWith('.svg'))
          .map(file => file.name);
        
        setFiles(prev => ({ ...prev, [selectedFolder]: svgFiles }));
      } else {
        setFiles(prev => ({ ...prev, [selectedFolder]: [] }));
      }
    } catch (error) {
      setFiles(prev => ({ ...prev, [selectedFolder]: [] }));
    } finally {
      setLoading(false);
    }
  };

  const loadSVGFile = async (fileName) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://raw.githubusercontent.com/cosmosalad/hightech_tft/main/data/${selectedFolder}/${fileName}`
      );
      
      if (response.ok) {
        const svgText = await response.text();
        setSvgContent(svgText);
      } else {
        createExampleSVG(fileName);
      }
      
      setSelectedFile(fileName);
    } catch (error) {
      createExampleSVG(fileName);
      setSelectedFile(fileName);
    } finally {
      setLoading(false);
    }
  };

  const createExampleSVG = (fileName) => {
    const isPhoto = selectedFolder === 'picture';
    
    const exampleSVG = `
      <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="1"/>
          </pattern>
        </defs>
        
        <rect width="100%" height="100%" fill="white"/>
        <rect width="100%" height="100%" fill="url(#grid)"/>
        
        ${isPhoto ? `
          <rect x="50" y="50" width="500" height="300" fill="#f3f4f6" stroke="#6b7280" stroke-width="2" rx="10"/>
          <circle cx="150" cy="150" r="30" fill="#3b82f6" stroke="#1e40af" stroke-width="2"/>
          <circle cx="300" cy="200" r="25" fill="#ef4444" stroke="#dc2626" stroke-width="2"/>
          <circle cx="450" cy="180" r="35" fill="#10b981" stroke="#059669" stroke-width="2"/>
          
          <line x1="150" y1="150" x2="300" y2="200" stroke="#6b7280" stroke-width="2" stroke-dasharray="5,5"/>
          <text x="225" y="170" text-anchor="middle" font-size="12" fill="#374151">픽셀 측정으로 확인하세요</text>
          
          <line x1="300" y1="200" x2="450" y2="180" stroke="#6b7280" stroke-width="2" stroke-dasharray="5,5"/>
          <text x="375" y="185" text-anchor="middle" font-size="12" fill="#374151">픽셀 측정 모드 사용</text>
        ` : `
          <rect x="100" y="100" width="400" height="200" fill="none" stroke="#000000" stroke-width="3"/>
          <rect x="150" y="130" width="100" height="60" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>
          <rect x="350" y="130" width="100" height="60" fill="#34d399" stroke="#10b981" stroke-width="2"/>
          
          <circle cx="200" cy="250" r="20" fill="none" stroke="#000000" stroke-width="2"/>
          <circle cx="400" cy="250" r="20" fill="none" stroke="#000000" stroke-width="2"/>
          
          <line x1="220" y1="160" x2="350" y2="160" stroke="#000000" stroke-width="2"/>
          <text x="285" y="155" text-anchor="middle" font-size="10" fill="#000000">픽셀 측정 모드로 확인</text>
        `}
        
        <text x="300" y="380" text-anchor="middle" font-size="16" font-weight="bold" fill="#374151">
          ${fileName}
        </text>
        <text x="300" y="395" text-anchor="middle" font-size="12" fill="#6b7280">
          ${isPhoto ? '측정 결과 예시' : '마스크 디자인 예시'} - 픽셀 측정 모드를 사용하세요
        </text>
      </svg>
    `;
    
    setSvgContent(exampleSVG);
  };

  return (
    <>
      {isModalOpen && !selectedFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Eye className="w-6 h-6 mr-3" />
                  <h2 className="text-xl font-bold">마스크/픽처 뷰어</h2>
                  <span className="ml-3 px-3 py-1 bg-white/20 rounded-full text-sm">
                    픽셀 측정 모드
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    onClose();
                  }}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/20 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setSelectedFolder('mask')}
                className={`flex-1 py-4 px-6 font-medium transition-all duration-200 ${
                  selectedFolder === 'mask'
                    ? 'bg-white text-green-600 border-b-3 border-green-500 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <FolderOpen className="w-5 h-5 mr-2 inline" />
                Mask 폴더
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                  {files.mask.length}개
                </span>
              </button>
              <button
                onClick={() => setSelectedFolder('picture')}
                className={`flex-1 py-4 px-6 font-medium transition-all duration-200 ${
                  selectedFolder === 'picture'
                    ? 'bg-white text-teal-600 border-b-3 border-teal-500 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Image className="w-5 h-5 mr-2 inline" />
                Picture 폴더
                <span className="ml-2 px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs">
                  {files.picture.length}개
                </span>
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">파일 목록을 불러오는 중...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {files[selectedFolder].map((fileName) => (
                    <button
                      key={fileName}
                      onClick={() => loadSVGFile(fileName)}
                      className="p-4 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all duration-200 text-left group hover:shadow-lg"
                    >
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-100">
                          <Image className="w-5 h-5 text-gray-400 group-hover:text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-700 group-hover:text-green-700 truncate">
                            {fileName}
                          </div>
                          <div className="text-xs text-gray-500">SVG 파일</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 group-hover:text-green-600">
                        클릭하여 열기
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {!loading && files[selectedFolder].length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">해당 폴더에 SVG 파일이 없습니다</p>
                  <p className="text-sm">
                    <a 
                      href={`https://github.com/cosmosalad/hightech_tft/tree/main/data/${selectedFolder}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      GitHub data/{selectedFolder}/ 폴더
                    </a>
                    <br />에 SVG 파일을 추가해보세요
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedFile && (
        <SVGViewer
          svgContent={svgContent}
          fileName={selectedFile}
          onClose={() => {
            setSelectedFile(null);
            setSvgContent('');
            onClose();
          }}
        />
      )}
    </>
  );
};

export default MaskPictureViewer;