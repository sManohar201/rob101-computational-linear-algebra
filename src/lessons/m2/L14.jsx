import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { useOrbitScene } from '../shared/useOrbitScene.js'
import { useAnimatedParams } from '../shared/useAnimatedParams.js'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'
import {
  COL, tube, sphere, axisArrow, arrowFromTo, gridXY, label, disposeObject,
} from '../shared/three-helpers.js'

// ─── 2×2 eigen-kernel ────────────────────────────────────────────────────────
// Returns the real eigenvalues/eigenvectors of A = [[a,b],[c,d]], or complex flag.
function eig2(a, b, c, d) {
  const tr = a + d
  const det = a * d - b * c
  const disc = tr * tr - 4 * det
  if (disc < -1e-9) return { complex: true, tr, det }
  const s = Math.sqrt(Math.max(0, disc))
  const l1 = (tr + s) / 2
  const l2 = (tr - s) / 2
  const vecFor = l => {
    // (A − λI) v = 0
    let v
    if (Math.abs(b) > 1e-9) v = [b, l - a]
    else if (Math.abs(c) > 1e-9) v = [l - d, c]
    else v = Math.abs(a - l) < 1e-9 ? [1, 0] : [0, 1]
    const n = Math.hypot(v[0], v[1]) || 1
    return [v[0] / n, v[1] / n]
  }
  return { complex: false, l1, l2, v1: vecFor(l1), v2: vecFor(l2), tr, det }
}

const f2 = n => { const r = Math.round(n * 100) / 100; return (Object.is(r, -0) ? 0 : r).toFixed(2) }

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — The eigenvector finder
//  Sweep an input vector v(θ) around the circle. Draw v (grey) and its image Av
//  (orange). For MOST directions Av points somewhere else — the vector rotates.
//  Exactly along an EIGENVECTOR, Av lands back on the same line: pure stretch by λ.
// ════════════════════════════════════════════════════════════════════════════

const EIG_PRESETS = [
  { label: 'Distinct real (stretch)', a: 2, b: 1, c: 1, d: 2 },     // λ = 3, 1
  { label: 'Symmetric (orthogonal eigvecs)', a: 3, b: 1, c: 1, d: 3 },
  { label: 'Shear', a: 1, b: 1, c: 0, d: 1 },                       // λ = 1 (repeated)
  { label: 'Pure rotation (complex)', a: 0, b: -1, c: 1, d: 0 },    // no real eigvecs
  { label: 'Contraction + growth', a: 1.5, b: 0, c: 0, d: 0.5 },
]
const SC = 2.4 // display scale

