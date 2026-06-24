import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { useOrbitScene } from '../shared/useOrbitScene.js'
import { useAnimatedParams } from '../shared/useAnimatedParams.js'
import { fmt, QuizQ } from '../shared/ui.jsx'
import { ataLDLT } from '../shared/linalg.js'
import {
  COL, tube, sphere, axisArrow, gridFloor, label,
  arrowFromTo, planeMesh, disposeObject,
} from '../shared/three-helpers.js'

const v3 = a => new THREE.Vector3(a[0], a[1], a[2])

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET — The independence counter (rank meter via LDLᵀ of AᵀA)
//  Pick a set of vectors in ℝ³; the diagonal of D fills in, its non-zero count
//  k is the number of independent vectors, and the span is drawn (line/plane/ℝ³).
//  Redundant vectors (the last m−k after pivoting) are dimmed.
// ════════════════════════════════════════════════════════════════════════════

const VEC_COLORS = [COL.line1, COL.line2, COL.vertex, COL.point]
const SWATCHES = ['#e8590c', '#1c7ed6', '#6741d9', '#099268']

const COUNT_PRESETS = [
  {
    label: '3 independent → fills ℝ³ (Ex. 7.5)',
    vecs: [[1.414, 0, 0], [4, 7, 0], [3, 1, -1]],
  },
  {
    label: '2 independent → a plane (Ex. 7.6)',
    vecs: [[1, 2, 3], [1, -2, -4]],
  },
  {
    label: '3rd is redundant → still k = 2',
    vecs: [[3, 1, -1], [2, -2, 1], [2.5, -0.5, 0]], // v₃ = ½(v₁ + v₂)
  },
  {
    label: '4 vectors in ℝ³ → at most k = 3',
    vecs: [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 1]],
  },
  {
    label: 'all parallel → k = 1 (a line)',
    vecs: [[1, 1, 1], [2, 2, 2], [-1, -1, -1]],
  },
]

