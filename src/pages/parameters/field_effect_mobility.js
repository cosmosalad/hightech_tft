import { calculateCox } from './utils.js';

export const calculateMuFE = (gm_max, deviceParams, vds) => {
  if (!gm_max || !deviceParams.W || !deviceParams.L || !vds) return 0;

  const { W, L, tox } = deviceParams;
  const cox = calculateCox(tox);
  
  // μFE = L/(W×Cox×VDS) × gm_max
  const muFE = (L / (W * cox * vds)) * gm_max * 1e4; // cm²/V·s
  
  return muFE;
};