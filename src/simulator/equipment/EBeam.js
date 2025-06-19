import { ProcessModels } from '../core/ProcessModels.js';

export class EBeam {
  constructor() {
    this.type = 'evaporation';
    this.maxPower = 10; // kW
    this.minVacuum = 1e-7; // Torr
    this.maxVacuum = 1e-5; // Torr
    this.sources = ['Al', 'Au', 'Ti', 'Cr', 'Cu'];
    this.currentState = {
      power: 0,
      pressure: 1e-6,
      temperature: 25,
      isRunning: false,
      beamOn: false
    };
  }

  validateRecipe(recipe) {
    const errors = [];
    
    if (recipe.power > this.maxPower) {
      errors.push(`전력이 최대값(${this.maxPower}kW)을 초과합니다.`);
    }
    
    if (recipe.pressure < this.minVacuum || recipe.pressure > this.maxVacuum) {
      errors.push(`진공도가 범위(${this.minVacuum}-${this.maxVacuum} Torr)를 벗어납니다.`);
    }
    
    if (!this.sources.includes(recipe.material)) {
      errors.push('지원하지 않는 증착 재료입니다.');
    }
    
    return errors;
  }

  runProcess(recipe, onProgress) {
    const errors = this.validateRecipe(recipe);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    this.currentState.isRunning = true;
    this.currentState.beamOn = true;
    const result = ProcessModels.evaporationModel(recipe);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 3; // E-beam은 빠른 공정
      onProgress({
        progress,
        currentPower: recipe.power,
        currentPressure: recipe.pressure,
        estimatedThickness: (progress / 100) * result.thickness
      });
      
      if (progress >= 100) {
        clearInterval(interval);
        this.currentState.isRunning = false;
        this.currentState.beamOn = false;
      }
    }, recipe.time * 3);

    return result;
  }

  getCurrentState() {
    return { ...this.currentState };
  }
}