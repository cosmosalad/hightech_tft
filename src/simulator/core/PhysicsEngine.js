export class PhysicsEngine {
  // Arrhenius 방정식 기반 온도 의존성 계산
  static calculateArrheniusRate(A, Ea, temperature) {
    const k = 8.617e-5; // Boltzmann constant (eV/K)
    const T = temperature + 273.15; // Celsius to Kelvin
    return A * Math.exp(-Ea / (k * T));
  }

  // 증착율 계산 (nm/min)
  static calculateDepositionRate(material, temperature, pressure, power) {
    const materialConstants = {
      'SiO2': { A: 1e10, Ea: 2.0 },
      'IZO': { A: 5e8, Ea: 1.5 },
      'Al': { A: 1e12, Ea: 1.8 }
    };

    const constants = materialConstants[material] || materialConstants['SiO2'];
    const baseRate = this.calculateArrheniusRate(constants.A, constants.Ea, temperature);
    
    // 압력과 전력 보정
    const pressureCorrection = Math.pow(pressure / 10, 0.3);
    const powerCorrection = Math.pow(power / 100, 0.5);
    
    return baseRate * pressureCorrection * powerCorrection / 1e6; // nm/min으로 변환
  }

  // 박막 두께 계산
  static calculateThickness(rate, time) {
    return rate * time; // nm
  }

  // 전기적 특성 계산
  static calculateElectricalProperties(material, thickness, temperature) {
    const properties = {
      'IZO': {
        mobility: 15 - (thickness - 30) * 0.1 - (temperature - 25) * 0.02,
        resistivity: 1e-3 * Math.exp((thickness - 30) / 50),
        vth: 2.5 + (thickness - 30) * 0.05
      },
      'Al': {
        resistivity: 2.7e-6,
        workFunction: 4.1
      }
    };

    return properties[material] || properties['IZO'];
  }
}