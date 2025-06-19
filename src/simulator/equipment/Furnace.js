import { ProcessModels } from '../core/ProcessModels.js';

export class Furnace {
  constructor() {
    this.type = 'oxidation';
    this.maxTemperature = 1200; // °C
    this.maxWaferSize = 6; // inch
    this.gasLines = ['O2', 'N2', 'H2O'];
    this.currentState = {
      temperature: 25,
      atmosphere: 'N2',
      pressure: 760, // Torr
      isRunning: false
    };
  }

  validateRecipe(recipe) {
    const errors = [];
    
    if (recipe.temperature > this.maxTemperature) {
      errors.push(`온도가 최대값(${this.maxTemperature}°C)을 초과합니다.`);
    }
    
    if (recipe.temperature < 800) {
      errors.push('산화 공정은 최소 800°C 이상에서 진행해야 합니다.');
    }
    
    if (!this.gasLines.includes(recipe.atmosphere?.split(' ')[0])) {
      errors.push('지원하지 않는 가스입니다.');
    }
    
    return errors;
  }

  runProcess(recipe, onProgress) {
    const errors = this.validateRecipe(recipe);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    this.currentState.isRunning = true;
    const result = ProcessModels.oxidationModel(recipe);
    
    // 시뮬레이션 진행률 콜백
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      onProgress({
        progress,
        currentTemperature: this.currentState.temperature,
        estimatedThickness: (progress / 100) * result.thickness
      });
      
      if (progress >= 100) {
        clearInterval(interval);
        this.currentState.isRunning = false;
      }
    }, recipe.time * 10); // 실제 시간의 1/100로 가속

    return result;
  }

  getCurrentState() {
    return { ...this.currentState };
  }
}
