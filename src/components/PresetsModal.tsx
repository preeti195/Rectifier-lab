import React from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { SimulationParams } from '../types';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (params: Partial<SimulationParams>) => void;
}

interface PresetItem {
  id: string;
  title: string;
  description: string;
  tag: string;
  params: Partial<SimulationParams>;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({ isOpen, onClose, onApplyPreset }) => {
  if (!isOpen) return null;

  const presets: PresetItem[] = [
    {
      id: '1ph-diode-half-r',
      title: '1Φ Diode Half-Wave (Resistive Load)',
      description: 'Classic fundamental diode rectifier with resistive load, conducting from 0° to 180° with V_dc = V_m / π.',
      tag: 'Textbook 101',
      params: {
        phase: '1-phase',
        bridge: 'half-wave',
        devicePreset: 'all-diodes',
        alphaDeg: 0,
        fwdEnabled: false,
        loadType: 'R',
        R: 20,
        Vrms: 230,
      },
    },
    {
      id: '1ph-thyristor-full-ccm',
      title: '1Φ Controlled Bridge (α = 45°, RL Load CCM)',
      description: 'Fully-controlled thyristor bridge operating in Continuous Conduction Mode with inductive load.',
      tag: 'DC Drives',
      params: {
        phase: '1-phase',
        bridge: 'full-bridge',
        devicePreset: 'all-thyristors',
        alphaDeg: 45,
        fwdEnabled: false,
        loadType: 'RL',
        R: 20,
        L: 45,
        Vrms: 230,
      },
    },
    {
      id: '1ph-semi-conv',
      title: '1Φ Semi-Converter (Half-Controlled Bridge, α = 60°)',
      description: 'Half thyristors + half diodes, preventing negative voltage excursion with high power factor.',
      tag: 'Industrial',
      params: {
        phase: '1-phase',
        bridge: 'full-bridge',
        devicePreset: 'semi-converter',
        alphaDeg: 60,
        fwdEnabled: false,
        loadType: 'RL',
        R: 15,
        L: 40,
        Vrms: 230,
      },
    },
    {
      id: '1ph-inverter-mode',
      title: '1Φ Line-Commutated Inverter (α = 120°, RLE Load)',
      description: 'Two-quadrant inverter mode where active DC voltage E feeds power back into the AC supply grid.',
      tag: 'Regeneration',
      params: {
        phase: '1-phase',
        bridge: 'full-bridge',
        devicePreset: 'all-thyristors',
        alphaDeg: 120,
        fwdEnabled: false,
        loadType: 'RLE',
        R: 5,
        L: 50,
        E: 100,
        Vrms: 230,
      },
    },
    {
      id: '3ph-diode-6pulse',
      title: '3Φ Diode 6-Pulse Bridge Rectifier',
      description: 'Standard industrial DC power supply with ultra-low 6-pulse voltage ripple and high efficiency.',
      tag: 'Substation Bus',
      params: {
        phase: '3-phase',
        bridge: 'full-bridge',
        devicePreset: 'all-diodes',
        alphaDeg: 0,
        fwdEnabled: false,
        loadType: 'RL',
        R: 25,
        L: 30,
        Vrms: 230,
      },
    },
    {
      id: '3ph-thyristor-6pulse',
      title: '3Φ Fully-Controlled Thyristor Bridge (α = 30°)',
      description: 'High-power 6-pulse converter for steel mill DC motor armature speed control and electrolysis.',
      tag: 'Heavy Industry',
      params: {
        phase: '3-phase',
        bridge: 'full-bridge',
        devicePreset: 'all-thyristors',
        alphaDeg: 30,
        fwdEnabled: false,
        loadType: 'RL',
        R: 20,
        L: 50,
        Vrms: 230,
      },
    },
    {
      id: '3ph-halfwave-3pulse',
      title: '3Φ Half-Wave Converter (3-Pulse, α = 45°)',
      description: 'Star-connected neutral return converter conducting in 120° intervals for each phase.',
      tag: 'Laboratory',
      params: {
        phase: '3-phase',
        bridge: 'half-wave',
        devicePreset: 'all-thyristors',
        alphaDeg: 45,
        fwdEnabled: false,
        loadType: 'RL',
        R: 20,
        L: 35,
        Vrms: 230,
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Preset Converter Configurations</h2>
              <p className="text-xs text-slate-400">
                Load standard textbook circuits and industrial benchmark configurations instantly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {presets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                onApplyPreset(preset.params);
                onClose();
              }}
              className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 cursor-pointer transition-all flex flex-col justify-between group shadow"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h4 className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                    {preset.title}
                  </h4>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    {preset.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {preset.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                <span>Load: {preset.params.loadType} | α: {preset.params.alphaDeg}°</span>
                <span className="text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-sans font-semibold">
                  Load Preset →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
