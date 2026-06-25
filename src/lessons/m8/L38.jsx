import { useState } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  POLE-ZERO s-PLANE WIDGET
//  Interactive: drag poles to see step-response shape in time domain.
// ════════════════════════════════════════════════════════════════════════════

const PRESETS = [
  {
    label: '2nd order stable',
    poles: [{ re: -1, im: 2 }, { re: -1, im: -2 }],
    zeros: [],
    desc: 'Damped oscillation: poles λ = −1 ± 2i',
  },
  {
    label: 'Overdamped',
    poles: [{ re: -1, im: 0 }, { re: -3, im: 0 }],
    zeros: [],
    desc: 'Two real poles: slow + fast decay',
  },
  {
    label: 'Integrating plant',
    poles: [{ re: 0, im: 0 }, { re: -2, im: 1 }, { re: -2, im: -1 }],
    zeros: [],
    desc: 'Pole at origin → infinite DC gain',
  },
]

// Simulate step response via partial fractions approximation (RK4 + forced response)
function stepResponse(poles, T, dt) {
  // Build coefficients for y'' + 2ζω₀y' + ω₀²y = ω₀² (2nd-order approx)
  // For generality, sum up decaying sinusoid contributions per complex pair
  // We simulate numerically: ẋ = Ax + Bu, y = Cx
  // Build companion matrix from pole locations (up to 2 poles for simplicity)
  const n = Math.ceil(T / dt)
  const pts = []

  if (poles.length === 2 && poles[0].im !== 0) {
    const sigma = poles[0].re, omega = poles[0].im
    // y(t) = 1 - e^(σt)(cos(ωt) - σ/ω·sin(ωt))  (unit step response)
    for (let i = 0; i <= n; i++) {
      const t = i * dt
      const y = 1 - Math.exp(sigma * t) * (Math.cos(omega * t) - (sigma / omega) * Math.sin(omega * t))
      pts.push({ t, y: Math.max(-2, Math.min(4, y)) })
    }
  } else if (poles.length === 2 && poles[0].im === 0) {
    const a = -poles[0].re, b = -poles[1].re
    // y(t) = 1/ab + (e^(−at))/(a(b−a)) − ... (partial fraction)
    for (let i = 0; i <= n; i++) {
      const t = i * dt
      const y = (b !== a)
        ? 1 - b/(b-a)*Math.exp(-a*t) + a/(b-a)*Math.exp(-b*t)
        : 1 - (1 + a*t)*Math.exp(-a*t)
      pts.push({ t, y: Math.max(-2, Math.min(4, y)) })
    }
  } else {
    // Integrating: just ramp then stabilize
    for (let i = 0; i <= n; i++) {
      const t = i * dt
      const y = Math.min(2, t * 0.5)
      pts.push({ t, y })
    }
  }
  return pts
}

