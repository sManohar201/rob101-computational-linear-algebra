import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { useOrbitScene } from '../shared/useOrbitScene.js'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'
import {
  COL, tube, sphere, label, disposeObject,
} from '../shared/three-helpers.js'

const f2 = n => { const r = Math.round(n * 100) / 100; return (Object.is(r, -0) ? 0 : r).toFixed(2) }

// ─── a terrain mesh: world (a, f(a,b)·scale, b) over a grid ───────────────────
function surfaceMesh(fn, R, N, ys, color) {
  const geo = new THREE.PlaneGeometry(2 * R, 2 * R, N, N)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const a = pos.getX(i), b = pos.getY(i)
    pos.setXYZ(i, a, fn(a, b) * ys, b)
  }
  geo.computeVertexNormals()
  const g = new THREE.Group()
  g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
    roughness: 0.85, metalness: 0, flatShading: false,
  })))
  g.add(new THREE.LineSegments(new THREE.WireframeGeometry(geo),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.18 })))
  return g
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — Gradient descent on a loss landscape
//  xₖ₊₁ = xₖ − s·∇f(xₖ). Roll downhill against the gradient. Too-small s crawls;
//  too-large s overshoots and diverges off the bowl.
// ════════════════════════════════════════════════════════════════════════════

const GD_PRESETS = [
  { label: 'Round bowl', f: (a, b) => 0.5 * (a * a + b * b), g: (a, b) => [a, b], start: [-2.6, 2.2], ys: 0.7, smax: 2.5 },
  { label: 'Narrow valley (ill-conditioned)', f: (a, b) => 0.5 * (a * a + 8 * b * b), g: (a, b) => [a, 8 * b], start: [-2.6, 1.6], ys: 0.32, smax: 0.25 },
  { label: 'Tilted bowl', f: (a, b) => 0.5 * (a * a + b * b) + 0.4 * a * b, g: (a, b) => [a + 0.4 * b, b + 0.4 * a], start: [2.4, 2.4], ys: 0.6, smax: 1.2 },
]
const R = 3

function descend(P, s, steps = 60) {
  const pts = [[...P.start]]
  for (let k = 0; k < steps; k++) {
    const [a, b] = pts[k]
    const gr = P.g(a, b)
    const na = a - s * gr[0], nb = b - s * gr[1]
    pts.push([na, nb])
    if (Math.hypot(na, nb) > 12) break          // diverged
    if (Math.hypot(gr[0], gr[1]) < 1e-3) break   // converged
  }
  return pts
}

