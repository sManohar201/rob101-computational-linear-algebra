import { useState } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  ODE VECTOR FIELD + EULER/RK4 WIDGET
// ════════════════════════════════════════════════════════════════════════════

const PRESETS = [
  {
    label: 'Harmonic oscillator',
    f: (x, y) => [y, -x],
    x0: 2, y0: 0,
    desc: 'ẋ = y,  ẏ = −x  (circles)',
  },
  {
    label: 'Damped oscillator',
    f: (x, y) => [y, -x - 0.4 * y],
    x0: 2, y0: 0,
    desc: 'ẋ = y,  ẏ = −x − 0.4y  (spiral in)',
  },
  {
    label: 'Saddle (unstable)',
    f: (x, y) => [x, -y],
    x0: 0.3, y0: 0.1,
    desc: 'ẋ = x,  ẏ = −y  (saddle)',
  },
]

function eulerSteps(f, x0, y0, h, n) {
  const pts = [{ x: x0, y: y0 }]
  let x = x0, y = y0
  for (let i = 0; i < n; i++) {
    const [dx, dy] = f(x, y)
    x += h * dx; y += h * dy
    pts.push({ x, y })
  }
  return pts
}

function rk4Steps(f, x0, y0, h, n) {
  const pts = [{ x: x0, y: y0 }]
  let x = x0, y = y0
  for (let i = 0; i < n; i++) {
    const [k1x, k1y] = f(x, y)
    const [k2x, k2y] = f(x + h/2*k1x, y + h/2*k1y)
    const [k3x, k3y] = f(x + h/2*k2x, y + h/2*k2y)
    const [k4x, k4y] = f(x + h*k3x, y + h*k3y)
    x += h/6*(k1x+2*k2x+2*k3x+k4x)
    y += h/6*(k1y+2*k2y+2*k3y+k4y)
    pts.push({ x, y })
  }
  return pts
}

