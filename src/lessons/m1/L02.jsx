import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { useOrbitScene } from '../shared/useOrbitScene.js'
import { useAnimatedParams } from '../shared/useAnimatedParams.js'
import { det2, det3 } from '../shared/linalg.js'
import { fmt, lead, term, SliderRow, QuizQ } from '../shared/ui.jsx'
import {
  COL, sphere, arrowFromTo, parallelogram, parallelepiped,
  gridXY, gridFloor, axisArrow, label, disposeObject,
} from '../shared/three-helpers.js'

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — System ⇄ Matrix: how a list of equations becomes  A x = b
// ════════════════════════════════════════════════════════════════════════════

const ASM_PRESETS = [
  {
    label: '2×2 · unique',
    A: [[1, 1], [2, -1]], b: [4, -1], vars: ['x_1', 'x_2'],
  },
  {
    label: '3×3 · a missing coefficient',
    A: [[1, 1, 2], [2, -1, 1], [1, 0, 4]], b: [7, 0.5, 7], vars: ['x_1', 'x_2', 'x_3'],
  },
  {
    label: '2×2 · singular',
    A: [[1, -1], [2, -2]], b: [1, -1], vars: ['x_1', 'x_2'],
  },
  {
    label: '2×3 · non-square',
    A: [[3, 1, 2], [2, -1, 4]], b: [7, 4], vars: ['x_1', 'x_2', 'x_3'],
  },
]

// Build a readable equation string from a coefficient row, omitting zero terms
// (a zero coefficient = that variable is "missing" from the equation).
function eqString(row, vars, rhs) {
  const parts = []
  row.forEach((c, j) => {
    if (Math.abs(c) < 1e-12) return
    const v = `x${vars[j].slice(2)}` // x_1 -> x1 for plain text
    parts.push(parts.length === 0 ? lead(c, v) : ` ${term(c, v)}`)
  })
  return `${parts.join('') || '0'} = ${fmt(rhs)}`
}

