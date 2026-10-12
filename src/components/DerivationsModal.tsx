import React, { useState } from 'react';
import { X, BookOpen, Calculator, Sparkles } from 'lucide-react';

interface DerivationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DerivationsModal: React.FC<DerivationsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'1ph-half' | '1ph-full' | '1ph-semi' | '3ph-half' | '3ph-full' | 'metrics'>('1ph-full');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Waveform Analysis & Analytical Derivations
                <span className="px-2 py-0.5 text-xs font-normal font-mono bg-amber-950 text-amber-300 border border-amber-500/30 rounded-full">
                  Calculus & Fourier Proofs
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Step-by-step mathematical proofs of average voltage, RMS, ripple, and power factors
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40 overflow-x-auto gap-2 py-2">
          {[
            { id: '1ph-full', label: '1Φ Full-Bridge' },
            { id: '1ph-semi', label: '1Φ Semi-Converter' },
            { id: '1ph-half', label: '1Φ Half-Wave' },
            { id: '3ph-full', label: '3Φ 6-Pulse Bridge' },
            { id: '3ph-half', label: '3Φ 3-Pulse Half-Wave' },
            { id: 'metrics', label: 'Power & Harmonics Formulas' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {activeTab === '1ph-full' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-cyan-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> 1-Phase Fully-Controlled Full Converter (Thyristor Bridge)
              </h3>
              <p className="text-slate-300">
                In a single-phase full-converter bridge with continuous current (CCM), thyristor pair T1 + T2 conduct from <code className="text-amber-300">α</code> to <code className="text-amber-300">π + α</code>, delivering <code className="text-cyan-300">v_o = v_s</code>. At <code className="text-amber-300">π + α</code>, pair T3 + T4 is fired, turning off T1 + T2 and delivering <code className="text-cyan-300">v_o = -v_s</code>.
              </p>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-slate-400">// 1. Average DC Output Voltage Derivation:</div>
                <div className="text-emerald-400 font-bold">
                  V_dc = (1 / π) · ∫[α → π + α] V_m · sin(ωt) d(ωt)
                </div>
                <div>= (V_m / π) · [ -cos(ωt) ] [α → π + α]</div>
                <div>= (V_m / π) · [ -cos(π + α) - (-cos(α)) ]</div>
                <div>= (V_m / π) · [ -(-cos α) + cos α ]</div>
                <div className="text-cyan-300 font-bold text-sm">
                  ➔ V_dc = (2 · V_m / π) · cos(α)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-slate-400">// 2. RMS Output Voltage Derivation:</div>
                <div className="text-emerald-400 font-bold">
                  V_rms = √ [ (1 / π) · ∫[α → π + α] V_m² · sin²(ωt) d(ωt) ]
                </div>
                <div>= V_m · √ [ (1 / 2π) · ∫[α → π + α] (1 - cos 2ωt) d(ωt) ]</div>
                <div className="text-cyan-300 font-bold text-sm">
                  ➔ V_rms = V_m / √2 = V_source_rms (Constant for all α in CCM!)
                </div>
              </div>

              <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
                <strong>Crucial Inversion Principle:</strong> When <code className="text-amber-300">α &gt; 90°</code>, <code className="text-white">cos(α) &lt; 0</code>, meaning average voltage <code className="text-rose-400">V_dc &lt; 0</code>! If an active DC source or motor Back-EMF provides load voltage with reverse polarity, power flows backwards from DC to AC (Line-Commutated Inverter Mode / Regenerative Braking).
              </div>
            </div>
          )}

          {activeTab === '1ph-semi' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-cyan-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> 1-Phase Semi-Converter (Half-Controlled Bridge or with FWD)
              </h3>
              <p className="text-slate-300">
                In a semi-converter (2 thyristors and 2 diodes, or full bridge with freewheeling diode), when the supply voltage crosses zero at <code className="text-amber-300">π</code>, diodes conduct naturally to freewheel the inductor current. This clamps the output voltage to <code className="text-emerald-300">v_o = 0V</code> during <code className="text-amber-300">[π, π + α]</code>.
              </p>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-slate-400">// Average DC Voltage Derivation:</div>
                <div className="text-emerald-400 font-bold">
                  V_dc = (1 / π) · [ ∫[α → π] V_m · sin(ωt) d(ωt) + ∫[π → π + α] 0 d(ωt) ]
                </div>
                <div>= (V_m / π) · [ -cos(ωt) ] [α → π]</div>
                <div>= (V_m / π) · [ -cos(π) - (-cos α) ]</div>
                <div>= (V_m / π) · [ -(-1) + cos α ]</div>
                <div className="text-cyan-300 font-bold text-sm">
                  ➔ V_dc = (V_m / π) · (1 + cos α)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-slate-400">// RMS Output Voltage:</div>
                <div className="text-cyan-300 font-bold text-sm">
                  ➔ V_rms = (V_m / 2) · √ [ (1/π) · ( (π - α) + (sin 2α / 2) ) ]
                </div>
              </div>
            </div>
          )}

          {activeTab === '1ph-half' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-cyan-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> 1-Phase Half-Wave Controlled Rectifier
              </h3>
              <p className="text-slate-300">
                A single thyristor conducts when fired at <code className="text-amber-300">α</code>. For a purely resistive load, conduction terminates at <code className="text-amber-300">π</code>. For an RL load without FWD, current continues until extinction angle <code className="text-amber-300">β &gt; π</code>.
              </p>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-slate-400">// Resistive Load Average DC Voltage:</div>
                <div className="text-emerald-400 font-bold">
                  V_dc = (1 / 2π) · ∫[α → π] V_m · sin(ωt) d(ωt)
                </div>
                <div>= (V_m / 2π) · [ -cos(π) - (-cos α) ]</div>
                <div className="text-cyan-300 font-bold text-sm">
                  ➔ V_dc = (V_m / 2π) · (1 + cos α)
                </div>
                <div className="text-slate-400 mt-2">// When α = 0 (Uncontrolled Diode):</div>
                <div className="text-amber-300 font-bold">
                  V_dc = V_m / π ≈ 0.318 · V_m
                </div>
              </div>
            </div>
          )}

          {activeTab === '3ph-full' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-cyan-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> 3-Phase 6-Pulse Full Converter (Graetz Bridge)
              </h3>
              <p className="text-slate-300">
                The most widely used converter in high-power industrial applications, HVDC transmission, and locomotive traction. Six thyristors conduct in pairs for 60° (π/3) each, yielding a 6-pulse ripple at 6 times the supply frequency (300Hz for 50Hz grid).
              </p>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-slate-400">// Average DC Output Voltage Derivation:</div>
                <div>The output line-to-line voltage during interval [ -π/6 + α , π/6 + α ] is:</div>
                <div className="text-slate-300">v_o = V_ml · cos(ωt)   where V_ml = √3 · V_m</div>
                <div className="text-emerald-400 font-bold">
                  V_dc = (3 / π) · ∫[ -π/6 + α → π/6 + α ] V_ml · cos(ωt) d(ωt)
                </div>
                <div>= (3 · V_ml / π) · [ sin(π/6 + α) - sin(-π/6 + α) ]</div>
                <div>= (3 · V_ml / π) · [ 2 · sin(π/6) · cos(α) ] = (3 · V_ml / π) · cos(α)</div>
                <div className="text-cyan-300 font-bold text-sm">
                  ➔ V_dc = (3 · V_ml / π) · cos(α) = (3√3 · V_m / π) · cos(α) ≈ 1.654 · V_m · cos(α)
                </div>
                <div className="text-slate-400 mt-2">// For Diode 6-Pulse Bridge (α = 0):</div>
                <div className="text-amber-300 font-bold">
                  V_dc = 1.35 · V_line_rms
                </div>
              </div>
            </div>
          )}

          {activeTab === '3ph-half' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-cyan-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> 3-Phase Half-Wave Rectifier (3-Pulse Converter)
              </h3>
              <p className="text-slate-300">
                Three thyristors connected to a star neutral. Each switch conducts for 120° (2π/3). Natural commutation points are at 30° (π/6), 150°, and 270°.
              </p>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-slate-400">// Average DC Voltage:</div>
                <div className="text-emerald-400 font-bold">
                  V_dc = (3 / 2π) · ∫[ π/6 + α → 5π/6 + α ] V_m · sin(ωt) d(ωt)
                </div>
                <div className="text-cyan-300 font-bold text-sm">
                  ➔ V_dc = (3√3 · V_m / 2π) · cos(α) ≈ 0.827 · V_m · cos(α)
                </div>
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-cyan-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Power Electronics Performance Metrics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-cyan-300">Form Factor (FF) & Ripple Factor (RF)</div>
                  <div className="font-mono text-xs text-slate-300">FF = V_rms / V_dc</div>
                  <div className="font-mono text-xs text-slate-300">RF = V_ac_rms / V_dc = √(FF² - 1)</div>
                  <p className="text-xs text-slate-400">
                    A lower ripple factor indicates a purer DC output with minimal harmonic heating.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-purple-300">Total Power Factor (PF)</div>
                  <div className="font-mono text-xs text-slate-300">PF = P / S = (I_s1_rms / I_s_rms) · cos(φ1)</div>
                  <div className="font-mono text-xs text-slate-300">PF = Distortion Factor · Displacement Factor</div>
                  <p className="text-xs text-slate-400">
                    Distortion factor accounts for harmonic distortion, while displacement factor accounts for phase shift α.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-amber-300">Total Harmonic Distortion (THD_i)</div>
                  <div className="font-mono text-xs text-slate-300">
                    THD_i = √ [ (I_s_rms / I_s1_rms)² - 1 ] · 100%
                  </div>
                  <p className="text-xs text-slate-400">
                    Quantifies line current pollution according to IEEE 519 standards.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-emerald-300">Transformer Utilization Factor (TUF)</div>
                  <div className="font-mono text-xs text-slate-300">TUF = P_dc / S_rated</div>
                  <p className="text-xs text-slate-400">
                    1Φ Half-Wave: 0.286 | 1Φ Full-Bridge: 0.812 | 3Φ 6-Pulse: 0.955 (Extremely high transformer efficiency).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Close Derivations
          </button>
        </div>
      </div>
    </div>
  );
};
