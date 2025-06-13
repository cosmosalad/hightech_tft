import * as TFTParams from '../parameters/index.js';

// 호환성을 위한 wrapper 함수들
export const calculateCox = TFTParams.calculateCox;
export const calculateLinearRegression = TFTParams.linearRegression;
export const calculateGm = TFTParams.calculateGm;
export const calculateMuFE = TFTParams.calculateMuFE;
export const calculateSubthresholdSwing = TFTParams.calculateSS;
export const calculateThresholdVoltage = TFTParams.calculateVth;
export const calculateDit = TFTParams.calculateDit;

// FormulaCodeInspector에서 사용하는 함수들
export const calculateMu0UsingYFunction = TFTParams.calculateMu0;
export const calculateMuEff = TFTParams.calculateMuEff;
export const calculateTheta = TFTParams.calculateTheta;