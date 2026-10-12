import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Layers, Eye, BarChart3, Maximize2, Minimize2 } from 'lucide-react';
import { WaveformPoint, SimulationResults } from '../types';
import { computeHarmonics } from '../utils/simulation';

interface WaveformOscilloscopeProps {
  results: SimulationResults;
  currentAngle: number;
  onAngleChange: (deg: number) => void;
  frequency: number;
  is3Phase: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

type ScopeMode = 'superimposed' | 'channels' | 'fft';

export const WaveformOscilloscope: React.FC<WaveformOscilloscopeProps> = ({
  results,
  currentAngle,
  onAngleChange,
  frequency,
  is3Phase,
  isExpanded = false,
  onToggleExpand,
}) => {
  const [mode, setMode] = useState<ScopeMode>('superimposed');
  const [cycles, setCycles] = useState<1 | 2>(1);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showVavg, setShowVavg] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Extend data points for 2 cycles if requested
  const displayPoints = useMemo(() => {
    if (cycles === 1) return results.waveforms;
    const cycle2 = results.waveforms.map((pt) => ({
      ...pt,
      angleDeg: pt.angleDeg + 360,
    }));
    return [...results.waveforms, ...cycle2];
  }, [results.waveforms, cycles]);

  const maxAngle = cycles * 360;

  // Max bounds for scaling
  const maxVoltage = useMemo(() => {
    const vals = results.waveforms.flatMap((p) => [Math.abs(p.vs), Math.abs(p.vo)]);
    return Math.max(100, Math.ceil((Math.max(...vals) * 1.15) / 50) * 50);
  }, [results.waveforms]);

  const maxCurrent = useMemo(() => {
    const vals = results.waveforms.flatMap((p) => [Math.abs(p.io), Math.abs(p.is)]);
    return Math.max(5, Math.ceil((Math.max(...vals) * 1.2) / 5) * 5);
  }, [results.waveforms]);

  // Harmonics calculation for FFT mode
  const harmonics = useMemo(() => {
    return computeHarmonics(results.waveforms, frequency, 12);
  }, [results.waveforms, frequency]);

