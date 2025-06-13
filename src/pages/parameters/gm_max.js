export const calculateGmMax = (gmData) => {
  if (!gmData || gmData.length === 0) return { value: 0, vg: 0 };
  
  const maxPoint = gmData.reduce((max, current) => 
    current.gm > max.gm ? current : max
  );
  
  return { value: maxPoint.gm, vg: maxPoint.VG };
};
