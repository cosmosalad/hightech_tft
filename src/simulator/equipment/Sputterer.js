import { ProcessModels } from '../core/ProcessModels.js';

export class Sputterer {
  constructor() {
    this.type = 'sputtering';
    this.maxPower = 500; // W
    this.minPressure = 1; // mTorr
    this.maxPressure = 20; // mTorr
    this.targets = ['IZO', 'ITO', 'AZO'];
    this.currentState = {
      power: 0,
      pressure: 10,
      temperature: 25,
      isRunning: false,
      plasmaOn: false
    };
  }

  validateRecipe(recipe) {
    const errors = [];
    
    if (recipe.power > this.maxPower) {
      errors.push(`전력이 최대값(${this.maxPower}W)을 초과합니다.`);
    }
    
    if (recipe.pressure < this.minPressure || recipe.pressure > this.maxPressure) {
      errors.push(`압력이 범위(${this.minPressure}-${this.maxPressure} mTorr)를 벗어납니다.`);
    }
    
    if (!this.targets.includes(recipe.material)) {
      errors.push('지원하지 않는 타겟 재료입니다.');
    }
    
    return errors;
  }

  runProcess(recipe, onProgress) {
    const errors = this.validateRecipe(recipe);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    this.currentState.isRunning = true;
    this.currentState.plasmaOn = true;
    const result = ProcessModels.sputteringModel(recipe);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2; // 스퍼터링은 빠른 공정
      onProgress({
        progress,
        currentPower: recipe.power,
        currentPressure: recipe.pressure,
        estimatedThickness: (progress / 100) * result.thickness
      });
      
      if (progress >= 100) {
        clearInterval(interval);
        this.currentState.isRunning = false;
        this.currentState.plasmaOn = false;
      }
    }, recipe.time * 5);

    return result;
  }

  getCurrentState() {
    return { ...this.currentState };
  }
}