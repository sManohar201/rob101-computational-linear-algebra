import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { useOrbitScene } from '../shared/useOrbitScene.js'
import { fmt, QuizQ } from '../shared/ui.jsx'
import {
  COL, tube, sphere, axisArrow, label, disposeObject,
} from '../shared/three-helpers.js'

// ─── tiny dense kernels (column-oriented) ────────────────────────────────────
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm = a => Math.sqrt(dot(a, a))
const f3 = n => { const r = Math.round(n * 1000) / 1000; return (Object.is(r, -0) ? 0 : r).toFixed(3) }

// QR by classical Gram-Schmidt on the columns of A (stored as rows).
// Returns Q and R as row-major matrices with A = Q·R, QᵀQ = I, R upper-triangular.
function qrFactor(A) {
  const n = A.length, m = A[0].length
  const cols = Array.from({ length: m }, (_, j) => A.map(r => r[j]))
  const V = [] // orthogonal (un-normalized)
  cols.forEach(u => {
    let v = [...u]
    V.forEach(vi => { const c = dot(u, vi) / dot(vi, vi); v = v.map((x, i) => x - c * vi[i]) })
    V.push(v)
  })
  const Qcols = V.map(v => { const nv = norm(v); return v.map(x => x / nv) })
  // R = Qᵀ A  (m×m)
  const R = Array.from({ length: m }, (_, i) =>
    Array.from({ length: m }, (_, j) => dot(Qcols[i], cols[j])))
  const Q = Array.from({ length: n }, (_, r) => Qcols.map(c => c[r])) // row-major
  return { Q, R }
}
const matVecT = (Q, b) => Q[0].map((_, j) => b.reduce((s, bi, i) => s + Q[i][j] * bi, 0)) // Qᵀb
function backSub(R, y) {
  const m = R.length, x = new Array(m).fill(0)
  for (let i = m - 1; i >= 0; i--) {
    let s = y[i]
    for (let j = i + 1; j < m; j++) s -= R[i][j] * x[j]
    x[i] = s / R[i][i]
  }
  return x
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — The QR pipeline solver  (Grizzle Ex. 9.19–9.20)
//  Step through factor A = QR, form b̄ = Qᵀb, then back-substitute Rx = b̄.
//  A DOM widget: the value is in seeing the three numeric stages, not geometry.
// ════════════════════════════════════════════════════════════════════════════

const QR_PRESETS = [
  { label: 'Grizzle Ex. 9.20', A: [[1, 1, 0], [1, 2, 1], [0, 3, 1]], b: [1, 4, 7] },
  { label: 'Identity-ish (easy)', A: [[2, 0, 0], [0, 3, 0], [0, 0, 1]], b: [4, 9, 2] },
  { label: 'Skewed columns', A: [[1, 1, 1], [0, 1, 1], [0, 0, 1]], b: [6, 5, 3] },
]

function Mat({ M, accent }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'stretch', gap: 4, fontFamily: 'monospace', fontSize: 12.5 }}>
      <span style={{ borderLeft: `2px solid ${accent || '#94a3b8'}`, borderTop: `2px solid ${accent || '#94a3b8'}`, borderBottom: `2px solid ${accent || '#94a3b8'}`, width: 5 }} />
      <div>
        {M.map((row, i) => (
          <div key={i} style={{ whiteSpace: 'pre' }}>{row.map((x, j) => <span key={j} style={{ display: 'inline-block', width: 64, textAlign: 'right' }}>{f3(x)}</span>)}</div>
        ))}
      </div>
      <span style={{ borderRight: `2px solid ${accent || '#94a3b8'}`, borderTop: `2px solid ${accent || '#94a3b8'}`, borderBottom: `2px solid ${accent || '#94a3b8'}`, width: 5 }} />
    </div>
  )
}