function VectorFieldWidget() {
  const [presetIdx, setPresetIdx] = useState(0)
  const [stepSize, setStepSize] = useState(0.3)
  const [showRK4, setShowRK4] = useState(true)

  const { f, x0, y0, desc } = PRESETS[presetIdx]
  const W = 300, H = 280
  const domain = 2.8
  const px = v => W / 2 + (v / domain) * (W / 2 - 10)
  const py = v => H / 2 - (v / domain) * (H / 2 - 10)

  const N_steps = Math.min(60, Math.ceil(10 / stepSize))
  const ePts = eulerSteps(f, x0, y0, stepSize, N_steps)
  const rPts = rk4Steps(f, x0, y0, 0.05, 200)

  // Vector field grid
  const gridStep = 0.6
  const arrows = []
  for (let gx = -domain + gridStep/2; gx <= domain; gx += gridStep) {
    for (let gy = -domain + gridStep/2; gy <= domain; gy += gridStep) {
      const [vx, vy] = f(gx, gy)
      const mag = Math.sqrt(vx * vx + vy * vy)
      if (mag < 1e-6) continue
      const scale = 0.18 / (mag + 0.5)
      arrows.push({ gx, gy, ex: gx + vx * scale, ey: gy + vy * scale })
    }
  }

  const eLine = ePts.map(p => `${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ')
  const rLine = rPts.map(p => `${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ')

  return (
    <div className="widget">
      <p className="widget-caption">
        Arrows show the vector field <InlineMath>{'\\mathbf{f}(x,y)'}</InlineMath>. The red broken
        path is Euler; the green dashed curve is RK4. Increase the step size to see Euler drift.
      </p>
      <div className="widget-card">
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <svg width={W} height={H}
            style={{ background: '#f4f8fd', borderRadius: '8px', flexShrink: 0 }}>
            <line x1={10} y1={H/2} x2={W-10} y2={H/2} stroke="#8899bb" strokeWidth="0.7" />
            <line x1={W/2} y1={10} x2={W/2} y2={H-10} stroke="#8899bb" strokeWidth="0.7" />
            {arrows.map((a, i) => (
              <line key={i}
                x1={px(a.gx).toFixed(1)} y1={py(a.gy).toFixed(1)}
                x2={px(a.ex).toFixed(1)} y2={py(a.ey).toFixed(1)}
                stroke="#a0aec0" strokeWidth="1" strokeLinecap="round" />
            ))}
            {showRK4 && <polyline points={rLine} fill="none" stroke="#2f9e44"
              strokeWidth="1.5" strokeDasharray="5 2" strokeLinejoin="round" />}
            <polyline points={eLine} fill="none" stroke="#c92a2a"
              strokeWidth="2" strokeLinejoin="round" />
            {ePts.slice(0, 25).map((p, i) => (
              <circle key={i} cx={px(p.x).toFixed(1)} cy={py(p.y).toFixed(1)}
                r="2.5" fill="#c92a2a" opacity="0.7" />
            ))}
            <circle cx={px(x0).toFixed(1)} cy={py(y0).toFixed(1)} r="5" fill="#7950f2" />
          </svg>

          <div style={{ flex: 1, minWidth: '140px' }}>
            <div style={{ fontSize: '12px', color: '#5c6b85', marginBottom: '8px' }}>{desc}</div>
            <label className="slider-row">
              <span className="slider-label">Step h = <b>{stepSize.toFixed(2)}</b></span>
              <input type="range" min={0.05} max={0.8} step={0.05} value={stepSize}
                onChange={e => setStepSize(Number(e.target.value))} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '13px', marginTop: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showRK4}
                onChange={e => setShowRK4(e.target.checked)} />
              Show RK4 reference
            </label>
            <div className="hud-panel" style={{ marginTop: '10px' }}>
              <div className="hud-row"><span>Euler steps</span><strong>{N_steps}</strong></div>
              <div className="hud-row">
                <span>Euler end x</span>
                <strong>{ePts[ePts.length-1].x.toFixed(3)}</strong>
              </div>
              <div className="hud-row">
                <span>Euler end y</span>
                <strong>{ePts[ePts.length-1].y.toFixed(3)}</strong>
              </div>
            </div>
          </div>
        </div>
        <div className="preset-bar" style={{ marginTop: '10px' }}>
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

export default function L36() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#f5eef8', color: '#6c3483', borderColor: '#d2b4de' }}>
          Module 8 · Lecture 36 · ROB 201
        </div>
        <h1 className="lesson-title">ODE Modeling &amp; Numerical Integration</h1>
        <p className="lesson-subtitle">
          Ordinary differential equations model how physical systems evolve in time. Euler's method
          makes the mathematics concrete: step forward along the local slope, repeat. Fourth-order
          Runge-Kutta achieves dramatically higher accuracy for the same computational cost.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            An ODE says: the rate of change of the state equals some function of the current state.
            Given a starting point, the solution is a trajectory that follows the vector field
            <InlineMath>{'\\;\\mathbf{f}'}</InlineMath> at every point. But "follow the field" is
            continuous — we can only evaluate <InlineMath>{'f'}</InlineMath> at discrete times.
          </p>
          <p>
            Euler's method approximates: stand at <InlineMath>{'\\mathbf{x}_n'}</InlineMath>, look at
            the slope <InlineMath>{'\\mathbf{f}(\\mathbf{x}_n)'}</InlineMath>, step in that direction
            for time <InlineMath>{'h'}</InlineMath>. This introduces error because the slope changes
            during the step. Smaller <InlineMath>{'h'}</InlineMath> reduces error — but requires more
            steps to simulate the same total time.
          </p>
          <p>
            Runge-Kutta 4 evaluates <InlineMath>{'\\mathbf{f}'}</InlineMath> at four intermediate
            points during the step and takes a weighted average. The result matches the Taylor
            expansion of the true solution through fourth order, giving
            <InlineMath>{'\\;O(h^4)'}</InlineMath> local accuracy versus Euler's
            <InlineMath>{'\\;O(h)'}</InlineMath>.
          </p>
        </div>
      </section>

      {/* ── Formalism ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · IVP, EULER, &amp; RK4</span>
        </h2>
        <div className="content-block">
          <p>The standard initial value problem (IVP):</p>
          <DisplayMath>{String.raw`\dot{\mathbf{x}}(t) = \mathbf{f}(\mathbf{x}(t),\,t),\qquad \mathbf{x}(t_0) = \mathbf{x}_0.`}</DisplayMath>
          <p><strong>Euler method</strong> (first order):</p>
          <DisplayMath>{String.raw`\mathbf{x}_{n+1} = \mathbf{x}_n + h\,\mathbf{f}(\mathbf{x}_n,\,t_n).`}</DisplayMath>
          <p><strong>Runge-Kutta 4</strong> (fourth order):</p>
          <DisplayMath>{String.raw`\mathbf{k}_1 = h\mathbf{f}(\mathbf{x}_n),\quad
\mathbf{k}_2 = h\mathbf{f}\!\bigl(\mathbf{x}_n+\tfrac{\mathbf{k}_1}{2}\bigr),\quad
\mathbf{k}_3 = h\mathbf{f}\!\bigl(\mathbf{x}_n+\tfrac{\mathbf{k}_2}{2}\bigr),\quad
\mathbf{k}_4 = h\mathbf{f}(\mathbf{x}_n+\mathbf{k}_3),`}</DisplayMath>
          <DisplayMath>{String.raw`\mathbf{x}_{n+1} = \mathbf{x}_n + \tfrac{1}{6}(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4).`}</DisplayMath>
          <div className="callout callout-success">
            <strong>Global error.</strong> Euler: <InlineMath>{'O(h)'}</InlineMath> — halve
            <InlineMath>{'\\;h'}</InlineMath>, halve the error. RK4:
            <InlineMath>{'\\;O(h^4)'}</InlineMath> — halve <InlineMath>{'h'}</InlineMath>, reduce
            error 16×. For smooth systems, RK4 is almost always more efficient than Euler per unit
            of computation.
          </div>
        </div>
      </section>

      {/* ── Interactive ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · EULER VS. RK4 ON A PHASE PORTRAIT</span>
        </h2>
        <VectorFieldWidget />
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · DC MOTOR SPEED STEP</span>
        </h2>
        <div className="content-block">
          <p>
            DC motor: <InlineMath>{'J\\dot{\\omega} = \\tau - b\\omega'}</InlineMath>, with
            <InlineMath>{'\\;J=0.01,\\;b=0.1,\\;\\tau=1,\\;\\omega(0)=0'}</InlineMath>. Simplified:
            <InlineMath>{'\\dot{\\omega} = 100 - 10\\omega'}</InlineMath>.
          </p>
          <p>
            Euler with <InlineMath>{'h=0.01'}</InlineMath>:
            <InlineMath>{'\\omega(0.01) = 0 + 0.01\\times 100 = 1'}</InlineMath> rad/s.
            Exact: <InlineMath>{'10(1-e^{-0.1}) \\approx 0.952'}</InlineMath> rad/s — 5% error
            in one step. RK4 with the same <InlineMath>{'h'}</InlineMath> gives error below
            <InlineMath>{'\\;10^{-6}'}</InlineMath> rad/s.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            Lecture 37 treats linear ODEs analytically. If the dynamics are
            <InlineMath>{'\\dot{\\mathbf{x}} = A\\mathbf{x}'}</InlineMath>, the exact solution is
            the matrix exponential <InlineMath>{'e^{At}\\mathbf{x}_0'}</InlineMath>, whose
            eigenvalues determine stability — no step size required.
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
              <div className="app-icon">🦾</div>
              <h3>Rigid-Body Dynamics Simulation</h3>
              <p>
                Robot simulators (PyBullet, MuJoCo) integrate Newton-Euler equations at every time
                step. RK4 or Fehlberg 4/5 (adaptive step size) keeps simulations stable and accurate
                without requiring tiny fixed steps.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🛸</div>
              <h3>Quadrotor Trajectory Integration</h3>
              <p>
                Trajectory planners integrate the 12-state flight dynamics forward in time. Adaptive
                step-size control adjusts the integrator to cope with fast spins and slow hovering
                within a single flight without manual tuning.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">⚗️</div>
              <h3>Neural ODE</h3>
              <p>
                Neural ODEs parameterize the vector field as a neural network
                <InlineMath>{'f_{\\theta}(x,t)'}</InlineMath> and use an ODE solver as a
                differentiable layer. Backpropagating through the solver (via the adjoint method)
                trains the network to match continuous-time dynamics from data.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧪</div>
              <h3>Stiff Chemical Kinetics</h3>
              <p>
                Battery and combustion models have reactions spanning milliseconds to hours (stiff).
                Explicit methods need tiny steps; implicit BDF solvers take large steps by solving
                a linear system each step — far more efficient for stiff problems.
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
            question="What does 'order' mean for a numerical ODE method?"
            options={[
              'The number of function evaluations per step',
              'The degree of the ODE being solved',
              'The power of h in the global error: first-order means O(h) error',
              'The number of state variables',
            ]}
            correct={2}
            explanation="A method's order describes how global error scales with step size h. First-order Euler has O(h) error — halving h halves the total error. Fourth-order RK4 has O(h⁴) error — halving h reduces error by 16×."
          />
          <QuizQ
            num={2} type="Computation"
            question="One Euler step with h=0.1 on dx/dt = −x, x(0) = 1 gives x(0.1) = ?"
            options={[
              '0.9',
              '1.1',
              '0.905 (exact e^(−0.1))',
              '0.1',
            ]}
            correct={0}
            explanation="x(0.1) = x(0) + h·f(x(0)) = 1 + 0.1·(−1) = 0.9. Exact: e^(−0.1) ≈ 0.905. Euler error is 0.5% here."
          />
          <QuizQ
            num={3} type="Concept"
            question="RK4 uses 4 evaluations per step. How does it compare to Euler for a target accuracy?"
            options={[
              '4× more accurate since it costs 4× more',
              'Worse — extra evaluations accumulate rounding error',
              'O(h⁴) scaling makes it vastly more efficient: 100 RK4 steps can beat 10 million Euler steps',
              'Equally accurate per function evaluation',
            ]}
            correct={2}
            explanation="For accuracy ε, Euler needs ~1/ε steps, RK4 needs ~(1/ε)^(1/4) steps. For ε = 10^(−8): Euler needs 10^8 steps, RK4 needs 100 steps — a million× difference even accounting for 4× work per step."
          />
          <QuizQ
            num={4} type="Transfer"
            question="A robot simulation runs at 1 kHz (h = 1 ms). The fastest eigenvalue is λ = −100. Is Euler stable?"
            options={[
              'No — Euler is always unstable for robot systems',
              'Yes — 1 kHz is the industry standard',
              'Yes — Euler stability requires h·|λ| < 2; here 0.001·100 = 0.1 < 2',
              'Unknown without knowing the full Jacobian',
            ]}
            correct={2}
            explanation="Euler's stability condition is h·|λ| < 2. With λ = −100 and h = 0.001: h·|λ| = 0.1 < 2, so the method is stable. The margin is comfortable here, though for stiffer systems (|λ| = 10000) this would force h < 0.0002 — impractical."
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
              Write the Euler update rule. Apply it to
              <InlineMath>{'\\dot{x} = -2x'}</InlineMath>, <InlineMath>{'x(0)=5'}</InlineMath>,
              <InlineMath>{'h=0.1'}</InlineMath> for 3 steps.
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              Compare Euler and RK4 global error orders. If Euler at
              <InlineMath>{'h=0.1'}</InlineMath> has 5% error, what step size makes it 0.05%?
              What step size does RK4 need for the same?
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Trace RK4 for <InlineMath>{'\\dot{x} = -x'}</InlineMath>,
              <InlineMath>{'x(0)=1'}</InlineMath>, <InlineMath>{'h=0.1'}</InlineMath>.
              Write out <InlineMath>{'k_1,k_2,k_3,k_4'}</InlineMath> explicitly.
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              For the harmonic oscillator <InlineMath>{'\\dot{x}=y,\\;\\dot{y}=-x'}</InlineMath>,
              explain why Euler's trajectory spirals outward (energy grows) while the exact
              solution stays on a circle.
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Without notes: state Euler and RK4 update formulas. Define "stiff ODE" and explain why
              explicit integrators need small steps for stiff problems.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
