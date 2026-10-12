import React from 'react';
import { X, BookOpen, Cpu, Zap, Activity, ShieldCheck } from 'lucide-react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Power Electronics Theory & Principles
              </h2>
              <p className="text-xs text-slate-400">
                Operating mechanisms of line-commutated converters, natural commutation, quadrants, and inductive loads
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Card 1: Diode vs Thyristor */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="font-bold text-cyan-300 text-base flex items-center gap-2">
              <Cpu className="w-4 h-4" /> 1. Diodes vs. Thyristors (SCRs)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <strong className="text-emerald-400 block mb-1">Uncontrolled Rectifiers (Diodes):</strong>
                Turn ON automatically as soon as anode voltage exceeds cathode voltage (v_AK &gt; 0). Turn OFF when current naturally drops to zero. Output DC voltage cannot be adjusted without changing the input transformer tap.
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <strong className="text-amber-400 block mb-1">Phase-Controlled Converters (Thyristors):</strong>
                Require both forward bias (v_AK &gt; 0) AND an external gate trigger pulse (i_gate &gt; I_GT). Delaying this firing pulse by firing angle α allows continuous smooth control of the average DC output voltage from maximum down to zero (or negative).
              </div>
            </div>
          </div>

          {/* Card 2: Continuous (CCM) vs Discontinuous (DCM) */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="font-bold text-amber-300 text-base flex items-center gap-2">
              <Activity className="w-4 h-4" /> 2. Continuous (CCM) vs. Discontinuous (DCM) Conduction
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When the load contains inductance ($L$), the magnetic field stores energy ($E = \frac{1}{2} L i^2$).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-emerald-400">CCM (Continuous Conduction Mode):</span>
                <p className="text-slate-400 mt-1">
                  Occurs when inductance is large or firing angle is small. The inductor current never drops to zero throughout the cycle. The output voltage strictly follows the connected AC line voltage segments.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-rose-400">DCM (Discontinuous Conduction Mode):</span>
                <p className="text-slate-400 mt-1">
                  Occurs with light load current, high resistance, or low inductance. The inductor completely releases its stored energy before the next thyristor is fired, causing current to stay at zero. Output voltage floats at the load Back-EMF $E$.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Freewheeling Diode */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="font-bold text-emerald-300 text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> 3. Why Use a Freewheeling Diode (FWD)?
            </h3>
            <ul className="list-disc pl-5 text-xs text-slate-300 space-y-1.5">
              <li>
                <strong>Prevents Negative Voltage Excursion:</strong> In an inductive circuit without FWD, current forces the conducting thyristor to stay ON even into the negative AC half-cycle, reducing average DC voltage.
              </li>
              <li>
                <strong>Higher Output Voltage & Better Efficiency:</strong> Clamping the output voltage to $0V$ preserves the average DC voltage and prevents negative power return to the AC mains.
              </li>
              <li>
                <strong>Improved Input Power Factor:</strong> Freewheeling bypasses the AC source during decay, eliminating reactive power drawn from the utility grid.
              </li>
            </ul>
          </div>

          {/* Card 4: 2-Quadrant and 4-Quadrant Operation */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="font-bold text-purple-300 text-base flex items-center gap-2">
              <Zap className="w-4 h-4" /> 4. Converter Quadrants & Inverter Mode
            </h3>
            <div className="text-xs text-slate-300 space-y-2">
              <p>
                In a fully controlled thyristor bridge:
              </p>
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-cyan-400 font-bold">Quadrant I (Rectifier Mode):</span>
                  <div className="text-slate-400 mt-1">0° &le; α &lt; 90°</div>
                  <div>V_dc &gt; 0, I_dc &gt; 0 ➔ Power: AC to DC</div>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-rose-400 font-bold">Quadrant IV (Inverter Mode):</span>
                  <div className="text-slate-400 mt-1">90° &lt; α &lt; 180°</div>
                  <div>V_dc &lt; 0, I_dc &gt; 0 ➔ Power: DC to AC (Regeneration)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
