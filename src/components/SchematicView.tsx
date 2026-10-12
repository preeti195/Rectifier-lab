import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { SimulationParams, WaveformPoint } from '../types';

interface SchematicViewProps {
  params: SimulationParams;
  currentPoint: WaveformPoint;
  onToggleSwitchType: (switchId: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const SchematicView: React.FC<SchematicViewProps> = ({
  params,
  currentPoint,
  onToggleSwitchType,
  isExpanded = false,
  onToggleExpand,
}) => {
  const { phase, bridge, devicePreset, customSwitches, fwdEnabled, loadType, R, L, E } = params;

  // Determine if an individual switch is diode or thyristor
  const getSwitchType = (id: string, defaultThyristor: boolean): 'diode' | 'thyristor' => {
    if (customSwitches && customSwitches[id] !== undefined) {
      return customSwitches[id];
    }
    if (devicePreset === 'all-diodes') return 'diode';
    if (devicePreset === 'all-thyristors') return 'thyristor';
    if (devicePreset === 'semi-converter') {
      return id.startsWith('T1') || id.startsWith('T3') || id.startsWith('T5')
        ? 'thyristor'
        : 'diode';
    }
    return defaultThyristor ? 'thyristor' : 'diode';
  };

  const isSwitchOn = (id: string) => {
    return currentPoint.conductingSwitches.some(
      (s) => s.toUpperCase() === id.toUpperCase() || (s.startsWith('T') && id.startsWith('D') && s.slice(1) === id.slice(1)) || (s.startsWith('D') && id.startsWith('T') && s.slice(1) === id.slice(1))
    );
  };

  const isFwdOn = currentPoint.conductingSwitches.includes('D_FW');

  // Topology description badge
  const topologyBadge = `${phase.toUpperCase()} ${bridge === 'full-bridge' ? (phase === '3-phase' ? '6-PULSE BRIDGE' : 'FULL-BRIDGE') : (phase === '3-phase' ? '3-PULSE HALF-WAVE' : 'HALF-WAVE')}`;

  // Active loop title
  const activeLoopText = currentPoint.conductionLabel || 'Blocking / Standby';

  // SVG dimensions
  const width = 640;
  const height = 400;

  return (
    <div className="relative flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-950/70 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-wide text-slate-100">Circuit Schematic Diagram</span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                {topologyBadge}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Click any device icon to toggle Diode (D) ↔ Thyristor (T)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Loop Status Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Loop:</span>
            <span className="font-mono font-medium truncate max-w-[200px]">{activeLoopText}</span>
          </div>

          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title={isExpanded ? 'Exit full screen' : 'Full screen schematic'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Schematic SVG Canvas */}
      <div className="relative flex-1 w-full min-h-[350px] flex items-center justify-center p-2 select-none overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #06b6d4 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full max-h-[460px] filter drop-shadow-md"
        >
          <defs>
            {/* Flowing animated dash pattern for conducting paths */}
            <style>
              {`
                @keyframes flowCurrent {
                  from { stroke-dashoffset: 40; }
                  to { stroke-dashoffset: 0; }
                }
                .wire-conducting {
                  stroke: #10b981;
                  stroke-dasharray: 6 6;
                  animation: flowCurrent 1s linear infinite;
                  filter: drop-shadow(0 0 4px #10b981);
                }
                .wire-inactive {
                  stroke: #334155;
                }
                .wire-live-source {
                  stroke: #06b6d4;
                }
              `}
            </style>

            {/* Glowing filter for active switches */}
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Render Topology-specific Schematic */}
          {phase === '1-phase' && bridge === 'full-bridge' && (
            <SinglePhaseFullBridgeSchematic
              currentPoint={currentPoint}
              getSwitchType={getSwitchType}
              isSwitchOn={isSwitchOn}
              onToggleSwitchType={onToggleSwitchType}
              fwdEnabled={fwdEnabled}
              isFwdOn={isFwdOn}
              loadType={loadType}
              R={R}
              L={L}
              E={E}
            />
          )}

          {phase === '1-phase' && bridge === 'half-wave' && (
            <SinglePhaseHalfWaveSchematic
              currentPoint={currentPoint}
              getSwitchType={getSwitchType}
              isSwitchOn={isSwitchOn}
              onToggleSwitchType={onToggleSwitchType}
              fwdEnabled={fwdEnabled}
              isFwdOn={isFwdOn}
              loadType={loadType}
              R={R}
              L={L}
              E={E}
            />
          )}

          {phase === '3-phase' && bridge === 'full-bridge' && (
            <ThreePhaseFullBridgeSchematic
              currentPoint={currentPoint}
              getSwitchType={getSwitchType}
              isSwitchOn={isSwitchOn}
              onToggleSwitchType={onToggleSwitchType}
              fwdEnabled={fwdEnabled}
              isFwdOn={isFwdOn}
              loadType={loadType}
              R={R}
              L={L}
              E={E}
            />
          )}

          {phase === '3-phase' && bridge === 'half-wave' && (
            <ThreePhaseHalfWaveSchematic
              currentPoint={currentPoint}
              getSwitchType={getSwitchType}
              isSwitchOn={isSwitchOn}
              onToggleSwitchType={onToggleSwitchType}
              fwdEnabled={fwdEnabled}
              isFwdOn={isFwdOn}
              loadType={loadType}
              R={R}
              L={L}
              E={E}
            />
          )}
        </svg>

        {/* Live Vo and Io Overlay Badges */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 font-mono text-xs pointer-events-none">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-950/80 border border-emerald-500/40 rounded-md backdrop-blur">
            <span className="text-slate-400 text-[10px]">v_o(t):</span>
            <span className={`font-bold ${currentPoint.vo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {currentPoint.vo > 0 ? `+${currentPoint.vo.toFixed(1)}` : currentPoint.vo.toFixed(1)} V
            </span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-950/80 border border-amber-500/40 rounded-md backdrop-blur">
            <span className="text-slate-400 text-[10px]">i_o(t):</span>
            <span className="text-amber-400 font-bold">
              {currentPoint.io.toFixed(2)} A
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// REUSABLE SWITCH COMPONENT FOR SCHEMATICS
// =========================================================================
interface SwitchSymbolProps {
  x: number;
  y: number;
  id: string;
  name: string;
  type: 'diode' | 'thyristor';
  isOn: boolean;
  orientation?: 'up' | 'down' | 'right';
  onClick: () => void;
}

const SwitchSymbol: React.FC<SwitchSymbolProps> = ({
  x,
  y,
  name,
  type,
  isOn,
  orientation = 'up',
  onClick
}) => {
  const isThyristor = type === 'thyristor';

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer group"
      onClick={onClick}
    >
      {/* Switch Background Container */}
      <rect
        x={-28}
        y={-32}
        width={56}
        height={64}
        rx={8}
        fill={isOn ? '#022c22' : '#0f172a'}
        stroke={isOn ? '#10b981' : '#334155'}
        strokeWidth={isOn ? 2 : 1}
        filter={isOn ? 'url(#glow-green)' : undefined}
        className="transition-colors duration-150 group-hover:stroke-cyan-400"
      />

      {/* Switch Name Tag */}
      <text
        x={0}
        y={-18}
        textAnchor="middle"
        className="text-[11px] font-mono font-bold fill-slate-200 select-none group-hover:fill-cyan-300"
      >
        {isThyristor ? `T${name.replace(/[^\d]/g, '') || name}` : `D${name.replace(/[^\d]/g, '') || name}`}
      </text>

      {/* Schematic Symbol Group */}
      <g transform={orientation === 'up' ? 'rotate(-90)' : orientation === 'down' ? 'rotate(90)' : ''}>
        {/* Diode Triangle (Anode -> Cathode) */}
        <polygon
          points="-8,-8 -8,8 6,0"
          fill={isOn ? '#10b981' : '#64748b'}
          stroke={isOn ? '#34d399' : '#94a3b8'}
          strokeWidth="1.5"
        />
        {/* Cathode Bar */}
        <line
          x1={6}
          y1={-8}
          x2={6}
          y2={8}
          stroke={isOn ? '#34d399' : '#94a3b8'}
          strokeWidth="2"
        />

        {/* Thyristor Gate Terminal */}
        {isThyristor && (
          <path
            d="M 2 4 L -4 12 L -9 12"
            fill="none"
            stroke={isOn ? '#fbbf24' : '#64748b'}
            strokeWidth="1.5"
          />
        )}
      </g>

      {/* Status ON/OFF Badge */}
      <rect
        x={-18}
        y={15}
        width={36}
        height={13}
        rx={3}
        fill={isOn ? '#059669' : '#1e293b'}
      />
      <text
        x={0}
        y={24}
        textAnchor="middle"
        className="text-[9px] font-mono font-bold fill-white select-none"
      >
        {isOn ? 'ON' : 'OFF'}
      </text>

      {/* Quick Type Hint on Hover */}
      <title>Click to switch to {isThyristor ? 'Diode' : 'Thyristor'}</title>
    </g>
  );
};

// =========================================================================
// LOAD BOX SYMBOL (R, RL, RLE)
// =========================================================================
interface LoadBoxProps {
  x: number;
  y: number;
  loadType: 'R' | 'RL' | 'RLE';
  R: number;
  L: number;
  E: number;
  io: number;
  vo: number;
}

const LoadBox: React.FC<LoadBoxProps> = ({ x, y, loadType, R, L, E, io, vo }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Container Card */}
      <rect
        x={-34}
        y={-65}
        width={68}
        height={130}
        rx={10}
        fill="#090d16"
        stroke="#1e293b"
        strokeWidth="1.5"
      />

      <text
        x={0}
        y={-48}
        textAnchor="middle"
        className="text-[10px] font-mono font-bold tracking-wider fill-cyan-300"
      >
        {loadType} LOAD
      </text>

      {/* Resistor zig-zag */}
      <path
        d="M -12 -32 L -6 -32 L -3 -38 L 3 -26 L -3 -38 L 3 -26 L 6 -32 L 12 -32"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="1.8"
      />
      <text x={0} y={-18} textAnchor="middle" className="text-[9px] font-mono fill-slate-300">
        R = {R} Ω
      </text>

      {/* Inductor coils */}
      {loadType !== 'R' && (
        <>
          <path
            d="M -12 -4 A 4 4 0 0 1 -4 -4 A 4 4 0 0 1 4 -4 A 4 4 0 0 1 12 -4"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1.8"
          />
          <text x={0} y={10} textAnchor="middle" className="text-[9px] font-mono fill-slate-300">
            L = {L} mH
          </text>
        </>
      )}

      {/* DC Back-EMF Battery */}
      {loadType === 'RLE' && (
        <>
          <line x1={-10} y1={24} x2={10} y2={24} stroke="#f43f5e" strokeWidth="2" />
          <line x1={-6} y1={28} x2={6} y2={28} stroke="#f43f5e" strokeWidth="2.5" />
          <text x={0} y={40} textAnchor="middle" className="text-[9px] font-mono fill-rose-300">
            E = {E} V
          </text>
        </>
      )}

      {/* Live current readout pill at bottom of load */}
      <rect
        x={-30}
        y={50}
        width={60}
        height={15}
        rx={4}
        fill="#0f172a"
        stroke="#0284c7"
        strokeWidth="1"
      />
      <text
        x={0}
        y={61}
        textAnchor="middle"
        className="text-[9px] font-mono font-bold fill-amber-300"
      >
        i = {io > 0 ? `+${io.toFixed(2)}` : io.toFixed(2)}A ▶
      </text>
    </g>
  );
};

// =========================================================================
// 1. SINGLE-PHASE FULL-BRIDGE SCHEMATIC
// =========================================================================
interface SubSchematicProps {
  currentPoint: WaveformPoint;
  getSwitchType: (id: string, defThyristor: boolean) => 'diode' | 'thyristor';
  isSwitchOn: (id: string) => boolean;
  onToggleSwitchType: (id: string) => void;
  fwdEnabled: boolean;
  isFwdOn: boolean;
  loadType: 'R' | 'RL' | 'RLE';
  R: number;
  L: number;
  E: number;
}

const SinglePhaseFullBridgeSchematic: React.FC<SubSchematicProps> = ({
  currentPoint,
  getSwitchType,
  isSwitchOn,
  onToggleSwitchType,
  fwdEnabled,
  isFwdOn,
  loadType,
  R,
  L,
  E,
}) => {
  const on1 = isSwitchOn('T1');
  const on2 = isSwitchOn('T2');
  const on3 = isSwitchOn('T3');
  const on4 = isSwitchOn('T4');

  // DC Rails
  const topRailY = 70;
  const botRailY = 320;
  const loadX = 520;
  const fwdX = 410;
  const leg1X = 220;
  const leg2X = 330;
  const sourceX = 90;
  const midY = 195;

  return (
    <g>
      {/* Top Positive DC Rail */}
      <line
        x1={leg1X}
        y1={topRailY}
        x2={loadX}
        y2={topRailY}
        strokeWidth={3}
        className={on1 || on3 ? 'wire-conducting' : 'wire-inactive'}
      />
      {/* Bottom Negative DC Rail */}
      <line
        x1={leg1X}
        y1={botRailY}
        x2={loadX}
        y2={botRailY}
        strokeWidth={3}
        className={on2 || on4 ? 'wire-conducting' : 'wire-inactive'}
      />

      {/* Rail Labels */}
      <text x={loadX + 10} y={topRailY + 4} className="text-[11px] font-mono font-bold fill-emerald-400">
        + Vo
      </text>
      <text x={loadX + 10} y={botRailY + 4} className="text-[11px] font-mono font-bold fill-slate-400">
        - Vo (GND)
      </text>

      {/* AC Source */}
      <g transform={`translate(${sourceX}, ${midY})`}>
        <circle cx={0} cy={0} r={28} fill="#090d16" stroke="#06b6d4" strokeWidth="2.5" />
        {/* Sine wave glyph inside AC source */}
        <path
          d="M -16 0 Q -8 -16 0 0 Q 8 16 16 0"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <text x={0} y={42} textAnchor="middle" className="text-[11px] font-bold fill-slate-200">
          AC Source
        </text>
        <text x={0} y={55} textAnchor="middle" className="text-[10px] font-mono fill-cyan-400">
          vs = {currentPoint.vs > 0 ? `+${currentPoint.vs.toFixed(1)}` : currentPoint.vs.toFixed(1)} V
        </text>
      </g>

      {/* AC Wires to Bridge */}
      {/* Phase A (top of AC source to midpoint of Leg 1) */}
      <path
        d={`M ${sourceX} ${midY - 28} L ${sourceX} 145 L ${leg1X} 145`}
        fill="none"
        strokeWidth="2.5"
        className={on1 || on4 ? 'wire-conducting' : 'wire-live-source'}
      />
      <text x={sourceX + 15} y={138} className="text-[9px] font-mono fill-cyan-300">Phase A</text>

      {/* Neutral (bottom of AC source to midpoint of Leg 2) */}
      <path
        d={`M ${sourceX} ${midY + 28} L ${sourceX} 245 L ${leg2X} 245`}
        fill="none"
        strokeWidth="2.5"
        className={on2 || on3 ? 'wire-conducting' : 'wire-live-source'}
      />
      <text x={sourceX + 15} y={260} className="text-[9px] font-mono fill-cyan-300">Neutral (N)</text>

      {/* Leg 1 Wires (Top rail down to bottom rail through T1 and T4) */}
      <line x1={leg1X} y1={topRailY} x2={leg1X} y2={botRailY} strokeWidth="2" className="wire-inactive" />

      {/* Leg 2 Wires (Top rail down to bottom rail through T3 and T2) */}
      <line x1={leg2X} y1={topRailY} x2={leg2X} y2={botRailY} strokeWidth="2" className="wire-inactive" />

      {/* Freewheeling Diode Branch */}
      <line
        x1={fwdX}
        y1={topRailY}
        x2={fwdX}
        y2={botRailY}
        strokeWidth={fwdEnabled ? 2 : 1}
        strokeDasharray={fwdEnabled ? undefined : '4 4'}
        className={isFwdOn ? 'wire-conducting' : 'wire-inactive'}
      />
      <g transform={`translate(${fwdX}, ${midY})`}>
        <polygon
          points="-8,8 8,8 0,-6"
          fill={isFwdOn ? '#10b981' : '#334155'}
          stroke={fwdEnabled ? (isFwdOn ? '#34d399' : '#64748b') : '#334155'}
          strokeWidth="1.5"
        />
        <line x1={-8} y1={-6} x2={8} y2={-6} stroke={fwdEnabled ? (isFwdOn ? '#34d399' : '#64748b') : '#334155'} strokeWidth="2" />
        <text x={18} y={-2} className="text-[9px] font-mono fill-slate-400">D_FW</text>
        <text x={18} y={10} className={`text-[8px] font-mono ${fwdEnabled ? (isFwdOn ? 'fill-emerald-400 font-bold' : 'fill-slate-400') : 'fill-slate-600'}`}>
          {fwdEnabled ? (isFwdOn ? 'FREEWHEEL' : 'STANDBY') : 'DISCONNECTED'}
        </text>
      </g>

      {/* Connection dots */}
      {[
        [leg1X, topRailY], [leg2X, topRailY], [fwdX, topRailY], [loadX, topRailY],
        [leg1X, botRailY], [leg2X, botRailY], [fwdX, botRailY], [loadX, botRailY],
        [leg1X, 145], [leg2X, 245]
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={3.5} fill="#06b6d4" />
      ))}

      {/* Switches in Bridge */}
      {/* T1 (Top Left, Leg A) */}
      <SwitchSymbol
        x={leg1X}
        y={110}
        id="T1"
        name="1 (Top)"
        type={getSwitchType('T1', true)}
        isOn={on1}
        orientation="up"
        onClick={() => onToggleSwitchType('T1')}
      />

      {/* T4 (Bottom Left, Leg A) */}
      <SwitchSymbol
        x={leg1X}
        y={280}
        id="T4"
        name="4 (Bot)"
        type={getSwitchType('T4', true)}
        isOn={on4}
        orientation="up"
        onClick={() => onToggleSwitchType('T4')}
      />

      {/* T3 (Top Right, Leg B) */}
      <SwitchSymbol
        x={leg2X}
        y={110}
        id="T3"
        name="3 (Top)"
        type={getSwitchType('T3', true)}
        isOn={on3}
        orientation="up"
        onClick={() => onToggleSwitchType('T3')}
      />

      {/* T2 (Bottom Right, Leg B) */}
      <SwitchSymbol
        x={leg2X}
        y={280}
        id="T2"
        name="2 (Bot)"
        type={getSwitchType('T2', true)}
        isOn={on2}
        orientation="up"
        onClick={() => onToggleSwitchType('T2')}
      />

      {/* Load Box */}
      <LoadBox
        x={loadX}
        y={midY}
        loadType={loadType}
        R={R}
        L={L}
        E={E}
        io={currentPoint.io}
        vo={currentPoint.vo}
      />
    </g>
  );
};

// =========================================================================
// 2. SINGLE-PHASE HALF-WAVE SCHEMATIC
// =========================================================================
const SinglePhaseHalfWaveSchematic: React.FC<SubSchematicProps> = ({
  currentPoint,
  getSwitchType,
  isSwitchOn,
  onToggleSwitchType,
  fwdEnabled,
  isFwdOn,
  loadType,
  R,
  L,
  E,
}) => {
  const on1 = isSwitchOn('T1');
  const topRailY = 110;
  const botRailY = 280;
  const sourceX = 90;
  const switchX = 260;
  const fwdX = 390;
  const loadX = 520;
  const midY = 195;

  return (
    <g>
      {/* AC Source */}
      <g transform={`translate(${sourceX}, ${midY})`}>
        <circle cx={0} cy={0} r={28} fill="#090d16" stroke="#06b6d4" strokeWidth="2.5" />
        <path d="M -16 0 Q -8 -16 0 0 Q 8 16 16 0" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
        <text x={0} y={42} textAnchor="middle" className="text-[11px] font-bold fill-slate-200">AC Source</text>
        <text x={0} y={55} textAnchor="middle" className="text-[10px] font-mono fill-cyan-400">
          vs = {currentPoint.vs > 0 ? `+${currentPoint.vs.toFixed(1)}` : currentPoint.vs.toFixed(1)} V
        </text>
      </g>

      {/* Top Wire from Source to Switch to Load */}
      <path
        d={`M ${sourceX} ${midY - 28} L ${sourceX} ${topRailY} L ${switchX - 28} ${topRailY}`}
        fill="none"
        strokeWidth="2.5"
        className={on1 ? 'wire-conducting' : 'wire-live-source'}
      />
      <line
        x1={switchX + 28}
        y1={topRailY}
        x2={loadX}
        y2={topRailY}
        strokeWidth="3"
        className={on1 || isFwdOn ? 'wire-conducting' : 'wire-inactive'}
      />

      {/* Bottom Return Wire from Load to Source */}
      <path
        d={`M ${loadX} ${botRailY} L ${sourceX} ${botRailY} L ${sourceX} ${midY + 28}`}
        fill="none"
        strokeWidth="2.5"
        className={on1 ? 'wire-conducting' : 'wire-inactive'}
      />

      {/* Switch T1 in series */}
      <SwitchSymbol
        x={switchX}
        y={topRailY}
        id="T1"
        name="1"
        type={getSwitchType('T1', true)}
        isOn={on1}
        orientation="right"
        onClick={() => onToggleSwitchType('T1')}
      />

      {/* FWD Branch */}
      <line
        x1={fwdX}
        y1={topRailY}
        x2={fwdX}
        y2={botRailY}
        strokeWidth={fwdEnabled ? 2 : 1}
        strokeDasharray={fwdEnabled ? undefined : '4 4'}
        className={isFwdOn ? 'wire-conducting' : 'wire-inactive'}
      />
      <g transform={`translate(${fwdX}, ${midY})`}>
        <polygon
          points="-8,8 8,8 0,-6"
          fill={isFwdOn ? '#10b981' : '#334155'}
          stroke={fwdEnabled ? (isFwdOn ? '#34d399' : '#64748b') : '#334155'}
          strokeWidth="1.5"
        />
        <line x1={-8} y1={-6} x2={8} y2={-6} stroke={fwdEnabled ? (isFwdOn ? '#34d399' : '#64748b') : '#334155'} strokeWidth="2" />
        <text x={18} y={-2} className="text-[9px] font-mono fill-slate-400">D_FW</text>
        <text x={18} y={10} className={`text-[8px] font-mono ${fwdEnabled ? (isFwdOn ? 'fill-emerald-400 font-bold' : 'fill-slate-400') : 'fill-slate-600'}`}>
          {fwdEnabled ? (isFwdOn ? 'FREEWHEEL' : 'STANDBY') : 'DISCONNECTED'}
        </text>
      </g>

      {/* Load Box */}
      <LoadBox
        x={loadX}
        y={midY}
        loadType={loadType}
        R={R}
        L={L}
        E={E}
        io={currentPoint.io}
        vo={currentPoint.vo}
      />
    </g>
  );
};

// =========================================================================
// 3. THREE-PHASE FULL-BRIDGE SCHEMATIC (6-PULSE)
// =========================================================================
const ThreePhaseFullBridgeSchematic: React.FC<SubSchematicProps> = ({
  currentPoint,
  getSwitchType,
  isSwitchOn,
  onToggleSwitchType,
  fwdEnabled,
  isFwdOn,
  loadType,
  R,
  L,
  E,
}) => {
  const on1 = isSwitchOn('T1');
  const on3 = isSwitchOn('T3');
  const on5 = isSwitchOn('T5');
  const on4 = isSwitchOn('T4');
  const on6 = isSwitchOn('T6');
  const on2 = isSwitchOn('T2');

  const topRailY = 65;
  const botRailY = 325;
  const legAX = 190;
  const legBX = 275;
  const legCX = 360;
  const fwdX = 440;
  const loadX = 535;
  const midY = 195;

  return (
    <g>
      {/* 3-Phase AC Source (Star configuration) */}
      <g transform="translate(65, 195)">
        <circle cx={0} cy={0} r={42} fill="#090d16" stroke="#0284c7" strokeWidth="1.5" />
        <text x={0} y={-48} textAnchor="middle" className="text-[10px] font-bold fill-cyan-300">
          3-Phase Source
        </text>

        {/* Phase A, B, C terminals */}
        <text x={-20} y={-16} className="text-[9px] font-mono fill-rose-400 font-bold">A ({currentPoint.vs.toFixed(0)}V)</text>
        <text x={-20} y={2} className="text-[9px] font-mono fill-amber-400 font-bold">B ({(currentPoint.vb || 0).toFixed(0)}V)</text>
        <text x={-20} y={20} className="text-[9px] font-mono fill-sky-400 font-bold">C ({(currentPoint.vc || 0).toFixed(0)}V)</text>
      </g>

      {/* Phase A lead to Leg A mid */}
      <path
        d={`M 107 175 L 140 175 L 140 160 L ${legAX} 160`}
        fill="none"
        strokeWidth="2"
        className={on1 || on4 ? 'wire-conducting' : 'wire-inactive'}
      />
      {/* Phase B lead to Leg B mid */}
      <path
        d={`M 107 195 L ${legBX} 195`}
        fill="none"
        strokeWidth="2"
        className={on3 || on6 ? 'wire-conducting' : 'wire-inactive'}
      />
      {/* Phase C lead to Leg C mid */}
      <path
        d={`M 107 215 L 140 215 L 140 230 L ${legCX} 230`}
        fill="none"
        strokeWidth="2"
        className={on5 || on2 ? 'wire-conducting' : 'wire-inactive'}
      />

      {/* DC Rails */}
      <line
        x1={legAX}
        y1={topRailY}
        x2={loadX}
        y2={topRailY}
        strokeWidth="3"
        className={on1 || on3 || on5 ? 'wire-conducting' : 'wire-inactive'}
      />
      <line
        x1={legAX}
        y1={botRailY}
        x2={loadX}
        y2={botRailY}
        strokeWidth="3"
        className={on4 || on6 || on2 ? 'wire-conducting' : 'wire-inactive'}
      />

      {/* Leg Vertical Wires */}
      <line x1={legAX} y1={topRailY} x2={legAX} y2={botRailY} strokeWidth="1.5" className="wire-inactive" />
      <line x1={legBX} y1={topRailY} x2={legBX} y2={botRailY} strokeWidth="1.5" className="wire-inactive" />
      <line x1={legCX} y1={topRailY} x2={legCX} y2={botRailY} strokeWidth="1.5" className="wire-inactive" />

      {/* Top 3 Switches (T1, T3, T5) */}
      <SwitchSymbol x={legAX} y={105} id="T1" name="1(A)" type={getSwitchType('T1', true)} isOn={on1} onClick={() => onToggleSwitchType('T1')} />
      <SwitchSymbol x={legBX} y={105} id="T3" name="3(B)" type={getSwitchType('T3', true)} isOn={on3} onClick={() => onToggleSwitchType('T3')} />
      <SwitchSymbol x={legCX} y={105} id="T5" name="5(C)" type={getSwitchType('T5', true)} isOn={on5} onClick={() => onToggleSwitchType('T5')} />

      {/* Bottom 3 Switches (T4, T6, T2) */}
      <SwitchSymbol x={legAX} y={285} id="T4" name="4(A)" type={getSwitchType('T4', true)} isOn={on4} onClick={() => onToggleSwitchType('T4')} />
      <SwitchSymbol x={legBX} y={285} id="T6" name="6(B)" type={getSwitchType('T6', true)} isOn={on6} onClick={() => onToggleSwitchType('T6')} />
      <SwitchSymbol x={legCX} y={285} id="T2" name="2(C)" type={getSwitchType('T2', true)} isOn={on2} onClick={() => onToggleSwitchType('T2')} />

      {/* FWD Branch */}
      {fwdEnabled && (
        <line x1={fwdX} y1={topRailY} x2={fwdX} y2={botRailY} strokeWidth="2" className={isFwdOn ? 'wire-conducting' : 'wire-inactive'} />
      )}

      {/* Load Box */}
      <LoadBox x={loadX} y={midY} loadType={loadType} R={R} L={L} E={E} io={currentPoint.io} vo={currentPoint.vo} />
    </g>
  );
};

// =========================================================================
// 4. THREE-PHASE HALF-WAVE SCHEMATIC (3-PULSE)
// =========================================================================
const ThreePhaseHalfWaveSchematic: React.FC<SubSchematicProps> = ({
  currentPoint,
  getSwitchType,
  isSwitchOn,
  onToggleSwitchType,
  fwdEnabled,
  isFwdOn,
  loadType,
  R,
  L,
  E,
}) => {
  const on1 = isSwitchOn('T1');
  const on2 = isSwitchOn('T2');
  const on3 = isSwitchOn('T3');

  const topRailY = 70;
  const botRailY = 320;
  const loadX = 520;
  const midY = 195;

  return (
    <g>
      {/* 3-Phase Source */}
      <g transform="translate(80, 195)">
        <circle cx={0} cy={0} r={44} fill="#090d16" stroke="#0284c7" strokeWidth="1.5" />
        <text x={0} y={-50} textAnchor="middle" className="text-[10px] font-bold fill-cyan-300">
          3Φ Star AC Source
        </text>
        <circle cx={0} cy={0} r={3} fill="#94a3b8" />
        <text x={-6} y={12} className="text-[9px] font-mono fill-slate-400">Neutral</text>
      </g>

      {/* Phase A, B, C connecting lines */}
      <path d={`M 80 151 L 80 100 L 190 100`} fill="none" strokeWidth="2" className={on1 ? 'wire-conducting' : 'wire-inactive'} />
      <path d={`M 124 195 L 190 195`} fill="none" strokeWidth="2" className={on2 ? 'wire-conducting' : 'wire-inactive'} />
      <path d={`M 80 239 L 80 290 L 190 290`} fill="none" strokeWidth="2" className={on3 ? 'wire-conducting' : 'wire-inactive'} />

      {/* Neutral return wire */}
      <path d={`M 80 195 L 80 340 L ${loadX} 340 L ${loadX} ${botRailY}`} fill="none" strokeWidth="2" className={on1 || on2 || on3 ? 'wire-conducting' : 'wire-inactive'} />
      <text x={260} y={352} className="text-[9px] font-mono fill-slate-400">Neutral Return Line</text>

      {/* Switches in series for each phase */}
      <SwitchSymbol x={240} y={100} id="T1" name="1 (Ph A)" type={getSwitchType('T1', true)} isOn={on1} orientation="right" onClick={() => onToggleSwitchType('T1')} />
      <SwitchSymbol x={240} y={195} id="T2" name="2 (Ph B)" type={getSwitchType('T2', true)} isOn={on2} orientation="right" onClick={() => onToggleSwitchType('T2')} />
      <SwitchSymbol x={240} y={290} id="T3" name="3 (Ph C)" type={getSwitchType('T3', true)} isOn={on3} orientation="right" onClick={() => onToggleSwitchType('T3')} />

      {/* Common Cathode bus connecting all 3 switches to positive load terminal */}
      <path
        d={`M 268 100 L 360 100 L 360 ${topRailY} L ${loadX} ${topRailY}`}
        fill="none"
        strokeWidth="2.5"
        className={on1 ? 'wire-conducting' : 'wire-inactive'}
      />
      <path d={`M 268 195 L 360 195`} fill="none" strokeWidth="2.5" className={on2 ? 'wire-conducting' : 'wire-inactive'} />
      <path d={`M 268 290 L 360 290 L 360 ${topRailY}`} fill="none" strokeWidth="2.5" className={on3 ? 'wire-conducting' : 'wire-inactive'} />

      {/* Load Box */}
      <LoadBox x={loadX} y={midY} loadType={loadType} R={R} L={L} E={E} io={currentPoint.io} vo={currentPoint.vo} />
    </g>
  );
};
