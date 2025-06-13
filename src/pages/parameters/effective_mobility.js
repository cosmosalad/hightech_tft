export const calculateMuEff = (mu0, theta, vg, vth) => {
  if (!mu0 || !theta || vg <= vth) return 0;
  
  // μeff = μ0 / (1 + θ(VG - Vth))
  return mu0 / (1 + theta * (vg - vth));
};
