import { useState, useMemo } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  PID TUNING SIMULATOR
//  Plant: second-order 1/(s²+2s) (double integrator with damping)
//  Simulate closed-loop step response with PID gains.
// ════════════════════════════════════════════════════════════════════════════

function simulatePID(Kp, Ki, Kd, T = 10, dt = 0.01) {
  // Plant: ÿ + 2ẏ = u  (state: x1=y, x2=ẏ)
  // PID: u(t) = Kp·e + Ki·∫e + Kd·ė,  e(t) = 1 - y(t)
  const n = Math.ceil(T / dt)
  const pts = []
  let x1 = 0, x2 = 0       // plant state
  let eInt = 0, ePrev = 0
  const r = 1.0              // reference (unit step)

  for (let i = 0; i <= n; i++) {
    const t = i * dt
    pts.push({ t, y: Math.max(-1, Math.min(3, x1)) })

    const e = r - x1
    eInt += e * dt
    const eDot = (e - ePrev) / dt
    ePrev = e

    const u = Kp * e + Ki * eInt + Kd * eDot
    const uClamped = Math.max(-20, Math.min(20, u))

    // Euler: ẋ1 = x2, ẋ2 = u − 2·x2
    // Use small inner RK4 for accuracy
    const f = (s1, s2, uc) => [s2, uc - 2 * s2]
    const [k1a, k1b] = f(x1, x2, uClamped)
    const [k2a, k2b] = f(x1 + dt/2*k1a, x2 + dt/2*k1b, uClamped)
    const [k3a, k3b] = f(x1 + dt/2*k2a, x2 + dt/2*k2b, uClamped)
    const [k4a, k4b] = f(x1 + dt*k3a, x2 + dt*k3b, uClamped)
    x1 += dt/6*(k1a+2*k2a+2*k3a+k4a)
    x2 += dt/6*(k1b+2*k2b+2*k3b+k4b)
  }
  return pts
}

