import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { useOrbitScene } from '../shared/useOrbitScene.js'
import { useAnimatedParams } from '../shared/useAnimatedParams.js'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'
import {
  COL, arrowFromTo, parallelepiped,
  gridFloor, axisArrow, label, disposeObject,
} from '../shared/three-helpers.js'

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — Forward / Back Substitution, one variable uncovered at a time
// ════════════════════════════════════════════════════════════════════════════

const SUB_PRESETS = [
  {
    label: 'Lower 3×3 · forward',
    kind: 'lower',
    A: [[3, 0, 0], [2, -1, 0], [1, -2, 3]],
    b: [6, -2, 2],
  },
  {
    label: 'Upper 3×3 · back',
    kind: 'upper',
    A: [[1, 3, 2], [0, 2, 1], [0, 0, 3]],
    b: [6, -2, 4],
  },
  {
    label: 'Lower 4×4 · forward',
    kind: 'lower',
    A: [[2, 0, 0, 0], [1, 3, 0, 0], [-1, 2, 1, 0], [3, 0, -2, 2]],
    b: [4, 9, 3, 4],
  },
  {
    label: 'Singular · zero pivot',
    kind: 'lower',
    A: [[3, 0, 0, 0], [0, 2, 0, 0], [1, -2, 0, 0], [1, 0, -1, 2]],
    b: [6, -2, 2, 10],
  },
]

// Pre-compute the full sequence of substitution steps for a triangular system.
// Forward substitution walks the rows top→bottom; back substitution bottom→top.
function computeSteps({ A, b, kind }) {
  const n = A.length
  const order = kind === 'lower'
    ? [...Array(n).keys()]
    : [...Array(n).keys()].reverse()
  const x = new Array(n).fill(null)
  const steps = []
  for (let p = 0; p < n; p++) {
    const vi = order[p]
    const usedJs = order.slice(0, p).filter(j => Math.abs(A[vi][j]) > 1e-12)
    const kv = usedJs.map(j => x[j])
    const aii = A[vi][vi]
    let numeric = b[vi]
    usedJs.forEach((j, t) => { numeric -= A[vi][j] * kv[t] })
    const err = Math.abs(aii) < 1e-9
    const val = err ? NaN : numeric / aii
    steps.push({ vi, usedJs, kv, aii, numeric, val, err })
    if (err) { x[vi] = NaN; break }
    x[vi] = val
  }
  return { order, steps }
}

// LaTeX for one step: isolate symbolically, substitute numbers, then the result.
function stepLatex(st, A, b) {
  const i = st.vi + 1
  const den = `a_{${i}${i}}`
  let isoNum, subNum
  if (st.usedJs.length === 0) {
    isoNum = `b_{${i}}`
    subNum = `${fmt(b[st.vi])}`
  } else {
    const isoTerms = st.usedJs.map(j => `a_{${i}${j + 1}}\\,x_{${j + 1}}`).join(' - ')
    const subTerms = st.usedJs
      .map((j, t) => `(${fmt(A[st.vi][j])})(${fmt(st.kv[t])})`).join(' - ')
    isoNum = `b_{${i}} - ${isoTerms}`
    subNum = `${fmt(b[st.vi])} - ${subTerms}`
  }
  const isolate = `x_{${i}} = \\dfrac{${isoNum}}{${den}}`
  const substitute = `\\phantom{x_{${i}}} = \\dfrac{${subNum}}{${fmt(st.aii)}}`
  const result = st.err
    ? `\\phantom{x_{${i}}} = \\dfrac{${fmt(st.numeric)}}{0} \\;\\Rightarrow\\; \\textbf{undefined!}`
    : `\\phantom{x_{${i}}} = \\dfrac{${fmt(st.numeric)}}{${fmt(st.aii)}} = ${fmt(st.val)}`
  return { isolate, substitute, result }
}