function QRWidget() {
  const [idx, setIdx] = useState(0)
  const [step, setStep] = useState(1)
  const { A, b } = QR_PRESETS[idx]
  const { Q, R } = qrFactor(A)
  const bbar = matVecT(Q, b)
  const x = backSub(R, bbar)
  const STEPS = ['Factor A = Q·R', 'Form b̄ = Qᵀb', 'Back-solve Rx = b̄']

  return (
    <div className="widget">
      <p className="widget-caption">
        The recommended way to solve <InlineMath>{'Ax = b'}</InlineMath> never inverts anything. Factor
        <InlineMath>{'\\;A = QR'}</InlineMath> with <InlineMath>{'Q'}</InlineMath> orthonormal and
        <InlineMath>{'\\;R'}</InlineMath> upper-triangular; then <InlineMath>{'\\;Ax = b'}</InlineMath> becomes
        <InlineMath>{'\\;QRx = b \\Rightarrow Rx = Q^{\\top}b'}</InlineMath> — one cheap matrix–vector product and one
        back-substitution. Step through the three stages of the pipeline.
      </p>
      <p className="widget-instructions">pick a system · advance through factor → b̄ → back-substitution</p>
      <div className="widget-card">
        <div style={{ padding: '18px 20px', background: '#0f1729', borderRadius: 10, color: '#dbe4f3' }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
            <span>A =</span><Mat M={A} accent="#5c6b85" />
            <span>b =</span><Mat M={b.map(v => [v])} accent="#5c6b85" />
          </div>

          {step >= 1 && (
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14, opacity: step === 1 ? 1 : 0.85 }}>
              <span style={{ color: '#4dabf7' }}>Q =</span><Mat M={Q} accent="#1c7ed6" />
              <span style={{ color: '#ff922b' }}>R =</span><Mat M={R} accent="#e8590c" />
              <span style={{ color: '#9aa7bd', fontSize: 11 }}>QᵀQ = I, R upper-triangular ✓</span>
            </div>
          )}
          {step >= 2 && (
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ color: '#69db7c' }}>b̄ = Qᵀb =</span><Mat M={bbar.map(v => [v])} accent="#2f9e44" />
            </div>
          )}
          {step >= 3 && (
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: '#ffd43b' }}>solve Rx = b̄ →&nbsp; x =</span><Mat M={x.map(v => [v])} accent="#f59f00" />
              <span style={{ color: '#9aa7bd', fontSize: 11 }}>back-substitution, no inverse formed ✓</span>
            </div>
          )}
        </div>
        <div className="preset-bar">
          {QR_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`}
              onClick={() => { setIdx(i); setStep(1) }}>{pr.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <div className="controls-label">Pipeline step: {STEPS[step - 1]}</div>
            <div className="preset-bar" style={{ marginTop: 0 }}>
              <button className="preset-btn" disabled={step === 1} onClick={() => setStep(s => Math.max(1, s - 1))}>‹ back</button>
              {[1, 2, 3].map(s => (
                <button key={s} className={`preset-btn ${step === s ? 'active' : ''}`} onClick={() => setStep(s)}>{s}</button>
              ))}
              <button className="preset-btn" disabled={step === 3} onClick={() => setStep(s => Math.min(3, s + 1))}>next ›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — Steering a mobile robot  (Grizzle §9.10, an underdetermined system)
//  pₖ₊₁ = A pₖ + B uₖ.  With u = 0 the robot spirals like a wandering Roomba.
//  To reach the origin in N steps we solve the underdetermined Muₛₑ𝓆 = pₙ − Sp₀
//  for the MINIMUM-NORM control (least battery effort) and watch it glide home.
// ════════════════════════════════════════════════════════════════════════════

// model from the book: δt = 0.1
const DT = 0.1
const Amat = [[1, -0.5 * DT], [0.5 * DT, 1]]
const Bmat = [[DT, 0], [0, DT]]
const P0 = [1, 1]
const SC = 1.6 // display scale

const mmul = (X, Y) => [
  [X[0][0] * Y[0][0] + X[0][1] * Y[1][0], X[0][0] * Y[0][1] + X[0][1] * Y[1][1]],
  [X[1][0] * Y[0][0] + X[1][1] * Y[1][0], X[1][0] * Y[0][1] + X[1][1] * Y[1][1]],
]
const mvec = (X, v) => [X[0][0] * v[0] + X[0][1] * v[1], X[1][0] * v[0] + X[1][1] * v[1]]
const mT = X => [[X[0][0], X[1][0]], [X[0][1], X[1][1]]]
const solve2 = (M, r) => {
  const det = M[0][0] * M[1][1] - M[0][1] * M[1][0]
  return [(r[0] * M[1][1] - r[1] * M[0][1]) / det, (r[1] * M[0][0] - r[0] * M[1][0]) / det]
}

// minimum-norm control sequence steering P0 → origin in N steps, plus the path
function steer(N, displaySteps) {
  const P = [[[1, 0], [0, 1]]]
  for (let k = 1; k <= N; k++) P.push(mmul(Amat, P[k - 1]))
  // MMᵀ = Σ_{i=0}^{N-1} (Aⁱ B)(Aⁱ B)ᵀ   (2×2)
  let MMt = [[0, 0], [0, 0]]
  for (let i = 0; i < N; i++) {
    const AiB = mmul(P[i], Bmat)
    const t = mmul(AiB, mT(AiB))
    MMt = [[MMt[0][0] + t[0][0], MMt[0][1] + t[0][1]], [MMt[1][0] + t[1][0], MMt[1][1] + t[1][1]]]
  }
  const r = mvec(P[N], P0).map(v => -v) // pₙ − Sp₀ = 0 − A^N p₀
  const y = solve2(MMt, r)
  // u_seq = [u₀…u_{N-1}], block for uᵢ is A^{N-1-i}B ⇒ uᵢ = (A^{N-1-i}B)ᵀ y
  const u = []
  for (let i = 0; i < N; i++) u.push(mvec(mT(mmul(P[N - 1 - i], Bmat)), y))
  const effort = u.reduce((s, uk) => s + uk[0] * uk[0] + uk[1] * uk[1], 0)
  // simulate the path
  const pts = [P0]
  let p = P0
  for (let k = 0; k < (displaySteps ?? N); k++) {
    p = mvec(Amat, p)
    if (k < u.length) p = [p[0] + Bmat[0][0] * u[k][0], p[1] + Bmat[1][1] * u[k][1]]
    pts.push(p)
  }
  return { pts, effort, final: pts[pts.length - 1] }
}

function wander(steps) {
  const pts = [P0]; let p = P0
  for (let k = 0; k < steps; k++) { p = mvec(Amat, p); pts.push(p) }
  return { pts, effort: 0, final: pts[pts.length - 1] }
}

const ROBOT_PRESETS = [
  { label: 'Wander (u = 0) — 20 s', kind: 'wander', steps: 200 },
  { label: 'Steer to origin in 2 s (N = 20)', kind: 'steer', N: 20 },
  { label: 'Steer hard in 0.1 s (N = 1)', kind: 'steer', N: 1 },
]

function polyline(points, color) {
  const geo = new THREE.BufferGeometry().setFromPoints(points)
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 }))
}

function RobotWidget() {
  const [idx, setIdx] = useState(0)
  const dyn = useRef([])
  const pr = ROBOT_PRESETS[idx]
  const sim = pr.kind === 'wander' ? wander(pr.steps) : steer(pr.N)

  const { containerRef, ctxRef } = useOrbitScene(
    scene => {
      const half = 4
      const pts = []
      for (let i = -half; i <= half + 1e-6; i++) {
        pts.push(new THREE.Vector3(-half, i, 0), new THREE.Vector3(half, i, 0))
        pts.push(new THREE.Vector3(i, -half, 0), new THREE.Vector3(i, half, 0))
      }
      scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x9fb0c9, transparent: true, opacity: 0.4 })))
      scene.add(axisArrow([1, 0, 0], half + 0.3, COL.x))
      scene.add(axisArrow([0, 1, 0], half + 0.3, COL.y))
      scene.add(label('pˣ', new THREE.Vector3(half + 0.6, -0.4, 0), '#c92a2a'))
      scene.add(label('pʸ', new THREE.Vector3(-0.5, half + 0.6, 0), '#2b8a3e'))
      // origin target ring
      scene.add(sphere(new THREE.Vector3(0, 0, 0), COL.line3, 0.13))
    },
    {
      target: [0, 0, 0], camStart: { theta: 0, phi: Math.PI / 2, r: 16 },
      zoom: [9, 26], lockPolar: [1.2, 1.94],
    }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }
    const P = sim.pts.map(p => new THREE.Vector3(p[0] * SC, p[1] * SC, 0))

    add(polyline(P, COL.line1))
    // dots along the path so the discrete steps read (sparser for the long wander)
    const stride = P.length > 60 ? 8 : 1
    for (let i = 0; i < P.length; i += stride) add(sphere(P[i], COL.line1, 0.05))
    // start (green) and final (teal/rose) markers
    add(sphere(P[0], COL.point, 0.16))
    add(label('start', P[0].clone().add(new THREE.Vector3(0.3, 0.3, 0)), '#0c8599', 0.4))
    const reached = norm(sim.final) < 1e-3
    add(sphere(P[P.length - 1], reached ? COL.point : COL.line3, 0.14))
  }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  const reached = norm(sim.final) < 1e-3
  const badge = pr.kind === 'wander'
    ? { cls: 'badge-infinite', txt: 'no control → wanders outward like a Roomba' }
    : reached
      ? { cls: 'badge-unique', txt: `✓ reached origin · control effort ‖u‖² = ${fmt(sim.effort)}` }
      : { cls: 'badge-none', txt: 'did not reach origin' }

  return (
    <div className="widget">
      <p className="widget-caption">
        A mobile robot's state <InlineMath>{'p_k\\in\\mathbb{R}^2'}</InlineMath> evolves by
        <InlineMath>{'\\;p_{k+1} = A p_k + B u_k'}</InlineMath>. With <strong>no control</strong> it spirals outward like
        a lost Roomba. To <strong>steer it to the origin</strong> in <InlineMath>{'N'}</InlineMath> steps we must hit one
        target with <InlineMath>{'\\;2N'}</InlineMath> control knobs — a wildly <strong>underdetermined</strong> system.
        Among the infinitely many solutions we pick the <strong>minimum-norm</strong> one: the least total motor effort
        <InlineMath>{'\\;\\lVert u_{\\text{seq}}\\rVert^2'}</InlineMath>. Fewer steps cost dramatically more effort.
      </p>
      <p className="widget-instructions">drag to orbit · scroll to zoom · compare wandering vs. minimum-effort steering</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq" style={{ color: '#ffb066' }}>p₀ = (1, 1) → target (0, 0)</div>
              <div className="hud-eq">{pr.kind === 'wander' ? 'control u ≡ 0' : `N = ${pr.N} steps · 2N = ${pr.N * 2} unknowns`}</div>
              {pr.kind === 'steer' && <div className="hud-note">min-norm effort ‖u‖² = {fmt(sim.effort)}</div>}
              <div className="hud-note">final distance to origin = {fmt(norm(sim.final))}</div>
            </div>
            <div className={`hud-badge ${badge.cls}`}>{badge.txt}</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {ROBOT_PRESETS.map((p, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`}
              onClick={() => setIdx(i)}>{p.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L13() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#e9f0ff', color: '#2563eb', borderColor: '#c9dbf6' }}>
          Module 2 · Lecture 13 · Grizzle Ch. 9 §9.8–9.10
        </div>
        <h1 className="lesson-title">The QR Factorization &amp; Solving Linear Equations</h1>
        <p className="lesson-subtitle">
          Run Gram–Schmidt on the columns of <InlineMath>{'A'}</InlineMath> and you get the
          <strong> QR factorization</strong> <InlineMath>{'\\;A = QR'}</InlineMath> — the most numerically robust way to
          solve <InlineMath>{'\\;Ax = b'}</InlineMath>. The same pipeline handles <strong>least squares</strong> when the
          system is over-determined and <strong>minimum-norm</strong> solutions when it is under-determined — the math
          behind steering a robot home on the least battery.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            We already own two solvers for <InlineMath>{'Ax = b'}</InlineMath>: LU (Gaussian elimination, fast) and the
            normal equations (for least squares). QR adds a third that is the gold standard for accuracy. The idea is
            disarmingly simple: replace the skewed columns of <InlineMath>{'A'}</InlineMath> with a clean
            <strong> orthonormal</strong> set <InlineMath>{'Q'}</InlineMath>, and record how to rebuild the originals in a
            triangular bookkeeping matrix <InlineMath>{'R'}</InlineMath>.
          </p>
          <p>
            Once <InlineMath>{'A = QR'}</InlineMath>, solving is almost free. The orthonormal part inverts by a mere
            transpose (<InlineMath>{'Q^{-1} = Q^{\\top}'}</InlineMath>), and the triangular part falls to
            back-substitution — the very first tool from Module 1. No determinants, no explicit inverse, and far less
            sensitivity to round-off than forming <InlineMath>{'\\;A^{\\top}A'}</InlineMath>.
          </p>
          <p>
            The same factorization is a Swiss-army knife. Tall <InlineMath>{'A'}</InlineMath> (too many equations)? QR
            gives the least-squares fit. Wide <InlineMath>{'A'}</InlineMath> (too few equations, infinitely many
            answers)? QR of <InlineMath>{'A^{\\top}'}</InlineMath> singles out the minimum-norm solution — which, for a
            robot, means reaching the goal with the least control effort. The second widget steers a Roomba-like robot
            home using exactly this.
          </p>
        </div>
      </section>

      {/* ── Formalism: QR ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · THE QR FACTORIZATION</span></h2>
        <div className="content-block">
          <p>
            Let <InlineMath>{'A'}</InlineMath> be <InlineMath>{'n\\times m'}</InlineMath> with linearly independent
            columns. Then there is an <InlineMath>{'n\\times m'}</InlineMath> matrix
            <InlineMath>{'\\;Q'}</InlineMath> with orthonormal columns and an upper-triangular invertible
            <InlineMath>{'\\;m\\times m'}</InlineMath> matrix <InlineMath>{'R'}</InlineMath> such that:
          </p>
          <div className="callout callout-success">
            <DisplayMath>{String.raw`A = Q R, \qquad Q^{\top}Q = I_m, \qquad R = Q^{\top}A \text{ (upper-triangular)}.`}</DisplayMath>
            <InlineMath>{'Q'}</InlineMath> comes from applying Gram–Schmidt to the columns of
            <InlineMath>{'\\;A'}</InlineMath> and normalizing. <InlineMath>{'R'}</InlineMath> is upper-triangular because
            of the span-nesting property of Gram–Schmidt:
            <InlineMath>{'\\;\\operatorname{span}\\{a_1,\\dots,a_k\\} = \\operatorname{span}\\{q_1,\\dots,q_k\\}'}</InlineMath>,
            so column <InlineMath>{'k'}</InlineMath> of <InlineMath>{'A'}</InlineMath> uses only
            <InlineMath>{'\\;q_1,\\dots,q_k'}</InlineMath>.
          </div>
          <p>
            Because <InlineMath>{'Q^{\\top}Q = I'}</InlineMath>, the equation
            <InlineMath>{'\\;Ax = b'}</InlineMath> collapses cleanly:
          </p>
          <div className="callout callout-info">
            <strong>Suggested pipeline (square <InlineMath>{'A'}</InlineMath>, <InlineMath>{'\\det A\\neq0'}</InlineMath>).</strong>
            <DisplayMath>{String.raw`Ax = b \iff QRx = b \iff Rx = Q^{\top}b.`}</DisplayMath>
            <strong>(1)</strong> factor <InlineMath>{'A = QR'}</InlineMath>; <strong>(2)</strong> form
            <InlineMath>{'\\;\\bar b = Q^{\\top}b'}</InlineMath>; <strong>(3)</strong> back-substitute
            <InlineMath>{'\\;Rx = \\bar b'}</InlineMath>. No inverse is ever formed.
          </div>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · THE QR PIPELINE</span></h2>
        <QRWidget />
      </section>

      {/* ── Worked example 9.20 ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · GRIZZLE 9.19–9.20</span></h2>
        <div className="content-block">
          <p>
            Solve <InlineMath>{String.raw`\;A = \begin{bmatrix} 1 & 1 & 0 \\ 1 & 2 & 1 \\ 0 & 3 & 1\end{bmatrix}`}</InlineMath>,
            <InlineMath>{String.raw`\;b = \begin{bmatrix} 1 \\ 4 \\ 7\end{bmatrix}`}</InlineMath>. Gram–Schmidt on the
            columns of <InlineMath>{'A'}</InlineMath> (these are exactly the vectors from Lecture 12's Example 9.18)
            produces
          </p>
          <DisplayMath>{String.raw`Q \approx \begin{bmatrix} 0.7071 & -0.1622 & -0.6882 \\ 0.7071 & 0.1622 & 0.6882 \\ 0 & 0.9733 & -0.2294\end{bmatrix}, \quad R = Q^{\top}A \approx \begin{bmatrix} 1.4142 & 2.1213 & 0.7071 \\ 0 & 3.0822 & 1.1355 \\ 0 & 0 & 0.4588\end{bmatrix}.`}</DisplayMath>
          <p>
            Form <InlineMath>{String.raw`\;\bar b = Q^{\top}b \approx (3.5355,\, 7.2900,\, 0.4588)`}</InlineMath>, then
            back-substitute <InlineMath>{'\\;Rx = \\bar b'}</InlineMath> from the bottom up:
          </p>
          <DisplayMath>{String.raw`x_3 = \frac{0.4588}{0.4588} = 1, \quad x_2 = \frac{7.290 - 1.1355(1)}{3.0822} = 2, \quad x_1 = \frac{3.5355 - 2.1213(2) - 0.7071(1)}{1.4142} = -1.`}</DisplayMath>
          <p>
            So <InlineMath>{String.raw`x = (-1, 2, 1)`}</InlineMath> — the exact value the widget reports at step 3.
          </p>
        </div>
      </section>

      {/* ── Formalism: least squares + min norm ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · ONE FACTORIZATION, THREE JOBS</span></h2>
        <div className="content-block">
          <p>
            The beauty of QR is that the <em>same</em> three steps solve all three flavours of
            <InlineMath>{'\\;Ax = b'}</InlineMath>.
          </p>
          <div className="callout callout-success">
            <strong>Over-determined (tall <InlineMath>{'A'}</InlineMath>) → least squares.</strong> With
            <InlineMath>{'\\;A = QR'}</InlineMath>, the normal equations <InlineMath>{'A^{\\top}Ax = A^{\\top}b'}</InlineMath>
            reduce — using <InlineMath>{'A^{\\top}A = R^{\\top}Q^{\\top}QR = R^{\\top}R'}</InlineMath> — to the
            <em> identical</em> pipeline
            <DisplayMath>{String.raw`R^{\top}R\,x = R^{\top}Q^{\top}b \iff Rx = Q^{\top}b.`}</DisplayMath>
            Factor, form <InlineMath>{'\\bar b = Q^{\\top}b'}</InlineMath>, back-substitute — and you avoid forming the
            ill-conditioned <InlineMath>{'A^{\\top}A'}</InlineMath> altogether (more numerically stable).
          </div>
          <div className="callout callout-success">
            <strong>Under-determined (wide <InlineMath>{'A'}</InlineMath>) → minimum norm.</strong> When there are
            infinitely many solutions, the one of <strong>smallest norm</strong> is
            <DisplayMath>{String.raw`x^{*} = A^{\top}(AA^{\top})^{-1}b.`}</DisplayMath>
            Factor <InlineMath>{'\\;A^{\\top} = QR'}</InlineMath> instead; since <InlineMath>{'R^{\\top}'}</InlineMath> is
            lower-triangular, solve <InlineMath>{'\\;R^{\\top}\\beta = b'}</InlineMath> by <em>forward</em> substitution
            and set <InlineMath>{'\\;x^{*} = Q\\beta'}</InlineMath>.
          </div>
          <p>
            Why is <InlineMath>{'x^{*}'}</InlineMath> really the smallest? Every solution is
            <InlineMath>{'\\;x^{*} + \\bar x'}</InlineMath> with <InlineMath>{'A\\bar x = 0'}</InlineMath>, and one can show
            <InlineMath>{'\\;x^{*}\\perp\\bar x'}</InlineMath>. By the Pythagorean theorem
            <InlineMath>{'\\;\\lVert x^{*}+\\bar x\\rVert^2 = \\lVert x^{*}\\rVert^2 + \\lVert\\bar x\\rVert^2'}</InlineMath>,
            which is smallest when <InlineMath>{'\\bar x = 0'}</InlineMath>. Orthogonality, again, doing the heavy lifting.
          </p>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · STEERING A MOBILE ROBOT (MINIMUM-NORM CONTROL)</span></h2>
        <RobotWidget />
      </section>

      {/* ── Worked example 9.22 ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · GRIZZLE 9.22 (MINIMUM NORM)</span></h2>
        <div className="content-block">
          <p>
            Find the minimum-norm solution of the under-determined system
            <InlineMath>{String.raw`\;\begin{bmatrix} 1 & 1 & 0 \\ 1 & 2 & 1\end{bmatrix} x = \begin{bmatrix} 1 \\ 4\end{bmatrix}`}</InlineMath>
            — two equations, three unknowns, so infinitely many solutions. Factor
            <InlineMath>{'\\;A^{\\top} = QR'}</InlineMath>, solve <InlineMath>{'\\;R^{\\top}\\beta = b'}</InlineMath> by
            forward substitution to get <InlineMath>{'\\;\\beta\\approx(0.7071, 2.0412)'}</InlineMath>, then
          </p>
          <DisplayMath>{String.raw`x^{*} = Q\beta \approx \begin{bmatrix} -0.333 \\ 1.333 \\ 1.667\end{bmatrix}, \qquad Ax^{*} - b \approx \begin{bmatrix} 0 \\ 0\end{bmatrix}.`}</DisplayMath>
          <p>
            It is a genuine solution, and the smallest one: all solutions are
            <InlineMath>{'\\;x^{*} + \\gamma(1,-1,1)'}</InlineMath> (the null-space direction), and
            <InlineMath>{'\\;\\lVert x^{*} + \\gamma(1,-1,1)\\rVert^2 = \\lVert x^{*}\\rVert^2 + 3\\gamma^2'}</InlineMath>
            is minimized at <InlineMath>{'\\gamma = 0'}</InlineMath>. This is the exact mechanism the robot widget uses,
            just with a much larger control vector.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <p>
            <strong>LU vs QR — which is better?</strong> It is situational. LU (or solving
            <InlineMath>{'\\;A^{\\top}Ax = A^{\\top}b'}</InlineMath>) is a bit faster; QR is more numerically stable,
            especially for ill-conditioned or very tall/wide systems. As Gilbert Strang notes, deep learning routinely
            solves wildly under-determined systems (<InlineMath>{'n\\gg m'}</InlineMath>) — and it still works. Grizzle's
            and Ghaffari's groups use the QR pipeline (or its LU equivalent) on the Cassie Blue biped.
          </p>
          <p>
            We now have <strong>four</strong> routes to <InlineMath>{'Ax = b'}</InlineMath>: substitution, LU, the normal
            equations, and QR. Module 2 closes by naming the structure underneath them all — <strong>basis</strong>,
            <strong> dimension</strong>, <strong>eigenvalues</strong> (Lecture 14), and the
            <strong> rank–nullity theorem</strong> (Lecture 15) — before the grand recap.
          </p>
        </div>
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span></h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🧹</div>
              <h3>Steering a Roomba</h3>
              <p>
                The widget is the real deal: an under-determined control problem solved for minimum effort. Fewer
                time-steps to the goal cost quadratically more battery — the classic speed-vs-energy trade-off.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🗺️</div>
              <h3>SLAM &amp; State Estimation</h3>
              <p>
                Real-time SLAM back-ends solve enormous least-squares problems. QR (and its sparse variants) factor the
                measurement Jacobian stably, where forming <InlineMath>{'A^{\\top}A'}</InlineMath> would lose precision.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🦿</div>
              <h3>Cassie Blue</h3>
              <p>
                Grizzle's bipedal robot uses the QR/LU pipeline to solve the control and estimation systems that keep it
                balanced and walking in real time.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧠</div>
              <h3>Over-parameterized ML</h3>
              <p>
                Networks have far more parameters than training equations (<InlineMath>{'n\\gg m'}</InlineMath>). The
                minimum-norm solution is a form of implicit regularization — the smallest-norm fit that still
                interpolates the data.
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
            num={1} type="Conceptual"
            question="In A = QR, what are the defining properties of Q and R?"
            options={[
              'Q is upper-triangular, R is orthonormal',
              'Q has orthonormal columns (QᵀQ = I), R is upper-triangular',
              'Both Q and R are orthogonal',
              'Q is diagonal, R is the identity',
            ]}
            correct={1}
            explanation="Q's columns are the orthonormal vectors from Gram–Schmidt, so QᵀQ = I. R = QᵀA is upper-triangular because of Gram–Schmidt's span-nesting: column k of A uses only q₁…qₖ."
          />
          <QuizQ
            num={2} type="Computational"
            question="Once A = QR, the pipeline for solving Ax = b is:"
            options={[
              'Compute A⁻¹ = R⁻¹Q⁻¹ and multiply by b',
              'Form b̄ = Qᵀb, then back-substitute Rx = b̄',
              'Solve QᵀQx = b',
              'Multiply b by R then by Q',
            ]}
            correct={1}
            explanation="QRx = b ⇒ Rx = Qᵀb (because Q⁻¹ = Qᵀ). Form b̄ = Qᵀb with one matrix–vector product, then back-substitute the triangular system Rx = b̄. No inverse is computed."
          />
          <QuizQ
            num={3} type="Transfer"
            question="Why does the QR pipeline give the LEAST-SQUARES solution for a tall A, identical to the normal equations?"
            options={[
              'It does not — QR only works for square A',
              'Because AᵀA = RᵀQᵀQR = RᵀR, so AᵀAx = Aᵀb reduces to Rx = Qᵀb',
              'Because Q is always the identity for tall matrices',
              'Because least squares ignores Q entirely',
            ]}
            correct={1}
            explanation="With A = QR, AᵀA = Rᵀ(QᵀQ)R = RᵀR and Aᵀb = RᵀQᵀb. The normal equations AᵀAx = Aᵀb become RᵀRx = RᵀQᵀb ⇔ Rx = Qᵀb — the same three steps, but without forming the ill-conditioned AᵀA."
          />
          <QuizQ
            num={4} type="Geometric"
            question="The robot reaches the origin in N=1 step and in N=20 steps. How does control effort ‖u‖² compare?"
            options={[
              'They are equal — effort does not depend on N',
              'N=1 costs far MORE effort; spreading the maneuver over more steps is much cheaper',
              'N=1 costs less effort because it is fewer steps',
              'N=20 fails to reach the origin',
            ]}
            correct={1}
            explanation="Both reach the origin (it is solvable for any N≥1), but the minimum-norm effort drops sharply as N grows — the book's example falls ~20× from N=1 to N=20. Forcing the move into one big step demands huge controls; spreading it out is gentle. Speed costs energy."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>State A = QR (properties of Q, R) and the three-step pipeline; write the minimum-norm formula x* = Aᵀ(AAᵀ)⁻¹b.</div>
            <div className="review-item"><span className="review-day">Day 1</span>Answer: (a) If Q is orthonormal, what is Q⁻¹? (b) Why is R upper-triangular?</div>
            <div className="review-item"><span className="review-day">Day 3</span>Redo Grizzle 9.20 without notes: back-substitute Rx = b̄ to recover x = (−1, 2, 1).</div>
            <div className="review-item"><span className="review-day">Day 7</span>Explain why AᵀA = RᵀR makes the least-squares pipeline identical to the square-system one.</div>
            <div className="review-item"><span className="review-day">Day 14</span>Explain the robot widget to a friend: why steering is underdetermined and what "minimum effort" picks.</div>
          </div>
        </div>
      </section>

    </div>
  )
}
