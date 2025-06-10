import React from 'react';
import { Calculator } from 'lucide-react';

// Cox 자동 계산 (εr_SiO2 = 3.9, ε0 = 8.854e-12 F/m)
const calculateCox = (tox) => {
  const epsilon_r = 3.9;
  const epsilon_0 = 8.854e-12;
  return (epsilon_r * epsilon_0) / tox;
};

const ParameterInputSection = ({ 
  deviceParams, 
  setDeviceParams, 
  showParamInput 
}) => {
  if (!showParamInput) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <Calculator className="w-5 h-5 mr-2" />
        디바이스 파라미터 입력
      </h3>
      <p className="text-sm text-gray-600 mb-4">정확한 이동도(mobility) 계산을 위해 아래 파라미터들을 입력하세요.</p>
      
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">채널 폭 (W) [μm]</label>
          <input
            type="number"
            value={Math.round(deviceParams.W * 1e6 * 10) / 10}
            onChange={(e) => {
              const newW = parseFloat(e.target.value) * 1e-6;
              setDeviceParams({...deviceParams, W: newW});
            }}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="예: 100"
            max="10000"
            step="0.1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">채널 길이 (L) [μm]</label>
          <input
            type="number"
            value={Math.round(deviceParams.L * 1e6 * 10) / 10}
            onChange={(e) => {
              const newL = parseFloat(e.target.value) * 1e-6;
              setDeviceParams({...deviceParams, L: newL});
            }}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="예: 50, 4200"
            max="10000"
            step="0.1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">산화막 두께 (tox) [nm]</label>
          <input
            type="number"
            value={Math.round(deviceParams.tox * 1e9 * 10) / 10}
            onChange={(e) => {
              const newTox = parseFloat(e.target.value) * 1e-9;
              const newCox = calculateCox(newTox) * 1e-4;
              setDeviceParams({...deviceParams, tox: newTox, Cox: newCox});
            }}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="예: 20, 60, 100"
            max="10000"
            step="0.1"
          />
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>계산된 Cox:</strong> {(calculateCox(deviceParams.tox) * 1e-4).toExponential(2)} F/cm²
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Cox는 tox 값으로부터 자동 계산됩니다 (SiO₂ 기준, εᵣ = 3.9)
        </p>
      </div>
    </div>
  );
};

export default ParameterInputSection;