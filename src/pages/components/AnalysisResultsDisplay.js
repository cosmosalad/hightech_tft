import React from 'react';
import { ArrowLeft, Home, Table, Star } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AnalysisResultsDisplay = ({
  analysisResults,
  completeAnalysisResults,
  deviceParams,
  showDataTable,
  setShowDataTable,
  setCurrentPage,
  handleGoToMainHome
}) => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">TFT 완벽 통합 분석 결과</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentPage('home')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              분석기 홈으로
            </button>
            <button
              onClick={handleGoToMainHome}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              메인 홈으로
            </button>
          </div>
        </div>

        {/* 🎯 통합 분석 결과 (메인 섹션) */}
        {completeAnalysisResults && Object.keys(completeAnalysisResults).length > 0 && (
          <CompleteAnalysisSection 
            completeAnalysisResults={completeAnalysisResults}
            deviceParams={deviceParams}
          />
        )}

        {/* 기존 개별 분석 결과 */}
        {analysisResults && Object.keys(analysisResults).map((type) => {
          const resultArray = analysisResults[type];
          
          if (resultArray.length === 0) return null;

          return (
            <IndividualAnalysisSection 
              key={type}
              type={type}
              resultArray={resultArray}
            />
          );
        })}

        {/* 통합 결과 요약표 */}
        {completeAnalysisResults && Object.keys(completeAnalysisResults).length > 0 && (
          <>
            <div className="text-center mb-8">
              <button
                onClick={() => setShowDataTable(!showDataTable)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center mx-auto"
              >
                <Table className="w-5 h-5 mr-2" />
                {showDataTable ? '통합 결과표 숨기기' : '통합 결과표 보기'}
              </button>
            </div>

            {showDataTable && (
              <IntegratedResultsTable 
                completeAnalysisResults={completeAnalysisResults}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// 완전 분석 결과 섹션
const CompleteAnalysisSection = ({ completeAnalysisResults, deviceParams }) => (
  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-lg p-8 mb-8">
    <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
      <Star className="w-8 h-8 text-yellow-500 mr-3" />
      완벽한 통합 분석 결과
    </h2>
    
    <div className="grid gap-6">
      {Object.entries(completeAnalysisResults).map(([sampleName, result]) => (
        <div key={sampleName} className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              {sampleName}
              <span className="text-sm font-normal text-gray-600 ml-3">
                (W={(deviceParams.W * 1e6).toFixed(1)}μm, L={(deviceParams.L * 1e6).toFixed(1)}μm, tox={(deviceParams.tox * 1e9).toFixed(1)}nm)
              </span>
            </h3>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                result.quality.grade === 'A' ? 'bg-green-100 text-green-800' :
                result.quality.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                result.quality.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                품질: {result.quality.grade} ({result.quality.score}점)
              </span>
              <div className="flex space-x-2">
                {result.hasLinear && <span className="w-3 h-3 bg-blue-500 rounded-full" title="Linear"></span>}
                {result.hasSaturation && <span className="w-3 h-3 bg-green-500 rounded-full" title="Saturation"></span>}
                {result.hasIDVD && <span className="w-3 h-3 bg-purple-500 rounded-full" title="IDVD"></span>}
                {result.hasHysteresis && <span className="w-3 h-3 bg-orange-500 rounded-full" title="Hysteresis"></span>}
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* 핵심 파라미터 */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-3">🎯 핵심 파라미터</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Vth:</span>
                  <span className="font-mono">{result.parameters['Vth (Linear 기준)']}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">gm_max:</span>
                  <span className="font-mono">{result.parameters['gm_max (Linear 기준)']}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">μFE:</span>
                  <span className="font-mono">{result.parameters['μFE (통합 계산)']}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">μeff:</span>
                  <span className="font-mono">{result.parameters['μeff (정확 계산)']}</span>
                </div>
              </div>
            </div>

            {/* 품질 지표 */}
            <div className="bg-gradient-to-br from-green-50 to-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-3">📊 품질 지표</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">SS:</span>
                  <span className="font-mono">{result.parameters['SS (Linear 기준)']}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ion/Ioff:</span>
                  <span className="font-mono">{result.parameters['Ion/Ioff']}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hysteresis:</span>
                  <span className="font-mono">{result.parameters['ΔVth (Hysteresis)']}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">안정성:</span>
                  <span className="font-mono">{result.parameters['Stability']}</span>
                </div>
              </div>
            </div>

            {/* 계산 상세 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-3">🔬 계산 상세</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">μ0:</span>
                  <span className="font-mono">{result.parameters['μ0 (Y-function)']}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">θ:</span>
                  <span className="font-mono">{result.parameters['θ (계산값)']}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dit:</span>
                  <span className="font-mono">{result.parameters['Dit (Linear 기준)']}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ron:</span>
                  <span className="font-mono">{result.parameters['Ron']}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 경고 및 품질 문제 */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <h5 className="font-semibold text-yellow-800 mb-2">⚠️ 주의사항:</h5>
              <ul className="text-sm text-yellow-700 space-y-1">
                {result.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {result.quality.issues.length > 0 && (
            <div className="mt-2 p-3 bg-red-50 border-l-4 border-red-400 rounded">
              <h5 className="font-semibold text-red-800 mb-2">❌ 품질 문제:</h5>
              <ul className="text-sm text-red-700 space-y-1">
                {result.quality.issues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

// 개별 분석 섹션
const IndividualAnalysisSection = ({ type, resultArray }) => {
  const hasMultipleFiles = resultArray.length > 1;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {type} 개별 분석 {hasMultipleFiles ? `(${resultArray.length}개 파일)` : ''}
      </h2>
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">측정 데이터 그래프</h3>

          {/* IDVD 차트 */}
          {type === 'IDVD' && (
            <IDVDCharts resultArray={resultArray} hasMultipleFiles={hasMultipleFiles} />
          )}

          {/* IDVG-Hysteresis 차트 */}
          {type === 'IDVG-Hysteresis' && (
            <HysteresisCharts resultArray={resultArray} hasMultipleFiles={hasMultipleFiles} />
          )}

          {/* IDVG-Linear, IDVG-Saturation 차트 */}
          {(type === 'IDVG-Linear' || type === 'IDVG-Saturation') && (
            <>
              <IDVGCharts resultArray={resultArray} type={type} />
              {/* gm 차트 */}
              {resultArray.some(result => result.gmData) && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">gm (Transconductance) 그래프</h3>
                  <GmCharts resultArray={resultArray} />
                </div>
              )}
            </>
          )}
        </div>

        {/* 파라미터 표시 영역 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">개별 계산 파라미터</h3>
          {resultArray.map((result, index) => (
            <div key={index} className="mb-6">
              {hasMultipleFiles && (
                <h4 className="font-medium text-gray-700 mb-2 bg-gray-100 p-2 rounded text-sm">
                  {result.displayName}
                </h4>
              )}
              <div className="bg-gray-50 p-4 rounded-lg">
                {Object.entries(result.parameters).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                    <span className="font-medium text-gray-700 text-sm">{key}:</span>
                    <span className="text-gray-900 font-mono text-xs">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// IDVD 차트 컴포넌트
const IDVDCharts = ({ resultArray, hasMultipleFiles }) => (
  <div className="space-y-8">
    {resultArray.map((result, fileIndex) => {
      if (!result || !result.chartData) return null;

      return (
        <div key={fileIndex} className="relative">
          {hasMultipleFiles && (
            <h4 className="text-md font-medium mb-3 text-gray-700 bg-gray-100 p-2 rounded">
              {result.displayName}
            </h4>
          )}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={result.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="VD" 
                  label={{ value: 'VD (V)', position: 'insideBottom', offset: -10 }}
                  domain={[0, 'dataMax']}
                />
                <YAxis 
                  scale="linear"
                  domain={[0, 'dataMax']}
                  label={{ value: 'ID (A)', angle: -90, position: 'insideLeft', offset: 5 }}
                  tickFormatter={(value) => value.toExponential(0)}
                />
                <Tooltip formatter={(value) => [value.toExponential(2) + ' A', 'ID']} />
                <Legend wrapperStyle={{ paddingTop: '10px' }}/>
                {result.gateVoltages && result.gateVoltages.map((vg, vgIndex) => (
                  <Line
                    key={vg}
                    type="monotone"
                    dataKey={`VG_${vg}V`}
                    stroke={`hsl(${(vgIndex * 60) % 360}, 70%, 50%)`}
                    strokeWidth={2}
                    dot={false}
                    name={`VG=${vg}V`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    })}
  </div>
);

// Hysteresis 차트 컴포넌트
const HysteresisCharts = ({ resultArray, hasMultipleFiles }) => (
  <div className="space-y-8">
    {resultArray.map((result, index) => {
      if (!result.forwardData || !result.backwardData) return null;
      
      const allVGValues = [...new Set([
        ...result.forwardData.map(d => d.VG),
        ...result.backwardData.map(d => d.VG)
      ])].sort((a, b) => a - b);
      
      const combinedData = allVGValues.map(vg => {
        const forwardPoint = result.forwardData.find(d => Math.abs(d.VG - vg) < 0.01);
        const backwardPoint = result.backwardData.find(d => Math.abs(d.VG - vg) < 0.01);
        return {
          VG: vg,
          Forward: forwardPoint?.ID || null,
          Backward: backwardPoint?.ID || null
        };
      });

      return (
        <div key={index} className="relative">
          {hasMultipleFiles && (
            <h4 className="text-md font-medium mb-3 text-gray-700 bg-gray-100 p-2 rounded">
              {result.displayName}
            </h4>
          )}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="VG" 
                  label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }} 
                />
                <YAxis 
                  scale="log"
                  domain={[1e-12, 1e-3]}
                  label={{ value: 'ID (A)', angle: -90, position: 'insideLeft', offset: 15 }}
                  tickFormatter={(value) => value.toExponential(0)}
                />
                <Tooltip formatter={(value) => [value ? value.toExponential(2) + ' A' : 'N/A', '']} />
                <Legend wrapperStyle={{ paddingTop: '10px' }}/>
                <Line 
                  type="monotone" 
                  dataKey="Forward" 
                  stroke="#2563eb" 
                  name="Forward" 
                  strokeWidth={2} 
                  dot={false}
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="Backward" 
                  stroke="#dc2626" 
                  name="Backward" 
                  strokeWidth={2} 
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    })}
  </div>
);

// IDVG 차트 컴포넌트
const IDVGCharts = ({ resultArray, type }) => {
  const allVGValues = [...new Set(
    resultArray.flatMap(result => result.chartData ? result.chartData.map(d => d.VG) : [])
  )].sort((a, b) => a - b);
  
  if (allVGValues.length === 0) return null;
  
  const combinedData = allVGValues.map(vg => {
    const dataPoint = { VG: vg };
    resultArray.forEach((result, index) => {
      if (result.chartData) {
        const point = result.chartData.find(d => Math.abs(d.VG - vg) < 0.01);
        const key = result.displayName || `File${index + 1}`;
        dataPoint[key] = point?.ID || null;
      }
    });
    return dataPoint;
  });

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={combinedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="VG" 
            label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }} 
          />
          <YAxis 
            scale="log"
            domain={[1e-12, 1e-3]}
            label={{ value: 'ID (A)', angle: -90, position: 'insideLeft', offset: 5 }}
            tickFormatter={(value) => value.toExponential(0)}
          />
          <Tooltip formatter={(value) => [value ? value.toExponential(2) + ' A' : 'N/A', 'ID']} />
          <Legend wrapperStyle={{ paddingTop: '10px' }}/>
          {resultArray.map((result, index) => {
            const key = result.displayName || `File${index + 1}`;
            return (
              <Line 
                key={index}
                type="monotone" 
                dataKey={key}
                stroke={`hsl(${index * 120}, 70%, 50%)`} 
                strokeWidth={2} 
                dot={false}
                name={key}
                connectNulls={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// gm 차트 컴포넌트
const GmCharts = ({ resultArray }) => {
  const allVGValues = [...new Set(
    resultArray.filter(result => result.gmData)
      .flatMap(result => result.gmData.map(d => d.VG))
  )].sort((a, b) => a - b);
  
  if (allVGValues.length === 0) return null;
  
  const combinedGmData = allVGValues.map(vg => {
    const dataPoint = { VG: vg };
    resultArray.forEach((result, index) => {
      if (result.gmData) {
        const point = result.gmData.find(d => Math.abs(d.VG - vg) < 0.05);
        const key = `${result.displayName || `File${index + 1}`}_gm`;
        dataPoint[key] = point?.gm || null;
      }
    });
    return dataPoint;
  });
  
  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={combinedGmData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="VG" 
            label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }} 
          />
          <YAxis 
            label={{ value: 'gm (S)', angle: -90, position: 'insideLeft', offset: 5 }}
            tickFormatter={(value) => value.toExponential(0)}
          />
          <Tooltip formatter={(value) => [value ? value.toExponential(2) + ' S' : 'N/A', 'gm']} />
          <Legend wrapperStyle={{ paddingTop: '10px' }}/>
          {resultArray.map((result, index) => {
            if (!result.gmData) return null;
            const key = `${result.displayName || `File${index + 1}`}_gm`;
            return (
              <Line 
                key={index}
                type="monotone" 
                dataKey={key}
                stroke={`hsl(${index * 120 + 30}, 70%, 50%)`} 
                strokeWidth={2} 
                dot={false}
                name={`${result.displayName || `File${index + 1}`} gm`}
                connectNulls={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// 통합 결과 테이블 컴포넌트
const IntegratedResultsTable = ({ completeAnalysisResults }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
    <h2 className="text-2xl font-bold text-gray-800 mb-6">🎯 완벽한 통합 분석 결과표</h2>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-purple-100 to-blue-100">
            <th className="border border-gray-300 px-3 py-3 text-left font-semibold">샘플명</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">품질</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Vth (V)</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">gm_max (S)</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">μFE (cm²/V·s)</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">μ0 (cm²/V·s)</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">μeff (cm²/V·s)</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">θ (V⁻¹)</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">SS (V/Dec)</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Dit (cm⁻²eV⁻¹)</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Ion/Ioff</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">ΔVth (V)</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Ron (Ω)</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">데이터 소스</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(completeAnalysisResults).map(([sampleName, result]) => (
            <tr key={sampleName} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-3 py-2 font-medium bg-blue-50">
                {sampleName}
              </td>
              <td className="border border-gray-300 px-2 py-2 text-center">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  result.quality.grade === 'A' ? 'bg-green-100 text-green-800' :
                  result.quality.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                  result.quality.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {result.quality.grade}
                </span>
              </td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                {result.parameters['Vth (Linear 기준)']}
              </td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                {result.parameters['gm_max (Linear 기준)']}
              </td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs font-bold text-blue-700">
                {result.parameters['μFE (통합 계산)']}
              </td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                {result.parameters['μ0 (Y-function)']}
              </td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                {result.parameters['μeff (정확 계산)']}
              </td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                {result.parameters['θ (계산값)']}
              </td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                {result.parameters['SS (Linear 기준)']}
              </td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                {result.parameters['Dit (Linear 기준)']}
              </td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                {result.parameters['Ion/Ioff']}
              </td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                {result.parameters['ΔVth (Hysteresis)']}
              </td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-xs">
                {result.parameters['Ron']}
              </td>
              <td className="border border-gray-300 px-2 py-2 text-center text-xs">
                <div className="flex justify-center space-x-1">
                  {result.hasLinear && <span className="w-2 h-2 bg-blue-500 rounded-full" title="Linear"></span>}
                  {result.hasSaturation && <span className="w-2 h-2 bg-green-500 rounded-full" title="Saturation"></span>}
                  {result.hasIDVD && <span className="w-2 h-2 bg-purple-500 rounded-full" title="IDVD"></span>}
                  {result.hasHysteresis && <span className="w-2 h-2 bg-orange-500 rounded-full" title="Hysteresis"></span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default AnalysisResultsDisplay;