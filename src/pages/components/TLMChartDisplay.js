import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, X, Download, BarChart3, LineChart, Table,
  FileText, TrendingUp, Grid, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
import { exportResultsToCSV } from '../parameters/tlm';

const TLMChartDisplay = ({ results, onClose, onBack }) => {
  const [activeTab, setActiveTab] = useState('individual');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [visibleFiles, setVisibleFiles] = useState({});

  // 탭 구성
  const tabs = [
    { id: 'individual', label: '개별 파일 분석', icon: FileText },
    { id: 'integrated', label: '통합 TLM 분석', icon: TrendingUp },
    { id: 'data', label: '데이터 테이블', icon: Table }
  ];

  // 색상 팔레트
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  // 초기 가시성 설정
  React.useEffect(() => {
    if (results?.individualResults) {
      const initialVisibility = {};
      results.individualResults.forEach((_, index) => {
        initialVisibility[index] = true;
      });
      setVisibleFiles(initialVisibility);
    }
  }, [results]);

  // 통합 TLM 차트 데이터
  const integratedChartData = useMemo(() => {
    if (!results?.individualResults) return [];
    
    // 모든 거리값을 수집해서 정렬
    const allDistances = new Set();
    results.individualResults.forEach(file => {
      file.measurements.forEach(m => allDistances.add(m.distance));
    });
    const sortedDistances = Array.from(allDistances).sort((a, b) => a - b);
    
    // 각 거리별로 데이터 포인트 생성
    return sortedDistances.map(distance => {
      const dataPoint = { distance };
      results.individualResults.forEach((file, index) => {
        if (visibleFiles[index]) {
          const measurement = file.measurements.find(m => m.distance === distance);
          dataPoint[file.sampleName] = measurement ? measurement.resistance : null;
        }
      });
      return dataPoint;
    });
  }, [results, visibleFiles]);

  // 파일 가시성 토글
  const toggleFileVisibility = (index) => {
    setVisibleFiles(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // 데이터 내보내기
  const exportData = () => {
    const csvData = exportResultsToCSV(results);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TLM_Analysis_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{`거리: ${label} mm`}</p>
          {payload.map((entry, index) => (
            entry.value !== null && (
              <p key={index} style={{ color: entry.color }}>
                {`${entry.dataKey}: ${entry.value?.toFixed(2)} Ω`}
              </p>
            )
          ))}
        </div>
      );
    }
    return null;
  };

  // I-V 커스텀 툴팁
  const IVTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{`전압: ${label} V`}</p>
          <p style={{ color: payload[0]?.color }}>
            {`전류: ${payload[0]?.value?.toExponential(2)} A`}
          </p>
        </div>
      );
    }
    return null;
  };

  // 개별 파일 분석 렌더링
  const renderIndividualAnalysis = () => {
    if (!results?.individualResults?.length) return null;

    const selectedFile = results.individualResults[selectedFileIndex];

    return (
      <div className="space-y-6">
        {/* 파일 선택 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">파일 선택</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.individualResults.map((file, index) => (
              <button
                key={index}
                onClick={() => setSelectedFileIndex(index)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedFileIndex === index
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <div>
                    <p className="font-medium text-sm">{file.sampleName}</p>
                    <p className="text-xs text-gray-500">{file.fileName}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* I-V 그래프들 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            I-V 특성 곡선 - {selectedFile.sampleName}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedFile.ivCharts.map((chart, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-3">
                  {chart.sheetName} ({chart.distance}mm)
                  {!isNaN(chart.resistance) && (
                    <span className="text-sm text-gray-500 ml-2">
                      R = {chart.resistance.toFixed(2)} Ω
                    </span>
                  )}
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={chart.data} margin={{ left: 18, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="AV"
                        label={{ value: 'AV (V)', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        label={{ value: 'AI (A)', angle: -90, position: 'insideLeft', textAnchor: 'middle', dx: -15 }}
                        tickFormatter={(value) => value.toExponential(1)}
                      />
                      <Tooltip content={<IVTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="AI" 
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 저항 측정 결과 및 TLM 파라미터 테이블 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">저항 측정 결과 및 TLM 파라미터</h3>
          
          {/* 저항 측정 결과 */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-3">저항 측정 결과</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Distance (mm)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slope (A/V)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resistance (Ω)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      R²
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedFile.measurements.map((measurement, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {measurement.distance}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(1/measurement.resistance).toExponential(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {measurement.resistance.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {measurement.rSquared ? measurement.rSquared.toFixed(4) : '1.0000'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        from -2V to +2V (polyfit)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TLM 파라미터 */}
          {selectedFile.tlmParameters && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3">TLM 파라미터</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-blue-600 font-medium">접촉 저항 (Rc)</p>
                  <p className="text-xl font-bold text-blue-800">
                    {selectedFile.tlmParameters.Rc.toFixed(2)}
                  </p>
                  <p className="text-xs text-blue-600">Ω</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-green-600 font-medium">면저항 (Rsh)</p>
                  <p className="text-xl font-bold text-green-800">
                    {selectedFile.tlmParameters.Rsh.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-600">Ω/sq</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-purple-600 font-medium">전달 길이 (LT)</p>
                  <p className="text-xl font-bold text-purple-800">
                    {selectedFile.tlmParameters.LT.toFixed(3)}
                  </p>
                  <p className="text-xs text-purple-600">cm</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-orange-600 font-medium">접촉 비저항 (ρc)</p>
                  <p className="text-xl font-bold text-orange-800">
                    {selectedFile.tlmParameters.rho_c.toExponential(2)}
                  </p>
                  <p className="text-xs text-orange-600">Ω·cm²</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">분석 품질 (R²):</span>
                  <span className="font-mono">{selectedFile.tlmParameters.rSquared.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="font-medium">접촉 폭 (W):</span>
                  <span>{results.contactWidth} mm</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 통합 TLM 분석 렌더링
  const renderIntegratedAnalysis = () => {
    return (
      <div className="space-y-6">
        {/* 파일 가시성 제어 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">표시할 파일 선택</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {results.individualResults.map((file, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  checked={visibleFiles[index] || false}
                  onChange={() => toggleFileVisibility(index)}
                  className="mr-2"
                />
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-sm">{file.sampleName}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 통합 TLM 차트 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            TLM 분석 - Total Resistance & Distance
          </h3>
          <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart data={integratedChartData} margin={{ left: 45, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="distance"
                label={{ value: 'Distance (d) [mm]', position: 'insideBottom', offset: 0 }}
              />
              <YAxis 
                label={{ value: 'Total Resistance [Ω]', angle: -90, position: 'insideLeft', textAnchor: 'middle', dx: -40 }}
                tickFormatter={(value) => value.toExponential(1)}
              />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {results.individualResults.map((file, index) => (
                  visibleFiles[index] && (
                    <Line
                      key={file.fileName}
                      type="monotone"
                      dataKey={file.sampleName}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                      connectNulls={false}
                      name={file.sampleName}
                    />
                  )
                ))}
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 각 파일별 TLM 파라미터 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">각 파일별 TLM 파라미터</h3>
          
          {/* 개별 파일 TLM 파라미터 */}
          <div className="space-y-6">
            {results.individualResults.map((file, index) => (
              file.tlmParameters && (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    {file.sampleName}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-blue-600 font-medium">Rc (Ω)</p>
                      <p className="text-lg font-bold text-blue-800">
                        {file.tlmParameters.Rc.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-green-600 font-medium">Rsh (Ω/sq)</p>
                      <p className="text-lg font-bold text-green-800">
                        {file.tlmParameters.Rsh.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-purple-600 font-medium">LT (cm)</p>
                      <p className="text-lg font-bold text-purple-800">
                        {file.tlmParameters.LT.toFixed(3)}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-orange-600 font-medium">ρc (Ω·cm²)</p>
                      <p className="text-lg font-bold text-orange-800">
                        {file.tlmParameters.rho_c.toExponential(2)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-600 flex justify-between">
                    <span>R²: {file.tlmParameters.rSquared.toFixed(4)}</span>
                    <span>데이터 포인트: {file.measurements.length}개</span>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 데이터 테이블 렌더링
  const renderDataTable = () => (
    <div className="space-y-6">
      {/* 측정 데이터 테이블 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">측정 데이터</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  파일명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  거리 (mm)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  저항 (Ω)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기울기 (A/V)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results?.individualResults?.map((file) =>
                file.measurements.map((measurement, index) => (
                  <tr key={`${file.fileName}-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {file.fileName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {measurement.distance}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {measurement.resistance.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(1/measurement.resistance).toExponential(4)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TLM 파라미터 테이블 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">TLM 파라미터</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  파일명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rc (Ω)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rsh (Ω/sq)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LT (cm)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ρc (Ω·cm²)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  R²
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  데이터 포인트
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results?.individualResults?.map((file, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {file.fileName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {file.tlmParameters ? file.tlmParameters.Rc.toFixed(2) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {file.tlmParameters ? file.tlmParameters.Rsh.toFixed(2) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {file.tlmParameters ? file.tlmParameters.LT.toFixed(3) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {file.tlmParameters ? file.tlmParameters.rho_c.toExponential(2) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {file.tlmParameters ? file.tlmParameters.rSquared.toFixed(4) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {file.measurements.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden"
      >
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart3 className="w-6 h-6 mr-3" />
              <div>
                <h2 className="text-xl font-bold">TLM 분석 결과</h2>
                <p className="text-orange-100 text-sm">
                  {results?.totalFiles}개 파일 분석 완료
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportData}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV 내보내기
              </button>
              <button
                onClick={onBack}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 내용 */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-160px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'individual' && renderIndividualAnalysis()}
              {activeTab === 'integrated' && renderIntegratedAnalysis()}
              {activeTab === 'data' && renderDataTable()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default TLMChartDisplay;