function CountWidget() {
  const [idx, setIdx] = useState(0)
  const preset = COUNT_PRESETS[idx]
  const dyn = useRef([])

  // animate the vectors gliding between presets by easing each component
  const flat = {}
  preset.vecs.forEach((v, i) => { flat[`x${i}`] = v[0]; flat[`y${i}`] = v[1]; flat[`z${i}`] = v[2] })
  const shown = useAnimatedParams(flat)
  const count = preset.vecs.length
  const vecsShown = Array.from({ length: count }, (_, i) => [shown[`x${i}`] ?? 0, shown[`y${i}`] ?? 0, shown[`z${i}`] ?? 0])

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
    { target: [0, 0.5, 0], camStart: { theta: 0.8, phi: 1.0, r: 17 }, zoom: [9, 38] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }
    const O = new THREE.Vector3(0, 0, 0)

    const { rank, perm } = ataLDLT(vecsShown)
    const independentSet = new Set(perm.slice(0, rank)) // original indices kept

    // The span the independent vectors generate.
    if (rank === 1) {
      const d = v3(vecsShown[perm[0]]).normalize()
      add(tube(d.clone().multiplyScalar(-9), d.clone().multiplyScalar(9), COL.guide, 0.04))
    } else if (rank === 2) {
      const a = v3(vecsShown[perm[0]]), b = v3(vecsShown[perm[1]])
      const nrm = a.clone().cross(b)
      const pm = planeMesh(nrm.x, nrm.y, nrm.z, 0, COL.line2, 6, 0.18); if (pm) add(pm)
    } else if (rank === 3) {
      add(new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(11, 11, 11)),
        new THREE.LineBasicMaterial({ color: COL.point, transparent: true, opacity: 0.26 })
      ))
    }

    // Each vector — independent ones solid, redundant ones dimmed (thin/grey).
    vecsShown.forEach((vv, i) => {
      const indep = independentSet.has(i)
      const color = indep ? VEC_COLORS[i % VEC_COLORS.length] : COL.guide
      add(arrowFromTo(O, v3(vv), color, indep ? 0.055 : 0.03))
      add(sphere(v3(vv), color, indep ? 0.14 : 0.1))
    })
  }, [shown, idx]) // eslint-disable-line react-hooks/exhaustive-deps

  // verdict computed on the (non-animated) preset for a stable readout
  const { diagD, rank, perm } = ataLDLT(preset.vecs)
  const independentSet = new Set(perm.slice(0, rank))
  const spanTxt = rank === 1 ? 'a line' : rank === 2 ? 'a plane' : rank === 3 ? 'all of ℝ³' : 'the origin'
  const badge = rank === count
    ? { cls: 'badge-unique', txt: `✓ all ${count} independent · k = ${rank}` }
    : { cls: 'badge-infinite', txt: `✗ ${count - rank} redundant · k = ${rank} < ${count}` }

  return (
    <div className="widget">
      <p className="widget-caption">
        Independence is no longer a yes/no question — we want the <strong>number</strong>
        <InlineMath>{'\\;k'}</InlineMath> of vectors in the largest independent subset. The diagonal of
        <InlineMath>{'\\;D'}</InlineMath> (from the LDLᵀ factorization of <InlineMath>{'A^{\\top}A'}</InlineMath>) does
        the counting for us: <strong>k = number of non-zero entries of <InlineMath>{'D'}</InlineMath></strong>. The
        independent vectors are drawn solid and generate the span (a line, a plane, or all of
        <InlineMath>{'\\;\\mathbb{R}^3'}</InlineMath>); any <span style={{ color: '#5c6b85' }}>greyed-out</span> vector
        is redundant — a linear combination of the others.
      </p>
      <p className="widget-instructions">drag to orbit · scroll to zoom · switch presets to watch k and the span change</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq">diag(D) = [ {diagD.slice(0, count).map((d, i) => (
                <span key={i} style={{ color: Math.abs(d) > 1e-6 ? '#2f9e44' : '#c92a2a', fontWeight: 700 }}>
                  {fmt(Math.round(d * 10) / 10)}{i < count - 1 ? ', ' : ''}
                </span>
              ))} ]</div>
              <div className="hud-note">{rank} non-zero pivot{rank === 1 ? '' : 's'} → span is {spanTxt}</div>
              <div className="hud-note">independent columns: {[...independentSet].sort((a, b) => a - b).map(i => `v${i + 1}`).join(', ') || 'none'}</div>
            </div>
            <div className={`hud-badge ${badge.cls}`}>{badge.txt}</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {COUNT_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`}
              onClick={() => setIdx(i)}>{pr.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <div className="controls-label">Vectors in this set</div>
            {preset.vecs.map((v, i) => (
              <div key={i} className="hud-eq" style={{ fontSize: 12, color: independentSet.has(i) ? SWATCHES[i % SWATCHES.length] : '#5c6b85' }}>
                <span className="swatch" style={{ background: independentSet.has(i) ? SWATCHES[i % SWATCHES.length] : '#5c6b85' }} />
                v{i + 1} = ({fmt(v[0])}, {fmt(v[1])}, {fmt(v[2])}){!independentSet.has(i) && '  — redundant'}
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

export default function L08() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#e9f0ff', color: '#2563eb', borderColor: '#c9dbf6' }}>
          Module 2 · Lecture 8 · Grizzle Ch. 7 §7.6
        </div>
        <h1 className="lesson-title">Counting Independent Vectors — the LDLᵀ Factorization</h1>
        <p className="lesson-subtitle">
          Lecture 7 answered a yes/no question: is a set of vectors independent? This session asks the sharper
          quantitative one — <strong>how many</strong> of them are independent? That single number (soon to be named
          <strong> rank</strong>) is read straight off the diagonal of <InlineMath>{'D'}</InlineMath> in the
          <strong> LDLᵀ factorization</strong> of <InlineMath>{'A^{\\top}A'}</InlineMath>, turning an exponential
          hand-search into one factorization.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Suppose someone hands you five vectors and asks: "how many genuinely different directions are in here?"
            Maybe all five are independent; maybe two are redundant copies of the others in disguise. The honest answer
            is a <em>count</em> — the size of the largest subset you could keep while throwing away the fewest vectors so
            that what remains is independent.
          </p>
          <p>
            You could find it by brute force: check <InlineMath>{'\\{v_1\\}'}</InlineMath>, then
            <InlineMath>{'\\;\\{v_1,v_2\\}'}</InlineMath>, then <InlineMath>{'\\{v_1,v_2,v_3\\}'}</InlineMath>, branching
            "keep or discard" at every step. That search tree grows <strong>exponentially</strong> — hopeless for
            anything but toy sets. We want a single mechanical procedure that spits out the number.
          </p>
          <p>
            That procedure is a factorization. Form the symmetric matrix <InlineMath>{'A^{\\top}A'}</InlineMath> from the
            vectors-as-columns, factor it as <InlineMath>{'\\;L D L^{\\top}'}</InlineMath>, and simply
            <strong> count the non-zero entries on the diagonal of <InlineMath>{'D'}</InlineMath></strong>. The widget
            below makes the count visible: as the diagonal fills with non-zeros, the span grows from a line to a plane to
            all of space — and any vector that fails to add a new direction is flagged redundant.
          </p>
        </div>
      </section>

      {/* ── Formalism: why LU on A isn't enough ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · FROM "IF" TO "HOW MANY"</span></h2>
        <div className="content-block">
          <p>
            Recall the Pro Tip from Lecture 7: stack the vectors as the columns of <InlineMath>{'A'}</InlineMath>; the set
            is independent <strong>iff</strong> <InlineMath>{'\\det(A^{\\top}A)\\neq 0'}</InlineMath>, i.e. the upper-
            triangular <InlineMath>{'U'}</InlineMath> in a factorization of <InlineMath>{'A^{\\top}A'}</InlineMath> has no
            zero on its diagonal. When the vectors are <em>dependent</em>, some diagonal entries vanish — and it is
            tempting to just count the non-zero ones to get the number of independent vectors.
          </p>
          <p>
            We can divide any set <InlineMath>{'\\{v_1,\\dots,v_m\\}\\subset\\mathbb{R}^n'}</InlineMath> into
            <InlineMath>{'\\;k'}</InlineMath> independent vectors and <InlineMath>{'m-k'}</InlineMath> that are linear
            combinations of them. Stacked as the columns of <InlineMath>{'A'}</InlineMath>, that means
            <InlineMath>{'\\;A'}</InlineMath> has <strong><InlineMath>{'k'}</InlineMath> independent columns</strong> and
            <InlineMath>{'\\;m-k'}</InlineMath> dependent ones. The question is how to read
            <InlineMath>{'\\;k'}</InlineMath> off a factorization reliably.
          </p>
          <div className="callout callout-warning">
            <strong>Why a plain LU of <InlineMath>{'A^{\\top}A'}</InlineMath> can mislead.</strong> For a general matrix,
            the count of non-zero diagonal entries of <InlineMath>{'U'}</InlineMath> does <em>not</em> always equal the
            number of independent columns (a zero can appear on the diagonal even when more independent columns exist).
            The fix is to keep the factorization <strong>symmetric</strong> at every step — permuting <em>rows and
            columns together</em> — which is exactly what the LDLᵀ factorization does.
          </div>
        </div>
      </section>

      {/* ── Formalism: LDLT ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · THE LDLᵀ FACTORIZATION</span></h2>
        <div className="content-block">
          <p>
            For any matrix of the form <InlineMath>{'A^{\\top}A'}</InlineMath> (symmetric and positive-semidefinite),
            there is a permutation <InlineMath>{'P'}</InlineMath> and a factorization
          </p>
          <DisplayMath>{String.raw`P \cdot A^{\top}A \cdot P^{\top} = L\,D\,L^{\top},`}</DisplayMath>
          <p>
            where <InlineMath>{'L'}</InlineMath> is uni-lower-triangular (1's on its diagonal),
            <InlineMath>{'\\;L^{\\top}'}</InlineMath> is therefore uni-upper-triangular, and
            <InlineMath>{'\\;D'}</InlineMath> is <strong>diagonal with non-negative entries</strong>. It is a refined LU
            factorization specialised to <InlineMath>{'A^{\\top}A'}</InlineMath> (with <InlineMath>{'U := D L^{\\top}'}</InlineMath>);
            the symmetric cousin you may have heard of is the <strong>Cholesky factorization</strong>. The
            <InlineMath>{'\\;P^{\\top}'}</InlineMath> on the right re-orders columns to match the row swaps and keep the
            product symmetric.
          </p>
          <div className="callout callout-success">
            <strong>The counting result.</strong> The number of <strong>linearly independent columns of
            <InlineMath>{'\\;A'}</InlineMath></strong> equals the number of <strong>non-zero entries on the diagonal of
            <InlineMath>{'\\;D'}</InlineMath></strong>. Call that number <InlineMath>{'k'}</InlineMath>. Moreover, the
            first <InlineMath>{'\\;k'}</InlineMath> columns of <InlineMath>{'A\\,P^{\\top}'}</InlineMath> (the columns of
            <InlineMath>{'\\;A'}</InlineMath> reordered by <InlineMath>{'P^{\\top}'}</InlineMath>) are themselves a
            linearly independent set — so the factorization not only counts the independent vectors, it
            <strong> picks them out</strong>.
          </div>
          <p>
            You are not responsible for deriving the LDLᵀ algorithm (Grizzle gives it in §7.10), only for
            <em> using</em> it: feed it <InlineMath>{'A^{\\top}A'}</InlineMath>, read <InlineMath>{'\\operatorname{diag}(D)'}</InlineMath>,
            count the non-zeros. The widget runs exactly this factorization live.
          </p>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · THE INDEPENDENCE COUNTER</span></h2>
        <CountWidget />
      </section>

      {/* ── Worked example 7.11 / 7.12 ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · GRIZZLE 7.11–7.13</span></h2>
        <div className="content-block">
          <p>
            How many of the five columns of this <InlineMath>{'7\\times5'}</InlineMath> matrix are independent? By hand
            this is brutal; with the factorization it is a glance.
          </p>
          <DisplayMath>{String.raw`A = \begin{bmatrix} -0.2 & -0.2 & -0.4 & 0.3 & 0.3 \\ 0.3 & 1.0 & -0.1 & -1.1 & -1.7 \\ 0.7 & -1.9 & 1.5 & 0.0 & -3.0 \\ 0.9 & -1.0 & -0.7 & 0.6 & -1.8 \\ -0.5 & 0.8 & -1.1 & -0.5 & -0.5 \\ -2.0 & -0.9 & -0.5 & 0.2 & 0.3 \\ -1.0 & 0.6 & 0.7 & -0.9 & 0.2 \end{bmatrix}_{7\times5}`}</DisplayMath>
          <p>
            Compute <InlineMath>{'A^{\\top}A'}</InlineMath> (a <InlineMath>{'5\\times5'}</InlineMath> symmetric matrix) and
            its LDLᵀ factorization. The diagonal of <InlineMath>{'D'}</InlineMath> comes out as
          </p>
          <DisplayMath>{String.raw`\operatorname{diag}(D) = \begin{bmatrix} 15.6 & 5.2 & 4.4 & 2.3 & \boxed{0.0} \end{bmatrix}.`}</DisplayMath>
          <p>
            Four non-zero entries, so <strong><InlineMath>{'k = 4'}</InlineMath></strong>: exactly four of the five
            columns are linearly independent, and one is a combination of the others. <strong>Which</strong> four? Read
            the permutation <InlineMath>{'P'}</InlineMath>: for the closely related Example 7.13 it reorders the columns
            as <InlineMath>{'\\;A P^{\\top} = \\begin{bmatrix} A_5 & A_6 & A_3 & A_4 & A_1 & A_2 \\end{bmatrix}'}</InlineMath>,
            and since the first <InlineMath>{'k=4'}</InlineMath> are independent, columns
            <InlineMath>{'\\;\\{A_5, A_6, A_3, A_4\\}'}</InlineMath> form an independent set while
            <InlineMath>{'\\;A_1, A_2'}</InlineMath> are dependent on them. The factorization counts <em>and</em> selects.
          </p>
          <div className="callout">
            <strong>Try the widget's "3rd is redundant" preset.</strong> There,
            <InlineMath>{'\\;v_3 = \\tfrac12(v_1 + v_2)'}</InlineMath>, so
            <InlineMath>{'\\;\\operatorname{diag}(D) = [\\,\\bullet, \\bullet, 0\\,]'}</InlineMath> with two non-zeros —
            <InlineMath>{'\\;k=2'}</InlineMath>, the span is a plane, and <InlineMath>{'v_3'}</InlineMath> is greyed out as
            the redundant one, just as columns <InlineMath>{'A_1, A_2'}</InlineMath> were the dependent ones above.
          </div>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <p>
            The number <InlineMath>{'k'}</InlineMath> we just learned to compute is so important it gets two names. As
            the count of independent vectors in a set it is the <strong>dimension of the span</strong>,
            <InlineMath>{'\\;\\dim\\operatorname{span}\\{v_1,\\dots,v_m\\}'}</InlineMath>; as a property of the matrix
            <InlineMath>{'\\;A'}</InlineMath> whose columns they are, it is the <strong>rank</strong> of
            <InlineMath>{'\\;A'}</InlineMath> (formalised in Lecture 15, with the rank–nullity theorem).
          </p>
          <p>
            In the very next lecture we put this counter to work. By appending a vector <InlineMath>{'b'}</InlineMath> to
            the columns of <InlineMath>{'A'}</InlineMath> and comparing the counts of
            <InlineMath>{'\\;A'}</InlineMath> and <InlineMath>{'[A\\;\\,b]'}</InlineMath>, we will decide — for systems of
            <em> any</em> shape — whether <InlineMath>{'A\\mathbf{x}=b'}</InlineMath> has <strong>no solution, exactly one,
            or infinitely many</strong>. Existence and uniqueness, settled by counting.
          </p>
        </div>
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span></h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🦿</div>
              <h3>Jacobian Rank = Mobility</h3>
              <p>
                A robot's Jacobian columns are the end-effector velocities each joint produces. The number of
                independent columns — its rank — is how many Cartesian directions the robot can actually move. A drop in
                that count is a <strong>singularity</strong>.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📉</div>
              <h3>Data Rank &amp; PCA</h3>
              <p>
                Stack measurements as columns; the number of independent ones is the data's intrinsic dimension. Counting
                non-zero <InlineMath>{'D'}</InlineMath> (or, later, singular values) tells you how many features actually
                matter — the seed of dimensionality reduction.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🛰️</div>
              <h3>Redundant Sensors</h3>
              <p>
                Five sensors but only <InlineMath>{'k=3'}</InlineMath> independent readings means two are redundant
                combinations of the rest. The LDLᵀ count flags exactly how much truly new information the sensor suite
                provides.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🖼️</div>
              <h3>Low-Rank Compression</h3>
              <p>
                An image or weight matrix with few independent columns is <em>low rank</em> — storable with far fewer
                numbers. Counting independent columns is the first measure of how compressible a matrix is.
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
            question="In the LDLᵀ factorization P·AᵀA·Pᵀ = L D Lᵀ, how do you read off the number of linearly independent columns of A?"
            options={[
              'Count the rows of L',
              'Count the NON-ZERO entries on the diagonal of D',
              'Take the determinant of L',
              'Count the zeros on the diagonal of D',
            ]}
            correct={1}
            explanation="The number of independent columns of A equals the number of non-zero diagonal entries of D. (The zeros count the redundant/dependent columns: m − k of them.)"
          />
          <QuizQ
            num={2} type="Computational"
            question="An LDLᵀ factorization of AᵀA for a set of 4 vectors gives diag(D) = [12.0, 3.5, 0.0, 0.0]. How many of the vectors are independent, and what is the span?"
            options={[
              'k = 4; the span is all of ℝ⁴',
              'k = 2; two vectors are redundant and the span is a plane (dimension 2)',
              'k = 0; the vectors are all zero',
              'k = 3; only one vector is redundant',
            ]}
            correct={1}
            explanation="Two non-zero pivots ⇒ k = 2 independent vectors; the other 4 − 2 = 2 are linear combinations of them. The span has dimension 2 — a plane through the origin."
          />
          <QuizQ
            num={3} type="Geometric"
            question="You have 4 vectors in ℝ³. What is the largest possible value of k (the number that are linearly independent)?"
            options={[
              '4 — one per vector',
              '3 — you cannot have more independent vectors than the dimension of the space they live in',
              '1 — vectors in ℝ³ are always dependent',
              'It depends only on their lengths',
            ]}
            correct={1}
            explanation="At most 3 vectors in ℝ³ can be independent (3 independent ones already span all of ℝ³). A 4th must be a linear combination of the others, so k ≤ 3. The widget's '4 vectors in ℝ³' preset shows exactly this: k = 3 with one greyed-out redundant vector."
          />
          <QuizQ
            num={4} type="Transfer"
            question="Why use LDLᵀ of AᵀA rather than a plain LU factorization of A to count independent columns?"
            options={[
              'LU is always wrong',
              'AᵀA is symmetric, and keeping the factorization symmetric (swapping rows AND columns together) makes the non-zero diagonal count of D reliably equal the number of independent columns',
              'LU cannot be computed for tall matrices',
              'LDLᵀ is faster to type',
            ]}
            correct={1}
            explanation="For a general matrix, the non-zero diagonal count of U from a plain LU need not equal the number of independent columns. AᵀA is symmetric positive-semidefinite; the symmetric (row-and-column) pivoting of LDLᵀ guarantees the count of non-zero D entries is exactly k."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>State the counting rule: k = number of non-zero diagonal entries of D in P·AᵀA·Pᵀ = L D Lᵀ, and what k means (dim span / rank).</div>
            <div className="review-item"><span className="review-day">Day 1</span>Answer: (a) given diag(D) = [9, 4, 0, 0, 0], how many independent vectors? (b) can 5 vectors in ℝ³ have k = 5?</div>
            <div className="review-item"><span className="review-day">Day 3</span>Redo Grizzle 7.12 reasoning: diag(D) = [15.6, 5.2, 4.4, 2.3, 0.0] ⇒ k = 4 of the 5 columns independent.</div>
            <div className="review-item"><span className="review-day">Day 7</span>Explain why a symmetric LDLᵀ (not a plain LU of A) is needed to count independent columns reliably.</div>
            <div className="review-item"><span className="review-day">Day 14</span>Explain to a friend, using only the counter widget, how "k" relates to whether the span is a line, a plane, or all of ℝ³.</div>
          </div>
        </div>
      </section>

    </div>
  )
}
