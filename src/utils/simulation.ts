import {
  SimulationParams,
  SimulationResults,
  WaveformPoint,
  HarmonicComponent
} from '../types';

/**
 * High-precision numerical simulation engine for single-phase and three-phase
 * power electronics rectifiers with R, RL, and RLE loads.
 */
export function simulateConverter(params: SimulationParams): SimulationResults {
  const {
    phase,
    bridge,
    devicePreset,
    customSwitches,
    alphaDeg,
    fwdEnabled,
    loadType,
    R: R_val,
    L: L_val_mH,
    E: E_val,
    Vrms,
    frequency
  } = params;

  // Physical units
  const R = Math.max(0.2, R_val);
  const L = loadType === 'R' ? 0.000001 : Math.max(0.0001, (L_val_mH || 1) * 1e-3);
  const E = loadType === 'RLE' ? Math.max(0, E_val) : 0;
  const omega = 2 * Math.PI * frequency;
  const Vm = Math.SQRT2 * Vrms; // Peak phase voltage

  // Helper to determine switch type
  const isThyristor = (switchId: string, defaultIsThyristor: boolean): boolean => {
    if (customSwitches && customSwitches[switchId] !== undefined) {
      return customSwitches[switchId] === 'thyristor';
    }
    if (devicePreset === 'all-diodes') return false;
    if (devicePreset === 'all-thyristors') return true;
    if (devicePreset === 'semi-converter') {
      // In semi-converter: top switches are thyristors (T1, T3, T5), bottom are diodes (D2, D4, D6)
      return switchId.startsWith('T1') || switchId.startsWith('T3') || switchId.startsWith('T5');
    }
    return defaultIsThyristor;
  };

  const alphaRad = (Math.max(0, Math.min(179, alphaDeg)) * Math.PI) / 180;

  // Determine topology mode
  const isSinglePhase = phase === '1-phase';
  const isFullBridge = bridge === 'full-bridge';

  // Number of simulation steps per cycle (360 degrees)
  const stepsPerCycle = 720; // 0.5° per step
  const dTheta = (2 * Math.PI) / stepsPerCycle;
  const dt = dTheta / omega;

  // Run 3 full cycles to settle into steady-state
  const totalCycles = 3;
  const totalSteps = stepsPerCycle * totalCycles;

  let current_io = 0;
  const allPoints: {
    theta: number;
    vs: number;
    vb: number;
    vc: number;
    vab: number;
    vbc: number;
    vca: number;
    vo: number;
    io: number;
    is: number;
    vT1: number;
    gateTrigger: number;
    conductingSwitches: string[];
    conductionLabel: string;
  }[] = [];

  for (let step = 0; step < totalSteps; step++) {
    const theta = step * dTheta;
    const cycleTheta = theta % (2 * Math.PI);
    const cycleDeg = (cycleTheta * 180) / Math.PI;

    // AC source voltages
    const vs = Vm * Math.sin(theta);
    const vb = Vm * Math.sin(theta - (2 * Math.PI) / 3);
    const vc = Vm * Math.sin(theta - (4 * Math.PI) / 3);

    // Line voltages for 3-phase
    const vab = vs - vb;
    const vbc = vb - vc;
    const vca = vc - vs;

    let vo = 0;
    let is_current = 0;
    let vT1 = 0;
    let gateTrigger = 0;
    const conductingSwitches: string[] = [];
    let conductionLabel = 'OFF';

    if (isSinglePhase) {
      if (!isFullBridge) {
        // ==========================================
        // 1-PHASE HALF-WAVE RECTIFIER
        // ==========================================
        const switch1IsThyristor = isThyristor('T1', true);
        const canConductPos = switch1IsThyristor
          ? cycleDeg >= alphaDeg && cycleDeg < 180
          : cycleDeg >= 0 && cycleDeg < 180;

        // Gate trigger pulse indicator
        if (switch1IsThyristor && Math.abs(cycleDeg - alphaDeg) < 3) {
          gateTrigger = 1;
        }

        if (canConductPos && vs > E) {
          vo = vs;
          conductingSwitches.push(switch1IsThyristor ? 'T1' : 'D1');
          conductionLabel = switch1IsThyristor ? 'Thyristor T1' : 'Diode D1';
        } else if (fwdEnabled && current_io > 0.01 && vs <= 0) {
          // Freewheeling action clamps output to zero
          vo = 0;
          conductingSwitches.push('D_FW');
          conductionLabel = 'Freewheeling Diode (D_FW)';
        } else if (!fwdEnabled && current_io > 0.01) {
          // In inductive load without FWD, current forces switch to stay on into negative vs
          vo = vs;
          conductingSwitches.push(switch1IsThyristor ? 'T1' : 'D1');
          conductionLabel = `${switch1IsThyristor ? 'T1' : 'D1'} (Inductive Ext.)`;
        } else {
          vo = E; // Float at back EMF if discontinuous
          conductionLabel = 'Blocking (DCM)';
        }

        // Switch voltage v_T1 (Anode to Cathode)
        vT1 = conductingSwitches.includes(switch1IsThyristor ? 'T1' : 'D1') ? 0 : vs - vo;
        is_current = conductingSwitches.includes(switch1IsThyristor ? 'T1' : 'D1') ? current_io : 0;
      } else {
        // ==========================================
        // 1-PHASE FULL-BRIDGE RECTIFIER
        // ==========================================
        // Leg A: T1 (top), T4 (bottom). Leg B: T3 (top), T2 (bottom).
        // Pair 1: T1 & T2 (conducts on positive half)
        // Pair 2: T3 & T4 (conducts on negative half)
        const t1IsThyristor = isThyristor('T1', true);
        const t2IsThyristor = isThyristor('T2', true);
        const t3IsThyristor = isThyristor('T3', true);
        const t4IsThyristor = isThyristor('T4', true);
        const isSemiConverter = devicePreset === 'semi-converter' || (!t2IsThyristor && !t4IsThyristor && t1IsThyristor && t3IsThyristor);

        // Gate pulses
        if (t1IsThyristor && Math.abs(cycleDeg - alphaDeg) < 3) gateTrigger = 1;
        if (t3IsThyristor && Math.abs(cycleDeg - (180 + alphaDeg)) < 3) gateTrigger = 1;

        const posFiringCondition = t1IsThyristor ? cycleDeg >= alphaDeg : true;
        const negFiringCondition = t3IsThyristor ? cycleDeg >= 180 + alphaDeg : true;

        if (cycleDeg >= alphaDeg && cycleDeg < 180 && posFiringCondition) {
          vo = vs;
          conductingSwitches.push(t1IsThyristor ? 'T1' : 'D1', t2IsThyristor ? 'T2' : 'D2');
          conductionLabel = `Bridge Pair ${t1IsThyristor ? 'T1' : 'D1'} + ${t2IsThyristor ? 'T2' : 'D2'}`;
        } else if (cycleDeg >= 180 && cycleDeg < 180 + alphaDeg) {
          if (fwdEnabled || isSemiConverter) {
            // Freewheeling action clamped to 0V
            vo = 0;
            if (fwdEnabled) {
              conductingSwitches.push('D_FW');
              conductionLabel = 'Freewheeling Diode (D_FW)';
            } else {
              // Semi-converter natural freewheeling through T1 + D4 or T3 + D2
              conductingSwitches.push(t1IsThyristor ? 'T1' : 'D1', 'D4');
              conductionLabel = 'Semi-Conv Freewheeling (T1 + D4)';
            }
          } else if (current_io > 0.01) {
            // Full converter without FWD: Inductor drives voltage negative!
            vo = vs;
            conductingSwitches.push(t1IsThyristor ? 'T1' : 'D1', t2IsThyristor ? 'T2' : 'D2');
            conductionLabel = `${t1IsThyristor ? 'T1' : 'D1'} + ${t2IsThyristor ? 'T2' : 'D2'} (Negative Vo)`;
          } else {
            vo = E;
            conductionLabel = 'Blocking (DCM)';
          }
        } else if (cycleDeg >= 180 + alphaDeg && cycleDeg < 360 && negFiringCondition) {
          vo = -vs;
          conductingSwitches.push(t3IsThyristor ? 'T3' : 'D3', t4IsThyristor ? 'T4' : 'D4');
          conductionLabel = `Bridge Pair ${t3IsThyristor ? 'T3' : 'D3'} + ${t4IsThyristor ? 'T4' : 'D4'}`;
        } else if (cycleDeg < alphaDeg) {
          if (fwdEnabled || isSemiConverter) {
            vo = 0;
            if (fwdEnabled) {
              conductingSwitches.push('D_FW');
              conductionLabel = 'Freewheeling Diode (D_FW)';
            } else {
              conductingSwitches.push(t3IsThyristor ? 'T3' : 'D3', 'D2');
              conductionLabel = 'Semi-Conv Freewheeling (T3 + D2)';
            }
          } else if (current_io > 0.01) {
            vo = -vs;
            conductingSwitches.push(t3IsThyristor ? 'T3' : 'D3', t4IsThyristor ? 'T4' : 'D4');
            conductionLabel = `${t3IsThyristor ? 'T3' : 'D3'} + ${t4IsThyristor ? 'T4' : 'D4'} (Negative Vo)`;
          } else {
            vo = E;
            conductionLabel = 'Blocking (DCM)';
          }
        }

        // Source current reflects bridge conduction
        if (conductingSwitches.includes('T1') || conductingSwitches.includes('D1')) {
          if (conductingSwitches.includes('T2') || conductingSwitches.includes('D2')) {
            is_current = current_io;
          }
        } else if (conductingSwitches.includes('T3') || conductingSwitches.includes('D3')) {
          if (conductingSwitches.includes('T4') || conductingSwitches.includes('D4')) {
            is_current = -current_io;
          }
        } else {
          is_current = 0;
        }

        vT1 = conductingSwitches.includes('T1') || conductingSwitches.includes('D1') ? 0 : vs - vo;
      }
    } else {
      // ==========================================
      // THREE-PHASE CONVERTERS
      // ==========================================
      if (!isFullBridge) {
        // ------------------------------------------
        // 3-Phase Half-Wave (3-Pulse, Neutral Return)
        // ------------------------------------------
        const t1IsThyristor = isThyristor('T1', true);
        const t2IsThyristor = isThyristor('T2', true);
        const t3IsThyristor = isThyristor('T3', true);

        // Natural commutation points are 30°, 150°, 270°
        const fireA = 30 + alphaDeg;
        const fireB = 150 + alphaDeg;
        const fireC = 270 + alphaDeg;

        if (t1IsThyristor && Math.abs(cycleDeg - fireA) < 3) gateTrigger = 1;
        if (t2IsThyristor && Math.abs(cycleDeg - fireB) < 3) gateTrigger = 1;
        if (t3IsThyristor && Math.abs(cycleDeg - fireC) < 3) gateTrigger = 1;

        // Determine which phase conducts
        let chosenPhase: 'A' | 'B' | 'C' | 'none' = 'none';

        if (fireA <= 360 && fireB <= 360 && fireC <= 360) {
          if (cycleDeg >= fireA && cycleDeg < fireB) {
            chosenPhase = 'A';
          } else if (cycleDeg >= fireB && cycleDeg < fireC) {
            chosenPhase = 'B';
          } else if (cycleDeg >= fireC || cycleDeg < fireA) {
            chosenPhase = 'C';
          }
        } else {
          // Wrapped angles
          const modDeg = cycleDeg;
          if (modDeg >= fireA % 360 && modDeg < fireB % 360) chosenPhase = 'A';
          else if (modDeg >= fireB % 360 && modDeg < fireC % 360) chosenPhase = 'B';
          else chosenPhase = 'C';
        }

        if (chosenPhase === 'A') {
          vo = vs;
          conductingSwitches.push(t1IsThyristor ? 'T1' : 'D1');
          conductionLabel = `Phase A (${t1IsThyristor ? 'T1' : 'D1'})`;
          is_current = current_io;
        } else if (chosenPhase === 'B') {
          vo = vb;
          conductingSwitches.push(t2IsThyristor ? 'T2' : 'D2');
          conductionLabel = `Phase B (${t2IsThyristor ? 'T2' : 'D2'})`;
          is_current = 0;
        } else if (chosenPhase === 'C') {
          vo = vc;
          conductingSwitches.push(t3IsThyristor ? 'T3' : 'D3');
          conductionLabel = `Phase C (${t3IsThyristor ? 'T3' : 'D3'})`;
          is_current = 0;
        }

        if (fwdEnabled && vo < 0 && current_io > 0.01) {
          vo = 0;
          conductingSwitches.length = 0;
          conductingSwitches.push('D_FW');
          conductionLabel = 'Freewheeling Diode (D_FW)';
          is_current = 0;
        }

        vT1 = conductingSwitches.includes(t1IsThyristor ? 'T1' : 'D1') ? 0 : vs - vo;
      } else {
        // ------------------------------------------
        // 3-Phase Full-Bridge (6-Pulse Converter)
        // ------------------------------------------
        // Top: T1 (A), T3 (B), T5 (C)
        // Bottom: T4 (A), T6 (B), T2 (C)
        // 6 intervals spaced 60° apart:
        // Interval 1: T1 + T6 (v_ab) starting at 60° + alpha
        // Interval 2: T1 + T2 (v_ac) starting at 120° + alpha
        // Interval 3: T3 + T2 (v_bc) starting at 180° + alpha
        // Interval 4: T3 + T4 (v_ba = -v_ab) starting at 240° + alpha
        // Interval 5: T5 + T4 (v_ca = -v_ac) starting at 300° + alpha
        // Interval 6: T5 + T6 (v_cb = -v_bc) starting at 360° + alpha (0° + alpha)

        const shift = 60 + alphaDeg;
        const normDeg = ((cycleDeg - shift) % 360 + 360) % 360;
        const sector = Math.floor(normDeg / 60);

        if (Math.abs(normDeg % 60) < 3) {
          gateTrigger = 1;
        }

        let rawVo = 0;
        let pair = ['', ''];
        let pairLabel = '';
        let phaseACurrent = 0;

        switch (sector) {
          case 0: // 60° to 120°: T1 + T6 (v_ab)
            rawVo = vab;
            pair = ['T1', 'T6'];
            pairLabel = 'T1 + T6 (v_ab)';
            phaseACurrent = current_io;
            break;
          case 1: // 120° to 180°: T1 + T2 (v_ac)
            rawVo = -vca;
            pair = ['T1', 'T2'];
            pairLabel = 'T1 + T2 (v_ac)';
            phaseACurrent = current_io;
            break;
          case 2: // 180° to 240°: T3 + T2 (v_bc)
            rawVo = vbc;
            pair = ['T3', 'T2'];
            pairLabel = 'T3 + T2 (v_bc)';
            phaseACurrent = 0;
            break;
          case 3: // 240° to 300°: T3 + T4 (v_ba)
            rawVo = -vab;
            pair = ['T3', 'T4'];
            pairLabel = 'T3 + T4 (v_ba)';
            phaseACurrent = -current_io;
            break;
          case 4: // 300° to 360°: T5 + T4 (v_ca)
            rawVo = vca;
            pair = ['T5', 'T4'];
            pairLabel = 'T5 + T4 (v_ca)';
            phaseACurrent = -current_io;
            break;
          case 5: // 0° to 60°: T5 + T6 (v_cb)
            rawVo = -vbc;
            pair = ['T5', 'T6'];
            pairLabel = 'T5 + T6 (v_cb)';
            phaseACurrent = 0;
            break;
        }

        if (fwdEnabled && rawVo < 0 && current_io > 0.01) {
          vo = 0;
          conductingSwitches.push('D_FW');
          conductionLabel = 'Freewheeling Diode (D_FW)';
          is_current = 0;
        } else {
          vo = rawVo;
          conductingSwitches.push(...pair);
          conductionLabel = pairLabel;
          is_current = phaseACurrent;
        }

        vT1 = conductingSwitches.includes('T1') ? 0 : vs - (vb + rawVo);
      }
    }

    // Numerical integration of load current:
    // L di/dt + R i + E = v_o(t)
    // di/dt = (v_o - R*i - E) / L
    const di_dt = (vo - R * current_io - E) / L;
    current_io = Math.max(0, current_io + di_dt * dt);

    if (step >= totalSteps - stepsPerCycle) {
      allPoints.push({
        theta: cycleTheta,
        vs,
        vb,
        vc,
        vab,
        vbc,
        vca,
        vo,
        io: current_io,
        is: is_current,
        vT1,
        gateTrigger,
        conductingSwitches,
        conductionLabel
      });
    }
  }

  // Build high-resolution waveform points for one complete cycle
  const waveforms: WaveformPoint[] = allPoints.map((pt) => {
    const deg = (pt.theta * 180) / Math.PI;
    return {
      angleDeg: Math.round(deg * 10) / 10,
      wtRad: pt.theta,
      vs: Math.round(pt.vs * 10) / 10,
      vb: Math.round(pt.vb * 10) / 10,
      vc: Math.round(pt.vc * 10) / 10,
      vab: Math.round(pt.vab * 10) / 10,
      vbc: Math.round(pt.vbc * 10) / 10,
      vca: Math.round(pt.vca * 10) / 10,
      vo: Math.round(pt.vo * 10) / 10,
      io: Math.round(pt.io * 100) / 100,
      is: Math.round(pt.is * 100) / 100,
      vT1: Math.round(pt.vT1 * 10) / 10,
      gateTrigger: pt.gateTrigger,
      conductingSwitches: pt.conductingSwitches,
      conductionLabel: pt.conductionLabel
    };
  });

  // Calculate Average & RMS metrics
  const N = waveforms.length;
  let sumVo = 0;
  let sumVoSq = 0;
  let sumIo = 0;
  let sumIoSq = 0;
  let sumIsSq = 0;
  let sumPower = 0;

  for (let i = 0; i < N; i++) {
    const p = waveforms[i];
    sumVo += p.vo;
    sumVoSq += p.vo * p.vo;
    sumIo += p.io;
    sumIoSq += p.io * p.io;
    sumIsSq += p.is * p.is;
    sumPower += p.vs * p.is;
  }

  const vDc = sumVo / N;
  const vRms = Math.sqrt(sumVoSq / N);
  const iDc = sumIo / N;
  const iRms = Math.sqrt(sumIoSq / N);
  const isRms = Math.sqrt(sumIsSq / N);

  // Active power into load (includes R loss and back EMF transfer)
  const pLoad = Math.max(0, sumPower / N);
  const sIn = Math.max(1, Vrms * isRms);
  const powerFactor = sIn > 0 ? Math.min(1, Math.max(0, pLoad / sIn)) : 0;

  // Displacement factor cos(phi1) estimate
  const displacementFactor = Math.cos((alphaDeg * Math.PI) / 180);

  // Form factor FF = Vrms / Vdc, Ripple factor RF = sqrt(FF^2 - 1)
  const formFactor = vDc > 0.1 ? vRms / vDc : 1;
  const rippleFactor = Math.sqrt(Math.max(0, formFactor * formFactor - 1));

  // Mode: Check if current drops to 0 at any point (DCM) or stays strictly > 0 (CCM)
  const minIo = Math.min(...waveforms.map((w) => w.io));
  const isDCM = minIo < 0.05 && iDc > 0.01;

  // THD calculation for source current using fundamental Fourier component
  let fundSin = 0;
  let fundCos = 0;
  for (let i = 0; i < N; i++) {
    const theta = (i * 2 * Math.PI) / N;
    fundSin += waveforms[i].is * Math.sin(theta);
    fundCos += waveforms[i].is * Math.cos(theta);
  }
  const fundAmp = (2 / N) * Math.sqrt(fundSin * fundSin + fundCos * fundCos);
  const fundRms = fundAmp / Math.SQRT2;
  const thdCurrent =
    fundRms > 0.05 && isRms > fundRms
      ? Math.min(150, Math.sqrt(Math.max(0, (isRms / fundRms) ** 2 - 1)) * 100)
      : 5.0;

  // Output voltage ripple THD
  const thdVoltage = vDc > 1 ? (Math.sqrt(Math.max(0, vRms ** 2 - vDc ** 2)) / vDc) * 100 : 0;

  // Compute active switch intervals for the timeline bar
  const activeIntervals: SimulationResults['activeIntervals'] = [];
  let currentSegment: {
    startDeg: number;
    label: string;
    switches: string[];
  } | null = null;

  for (let i = 0; i < N; i++) {
    const pt = waveforms[i];
    const key = pt.conductionLabel;
    if (!currentSegment) {
      currentSegment = {
        startDeg: pt.angleDeg,
        label: pt.conductionLabel,
        switches: pt.conductingSwitches
      };
    } else if (currentSegment.label !== key) {
      activeIntervals.push({
        startDeg: currentSegment.startDeg,
        endDeg: pt.angleDeg,
        label: currentSegment.label,
        switches: currentSegment.switches,
        isFreewheeling: currentSegment.label.includes('Freewheel'),
        isOff: currentSegment.label.includes('OFF') || currentSegment.label.includes('Blocking')
      });
      currentSegment = {
        startDeg: pt.angleDeg,
        label: pt.conductionLabel,
        switches: pt.conductingSwitches
      };
    }
  }
  if (currentSegment) {
    activeIntervals.push({
      startDeg: currentSegment.startDeg,
      endDeg: 360,
      label: currentSegment.label,
      switches: currentSegment.switches,
      isFreewheeling: currentSegment.label.includes('Freewheel'),
      isOff: currentSegment.label.includes('OFF') || currentSegment.label.includes('Blocking')
    });
  }

  // Analytical Theoretical Formula & Ideal V_dc calculation
  let theoreticalEquation = '';
  let theoreticalFormulaLatex = '';
  let theoreticalVDc = 0;

  const cosA = Math.cos(alphaRad);

  if (isSinglePhase) {
    if (!isFullBridge) {
      // 1-Phase Half-Wave
      if (devicePreset === 'all-diodes') {
        theoreticalEquation = 'V_dc = V_m / π';
        theoreticalFormulaLatex = 'V_{dc} = \\frac{V_m}{\\pi}';
        theoreticalVDc = Vm / Math.PI;
      } else {
        theoreticalEquation = 'V_dc = (V_m / 2π) · (1 + cos α)';
        theoreticalFormulaLatex = 'V_{dc} = \\frac{V_m}{2\\pi} (1 + \\cos\\alpha)';
        theoreticalVDc = (Vm / (2 * Math.PI)) * (1 + cosA);
      }
    } else {
      // 1-Phase Full-Bridge
      if (devicePreset === 'all-diodes') {
        theoreticalEquation = 'V_dc = 2 · V_m / π';
        theoreticalFormulaLatex = 'V_{dc} = \\frac{2 V_m}{\\pi}';
        theoreticalVDc = (2 * Vm) / Math.PI;
      } else if (devicePreset === 'semi-converter' || fwdEnabled) {
        theoreticalEquation = 'V_dc = (V_m / π) · (1 + cos α)';
        theoreticalFormulaLatex = 'V_{dc} = \\frac{V_m}{\\pi} (1 + \\cos\\alpha)';
        theoreticalVDc = (Vm / Math.PI) * (1 + cosA);
      } else {
        theoreticalEquation = 'V_dc = (2 · V_m / π) · cos α';
        theoreticalFormulaLatex = 'V_{dc} = \\frac{2 V_m}{\\pi} \\cos\\alpha';
        theoreticalVDc = ((2 * Vm) / Math.PI) * cosA;
      }
    }
  } else {
    // 3-Phase
    if (!isFullBridge) {
      // 3-Phase Half-Wave (3-pulse)
      if (devicePreset === 'all-diodes') {
        theoreticalEquation = 'V_dc = (3√3 · V_m) / (2π)';
        theoreticalFormulaLatex = 'V_{dc} = \\frac{3\\sqrt{3} V_m}{2\\pi}';
        theoreticalVDc = (3 * Math.sqrt(3) * Vm) / (2 * Math.PI);
      } else {
        theoreticalEquation = 'V_dc = (3√3 · V_m / 2π) · cos α';
        theoreticalFormulaLatex = 'V_{dc} = \\frac{3\\sqrt{3} V_m}{2\\pi} \\cos\\alpha';
        theoreticalVDc = ((3 * Math.sqrt(3) * Vm) / (2 * Math.PI)) * cosA;
      }
    } else {
      // 3-Phase Full-Bridge (6-pulse)
      const Vml = Math.sqrt(3) * Vm;
      if (devicePreset === 'all-diodes') {
        theoreticalEquation = 'V_dc = (3 · V_ml) / π = (3√3 · V_m) / π';
        theoreticalFormulaLatex = 'V_{dc} = \\frac{3 V_{ml}}{\\pi} = \\frac{3\\sqrt{3} V_m}{\\pi}';
        theoreticalVDc = (3 * Vml) / Math.PI;
      } else if (devicePreset === 'semi-converter') {
        theoreticalEquation = 'V_dc = (3 · V_ml / 2π) · (1 + cos α)';
        theoreticalFormulaLatex = 'V_{dc} = \\frac{3 V_{ml}}{2\\pi} (1 + \\cos\\alpha)';
        theoreticalVDc = ((3 * Vml) / (2 * Math.PI)) * (1 + cosA);
      } else {
        theoreticalEquation = 'V_dc = (3 · V_ml / π) · cos α';
        theoreticalFormulaLatex = 'V_{dc} = \\frac{3 V_{ml}}{\\pi} \\cos\\alpha';
        theoreticalVDc = ((3 * Vml) / Math.PI) * cosA;
      }
    }
  }

  return {
    waveforms,
    vDc: Math.round(vDc * 10) / 10,
    vRms: Math.round(vRms * 10) / 10,
    iDc: Math.round(iDc * 100) / 100,
    iRms: Math.round(iRms * 100) / 100,
    isRms: Math.round(isRms * 100) / 100,
    pLoad: Math.round(pLoad * 10) / 10,
    sIn: Math.round(sIn * 10) / 10,
    powerFactor: Math.round(powerFactor * 1000) / 1000,
    displacementFactor: Math.round(displacementFactor * 1000) / 1000,
    rippleFactor: Math.round(rippleFactor * 1000) / 1000,
    formFactor: Math.round(formFactor * 1000) / 1000,
    thdCurrent: Math.round(thdCurrent * 10) / 10,
    thdVoltage: Math.round(thdVoltage * 10) / 10,
    isDCM,
    theoreticalEquation,
    theoreticalFormulaLatex,
    theoreticalVDc: Math.round(theoreticalVDc * 10) / 10,
    activeIntervals
  };
}

