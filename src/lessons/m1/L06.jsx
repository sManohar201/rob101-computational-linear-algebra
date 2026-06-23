import { useState, useMemo } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'

// ─── tiny LaTeX builders for matrices / vectors ──────────────────────────────
const mat2tex = M => `\\begin{bmatrix}${M.map(r => r.map(fmt).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`
const col2tex = c => `\\begin{bmatrix}${c.map(fmt).join(' \\\\ ')}\\end{bmatrix}`

// ─── self-contained dense kernels (kept local so the widgets don't depend on
//     the shared solveLinear, whose accumulator indexing is suspect) ──────────
// Gaussian elimination with partial pivoting. Returns { x, det } or null if singular.
function solveLin(A0, b0) {
  const n = A0.length
  const M = A0.map((r, i) => [...r, b0[i]])
  let sign = 1
  for (let col = 0; col < n; col++) {
    let piv = col
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r
    if (Math.abs(M[piv][col]) < 1e-15) return null
    if (piv !== col) { [M[col], M[piv]] = [M[piv], M[col]]; sign = -sign }
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / M[col][col]
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c]
    }
  }
  let det = sign
  for (let i = 0; i < n; i++) det *= M[i][i]
  // back substitution
  const x = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let acc = M[i][n]
    for (let j = i + 1; j < n; j++) acc -= M[i][j] * x[j]
    x[i] = acc / M[i][i]
  }
  return { x, det }
}

