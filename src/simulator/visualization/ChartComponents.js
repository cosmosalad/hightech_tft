import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export const IDVGChart = ({ data, parameters }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">IDVG 특성 (Linear Scale)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="vg" 
            label={{ value: 'Gate Voltage (V)', position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            label={{ value: 'Drain Current (A)', angle: -90, position: 'insideLeft' }}
            domain={['dataMin', 'dataMax']}
          />
          <Tooltip formatter={(value) => [value.toExponential(2), 'ID (A)']} />
          <ReferenceLine x={parameters?.vth} stroke="red" strokeDasharray="5 5" />
          <Line 
            type="monotone" 
            dataKey="id" 
            stroke="#2563eb" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 text-sm text-gray-600 grid grid-cols-2 gap-2">
        <div>Vth: {parameters?.vth?.toFixed(2)} V</div>
        <div>μ: {parameters?.mobility?.toFixed(1)} cm²/Vs</div>
        <div>SS: {parameters?.subthresholdSwing?.toFixed(1)} V/dec</div>
        <div>On/Off: {parameters?.onOffRatio?.toExponential(1)}</div>
      </div>
    </div>
  );
};

export const IDVDChart = ({ data }) => {
  const vgValues = Object.keys(data);
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">IDVD 특성</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="vd"
            type="number"
            domain={[0, 10]}
            label={{ value: 'Drain Voltage (V)', position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            label={{ value: 'Drain Current (A)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip />
          {vgValues.map((vg, index) => (
            <Line
              key={vg}
              data={data[vg]}
              type="monotone"
              dataKey="id"
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
              name={vg}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};