  // Handle click or drag on the waveform canvas to scrub angle
  const handlePointerScrub = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const xRatio = Math.max(0, Math.min(1, (e.clientX - rect.left - 48) / (rect.width - 64)));
      const newDeg = Math.round(xRatio * maxAngle * 10) / 10;
      onAngleChange(newDeg % 360);
    },
    [maxAngle, onAngleChange]
  );

  // Current point under cursor
  const normalizedAngle = currentAngle % 360;
  const currentPt = useMemo(() => {
    const idx = Math.min(
      results.waveforms.length - 1,
      Math.max(0, Math.round((normalizedAngle / 360) * (results.waveforms.length - 1)))
    );
    return results.waveforms[idx] || results.waveforms[0];
  }, [normalizedAngle, results.waveforms]);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-md shadow-2xl"
    >
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setMode('superimposed')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              mode === 'superimposed'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Superimposed</span>
          </button>
          <button
            onClick={() => setMode('channels')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              mode === 'channels'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Channels</span>
          </button>
          <button
            onClick={() => setMode('fft')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              mode === 'fft'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Harmonics (FFT)</span>
          </button>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          {mode !== 'fft' && (
            <>
              {/* 1 vs 2 Cycles */}
              <button
                onClick={() => setCycles(cycles === 1 ? 2 : 1)}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all ${
                  cycles === 2
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {cycles} Cycle{cycles > 1 ? 's' : ''} ({maxAngle}°)
              </button>

              {/* Grid Toggle */}
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`px-2 py-1 text-xs font-mono rounded-lg border transition-all ${
                  showGrid
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                # Grid
              </button>

              {/* V_avg Toggle */}
              <button
                onClick={() => setShowVavg(!showVavg)}
                className={`px-2 py-1 text-xs font-mono rounded-lg border transition-all ${
                  showVavg
                    ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                V_avg
              </button>
            </>
          )}

          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title={isExpanded ? 'Exit full screen' : 'Full screen oscilloscope'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Graph Content */}
      <div className="relative flex-1 min-h-[360px] flex flex-col p-2 select-none overflow-hidden">
        {mode === 'superimposed' && (
          <SuperimposedWaveforms
            points={displayPoints}
            maxAngle={maxAngle}
            maxVoltage={maxVoltage}
            maxCurrent={maxCurrent}
            vDc={results.vDc}
            showGrid={showGrid}
            showVavg={showVavg}
            cursorDeg={currentAngle}
            onPointerScrub={handlePointerScrub}
            is3Phase={is3Phase}
          />
        )}

        {mode === 'channels' && (
          <StackedChannelWaveforms
            points={displayPoints}
            maxAngle={maxAngle}
            maxVoltage={maxVoltage}
            maxCurrent={maxCurrent}
            cursorDeg={currentAngle}
            onPointerScrub={handlePointerScrub}
          />
        )}

        {mode === 'fft' && (
          <HarmonicsSpectrumView
            harmonics={harmonics}
            thdCurrent={results.thdCurrent}
            thdVoltage={results.thdVoltage}
          />
        )}

        {/* Active Switch Conduction Timeline Bar (Bottom of Scope) */}
        {mode !== 'fft' && (
          <div className="mt-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2 mb-1 px-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <span className="w-16">Active Pair:</span>
              <span className="text-emerald-400 font-bold">{currentPt.conductionLabel}</span>
            </div>

            <div className="relative h-6 w-full rounded bg-slate-950/80 border border-slate-800 flex overflow-hidden">
              {results.activeIntervals.map((interval, idx) => {
                const leftPct = (interval.startDeg / 360) * 100;
                const widthPct = ((interval.endDeg - interval.startDeg) / 360) * 100;
                const isCurrent =
                  normalizedAngle >= interval.startDeg && normalizedAngle < interval.endDeg;

                let bgClass = 'bg-emerald-950/70 text-emerald-300 border-r border-emerald-500/20';
                if (interval.isFreewheeling) {
                  bgClass = 'bg-amber-950/70 text-amber-300 border-r border-amber-500/20';
                } else if (interval.isOff) {
                  bgClass = 'bg-slate-900/60 text-slate-500 border-r border-slate-800';
                }

                return (
                  <div
                    key={idx}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    className={`absolute inset-y-0 flex items-center justify-center text-[10px] font-mono font-bold truncate px-1 transition-all ${bgClass} ${
                      isCurrent ? 'ring-2 ring-cyan-400 z-10' : ''
                    }`}
                  >
                    {interval.isOff ? 'OFF' : interval.switches.join(' + ') || interval.label}
                  </div>
                );
              })}

              {/* Cursor on conduction bar */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-20 pointer-events-none"
                style={{ left: `${(normalizedAngle / 360) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Scrub Scroller & Real-Time Readout Banner */}
      <div className="flex items-center justify-between gap-4 px-4 py-2 bg-slate-950/90 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-3 flex-1">
          <span className="font-mono text-cyan-400 text-[11px] whitespace-nowrap flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Angle ωt:
          </span>
          <input
            type="range"
            min={0}
            max={360}
            step={0.5}
            value={normalizedAngle}
            onChange={(e) => onAngleChange(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
          />
          <span className="w-14 text-right font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30 text-xs">
            {normalizedAngle.toFixed(1)}°
          </span>
        </div>

        {/* Real-time Values Badge */}
        <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-slate-300 pl-4 border-l border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>vs: <strong className="text-white">{currentPt.vs.toFixed(1)}V</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>vo: <strong className="text-emerald-400">{currentPt.vo.toFixed(1)}V</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>io: <strong className="text-amber-400">{currentPt.io.toFixed(2)}A</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>is: <strong className="text-indigo-400">{currentPt.is.toFixed(2)}A</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// SUPERIMPOSED MODE (VOLTAGES + CURRENTS)
// =========================================================================
interface SuperimposedProps {
  points: WaveformPoint[];
  maxAngle: number;
  maxVoltage: number;
  maxCurrent: number;
  vDc: number;
  showGrid: boolean;
  showVavg: boolean;
  cursorDeg: number;
  onPointerScrub: (e: React.PointerEvent<SVGSVGElement>) => void;
  is3Phase: boolean;
}

const SuperimposedWaveforms: React.FC<SuperimposedProps> = ({
  points,
  maxAngle,
  maxVoltage,
  maxCurrent,
  vDc,
  showGrid,
  showVavg,
  cursorDeg,
  onPointerScrub,
  is3Phase,
}) => {
  const width = 720;
  const height = 300;
  const padLeft = 45;
  const padRight = 20;
  const plotW = width - padLeft - padRight;

  const topGraphH = 150;
  const botGraphH = 110;
  const gap = 25;

  const vCenterY = topGraphH / 2 + 10;
  const vScale = (topGraphH * 0.42) / maxVoltage;

  const iCenterY = topGraphH + gap + botGraphH / 2;
  const iScale = (botGraphH * 0.42) / maxCurrent;

  // Build SVG Paths
  const vsPath = useMemo(() => {
    return points
      .map((p, i) => {
        const x = padLeft + (p.angleDeg / maxAngle) * plotW;
        const y = vCenterY - p.vs * vScale;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [points, maxAngle, plotW, vCenterY, vScale, padLeft]);

  const voPath = useMemo(() => {
    return points
      .map((p, i) => {
        const x = padLeft + (p.angleDeg / maxAngle) * plotW;
        const y = vCenterY - p.vo * vScale;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [points, maxAngle, plotW, vCenterY, vScale, padLeft]);

  const ioPath = useMemo(() => {
    return points
      .map((p, i) => {
        const x = padLeft + (p.angleDeg / maxAngle) * plotW;
        const y = iCenterY - p.io * iScale;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [points, maxAngle, plotW, iCenterY, iScale, padLeft]);

  const isPath = useMemo(() => {
    return points
      .map((p, i) => {
        const x = padLeft + (p.angleDeg / maxAngle) * plotW;
        const y = iCenterY - p.is * iScale;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [points, maxAngle, plotW, iCenterY, iScale, padLeft]);

  const cursorX = padLeft + ((cursorDeg % maxAngle) / maxAngle) * plotW;
  const vAvgY = vCenterY - vDc * vScale;

  return (
    <div className="relative flex-1 w-full h-full min-h-[290px]">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full cursor-crosshair"
        onPointerDown={onPointerScrub}
      >
        {/* Background Grids */}
        {showGrid && (
          <g stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3">
            {/* Horizontal voltage lines */}
            <line x1={padLeft} y1={vCenterY - maxVoltage * vScale} x2={width - padRight} y2={vCenterY - maxVoltage * vScale} />
            <line x1={padLeft} y1={vCenterY + maxVoltage * vScale} x2={width - padRight} y2={vCenterY + maxVoltage * vScale} />
            {/* Horizontal current lines */}
            <line x1={padLeft} y1={iCenterY - maxCurrent * iScale} x2={width - padRight} y2={iCenterY - maxCurrent * iScale} />
            <line x1={padLeft} y1={iCenterY + maxCurrent * iScale} x2={width - padRight} y2={iCenterY + maxCurrent * iScale} />

            {/* Vertical angle lines (every 90 degrees) */}
            {Array.from({ length: maxAngle / 90 + 1 }).map((_, i) => {
              const deg = i * 90;
              const x = padLeft + (deg / maxAngle) * plotW;
              return (
                <g key={i}>
                  <line x1={x} y1={10} x2={x} y2={height - 10} />
                  <text x={x} y={height - 2} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">
                    {deg}°
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* 0V & 0A Zero Reference Axes */}
        <line x1={padLeft} y1={vCenterY} x2={width - padRight} y2={vCenterY} stroke="#475569" strokeWidth="1" />
        <line x1={padLeft} y1={iCenterY} x2={width - padRight} y2={iCenterY} stroke="#475569" strokeWidth="1" />

        {/* Y-Axis Labels */}
        <text x={padLeft - 6} y={vCenterY - maxVoltage * vScale + 4} textAnchor="end" className="text-[9px] font-mono fill-slate-400">
          +{maxVoltage}V
        </text>
        <text x={padLeft - 6} y={vCenterY + 3} textAnchor="end" className="text-[9px] font-mono fill-slate-400">
          0V
        </text>
        <text x={padLeft - 6} y={vCenterY + maxVoltage * vScale + 4} textAnchor="end" className="text-[9px] font-mono fill-slate-400">
          -{maxVoltage}V
        </text>

        <text x={padLeft - 6} y={iCenterY - maxCurrent * iScale + 4} textAnchor="end" className="text-[9px] font-mono fill-slate-400">
          +{maxCurrent}A
        </text>
        <text x={padLeft - 6} y={iCenterY + 3} textAnchor="end" className="text-[9px] font-mono fill-slate-400">
          0A
        </text>
        <text x={padLeft - 6} y={iCenterY + maxCurrent * iScale + 4} textAnchor="end" className="text-[9px] font-mono fill-slate-400">
          -{maxCurrent}A
        </text>

        {/* Graph Titles */}
        <text x={padLeft + 8} y={22} className="text-[11px] font-bold fill-slate-300">
          Voltage Waveforms (v_s & v_o Superimposed)
        </text>
        <text x={width - padRight} y={22} textAnchor="end" className="text-[10px] font-mono fill-slate-500">
          [V]
        </text>

        <text x={padLeft + 8} y={topGraphH + gap + 14} className="text-[11px] font-bold fill-slate-300">
          Current Waveforms (i_o & i_s)
        </text>
        <text x={width - padRight} y={topGraphH + gap + 14} textAnchor="end" className="text-[10px] font-mono fill-slate-500">
          [A]
        </text>

        {/* Average V_dc line */}
        {showVavg && (
          <g>
            <line
              x1={padLeft}
              y1={vAvgY}
              x2={width - padRight}
              y2={vAvgY}
              stroke="#c084fc"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
            <text x={width - padRight - 5} y={vAvgY - 4} textAnchor="end" className="text-[9px] font-mono fill-purple-300 font-bold">
              V_avg = {vDc.toFixed(1)}V
            </text>
          </g>
        )}

        {/* Source Voltage Path (vs) */}
        <path d={vsPath} fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeOpacity="0.8" />

        {/* Output Rectified Voltage Path (vo) */}
        <path
          d={voPath}
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          filter="drop-shadow(0 0 3px rgba(16,185,129,0.4))"
        />

        {/* Source Current Path (is) */}
        <path d={isPath} fill="none" stroke="#818cf8" strokeWidth="1.5" strokeOpacity="0.85" />

        {/* Output Current Path (io) */}
        <path
          d={ioPath}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2.5"
          filter="drop-shadow(0 0 3px rgba(245,158,11,0.4))"
        />

        {/* Vertical Real-Time Angle Cursor */}
        <line
          x1={cursorX}
          y1={10}
          x2={cursorX}
          y2={height - 15}
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          filter="drop-shadow(0 0 4px #06b6d4)"
        />
        <circle cx={cursorX} cy={vCenterY} r={3} fill="#38bdf8" />
        <circle cx={cursorX} cy={iCenterY} r={3} fill="#38bdf8" />
      </svg>
    </div>
  );
};

// =========================================================================
// CHANNELS MODE (STACKED OSCILLOSCOPE TRACES)
// =========================================================================
interface StackedProps {
  points: WaveformPoint[];
  maxAngle: number;
  maxVoltage: number;
  maxCurrent: number;
  cursorDeg: number;
  onPointerScrub: (e: React.PointerEvent<SVGSVGElement>) => void;
}

const StackedChannelWaveforms: React.FC<StackedProps> = ({
  points,
  maxAngle,
  maxVoltage,
  maxCurrent,
  cursorDeg,
  onPointerScrub,
}) => {
  const width = 720;
  const height = 320;
  const padLeft = 70;
  const padRight = 20;
  const plotW = width - padLeft - padRight;

  const numChannels = 4;
  const chH = (height - 30) / numChannels;

  const cursorX = padLeft + ((cursorDeg % maxAngle) / maxAngle) * plotW;

  return (
    <div className="relative flex-1 w-full h-full min-h-[300px]">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full cursor-crosshair" onPointerDown={onPointerScrub}>
        {/* Channel 1: v_s */}
        <g transform={`translate(0, ${10})`}>
          <line x1={padLeft} y1={chH / 2} x2={width - padRight} y2={chH / 2} stroke="#334155" strokeWidth="1" />
          <text x={padLeft - 8} y={chH / 2 + 3} textAnchor="end" className="text-[10px] font-mono fill-cyan-400 font-bold">
            CH1: v_s
          </text>
          <path
            d={points
              .map((p, i) => {
                const x = padLeft + (p.angleDeg / maxAngle) * plotW;
                const y = chH / 2 - (p.vs / maxVoltage) * (chH * 0.42);
                return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
              })
              .join(' ')}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
          />
        </g>

        {/* Channel 2: v_o */}
        <g transform={`translate(0, ${10 + chH})`}>
          <line x1={padLeft} y1={chH / 2} x2={width - padRight} y2={chH / 2} stroke="#334155" strokeWidth="1" />
          <text x={padLeft - 8} y={chH / 2 + 3} textAnchor="end" className="text-[10px] font-mono fill-emerald-400 font-bold">
            CH2: v_o
          </text>
          <path
            d={points
              .map((p, i) => {
                const x = padLeft + (p.angleDeg / maxAngle) * plotW;
                const y = chH / 2 - (p.vo / maxVoltage) * (chH * 0.42);
                return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
              })
              .join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
          />
        </g>

        {/* Channel 3: i_o */}
        <g transform={`translate(0, ${10 + chH * 2})`}>
          <line x1={padLeft} y1={chH / 2} x2={width - padRight} y2={chH / 2} stroke="#334155" strokeWidth="1" />
          <text x={padLeft - 8} y={chH / 2 + 3} textAnchor="end" className="text-[10px] font-mono fill-amber-400 font-bold">
            CH3: i_o
          </text>
          <path
            d={points
              .map((p, i) => {
                const x = padLeft + (p.angleDeg / maxAngle) * plotW;
                const y = chH / 2 - (p.io / maxCurrent) * (chH * 0.42);
                return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
              })
              .join(' ')}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
          />
        </g>

        {/* Channel 4: i_s */}
        <g transform={`translate(0, ${10 + chH * 3})`}>
          <line x1={padLeft} y1={chH / 2} x2={width - padRight} y2={chH / 2} stroke="#334155" strokeWidth="1" />
          <text x={padLeft - 8} y={chH / 2 + 3} textAnchor="end" className="text-[10px] font-mono fill-indigo-400 font-bold">
            CH4: i_s
          </text>
          <path
            d={points
              .map((p, i) => {
                const x = padLeft + (p.angleDeg / maxAngle) * plotW;
                const y = chH / 2 - (p.is / maxCurrent) * (chH * 0.42);
                return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
              })
              .join(' ')}
            fill="none"
            stroke="#818cf8"
            strokeWidth="2"
          />
        </g>

        {/* Cursor line */}
        <line
          x1={cursorX}
          y1={10}
          x2={cursorX}
          y2={height - 20}
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      </svg>
    </div>
  );
};

// =========================================================================
// HARMONICS (FFT) SPECTRUM VIEW
// =========================================================================
interface HarmonicsProps {
  harmonics: ReturnType<typeof computeHarmonics>;
  thdCurrent: number;
  thdVoltage: number;
}

const HarmonicsSpectrumView: React.FC<HarmonicsProps> = ({ harmonics, thdCurrent, thdVoltage }) => {
  const maxMag = Math.max(...harmonics.map((h) => h.voltageMag), 10);

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-100">Harmonic Spectrum & FFT Breakdown</h4>
          <p className="text-xs text-slate-400">Fourier series components of output DC voltage & source current</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-slate-950 border border-indigo-500/30 rounded-lg text-xs">
            <span className="text-slate-400 font-mono">Source THD_i: </span>
            <strong className="text-indigo-400 font-mono">{thdCurrent.toFixed(1)}%</strong>
          </div>
          <div className="px-3 py-1 bg-slate-950 border border-emerald-500/30 rounded-lg text-xs">
            <span className="text-slate-400 font-mono">Voltage Ripple THD: </span>
            <strong className="text-emerald-400 font-mono">{thdVoltage.toFixed(1)}%</strong>
          </div>
        </div>
      </div>

      {/* Bar Chart Grid */}
      <div className="flex-1 grid grid-cols-6 sm:grid-cols-12 gap-2 items-end min-h-[190px] pt-4 pb-2 border-b border-slate-800">
        {harmonics.map((h) => {
          const heightPct = Math.max(4, (h.voltageMag / maxMag) * 100);
          const isFund = h.harmonic === 1;
          const isDc = h.harmonic === 0;

          return (
            <div key={h.harmonic} className="flex flex-col items-center h-full justify-end group">
              <span className="text-[9px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                {h.voltageMag.toFixed(0)}V
              </span>
              <div
                style={{ height: `${heightPct}%` }}
                className={`w-full rounded-t transition-all ${
                  isDc
                    ? 'bg-purple-500 group-hover:bg-purple-400'
                    : isFund
                    ? 'bg-cyan-500 group-hover:bg-cyan-400'
                    : 'bg-emerald-600/80 group-hover:bg-emerald-500'
                }`}
              />
              <span className="mt-2 text-[10px] font-mono font-bold text-slate-300">
                {isDc ? 'DC' : `h${h.harmonic}`}
              </span>
              <span className="text-[8px] font-mono text-slate-500">
                {h.frequency}Hz
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-purple-500" />
          <span className="text-slate-300">DC Average Term</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-cyan-500" />
          <span className="text-slate-300">Fundamental (50/60Hz)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-600" />
          <span className="text-slate-300">Higher Harmonics (Ripple)</span>
        </div>
      </div>
    </div>
  );
};
