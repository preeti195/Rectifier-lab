export type PhaseType = '1-phase' | '3-phase';
export type BridgeType = 'half-wave' | 'full-bridge';
export type DevicePreset = 'all-diodes' | 'all-thyristors' | 'semi-converter' | 'custom';
export type LoadType = 'R' | 'RL' | 'RLE';

export interface SwitchConfig {
  id: string;
  name: string;
  type: 'diode' | 'thyristor';
  phase?: 'A' | 'B' | 'C';
  position: 'top' | 'bottom' | 'single';
}

export interface SimulationParams {
  phase: PhaseType;
  bridge: BridgeType;
  devicePreset: DevicePreset;
  customSwitches?: Record<string, 'diode' | 'thyristor'>;
  alphaDeg: number;       // Firing angle (0 - 180°)
  fwdEnabled: boolean;     // Freewheeling diode connected
  loadType: LoadType;
  R: number;              // Ohms
  L: number;              // mH
  E: number;              // V Back-EMF
  Vrms: number;           // Source RMS (V)
  frequency: number;      // Hz (50 or 60)
  wt: number;             // Instantaneous angle in degrees (0 - 360)
  isPlaying: boolean;
  speed: number;          // 0.1x to 2x
}

export interface WaveformPoint {
  angleDeg: number;       // 0 to 360 (or 720)
  wtRad: number;
  vs: number;             // Phase A or 1-phase AC source voltage
  vb?: number;            // Phase B voltage (for 3-phase)
  vc?: number;            // Phase C voltage (for 3-phase)
  vab?: number;           // Line AB voltage
  vbc?: number;           // Line BC voltage
  vca?: number;           // Line CA voltage
  vo: number;             // Output load voltage
  io: number;             // Output load current
  is: number;             // Source AC current
  vT1: number;            // Voltage across switch 1 (anode to cathode v_AK)
  gateTrigger: number;    // Gate pulse (1 when firing, 0 otherwise)
  conductingSwitches: string[]; // e.g. ['T1', 'T2'] or ['D_FW'] or []
  conductionLabel: string;      // e.g. 'T1 + T2', 'Freewheeling', 'OFF'
}

export interface HarmonicComponent {
  harmonic: number;       // 0 (DC), 1 (fund), 2, 3, etc.
  frequency: number;      // Hz
  voltageMag: number;     // V
  currentMag: number;     // A
  percentOfFund: number;  // %
}

export interface SimulationResults {
  waveforms: WaveformPoint[];
  vDc: number;            // Average DC output voltage
  vRms: number;           // RMS output voltage
  iDc: number;            // Average DC load current
  iRms: number;           // RMS load current
  isRms: number;          // RMS source current
  pLoad: number;          // Active power delivered to load (W)
  sIn: number;            // Apparent power from source (VA)
  powerFactor: number;    // Total PF = P / S
  displacementFactor: number; // cos(phi1)
  rippleFactor: number;   // RF = sqrt((Vrms/Vdc)^2 - 1)
  formFactor: number;     // FF = Vrms / Vdc
  thdCurrent: number;     // THD of source current (%)
  thdVoltage: number;     // Ripple THD of output voltage (%)
  isDCM: boolean;         // Continuous vs Discontinuous mode
  extinctionAngleDeg?: number; // Beta angle if DCM
  theoreticalEquation: string;
  theoreticalFormulaLatex: string;
  theoreticalVDc: number;
  activeIntervals: {
    startDeg: number;
    endDeg: number;
    label: string;
    switches: string[];
    isFreewheeling: boolean;
    isOff: boolean;
  }[];
}
