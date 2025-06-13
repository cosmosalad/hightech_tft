import { calculateCox, CONSTANTS } from './utils.js';

export const calculateDit = (ss, deviceParams) => {
  if (!ss || ss <= 0 || !deviceParams.tox) return 0;
  
  const kT_q = (CONSTANTS.BOLTZMANN * CONSTANTS.ROOM_TEMP) / CONSTANTS.ELEMENTARY_CHARGE;
  const cox = calculateCox(deviceParams.tox) * 1e-4; // F/cm²
  
  // Dit = (Cox/q) × (SS/(2.3×kT/q) - 1)
  const dit = (cox / CONSTANTS.ELEMENTARY_CHARGE) * (ss / (2.3 * kT_q) - 1);
  
  return dit > 0 && dit < 1e15 ? dit : 0;
};