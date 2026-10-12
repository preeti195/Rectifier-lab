import React from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Zap, Cpu, Sliders } from 'lucide-react';
import { SimulationParams, PhaseType, BridgeType, DevicePreset, LoadType } from '../types';

interface ControlPanelProps {
  params: SimulationParams;
  onChange: (updates: Partial<SimulationParams>) => void;
  onStep: (deltaDeg: number) => void;
  onReset: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onChange,
  onStep,
  onReset,
}) => {
  const {
    phase,
    bridge,
    devicePreset,
    alphaDeg,
    fwdEnabled,
    loadType,
    R,
    L,
    E,
    Vrms,
    frequency,
    isPlaying,
    speed,
  } = params;

  const quickAngles = [0, 30, 45, 60, 90, 120, 150];
  const quickSpeeds = [0.1, 0.2, 0.5, 1.0, 2.0];

  return (
    <div className="flex flex-col gap-3">
      {/* Playback & Real-Time Animation Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          {/* Run Real-Time Play/Pause Button */}
          <button
            onClick={() => onChange({ isPlaying: !isPlaying })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs tracking-wide transition-all shadow-md active:scale-95 ${
              isPlaying
                ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-950/40'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/40'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause Simulation</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Real-Time</span>
              </>
            )}
          </button>

          {/* Step Controls */}
          <button
            onClick={() => onStep(-1)}
            disabled={isPlaying}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
            title="Step back 1°"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onStep(1)}
            disabled={isPlaying}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
            title="Step forward 1°"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={onReset}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset angle to 0°"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Slider & Quick Select Pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Speed:
            </span>
            <input
              type="range"
              min={0.1}
              max={2.0}
              step={0.1}
              value={speed}
              onChange={(e) => onChange({ speed: parseFloat(e.target.value) })}
              className="w-24 sm:w-36 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="font-mono text-xs text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
              {speed.toFixed(1)}x
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {quickSpeeds.map((s) => (
              <button
                key={s}
                onClick={() => onChange({ speed: s })}
                className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors ${
                  speed === s
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3 Main Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: CONVERTER TOPOLOGY */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold tracking-wider text-slate-300 uppercase">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Converter Topology</span>
            </div>

            {/* Single-Phase vs Three-Phase */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800 mb-2.5">
              <button
                onClick={() => onChange({ phase: '1-phase' })}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                  phase === '1-phase'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Single-Phase (1Φ)
              </button>
              <button
                onClick={() => onChange({ phase: '3-phase' })}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                  phase === '3-phase'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Three-Phase (3Φ)
              </button>
            </div>

            {/* Full-Bridge vs Half-Wave */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800 mb-3">
              <button
                onClick={() => onChange({ bridge: 'full-bridge' })}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                  bridge === 'full-bridge'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Full-Bridge
              </button>
              <button
                onClick={() => onChange({ bridge: 'half-wave' })}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                  bridge === 'half-wave'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Half-Wave
              </button>
            </div>
          </div>

          {/* Quick Device Setup */}
          <div>
            <div className="text-[11px] text-slate-400 mb-1.5">Quick Device Setup:</div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() =>
                  onChange({
                    devicePreset: 'all-diodes',
                    customSwitches: undefined,
                    alphaDeg: 0,
                  })
                }
                className={`py-1 text-[11px] font-semibold rounded-md border transition-all ${
                  devicePreset === 'all-diodes'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                All Diodes
              </button>
              <button
                onClick={() =>
                  onChange({
                    devicePreset: 'all-thyristors',
                    customSwitches: undefined,
                  })
                }
                className={`py-1 text-[11px] font-semibold rounded-md border transition-all ${
                  devicePreset === 'all-thyristors'
                    ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                All Thyristors
              </button>
              <button
                onClick={() =>
                  onChange({
                    devicePreset: 'semi-converter',
                    customSwitches: undefined,
                  })
                }
                className={`py-1 text-[11px] font-semibold rounded-md border transition-all ${
                  devicePreset === 'semi-converter'
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Semi-Conv
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: FIRING ANGLE α & FWD */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-300 uppercase">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Firing Angle α & FWD</span>
              </div>
              <span className="font-mono text-sm font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                {alphaDeg}°
              </span>
            </div>

            {/* Firing Angle Slider */}
            <div className="mb-3">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Firing Angle (α):</span>
                <span className="font-mono">{alphaDeg}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={150}
                step={5}
                value={alphaDeg}
                onChange={(e) =>
                  onChange({
                    alphaDeg: parseInt(e.target.value, 10),
                    devicePreset:
                      devicePreset === 'all-diodes' ? 'all-thyristors' : devicePreset,
                  })
                }
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Quick angle snap pills */}
            <div className="flex flex-wrap gap-1 mb-4">
              {quickAngles.map((ang) => (
                <button
                  key={ang}
                  onClick={() =>
                    onChange({
                      alphaDeg: ang,
                      devicePreset:
                        devicePreset === 'all-diodes' ? 'all-thyristors' : devicePreset,
                    })
                  }
                  className={`px-2 py-0.5 text-[11px] font-mono rounded transition-all ${
                    alphaDeg === ang
                      ? 'bg-amber-400 text-slate-950 font-bold shadow'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {ang}°
                </button>
              ))}
            </div>
          </div>

          {/* Freewheeling Diode (FWD) Toggle */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-300">Freewheeling Diode (D_FW):</span>
            <button
              onClick={() => onChange({ fwdEnabled: !fwdEnabled })}
              className={`px-3 py-1 text-xs font-semibold rounded-md border transition-all ${
                fwdEnabled
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
            >
              {fwdEnabled ? 'Connected' : 'Disconnected'}
            </button>
          </div>
        </div>

        {/* Card 3: LOAD & SOURCE PARAMETERS */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold tracking-wider text-slate-300 uppercase">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Load & Source Parameters</span>
            </div>

            {/* Load Type Segmented Selector */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800 mb-3">
              {(['R', 'RL', 'RLE'] as LoadType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => onChange({ loadType: type })}
                  className={`py-1 text-xs font-semibold rounded-md transition-all ${
                    loadType === type
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type} Load
                </button>
              ))}
            </div>

            {/* R Slider */}
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400">R (Resistance):</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={60}
                  step={1}
                  value={R}
                  onChange={(e) => onChange({ R: parseInt(e.target.value, 10) })}
                  className="w-24 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-400"
                />
                <span className="font-mono text-emerald-400 w-12 text-right">{R} Ω</span>
              </div>
            </div>

            {/* L Slider */}
            {loadType !== 'R' && (
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400">L (Inductance):</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={5}
                    max={120}
                    step={5}
                    value={L}
                    onChange={(e) => onChange({ L: parseInt(e.target.value, 10) })}
                    className="w-24 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
                  />
                  <span className="font-mono text-amber-400 w-12 text-right">{L} mH</span>
                </div>
              </div>
            )}

            {/* E Slider (for RLE) */}
            {loadType === 'RLE' && (
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400">E (Back-EMF):</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={150}
                    step={5}
                    value={E}
                    onChange={(e) => onChange({ E: parseInt(e.target.value, 10) })}
                    className="w-24 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-rose-400"
                  />
                  <span className="font-mono text-rose-400 w-12 text-right">{E} V</span>
                </div>
              </div>
            )}
          </div>

          {/* Source RMS & Frequency */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Source RMS:</span>
            <div className="flex items-center gap-1.5">
              {[110, 230, 400].map((v) => (
                <button
                  key={v}
                  onClick={() => onChange({ Vrms: v })}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                    Vrms === v
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  {v}V
                </button>
              ))}
              <button
                onClick={() => onChange({ frequency: frequency === 50 ? 60 : 50 })}
                className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-950 text-cyan-400 border border-cyan-500/30"
              >
                {frequency}Hz
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
