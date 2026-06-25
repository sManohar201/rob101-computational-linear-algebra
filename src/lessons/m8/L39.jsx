import { useState } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  IMPULSE / STEP / RAMP RESPONSE WIDGET
//  Shows how a second-order system responds to different input signals.
// ════════════════════════════════════════════════════════════════════════════

const RESPONSES = [
  { label: 'Impulse h(t)', key: 'impulse' },
  { label: 'Step y(t)', key: 'step' },
  { label: 'Ramp r(t)', key: 'ramp' },
]

// Second-order system: H(s) = ωn² / (s² + 2ζωn·s + ωn²)
// Natural frequency ωn, damping ratio ζ
function computeResponse(zeta, wn, kind, T = 8, dt = 0.02) {
  const wd = wn * Math.sqrt(Math.abs(1 - zeta * zeta))
  const sigma = zeta * wn
  const n = Math.ceil(T / dt)
  const pts = []

  for (let i = 0; i <= n; i++) {
    const t = i * dt
    let y = 0
    if (zeta < 1) {
      // Underdamped
      if (kind === 'impulse') {
        y = wn / wd * Math.exp(-sigma * t) * Math.sin(wd * t)
      } else if (kind === 'step') {
        y = 1 - Math.exp(-sigma * t) * (Math.cos(wd * t) + sigma / wd * Math.sin(wd * t))
      } else {
        y = t - 2 * sigma / wn / wn + Math.exp(-sigma * t) / wn / wn *
            (2 * sigma * Math.cos(wd * t) + (2 * sigma * sigma / wd - wd) * Math.sin(wd * t))
      }
    } else if (zeta === 1) {
      // Critically damped
      if (kind === 'impulse') {
        y = wn * wn * t * Math.exp(-sigma * t)
      } else if (kind === 'step') {
        y = 1 - (1 + wn * t) * Math.exp(-wn * t)
      } else {
        y = t - 2 / wn + (2 / wn + t) * Math.exp(-wn * t)
      }
    } else {
      // Overdamped
      const r1 = -sigma + wn * Math.sqrt(zeta * zeta - 1)
      const r2 = -sigma - wn * Math.sqrt(zeta * zeta - 1)
      if (kind === 'impulse') {
        y = wn * wn / (r1 - r2) * (Math.exp(r1 * t) - Math.exp(r2 * t))
      } else if (kind === 'step') {
        y = 1 + r2 / (r1 - r2) * Math.exp(r1 * t) - r1 / (r1 - r2) * Math.exp(r2 * t)
      } else {
        y = t + (Math.exp(r2 * t) - Math.exp(r1 * t)) / (r1 - r2) / wn / wn +
            (Math.exp(r1 * t) / r1 - Math.exp(r2 * t) / r2) / (r1 - r2)
      }
    }
    pts.push({ t, y: Math.max(-3, Math.min(6, y)) })
  }
  return pts
}

