import { useState, useMemo } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  NONLINEAR PHASE PORTRAIT WIDGET — Segway-style inverted pendulum
//  ẋ₁ = x₂  (angle rate)
//  ẋ₂ = sin(x₁) − k·x₂ − Kp·x₁ − Kd·x₂   (simplified)
// ════════════════════════════════════════════════════════════════════════════

function pendulumRHS(x1, x2, Kp, Kd) {
  // g/l = 1, simplified damping + PD control
  const u = -Kp * x1 - Kd * x2   // PD controller
  return [x2, Math.sin(x1) - 0.3 * x2 + u]
}

function simulatePendulum(x10, x20, Kp, Kd, T = 8, dt = 0.02) {
  const pts = [{ t: 0, x1: x10, x2: x20 }]
  let x1 = x10, x2 = x20
  for (let i = 0; i * dt < T; i++) {
    const [dx1, dx2] = pendulumRHS(x1, x2, Kp, Kd)
    // RK4
    const [k1a, k1b] = [dx1, dx2]
    const [k2a, k2b] = pendulumRHS(x1+dt/2*k1a, x2+dt/2*k1b, Kp, Kd)
    const [k3a, k3b] = pendulumRHS(x1+dt/2*k2a, x2+dt/2*k2b, Kp, Kd)
    const [k4a, k4b] = pendulumRHS(x1+dt*k3a, x2+dt*k3b, Kp, Kd)
    x1 += dt/6*(k1a+2*k2a+2*k3a+k4a)
    x2 += dt/6*(k1b+2*k2b+2*k3b+k4b)
    pts.push({ t: (i+1)*dt, x1, x2 })
    if (Math.abs(x1) > 4) break
  }
  return pts
}

