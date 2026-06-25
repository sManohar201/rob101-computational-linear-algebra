import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { useOrbitScene } from '../shared/useOrbitScene.js'
import { useAnimatedParams } from '../shared/useAnimatedParams.js'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'
import { solveLinear, det2, det3 } from '../shared/linalg.js'
import {
  COL, tube, sphere, axisArrow, label, disposeObject,
} from '../shared/three-helpers.js'

// ─── small 2D-scene helpers (these widgets live in the z = 0 plane) ───────────

// A faint integer grid in the z = 0 plane spanning [0,xMax] × [0,yMax] (scene units).
function grid2D(xMax, yMax, color = 0x9fb0c9) {
  const pts = []
  for (let x = 0; x <= xMax + 1e-6; x++) pts.push(new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, yMax, 0))
  for (let y = 0; y <= yMax + 1e-6; y++) pts.push(new THREE.Vector3(0, y, 0), new THREE.Vector3(xMax, y, 0))
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.4 })
  return new THREE.LineSegments(geo, mat)
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — Least-squares line fit  (Grizzle Example 8.1 / Fig 8.1)
//  Slide the line y = mx + b; the rose bars are the errors eᵢ = yᵢ − (mxᵢ + b).
//  Least squares picks the line that minimizes Σeᵢ² — snap to it with a preset.
// ════════════════════════════════════════════════════════════════════════════

// The classic data: it does NOT lie on a line, so Ax = b has no exact solution.
const DATA1 = [[1, 4], [2, 8], [4, 10], [5, 12], [7, 18]]
const SY1 = 0.5            // vertical scene scale (data y ∈ [0,20] → scene [0,10])
const XMAX1 = 8
const toScene1 = (x, y) => new THREE.Vector3(x, y * SY1, 0)

// Least-squares optimum from the normal equations (AᵀA)x* = Aᵀb (computed below
// for the HUD; the book rounds it to m = 2.12, b = 2.33).
const M_STAR = 242 / 114   // 2.1228…
const B_STAR = 266 / 114   // 2.3333…

const LINE_PRESETS = [
  { label: 'Flat guess (m=0)',        p: { m: 0, b: 10 } },
  { label: 'Too steep',               p: { m: 3, b: 0 } },
  { label: 'Least-squares optimum ★', p: { m: M_STAR, b: B_STAR } },
]

function sqErr1(m, b) {
  return DATA1.reduce((s, [x, y]) => { const e = y - (m * x + b); return s + e * e }, 0)
}

