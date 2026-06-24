import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { useOrbitScene } from '../shared/useOrbitScene.js'
import { useAnimatedParams } from '../shared/useAnimatedParams.js'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'
import {
  COL, tube, sphere, axisArrow, gridXY, label, disposeObject,
} from '../shared/three-helpers.js'

const f2 = n => { const r = Math.round(n * 100) / 100; return (Object.is(r, -0) ? 0 : r).toFixed(2) }
const f3 = n => { const r = Math.round(n * 1000) / 1000; return (Object.is(r, -0) ? 0 : r).toFixed(3) }

// ─── 2-link arm kinematics (shared with L18) ─────────────────────────────────
const L1 = 2.2, L2 = 1.8
const fk = (t1, t2) => [L1 * Math.cos(t1) + L2 * Math.cos(t1 + t2), L1 * Math.sin(t1) + L2 * Math.sin(t1 + t2)]
function jac(t1, t2) {
  const s1 = Math.sin(t1), c1 = Math.cos(t1), s12 = Math.sin(t1 + t2), c12 = Math.cos(t1 + t2)
  return [[-L1 * s1 - L2 * s12, -L2 * s12], [L1 * c1 + L2 * c12, L2 * c12]]
}
const solve2 = (M, r) => {
  const det = M[0][0] * M[1][1] - M[0][1] * M[1][0]
  if (Math.abs(det) < 1e-9) return [0, 0]
  return [(r[0] * M[1][1] - r[1] * M[0][1]) / det, (r[1] * M[0][0] - r[0] * M[1][0]) / det]
}

