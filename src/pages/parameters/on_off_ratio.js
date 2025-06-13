export const calculateOnOffRatio = (chartData) => {
  if (!chartData || chartData.length === 0) {
    return { ion: 0, ioff: 0, ratio: 0 };
  }
  
  const ion = Math.max(...chartData.map(d => Math.abs(d.ID)));
  const validCurrents = chartData.map(d => Math.abs(d.ID)).filter(id => id > 1e-15);
  const ioff = validCurrents.length > 0 ? Math.min(...validCurrents) : 1e-12;
  
  return { ion, ioff, ratio: ion / ioff };
};