import { useState, useMemo } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { fmt, QuizQ } from '../shared/ui.jsx'

// ─── tiny LaTeX builders for matrices / vectors ──────────────────────────────
const mat2tex = M => `\\begin{bmatrix}${M.map(r => r.map(fmt).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`
const col2tex = c => `\\begin{bmatrix}${c.map(fmt).join(' \\\\ ')}\\end{bmatrix}`
const row2tex = r => `\\begin{bmatrix}${r.map(fmt).join(' & ')}\\end{bmatrix}`

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — "Peeling the onion": the LU factorization, one pivot at a time.
//  At step k we normalize column k by the pivot to get C, take row k as R, and
//  subtract C·R from the working matrix — zeroing its k-th row and column. C
//  becomes a column of L (green), R a row of U (red). Repeat down the diagonal.
// ════════════════════════════════════════════════════════════════════════════

const LU_PRESETS = [
  { label: '2×2 · [[5,2],[15,2]]',   M: [[5, 2], [15, 2]] },
  { label: '3×3 · peel the onion',   M: [[1, 4, 5], [2, 9, 17], [3, 18, 58]] },
  { label: '3×3 · Grizzle Ex. 5.3',  M: [[-2, -4, -6], [-2, 1, -4], [-2, 11, -4]] },
  { label: 'Needs a pivot · a₁₁ = 0', M: [[0, 1], [2, 3]] },
]

// Pre-compute every peel step. Each successful step records the matrix BEFORE the
// peel (with its pivot), the normalized column C, the row R, the matrix AFTER, and
// the accumulated L and U. A zero pivot produces a terminal `fail` step.
function computeLU(M0) {
  const n = M0.length
  let Temp = M0.map(r => [...r])
  const L = Array.from({ length: n }, () => Array(n).fill(0))
  const U = Array.from({ length: n }, () => Array(n).fill(0))
  const steps = []
  let failed = null
  for (let k = 0; k < n; k++) {
    const pivot = Temp[k][k]
    const tempBefore = Temp.map(r => [...r])
    if (Math.abs(pivot) < 1e-9) {
      failed = k
      steps.push({ k, pivot, fail: true, tempBefore })
      break
    }
    const C = Temp.map(row => row[k] / pivot)
    const R = [...Temp[k]]
    const tempAfter = Temp.map((row, i) => row.map((v, j) => v - C[i] * R[j]))
    for (let i = 0; i < n; i++) L[i][k] = C[i]
    for (let j = 0; j < n; j++) U[k][j] = R[j]
    steps.push({
      k, pivot, C: [...C], R: [...R], tempBefore, tempAfter,
      L: L.map(r => [...r]), U: U.map(r => [...r]),
    })
    Temp = tempAfter
  }
  const det = failed === null ? steps.reduce((d, s) => d * s.pivot, 1) : 0
  return {
    n, steps, failed,
    finalL: L.map(r => [...r]), finalU: U.map(r => [...r]), det,
  }
}

// A small matrix grid with a per-cell class callback.
function MGrid({ M, cell }) {
  const n = M[0].length
  return (
    <div className="matrix">
      <div className="mgrid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
        {M.map((row, i) => row.map((v, j) => {
          const c = cell(i, j, v)
          return <div key={`${i}-${j}`} className={`mcell ${c.cls}`}>{c.text}</div>
        }))}
      </div>
    </div>
  )
}