/**
 * Fast Fourier Transform (DFT) to compute harmonic spectrum
 */
export function computeHarmonics(
  waveforms: WaveformPoint[],
  baseFreq: number,
  maxHarmonics = 12
): HarmonicComponent[] {
  const N = waveforms.length;
  const harmonics: HarmonicComponent[] = [];

  // DC Component
  const vDc = waveforms.reduce((acc, p) => acc + p.vo, 0) / N;
  const iDc = waveforms.reduce((acc, p) => acc + p.io, 0) / N;
  harmonics.push({
    harmonic: 0,
    frequency: 0,
    voltageMag: Math.round(vDc * 10) / 10,
    currentMag: Math.round(iDc * 100) / 100,
    percentOfFund: 100
  });

  // Calculate fundamental first for percentage reference
  let fundV = 1;

  for (let h = 1; h <= maxHarmonics; h++) {
    let sumVsin = 0;
    let sumVcos = 0;
    let sumIsin = 0;
    let sumIcos = 0;

    for (let i = 0; i < N; i++) {
      const angle = (h * i * 2 * Math.PI) / N;
      sumVsin += waveforms[i].vo * Math.sin(angle);
      sumVcos += waveforms[i].vo * Math.cos(angle);
      sumIsin += waveforms[i].is * Math.sin(angle);
      sumIcos += waveforms[i].is * Math.cos(angle);
    }

    const vPeak = (2 / N) * Math.sqrt(sumVsin * sumVsin + sumVcos * sumVcos);
    const iPeak = (2 / N) * Math.sqrt(sumIsin * sumIsin + sumIcos * sumIcos);

    if (h === 1) fundV = Math.max(0.1, vPeak);

    harmonics.push({
      harmonic: h,
      frequency: h * baseFreq,
      voltageMag: Math.round(vPeak * 10) / 10,
      currentMag: Math.round(iPeak * 100) / 100,
      percentOfFund: Math.round((vPeak / fundV) * 100)
    });
  }

  return harmonics;
}