function PhasePortraitWidget() {
  const [Kp, setKp] = useState(3)
  const [Kd, setKd] = useState(2)
  const [x0, setX0] = useState(0.8)

  // Phase portrait: several trajectories from different ICs
  const W = 240, H = 220
  const xRange = 3, yRange = 3
  const pxP = v => W/2 + (v / xRange) * (W/2 - 8)
  const pyP = v => H/2 - (v / yRange) * (H/2 - 8)

  const ics = [
    { x10: x0, x20: 0 },
    { x10: -x0, x20: 0 },
    { x10: 0, x20: x0 },
    { x10: x0 * 0.5, x20: x0 * 0.5 },
  ]
  const trajectories = useMemo(() =>
    ics.map(({ x10, x20 }) => simulatePendulum(x10, x20, Kp, Kd))
  , [Kp, Kd, x0]) // eslint-disable-line react-hooks/exhaustive-deps

  const COLORS = ['#c92a2a', '#1c7ed6', '#e8590c', '#2f9e44']

  // Time response of first trajectory
  const main = trajectories[0]
  const rW = 140, rH = 100
  const rT = 8
  const rpx = t => 8 + (t / rT) * (rW - 16)
  const rpy = v => rH/2 - (Math.max(-3, Math.min(3, v)) / 3) * (rH/2 - 8)
  const rLine = main.map(p => `${rpx(p.t).toFixed(1)},${rpy(p.x1).toFixed(1)}`).join(' ')

  const finalAngle = main[main.length - 1].x1
  const stable = Math.abs(finalAngle) < 0.1

  return (
    <div className="widget">
      <p className="widget-caption">
        Phase portrait of the nonlinear pendulum with PD feedback. Each colored curve is a
        trajectory from a different initial tilt angle. The right panel shows angle vs. time for
        the red trajectory.
      </p>
      <div className="widget-card">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Phase portrait */}
          <div>
            <div style={{ fontSize: '11px', color: '#5c6b85', marginBottom: '4px' }}>
              Phase portrait (θ, θ̇)
            </div>
            <svg width={W} height={H} style={{ background: '#f4f8fd', borderRadius: '8px' }}>
              <line x1={8} y1={H/2} x2={W-4} y2={H/2} stroke="#8899bb" strokeWidth="0.7" />
              <line x1={W/2} y1={4} x2={W/2} y2={H-4} stroke="#8899bb" strokeWidth="0.7" />
              {/* Separatrix hint — dashed line at |θ| = π ≈ 3.14 (outside domain) */}
              {trajectories.map((traj, i) => (
                <polyline key={i}
                  points={traj.map(p => `${pxP(p.x1).toFixed(1)},${pyP(p.x2).toFixed(1)}`).join(' ')}
                  fill="none" stroke={COLORS[i]} strokeWidth="1.8" strokeLinejoin="round" opacity="0.9" />
              ))}
              {/* Equilibrium */}
              <circle cx={pxP(0)} cy={pyP(0)} r="5" fill="#7950f2" stroke="white" strokeWidth="1.5" />
              <text x={pxP(0)+6} y={pyP(0)-4} fontSize="9" fill="#7950f2">eq.</text>
              <text x={W/2-8} y={H-4} fontSize="8" fill="#5c6b85">θ</text>
              <text x={4} y={12} fontSize="8" fill="#5c6b85">θ̇</text>
            </svg>
          </div>

          {/* Time response */}
          <div>
            <div style={{ fontSize: '11px', color: '#5c6b85', marginBottom: '4px' }}>θ(t) — red traj.</div>
            <svg width={rW} height={rH} style={{ background: '#f4f8fd', borderRadius: '8px' }}>
              <line x1={8} y1={rpy(0)} x2={rW-4} y2={rpy(0)} stroke="#8899bb" strokeWidth="0.7" />
              {rLine && <polyline points={rLine} fill="none" stroke="#c92a2a" strokeWidth="2" strokeLinejoin="round" />}
              <text x={rW/2} y={rH-2} fontSize="8" fill="#5c6b85" textAnchor="middle">t (s)</text>
              <text x={rW-4} y={rpy(0)+10} fontSize="8" fill="#2f9e44"
                style={{ fill: stable ? '#2f9e44' : '#c92a2a' }}>
                {stable ? '✓ stable' : '✗ falls'}
              </text>
            </svg>
            <div className="hud-panel" style={{ marginTop: '8px', fontSize: '12px' }}>
              <div className="hud-row"><span>Final θ</span>
                <strong style={{ color: stable ? '#2f9e44' : '#c92a2a' }}>
                  {finalAngle.toFixed(3)} rad
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
          <label className="slider-row">
            <span className="slider-label">K_P = <b>{Kp.toFixed(1)}</b></span>
            <input type="range" min={0} max={8} step={0.2} value={Kp}
              onChange={e => setKp(Number(e.target.value))} />
          </label>
          <label className="slider-row">
            <span className="slider-label">K_D = <b>{Kd.toFixed(1)}</b></span>
            <input type="range" min={0} max={5} step={0.1} value={Kd}
              onChange={e => setKd(Number(e.target.value))} />
          </label>
          <label className="slider-row">
            <span className="slider-label">Init tilt <b>{x0.toFixed(2)}</b> rad</span>
            <input type="range" min={0.1} max={2.5} step={0.05} value={x0}
              onChange={e => setX0(Number(e.target.value))} />
          </label>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L41() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#f5eef8', color: '#6c3483', borderColor: '#d2b4de' }}>
          Module 8 · Lecture 41 · ROB 201
        </div>
        <h1 className="lesson-title">Nonlinear Dynamics &amp; Segway Control</h1>
        <p className="lesson-subtitle">
          Real robots are nonlinear. The linearized model is only valid near an operating point;
          far from it, trajectories can spiral, jump, or fall. Phase portraits reveal the true
          structure of nonlinear dynamics — stable regions, separatrices, and the limits of
          linear feedback.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            A Segway balances an inverted pendulum. The linearized model (sin θ ≈ θ) works when
            the tilt angle is small. But if the rider leans too far — past the "catchment region"
            of the controller — the linear analysis is wrong: the robot tips over regardless of how
            good the feedback gains look on paper.
          </p>
          <p>
            The <em>phase portrait</em> is the nonlinear picture: a plot of the state-space
            trajectory <InlineMath>{'(\\theta, \\dot{\\theta})'}</InlineMath> for many initial
            conditions. The controller's <em>region of attraction</em> (basin of attraction) is
            the set of initial conditions from which it successfully drives the system to the
            equilibrium. Outside this region, the system diverges.
          </p>
          <p>
            Key features of nonlinear phase portraits: fixed points (equilibria), limit cycles
            (periodic orbits), and the separatrix (the boundary between converging and diverging
            behavior). The inverted pendulum has a saddle point at the downright equilibrium
            (<InlineMath>{'\\theta = \\pi'}</InlineMath>) whose stable manifold forms the separatrix.
          </p>
        </div>
      </section>

      {/* ── Formalism ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · LYAPUNOV STABILITY &amp; PHASE PORTRAITS</span>
        </h2>
        <div className="content-block">
          <p>
            Consider the nonlinear system <InlineMath>{'\\dot{\\mathbf{x}} = \\mathbf{f}(\\mathbf{x})'}</InlineMath>
            with equilibrium at <InlineMath>{'\\mathbf{x}^* = 0'}</InlineMath>. Jacobian
            linearization at <InlineMath>{'\\mathbf{x}^*'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`A = \frac{\partial \mathbf{f}}{\partial \mathbf{x}}\bigg|_{\mathbf{x}=0}.`}</DisplayMath>
          <p>
            The eigenvalues of <InlineMath>{'A'}</InlineMath> determine local stability. But local
            stability does not imply global stability. For global stability, we need a
            <em> Lyapunov function</em>:
          </p>
          <DisplayMath>{String.raw`V(\mathbf{x}) > 0 \text{ for } \mathbf{x}\neq 0,\quad
\dot{V}(\mathbf{x}) = \nabla V\cdot\mathbf{f}(\mathbf{x}) < 0 \text{ for } \mathbf{x}\neq 0.`}</DisplayMath>
          <p>
            If such a <InlineMath>{'V'}</InlineMath> exists (a "bowl-shaped energy function" that
            always decreases along trajectories), the system is globally asymptotically stable.
          </p>
          <p>
            <strong>Inverted pendulum dynamics:</strong>
          </p>
          <DisplayMath>{String.raw`\ddot{\theta} = \frac{g}{l}\sin\theta - \frac{b}{ml^2}\dot{\theta} + \frac{1}{ml^2}u.`}</DisplayMath>
          <p>
            PD control: <InlineMath>{'u = -K_P\\theta - K_D\\dot{\\theta}'}</InlineMath>. The
            linearized closed-loop eigenvalues are
            <InlineMath>{'\\lambda = \\frac{-(b/ml^2+K_D) \\pm \\sqrt{(b/ml^2+K_D)^2 - 4(K_P-g/l)/ml^2}}{2}'}</InlineMath>.
            For stability: <InlineMath>{'K_P > g/l'}</InlineMath> (enough proportional gain to
            overcome gravity).
          </p>
        </div>
      </section>

      {/* ── Interactive ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · NONLINEAR PHASE PORTRAIT &amp; SEGWAY PD</span>
        </h2>
        <PhasePortraitWidget />
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · REGION OF ATTRACTION</span>
        </h2>
        <div className="content-block">
          <p>
            For the simplified inverted pendulum <InlineMath>{'\\ddot{\\theta} = \\sin\\theta - 0.3\\dot{\\theta} + u'}</InlineMath>
            with PD control <InlineMath>{'u = -3\\theta - 2\\dot{\\theta}'}</InlineMath>,
            the linearized system at <InlineMath>{'\\theta = 0'}</InlineMath> has
            <InlineMath>{'A = \\begin{bmatrix}0 & 1\\\\ -2 & -2.3\\end{bmatrix}'}</InlineMath>,
            with eigenvalues <InlineMath>{'\\approx -1.07, -1.23'}</InlineMath> — stable.
          </p>
          <p>
            But the nonlinear term <InlineMath>{'\\sin\\theta'}</InlineMath> dominates beyond
            <InlineMath>{'\\theta \\approx \\pm 1.2'}</InlineMath> rad (~70°). Outside this region,
            the gravity term exceeds the control authority and the pendulum falls. The phase
            portrait widget shows this: start the simulation from a large initial tilt and watch
            the trajectory escape.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            Module 9 shifts focus to mathematical foundations: logic, proof techniques, and set
            theory. The tools of Lecture 42 — direct proof, contradiction, and induction — are the
            language in which all of the control and stability theory we have developed can be made
            rigorous.
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
              <div className="app-icon">🛴</div>
              <h3>Segway / Self-Balancing Vehicles</h3>
              <p>
                The Segway Personal Transporter uses a PD controller (plus inner gyro loops) to
                balance the inverted pendulum. The key design constraint: the controller must have
                sufficient gain to overcome gravity (<InlineMath>{'K_P > g/l'}</InlineMath>) while
                remaining within the actuator's torque limits.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🦿</div>
              <h3>Bipedal Walking Stability</h3>
              <p>
                Walking robots operate near the boundary of their stability region at every step.
                The center of mass trajectory must stay within the support polygon; Lyapunov
                analysis and hybrid dynamics (swing + stance) characterize the region of safe
                walking speeds.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🌀</div>
              <h3>Limit Cycles in Passive Walking</h3>
              <p>
                Passive dynamic walkers (no actuators, only gravity) exhibit limit cycles: periodic
                orbits in the nonlinear phase portrait. These stable limit cycles are the basis for
                energy-efficient walking gaits — energy is added only to counteract friction.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧪</div>
              <h3>Neural Network Stability Analysis</h3>
              <p>
                Deep networks with recurrent connections can exhibit nonlinear dynamics. Lyapunov
                analysis and contraction theory provide certificates that a recurrent network's
                hidden state will converge regardless of the input sequence — a stability guarantee
                analogous to the inverted pendulum's region of attraction.
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
            question="What is the 'region of attraction' (basin of attraction) of an equilibrium?"
            options={[
              'The set of states where the linearized system is stable',
              'The set of initial conditions from which trajectories converge to the equilibrium under the given control law',
              'The neighborhood where sin(θ) ≈ θ holds',
              'The set of control gains that stabilize the system',
            ]}
            correct={1}
            explanation="The region of attraction (or basin of attraction) is the set of initial conditions x₀ from which the trajectory x(t;x₀) converges to the equilibrium as t → ∞. For linear systems it equals the entire state space (if stable). For nonlinear systems it can be a bounded region — the Segway controller catches the rider only if they start within this basin."
          />
          <QuizQ
            num={2} type="Concept"
            question="A Lyapunov function V(x) proves stability if V > 0 and V̇ < 0. What does V̇ < 0 mean physically?"
            options={[
              'The function V decreases along every trajectory — like energy dissipating',
              'The system velocity is negative',
              'The equilibrium is at a local maximum of V',
              'The trajectory is bounded but not necessarily convergent',
            ]}
            correct={0}
            explanation="V̇ = ∇V·f(x) < 0 means V is strictly decreasing along every trajectory of the system. If V is like an 'energy' and it always decreases, the system must eventually settle at the minimum of V — the equilibrium. This is the mathematical formalization of 'the robot always loses energy and stops at the bottom of the bowl.'"
          />
          <QuizQ
            num={3} type="Transfer"
            question="An inverted pendulum needs K_P > g/l to be locally stable. With g = 9.8 and l = 0.5 m, what minimum K_P is required?"
            options={[
              'K_P > 4.9',
              'K_P > 9.8',
              'K_P > 19.6',
              'K_P > 0.5',
            ]}
            correct={2}
            explanation="The stability condition from linearization is K_P > g/l = 9.8/0.5 = 19.6. With K_P < 19.6, the proportional gain cannot overcome gravity and the pendulum falls even for small perturbations. This is the minimum required; in practice, more gain is needed for adequate damping."
          />
          <QuizQ
            num={4} type="Concept"
            question="Why does local stability (from linearization) not imply global stability?"
            options={[
              'Linearization is always wrong',
              'Eigenvalues change with operating point for linear systems',
              'The linearized model is only accurate near the operating point; nonlinear terms can destabilize trajectories far from the equilibrium',
              'Global stability requires K_P to be very large',
            ]}
            correct={2}
            explanation="Linearization approximates f(x) ≈ Ax near x* = 0; the error is O(‖x‖²). For small ‖x‖ the linear approximation dominates and eigenvalue analysis is valid. For large ‖x‖, nonlinear terms like sin(θ)−θ become significant and can overwhelm the controller, causing divergence even when the linearized system is stable."
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
              State the Lyapunov stability conditions. Give an example of a Lyapunov function for
              the damped harmonic oscillator <InlineMath>{'\\ddot{x} + 2\\dot{x} + x = 0'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              For the inverted pendulum with PD control, compute the linearized eigenvalues at
              <InlineMath>{'\\theta=0'}</InlineMath> with <InlineMath>{'K_P=25, K_D=3'}</InlineMath>,
              <InlineMath>{'g/l=10'}</InlineMath>. Interpret them.
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Explain why a limit cycle is different from an equilibrium. Give a physical example
              of each in a robotics context.
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              Use the widget to map the approximate boundary of the region of attraction for the
              Segway controller at <InlineMath>{'K_P=3, K_D=2'}</InlineMath>. What initial tilt
              angle causes the simulation to fail?
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Without notes: define phase portrait, equilibrium, separatrix, and region of
              attraction. Explain how they are related to Lyapunov stability.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