function PIDWidget() {
  const [Kp, setKp] = useState(3)
  const [Ki, setKi] = useState(1)
  const [Kd, setKd] = useState(1)

  const pts = useMemo(() => simulatePID(Kp, Ki, Kd), [Kp, Ki, Kd])

  const W = 360, H = 200
  const T = 10
  const margin = { left: 24, right: 8, top: 12, bottom: 18 }
  const iW = W - margin.left - margin.right
  const iH = H - margin.top - margin.bottom
  const yMin = -0.2, yMax = 2.2

  const px = t => margin.left + (t / T) * iW
  const py = y => margin.top + iH - ((Math.max(yMin, Math.min(yMax, y)) - yMin) / (yMax - yMin)) * iH

  const line = pts.map(p => `${px(p.t).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ')

  // Metrics
  const finalPts = pts.slice(-50)
  const steadyState = finalPts.reduce((s, p) => s + p.y, 0) / finalPts.length
  const ssErr = Math.abs(1 - steadyState)
  const maxY = Math.max(...pts.map(p => p.y))
  const overshoot = Math.max(0, (maxY - 1) * 100)
  const settle5 = pts.findIndex(p => p.t > 0.5 && Math.abs(p.y - 1) < 0.05)
  const settleTime = settle5 >= 0 ? pts[settle5].t : '>10'

  return (
    <div className="widget">
      <p className="widget-caption">
        Closed-loop step response for plant <InlineMath>{'G(s) = 1/(s^2+2s)'}</InlineMath> with
        PID controller <InlineMath>{'C(s) = K_P + K_I/s + K_D s'}</InlineMath>. Tune the three gains
        to minimize overshoot and settling time while eliminating steady-state error.
      </p>
      <div className="widget-card">
        <svg width={W} height={H} style={{ background: '#f4f8fd', borderRadius: '8px', display: 'block' }}>
          {/* Reference line y=1 */}
          <line x1={margin.left} y1={py(1)} x2={W-margin.right} y2={py(1)}
            stroke="#2f9e44" strokeWidth="1" strokeDasharray="5 3" />
          <text x={margin.left+4} y={py(1)-4} fontSize="9" fill="#2f9e44">r = 1</text>
          {/* y=0 */}
          <line x1={margin.left} y1={py(0)} x2={W-margin.right} y2={py(0)} stroke="#8899bb" strokeWidth="0.7" />
          <line x1={margin.left} y1={margin.top} x2={margin.left} y2={H-margin.bottom} stroke="#8899bb" strokeWidth="0.7" />
          {/* 5% band */}
          <rect x={margin.left} y={py(1.05)} width={iW} height={py(0.95)-py(1.05)}
            fill="rgba(47,158,68,0.08)" />
          {/* Response */}
          <polyline points={line} fill="none" stroke="#7950f2" strokeWidth="2" strokeLinejoin="round" />
          {[0,2,4,6,8,10].map(v => (
            <text key={v} x={px(v)} y={H-margin.bottom+12} fontSize="9" fill="#8899bb" textAnchor="middle">{v}</text>
          ))}
        </svg>

        <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label className="slider-row">
              <span className="slider-label">K_P = <b>{Kp.toFixed(1)}</b></span>
              <input type="range" min={0} max={10} step={0.2} value={Kp}
                onChange={e => setKp(Number(e.target.value))} />
            </label>
            <label className="slider-row">
              <span className="slider-label">K_I = <b>{Ki.toFixed(1)}</b></span>
              <input type="range" min={0} max={5} step={0.1} value={Ki}
                onChange={e => setKi(Number(e.target.value))} />
            </label>
            <label className="slider-row">
              <span className="slider-label">K_D = <b>{Kd.toFixed(1)}</b></span>
              <input type="range" min={0} max={5} step={0.1} value={Kd}
                onChange={e => setKd(Number(e.target.value))} />
            </label>
          </div>
          <div className="hud-panel" style={{ minWidth: '140px' }}>
            <div className="hud-row"><span>Overshoot</span>
              <strong style={{ color: overshoot > 20 ? '#c92a2a' : '#2f9e44' }}>
                {overshoot.toFixed(1)}%
              </strong>
            </div>
            <div className="hud-row"><span>Settle (5%)</span>
              <strong>{typeof settleTime === 'number' ? settleTime.toFixed(2) + ' s' : settleTime}</strong>
            </div>
            <div className="hud-row"><span>SS error</span>
              <strong style={{ color: ssErr < 0.02 ? '#2f9e44' : '#c92a2a' }}>
                {(ssErr * 100).toFixed(2)}%
              </strong>
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

export default function L40() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#f5eef8', color: '#6c3483', borderColor: '#d2b4de' }}>
          Module 8 · Lecture 40 · ROB 201
        </div>
        <h1 className="lesson-title">Feedback Control &amp; PID Design</h1>
        <p className="lesson-subtitle">
          Feedback loops close the gap between desired and actual behavior by using the error to
          generate a corrective action. The PID controller — proportional, integral, derivative —
          is the most widely used feedback law in engineering, governing everything from drone
          altitude to cruise control to industrial temperature regulation.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Without feedback, a robot joint commanded to move 90° will overshoot, oscillate, or
            drift due to friction and disturbances. Feedback measures the actual position, computes
            the error <InlineMath>{'e(t) = r(t) - y(t)'}</InlineMath> (reference minus output),
            and uses it to drive the actuator.
          </p>
          <p>
            The three PID terms each address a different aspect of error:
          </p>
          <div className="callout callout-info">
            <strong>Proportional (P).</strong> <InlineMath>{'K_P \\cdot e(t)'}</InlineMath> — acts
            now. Large error → large action. High <InlineMath>{'K_P'}</InlineMath> speeds up
            response but risks oscillation and overshoot.
          </div>
          <div className="callout callout-info">
            <strong>Integral (I).</strong> <InlineMath>{'K_I \\cdot \\int e\\,d\\tau'}</InlineMath>
            — acts on accumulated past error. Eliminates steady-state error, but too much
            <InlineMath>{'\\;K_I'}</InlineMath> causes "integrator windup" and oscillation.
          </div>
          <div className="callout callout-info">
            <strong>Derivative (D).</strong>{' '}
            <InlineMath>{'K_D \\cdot \\dot{e}(t)'}</InlineMath> — acts on the rate of change.
            Predicts where the error is going and applies braking. Damping increases with
            <InlineMath>{'\\;K_D'}</InlineMath>, but it amplifies sensor noise.
          </div>
        </div>
      </section>

      {/* ── Formalism ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · CLOSED-LOOP TRANSFER FUNCTION</span>
        </h2>
        <div className="content-block">
          <p>
            PID controller in the Laplace domain:
          </p>
          <DisplayMath>{String.raw`C(s) = K_P + \frac{K_I}{s} + K_D s = \frac{K_D s^2 + K_P s + K_I}{s}.`}</DisplayMath>
          <p>
            With plant <InlineMath>{'G(s)'}</InlineMath> in a unity-feedback loop, the closed-loop
            transfer function is:
          </p>
          <DisplayMath>{String.raw`T(s) = \frac{C(s)G(s)}{1 + C(s)G(s)}.`}</DisplayMath>
          <p>
            Stability of the closed loop is determined by the roots of
            <InlineMath>{'1 + C(s)G(s) = 0'}</InlineMath> (the characteristic equation). The
            integral term guarantees zero steady-state error for a step reference (from the
            Final Value Theorem): <InlineMath>{'\\lim_{t\\to\\infty}e(t) = \\lim_{s\\to 0}s\\cdot E(s) = 0'}</InlineMath>
            because <InlineMath>{'C(s)'}</InlineMath> has a pole at <InlineMath>{'s=0'}</InlineMath>.
          </p>
          <div className="callout callout-success">
            <strong>Ziegler-Nichols tuning.</strong> Increase <InlineMath>{'K_P'}</InlineMath>
            until the loop just sustains oscillation (ultimate gain <InlineMath>{'K_u'}</InlineMath>
            at ultimate period <InlineMath>{'T_u'}</InlineMath>). Then:
            <InlineMath>{'\\;K_P = 0.6K_u'}</InlineMath>,
            <InlineMath>{'\\;K_I = 2K_P/T_u'}</InlineMath>,
            <InlineMath>{'\\;K_D = K_P T_u/8'}</InlineMath>. This heuristic works well for many
            plants but may need refinement.
          </div>
        </div>
      </section>

      {/* ── Interactive ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · PID TUNING SIMULATOR</span>
        </h2>
        <PIDWidget />
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · P CONTROL ON A MOTOR</span>
        </h2>
        <div className="content-block">
          <p>
            Plant: <InlineMath>{'G(s) = 1/(s+1)'}</InlineMath>. P controller:
            <InlineMath>{'C(s) = K_P'}</InlineMath>. Closed-loop:
          </p>
          <DisplayMath>{String.raw`T(s) = \frac{K_P/(s+1)}{1+K_P/(s+1)} = \frac{K_P}{s+1+K_P}.`}</DisplayMath>
          <p>
            Steady-state (step): <InlineMath>{'T(0) = K_P/(1+K_P)'}</InlineMath>. Even with
            <InlineMath>{'K_P \\to \\infty'}</InlineMath>, the steady-state approaches 1 but never
            reaches it — there is always steady-state error with P-only control. Adding integral
            action (I term) shifts the pole: the denominator gets a
            <InlineMath>{'\\;K_I/s'}</InlineMath> term that forces <InlineMath>{'T(0) = 1'}</InlineMath>.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            Lecture 41 tackles nonlinear dynamics: what happens when the linearized model breaks
            down far from the operating point? Phase portraits of nonlinear systems reveal limit
            cycles, bifurcations, and the stability landscape of a Segway balancing controller.
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
              <div className="app-icon">🚁</div>
              <h3>Drone Altitude Control</h3>
              <p>
                A PID controller on altitude error drives rotor thrust. The integral term compensates
                for unknown wind gusts (persistent disturbances). The derivative term provides
                velocity damping to prevent bounce at the target altitude.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🏭</div>
              <h3>Industrial Temperature Control</h3>
              <p>
                PID is the industry standard for ovens, extruders, and reactors. Integrator windup
                — when the integral accumulates during saturation — is handled by anti-windup logic
                that freezes integration when the actuator is at its limit.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🚗</div>
              <h3>Cruise Control</h3>
              <p>
                Vehicle cruise control uses PID on speed error. Uphill grades create persistent
                errors that the integral term compensates by increasing throttle. The derivative
                term anticipates speed changes during gear shifts.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🦿</div>
              <h3>Robotic Joint Torque Control</h3>
              <p>
                High-performance robot joints often cascade a PD position controller inside a PI
                current (torque) controller. The inner loop runs at 10× the outer loop frequency —
                a common multi-rate control architecture.
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
            question="Why does the integral term in a PID controller eliminate steady-state error for a step reference?"
            options={[
              'It makes the loop gain infinite at all frequencies',
              'It adds a pole at s = 0, which forces e(∞) = 0 by the Final Value Theorem',
              'It cancels the plant pole',
              'It converts the error to its time-average',
            ]}
            correct={1}
            explanation="The integral term C_I(s) = K_I/s adds a pole at s=0 to the open-loop transfer function. By the Final Value Theorem, lim(t→∞)e(t) = lim(s→0) s·E(s). With a pole at s=0 in the loop, the closed-loop error E(s) for a step reference goes to zero — the integral action drives the error to zero asymptotically."
          />
          <QuizQ
            num={2} type="Concept"
            question="What role does the derivative term K_D·ė(t) play in PID control?"
            options={[
              'It increases steady-state gain',
              'It introduces additional integrators into the loop',
              'It adds damping — it slows down the rate of change of error, reducing overshoot',
              'It removes the need for the proportional term',
            ]}
            correct={2}
            explanation="The D term acts on the rate of error change. If the error is decreasing rapidly, ė < 0, so the D term produces a negative (braking) action. This damps the response and reduces overshoot, similar to adding damping to a spring-mass system. The tradeoff: it amplifies high-frequency measurement noise."
          />
          <QuizQ
            num={3} type="Transfer"
            question="Plant G(s) = 1/(s+1), P-only control C(s) = K_P = 5. What is the closed-loop DC gain (steady-state response to a unit step)?"
            options={[
              '1 (perfect tracking)',
              '5/6 ≈ 0.833 (steady-state error of 16.7%)',
              '5 (pure gain)',
              '6 (plant + controller gain)',
            ]}
            correct={1}
            explanation="T(s) = K_P·G(s)/(1+K_P·G(s)) = 5/(s+1) / (1 + 5/(s+1)) = 5/(s+6). DC gain: T(0) = 5/6 ≈ 0.833. The steady-state error is 1 − 5/6 = 1/6 ≈ 16.7%. Adding integral action would force this to zero."
          />
          <QuizQ
            num={4} type="Application"
            question="A PID controller exhibits 'integrator windup': the output saturates but the integral keeps accumulating. What is the consequence and how is it fixed?"
            options={[
              'The system becomes faster; fixed by increasing K_D',
              'Steady-state error disappears; no fix needed',
              'Large overshoot or slow recovery after saturation; fixed by anti-windup (freezing or clamping the integrator when saturated)',
              'The system oscillates permanently; fixed by setting K_I = 0',
            ]}
            correct={2}
            explanation="Integrator windup: while the actuator is saturated (at its limit), the integral keeps accumulating error, building up a large integral state. When the saturation releases, the large integral causes a long overshoot. Anti-windup schemes freeze integration during saturation or clamp the integral to a safe range."
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
              Write the PID control law in both time and Laplace domain. What does each term do?
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              Compute the closed-loop transfer function for plant
              <InlineMath>{'G(s) = 2/(s(s+3))'}</InlineMath> with P controller
              <InlineMath>{'C(s) = K_P'}</InlineMath>. Find <InlineMath>{'K_P'}</InlineMath>
              that places the closed-loop poles at <InlineMath>{'s = -2 \\pm 2i'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Explain why P-only control cannot achieve zero steady-state error for a step
              reference to a plant without an integrator. What is the Final Value Theorem argument?
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              With the simulator: find PID gains for the example plant that achieve less than 5%
              overshoot and settling time under 3 s. Record your gains and the key trade-off you
              made.
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Without notes: write the closed-loop transfer function formula. Explain integrator
              windup and one approach to prevent it.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