function SubstStepper() {
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState(0)        // # of steps already revealed
  const preset = SUB_PRESETS[idx]
  const { A, b, kind } = preset
  const n = A.length
  const { order, steps } = computeSteps(preset)

  const active = done < steps.length ? steps[done] : null
  const blocked = active && active.err                 // can't advance past a zero pivot
  const finished = done >= steps.length

  // value of variable vi if it has been solved by the current point
  const solvedVal = vi => {
    const pos = order.indexOf(vi)
    if (pos < done) return steps[pos].val
    return null
  }

  function choose(i) { setIdx(i); setDone(0) }

  const detTxt = (() => {
    let d = 1
    for (let i = 0; i < n; i++) d *= A[i][i]
    return d
  })()

  return (
    <div className="widget">
      <p className="widget-caption">
        A triangular system is solved by <strong>uncovering one unknown at a time</strong>. In a
        <strong> lower</strong>-triangular system the first equation has only <InlineMath>{'x_1'}</InlineMath>, so we
        start at the top and carry each answer <em>forward</em>. In an <strong>upper</strong>-triangular system the last
        equation has only <InlineMath>{'x_n'}</InlineMath>, so we start at the bottom and work <em>back</em>. Step
        through and watch the solution fill in.
      </p>
      <div className="widget-card">
        <div className="subst">
          {/* matrix view : A | x | b, active equation lit */}
          <div className="subst-matrix">
            <div className="matrix">
              <div className="mgrid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
                {A.map((row, i) => row.map((v, j) => {
                  const isZero = Math.abs(v) < 1e-12
                  const cls = [
                    'mcell',
                    i === j ? 'diag' : '',
                    isZero ? 'zero' : '',
                    active && i === active.vi ? 'rowhi' : '',
                    active && i === active.vi && i === j ? 'pivot' : '',
                  ].join(' ')
                  return <div key={`${i}-${j}`} className={cls}>{fmt(v)}</div>
                }))}
              </div>
            </div>
            <div className="matrix">
              <div className="mgrid" style={{ gridTemplateColumns: '1fr' }}>
                {Array.from({ length: n }, (_, i) => {
                  const val = solvedVal(i)
                  const isActiveVar = active && active.vi === i
                  const cls = [
                    'mcell', 'var',
                    val !== null ? 'solved' : '',
                    isActiveVar ? 'rowhi' : '',
                  ].join(' ')
                  return (
                    <div key={i} className={cls}>
                      {val !== null
                        ? (Number.isNaN(val) ? '—' : fmt(val))
                        : <InlineMath>{`x_{${i + 1}}`}</InlineMath>}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="asm-eq-sign">=</div>
            <div className="matrix">
              <div className="mgrid" style={{ gridTemplateColumns: '1fr' }}>
                {b.map((v, i) => (
                  <div key={i} className={`mcell ${active && i === active.vi ? 'rowhi' : ''}`}>{fmt(v)}</div>
                ))}
              </div>
            </div>
          </div>

          {/* work log : the algebra of the active / completed step */}
          <div className="subst-work">
            <div className="subst-work-head">
              {kind === 'lower' ? 'Forward substitution' : 'Back substitution'}
              <span className="subst-det">det = {fmt(detTxt)}</span>
            </div>
            {finished && !blocked && (
              <div className="subst-status ok">
                ✓ Solved. <InlineMath>{`\\mathbf{x} = (${order
                  .slice()
                  .sort((a, c) => a - c)
                  .map(vi => fmt(steps[order.indexOf(vi)].val))
                  .join(',\\ ')})`}</InlineMath>
              </div>
            )}
            {active && (
              <div className={`subst-step ${active.err ? 'err' : ''}`}>
                <div className="subst-step-tag">
                  Step {done + 1} of {steps.length} · solve for <InlineMath>{`x_{${active.vi + 1}}`}</InlineMath>
                </div>
                <DisplayMath>{stepLatex(active, A, b).isolate}</DisplayMath>
                <DisplayMath>{stepLatex(active, A, b).substitute}</DisplayMath>
                <DisplayMath>{stepLatex(active, A, b).result}</DisplayMath>
                {active.err && (
                  <div className="subst-status err">
                    The pivot <InlineMath>{`a_{${active.vi + 1}${active.vi + 1}}=0`}</InlineMath>, so
                    <InlineMath>{'\\;\\det(A)=0'}</InlineMath> and substitution must divide by zero. The system has no
                    unique solution — exactly the case the determinant warned us about.
                  </div>
                )}
              </div>
            )}
            {!active && done === 0 && (
              <div className="subst-hint">Press <strong>Next ▶</strong> to uncover the first unknown.</div>
            )}
            <div className="subst-controls">
              <button className="step-btn" disabled={done === 0}
                onClick={() => setDone(d => Math.max(0, d - 1))}>◀ Prev</button>
              <button className="step-btn primary" disabled={finished || blocked}
                onClick={() => setDone(d => Math.min(steps.length, d + 1))}>Next ▶</button>
              <button className="step-btn" onClick={() => setDone(0)}>Reset</button>
            </div>
          </div>
        </div>

        <div className="preset-bar">
          {SUB_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`}
              onClick={() => choose(i)}>{pr.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — The determinant of a triangular matrix is the product of its
//  diagonal: the column box keeps its volume under any below-diagonal shear.
// ════════════════════════════════════════════════════════════════════════════

const TRI_PRESETS = [
  { label: 'Lower 3×3 · det = −9', p: { a11: 3, a21: 2, a31: 1, a22: -1, a32: -2, a33: 3 } },
  { label: 'Diagonal box · det = 8', p: { a11: 2, a21: 0, a31: 0, a22: 2, a32: 0, a33: 2 } },
  { label: 'Heavy shear · det = 8', p: { a11: 2, a21: 2.5, a31: -3, a22: 2, a32: 2.5, a33: 2 } },
  { label: 'Zero pivot · det = 0', p: { a11: 2, a21: 1, a31: 1, a22: 0, a32: 2, a33: 2 } },
]

const tcols = s => [
  new THREE.Vector3(s.a11, s.a21, s.a31), // column 1
  new THREE.Vector3(0, s.a22, s.a32),     // column 2 (zero above diagonal)
  new THREE.Vector3(0, 0, s.a33),         // column 3
]

function TriVolumeWidget() {
  const [target, setTarget] = useState(TRI_PRESETS[0].p)
  const [active, setActive] = useState(0)
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
    { target: [0.6, 0.6, 0.6], camStart: { theta: 0.7, phi: 1.0, r: 12 }, zoom: [6, 28] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }

    const [v1, v2, v3] = tcols(shown)
    const d = shown.a11 * shown.a22 * shown.a33
    const fillCol = d > 0.05 ? COL.point : d < -0.05 ? COL.line3 : COL.guide
    add(parallelepiped(v1, v2, v3, fillCol, 0.24))
    const o = new THREE.Vector3(0, 0, 0)
    add(arrowFromTo(o, v1, COL.line1, 0.045))
    add(arrowFromTo(o, v2, COL.line2, 0.045))
    add(arrowFromTo(o, v3, COL.line3, 0.045))
  }, [shown]) // eslint-disable-line react-hooks/exhaustive-deps

  const d = target.a11 * target.a22 * target.a33
  const badge = Math.abs(d) > 1e-9
    ? { cls: 'badge-unique', txt: `det = ${fmt(target.a11)}·${fmt(target.a22)}·${fmt(target.a33)} = ${fmt(d)} ≠ 0` }
    : { cls: 'badge-none', txt: 'det = 0 · a diagonal entry is 0 · box is flat · singular' }

  function set(k, v) { setTarget(t => ({ ...t, [k]: v })); setActive(-1) }

  return (
    <div className="widget">
      <p className="widget-caption">
        Stand the three <strong>columns</strong> of a lower-triangular <InlineMath>{'A'}</InlineMath> up as arrows. Their
        box has volume <InlineMath>{'|\\det A| = |a_{11}\\,a_{22}\\,a_{33}|'}</InlineMath>. Slide the
        <strong> below-diagonal</strong> entries (<InlineMath>{'a_{21},a_{31},a_{32}'}</InlineMath>): the box
        <em> shears</em> but its volume never changes. Slide a <strong>diagonal</strong> entry to zero and the box goes
        flat — that is precisely when <InlineMath>{'\\det A=0'}</InlineMath> and substitution divides by zero.
      </p>
      <p className="widget-instructions">drag to orbit · scroll to zoom · teal = positive orientation, rose = negative</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 11.5 }}>
              <div className="hud-eq" style={{ color: '#ffce6b' }}>col₁ = ({fmt(target.a11)}, {fmt(target.a21)}, {fmt(target.a31)})</div>
              <div className="hud-eq" style={{ color: '#86b6ff' }}>col₂ = (0, {fmt(target.a22)}, {fmt(target.a32)})</div>
              <div className="hud-eq" style={{ color: '#ffa6c4' }}>col₃ = (0, 0, {fmt(target.a33)})</div>
              <div className="hud-note">diag = ({fmt(target.a11)}, {fmt(target.a22)}, {fmt(target.a33)})</div>
            </div>
            <div className={`hud-badge ${badge.cls}`}>{badge.txt}</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {TRI_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${active === i ? 'active' : ''}`}
              onClick={() => { setTarget(pr.p); setActive(i) }}>{pr.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <div className="controls-label"><span className="swatch" style={{ background: '#b5740a' }} />diagonal (sets det)</div>
            <SliderRow label="a₁₁" k="a11" value={target.a11} onChange={set} min={-3} max={3} step={0.25} />
            <SliderRow label="a₂₂" k="a22" value={target.a22} onChange={set} min={-3} max={3} step={0.25} />
            <SliderRow label="a₃₃" k="a33" value={target.a33} onChange={set} min={-3} max={3} step={0.25} />
          </div>
          <div className="controls-col">
            <div className="controls-label"><span className="swatch" style={{ background: '#5c6b85' }} />below diagonal (shear only)</div>
            <SliderRow label="a₂₁" k="a21" value={target.a21} onChange={set} min={-3} max={3} step={0.25} />
            <SliderRow label="a₃₁" k="a31" value={target.a31} onChange={set} min={-3} max={3} step={0.25} />
            <SliderRow label="a₃₂" k="a32" value={target.a32} onChange={set} min={-3} max={3} step={0.25} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L03() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#fdeaec', color: '#d83a45', borderColor: '#f6c9ce' }}>
          Module 1 · Lecture 3 · Grizzle Ch. 3
        </div>
        <h1 className="lesson-title">Triangular Systems: Forward &amp; Back Substitution</h1>
        <p className="lesson-subtitle">
          Most systems <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath> are hard. A special few are almost free.
          When <InlineMath>{'A'}</InlineMath> is <strong>triangular</strong>, the unknowns fall out one at a time — and
          the determinant can be read straight off the diagonal. This structure is the prize the next two lectures are
          built to manufacture.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Lecture 2 gave us a one-number test — <InlineMath>{'\\det(A)\\neq0'}</InlineMath> — for whether a square
            system has a unique solution. It did <em>not</em> tell us how to <em>find</em> that solution, or how to get
            the determinant of anything bigger than a <InlineMath>{'2\\times2'}</InlineMath>. This lecture cracks both
            open by noticing that <strong>some matrices have a shape that makes them trivial to solve.</strong>
          </p>
          <p>
            Picture untangling a chain of dependencies. The first link depends on nothing, so you fix it immediately.
            The second link depends only on the first — now known — so it falls into place. The third depends only on
            the first two, and so on down the line. Nothing ever loops back. That is a <strong>triangular system</strong>:
            equation <InlineMath>{'i'}</InlineMath> involves only the first <InlineMath>{'i'}</InlineMath> unknowns, so the
            answers cascade out in order with nothing but a divide at each step.
          </p>
          <p>
            This is not a toy case. In robotics, a kinematic chain — base joint, then shoulder, then elbow, then wrist —
            is exactly this kind of cascade: each link's position depends only on the joints <em>before</em> it. And in
            Lecture 5 we will learn to <em>force</em> any matrix into triangular form (the <InlineMath>{'LU'}</InlineMath>
            factorization), which is why mastering the triangular case now pays off for <em>every</em> system later.
          </p>
        </div>
      </section>

      {/* ── Warm-up: diagonal ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · WARM-UP: DIAGONAL SYSTEMS</span></h2>
        <div className="content-block">
          <p>
            The easiest system of all is <strong>diagonal</strong>: every off-diagonal coefficient is zero
            (<InlineMath>{'a_{ij}=0'}</InlineMath> for all <InlineMath>{'i\\neq j'}</InlineMath>), so each equation
            contains exactly one unknown.
          </p>
          <DisplayMath>{String.raw`\begin{cases} 4x_1 = 6 \\ -x_2 = 7 \\ 3x_3 = 2 \end{cases} \iff \underbrace{\begin{bmatrix} 4 & 0 & 0 \\ 0 & -1 & 0 \\ 0 & 0 & 3 \end{bmatrix}}_{A}\mathbf{x}=\begin{bmatrix} 6 \\ 7 \\ 2 \end{bmatrix} \;\Rightarrow\; x_1=\tfrac{6}{4},\; x_2=\tfrac{7}{-1},\; x_3=\tfrac{2}{3}.`}</DisplayMath>
          <p>
            Each unknown is just <InlineMath>{'x_i = b_i/a_{ii}'}</InlineMath>, no matter how big the system. The only
            way this fails is if some <InlineMath>{'a_{ii}=0'}</InlineMath>: then row <InlineMath>{'i'}</InlineMath> reads
            <InlineMath>{'\\;0\\cdot x_i = b_i'}</InlineMath>, which has <em>no</em> solution if
            <InlineMath>{'\\;b_i\\neq0'}</InlineMath> and <em>infinitely many</em> if <InlineMath>{'b_i=0'}</InlineMath>.
            And the determinant of a diagonal matrix is just the product of the diagonal,
            <InlineMath>{'\\;\\det(A)=a_{11}a_{22}\\cdots a_{nn}'}</InlineMath> — zero exactly when one of those pivots
            vanishes. Hold onto that observation; it generalizes immediately.
          </p>
        </div>
      </section>

      {/* ── Triangular matrices ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · LOWER &amp; UPPER TRIANGULAR MATRICES</span></h2>
        <div className="content-block">
          <p>
            A square matrix is <strong>lower triangular</strong> if every entry <em>above</em> the diagonal is zero
            (<InlineMath>{'a_{ij}=0'}</InlineMath> for <InlineMath>{'j>i'}</InlineMath>), and <strong>upper triangular</strong>
            if every entry <em>below</em> the diagonal is zero (<InlineMath>{'a_{ij}=0'}</InlineMath> for
            <InlineMath>{'\\;i>j'}</InlineMath>). The entries on and across from the diagonal may be anything.
          </p>
          <DisplayMath>{String.raw`L = \begin{bmatrix} a_{11} & 0 & 0 \\ a_{21} & a_{22} & 0 \\ a_{31} & a_{32} & a_{33} \end{bmatrix} \qquad U = \begin{bmatrix} a_{11} & a_{12} & a_{13} \\ 0 & a_{22} & a_{23} \\ 0 & 0 & a_{33} \end{bmatrix}`}</DisplayMath>
          <p>
            Read structurally: in a lower-triangular system the first equation involves only
            <InlineMath>{'\\;x_1'}</InlineMath>, the second only <InlineMath>{'x_1,x_2'}</InlineMath>, and the
            <InlineMath>{'\\;i'}</InlineMath>-th only <InlineMath>{'x_1,\\dots,x_i'}</InlineMath>. The next two examples
            are <em>not</em> triangular — the boxed terms are the offenders:
          </p>
          <DisplayMath>{String.raw`\begin{bmatrix} 3 & 0 & 0 \\ 2 & -1 & \boxed{-1} \\ 1 & -2 & 3 \end{bmatrix}, \qquad \begin{bmatrix} 3 & \boxed{3} \\ 2 & -1 \end{bmatrix}.`}</DisplayMath>
          <div className="callout callout-info">
            <strong>Determinant of a triangular matrix.</strong> For any square triangular matrix — upper
            <em> or</em> lower — the determinant is the product of the diagonal entries:
            <DisplayMath>{String.raw`\det(A) = a_{11}\cdot a_{22}\cdots a_{nn}.`}</DisplayMath>
            For matrices up to <InlineMath>{'10\\times10'}</InlineMath> you can read off <InlineMath>{'\\det(A)'}</InlineMath>
            by inspection. In particular <InlineMath>{'\\det(A)\\neq0'}</InlineMath> if and only if <em>every</em> diagonal
            entry is non-zero — no multiplication needed to check uniqueness.
          </div>
          <p>
            Example: <InlineMath>{'\\det\\begin{bmatrix}3&0&0\\\\2&-1&0\\\\1&-2&3\\end{bmatrix} = 3\\cdot(-1)\\cdot3 = -9 \\neq 0'}</InlineMath>,
            so that system has a unique solution. But
            <InlineMath>{'\\;\\det\\begin{bmatrix}3&0&0&0\\\\0&2&0&0\\\\1&-2&0&0\\\\1&0&-1&2\\end{bmatrix} = 3\\cdot2\\cdot0\\cdot2 = 0'}</InlineMath> —
            a zero on the diagonal, so it is one of the problem cases.
          </p>
        </div>
      </section>

      {/* ── Interactive: substitution ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · FORWARD / BACK SUBSTITUTION</span></h2>
        <SubstStepper />
      </section>

      {/* ── Forward substitution ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · FORWARD SUBSTITUTION</span></h2>
        <div className="content-block">
          <p>
            For a lower-triangular system we start at the <strong>top</strong> and work down, carrying each solved value
            <em> forward</em> into the next equation. Take
          </p>
          <DisplayMath>{String.raw`\begin{cases} 3x_1 = 6 \\ 2x_1 - x_2 = -2 \\ x_1 - 2x_2 + 3x_3 = 2 \end{cases}`}</DisplayMath>
          <p>Isolate the leading variable in each row and substitute downward:</p>
          <DisplayMath>{String.raw`\begin{aligned} x_1 &= \tfrac{1}{3}(6) = 2 \\ x_2 &= -(-2 - 2x_1) = 2 + 2(2) = 6 \\ x_3 &= \tfrac{1}{3}\big(2 - x_1 + 2x_2\big) = \tfrac{1}{3}\big(2 - 2 + 12\big) = 4. \end{aligned}`}</DisplayMath>
          <p>The general lower-triangular recipe, valid whenever every pivot <InlineMath>{'a_{ii}\\neq0'}</InlineMath>, is</p>
          <DisplayMath>{String.raw`x_1 = \frac{b_1}{a_{11}}, \qquad x_i = \frac{b_i - \sum_{j=1}^{i-1} a_{ij}x_j}{a_{ii}} \quad (i = 2,\dots,n).`}</DisplayMath>
          <div className="callout callout-warning">
            <strong>When forward substitution breaks.</strong> If a diagonal entry is zero, the determinant is zero and
            the method asks us to divide by zero. For the singular <InlineMath>{'4\\times4'}</InlineMath> above, the third
            equation becomes <InlineMath>{'0\\cdot x_3 = 2-(x_1-2x_2)'}</InlineMath> — an impossible demand. Step the
            <strong> “Singular · zero pivot”</strong> preset in the widget to watch it fail at exactly this row.
          </div>
        </div>
      </section>

      {/* ── Back substitution ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · BACK SUBSTITUTION</span></h2>
        <div className="content-block">
          <p>
            For an upper-triangular system the lone variable sits in the <strong>last</strong> equation, so we start at
            the <strong>bottom</strong> and work up. Take
          </p>
          <DisplayMath>{String.raw`\begin{cases} x_1 + 3x_2 + 2x_3 = 6 \\ 2x_2 + x_3 = -2 \\ 3x_3 = 4 \end{cases} \;\Rightarrow\; x_3 = \tfrac{4}{3},\quad x_2 = \tfrac{1}{2}(-2 - x_3) = -\tfrac{5}{3},\quad x_1 = 6 - (3x_2 + 2x_3) = \tfrac{25}{3}.`}</DisplayMath>
          <p>The general upper-triangular recipe, again assuming every <InlineMath>{'a_{ii}\\neq0'}</InlineMath>, is</p>
          <DisplayMath>{String.raw`x_n = \frac{b_n}{a_{nn}}, \qquad x_i = \frac{b_i - \sum_{j=i+1}^{n} a_{ij}x_j}{a_{ii}} \quad (i = n-1,\dots,1).`}</DisplayMath>
          <p>
            Forward and back substitution are mirror images: same divide-by-the-pivot move, opposite direction of
            travel. Both run in roughly <InlineMath>{'n^2'}</InlineMath> operations — cheap. The expensive part of solving
            a general system, we will see, is <em>getting</em> to triangular form, not solving once you are there.
          </p>
        </div>
      </section>

      {/* ── Interactive: triangular determinant ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · WHY det = PRODUCT OF THE DIAGONAL</span></h2>
        <TriVolumeWidget />
      </section>

      {/* ── Worked: Julia back-substitution ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · BACK SUBSTITUTION IN CODE</span></h2>
        <div className="content-block">
          <p>
            Substitution is a <InlineMath>{'\\;n^2'}</InlineMath> loop, ideal for a computer. Here is back substitution
            in Julia. Note the guard that refuses to proceed if any diagonal entry is (numerically) zero — that is the
            <InlineMath>{'\\;\\det(A)=0'}</InlineMath> check in disguise.
          </p>
          <pre className="code-block"><code>{`function backwardsub(U, b)
    # U a square upper-triangular matrix; b same number of rows as U
    # Refuse to run if any pivot is ~0  (i.e. det(U) ≈ 0)
    if minimum(abs.(diag(U))) < 1e-6
        return false
    end
    n = length(b)
    x = Vector{Float64}(undef, n)
    x[n] = b[n] / U[n,n]                       # start at the bottom
    for i = n-1:-1:1                           # ... and work upward
        x[i] = (b[i] - (U[i:i, (i+1):n] * x[(i+1):n])[1]) / U[i,i]
    end
    return x
end`}</code></pre>
          <p>
            Run on a random <InlineMath>{'6\\times6'}</InlineMath> upper-triangular <InlineMath>{'U'}</InlineMath>, the
            residual <InlineMath>{'U\\mathbf{x}-\\mathbf{b}'}</InlineMath> comes back on the order of
            <InlineMath>{'\\;10^{-16}'}</InlineMath> — machine precision. The computed <InlineMath>{'\\mathbf{x}'}</InlineMath>
            is an excellent solution. (The same loop, walking <InlineMath>{'i=1\\!:\\!n'}</InlineMath> and summing the
            terms to the <em>left</em> of the diagonal, gives forward substitution.)
          </p>
        </div>
      </section>

      {/* ── Re-arranging equations ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · A SIMPLE TRICK: RE-ORDER THE EQUATIONS</span></h2>
        <div className="content-block">
          <p>
            What if a system is <em>almost</em> triangular, just shuffled? The equations below are neither upper nor lower
            triangular — but re-ordering the rows fixes that without changing a single solution:
          </p>
          <DisplayMath>{String.raw`\begin{cases} 3x_1 = 6 \\ x_1 - 2x_2 + 3x_3 = 2 \\ 2x_1 - x_2 = -2 \end{cases} \;\xrightarrow{\text{swap rows 2,3}}\; \begin{cases} 3x_1 = 6 \\ 2x_1 - x_2 = -2 \\ x_1 - 2x_2 + 3x_3 = 2 \end{cases}`}</DisplayMath>
          <p>
            Same equations, same answer — just rearranged into a lower-triangular pattern we already know how to solve.
            Swapping rows of a system turns out to be a <em>matrix</em> operation (multiplication by a
            <strong> permutation matrix</strong>), and that small idea becomes essential when we add <em>pivoting</em> to
            <InlineMath>{'\\;LU'}</InlineMath> factorization in Lecture 5.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <p>
            We can now solve any triangular system fast and read its determinant off the diagonal. But most real systems
            are not triangular. The grand plan for Lectures 4–6 is to <strong>reduce every</strong>
            <InlineMath>{'\\;n\\times n'}</InlineMath> system to a pair of triangular solves. To get there we need:
          </p>
          <ul style={{ paddingLeft: 22, marginTop: 4 }}>
            <li>the standard way to <strong>multiply</strong> two matrices — and a lesser-known column-wise view (Lecture 4);</li>
            <li>how to <strong>factor</strong> a square <InlineMath>{'A'}</InlineMath> as a product <InlineMath>{'A=LU'}</InlineMath> of a lower- and an upper-triangular matrix (Lecture 5);</li>
            <li>solving <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath> as <InlineMath>{'L\\mathbf{y}=\\mathbf{b}'}</InlineMath> (forward) then <InlineMath>{'U\\mathbf{x}=\\mathbf{y}'}</InlineMath> (back) — two cheap substitutions.</li>
          </ul>
          <p style={{ marginTop: 14 }}>
            And the determinant of that arbitrary <InlineMath>{'A'}</InlineMath>? Once <InlineMath>{'A=LU'}</InlineMath>, it
            is just the product of the diagonal of <InlineMath>{'U'}</InlineMath> — the very fact we proved geometrically
            in the widget above.
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
              <h3>Kinematic Chains</h3>
              <p>
                A serial robot arm composes transforms link by link: the elbow's pose depends on the shoulder, the
                wrist on the elbow. That one-directional dependency is a lower-triangular cascade — solved exactly like
                forward substitution.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">⚙️</div>
              <h3>Real-Time Solvers</h3>
              <p>
                Embedded controllers cannot afford to re-solve from scratch each tick. They factor once into triangular
                pieces, then every control update is two <InlineMath>{'n^2'}</InlineMath> substitutions — fast enough for
                a 1&nbsp;kHz loop.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📐</div>
              <h3>Determinant by Inspection</h3>
              <p>
                Checking whether a calibration or constraint matrix is invertible reduces, after triangularization, to
                scanning a diagonal for zeros — no expensive cofactor expansion required.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🔀</div>
              <h3>Pivoting &amp; Permutations</h3>
              <p>
                Re-ordering equations to dodge a zero (or tiny) pivot is row-swapping by a permutation matrix — the
                numerical backbone of stable <InlineMath>{'PLU'}</InlineMath> solvers used everywhere from SLAM to deep
                learning.
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
            num={1} type="Geometry"
            question="A 4×4 lower-triangular matrix has diagonal (2, −3, 0, 5). What is its determinant, and is the system solvable for every b?"
            options={[
              'det = 4; unique solution for every b',
              'det = 0; no unique solution',
              'det = −30; unique solution for every b',
              'Cannot tell without the off-diagonal entries',
            ]}
            correct={1}
            explanation="The determinant of a triangular matrix is the product of its diagonal: 2·(−3)·0·5 = 0. A zero on the diagonal forces det = 0, so there is no unique solution regardless of the off-diagonal entries."
          />
          <QuizQ
            num={2} type="Computation"
            question="Solve the lower-triangular system  2x₁ = 4,  3x₁ + 2x₂ = 10  by forward substitution. What is x₂?"
            options={['x₂ = 2', 'x₂ = 3', 'x₂ = 1', 'x₂ = 5']}
            correct={0}
            explanation="From the first equation x₁ = 4/2 = 2. Carry it forward into the second: x₂ = (10 − 3x₁)/2 = (10 − 6)/2 = 4/2 = 2."
          />
          <QuizQ
            num={3} type="Concept"
            question="Why do we start at the bottom for an upper-triangular system but at the top for a lower-triangular one?"
            options={[
              'Convention only — either direction works for either shape',
              'Because that is the equation containing a single unknown, which then unlocks the rest',
              'To make the determinant come out positive',
              'Because matrices are read bottom-to-top',
            ]}
            correct={1}
            explanation="In an upper-triangular system the last equation involves only xₙ; solving it lets you substitute upward. In a lower-triangular system the first equation involves only x₁. You always begin where exactly one unknown remains."
          />
          <QuizQ
            num={4} type="Transfer"
            question="The plan for general systems is A = LU, then solve in two stages. What are the two stages?"
            options={[
              'Solve Ux = b by back-sub, then Ly = x by forward-sub',
              'Solve Ly = b by forward-sub, then Ux = y by back-sub',
              'Invert L and U separately, then multiply',
              'Compute det(A), then divide b by it',
            ]}
            correct={1}
            explanation="With A = LU, Ax = b becomes L(Ux) = b. Let y = Ux. First solve Ly = b by forward substitution (L is lower-triangular), then Ux = y by back substitution (U is upper-triangular). Two cheap n² solves replace one hard one."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>Re-derive the forward-substitution formula xᵢ = (bᵢ − Σⱼ&lt;ᵢ aᵢⱼxⱼ)/aᵢᵢ from scratch, then state the back-substitution mirror.</div>
            <div className="review-item"><span className="review-day">Day 1</span>Answer: (a) det of a triangular matrix? (b) When does substitution divide by zero?</div>
            <div className="review-item"><span className="review-day">Day 3</span>Redo the lower 3×3 (x = (2, 6, 4)) and the upper 3×3 (x = (25/3, −5/3, 4/3)) without notes.</div>
            <div className="review-item"><span className="review-day">Day 7</span>Explain why below-diagonal shear leaves the column box's volume — and hence det — unchanged.</div>
            <div className="review-item"><span className="review-day">Day 14</span>In under 2 minutes, explain the A = LU plan and why two triangular solves beat one general solve.</div>
          </div>
        </div>
      </section>

    </div>
  )
}
