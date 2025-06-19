// src/simulator/core/ProcessModels.js
import { PhysicsEngine } from './PhysicsEngine.js';

export class ProcessModels {
  static oxidationModel(recipe) {
    const { temperature, time, atmosphere } = recipe;
    
    // Deal-Grove 모델 기반 산화막 성장
    const B = atmosphere === 'Dry O2' ? 0.165 : 0.720; // μm²/hr
    const A = atmosphere === 'Dry O2' ? 0.040 : 0.050; // μm
    
    const tempFactor = Math.exp(-1.23 * (1273 / (temperature + 273) - 1273 / 1373));
    const effectiveB = B * tempFactor;
    
    const thickness = Math.sqrt(effectiveB * time + (A/2)**2) - A/2;
    
    return {
      thickness: thickness * 1000, // nm
      uniformity: 95 + Math.random() * 5,
      stress: 'compressive',
      quality: temperature > 1000 ? 'high' : 'medium'
    };
  }

  static sputteringModel(recipe) {
    const { power, pressure, temperature, time, material } = recipe;
    
    // 스퍼터링 수율 계산 (yield를 sputterYield로 변경)
    const sputterYieldData = {
      'IZO': 0.8,
      'ITO': 0.9,
      'AZO': 0.7,
      'Al': 1.2
    };
    
    const sputterYield = sputterYieldData[material] || 0.8;
    const rate = (power / 150) * sputterYield * (10 / pressure) * 2.5; // nm/min
    const thickness = rate * time;
    
    return {
      thickness,
      uniformity: 90 + (power / 500) * 8 + Math.random() * 2,
      resistivity: PhysicsEngine.calculateElectricalProperties(material, thickness, temperature).resistivity,
      crystallinity: temperature > 200 ? 'polycrystalline' : 'amorphous'
    };
  }

  static evaporationModel(recipe) {
    const { power, pressure, temperature, time, material } = recipe;
    
    // E-beam 증착 모델
    const rate = (power / 3) * (1e-6 / pressure) * 5; // nm/min
    const thickness = rate * time;
    
    return {
      thickness,
      uniformity: 85 + (1e-6 / pressure) * 10 + Math.random() * 5,
      adhesion: temperature > 100 ? 'excellent' : 'good',
      grainSize: Math.log(power) * 10,
      resistivity: PhysicsEngine.calculateElectricalProperties(material, thickness, temperature).resistivity
    };
  }
}