function LUStepper() {
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState(0)
  const { M } = LU_PRESETS[idx]
  const { n, steps, failed, finalL, finalU, det } = useMemo(() => computeLU(M), [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  const active = done < steps.length ? steps[done] : null
  const blocked = active && active.fail
  const finished = failed === null && done >= steps.length

  function choose(i) { setIdx(i); setDone(0) }

  // L cell: lower triangle is the live region; column j is filled once we've
  // peeled past it. The newly-added column is highlighted brighter.
  const lCell = (i, j) => {
    if (j > i) return { cls: 'zero', text: '0' }
    const filledCols = active ? done : n - 1
    if (j > filledCols) return { cls: 'empty', text: '·' }
    const Lmat = active ? active.L : finalL
    const isNew = active && j === done
    return { cls: isNew ? 'lactive' : 'lfill', text: fmt(Lmat[i][j]) }
  }
  // U cell: upper triangle is the live region; row i fills once peeled.
  const uCell = (i, j) => {
    if (i > j) return { cls: 'zero', text: '0' }
    const filledRows = active ? done : n - 1
    if (i > filledRows) return { cls: 'empty', text: '·' }
    const Umat = active ? active.U : finalU
    const isNew = active && i === done
    return { cls: isNew ? 'uactive' : 'ufill', text: fmt(Umat[i][j]) }
  }
  // working matrix "Temp" with the current pivot / row / column lit
  const tempCell = (i, j, v) => {
    if (!active || active.fail) {
      const cls = active && active.fail && i === active.k && j === active.k ? 'pivot' : ''
      return { cls, text: fmt(v) }
    }
    if (i === active.k && j === active.k) return { cls: 'pivot', text: fmt(v) }
    if (i === active.k) return { cls: 'rowhi', text: fmt(v) }
    if (j === active.k) return { cls: 'colhi', text: fmt(v) }
    return { cls: '', text: fmt(v) }
  }
  const zeroCell = (i, j, v) => ({ cls: Math.abs(v) < 1e-9 ? 'zero' : '', text: fmt(v) })

  const shownTemp = active ? active.tempBefore : (steps[steps.length - 1]?.tempAfter ?? M)

  return (
    <div className="widget">
      <p className="widget-caption">
        <strong>Peeling the onion.</strong> Work down the diagonal. At step <InlineMath>{'k'}</InlineMath> the pivot is
        the <InlineMath>{'(k,k)'}</InlineMath> entry (orange). Normalize column <InlineMath>{'k'}</InlineMath> by the pivot
        to get <InlineMath>{'C'}</InlineMath> <span style={{ color: 'var(--green)' }}>■</span>, take row
        <InlineMath>{'\\;k'}</InlineMath> as <InlineMath>{'R'}</InlineMath> <span style={{ color: 'var(--blue)' }}>■</span>,
        and subtract <InlineMath>{'C\\cdot R'}</InlineMath> — this zeros the <InlineMath>{'k'}</InlineMath>-th row and
        column. <InlineMath>{'C'}</InlineMath> becomes a column of <InlineMath>{'L'}</InlineMath> (green),
        <InlineMath>{'\\;R'}</InlineMath> a row of <InlineMath>{'U'}</InlineMath> (red). The last preset starts with a
        zero pivot — watch where it gets stuck.
      </p>
      <div className="widget-card">
        <div className="lu">
          <div className="lu-mats">
            <div className="lu-block">
              <span className="lu-label">{finished ? 'Fully peeled → zero matrix' : `Working matrix (peel k = ${active ? active.k + 1 : 1})`}</span>
              <MGrid M={shownTemp} cell={finished ? zeroCell : tempCell} />
            </div>
            <div className="lu-row">
              <div className="lu-block">
                <span className="lu-label">L · lower</span>
                <MGrid M={(active ? active.L : finalL)} cell={lCell} />
              </div>
              <div className="lu-op">·</div>
              <div className="lu-block">
                <span className="lu-label">U · upper</span>
                <MGrid M={(active ? active.U : finalU)} cell={uCell} />
              </div>
            </div>
          </div>

          <div className="subst-work">
            <div className="subst-work-head">
              Peeling the onion · A = L·U
              {failed === null && <span className="subst-det">det = {fmt(det)}</span>}
            </div>

            {finished && (
              <div className="subst-status ok">
                ✓ Done. Every pivot was non-zero, so <InlineMath>{'A = L\\cdot U'}</InlineMath> with
                <InlineMath>{`\\;\\det A = ${steps.map(s => `(${fmt(s.pivot)})`).join('')} = ${fmt(det)}`}</InlineMath>
                — the product of the pivots.
              </div>
            )}

            {active && !active.fail && (
              <div className="subst-step">
                <div className="subst-step-tag">
                  Step <InlineMath>{`k = ${active.k + 1}`}</InlineMath> of {n} · pivot
                  <InlineMath>{`\\;a_{${active.k + 1}${active.k + 1}} = ${fmt(active.pivot)}`}</InlineMath>
                </div>
                <DisplayMath>{`C = \\frac{1}{${fmt(active.pivot)}}\\,${col2tex(active.tempBefore.map(r => r[active.k]))} = ${col2tex(active.C)}`}</DisplayMath>
                <DisplayMath>{`R = ${row2tex(active.R)}`}</DisplayMath>
                <DisplayMath>{`\\text{Temp} \\leftarrow \\text{Temp} - C\\cdot R = ${mat2tex(active.tempAfter)}`}</DisplayMath>
              </div>
            )}

            {blocked && (
              <div className="subst-step err">
                <div className="subst-step-tag">
                  Step <InlineMath>{`k = ${active.k + 1}`}</InlineMath> · pivot
                  <InlineMath>{`\\;a_{${active.k + 1}${active.k + 1}} = 0`}</InlineMath>
                </div>
                <div className="subst-status err">
                  Normalizing column <InlineMath>{`${active.k + 1}`}</InlineMath> would divide by the zero pivot. This
                  matrix has <strong>no LU factorization without row permutations</strong> — swap in a row with a non-zero
                  pivot first (that is the <InlineMath>{'P'}</InlineMath> in <InlineMath>{'PA = LU'}</InlineMath>, below).
                </div>
              </div>
            )}

            {!active && done === 0 && (
              <div className="subst-hint">Press <strong>Next ▶</strong> to peel the first pivot.</div>
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
          {LU_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`}
              onClick={() => choose(i)}>{pr.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — Solve Ax = b once you have A = LU. Forward-substitute Ly = b, then
//  back-substitute Ux = y. Two cheap triangular solves replace one hard one.
// ════════════════════════════════════════════════════════════════════════════

const SOLVE_PRESETS = [
  { label: '3×3 · Grizzle Ex. 5.4', A: [[-2, -4, -6], [-2, 1, -4], [-2, 11, -4]], b: [2, 3, -7] },
  { label: '2×2 · [[5,2],[15,2]]',  A: [[5, 2], [15, 2]], b: [9, 23] },
  { label: '3×3 · onion matrix',    A: [[1, 4, 5], [2, 9, 17], [3, 18, 58]], b: [10, 28, 79] },
]

// Build the full forward-then-back step list from a factorization A = LU.
function computeSolve(A) {
  const { finalL: L, finalU: U, n, failed } = computeLU(A)
  if (failed !== null) return { ok: false }
  const y = new Array(n).fill(0)
  const x = new Array(n).fill(0)
  const steps = []
  // forward: Ly = b
  const fwd = (b) => {
    for (let i = 0; i < n; i++) {
      const used = []
      for (let j = 0; j < i; j++) if (Math.abs(L[i][j]) > 1e-12) used.push(j)
      let acc = b[i]
      used.forEach(j => { acc -= L[i][j] * y[j] })
      y[i] = acc / L[i][i]
      steps.push({ phase: 'fwd', i, used, rhs: b[i], aii: L[i][i], val: y[i], target: 'y' })
    }
  }
  // back: Ux = y
  const back = () => {
    for (let i = n - 1; i >= 0; i--) {
      const used = []
      for (let j = i + 1; j < n; j++) if (Math.abs(U[i][j]) > 1e-12) used.push(j)
      let acc = y[i]
      used.forEach(j => { acc -= U[i][j] * x[j] })
      x[i] = acc / U[i][i]
      steps.push({ phase: 'back', i, used, rhs: y[i], aii: U[i][i], val: x[i], target: 'x' })
    }
  }
  return { ok: true, L, U, n, fwd, back, y, x, steps }
}

function LUSolveStepper() {
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState(0)
  const { A, b } = SOLVE_PRESETS[idx]

  const data = useMemo(() => {
    const base = computeSolve(A)
    if (!base.ok) return base
    // run forward then back with this preset's b, capturing intermediate values
    base.fwd(b); base.back()
    return base
  }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  const { ok, L, U, n, y, x, steps } = data
  const active = done < steps.length ? steps[done] : null
  const finished = done >= steps.length

  // values revealed so far
  const yShown = i => { const p = steps.findIndex(s => s.phase === 'fwd' && s.i === i); return p > -1 && p < done ? y[i] : null }
  const xShown = i => { const p = steps.findIndex(s => s.phase === 'back' && s.i === i); return p > -1 && p < done ? x[i] : null }

  function choose(i) { setIdx(i); setDone(0) }
  if (!ok) return null

  const phase = active ? active.phase : (finished ? 'done' : 'fwd')
  const Mat = phase === 'back' ? U : L
  const rhsVec = phase === 'back' ? y : b
  const lhsLabel = phase === 'back' ? 'U' : 'L'
  const varVec = phase === 'back' ? 'x' : 'y'
  const varShown = phase === 'back' ? xShown : yShown
  const varSym = phase === 'back' ? 'x' : 'y'

  // numeric substitution string for the active step
  const subTxt = (() => {
    if (!active) return null
    const i = active.i + 1
    const v = active.target
    const den = `${active.phase === 'fwd' ? 'l' : 'u'}_{${i}${i}}`
    const srcArr = active.phase === 'fwd' ? y : x
    if (active.used.length === 0)
      return `${v}_{${i}} = \\dfrac{${fmt(active.rhs)}}{${fmt(active.aii)}} = ${fmt(active.val)}`
    const num = active.used.map(j => `(${fmt(Mat[active.i][j])})(${fmt(srcArr[j])})`).join(' - ')
    return `${v}_{${i}} = \\dfrac{${fmt(active.rhs)} - [${num}]}{${fmt(active.aii)}} = ${fmt(active.val)}`
  })()

  return (
    <div className="widget">
      <p className="widget-caption">
        Once <InlineMath>{'A = LU'}</InlineMath>, solving <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath> splits
        into two easy triangular solves: first <strong>forward-substitute</strong>
        <InlineMath>{'\\;L\\mathbf{y}=\\mathbf{b}'}</InlineMath> (top → bottom), then
        <strong> back-substitute</strong> <InlineMath>{'\\;U\\mathbf{x}=\\mathbf{y}'}</InlineMath> (bottom → top). Step
        through and watch <InlineMath>{'\\mathbf{y}'}</InlineMath> then <InlineMath>{'\\mathbf{x}'}</InlineMath> fill in.
      </p>
      <div className="widget-card">
        <div className="subst">
          <div className="subst-matrix">
            <div className="matrix">
              <div className="mgrid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
                {Mat.map((row, i) => row.map((v, j) => {
                  const cls = [
                    'mcell',
                    active && i === active.i ? 'rowhi' : '',
                    i === j ? (phase === 'back' ? 'ufill' : 'lfill') : '',
                  ].join(' ')
                  return <div key={`${i}-${j}`} className={cls}>{fmt(v)}</div>
                }))}
              </div>
            </div>
            <div className="matrix">
              <div className="mgrid" style={{ gridTemplateColumns: '1fr' }}>
                {Array.from({ length: n }, (_, i) => {
                  const val = varShown(i)
                  const isActive = active && active.i === i
                  const cls = ['mcell', 'var', val !== null ? 'solved' : '', isActive ? 'rowhi' : ''].join(' ')
                  return (
                    <div key={i} className={cls}>
                      {val !== null ? fmt(val) : <InlineMath>{`${varSym}_{${i + 1}}`}</InlineMath>}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="asm-eq-sign">=</div>
            <div className="matrix">
              <div className="mgrid" style={{ gridTemplateColumns: '1fr' }}>
                {rhsVec.map((v, i) => (
                  <div key={i} className={`mcell ${active && i === active.i ? 'rowhi' : ''}`}>{fmt(v)}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="subst-work">
            <div className="subst-work-head">
              {phase === 'back' ? 'Back substitution · Ux = y' : phase === 'done' ? 'Solved' : 'Forward substitution · Ly = b'}
              <span className="subst-det">{Math.min(done, steps.length)}/{steps.length}</span>
            </div>

            {finished && (
              <div className="subst-status ok">
                ✓ <InlineMath>{`\\mathbf{x} = ${col2tex(x)}^{\\!\\top}`}</InlineMath> solves
                <InlineMath>{'\\;A\\mathbf{x}=\\mathbf{b}'}</InlineMath>. Two <InlineMath>{'n^2'}</InlineMath> solves did
                the work of one — and any new <InlineMath>{'\\mathbf{b}'}</InlineMath> reuses the same
                <InlineMath>{'\\;L,U'}</InlineMath>.
              </div>
            )}

            {active && (
              <div className="subst-step">
                <div className="subst-step-tag">
                  {active.phase === 'fwd' ? 'Forward' : 'Back'} · solve for
                  <InlineMath>{`\\;${active.target}_{${active.i + 1}}`}</InlineMath> from
                  <InlineMath>{`\\;${lhsLabel}`}</InlineMath> row {active.i + 1}
                </div>
                <DisplayMath>{subTxt}</DisplayMath>
              </div>
            )}

            {!active && done === 0 && (
              <div className="subst-hint">Press <strong>Next ▶</strong> to start forward substitution on <InlineMath>{'L\\mathbf{y}=\\mathbf{b}'}</InlineMath>.</div>
            )}

            <div className="subst-controls">
              <button className="step-btn" disabled={done === 0}
                onClick={() => setDone(d => Math.max(0, d - 1))}>◀ Prev</button>
              <button className="step-btn primary" disabled={finished}
                onClick={() => setDone(d => Math.min(steps.length, d + 1))}>Next ▶</button>
              <button className="step-btn" onClick={() => setDone(0)}>Reset</button>
            </div>
          </div>
        </div>

        <div className="preset-bar">
          {SOLVE_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`}
              onClick={() => choose(i)}>{pr.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L05() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#fdeaec', color: '#d83a45', borderColor: '#f6c9ce' }}>
          Module 1 · Lecture 5 · Grizzle Ch. 5
        </div>
        <h1 className="lesson-title">LU (Lower–Upper) Factorization</h1>
        <p className="lesson-subtitle">
          This is the lecture where solving <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath> stops being a one-off
          struggle and becomes a reusable machine. We <strong>factor</strong> a general square
          <InlineMath>{'\\;A'}</InlineMath> into a lower-triangular <InlineMath>{'L'}</InlineMath> times an
          upper-triangular <InlineMath>{'U'}</InlineMath> — our first real algorithm — and then every solve is two cheap
          triangular substitutions.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Lecture 3 showed that <strong>triangular</strong> systems are almost free to solve. Lecture 4 gave us the
            machinery of matrix multiplication — including a quietly powerful “columns times rows” view. This lecture
            cashes both in: we learn to <strong>factor</strong> an arbitrary square matrix into a product of a lower- and
            an upper-triangular matrix, <InlineMath>{'A = L\\cdot U'}</InlineMath>. Once we have that, the hard problem
            <InlineMath>{'\\;A\\mathbf{x}=\\mathbf{b}'}</InlineMath> collapses into two easy triangular ones.
          </p>
          <p>
            The metaphor the book uses — and it really is the right one — is <strong>peeling an onion</strong>. Starting
            at the top-left corner and walking down the diagonal, each step strips away one row and one column, leaving a
            slightly smaller matrix behind. The pieces you peel off are exactly the columns of <InlineMath>{'L'}</InlineMath>
            and the rows of <InlineMath>{'U'}</InlineMath>. Keep peeling until nothing is left, and you have factored the
            whole matrix.
          </p>
          <p>
            Why care? Because factoring is <em>work you do once</em>. A robot's controller might solve
            <InlineMath>{'\\;A\\mathbf{x}=\\mathbf{b}'}</InlineMath> a thousand times a second with the same
            <InlineMath>{'\\;A'}</InlineMath> but a fresh <InlineMath>{'\\mathbf{b}'}</InlineMath> each tick. Factor
            <InlineMath>{'\\;A=LU'}</InlineMath> once (the expensive <InlineMath>{'n^3'}</InlineMath> part), and every
            subsequent solve is just two <InlineMath>{'n^2'}</InlineMath> substitutions. That is the difference between a
            controller that keeps up and one that falls behind.
          </p>
        </div>
      </section>

      {/* ── Recall: columns × rows ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · THE TOOL WE NEED: COLUMNS TIMES ROWS</span></h2>
        <div className="content-block">
          <p>
            Recall the second method of matrix multiplication from Lecture 4. If <InlineMath>{'A'}</InlineMath> is
            <InlineMath>{'\\;n\\times k'}</InlineMath> and <InlineMath>{'B'}</InlineMath> is
            <InlineMath>{'\\;k\\times m'}</InlineMath>, their product is the <strong>sum of the columns of
            <InlineMath>{'\\;A'}</InlineMath> times the rows of <InlineMath>{'B'}</InlineMath></strong>:
          </p>
          <DisplayMath>{String.raw`A\cdot B = \sum_{i=1}^{k} a^{\text{col}}_i\, b^{\text{row}}_i.`}</DisplayMath>
          <p>
            Each term <InlineMath>{'a^{\\text{col}}_i\\, b^{\\text{row}}_i'}</InlineMath> is a column
            (<InlineMath>{'n\\times1'}</InlineMath>) times a row (<InlineMath>{'1\\times m'}</InlineMath>), which is a
            full <InlineMath>{'n\\times m'}</InlineMath> matrix. The whole secret of LU is to <em>run this in reverse</em>:
            peel off one column-times-row at a time from <InlineMath>{'A'}</InlineMath> until nothing remains.
          </p>
          <DisplayMath>{String.raw`\begin{bmatrix}1\\3\end{bmatrix}\begin{bmatrix}5&2\end{bmatrix} = \begin{bmatrix}5&2\\15&6\end{bmatrix}, \qquad \begin{bmatrix}0\\1\end{bmatrix}\begin{bmatrix}0&-4\end{bmatrix} = \begin{bmatrix}0&0\\0&-4\end{bmatrix}.`}</DisplayMath>
        </div>
      </section>

      {/* ── Peeling the onion ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · PEELING THE ONION</span></h2>
        <div className="content-block">
          <p>
            Take a square matrix <InlineMath>{'M'}</InlineMath>. We want a column <InlineMath>{'C_1'}</InlineMath> and a row
            <InlineMath>{'\\;R_1'}</InlineMath> whose product matches the first column and first row of
            <InlineMath>{'\\;M'}</InlineMath> exactly, so that subtracting it zeros them out:
          </p>
          <DisplayMath>{String.raw`M - C_1 R_1 = \begin{bmatrix} 0 & 0 & 0 \\ 0 & * & * \\ 0 & * & * \end{bmatrix}.`}</DisplayMath>
          <p>
            The trick is the <strong>pivot</strong>, the <InlineMath>{'(1,1)'}</InlineMath> entry. Let
            <InlineMath>{'\\;R_1'}</InlineMath> be the first row of <InlineMath>{'M'}</InlineMath> as-is, and let
            <InlineMath>{'\\;C_1'}</InlineMath> be the first <em>column</em> of <InlineMath>{'M'}</InlineMath> divided by
            the pivot — so its top entry is <InlineMath>{'1'}</InlineMath>. Then <InlineMath>{'C_1 R_1'}</InlineMath>
            reproduces the first row and column precisely, and the subtraction leaves a matrix that is effectively one
            size smaller. Repeat on the <InlineMath>{'(2,2)'}</InlineMath> entry, then <InlineMath>{'(3,3)'}</InlineMath>,
            down the diagonal. Collecting the peeled columns and rows,
          </p>
          <DisplayMath>{String.raw`M = C_1 R_1 + C_2 R_2 + \cdots + C_n R_n = \underbrace{\begin{bmatrix} C_1 & C_2 & \cdots & C_n \end{bmatrix}}_{L}\,\underbrace{\begin{bmatrix} R_1 \\ R_2 \\ \vdots \\ R_n \end{bmatrix}}_{U}.`}</DisplayMath>
          <div className="callout callout-success">
            <strong>Why it lands triangular.</strong> Each <InlineMath>{'C_k'}</InlineMath> has its first
            <InlineMath>{'\\;k-1'}</InlineMath> entries already zeroed (earlier peels removed them) and a
            <InlineMath>{'\\;1'}</InlineMath> in position <InlineMath>{'k'}</InlineMath> — so stacking them as columns gives
            a <strong>unit lower-triangular</strong> <InlineMath>{'L'}</InlineMath>. Likewise each
            <InlineMath>{'\\;R_k'}</InlineMath> starts at column <InlineMath>{'k'}</InlineMath>, so the rows stack into an
            <strong> upper-triangular</strong> <InlineMath>{'U'}</InlineMath>.
          </div>
        </div>
      </section>

      {/* ── The need for pivots ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · THE NORMALIZATION STEP (PIVOTS)</span></h2>
        <div className="content-block">
          <p>
            Why divide the column by the pivot? Skip it and the subtraction fails. With
            <InlineMath>{'\\;M=\\begin{bmatrix}2&3\\\\4&5\\end{bmatrix}'}</InlineMath>, taking <InlineMath>{'C'}</InlineMath>
            as the raw first column gives
          </p>
          <DisplayMath>{String.raw`\begin{bmatrix}2&3\\4&5\end{bmatrix} - \begin{bmatrix}2\\4\end{bmatrix}\begin{bmatrix}2&3\end{bmatrix} = \begin{bmatrix}2&3\\4&5\end{bmatrix} - \begin{bmatrix}4&6\\8&12\end{bmatrix} = \begin{bmatrix}-2&-3\\-4&-7\end{bmatrix}\;\text{—no zeros!}`}</DisplayMath>
          <p>
            Normalize the column by the pivot <InlineMath>{'a_{11}=2'}</InlineMath> first, and it works:
          </p>
          <DisplayMath>{String.raw`\begin{bmatrix}2&3\\4&5\end{bmatrix} - \begin{bmatrix}2/2\\4/2\end{bmatrix}\begin{bmatrix}2&3\end{bmatrix} = \begin{bmatrix}2&3\\4&5\end{bmatrix} - \begin{bmatrix}2&3\\4&6\end{bmatrix} = \begin{bmatrix}0&0\\0&-1\end{bmatrix}.\;\checkmark`}</DisplayMath>
          <div className="callout callout-warning">
            <strong>Divide-by-zero warning.</strong> The normalization divides by the pivot
            <InlineMath>{'\\;a_{kk}'}</InlineMath>. If a pivot is zero we are stuck — and the simple algorithm fails. The
            fix is to <strong>swap rows</strong> to bring a non-zero entry into the pivot position. That row-swap is a
            permutation matrix <InlineMath>{'P'}</InlineMath>, giving the general factorization
            <InlineMath>{'\\;PA = LU'}</InlineMath> we develop further down.
          </div>
        </div>
      </section>

      {/* ── Interactive: LU stepper ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · LU STEP-BY-STEP</span></h2>
        <LUStepper />
      </section>

      {/* ── The algorithm ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · THE LU ALGORITHM (NO PERMUTATIONS)</span></h2>
        <div className="content-block">
          <p>
            Here is the whole method as you would actually program it — our first explicit algorithm in the course. Start
            with <InlineMath>{'\\;\\texttt{Temp}=M'}</InlineMath> and empty <InlineMath>{'L,U'}</InlineMath>; at each
            <InlineMath>{'\\;k'}</InlineMath> peel one column-times-row.
          </p>
          <pre className="code-block"><code>{`using LinearAlgebra
function luNoPivot(M)
    n    = size(M, 1)
    Temp = copy(M)
    L = Array{Float64}(undef, n, 0)   # grow by columns
    U = Array{Float64}(undef, 0, n)   # grow by rows
    for k = 1:n
        pivot = Temp[k, k]
        if isapprox(pivot, 0; atol = 1e-8)
            error("zero pivot at k=$k — needs row permutations")
        end
        C = Temp[:, k] ./ pivot        # normalize: k-th entry becomes 1.0
        R = Temp[k:k, :]               # k-th row
        Temp = Temp - C * R            # peel away row k and column k
        L = [L  C]                     # append C as a new column of L
        U = [U; R]                     # append R as a new row of U
    end
    return L, U
end`}</code></pre>
          <p>
            By hand this is tedious; in Julia it factors a <InlineMath>{'1000\\times1000'}</InlineMath> matrix in a couple
            of seconds, and the built-in <InlineMath>{'\\texttt{lu}'}</InlineMath> does it in milliseconds. The cost is
            <InlineMath>{'\\;\\mathcal{O}(n^3)'}</InlineMath> — the price you pay <em>once</em>.
          </p>
        </div>
      </section>

      {/* ── Worked: 3×3 factorization ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · A 3×3 FACTORIZATION</span></h2>
        <div className="content-block">
          <p>
            Factor <InlineMath>{'M=\\begin{bmatrix}-2&-4&-6\\\\-2&1&-4\\\\-2&11&-4\\end{bmatrix}'}</InlineMath> (try this
            one in the widget above to see each peel).
          </p>
          <p><strong>Step <InlineMath>{'k=1'}</InlineMath>:</strong> pivot <InlineMath>{'=-2'}</InlineMath>, so</p>
          <DisplayMath>{String.raw`C_1 = \frac{1}{-2}\begin{bmatrix}-2\\-2\\-2\end{bmatrix} = \begin{bmatrix}1\\1\\1\end{bmatrix},\quad R_1 = \begin{bmatrix}-2&-4&-6\end{bmatrix},\quad \text{Temp} \to \begin{bmatrix}0&0&0\\0&5&2\\0&15&2\end{bmatrix}.`}</DisplayMath>
          <p><strong>Step <InlineMath>{'k=2'}</InlineMath>:</strong> pivot <InlineMath>{'=5'}</InlineMath>, so</p>
          <DisplayMath>{String.raw`C_2 = \frac{1}{5}\begin{bmatrix}0\\5\\15\end{bmatrix} = \begin{bmatrix}0\\1\\3\end{bmatrix},\quad R_2 = \begin{bmatrix}0&5&2\end{bmatrix},\quad \text{Temp} \to \begin{bmatrix}0&0&0\\0&0&0\\0&0&-4\end{bmatrix}.`}</DisplayMath>
          <p><strong>Step <InlineMath>{'k=3'}</InlineMath>:</strong> pivot <InlineMath>{'=-4'}</InlineMath>, leaving the zero matrix. Assembling:</p>
          <DisplayMath>{String.raw`\underbrace{\begin{bmatrix}-2&-4&-6\\-2&1&-4\\-2&11&-4\end{bmatrix}}_{M} = \underbrace{\begin{bmatrix}1&0&0\\1&1&0\\1&3&1\end{bmatrix}}_{L}\underbrace{\begin{bmatrix}-2&-4&-6\\0&5&2\\0&0&-4\end{bmatrix}}_{U}.`}</DisplayMath>
          <p>
            And the determinant falls out for free: <InlineMath>{'\\det M = (-2)(5)(-4) = 40'}</InlineMath>, the product of
            the pivots (the diagonal of <InlineMath>{'U'}</InlineMath>, since <InlineMath>{'L'}</InlineMath> has unit
            diagonal).
          </p>
        </div>
      </section>

      {/* ── Solving via LU ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · SOLVING Ax = b WITH THE FACTORIZATION</span></h2>
        <div className="content-block">
          <p>
            Now the payoff. To solve <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath> with
            <InlineMath>{'\\;A=LU'}</InlineMath>, write <InlineMath>{'L(U\\mathbf{x})=\\mathbf{b}'}</InlineMath> and
            introduce an intermediate vector <InlineMath>{'\\mathbf{y}=U\\mathbf{x}'}</InlineMath>. The one hard solve
            becomes two triangular solves:
          </p>
          <DisplayMath>{String.raw`L\mathbf{y} = \mathbf{b}\;\;(\text{forward substitution}), \qquad U\mathbf{x} = \mathbf{y}\;\;(\text{back substitution}).`}</DisplayMath>
          <p>
            Both are the cheap <InlineMath>{'n^2'}</InlineMath> substitutions from Lecture 3. Solve
            <InlineMath>{'\\;L\\mathbf{y}=\\mathbf{b}'}</InlineMath> top-to-bottom for <InlineMath>{'\\mathbf{y}'}</InlineMath>,
            then <InlineMath>{'U\\mathbf{x}=\\mathbf{y}'}</InlineMath> bottom-to-top for <InlineMath>{'\\mathbf{x}'}</InlineMath>.
          </p>
        </div>
      </section>

      {/* ── Interactive: solve ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · SOLVE Ax = b VIA LU</span></h2>
        <LUSolveStepper />
      </section>

      {/* ── Worked: solve ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · SOLVING WITH L AND U</span></h2>
        <div className="content-block">
          <p>
            Solve <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath> with the <InlineMath>{'A=LU'}</InlineMath> just
            found and <InlineMath>{'\\mathbf{b}=(2,3,-7)'}</InlineMath>. First forward-substitute
            <InlineMath>{'\\;L\\mathbf{y}=\\mathbf{b}'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`\begin{bmatrix}1&0&0\\1&1&0\\1&3&1\end{bmatrix}\mathbf{y} = \begin{bmatrix}2\\3\\-7\end{bmatrix} \;\Rightarrow\; \mathbf{y} = \begin{bmatrix}2\\1\\-12\end{bmatrix}.`}</DisplayMath>
          <p>Then back-substitute <InlineMath>{'U\\mathbf{x}=\\mathbf{y}'}</InlineMath>:</p>
          <DisplayMath>{String.raw`\begin{bmatrix}-2&-4&-6\\0&5&2\\0&0&-4\end{bmatrix}\mathbf{x} = \begin{bmatrix}2\\1\\-12\end{bmatrix} \;\Rightarrow\; \mathbf{x} = \begin{bmatrix}-8\\-1\\3\end{bmatrix}.`}</DisplayMath>
          <p>
            Two quick substitutions — no elimination redone — and the system is solved. Feed a different
            <InlineMath>{'\\;\\mathbf{b}'}</InlineMath> and you reuse the very same <InlineMath>{'L'}</InlineMath> and
            <InlineMath>{'\\;U'}</InlineMath>.
          </p>
        </div>
      </section>

      {/* ── Pivoting / PLU ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · WHEN PIVOTS VANISH: PA = LU</span></h2>
        <div className="content-block">
          <p>
            Some matrices have no LU factorization without row swaps. The simplest is
            <InlineMath>{'\\;A=\\begin{bmatrix}0&1\\\\2&3\\end{bmatrix}'}</InlineMath>: the very first pivot is
            <InlineMath>{'\\;0'}</InlineMath>, and normalizing the column means dividing by zero. But swap the two rows
            and the obstruction vanishes:
          </p>
          <DisplayMath>{String.raw`P = \begin{bmatrix}0&1\\1&0\end{bmatrix}, \qquad P A = \begin{bmatrix}2&3\\0&1\end{bmatrix} = \underbrace{\begin{bmatrix}1&0\\0&1\end{bmatrix}}_{L}\underbrace{\begin{bmatrix}2&3\\0&1\end{bmatrix}}_{U}.`}</DisplayMath>
          <p>
            In general we factor <InlineMath>{'PA = LU'}</InlineMath>, where <InlineMath>{'P'}</InlineMath> is a permutation
            matrix recording the row swaps. Because every permutation matrix satisfies
            <InlineMath>{'\\;\\det(P)=\\pm1'}</InlineMath> (so it is always invertible, with
            <InlineMath>{'\\;P^{-1}=P^{\\top}'}</InlineMath>), solving is barely changed:
          </p>
          <DisplayMath>{String.raw`A\mathbf{x}=\mathbf{b} \iff PA\,\mathbf{x}=P\mathbf{b} \iff LU\mathbf{x}=P\mathbf{b}.`}</DisplayMath>
          <p>
            So forward-substitute <InlineMath>{'L\\mathbf{y}=P\\mathbf{b}'}</InlineMath> (just permute the right-hand side
            first), then back-substitute <InlineMath>{'U\\mathbf{x}=\\mathbf{y}'}</InlineMath> as before. Production
            solvers go further and <em>always</em> swap the largest available entry into the pivot — “partial pivoting” —
            even when a zero pivot is not forced, purely to keep round-off error small. That is why Julia's
            <InlineMath>{'\\;\\texttt{lu}'}</InlineMath> returns a <InlineMath>{'P'}</InlineMath> even for friendly
            matrices.
          </p>
        </div>
      </section>

      {/* ── Julia native ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">IN CODE · JULIA'S NATIVE lu</span></h2>
        <div className="content-block">
          <p>
            You will rarely hand-roll LU. Julia's <InlineMath>{'\\texttt{LinearAlgebra}'}</InlineMath> package factors and
            solves for you — just mind two quirks: it pivots by default, and the permutation comes back two ways
            (<InlineMath>{'\\texttt{F.p}'}</InlineMath> a vector of indices, <InlineMath>{'\\texttt{F.P}'}</InlineMath> the
            matrix).
          </p>
          <pre className="code-block"><code>{`using LinearAlgebra

A = [-2.0 -4 -6; -2 1 -4; -2 11 -4]
b = [2.0, 3, -7]

F = lu(A)              # pivoted factorization: F.P * A == F.L * F.U
y = forwardsub(F.L, F.P * b)   # equivalently  b[F.p]
x = backwardsub(F.U, y)        # x ≈ [-8, -1, 3]

# Force NO row permutations (only safe when no pivot vanishes):
L, U = lu(A, Val(false))`}</code></pre>
          <p>
            The relationship to remember is <InlineMath>{'\\;\\texttt{F.L*F.U == F.P*A}'}</InlineMath>, equivalently
            <InlineMath>{'\\;\\texttt{A[F.p, :]}'}</InlineMath>. Both <InlineMath>{'P\\mathbf{b}'}</InlineMath> and
            <InlineMath>{'\\;\\mathbf{b}[\\texttt{p}]'}</InlineMath> permute the right-hand side identically.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <p>
            You can now solve <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath> for any square
            <InlineMath>{'\\;A'}</InlineMath>: factor once with <InlineMath>{'PA=LU'}</InlineMath>, then forward- and
            back-substitute as many times as you like. This is the workhorse behind nearly every dense linear solve in
            engineering.
          </p>
          <div className="callout callout-success">
            <strong>Consolidation checkpoint — after L6 you will have solved <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath> completely.</strong>
            Lecture 6 finishes Module 1 with determinants of products (<InlineMath>{'\\det(AB)=\\det A\\,\\det B'}</InlineMath>),
            matrix inverses and transposes — and <em>why</em>, armed with LU, you almost never actually compute
            <InlineMath>{'\\;A^{-1}'}</InlineMath>. Later, Lecture 13's <InlineMath>{'QR'}</InlineMath> factorization gives
            an even more numerically robust route for the hardest problems.
          </div>
        </div>
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span></h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">⚡</div>
              <h3>Real-Time Embedded Solvers</h3>
              <p>
                Factor <InlineMath>{'A=LU'}</InlineMath> once (<InlineMath>{'n^3'}</InlineMath>), then every control tick
                solves a fresh <InlineMath>{'\\mathbf{b}'}</InlineMath> in two <InlineMath>{'n^2'}</InlineMath>
                substitutions — fast enough for a 1&nbsp;kHz loop on modest hardware.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🌉</div>
              <h3>Truss &amp; Structural Analysis</h3>
              <p>
                A planar truss with 13 joints yields 26 force-balance equations — a <InlineMath>{'26\\times26'}</InlineMath>
                system <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath>. LU with pivoting solves for every member's
                tension or compression at once.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🛰️</div>
              <h3>SLAM &amp; State Estimation</h3>
              <p>
                Mapping and localization repeatedly solve large sparse linear systems. Factorizations like LU (and its
                cousins) are the inner loop that makes real-time SLAM tractable.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🔀</div>
              <h3>Pivoting for Numerical Stability</h3>
              <p>
                Partial pivoting swaps the largest entry into each pivot position, bounding round-off growth. It is the
                reason <InlineMath>{'PA=LU'}</InlineMath> — not bare <InlineMath>{'A=LU'}</InlineMath> — is the industry
                default.
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
            num={1} type="Concept"
            question="In the peeling-the-onion step, why is the column C divided by the pivot before forming C·R?"
            options={[
              'To make the determinant positive',
              'So that C·R reproduces the first row AND column of the working matrix exactly, zeroing both when subtracted',
              'To make L symmetric',
              'It is optional — the result is the same either way',
            ]}
            correct={1}
            explanation="R is taken as the raw k-th row, so its k-th entry is the pivot. Dividing the column by the pivot makes C's k-th entry 1, so C·R reproduces row k and column k exactly. Subtracting then zeros both. Skip the division and the column no longer matches."
          />
          <QuizQ
            num={2} type="Computation"
            question="With A = LU where L = [[1,0],[3,1]] and U = [[5,2],[0,-4]], solve Ly = b for b = (9, 23). What is y?"
            options={['y = (9, −4)', 'y = (9, 23)', 'y = (5, −4)', 'y = (1.8, 3)']}
            correct={0}
            explanation="Forward substitution: y₁ = 9/1 = 9. Then row 2: 3y₁ + y₂ = 23 ⇒ y₂ = 23 − 3(9) = 23 − 27 = −4. So y = (9, −4)."
          />
          <QuizQ
            num={3} type="Concept"
            question="Why is LU factorization especially valuable when you must solve Ax = b many times with the same A but different b?"
            options={[
              'Because det(A) changes each time',
              'Because the O(n³) factorization is done once, then each new b costs only two O(n²) substitutions',
              'Because L and U must be recomputed for each b',
              'Because it avoids ever computing a determinant',
            ]}
            correct={1}
            explanation="The expensive part is the factorization (O(n³)). Once you have L and U, each new right-hand side is solved with one forward and one back substitution — O(n²) each. Reusing the factorization is the whole point for real-time and repeated solves."
          />
          <QuizQ
            num={4} type="Transfer"
            question="The matrix A = [[0,1],[2,3]] has a zero in the (1,1) position. What does LU factorization require here, and how is Ax = b then solved?"
            options={[
              'A has no solution; LU cannot be used',
              'Swap rows with a permutation P, factor PA = LU, then solve Ly = Pb (forward) and Ux = y (back)',
              'Set the pivot to 1 and continue unchanged',
              'Transpose A first, then factor Aᵀ = LU',
            ]}
            correct={1}
            explanation="A zero pivot blocks the simple algorithm. Swap rows via a permutation matrix P so PA has a non-zero pivot, factor PA = LU, then solve Ax = b as LUx = Pb: forward-substitute Ly = Pb, then back-substitute Ux = y."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>Re-derive the peeling-the-onion step (pivot → C = col/pivot, R = row, Temp − C·R) from scratch and explain why L comes out unit lower-triangular.</div>
            <div className="review-item"><span className="review-day">Day 1</span>Answer: (a) why normalize the column by the pivot? (b) what is det(A) in terms of the pivots?</div>
            <div className="review-item"><span className="review-day">Day 3</span>Redo the 3×3 factorization of [[−2,−4,−6],[−2,1,−4],[−2,11,−4]] and then solve with b = (2,3,−7) → x = (−8,−1,3), without notes.</div>
            <div className="review-item"><span className="review-day">Day 7</span>Explain when a zero pivot occurs, how P fixes it, and why solving becomes Ly = Pb then Ux = y.</div>
            <div className="review-item"><span className="review-day">Day 14</span>In under 2 minutes, explain why “factor once, substitute many” makes LU the workhorse for real-time solvers.</div>
          </div>
        </div>
      </section>

    </div>
  )
}
