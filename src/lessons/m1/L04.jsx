import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { useOrbitScene } from '../shared/useOrbitScene.js'
import { useAnimatedParams } from '../shared/useAnimatedParams.js'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'
import {
  COL, arrowFromTo, gridXY, axisArrow, label, disposeObject,
} from '../shared/three-helpers.js'

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — Matrix multiply, one output entry at a time: the ij-entry of A·B
//  is the i-th ROW of A dotted with the j-th COLUMN of B. Also shows the size
//  rule [n×k]·[k×m] = [n×m] and why a mismatch is undefined.
// ════════════════════════════════════════════════════════════════════════════

const MUL_PRESETS = [
  { label: '2×2 · 2×2 (AB ≠ BA)', A: [[1, 2], [3, 4]], B: [[5, -2], [6, 1]] },
  { label: '3×2 · 2×2',           A: [[1, 2], [3, 4], [5, 6]], B: [[3, 4], [2, 1]] },
  { label: '2×2 · 2×1 (matrix·vector)', A: [[1, 2], [3, 4]], B: [[5], [6]] },
  { label: 'Size mismatch · 3×2 · 3×2', A: [[1, 2], [3, 4], [5, 6]], B: [[1, 2], [3, 4], [5, 6]] },
]

// LaTeX for the active output entry: symbolic row·column, then the numbers.
function cellLatex(A, B, i, j, k) {
  const sym = Array.from({ length: k }, (_, t) => `a_{${i + 1}${t + 1}}b_{${t + 1}${j + 1}}`).join(' + ')
  const num = Array.from({ length: k }, (_, t) => `(${fmt(A[i][t])})(${fmt(B[t][j])})`).join(' + ')
  const val = Array.from({ length: k }, (_, t) => A[i][t] * B[t][j]).reduce((a, b) => a + b, 0)
  return {
    sym: `c_{${i + 1}${j + 1}} = ${sym}`,
    num: `\\phantom{c_{${i + 1}${j + 1}}} = ${num} = ${fmt(val)}`,
    val,
  }
}