function EigenWidget() {
  const [idx, setIdx] = useState(0)
  const [params, setParams] = useState({ theta: 25 })
  const dyn = useRef([])
  const A = EIG_PRESETS[idx]
  const shown = useAnimatedParams(params)
  const E = eig2(A.a, A.b, A.c, A.d)

  const th = (shown.theta * Math.PI) / 180
  const v = [Math.cos(th), Math.sin(th)]
  const Av = [A.a * v[0] + A.b * v[1], A.c * v[0] + A.d * v[1]]
  // angle between v and Av (0 or 180 ⇒ eigen-direction)
  const cosang = (v[0] * Av[0] + v[1] * Av[1]) / (Math.hypot(...Av) || 1)
  const aligned = Math.abs(Math.abs(cosang) - 1) < 0.012 && !E.complex

  const { containerRef, ctxRef } = useOrbitScene(
    scene => {
      scene.add(gridXY(5, 1))
      scene.add(axisArrow([1, 0, 0], 5.2, COL.x))
      scene.add(axisArrow([0, 1, 0], 5.2, COL.y))
      scene.add(label('x₁', new THREE.Vector3(5.5, -0.4, 0), '#c92a2a'))
      scene.add(label('x₂', new THREE.Vector3(-0.5, 5.5, 0), '#2b8a3e'))
    },
    { target: [0, 0, 0], camStart: { theta: 0, phi: Math.PI / 2, r: 15 }, zoom: [9, 24], lockPolar: [1.25, 1.9] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }
    const O = new THREE.Vector3(0, 0, 0)

    // faint eigenvector lines (the invariant directions)
    if (!E.complex) {
      ;[E.v1, E.v2].forEach((ev, i) => {
        const p = new THREE.Vector3(ev[0], ev[1], 0).multiplyScalar(5)
        add(tube(p.clone().multiplyScalar(-1), p, COL.guide, 0.018))
        add(label(`λ=${f2(i === 0 ? E.l1 : E.l2)}`, p.clone().multiplyScalar(0.62).add(new THREE.Vector3(0.25, 0.25, 0)), '#5c6b85', 0.42))
      })
    }
    // input v (grey) and image Av (orange)
    add(arrowFromTo(O, new THREE.Vector3(v[0], v[1], 0).multiplyScalar(SC), 0x868e96, 0.04))
    add(arrowFromTo(O, new THREE.Vector3(Av[0], Av[1], 0).multiplyScalar(SC), aligned ? COL.point : COL.line1, 0.05))
    add(label('v', new THREE.Vector3(v[0], v[1], 0).multiplyScalar(SC).add(new THREE.Vector3(0.25, 0.25, 0)), '#495057', 0.5))
    add(label('Av', new THREE.Vector3(Av[0], Av[1], 0).multiplyScalar(SC).add(new THREE.Vector3(0.28, -0.25, 0)), aligned ? '#0c8599' : '#d9480f', 0.5))
  }, [idx, shown.theta]) // eslint-disable-line react-hooks/exhaustive-deps

  const badge = E.complex
    ? { cls: 'badge-none', txt: 'complex eigenvalues — every real vector rotates, none is fixed in direction' }
    : aligned
      ? { cls: 'badge-unique', txt: `✓ eigenvector! Av = λv, λ ≈ ${f2(Math.sign(cosang) * Math.hypot(...Av))}` }
      : { cls: 'badge-infinite', txt: 'not an eigenvector — Av points off the line of v' }

  return (
    <div className="widget">
      <p className="widget-caption">
        Multiplying by <InlineMath>{'A'}</InlineMath> usually <em>rotates and stretches</em> a vector. But a few special
        directions — the <strong>eigenvectors</strong> — only get stretched: <InlineMath>{'Av = \\lambda v'}</InlineMath>,
        same line, scaled by the eigenvalue <InlineMath>{'\\lambda'}</InlineMath>. Sweep the input
        <InlineMath>{'\\;v'}</InlineMath> around and watch its image <InlineMath>{'\\;Av'}</InlineMath> swing off-axis —
        until it snaps back onto a faint eigen-line.
      </p>
      <p className="widget-instructions">drag to orbit · spin the input vector · the dashed lines are the eigen-directions</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq">A = [[{A.a}, {A.b}], [{A.c}, {A.d}]]</div>
              <div className="hud-eq">tr A = {f2(E.tr)} · det A = {f2(E.det)}</div>
              {E.complex
                ? <div className="hud-note">discriminant &lt; 0 → complex conjugate pair</div>
                : <div className="hud-note">eigenvalues λ = {f2(E.l1)}, {f2(E.l2)}</div>}
              <div className="hud-note">angle(v, Av) = {f2((Math.acos(Math.max(-1, Math.min(1, cosang))) * 180) / Math.PI)}°</div>
            </div>
            <div className={`hud-badge ${badge.cls}`}>{badge.txt}</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {EIG_PRESETS.map((p, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`} onClick={() => setIdx(i)}>{p.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <SliderRow label="∠v" k="theta" value={params.theta} min={0} max={360} step={1}
              onChange={(k, val) => setParams({ theta: val })} />
            {!E.complex && (
              <div className="preset-bar" style={{ marginTop: 4 }}>
                <button className="preset-btn" onClick={() => setParams({ theta: (Math.atan2(E.v1[1], E.v1[0]) * 180) / Math.PI })}>snap to v₁</button>
                <button className="preset-btn" onClick={() => setParams({ theta: (Math.atan2(E.v2[1], E.v2[0]) * 180) / Math.PI })}>snap to v₂</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — Power iteration: Aᵏx aligns with the dominant eigenvector
//  Grizzle §10.3: Aᵏx = Σ αᵢλᵢᵏ vᵢ. The term with the largest |λ| dominates, so
//  the *direction* of Aᵏx converges to the dominant eigenvector. A DOM widget:
//  the value is in the converging sequence of angles, not extra geometry.
// ════════════════════════════════════════════════════════════════════════════

const POW_PRESETS = [
  { label: 'λ = 3, 1  (clean)', a: 2, b: 1, c: 1, d: 2 },
  { label: 'λ = 1.5, 0.5', a: 1.5, b: 0, c: 0, d: 0.5 },
  { label: 'λ = 2.2, −0.2', a: 1, b: 1.2, c: 1, d: 1 },
]

function PowerWidget() {
  const [idx, setIdx] = useState(0)
  const A = POW_PRESETS[idx]
  const E = eig2(A.a, A.b, A.c, A.d)
  // iterate, normalising after each step so directions stay visible
  let x = [1, 0]
  const rows = [{ k: 0, x: [...x] }]
  for (let k = 1; k <= 8; k++) {
    let y = [A.a * x[0] + A.b * x[1], A.c * x[0] + A.d * x[1]]
    const n = Math.hypot(...y) || 1
    y = [y[0] / n, y[1] / n]
    rows.push({ k, x: y })
    x = y
  }
  const target = E.complex ? null : (Math.abs(E.l1) >= Math.abs(E.l2) ? E.v1 : E.v2)
  const angOf = u => (Math.atan2(u[1], u[0]) * 180) / Math.PI
  const targAng = target ? angOf(target) : null

  return (
    <div className="widget">
      <p className="widget-caption">
        Apply <InlineMath>{'A'}</InlineMath> over and over to a starting vector. Writing
        <InlineMath>{'\\;x = \\alpha_1 v_1 + \\alpha_2 v_2'}</InlineMath>, each step scales coordinate
        <InlineMath>{'\\;i'}</InlineMath> by <InlineMath>{'\\lambda_i'}</InlineMath>, so
        <InlineMath>{'\\;A^k x = \\alpha_1\\lambda_1^{k} v_1 + \\alpha_2\\lambda_2^{k} v_2'}</InlineMath>. The term with the
        biggest <InlineMath>{'|\\lambda|'}</InlineMath> wins: the <strong>direction</strong> of
        <InlineMath>{'\\;A^k x'}</InlineMath> locks onto the <strong>dominant eigenvector</strong>. (This is exactly how
        Google's PageRank and many ML methods find a leading direction.)
      </p>
      <p className="widget-instructions">pick a matrix · read the angle column converging to the dominant eigen-direction</p>
      <div className="widget-card">
        <div style={{ padding: '16px 20px', background: '#0f1729', borderRadius: 10, color: '#dbe4f3', fontFamily: 'monospace', fontSize: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr auto', gap: '4px 18px', alignItems: 'center' }}>
            <span style={{ color: '#9aa7bd' }}>k</span>
            <span style={{ color: '#9aa7bd' }}>Aᵏx / ‖·‖ (normalised)</span>
            <span style={{ color: '#9aa7bd' }}>direction (°)</span>
            <span style={{ color: '#9aa7bd' }}>error to v₁ (°)</span>
            {rows.map(r => {
              const ang = angOf(r.x)
              let err = targAng == null ? null : Math.abs(((ang - targAng + 540) % 360) - 180)
              return [
                <span key={`k${r.k}`}>{r.k}</span>,
                <span key={`x${r.k}`} style={{ color: '#ffb066' }}>({f2(r.x[0])}, {f2(r.x[1])})</span>,
                <span key={`a${r.k}`}>{f2(ang)}</span>,
                <span key={`e${r.k}`} style={{ color: err != null && err < 1 ? '#69db7c' : '#dbe4f3' }}>{err == null ? '—' : f2(err)}</span>,
              ]
            })}
          </div>
          <div style={{ marginTop: 12, color: '#9aa7bd', fontSize: 11.5 }}>
            {E.complex
              ? 'Complex eigenvalues → the direction keeps rotating, never converging.'
              : `dominant λ = ${f2(Math.abs(E.l1) >= Math.abs(E.l2) ? E.l1 : E.l2)} → eigenvector direction ${f2(targAng)}° (green = converged)`}
          </div>
        </div>
        <div className="preset-bar">
          {POW_PRESETS.map((p, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`} onClick={() => setIdx(i)}>{p.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L14() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#e9f0ff', color: '#2563eb', borderColor: '#c9dbf6' }}>
          Module 2 · Lecture 14 · Grizzle Ch. 10 §10.2–10.3
        </div>
        <h1 className="lesson-title">Basis Vectors, Coordinates &amp; Eigenvalues</h1>
        <p className="lesson-subtitle">
          A <strong>basis</strong> is a set of vectors that is "just right" — independent enough to give every point unique
          coordinates, big enough to reach everywhere. Among all square matrices, a few special directions survive
          multiplication untouched except for scaling: the <strong>eigenvectors</strong>, with their
          <strong> eigenvalues</strong> <InlineMath>{'\\lambda'}</InlineMath>. They are the characteristic skeleton of a
          linear map.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Every address system needs reference directions. "Three blocks east, two north" only means something once you
            fix what <em>east</em> and <em>north</em> are. In linear algebra those reference directions are a
            <strong> basis</strong>, and the numbers (3, 2) are your <strong>coordinates</strong> in that basis. The
            Goldilocks rule: a basis is <em>not too big</em> (it stays linearly independent, so coordinates are unique) and
            <em> not too small</em> (it spans the whole space, so every point has coordinates).
          </p>
          <p>
            Now picture stirring a fluid with a linear map <InlineMath>{'A'}</InlineMath>. Most particles get swept into
            new directions. But along a few special streamlines the flow only pushes particles farther out or pulls them
            in — never sideways. Those streamlines are the <strong>eigenvectors</strong>; how fast particles move along
            them is the <strong>eigenvalue</strong>. Find them and you understand the whole flow, because any starting
            vector is just a blend of eigen-directions, each evolving on its own.
          </p>
        </div>
      </section>

      {/* ── Formalism: basis ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · BASIS, COORDINATES &amp; DIMENSION</span></h2>
        <div className="content-block">
          <p>
            A set <InlineMath>{'\\{v_1,\\dots,v_k\\}'}</InlineMath> is a <strong>basis</strong> for a subspace
            <InlineMath>{'\\;V'}</InlineMath> if it is (1) linearly independent and (2) spans
            <InlineMath>{'\\;V'}</InlineMath>. The number of vectors <InlineMath>{'k'}</InlineMath> is the
            <strong> dimension</strong> <InlineMath>{'\\dim(V)'}</InlineMath> — it does not depend on which basis you pick.
          </p>
          <div className="callout callout-info">
            Because a basis is independent <em>and</em> spanning, every <InlineMath>{'x\\in V'}</InlineMath> has a
            <strong> unique</strong> expansion
            <DisplayMath>{String.raw`x = \alpha_1 v_1 + \cdots + \alpha_k v_k, \qquad [x]_{\{v_1,\dots,v_k\}} = \begin{bmatrix}\alpha_1\\ \vdots\\ \alpha_k\end{bmatrix}.`}</DisplayMath>
            The coefficient vector is the <strong>representation</strong> (coordinates) of <InlineMath>{'x'}</InlineMath> in
            that basis. The <strong>canonical basis</strong> of <InlineMath>{'\\mathbb{R}^n'}</InlineMath> is
            <InlineMath>{'\\;\\{e_1,\\dots,e_n\\}'}</InlineMath>, the columns of <InlineMath>{'I_n'}</InlineMath>.
          </div>
          <p>
            For a square <InlineMath>{'n\\times n'}</InlineMath> matrix <InlineMath>{'A'}</InlineMath>, three statements are
            the same fact:
          </p>
          <div className="callout callout-success">
            <DisplayMath>{String.raw`\det(A)\neq 0 \iff \text{columns of }A\text{ are linearly independent} \iff \text{columns of }A\text{ form a basis of }\mathbb{R}^n.`}</DisplayMath>
            So to <em>test</em> whether vectors form a basis, stack them as columns and check
            <InlineMath>{'\\;\\det A\\neq 0'}</InlineMath>; to <em>build</em> an orthonormal basis from them, run
            Gram–Schmidt / QR (Lecture 13).
          </div>
        </div>
      </section>

      {/* ── Formalism: eigen ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · EIGENVALUES &amp; EIGENVECTORS</span></h2>
        <div className="content-block">
          <p>
            A non-zero vector <InlineMath>{'v'}</InlineMath> is an <strong>eigenvector</strong> of the
            <InlineMath>{'\\;n\\times n'}</InlineMath> matrix <InlineMath>{'A'}</InlineMath> if
          </p>
          <DisplayMath>{String.raw`Av = \lambda v,`}</DisplayMath>
          <p>
            i.e. <InlineMath>{'A'}</InlineMath> only scales <InlineMath>{'v'}</InlineMath> (by the
            <strong> eigenvalue</strong> <InlineMath>{'\\lambda'}</InlineMath>) without turning it. ("Eigen" is German for
            <em> own / characteristic</em>.) Rearranging,
          </p>
          <div className="callout callout-info">
            <DisplayMath>{String.raw`Av = \lambda v \iff (\lambda I - A)v = 0.`}</DisplayMath>
            A non-zero <InlineMath>{'v'}</InlineMath> exists <strong>iff</strong> <InlineMath>{'(\\lambda I - A)'}</InlineMath>
            is singular, which gives the <strong>characteristic equation</strong>
            <DisplayMath>{String.raw`\det(\lambda I - A) = 0.`}</DisplayMath>
            Its roots are the eigenvalues; for each, solve the null-space system
            <InlineMath>{'\\;(A-\\lambda I)v = 0'}</InlineMath> for the eigenvectors.
          </div>
          <p>Three facts you will lean on constantly:</p>
          <ul>
            <li><strong>Eigenbasis.</strong> If an <InlineMath>{'n\\times n'}</InlineMath> matrix has <em>real and
              distinct</em> eigenvalues, its eigenvectors form a basis of <InlineMath>{'\\mathbb{R}^n'}</InlineMath>.</li>
            <li><strong>Complex pairs.</strong> Complex roots come in conjugate pairs
              <InlineMath>{'\\;\\lambda_2 = \\lambda_1^{*}'}</InlineMath>, <InlineMath>{'\\;v_2 = v_1^{*}'}</InlineMath> — the
              hallmark of rotation (try the rotation preset).</li>
            <li><strong>Symmetric matrices.</strong> If <InlineMath>{'A = A^{\\top}'}</InlineMath>, all eigenvalues are
              real and the eigenvectors can be chosen <strong>orthonormal</strong>.</li>
          </ul>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · THE EIGENVECTOR FINDER</span></h2>
        <EigenWidget />
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · EIGENSTUFF OF A 2×2</span></h2>
        <div className="content-block">
          <p>
            Take <InlineMath>{String.raw`A = \begin{bmatrix} 2 & 1 \\ 1 & 2 \end{bmatrix}`}</InlineMath> (the first preset,
            symmetric). The characteristic equation is
          </p>
          <DisplayMath>{String.raw`\det(\lambda I - A) = \det\!\begin{bmatrix}\lambda-2 & -1 \\ -1 & \lambda-2\end{bmatrix} = (\lambda-2)^2 - 1 = \lambda^2 - 4\lambda + 3 = 0,`}</DisplayMath>
          <p>so <InlineMath>{'\\lambda = 3'}</InlineMath> and <InlineMath>{'\\lambda = 1'}</InlineMath>. For
            <InlineMath>{'\\;\\lambda = 3'}</InlineMath>, solve <InlineMath>{'\\;(A-3I)v = 0'}</InlineMath>:</p>
          <DisplayMath>{String.raw`\begin{bmatrix}-1 & 1 \\ 1 & -1\end{bmatrix}v = 0 \;\Rightarrow\; v_1 = \tfrac{1}{\sqrt2}(1,1).`}</DisplayMath>
          <p>For <InlineMath>{'\\lambda = 1'}</InlineMath>, similarly <InlineMath>{'\\;v_2 = \\tfrac{1}{\\sqrt2}(1,-1)'}</InlineMath>.
            The two eigenvectors are <strong>orthogonal</strong> (as guaranteed for a symmetric matrix), and they are
            exactly the dashed lines the widget snaps to. Along <InlineMath>{'v_1'}</InlineMath> the map triples a vector;
            along <InlineMath>{'v_2'}</InlineMath> it leaves the length unchanged.</p>
        </div>
      </section>

      {/* ── Formalism: matrix powers ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · THE ACTION OF MATRIX POWERS</span></h2>
        <div className="content-block">
          <p>
            With an eigenbasis, repeated multiplication becomes transparent. Expand
            <InlineMath>{'\\;x = \\alpha_1 v_1 + \\cdots + \\alpha_n v_n'}</InlineMath>; since
            <InlineMath>{'\\;A v_i = \\lambda_i v_i'}</InlineMath>,
          </p>
          <DisplayMath>{String.raw`A^k x = \alpha_1\lambda_1^{k} v_1 + \alpha_2\lambda_2^{k} v_2 + \cdots + \alpha_n\lambda_n^{k} v_n.`}</DisplayMath>
          <div className="callout callout-success">
            Each coordinate evolves <em>independently</em>: the component along <InlineMath>{'v_i'}</InlineMath> grows if
            <InlineMath>{'\\;|\\lambda_i|>1'}</InlineMath> and decays to zero if <InlineMath>{'\\;|\\lambda_i|<1'}</InlineMath>.
            The largest <InlineMath>{'|\\lambda|'}</InlineMath> eventually dominates, so the <strong>direction</strong> of
            <InlineMath>{'\\;A^k x'}</InlineMath> tends to the <strong>dominant eigenvector</strong>. This is the engine of
            power iteration, PageRank, and stability analysis of dynamical systems.
          </div>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · POWER ITERATION</span></h2>
        <PowerWidget />
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span></h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🌀</div>
              <h3>Rigid-body inertia</h3>
              <p>The principal axes of a spinning rigid body are the eigenvectors of its inertia tensor; the moments of
                inertia are the eigenvalues. Spin a robot about a principal axis and it stays balanced.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">📉</div>
              <h3>PCA / dimensionality reduction</h3>
              <p>Principal Component Analysis keeps the eigenvectors of the data covariance matrix with the largest
                eigenvalues — the directions of greatest variance — to compress features.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">⚖️</div>
              <h3>Stability of dynamics</h3>
              <p>A linear system <InlineMath>{'x_{k+1}=Ax_k'}</InlineMath> is stable iff every
                <InlineMath>{'\\;|\\lambda_i|<1'}</InlineMath>. Eigenvalues decide whether a controller settles or blows up.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🔗</div>
              <h3>PageRank</h3>
              <p>The ranking of the web is the dominant eigenvector of the link matrix — found by exactly the power
                iteration in the second widget.</p>
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
            question="What two properties define a basis of a subspace V?"
            options={[
              'It is orthogonal and has unit-length vectors',
              'It is linearly independent and spans V',
              'It contains the zero vector and is closed under addition',
              'It has exactly n vectors for any n',
            ]}
            correct={1}
            explanation="A basis is 'just right': linearly independent (so coordinates are unique) and spanning (so every vector has coordinates). Orthonormality is a bonus, not a requirement."
          />
          <QuizQ
            num={2} type="Computational"
            question="The characteristic equation det(λI − A) = 0 is used to find:"
            options={[
              'The eigenvectors directly',
              'The determinant of A',
              'The eigenvalues λ (then solve (A−λI)v = 0 for the eigenvectors)',
              'The inverse of A',
            ]}
            correct={2}
            explanation="Its roots are the eigenvalues. For each eigenvalue you then solve the null-space system (A−λI)v = 0 to get the eigenvectors."
          />
          <QuizQ
            num={3} type="Geometric"
            question="A symmetric matrix A = Aᵀ is guaranteed to have:"
            options={[
              'Complex eigenvalues',
              'No real eigenvectors',
              'Real eigenvalues and orthonormal eigenvectors',
              'A determinant of zero',
            ]}
            correct={2}
            explanation="Real symmetric matrices always have real eigenvalues, and their eigenvectors can be chosen orthonormal — the (1,1)/(1,−1) pair in the worked example is exactly this."
          />
          <QuizQ
            num={4} type="Transfer"
            question="Why does Aᵏx align with the dominant eigenvector as k grows?"
            options={[
              'Because A becomes the identity after enough powers',
              'Because in Aᵏx = Σαᵢλᵢᵏvᵢ, the term with the largest |λ| outgrows the others',
              'Because all eigenvalues become equal',
              'It does not — the direction stays fixed at x',
            ]}
            correct={1}
            explanation="Each eigen-coordinate is scaled by λᵢᵏ. The largest |λ| dominates exponentially, so the direction of Aᵏx converges to that eigenvector — the basis of power iteration and PageRank."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>State the two basis properties and the eigen-definition Av = λv; write the characteristic equation.</div>
            <div className="review-item"><span className="review-day">Day 1</span>Answer: (a) When do columns form a basis of ℝⁿ? (b) What makes eigenvectors of a symmetric matrix special?</div>
            <div className="review-item"><span className="review-day">Day 3</span>Redo the 2×2 worked example without notes: find λ and the eigenvectors of [[2,1],[1,2]].</div>
            <div className="review-item"><span className="review-day">Day 7</span>Explain why Aᵏx aligns with the dominant eigenvector using the eigen-expansion.</div>
            <div className="review-item"><span className="review-day">Day 14</span>Explain eigenvectors to a friend in under 2 minutes using the "stirred fluid / streamline" picture.</div>
          </div>
        </div>
      </section>

    </div>
  )
}