function ImpulseWidget() {
  const [respIdx, setRespIdx] = useState(1)
  const [zeta, setZeta] = useState(0.3)
  const [wn, setWn] = useState(2)

  const kind = RESPONSES[respIdx].key
  const pts = computeResponse(zeta, wn, kind)

  const W = 340, H = 200
  const margin = { left: 24, right: 8, top: 12, bottom: 18 }
  const iW = W - margin.left - margin.right
  const iH = H - margin.top - margin.bottom
  const T = 8
  const yMin = kind === 'impulse' ? -0.4 : kind === 'step' ? -0.2 : -0.2
  const yMax = kind === 'impulse' ? 1.0 : kind === 'step' ? 1.8 : 5.0

  const px = t => margin.left + (t / T) * iW
  const py = y => margin.top + iH - ((Math.max(yMin, Math.min(yMax, y)) - yMin) / (yMax - yMin)) * iH

  const line = pts.map(p => `${px(p.t).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ')
  const py0 = py(0), py1 = py(1)

  const stable = zeta >= 0

  return (
    <div className="widget">
      <p className="widget-caption">
        A second-order system <InlineMath>{'H(s) = \\omega_n^2/(s^2+2\\zeta\\omega_n s+\\omega_n^2)'}</InlineMath>.
        The damping ratio <InlineMath>{'\\zeta'}</InlineMath> controls how oscillatory the response is.
        Toggle between impulse (derivative of step), step, and ramp responses.
      </p>
      <div className="widget-card">
        <div className="preset-bar" style={{ marginBottom: '10px' }}>
          {RESPONSES.map((r, i) => (
            <button key={i}
              className={`preset-btn ${respIdx === i ? 'active' : ''}`}
              onClick={() => setRespIdx(i)}>
              {r.label}
            </button>
          ))}
        </div>

        <svg width={W} height={H} style={{ background: '#f4f8fd', borderRadius: '8px', display: 'block' }}>
          {/* Reference y=1 for step */}
          {kind === 'step' && <line x1={margin.left} y1={py1} x2={W-margin.right} y2={py1}
            stroke="#2f9e44" strokeWidth="0.8" strokeDasharray="4 3" />}
          {/* y=0 axis */}
          <line x1={margin.left} y1={py0} x2={W-margin.right} y2={py0} stroke="#8899bb" strokeWidth="0.7" />
          <line x1={margin.left} y1={margin.top} x2={margin.left} y2={H-margin.bottom} stroke="#8899bb" strokeWidth="0.7" />
          <polyline points={line} fill="none" stroke="#7950f2" strokeWidth="2" strokeLinejoin="round" />
          {[0,2,4,6,8].map(v => (
            <text key={v} x={px(v)} y={H-margin.bottom+12} fontSize="9" fill="#8899bb" textAnchor="middle">{v}</text>
          ))}
          <text x={W/2} y={H-margin.bottom+14} fontSize="8" fill="#5c6b85" textAnchor="middle">t (s)</text>
        </svg>

        <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label className="slider-row">
              <span className="slider-label">
                Damping <InlineMath>{'\\zeta'}</InlineMath> = <b>{zeta.toFixed(2)}</b>
                {' '}<span style={{ fontSize: '11px', color: '#5c6b85' }}>
                  {zeta < 1 ? '(underdamped)' : zeta === 1 ? '(critical)' : '(overdamped)'}
                </span>
              </span>
              <input type="range" min={0.1} max={2.0} step={0.05} value={zeta}
                onChange={e => setZeta(Number(e.target.value))} />
            </label>
            <label className="slider-row">
              <span className="slider-label">
                <InlineMath>{'\\omega_n'}</InlineMath> = <b>{wn.toFixed(1)}</b> rad/s
              </span>
              <input type="range" min={0.5} max={5} step={0.5} value={wn}
                onChange={e => setWn(Number(e.target.value))} />
            </label>
          </div>
          <div className="hud-panel" style={{ minWidth: '140px' }}>
            <div className="hud-row"><span>Natural freq</span><strong>{wn.toFixed(1)} rad/s</strong></div>
            <div className="hud-row"><span>Damped freq</span>
              <strong>{(zeta < 1 ? wn * Math.sqrt(1 - zeta*zeta) : 0).toFixed(2)} rad/s</strong>
            </div>
            <div className="hud-row"><span>Time constant</span>
              <strong>{(1 / (zeta * wn)).toFixed(2)} s</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L39() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#f5eef8', color: '#6c3483', borderColor: '#d2b4de' }}>
          Module 8 · Lecture 39 · ROB 201
        </div>
        <h1 className="lesson-title">Poles, Zeros &amp; Dirac Delta</h1>
        <p className="lesson-subtitle">
          The Dirac delta is the idealized unit impulse — a signal with zero width, infinite height,
          and unit area. Its Laplace transform is 1, making it the "identity element" of convolution
          and the gateway to understanding a system's impulse response, which fully characterizes
          any LTI system.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Tap a wine glass: it rings at its natural frequency and then decays. That ringing is the
            <em>impulse response</em> — the system's reaction to a very short, sharp input. The Dirac
            delta <InlineMath>{'\\delta(t)'}</InlineMath> formalizes "very short and sharp" as a
            limit: a pulse of width <InlineMath>{'\\epsilon'}</InlineMath> and height
            <InlineMath>{'1/\\epsilon'}</InlineMath> as <InlineMath>{'\\epsilon \\to 0'}</InlineMath>.
          </p>
          <p>
            For a linear system, knowing the impulse response <InlineMath>{'h(t)'}</InlineMath> is
            equivalent to knowing everything about the system: the output for any input is the
            convolution <InlineMath>{'y(t) = h * u = \\int_0^t h(t-\\tau)u(\\tau)\\,d\\tau'}</InlineMath>.
            In the Laplace domain, this convolution becomes multiplication:
            <InlineMath>{'Y(s) = H(s) \\cdot U(s)'}</InlineMath>. The transfer function
            <InlineMath>{'H(s)'}</InlineMath> is the Laplace transform of the impulse response.
          </p>
          <p>
            The step response is the integral of the impulse response. The ramp response is the
            integral of the step response. These signals form a hierarchy: every signal type links
            to the others through differentiation / integration.
          </p>
        </div>
      </section>

      {/* ── Formalism ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · DIRAC DELTA &amp; IMPULSE RESPONSE</span>
        </h2>
        <div className="content-block">
          <p>
            <strong>Dirac delta:</strong> the distribution <InlineMath>{'\\delta(t)'}</InlineMath>
            satisfying
          </p>
          <DisplayMath>{String.raw`\int_{-\infty}^{\infty} \delta(t)\,dt = 1,\qquad \int_{-\infty}^{\infty} f(t)\,\delta(t-t_0)\,dt = f(t_0).`}</DisplayMath>
          <p>
            The second property (<em>sifting property</em>) extracts the value of
            <InlineMath>{'\\;f'}</InlineMath> at <InlineMath>{'\\;t_0'}</InlineMath>. Laplace
            transform: <InlineMath>{'\\mathcal{L}\\{\\delta(t)\\} = 1'}</InlineMath>.
          </p>
          <p>
            <strong>Impulse response:</strong> For an LTI system with transfer function
            <InlineMath>{'H(s)'}</InlineMath>, the impulse response is
            <InlineMath>{'h(t) = \\mathcal{L}^{-1}\\{H(s)\\}'}</InlineMath>. For a stable
            second-order system:
          </p>
          <DisplayMath>{String.raw`H(s) = \frac{\omega_n^2}{s^2+2\zeta\omega_n s+\omega_n^2}
\implies h(t) = \frac{\omega_n}{\sqrt{1-\zeta^2}}\,e^{-\zeta\omega_n t}\sin(\omega_d t),\quad\omega_d=\omega_n\sqrt{1-\zeta^2}.`}</DisplayMath>
          <p>
            <strong>Signal hierarchy:</strong>
          </p>
          <DisplayMath>{String.raw`\text{ramp}(t) \xrightarrow{\tfrac{d}{dt}} \text{step}(t) \xrightarrow{\tfrac{d}{dt}} \delta(t)
\quad\Longleftrightarrow\quad H_\delta(s) = s\cdot H_\text{step}(s).`}</DisplayMath>
          <div className="callout callout-success">
            <strong>Convolution theorem.</strong> Convolution in time equals multiplication in the
            Laplace domain: <InlineMath>{'\\mathcal{L}\\{h * u\\} = H(s)\\cdot U(s)'}</InlineMath>.
            This is why transfer functions are useful: they turn convolution integrals (hard) into
            algebraic products (easy).
          </div>
        </div>
      </section>

      {/* ── Interactive ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · SECOND-ORDER SYSTEM RESPONSES</span>
        </h2>
        <ImpulseWidget />
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · IMPULSE RESPONSE VIA PFE</span>
        </h2>
        <div className="content-block">
          <p>
            Find <InlineMath>{'h(t) = \\mathcal{L}^{-1}\\{1/(s^2+3s+2)\\}'}</InlineMath>. Factor the
            denominator: <InlineMath>{'(s+1)(s+2)'}</InlineMath>. Partial fractions:
          </p>
          <DisplayMath>{String.raw`\frac{1}{(s+1)(s+2)} = \frac{1}{s+1} - \frac{1}{s+2}.`}</DisplayMath>
          <p>
            Inverse Laplace term by term:
            <InlineMath>{'h(t) = e^{-t} - e^{-2t}'}</InlineMath> for <InlineMath>{'t \\geq 0'}</InlineMath>.
            This signal starts at 0, rises to a peak near <InlineMath>{'t = \\ln 2 \\approx 0.69'}</InlineMath>
            s, then decays back to 0 — a classic "doublet-like" response from two real poles.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            Lecture 40 puts this machinery to work: feedback control and PID design. Given a plant
            transfer function, we wrap it in a feedback loop with a PID controller and tune the
            gains to place the closed-loop poles where desired.
          </div>
        </div>
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span>
        </h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🔊</div>
              <h3>Acoustic Impulse Response</h3>
              <p>
                Room acoustics measurement fires a starter pistol (impulse) and records the
                microphone output. The recording is the room's impulse response; convolution with
                any audio signal reproduces how that audio would sound in that room.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🦾</div>
              <h3>Force Impulse Testing (FRF)</h3>
              <p>
                Impact hammer testing excites a robot structure with a known impulse force.
                The frequency response function (FRF) — the Fourier transform of the impulse
                response — reveals resonant modes, damping ratios, and stiffness coefficients.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📡</div>
              <h3>Channel Estimation in Wireless</h3>
              <p>
                A known pilot signal (approximating a delta) is transmitted; the received signal
                is the channel impulse response. Equalizers deconvolve the channel to recover the
                original data — the Laplace / Z-transform framework makes this tractable.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧠</div>
              <h3>Convolutional Neural Networks</h3>
              <p>
                A CNN filter is literally a learned impulse response. The filter slides over the
                input (convolution) to detect features — mathematically identical to convolving a
                signal with a linear filter, except the filter is learned by gradient descent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quiz ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag quiz-tag">QUIZ</span></h2>
        <div className="content-block">
          <QuizQ
            num={1} type="Concept"
            question="The Laplace transform of δ(t) is 1. What does this mean for transfer functions?"
            options={[
              'Applying a delta input drives every state to 1',
              'H(s) = Y(s)/U(s); with U(s) = 1 (delta input), Y(s) = H(s) — the output is the transfer function itself',
              'The impulse response is always constant',
              'The Laplace transform of the output equals 1 regardless of H(s)',
            ]}
            correct={1}
            explanation="Since L{δ(t)} = 1, the Laplace transform of the output y(t) due to a unit impulse is Y(s) = H(s)·U(s) = H(s)·1 = H(s). So h(t) = L^(−1){H(s)}: the impulse response is the inverse Laplace transform of the transfer function. H(s) fully encodes the system."
          />
          <QuizQ
            num={2} type="Concept"
            question="The sifting property of the Dirac delta states ∫f(t)δ(t−t₀)dt = f(t₀). What is this used for?"
            options={[
              'Integrating arbitrary functions numerically',
              'Extracting the value of f at t₀ — it is the basis for sampling theory and the convolution formula',
              'Defining the step function as the integral of the delta',
              'Computing the Fourier series of f',
            ]}
            correct={1}
            explanation="The sifting property says δ acts like a selector: integrating any function f against δ(t−t₀) picks out f(t₀). This is fundamental to sampling theory (ADC) and to the convolution formula y(t) = ∫h(τ)u(t−τ)dτ, where the delta acts as the 'probe'."
          />
          <QuizQ
            num={3} type="Computation"
            question="A system has impulse response h(t) = 2e^(−t)·sin(3t). What are the poles of H(s)?"
            options={[
              's = −1, s = −3',
              's = −1 ± 3i',
              's = 2 ± 3i',
              's = ±3i',
            ]}
            correct={1}
            explanation="The Laplace transform of e^(−σt)sin(ωt) is ω/((s+σ)²+ω²). With σ=1, ω=3: H(s) = 2·3/((s+1)²+9) = 6/(s²+2s+10). Poles are roots of s²+2s+10 = 0 → s = (−2 ± √(4−40))/2 = −1 ± 3i."
          />
          <QuizQ
            num={4} type="Transfer"
            question="The step response of a system is y(t) = 1 − e^(−2t). What is the impulse response h(t)?"
            options={[
              'h(t) = e^(−2t)',
              'h(t) = 2e^(−2t)',
              'h(t) = 1 − 2e^(−2t)',
              'h(t) = t·e^(−2t)',
            ]}
            correct={1}
            explanation="The impulse response is the derivative of the step response: h(t) = d/dt[1 − e^(−2t)] = 2e^(−2t). Verify: H(s) = L{2e^(−2t)} = 2/(s+2); transfer function for this system is G(s) = Y(s)/U_step(s) = (1/(s+2))/(1/s) = s/(s+2)... Wait, let's recalculate: Y_step(s) = L{1-e^(-2t)} = 1/s - 1/(s+2) = 2/(s(s+2)). U_step(s) = 1/s, so H(s) = 2/(s+2). Impulse response: L^(-1){2/(s+2)} = 2e^(-2t). ✓"
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span>
        </h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item">
              <span className="review-day">Day 0</span>
              Write the sifting property of <InlineMath>{'\\delta(t)'}</InlineMath>.
              Explain in one sentence why <InlineMath>{'h(t) = \\mathcal{L}^{-1}\\{H(s)\\}'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              Use PFE to find <InlineMath>{'\\mathcal{L}^{-1}\\{3/(s^2+5s+6)\\}'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Sketch the impulse and step responses for a second-order system with
              <InlineMath>{'\\zeta = 0.2'}</InlineMath> and <InlineMath>{'\\omega_n = 4'}</InlineMath> rad/s.
              Label the key features: damped natural frequency, time constant, overshoot.
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              Compute the step response of <InlineMath>{'H(s) = 4/(s^2+4s+4)'}</InlineMath>
              (critically damped). What is the settling time to within 2%?
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Without notes: state the convolution theorem. Explain the relationship between
              impulse response, step response, and the system transfer function.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