function LineFitWidget() {
  const [target, setTarget] = useState(LINE_PRESETS[0].p)
  const [active, setActive] = useState(0)
  const shown = useAnimatedParams(target)
  const dyn = useRef([])

  const { containerRef, ctxRef } = useOrbitScene(
    scene => {
      scene.add(grid2D(XMAX1, 20 * SY1))
      scene.add(axisArrow([1, 0, 0], XMAX1 + 0.4, COL.x))
      scene.add(axisArrow([0, 1, 0], 20 * SY1 + 0.4, COL.y))
      scene.add(label('x', new THREE.Vector3(XMAX1 + 0.8, -0.3, 0), '#c92a2a'))
      scene.add(label('y', new THREE.Vector3(-0.5, 20 * SY1 + 0.8, 0), '#2b8a3e'))
      DATA1.forEach(([x, y]) => scene.add(sphere(toScene1(x, y), COL.z, 0.16)))
    },
    {
      target: [XMAX1 / 2, 20 * SY1 / 2, 0],
      camStart: { theta: 0, phi: Math.PI / 2, r: 14 },
      zoom: [8, 22], lockPolar: [1.2, 1.94],
    }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }
    const { m, b } = shown

    // The fitted line y = mx + b across the whole x-range.
    add(tube(toScene1(0, b), toScene1(XMAX1, m * XMAX1 + b), COL.line1, 0.05))

    // The error bars: vertical drop from each data point to the line.
    DATA1.forEach(([x, y]) => {
      const yhat = m * x + b
      if (Math.abs(y - yhat) > 0.04) add(tube(toScene1(x, y), toScene1(x, yhat), COL.line3, 0.045))
      add(sphere(toScene1(x, yhat), COL.line1, 0.09)) // the prediction on the line
    })
  }, [shown]) // eslint-disable-line react-hooks/exhaustive-deps

  const E = sqErr1(target.m, target.b)
  const Emin = sqErr1(M_STAR, B_STAR)
  const atOpt = Math.abs(target.m - M_STAR) < 1e-3 && Math.abs(target.b - B_STAR) < 1e-3
  const badge = atOpt
    ? { cls: 'badge-unique', txt: `★ least-squares line · ‖e‖² = ${fmt(E)} (the minimum)` }
    : { cls: 'badge-infinite', txt: `‖e‖² = ${fmt(E)} · ${fmt(E - Emin)} above the minimum` }

  function set(k, v) { setTarget(t => ({ ...t, [k]: v })); setActive(-1) }

  return (
    <div className="widget">
      <p className="widget-caption">
        The blue dots are five data points that <em>do not</em> lie on any line — so
        <InlineMath>{'\\;A\\mathbf{x}=b'}</InlineMath> has <strong>no exact solution</strong>. Each rose bar is an
        error <InlineMath>{'e_i = y_i - (mx_i + b)'}</InlineMath>; their squared lengths add up to
        <InlineMath>{'\\;\\lVert e\\rVert^2 = \\sum e_i^2'}</InlineMath>. Slide <InlineMath>{'m'}</InlineMath> and
        <InlineMath>{'\\;b'}</InlineMath> to shrink that total — the <strong>least-squares</strong> line is the one
        value that makes it as small as possible.
      </p>
      <p className="widget-instructions">drag to orbit · scroll to zoom · slide m, b — or hit the ★ preset to snap to the optimum</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq" style={{ color: '#ffb066' }}>ŷ = {fmt(target.m)}·x {target.b < 0 ? '−' : '+'} {fmt(Math.abs(target.b))}</div>
              <div className="hud-eq" style={{ color: '#ffa6c4' }}>Σeᵢ² = {fmt(E)}</div>
              <div className="hud-note">minimum possible ‖e‖² = {fmt(Emin)}</div>
            </div>
            <div className={`hud-badge ${badge.cls}`}>{badge.txt}</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {LINE_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${active === i ? 'active' : ''}`}
              onClick={() => { setTarget(pr.p); setActive(i) }}>{pr.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <div className="controls-label"><span className="swatch" style={{ background: '#e8590c' }} />Line parameters</div>
            <SliderRow label="slope m" k="m" value={target.m} onChange={set} min={0} max={4} step={0.02} />
            <SliderRow label="intercept b" k="b" value={target.b} onChange={set} min={-2} max={12} step={0.1} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — Regression is more than lines  (Grizzle Example 8.2)
//  Same normal-equations machinery fits a LINE or a PARABOLA to curved data.
//  Build the regressor matrix Φ, solve (ΦᵀΦ)α* = ΦᵀY, draw the fit + residuals.
// ════════════════════════════════════════════════════════════════════════════

const DATA2 = [
  [0, 1], [0.25, 1], [0.5, 1.5], [0.75, 2], [1, 3],
  [1.25, 4.25], [1.5, 5.5], [1.75, 7], [2, 10],
]
const SY2 = 0.7            // data y ∈ [0,10] → scene [0,7]
const XMAX2 = 2
const YMAX2 = 10
const toScene2 = (x, y) => new THREE.Vector3(x * 4, y * SY2, 0)  // x stretched ×4 to fill the canvas

// Fit a model of the given degree by the normal equations and return the
// coefficients, the predictor, det(ΦᵀΦ), and the total squared error.
function fitRegression(deg) {
  const phiRow = x => (deg === 1 ? [x, 1] : [1, x, x * x])
  const k = deg + 1
  const Phi = DATA2.map(([x]) => phiRow(x))
  const Y = DATA2.map(([, y]) => y)
  // ΦᵀΦ (k×k) and ΦᵀY (k)
  const ATA = Array.from({ length: k }, (_, i) =>
    Array.from({ length: k }, (_, j) => Phi.reduce((s, row) => s + row[i] * row[j], 0)))
  const ATb = Array.from({ length: k }, (_, i) => Phi.reduce((s, row, r) => s + row[i] * Y[r], 0))
  const alpha = solveLinear(ATA, ATb)
  const predict = deg === 1
    ? x => alpha[0] * x + alpha[1]
    : x => alpha[0] + alpha[1] * x + alpha[2] * x * x
  const det = deg === 1 ? det2(ATA[0][0], ATA[0][1], ATA[1][0], ATA[1][1]) : det3(ATA)
  const E = DATA2.reduce((s, [x, y]) => { const e = y - predict(x); return s + e * e }, 0)
  return { alpha, predict, det, E }
}

const FIT_LINE = fitRegression(1)
const FIT_QUAD = fitRegression(2)

function RegressionWidget() {
  const [deg, setDeg] = useState(1)
  const dyn = useRef([])
  const fit = deg === 1 ? FIT_LINE : FIT_QUAD

  const { containerRef, ctxRef } = useOrbitScene(
    scene => {
      scene.add(grid2D(XMAX2 * 4, YMAX2 * SY2))
      scene.add(axisArrow([1, 0, 0], XMAX2 * 4 + 0.4, COL.x))
      scene.add(axisArrow([0, 1, 0], YMAX2 * SY2 + 0.4, COL.y))
      scene.add(label('x', new THREE.Vector3(XMAX2 * 4 + 0.8, -0.3, 0), '#c92a2a'))
      scene.add(label('y', new THREE.Vector3(-0.5, YMAX2 * SY2 + 0.8, 0), '#2b8a3e'))
      DATA2.forEach(([x, y]) => scene.add(sphere(toScene2(x, y), COL.z, 0.15)))
    },
    {
      target: [XMAX2 * 4 / 2, YMAX2 * SY2 / 2, 0],
      camStart: { theta: 0, phi: Math.PI / 2, r: 13 },
      zoom: [8, 20], lockPolar: [1.2, 1.94],
    }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }

    // The fitted curve, sampled finely so the parabola reads smoothly.
    const N = 60
    for (let i = 0; i < N; i++) {
      const x0 = (i / N) * XMAX2, x1 = ((i + 1) / N) * XMAX2
      add(tube(toScene2(x0, fit.predict(x0)), toScene2(x1, fit.predict(x1)), COL.line1, 0.045))
    }
    // Residuals from each data point to the curve.
    DATA2.forEach(([x, y]) => {
      const yhat = fit.predict(x)
      if (Math.abs(y - yhat) > 0.03) add(tube(toScene2(x, y), toScene2(x, yhat), COL.line3, 0.04))
    })
  }, [deg]) // eslint-disable-line react-hooks/exhaustive-deps

  const coeffTxt = deg === 1
    ? `m = ${fmt(fit.alpha[0])},  b = ${fmt(fit.alpha[1])}`
    : `c₀ = ${fmt(fit.alpha[0])},  c₁ = ${fmt(fit.alpha[1])},  c₂ = ${fmt(fit.alpha[2])}`
  const badge = deg === 1
    ? { cls: 'badge-infinite', txt: `straight line · ‖e‖² = ${fmt(fit.E)} — it cannot bend to the data` }
    : { cls: 'badge-unique', txt: `parabola · ‖e‖² = ${fmt(fit.E)} — a far better fit` }

  return (
    <div className="widget">
      <p className="widget-caption">
        This data clearly <em>curves</em>. Yet "linear regression" still fits it — because the model
        <InlineMath>{'\\;\\hat y = c_0 + c_1 x + c_2 x^2'}</InlineMath> is <strong>linear in the unknown
        coefficients</strong> even though it is quadratic in <InlineMath>{'x'}</InlineMath>. Toggle the model: the
        <strong> exact same</strong> normal equations <InlineMath>{'(\\Phi^{\\top}\\Phi)\\,\\alpha^{*} = \\Phi^{\\top}Y'}</InlineMath>
        produce both fits. Only the columns of the regressor matrix <InlineMath>{'\\Phi'}</InlineMath> change.
      </p>
      <p className="widget-instructions">drag to orbit · scroll to zoom · switch between a line and a quadratic model</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq" style={{ color: '#ffb066' }}>{deg === 1 ? 'ŷ = m·x + b' : 'ŷ = c₀ + c₁·x + c₂·x²'}</div>
              <div className="hud-eq">{coeffTxt}</div>
              <div className="hud-note">det(ΦᵀΦ) = {fmt(fit.det)} ≠ 0 → columns independent</div>
            </div>
            <div className={`hud-badge ${badge.cls}`}>{badge.txt}</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          <button className={`preset-btn ${deg === 1 ? 'active' : ''}`} onClick={() => setDeg(1)}>Fit a line — Φ = [x  1]</button>
          <button className={`preset-btn ${deg === 2 ? 'active' : ''}`} onClick={() => setDeg(2)}>Fit a quadratic — Φ = [1  x  x²]</button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L10() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#e9f0ff', color: '#2563eb', borderColor: '#c9dbf6' }}>
          Module 2 · Lecture 10 · Grizzle Ch. 8
        </div>
        <h1 className="lesson-title">Euclidean Norm, Least-Squares Solutions &amp; Linear Regression</h1>
        <p className="lesson-subtitle">
          Real engineering data is noisy, so most systems <InlineMath>{'A\\mathbf{x}=b'}</InlineMath> have
          <strong> no exact solution</strong>. This chapter gives us a ruler — the <strong>Euclidean norm</strong> — to
          measure how badly a candidate <InlineMath>{'\\mathbf{x}'}</InlineMath> misses, then finds the
          <strong> best approximate solution</strong> by minimizing that miss. The payoff is one of the "super powers"
          of linear algebra: <strong>fitting functions to data</strong>.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Until now, solving <InlineMath>{'A\\mathbf{x}=b'}</InlineMath> meant making the error <em>exactly</em> zero.
            But suppose you measure the same quantity five times and try to fit a straight line: the measurements never
            line up perfectly, so there is no line that hits every point. The system is <strong>over-determined</strong>
            — more equations than unknowns — and <InlineMath>{'A\\mathbf{x}=b'}</InlineMath> has no solution at all.
          </p>
          <p>
            Giving up is not an option in engineering. Instead we change the question from "make the error zero" to
            "make the error <strong>as small as possible</strong>." To do that we first need to say what "small" means
            for a vector. A single number — its <strong>length</strong>, or <strong>norm</strong> — collapses the whole
            error vector <InlineMath>{'e = A\\mathbf{x}-b'}</InlineMath> into one quantity we can minimize.
          </p>
          <p>
            Picture the first widget's five dots. No straight line threads them all, but some lines are clearly better
            than others. The rose bars show how far the line misses each point; least squares is the recipe that makes
            the <em>total squared length</em> of those bars the smallest it can be. That single idea — <strong>minimize
            <InlineMath>{'\\;\\lVert A\\mathbf{x}-b\\rVert^2'}</InlineMath></strong> — is the engine behind curve
            fitting, sensor fusion, and the training of machine-learning models.
          </p>
        </div>
      </section>

      {/* ── Formalism: the norm ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · THE EUCLIDEAN NORM</span></h2>
        <div className="content-block">
          <p>
            The <strong>Euclidean norm</strong> assigns a length to a vector
            <InlineMath>{'\\;v = (v_1, \\dots, v_n) \\in \\mathbb{R}^n'}</InlineMath> by the Pythagorean rule:
          </p>
          <DisplayMath>{String.raw`\lVert v \rVert := \sqrt{v_1^2 + v_2^2 + \cdots + v_n^2}.`}</DisplayMath>
          <p>
            For <InlineMath>{String.raw`v = (\sqrt{2}, -1, 5)`}</InlineMath>, for instance,
            <InlineMath>{String.raw`\;\lVert v\rVert = \sqrt{2 + 1 + 25} = \sqrt{28} = 2\sqrt{7} \approx 5.29.`}</InlineMath>
            Every norm — and there are many notions of "length" — obeys three properties:
          </p>
          <div className="callout">
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li><strong>Positivity:</strong> <InlineMath>{'\\lVert v\\rVert \\ge 0'}</InlineMath>, and <InlineMath>{'\\lVert v\\rVert = 0 \\iff v = 0'}</InlineMath>.</li>
              <li><strong>Scaling:</strong> <InlineMath>{'\\lVert \\alpha v\\rVert = |\\alpha|\\,\\lVert v\\rVert'}</InlineMath> — note the <em>absolute value</em>, since <InlineMath>{'\\sqrt{a^2} = |a|'}</InlineMath>.</li>
              <li><strong>Triangle inequality:</strong> <InlineMath>{'\\lVert v + w\\rVert \\le \\lVert v\\rVert + \\lVert w\\rVert'}</InlineMath>.</li>
            </ul>
          </div>
          <p>
            The triangle inequality says a detour through <InlineMath>{'v'}</InlineMath> then
            <InlineMath>{'\\;w'}</InlineMath> is never shorter than going straight. A minus sign changes nothing:
            <InlineMath>{'\\;\\lVert v - w\\rVert = \\lVert v + (-w)\\rVert \\le \\lVert v\\rVert + \\lVert -w\\rVert = \\lVert v\\rVert + \\lVert w\\rVert'}</InlineMath>,
            because <InlineMath>{'\\lVert -w\\rVert = |-1|\\,\\lVert w\\rVert = \\lVert w\\rVert'}</InlineMath>.
          </p>
        </div>
      </section>

      {/* ── Formalism: least squares ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · LEAST-SQUARED-ERROR SOLUTIONS</span></h2>
        <div className="content-block">
          <p>
            Take a system <InlineMath>{'A\\mathbf{x}=b'}</InlineMath> with <InlineMath>{'A'}</InlineMath> of size
            <InlineMath>{'\\;n\\times m'}</InlineMath> (think <strong>tall</strong>: <InlineMath>{'n > m'}</InlineMath>,
            more equations than unknowns). Define the <strong>error</strong> as a function of the candidate
            <InlineMath>{'\\;\\mathbf{x}'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`e(\mathbf{x}) := A\mathbf{x} - b.`}</DisplayMath>
          <p>
            Rather than the norm itself we minimize the <strong>squared</strong> norm — it drops the awkward square
            root and, written with the transpose, becomes a clean quadratic:
          </p>
          <DisplayMath>{String.raw`\lVert e(\mathbf{x})\rVert^2 = \sum_{i=1}^{n} e_i^2 = e(\mathbf{x})^{\top} e(\mathbf{x}) = (A\mathbf{x}-b)^{\top}(A\mathbf{x}-b).`}</DisplayMath>
          <p>
            A vector <InlineMath>{'\\mathbf{x}^{*}'}</InlineMath> is a <strong>least-squared-error solution</strong> if
            it achieves the smallest possible value of this quantity:
          </p>
          <DisplayMath>{String.raw`\mathbf{x}^{*} := \operatorname*{arg\,min}_{\mathbf{x}\in\mathbb{R}^m} \lVert A\mathbf{x} - b\rVert^2.`}</DisplayMath>
          <p>
            If <InlineMath>{'A\\mathbf{x}=b'}</InlineMath> happens to have an exact solution, then the minimum is
            <InlineMath>{'\\;0'}</InlineMath> and <InlineMath>{'\\mathbf{x}^{*}'}</InlineMath> is that exact solution —
            so this is a genuine <em>generalization</em> of solving linear equations, not a different topic.
          </p>
          <div className="callout callout-success">
            <strong>The Normal Equations.</strong> Multiply <InlineMath>{'A\\mathbf{x}=b'}</InlineMath> on the left by
            <InlineMath>{'\\;A^{\\top}'}</InlineMath>. The matrix <InlineMath>{'A^{\\top}A'}</InlineMath> is square
            (<InlineMath>{'m\\times m'}</InlineMath>) and symmetric (<InlineMath>{'(A^{\\top}A)^{\\top} = A^{\\top}A'}</InlineMath>).
            <strong> It is invertible if and only if the columns of <InlineMath>{'A'}</InlineMath> are linearly
            independent</strong>, and then the unique least-squares solution satisfies
            <DisplayMath>{String.raw`\boxed{\,(A^{\top}A)\,\mathbf{x}^{*} = A^{\top} b\,} \qquad\Longleftrightarrow\qquad \mathbf{x}^{*} = (A^{\top}A)^{-1} A^{\top} b.`}</DisplayMath>
          </div>
          <p>
            For large systems your instructors insist you <em>solve</em> the boxed equation (with LU, forward/back
            substitution) rather than form the inverse <InlineMath>{'(A^{\\top}A)^{-1}'}</InlineMath>. The inverse is a
            blackboard convenience, not a computational one.
          </p>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · MINIMIZING THE SQUARED ERROR</span></h2>
        <LineFitWidget />
      </section>

      {/* ── Worked example 8.1 ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · GRIZZLE 8.1</span></h2>
        <div className="content-block">
          <p>
            Five equations, two unknowns — the columns of <InlineMath>{'A'}</InlineMath> are independent, but there are
            too many conditions for an exact solution:
          </p>
          <DisplayMath>{String.raw`\underbrace{\begin{bmatrix} 1 & 1 \\ 2 & 1 \\ 4 & 1 \\ 5 & 1 \\ 7 & 1 \end{bmatrix}}_{A} \begin{bmatrix} x_1 \\ x_2 \end{bmatrix} = \underbrace{\begin{bmatrix} 4 \\ 8 \\ 10 \\ 12 \\ 18 \end{bmatrix}}_{b}.`}</DisplayMath>
          <p>Form the normal equations. The little <InlineMath>{'2\\times2'}</InlineMath> system is easy to solve by hand:</p>
          <DisplayMath>{String.raw`A^{\top}A = \begin{bmatrix} 95 & 19 \\ 19 & 5 \end{bmatrix}, \quad A^{\top}b = \begin{bmatrix} 246 \\ 52 \end{bmatrix}, \quad \det(A^{\top}A) = 114 \ne 0.`}</DisplayMath>
          <DisplayMath>{String.raw`\mathbf{x}^{*} = (A^{\top}A)^{-1}A^{\top}b = \begin{bmatrix} 2.12 \\ 2.33 \end{bmatrix} \;\Longrightarrow\; \hat y = 2.12\,x + 2.33.`}</DisplayMath>
          <p>
            Now check the error. Plugging <InlineMath>{'\\mathbf{x}^{*}'}</InlineMath> back in gives a non-zero residual,
            so we have <em>confirmed</em> there is no exact solution — only a best one:
          </p>
          <DisplayMath>{String.raw`e^{*} = A\mathbf{x}^{*} - b = \begin{bmatrix} 0.456 \\ -1.421 \\ 0.825 \\ 0.947 \\ -0.807 \end{bmatrix}, \quad \lVert e^{*}\rVert \approx 2.111, \quad \lVert e^{*}\rVert^2 \approx 4.456.`}</DisplayMath>
          <p>
            This is exactly the line the ★ preset snaps to in the widget above — and the value
            <InlineMath>{'\\;4.456'}</InlineMath> is the minimum the HUD reports. Any other
            <InlineMath>{'\\;(m,b)'}</InlineMath> gives a strictly larger squared error.
          </p>
        </div>
      </section>

      {/* ── Formalism: regression ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · LINEAR REGRESSION (FITTING FUNCTIONS TO DATA)</span></h2>
        <div className="content-block">
          <p>
            Example 8.1 was secretly <strong>fitting a line to data</strong>. Let's name the pieces. Given data
            <InlineMath>{'\\;(x_i, y_i)'}</InlineMath> for <InlineMath>{'i = 1,\\dots,N'}</InlineMath>, propose a model
            <InlineMath>{'\\;\\hat y = m x + b'}</InlineMath>. Each data point demands
            <InlineMath>{'\\;y_i = \\begin{bmatrix} x_i & 1\\end{bmatrix}\\begin{bmatrix} m \\\\ b\\end{bmatrix}'}</InlineMath>,
            and stacking all <InlineMath>{'N'}</InlineMath> of them gives <InlineMath>{'\\;Y = \\Phi\\,\\alpha'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`\underbrace{\begin{bmatrix} y_1 \\ y_2 \\ \vdots \\ y_N \end{bmatrix}}_{Y} = \underbrace{\begin{bmatrix} x_1 & 1 \\ x_2 & 1 \\ \vdots & \vdots \\ x_N & 1 \end{bmatrix}}_{\Phi} \underbrace{\begin{bmatrix} m \\ b \end{bmatrix}}_{\alpha}.`}</DisplayMath>
          <p>
            Here <InlineMath>{'\\Phi'}</InlineMath> is the <strong>regressor matrix</strong> and
            <InlineMath>{'\\;\\alpha'}</InlineMath> the vector of <strong>unknown coefficients</strong>. The fitting error
            is <InlineMath>{'\\;e = Y - \\Phi\\alpha'}</InlineMath>, and we choose <InlineMath>{'\\alpha'}</InlineMath> to
            minimize <InlineMath>{'\\;E_{\\text{tot}} = \\lVert Y - \\Phi\\alpha\\rVert^2'}</InlineMath>. This is
            <em> identical</em> to the least-squares problem above, so the answer is the normal equations again:
          </p>
          <div className="callout callout-success">
            <DisplayMath>{String.raw`\alpha^{*} = (\Phi^{\top}\Phi)^{-1}\Phi^{\top}Y \;\Longleftrightarrow\; \alpha^{*} = \operatorname*{arg\,min}_{\alpha}\lVert Y - \Phi\alpha\rVert^2 \;\Longleftrightarrow\; (\Phi^{\top}\Phi)\,\alpha^{*} = \Phi^{\top}Y.`}</DisplayMath>
          </div>
          <p>
            The crucial freedom: the columns of <InlineMath>{'\\Phi'}</InlineMath> can be <em>any</em> functions of the
            data. Use columns <InlineMath>{'\\;\\begin{bmatrix} 1 & x & x^2\\end{bmatrix}'}</InlineMath> and you fit a
            <strong> parabola</strong> <InlineMath>{'\\;\\hat y = c_0 + c_1 x + c_2 x^2'}</InlineMath>. The model is
            nonlinear in <InlineMath>{'x'}</InlineMath>, yet still <strong>linear in the coefficients</strong>
            <InlineMath>{'\\;c_0,c_1,c_2'}</InlineMath> — which is all the normal equations require. That is why this is
            still called <em>linear</em> regression.
          </p>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · LINE vs. PARABOLA — SAME MACHINERY</span></h2>
        <RegressionWidget />
      </section>

      {/* ── Worked example 8.2 ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · GRIZZLE 8.2 (QUADRATIC FIT)</span></h2>
        <div className="content-block">
          <p>
            The nine points in the second widget visibly curve, so a line fits poorly. Choose the quadratic model
            <InlineMath>{'\\;\\hat y = c_0 + c_1 x + c_2 x^2'}</InlineMath> and build the regressor matrix one row per
            data point:
          </p>
          <DisplayMath>{String.raw`\underbrace{\begin{bmatrix} y_1 \\ \vdots \\ y_N \end{bmatrix}}_{Y} = \underbrace{\begin{bmatrix} 1 & x_1 & x_1^2 \\ \vdots & \vdots & \vdots \\ 1 & x_N & x_N^2 \end{bmatrix}}_{\Phi} \underbrace{\begin{bmatrix} c_0 \\ c_1 \\ c_2 \end{bmatrix}}_{\alpha}.`}</DisplayMath>
          <p>
            For this data <InlineMath>{'\\;\\det(\\Phi^{\\top}\\Phi) = 40.6 \\ne 0'}</InlineMath>, so the columns are
            independent and the solution is unique. Solving
            <InlineMath>{'\\;(\\Phi^{\\top}\\Phi)\\alpha^{*} = \\Phi^{\\top}Y'}</InlineMath> yields the coefficients shown
            live in the widget's HUD, and the resulting parabola tracks the data far more closely than the line — its
            total squared error drops dramatically. Switch the toggle to compare the two
            <InlineMath>{'\\;\\lVert e\\rVert^2'}</InlineMath> readouts side by side.
          </p>
          <div className="callout callout-warning">
            <strong>This is supervised machine learning.</strong> In Project 2 you split the data: fit on one part, then
            test the fit on a part the algorithm never saw. A model that nails the training data but fails the held-out
            data has <em>over-fit</em>. Choosing the right columns of <InlineMath>{'\\Phi'}</InlineMath> — the right
            <em> features</em> — is exactly what "training a model" means in modern ML.
          </div>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <p>
            Where does the boxed normal equation come from? It is <strong>completing the square</strong> — the same
            high-school trick behind the quadratic formula, lifted to matrices. Expanding
            <InlineMath>{'\\;\\lVert A\\mathbf{x}-b\\rVert^2 = \\mathbf{x}^{\\top}A^{\\top}A\\,\\mathbf{x} - \\mathbf{x}^{\\top}A^{\\top}b - b^{\\top}A\\mathbf{x} + b^{\\top}b'}</InlineMath>
            and completing the square shows the minimizer is exactly where
            <InlineMath>{'\\;A^{\\top}A\\mathbf{x}^{*} = A^{\\top}b'}</InlineMath>. (Grizzle works this out in full as an
            optional read.)
          </p>
          <p>
            For <strong>large-scale</strong> least squares, the recommended pipeline never inverts: factor
            <InlineMath>{'\\;P(\\Phi^{\\top}\\Phi) = LU'}</InlineMath>, compute
            <InlineMath>{'\\;\\bar b = P\\Phi^{\\top}Y'}</InlineMath>, then forward-solve
            <InlineMath>{'\\;Ly = \\bar b'}</InlineMath> and back-solve
            <InlineMath>{'\\;U\\alpha^{*} = y'}</InlineMath> — every tool from Module 1, reused. There is an even more
            numerically stable route: the <strong>QR factorization</strong>, the subject of an upcoming lecture, which
            avoids forming <InlineMath>{'A^{\\top}A'}</InlineMath> altogether. First, though, we need the
            <strong> dot product</strong> and <strong>orthogonality</strong> — the geometry hiding inside
            <InlineMath>{'\\;A^{\\top}A'}</InlineMath>.
          </p>
        </div>
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span></h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🌊</div>
              <h3>NOAA Tide Regression</h3>
              <p>
                We can fit sinusoidal models to years of tide-gauge data by least squares. The columns of
                <InlineMath>{'\\;\\Phi'}</InlineMath> are sines and cosines of known periods; the fitted
                <InlineMath>{'\\;\\alpha^{*}'}</InlineMath> predicts tides months ahead.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🛰️</div>
              <h3>Sensor Fusion</h3>
              <p>
                Combining redundant, noisy sensors gives more equations than unknowns. No exact state satisfies them
                all, so the estimator returns <InlineMath>{'\\mathbf{x}^{*} = (A^{\\top}A)^{-1}A^{\\top}b'}</InlineMath>
                — the state that best reconciles every measurement.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🤖</div>
              <h3>Model Identification</h3>
              <p>
                To learn a robot's mass and friction parameters, you drive it, log torques and motions, and regress.
                The parameters are linear in the dynamics, so least squares recovers them from one over-determined
                <InlineMath>{'\\;\\Phi\\alpha = Y'}</InlineMath>.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧠</div>
              <h3>Training ML Models</h3>
              <p>
                Linear/polynomial regression is the simplest supervised learner. Minimizing
                <InlineMath>{'\\;\\lVert Y - \\Phi\\alpha\\rVert^2'}</InlineMath> is the same loss a neural network
                minimizes — only the feature map <InlineMath>{'\\Phi'}</InlineMath> gets richer.
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
            num={1} type="Computational"
            question="What is the Euclidean norm of v = (√2, −1, 5)?"
            options={[
              '√28 = 2√7 ≈ 5.29',
              '√6 ≈ 2.45',
              '8 (just add the entries)',
              '√26 ≈ 5.10',
            ]}
            correct={0}
            explanation="‖v‖ = √((√2)² + (−1)² + 5²) = √(2 + 1 + 25) = √28 = √(4·7) = 2√7 ≈ 5.29. You square each component (the minus sign disappears), add, and take the square root."
          />
          <QuizQ
            num={2} type="Geometric"
            question="In the line-fit widget, why can't the rose error bars all be made zero at once?"
            options={[
              'Because the slope slider has a limited range',
              'Because the five data points are not collinear, so no single line passes through all of them — Ax = b has no exact solution',
              'Because the Euclidean norm is always positive',
              'Because b is the zero vector',
            ]}
            correct={1}
            explanation="The five points don't lie on a common line, so the over-determined system Ax = b has no exact solution. No (m,b) zeroes every residual; least squares instead minimizes the SUM of their squares, leaving a nonzero minimum (here ‖e‖² ≈ 4.456)."
          />
          <QuizQ
            num={3} type="Transfer"
            question="A is a tall n×m matrix (n > m) with linearly independent columns. The least-squares solution of Ax = b satisfies:"
            options={[
              'A⁻¹b — just invert A',
              '(AᵀA) x* = Aᵀb, the normal equations (and AᵀA is invertible because the columns are independent)',
              'Ax = 0',
              'There is no solution because A is not square',
            ]}
            correct={1}
            explanation="A tall A has no inverse, but AᵀA is square (m×m), symmetric, and invertible exactly when A's columns are independent. Multiplying Ax = b by Aᵀ gives the normal equations (AᵀA)x* = Aᵀb, whose unique solution minimizes ‖Ax − b‖²."
          />
          <QuizQ
            num={4} type="Conceptual"
            question="Fitting ŷ = c₀ + c₁x + c₂x² to data is still called LINEAR regression. Why?"
            options={[
              'Because the data happens to lie on a line',
              'Because the model is linear in the unknown coefficients c₀, c₁, c₂ — the regressor columns 1, x, x² are just known numbers per data point',
              'Because x² is small enough to ignore',
              'It is a mistake — that is quadratic regression, a different method',
            ]}
            correct={1}
            explanation="'Linear' refers to the coefficients, not x. Writing Y = Φα with Φ = [1  x  x²], the unknowns α = (c₀,c₁,c₂) enter linearly, so the same normal equations (ΦᵀΦ)α* = ΦᵀY solve it. The columns of Φ may be any fixed functions of the data — that is the power of the method."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>Write the Euclidean norm formula and the three norm properties from memory; state the normal equations (AᵀA)x* = Aᵀb and why AᵀA is invertible iff A's columns are independent.</div>
            <div className="review-item"><span className="review-day">Day 1</span>Answer: (a) compute ‖(3,−4)‖. (b) If Ax = b already has an exact solution, what is min‖Ax−b‖²?</div>
            <div className="review-item"><span className="review-day">Day 3</span>Redo Grizzle 8.1 without notes: form AᵀA = [[95,19],[19,5]], Aᵀb = [246,52], solve for x* = (2.12, 2.33).</div>
            <div className="review-item"><span className="review-day">Day 7</span>Explain why fitting a parabola is "linear" regression, and write the regressor matrix Φ for ŷ = c₀ + c₁x + c₂x².</div>
            <div className="review-item"><span className="review-day">Day 14</span>Explain least squares to a friend using only the line-fit widget — no formulas, just the shrinking error bars.</div>
          </div>
        </div>
      </section>

    </div>
  )
}
