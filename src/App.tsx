/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Zap,
  Sun,
  Moon,
  Maximize,
  Minimize,
  BookOpen,
  Calculator,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

import { SimulationParams, WaveformPoint, PhaseType, BridgeType, LoadType } from './types';
import { simulateConverter } from './utils/simulation';
import { SchematicView } from './components/SchematicView';
import { WaveformOscilloscope } from './components/WaveformOscilloscope';
import { ControlPanel } from './components/ControlPanel';
import { MetricsDashboard } from './components/MetricsDashboard';
import { DerivationsModal } from './components/DerivationsModal';
import { TheoryModal } from './components/TheoryModal';
import { PresetsModal } from './components/PresetsModal';

export default function App() {
  // Global Simulation State
  const [params, setParams] = useState<SimulationParams>({
    phase: '1-phase',
    bridge: 'full-bridge',
    devicePreset: 'all-thyristors',
    customSwitches: undefined,
    alphaDeg: 45,
    fwdEnabled: false,
    loadType: 'RL',
    R: 20,
    L: 45,
    E: 0,
    Vrms: 230,
    frequency: 50,
    wt: 19.5,
    isPlaying: false,
    speed: 0.1,
  });

  // UI State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSchematicExpanded, setIsSchematicExpanded] = useState(false);
  const [isScopeExpanded, setIsScopeExpanded] = useState(false);

  // Modals
  const [showDerivations, setShowDerivations] = useState(false);
  const [showTheory, setShowTheory] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  // Re-run solver whenever circuit parameters change
  const simulationResults = useMemo(() => {
    return simulateConverter(params);
  }, [
    params.phase,
    params.bridge,
    params.devicePreset,
    params.customSwitches,
    params.alphaDeg,
    params.fwdEnabled,
    params.loadType,
    params.R,
    params.L,
    params.E,
    params.Vrms,
    params.frequency,
  ]);

  // Current waveform point synchronized with instantaneous angle wt
  const currentPoint: WaveformPoint = useMemo(() => {
    const waveforms = simulationResults.waveforms;
    const normalizedAngle = ((params.wt % 360) + 360) % 360;
    const idx = Math.min(
      waveforms.length - 1,
      Math.max(0, Math.round((normalizedAngle / 360) * (waveforms.length - 1)))
    );
    return waveforms[idx] || waveforms[0];
  }, [params.wt, simulationResults.waveforms]);

  // Real-time animation loop
  const lastTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!params.isPlaying) {
      lastTimeRef.current = null;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const animate = (timestamp: number) => {
      if (lastTimeRef.current !== null) {
        const deltaSeconds = (timestamp - lastTimeRef.current) / 1000;
        // Standard electrical frequency: 360 degrees per period (50Hz = 50 periods/s = 18000 deg/s)
        const degPerSec = 360 * params.frequency * params.speed;
        const deltaDeg = deltaSeconds * degPerSec;

        setParams((prev) => ({
          ...prev,
          wt: (prev.wt + deltaDeg) % 360,
        }));
      }
      lastTimeRef.current = timestamp;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [params.isPlaying, params.frequency, params.speed]);

  // Handlers
  const handleUpdateParams = useCallback((updates: Partial<SimulationParams>) => {
    setParams((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleAngleChange = useCallback((deg: number) => {
    setParams((prev) => ({ ...prev, wt: deg }));
  }, []);

  const handleStep = useCallback((deltaDeg: number) => {
    setParams((prev) => ({
      ...prev,
      wt: (prev.wt + deltaDeg + 360) % 360,
    }));
  }, []);

  const handleResetAngle = useCallback(() => {
    setParams((prev) => ({ ...prev, wt: 0 }));
  }, []);

  const handleToggleSwitchType = useCallback((switchId: string) => {
    setParams((prev) => {
      const currentMap = { ...(prev.customSwitches || {}) };
      const currentType =
        currentMap[switchId] ||
        (prev.devicePreset === 'all-diodes' ? 'diode' : 'thyristor');
      currentMap[switchId] = currentType === 'thyristor' ? 'diode' : 'thyristor';
      return {
        ...prev,
        devicePreset: 'custom',
        customSwitches: currentMap,
      };
    });
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      className={`min-h-screen text-slate-100 transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#080d19]' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Background ambient gradient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-cyan-600/20 blur-[130px]" />
        <div className="absolute top-[40%] -right-[10%] w-[45%] h-[45%] rounded-full bg-emerald-600/15 blur-[140px]" />
      </div>

      <div className="relative flex flex-col min-h-screen max-w-[1720px] mx-auto p-3 sm:p-5 space-y-4">
        {/* Top Navigation Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-md shadow-xl">
          <div className="flex flex-wrap items-center gap-3.5">
            {/* Student Credential Badge in Top Left Corner */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900 border border-cyan-500/40 rounded-xl shadow-inner">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/30">
                PC
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  Preeti Choudhary
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </span>
                <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 font-semibold">
                  <span>Roll No:</span>
                  <span className="bg-cyan-900/50 px-1 rounded text-cyan-200">24EE10078</span>
                </div>
              </div>
            </div>

            <div className="h-7 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 text-slate-950 shadow-md shadow-cyan-500/20 font-black">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                    RectifierLab
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    Power Electronics Studio
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden lg:block">
                  Interactive Single-Phase & Three-Phase Diode/Thyristor Bridge Converter Simulation
                </p>
              </div>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={handleToggleFullscreen}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
            >
              {isFullscreen ? (
                <>
                  <Minimize className="w-3.5 h-3.5" />
                  <span>Exit Studio</span>
                </>
              ) : (
                <>
                  <Maximize className="w-3.5 h-3.5" />
                  <span>Full Screen Studio</span>
                </>
              )}
            </button>

            {/* Waveform Analysis & Derivations Button */}
            <button
              onClick={() => setShowDerivations(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all shadow-sm"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Waveform Analysis & Derivations</span>
            </button>

            {/* Presets Button */}
            <button
              onClick={() => setShowPresets(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Presets</span>
            </button>

            {/* Theory Button */}
            <button
              onClick={() => setShowTheory(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Theory</span>
            </button>

            {/* Reset All */}
            <button
              onClick={() => {
                setParams({
                  phase: '1-phase',
                  bridge: 'full-bridge',
                  devicePreset: 'all-thyristors',
                  customSwitches: undefined,
                  alphaDeg: 45,
                  fwdEnabled: false,
                  loadType: 'RL',
                  R: 20,
                  L: 45,
                  E: 0,
                  Vrms: 230,
                  frequency: 50,
                  wt: 0,
                  isPlaying: false,
                  speed: 0.1,
                });
              }}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors border border-slate-700/60"
              title="Reset Converter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Top Row: Interactive Schematic & Interactive Waveform Oscilloscope */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Schematic Diagram (Left side) */}
          <div
            className={`transition-all duration-300 ${
              isScopeExpanded
                ? 'hidden'
                : isSchematicExpanded
                ? 'lg:col-span-12'
                : 'lg:col-span-6'
            }`}
          >
            <SchematicView
              params={params}
              currentPoint={currentPoint}
              onToggleSwitchType={handleToggleSwitchType}
              isExpanded={isSchematicExpanded}
              onToggleExpand={() => setIsSchematicExpanded(!isSchematicExpanded)}
            />
          </div>

          {/* Waveform Oscilloscope (Right side) */}
          <div
            className={`transition-all duration-300 ${
              isSchematicExpanded
                ? 'hidden'
                : isScopeExpanded
                ? 'lg:col-span-12'
                : 'lg:col-span-6'
            }`}
          >
            <WaveformOscilloscope
              results={simulationResults}
              currentAngle={params.wt}
              onAngleChange={handleAngleChange}
              frequency={params.frequency}
              is3Phase={params.phase === '3-phase'}
              isExpanded={isScopeExpanded}
              onToggleExpand={() => setIsScopeExpanded(!isScopeExpanded)}
            />
          </div>
        </div>

        {/* Controls Panel */}
        <ControlPanel
          params={params}
          onChange={handleUpdateParams}
          onStep={handleStep}
          onReset={handleResetAngle}
        />

        {/* Real-Time Metrics & Analytical Voltage Equation Banner */}
        <MetricsDashboard results={simulationResults} params={params} />

        {/* Modals */}
        <DerivationsModal isOpen={showDerivations} onClose={() => setShowDerivations(false)} />
        <TheoryModal isOpen={showTheory} onClose={() => setShowTheory(false)} />
        <PresetsModal
          isOpen={showPresets}
          onClose={() => setShowPresets(false)}
          onApplyPreset={handleUpdateParams}
        />
      </div>
    </div>
  );
}
