import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { useOrbitScene } from '../shared/useOrbitScene.js'
import { fmt, QuizQ } from '../shared/ui.jsx'
import {
  COL, tube, sphere, disposeObject,
} from '../shared/three-helpers.js'

const f2 = n => { const r = Math.round(n * 100) / 100; return (Object.is(r, -0) ? 0 : r).toFixed(2) }

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
    color, transparent: true, opacity: 0.45, side: THREE.DoubleSide, roughness: 0.85,
  })))
  g.add(new THREE.LineSegments(new THREE.WireframeGeometry(geo),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.16 })))
  return g
}
const solve2 = (M, r) => {
  const det = M[0][0] * M[1][1] - M[0][1] * M[1][0]
  if (Math.abs(det) < 1e-9) return [0, 0]
  return [(r[0] * M[1][1] - r[1] * M[0][1]) / det, (r[1] * M[0][0] - r[0] * M[1][0]) / det]
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — Gradient descent vs Newton's method on the same bowl
//  GD: x ← x − s∇f. Newton: solve H·Δ = −∇f, x ← x + Δ. For a quadratic, Newton
//  jumps to the minimum in ONE step; GD zig-zags for dozens.
// ════════════════════════════════════════════════════════════════════════════

const OPT_PRESETS = [
  { label: 'Round bowl', f: (a, b) => 0.5 * (a * a + b * b), g: (a, b) => [a, b], H: [[1, 0], [0, 1]], start: [-2.5, 2.2], ys: 0.7, sgd: 0.5 },
  { label: 'Narrow valley', f: (a, b) => 0.5 * (a * a + 8 * b * b), g: (a, b) => [a, 8 * b], H: [[1, 0], [0, 8]], start: [-2.6, 1.7], ys: 0.32, sgd: 0.22 },
  { label: 'Tilted bowl', f: (a, b) => 0.5 * (a * a + b * b) + 0.4 * a * b, g: (a, b) => [a + 0.4 * b, b + 0.4 * a], H: [[1, 0.4], [0.4, 1]], start: [2.4, 2.4], ys: 0.6, sgd: 0.5 },
]
const R = 3

function gdPath(P) {
  const pts = [[...P.start]]
  for (let k = 0; k < 80; k++) {
    const [a, b] = pts[k], gr = P.g(a, b)
    pts.push([a - P.sgd * gr[0], b - P.sgd * gr[1]])
    if (Math.hypot(...P.g(...pts[k + 1])) < 1e-2) break
  }
  return pts
}
function newtonPath(P) {
  const pts = [[...P.start]]
  for (let k = 0; k < 12; k++) {
    const [a, b] = pts[k], gr = P.g(a, b)
    const d = solve2(P.H, [-gr[0], -gr[1]])
    pts.push([a + d[0], b + d[1]])
    if (Math.hypot(...P.g(...pts[k + 1])) < 1e-6) break
  }
  return pts
}

function OptWidget() {
  const [idx, setIdx] = useState(0)
  const dyn = useRef([])
  const surfRef = useRef(null)
  const P = OPT_PRESETS[idx]
  const gd = gdPath(P), nw = newtonPath(P)

  const { containerRef, ctxRef } = useOrbitScene(
    null,
    { target: [0, 1, 0], camStart: { theta: 0.8, phi: 0.95, r: 13 }, zoom: [7, 24] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    if (surfRef.current) { scene.remove(surfRef.current); disposeObject(surfRef.current) }
    const g = surfaceMesh(P.f, R, 40, P.ys, 0x4c6ef5)
    scene.add(g); surfRef.current = g
  }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }
    const W = ([a, b]) => new THREE.Vector3(a, Math.min(P.f(a, b) * P.ys + 0.06, 8), b)
    add(sphere(W([0, 0]), COL.point, 0.16))
    const drawPath = (pts, col) => {
      const lim = Math.min(pts.length, 60)
      for (let i = 0; i < lim - 1; i++) add(tube(W(pts[i]), W(pts[i + 1]), col, 0.04))
      pts.slice(0, lim).forEach(p => add(sphere(W(p), col, 0.06)))
    }
    drawPath(gd, COL.line1)   // gradient descent — orange
    drawPath(nw, COL.z)       // Newton — blue
    add(sphere(W(P.start), 0xb5740a, 0.16))
  }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="widget">
      <p className="widget-caption">
        Same landscape, two optimizers. <strong style={{ color: '#d9480f' }}>Gradient descent</strong> (orange) only knows
        the slope, so it zig-zags down narrow valleys. <strong style={{ color: '#1864ab' }}>Newton's method</strong>
        (blue) also knows the <em>curvature</em> (the Hessian), builds a quadratic bowl, and jumps to its bottom — for a
        quadratic cost it lands on the minimum in a <strong>single step</strong>.
      </p>
      <p className="widget-instructions">drag to orbit · compare the orange zig-zag against the blue straight shot</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq" style={{ color: '#ffb066' }}>gradient descent: {gd.length - 1} steps</div>
              <div className="hud-eq" style={{ color: '#74c0fc' }}>Newton: {nw.length - 1} step{nw.length - 1 === 1 ? '' : 's'}</div>
              <div className="hud-note">Hessian H = [[{P.H[0][0]}, {P.H[0][1]}], [{P.H[1][0]}, {P.H[1][1]}]]</div>
              <div className="hud-note">speed-up ≈ {Math.round((gd.length - 1) / Math.max(1, nw.length - 1))}×</div>
            </div>
            <div className="hud-badge badge-unique">Newton solves H·Δ = −∇f, then x ← x + Δ</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {OPT_PRESETS.map((p, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`} onClick={() => setIdx(i)}>{p.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — Curvature test: is x* a min, max, or saddle? (DOM)
//  ∇f = 0 finds a critical point; the Hessian's definiteness classifies it.
// ════════════════════════════════════════════════════════════════════════════

const CURV = [
  { label: 'f = x² + y²', H: [[2, 0], [0, 2]] },
  { label: 'f = x² + 8y²', H: [[2, 0], [0, 16]] },
  { label: 'f = −x² − y²', H: [[-2, 0], [0, -2]] },
  { label: 'f = x² − y² (saddle)', H: [[2, 0], [0, -2]] },
]
function eig2sym(H) {
  const a = H[0][0], b = H[0][1], d = H[1][1]
  const tr = a + d, det = a * d - b * b
  const s = Math.sqrt(Math.max(0, tr * tr - 4 * det))
  return [(tr + s) / 2, (tr - s) / 2]
}
function classify(H) {
  const [l1, l2] = eig2sym(H)
  if (l1 > 1e-9 && l2 > 1e-9) return { txt: 'positive definite → local MINIMUM', col: '#69db7c' }
  if (l1 < -1e-9 && l2 < -1e-9) return { txt: 'negative definite → local MAXIMUM', col: '#ffb066' }
  return { txt: 'indefinite → SADDLE point', col: '#ff8787' }
}

function CurvWidget() {
  return (
    <div className="widget">
      <p className="widget-caption">
        Setting <InlineMath>{'\\nabla f = 0'}</InlineMath> finds a flat spot — but is it a min, a max, or a saddle? The
        <strong> Hessian</strong> decides, exactly like the second-derivative test in 1-D. It is
        <strong> positive definite</strong> (all eigenvalues <InlineMath>{'>0'}</InlineMath>) at a minimum,
        <strong> negative definite</strong> at a maximum, and <strong>indefinite</strong> (mixed signs) at a saddle.
      </p>
      <div className="widget-card">
        <div style={{ padding: '16px 20px', background: '#0f1729', borderRadius: 10, color: '#dbe4f3', fontFamily: 'monospace', fontSize: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.2fr 2fr', gap: '6px 16px', alignItems: 'center' }}>
            <span style={{ color: '#9aa7bd' }}>function</span>
            <span style={{ color: '#9aa7bd' }}>eig(H)</span>
            <span style={{ color: '#9aa7bd' }}>verdict</span>
            {CURV.map(c => {
              const ev = eig2sym(c.H), v = classify(c.H)
              return [
                <span key={`l${c.label}`}>{c.label}</span>,
                <span key={`e${c.label}`}>{f2(ev[0])}, {f2(ev[1])}</span>,
                <span key={`v${c.label}`} style={{ color: v.col }}>{v.txt}</span>,
              ]
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L21() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#eafaf0', color: '#0f9d58', borderColor: '#bce8cf' }}>
          Module 3 · Lecture 21 · Grizzle Ch. 12 §12.5–12.9
        </div>
        <h1 className="lesson-title">Second-Order Optimization: The Hessian</h1>
        <p className="lesson-subtitle">
          Gradient descent feels only the slope. <strong>Newton's method for optimization</strong> also feels the
          <strong> curvature</strong> — the <strong>Hessian</strong> — and uses it to leap to the bottom of a local
          quadratic bowl. The payoff is dramatic: on the calibration problem, 5,745 gradient steps become ~14.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Minimizing <InlineMath>{'f'}</InlineMath> means finding where its slope is zero — so finding a minimum is
            <em> root-finding on the gradient</em>: solve <InlineMath>{'\\;\\nabla f(x) = 0'}</InlineMath>. We already have
            a fast root-finder for vector equations: Newton-Raphson. Applying it to <InlineMath>{'\\nabla f'}</InlineMath>
            needs the derivative <em>of the gradient</em> — the matrix of second derivatives, the <strong>Hessian</strong>.
          </p>
          <p>
            Geometrically, the Hessian fits a <strong>quadratic bowl</strong> to the landscape at your current point.
            Newton jumps straight to the bottom of that bowl instead of inching down the slope. When the true surface is
            quadratic, the bowl is exact and you arrive in one step. The cost: you must form and solve with the Hessian
            each iteration — more work per step, but far fewer steps.
          </p>
        </div>
      </section>

      {/* ── Formalism: Hessian + Newton ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · HESSIAN &amp; NEWTON'S MINIMIZATION</span></h2>
        <div className="content-block">
          <p>The <strong>Hessian</strong> collects all second partials; it is the Jacobian of
            <InlineMath>{'\\;[\\nabla f]^{\\top}'}</InlineMath> and is always <strong>symmetric</strong>:</p>
          <DisplayMath>{String.raw`[\nabla^2 f(x)]_{ij} = \frac{\partial^2 f(x)}{\partial x_i\,\partial x_j} = [\nabla^2 f(x)]_{ji}.`}</DisplayMath>
          <p>Apply Newton-Raphson to <InlineMath>{'\\;\\nabla f(x) = 0'}</InlineMath>: solve for the step, then update.</p>
          <div className="callout callout-success">
            <DisplayMath>{String.raw`\nabla^2 f(x_k)\,\Delta x_k = -[\nabla f(x_k)]^{\top}, \qquad x_{k+1} = x_k + s\,\Delta x_k \ \ (0 < s \le 1).`}</DisplayMath>
            Solve with LU or QR — <strong>never invert</strong> the Hessian. For a quadratic cost the Hessian is constant
            and one undamped step (<InlineMath>{'s = 1'}</InlineMath>) lands exactly on the minimum.
          </div>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · GRADIENT DESCENT vs NEWTON</span></h2>
        <OptWidget />
      </section>

      {/* ── Formalism: optimality + convexity ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · OPTIMALITY, DEFINITENESS &amp; CONVEXITY</span></h2>
        <div className="content-block">
          <p>The Hessian classifies a critical point <InlineMath>{'\\;(\\nabla f(x^{*}) = 0)'}</InlineMath>, just like
            <InlineMath>{'\\;f\'\'(x^{*})'}</InlineMath> in 1-D:</p>
          <div className="callout callout-info">
            <ul style={{ margin: 0 }}>
              <li><strong>Local minimum:</strong> <InlineMath>{'\\nabla^2 f(x^{*})'}</InlineMath> positive definite (all
                eigenvalues <InlineMath>{'>0'}</InlineMath>).</li>
              <li><strong>Local maximum:</strong> negative definite (all eigenvalues <InlineMath>{'<0'}</InlineMath>).</li>
              <li><strong>Saddle:</strong> indefinite (mixed signs).</li>
            </ul>
          </div>
          <p>A function is <strong>convex</strong> if every chord lies on or above the graph:</p>
          <DisplayMath>{String.raw`f(\alpha x + (1-\alpha)y) \le \alpha f(x) + (1-\alpha)f(y), \qquad 0\le\alpha\le 1.`}</DisplayMath>
          <div className="callout callout-success">
            <strong>Why convexity is the dream.</strong> A convex function has <em>no</em> local minima other than the
            global one — every valley is <em>the</em> valley. If the Hessian is positive definite everywhere, the global
            minimum is unique. (And maximizing <InlineMath>{'f'}</InlineMath> is just minimizing
            <InlineMath>{'\\;-f'}</InlineMath>.)
          </div>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · THE CURVATURE TEST</span></h2>
        <CurvWidget />
      </section>

      {/* ── QP aside ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">LOOKING AHEAD · QUADRATIC PROGRAMS</span></h2>
        <div className="content-block">
          <p>When the cost is quadratic and the constraints are linear, the problem is a <strong>Quadratic Program</strong>:</p>
          <DisplayMath>{String.raw`\min_{x}\ \tfrac12 x^{\top} Q x + q^{\top} x \quad\text{s.t.}\quad A_{\text{in}}x \le b_{\text{in}},\ \ A_{\text{eq}}x = b_{\text{eq}}.`}</DisplayMath>
          <p>If <InlineMath>{'Q'}</InlineMath> is symmetric positive definite and the feasible set is non-empty, the
            optimum is <strong>unique</strong>. Even ordinary least squares
            <InlineMath>{'\\;\\lVert Ax - b\\rVert_2^2'}</InlineMath> is a QP with
            <InlineMath>{'\\;Q = 2A^{\\top}A'}</InlineMath>, <InlineMath>{'\\;q = -2A^{\\top}b'}</InlineMath>. Solvers like
            <strong> OSQP</strong> handle these in milliseconds — the foundation of the max-margin classifier in Module 4.</p>
        </div>
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span></h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">⚡</div>
              <h3>Fast calibration</h3>
              <p>The LiDAR-camera calibration that took 5,745 gradient steps converges in ~14 Newton steps — a ~400×
                speed-up from using curvature.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🎛️</div>
              <h3>Optimal control / MPC</h3>
              <p>Model-predictive control solves a QP every tick; positive-definite cost matrices guarantee a unique,
                quickly-found optimum.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧮</div>
              <h3>Gauss-Newton & LM</h3>
              <p>For least-squares costs, the Hessian is approximated by JᵀJ (Gauss-Newton); Levenberg-Marquardt blends it
                with gradient descent for robustness.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">📈</div>
              <h3>Convex ML</h3>
              <p>Logistic regression and SVMs have convex losses — any local minimum is global, so second-order solvers
                find the unique answer reliably.</p>
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
            question="Newton's method for minimization is really:"
            options={[
              'Bisection on f',
              'Newton-Raphson applied to ∇f(x) = 0',
              'Gradient descent with a big step',
              'Random search',
            ]}
            correct={1}
            explanation="A minimum has ∇f = 0, so minimizing is root-finding on the gradient. Newton-Raphson on ∇f needs its derivative — the Hessian."
          />
          <QuizQ
            num={2} type="Computational"
            question="The second-order (Newton) step solves:"
            options={[
              '∇f · Δx = −H',
              '∇²f(xₖ) · Δxₖ = −[∇f(xₖ)]ᵀ',
              'Δx = −s∇f',
              'H · Δx = x',
            ]}
            correct={1}
            explanation="Solve the linear system ∇²f·Δx = −[∇f]ᵀ (with LU/QR), then x ← x + sΔx. For a quadratic, one step with s = 1 hits the minimum."
          />
          <QuizQ
            num={3} type="Geometric"
            question="A critical point with an indefinite Hessian (mixed-sign eigenvalues) is a:"
            options={['Minimum', 'Maximum', 'Saddle point', 'Global optimum']}
            correct={2}
            explanation="Positive definite → min, negative definite → max, mixed signs → saddle (up in some directions, down in others)."
          />
          <QuizQ
            num={4} type="Transfer"
            question="Why are convex problems so desirable in optimization?"
            options={[
              'They have no minimum',
              'Every local minimum is the global minimum (unique if the Hessian is positive definite everywhere)',
              'The gradient is always zero',
              'They cannot be solved by Newton',
            ]}
            correct={1}
            explanation="Convexity rules out spurious local minima: any minimum you find is global. With a positive-definite Hessian everywhere it's also unique — the ideal case for reliable solvers."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>Write the Hessian definition and the Newton minimization step ∇²f·Δx = −[∇f]ᵀ.</div>
            <div className="review-item"><span className="review-day">Day 1</span>Answer: (a) How does the Hessian classify a critical point? (b) Why is convexity nice?</div>
            <div className="review-item"><span className="review-day">Day 3</span>Show that for f = ½xᵀQx, one Newton step from any x lands at the minimum 0.</div>
            <div className="review-item"><span className="review-day">Day 7</span>Explain the 400× calibration speed-up in terms of curvature information.</div>
            <div className="review-item"><span className="review-day">Day 14</span>Explain Newton vs gradient descent to a friend with the "quadratic bowl" picture in under 2 minutes.</div>
          </div>
        </div>
      </section>

    </div>
  )
}
