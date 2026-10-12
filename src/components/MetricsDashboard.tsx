import React from 'react';
import { BookOpen } from 'lucide-react';
import { SimulationResults, SimulationParams } from '../types';

interface MetricsDashboardProps {
  results: SimulationResults;
  params: SimulationParams;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ results, params }) => {
  const {
    vDc,
    vRms,
    iDc,
    iRms,
    pLoad,
    sIn,
    powerFactor,
    displacementFactor,
    rippleFactor,
    formFactor,
    thdCurrent,
    isDCM,
    theoreticalFormulaLatex,
    theoreticalVDc,
  } = results;

  const { phase, bridge, devicePreset, fwdEnabled } = params;

  // Human-readable title for the formula banner
  const getBannerTitle = () => {
    const pText = phase === '1-phase' ? '1-Phase' : '3-Phase';
    if (bridge === 'half-wave') {
      return `${pText} ${devicePreset === 'all-diodes' ? 'Diode' : 'Controlled Thyristor'} Half-Wave Rectifier`;
    }
    if (devicePreset === 'semi-converter' || (fwdEnabled && bridge === 'full-bridge')) {
      return `${pText} Semi-Converter (Half-Controlled Bridge / with FWD)`;
    }
    if (devicePreset === 'all-diodes') {
      return `${pText} Diode Full-Bridge Rectifier`;
    }
    return `${pText} Fully-Controlled Thyristor Full-Bridge Converter`;
  };

  const getBannerSub = () => {
    if (devicePreset === 'semi-converter' || fwdEnabled) {
      return 'One-quadrant operation with freewheeling action clamping negative voltage excursion.';
    }
    if (devicePreset === 'all-thyristors') {
      return 'Two-quadrant converter operation capable of rectification and inversion when α > 90° with active DC load.';
    }
    return 'Uncontrolled AC to DC rectification converting sinusoidal input into unidirectional pulsating DC.';
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 6 Key Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Avg DC Voltage */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Avg DC Voltage</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              V_dc
            </span>
          </div>
          <div className="my-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
              {vDc.toFixed(1)}
            </span>
            <span className="ml-1 text-xs text-slate-400 font-mono">V</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            V_rms = {vRms.toFixed(1)} V
          </div>
        </div>

        {/* Card 2: Avg DC Current */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Avg DC Current</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              I_dc
            </span>
          </div>
          <div className="my-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-400">
              {iDc.toFixed(2)}
            </span>
            <span className="ml-1 text-xs text-slate-400 font-mono">A</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            I_rms = {iRms.toFixed(2)} A
          </div>
        </div>

        {/* Card 3: Output Power */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Output Power</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
              P_load
            </span>
          </div>
          <div className="my-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-400">
              {pLoad.toFixed(1)}
            </span>
            <span className="ml-1 text-xs text-slate-400 font-mono">W</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            S_in = {sIn.toFixed(0)} VA
          </div>
        </div>

        {/* Card 4: Power Factor */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Power Factor</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
              PF
            </span>
          </div>
          <div className="my-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-purple-300">
              {powerFactor.toFixed(3)}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            cos(φ1) = {displacementFactor.toFixed(3)}
          </div>
        </div>

        {/* Card 5: Ripple Factor */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ripple Factor</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30">
              RF
            </span>
          </div>
          <div className="my-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-rose-400">
              {rippleFactor.toFixed(3)}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Form Factor FF = {formFactor.toFixed(2)}
          </div>
        </div>

        {/* Card 6: Source THD */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Source THD_i</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              THD
            </span>
          </div>
          <div className="my-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-cyan-400">
              {thdCurrent.toFixed(1)}
            </span>
            <span className="ml-1 text-xs text-slate-400 font-mono">%</span>
          </div>
          <div className="text-[11px] font-mono">
            {isDCM ? (
              <span className="text-amber-400 font-semibold">⚠ DCM Mode</span>
            ) : (
              <span className="text-emerald-400 font-semibold">✓ CCM Mode</span>
            )}
          </div>
        </div>
      </div>

      {/* Analytical Equation Banner */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-md">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mt-0.5">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>{getBannerTitle()}</span>
              <span className="text-xs text-slate-400 font-normal">— Analytical DC Voltage Equation</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{getBannerSub()}</p>
          </div>
        </div>

        {/* Formula Representation & Ideal Theoretical V_dc */}
        <div className="flex items-center gap-6 self-end md:self-auto pl-4 border-l border-slate-800">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Theoretical Formula
            </span>
            <code className="text-sm font-mono font-bold text-cyan-300 mt-1 bg-slate-950 px-2.5 py-1 rounded border border-cyan-500/30">
              {theoreticalFormulaLatex}
            </code>
          </div>

          <div className="flex flex-col items-end min-w-[110px]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Ideal Theoretical V_dc
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
              {theoreticalVDc.toFixed(1)} V
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
