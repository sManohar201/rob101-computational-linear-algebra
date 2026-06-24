import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { useOrbitScene } from '../shared/useOrbitScene.js'
import { useAnimatedParams } from '../shared/useAnimatedParams.js'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'
import {
  COL, tube, sphere, axisArrow, gridFloor, label,
  arrowFromTo, planeMesh, disposeObject,
} from '../shared/three-helpers.js'

const v3 = a => new THREE.Vector3(a[0], a[1], a[2])

// ─── RREF-based subspaces of a matrix ────────────────────────────────────────
// Reduce A (rows × cols) and report which columns are pivots, plus a basis for
// the null space (the free-variable solutions of Ax = 0).
function analyze(A) {
  const rows = A.length, cols = A[0].length
  const M = A.map(r => r.map(Number))
  const pivots = []
  let r = 0
  for (let c = 0; c < cols && r < rows; c++) {
    let p = r
    for (let i = r + 1; i < rows; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i
    if (Math.abs(M[p][c]) < 1e-9) continue
    ;[M[r], M[p]] = [M[p], M[r]]
    const pv = M[r][c]
    for (let j = 0; j < cols; j++) M[r][j] /= pv
    for (let i = 0; i < rows; i++) {
      if (i === r) continue
      const f = M[i][c]
      if (Math.abs(f) > 1e-12) for (let j = 0; j < cols; j++) M[i][j] -= f * M[r][j]
    }
    pivots.push(c); r++
  }
  const pivotSet = new Set(pivots)
  const free = []
  for (let c = 0; c < cols; c++) if (!pivotSet.has(c)) free.push(c)
  // each free column gives one null-space basis vector
  const nullBasis = free.map(fc => {
    const v = new Array(cols).fill(0)
    v[fc] = 1
    pivots.forEach((pc, i) => { v[pc] = -M[i][fc] })
    return v
  })
  return { rank: pivots.length, pivots, nullBasis }
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — Is this line a subspace?  (Grizzle Example 9.1 / Fig 9.1)
//  Slide slope m and intercept b. A subspace must contain 0 AND be closed under
//  addition. Two points v₁, v₂ on the line are added; v₁+v₂ lands ON the line
//  only when b = 0 — the one case where the line is a subspace.
// ════════════════════════════════════════════════════════════════════════════

const SUB_PRESETS = [
  { label: 'Through the origin → subspace ✓', p: { m: 0.8, b: 0 } },
  { label: 'Shifted up → NOT a subspace ✗',   p: { m: 0.8, b: 3 } },
  { label: 'Steep, through origin ✓',         p: { m: 2.2, b: 0 } },
  { label: 'Horizontal, offset ✗',            p: { m: 0, b: -2.5 } },
]

const R = 6 // scene half-width
function gridZ0(half = R, color = 0x9fb0c9) {
  const pts = []
  for (let i = -half; i <= half + 1e-6; i++) {
    pts.push(new THREE.Vector3(-half, i, 0), new THREE.Vector3(half, i, 0))
    pts.push(new THREE.Vector3(i, -half, 0), new THREE.Vector3(i, half, 0))
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 }))
}

