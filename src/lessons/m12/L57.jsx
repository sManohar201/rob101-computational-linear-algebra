import { useState, useMemo, useEffect, useRef } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'

const TAG = { background: '#eafaf1', color: '#196f3d', borderColor: '#a9dfbf' }
const W = 380, H = 320, DT = 0.02, N_STEPS = 400

function simSegway(kp, kd, dist, tilt0 = 0) {
  let theta = tilt0, omega = 0
  const traj = [{ t: 0, theta, omega }]
  const g = 9.81, L = 0.5
  for (let i = 0; i < N_STEPS; i++) {
    const t = (i + 1) * DT
    const u = -(kp * theta + kd * omega)
    const alpha = (g / L) * Math.sin(theta) - u / L + (i === 0 ? dist : 0)
    omega += alpha * DT
    theta += omega * DT
    if (Math.abs(theta) > 1.4) { traj.push({ t, theta: Math.sign(theta) * 1.4, omega: 0, fell: true }); break }
    traj.push({ t, theta, omega })
  }
  return traj
}

function SegwayWidget() {
  const [kp, setKp] = useState(25)
  const [kd, setKd] = useState(8)
  const [dist, setDist] = useState(0.3)
  const [tilt0, setTilt0] = useState(0.1)

  const traj = useMemo(() => simSegway(kp, kd, dist, tilt0), [kp, kd, dist, tilt0])
  const fell = traj[traj.length - 1]?.fell === true

  const tMax = traj[traj.length - 1].t
  const toX = t => 40 + (t / tMax) * (W - 60)
  const toY = (v, span = 1.4) => H / 2 - (v / span) * (H / 2 - 30)

  const thetaPath = traj.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.t)},${toY(p.theta)}`).join(' ')
  const omegaPath = traj.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.t)},${toY(p.omega, 3)}`).join(' ')

  const finalTheta = traj[traj.length - 1].theta
  const stable = !fell && Math.abs(finalTheta) < 0.05

  const pendAngle = traj[Math.min(traj.length - 1, 30)].theta
  const cx = 190, cy = H - 50
  const pLen = 90
  const px = cx + pLen * Math.sin(pendAngle)
  const py = cy - pLen * Math.cos(pendAngle)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
        <svg width={120} height={160} style={{ background: '#f0fdf4', borderRadius: 8, border: '1px solid #a9dfbf' }}>
          <line x1={20} y1={cy - H + 50} x2={360} y2={cy - H + 50} stroke="#ddd" />
          <line x1={cx} y1={10} x2={cx} y2={140} stroke="#ccc" strokeWidth={1} strokeDasharray="3,3" />
          <circle cx={cx} cy={cy - H + 50} r={14} fill="#444" />
          <line x1={cx} y1={cy - H + 50} x2={px - 70} y2={py - H + 50}
            stroke="#196f3d" strokeWidth={5} strokeLinecap="round" />
          <rect x={px - 78} y={py - H + 38} width={16} height={16} rx={3}
            fill={fell ? '#c0392b' : '#27ae60'} />
          <text x={8} y={148} fontSize={9} fill={fell ? '#c0392b' : '#196f3d'}>
            {fell ? 'FELL ✗' : stable ? 'STABLE ✓' : 'oscillating'}
          </text>
        </svg>
        <svg width={W - 140} height={H - 50} style={{ background: '#f0fdf4', borderRadius: 8, border: '1px solid #a9dfbf' }}>
          <line x1={40} y1={(H-50)/2} x2={W-130} y2={(H-50)/2} stroke="#ddd" />
          <path d={thetaPath.replace(/H\/2/g, String((H-50)/2))} fill="none" stroke="#196f3d" strokeWidth={2}
            transform={`translate(0,${-(H - (H-50))/2 + 0})`} />
          <text x={46} y={18} fontSize={10} fill="#196f3d">— θ (tilt)</text>
          <text x={46} y={30} fontSize={10} fill="#2471a3">— ω (angular vel)</text>
          {fell && <text x={46} y={44} fontSize={10} fill="#c0392b">fell at t = {fmt(traj[traj.length-1].t)}s</text>}
        </svg>
      </div>
      <svg width={W} height={120} style={{ background: '#f0fdf4', borderRadius: 8, border: '1px solid #a9dfbf' }}>
        <line x1={40} y1={60} x2={W-10} y2={60} stroke="#ccc" />
        <path d={thetaPath} fill="none" stroke="#196f3d" strokeWidth={2.5}
          transform={`scale(1,${120/H}) translate(0,${(H-120)/2})`} />
        <line x1={40} y1={60} x2={W-10} y2={60} stroke="#ccc" strokeDasharray="3,3" />
        <text x={46} y={16} fontSize={10} fill="#196f3d">Tilt angle θ(t) — full timeline</text>
        <text x={W-120} y={16} fontSize={10} fill={stable ? '#196f3d' : '#c0392b'}>
          {stable ? '✓ converges to 0' : fell ? '✗ fell over' : '~ oscillating'}
        </text>
      </svg>
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SliderRow label="Kp (proportional gain)" min={0} max={60} step={1} value={kp} onChange={setKp} />
        <SliderRow label="Kd (derivative gain)" min={0} max={20} step={0.5} value={kd} onChange={setKd} />
        <SliderRow label="Initial tilt θ₀ (rad)" min={0} max={0.5} step={0.02} value={tilt0} onChange={setTilt0} />
        <SliderRow label="Impulse disturbance" min={-2} max={2} step={0.1} value={dist} onChange={setDist} />
      </div>
      <div style={{ fontSize: 12, color: '#196f3d', background: '#eafaf1', padding: '6px 16px', borderRadius: 6, border: '1px solid #a9dfbf' }}>
        Kp={fmt(kp)}, Kd={fmt(kd)} &nbsp;|&nbsp; Final θ = {fmt(finalTheta)} rad
        &nbsp;|&nbsp; {stable ? 'STABLE' : fell ? 'FELL' : 'oscillating'}
      </div>
    </div>
  )
}

