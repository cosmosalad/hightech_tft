import React from 'react';
import { Flame, Target, Zap } from 'lucide-react';

// 장비 종류 데이터
export const equipmentTypes = [
  {
    id: 'oxidation',
    name: '열산화 (Furnace)',
    icon: <Flame className="w-8 h-8" />,
    description: 'SiO₂ 절연층 형성',
    materials: ['SiO₂'],
    processes: ['Dry Oxidation', 'Wet Oxidation', 'Steam Oxidation'],
    color: 'red'
  },
  {
    id: 'sputtering',
    name: 'RF 스퍼터링',
    icon: <Target className="w-8 h-8" />,
    description: '반도체/금속 박막 증착',
    materials: ['IZO', 'ITO', 'AZO', 'Al', 'Ti', 'Mo'],
    processes: ['RF Sputtering', 'DC Sputtering', 'Reactive Sputtering'],
    color: 'purple'
  },
  {
    id: 'evaporation',
    name: 'E-beam 증착',
    icon: <Zap className="w-8 h-8" />,
    description: '금속 전극 형성',
    materials: ['Al', 'Au', 'Ti', 'Cr', 'Cu'],
    processes: ['E-beam Evaporation', 'Thermal Evaporation'],
    color: 'blue'
  }
];

// 장비별 레시피 파라미터 데이터
export const getParameterFields = (equipment) => {
  switch (equipment.id) {
    case 'oxidation':
      return [
        { key: 'temperature', label: '온도 (°C)', min: 800, max: 1200, default: 1000, unit: '°C' },
        { key: 'time', label: '시간 (분)', min: 30, max: 480, default: 120, unit: 'min' },
        { key: 'atmosphere', label: '분위기', type: 'select', options: ['O₂', 'H₂O + O₂', 'Dry O₂'], default: 'O₂' },
        { key: 'targetThickness', label: '목표 두께 (nm)', min: 10, max: 200, default: 50, unit: 'nm' }
      ];
    case 'sputtering':
      return [
        { key: 'power', label: 'RF 파워 (W)', min: 50, max: 500, default: 150, unit: 'W' },
        { key: 'pressure', label: '압력 (mTorr)', min: 1, max: 20, default: 5, unit: 'mTorr', step: 0.1 },
        { key: 'temperature', label: '온도 (°C)', min: 25, max: 300, default: 100, unit: '°C' },
        { key: 'time', label: '시간 (분)', min: 5, max: 120, default: 30, unit: 'min' },
        { key: 'material', label: '타겟 재료', type: 'select', options: ['IZO', 'ITO', 'AZO'], default: 'IZO' },
        { key: 'targetThickness', label: '목표 두께 (nm)', min: 10, max: 100, default: 30, unit: 'nm' }
      ];
    case 'evaporation':
      return [
        { key: 'power', label: 'E-beam 파워 (kW)', min: 1, max: 10, default: 3, unit: 'kW', step: 0.1 },
        { key: 'pressure', label: '진공도 (Torr)', min: 1e-7, max: 1e-5, default: 1e-6, unit: 'Torr', step: 1e-7 },
        { key: 'temperature', label: '온도 (°C)', min: 25, max: 100, default: 25, unit: '°C' },
        { key: 'rate', label: '증착 속도 (Å/s)', min: 0.5, max: 10, default: 2, unit: 'Å/s', step: 0.1 },
        { key: 'material', label: '재료', type: 'select', options: ['Al', 'Au', 'Ti', 'Cr'], default: 'Al' },
        { key: 'targetThickness', label: '목표 두께 (nm)', min: 50, max: 500, default: 100, unit: 'nm' }
      ];
    default:
      return [];
  }
};