function GDWidget() {
  const [idx, setIdx] = useState(0)
  const [s, setS] = useState(0.6)
  const dyn = useRef([])
  const surfRef = useRef(null)
  const P = GD_PRESETS[idx]
  const path = descend(P, s)
  const last = path[path.length - 1]
  const diverged = Math.hypot(...last) > 12
  const converged = !diverged && Math.hypot(...P.g(...last)) < 1e-2

  const { containerRef, ctxRef } = useOrbitScene(
    null,
    { target: [0, 1, 0], camStart: { theta: 0.8, phi: 0.95, r: 13 }, zoom: [7, 24] }
  )

  // rebuild surface on preset change
  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    if (surfRef.current) { scene.remove(surfRef.current); disposeObject(surfRef.current) }
    const g = surfaceMesh(P.f, R, 40, P.ys, 0x4c6ef5)
    scene.add(g); surfRef.current = g
  }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  // redraw path on preset / step-size change
  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }
    const W = ([a, b]) => new THREE.Vector3(a, P.f(a, b) * P.ys + 0.06, b)
    // minimum marker
    add(sphere(W([0, 0]), COL.point, 0.16))
    // descent path
    const drawn = path.slice(0, Math.min(path.length, 45))
    for (let i = 0; i < drawn.length - 1; i++) {
      const wp = W(drawn[i]).clone(); wp.y = Math.min(wp.y, 8)
      const wq = W(drawn[i + 1]).clone(); wq.y = Math.min(wq.y, 8)
      add(tube(wp, wq, diverged ? COL.line3 : COL.line1, 0.04))
    }
    add(sphere(W(P.start), 0xb5740a, 0.16))            // start
    const endW = W(last).clone(); endW.y = Math.min(endW.y, 8)
    add(sphere(endW, diverged ? COL.line3 : COL.point, 0.18)) // ball
  }, [idx, s]) // eslint-disable-line react-hooks/exhaustive-deps

  const badge = diverged
    ? { cls: 'badge-none', txt: '⚠ step size too large → overshoots and diverges' }
    : converged
      ? { cls: 'badge-unique', txt: `✓ converged in ${path.length - 1} steps to the minimum` }
      : { cls: 'badge-infinite', txt: 'still crawling — step size too small to finish in 60 steps' }

  return (
    <div className="widget">
      <p className="widget-caption">
        Optimization is rolling downhill. <strong>Gradient descent</strong> repeatedly steps <em>against</em> the
        gradient — the direction of steepest <em>increase</em> — by the rule
        <InlineMath>{'\\;x_{k+1} = x_k - s\\,[\\nabla f(x_k)]^{\\top}'}</InlineMath>. The
        <strong> step size</strong> <InlineMath>{'\\;s'}</InlineMath> (learning rate) is everything: too small and the ball
        crawls; too large and it overshoots the valley and flies off. Try the narrow-valley preset to see the notorious
        zig-zag.
      </p>
      <p className="widget-instructions">drag to orbit · scrub the learning rate · amber = start, teal = minimum</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq">step size s = {f2(s)}</div>
              <div className="hud-eq" style={{ color: '#ffb066' }}>steps taken = {path.length - 1}</div>
              <div className="hud-note">start f = {f2(P.f(...P.start))} → current f = {diverged ? '∞' : f2(P.f(...last))}</div>
              <div className="hud-note">‖∇f‖ = {diverged ? '∞' : f2(Math.hypot(...P.g(...last)))}</div>
            </div>
            <div className={`hud-badge ${badge.cls}`}>{badge.txt}</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {GD_PRESETS.map((p, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`}
              onClick={() => { setIdx(i); setS(Math.min(s, p.smax * 0.8)) }}>{p.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <SliderRow label="learning rate s" k="s" value={s} min={0.02} max={3} step={0.02}
              onChange={(k, v) => setS(v)} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — Step-size sweep (DOM): the Goldilocks zone
// ════════════════════════════════════════════════════════════════════════════

function SweepWidget() {
  const P = GD_PRESETS[1] // narrow valley, sensitive to s
  const rows = [0.05, 0.1, 0.2, 0.24, 0.26, 0.3].map(s => {
    const path = descend(P, s, 80)
    const last = path[path.length - 1]
    const div = Math.hypot(...last) > 12
    return { s, steps: path.length - 1, fend: div ? Infinity : P.f(...last), div }
  })
  return (
    <div className="widget">
      <p className="widget-caption">
        On the narrow valley <InlineMath>{'f = \\tfrac12(a^2 + 8b^2)'}</InlineMath> the largest stable step is
        <InlineMath>{'\\;s < 2/\\lambda_{\\max} = 2/8 = 0.25'}</InlineMath> — set by the <em>biggest</em> eigenvalue (the
        curvature of the steepest direction). Below it, bigger is faster; at or above it, gradient descent diverges. The
        condition number of the Hessian is exactly why ill-conditioned problems are slow.
      </p>
      <div className="widget-card">
        <div style={{ padding: '16px 20px', background: '#0f1729', borderRadius: 10, color: '#dbe4f3', fontFamily: 'monospace', fontSize: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '3px 18px' }}>
            <span style={{ color: '#9aa7bd' }}>s</span>
            <span style={{ color: '#9aa7bd' }}>steps to converge</span>
            <span style={{ color: '#9aa7bd' }}>final f</span>
            {rows.map(r => [
              <span key={`s${r.s}`}>{r.s}</span>,
              <span key={`n${r.s}`} style={{ color: r.div ? '#ff8787' : '#69db7c' }}>{r.div ? 'diverged' : r.steps}</span>,
              <span key={`f${r.s}`} style={{ color: r.div ? '#ff8787' : undefined }}>{r.div ? '∞' : r.fend.toExponential(1)}</span>,
            ])}
          </div>
          <div style={{ marginTop: 10, color: '#9aa7bd', fontSize: 11.5 }}>
            Notice the cliff between s = 0.24 (works) and s = 0.26 (blows up) — right at 2/λₘₐₓ = 0.25.
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L20() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#eafaf0', color: '#0f9d58', borderColor: '#bce8cf' }}>
          Module 3 · Lecture 20 · Grizzle Ch. 12 §12.1–12.4
        </div>
        <h1 className="lesson-title">Optimization: Gradient Descent</h1>
        <p className="lesson-subtitle">
          From <em>solving</em> equations to <em>minimizing</em> a cost. We want
          <InlineMath>{'\\;x^{*} = \\arg\\min_x f(x)'}</InlineMath>. The gradient points uphill, so we step the other way —
          again and again. It's the workhorse behind training neural networks and calibrating sensors.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            A <strong>cost function</strong> (loss, error, regret) scores how bad a guess is — lower is better. Picture its
            graph as a landscape and yourself as a hiker in fog who can only feel the slope underfoot. The gradient is the
            uphill direction; to descend, step opposite to it. Keep going and you slide into a valley — a minimum.
          </p>
          <p>
            The only real knob is how big a step to take. Tiny steps are safe but you'll be hiking forever. Huge steps
            leap across the valley and end up higher than you started, bouncing wildly. Choosing this <strong>learning
            rate</strong> well — and reshaping the landscape so it's less lopsided — is most of the art of training models.
          </p>
        </div>
      </section>

      {/* ── Formalism ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · GRADIENT, CONTOURS &amp; THE UPDATE</span></h2>
        <div className="content-block">
          <p>We seek <InlineMath>{'\\;x^{*} = \\arg\\min_{x\\in\\mathbb{R}^m} f(x)'}</InlineMath> for a scalar cost
            <InlineMath>{'\\;f'}</InlineMath>. Two facts about the gradient drive everything:</p>
          <div className="callout callout-info">
            <ul style={{ margin: 0 }}>
              <li><InlineMath>{'\\nabla f(x)'}</InlineMath> points in the direction of <strong>steepest increase</strong>;
                <InlineMath>{'\\;-\\nabla f(x)'}</InlineMath> is steepest <strong>decrease</strong>.</li>
              <li>At any local min or max the gradient <strong>vanishes</strong>:
                <InlineMath>{'\\;\\nabla f(x^{*}) = 0'}</InlineMath> (a flat spot).</li>
            </ul>
          </div>
          <p>So follow the negative gradient downhill:</p>
          <div className="callout callout-success">
            <DisplayMath>{String.raw`x_{k+1} = x_k - s\,[\nabla f(x_k)]^{\top}, \qquad s > 0.`}</DisplayMath>
            Stop when <InlineMath>{'\\;\\lVert\\nabla f(x_k)\\rVert < \\text{tol}'}</InlineMath>. The
            <strong> step size</strong> <InlineMath>{'\\;s'}</InlineMath>: too small ⇒ painfully slow; too large ⇒
            overshoot and diverge. For a quadratic with Hessian eigenvalues
            <InlineMath>{'\\;\\lambda_i'}</InlineMath>, descent is stable only for
            <InlineMath>{'\\;s < 2/\\lambda_{\\max}'}</InlineMath>, and slow when
            <InlineMath>{'\\;\\lambda_{\\max}/\\lambda_{\\min}'}</InlineMath> (the condition number) is large — the
            zig-zag valley.
          </div>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · ROLLING DOWNHILL</span></h2>
        <GDWidget />
      </section>

      {/* ── Application: calibration ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">CASE STUDY · EXTRINSIC CALIBRATION (GRIZZLE §12.4)</span></h2>
        <div className="content-block">
          <p>
            Fusing a 3D LiDAR with a camera needs the rigid-body transform
            <InlineMath>{String.raw`\;H = \begin{bmatrix} R & t\\ 0 & 1\end{bmatrix}`}</InlineMath> aligning the two
            sensors. Cast as minimizing the squared distance between projected LiDAR points and detected image features,
          </p>
          <DisplayMath>{String.raw`\arg\min_{R,t}\ \sum_{i=1}^{4n}\big\lVert \Pi(X_i; R, t) - Y_i\big\rVert_2^2,`}</DisplayMath>
          <p>with <InlineMath>{'R'}</InlineMath> compressed to three parameters via the exponential map of a
            skew-symmetric matrix. Plain gradient descent solves it — but takes a staggering
            <strong> 5,745 iterations</strong> to converge. That sluggishness is exactly the ill-conditioning the next
            lecture cures with second-order (Hessian) information, cutting it to ~14 iterations.</p>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · THE STEP-SIZE CLIFF</span></h2>
        <SweepWidget />
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span></h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🧠</div>
              <h3>Training neural nets</h3>
              <p>Stochastic gradient descent on the loss over mini-batches is how essentially every deep model is trained.
                The learning-rate schedule is the descent step size.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">📷</div>
              <h3>Sensor calibration</h3>
              <p>The LiDAR-camera case study above — and IMU/wheel-odometry calibration — are gradient-descent fits of a
                geometric cost.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🛣️</div>
              <h3>Path / trajectory optimization</h3>
              <p>Minimizing a cost over a path (smoothness + obstacle penalties) drives motion planners like CHOMP.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">📊</div>
              <h3>Logistic / linear regression</h3>
              <p>Fitting model parameters by minimizing a loss is gradient descent on a (often convex) cost surface.</p>
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
            question="Why does gradient descent step in the −∇f direction?"
            options={[
              '∇f points downhill, so we go with it',
              '∇f points uphill (steepest increase), so −∇f is steepest decrease',
              'To increase the cost',
              'Because ∇f is always zero',
            ]}
            correct={1}
            explanation="The gradient points toward steepest increase. To minimize, step the opposite way: x ← x − s∇f."
          />
          <QuizQ
            num={2} type="Computational"
            question="The gradient-descent update rule is:"
            options={[
              'xₖ₊₁ = xₖ + s∇f(xₖ)',
              'xₖ₊₁ = xₖ − s[∇f(xₖ)]ᵀ',
              'xₖ₊₁ = −∇f(xₖ)',
              'xₖ₊₁ = xₖ / ∇f(xₖ)',
            ]}
            correct={1}
            explanation="Move opposite the gradient, scaled by the step size s > 0: xₖ₊₁ = xₖ − s[∇f(xₖ)]ᵀ. Stop when ‖∇f‖ < tol."
          />
          <QuizQ
            num={3} type="Geometric"
            question="What characterizes any local minimum or maximum of f?"
            options={[
              'f = 0 there',
              'The gradient vanishes: ∇f(x*) = 0',
              'The Hessian is zero',
              'x* = 0',
            ]}
            correct={1}
            explanation="At an interior extremum the surface is locally flat, so ∇f(x*) = 0. (Whether it's a min, max, or saddle is decided by curvature — next lecture.)"
          />
          <QuizQ
            num={4} type="Transfer"
            question="On a narrow valley, why is gradient descent slow even with a well-tuned step?"
            options={[
              'The gradient is always zero',
              'A large condition number forces a small stable step while progress along the valley is tiny — it zig-zags',
              'There is no minimum',
              'The cost is not differentiable',
            ]}
            correct={1}
            explanation="Stability caps s at 2/λₘₐₓ (the steep direction), but the gentle direction needs many such small steps. High λₘₐₓ/λₘᵢₙ ⇒ zig-zagging and slow convergence — exactly what second-order methods fix."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>Write the gradient-descent update and the two gradient facts (steepest direction, vanishes at extrema).</div>
            <div className="review-item"><span className="review-day">Day 1</span>Answer: (a) What goes wrong if s is too large? (b) Too small?</div>
            <div className="review-item"><span className="review-day">Day 3</span>Run three descent steps by hand on f = ½(a²+b²) from (−2,2) with s = 0.5.</div>
            <div className="review-item"><span className="review-day">Day 7</span>Explain why ill-conditioning (large condition number) makes descent zig-zag and crawl.</div>
            <div className="review-item"><span className="review-day">Day 14</span>Explain gradient descent to a friend with the "hiker in fog" picture in under 2 minutes.</div>
          </div>
        </div>
      </section>

    </div>
  )
}