function SubspaceWidget() {
  const [target, setTarget] = useState(SUB_PRESETS[0].p)
  const [active, setActive] = useState(0)
  const shown = useAnimatedParams(target)
  const dyn = useRef([])

  const { containerRef, ctxRef } = useOrbitScene(
    scene => {
      scene.add(gridZ0())
      scene.add(axisArrow([1, 0, 0], R + 0.4, COL.x))
      scene.add(axisArrow([0, 1, 0], R + 0.4, COL.y))
      scene.add(label('x', new THREE.Vector3(R + 0.7, -0.4, 0), '#c92a2a'))
      scene.add(label('y', new THREE.Vector3(-0.5, R + 0.7, 0), '#2b8a3e'))
    },
    {
      target: [0, 0, 0],
      camStart: { theta: 0, phi: Math.PI / 2, r: 16 },
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
    const { m, b } = shown
    const onLine = x => new THREE.Vector3(x, m * x + b, 0)

    // the line y = mx + b
    add(tube(onLine(-R), onLine(R), COL.line2, 0.05))

    // the origin: green dot if it lies on the line (b ≈ 0), red otherwise
    const originOnLine = Math.abs(b) < 0.05
    add(sphere(new THREE.Vector3(0, 0, 0), originOnLine ? COL.point : COL.x, 0.18))

    // two sample points on the line and their vector sum
    const x1 = -2.2, x2 = 1.6
    const p1 = onLine(x1), p2 = onLine(x2)
    const psum = p1.clone().add(p2)
    const O = new THREE.Vector3(0, 0, 0)
    add(arrowFromTo(O, p1, COL.vertex, 0.04))
    add(arrowFromTo(O, p2, COL.vertex, 0.04))
    add(sphere(p1, COL.vertex, 0.12))
    add(sphere(p2, COL.vertex, 0.12))
    // the sum: teal if it lands on the line (closed), rose if it falls off
    const sumOnLine = Math.abs(psum.y - (m * psum.x + b)) < 0.05
    add(arrowFromTo(O, psum, sumOnLine ? COL.point : COL.line3, 0.05))
    add(sphere(psum, sumOnLine ? COL.point : COL.line3, 0.16))
    // faint parallelogram guides for the sum
    add(tube(p1, psum, COL.guide, 0.02))
    add(tube(p2, psum, COL.guide, 0.02))
  }, [shown]) // eslint-disable-line react-hooks/exhaustive-deps

  const isSub = Math.abs(target.b) < 1e-6
  const badge = isSub
    ? { cls: 'badge-unique', txt: '✓ subspace — contains 0 and is closed under +' }
    : { cls: 'badge-none', txt: '✗ not a subspace — 0 ∉ V and v₁+v₂ falls off the line' }

  function set(k, v) { setTarget(t => ({ ...t, [k]: v })); setActive(-1) }

  return (
    <div className="widget">
      <p className="widget-caption">
        A <strong>subspace</strong> must (i) contain the zero vector and (ii) be <strong>closed</strong> — adding two of
        its vectors, or scaling one, must land you back inside it. Here <InlineMath>{'V'}</InlineMath> is the line
        <InlineMath>{'\\;y = mx + b'}</InlineMath>. The two purple vectors live on the line; their teal/rose sum
        <InlineMath>{'\\;v_1+v_2'}</InlineMath> stays on the line <strong>only when <InlineMath>{'b = 0'}</InlineMath></strong>.
        Slide the intercept off zero and watch the origin dot turn red and the sum fall off — closure breaks.
      </p>
      <p className="widget-instructions">drag to orbit · scroll to zoom · slide m, b — set b = 0 to make it a subspace</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq" style={{ color: '#4dabf7' }}>V : y = {fmt(target.m)}·x {target.b < 0 ? '−' : '+'} {fmt(Math.abs(target.b))}</div>
              <div className="hud-note">origin (0,0) {isSub ? 'lies on V ✓' : 'is NOT on V ✗'}</div>
              <div className="hud-note">v₁ + v₂ {isSub ? 'stays on V ✓' : 'leaves V ✗'}</div>
            </div>
            <div className={`hud-badge ${badge.cls}`}>{badge.txt}</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {SUB_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${active === i ? 'active' : ''}`}
              onClick={() => { setTarget(pr.p); setActive(i) }}>{pr.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <div className="controls-label"><span className="swatch" style={{ background: '#1c7ed6' }} />Line parameters</div>
            <SliderRow label="slope m" k="m" value={target.m} onChange={set} min={-3} max={3} step={0.1} />
            <SliderRow label="intercept b" k="b" value={target.b} onChange={set} min={-5} max={5} step={0.1} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — The subspace zoo: null space & column span of a matrix
//  Pick a 3×3 matrix A. col span{A} (teal) is what the columns reach; null(A)
//  (purple) is everything A crushes to 0. As rank drops, col span shrinks
//  (ℝ³ → plane → line) while null space grows (point → line → plane):
//  rank + nullity = 3, the rank–nullity theorem, previewed geometrically.
// ════════════════════════════════════════════════════════════════════════════

const ZOO_PRESETS = [
  {
    label: 'rank 3 → null = {0}, col span = ℝ³',
    A: [[2, 1, 0], [0, 1, 1], [1, 0, 1]],
  },
  {
    label: 'rank 2 → null = line, col span = plane',
    A: [[1, 0, 1], [0, 1, 1], [1, 1, 2]], // c₃ = c₁ + c₂
  },
  {
    label: 'rank 1 → null = plane, col span = line',
    A: [[1, 2, -1], [1, 2, -1], [1, 2, -1]],
  },
]

// columns of A (A stored as rows)
const colsOf = A => [0, 1, 2].map(j => [A[0][j], A[1][j], A[2][j]])

function ZooWidget() {
  const [idx, setIdx] = useState(0)
  const A = ZOO_PRESETS[idx].A
  const dyn = useRef([])
  const { rank, pivots, nullBasis } = analyze(A)
  const nullity = nullBasis.length
  const cols = colsOf(A)

  const { containerRef, ctxRef } = useOrbitScene(
    scene => {
      scene.add(gridFloor(6, 1))
      scene.add(axisArrow([1, 0, 0], 6.2, COL.x))
      scene.add(axisArrow([0, 1, 0], 6.2, COL.y))
      scene.add(axisArrow([0, 0, 1], 6.2, COL.z))
      scene.add(label('x₁', new THREE.Vector3(6.7, 0.4, 0), '#c92a2a'))
      scene.add(label('x₂', new THREE.Vector3(0.4, 6.6, 0), '#2b8a3e'))
      scene.add(label('x₃', new THREE.Vector3(0.4, 0.4, 6.7), '#1864ab'))
    },
    { target: [0, 0.4, 0], camStart: { theta: 0.8, phi: 1.0, r: 17 }, zoom: [9, 38] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }
    const O = new THREE.Vector3(0, 0, 0)

    // ── column span (teal) ── drawn from the independent (pivot) columns ──
    const pivCols = pivots.map(j => v3(cols[j]))
    if (rank === 1) {
      const d = pivCols[0].clone().normalize()
      add(tube(d.clone().multiplyScalar(-8), d.clone().multiplyScalar(8), COL.point, 0.05))
    } else if (rank === 2) {
      const nrm = pivCols[0].clone().cross(pivCols[1])
      const pm = planeMesh(nrm.x, nrm.y, nrm.z, 0, COL.point, 6, 0.2); if (pm) add(pm)
    } else if (rank === 3) {
      add(new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(11, 11, 11)),
        new THREE.LineBasicMaterial({ color: COL.point, transparent: true, opacity: 0.28 })
      ))
    }
    // the three columns of A as teal arrows (they generate col span)
    cols.forEach(c => add(arrowFromTo(O, v3(c), COL.point, 0.045)))

    // ── null space (purple) ── from the free-variable basis vectors ──
    if (nullity === 1) {
      const d = v3(nullBasis[0]).normalize()
      add(tube(d.clone().multiplyScalar(-8), d.clone().multiplyScalar(8), COL.vertex, 0.055))
      add(sphere(d.clone().multiplyScalar(2.2), COL.vertex, 0.16))
    } else if (nullity === 2) {
      const a = v3(nullBasis[0]), b = v3(nullBasis[1])
      const nrm = a.clone().cross(b)
      const pm = planeMesh(nrm.x, nrm.y, nrm.z, 0, COL.vertex, 6, 0.24); if (pm) add(pm)
    } else {
      // null = {0}: a single purple dot at the origin
      add(sphere(O, COL.vertex, 0.18))
    }
  }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  const colTxt = rank === 1 ? 'a line' : rank === 2 ? 'a plane' : 'all of ℝ³'
  const nullTxt = nullity === 0 ? 'just {0}' : nullity === 1 ? 'a line' : 'a plane'
  const badge = nullity === 0
    ? { cls: 'badge-unique', txt: `rank ${rank} · Ax = b has a unique solution when solvable` }
    : { cls: 'badge-infinite', txt: `nullity ${nullity} · Ax = b has ∞ solutions when solvable` }

  return (
    <div className="widget">
      <p className="widget-caption">
        Every matrix <InlineMath>{'A'}</InlineMath> carries two subspaces. The <strong style={{ color: '#0c8599' }}>column
        span</strong> (teal) is everything its columns can reach — the set of <InlineMath>{'b'}</InlineMath> for which
        <InlineMath>{'\\;Ax = b'}</InlineMath> is solvable. The <strong style={{ color: '#6741d9' }}>null space</strong>
        (purple) is everything <InlineMath>{'A'}</InlineMath> crushes to <InlineMath>{'0'}</InlineMath>. Drop the rank and
        watch the trade: as the column span shrinks <InlineMath>{'\\;\\mathbb{R}^3 \\to'}</InlineMath> plane
        <InlineMath>{'\\;\\to'}</InlineMath> line, the null space grows point <InlineMath>{'\\to'}</InlineMath> line
        <InlineMath>{'\\;\\to'}</InlineMath> plane. Their dimensions always sum to 3 — that is the
        <strong> rank–nullity theorem</strong>.
      </p>
      <p className="widget-instructions">drag to orbit · scroll to zoom · switch presets to change the rank</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq" style={{ color: '#0c8599' }}>col span{' '}A = {colTxt} &nbsp;(dim {rank})</div>
              <div className="hud-eq" style={{ color: '#9775fa' }}>null(A) = {nullTxt} &nbsp;(dim {nullity})</div>
              <div className="hud-note">rank + nullity = {rank} + {nullity} = 3 ✓</div>
            </div>
            <div className={`hud-badge ${badge.cls}`}>{badge.txt}</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {ZOO_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`}
              onClick={() => setIdx(i)}>{pr.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <div className="controls-label">Matrix A (columns shown teal)</div>
            {[0, 1, 2].map(r => (
              <div key={r} className="hud-eq" style={{ fontSize: 13, fontFamily: 'monospace' }}>
                [ {A[r].map(x => fmt(x).padStart(4)).join('  ')} ]
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L11() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#e9f0ff', color: '#2563eb', borderColor: '#c9dbf6' }}>
          Module 2 · Lecture 11 · Grizzle Ch. 9 §9.1–9.4
        </div>
        <h1 className="lesson-title">The Vector Space ℝⁿ, Part 2: Subspaces</h1>
        <p className="lesson-subtitle">
          We take a big step up in abstraction. Instead of one linear combination, we study the
          <strong> set of all possible</strong> linear combinations of some vectors. That set is a
          <strong> subspace</strong>, and three of them — the <strong>null space</strong>, the <strong>span</strong> of a
          set, and the <strong>column span</strong> of a matrix — quietly govern when
          <InlineMath>{'\\;Ax = b'}</InlineMath> has no solution, one solution, or infinitely many.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            So far a vector has been a single object and a linear combination
            <InlineMath>{'\\;\\alpha_1 v_1 + \\cdots + \\alpha_k v_k'}</InlineMath> a single result. Now we zoom out and
            ask about <em>all</em> of them at once: take a handful of vectors and form <strong>every</strong> linear
            combination you possibly can. What does that collection look like?
          </p>
          <p>
            Pick one nonzero vector in <InlineMath>{'\\mathbb{R}^3'}</InlineMath> and scale it every which way — you sweep
            out a <strong>line</strong> through the origin. Add a second, independent vector and combine the two freely —
            you fill a <strong>plane</strong> through the origin. A third independent vector fills all of
            <InlineMath>{'\\;\\mathbb{R}^3'}</InlineMath>. Every one of these sets shares a defining trait: do arithmetic
            inside it — add two members, scale a member — and you never escape. That "you can't get out" property is the
            whole idea of a <strong>subspace</strong>.
          </p>
          <p>
            The catch is subtle and the first widget makes it concrete: a line that misses the origin looks just as
            "linear", yet it is <em>not</em> a subspace. Add two of its points and the sum jumps off the line. Subspaces
            are a very special kind of flat set — they must pass through the origin.
          </p>
        </div>
      </section>

      {/* ── Formalism: vector space + subspace ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · ℝⁿ AS A VECTOR SPACE</span></h2>
        <div className="content-block">
          <p>
            We identify the <InlineMath>{'n'}</InlineMath>-tuple <InlineMath>{'(x_1,\\dots,x_n)'}</InlineMath> with a
            column vector, and <InlineMath>{'\\mathbb{R}^n'}</InlineMath> with the set of all such columns. Two operations
            are defined entry-by-entry from the arithmetic of real numbers — vector addition and scalar multiplication:
          </p>
          <DisplayMath>{String.raw`\begin{bmatrix} x_1 \\ \vdots \\ x_n \end{bmatrix} + \begin{bmatrix} y_1 \\ \vdots \\ y_n \end{bmatrix} = \begin{bmatrix} x_1 + y_1 \\ \vdots \\ x_n + y_n \end{bmatrix}, \qquad \alpha\begin{bmatrix} x_1 \\ \vdots \\ x_n \end{bmatrix} = \begin{bmatrix} \alpha x_1 \\ \vdots \\ \alpha x_n \end{bmatrix}.`}</DisplayMath>
          <p>
            These two facts are exactly the special cases <InlineMath>{'\\alpha=\\beta=1'}</InlineMath> and
            <InlineMath>{'\\;\\beta=0'}</InlineMath> of a single statement about <strong>linear combinations</strong>: for
            all reals <InlineMath>{'\\alpha,\\beta'}</InlineMath> and all <InlineMath>{'x,y\\in\\mathbb{R}^n'}</InlineMath>,
            <InlineMath>{'\\;\\alpha x + \\beta y\\in\\mathbb{R}^n'}</InlineMath>. "Closed under linear combinations" and
            "closed under addition <em>and</em> scalar multiplication separately" say the same thing.
          </p>
          <div className="callout callout-success">
            <strong>Definition (subspace).</strong> A nonempty set <InlineMath>{'V\\subset\\mathbb{R}^n'}</InlineMath> is a
            <strong> subspace</strong> if it is closed under linear combinations: for all
            <InlineMath>{'\\;\\alpha,\\beta\\in\\mathbb{R}'}</InlineMath> and all <InlineMath>{'v_1,v_2\\in V'}</InlineMath>,
            <DisplayMath>{String.raw`\alpha v_1 + \beta v_2 \in V.`}</DisplayMath>
            Equivalently, check the two pieces separately: closed under vector addition, and closed under scalar times
            vector.
          </div>
          <div className="callout callout-info">
            <strong>Easy first test.</strong> Every subspace must contain the zero vector — take
            <InlineMath>{'\\;0\\cdot v = 0'}</InlineMath>, which closure forces to be in <InlineMath>{'V'}</InlineMath>. So
            if <InlineMath>{'0\\notin V'}</InlineMath> you can stop: <InlineMath>{'V'}</InlineMath> is <em>not</em> a
            subspace. (Containing <InlineMath>{'0'}</InlineMath> is necessary but <em>not</em> sufficient — you still have
            to check closure.)
          </div>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · IS THIS LINE A SUBSPACE?</span></h2>
        <SubspaceWidget />
      </section>

      {/* ── Worked example 9.1 ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · GRIZZLE 9.1</span></h2>
        <div className="content-block">
          <p>
            Let <InlineMath>{String.raw`V = \left\{ \begin{bmatrix} x \\ mx + b \end{bmatrix} \;\middle|\; x\in\mathbb{R}\right\}`}</InlineMath>,
            the points on the line <InlineMath>{'y = mx + b'}</InlineMath>. Claim:
            <InlineMath>{'\\;V'}</InlineMath> is a subspace of <InlineMath>{'\\mathbb{R}^2'}</InlineMath>
            <strong> if and only if <InlineMath>{'b = 0'}</InlineMath></strong>.
          </p>
          <p>
            <strong>If <InlineMath>{'b = 0'}</InlineMath>:</strong> take two points
            <InlineMath>{String.raw`\;v_1 = \begin{bmatrix} x_1 \\ mx_1 \end{bmatrix}`}</InlineMath>,
            <InlineMath>{String.raw`\;v_2 = \begin{bmatrix} x_2 \\ mx_2 \end{bmatrix}`}</InlineMath>. Then
          </p>
          <DisplayMath>{String.raw`v_1 + v_2 = \begin{bmatrix} x_1 + x_2 \\ m(x_1+x_2) \end{bmatrix} \in V, \qquad \alpha v_1 = \begin{bmatrix} \alpha x_1 \\ m(\alpha x_1) \end{bmatrix} \in V,`}</DisplayMath>
          <p>
            both of the form <InlineMath>{String.raw`\begin{bmatrix} x \\ mx\end{bmatrix}`}</InlineMath>, so closure holds
            and <InlineMath>{'V'}</InlineMath> is a subspace.
          </p>
          <p>
            <strong>If <InlineMath>{'b\\neq 0'}</InlineMath>:</strong> adding two points gives second coordinate
            <InlineMath>{'\\;m(x_1+x_2) + 2b'}</InlineMath>, which is <InlineMath>{'mx + b'}</InlineMath> only if the extra
            <InlineMath>{'\\;b'}</InlineMath> vanishes. It does not, so <InlineMath>{'v_1+v_2\\notin V'}</InlineMath> —
            exactly the rose sum jumping off the line in the widget. (Quicker still: when
            <InlineMath>{'\\;b\\neq0'}</InlineMath> the origin is not on the line, so the easy first test already kills it.)
          </p>
        </div>
      </section>

      {/* ── Formalism: three sources of subspaces ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · THREE SOURCES OF SUBSPACES</span></h2>
        <div className="content-block">
          <p>
            Subspaces are not rare curiosities — they pour out of matrices and vector sets. Three constructions account
            for essentially all of them in this course.
          </p>
          <div className="callout callout-success">
            <strong>1 · Null space of a matrix.</strong> For an <InlineMath>{'n\\times m'}</InlineMath> matrix
            <InlineMath>{'\\;A'}</InlineMath>,
            <DisplayMath>{String.raw`\operatorname{null}(A) := \{\, x\in\mathbb{R}^m \mid Ax = 0 \,\} \subset \mathbb{R}^m,`}</DisplayMath>
            the set of vectors <InlineMath>{'A'}</InlineMath> sends to zero. It is a subspace because if
            <InlineMath>{'\\;Av_1 = Av_2 = 0'}</InlineMath> then <InlineMath>{'A(\\alpha v_1+\\beta v_2)=\\alpha\\cdot0+\\beta\\cdot0=0'}</InlineMath>.
          </div>
          <div className="callout callout-success">
            <strong>2 · Span of a set of vectors.</strong> For <InlineMath>{'S\\subset\\mathbb{R}^n'}</InlineMath>,
            <DisplayMath>{String.raw`\operatorname{span}\{S\} := \{\,\text{all linear combinations of elements of } S\,\}.`}</DisplayMath>
            It is automatically a subspace — combining combinations gives another combination — and it is the
            <em> smallest</em> subspace containing <InlineMath>{'S'}</InlineMath>.
          </div>
          <div className="callout callout-success">
            <strong>3 · Column span of a matrix.</strong> The span of the columns of an
            <InlineMath>{'\\;n\\times m'}</InlineMath> matrix <InlineMath>{'A'}</InlineMath>,
            <DisplayMath>{String.raw`\operatorname{col\,span}\{A\} := \operatorname{span}\{a_1^{\text{col}},\dots,a_m^{\text{col}}\} \subset \mathbb{R}^n.`}</DisplayMath>
            This one carries the headline fact about solvability:
            <DisplayMath>{String.raw`Ax = b \text{ has a solution} \iff b \in \operatorname{col\,span}\{A\}.`}</DisplayMath>
          </div>
          <p>
            Reading the second widget through these definitions: the teal set is
            <InlineMath>{'\\;\\operatorname{col\\,span}\\{A\\}'}</InlineMath> (which <InlineMath>{'b'}</InlineMath>'s are
            reachable) and the purple set is <InlineMath>{'\\operatorname{null}(A)'}</InlineMath> (the directions that
            wash out). When <InlineMath>{'\\operatorname{null}(A)=\\{0\\}'}</InlineMath> a solution, if it exists, is
            unique; when the null space is bigger, you can add any of its vectors to a solution and get another — hence
            infinitely many.
          </p>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · THE SUBSPACE ZOO</span></h2>
        <ZooWidget />
      </section>

      {/* ── Worked example 9.4 ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · GRIZZLE 9.4 (NULL SPACE)</span></h2>
        <div className="content-block">
          <p>
            Compute the null space of <InlineMath>{String.raw`A = \begin{bmatrix} 1 & 3 & 0 \\ 0 & 4 & 1 \end{bmatrix}`}</InlineMath>.
            Since <InlineMath>{'A'}</InlineMath> is <InlineMath>{'2\\times3'}</InlineMath>, the null space lives in
            <InlineMath>{'\\;\\mathbb{R}^3'}</InlineMath>. Set <InlineMath>{'Ax = 0'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`\begin{cases} x_1 + 3x_2 + 0x_3 = 0 \\ 0x_1 + 4x_2 + 1x_3 = 0 \end{cases} \iff \begin{cases} x_1 = -3x_2 \\ x_3 = -4x_2. \end{cases}`}</DisplayMath>
          <p>
            With <InlineMath>{'x_2'}</InlineMath> free (rename it <InlineMath>{'\\alpha'}</InlineMath>), every null-space
            vector is a multiple of one direction:
          </p>
          <DisplayMath>{String.raw`x = \begin{bmatrix} -3x_2 \\ x_2 \\ -4x_2 \end{bmatrix} = \alpha\begin{bmatrix} -3 \\ 1 \\ -4 \end{bmatrix}, \qquad \operatorname{null}(A) = \operatorname{span}\left\{\begin{bmatrix} -3 \\ 1 \\ -4 \end{bmatrix}\right\}.`}</DisplayMath>
          <p>
            Two equations, three unknowns, one free variable — a one-dimensional null space, i.e. a line through the
            origin, exactly the kind of purple line the zoo widget draws for the rank-2 preset.
          </p>
        </div>
      </section>

      {/* ── Worked example 9.9 ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · GRIZZLE 9.9 (COLUMN SPAN)</span></h2>
        <div className="content-block">
          <p>
            Does <InlineMath>{'Ax = b'}</InlineMath> have a solution for
            <InlineMath>{String.raw`\;A = \begin{bmatrix} 3 & 2 \\ 1 & -2 \\ -1 & 1 \end{bmatrix}`}</InlineMath>,
            <InlineMath>{String.raw`\;b = \begin{bmatrix} 0 \\ -8 \\ 5 \end{bmatrix}`}</InlineMath>? The question is purely
            "<InlineMath>{'\\;b\\in\\operatorname{col\\,span}\\{A\\}'}</InlineMath>?" — is
            <InlineMath>{'\\;b'}</InlineMath> a combination of the two columns? Try
            <InlineMath>{'\\;x = (-2, 3)'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`-2\begin{bmatrix} 3 \\ 1 \\ -1 \end{bmatrix} + 3\begin{bmatrix} 2 \\ -2 \\ 1 \end{bmatrix} = \begin{bmatrix} -6+6 \\ -2-6 \\ 2+3 \end{bmatrix} = \begin{bmatrix} 0 \\ -8 \\ 5 \end{bmatrix} = b.`}</DisplayMath>
          <p>
            Yes — <InlineMath>{'b'}</InlineMath> lies in the column span, so a solution exists, namely
            <InlineMath>{'\\;x = (-2,3)'}</InlineMath>. "<InlineMath>{'\\;Ax=b'}</InlineMath> is solvable" and
            "<InlineMath>{'\\;b\\in\\operatorname{col\\,span}\\{A\\}'}</InlineMath>" are two names for one fact.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <p>
            We saw geometrically that as rank falls, the null space grows, with the two dimensions summing to the number
            of columns. That is the <strong>rank–nullity theorem</strong>, and we will state and prove it in Lecture 15
            once we have named <strong>dimension</strong> precisely (Lecture 14's basis vectors).
          </p>
          <p>
            We also keep meeting the span of a set and asking whether a different, <em>nicer</em> set of vectors generates
            the same subspace. The answer is yes, and the "nicer" vectors are <strong>orthogonal</strong> — mutually at
            right angles. To build them we first need a way to measure angles between vectors: the <strong>dot
            product</strong>, the subject of the next lecture, which leads straight to the <strong>Gram–Schmidt
            process</strong> and the <strong>QR factorization</strong>.
          </p>
        </div>
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span></h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🦾</div>
              <h3>Robot Workspace = Range</h3>
              <p>
                The Jacobian <InlineMath>{'J'}</InlineMath> maps joint velocities to end-effector velocities. The set of
                achievable tip motions is exactly <InlineMath>{'\\operatorname{col\\,span}\\{J\\}'}</InlineMath> — the
                robot's instantaneous workspace.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🌀</div>
              <h3>Null-Space Motions</h3>
              <p>
                Vectors in <InlineMath>{'\\operatorname{null}(J)'}</InlineMath> are joint motions that <em>don't</em> move
                the end-effector. Redundant arms exploit them to dodge obstacles or joint limits while holding the tip
                fixed.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">❄️</div>
              <h3>Balancing Laser Forces</h3>
              <p>
                Grizzle's magneto-optical trap balances six laser beams on one atom. The force-balance matrix is
                <InlineMath>{'\\;2\\times6'}</InlineMath>; its 4-dimensional null space is the family of beam adjustments
                that keep the atom clamped in place.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📷</div>
              <h3>Reachability Check</h3>
              <p>
                Before commanding a pose, test whether the target <InlineMath>{'b'}</InlineMath> lies in the column span
                of the task matrix. If not, no joint configuration reaches it — the controller must fall back to a
                least-squares best effort.
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
            question="Which single fact immediately tells you a set V ⊂ ℝⁿ is NOT a subspace?"
            options={[
              'V contains more than one vector',
              'The zero vector is not in V',
              'V is a line rather than a plane',
              'V contains a vector with a negative entry',
            ]}
            correct={1}
            explanation="Every subspace must contain 0 (because 0·v = 0 must stay inside). So 0 ∉ V is an instant disqualifier. Containing 0 is necessary but not sufficient — you still must check closure under addition and scalar multiplication."
          />
          <QuizQ
            num={2} type="Computational"
            question="For A = [[1, 3, 0],[0, 4, 1]], the null space is:"
            options={[
              'Just the zero vector {0}',
              'span{(−3, 1, −4)} — a line through the origin in ℝ³',
              'All of ℝ³',
              'A plane in ℝ²',
            ]}
            correct={1}
            explanation="Ax = 0 gives x₁ = −3x₂ and x₃ = −4x₂ with x₂ free. Every solution is α(−3, 1, −4), so null(A) = span{(−3,1,−4)}, a 1-D line in ℝ³ (two equations, three unknowns ⇒ one free variable)."
          />
          <QuizQ
            num={3} type="Geometric"
            question="In the subspace zoo, a 3×3 matrix has rank 2. What are its column span and null space?"
            options={[
              'Column span = a line, null space = a plane',
              'Column span = a plane, null space = a line',
              'Column span = ℝ³, null space = {0}',
              'Both are planes',
            ]}
            correct={1}
            explanation="Rank 2 means two independent columns, so the column span is a 2-D plane. Rank + nullity = 3, so nullity = 1: the null space is a 1-D line. As rank drops, the column span shrinks and the null space grows in lockstep."
          />
          <QuizQ
            num={4} type="Transfer"
            question="Ax = b is solvable but A has a nonzero null space. How many solutions are there?"
            options={[
              'Exactly one',
              'None',
              'Infinitely many — add any null-space vector to one solution to get another',
              'Exactly as many as the rank of A',
            ]}
            correct={2}
            explanation="If Ax* = b and An = 0 with n ≠ 0, then A(x* + αn) = b + 0 = b for every α. A nontrivial null space turns one solution into a whole line/plane of them — infinitely many."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>State the subspace definition (closed under linear combinations) and the easy first test (must contain 0); name the three sources of subspaces.</div>
            <div className="review-item"><span className="review-day">Day 1</span>Answer: (a) Is the line y = 2x − 1 a subspace? (b) Why is span{'{S}'} always a subspace?</div>
            <div className="review-item"><span className="review-day">Day 3</span>Redo Grizzle 9.4 without notes: compute null([[1,3,0],[0,4,1]]) and report its dimension.</div>
            <div className="review-item"><span className="review-day">Day 7</span>Explain, in one sentence each, why "Ax = b solvable" ⇔ "b ∈ col span{'{A}'}" and why a nonzero null space gives ∞ solutions.</div>
            <div className="review-item"><span className="review-day">Day 14</span>Explain the rank/nullity trade-off to a friend using only the zoo widget — no formulas.</div>
          </div>
        </div>
      </section>

    </div>
  )
}