export default function L57() {
  return (
    <div className="lesson">
      <div className="lesson-section">
        <span className="section-tag intuition-tag" style={TAG}>Intuition</span>
        <h2>Grand Engineering Capstones</h2>
        <div className="content-block">
          <p>
            We have built the complete mathematical toolkit: linear algebra, calculus, ODEs,
            control theory, topology, probability, estimation, and optimization. This lecture
            assembles it all into two capstone systems that showcase how these tools interlock
            in real engineering.
          </p>
          <p>
            The <strong>Segway / inverted pendulum</strong> is the canonical unstable system.
            It falls if uncontrolled — the open-loop pole is at <InlineMath math="+\sqrt{g/L}" />
            (right-half plane). A PD controller closes the loop, moving the poles left. But how
            do we choose gains? LQR solves a QP to find the optimal <InlineMath math="K" /> that
            minimizes energy-weighted state error. The Kalman filter estimates the tilt from noisy
            gyroscopes. Both are solved by the linear algebra and optimization developed throughout
            this course.
          </p>
          <p>
            This is the separation principle: design <InlineMath math="K" /> (LQR, a QP) and
            <InlineMath math="L" /> (Kalman, a Riccati equation) independently; the combined
            observer-based controller is stable with poles from both designs.
          </p>
        </div>
      </div>

      <div className="lesson-section widget-section">
        <span className="section-tag widget-tag" style={TAG}>Widget — Segway PD Stabilizer</span>
        <div className="content-block">
          <p>
            Simulate the inverted pendulum <InlineMath math="\ddot{\theta} = (g/L)\sin\theta - u/L" />
            with PD control <InlineMath math="u = -(K_p\theta + K_d\dot{\theta})" />.
            Tune gains until the tilt converges to 0. Too little Kp: falls. Too little Kd: oscillates.
          </p>
          <SegwayWidget />
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag formalism-tag" style={TAG}>Formalism</span>
        <div className="content-block">
          <h3>Inverted Pendulum Linearization</h3>
          <p>Around <InlineMath math="\theta = 0" />, <InlineMath math="\sin\theta \approx \theta" />:</p>
          <DisplayMath math="\ddot{\theta} = \frac{g}{L}\theta + \frac{1}{L}u, \quad \mathbf{x} = \begin{bmatrix}\theta\\\dot{\theta}\end{bmatrix}, \quad A = \begin{bmatrix}0&1\\g/L&0\end{bmatrix}, \quad B = \begin{bmatrix}0\\-1/L\end{bmatrix}" />
          <p>Open-loop eigenvalues: <InlineMath math="\pm\sqrt{g/L} \approx \pm 4.4" /> rad/s — one unstable pole.</p>
          <h3>LQR State Feedback</h3>
          <p>Choose <InlineMath math="u = -K\mathbf{x}" /> to minimize:</p>
          <DisplayMath math="J = \int_0^\infty \bigl(\mathbf{x}^\top Q \mathbf{x} + u^\top R u\bigr)\,dt" />
          <p>Optimal gain from Algebraic Riccati Equation (ARE): <InlineMath math="A^\top P + PA - PBR^{-1}B^\top P + Q = 0" />, then <InlineMath math="K = R^{-1}B^\top P" />.</p>
          <h3>Observer + Controller: Separation Principle</h3>
          <p>With noisy measurements <InlineMath math="\mathbf{y} = C\mathbf{x} + v" />:</p>
          <DisplayMath math="\dot{\hat{\mathbf{x}}} = A\hat{\mathbf{x}} + B\mathbf{u} + L(\mathbf{y} - C\hat{\mathbf{x}}), \qquad \mathbf{u} = -K\hat{\mathbf{x}}" />
          <p>
            Closed-loop poles = <InlineMath math="\text{eig}(A-BK) \cup \text{eig}(A-LC)" />.
            Design <InlineMath math="K" /> and <InlineMath math="L" /> independently — the separation principle.
          </p>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag example-tag" style={TAG}>Worked Example</span>
        <div className="content-block">
          <p>
            Pendulum: <InlineMath math="g=9.81, L=0.5" m />.
            Linearized: <InlineMath math="A = [[0,1],[19.6,0]]" />, open-loop poles <InlineMath math="\pm 4.43" /> rad/s.
          </p>
          <p>With PD control <InlineMath math="u = -(K_p\theta + K_d\dot\theta)" />, closed-loop:</p>
          <DisplayMath math="A_{cl} = \begin{bmatrix}0&1\\19.6 - K_p/0.5 & -K_d/0.5\end{bmatrix}" />
          <p>Choose poles at <InlineMath math="\lambda = -5 \pm 3j" /> (stable, fast):</p>
          <DisplayMath math="K_p = 0.5(19.6 + 25 + 9) = 26.8, \qquad K_d = 0.5 \cdot 10 = 5.0" />
          <p>
            With Kp ≈ 27, Kd ≈ 5, the pendulum recovers from a 0.1 rad tilt in under 2 seconds.
            Try these values in the widget above!
          </p>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag apps-tag" style={TAG}>Robotics Applications</span>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🛴</div>
              <h3>Segway / Self-Balancing Scooter</h3>
              <p>The Segway runs an LQR controller at 100 Hz, fusing gyroscope and accelerometer data via a Kalman filter (the same equations from L53) to estimate tilt, then applying torque to balance a rider.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🤸</div>
              <h3>BallBot Navigation</h3>
              <p>A robot balanced on a single ball has 3 underactuated degrees of freedom. LQR gains are computed by solving the Algebraic Riccati Equation (a matrix QP), with the observer gain from the dual Riccati (Kalman).</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🚀</div>
              <h3>Rocket Vertical Landing</h3>
              <p>SpaceX's Falcon 9 landing is an inverted pendulum on a thrust vector. LQR + EKF (nonlinear Kalman) control attitude during the flip-and-burn maneuver — the same theory, atmospheric scale.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag quiz-tag" style={TAG}>Quiz</span>
        <div className="content-block">
          <QuizQ num={1} type="mc"
            question="The separation principle in output-feedback control states:"
            options={["K and L can be designed independently; closed-loop poles are eig(A−BK) ∪ eig(A−LC)","K and L must satisfy the same Riccati equation","The controller must be faster than the observer","Only diagonal gain matrices are stable"]}
            correct={0}
            explanation="For LTI systems, the closed-loop spectrum decomposes: K (control poles) and L (observer poles) can be placed independently. The combined system is stable if both designs are stable." />
          <QuizQ num={2} type="mc"
            question="The LQR gain K is found by solving:"
            options={["The Algebraic Riccati Equation (ARE) A^TP+PA−PBR⁻¹B^TP+Q=0","A linear system Kx=b","The Lyapunov equation PA+A^TP=−Q","An LP"]}
            correct={0}
            explanation="LQR reduces to finding the PSD solution P of the ARE, then K = R⁻¹B^TP. P is unique when (A,B) is stabilizable and (A,√Q) is detectable." />
          <QuizQ num={3} type="mc"
            question="Increasing Kd (derivative gain) in PD control of an inverted pendulum:"
            options={["Adds damping, reducing oscillation","Increases natural frequency","Has no effect on stability","Always causes instability"]}
            correct={0}
            explanation="The Kd term feeds back angular velocity, adding a damping term −(Kd/L)ω to the closed-loop dynamics. This reduces overshoot and oscillation." />
          <QuizQ num={4} type="mc"
            question="The open-loop inverted pendulum has a pole at +√(g/L). This means:"
            options={["It is unstable — perturbations grow exponentially","It is marginally stable","It is stable but slow","It oscillates without damping"]}
            correct={0}
            explanation="A positive real pole means e^{+√(g/L)t} growth — the pendulum falls exponentially fast without control. The controller must move this pole to the left-half plane." />
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag review-tag" style={TAG}>Spaced Repetition</span>
        <div className="content-block">
          <p><strong>Day 0</strong> — LQR: minimize <InlineMath math="\int(x^\top Qx + u^\top Ru)dt" />; solve ARE for P, then <InlineMath math="K = R^{-1}B^\top P" />.</p>
          <p><strong>Day 1</strong> — Kalman gain L dual to LQR K: swap <InlineMath math="A \leftrightarrow A^\top, B \leftrightarrow C^\top, Q \leftrightarrow Q_w, R \leftrightarrow R_v" /> in the ARE.</p>
          <p><strong>Day 3</strong> — Separation principle: closed-loop poles = <InlineMath math="\text{eig}(A-BK) \cup \text{eig}(A-LC)" /> — design independently.</p>
          <p><strong>Day 7</strong> — Inverted pendulum linearizes to <InlineMath math="A = [[0,1],[g/L,0]]" />; unstable pole at <InlineMath math="+\sqrt{g/L}" />; PD control moves it left.</p>
          <p><strong>Day 14</strong> — Observer-based control: <InlineMath math="u = -K\hat{x}" />, <InlineMath math="\dot{\hat{x}} = (A-LC)\hat{x} + By + Ly" /> — the complete closed-loop robot.</p>
        </div>
      </div>
    </div>
  )
}