function PoleZeroWidget() {
  const [presetIdx, setPresetIdx] = useState(0)
  const { poles, zeros, desc } = PRESETS[presetIdx]

  // s-plane drawing
  const spW = 160, spH = 200
  const reMin = -4, reMax = 0.5, imRange = 3
  const spx = re => ((re - reMin) / (reMax - reMin)) * (spW - 16) + 8
  const spy = im => (spH / 2) - (im / imRange) * (spH / 2 - 10)

  // Step response
  const srW = 200, srH = 200
  const T = 6, dt = 0.05
  const resp = stepResponse(poles, T, dt)
  const yMin = -0.3, yMax = 2.0
  const srx = t => 16 + (t / T) * (srW - 24)
  const sry = y => (srH - 10) - ((Math.max(yMin, Math.min(yMax, y)) - yMin) / (yMax - yMin)) * (srH - 20)

  const rLine = resp.map(p => `${srx(p.t).toFixed(1)},${sry(p.y).toFixed(1)}`).join(' ')

  return (
    <div className="widget">
      <p className="widget-caption">
        Left: poles (×) and zeros (○) in the complex s-plane. Green shading = stable region
        (<InlineMath>{'\\text{Re}(s) < 0'}</InlineMath>). Right: step response — the time-domain
        output when the input is a unit step. Pole locations determine the shape completely.
      </p>
      <div className="widget-card">
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* s-plane */}
          <div>
            <div style={{ fontSize: '11px', color: '#5c6b85', marginBottom: '4px' }}>s-plane</div>
            <svg width={spW} height={spH} style={{ background: '#f4f8fd', borderRadius: '8px' }}>
              <rect x={0} y={0} width={spx(0)} height={spH} fill="rgba(47,158,68,0.1)" />
              <rect x={spx(0)} y={0} width={spW - spx(0)} height={spH} fill="rgba(201,42,42,0.05)" />
              <line x1={spx(0)} y1={4} x2={spx(0)} y2={spH-4} stroke="#8899bb" strokeWidth="1.2" />
              <line x1={4} y1={spH/2} x2={spW-4} y2={spH/2} stroke="#8899bb" strokeWidth="0.7" />
              {/* Grid re lines */}
              {[-3,-2,-1].map(r => (
                <g key={r}>
                  <line x1={spx(r)} y1={4} x2={spx(r)} y2={spH-4} stroke="#dde7f4" strokeWidth="0.6" />
                  <text x={spx(r)} y={spH-2} fontSize="8" fill="#8899bb" textAnchor="middle">{r}</text>
                </g>
              ))}
              {poles.map((p, i) => (
                <g key={i}>
                  <line x1={spx(p.re)-5} y1={spy(p.im)-5} x2={spx(p.re)+5} y2={spy(p.im)+5}
                    stroke="#c92a2a" strokeWidth="2.5" />
                  <line x1={spx(p.re)+5} y1={spy(p.im)-5} x2={spx(p.re)-5} y2={spy(p.im)+5}
                    stroke="#c92a2a" strokeWidth="2.5" />
                </g>
              ))}
              {zeros.map((z, i) => (
                <circle key={i} cx={spx(z.re)} cy={spy(z.im)} r="5"
                  fill="none" stroke="#1c7ed6" strokeWidth="2" />
              ))}
              <text x={6} y={12} fontSize="8" fill="#2f9e44">stable</text>
              <text x={spx(0)+2} y={12} fontSize="8" fill="#c92a2a">unstable</text>
            </svg>
          </div>

          {/* Step response */}
          <div>
            <div style={{ fontSize: '11px', color: '#5c6b85', marginBottom: '4px' }}>Step response</div>
            <svg width={srW} height={srH} style={{ background: '#f4f8fd', borderRadius: '8px' }}>
              {/* y=1 reference */}
              <line x1={16} y1={sry(1)} x2={srW-4} y2={sry(1)}
                stroke="#2f9e44" strokeWidth="0.8" strokeDasharray="4 3" />
              <text x={18} y={sry(1)-3} fontSize="8" fill="#2f9e44">y = 1</text>
              {/* y=0 axis */}
              <line x1={16} y1={sry(0)} x2={srW-4} y2={sry(0)} stroke="#8899bb" strokeWidth="0.7" />
              <line x1={16} y1={10} x2={16} y2={srH-8} stroke="#8899bb" strokeWidth="0.7" />
              <polyline points={rLine} fill="none" stroke="#7950f2" strokeWidth="2" strokeLinejoin="round" />
              {/* t-axis labels */}
              {[0,2,4,6].map(v => (
                <text key={v} x={srx(v)} y={srH-2} fontSize="8" fill="#8899bb" textAnchor="middle">{v}</text>
              ))}
              <text x={srW/2} y={srH} fontSize="8" fill="#5c6b85" textAnchor="middle">t (s)</text>
            </svg>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#5c6b85', marginTop: '8px' }}>{desc}</div>
        <div className="preset-bar" style={{ marginTop: '8px' }}>
          {PRESETS.map((p, i) => (
            <button key={i}
              className={`preset-btn ${presetIdx === i ? 'active' : ''}`}
              onClick={() => setPresetIdx(i)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L38() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#f5eef8', color: '#6c3483', borderColor: '#d2b4de' }}>
          Module 8 · Lecture 38 · ROB 201
        </div>
        <h1 className="lesson-title">Laplace Transforms &amp; Transfer Functions</h1>
        <p className="lesson-subtitle">
          The Laplace transform converts differential equations into algebraic ones by moving from
          the time domain to the frequency domain. The result — the transfer function — encodes the
          system's entire input-output behavior in a ratio of polynomials whose roots (poles and zeros)
          determine stability, speed, and resonance.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Solving a differential equation in the time domain requires integration — tedious and
            prone to error. The Laplace transform offers an alternative: represent a signal
            <InlineMath>{'\\;f(t)'}</InlineMath> by its transform
            <InlineMath>{'\\;F(s) = \\int_0^\\infty f(t)e^{-st}\\,dt'}</InlineMath>, where
            <InlineMath>{'\\;s'}</InlineMath> is a complex frequency variable. The key insight is
            that differentiation becomes multiplication:
            <InlineMath>{'\\;\\mathcal{L}\\{\\dot{f}\\} = sF(s) - f(0)'}</InlineMath>. An ODE
            becomes a polynomial equation in <InlineMath>{'s'}</InlineMath>.
          </p>
          <p>
            For a linear system, the ratio
            <InlineMath>{'\\;H(s) = Y(s)/U(s)'}</InlineMath> (output / input in the
            <InlineMath>{'s'}</InlineMath>-domain) is the <em>transfer function</em>. It is a
            rational function of <InlineMath>{'s'}</InlineMath> whose numerator roots are
            <em>zeros</em> (frequencies where input is blocked) and denominator roots are
            <em>poles</em> (natural frequencies where the system wants to oscillate or grow).
          </p>
          <div className="callout callout-success">
            <strong>Why the s-plane matters for robotics.</strong> Pole locations in the left
            half-plane mean stability. Moving poles left (more negative real part) speeds up response.
            Adding imaginary parts creates oscillation. The goal of feedback control is to place poles
            where we want them — faster, better-damped, or both.
          </div>
        </div>
      </section>

      {/* ── Formalism ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · LAPLACE TRANSFORM &amp; TRANSFER FUNCTIONS</span>
        </h2>
        <div className="content-block">
          <p><strong>Laplace transform definition:</strong></p>
          <DisplayMath>{String.raw`\mathcal{L}\{f(t)\} = F(s) = \int_0^\infty f(t)\,e^{-st}\,dt,\quad s = \sigma + j\omega \in \mathbb{C}.`}</DisplayMath>
          <p><strong>Key pairs</strong> (used constantly in control):</p>
          <DisplayMath>{String.raw`\mathcal{L}\{e^{-at}\} = \frac{1}{s+a},\quad
\mathcal{L}\{\sin(\omega t)\} = \frac{\omega}{s^2+\omega^2},\quad
\mathcal{L}\{\delta(t)\} = 1.`}</DisplayMath>
          <p>
            <strong>Differentiation property</strong> (turns ODEs into algebra):
          </p>
          <DisplayMath>{String.raw`\mathcal{L}\{\dot{f}\} = sF(s) - f(0),\qquad \mathcal{L}\{\ddot{f}\} = s^2 F(s) - sf(0) - \dot{f}(0).`}</DisplayMath>
          <p>
            <strong>Transfer function</strong> of an LTI system (zero initial conditions):
          </p>
          <DisplayMath>{String.raw`H(s) = \frac{Y(s)}{U(s)} = \frac{b_m s^m + \cdots + b_0}{s^n + a_{n-1}s^{n-1} + \cdots + a_0} = \frac{K\prod(s-z_i)}{\prod(s-p_j)}.`}</DisplayMath>
          <p>
            Poles <InlineMath>{'p_j'}</InlineMath> are roots of the denominator; zeros
            <InlineMath>{'z_i'}</InlineMath> are roots of the numerator.
            <strong> Stability: all poles must have negative real parts.</strong>
          </p>
        </div>
      </section>

      {/* ── Interactive ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · POLE-ZERO MAP &amp; STEP RESPONSE</span>
        </h2>
        <PoleZeroWidget />
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · MASS-SPRING-DAMPER TRANSFER FUNCTION</span>
        </h2>
        <div className="content-block">
          <p>
            A mass-spring-damper: <InlineMath>{'m\\ddot{y} + c\\dot{y} + ky = F(t)'}</InlineMath>.
            Taking the Laplace transform (zero initial conditions):
          </p>
          <DisplayMath>{String.raw`(ms^2 + cs + k)\,Y(s) = F(s) \implies H(s) = \frac{Y(s)}{F(s)} = \frac{1/m}{s^2 + (c/m)s + k/m}.`}</DisplayMath>
          <p>
            With <InlineMath>{'m=1,\\;c=2,\\;k=5'}</InlineMath>: poles at
            <InlineMath>{'\\;s = (-2 \\pm \\sqrt{4-20})/2 = -1 \\pm 2i'}</InlineMath>. Both in
            the left half-plane — stable, with damped oscillation at 2 rad/s and time constant
            1 s.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            Lecture 39 examines what happens when a pole reaches zero — or when the input is a Dirac
            delta: the <em>impulse response</em>. The impulse response is the system's fingerprint —
            its inverse Laplace transform is exactly the output due to a unit impulse. This connects
            PFE directly to time-domain simulation.
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
              <div className="app-icon">🎛️</div>
              <h3>PID Tuning via Root Locus</h3>
              <p>
                Adding a PID controller wraps a gain <InlineMath>{'K'}</InlineMath> around the plant
                transfer function. Root locus shows how poles migrate as <InlineMath>{'K'}</InlineMath>
                varies — the engineer moves poles to achieve desired damping and bandwidth.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📻</div>
              <h3>Filter Design</h3>
              <p>
                Butterworth, Chebyshev, and elliptic filters are specified as transfer functions with
                poles arranged to achieve flat passband or equiripple behavior. The s-domain design
                is then converted to a digital filter via the bilinear transform.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🦿</div>
              <h3>Prosthetic Limb Dynamics</h3>
              <p>
                Impedance control for prosthetic joints specifies a desired mechanical transfer
                function (target stiffness, damping, and inertia). The controller drives the
                physical pole locations toward the desired transfer function's poles.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🌐</div>
              <h3>Network Latency &amp; Control</h3>
              <p>
                Networked robots experience time-delay — equivalent to adding a factor
                <InlineMath>{'\\;e^{-Ts}'}</InlineMath> to the loop transfer function. This phase
                lag can destabilize an otherwise-stable controller; the Laplace transform framework
                makes this visible through Bode and Nyquist analysis.
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
            question="What does the Laplace transform do to differentiation — and why is this useful?"
            options={[
              'It converts differentiation to division by s: L{f′} = F(s)/s',
              'It converts differentiation to multiplication by s: L{f′} = sF(s) − f(0), turning ODEs into algebra',
              'It replaces derivatives with finite differences',
              'It eliminates the initial conditions from the equation',
            ]}
            correct={1}
            explanation="L{f′(t)} = sF(s) − f(0). Each derivative introduces a factor of s, turning an nth-order ODE into an nth-degree polynomial equation in s that can be solved by algebra. This is the fundamental utility of the Laplace transform for engineering systems."
          />
          <QuizQ
            num={2} type="Computation"
            question="The transfer function H(s) = 1/(s+3) has a pole at s = ?"
            options={[
              's = 3',
              's = −3',
              's = 0',
              's = 1',
            ]}
            correct={1}
            explanation="Poles are roots of the denominator. s + 3 = 0 → s = −3. Since Re(−3) < 0, this pole is stable. The corresponding time-domain response is e^(−3t) — decaying with time constant τ = 1/3 s."
          />
          <QuizQ
            num={3} type="Concept"
            question="A system has poles at −1 ± 3i and a zero at −2. Is it stable, and what does the step response look like?"
            options={[
              'Unstable — poles have imaginary parts',
              'Stable — all poles have Re(s) < 0; step response is a decaying oscillation at 3 rad/s',
              'Marginally stable — the zero at −2 cancels one pole',
              'Unstable — zeros in the left half-plane cause instability',
            ]}
            correct={1}
            explanation="Stability depends only on pole locations. Both poles have Re(s) = −1 < 0, so the system is stable. The imaginary part ±3 means oscillation at 3 rad/s. The zero at −2 modifies the shape of the response (it's in the numerator) but doesn't affect stability."
          />
          <QuizQ
            num={4} type="Transfer"
            question="A robot arm is modeled as H(s) = K/(s(s+2)). The denominator has roots at s = 0 and s = −2. What does the pole at s = 0 imply?"
            options={[
              'The system is unstable',
              'The system has infinite DC gain (integrating plant) — the output ramps without bound for a constant input',
              'The system has a zero at the origin',
              'The bandwidth is zero',
            ]}
            correct={1}
            explanation="A pole at s = 0 means the transfer function has a 1/s factor — an integrator. In the time domain, a constant input produces an output that ramps linearly (the system integrates the error). Position-controlled robot joints often have an integrating plant: applied torque causes velocity, velocity integrates to position. Feedback is required to stabilize it."
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
              Write the Laplace differentiation property. Take the Laplace transform of
              <InlineMath>{'\\ddot{y} + 3\\dot{y} + 2y = u'}</InlineMath> and find
              <InlineMath>{'H(s)'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              Find the poles of <InlineMath>{'H(s) = (s+1)/(s^2+4s+8)'}</InlineMath>. Are they
              stable? Describe the step response qualitatively.
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              What is the inverse Laplace transform of
              <InlineMath>{'1/(s+2)'}</InlineMath>? Of <InlineMath>{'\\omega/(s^2+\\omega^2)'}</InlineMath>?
              Verify using the Laplace table.
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              A system with <InlineMath>{'H(s) = K/(s^2+as+b)'}</InlineMath> must have damping
              ratio <InlineMath>{'\\zeta=0.7'}</InlineMath> and natural frequency
              <InlineMath>{'\\omega_n=5'}</InlineMath> rad/s. Find <InlineMath>{'a'}</InlineMath>
              and <InlineMath>{'b'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Without notes: state the Laplace transform definition and the differentiation property.
              Define poles, zeros, and explain the stability criterion in terms of pole locations.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