function MatMulStepper() {
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState(0)            // # of output entries already revealed
  const { A, B } = MUL_PRESETS[idx]
  const n = A.length, k = A[0].length            // A is n × k
  const kB = B.length, m = B[0].length           // B is kB × m
  const compat = k === kB

  // row-major list of output cells, only meaningful when compatible
  const cells = compat ? Array.from({ length: n * m }, (_, p) => ({ i: Math.floor(p / m), j: p % m })) : []
  const active = done < cells.length ? cells[done] : null
  const finished = compat && done >= cells.length

  // value of an output entry once it has been revealed
  const cellVal = (i, j) => {
    const pos = i * m + j
    if (pos >= done) return null
    return Array.from({ length: k }, (_, t) => A[i][t] * B[t][j]).reduce((a, b) => a + b, 0)
  }

  function choose(i) { setIdx(i); setDone(0) }

  const lx = active ? cellLatex(A, B, active.i, active.j, k) : null

  return (
    <div className="widget">
      <p className="widget-caption">
        The entry in row <InlineMath>{'i'}</InlineMath>, column <InlineMath>{'j'}</InlineMath> of the product
        <InlineMath>{'\\;A\\cdot B'}</InlineMath> is the <strong>i-th row of <InlineMath>{'A'}</InlineMath></strong> dotted
        with the <strong>j-th column of <InlineMath>{'B'}</InlineMath></strong>. Step through and watch each output entry
        light up its row and column. The product is defined only when the <em>inner</em> dimensions match
        (<InlineMath>{'[n\\times k]\\cdot[k\\times m]'}</InlineMath>) — the last preset shows what a mismatch looks like.
      </p>
      <div className="widget-card">
        <div className="mmul">
          {/* size rule */}
          <div className={`mmul-rule ${compat ? 'ok' : 'bad'}`}>
            <span>[{n}×<b>{k}</b>]</span><span className="mmul-dot">·</span><span>[<b>{kB}</b>×{m}]</span>
            {compat
              ? <><span className="mmul-arrow">=</span><span>[{n}×{m}]</span><span className="mmul-verdict ok">inner dims match</span></>
              : <span className="mmul-verdict bad">inner dims {k} ≠ {kB} — undefined</span>}
          </div>

          {/* A · B = C */}
          <div className="mmul-stage">
            <div className="matrix">
              <div className="mgrid" style={{ gridTemplateColumns: `repeat(${k}, 1fr)` }}>
                {A.map((row, i) => row.map((v, t) => (
                  <div key={`${i}-${t}`} className={`mcell ${active && i === active.i ? 'rowhi' : ''}`}>{fmt(v)}</div>
                )))}
              </div>
            </div>
            <div className="mmul-op">·</div>
            <div className="matrix">
              <div className="mgrid" style={{ gridTemplateColumns: `repeat(${m}, 1fr)` }}>
                {B.map((row, t) => row.map((v, j) => (
                  <div key={`${t}-${j}`} className={`mcell ${active && j === active.j ? 'colhi' : ''}`}>{fmt(v)}</div>
                )))}
              </div>
            </div>
            <div className="asm-eq-sign">=</div>
            {compat ? (
              <div className="matrix">
                <div className="mgrid" style={{ gridTemplateColumns: `repeat(${m}, 1fr)` }}>
                  {Array.from({ length: n }, (_, i) => Array.from({ length: m }, (_, j) => {
                    const val = cellVal(i, j)
                    const isActive = active && active.i === i && active.j === j
                    const cls = ['mcell', val !== null ? 'solved' : '', isActive ? 'prodhi' : ''].join(' ')
                    return (
                      <div key={`${i}-${j}`} className={cls}>
                        {val !== null ? fmt(val) : (isActive ? '?' : '·')}
                      </div>
                    )
                  }))}
                </div>
              </div>
            ) : (
              <div className="mmul-undef">undefined</div>
            )}
          </div>

          {/* work log */}
          <div className="mmul-work subst-work">
            <div className="subst-work-head">
              Standard multiplication · row · column
              {compat && <span className="subst-det">{done}/{cells.length} entries</span>}
            </div>
            {!compat && (
              <div className="subst-status err">
                <InlineMath>{'A'}</InlineMath> has <strong>{k}</strong> columns but <InlineMath>{'B'}</InlineMath> has
                <strong> {kB}</strong> rows. To dot a row of <InlineMath>{'A'}</InlineMath> with a column of
                <InlineMath>{'\\;B'}</InlineMath> they must be the same length, so the product
                <InlineMath>{'\\;A\\cdot B'}</InlineMath> is not defined. (Swapping to <InlineMath>{'B\\cdot A'}</InlineMath>
                would be <InlineMath>{'[3\\times2]\\cdot[3\\times2]'}</InlineMath> — also a mismatch.)
              </div>
            )}
            {finished && (
              <div className="subst-status ok">✓ Every entry computed — that is the full product <InlineMath>{'A\\cdot B'}</InlineMath>.</div>
            )}
            {active && (
              <div className="subst-step">
                <div className="subst-step-tag">
                  Entry <InlineMath>{`c_{${active.i + 1}${active.j + 1}}`}</InlineMath> · row {active.i + 1} of
                  <InlineMath>{'\\;A'}</InlineMath> <span style={{ color: 'var(--blue)' }}>■</span> · column {active.j + 1} of
                  <InlineMath>{'\\;B'}</InlineMath> <span style={{ color: 'var(--green)' }}>■</span>
                </div>
                <DisplayMath>{lx.sym}</DisplayMath>
                <DisplayMath>{lx.num}</DisplayMath>
              </div>
            )}
            {compat && !active && done === 0 && (
              <div className="subst-hint">Press <strong>Next ▶</strong> to compute the first output entry.</div>
            )}
            <div className="subst-controls">
              <button className="step-btn" disabled={!compat || done === 0}
                onClick={() => setDone(d => Math.max(0, d - 1))}>◀ Prev</button>
              <button className="step-btn primary" disabled={!compat || finished}
                onClick={() => setDone(d => Math.min(cells.length, d + 1))}>Next ▶</button>
              <button className="step-btn" disabled={!compat} onClick={() => setDone(0)}>Reset</button>
            </div>
          </div>
        </div>

        <div className="preset-bar">
          {MUL_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`}
              onClick={() => choose(i)}>{pr.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — Matrix · vector as a geometric transform. The columns of A are
//  where the basis vectors e₁, e₂ land, and A·v is the same linear combination
//  of those columns:  A·v = v₁·col₁ + v₂·col₂.
// ════════════════════════════════════════════════════════════════════════════

const c = Math.cos, s = Math.sin
const T_PRESETS = [
  { label: 'Identity', m: [[1, 0], [0, 1]] },
  { label: 'Rotate 18°', m: [[c(Math.PI / 10), -s(Math.PI / 10)], [s(Math.PI / 10), c(Math.PI / 10)]] },
  { label: 'Rotate 135°', m: [[c(3 * Math.PI / 4), -s(3 * Math.PI / 4)], [s(3 * Math.PI / 4), c(3 * Math.PI / 4)]] },
  { label: 'Scale ×0.5', m: [[0.5, 0], [0, 0.5]] },
  { label: 'General A₄', m: [[-0.6, 0.6], [-0.336, -0.084]] },
]
// pack a 2×2 matrix m plus the input vector into one flat param object
const packT = (m, vx, vy) => ({ a: m[0][0], b: m[0][1], cc: m[1][0], d: m[1][1], vx, vy })

function TransformWidget() {
  const [target, setTarget] = useState(packT(T_PRESETS[1].m, 2.0, 0.5))
  const [active, setActive] = useState(1)
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
    { target: [0, 0, 0], camStart: { theta: 0.1, phi: 1.45, r: 12 }, zoom: [7, 20], lockPolar: [1.15, 1.97] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }

    const o = new THREE.Vector3(0, 0, 0.04)
    const col1 = new THREE.Vector3(shown.a, shown.cc, 0.02)   // image of e₁
    const col2 = new THREE.Vector3(shown.b, shown.d, 0.02)    // image of e₂
    const v = new THREE.Vector3(shown.vx, shown.vy, 0.04)
    const av = new THREE.Vector3(
      shown.a * shown.vx + shown.b * shown.vy,
      shown.cc * shown.vx + shown.d * shown.vy, 0.05)

    // faint guides: where the standard basis vectors land = columns of A
    add(arrowFromTo(o, col1, COL.line1, 0.028))
    add(arrowFromTo(o, col2, COL.point, 0.028))
    // the input vector (blue) and its image A·v (red)
    add(arrowFromTo(o, v, COL.z, 0.055))
    add(arrowFromTo(o, av, COL.x, 0.055))
  }, [shown]) // eslint-disable-line react-hooks/exhaustive-deps

  const { a, b, cc, d, vx, vy } = target
  const avx = a * vx + b * vy, avy = cc * vx + d * vy
  const det = a * d - b * cc

  function set(kk, val) { setTarget(t => ({ ...t, [kk]: val })); setActive(-1) }

  return (
    <div className="widget">
      <p className="widget-caption">
        Multiplying a vector by a matrix <strong>moves</strong> it. The two faint arrows are the columns of
        <InlineMath>{'\\;A'}</InlineMath> — exactly where the basis vectors <InlineMath>{'e_1,e_2'}</InlineMath> are sent.
        The <span style={{ color: '#1971c2', fontWeight: 700 }}>blue</span> vector is your input
        <InlineMath>{'\\;v'}</InlineMath>; the <span style={{ color: '#e03131', fontWeight: 700 }}>red</span> vector is
        <InlineMath>{'\\;A\\cdot v = v_1\\,\\text{col}_1 + v_2\\,\\text{col}_2'}</InlineMath>. Rotations spin it, scalings
        stretch it — and composing two such matrices is one matrix multiply.
      </p>
      <p className="widget-instructions">drag to orbit · scroll to zoom · faint arrows = columns of A = images of e₁, e₂</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 11.5 }}>
              <div className="hud-eq">A = [{fmt(a)} {fmt(b)}; {fmt(cc)} {fmt(d)}]</div>
              <div className="hud-eq" style={{ color: '#86b6ff' }}>v = ({fmt(vx)}, {fmt(vy)})</div>
              <div className="hud-eq" style={{ color: '#ff9a9a' }}>A·v = ({fmt(avx)}, {fmt(avy)})</div>
              <div className="hud-note">det A = {fmt(det)} · area scale = {fmt(Math.abs(det))}×</div>
            </div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {T_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${active === i ? 'active' : ''}`}
              onClick={() => { setTarget(packT(pr.m, target.vx, target.vy)); setActive(i) }}>{pr.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <div className="controls-label"><span className="swatch" style={{ background: '#1971c2' }} />input vector v</div>
            <SliderRow label="v₁" k="vx" value={target.vx} onChange={set} min={-4} max={4} step={0.25} />
            <SliderRow label="v₂" k="vy" value={target.vy} onChange={set} min={-4} max={4} step={0.25} />
          </div>
          <div className="controls-col">
            <div className="controls-label"><span className="swatch" style={{ background: '#e8590c' }} />col₁ = A·e₁ = (a, c)</div>
            <SliderRow label="a" k="a" value={target.a} onChange={set} min={-2} max={2} step={0.1} />
            <SliderRow label="c" k="cc" value={target.cc} onChange={set} min={-2} max={2} step={0.1} />
          </div>
          <div className="controls-col">
            <div className="controls-label"><span className="swatch" style={{ background: '#099268' }} />col₂ = A·e₂ = (b, d)</div>
            <SliderRow label="b" k="b" value={target.b} onChange={set} min={-2} max={2} step={0.1} />
            <SliderRow label="d" k="d" value={target.d} onChange={set} min={-2} max={2} step={0.1} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L04() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#fdeaec', color: '#d83a45', borderColor: '#f6c9ce' }}>
          Module 1 · Lecture 4 · Grizzle Ch. 4
        </div>
        <h1 className="lesson-title">Matrix Multiplication</h1>
        <p className="lesson-subtitle">
          One operation underlies almost everything ahead: multiplying two matrices. We build it from the ground up — a
          row vector times a column vector — then assemble the full product, meet a second column-wise way of computing
          it that unlocks <InlineMath>{'LU'}</InlineMath> factorization, and see how a single matrix encodes rotations
          and row-swaps alike.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            So far a matrix has been a <em>container</em> — coefficients packed next to the unknowns of a system. Matrix
            multiplication gives it a second life as a <strong>verb</strong>: a thing that <em>acts</em>. Multiplying a
            vector by a matrix transforms it — rotates it, stretches it, reflects it. Multiplying two matrices
            <em> composes</em> their actions into one.
          </p>
          <p>
            Picture a robot wrist. One matrix rotates a point about the base; a second rotates it about the shoulder.
            Apply them in turn and the point lands somewhere new — but the <em>combined</em> motion is itself a single
            rotation, captured by one matrix: the <strong>product</strong> of the two. That is the whole reason we
            multiply matrices — to collapse a chain of operations into one object you can store, send to a motor
            controller, or invert.
          </p>
          <p>
            The mechanics rest on one small move — multiplying a row of numbers by a column of numbers — repeated in a
            disciplined pattern. Get that single move right and matrices of any size follow. And one quietly important
            detail will recur all course: <strong>order matters</strong>. Rotating then scaling is not the same as
            scaling then rotating, and <InlineMath>{'A\\cdot B\\neq B\\cdot A'}</InlineMath> in general.
          </p>
        </div>
      </section>

      {/* ── Row times column ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · A ROW VECTOR TIMES A COLUMN VECTOR</span></h2>
        <div className="content-block">
          <p>
            Everything begins here. Let <InlineMath>{'a^{\\text{row}} = [a_1\\ a_2\\ \\cdots\\ a_k]'}</InlineMath> be a row
            vector and <InlineMath>{'b^{\\text{col}}'}</InlineMath> a column vector with the <strong>same number of
            elements</strong>. Their product is the single number
          </p>
          <DisplayMath>{String.raw`a^{\text{row}}\cdot b^{\text{col}} := \sum_{i=1}^{k} a_i b_i = a_1 b_1 + a_2 b_2 + \cdots + a_k b_k.`}</DisplayMath>
          <p>
            The visual form is just as good for hand work — march across the row and down the column in lockstep,
            multiply each pair, and add:
          </p>
          <DisplayMath>{String.raw`\begin{bmatrix} a_1 & a_2 & \cdots & a_k\end{bmatrix}\cdot\begin{bmatrix} b_1 \\ b_2 \\ \vdots \\ b_k\end{bmatrix} := a_1 b_1 + a_2 b_2 + \cdots + a_k b_k.`}</DisplayMath>
          <div className="callout callout-warning">
            <strong>Lengths must match.</strong> The product is defined <em>only</em> when the row and column have the
            same number of entries — there is no pairing otherwise. A column “times” a row is a different story we tackle
            in the second method below, and it will <em>not</em> be this single number.
          </div>
          <p>Three quick numerical checks (the second one is deliberately broken):</p>
          <DisplayMath>{String.raw`\begin{bmatrix}1&2&3\end{bmatrix}\!\cdot\!\begin{bmatrix}4\\5\\6\end{bmatrix} = 4+10+18 = 32, \qquad \begin{bmatrix}1&2&3\end{bmatrix}\!\cdot\!\begin{bmatrix}4\\5\end{bmatrix} = \text{error!}`}</DisplayMath>
          <DisplayMath>{String.raw`\begin{bmatrix}2&-3&-1&11\end{bmatrix}\!\cdot\!\begin{bmatrix}3\\5\\-1\\-2\end{bmatrix} = 6 - 15 + 1 - 22 = -30.`}</DisplayMath>
        </div>
      </section>

      {/* ── Partitions ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · PARTITIONING A MATRIX INTO ROWS &amp; COLUMNS</span></h2>
        <div className="content-block">
          <p>
            To multiply whole matrices we view each one as a stack of rows, or a row of columns. For an
            <InlineMath>{'\\;n\\times m'}</InlineMath> matrix <InlineMath>{'A'}</InlineMath>, the
            <InlineMath>{'\\;i'}</InlineMath>-th row is the <InlineMath>{'1\\times m'}</InlineMath> vector
            <InlineMath>{'\\;a^{\\text{row}}_i = [a_{i1}\\ a_{i2}\\ \\cdots\\ a_{im}]'}</InlineMath>, and the
            <InlineMath>{'\\;j'}</InlineMath>-th column is the <InlineMath>{'n\\times 1'}</InlineMath> vector with entries
            <InlineMath>{'\\;a_{1j},\\dots,a_{nj}'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`A = \begin{bmatrix} 1 & 2 & 3 \\ 4 & 5 & 6\end{bmatrix} = \begin{bmatrix} a^{\text{row}}_1 \\[2pt] a^{\text{row}}_2 \end{bmatrix},\quad a^{\text{row}}_1 = \begin{bmatrix}1&2&3\end{bmatrix},\ a^{\text{row}}_2 = \begin{bmatrix}4&5&6\end{bmatrix},`}</DisplayMath>
          <DisplayMath>{String.raw`A = \begin{bmatrix} a^{\text{col}}_1 & a^{\text{col}}_2 & a^{\text{col}}_3\end{bmatrix},\quad a^{\text{col}}_1 = \begin{bmatrix}1\\4\end{bmatrix},\ a^{\text{col}}_2 = \begin{bmatrix}2\\5\end{bmatrix},\ a^{\text{col}}_3 = \begin{bmatrix}3\\6\end{bmatrix}.`}</DisplayMath>
          <p>
            Note the bookkeeping: a row vector of <InlineMath>{'A'}</InlineMath> has as many entries as
            <InlineMath>{'\\;A'}</InlineMath> has <em>columns</em>, and a column vector has as many entries as
            <InlineMath>{'\\;A'}</InlineMath> has <em>rows</em>. This is exactly the fact that makes the size rule below
            work.
          </p>
        </div>
      </section>

      {/* ── Standard multiplication ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · STANDARD MATRIX MULTIPLICATION</span></h2>
        <div className="content-block">
          <p>
            Let <InlineMath>{'A'}</InlineMath> be <InlineMath>{'n\\times k'}</InlineMath> and
            <InlineMath>{'\\;B'}</InlineMath> be <InlineMath>{'k\\times m'}</InlineMath>. When the number of
            <strong> columns of <InlineMath>{'A'}</InlineMath></strong> equals the number of
            <strong> rows of <InlineMath>{'B'}</InlineMath></strong>, the product is defined and is
            <InlineMath>{'\\;n\\times m'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`[\,n\times k\,]\cdot[\,k\times m\,] = [\,n\times m\,].`}</DisplayMath>
          <p>
            The matching inner dimension <InlineMath>{'k'}</InlineMath> is consumed; the outer dimensions
            <InlineMath>{'\\;n'}</InlineMath> and <InlineMath>{'m'}</InlineMath> survive as the shape of the answer. The
            <InlineMath>{'\\;ij'}</InlineMath>-entry is the <InlineMath>{'i'}</InlineMath>-th row of
            <InlineMath>{'\\;A'}</InlineMath> dotted with the <InlineMath>{'j'}</InlineMath>-th column of
            <InlineMath>{'\\;B'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`[A\cdot B]_{ij} := a^{\text{row}}_i \cdot b^{\text{col}}_j = \sum_{\ell=1}^{k} a_{i\ell}\,b_{\ell j}.`}</DisplayMath>
          <div className="callout callout-info">
            <strong>Reading the size rule.</strong>
            <ul>
              <li><InlineMath>{'[4\\times2]\\cdot[2\\times5] = [4\\times5]'}</InlineMath> ✓</li>
              <li><InlineMath>{'[1\\times11]\\cdot[11\\times1] = [1\\times1]'}</InlineMath> ✓ (a single number)</li>
              <li><InlineMath>{'[4\\times3]\\cdot[4\\times4] = '}</InlineMath> <strong>undefined</strong> — inner dims <InlineMath>{'3\\neq4'}</InlineMath>.</li>
            </ul>
          </div>
          <p>
            Because the rule treats <InlineMath>{'A'}</InlineMath> and <InlineMath>{'B'}</InlineMath> asymmetrically,
            swapping them usually changes the answer — and may not even be legal. <strong>Order matters:</strong> in
            general <InlineMath>{'A\\cdot B\\neq B\\cdot A'}</InlineMath>, unlike multiplying two ordinary numbers.
          </p>
        </div>
      </section>

      {/* ── Interactive: matrix multiply ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · MATRIX MULTIPLY, ENTRY BY ENTRY</span></h2>
        <MatMulStepper />
      </section>

      {/* ── Worked: order matters ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLES · STANDARD METHOD</span></h2>
        <div className="content-block">
          <h3>A 2×2 product — and why order matters</h3>
          <p>With <InlineMath>{'A=\\begin{bmatrix}1&2\\\\3&4\\end{bmatrix}'}</InlineMath> and <InlineMath>{'B=\\begin{bmatrix}5&-2\\\\6&1\\end{bmatrix}'}</InlineMath>, compute both orders:</p>
          <DisplayMath>{String.raw`A\cdot B = \begin{bmatrix}(1)(5)+(2)(6) & (1)(-2)+(2)(1) \\ (3)(5)+(4)(6) & (3)(-2)+(4)(1)\end{bmatrix} = \begin{bmatrix}11 & 0 \\ 39 & -2\end{bmatrix},`}</DisplayMath>
          <DisplayMath>{String.raw`B\cdot A = \begin{bmatrix}(5)(1)+(-2)(3) & (5)(2)+(-2)(4) \\ (6)(1)+(1)(3) & (6)(2)+(1)(4)\end{bmatrix} = \begin{bmatrix}-1 & 2 \\ 9 & 16\end{bmatrix}.`}</DisplayMath>
          <p>
            Same two matrices, two completely different products: <InlineMath>{'A\\cdot B\\neq B\\cdot A'}</InlineMath>.
            For square matrices of equal size both orders are <em>defined</em>, but they almost never agree.
          </p>
          <h3>A non-square product</h3>
          <p>
            With <InlineMath>{'A=\\begin{bmatrix}1&2\\\\3&4\\\\5&6\\end{bmatrix}'}</InlineMath>
            (<InlineMath>{'3\\times2'}</InlineMath>) and <InlineMath>{'B=\\begin{bmatrix}3&4\\\\2&1\\end{bmatrix}'}</InlineMath>
            (<InlineMath>{'2\\times2'}</InlineMath>), only <InlineMath>{'A\\cdot B'}</InlineMath> is legal
            (<InlineMath>{'[3\\times2]\\cdot[2\\times2]=[3\\times2]'}</InlineMath>); <InlineMath>{'B\\cdot A'}</InlineMath>
            would be <InlineMath>{'[2\\times2]\\cdot[3\\times2]'}</InlineMath> — a mismatch.
          </p>
          <DisplayMath>{String.raw`A\cdot B = \begin{bmatrix} 1\cdot3+2\cdot2 & 1\cdot4+2\cdot1 \\ 3\cdot3+4\cdot2 & 3\cdot4+4\cdot1 \\ 5\cdot3+6\cdot2 & 5\cdot4+6\cdot1\end{bmatrix} = \begin{bmatrix}7 & 6 \\ 17 & 16 \\ 27 & 26\end{bmatrix}.`}</DisplayMath>
        </div>
      </section>

      {/* ── Column × row method ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · A SECOND METHOD: SUM OF COLUMNS × ROWS</span></h2>
        <div className="content-block">
          <p>
            Here is a different-looking recipe that gives the <em>identical</em> answer. Instead of rows of
            <InlineMath>{'\\;A'}</InlineMath> times columns of <InlineMath>{'B'}</InlineMath>, take <strong>columns of
            <InlineMath>{'\\;A'}</InlineMath> times rows of <InlineMath>{'B'}</InlineMath></strong> and add them up. For
            <InlineMath>{'\\;A'}</InlineMath> that is <InlineMath>{'n\\times k'}</InlineMath> and
            <InlineMath>{'\\;B'}</InlineMath> that is <InlineMath>{'k\\times m'}</InlineMath>,
          </p>
          <DisplayMath>{String.raw`A\cdot B = \sum_{i=1}^{k} a^{\text{col}}_i\, b^{\text{row}}_i.`}</DisplayMath>
          <p>
            Each term is a <strong>column (<InlineMath>{'n\\times1'}</InlineMath>) times a row
            (<InlineMath>{'1\\times m'}</InlineMath>)</strong>, which produces a full <InlineMath>{'n\\times m'}</InlineMath>
            matrix; summing the <InlineMath>{'k'}</InlineMath> of them rebuilds the product. Reusing the
            <InlineMath>{'\\;3\\times2'}</InlineMath> example:
          </p>
          <DisplayMath>{String.raw`a^{\text{col}}_1 b^{\text{row}}_1 = \begin{bmatrix}1\\3\\5\end{bmatrix}\begin{bmatrix}3&4\end{bmatrix} = \begin{bmatrix}3&4\\9&12\\15&20\end{bmatrix},\qquad a^{\text{col}}_2 b^{\text{row}}_2 = \begin{bmatrix}2\\4\\6\end{bmatrix}\begin{bmatrix}2&1\end{bmatrix} = \begin{bmatrix}4&2\\8&4\\12&6\end{bmatrix},`}</DisplayMath>
          <DisplayMath>{String.raw`a^{\text{col}}_1 b^{\text{row}}_1 + a^{\text{col}}_2 b^{\text{row}}_2 = \begin{bmatrix}7&6\\17&16\\27&26\end{bmatrix} = A\cdot B.\ \checkmark`}</DisplayMath>
          <div className="callout callout-success">
            <strong>Why bother?</strong> Almost nobody computes products this way by hand — but this is the view that makes
            <InlineMath>{'\\;LU'}</InlineMath> factorization fall out almost for free in Lecture 5. Reducing a hard system
            <InlineMath>{'\\;A\\mathbf{x}=\\mathbf{b}'}</InlineMath> to two easy triangular solves rests entirely on
            seeing <InlineMath>{'A\\cdot B'}</InlineMath> as a sum of columns times rows. File it away.
          </div>
        </div>
      </section>

      {/* ── Permutation matrices ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · PERMUTATION MATRICES: SWAPPING ROWS IS MULTIPLICATION</span></h2>
        <div className="content-block">
          <p>
            In Lecture 3 we re-ordered equations to expose a triangular shape. That row-swap is itself a matrix
            multiply. The system on the left is neither upper nor lower triangular; swapping rows 2 and 3 fixes it:
          </p>
          <DisplayMath>{String.raw`A_O = \begin{bmatrix} 3 & 0 & 0 \\ 1 & -2 & 3 \\ 2 & -1 & 0\end{bmatrix} \;\xrightarrow{\text{swap rows 2,3}}\; A_L = \begin{bmatrix} 3 & 0 & 0 \\ 2 & -1 & 0 \\ 1 & -2 & 3\end{bmatrix}.`}</DisplayMath>
          <p>Left-multiplying by the right matrix <InlineMath>{'P'}</InlineMath> performs the swap on both <InlineMath>{'A_O'}</InlineMath> and the right-hand side <InlineMath>{'b_O'}</InlineMath>:</p>
          <DisplayMath>{String.raw`P = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 0 & 1 \\ 0 & 1 & 0\end{bmatrix}, \qquad P\cdot A_O = A_L, \qquad P\cdot b_O = b_L.`}</DisplayMath>
          <div className="callout callout-info">
            <strong>How to build <InlineMath>{'P'}</InlineMath>.</strong> Take the identity matrix
            <InlineMath>{'\\;I'}</InlineMath> and swap exactly the rows you want to swap in <InlineMath>{'A_O'}</InlineMath>.
            That is your permutation matrix. In general, a <strong>permutation matrix</strong> is any square matrix of
            <InlineMath>{'\\;0'}</InlineMath>s and <InlineMath>{'1'}</InlineMath>s with a single
            <InlineMath>{'\\;1'}</InlineMath> in every row and every column — a pure re-ordering of the rows of
            <InlineMath>{'\\;I'}</InlineMath>.
          </div>
          <p>
            When <InlineMath>{'P'}</InlineMath> just swaps a pair of rows, applying it twice undoes it:
            <InlineMath>{'\\;P\\cdot P = I'}</InlineMath>. More general re-orderings (cycles of three or more rows) do not
            satisfy <InlineMath>{'P\\cdot P=I'}</InlineMath>, but every permutation matrix has the beautiful property —
            previewed now, proved in Chapter 6 — that its inverse is simply its transpose:
          </p>
          <DisplayMath>{String.raw`P^{-1} = P^{\top}, \qquad\text{so}\qquad P^{\top}\!\cdot P = P\cdot P^{\top} = I.`}</DisplayMath>
          <p>
            Inverses are usually hard and may not even exist — but for permutation matrices you get the inverse free, just
            by flipping rows and columns. This is the backbone of <strong>pivoting</strong> in
            <InlineMath>{'\\;PLU'}</InlineMath> factorization (Lecture 5).
          </p>
        </div>
      </section>

      {/* ── Interactive: transform ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · A MATRIX TRANSFORMS A VECTOR</span></h2>
        <TransformWidget />
      </section>

      {/* ── Worked: geometry / Julia ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · MATRICES THAT ROTATE &amp; SCALE</span></h2>
        <div className="content-block">
          <p>
            Take <InlineMath>{'v=\\begin{bmatrix}2.0\\\\0.5\\end{bmatrix}'}</InlineMath> and hit it with four matrices.
            The first two are <strong>rotation</strong> matrices, the third a <strong>scaling</strong>, the fourth a
            general mix of both:
          </p>
          <DisplayMath>{String.raw`A_1 = \begin{bmatrix}\cos\tfrac{\pi}{10} & -\sin\tfrac{\pi}{10}\\ \sin\tfrac{\pi}{10} & \cos\tfrac{\pi}{10}\end{bmatrix}\!,\ A_1 v = \begin{bmatrix}1.748\\1.094\end{bmatrix}\quad A_3 = \begin{bmatrix}0.5 & 0\\0 & 0.5\end{bmatrix}\!,\ A_3 v = \begin{bmatrix}1.0\\0.25\end{bmatrix}.`}</DisplayMath>
          <p>
            <InlineMath>{'A_1'}</InlineMath> rotates <InlineMath>{'v'}</InlineMath> by <InlineMath>{'18^\\circ'}</InlineMath>
            without changing its length; <InlineMath>{'A_3'}</InlineMath> halves its length without changing its
            direction. This is exactly the operation behind <strong>LiDAR image registration</strong>: Cassie the robot
            collects 60 scans, each from a slightly different head angle and body position, and each scan's
            <InlineMath>{'\\;(x,y,z)'}</InlineMath> points are multiplied by a matrix that undoes that scan's rotation and
            shift, so all 60 line up into one crisp map. Building a map is matrix-vector multiplication, hundreds of
            thousands of times over.
          </p>
          <pre className="code-block"><code>{`# Apply a 2×2 transform to every column of a 2×N point cloud
A  = [cos(θ) -sin(θ); sin(θ) cos(θ)]   # a rotation
Pc = A * cloud                          # cloud is 2×N; Pc is 2×N
# Column j of Pc is A * (column j of cloud): one matrix multiply
# rotates the entire scan at once.`}</code></pre>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <p>
            Watch what happens when we multiply a lower-triangular <InlineMath>{'L'}</InlineMath> by an upper-triangular
            <InlineMath>{'\\;U'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`L = \begin{bmatrix}1&0&0\\-2&1&0\\3&-2&1\end{bmatrix},\ U = \begin{bmatrix}3&3&2\\0&6&1\\0&0&-3\end{bmatrix} \;\Rightarrow\; L\cdot U = \begin{bmatrix}3&3&2\\-6&0&-3\\9&-3&1\end{bmatrix} =: A.`}</DisplayMath>
          <p>
            The product is a <strong>general</strong> matrix <InlineMath>{'A'}</InlineMath> with no special structure. The
            course's central question is the <em>reverse</em>: given an arbitrary <InlineMath>{'A'}</InlineMath>, can we
            write it as <InlineMath>{'A=L\\cdot U'}</InlineMath>, a lower-triangular times an upper-triangular matrix?
          </p>
          <div className="callout callout-success">
            <strong>Answer: Yes, it is very useful, and the trick is the second method of matrix multiplication.</strong>
            Once <InlineMath>{'A=LU'}</InlineMath>, solving <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath> becomes
            two cheap triangular solves — forward substitution on <InlineMath>{'L\\mathbf{y}=\\mathbf{b}'}</InlineMath>,
            then back substitution on <InlineMath>{'U\\mathbf{x}=\\mathbf{y}'}</InlineMath> — and
            <InlineMath>{'\\;\\det A'}</InlineMath> is just the product of the diagonal of <InlineMath>{'U'}</InlineMath>.
            That is Lecture 5.
          </div>
        </div>
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span></h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🔄</div>
              <h3>Composing Rotations</h3>
              <p>
                Each joint of an arm contributes a rotation matrix. Multiplying them in order yields one matrix that maps
                a point from the tool frame all the way to the world frame — the heart of forward kinematics.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🛰️</div>
              <h3>LiDAR Map Building</h3>
              <p>
                Image registration aligns dozens of scans by multiplying every 3-vector by a matrix that cancels the
                robot's motion. One product, applied across all columns of a point cloud, rotates an entire scan at once.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧠</div>
              <h3>Neural Network Layers</h3>
              <p>
                A dense layer is exactly <InlineMath>{'\\;y = Wx + b'}</InlineMath>: a matrix multiply. Stacking layers
                composes their weight matrices, and GPUs exist largely to do these multiplications fast.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🔀</div>
              <h3>Pivoting &amp; Permutations</h3>
              <p>
                Stable solvers swap rows to avoid tiny pivots. That swap is a left-multiply by a permutation matrix
                <InlineMath>{'\\;P'}</InlineMath>, whose inverse is free: <InlineMath>{'P^{-1}=P^{\\top}'}</InlineMath>.
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
            num={1} type="Size rule"
            question="If A is 4×3 and B is 3×7, what is the size of A·B — and is B·A defined?"
            options={[
              'A·B is 4×7; B·A is undefined',
              'A·B is 3×3; B·A is 7×4',
              'A·B is 4×7; B·A is 7×4',
              'A·B is undefined; B·A is 3×3',
            ]}
            correct={0}
            explanation="Inner dims match (3 = 3), so A·B = [4×3]·[3×7] = [4×7]. For B·A we'd need [3×7]·[4×3], whose inner dims 7 and 4 disagree — undefined."
          />
          <QuizQ
            num={2} type="Computation"
            question="For A = [[1, 2], [0, 3]] and B = [[2, 1], [1, 4]], what is the entry (A·B)₁₂ (row 1, column 2)?"
            options={['(1)(1)+(2)(4) = 9', '(1)(2)+(2)(1) = 4', '(0)(1)+(3)(4) = 12', '(1)(2)+(0)(1) = 2']}
            correct={0}
            explanation="Entry (1,2) is row 1 of A, [1 2], dotted with column 2 of B, [1; 4]: (1)(1) + (2)(4) = 1 + 8 = 9."
          />
          <QuizQ
            num={3} type="Concept"
            question="Why is matrix multiplication generally non-commutative (A·B ≠ B·A)?"
            options={[
              'Because addition of the entries is non-commutative',
              'Because the ij-entry uses the i-th row of the FIRST matrix and j-th column of the SECOND — swapping changes which is which (and may not even be defined)',
              'It actually always commutes for square matrices',
              'Because determinants differ',
            ]}
            correct={1}
            explanation="The rule is asymmetric: rows come from the left matrix, columns from the right. Swapping the operands changes the computation entirely, and for non-square sizes B·A may not even be defined."
          />
          <QuizQ
            num={4} type="Transfer"
            question="A permutation matrix P swaps rows 2 and 3 of a 3×3 matrix. Which statements are correct?"
            options={[
              'P is the identity with rows 2,3 swapped, and P·P = I',
              'P must be computed by Gaussian elimination',
              'P has a 2 somewhere on its diagonal',
              'P·P never equals I for any permutation',
            ]}
            correct={0}
            explanation="Build P from I by swapping exactly rows 2 and 3. A single row-swap is its own inverse, so applying it twice restores the original: P·P = I. (In general P⁻¹ = Pᵀ for any permutation matrix.)"
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>Re-derive the rule [A·B]ᵢⱼ = Σₗ aᵢₗbₗⱼ and state the size condition [n×k]·[k×m] = [n×m] from scratch.</div>
            <div className="review-item"><span className="review-day">Day 1</span>Answer: (a) when is A·B defined? (b) give a 2×2 example where A·B ≠ B·A.</div>
            <div className="review-item"><span className="review-day">Day 3</span>Redo the 3×2 · 2×2 product both ways — rows×columns and Σ columns×rows — and confirm they agree.</div>
            <div className="review-item"><span className="review-day">Day 7</span>Build the permutation matrix that swaps rows 1 and 4 of a 4×4, and verify P·P = I.</div>
            <div className="review-item"><span className="review-day">Day 14</span>In under 2 minutes, explain why “columns of A times rows of B” is the key to LU factorization.</div>
          </div>
        </div>
      </section>

    </div>
  )
}
