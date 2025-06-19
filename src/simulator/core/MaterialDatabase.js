export class MaterialDatabase {
  static materials = {
    'SiO2': {
      name: 'Silicon Dioxide',
      type: 'insulator',
      bandgap: 9.0, // eV
      dielectricConstant: 3.9,
      thermalConductivity: 1.4, // W/mK
      density: 2.2, // g/cm³
      opticalProperties: {
        refractiveIndex: 1.46,
        transparency: 95 // %
      }
    },
    'IZO': {
      name: 'Indium Zinc Oxide',
      type: 'semiconductor',
      bandgap: 3.3, // eV
      mobility: 15, // cm²/Vs
      carrierConcentration: 1e18, // cm⁻³
      resistivity: 1e-3, // Ω·cm
      thermalStability: 400, // °C
      opticalProperties: {
        transmittance: 85, // %
        absorption: 2.1 // eV
      }
    },
    'Al': {
      name: 'Aluminum',
      type: 'conductor',
      resistivity: 2.7e-6, // Ω·cm
      thermalConductivity: 237, // W/mK
      meltingPoint: 660, // °C
      density: 2.70, // g/cm³
      workFunction: 4.1 // eV
    }
  };

  static getMaterial(name) {
    return this.materials[name] || null;
  }

  static getAllMaterials() {
    return Object.keys(this.materials);
  }

  static getMaterialsByType(type) {
    return Object.entries(this.materials)
      .filter(([_, material]) => material.type === type)
      .map(([name, _]) => name);
  }
}