// Run Newton-Raphson IK from θ₀ toward `target`; return per-iteration thetas+residuals.
function ikIterations(theta0, target, eps = 1) {
  const hist = [{ theta: [...theta0], res: Math.hypot(...fk(...theta0).map((v, i) => v - target[i])) }]
  let th = [...theta0]
  for (let k = 0; k < 8; k++) {
    const pos = fk(...th)
    const err = [pos[0] - target[0], pos[1] - target[1]]      // f(θ) = pos − target
    const J = jac(...th)
    const d = solve2(J, [-err[0], -err[1]])                   // J Δθ = −f
    th = [th[0] + eps * d[0], th[1] + eps * d[1]]
    const res = Math.hypot(...fk(...th).map((v, i) => v - target[i]))
    hist.push({ theta: [...th], res })
    if (res < 1e-9) break
  }
  return hist
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — Newton-Raphson inverse kinematics
//  Pick a target; the arm starts in some pose and the algorithm solves
//  J Δθ = −(f(θ) − target) each step, walking the hand onto the goal.
// ════════════════════════════════════════════════════════════════════════════

const IK_PRESETS = [
  { label: 'Near target (fast)', tx: 2.6, ty: 1.6 },
  { label: 'Far reach', tx: -1.5, ty: 2.8 },
  { label: 'Down-left', tx: -2.2, ty: -1.4 },
  { label: 'Edge of workspace', tx: 3.6, ty: 0.6 },
]
const THETA0 = [(50 * Math.PI) / 180, (50 * Math.PI) / 180]

function IKWidget() {
  const [idx, setIdx] = useState(0)
  const [step, setStep] = useState(0)
  const dyn = useRef([])
  const P = IK_PRESETS[idx]
  const target = [P.tx, P.ty]
  const hist = ikIterations(THETA0, target)
  const k = Math.min(step, hist.length - 1)
  const th = hist[k].theta
  const elbow = [L1 * Math.cos(th[0]), L1 * Math.sin(th[0])]
  const ee = fk(...th)

  const { containerRef, ctxRef } = useOrbitScene(
    scene => {
      scene.add(gridXY(5, 1))
      scene.add(axisArrow([1, 0, 0], 5, COL.x))
      scene.add(axisArrow([0, 1, 0], 5, COL.y))
      scene.add(label('x', new THREE.Vector3(5.3, -0.35, 0), '#c92a2a'))
      scene.add(label('y', new THREE.Vector3(-0.4, 5.3, 0), '#2b8a3e'))
      scene.add(sphere(new THREE.Vector3(0, 0, 0), COL.guide, 0.12))
    },
    { target: [0, 0, 0], camStart: { theta: 0, phi: Math.PI / 2, r: 15 }, zoom: [9, 24], lockPolar: [1.3, 1.84] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }
    // faint trail of every earlier hand position
    for (let i = 0; i <= k; i++) {
      const p = fk(...hist[i].theta)
      add(sphere(new THREE.Vector3(p[0], p[1], 0), COL.guide, 0.06))
    }
    // target
    add(sphere(new THREE.Vector3(target[0], target[1], 0), COL.line3, 0.17))
    add(label('target', new THREE.Vector3(target[0] + 0.3, target[1] + 0.3, 0), '#c2255c', 0.42))
    // current arm
    const O = new THREE.Vector3(0, 0, 0)
    const E = new THREE.Vector3(elbow[0], elbow[1], 0)
    const H = new THREE.Vector3(ee[0], ee[1], 0)
    add(tube(O, E, COL.line2, 0.07))
    add(tube(E, H, COL.line1, 0.07))
    add(sphere(E, COL.vertex, 0.13))
    add(sphere(H, COL.point, 0.16))
  }, [idx, step]) // eslint-disable-line react-hooks/exhaustive-deps

  const res = hist[k].res
  const reached = res < 1e-6
  return (
    <div className="widget">
      <p className="widget-caption">
        <strong>Inverse kinematics:</strong> given a hand target, find the joint angles. There is no formula — but
        Newton-Raphson turns it into repeated linear solves. At each pose we solve
        <InlineMath>{'\\;J\\,\\Delta\\theta = -(f(\\theta)-\\text{target})'}</InlineMath> for the joint step that the
        Jacobian predicts will erase the error, then take it. Step through and watch the hand home in on the rose target.
      </p>
      <p className="widget-instructions">drag to orbit · choose a target · advance the iteration and watch the residual collapse</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq">iteration k = {k}</div>
              <div className="hud-eq">θ = ({f2((th[0] * 180) / Math.PI)}°, {f2((th[1] * 180) / Math.PI)}°)</div>
              <div className="hud-note">hand = ({f2(ee[0])}, {f2(ee[1])}) · target = ({P.tx}, {P.ty})</div>
              <div className="hud-note" style={{ color: reached ? '#69db7c' : undefined }}>‖f(θ)‖ = {res.toExponential(2)}</div>
            </div>
            <div className={`hud-badge ${reached ? 'badge-unique' : 'badge-infinite'}`}>
              {reached ? '✓ reached target' : 'J Δθ = −f(θ), then θ ← θ + Δθ'}
            </div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {IK_PRESETS.map((p, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`}
              onClick={() => { setIdx(i); setStep(0) }}>{p.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <div className="controls-label">Iteration step (start pose θ₀ = 50°, 50°)</div>
            <div className="preset-bar" style={{ marginTop: 0 }}>
              <button className="preset-btn" disabled={step === 0} onClick={() => setStep(s => Math.max(0, s - 1))}>‹ back</button>
              {[0, 1, 2, 3, 4, 5].map(s => (
                <button key={s} className={`preset-btn ${step === s ? 'active' : ''}`} onClick={() => setStep(s)}>{s}</button>
              ))}
              <button className="preset-btn" disabled={step >= 5} onClick={() => setStep(s => Math.min(5, s + 1))}>next ›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — Quadratic convergence ledger (DOM)
//  The residual ‖f(θₖ)‖ roughly squares each step near the solution.
// ════════════════════════════════════════════════════════════════════════════

function ConvWidget() {
  const target = [2.6, 1.6]
  const hist = ikIterations(THETA0, target)
  return (
    <div className="widget">
      <p className="widget-caption">
        Newton-Raphson inherits Newton's <strong>quadratic convergence</strong>: near the solution the residual
        <InlineMath>{'\\;\\lVert f(\\theta_k)\\rVert'}</InlineMath> roughly <em>squares</em> each step, so the number of
        correct digits doubles. A handful of iterations is usually enough for real-time inverse kinematics.
      </p>
      <div className="widget-card">
        <div style={{ padding: '16px 20px', background: '#0f1729', borderRadius: 10, color: '#dbe4f3', fontFamily: 'monospace', fontSize: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '3px 18px' }}>
            <span style={{ color: '#9aa7bd' }}>k</span>
            <span style={{ color: '#9aa7bd' }}>θ (deg)</span>
            <span style={{ color: '#9aa7bd' }}>residual ‖f(θₖ)‖</span>
            {hist.map((h, i) => [
              <span key={`k${i}`}>{i}</span>,
              <span key={`t${i}`} style={{ color: '#ffb066' }}>({f2((h.theta[0] * 180) / Math.PI)}, {f2((h.theta[1] * 180) / Math.PI)})</span>,
              <span key={`r${i}`} style={{ color: h.res < 1e-6 ? '#69db7c' : undefined }}>{h.res.toExponential(2)}</span>,
            ])}
          </div>
          <div style={{ marginTop: 10, color: '#9aa7bd', fontSize: 11.5 }}>
            Each residual ≈ the square of the previous one — the signature of Newton-type methods.
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L19() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#eafaf0', color: '#0f9d58', borderColor: '#bce8cf' }}>
          Module 3 · Lecture 19 · Grizzle Ch. 11 §11.6
        </div>
        <h1 className="lesson-title">Newton-Raphson for Vector Functions</h1>
        <p className="lesson-subtitle">
          Scalar Newton, scaled up. To solve <InlineMath>{'f(x) = 0'}</InlineMath> for
          <InlineMath>{'\\;f:\\mathbb{R}^n\\to\\mathbb{R}^n'}</InlineMath>, replace "divide by the slope" with "solve a
          linear system with the Jacobian." That single idea solves <strong>inverse kinematics</strong> — find the joint
          angles that put the hand where you want it.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Forward kinematics is easy: angles in, position out. The <em>inverse</em> — position in, angles out — has no
            tidy formula, because trig functions tangle the joints together. But we know how to <strong>linearise</strong>:
            near the current pose the Jacobian tells us how a small joint nudge moves the hand. So we ask the linear model
            for the nudge that would cancel the current error, take it, and re-linearise at the new pose.
          </p>
          <p>
            This is Newton's method with the Jacobian playing the role of the derivative. Instead of dividing by a slope
            (impossible for a matrix), we <strong>solve a linear system</strong> — the very thing Module 1 made us experts
            at. A few iterations and the hand snaps to the goal.
          </p>
        </div>
      </section>

      {/* ── Formalism ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · THE NEWTON-RAPHSON UPDATE</span></h2>
        <div className="content-block">
          <p>For <InlineMath>{'f:\\mathbb{R}^n\\to\\mathbb{R}^n'}</InlineMath>, the vector linear approximation about the
            current guess <InlineMath>{'x_k'}</InlineMath> is
            <InlineMath>{'\\;f(x)\\approx f(x_k) + \\frac{\\partial f(x_k)}{\\partial x}(x-x_k)'}</InlineMath>. Setting it
            to zero and writing the step <InlineMath>{'\\;\\Delta x_k = x_{k+1}-x_k'}</InlineMath>:</p>
          <div className="callout callout-success">
            <DisplayMath>{String.raw`\frac{\partial f(x_k)}{\partial x}\,\Delta x_k = -f(x_k), \qquad x_{k+1} = x_k + \Delta x_k.`}</DisplayMath>
            <strong>Never invert the Jacobian.</strong> Solve the linear system
            <InlineMath>{'\\;J\\,\\Delta x_k = -f(x_k)'}</InlineMath> with LU or QR (Module 1–2), then update. The damped
            version takes <InlineMath>{'\\;x_{k+1} = x_k + \\epsilon\\,\\Delta x_k'}</InlineMath> with
            <InlineMath>{'\\;\\epsilon\\in(0,1)'}</InlineMath> for safety far from the root.
          </div>
          <p>Notice the perfect echo of the scalar rule
            <InlineMath>{'\\;x_{k+1} = x_k - (f\'(x_k))^{-1}f(x_k)'}</InlineMath>: the reciprocal of the slope becomes the
            inverse of the Jacobian, realised as a solve. Convergence is again <strong>quadratic</strong> near the
            solution.</p>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · NEWTON-RAPHSON INVERSE KINEMATICS</span></h2>
        <IKWidget />
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · ONE IK STEP</span></h2>
        <div className="content-block">
          <p>Take the 2-link arm (<InlineMath>{'\\ell_1=2.2,\\;\\ell_2=1.8'}</InlineMath>) at
            <InlineMath>{'\\;\\theta = (50^\\circ,50^\\circ)'}</InlineMath>, hand at
            <InlineMath>{'\\;f(\\theta)\\approx(1.10, 3.48)'}</InlineMath>, aiming for the target
            <InlineMath>{'\\;(2.6, 1.6)'}</InlineMath>. The error is
            <InlineMath>{'\\;f(\\theta)-\\text{target}\\approx(-1.50, 1.88)'}</InlineMath>. We solve</p>
          <DisplayMath>{String.raw`J(\theta)\,\Delta\theta = -\big(f(\theta)-\text{target}\big),`}</DisplayMath>
          <p>with <InlineMath>{'J'}</InlineMath> the arm Jacobian from Lecture 18. One LU/QR solve gives the joint step
            <InlineMath>{'\\;\\Delta\\theta'}</InlineMath>; applying <InlineMath>{'\\;\\theta\\leftarrow\\theta+\\Delta\\theta'}</InlineMath>
            drops the residual by an order of magnitude, and the next step squares it again. The ledger widget shows the
            full run converging to <InlineMath>{'\\;\\lVert f\\rVert < 10^{-9}'}</InlineMath> in about five iterations.</p>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · QUADRATIC CONVERGENCE</span></h2>
        <ConvWidget />
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span></h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">✍️</div>
              <h3>Inverse kinematics</h3>
              <p>Every manipulator that follows a Cartesian path solves IK with Newton-Raphson (or its damped
                least-squares cousin) at servo rates.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">⚖️</div>
              <h3>Walking & balance</h3>
              <p>Bipeds like Cassie solve coupled nonlinear constraint equations (contact, momentum) each control tick via
                Newton-type solvers.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🌐</div>
              <h3>Power-flow & circuits</h3>
              <p>Solving large nonlinear network equations (grids, SPICE) is classic vector Newton-Raphson with a sparse
                Jacobian.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🛰️</div>
              <h3>Bundle adjustment / SLAM</h3>
              <p>Refining camera poses and 3D points minimizes reprojection error with Gauss-Newton — Newton-Raphson on
                the gradient of a least-squares cost.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quiz ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag quiz-tag">QUIZ</span></h2>
        <div className="content-block">
          <QuizQ
            num={1} type="Conceptual"
            question="The Newton-Raphson step for f: ℝⁿ → ℝⁿ is found by:"
            options={[
              'Computing J⁻¹ explicitly and multiplying',
              'Solving the linear system J·Δx = −f(x)',
              'Halving an interval',
              'Taking the average of all components',
            ]}
            correct={1}
            explanation="We never form the inverse — we solve J·Δx = −f(x) with LU or QR, then update x ← x + Δx. It's a linear solve per iteration."
          />
          <QuizQ
            num={2} type="Computational"
            question="Inverse kinematics asks for:"
            options={[
              'The hand position given joint angles',
              'The joint angles given a desired hand position',
              'The link lengths',
              'The Jacobian determinant',
            ]}
            correct={1}
            explanation="IK is the inverse of forward kinematics: position in, angles out. Newton-Raphson solves f(θ) − target = 0 for θ."
          />
          <QuizQ
            num={3} type="Geometric"
            question="What happens to IK convergence near a singular configuration (det J ≈ 0)?"
            options={[
              'It converges faster',
              'The linear solve becomes ill-conditioned and steps blow up',
              'Nothing changes',
              'The Jacobian becomes the identity',
            ]}
            correct={1}
            explanation="A near-singular J makes J·Δx = −f ill-conditioned, so the predicted step explodes. Damped least squares (Levenberg-Marquardt) is used to stay stable there."
          />
          <QuizQ
            num={4} type="Transfer"
            question="How does the scalar Newton rule map onto the vector version?"
            options={[
              'The reciprocal of the slope becomes the inverse of the Jacobian (done as a solve)',
              'Nothing carries over; they are unrelated',
              'The derivative becomes the determinant',
              'Division becomes multiplication by f(x)',
            ]}
            correct={0}
            explanation="Scalar: xₖ₊₁ = xₖ − f/f′. Vector: 1/f′ becomes J⁻¹, realised as solving J·Δx = −f. Same idea, generalised from a number to a matrix."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>Write the Newton-Raphson update J·Δx = −f(x), x ← x + Δx, and the damped variant.</div>
            <div className="review-item"><span className="review-day">Day 1</span>Answer: (a) Why solve instead of invert J? (b) What is inverse kinematics?</div>
            <div className="review-item"><span className="review-day">Day 3</span>Set up (don't fully solve) one IK Newton step for the 2-link arm from a chosen pose.</div>
            <div className="review-item"><span className="review-day">Day 7</span>Explain why convergence degrades near a singularity and what fixes it.</div>
            <div className="review-item"><span className="review-day">Day 14</span>Explain Newton-Raphson IK to a friend using the "ask the Jacobian for the nudge" picture.</div>
          </div>
        </div>
      </section>

    </div>
  )
}
