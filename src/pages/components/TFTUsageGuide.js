// src/pages/components/TFTUsageGuide.js

import React, { useState } from 'react';
import { Info, X, CheckCircle, AlertTriangle, FileText, Zap, BarChart3, Activity, TrendingUp, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

const TFTUsageGuide = ({ showUsageGuide, setShowUsageGuide }) => {
  const [activeSection, setActiveSection] = useState('overview');

  if (!showUsageGuide) return null;

  // 섹션 토글 함수
  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? '' : section);
  };

  // Excel 파일 아이콘 컴포넌트
  const ExcelFileIcon = ({ type, filename, bgColor = 'bg-green-100', textColor = 'text-green-700' }) => (
    <div className={`flex flex-col items-center p-2 ${bgColor} rounded-lg border border-green-200 min-w-0`}>
      <div className={`w-10 h-10 ${bgColor.replace('100', '200')} rounded border border-green-300 flex items-center justify-center relative flex-shrink-0`}>
        <span className={`text-xs font-bold ${textColor}`}>XL</span>
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-gray-300 transform rotate-45"></div>
      </div>
      <p className={`text-xs font-medium ${textColor} mt-1 text-center truncate max-w-full`} title={filename}>
        {filename}
      </p>
    </div>
  );

  // 측정 타입별 설명 컴포넌트
  const MeasurementTypeCard = ({ icon, title, bgColor, textColor, description, voltageRange, purpose }) => (
    <div className={`${bgColor} p-4 rounded-xl border-2 border-opacity-30`} 
         style={{ borderColor: textColor.replace('text-', '').replace('-800', '') }}>
      <div className="flex items-center mb-3">
        {icon}
        <h4 className={`font-bold ${textColor} text-lg ml-2`}>{title}</h4>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className={`text-sm ${textColor.replace('800', '700')} mb-2`}><strong>측정 목적:</strong></p>
          <p className="text-sm text-gray-700">{purpose}</p>
        </div>
        
        <div>
          <p className={`text-sm ${textColor.replace('800', '700')} mb-2`}><strong>전압 범위(예):</strong></p>
          <p className="text-sm text-gray-700">{voltageRange}</p>
        </div>
        

      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 space-y-6"
    >
      {/* 네비게이션 탭 */}
      <div className="flex flex-wrap gap-2 mb-6 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
        {[
          { id: 'overview', label: '🔍 개요', icon: <Info className="w-4 h-4" /> },
          { id: 'filenames', label: '📁 파일명 규칙', icon: <FileText className="w-4 h-4" /> },
          { id: 'measurements', label: '⚡ 측정 방식', icon: <Zap className="w-4 h-4" /> },
          { id: 'dataformat', label: '📊 데이터 형식', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'workflow', label: '🔄 분석 흐름', icon: <Activity className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => toggleSection(tab.id)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeSection === tab.id
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-200'
            }`}
          >
            {tab.icon}
            <span className="ml-2">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 개요 섹션 */}
      {activeSection === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl">
            <h3 className="text-2xl font-bold mb-4">🎯 TFT 통합 분석 시스템</h3>
            <p className="text-lg mb-4">
              Probe Station에서 측정한 TFT 전기적 특성 데이터를 자동으로 분석하여 
              핵심 파라미터를 추출하는 시스템입니다.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <h4 className="font-bold mb-2 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  핵심 기능
                </h4>
                <ul className="text-sm space-y-1">
                  <li>• 4가지 측정 타입 자동 인식</li>
                  <li>• 샘플명 기반 데이터 그룹화</li>
                  <li>• 15개 이상 TFT 파라미터 자동 계산</li>
                  <li>• 데이터 품질 평가 및 신뢰도 분석</li>
                </ul>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <h4 className="font-bold mb-2 flex items-center">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  지원 측정
                </h4>
                <ul className="text-sm space-y-1">
                  <li>• IDVG-Linear (Vth, 이동도, gm, Ion/Ioff)</li>
                  <li>• IDVG-Saturation (포화영역 전류 특성)</li>
                  <li>• IDVD (Ron, 출력특성)</li>
                  <li>• IDVG-Hysteresis (안정성, ΔVth)</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 파일명 규칙 섹션 */}
      {activeSection === 'filenames' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="bg-white p-6 rounded-xl border-2 border-blue-200">
            <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
              <FileText className="w-6 h-6 mr-3" />
              파일명 자동 인식 규칙
            </h3>
            
            {/* 측정 타입별 파일명 예시 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {[
                {
                  type: 'IDVD',
                  bgColor: 'bg-purple-50',
                  textColor: 'text-purple-700',
                  keywords: ['IDVD'],
                  examples: ['DKTFTIDV.xls', 'Sample_A_IDVD.xlsx', 'T1_IDVD_measurement.xlsx']
                },
                {
                  type: 'IDVG-Linear',
                  bgColor: 'bg-blue-50',
                  textColor: 'text-blue-700',
                  keywords: ['IDVG', 'Linear', 'Lin'],
                  examples: ['DKTFTIDVG_VD_Linear.xls', 'Sample_A_IDVG_Lin.xlsx', 'T1_IDVG_Linear.xlsx']
                },
                {
                  type: 'IDVG-Saturation',
                  bgColor: 'bg-green-50',
                  textColor: 'text-green-700',
                  keywords: ['IDVG', 'Sat', 'Saturation'],
                  examples: ['DKTFTIDVG_VD_Sat.xls', 'Sample_A_IDVG_Sat.xlsx', 'T1_IDVG_Saturation.xlsx']
                },
                {
                  type: 'IDVG-Hysteresis',
                  bgColor: 'bg-orange-50',
                  textColor: 'text-orange-700',
                  keywords: ['IDVG', 'Linear', 'Hys', 'Hysteresis'],
                  examples: ['DKTFTIDVG_VD_Linear_Hys.xls', 'Sample_A_IDVG_Hys.xlsx', 'T1_IDVG_Linear_Hysteresis.xlsx']
                }
              ].map((typeInfo, index) => (
                <div key={index} className={`${typeInfo.bgColor} p-4 rounded-lg border-2 border-opacity-30`}>
                  <h4 className={`font-bold ${typeInfo.textColor} mb-3 text-lg`}>{typeInfo.type}</h4>
                  
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">필수 키워드:</p>
                    <div className="flex flex-wrap gap-1">
                      {typeInfo.keywords.map((keyword, i) => (
                        <span key={i} className={`px-2 py-1 ${typeInfo.bgColor.replace('50', '200')} ${typeInfo.textColor} text-xs font-bold rounded`}>
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">파일명 예시:</p>
                    <div className="space-y-2">
                      {typeInfo.examples.map((example, i) => (
                        <div key={i} className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          <code className="text-xs bg-white px-2 py-1 rounded border font-mono">
                            {example}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 샘플명 자동 추출 예시 */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200">
              <h4 className="font-bold text-amber-800 mb-3">🔗 샘플명 자동 그룹화</h4>
              <p className="text-sm text-amber-700 mb-4">
                파일명에서 숫자와 측정 타입을 제거하여 샘플명을 자동 추출하고, 같은 샘플명끼리 그룹화합니다.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <ExcelFileIcon 
                      filename="DK_TFT_IDVD.xls" 
                      bgColor="bg-purple-50" 
                      textColor="text-purple-700" 
                    />
                    <span className="text-gray-500">→</span>
                    <div className="bg-blue-100 px-3 py-2 rounded-lg">
                      <span className="font-bold text-blue-800">DKTFT</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <ExcelFileIcon 
                      filename="DK_TFT_IDVG_Linear.xls" 
                      bgColor="bg-blue-50" 
                      textColor="text-blue-700" 
                    />
                    <span className="text-gray-500">→</span>
                    <div className="bg-blue-100 px-3 py-2 rounded-lg">
                      <span className="font-bold text-blue-800">DKTFT</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-600 text-white p-3 rounded-lg text-center">
                  <p className="font-bold">💡 같은 샘플명(DKTFT)으로 그룹화되어 통합 분석됩니다!</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 측정 방식 섹션 */}
      {activeSection === 'measurements' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="bg-white p-6 rounded-xl border-2 border-green-200">
            <h3 className="text-xl font-bold text-green-800 mb-6 flex items-center">
              <Zap className="w-6 h-6 mr-3" />
              TFT 4가지 핵심 측정 방식
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MeasurementTypeCard
                icon={<BarChart3 className="w-6 h-6 text-blue-800" />}
                title="IDVG-Linear"
                bgColor="bg-blue-50"
                textColor="text-blue-800"
                purpose="선형영역에서 전계효과 이동도, 문턱전압, Ion/Ioff 비율 측정"
                voltageRange="VG: -10V → +20V (0.1V step), VD: 0.1V (일정)"
              />
              
              <MeasurementTypeCard
                icon={<TrendingUp className="w-6 h-6 text-green-800" />}
                title="IDVG-Saturation"
                bgColor="bg-green-50"
                textColor="text-green-800"
                purpose="포화영역에서 문턱전압과 포화전류 특성 분석"
                voltageRange="VG: -10V → +20V (0.1V step), VD: 20V (일정)"
              />
              
              <MeasurementTypeCard
                icon={<Activity className="w-6 h-6 text-purple-800" />}
                title="IDVD"
                bgColor="bg-purple-50"
                textColor="text-purple-800"
                purpose="온저항(Ron) 측정"
                voltageRange="VD: 0V → +30V (1V step), VG: -10V → +20V (2V step)"
              />
              
              <MeasurementTypeCard
                icon={<RotateCcw className="w-6 h-6 text-orange-800" />}
                title="IDVG-Hysteresis"
                bgColor="bg-orange-50"
                textColor="text-orange-800"
                purpose="소자 안정성 평가 및 이력현상(히스테리시스) 분석"
                voltageRange="VG: -10V ⇄ +20V (순방향→역방향), VD: 0.1V (일정)"
              />
            </div>

            {/* 측정 조건 요약 */}
            <div className="mt-6 bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border">
              <h4 className="font-bold text-gray-800 mb-3">📋 표준 측정 조건 요약</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-gray-700 mb-2">전압 범위(예):</p>
                  <ul className="space-y-1 text-gray-600">
                    <li>• 게이트 전압(VG): -10V ~ +20V</li>
                    <li>• 드레인 전압(VD): 0V ~ +30V</li>
                    <li>• 소스 전압(VS): 0V (접지)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 mb-2">측정 환경:</p>
                  <ul className="space-y-1 text-gray-600">
                    <li>• 온도: 실온 (25°C)</li>
                    <li>• 대기압: 표준 대기압</li>
                    <li>• 프로브 스테이션 환경</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 데이터 형식 섹션 */}
      {activeSection === 'dataformat' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="bg-white p-6 rounded-xl border-2 border-purple-200">
            <h3 className="text-xl font-bold text-purple-800 mb-6 flex items-center">
              <BarChart3 className="w-6 h-6 mr-3" />
              Excel 데이터 형식 요구사항
            </h3>
            
            {/* 필수 컬럼 */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200 mb-6">
              <h4 className="font-bold text-blue-800 mb-3">📊 필수 데이터 컬럼</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border">
                  <h5 className="font-semibold text-green-700 mb-2">✅ 지원되는 컬럼명</h5>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-blue-700 mb-2">IDVG 측정 파일:</p>
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <code className="bg-green-100 px-2 py-1 rounded text-sm font-mono">DrainV</code>
                          <span className="ml-2 text-sm text-gray-600">(드레인 전압)</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <code className="bg-green-100 px-2 py-1 rounded text-sm font-mono">DrainI</code>
                          <span className="ml-2 text-sm text-gray-600">(드레인 전류)</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <code className="bg-green-100 px-2 py-1 rounded text-sm font-mono">GateV</code>
                          <span className="ml-2 text-sm text-gray-600">(게이트 전압)</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <code className="bg-green-100 px-2 py-1 rounded text-sm font-mono">GateI</code>
                          <span className="ml-2 text-sm text-gray-600">(게이트 전류)</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <code className="bg-green-100 px-2 py-1 rounded text-sm font-mono">GM</code>
                          <span className="ml-2 text-sm text-gray-600">(전사컨덕턴스)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-purple-700 mb-2">IDVD 측정 파일:</p>
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <code className="bg-purple-100 px-2 py-1 rounded text-sm font-mono">DrainV(1)</code>
                          <span className="ml-2 text-sm text-gray-600">(드레인 전압)</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <code className="bg-purple-100 px-2 py-1 rounded text-sm font-mono">DrainI(1)</code>
                          <span className="ml-2 text-sm text-gray-600">(드레인 전류)</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <code className="bg-purple-100 px-2 py-1 rounded text-sm font-mono">GateV(1)</code>
                          <span className="ml-2 text-sm text-gray-600">(게이트 전압)</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <code className="bg-purple-100 px-2 py-1 rounded text-sm font-mono">GateI(1)</code>
                          <span className="ml-2 text-sm text-gray-600">(게이트 전류)</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <code className="bg-purple-100 px-2 py-1 rounded text-sm font-mono">GM(1)</code>
                          <span className="ml-2 text-sm text-gray-600">(전사컨덕턴스)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 p-2 rounded border border-amber-200">
                      <p className="text-xs text-amber-700">
                        💡 <strong>참고:</strong> IDVD 파일은 여러 게이트 전압에서 측정하므로 컬럼명에 (1), (2), (3) 등의 번호가 붙습니다.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg border">
                  <h5 className="font-semibold text-red-700 mb-2">❌ 주의사항</h5>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start">
                      <AlertTriangle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>컬럼명은 대소문자를 구분합니다</span>
                    </div>
                    <div className="flex items-start">
                      <AlertTriangle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>빈 셀이나 텍스트 데이터는 자동으로 제외됩니다</span>
                    </div>
                    <div className="flex items-start">
                      <AlertTriangle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>첫 번째 행은 반드시 헤더여야 합니다</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-bold text-gray-800 mb-3">📋 Excel 파일 구조 예시</h4>
              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-blue-700 mb-2">IDVG 측정 파일 구조:</h5>
                  <table className="w-full border-collapse border border-gray-400 text-sm">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="border border-gray-400 px-2 py-2 font-bold text-blue-800">GateV (V)</th>
                        <th className="border border-gray-400 px-2 py-2 font-bold text-blue-800">DrainI (A)</th>
                        <th className="border border-gray-400 px-2 py-2 font-bold text-blue-800">DrainV (V)</th>
                        <th className="border border-gray-400 px-2 py-2 font-bold text-blue-800">GateI (A)</th>
                        <th className="border border-gray-400 px-2 py-2 font-bold text-blue-800">GM (S)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 px-2 py-1 text-center">-10.0</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">1.23E-12</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">0.1</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">2.45E-15</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">8.67E-14</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-400 px-2 py-1 text-center">-9.9</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">1.45E-12</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">0.1</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">2.51E-15</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">9.23E-14</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-2 py-1 text-center">...</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">...</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">...</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">...</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">...</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h5 className="font-semibold text-purple-700 mb-2">IDVD 측정 파일 구조:</h5>
                  <table className="w-full border-collapse border border-gray-400 text-sm">
                    <thead>
                      <tr className="bg-purple-100">
                        <th className="border border-gray-400 px-2 py-2 font-bold text-purple-800">DrainV(1) (V)</th>
                        <th className="border border-gray-400 px-2 py-2 font-bold text-purple-800">DrainI(1) (A)</th>
                        <th className="border border-gray-400 px-2 py-2 font-bold text-purple-800">GateV(1) (V)</th>
                        <th className="border border-gray-400 px-2 py-2 font-bold text-purple-800">GateI(1) (A)</th>
                        <th className="border border-gray-400 px-2 py-2 font-bold text-purple-800">GM(1) (S)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 px-2 py-1 text-center">0.0</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">0.00E+00</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">-10.0</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">1.23E-15</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">2.45E-14</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-400 px-2 py-1 text-center">1.0</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">2.34E-13</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">-10.0</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">1.25E-15</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">2.67E-14</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-2 py-1 text-center">...</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">...</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">...</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">...</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">...</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
            <div className="mt-3 text-xs text-gray-600">
              <p>💡 <strong>팁:</strong> 실제 분석에는 DrainV, DrainI 컬럼이 주로 사용되며, 다른 컬럼들은 참고용입니다.</p>
            </div>
            </div>

            {/* 데이터 품질 가이드 */}
            <div className="mt-6 bg-amber-50 p-4 rounded-lg border border-amber-200">
              <h4 className="font-bold text-amber-800 mb-3">🎯 데이터 품질 최적화 팁</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-amber-700 mb-2">측정 범위:</p>
                  <ul className="space-y-1 text-amber-600">
                    <li>• IDVG: -10V ~ +20V (충분한 범위)</li>
                    <li>• IDVD: 0V ~ +30V (선형~포화 영역)</li>
                    <li>• 최소 100개 이상의 데이터 포인트</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-amber-700 mb-2">데이터 신뢰성:</p>
                  <ul className="space-y-1 text-amber-600">
                    <li>• 노이즈 최소화 (평균화 권장)</li>
                    <li>• 일정한 측정 간격 유지</li>
                    <li>• 측정 환경 안정화</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 분석 흐름 섹션 */}
      {activeSection === 'workflow' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="bg-white p-6 rounded-xl border-2 border-green-200">
            <h3 className="text-xl font-bold text-green-800 mb-6 flex items-center">
              <Activity className="w-6 h-6 mr-3" />
              TFT 통합 분석 워크플로우
            </h3>
            
            {/* 단계별 분석 흐름 */}
            <div className="space-y-4">
              {[
                {
                  step: 1,
                  title: "파일 업로드 및 인식",
                  description: "Excel 파일을 업로드하면 파일명을 분석하여 측정 타입을 자동 인식",
                  details: [
                    "파일명 패턴 매칭으로 측정 타입 구분",
                    "샘플명 자동 추출 및 그룹화",
                    "Excel 구조 검증 (AV, AI 컬럼 확인)"
                  ],
                  bgColor: "bg-blue-50",
                  borderColor: "border-blue-200",
                  textColor: "text-blue-800",
                  icon: <FileText className="w-6 h-6 text-blue-600" />
                },
                {
                  step: 2,
                  title: "데이터 전처리",
                  description: "측정 데이터를 정제하고 분석에 적합한 형태로 변환",
                  details: [
                    "결측치 및 이상치 제거",
                    "데이터 타입 변환 (문자→숫자)",
                    "측정 범위별 데이터 분할"
                  ],
                  bgColor: "bg-purple-50",
                  borderColor: "border-purple-200", 
                  textColor: "text-purple-800",
                  icon: <BarChart3 className="w-6 h-6 text-purple-600" />
                },
                {
                  step: 3,
                  title: "개별 특성 분석",
                  description: "각 측정 타입별로 고유한 전기적 특성 파라미터 추출",
                  details: [
                    "IDVG-Linear: μFE, gm, Ion/Ioff, Vth",
                    "IDVG-Saturation: Vth, SS, Dit, ID_sat",
                    "IDVD: Ron, 출력 특성",
                    "Hysteresis: ΔVth, 안정성 지표"
                  ],
                  bgColor: "bg-green-50",
                  borderColor: "border-green-200",
                  textColor: "text-green-800", 
                  icon: <Zap className="w-6 h-6 text-green-600" />
                },
                {
                  step: 4,
                  title: "통합 분석 및 평가",
                  description: "샘플별로 모든 측정 결과를 통합하여 종합적인 TFT 성능 평가",
                  details: [
                    "샘플별 파라미터 통합",
                    "데이터 품질 점수 계산",
                    "성능 지표 종합 평가",
                    "결과 시각화 및 리포트 생성"
                  ],
                  bgColor: "bg-orange-50",
                  borderColor: "border-orange-200",
                  textColor: "text-orange-800",
                  icon: <TrendingUp className="w-6 h-6 text-orange-600" />
                }
              ].map((workflow, index) => (
                <div key={index} className={`${workflow.bgColor} p-4 rounded-lg border-2 ${workflow.borderColor}`}>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 ${workflow.bgColor.replace('50', '200')} rounded-full flex items-center justify-center border-2 ${workflow.borderColor}`}>
                        {workflow.icon}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className={`inline-block w-6 h-6 rounded-full ${workflow.textColor.replace('text-', 'bg-').replace('800', '600')} text-white text-sm font-bold flex items-center justify-center mr-3`}>
                          {workflow.step}
                        </span>
                        <h4 className={`font-bold text-lg ${workflow.textColor}`}>
                          {workflow.title}
                        </h4>
                      </div>
                      
                      <p className={`${workflow.textColor.replace('800', '700')} mb-3`}>
                        {workflow.description}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {workflow.details.map((detail, i) => (
                          <div key={i} className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {index < 3 && (
                    <div className="flex justify-center mt-4">
                      <div className="w-0.5 h-8 bg-gradient-to-b from-gray-300 to-transparent"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 결과 해석 가이드 */}
            <div className="mt-8 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border-2 border-indigo-200">
              <h4 className="font-bold text-indigo-800 mb-4 text-lg flex items-center">
                <Info className="w-5 h-5 mr-2" />
                분석 결과 해석 가이드
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold text-indigo-700 mb-3">핵심 성능 지표</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-white rounded border">
                      <span className="font-medium">μFE (이동도)</span>
                      <span className="text-green-600">높을수록 좋음</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded border">
                      <span className="font-medium">Ion/Ioff 비율</span>
                      <span className="text-green-600">높을수록 좋음</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded border">
                      <span className="font-medium">SS (Subthreshold Swing)</span>
                      <span className="text-red-600">낮을수록 좋음</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded border">
                      <span className="font-medium">ΔVth (히스테리시스)</span>
                      <span className="text-red-600">낮을수록 좋음</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-semibold text-indigo-700 mb-3">데이터 품질 지표</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center p-2 bg-white rounded border">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span><strong>우수:</strong> R² &gt; 0.95, 노이즈 &lt; 5%</span>
                    </div>
                    <div className="flex items-center p-2 bg-white rounded border">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                      <span><strong>양호:</strong> R² &gt; 0.9, 노이즈 &lt; 10%</span>
                    </div>
                    <div className="flex items-center p-2 bg-white rounded border">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                      <span><strong>보통:</strong> R² &gt; 0.8, 노이즈 &lt; 15%</span>
                    </div>
                    <div className="flex items-center p-2 bg-white rounded border">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                      <span><strong>불량:</strong> R² &lt; 0.8, 노이즈 &gt; 15%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 문제 해결 가이드 */}
            <div className="mt-6 bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-bold text-red-800 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                자주 발생하는 문제 및 해결책
              </h4>
              
              <div className="space-y-3 text-sm">
                <div className="bg-white p-3 rounded border">
                  <p className="font-semibold text-red-700 mb-1">❌ "파일 타입을 인식할 수 없습니다"</p>
                  <p className="text-gray-700">→ 파일명에 IDVD, IDVG, Linear, Saturation, Hysteresis 키워드 포함 확인</p>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <p className="font-semibold text-red-700 mb-1">❌ "AV 또는 AI 컬럼을 찾을 수 없습니다"</p>
                  <p className="text-gray-700">→ Excel 첫 번째 행에 AV, AI (또는 Voltage, Current) 헤더 확인</p>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <p className="font-semibold text-red-700 mb-1">❌ "분석 결과가 이상합니다"</p>
                  <p className="text-gray-700">→ 데이터 범위, 측정 조건, 노이즈 수준 점검. 디바이스 파라미터 재확인</p>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <p className="font-semibold text-red-700 mb-1">❌ "파라미터가 N/A로 표시됩니다"</p>
                  <p className="text-gray-700">→ 해당 측정 타입의 파일이 누락되었거나 데이터 품질이 불충분함</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 하단 요약 정보 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">🎉 분석 준비 완료!</h3>
          <p className="text-lg mb-4">
            위의 가이드를 참고하여 Excel 파일을 준비하고 업로드하면 
            <br />자동으로 TFT 전기적 특성이 분석됩니다.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <span className="font-bold">15+</span>
              <div className="text-sm">핵심 파라미터</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <span className="font-bold">4가지</span>
              <div className="text-sm">측정 타입</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <span className="font-bold">자동</span>
              <div className="text-sm">품질 평가</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <span className="font-bold">통합</span>
              <div className="text-sm">결과 분석</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TFTUsageGuide;