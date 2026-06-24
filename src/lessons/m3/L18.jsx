import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { useOrbitScene } from '../shared/useOrbitScene.js'
import { useAnimatedParams } from '../shared/useAnimatedParams.js'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'
import {
  COL, tube, sphere, axisArrow, arrowFromTo, gridXY, label, disposeObject,
} from '../shared/three-helpers.js'

const f2 = n => { const r = Math.round(n * 100) / 100; return (Object.is(r, -0) ? 0 : r).toFixed(2) }

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — The Jacobian of a 2-link arm
//  Forward kinematics f(θ₁,θ₂) → end-effector (x,y). The Jacobian's two COLUMNS
//  are the end-effector velocities produced by moving each joint alone. det J = 0
//  exactly when the arm is straight (θ₂ = 0 or π) — a singularity.
// ════════════════════════════════════════════════════════════════════════════

const L1 = 2.2, L2 = 1.8
function fk(t1, t2) {
  return [L1 * Math.cos(t1) + L2 * Math.cos(t1 + t2), L1 * Math.sin(t1) + L2 * Math.sin(t1 + t2)]
}
function jacobian(t1, t2) {
  const s1 = Math.sin(t1), c1 = Math.cos(t1), s12 = Math.sin(t1 + t2), c12 = Math.cos(t1 + t2)
  return [
    [-L1 * s1 - L2 * s12, -L2 * s12],
    [L1 * c1 + L2 * c12, L2 * c12],
  ]
}

const ARM_PRESETS = [
  { label: 'Bent (well-conditioned)', t1: 40, t2: 60 },
  { label: 'Reaching out', t1: 20, t2: 25 },
  { label: 'Singular (arm straight, θ₂≈0)', t1: 35, t2: 2 },
  { label: 'Folded back', t1: 70, t2: 150 },
]

