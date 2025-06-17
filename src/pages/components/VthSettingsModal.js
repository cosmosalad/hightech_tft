import React, { useState, useEffect } from 'react';
import { X, Calculator, Info, Star, Target, TrendingUp, AlertCircle, CheckCircle, Settings } from 'lucide-react';

const VthSettingsModal = ({ isOpen, onClose, currentMethod, onMethodChange }) => {
  const [selectedMethod, setSelectedMethod] = useState(currentMethod || 'linear_extrapolation_linear');
  const [targetCurrent, setTargetCurrent] = useState('1e-7');
  const [subthresholdMin, setSubthresholdMin] = useState('-10');
  const [subthresholdMax, setSubthresholdMax] = useState('-6');
  const [targetLogCurrent, setTargetLogCurrent] = useState('-7');

  // currentMethod가 변경될 때 selectedMethod 업데이트
  useEffect(() => {
    if (currentMethod) {
      setSelectedMethod(currentMethod);
    }
  }, [currentMethod]);

  const methods = [
    {
      id: 'linear_extrapolation_linear',
      name: 'Linear Extrapolation',
      subtitle: 'Linear Scale (전통적 방법)',
      description: 'gm_max 지점에서 실측값 기반 선형 외삽',
      formula: 'Vth = VG_at_gm_max - (ID_at_gm_max / gm_max)',
      accuracy: '높음 (80-90%)',
      rank: 2,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      pros: ['직관적이고 이해하기 쉬움', '전통적으로 널리 사용', '구현이 간단함', '물리적 의미가 명확'],
      cons: ['gm_max 지점의 정확도에 의존', '노이즈에 민감할 수 있음', '측정 조건에 따라 변동 가능'],
      useCases: ['기존 연구와의 호환성이 중요한 경우', '교육 및 학습 목적', '기본적인 특성 평가'],
      principle: 'gm이 최대인 지점에서 ID vs VG의 접선을 구하여 VG축과의 교점을 계산합니다.'
    },
    {
      id: 'constant_current',
      name: 'Constant Current Method',
      subtitle: '정전류법 (산업 표준)',
      description: '특정 전류값에서의 게이트 전압을 Vth로 정의',
      formula: 'Vth = VG at ID = I_target (일반적으로 1×10⁻⁷ A)',
      accuracy: '매우 높음 (95-98%)',
      rank: 1,
      icon: <Target className="w-5 h-5" />,
      color: 'bg-gradient-to-r from-emerald-500 to-green-600',
      pros: ['산업 표준으로 널리 인정', '재현성이 매우 우수', '측정 조건과 무관하게 일관된 기준', '노이즈에 강함'],
      cons: ['임의의 전류값 기준', '물리적 의미가 상대적으로 약함', '낮은 전류 영역의 정확도 필요'],
      useCases: ['연구개발 및 제품 평가', '품질관리 및 비교 분석', '국제 표준 준수가 필요한 경우'],
      principle: 'log(ID) vs VG 데이터에서 보간법을 사용하여 특정 전류값에서의 정확한 VG를 계산합니다.'
    },
    {
      id: 'subthreshold_extrapolation',
      name: 'Subthreshold Extrapolation',
      subtitle: 'Subthreshold 기울기 외삽법',
      description: 'Subthreshold 영역에서 log(ID) vs VG의 선형성 이용',
      formula: 'log(ID) = slope × VG + intercept → VG = (log_target - intercept) / slope',
      accuracy: '높음 (85-92%)',
      rank: 3,
      icon: <Calculator className="w-5 h-5" />,
      color: 'bg-gradient-to-r from-purple-500 to-indigo-600',
      pros: ['Subthreshold 영역의 물리적 특성 반영', '안정적인 결과', 'SS 계산과 연계 가능'],
      cons: ['Subthreshold 영역 선택에 민감', '계산이 상대적으로 복잡', '데이터 범위 설정이 중요'],
      useCases: ['물리적 특성 분석이 중요한 연구', 'SS와 연계된 분석', '정밀한 특성 평가'],
      principle: 'Subthreshold 영역에서의 선형 관계를 이용하여 외삽법으로 특정 전류값에서의 VG를 계산합니다.'
    },
    {
      id: 'linear_extrapolation_log',
      name: 'Log Scale Extrapolation',
      subtitle: '로그 스케일 선형 외삽법',
      description: '로그 스케일에서 gm_max 기반 선형 외삽',
      formula: 'log(ID) = gm_max_log × (VG - Vth) + C',
      accuracy: '보통 (70-85%)',
      rank: 4,
      icon: <Settings className="w-5 h-5" />,
      color: 'bg-gradient-to-r from-orange-500 to-red-600',
      pros: ['넓은 전류 범위에서 안정적', '로그 스케일 특성 반영', '특수한 경우에 유용'],
      cons: ['복잡성 증가', '에러 전파 가능', 'gm_max 의존성', '구현 난이도 높음'],
      useCases: ['넓은 전류 범위 분석', '특수한 디바이스 특성 연구', '로그 스케일 분석이 중요한 경우'],
      principle: '로그 스케일에서 gm의 최대값을 찾고 이 지점에서의 접선을 이용하여 외삽합니다.'
    }
  ];

  const handleApply = () => {
    const options = {
      method: selectedMethod
    };

    // 방법별 추가 옵션 설정
    if (selectedMethod === 'constant_current') {
      options.targetCurrent = parseFloat(targetCurrent);
    } else if (selectedMethod === 'subthreshold_extrapolation') {
      options.subthresholdRange = {
        min: parseFloat(subthresholdMin),
        max: parseFloat(subthresholdMax)
      };
      options.targetLogCurrent = parseFloat(targetLogCurrent);
    }

    onMethodChange(options);
    onClose();
  };

  const handleReset = () => {
    setSelectedMethod('linear_extrapolation_linear');
    setTargetCurrent('1e-7');
    setSubthresholdMin('-10');
    setSubthresholdMax('-6');
    setTargetLogCurrent('-7');
  };

  const getCurrentMethodData = () => methods.find(m => m.id === selectedMethod);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
        {/* 헤더 */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700 text-white p-6">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                <Calculator className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Threshold Voltage Calculator</h2>
                <p className="text-blue-100 mt-1">Vth 계산 방법 설정</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex h-[calc(100vh-300px)] max-h-[600px]">
          {/* 메서드 선택 패널 */}
          <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-indigo-600" />
              계산 방법 선택
            </h3>
            
            <div className="space-y-3">
              {methods.map((method) => (
                <div
                  key={method.id}
                  className={`relative cursor-pointer transition-all duration-200 ${
                    selectedMethod === method.id
                      ? 'transform scale-[1.02]'
                      : 'hover:transform hover:scale-[1.01]'
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className={`rounded-xl p-4 border-2 ${
                    selectedMethod === method.id
                      ? 'border-indigo-400 bg-indigo-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        checked={selectedMethod === method.id}
                        onChange={() => setSelectedMethod(method.id)}
                        className="mt-1.5 text-indigo-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`p-2 rounded-lg text-white ${method.color.replace('bg-gradient-to-r', 'bg-gradient-to-br')}`}>
                            {method.icon}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{method.name}</h4>
                            <p className="text-sm text-gray-600">{method.subtitle}</p>
                          </div>
                          <div className="flex items-center space-x-1 ml-auto">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < (6 - method.rank) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-xs font-bold text-indigo-600">#{method.rank}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-2">{method.description}</p>
                        
                        <div className="bg-gray-50 p-2 rounded-lg mb-2">
                          <code className="text-xs text-gray-800 font-mono">{method.formula}</code>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                            {method.accuracy}
                          </span>
                          <span className="text-gray-500">{method.useCases[0]}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 상세 설정 및 정보 패널 */}
          <div className="w-1/2 p-6 overflow-y-auto bg-gray-50">
            {getCurrentMethodData() && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Info className="w-5 h-5 mr-2 text-indigo-600" />
                    {getCurrentMethodData().name} 상세 정보
                  </h3>
                  
                  {/* 원리 설명 */}
                  <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                      <Calculator className="w-4 h-4 mr-1 text-blue-600" />
                      계산 원리
                    </h4>
                    <p className="text-sm text-gray-700">{getCurrentMethodData().principle}</p>
                  </div>

                  {/* 장단점 */}
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        장점
                      </h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        {getCurrentMethodData().pros.map((pro, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-medium text-orange-800 mb-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        단점 및 주의사항
                      </h4>
                      <ul className="text-sm text-orange-700 space-y-1">
                        {getCurrentMethodData().cons.map((con, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-orange-500 mr-2">•</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* 사용 사례 */}
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-blue-800 mb-2">권장 사용 사례</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {getCurrentMethodData().useCases.map((useCase, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {useCase}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 방법별 특수 옵션 */}
                {selectedMethod === 'constant_current' && (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-emerald-900 mb-3 flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      정전류법 설정
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-emerald-800 mb-2">
                          목표 전류값 선택
                        </label>
                        <select
                          value={targetCurrent}
                          onChange={(e) => setTargetCurrent(e.target.value)}
                          className="w-full border border-emerald-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                          <option value="1e-5">1×10⁻⁵ A (10 μA) - 높은 전류</option>
                          <option value="1e-6">1×10⁻⁶ A (1 μA) - 일반적</option>
                          <option value="1e-7">1×10⁻⁷ A (100 nA) - 표준 권장</option>
                          <option value="1e-8">1×10⁻⁸ A (10 nA) - 낮은 전류</option>
                          <option value="1e-9">1×10⁻⁹ A (1 nA) - 매우 낮은 전류</option>
                        </select>
                        <p className="text-xs text-emerald-600 mt-1">
                          일반적으로 1×10⁻⁷ A가 가장 널리 사용되는 표준값입니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedMethod === 'subthreshold_extrapolation' && (
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                      <Calculator className="w-4 h-4 mr-1" />
                      Subthreshold 외삽법 설정
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-purple-800 mb-1">
                            최소 log(ID)
                          </label>
                          <input
                            type="number"
                            value={subthresholdMin}
                            onChange={(e) => setSubthresholdMin(e.target.value)}
                            className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            step="1"
                            min="-15"
                            max="-1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-purple-800 mb-1">
                            최대 log(ID)
                          </label>
                          <input
                            type="number"
                            value={subthresholdMax}
                            onChange={(e) => setSubthresholdMax(e.target.value)}
                            className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            step="1"
                            min="-15"
                            max="-1"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-purple-800 mb-1">
                          목표 log(ID) 값
                        </label>
                        <select
                          value={targetLogCurrent}
                          onChange={(e) => setTargetLogCurrent(e.target.value)}
                          className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="-6">-6 (1 μA)</option>
                          <option value="-7">-7 (100 nA) - 권장</option>
                          <option value="-8">-8 (10 nA)</option>
                          <option value="-9">-9 (1 nA)</option>
                        </select>
                      </div>
                      <div className="bg-purple-100 p-3 rounded-lg">
                        <p className="text-xs text-purple-700">
                          <strong>💡 설정 가이드:</strong><br/>
                          • Subthreshold 영역: 일반적으로 -12 ~ -6 범위<br/>
                          • 선형성이 좋은 구간을 선택하세요 (R² &gt; 0.95)<br/>
                          • 너무 좁은 범위는 피하고 최소 3-4 decade 확보
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 권장사항 */}
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">권장사항:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>연구/개발: <strong>Constant Current Method</strong></li>
                        <li>기존 방법 유지: <strong>Linear Extrapolation</strong></li>
                        <li>물리적 분석: <strong>Subthreshold Extrapolation</strong></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleReset}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-all duration-200"
              >
                <Settings className="w-4 h-4" />
                <span>기본값으로 리셋</span>
              </button>
              
              <div className="text-sm text-gray-500">
                현재 선택: <span className="font-medium text-indigo-600">
                  {getCurrentMethodData()?.name || '선택된 방법 없음'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-all duration-200 border border-gray-300"
              >
                취소
              </button>
              <button
                onClick={handleApply}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Calculator className="w-4 h-4" />
                <span>설정 적용</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VthSettingsModal;