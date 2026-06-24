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

// ─── small linear-algebra helpers (local to this lesson) ──────────────────────

// Rank of a set of column vectors = dimension of their span. Gaussian elimination
// with partial pivoting on the matrix whose COLUMNS are the given vectors.
function rankOf(cols, tol = 1e-6) {
  const m = cols.length
  if (m === 0) return 0
  const n = cols[0].length
  const M = Array.from({ length: n }, (_, i) => cols.map(c => c[i])) // n × m, a copy
  let r = 0
  for (let c = 0; c < m && r < n; c++) {
    let piv = r
    for (let i = r + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[piv][c])) piv = i
    if (Math.abs(M[piv][c]) < tol) continue
    const tmp = M[r]; M[r] = M[piv]; M[piv] = tmp
    for (let i = 0; i < n; i++) {
      if (i === r) continue
      const f = M[i][c] / M[r][c]
      for (let j = c; j < m; j++) M[i][j] -= f * M[r][j]
    }
    r++
  }
  return r
}

const v3 = a => new THREE.Vector3(a[0], a[1], a[2])

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — The span grows: one vector is a line, two a plane, three fill ℝ³
//  (unless a vector is a linear combination of the others — then nothing grows)
// ════════════════════════════════════════════════════════════════════════════

// v1, v2 are fixed and span a tilted plane; v3 is the "probe" the user moves to
// see whether the third vector escapes that plane (independent) or lies in it.
const V1 = [3, 0, 1]
const V2 = [0, 3, 1]

const SPAN_PRESETS = [
  { label: '1 vector → a line',                 count: 1, p: { x3: 1, y3: 1, z3: 5 } },
  { label: '2 vectors → a plane',               count: 2, p: { x3: 1, y3: 1, z3: 5 } },
  { label: '3 independent → all of ℝ³',         count: 3, p: { x3: 1, y3: 1, z3: 5 } },
  { label: '3rd is dependent → still a plane',  count: 3, p: { x3: 3, y3: 3, z3: 2 } }, // v3 = v1 + v2
]

const VEC_COLORS = [COL.line1, COL.line2, COL.vertex]