function JacobianWidget() {
  const [idx, setIdx] = useState(0)
  const [params, setParams] = useState({ t1: 40, t2: 60 })
  const dyn = useRef([])
  const shown = useAnimatedParams(params)
  const t1 = (shown.t1 * Math.PI) / 180, t2 = (shown.t2 * Math.PI) / 180
  const elbow = [L1 * Math.cos(t1), L1 * Math.sin(t1)]
  const ee = fk(t1, t2)
  const J = jacobian(t1, t2)
  const detJ = J[0][0] * J[1][1] - J[0][1] * J[1][0]

  const { containerRef, ctxRef } = useOrbitScene(
    scene => {
      scene.add(gridXY(5, 1))
      scene.add(axisArrow([1, 0, 0], 5, COL.x))
      scene.add(axisArrow([0, 1, 0], 5, COL.y))
      scene.add(label('x', new THREE.Vector3(5.3, -0.35, 0), '#c92a2a'))
      scene.add(label('y', new THREE.Vector3(-0.4, 5.3, 0), '#2b8a3e'))
      scene.add(sphere(new THREE.Vector3(0, 0, 0), COL.guide, 0.12)) // base
    },
    { target: [0, 0, 0], camStart: { theta: 0, phi: Math.PI / 2, r: 14 }, zoom: [9, 22], lockPolar: [1.3, 1.84] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }
    const O = new THREE.Vector3(0, 0, 0)
    const E = new THREE.Vector3(elbow[0], elbow[1], 0)
    const H = new THREE.Vector3(ee[0], ee[1], 0)
    // links
    add(tube(O, E, COL.line2, 0.07))
    add(tube(E, H, COL.line1, 0.07))
    add(sphere(E, COL.vertex, 0.13))
    add(sphere(H, COL.point, 0.16))
    // Jacobian columns drawn as velocity arrows at the end-effector
    const col1 = new THREE.Vector3(J[0][0], J[1][0], 0).multiplyScalar(0.5)
    const col2 = new THREE.Vector3(J[0][1], J[1][1], 0).multiplyScalar(0.5)
    add(arrowFromTo(H, H.clone().add(col1), COL.x, 0.045))
    add(arrowFromTo(H, H.clone().add(col2), COL.z, 0.045))
    add(label('∂f/∂θ₁', H.clone().add(col1).add(new THREE.Vector3(0.2, 0.2, 0)), '#c92a2a', 0.4))
    add(label('∂f/∂θ₂', H.clone().add(col2).add(new THREE.Vector3(0.2, -0.25, 0)), '#1864ab', 0.4))
  }, [idx, shown.t1, shown.t2]) // eslint-disable-line react-hooks/exhaustive-deps

  const singular = Math.abs(detJ) < 0.25
  return (
    <div className="widget">
      <p className="widget-caption">
        Forward kinematics <InlineMath>{'f(\\theta_1,\\theta_2)'}</InlineMath> maps joint angles to the hand position. Its
        <strong> Jacobian</strong> <InlineMath>{'\\;\\partial f/\\partial\\theta'}</InlineMath> is a
        <InlineMath>{'\\;2\\times2'}</InlineMath> matrix whose two <strong>columns</strong> are the hand velocities you get
        by spinning each joint alone (red = joint 1, blue = joint 2). When the arm straightens
        (<InlineMath>{'\\theta_2\\to0'}</InlineMath>) the two columns line up, <InlineMath>{'\\det J\\to0'}</InlineMath>:
        a <strong>singularity</strong> where the hand loses a direction of motion.
      </p>
      <p className="widget-instructions">drag to orbit · move the joints · watch the Jacobian columns (hand velocities) turn</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq">θ = ({f2(shown.t1)}°, {f2(shown.t2)}°)</div>
              <div className="hud-eq" style={{ color: '#ffb066' }}>hand = ({f2(ee[0])}, {f2(ee[1])})</div>
              <div className="hud-note">J = [[{f2(J[0][0])}, {f2(J[0][1])}], [{f2(J[1][0])}, {f2(J[1][1])}]]</div>
              <div className="hud-note">det J = {f2(detJ)} = L₁L₂ sin θ₂</div>
            </div>
            <div className={`hud-badge ${singular ? 'badge-none' : 'badge-unique'}`}>
              {singular ? '⚠ near singular — columns nearly parallel' : '✓ full rank — hand can move any direction'}
            </div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {ARM_PRESETS.map((p, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`}
              onClick={() => { setIdx(i); setParams({ t1: p.t1, t2: p.t2 }) }}>{p.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <SliderRow label="θ₁" k="t1" value={params.t1} min={0} max={180} step={1}
              onChange={(k, v) => setParams(p => ({ ...p, t1: v }))} />
            <SliderRow label="θ₂" k="t2" value={params.t2} min={-180} max={180} step={1}
              onChange={(k, v) => setParams(p => ({ ...p, t2: v }))} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — The gradient as a linear forecaster (DOM)
//  f(x) ≈ f(x₀) + ∇f(x₀)·(x − x₀). Step away from x₀ and compare the true value
//  to the gradient's linear prediction — the error grows with distance.
// ════════════════════════════════════════════════════════════════════════════

function GradWidget() {
  // f(x,y) = x² + 2y² (a bowl). ∇f = [2x, 4y].
  const f = (x, y) => x * x + 2 * y * y
  const grad = (x, y) => [2 * x, 4 * y]
  const x0 = [1, 1]
  const g = grad(...x0)
  const [params, setParams] = useState({ dx: 0.4, dy: 0.2 })
  const shown = useAnimatedParams(params)
  const xq = [x0[0] + shown.dx, x0[1] + shown.dy]
  const truth = f(...xq)
  const pred = f(...x0) + g[0] * shown.dx + g[1] * shown.dy
  const dist = Math.hypot(shown.dx, shown.dy)
  const err = Math.abs(truth - pred)

  return (
    <div className="widget">
      <p className="widget-caption">
        For a scalar function the <strong>gradient</strong> <InlineMath>{'\\nabla f(x_0)'}</InlineMath> is the row of partial
        derivatives, and it gives the best <em>linear</em> forecast near
        <InlineMath>{'\\;x_0'}</InlineMath>: <InlineMath>{'\\;f(x)\\approx f(x_0)+\\nabla f(x_0)(x-x_0)'}</InlineMath>. Step
        away from <InlineMath>{'\\;x_0=(1,1)'}</InlineMath> on the bowl
        <InlineMath>{'\\;f = x^2+2y^2'}</InlineMath> and watch the linear prediction drift from the truth as you go
        farther — the basis of every local method in this module.
      </p>
      <div className="widget-card">
        <div style={{ padding: '16px 20px', background: '#0f1729', borderRadius: 10, color: '#dbe4f3', fontSize: 13 }}>
          <div style={{ fontFamily: 'monospace', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 18px' }}>
            <span style={{ color: '#9aa7bd' }}>∇f(x₀) =</span><span style={{ color: '#ffb066' }}>[2·1, 4·1] = [{g[0]}, {g[1]}]</span>
            <span style={{ color: '#9aa7bd' }}>query x =</span><span>({f2(xq[0])}, {f2(xq[1])}) · ‖x − x₀‖ = {f2(dist)}</span>
            <span style={{ color: '#9aa7bd' }}>true f(x) =</span><span style={{ color: '#69db7c' }}>{f2(truth)}</span>
            <span style={{ color: '#9aa7bd' }}>linear f̂(x) =</span><span style={{ color: '#4dabf7' }}>{f2(pred)}</span>
            <span style={{ color: '#9aa7bd' }}>error =</span><span style={{ color: err > 0.5 ? '#ff8787' : '#69db7c' }}>{f2(err)}</span>
          </div>
          <div style={{ marginTop: 10, color: '#9aa7bd', fontSize: 11.5 }}>
            The linear model is exact at x₀ and degrades quadratically with distance — small steps stay accurate, big
            steps don't. (That is why Newton and gradient descent take many small steps.)
          </div>
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <SliderRow label="Δx" k="dx" value={params.dx} min={-2} max={2} step={0.1}
              onChange={(k, v) => setParams(p => ({ ...p, dx: v }))} />
            <SliderRow label="Δy" k="dy" value={params.dy} min={-2} max={2} step={0.1}
              onChange={(k, v) => setParams(p => ({ ...p, dy: v }))} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L18() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#eafaf0', color: '#0f9d58', borderColor: '#bce8cf' }}>
          Module 3 · Lecture 18 · Grizzle Ch. 11 §11.5
        </div>
        <h1 className="lesson-title">Vector-Valued Functions: Gradient &amp; Jacobian</h1>
        <p className="lesson-subtitle">
          To linearise in many dimensions, the single derivative becomes a vector of partials — the
          <strong> gradient</strong> for scalar outputs — or a whole matrix of them — the <strong>Jacobian</strong> for
          vector outputs. The Jacobian is the bridge between joint motion and hand motion, and the engine of
          Newton-Raphson and every optimizer to come.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            In one dimension the derivative is a slope: nudge the input, the output changes proportionally. With many
            inputs there is a separate slope for each — the <strong>partial derivatives</strong>. Bundle the partials of a
            single scalar output and you get the <strong>gradient</strong>, a vector pointing in the direction of fastest
            increase. Bundle the partials of <em>several</em> outputs and you get the <strong>Jacobian</strong>, a matrix
            that linearly maps a small input change to the resulting output change.
          </p>
          <p>
            For a robot arm this is concrete. The forward kinematics turns joint angles into a hand position. Its Jacobian
            answers: "if I spin this joint a little, which way and how fast does the hand move?" Each column is the hand's
            velocity from one joint. When two columns line up, the hand has lost a direction it can move — a
            <strong> singularity</strong>, the configuration every roboticist learns to fear.
          </p>
        </div>
      </section>

      {/* ── Formalism ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · PARTIALS, GRADIENT, JACOBIAN</span></h2>
        <div className="content-block">
          <p>The <strong>partial derivative</strong> holds every variable fixed but one:</p>
          <DisplayMath>{String.raw`\frac{\partial f(x_0)}{\partial x_j} := \lim_{h\to 0}\frac{f(x_0 + h e_j) - f(x_0)}{h},`}</DisplayMath>
          <p>where <InlineMath>{'e_j'}</InlineMath> is the <InlineMath>{'j'}</InlineMath>-th canonical basis vector. For a
            <strong> scalar</strong> function <InlineMath>{'f:\\mathbb{R}^m\\to\\mathbb{R}'}</InlineMath>, the
            <strong> gradient</strong> is the row of partials:</p>
          <div className="callout callout-info">
            <DisplayMath>{String.raw`\nabla f(x_0) := \begin{bmatrix}\dfrac{\partial f}{\partial x_1} & \cdots & \dfrac{\partial f}{\partial x_m}\end{bmatrix}, \qquad f(x)\approx f(x_0)+\nabla f(x_0)\,(x-x_0).`}</DisplayMath>
          </div>
          <p>For a <strong>vector</strong> function <InlineMath>{'f:\\mathbb{R}^m\\to\\mathbb{R}^n'}</InlineMath>, stack the
            gradients of each component as rows to form the <InlineMath>{'\\;n\\times m'}</InlineMath>
            <strong> Jacobian</strong>:</p>
          <div className="callout callout-success">
            <DisplayMath>{String.raw`\frac{\partial f(x)}{\partial x} = \begin{bmatrix}\dfrac{\partial f_1}{\partial x_1} & \cdots & \dfrac{\partial f_1}{\partial x_m}\\ \vdots & \ddots & \vdots\\ \dfrac{\partial f_n}{\partial x_1} & \cdots & \dfrac{\partial f_n}{\partial x_m}\end{bmatrix}, \qquad f(x)\approx f(x_0)+\frac{\partial f(x_0)}{\partial x}(x-x_0).`}</DisplayMath>
            Column <InlineMath>{'j'}</InlineMath> is the output's sensitivity to input <InlineMath>{'j'}</InlineMath> — for
            the arm, the hand velocity from joint <InlineMath>{'j'}</InlineMath>. The Jacobian is the multidimensional
            "slope", and it turns nonlinear <InlineMath>{'\\;f'}</InlineMath> into a local linear map.
          </div>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · THE ARM JACOBIAN</span></h2>
        <JacobianWidget />
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · JACOBIAN OF THE 2-LINK ARM</span></h2>
        <div className="content-block">
          <p>With <InlineMath>{'\\;x = \\ell_1\\cos\\theta_1 + \\ell_2\\cos(\\theta_1+\\theta_2)'}</InlineMath> and
            <InlineMath>{'\\;y = \\ell_1\\sin\\theta_1 + \\ell_2\\sin(\\theta_1+\\theta_2)'}</InlineMath>, differentiate
            each output w.r.t. each joint:</p>
          <DisplayMath>{String.raw`J = \frac{\partial(x,y)}{\partial(\theta_1,\theta_2)} = \begin{bmatrix}-\ell_1 s_1 - \ell_2 s_{12} & -\ell_2 s_{12}\\ \ \ \ell_1 c_1 + \ell_2 c_{12} & \ \ \ell_2 c_{12}\end{bmatrix},`}</DisplayMath>
          <p>where <InlineMath>{'s_1=\\sin\\theta_1'}</InlineMath>, <InlineMath>{'s_{12}=\\sin(\\theta_1+\\theta_2)'}</InlineMath>,
            etc. A short computation gives a beautifully simple determinant:</p>
          <DisplayMath>{String.raw`\det J = \ell_1\ell_2\sin\theta_2.`}</DisplayMath>
          <p>So the arm is singular exactly when <InlineMath>{'\\sin\\theta_2 = 0'}</InlineMath> — i.e.
            <InlineMath>{'\\;\\theta_2 = 0'}</InlineMath> (fully extended) or <InlineMath>{'\\;\\theta_2 = \\pi'}</InlineMath>
            (fully folded). That is precisely when the widget's two column-arrows collapse onto the same line and the
            "near singular" warning fires.</p>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · THE GRADIENT AS A LINEAR FORECASTER</span></h2>
        <GradWidget />
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span></h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🤖</div>
              <h3>Velocity kinematics</h3>
              <p>ẋ = J θ̇ maps joint speeds to hand speed. Inverting it (next lecture) gives the joint speeds needed for a
                desired hand motion.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">⚠️</div>
              <h3>Singularity avoidance</h3>
              <p>Controllers monitor det J (or its smallest singular value) to steer away from configurations where the
                arm loses mobility.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧠</div>
              <h3>Backpropagation</h3>
              <p>Training a neural net chains Jacobians of each layer — the chain rule is just Jacobian multiplication. The
                gradient of the loss drives every weight update.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🗺️</div>
              <h3>Sensor linearization</h3>
              <p>The Extended Kalman Filter linearizes nonlinear motion/measurement models with their Jacobians at each
                step to fuse noisy sensor data.</p>
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
            question="The gradient ∇f of a scalar function f: ℝᵐ → ℝ is:"
            options={[
              'An m×m matrix',
              'The row vector of partial derivatives [∂f/∂x₁ … ∂f/∂xₘ]',
              'A single number',
              'The inverse of the Jacobian',
            ]}
            correct={1}
            explanation="For a scalar output, the gradient collects one partial derivative per input — a row vector. It gives the linear approximation f(x) ≈ f(x₀) + ∇f(x₀)(x−x₀)."
          />
          <QuizQ
            num={2} type="Computational"
            question="For f: ℝᵐ → ℝⁿ, the Jacobian has dimensions:"
            options={['m × n', 'n × m', 'n × n', 'm × m']}
            correct={1}
            explanation="One row per output (n) and one column per input (m): the Jacobian is n×m. Each column is the sensitivity of the whole output to one input."
          />
          <QuizQ
            num={3} type="Geometric"
            question="What does each COLUMN of the arm Jacobian represent?"
            options={[
              'The position of each joint',
              'The hand velocity produced by moving that one joint',
              'The length of each link',
              'The torque on each motor',
            ]}
            correct={1}
            explanation="Column j = ∂f/∂θⱼ is the end-effector velocity when only joint j moves. When columns become parallel, det J → 0 — a singularity."
          />
          <QuizQ
            num={4} type="Transfer"
            question="The arm has det J = ℓ₁ℓ₂ sin θ₂. It is singular when:"
            options={[
              'θ₁ = 0',
              'θ₂ = 0 or π (arm straight or fully folded)',
              'the links are equal length',
              'never',
            ]}
            correct={1}
            explanation="sin θ₂ = 0 at θ₂ = 0 and θ₂ = π. There the two Jacobian columns are collinear, the hand loses a direction of instantaneous motion, and inverse kinematics blows up."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>Write the definitions of partial derivative, gradient, and Jacobian, plus the two linear-approximation formulas.</div>
            <div className="review-item"><span className="review-day">Day 1</span>Answer: (a) Jacobian dimensions for f: ℝᵐ→ℝⁿ? (b) What is a column of the arm Jacobian?</div>
            <div className="review-item"><span className="review-day">Day 3</span>Derive det J = ℓ₁ℓ₂ sin θ₂ for the 2-link arm without notes.</div>
            <div className="review-item"><span className="review-day">Day 7</span>Explain why a near-singular Jacobian makes inverse kinematics ill-behaved.</div>
            <div className="review-item"><span className="review-day">Day 14</span>Explain the Jacobian to a friend with the "spin a joint, where does the hand go?" picture.</div>
          </div>
        </div>
      </section>

    </div>
  )
}