function AxbAssembler() {
  const [idx, setIdx] = useState(0)
  const [hi, setHi] = useState(null)          // highlighted row (equation)
  const [showZeros, setShowZeros] = useState(true)
  const { A, b, vars } = ASM_PRESETS[idx]
  const n = A.length, m = A[0].length
  const square = n === m

  let verdict, vcls
  if (!square) {
    verdict = `A is ${n}×${m} — not square, so det(A) is undefined. Uniqueness needs other tools (least squares, Ch. 8).`
    vcls = 'badge-infinite'
  } else {
    const d = m === 2 ? det2(A[0][0], A[0][1], A[1][0], A[1][1]) : det3(A)
    if (Math.abs(d) > 1e-9) { verdict = `det(A) = ${fmt(d)} ≠ 0  ⇒  exactly one solution.`; vcls = 'badge-unique' }
    else { verdict = `det(A) = 0  ⇒  no unique solution (either none or infinitely many).`; vcls = 'badge-none' }
  }

  return (
    <div className="widget">
      <p className="widget-caption">
        Every system of linear equations is really one compact statement: <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath>.
        Row <InlineMath>{'i'}</InlineMath> of <InlineMath>{'A'}</InlineMath> holds the coefficients of equation
        <InlineMath>{'\\;i'}</InlineMath>; column <InlineMath>{'j'}</InlineMath> belongs to the variable
        <InlineMath>{'\\;x_j'}</InlineMath>. Hover an equation to light up its row.
      </p>
      <div className="widget-card">
        <div className="assembler">
          <div className="asm-col">
            <div className="asm-head">The equations</div>
            {A.map((row, i) => (
              <div
                key={i}
                className={`asm-eq ${hi === i ? 'hi' : ''}`}
                onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)}
              >
                {eqString(row, vars, b[i])}
              </div>
            ))}
          </div>

          <div className="asm-col asm-matrix-col">
            <div className="asm-head">Matrix form&nbsp; <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath></div>
            <div className="asm-mx-row">
              {/* A */}
              <div className="matrix">
                <div className="mgrid" style={{ gridTemplateColumns: `repeat(${m}, 1fr)` }}>
                  {A.map((row, i) => row.map((v, j) => {
                    const isZero = Math.abs(v) < 1e-12
                    const cls = [
                      'mcell',
                      square && i === j ? 'diag' : '',
                      isZero ? 'zero' : '',
                      isZero && showZeros ? 'missing' : '',
                      hi === i ? 'rowhi' : '',
                    ].join(' ')
                    return <div key={`${i}-${j}`} className={cls}
                      onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)}>{fmt(v)}</div>
                  }))}
                </div>
              </div>
              {/* x */}
              <div className="matrix">
                <div className="mgrid" style={{ gridTemplateColumns: '1fr' }}>
                  {vars.map((v, j) => <div key={j} className="mcell var"><InlineMath>{v}</InlineMath></div>)}
                </div>
              </div>
              <div className="asm-eq-sign">=</div>
              {/* b */}
              <div className="matrix">
                <div className="mgrid" style={{ gridTemplateColumns: '1fr' }}>
                  {b.map((v, i) => <div key={i} className={`mcell ${hi === i ? 'rowhi' : ''}`}
                    onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)}>{fmt(v)}</div>)}
                </div>
              </div>
            </div>
            <label className="asm-toggle">
              <input type="checkbox" checked={showZeros} onChange={e => setShowZeros(e.target.checked)} />
              outline the inserted “missing-coefficient” zeros
            </label>
          </div>
        </div>

        <div className={`asm-verdict ${vcls}`}>{verdict}</div>

        <div className="preset-bar">
          {ASM_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`}
              onClick={() => { setIdx(i); setHi(null) }}>{pr.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — The 2×2 determinant is the signed AREA of the column parallelogram
// ════════════════════════════════════════════════════════════════════════════

const AREA_PRESETS = [
  { label: 'Identity · det = 1', p: { a: 1, b: 0, c: 0, d: 1 } },
  { label: 'Shear · det = 1',    p: { a: 1, b: 1, c: 0, d: 1 } },
  { label: 'Unique · det = −3',  p: { a: 1, b: 1, c: 2, d: -1 } },
  { label: 'Singular · det = 0', p: { a: 1, b: -1, c: 2, d: -2 } },
]

function DetAreaWidget() {
  const [target, setTarget] = useState(AREA_PRESETS[2].p)
  const [active, setActive] = useState(2)
  const shown = useAnimatedParams(target)
  const dyn = useRef([])

  const { containerRef, ctxRef } = useOrbitScene(
    scene => {
      scene.add(gridXY(6, 1))
      scene.add(axisArrow([1, 0, 0], 6.2, COL.x))
      scene.add(axisArrow([0, 1, 0], 6.2, COL.y))
      scene.add(label('e₁', new THREE.Vector3(6.6, 0.45, 0), '#c92a2a'))
      scene.add(label('e₂', new THREE.Vector3(0.5, 6.5, 0), '#2b8a3e'))
    },
    { target: [0, 0, 0], camStart: { theta: 0.12, phi: 1.45, r: 11 }, zoom: [6, 18], lockPolar: [1.15, 1.97] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }

    const c1 = new THREE.Vector3(shown.a, shown.c, 0.02)
    const c2 = new THREE.Vector3(shown.b, shown.d, 0.02)
    const d = det2(shown.a, shown.b, shown.c, shown.d)
    const fillCol = d > 0.05 ? COL.point : d < -0.05 ? COL.line3 : COL.guide
    add(parallelogram(c1, c2, fillCol, 0.4))
    add(arrowFromTo(new THREE.Vector3(0, 0, 0.04), c1.clone().setZ(0.04), COL.line1, 0.055))
    add(arrowFromTo(new THREE.Vector3(0, 0, 0.04), c2.clone().setZ(0.04), COL.line2, 0.055))
  }, [shown]) // eslint-disable-line react-hooks/exhaustive-deps

  const d = det2(target.a, target.b, target.c, target.d)
  const badge = Math.abs(d) > 1e-9
    ? { cls: 'badge-unique', txt: `det = ${fmt(d)} ≠ 0 · area = ${fmt(Math.abs(d))} · invertible` }
    : { cls: 'badge-none', txt: 'det = 0 · area collapses · columns are parallel · singular' }

  function set(k, v) { setTarget(t => ({ ...t, [k]: v })); setActive(-1) }

  return (
    <div className="widget">
      <p className="widget-caption">
        Stand the two <strong>columns</strong> of <InlineMath>{'A=\\begin{bmatrix} a & b \\\\ c & d\\end{bmatrix}'}</InlineMath>
        up as arrows. The parallelogram they span has area <InlineMath>{'|\\det A| = |ad-bc|'}</InlineMath>. When the
        columns line up, the area collapses to zero — and that is exactly when <InlineMath>{'A'}</InlineMath> is singular.
      </p>
      <p className="widget-instructions">drag to orbit · scroll to zoom · teal = positive orientation, rose = negative</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel">
              <div className="hud-eq" style={{ color: '#ffce6b' }}>col₁ = ({fmt(target.a)}, {fmt(target.c)})</div>
              <div className="hud-eq" style={{ color: '#86b6ff' }}>col₂ = ({fmt(target.b)}, {fmt(target.d)})</div>
              <div className="hud-note">det = ad − bc = {fmt(d)}</div>
            </div>
            <div className={`hud-badge ${badge.cls}`}>{badge.txt}</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {AREA_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${active === i ? 'active' : ''}`}
              onClick={() => { setTarget(pr.p); setActive(i) }}>{pr.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <div className="controls-label"><span className="swatch" style={{ background: '#e8590c' }} />col₁ = (a, c)</div>
            <SliderRow label="a" k="a" value={target.a} onChange={set} min={-3} max={3} step={0.25} />
            <SliderRow label="c" k="c" value={target.c} onChange={set} min={-3} max={3} step={0.25} />
          </div>
          <div className="controls-col">
            <div className="controls-label"><span className="swatch" style={{ background: '#1c7ed6' }} />col₂ = (b, d)</div>
            <SliderRow label="b" k="b" value={target.b} onChange={set} min={-3} max={3} step={0.25} />
            <SliderRow label="d" k="d" value={target.d} onChange={set} min={-3} max={3} step={0.25} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 3 — The 3×3 determinant is the signed VOLUME of the column box
// ════════════════════════════════════════════════════════════════════════════

const VOL_PRESETS = [
  { label: 'Identity · det = 1',          m: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] },
  { label: 'Textbook 3×3 · det = −9',     m: [[1, 1, 2], [2, -1, 1], [1, 0, 4]] },
  { label: 'Sheared cube · det = 1',      m: [[1, 0.6, 0.3], [0, 1, 0.5], [0, 0, 1]] },
  { label: 'Flat / coplanar · det = 0',   m: [[1, 0, 1], [0, 1, 1], [0, 0, 0]] },
]
const vflat = m => { const o = {}; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[`m${r}${c}`] = m[r][c]; return o }
const vcols = s => [
  new THREE.Vector3(s.m00, s.m10, s.m20),
  new THREE.Vector3(s.m01, s.m11, s.m21),
  new THREE.Vector3(s.m02, s.m12, s.m22),
]
const vmat = s => [[s.m00, s.m01, s.m02], [s.m10, s.m11, s.m12], [s.m20, s.m21, s.m22]]

