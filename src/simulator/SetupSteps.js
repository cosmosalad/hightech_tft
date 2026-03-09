import React from 'react';
import { ChevronRight, Play } from 'lucide-react';
import { equipmentTypes, getParameterFields } from './simulatorData';

export const EquipmentSelector = ({ selectedEquipments, onEquipmentChange, onNext, selectionError, isSelectionComplete }) => {
  const getColorClasses = (color, selected) => {
    const baseClasses = selected ? 'ring-2 scale-102 shadow-[0_0_15px_rgba(currentColor,0.5)]' : 'hover:scale-102';
    switch (color) {
      case 'red':
        return `${baseClasses} ${selected ? 'ring-red-400 bg-red-900/20 border-red-500' : 'border-slate-700 bg-slate-800/50 hover:border-red-500/50 hover:bg-slate-800'}`;
      case 'purple':
        return `${baseClasses} ${selected ? 'ring-purple-400 bg-purple-900/20 border-purple-500' : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50 hover:bg-slate-800'}`;
      case 'blue':
        return `${baseClasses} ${selected ? 'ring-blue-400 bg-blue-900/20 border-blue-500' : 'border-slate-700 bg-slate-800/50 hover:border-blue-500/50 hover:bg-slate-800'}`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 font-sans">
      <div className="text-center mb-8 relative">
        <h2 className="text-3xl font-black text-white mb-2 tracking-widest uppercase flex items-center justify-center">
          <span className="w-8 h-px bg-cyan-500 mr-4"></span>
          ROUTING PROTOCOLS
          <span className="w-8 h-px bg-cyan-500 ml-4"></span>
        </h2>
        <p className="text-cyan-400/80 font-mono text-sm uppercase tracking-widest">Select Equipment Sequence for TFT Fabrication</p>
      </div>
      {selectionError && (
        <div className="text-center mb-6 bg-red-900/40 border border-red-500 text-red-400 font-mono uppercase tracking-wider p-4 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
          ⚠ [SECURITY ALERT] {selectionError}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {equipmentTypes.map((equipment) => {
          const isSelected = selectedEquipments.some(eq => eq.id === equipment.id);
          return (
            <div key={equipment.id} className={`border rounded-xl p-6 cursor-pointer transition-all duration-300 flex flex-col h-full relative overflow-hidden group ${getColorClasses(equipment.color, isSelected)}`} onClick={() => onEquipmentChange(equipment)}>
              
              {/* 스캔 장식 */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-50 transition-opacity w-[200%] -translate-x-1/2 group-hover:animate-[scan_2s_linear_infinite]"></div>
              
              <div className="flex items-start space-x-4 flex-1">
                <div className={`p-3 rounded-lg border shadow-inner bg-slate-900 ${equipment.color === 'red' ? 'text-red-400 border-red-900/50' : equipment.color === 'purple' ? 'text-purple-400 border-purple-900/50' : 'text-blue-400 border-blue-900/50'}`}>{equipment.icon}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 font-mono uppercase tracking-wide">{equipment.name}</h3>
                  <p className="text-slate-400 text-sm mb-4 leading-relaxed">{equipment.description}</p>
                  <div className="space-y-3 font-mono text-xs border-t border-slate-700 pt-4">
                    <div className="flex bg-slate-900/50 p-2 rounded items-center">
                      <span className="text-cyan-600 mr-2 w-16 uppercase">Target:</span>
                      <span className="text-slate-300 flex-1">{equipment.materials.join(', ')}</span>
                    </div>
                    <div className="flex bg-slate-900/50 p-2 rounded items-center">
                      <span className="text-cyan-600 mr-2 w-16 uppercase">Process:</span>
                      <span className="text-slate-300 flex-1">{equipment.processes.join(', ')}</span>
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <div className={`absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded text-white font-black text-sm font-mono shadow-[0_0_10px_currentColor] ${equipment.color === 'red' ? 'bg-red-500' : equipment.color === 'purple' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                    {selectedEquipments.findIndex(eq => eq.id === equipment.id) + 1}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {selectedEquipments.length > 0 && (
        <div className="bg-slate-800/80 rounded-xl shadow-lg border border-cyan-900/50 p-6 mb-6 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
          <h3 className="text-sm font-bold text-cyan-500 mb-4 font-mono uppercase tracking-widest flex items-center">
            <span className="w-1.5 h-4 bg-cyan-500 mr-2 inline-block"></span>
            Established Routing Path
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            {selectedEquipments.map((equipment, index) => (
              <React.Fragment key={`${equipment.id}-${index}`}>
                <div className={`px-4 py-2 rounded-lg border font-mono text-sm tracking-wide shadow-[0_0_10px_rgba(0,0,0,0.5)] ${equipment.color === 'red' ? 'bg-red-900/20 border-red-500/50 text-red-300' : equipment.color === 'purple' ? 'bg-purple-900/20 border-purple-500/50 text-purple-300' : 'bg-blue-900/20 border-blue-500/50 text-blue-300'}`}>
                  <span className="opacity-50 mr-2">0{index + 1}</span> 
                  <span className="font-bold">{equipment.name}</span>
                </div>
                {index < selectedEquipments.length - 1 && (<ChevronRight className="w-5 h-5 text-cyan-700 animate-[pulse_1.5s_infinite]" />)}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
      <div className="text-center mt-12">
        <button onClick={onNext} disabled={!isSelectionComplete} className={`px-10 py-4 font-mono font-bold tracking-widest uppercase transition-all duration-300 border-2 ${isSelectionComplete ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500 hover:bg-cyan-500 hover:text-slate-900 hover:shadow-[0_0_20px_rgba(6,182,212,0.6)]' : 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'}`}>
          {isSelectionComplete ? 'CONFIRM ROUTING →' : 'AWAITING SELECTION...'}
        </button>
      </div>
    </div>
  );
};

export const RecipeConfiguration = ({ selectedEquipments, recipes, onRecipeChange, onNext, onBack }) => {
  const handleParameterChange = (equipmentIndex, parameter, value) => {
    const newRecipes = [...recipes];
    newRecipes[equipmentIndex] = { ...newRecipes[equipmentIndex], [parameter]: value };
    onRecipeChange(newRecipes);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 font-sans">
      <div className="text-center mb-12 relative">
        <h2 className="text-3xl font-black text-white mb-2 tracking-widest uppercase flex items-center justify-center">
          <span className="w-8 h-px bg-purple-500 mr-4"></span>
          RECIPE CONFIGURATION
          <span className="w-8 h-px bg-purple-500 ml-4"></span>
        </h2>
        <p className="text-purple-400/80 font-mono text-sm uppercase tracking-widest">Adjust Process Parameters For Yield Optimization</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {selectedEquipments.map((equipment, index) => {
          const parameters = getParameterFields(equipment);
          const currentRecipe = recipes[index] || {};
          return (
            <div key={`recipe-${equipment.id}-${index}`} className="bg-slate-800/50 rounded-xl shadow-lg border border-slate-700 relative overflow-hidden backdrop-blur-sm flex flex-col">
              {/* 장식용 탑 바 */}
              <div className={`absolute top-0 inset-x-0 h-1 ${equipment.color === 'red' ? 'bg-red-500' : equipment.color === 'purple' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
              
              <div className="p-6 flex-1">
                <div className="flex items-center mb-6 pb-6 border-b border-slate-700">
                  <div className={`p-3 rounded-lg mr-4 border bg-slate-900 ${equipment.color === 'red' ? 'bg-red-900/20 text-red-400 border-red-500/30' : equipment.color === 'purple' ? 'bg-purple-900/20 text-purple-400 border-purple-500/30' : 'bg-blue-900/20 text-blue-400 border-blue-500/30'}`}>{equipment.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-mono uppercase">OP-{index + 1}: {equipment.name}</h3>
                    <p className="text-slate-400 text-xs mt-1">{equipment.description}</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {parameters.map((param) => (
                    <div key={param.key} className="space-y-2">
                      <label className="flex justify-between text-xs font-mono font-bold text-cyan-500 uppercase tracking-wider">
                        <span>{param.label}</span>
                        {param.type === 'number' && <span className="text-slate-500 lowercase">({param.min}-{param.max})</span>}
                      </label>
                      {param.type === 'select' ? (
                        <select 
                          value={currentRecipe[param.key] || param.default} 
                          onChange={(e) => handleParameterChange(index, param.key, e.target.value)} 
                          className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none font-mono text-sm"
                        >
                          {param.options.map((option) => (<option key={option} value={option}>{option}</option>))}
                        </select>
                      ) : (
                        <div className="space-y-4">
                          <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-lg focus-within:ring-1 focus-within:ring-cyan-500 focus-within:border-cyan-500 transition-all overflow-hidden shadow-inner">
                             <input 
                              type="number" 
                              min={param.min} 
                              max={param.max} 
                              step={param.step || 1} 
                              value={currentRecipe[param.key] || param.default} 
                              onChange={(e) => {
                                const value = e.target.value;
                                const numValue = value === '' ? '' : Number(value);
                                handleParameterChange(index, param.key, numValue);
                              }}
                              className="w-full bg-transparent px-4 py-3 text-cyan-400 font-bold outline-none font-mono text-lg leading-none" 
                             />
                             <div className="absolute right-0 inset-y-0 px-4 flex items-center bg-slate-800 border-l border-slate-700">
                               <span className="text-xs text-slate-400 font-mono tracking-widest">{param.unit}</span>
                             </div>
                          </div>
                          
                          {/* 사이버 슬라이더 */}
                          <div className="relative w-full h-1.5 bg-slate-800 rounded-full border border-slate-700 mt-2">
                            <input
                              type="range"
                              min={param.min} 
                              max={param.max} 
                              step={param.step || 1} 
                              value={currentRecipe[param.key] || param.default}
                              onChange={(e) => {
                                handleParameterChange(index, param.key, Number(e.target.value));
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div 
                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                              style={{ 
                                width: `${Math.min(100, Math.max(0, ((currentRecipe[param.key] || param.default) - param.min) / (param.max - param.min) * 100))}%` 
                              }}
                            >
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_8px_#fff]"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-center mt-12 gap-4 border-t border-slate-800 pt-8">
        <button onClick={onBack} className="px-6 py-3 border border-slate-700 text-slate-400 bg-slate-800/50 hover:bg-slate-800 hover:text-white rounded-lg font-mono text-sm uppercase tracking-wider transition-colors w-full sm:w-auto">
          ← ABORT & RETURN
        </button>
        <button onClick={onNext} className="px-10 py-4 bg-cyan-600/20 text-cyan-300 border-2 border-cyan-500 rounded-lg font-mono font-bold tracking-widest uppercase hover:bg-cyan-500 hover:text-slate-900 hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all duration-300 w-full sm:w-auto flex justify-center items-center">
          <Play className="w-5 h-5 mr-3 fill-current" />
          INITIATE SEQUENCE
        </button>
      </div>
    </div>
  );
};