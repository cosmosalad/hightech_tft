export const PHYSICAL_CONSTANTS = {
 EPSILON_0: 8.854e-12,
 BOLTZMANN: 1.380649e-23,
 ELEMENTARY_CHARGE: 1.602e-19,
 
 ROOM_TEMPERATURE: 300,
 THERMAL_VOLTAGE_300K: 0.0259,
 
 EPSILON_R: {
   SiO2: 3.9,
   Si3N4: 7.5,
   Al2O3: 9.0,
   HfO2: 25.0
 }
};

export const UNIT_CONVERSIONS = {
 nm_to_m: (nm) => nm * 1e-9,
 um_to_m: (um) => um * 1e-6,
 mm_to_m: (mm) => mm * 1e-3,
 cm_to_m: (cm) => cm * 1e-2,
 
 cm2_to_m2: (cm2) => cm2 * 1e-4,
 m2_to_cm2: (m2) => m2 * 1e4,
 
 mobility_cm2Vs_to_m2Vs: (mobility) => mobility * 1e-4,
 mobility_m2Vs_to_cm2Vs: (mobility) => mobility * 1e4,
 
 A_to_mA: (A) => A * 1000,
 mA_to_A: (mA) => mA / 1000,
 A_per_mm: (current_A, width_m) => current_A / (width_m * 1000),
 
 mV_to_V: (mV) => mV / 1000,
 V_to_mV: (V) => V * 1000
};

export const TFT_CONSTANTS = {
 MOBILITY_RANGE: {
   a_Si: { min: 0.1, max: 1.0 },
   poly_Si: { min: 10, max: 100 },
   IGZO: { min: 5, max: 50 },
   IZO: { min: 1, max: 20 }
 },
 
 VTH_RANGE: { min: -5, max: 10 },
 
 SS_IDEAL: 0.060,
 SS_ACCEPTABLE_MAX: 1.0,
 
 THETA_RANGE: { min: 0.001, max: 2.0 },
 
 DIT_RANGE: { min: 1e10, max: 1e13 }
};

export const validatePhysicalParameters = {
 mobility: (mobility, material = 'IGZO') => {
   const range = TFT_CONSTANTS.MOBILITY_RANGE[material] || TFT_CONSTANTS.MOBILITY_RANGE.IGZO;
   return {
     isValid: mobility >= range.min && mobility <= range.max * 2,
     range: range,
     warning: mobility > range.max ? 'unusually high' : mobility < range.min ? 'unusually low' : null
   };
 },
 
 vth: (vth) => {
   const range = TFT_CONSTANTS.VTH_RANGE;
   return {
     isValid: vth >= range.min && vth <= range.max,
     range: range,
     warning: vth > range.max ? 'high threshold voltage' : vth < range.min ? 'negative threshold' : null
   };
 },
 
 ss: (ss) => {
   return {
     isValid: ss >= TFT_CONSTANTS.SS_IDEAL && ss <= TFT_CONSTANTS.SS_ACCEPTABLE_MAX,
     ideal: TFT_CONSTANTS.SS_IDEAL,
     warning: ss > TFT_CONSTANTS.SS_ACCEPTABLE_MAX ? 'poor switching' : 
              ss < TFT_CONSTANTS.SS_IDEAL ? 'below theoretical limit' : null
   };
 },
 
 theta: (theta) => {
   const range = TFT_CONSTANTS.THETA_RANGE;
   return {
     isValid: theta >= range.min && theta <= range.max,
     range: range,
     warning: theta > range.max ? 'excessive degradation' : 
              theta < range.min ? 'negligible degradation' : null
   };
 }
};

export const getThermalVoltage = (temperature_K = PHYSICAL_CONSTANTS.ROOM_TEMPERATURE) => {
 return (PHYSICAL_CONSTANTS.BOLTZMANN * temperature_K) / PHYSICAL_CONSTANTS.ELEMENTARY_CHARGE;
};

export const calculateCoxForMaterial = (thickness_m, material = 'SiO2') => {
 const epsilon_r = PHYSICAL_CONSTANTS.EPSILON_R[material] || PHYSICAL_CONSTANTS.EPSILON_R.SiO2;
 return (PHYSICAL_CONSTANTS.EPSILON_0 * epsilon_r) / thickness_m;
};