function DetVolumeWidget() {
  const [target, setTarget] = useState(vflat(VOL_PRESETS[1].m))
  const [active, setActive] = useState(1)
  const shown = useAnimatedParams(target)
  const dyn = useRef([])

  const { containerRef, ctxRef } = useOrbitScene(
    scene => {
      scene.add(gridFloor(6, 1))
      scene.add(axisArrow([1, 0, 0], 5.6, COL.x))
      scene.add(axisArrow([0, 1, 0], 5.6, COL.y))
      scene.add(axisArrow([0, 0, 1], 5.6, COL.z))
      scene.add(label('e₁', new THREE.Vector3(6.0, 0.4, 0), '#c92a2a'))
      scene.add(label('e₂', new THREE.Vector3(0.4, 6.0, 0), '#2b8a3e'))
      scene.add(label('e₃', new THREE.Vector3(0.4, 0.4, 6.0), '#1864ab'))
    },
    { target: [0.7, 0.9, 0.7], camStart: { theta: 0.7, phi: 1.0, r: 12 }, zoom: [6, 28] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }

    const [v1, v2, v3] = vcols(shown)
    const d = det3(vmat(shown))
    const fillCol = d > 0.05 ? COL.point : d < -0.05 ? COL.line3 : COL.guide
    add(parallelepiped(v1, v2, v3, fillCol, 0.24))
    const o = new THREE.Vector3(0, 0, 0)
    add(arrowFromTo(o, v1, COL.line1, 0.045))
    add(arrowFromTo(o, v2, COL.line2, 0.045))
    add(arrowFromTo(o, v3, COL.line3, 0.045))
  }, [shown]) // eslint-disable-line react-hooks/exhaustive-deps

  const d = det3(vmat(target))
  const badge = Math.abs(d) > 1e-9
    ? { cls: 'badge-unique', txt: `det = ${fmt(d)} ≠ 0 · volume = ${fmt(Math.abs(d))} · invertible` }
    : { cls: 'badge-none', txt: 'det = 0 · volume collapses · columns are coplanar · singular' }

  function set(k, v) { setTarget(t => ({ ...t, [k]: v })); setActive(-1) }

  return (
    <div className="widget">
      <p className="widget-caption">
        The same idea, one dimension up. The three <strong>columns</strong> of a 3×3 matrix span a box (a
        parallelepiped) whose volume is <InlineMath>{'|\\det A|'}</InlineMath>. Drag the entries until the three
        arrows lie in a common plane: the box flattens, the volume hits zero, and the matrix is singular.
      </p>
      <p className="widget-instructions">drag to orbit · scroll to zoom · each slider group is one column of A</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 11.5 }}>
              <div className="hud-eq" style={{ color: '#ffce6b' }}>col₁ = ({fmt(target.m00)}, {fmt(target.m10)}, {fmt(target.m20)})</div>
              <div className="hud-eq" style={{ color: '#86b6ff' }}>col₂ = ({fmt(target.m01)}, {fmt(target.m11)}, {fmt(target.m21)})</div>
              <div className="hud-eq" style={{ color: '#ffa6c4' }}>col₃ = ({fmt(target.m02)}, {fmt(target.m12)}, {fmt(target.m22)})</div>
            </div>
            <div className={`hud-badge ${badge.cls}`}>{badge.txt}</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {VOL_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${active === i ? 'active' : ''}`}
              onClick={() => { setTarget(vflat(pr.m)); setActive(i) }}>{pr.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <div className="controls-label"><span className="swatch" style={{ background: '#e8590c' }} />col₁</div>
            <SliderRow label="m₁₁" k="m00" value={target.m00} onChange={set} min={-3} max={3} step={0.25} />
            <SliderRow label="m₂₁" k="m10" value={target.m10} onChange={set} min={-3} max={3} step={0.25} />
            <SliderRow label="m₃₁" k="m20" value={target.m20} onChange={set} min={-3} max={3} step={0.25} />
          </div>
          <div className="controls-col">
            <div className="controls-label"><span className="swatch" style={{ background: '#1c7ed6' }} />col₂</div>
            <SliderRow label="m₁₂" k="m01" value={target.m01} onChange={set} min={-3} max={3} step={0.25} />
            <SliderRow label="m₂₂" k="m11" value={target.m11} onChange={set} min={-3} max={3} step={0.25} />
            <SliderRow label="m₃₂" k="m21" value={target.m21} onChange={set} min={-3} max={3} step={0.25} />
          </div>
          <div className="controls-col">
            <div className="controls-label"><span className="swatch" style={{ background: '#c2255c' }} />col₃</div>
            <SliderRow label="m₁₃" k="m02" value={target.m02} onChange={set} min={-3} max={3} step={0.25} />
            <SliderRow label="m₂₃" k="m12" value={target.m12} onChange={set} min={-3} max={3} step={0.25} />
            <SliderRow label="m₃₃" k="m22" value={target.m22} onChange={set} min={-3} max={3} step={0.25} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L02() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#fdeaec', color: '#d83a45', borderColor: '#f6c9ce' }}>
          Module 1 · Lecture 2 · Grizzle Ch. 2
        </div>
        <h1 className="lesson-title">Vectors, Matrices &amp; Determinants</h1>
        <p className="lesson-subtitle">
          The vocabulary and packaging of linear algebra: scalars become vectors, vectors stack into matrices,
          and a whole system of equations collapses into the single statement <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath>.
          Then one number — the determinant — tells us when that system has a unique answer.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            In Lecture 1 we solved systems one equation at a time, by hand. That does not scale. To work
            “at the scale of life” — thousands of LiDAR points, not three toy equations — we need a more compact
            language. This lecture builds that vocabulary.
          </p>
          <p>
            The pieces are simple. A <strong>scalar</strong> is just a number. A <strong>vector</strong> is an
            ordered list of numbers. A <strong>matrix</strong> is a rectangular block of numbers. If you have ever
            used a spreadsheet, you have already met a matrix: rows numbered, columns lettered, each cell a number.
          </p>
          <p>
            The payoff is two-fold. First, any system of linear equations — no matter how big — can be written as
            <InlineMath>{'\\;A\\mathbf{x}=\\mathbf{b}'}</InlineMath>, separating the <em>coefficients</em>
            (<InlineMath>{'A'}</InlineMath>), the <em>unknowns</em> (<InlineMath>{'\\mathbf{x}'}</InlineMath>), and the
            <em> right-hand side</em> (<InlineMath>{'\\mathbf{b}'}</InlineMath>). Second, a single number computed
            from <InlineMath>{'A'}</InlineMath> — its <strong>determinant</strong> — answers the question we ended
            Lecture 1 wanting to answer quickly: <em>does this system have exactly one solution?</em>
          </p>
        </div>
      </section>

      {/* ── Scalars, vectors, arrays ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · SCALARS, VECTORS &amp; ARRAYS</span></h2>
        <div className="content-block">
          <p>
            <strong>Scalars</strong> are ordinary numbers: <InlineMath>{'25.77763,\\ \\sqrt{17},\\ 10,\\ -4,\\ \\pi'}</InlineMath>.
            When we program, a subtle distinction appears that mathematics usually ignores: numbers that need a
            decimal point versus numbers that do not. In Julia these are
            <strong> <InlineMath>{'\\texttt{Float64}'}</InlineMath></strong> (floating-point, e.g. the mass of the
            Earth <InlineMath>{'5.972\\times10^{24}'}</InlineMath> kg) and
            <strong> <InlineMath>{'\\texttt{Int64}'}</InlineMath></strong> (integers). The “float” refers to the
            decimal point <em>floating</em> to wherever it is needed across 64 binary digits.
          </p>
          <div className="callout">
            <strong>New notation: <InlineMath>{'\\;:='}</InlineMath></strong> — the symbol
            <InlineMath>{'\\;x := y'}</InlineMath> means “<InlineMath>{'x'}</InlineMath> is <em>by definition</em> equal
            to <InlineMath>{'y'}</InlineMath>.” You may have seen it written <InlineMath>{'x \\triangleq y'}</InlineMath>.
            We use it whenever we are <em>introducing</em> a name, not asserting a fact to be checked.
          </div>
          <p>
            An <strong>array</strong> is a collection of scalars organized into a list. A <strong>vector</strong> is a
            finite, <em>ordered</em> list of numbers. Order matters: changing it (usually) changes the vector.
          </p>
          <DisplayMath>{String.raw`v = \begin{bmatrix} 1.1 \\ -3 \\ 44.7 \end{bmatrix} \quad\neq\quad w = \begin{bmatrix} 1.1 \\ 44.7 \\ -3 \end{bmatrix}`}</DisplayMath>
          <p>
            Written top-to-bottom like this, <InlineMath>{'v'}</InlineMath> is a <strong>column vector</strong>.
            Written left-to-right it is a <strong>row vector</strong>:
          </p>
          <DisplayMath>{String.raw`v^{\text{row}} = \begin{bmatrix} 1.1 & -3 & 44.7 \end{bmatrix}.`}</DisplayMath>
          <p>
            Column and row vectors are <em>different animals</em> — except for a length-one vector
            <InlineMath>{'\\;v=[v_1]'}</InlineMath>, which is both. The general forms are
            <InlineMath>{'\\;v=[v_1\\ \\cdots\\ v_n]'}</InlineMath> (row) and the corresponding column with entries
            <InlineMath>{'\\;v_1,\\dots,v_n'}</InlineMath> stacked vertically.
          </p>
        </div>
      </section>

      {/* ── Matrices & diagonal ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · MATRICES &amp; THE DIAGONAL</span></h2>
        <div className="content-block">
          <p>
            A <strong>matrix</strong> generalizes a vector to multiple rows <em>and</em> columns, where every row has
            the same number of entries. An <InlineMath>{'n\\times m'}</InlineMath> matrix (read “<InlineMath>{'n'}</InlineMath>
            by <InlineMath>{'m'}</InlineMath>”) has <InlineMath>{'n'}</InlineMath> rows and <InlineMath>{'m'}</InlineMath> columns:
          </p>
          <DisplayMath>{String.raw`A = \begin{bmatrix} a_{11} & a_{12} & \cdots & a_{1m} \\ a_{21} & a_{22} & \cdots & a_{2m} \\ \vdots & \vdots & \ddots & \vdots \\ a_{n1} & a_{n2} & \cdots & a_{nm} \end{bmatrix}`}</DisplayMath>
          <p>
            The entry <InlineMath>{'a_{ij}'}</InlineMath> lives at the intersection of row <InlineMath>{'i'}</InlineMath>
            and column <InlineMath>{'j'}</InlineMath> — <strong>row first, column second</strong>. When
            <InlineMath>{'\\;n=m'}</InlineMath> the matrix is <strong>square</strong>. A <InlineMath>{'1\\times n'}</InlineMath>
            matrix is a row vector and an <InlineMath>{'n\\times 1'}</InlineMath> matrix is a column vector — vectors are
            just skinny matrices.
          </p>
          <div className="callout">
            <strong>The diagonal.</strong> For a square matrix, the <strong>main diagonal</strong> is the list of
            entries whose row and column indices match:
            <DisplayMath>{String.raw`\operatorname{diag}(A) = \begin{bmatrix} a_{11} & a_{22} & \cdots & a_{nn}\end{bmatrix}.`}</DisplayMath>
            It runs from the top-left corner to the bottom-right. The diagonal will turn out to carry an astonishing
            amount of information — in Chapter 5–6 the determinant of a big matrix will be read straight off a diagonal.
          </div>
        </div>
      </section>

      {/* ── Interactive: assembler ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · SYSTEM ⇄ MATRIX</span></h2>
        <AxbAssembler />
      </section>

      {/* ── Worked: building Ax=b ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLES · BUILDING Ax = b</span></h2>
        <div className="content-block">
          <p>The recipe never changes: <strong>rows are equations, columns are variables.</strong></p>
          <h3>A clean 2×2</h3>
          <DisplayMath>{String.raw`\begin{cases} x_1 + x_2 = 4 \\ 2x_1 - x_2 = -1 \end{cases} \iff \underbrace{\begin{bmatrix} 1 & 1 \\ 2 & -1 \end{bmatrix}}_{A}\underbrace{\begin{bmatrix} x_1 \\ x_2\end{bmatrix}}_{\mathbf{x}} = \underbrace{\begin{bmatrix} 4 \\ -1\end{bmatrix}}_{\mathbf{b}}.`}</DisplayMath>

          <h3>“Missing” coefficients are zeros</h3>
          <p>
            If a variable does not appear in an equation, its coefficient is <strong>0</strong> — you must still put a
            <InlineMath>{'\\;0'}</InlineMath> in that slot. The third equation below has no <InlineMath>{'x_2'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`\begin{cases} x_1 + x_2 + 2x_3 = 7 \\ 2x_1 - x_2 + x_3 = 0.5 \\ x_1 \phantom{{}+ x_2} + 4x_3 = 7 \end{cases} \iff \begin{bmatrix} 1 & 1 & 2 \\ 2 & -1 & 1 \\ 1 & \boxed{0} & 4 \end{bmatrix}\begin{bmatrix} x_1 \\ x_2 \\ x_3\end{bmatrix} = \begin{bmatrix} 7 \\ 0.5 \\ 7\end{bmatrix}.`}</DisplayMath>

          <h3>Order is a choice</h3>
          <p>
            Re-ordering the equations re-orders the <em>rows</em>; re-ordering the variables in
            <InlineMath>{'\\;\\mathbf{x}'}</InlineMath> re-orders the <em>columns</em> of <InlineMath>{'A'}</InlineMath>.
            Both give a correct — just differently arranged — version of the same system. Try the presets in the widget
            to see rows light up.
          </p>

          <h3>Equations need not match unknowns</h3>
          <p>
            A system can have more unknowns than equations (or vice-versa). Two equations in three unknowns give a
            non-square <InlineMath>{'2\\times3'}</InlineMath> matrix:
          </p>
          <DisplayMath>{String.raw`\begin{cases} 3x_1 + x_2 + 2x_3 = 7 \\ 2x_1 - x_2 + 4x_3 = 4 \end{cases} \iff \begin{bmatrix} 3 & 1 & 2 \\ 2 & -1 & 4 \end{bmatrix}\mathbf{x} = \begin{bmatrix} 7 \\ 4\end{bmatrix}.`}</DisplayMath>
          <p>Non-square matrices have <em>no</em> determinant — we will need different tools for them (Chapter 8).</p>
        </div>
      </section>

      {/* ── Determinant facts ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · THE DETERMINANT</span></h2>
        <div className="content-block">
          <p>
            The determinant is the most over-mystified object in a first linear algebra course. We will cut to the
            useful part now and save the deep structure for Chapter 6. Here is everything you need to get going.
          </p>
          <div className="callout callout-info">
            <strong>Enough facts about the determinant to get us going</strong>
            <ol>
              <li>The determinant of a square matrix <InlineMath>{'A'}</InlineMath> is a single real number, written <InlineMath>{'\\det(A)'}</InlineMath>.</li>
              <li><strong>The big one:</strong> a square system <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath> has a <em>unique</em> solution for <strong>every</strong> <InlineMath>{'\\mathbf{b}'}</InlineMath> if and only if <InlineMath>{'\\det(A)\\neq 0'}</InlineMath>.</li>
              <li>When <InlineMath>{'\\det(A)=0'}</InlineMath>, the system has either no solution or infinitely many — and the determinant alone cannot tell which (that depends on how <InlineMath>{'\\mathbf{b}'}</InlineMath> relates to <InlineMath>{'A'}</InlineMath>).</li>
              <li><InlineMath>{'\\det([a]) := a'}</InlineMath> for a <InlineMath>{'1\\times1'}</InlineMath> matrix.</li>
              <li><InlineMath>{'\\det\\begin{bmatrix} a & b \\\\ c & d\\end{bmatrix} := ad - bc'}</InlineMath> for a <InlineMath>{'2\\times2'}</InlineMath> matrix.</li>
              <li>The determinant is defined <strong>only for square matrices</strong>.</li>
              <li>By hand you only ever need the <InlineMath>{'2\\times2'}</InlineMath> rule. Bigger determinants we will compute structurally (via the diagonal of a triangular factor) starting in Chapter 5.</li>
            </ol>
          </div>
          <p>
            Fact 2 is the whole reason we care. It connects an <em>algebraic</em> quantity (a number you compute) to a
            <em> geometric</em> truth (do the lines/planes meet at one point?). The next two widgets show
            <em> why</em> <InlineMath>{'\\det=0'}</InlineMath> is exactly the singular case — and the picture is gorgeous.
          </p>
        </div>
      </section>

      {/* ── Interactive: area ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · DETERMINANT AS AREA (2×2)</span></h2>
        <DetAreaWidget />
      </section>

      {/* ── Interactive: volume ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · DETERMINANT AS VOLUME (3×3)</span></h2>
        <DetVolumeWidget />
      </section>

      {/* ── Worked: using the determinant ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLES · USING THE DETERMINANT</span></h2>
        <div className="content-block">
          <p>Reusing the systems from Lecture 1, the determinant now decides uniqueness <em>instantly</em>.</p>
          <h3>Unique</h3>
          <DisplayMath>{String.raw`A = \begin{bmatrix} 1 & 1 \\ 2 & -1\end{bmatrix},\quad \det(A) = (1)(-1) - (1)(2) = -3 \neq 0 \;\Rightarrow\; \text{unique solution.}`}</DisplayMath>
          <h3>Singular (no solution)</h3>
          <DisplayMath>{String.raw`A = \begin{bmatrix} 1 & -1 \\ 2 & -2\end{bmatrix},\quad \det(A) = (1)(-2) - (-1)(2) = 0 \;\Rightarrow\; \text{not unique.}`}</DisplayMath>
          <h3>Singular (infinitely many)</h3>
          <DisplayMath>{String.raw`A = \begin{bmatrix} 1 & -1 \\ 2 & -2\end{bmatrix},\quad \mathbf{b}=\begin{bmatrix}1\\2\end{bmatrix},\quad \det(A) = 0 \;\Rightarrow\; \text{not unique.}`}</DisplayMath>
          <p>
            Notice the last two share the <em>same</em> <InlineMath>{'A'}</InlineMath> and the same
            <InlineMath>{'\\;\\det(A)=0'}</InlineMath>, yet one has no solution and the other infinitely many — exactly
            Fact 3. The determinant flags “not unique”; <InlineMath>{'\\mathbf{b}'}</InlineMath> decides which flavor.
          </p>
          <div className="callout callout-success">
            <strong>The textbook 3×3.</strong> For
            <InlineMath>{'\\;A=\\begin{bmatrix}1&1&2\\\\2&-1&1\\\\1&0&4\\end{bmatrix}'}</InlineMath> one computes
            <InlineMath>{'\\;\\det(A)=-9\\neq0'}</InlineMath>, so the system from Lecture 1 had to have the unique
            answer we ground out by hand — and now we knew it before solving.
          </div>
          <div className="callout callout-warning">
            <strong>Why this matters.</strong> For a <InlineMath>{'5\\times5'}</InlineMath> system with scattered
            coefficients, a computer reports <InlineMath>{'\\det(A)=-540\\neq0'}</InlineMath> in microseconds —
            unique solution, guaranteed, no grinding. That is the leverage we are building toward.
          </div>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <p>
            Fact 7 left a promise unpaid: how do we get the determinant of a big matrix if the
            <InlineMath>{'\\;2\\times2'}</InlineMath> rule is all we compute by hand? The answer is <em>structure</em>.
            The next lectures build the machinery:
          </p>
          <ul style={{ paddingLeft: 22, marginTop: 4 }}>
            <li><strong>Triangular &amp; square matrices</strong>, and how to solve them by <strong>forward / back substitution</strong> (Lecture 3);</li>
            <li>what it means to <strong>multiply</strong> two matrices (Lecture 4);</li>
            <li>how to <strong>factor</strong> any square <InlineMath>{'A'}</InlineMath> into a product of two triangular matrices, <InlineMath>{'A=LU'}</InlineMath> (Lecture 5).</li>
          </ul>
          <p style={{ marginTop: 14 }}>
            The astonishing payoff: once <InlineMath>{'A=LU'}</InlineMath>, the determinant is just the product of the
            diagonal entries of <InlineMath>{'U'}</InlineMath>. The mysterious <InlineMath>{'5\\times5'}</InlineMath>
            determinant becomes five multiplications.
          </p>
        </div>
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span></h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🔌</div>
              <h3>Circuit Currents</h3>
              <p>
                Kirchhoff’s laws on a resistor network turn directly into <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath>
                for the loop currents. With <InlineMath>{'\\det(A)=242{,}310\\neq0'}</InlineMath>, the currents
                <InlineMath>{'\\;(0.245,\\,0.111,\\,0.117)'}</InlineMath> A are uniquely determined.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📐</div>
              <h3>Fitting a Curve</h3>
              <p>
                Three data points <InlineMath>{'(1,6),(2,11),(3,18)'}</InlineMath> and the model
                <InlineMath>{'y=a_2x^2+a_1x+a_0'}</InlineMath> give a <InlineMath>{'3\\times3'}</InlineMath> system in the
                unknown <em>coefficients</em>. Since <InlineMath>{'\\det(A)=-2\\neq0'}</InlineMath>, the fit is unique:
                <InlineMath>{'\\;y=x^2+2x+3'}</InlineMath>.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📊</div>
              <h3>More Data than Unknowns</h3>
              <p>
                Add a fourth data point and <InlineMath>{'A'}</InlineMath> becomes <InlineMath>{'4\\times3'}</InlineMath> —
                non-square, no determinant. “More data” breaks the clean uniqueness story and forces the
                least-squares viewpoint we reach in Chapter 8.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🗂️</div>
              <h3>Data <em>is</em> a Matrix</h3>
              <p>
                A LiDAR scan, an image, a spreadsheet of NOAA weather — all are arrays of numbers. Learning to think
                of data as matrices is what lets one algorithm run on three numbers or three million.
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
            num={1} type="Notation"
            question="In the matrix entry aᵢⱼ, what do the two subscripts mean?"
            options={[
              'i is the column, j is the row',
              'i is the row, j is the column',
              'i and j are interchangeable',
              'i is the value, j is the position',
            ]}
            correct={1}
            explanation="Row first, column second: aᵢⱼ sits at the intersection of row i and column j. This convention is universal and worth burning into memory."
          />
          <QuizQ
            num={2} type="Computation"
            question="What is det of [[3, 1], [2, 4]] ?"
            options={['10', '14', '−10', '5']}
            correct={0}
            explanation="det = ad − bc = (3)(4) − (1)(2) = 12 − 2 = 10. Nonzero, so this matrix is invertible and the corresponding 2×2 system has a unique solution."
          />
          <QuizQ
            num={3} type="Concept"
            question="A square system has det(A) = 0. What can you conclude?"
            options={[
              'It has exactly one solution',
              'It definitely has no solution',
              'It has no unique solution — either none or infinitely many',
              'A must not be a real matrix',
            ]}
            correct={2}
            explanation="det = 0 rules out a unique solution (Fact 2). It is then either inconsistent (none) or under-determined (infinitely many); the determinant alone cannot distinguish these — that depends on b (Fact 3)."
          />
          <QuizQ
            num={4} type="Geometry"
            question="The columns of a 3×3 matrix, drawn as arrows from the origin, all lie in one plane. What is det(A)?"
            options={[
              'Zero — the spanned box is flat, volume 0',
              'One — the box is a unit cube',
              'Negative — the orientation flipped',
              'Undefined — the matrix is not square',
            ]}
            correct={0}
            explanation="|det(A)| is the volume of the parallelepiped spanned by the columns. Coplanar columns span a flat box of zero volume, so det(A) = 0 and A is singular — exactly the geometric meaning of Fact 2."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>Write any 3-equation system and convert it to Ax = b from memory, inserting zeros for missing coefficients.</div>
            <div className="review-item"><span className="review-day">Day 1</span>State the 2×2 determinant rule and Fact 2 (unique ⟺ det ≠ 0) without notes.</div>
            <div className="review-item"><span className="review-day">Day 3</span>Explain, using the area picture, why det = 0 means the columns are parallel and the matrix is singular.</div>
            <div className="review-item"><span className="review-day">Day 7</span>Compute det of three different 2×2 matrices and classify each system as unique or not.</div>
            <div className="review-item"><span className="review-day">Day 14</span>Describe the determinant as a volume in 3D and connect “coplanar columns” to “no unique solution.”</div>
          </div>
        </div>
      </section>

    </div>
  )
}