function SpanWidget() {
  const [count, setCount] = useState(SPAN_PRESETS[0].count)
  const [target, setTarget] = useState(SPAN_PRESETS[0].p)
  const [active, setActive] = useState(0)
  const shown = useAnimatedParams(target)
  const dyn = useRef([])

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
    { target: [0, 0.5, 0], camStart: { theta: 0.8, phi: 1.0, r: 16 }, zoom: [8, 36] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }

    const vecs = [V1, V2, [shown.x3, shown.y3, shown.z3]].slice(0, count)
    const r = rankOf(vecs)

    // The span itself, drawn behind the vectors.
    if (r === 1) {
      const d = v3(vecs[0]).normalize()
      add(tube(d.clone().multiplyScalar(-9), d.clone().multiplyScalar(9), COL.guide, 0.04))
    } else if (r === 2) {
      // normal = cross of the first independent pair
      let n = null
      for (let i = 0; i < vecs.length && !n; i++)
        for (let j = i + 1; j < vecs.length && !n; j++) {
          const c = v3(vecs[i]).cross(v3(vecs[j]))
          if (c.length() > 1e-6) n = c
        }
      if (n) { const m = planeMesh(n.x, n.y, n.z, 0, COL.line2, 6, 0.22); if (m) add(m) }
    } else if (r === 3) {
      // The whole space is reachable — suggest it with a faint wireframe box.
      const box = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(11, 11, 11)),
        new THREE.LineBasicMaterial({ color: COL.point, transparent: true, opacity: 0.28 })
      )
      add(box)
    }

    // The active vectors as arrows from the origin.
    const O = new THREE.Vector3(0, 0, 0)
    vecs.forEach((vv, i) => {
      add(arrowFromTo(O, v3(vv), VEC_COLORS[i], 0.05))
      add(sphere(v3(vv), VEC_COLORS[i], 0.13))
    })
  }, [shown, count]) // eslint-disable-line react-hooks/exhaustive-deps

  const vecs = [V1, V2, [target.x3, target.y3, target.z3]].slice(0, count)
  const r = rankOf(vecs)
  const independent = r === count
  const spanTxt = r === 1 ? 'span = a line through the origin'
    : r === 2 ? 'span = a plane through the origin'
      : 'span = all of ℝ³'
  const badge = independent
    ? { cls: 'badge-unique', txt: `✓ linearly independent · dim span = ${r}` }
    : { cls: 'badge-infinite', txt: `✗ linearly dependent · dim span = ${r} < ${count}` }

  function set(k, v) { setTarget(t => ({ ...t, [k]: v })); setActive(-1) }

  return (
    <div className="widget">
      <p className="widget-caption">
        Each colored arrow is a vector in <InlineMath>{'\\mathbb{R}^3'}</InlineMath>. Their <strong>span</strong> is
        every point you can reach by scaling and adding them. One vector spans a <strong>line</strong>; a second
        independent one opens it into a <strong>plane</strong>; a third that escapes the plane fills
        <strong> all of ℝ³</strong>. But if the third arrow already lies in the plane, the span does not grow — those
        vectors are <strong>linearly dependent</strong>.
      </p>
      <p className="widget-instructions">drag to orbit · scroll to zoom · move the purple vector v₃ in and out of the plane</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq" style={{ color: '#ffce6b' }}>v₁ = (3, 0, 1)</div>
              {count >= 2 && <div className="hud-eq" style={{ color: '#86b6ff' }}>v₂ = (0, 3, 1)</div>}
              {count >= 3 && <div className="hud-eq" style={{ color: '#c9a4ff' }}>v₃ = ({fmt(target.x3)}, {fmt(target.y3)}, {fmt(target.z3)})</div>}
              <div className="hud-note">{spanTxt}</div>
            </div>
            <div className={`hud-badge ${badge.cls}`}>{badge.txt}</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {SPAN_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${active === i ? 'active' : ''}`}
              onClick={() => { setCount(pr.count); setTarget(pr.p); setActive(i) }}>{pr.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <div className="controls-label">How many vectors</div>
            <div className="preset-bar" style={{ margin: 0 }}>
              {[1, 2, 3].map(c => (
                <button key={c} className={`preset-btn ${count === c ? 'active' : ''}`}
                  onClick={() => { setCount(c); setActive(-1) }}>{c} vector{c > 1 ? 's' : ''}</button>
              ))}
            </div>
          </div>
          <div className="controls-col">
            <div className="controls-label"><span className="swatch" style={{ background: '#6741d9' }} />Third vector v₃ {count < 3 && '(add a 3rd vector to use)'}</div>
            <SliderRow label="x₃" k="x3" value={target.x3} onChange={set} min={-5} max={5} step={0.5} />
            <SliderRow label="y₃" k="y3" value={target.y3} onChange={set} min={-5} max={5} step={0.5} />
            <SliderRow label="z₃" k="z3" value={target.z3} onChange={set} min={-5} max={5} step={0.5} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — Is b a linear combination of the columns? (existence of a solution)
//  Reach for b with α₁u₁ + α₂u₂; you can land on it iff b lies in span{u₁,u₂}.
//  Built on Grizzle Example 7.4:  u₁ = (3,1,−1), u₂ = (2,−2,1).
// ════════════════════════════════════════════════════════════════════════════

const U1 = [3, 1, -1]
const U2 = [2, -2, 1]

const COMBO_PRESETS = [
  { label: 'b = (0, −8, 5) · reachable  (α = −2, 3)', b: [0, -8, 5], a: { a1: 0, a2: 0 } },
  { label: 'b = (4, 4, 4) · unreachable',            b: [4, 4, 4], a: { a1: 0, a2: 0 } },
]

function ComboWidget() {
  const [bIdx, setBIdx] = useState(0)
  const [target, setTarget] = useState(COMBO_PRESETS[0].a)
  const shown = useAnimatedParams(target)
  const dyn = useRef([])
  const b = COMBO_PRESETS[bIdx].b

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
    { target: [0, -1, 0.5], camStart: { theta: 0.7, phi: 1.05, r: 20 }, zoom: [9, 44] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }
    const O = new THREE.Vector3(0, 0, 0)

    // The plane span{u₁, u₂} — every reachable b lives here.
    const n = v3(U1).cross(v3(U2))
    const pm = planeMesh(n.x, n.y, n.z, 0, COL.line2, 9, 0.16); if (pm) add(pm)

    // The two scaled basis vectors, added tip-to-tail to reach the combination.
    const s1 = v3(U1).multiplyScalar(shown.a1)
    const s2 = v3(U2).multiplyScalar(shown.a2)
    const p = s1.clone().add(s2)
    add(arrowFromTo(O, s1, COL.line1, 0.05))         // α₁u₁
    add(arrowFromTo(s1, p, COL.vertex, 0.05))         // + α₂u₂ (tip to tail)

    // target b and the current reach p, plus the residual gap between them.
    const bv = v3(b)
    add(sphere(bv, COL.line3, 0.26))
    add(sphere(p, COL.point, 0.2))
    if (p.distanceTo(bv) > 0.08) add(tube(p, bv, COL.guide, 0.03))
  }, [shown, bIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  const p = [U1[0] * target.a1 + U2[0] * target.a2, U1[1] * target.a1 + U2[1] * target.a2, U1[2] * target.a1 + U2[2] * target.a2]
  const dist = Math.hypot(p[0] - b[0], p[1] - b[1], p[2] - b[2])
  const reachable = rankOf([U1, U2, b]) === 2 // b in span{u₁,u₂}
  const badge = dist < 0.2
    ? { cls: 'badge-unique', txt: '✓ reached b — Ax = b solved' }
    : reachable
      ? { cls: 'badge-infinite', txt: `b is reachable · keep tuning · gap = ${fmt(dist)}` }
      : { cls: 'badge-none', txt: `✗ b is off the plane · no solution exists · gap ≥ ${fmt(dist)}` }

  function set(k, v) { setTarget(t => ({ ...t, [k]: v })) }

  return (
    <div className="widget">
      <p className="widget-caption">
        The two orange/purple arrows are the columns <InlineMath>{'u_1, u_2'}</InlineMath> of a matrix. Sliding the
        coefficients <InlineMath>{'\\alpha_1, \\alpha_2'}</InlineMath> walks the teal dot
        <InlineMath>{'\\;\\alpha_1 u_1 + \\alpha_2 u_2'}</InlineMath> all over the blue plane — that plane <em>is</em>
        the span of the columns. You can land on the rose target <InlineMath>{'b'}</InlineMath> <strong>if and only
        if</strong> it lies on the plane. That is exactly when <InlineMath>{'A\\mathbf{x}=b'}</InlineMath> has a solution.
      </p>
      <p className="widget-instructions">drag to orbit · scroll to zoom · tune α₁, α₂ to chase the rose dot</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq" style={{ color: '#ffce6b' }}>u₁ = (3, 1, −1)&nbsp;&nbsp;u₂ = (2, −2, 1)</div>
              <div className="hud-eq" style={{ color: '#ffa6c4' }}>b = ({fmt(b[0])}, {fmt(b[1])}, {fmt(b[2])})</div>
              <div className="hud-note">α₁u₁ + α₂u₂ = ({fmt(p[0])}, {fmt(p[1])}, {fmt(p[2])})</div>
            </div>
            <div className={`hud-badge ${badge.cls}`}>{badge.txt}</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {COMBO_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${bIdx === i ? 'active' : ''}`}
              onClick={() => { setBIdx(i); setTarget(pr.a) }}>{pr.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <div className="controls-label"><span className="swatch" style={{ background: '#e8590c' }} />Coefficients of the linear combination</div>
            <SliderRow label="α₁" k="a1" value={target.a1} onChange={set} min={-4} max={4} step={0.5} />
            <SliderRow label="α₂" k="a2" value={target.a2} onChange={set} min={-4} max={4} step={0.5} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L07() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#e9f0ff', color: '#2563eb', borderColor: '#c9dbf6' }}>
          Module 2 · Lecture 7 · Grizzle Ch. 7
        </div>
        <h1 className="lesson-title">The Vector Space ℝⁿ: Linear Combinations &amp; Independence</h1>
        <p className="lesson-subtitle">
          We stop studying one vector at a time and start studying whole <em>collections</em> of them. Two questions
          drive the chapter: which vectors can you build by mixing a given set (their <strong>span</strong>), and is
          any vector in the set redundant (<strong>linear dependence</strong>)? Both turn out to be questions about
          solving <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath> — and the LU factorization answers them.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            So far every chapter has been about <em>solving</em> equations: plug in a candidate, check there is "no
            error." Now we ask deeper questions. Given a handful of vectors, what is the full set of points you can
            reach by scaling and adding them? If you found two solutions to a system, can you manufacture a third
            from them? These are questions about the <strong>structure</strong> of sets of vectors, not just single
            answers — and structure is what lets us later say one solution is "better" than another.
          </p>
          <p>
            Think of the vectors as ingredients and the scalars as amounts. A <strong>linear combination</strong> is
            a recipe: so much of this vector, so much of that one, added up. The <strong>span</strong> is the menu —
            every dish the ingredients can possibly make. Sometimes a new ingredient unlocks genuinely new dishes
            (it points in a fresh direction); sometimes it is just a blend of what you already had and adds nothing.
            That difference is precisely <strong>linear independence vs. dependence</strong>.
          </p>
          <p>
            Geometrically in <InlineMath>{'\\mathbb{R}^3'}</InlineMath>: one nonzero vector spans a <strong>line</strong>,
            two independent vectors span a <strong>plane</strong>, three independent vectors span <strong>all of
            space</strong>. A vector that lies in the plane of the others is redundant — it cannot push the span
            into a new dimension. Rotate the first widget to feel this directly.
          </p>
        </div>
      </section>

      {/* ── Vectors in Rn ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · VECTORS IN ℝⁿ</span></h2>
        <div className="content-block">
          <p>
            An <strong><InlineMath>{'n'}</InlineMath>-tuple</strong> is an ordered list of <InlineMath>{'n'}</InlineMath>
            real numbers. We identify the collection of all of them with <strong>column vectors</strong>:
          </p>
          <DisplayMath>{String.raw`\mathbb{R}^n := \left\{ (x_1, x_2, \dots, x_n) \mid x_i \in \mathbb{R} \right\} \;\longleftrightarrow\; \left\{ \begin{bmatrix} x_1 \\ x_2 \\ \vdots \\ x_n \end{bmatrix} \right\}.`}</DisplayMath>
          <p>
            The <InlineMath>{'x_j'}</InlineMath> are the <strong>components</strong> (or entries) of the vector. In
            ROB 101 a "point" and a "vector" are the same object: an ordered list of numbers. The columns of an
            <InlineMath>{'\\;n\\times m'}</InlineMath> matrix are vectors in <InlineMath>{'\\mathbb{R}^n'}</InlineMath>,
            and conversely any list of vectors can be stacked side-by-side to form a matrix.
          </p>
          <p>Two operations are all we need. <strong>Vector addition</strong> (componentwise) and <strong>scalar multiplication</strong>:</p>
          <DisplayMath>{String.raw`x + y = \begin{bmatrix} x_1 + y_1 \\ \vdots \\ x_n + y_n \end{bmatrix}, \qquad \alpha x = \begin{bmatrix} \alpha x_1 \\ \vdots \\ \alpha x_n \end{bmatrix}, \quad \alpha \in \mathbb{R}.`}</DisplayMath>
          <p>
            These obey the obvious rules — addition is commutative and associative, scalar multiplication distributes
            — all inherited directly from the real numbers. The special vectors
            <InlineMath>{'\\;e_1, e_2, \\dots, e_n'}</InlineMath> (a single 1 in one slot, zeros elsewhere) are the
            <strong> standard unit vectors</strong>.
          </p>
        </div>
      </section>

      {/* ── Linear combinations ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · LINEAR COMBINATIONS &amp; SPAN</span></h2>
        <div className="content-block">
          <p>
            A vector <InlineMath>{'v'}</InlineMath> is a <strong>linear combination</strong> of
            <InlineMath>{'\\;\\{u_1, \\dots, u_m\\}'}</InlineMath> if there exist scalars
            <InlineMath>{'\\;\\alpha_1, \\dots, \\alpha_m'}</InlineMath> with
          </p>
          <DisplayMath>{'v = \\alpha_1 u_1 + \\alpha_2 u_2 + \\cdots + \\alpha_m u_m.'}</DisplayMath>
          <p>
            This is not a new idea in disguise — it <em>is</em> matrix-times-vector. If
            <InlineMath>{'\\;A = \\begin{bmatrix} a_1^{\\text{col}} & \\cdots & a_m^{\\text{col}} \\end{bmatrix}'}</InlineMath>,
            then by the column-times-component view of multiplication,
          </p>
          <DisplayMath>{String.raw`A\mathbf{x} = x_1 a_1^{\text{col}} + x_2 a_2^{\text{col}} + \cdots + x_m a_m^{\text{col}}.`}</DisplayMath>
          <p>
            So <InlineMath>{'A\\mathbf{x}'}</InlineMath> is <em>always</em> a linear combination of the columns of
            <InlineMath>{'\\;A'}</InlineMath>, with the entries of <InlineMath>{'\\mathbf{x}'}</InlineMath> as the
            coefficients. The <strong>span</strong> of a set of vectors is the set of <em>all</em> their linear
            combinations — i.e. <InlineMath>{'\\{A\\mathbf{x} \\mid \\mathbf{x} \\in \\mathbb{R}^m\\}'}</InlineMath>,
            the set of every <InlineMath>{'b'}</InlineMath> you could ever reach.
          </p>
          <div className="callout callout-success">
            <strong>Existence of solutions.</strong> The equation <InlineMath>{'A\\mathbf{x} = b'}</InlineMath> has a
            solution <strong>if and only if</strong> <InlineMath>{'b'}</InlineMath> can be written as a linear
            combination of the columns of <InlineMath>{'A'}</InlineMath> — that is, iff
            <InlineMath>{'\\;b \\in \\operatorname{span}(\\text{columns of } A)'}</InlineMath>.
          </div>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · THE SPAN GROWS — LINE → PLANE → ℝ³</span></h2>
        <SpanWidget />
      </section>

      {/* ── Worked example: linear combination ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · IS v A LINEAR COMBINATION?</span></h2>
        <div className="content-block">
          <p>
            <strong>Example (Grizzle 7.4).</strong> Is <InlineMath>{String.raw`v = \begin{bmatrix} 4 \\ 4 \\ 4 \end{bmatrix}`}</InlineMath>
            a linear combination of <InlineMath>{String.raw`u_1 = \begin{bmatrix} 3 \\ 1 \\ -1 \end{bmatrix}`}</InlineMath>
            and <InlineMath>{String.raw`u_2 = \begin{bmatrix} 2 \\ -2 \\ 1 \end{bmatrix}`}</InlineMath>?
          </p>
          <p>By definition we need <InlineMath>{'\\alpha_1 u_1 + \\alpha_2 u_2 = v'}</InlineMath>, which is three equations in two unknowns:</p>
          <DisplayMath>{String.raw`\begin{cases} 3\alpha_1 + 2\alpha_2 = 4 \\ \alpha_1 - 2\alpha_2 = 4 \\ -\alpha_1 + \alpha_2 = 4 \end{cases}`}</DisplayMath>
          <p>
            The coefficients must satisfy <em>all three</em> equations. Solve any two — say the first two, whose
            <InlineMath>{'\\;2\\times2'}</InlineMath> matrix has determinant <InlineMath>{'-8 \\neq 0'}</InlineMath> —
            to get <InlineMath>{'\\alpha_1 = 2,\\ \\alpha_2 = -1'}</InlineMath>. Now check the equation we did not use:
          </p>
          <DisplayMath>{String.raw`-\alpha_1 + \alpha_2 = -2 + (-1) = -3 \neq 4.`}</DisplayMath>
          <p>
            The third equation fails, so <strong><InlineMath>{'v'}</InlineMath> is NOT a linear combination</strong> of
            <InlineMath>{'\\;u_1, u_2'}</InlineMath>. Geometrically: <InlineMath>{'v=(4,4,4)'}</InlineMath> sits off the
            plane <InlineMath>{'\\operatorname{span}\\{u_1,u_2\\}'}</InlineMath>. But change the target to
            <InlineMath>{'\\;\\bar v = (0,-8,5)'}</InlineMath> and the three equations are consistent with
            <InlineMath>{'\\;\\alpha_1 = -2,\\ \\alpha_2 = 3'}</InlineMath> — now <InlineMath>{'\\bar v'}</InlineMath>
            <em>is</em> a linear combination, because it lands on the plane. Both targets are presets in the widget below.
          </p>
          <div className="callout callout-warning">
            <strong>The recurring punchline.</strong> Checking whether a vector is a linear combination of others always
            reduces to <em>solving a system of linear equations</em>. By hand this is painful for anything bigger than a
            toy. We need a mechanical test — and we already own the machine: the LU factorization.
          </div>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · IS b IN THE SPAN OF THE COLUMNS?</span></h2>
        <ComboWidget />
      </section>

      {/* ── Linear independence ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · LINEAR INDEPENDENCE</span></h2>
        <div className="content-block">
          <p>
            Independence is about the <em>uniqueness</em> of solutions, just as span was about their <em>existence</em>.
            Start from the homogeneous equation <InlineMath>{'A\\alpha = 0'}</InlineMath>. The zero vector
            <InlineMath>{'\\;\\alpha = 0'}</InlineMath> is always a solution (the <strong>trivial</strong> one). The
            question is whether it is the <em>only</em> one.
          </p>
          <div className="callout">
            <strong>Definition.</strong> The vectors <InlineMath>{'\\{v_1, \\dots, v_m\\}'}</InlineMath> are
            <strong> linearly independent</strong> if the only scalars with
            <DisplayMath>{'\\alpha_1 v_1 + \\alpha_2 v_2 + \\cdots + \\alpha_m v_m = 0'}</DisplayMath>
            are <InlineMath>{'\\alpha_1 = \\alpha_2 = \\cdots = \\alpha_m = 0'}</InlineMath>. If instead there exist
            scalars <strong>not all zero</strong> producing the zero vector, the set is <strong>linearly dependent</strong>.
          </div>
          <p>
            Dependence means at least one vector is redundant: you can solve for it as a combination of the others, so
            it adds nothing new to the span. Independence means every vector points somewhere genuinely new. Stacking
            the vectors as the columns of <InlineMath>{'A'}</InlineMath>, the set is independent
            <strong> iff <InlineMath>{'A\\alpha = 0'}</InlineMath> has only the trivial solution</strong>.
          </p>
          <p>
            <strong>Worked example (Grizzle 7.5).</strong> For
            <InlineMath>{String.raw`\;v_1 = \begin{bmatrix} \sqrt{2} \\ 0 \\ 0 \end{bmatrix}, v_2 = \begin{bmatrix} 4 \\ 7 \\ 0 \end{bmatrix}, v_3 = \begin{bmatrix} 3 \\ 1 \\ -1 \end{bmatrix}`}</InlineMath>,
            setting <InlineMath>{'\\alpha_1 v_1 + \\alpha_2 v_2 + \\alpha_3 v_3 = 0'}</InlineMath> gives an upper-triangular system:
          </p>
          <DisplayMath>{String.raw`\begin{bmatrix} \sqrt{2} & 4 & 3 \\ 0 & 7 & 1 \\ 0 & 0 & -1 \end{bmatrix} \begin{bmatrix} \alpha_1 \\ \alpha_2 \\ \alpha_3 \end{bmatrix} = \begin{bmatrix} 0 \\ 0 \\ 0 \end{bmatrix}.`}</DisplayMath>
          <p>
            Back-substitution forces <InlineMath>{'\\alpha_3 = 0'}</InlineMath>, then
            <InlineMath>{'\\;\\alpha_2 = 0'}</InlineMath>, then <InlineMath>{'\\alpha_1 = 0'}</InlineMath> — only the
            trivial solution, so <InlineMath>{'\\{v_1, v_2, v_3\\}'}</InlineMath> are <strong>linearly independent</strong>.
          </p>
        </div>
      </section>

      {/* ── Pro Tip ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">PRO TIP · TESTING INDEPENDENCE WITH LU</span></h2>
        <div className="content-block">
          <p>
            Three equations in two unknowns, four in three… solving these homogeneous systems by hand does not scale.
            The Pro Tip turns independence into a mechanical, square-matrix test. Stack the vectors as the columns of
            <InlineMath>{'\\;A'}</InlineMath>. The following are <strong>equivalent</strong>:
          </p>
          <div className="callout callout-success">
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>The set <InlineMath>{'\\{v_1, \\dots, v_m\\}'}</InlineMath> is linearly independent.</li>
              <li>The <InlineMath>{'m \\times m'}</InlineMath> matrix <InlineMath>{'A^{\\top} A'}</InlineMath> is invertible.</li>
              <li><InlineMath>{'\\det(A^{\\top} A) \\neq 0'}</InlineMath>.</li>
              <li>In any factorization <InlineMath>{'P(A^{\\top} A) = LU'}</InlineMath>, the upper-triangular <InlineMath>{'U'}</InlineMath> has <strong>no zeros on its diagonal</strong>.</li>
            </ul>
          </div>
          <p>
            Why does it work? The key fact is that for any vector <InlineMath>{'y'}</InlineMath>,
            <InlineMath>{'\\;y^{\\top} y = y_1^2 + \\cdots + y_n^2 = 0'}</InlineMath> forces
            <InlineMath>{'\\;y = 0'}</InlineMath>. Apply it with <InlineMath>{'y = A\\alpha'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`A\alpha = 0 \;\Longleftrightarrow\; (A^{\top} A)\,\alpha = 0,`}</DisplayMath>
          <p>
            because multiplying <InlineMath>{'A\\alpha = 0'}</InlineMath> on the left by
            <InlineMath>{'\\;A^{\\top}'}</InlineMath> gives one direction, and the chain
            <InlineMath>{'\\;(A^{\\top}A)\\alpha = 0 \\Rightarrow \\alpha^{\\top}A^{\\top}A\\alpha = 0 \\Rightarrow (A\\alpha)^{\\top}(A\\alpha)=0 \\Rightarrow A\\alpha = 0'}</InlineMath>
            gives the other. The rectangular system on the left and the <strong>square</strong> system on the right have
            the same solutions — so independence (only <InlineMath>{'\\alpha=0'}</InlineMath>) is exactly
            <InlineMath>{'\\;\\det(A^{\\top}A) \\neq 0'}</InlineMath>.
          </p>
          <p>
            <strong>Counting independent vectors.</strong> A refinement of LU called the <strong>LDLᵀ factorization</strong>
            of <InlineMath>{'A^{\\top}A'}</InlineMath> writes <InlineMath>{'P A^{\\top} A P^{\\top} = L D L^{\\top}'}</InlineMath>
            with <InlineMath>{'D'}</InlineMath> diagonal. The number of <strong>non-zero entries on the diagonal of
            <InlineMath>{'\\;D'}</InlineMath></strong> equals the number of linearly independent columns of
            <InlineMath>{'A'}</InlineMath> — i.e. the dimension of their span. Later we will give this number its proper
            name: the <strong>rank</strong>.
          </p>
        </div>
      </section>

      {/* ── Existence + uniqueness ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">PUTTING IT TOGETHER · EXISTENCE AND UNIQUENESS</span></h2>
        <div className="content-block">
          <p>Span and independence are the two halves of the solvability story for <InlineMath>{'A\\mathbf{x}=b'}</InlineMath>:</p>
          <div className="callout callout-success">
            The system <InlineMath>{'A\\mathbf{x} = b'}</InlineMath> has a <strong>unique</strong> solution if and only if
            <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
              <li><InlineMath>{'b'}</InlineMath> is a linear combination of the columns of <InlineMath>{'A'}</InlineMath> (<strong>existence</strong>), <em>and</em></li>
              <li>the columns of <InlineMath>{'A'}</InlineMath> are linearly independent (<strong>uniqueness</strong>).</li>
            </ul>
          </div>
          <p>
            If <InlineMath>{'b'}</InlineMath> is not in the span, there is <em>no</em> solution. If the columns are
            dependent but <InlineMath>{'b'}</InlineMath> is reachable, there are <em>infinitely many</em> solutions.
            Notice none of this required <InlineMath>{'A'}</InlineMath> to be square — these tools handle tall, wide, and
            square systems alike.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <p>
            We can now decide <em>whether</em> a solution exists and whether it is unique — but real engineering data is
            noisy, and most over-determined systems have <strong>no</strong> exact solution at all. The next chapter
            introduces the <strong>Euclidean norm</strong> to measure the "length" of the error vector
            <InlineMath>{'\\;e = A\\mathbf{x} - b'}</InlineMath>, so that when we cannot solve
            <InlineMath>{'\\;A\\mathbf{x}=b'}</InlineMath> exactly we can find the <strong>least-squares</strong> vector
            that comes closest. The number of independent vectors we counted here will return with the name
            <strong> rank</strong>, alongside <strong>subspaces</strong>, <strong>basis</strong>, and
            <strong> orthogonality</strong>.
          </p>
        </div>
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span></h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">📡</div>
              <h3>LiDAR Point Clouds</h3>
              <p>
                A depth scan returns a cloud of vectors in <InlineMath>{'\\mathbb{R}^3'}</InlineMath>. Asking whether the
                points lie on a line, a plane, or fill space is asking the <em>dimension of their span</em> — exactly
                the independence test, and how planar surfaces (floors, walls) are detected.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📈</div>
              <h3>Sensor Fusion &amp; Regression</h3>
              <p>
                Fitting a model to many noisy measurements is asking whether the data vector <InlineMath>{'b'}</InlineMath>
                is a linear combination of feature columns. Usually it is <em>not</em> — it lands just off the span — so
                we settle for the closest reachable point, which is least squares.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🦿</div>
              <h3>Robot Degrees of Freedom</h3>
              <p>
                The columns of a robot's Jacobian are the velocity directions each joint produces. When they become
                linearly dependent the robot hits a <strong>singularity</strong> — it loses a direction of motion,
                exactly the span collapsing from a volume to a plane.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧮</div>
              <h3>Why AᵀA, in Code</h3>
              <p>
                The Pro Tip is not just theory: forming <InlineMath>{'A^{\\top}A'}</InlineMath> and reading the diagonal
                of its LDLᵀ factorization is how a few lines of Julia decide independence for a
                <InlineMath>{'\\;100 \\times 100'}</InlineMath> matrix that no one could ever check by hand.
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
            num={1} type="Geometric"
            question="Three vectors in ℝ³ have a span that is a plane through the origin (not all of ℝ³). What does that tell you?"
            options={[
              'The three vectors are linearly independent',
              'The three vectors are linearly dependent — one lies in the plane of the other two',
              'The vectors must all be parallel',
              'A x = b has a unique solution for every b',
            ]}
            correct={1}
            explanation="If three vectors in ℝ³ only span a plane, their span did not reach dimension 3, so dim span = 2 < 3. At least one vector is a linear combination of the others (it lies in their plane) and contributes no new direction — the set is linearly dependent."
          />
          <QuizQ
            num={2} type="Computational"
            question="Is b = (4, 4, 4) a linear combination of u₁ = (3, 1, −1) and u₂ = (2, −2, 1)?"
            options={[
              'Yes — with α₁ = 2, α₂ = −1',
              'No — solving two of the equations gives α₁ = 2, α₂ = −1, but the third equation fails',
              'Yes — any vector in ℝ³ is a combination of two vectors',
              'There is not enough information to decide',
            ]}
            correct={1}
            explanation="The two equations 3α₁+2α₂=4 and α₁−2α₂=4 give α₁=2, α₂=−1. Substituting into the unused third equation: −α₁+α₂ = −2−1 = −3 ≠ 4. The coefficients must satisfy ALL three equations, so b is not a linear combination of u₁, u₂ — it sits off the plane span{u₁,u₂}."
          />
          <QuizQ
            num={3} type="Definition"
            question="The vectors {v₁, …, vₘ} are linearly independent precisely when:"
            options={[
              'α₁v₁ + ⋯ + αₘvₘ = 0 has some nonzero solution',
              'α₁v₁ + ⋯ + αₘvₘ = 0 forces α₁ = ⋯ = αₘ = 0 (only the trivial solution)',
              'The vectors are all unit length',
              'They can be added to give the zero vector',
            ]}
            correct={1}
            explanation="Linear independence is the uniqueness of the trivial solution to the homogeneous equation Aα = 0. If the only way to combine the vectors into the zero vector is with all coefficients zero, they are independent. A nonzero solution would mean one vector is redundant — dependence."
          />
          <QuizQ
            num={4} type="Transfer"
            question="To test whether the columns of a tall matrix A are linearly independent, the Pro Tip says to:"
            options={[
              'Check whether det(A) ≠ 0 — but A is not square, so this is undefined',
              'Form the square matrix AᵀA and check det(AᵀA) ≠ 0 (equivalently, U from its LU has no zero on the diagonal)',
              'Row-reduce b and see if it has a pivot',
              'Compute the inverse A⁻¹ directly',
            ]}
            correct={1}
            explanation="A rectangular A has no determinant, but AᵀA is always square (m×m). The chain Aα=0 ⟺ (AᵀA)α=0 means independence is exactly det(AᵀA) ≠ 0, which you read off the diagonal of U in an LU factorization (no zero pivots). The LDLᵀ refinement even counts how many columns are independent."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>State the definitions of "linear combination," "span," and "linear independence" from memory, and connect each to a question about A x = b (existence / reach / uniqueness).</div>
            <div className="review-item"><span className="review-day">Day 1</span>Answer: (a) what is dim span of three coplanar vectors in ℝ³? (b) is Aα = 0 having only the trivial solution independence or dependence?</div>
            <div className="review-item"><span className="review-day">Day 3</span>Redo Grizzle 7.4 without notes: show (4,4,4) is not a combination of (3,1,−1) and (2,−2,1), but (0,−8,5) is.</div>
            <div className="review-item"><span className="review-day">Day 7</span>Explain why testing independence reduces to det(AᵀA) ≠ 0 — including the y ᵀy = 0 ⇒ y = 0 step.</div>
            <div className="review-item"><span className="review-day">Day 14</span>Explain to a friend, using only the span widget, why a third vector lying in a plane "adds nothing" — no formulas.</div>
          </div>
        </div>
      </section>

    </div>
  )
}