// A small matrix grid with a per-cell class callback.
function MGrid({ M, cell }) {
  const ncol = M[0].length
  return (
    <div className="matrix">
      <div className="mgrid" style={{ gridTemplateColumns: `repeat(${ncol}, 1fr)` }}>
        {M.map((row, i) => row.map((v, j) => {
          const c = cell(i, j, v)
          return <div key={`${i}-${j}`} className={`mcell ${c.cls}`}>{c.text}</div>
        }))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — The 2×2 inverse lab. Slide the four entries of A. Watch det = ad−bc,
//  the verdict invertible / singular, the closed-form inverse, and the product
//  A·A⁻¹ snapping to the identity — or going "undefined" the instant det hits 0.
// ════════════════════════════════════════════════════════════════════════════

const INV_PRESETS = [
  { label: 'Grizzle Ex. 6.3 · [[4,2],[5,3]]', M: { a: 4, b: 2, c: 5, d: 3 } },
  { label: 'Identity',                         M: { a: 1, b: 0, c: 0, d: 1 } },
  { label: 'Quarter-turn rotation',            M: { a: 0, b: -1, c: 1, d: 0 } },
  { label: 'Singular · det = 0',               M: { a: 2, b: 4, c: 1, d: 2 } },
]

function InverseLab() {
  const [m, setM] = useState(INV_PRESETS[0].M)
  const set = (k, v) => setM(prev => ({ ...prev, [k]: v }))

  const { a, b, c, d } = m
  const det = a * d - b * c
  const singular = Math.abs(det) < 1e-9
  const A = [[a, b], [c, d]]
  const inv = singular ? null : [[d / det, -b / det], [-c / det, a / det]]
  // product A · A⁻¹, rounded so the identity reads cleanly
  const prod = inv ? A.map((row, i) => inv[0].map((_, j) =>
    row[0] * inv[0][j] + row[1] * inv[1][j])) : null

  const plain = () => ({ cls: '', text: '' })

  return (
    <div className="widget">
      <p className="widget-caption">
        <strong>The only inverse you'll compute by hand.</strong> Slide the four entries of
        <InlineMath>{'\\;A=\\left[\\begin{smallmatrix}a&b\\\\c&d\\end{smallmatrix}\\right]'}</InlineMath>. The determinant
        <InlineMath>{'\\;\\det A = ad-bc'}</InlineMath> is the gatekeeper: while it is non-zero the closed-form inverse
        exists and <InlineMath>{'A\\,A^{-1}=I'}</InlineMath>. Push it to zero (try the last preset) and the inverse blows
        up — there is none.
      </p>
      <div className="widget-card">
        <div className="lu">
          <div className="lu-mats">
            <div className="lu-row">
              <div className="lu-block">
                <span className="lu-label">A</span>
                <MGrid M={A} cell={(i, j, v) => ({ cls: '', text: fmt(v) })} />
              </div>
              <div className="lu-op">→</div>
              <div className="lu-block">
                <span className="lu-label">A⁻¹ = (1/det)·[[d,−b],[−c,a]]</span>
                {inv
                  ? <MGrid M={inv} cell={(i, j, v) => ({ cls: 'lfill', text: fmt(v) })} />
                  : <div className="matrix"><div className="mgrid" style={{ gridTemplateColumns: '1fr' }}>
                      <div className="mcell zero">undefined</div></div></div>}
              </div>
            </div>
            <div className="lu-row">
              <div className="lu-block">
                <span className="lu-label">A · A⁻¹</span>
                {prod
                  ? <MGrid M={prod} cell={(i, j, v) => ({ cls: i === j ? 'pivot' : 'zero', text: fmt(v) })} />
                  : <div className="matrix"><div className="mgrid" style={{ gridTemplateColumns: '1fr' }}>
                      <div className="mcell zero">—</div></div></div>}
              </div>
            </div>
          </div>

          <div className="subst-work">
            <div className="subst-work-head">
              2×2 inverse
              <span className="subst-det">det = {fmt(det)}</span>
            </div>
            {singular
              ? <div className="subst-status err">
                  <InlineMath>{'\\det A = 0'}</InlineMath> — the columns are linearly dependent, so
                  <InlineMath>{'\\;A'}</InlineMath> is <strong>not invertible</strong>. The formula would divide by zero.
                </div>
              : <div className="subst-status ok">
                  <InlineMath>{'\\det A \\neq 0'}</InlineMath>, so <InlineMath>{'A^{-1}'}</InlineMath> exists and is unique.
                  Note <InlineMath>{`\\det(A^{-1}) = ${fmt(1 / det)} = 1/\\det A`}</InlineMath>, and
                  <InlineMath>{'\\;A\\,A^{-1}=I'}</InlineMath> (right block).
                </div>}
            <div className="subst-step">
              <DisplayMath>{`A^{-1} = \\frac{1}{ad-bc}\\begin{bmatrix} d & -b \\\\ -c & a\\end{bmatrix} = \\frac{1}{${fmt(det)}}\\begin{bmatrix} ${fmt(d)} & ${fmt(-b)} \\\\ ${fmt(-c)} & ${fmt(a)}\\end{bmatrix}`}</DisplayMath>
            </div>
            <div className="slider-stack">
              <SliderRow label="a" k="a" value={a} onChange={set} min={-6} max={6} step={1} />
              <SliderRow label="b" k="b" value={b} onChange={set} min={-6} max={6} step={1} />
              <SliderRow label="c" k="c" value={c} onChange={set} min={-6} max={6} step={1} />
              <SliderRow label="d" k="d" value={d} onChange={set} min={-6} max={6} step={1} />
            </div>
          </div>
        </div>

        <div className="preset-bar">
          {INV_PRESETS.map((pr, i) => (
            <button key={i} className="preset-btn" onClick={() => setM(pr.M)}>{pr.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — "Why we don't hang out with people who compute matrix inverses."
//  Building A⁻¹ means solving A·xᵢ = eᵢ once per column. Step through the columns
//  and watch A⁻¹ assemble — then see that solving the actual Ax = b you cared
//  about was a SINGLE solve all along. The near-singular preset shows the inverse
//  exploding even though det is "not that close" to zero.
// ════════════════════════════════════════════════════════════════════════════

const HARD_PRESETS = [
  { label: '2×2 · [[4,2],[5,3]]', A: [[4, 2], [5, 3]], b: [4, 7] },
  { label: '3×3 · onion matrix',  A: [[-2, -4, -6], [-2, 1, -4], [-2, 11, -4]], b: [2, 3, -7] },
  { label: '3×3 · near-singular (Ex. 6.4)',
    A: [[0.9737, 0.4123, 1.3861], [0.7551, 0.6366, 1.3918], [0.6529, 0.1277, 0.7807]],
    b: [0.5568, 0.4081, 0.5018] },
]

function eVec(n, i) { return Array.from({ length: n }, (_, k) => (k === i ? 1 : 0)) }

// determinant display: keep tiny-but-nonzero values legible instead of rounding to 0
const detStr = d => (d !== 0 && Math.abs(d) < 1e-3 ? d.toExponential(2) : fmt(d))

function computeHard(A, b) {
  const n = A.length
  const cols = []          // columns of A⁻¹
  for (let i = 0; i < n; i++) {
    const r = solveLin(A, eVec(n, i))
    cols.push(r ? r.x : null)
  }
  const singular = cols.some(c => c === null)
  // A⁻¹ has columns cols[i]; assemble as a matrix (row-major) for display
  const inv = singular ? null
    : Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => cols[c][r]))
  const direct = solveLin(A, b)
  const det = direct ? direct.det : 0
  const maxAbs = inv ? Math.max(...inv.flat().map(Math.abs)) : Infinity
  return { n, cols, inv, singular, x: direct ? direct.x : null, det, maxAbs }
}

function InverseTheHardWay() {
  const [idx, setIdx] = useState(0)
  const [step, setStep] = useState(0)
  const { A, b } = HARD_PRESETS[idx]
  const { n, cols, inv, x, det, maxAbs } = useMemo(() => computeHard(A, b), [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  const finished = step >= n
  const active = step < n ? step : null
  function choose(i) { setIdx(i); setStep(0) }

  // A⁻¹ grid: column j shown once we've solved past it; the active column lit.
  const invCell = (i, j) => {
    if (j > step) return { cls: 'empty', text: '·' }
    if (j === step && active !== null) return { cls: 'colhi', text: '·' }
    return { cls: 'lfill', text: fmt(inv[i][j]) }
  }
  const eCell = (i) => ({ cls: active !== null && i === active ? 'pivot' : '', text: active !== null ? fmt(eVec(n, active)[i]) : '0' })

  return (
    <div className="widget">
      <p className="widget-caption">
        <strong>The inverse, the hard way.</strong> Each column of <InlineMath>{'A^{-1}'}</InlineMath> is the solution of a
        whole linear system <InlineMath>{'A\\,\\mathbf{x}_i = \\mathbf{e}_i'}</InlineMath>. So forming
        <InlineMath>{'\\;A^{-1}'}</InlineMath> for an <InlineMath>{'n\\times n'}</InlineMath> matrix means solving
        <InlineMath>{'\\;n'}</InlineMath> systems — just to then solve one more. Step through the columns, then compare with
        the single direct solve of <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath> on the right.
      </p>
      <div className="widget-card">
        <div className="subst">
          <div className="subst-matrix">
            <div className="lu-block">
              <span className="lu-label">A</span>
              <MGrid M={A} cell={(i, j, v) => ({ cls: '', text: fmt(v) })} />
            </div>
            <div className="lu-block">
              <span className="lu-label">{active !== null ? `solve A·xᵢ = e${active + 1}` : 'eᵢ'}</span>
              <div className="matrix">
                <div className="mgrid" style={{ gridTemplateColumns: '1fr' }}>
                  {Array.from({ length: n }, (_, i) => {
                    const c = eCell(i)
                    return <div key={i} className={`mcell ${c.cls}`}>{c.text}</div>
                  })}
                </div>
              </div>
            </div>
            <div className="asm-eq-sign">→</div>
            <div className="lu-block">
              <span className="lu-label">A⁻¹ (columns fill in)</span>
              <MGrid M={inv ?? A} cell={invCell} />
            </div>
          </div>

          <div className="subst-work">
            <div className="subst-work-head">
              Building A⁻¹ column by column
              <span className="subst-det">{Math.min(step, n)}/{n} solves</span>
            </div>

            {active !== null && (
              <div className="subst-step">
                <div className="subst-step-tag">
                  Solve <InlineMath>{`A\\,\\mathbf{x}_{${active + 1}} = \\mathbf{e}_{${active + 1}}`}</InlineMath> — this is column
                  <InlineMath>{`\\;${active + 1}`}</InlineMath> of <InlineMath>{'A^{-1}'}</InlineMath>
                </div>
                <DisplayMath>{`\\mathbf{x}_{${active + 1}} = ${col2tex(cols[active])}`}</DisplayMath>
              </div>
            )}

            {finished && (
              <>
                <div className="subst-status ok">
                  ✓ That took <strong>{n} linear solves</strong> to assemble <InlineMath>{'A^{-1}'}</InlineMath>. Then to get
                  <InlineMath>{'\\;\\mathbf{x}=A^{-1}\\mathbf{b}'}</InlineMath> you still owe a matrix–vector multiply.
                </div>
                <div className="subst-step">
                  <div className="subst-step-tag">But the question was just <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath> — that is <strong>one</strong> solve:</div>
                  <DisplayMath>{`\\mathbf{x} = ${col2tex(x)},\\qquad \\det A = ${detStr(det)}`}</DisplayMath>
                </div>
                {maxAbs > 1e3 && (
                  <div className="subst-status err">
                    Look at the size of those entries (max <InlineMath>{`\\;\\approx ${fmt(maxAbs)}`}</InlineMath>) for such a
                    modest right-hand side. Here <InlineMath>{`\\;\\det A = ${detStr(det)}`}</InlineMath> is tiny, so this
                    matrix is <strong>nearly singular</strong> and its inverse amplifies round-off badly. (As Examples
                    6.5–6.6 below warn, a determinant near <InlineMath>{'1'}</InlineMath> is no guarantee either.) Solving via
                    <InlineMath>{'\\;LU'}</InlineMath> sidesteps ever forming the inverse.
                  </div>
                )}
              </>
            )}

            {active === null && !finished && (
              <div className="subst-hint">Press <strong>Next ▶</strong> to solve for the first column of <InlineMath>{'A^{-1}'}</InlineMath>.</div>
            )}

            <div className="subst-controls">
              <button className="step-btn" disabled={step === 0}
                onClick={() => setStep(s => Math.max(0, s - 1))}>◀ Prev</button>
              <button className="step-btn primary" disabled={finished}
                onClick={() => setStep(s => Math.min(n, s + 1))}>Next ▶</button>
              <button className="step-btn" onClick={() => setStep(0)}>Reset</button>
            </div>
          </div>
        </div>

        <div className="preset-bar">
          {HARD_PRESETS.map((pr, i) => (
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

export default function L06() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#fdeaec', color: '#d83a45', borderColor: '#f6c9ce' }}>
          Module 1 · Lecture 6 · Grizzle Ch. 6
        </div>
        <h1 className="lesson-title">det(AB), Matrix Inverses &amp; Transposes</h1>
        <p className="lesson-subtitle">
          This lecture closes Module 1 by filling the gaps we sprinted past. We prove the determinant of a product is the
          product of the determinants, define the <strong>matrix inverse</strong>, and learn the single most important
          piece of numerical wisdom in the course: knowing <em>how</em> to compute <InlineMath>{'A^{-1}'}</InlineMath> and
          knowing that you <em>almost never should</em>. We finish with transposes, symmetry, and why permutation matrices
          are the easiest matrices in the world to invert.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Three ideas drive this lecture, and they are best felt before they are proven. <strong>First:</strong> a matrix
            stretches space by a factor of its determinant, so applying two matrices in a row multiplies their stretch
            factors — that is the whole content of <InlineMath>{'\\det(AB)=\\det(A)\\det(B)'}</InlineMath>. It also hands us
            a fast way to get a determinant: factor <InlineMath>{'A=LU'}</InlineMath> and just multiply the diagonal.
          </p>
          <p>
            <strong>Second:</strong> the matrix inverse is the "undo" operation. For a number, the undo of multiplying by
            <InlineMath>{'\\;x'}</InlineMath> is multiplying by <InlineMath>{'1/x'}</InlineMath> — and that fails for exactly
            one number, <InlineMath>{'x=0'}</InlineMath>. For a square matrix, the undo is <InlineMath>{'A^{-1}'}</InlineMath>,
            and it fails for exactly the matrices with <InlineMath>{'\\det A = 0'}</InlineMath>. The analogy is precise.
          </p>
          <p>
            <strong>Third, and most important:</strong> even though <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath> has
            the gorgeous closed-form answer <InlineMath>{'\\mathbf{x}=A^{-1}\\mathbf{b}'}</InlineMath>, computing
            <InlineMath>{'\\;A^{-1}'}</InlineMath> is a slow and numerically fragile way to get there. Your instructors at
            Michigan put it bluntly: <em>"we don't hang out with people who compute matrix inverses."</em> By the end of this
            lecture you'll understand exactly why.
          </p>
        </div>
      </section>

      {/* ── det(AB) ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · det(A·B) = det(A)·det(B)</span></h2>
        <div className="content-block">
          <p>
            Let <InlineMath>{'A'}</InlineMath> and <InlineMath>{'B'}</InlineMath> be two <InlineMath>{'n\\times n'}</InlineMath>
            matrices — they must be square and the same size. Then
          </p>
          <DisplayMath>{String.raw`\det(A\cdot B) = \det(A)\cdot\det(B).`}</DisplayMath>
          <p>
            This single fact pays for itself immediately. Suppose we have the <InlineMath>{'LU'}</InlineMath> factorization of
            a square <InlineMath>{'A'}</InlineMath>. Because <InlineMath>{'L'}</InlineMath> and <InlineMath>{'U'}</InlineMath>
            are triangular, each of their determinants is just the product of its diagonal, so
          </p>
          <DisplayMath>{String.raw`\det(A) = \det(L\cdot U) = \det(L)\cdot\det(U) = \Big(\textstyle\prod_i \ell_{ii}\Big)\Big(\textstyle\prod_i u_{ii}\Big).`}</DisplayMath>
          <p>
            That gives us a determinant for square matrices of <em>arbitrary size</em> — no cofactor expansion required.
            And because <InlineMath>{'\\det(ABC)=\\det A\\,\\det B\\,\\det C'}</InlineMath> by grouping
            <InlineMath>{'\\;(AB)C'}</InlineMath>, the rule extends to any product.
          </p>
          <div className="callout callout-info">
            <strong>Worked example (Grizzle 6.1).</strong> From Lecture 5,
            <InlineMath>{'\\;A=\\begin{bmatrix}-2&-4&-6\\\\-2&1&-4\\\\-2&11&-4\\end{bmatrix} = L\\,U'}</InlineMath> with
            <InlineMath>{'\\;L=\\begin{bmatrix}1&0&0\\\\1&1&0\\\\1&3&1\\end{bmatrix}'}</InlineMath>,
            <InlineMath>{'\\;U=\\begin{bmatrix}-2&-4&-6\\\\0&5&2\\\\0&0&-4\\end{bmatrix}'}</InlineMath>. Hence
            <InlineMath>{'\\;\\det A = \\underbrace{(1)(1)(1)}_{\\det L}\\cdot\\underbrace{(-2)(5)(-4)}_{\\det U} = 40.'}</InlineMath>
          </div>
        </div>
      </section>

      {/* ── Identity & inverse ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · THE IDENTITY AND THE INVERSE</span></h2>
        <div className="content-block">
          <p>
            The <strong>identity matrix</strong> <InlineMath>{'I_n'}</InlineMath> has ones on the diagonal and zeros
            elsewhere. It is the matrix version of the number <InlineMath>{'1'}</InlineMath>: as long as the product is
            defined, <InlineMath>{'\\;I_n A = A = A I_m'}</InlineMath>, and since it is diagonal,
            <InlineMath>{'\\;\\det(I_n)=1'}</InlineMath>.
          </p>
          <p>
            Just as <InlineMath>{'1'}</InlineMath> lets us define the reciprocal of a number, <InlineMath>{'I'}</InlineMath>
            lets us define the inverse of a matrix. For a square <InlineMath>{'A'}</InlineMath>, a matrix
            <InlineMath>{'\\;B'}</InlineMath> of the same size is the inverse if
          </p>
          <DisplayMath>{String.raw`A\cdot B = B\cdot A = I_n.`}</DisplayMath>
          <p>
            When it exists it is unique; we write it <InlineMath>{'A^{-1}'}</InlineMath> (never
            <InlineMath>{'\\;1/A'}</InlineMath> — that is a genuine faux pas). For real square matrices you only need to check
            <em>one</em> side: <InlineMath>{'\\;AB=I \\iff BA=I \\iff B=A^{-1}'}</InlineMath>. And the determinant decides
            existence outright:
          </p>
          <div className="callout callout-success">
            <strong>Major fact.</strong> An <InlineMath>{'n\\times n'}</InlineMath> matrix <InlineMath>{'A'}</InlineMath> is
            invertible <em>if and only if</em> <InlineMath>{'\\det A \\neq 0'}</InlineMath>. When it is,
            <InlineMath>{'\\;1=\\det(I)=\\det(AA^{-1})=\\det(A)\\det(A^{-1})'}</InlineMath>, so
            <InlineMath>{'\\;\\det(A^{-1}) = 1/\\det(A)'}</InlineMath>.
          </div>
          <p>
            For the <InlineMath>{'2\\times2'}</InlineMath> case there is a closed form worth memorizing — and it may be the
            <em> only</em> inverse you ever compute by hand. If <InlineMath>{'\\det A = ad-bc \\neq 0'}</InlineMath>,
          </p>
          <DisplayMath>{String.raw`\begin{bmatrix} a & b \\ c & d\end{bmatrix}^{-1} = \frac{1}{ad-bc}\begin{bmatrix} d & -b \\ -c & a\end{bmatrix}.`}</DisplayMath>
        </div>
      </section>

      {/* ── Interactive: 2×2 inverse lab ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · THE 2×2 INVERSE LAB</span></h2>
        <InverseLab />
      </section>

      {/* ── Worked: check an inverse ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · CHECKING AN INVERSE (Grizzle 6.3)</span></h2>
        <div className="content-block">
          <p>
            Is <InlineMath>{'B=\\tfrac{1}{2}\\begin{bmatrix}3&-2\\\\-5&4\\end{bmatrix}'}</InlineMath> the inverse of
            <InlineMath>{'\\;A=\\begin{bmatrix}4&2\\\\5&3\\end{bmatrix}'}</InlineMath>? By the definition we check the product:
          </p>
          <DisplayMath>{String.raw`A\cdot B = \begin{bmatrix}4&2\\5&3\end{bmatrix}\cdot\frac{1}{2}\begin{bmatrix}3&-2\\-5&4\end{bmatrix} = \frac{1}{2}\begin{bmatrix}2&0\\0&2\end{bmatrix} = \begin{bmatrix}1&0\\0&1\end{bmatrix}.`}</DisplayMath>
          <p>
            Since (for real square matrices) one side suffices, we conclude <InlineMath>{'B=A^{-1}'}</InlineMath>. The
            closed-form formula agrees: <InlineMath>{'\\det A = 4\\cdot3-2\\cdot5 = 2'}</InlineMath>, so
            <InlineMath>{'\\;A^{-1}=\\tfrac12\\begin{bmatrix}3&-2\\\\-5&4\\end{bmatrix}'}</InlineMath>. Try
            <InlineMath>{'\\;[[4,2],[5,3]]'}</InlineMath> in the lab above to see it land.
          </p>
        </div>
      </section>

      {/* ── Properties of inverse ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · ALGEBRA OF THE INVERSE</span></h2>
        <div className="content-block">
          <p>Three properties get used constantly. For invertible <InlineMath>{'n\\times n'}</InlineMath> matrices:</p>
          <DisplayMath>{String.raw`\det(A^{-1}) = \frac{1}{\det A}, \qquad (A\cdot B)^{-1} = B^{-1}\cdot A^{-1}, \qquad A=LU \Rightarrow A^{-1} = U^{-1}L^{-1}.`}</DisplayMath>
          <p>
            Notice the <strong>order reverses</strong> when you invert a product — exactly as with the transpose below. The
            reason is a one-line cancellation:
          </p>
          <DisplayMath>{String.raw`(A B)(B^{-1} A^{-1}) = A(B B^{-1})A^{-1} = A\,I\,A^{-1} = A A^{-1} = I.`}</DisplayMath>
          <p>
            So <InlineMath>{'(AB)^{-1}=B^{-1}A^{-1}'}</InlineMath>, and emphatically <em>not</em>
            <InlineMath>{'\\;A^{-1}B^{-1}'}</InlineMath>. The same logic applied to <InlineMath>{'A=LU'}</InlineMath> gives
            <InlineMath>{'\\;A^{-1}=U^{-1}L^{-1}'}</InlineMath>, and inverting a triangular matrix is comparatively easy — but
            as we are about to see, you rarely want to.
          </p>
        </div>
      </section>

      {/* ── Why not to invert ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · THE CLOSED FORM YOU SHOULD RESIST</span></h2>
        <div className="content-block">
          <p>
            When <InlineMath>{'A'}</InlineMath> is square and invertible, the system <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath>
            has the irresistible-looking solution
          </p>
          <DisplayMath>{String.raw`A\mathbf{x}=\mathbf{b} \iff \mathbf{x} = A^{-1}\mathbf{b}. \tag{6.1}`}</DisplayMath>
          <p>
            Beautiful to write, wasteful to compute. Here is the catch. Each column of <InlineMath>{'A^{-1}'}</InlineMath> is
            itself the solution of a linear system, because <InlineMath>{'A\\cdot A^{-1}=I'}</InlineMath> read column by
            column says
          </p>
          <DisplayMath>{String.raw`A\,\mathbf{x}^{\text{sol}}_i = \mathbf{e}_i,\quad 1\le i\le n, \qquad A^{-1} = \big[\,\mathbf{x}^{\text{sol}}_1\ \mathbf{x}^{\text{sol}}_2\ \cdots\ \mathbf{x}^{\text{sol}}_n\,\big]. \tag{6.2}`}</DisplayMath>
          <p>
            In other words, building <InlineMath>{'A^{-1}'}</InlineMath> means solving <InlineMath>{'n'}</InlineMath> separate
            linear systems — and then you would multiply <InlineMath>{'A^{-1}\\mathbf{b}'}</InlineMath> to answer the
            <em> one</em> system you actually had. Do you want to solve <InlineMath>{'n'}</InlineMath> systems to solve one?
            (Rhetorical. The answer is no.) Far better: factor <InlineMath>{'A=LU'}</InlineMath> once and run forward/back
            substitution. The widget below makes the waste visible.
          </p>
        </div>
      </section>

      {/* ── Interactive: inverse the hard way ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · A⁻¹ THE HARD WAY (n SOLVES FOR ONE)</span></h2>
        <InverseTheHardWay />
      </section>

      {/* ── Theory vs reality ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · THEORY vs. REALITY (CONDITIONING)</span></h2>
        <div className="content-block">
          <p>
            "<InlineMath>{'A^{-1}'}</InlineMath> exists iff <InlineMath>{'\\det A \\neq 0'}</InlineMath>" is true in perfect
            arithmetic. On a real computer it is a <em>poor</em> indicator of numerical invertibility, because the magnitude
            of the determinant can be lovely while the matrix is barely invertible.
          </p>
          <div className="callout callout-warning">
            <strong>Example 6.5.</strong> Take <InlineMath>{'A=\\begin{bmatrix}1 & 10^{-15}\\\\10^{10} & 1\\end{bmatrix}'}</InlineMath>.
            Its determinant is <InlineMath>{'\\;1-10^{-5}=0.99999'}</InlineMath> — reassuringly close to
            <InlineMath>{'\\;1'}</InlineMath> — yet the matrix mixes a huge entry with a tiny one and is numerically nasty.
            The determinant gave no warning at all.
          </div>
          <p>
            <strong>Example 6.6</strong> makes the point with a wholesome-looking
            <InlineMath>{'\\;A=\\begin{bmatrix}100 & 90 & -49\\\\90 & 81.001 & 5.49\\\\100 & 90.001 & 59.01\\end{bmatrix}'}</InlineMath>,
            <InlineMath>{'\\;\\det A = 0.901'}</InlineMath>. Inverting it produces entries near
            <InlineMath>{'\\;12{,}000'}</InlineMath>. But its <InlineMath>{'\\;LU'}</InlineMath> factorization reveals the
            culprit instantly — <InlineMath>{'U'}</InlineMath> has a pivot of <InlineMath>{'\\;-0.001'}</InlineMath> on its
            diagonal, so any back substitution divides by that tiny number and amplifies error. The
            <InlineMath>{'\\;LU'}</InlineMath> factorization is the reliable early-warning system, and once you have it you
            usually don't need <InlineMath>{'A^{-1}'}</InlineMath> at all. (Select the near-singular preset in the widget
            above to watch the inverse explode while the determinant looks innocent.)
          </p>
        </div>
      </section>

      {/* ── Transpose ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · TRANSPOSE &amp; SYMMETRY</span></h2>
        <div className="content-block">
          <p>
            The <strong>transpose</strong> <InlineMath>{'A^{\\top}'}</InlineMath> of an
            <InlineMath>{'\\;n\\times m'}</InlineMath> matrix is the <InlineMath>{'m\\times n'}</InlineMath> matrix that turns
            rows into columns: <InlineMath>{'\\;[A^{\\top}]_{ij}=[A]_{ji}'}</InlineMath>. For example,
          </p>
          <DisplayMath>{String.raw`A = \begin{bmatrix}1&2&3\\4&5&6\end{bmatrix} \;\Rightarrow\; A^{\top} = \begin{bmatrix}1&4\\2&5\\3&6\end{bmatrix}.`}</DisplayMath>
          <p>It obeys three properties, the last reversing order just like the inverse:</p>
          <DisplayMath>{String.raw`(A^{\top})^{\top} = A, \qquad \det(A^{\top}) = \det(A)\ (\text{square } A), \qquad (A\cdot B)^{\top} = B^{\top}\cdot A^{\top}.`}</DisplayMath>
          <p>
            A square matrix is <strong>symmetric</strong> if <InlineMath>{'A^{\\top}=A'}</InlineMath> and
            <strong> skew-symmetric</strong> if <InlineMath>{'A^{\\top}=-A'}</InlineMath> (forcing a zero diagonal). For
            instance <InlineMath>{'\\;\\begin{bmatrix}1&3&7\\\\3&0&-6\\\\7&-6&7\\end{bmatrix}'}</InlineMath> is symmetric, while
            <InlineMath>{'\\;\\begin{bmatrix}0&-2&5\\\\2&0&6\\\\-5&-6&0\\end{bmatrix}'}</InlineMath> is skew-symmetric.
          </p>
          <div className="callout callout-info">
            <strong>A key source of symmetric matrices.</strong> For <em>any</em> real
            <InlineMath>{'\\;n\\times m'}</InlineMath> matrix <InlineMath>{'A'}</InlineMath>, the product
            <InlineMath>{'\\;A^{\\top}A'}</InlineMath> is <InlineMath>{'m\\times m'}</InlineMath> and symmetric, because
            <InlineMath>{'\\;(A^{\\top}A)^{\\top} = A^{\\top}(A^{\\top})^{\\top} = A^{\\top}A'}</InlineMath>. This matrix is the
            star of Lecture 10's least-squares normal equations <InlineMath>{'A^{\\top}A\\mathbf{x}=A^{\\top}\\mathbf{b}'}</InlineMath>.
          </div>
        </div>
      </section>

      {/* ── Permutation matrices ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · PERMUTATION MATRICES, REVISITED</span></h2>
        <div className="content-block">
          <p>
            Back in Lecture 4 we used permutation matrices before we could fully justify them. Now we can. A
            <strong> permutation matrix</strong> is a square matrix of zeros and ones with exactly one
            <InlineMath>{'\\;1'}</InlineMath> in every row and every column — it is just a reordering of the rows of
            <InlineMath>{'\\;I'}</InlineMath>. The headline property is that its inverse is its transpose:
          </p>
          <DisplayMath>{String.raw`P^{\top}P = P\,P^{\top} = I \quad\Longrightarrow\quad P^{-1} = P^{\top}.`}</DisplayMath>
          <p>
            Writing <InlineMath>{'P'}</InlineMath> as a stack of standard basis rows <InlineMath>{'\\mathbf{e}_i^{\\top}'}</InlineMath>,
            the product <InlineMath>{'\\;P^{\\top}P'}</InlineMath> collapses to <InlineMath>{'\\sum_i \\mathbf{e}_i\\mathbf{e}_i^{\\top}=I'}</InlineMath>.
            So inverting a permutation matrix is a snap — just flip it across the diagonal. This is the cheapest inverse there
            is, and it is why the <InlineMath>{'\\;PA=LU'}</InlineMath> of Lecture 5 costs almost nothing: applying
            <InlineMath>{'\\;P'}</InlineMath> to a vector is just a reordering, and undoing it is the same reordering with
            <InlineMath>{'\\;P^{\\top}'}</InlineMath>.
          </p>
          <p>
            Concretely, if a permutation list <InlineMath>{'\\;\\texttt{p}=[4,2,1,5,3]'}</InlineMath> says "bring row 4 to the
            top, keep row 2, row 1 to position 3, …", then permuting a vector by indexing,
            <InlineMath>{'\\;\\mathbf{b}[\\texttt{p}]'}</InlineMath>, gives exactly <InlineMath>{'P\\mathbf{b}'}</InlineMath>.
          </p>
        </div>
      </section>

      {/* ── Julia native ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">IN CODE · DETERMINANT, INVERSE, TRANSPOSE IN JULIA</span></h2>
        <div className="content-block">
          <p>
            Julia's <InlineMath>{'\\texttt{LinearAlgebra}'}</InlineMath> package gives you all of this directly — and the
            point of the lecture is to know <em>when not to reach for</em> <InlineMath>{'\\texttt{inv}'}</InlineMath>.
          </p>
          <pre className="code-block"><code>{`using LinearAlgebra

A = [4.0 2; 5 3]
det(A)            # 2.0  (via LU internally, not cofactors)
inv(A)            # [1.5 -1.0; -2.5 2.0]  — the 2x2 closed form

# Build an n x n identity, and a permutation matrix from a row order:
n  = 5
Id = zeros(n, n) + I           # 5x5 identity
p  = [4, 2, 1, 5, 3]
P  = Id[p, :]                  # permutation matrix; P^-1 == P' (transpose)
b  = [1.0, 2, 3, 4, 5]
P * b == b[p]                  # true — P*b is just the reordering b[p]

# SOLVE Ax = b WITHOUT EVER FORMING inv(A):
x = A \\ b[1:2]                 # backslash factors (LU) and substitutes`}</code></pre>
          <p>
            The backslash operator <InlineMath>{'\\;\\texttt{A}\\backslash\\texttt{b}'}</InlineMath> is the right habit: it
            factors and substitutes, and never builds <InlineMath>{'A^{-1}'}</InlineMath>. Transpose is
            <InlineMath>{'\\;\\texttt{A}^{\\prime}'}</InlineMath> (or <InlineMath>{'\\texttt{transpose(A)}'}</InlineMath>), and
            symmetry of <InlineMath>{'\\;A^{\\top}A'}</InlineMath> is automatic.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <p>
            That completes Module 1. You now have the full toolkit for <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath>
            when a square <InlineMath>{'A'}</InlineMath> is invertible: determinants (cheaply, via
            <InlineMath>{'\\;LU'}</InlineMath>), the inverse and its algebra, transposes and symmetry, and the practical
            wisdom to factor rather than invert.
          </p>
          <div className="callout callout-success">
            <strong>Consolidation checkpoint — "You can now solve Ax = b. Here's what that took."</strong> From a system of
            equations (L1–L2) to triangular solves (L3), matrix multiplication (L4), the <InlineMath>{'LU'}</InlineMath>
            factorization (L5), and now determinants of products, inverses, and transposes (L6). Next, Module 2 asks a
            deeper question: what if <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath> has <em>no</em> exact solution? We
            will measure the size of a vector, define the error <InlineMath>{'\\;\\mathbf{e}=A\\mathbf{x}-\\mathbf{b}'}</InlineMath>,
            and learn to make it as small as possible — the world of vector spaces and least squares.
          </div>
        </div>
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span></h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🦾</div>
              <h3>Jacobian Pseudo-Inverse Control</h3>
              <p>
                Robot velocity control inverts the Jacobian, <InlineMath>{'\\dot{\\mathbf{q}}=J^{+}\\dot{\\mathbf{x}}'}</InlineMath>.
                Near a singularity <InlineMath>{'\\det J\\to 0'}</InlineMath> and the inverse explodes — exactly the
                conditioning trap of Examples 6.5–6.6 — so controllers damp it rather than invert blindly.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🚫</div>
              <h3>Never Invert in Production</h3>
              <p>
                Estimators and solvers that run thousands of times per second factor once
                (<InlineMath>{'A=LU'}</InlineMath>) and substitute, never forming <InlineMath>{'A^{-1}'}</InlineMath>. It is
                faster and far more numerically stable.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📐</div>
              <h3>Normal Equations are Symmetric</h3>
              <p>
                Least-squares sensor fusion solves <InlineMath>{'A^{\\top}A\\,\\mathbf{x}=A^{\\top}\\mathbf{b}'}</InlineMath>.
                Because <InlineMath>{'A^{\\top}A'}</InlineMath> is always symmetric, specialized symmetric factorizations
                (Cholesky/LDLᵀ) apply — the payoff of the transpose identities.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🔀</div>
              <h3>Permutations Cost Nothing to Undo</h3>
              <p>
                Pivoting, state reordering, and graph relabeling all use permutation matrices. Because
                <InlineMath>{'\\;P^{-1}=P^{\\top}'}</InlineMath>, undoing a reordering is free — no solve required.
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
            num={1} type="Computation"
            question="Using det(A) = det(L)·det(U) with L unit lower-triangular and U having diagonal (−2, 5, −4), what is det(A)?"
            options={['40', '11', '−11', '0']}
            correct={0}
            explanation="det(L) = 1 (unit diagonal). det(U) = (−2)(5)(−4) = 40. So det(A) = 1·40 = 40 — the product of the pivots, no cofactor expansion needed."
          />
          <QuizQ
            num={2} type="Computation"
            question="For A = [[4, 2], [5, 3]], what is A⁻¹?"
            options={[
              '½·[[3, −2], [−5, 4]]',
              '½·[[3, 5], [−2, 4]]',
              '[[3, −2], [−5, 4]]',
              'A is singular — no inverse',
            ]}
            correct={0}
            explanation="det(A) = 4·3 − 2·5 = 2 ≠ 0, so A⁻¹ = (1/det)·[[d, −b], [−c, a]] = ½·[[3, −2], [−5, 4]]. Swap the diagonal, negate the off-diagonal, divide by the determinant."
          />
          <QuizQ
            num={3} type="Concept"
            question="Why is computing A⁻¹ a poor way to solve Ax = b for a large matrix?"
            options={[
              'Because A⁻¹ does not exist when det(A) ≠ 0',
              'Because each column of A⁻¹ is itself a linear solve, so forming A⁻¹ means solving n systems just to solve one — and it is numerically fragile',
              'Because the inverse changes the solution x',
              'Because only triangular matrices have inverses',
            ]}
            correct={1}
            explanation="A·A⁻¹ = I read column-by-column says A·xᵢ = eᵢ, so A⁻¹ costs n linear solves. Then x = A⁻¹b adds a multiply. Factoring A = LU and substituting solves the one system you have far faster and more stably."
          />
          <QuizQ
            num={4} type="Transfer"
            question="A permutation matrix P reorders rows. What is its inverse, and what does that say about (AB)ᵀ?"
            options={[
              'P⁻¹ = P, and (AB)ᵀ = AᵀBᵀ',
              'P⁻¹ = Pᵀ (transpose), and like the inverse of a product, (AB)ᵀ = BᵀAᵀ reverses the order',
              'P⁻¹ = −P, and (AB)ᵀ = BᵀAᵀ',
              'P has no inverse; (AB)ᵀ is undefined',
            ]}
            correct={1}
            explanation="For a permutation matrix PᵀP = PPᵀ = I, so P⁻¹ = Pᵀ. Both transpose and inverse of a product reverse the order of the factors: (AB)ᵀ = BᵀAᵀ and (AB)⁻¹ = B⁻¹A⁻¹."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>Re-derive det(A) = det(L)·det(U) from det(AB) = det(A)·det(B), and the 2×2 inverse formula, from scratch.</div>
            <div className="review-item"><span className="review-day">Day 1</span>Answer: (a) A is invertible iff what? (b) why does forming A⁻¹ cost n linear solves?</div>
            <div className="review-item"><span className="review-day">Day 3</span>Without notes, verify ½·[[3,−2],[−5,4]] is the inverse of [[4,2],[5,3]], and compute det of [[−2,−4,−6],[−2,1,−4],[−2,11,−4]] via its pivots.</div>
            <div className="review-item"><span className="review-day">Day 7</span>Explain why det(A) ≈ 1 does not guarantee A is numerically invertible (Examples 6.5–6.6), and how LU reveals the trouble.</div>
            <div className="review-item"><span className="review-day">Day 14</span>In under 2 minutes, explain to someone why "we don't compute matrix inverses" — and what we do instead.</div>
          </div>
        </div>
      </section>

    </div>
  )
}