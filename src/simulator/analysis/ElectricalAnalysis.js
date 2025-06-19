export class ElectricalAnalysis {
  static calculateTFTParameters(layers) {
    // 다층 구조에서 TFT 특성 계산
    const gateOxide = layers.find(layer => layer.material === 'SiO2');
    const channel = layers.find(layer => layer.material === 'IZO');
    const electrodes = layers.filter(layer => layer.material === 'Al');

    if (!gateOxide || !channel || electrodes.length === 0) {
      return null;
    }

    // 기본 파라미터 계산
    const Cox = 3.9 * 8.854e-14 / (gateOxide.thickness * 1e-7); // F/cm²
    const W = 100; // μm (채널 폭)
    const L = 10; // μm (채널 길이)
    
    const mobility = channel.properties?.mobility || 15; // cm²/Vs
    const vth = 2.0 + (channel.thickness - 30) * 0.05; // V

    return {
      mobility,
      vth,
      Cox,
      onOffRatio: Math.pow(10, 6 + mobility / 5),
      subthresholdSwing: 2.3 * (1 + 0.1 * Math.random()), // V/decade
      saturationCurrent: 0.5 * mobility * Cox * (W/L) * Math.pow(5 - vth, 2) * 1e-6 // A
    };
  }

  static generateIDVGCurve(parameters, vgRange = [-5, 15], vd = 5) {
    const { mobility, vth, Cox, subthresholdSwing } = parameters;
    const curve = [];
    
    for (let vg = vgRange[0]; vg <= vgRange[1]; vg += 0.1) {
      let id;
      if (vg < vth) {
        // Subthreshold region
        id = 1e-12 * Math.exp((vg - vth) / subthresholdSwing);
      } else {
        // Linear/Saturation region
        if (vd < vg - vth) {
          // Linear region
          id = mobility * Cox * (100/10) * ((vg - vth) * vd - 0.5 * vd * vd) * 1e-6;
        } else {
          // Saturation region
          id = 0.5 * mobility * Cox * (100/10) * Math.pow(vg - vth, 2) * 1e-6;
        }
      }
      
      curve.push({ vg: vg.toFixed(1), id: Math.max(id, 1e-15) });
    }
    
    return curve;
  }

  static generateIDVDCurve(parameters, vdRange = [0, 10], vgValues = [2, 4, 6, 8, 10]) {
    const { mobility, vth, Cox } = parameters;
    const curves = {};
    
    vgValues.forEach(vg => {
      const curve = [];
      for (let vd = vdRange[0]; vd <= vdRange[1]; vd += 0.1) {
        let id;
        if (vg < vth) {
          id = 1e-12;
        } else if (vd < vg - vth) {
          // Linear region
          id = mobility * Cox * (100/10) * ((vg - vth) * vd - 0.5 * vd * vd) * 1e-6;
        } else {
          // Saturation region
          id = 0.5 * mobility * Cox * (100/10) * Math.pow(vg - vth, 2) * 1e-6;
        }
        
        curve.push({ vd: vd.toFixed(1), id: Math.max(id, 1e-15) });
      }
      curves[`Vg=${vg}V`] = curve;
    });
    
    return curves;
  }
}
