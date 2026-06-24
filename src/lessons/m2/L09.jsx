import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { useOrbitScene } from '../shared/useOrbitScene.js'
import { fmt, QuizQ } from '../shared/ui.jsx'
import { ataLDLT } from '../shared/linalg.js'
import {
  COL, tube, sphere, axisArrow, gridFloor, label,
  arrowFromTo, planeMesh, disposeObject,
} from '../shared/three-helpers.js'

const v3 = a => new THREE.Vector3(a[0], a[1], a[2])
const VEC_COLORS = [COL.line1, COL.line2, COL.vertex]

// Classify A x = b from the two independence counts (Grizzle §7.7–7.8).
function classifySystem(Acols, b) {
  const rA = ataLDLT(Acols).rank
  const rAb = ataLDLT([...Acols, b]).rank
  const m = Acols.length
  if (rAb > rA) return { type: 'none', rA, rAb, m }      // b adds a new direction ⇒ not in span
  if (rA < m) return { type: 'infinite', rA, rAb, m }     // columns dependent ⇒ free variable
  return { type: 'unique', rA, rAb, m }
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET — Existence + Uniqueness classifier
//  Columns of A live in ℝ³; b is the rose target. Compare the independence count
//  of A with that of [A b]: equal ⇒ b is reachable; then independent columns ⇒
//  unique, dependent columns ⇒ infinitely many. Otherwise no solution.
// ════════════════════════════════════════════════════════════════════════════

const SYS_PRESETS = [
  {
    label: 'Unique — 3 independent columns span ℝ³',
    A: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], b: [2, 3, 1],
  },
  {
    label: 'No solution — b off the span plane (Ex. 7.4)',
    A: [[3, 1, -1], [2, -2, 1]], b: [4, 4, 4],
  },
  {
    label: 'Infinitely many — dependent columns, b in span',
    A: [[3, 1, -1], [2, -2, 1], [5, -1, 0]], b: [0, -8, 5], // col₃ = col₁+col₂; b = −2col₁+3col₂
  },
]

function ExistUniqueWidget() {
  const [idx, setIdx] = useState(0)
  const preset = SYS_PRESETS[idx]
  const Acols = preset.A
  const b = preset.b
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
    { target: [0, -0.5, 0], camStart: { theta: 0.7, phi: 1.05, r: 19 }, zoom: [9, 42] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }
    const O = new THREE.Vector3(0, 0, 0)

    const { rank, perm } = ataLDLT(Acols)
    const independentSet = new Set(perm.slice(0, rank))

    // The span of A's columns (where every reachable b must live).
    if (rank === 1) {
      const d = v3(Acols[perm[0]]).normalize()
      add(tube(d.clone().multiplyScalar(-9), d.clone().multiplyScalar(9), COL.guide, 0.04))
    } else if (rank === 2) {
      const a = v3(Acols[perm[0]]), c = v3(Acols[perm[1]])
      const nrm = a.clone().cross(c)
      const pm = planeMesh(nrm.x, nrm.y, nrm.z, 0, COL.line2, 7, 0.16); if (pm) add(pm)
    } else if (rank === 3) {
      add(new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(12, 12, 12)),
        new THREE.LineBasicMaterial({ color: COL.point, transparent: true, opacity: 0.22 })
      ))
    }

    // Columns of A (independent solid, redundant dimmed).
    Acols.forEach((vv, i) => {
      const indep = independentSet.has(i)
      const color = indep ? VEC_COLORS[i % VEC_COLORS.length] : COL.guide
      add(arrowFromTo(O, v3(vv), color, indep ? 0.05 : 0.03))
    })

    // The target b in rose.
    add(arrowFromTo(O, v3(b), COL.line3, 0.05))
    add(sphere(v3(b), COL.line3, 0.24))
  }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  const cls = classifySystem(Acols, b)
  const badge = cls.type === 'unique'
    ? { cls: 'badge-unique', txt: '✓ exactly one solution' }
    : cls.type === 'none'
      ? { cls: 'badge-none', txt: '✗ no solution — b is off the span' }
      : { cls: 'badge-infinite', txt: '∞ infinitely many solutions' }
  const reachTxt = cls.rAb > cls.rA
    ? 'count grew → b is NOT a combination of the columns'
    : 'count unchanged → b IS a combination of the columns'
  const uniqTxt = cls.rAb > cls.rA
    ? '—'
    : cls.rA < cls.m
      ? `columns dependent (k = ${cls.rA} < ${cls.m}) → not unique`
      : `columns independent (k = ${cls.rA} = ${cls.m}) → unique`

  return (
    <div className="widget">
      <p className="widget-caption">
        The colored arrows are the columns of <InlineMath>{'A'}</InlineMath>; the rose arrow is
        <InlineMath>{'\\;b'}</InlineMath>. Two counts decide everything. <strong>Existence:</strong> append
        <InlineMath>{'\\;b'}</InlineMath> as an extra column and compare the independence count of
        <InlineMath>{'\\;[A\\;\\,b]'}</InlineMath> with that of <InlineMath>{'A'}</InlineMath> — if it does not grow,
        <InlineMath>{'\\;b'}</InlineMath> lies in the span and a solution exists. <strong>Uniqueness:</strong> then the
        solution is unique exactly when the columns of <InlineMath>{'A'}</InlineMath> are independent
        (<InlineMath>{'k = m'}</InlineMath>).
      </p>
      <p className="widget-instructions">drag to orbit · scroll to zoom · switch presets for the three outcomes</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq">indep. count of A : <b style={{ color: '#2f9e44' }}>{cls.rA}</b> &nbsp; (of {cls.m} columns)</div>
              <div className="hud-eq">indep. count of [A b] : <b style={{ color: cls.rAb > cls.rA ? '#c92a2a' : '#2f9e44' }}>{cls.rAb}</b></div>
              <div className="hud-note">{reachTxt}</div>
              {uniqTxt !== '—' && <div className="hud-note">{uniqTxt}</div>}
            </div>
            <div className={`hud-badge ${badge.cls}`}>{badge.txt}</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {SYS_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`}
              onClick={() => setIdx(i)}>{pr.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <div className="controls-label">This system</div>
            {Acols.map((v, i) => (
              <div key={i} className="hud-eq" style={{ fontSize: 12, color: ['#e8590c', '#1c7ed6', '#6741d9'][i % 3] }}>
                <span className="swatch" style={{ background: ['#e8590c', '#1c7ed6', '#6741d9'][i % 3] }} />
                column {i + 1} = ({fmt(v[0])}, {fmt(v[1])}, {fmt(v[2])})
              </div>
            ))}
            <div className="hud-eq" style={{ fontSize: 12, color: '#c2255c' }}>
              <span className="swatch" style={{ background: '#c2255c' }} />
              b = ({fmt(b[0])}, {fmt(b[1])}, {fmt(b[2])})
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L09() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#e9f0ff', color: '#2563eb', borderColor: '#c9dbf6' }}>
          Module 2 · Lecture 9 · Grizzle Ch. 7 §7.7–7.8
        </div>
        <h1 className="lesson-title">Existence &amp; Uniqueness — Does Ax = b Have Exactly One Solution?</h1>
        <p className="lesson-subtitle">
          We close Chapter 7 by fusing its two big ideas. <strong>Span</strong> told us when a solution
          <em> exists</em>; <strong>independence</strong> tells us when it is <em>unique</em>. Using the counting tool
          from Lecture 8, a single test decides — for a system of <em>any</em> shape — whether
          <InlineMath>{'\\;A\\mathbf{x}=b'}</InlineMath> has <strong>no solution, exactly one, or infinitely many</strong>.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Way back in Lecture 1 we saw that two lines can meet at one point, be parallel (never meet), or coincide
            (meet everywhere). Those are the only three fates of <em>any</em> linear system: <strong>one</strong>
            solution, <strong>none</strong>, or <strong>infinitely many</strong>. We never get exactly two or exactly
            seventeen. Now we can finally say <em>which</em> fate befalls a given <InlineMath>{'A\\mathbf{x}=b'}</InlineMath>
            — and do it mechanically, for systems far too big to picture.
          </p>
          <p>
            The two questions are independent of each other. <strong>Existence</strong> asks: is the target
            <InlineMath>{'\\;b'}</InlineMath> reachable by combining the columns of <InlineMath>{'A'}</InlineMath> — does
            it lie in their span? <strong>Uniqueness</strong> asks: if reachable, is there only <em>one</em> recipe to
            reach it — are the columns independent? Stack the answers and all three outcomes fall out.
          </p>
          <p>
            Both questions are answered by the same counting tool from Lecture 8. Existence is a comparison: does
            appending <InlineMath>{'\\;b'}</InlineMath> to the columns of <InlineMath>{'A'}</InlineMath> raise the
            independent-column count? Uniqueness is a check on <InlineMath>{'A'}</InlineMath> alone: is its count equal to
            its number of columns? The widget runs both counts live and prints the verdict.
          </p>
        </div>
      </section>

      {/* ── Formalism: attractive test ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · A TEST FOR LINEAR COMBINATIONS</span></h2>
        <div className="content-block">
          <p>
            Lecture 7 told us <InlineMath>{'A\\mathbf{x}=b'}</InlineMath> has a solution <strong>iff</strong>
            <InlineMath>{'\\;b'}</InlineMath> is a linear combination of the columns of <InlineMath>{'A'}</InlineMath> — but
            gave no practical way to check it. The counting tool fixes that.
          </p>
          <div className="callout callout-success">
            <strong>Attractive Test.</strong> A vector <InlineMath>{'b'}</InlineMath> is a linear combination of
            <InlineMath>{'\\;\\{v_1,\\dots,v_m\\}'}</InlineMath> <strong>if and only if</strong> the augmented set
            <InlineMath>{'\\;\\{b, v_1,\\dots,v_m\\}'}</InlineMath> has the <strong>same number of independent vectors</strong>
            as <InlineMath>{'\\{v_1,\\dots,v_m\\}'}</InlineMath>. Concretely, form
            <InlineMath>{'\\;A_e := [A\\;\\,b]'}</InlineMath> and compare the LDLᵀ counts:
            <DisplayMath>{String.raw`P\,(A^{\top}A)\,P^{\top} = L D L^{\top}, \qquad P_e\,(A_e^{\top}A_e)\,P_e^{\top} = L_e D_e L_e^{\top}.`}</DisplayMath>
            <InlineMath>{'A\\mathbf{x}=b'}</InlineMath> has a solution <strong>iff <InlineMath>{'D'}</InlineMath> and
            <InlineMath>{'\\;D_e'}</InlineMath> have the same number of non-zero diagonal entries.</strong>
          </div>
          <p>
            The logic is simple: if appending <InlineMath>{'b'}</InlineMath> adds a genuinely new independent direction,
            the count goes <em>up</em> and <InlineMath>{'b'}</InlineMath> was <em>not</em> reachable from the columns of
            <InlineMath>{'\\;A'}</InlineMath>. If the count is unchanged, <InlineMath>{'b'}</InlineMath> brought nothing
            new — it already lived in the span, so a solution exists.
          </p>
        </div>
      </section>

      {/* ── Formalism: existence + uniqueness ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · THE EXISTENCE &amp; UNIQUENESS THEOREM</span></h2>
        <div className="content-block">
          <p>
            Uniqueness comes from independence. Suppose <InlineMath>{'\\bar x'}</InlineMath> and
            <InlineMath>{'\\;\\bar{\\bar x}'}</InlineMath> both solve <InlineMath>{'A\\mathbf{x}=b'}</InlineMath>. Then their
            difference <InlineMath>{'\\;\\alpha := \\bar{\\bar x} - \\bar x'}</InlineMath> satisfies
          </p>
          <DisplayMath>{String.raw`A\alpha = A\bar{\bar x} - A\bar x = b - b = 0.`}</DisplayMath>
          <p>
            If the columns of <InlineMath>{'A'}</InlineMath> are <strong>independent</strong>, the only solution of
            <InlineMath>{'\\;A\\alpha = 0'}</InlineMath> is <InlineMath>{'\\alpha = 0'}</InlineMath>, forcing
            <InlineMath>{'\\;\\bar{\\bar x} = \\bar x'}</InlineMath> — the solution is unique. If they are
            <em> dependent</em>, there is a non-zero <InlineMath>{'\\alpha'}</InlineMath> with
            <InlineMath>{'\\;A\\alpha = 0'}</InlineMath>, and then <InlineMath>{'\\bar x + t\\alpha'}</InlineMath> is a
            solution for <em>every</em> <InlineMath>{'t'}</InlineMath> — infinitely many.
          </p>
          <div className="callout callout-success">
            <strong>Existence &amp; Uniqueness.</strong> The following are equivalent:
            <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
              <li><InlineMath>{'A\\mathbf{x}=b'}</InlineMath> has a solution, and it is <strong>unique</strong>.</li>
              <li><InlineMath>{'b'}</InlineMath> is a linear combination of the columns of <InlineMath>{'A'}</InlineMath> <em>(existence)</em>, <strong>and</strong> the columns of <InlineMath>{'A'}</InlineMath> are linearly independent <em>(uniqueness)</em>.</li>
            </ul>
          </div>
          <p>The three outcomes, in terms of the counts <InlineMath>{'k = '}</InlineMath> independent columns of <InlineMath>{'A'}</InlineMath>, <InlineMath>{'\\;k_e'}</InlineMath> of <InlineMath>{'[A\\;b]'}</InlineMath>, and <InlineMath>{'m'}</InlineMath> columns:</p>
          <div className="callout">
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li><strong>No solution</strong> — if <InlineMath>{'k_e > k'}</InlineMath> (<InlineMath>{'b'}</InlineMath> not in the span).</li>
              <li><strong>Exactly one</strong> — if <InlineMath>{'k_e = k'}</InlineMath> <em>and</em> <InlineMath>{'k = m'}</InlineMath> (reachable, columns independent).</li>
              <li><strong>Infinitely many</strong> — if <InlineMath>{'k_e = k'}</InlineMath> <em>and</em> <InlineMath>{'k < m'}</InlineMath> (reachable, columns dependent).</li>
            </ul>
          </div>
          <p>
            None of this requires <InlineMath>{'A'}</InlineMath> to be square. Thanks to the LDLᵀ count, it works for
            tall, wide, and square systems alike — and at any size a computer can factor.
          </p>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · THE THREE OUTCOMES</span></h2>
        <ExistUniqueWidget />
      </section>

      {/* ── Worked example 7.14 / 7.15 ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · GRIZZLE 7.14 &amp; 7.15</span></h2>
        <div className="content-block">
          <p>
            <strong>Existence by counting (7.14).</strong> Take the rectangular system
          </p>
          <DisplayMath>{String.raw`A = \begin{bmatrix} 3.5 & 1.0 & 5.0 \\ 5.0 & 2.0 & 6.0 \\ 6.5 & 3.0 & 7.0 \\ 8.0 & 4.0 & 8.0 \end{bmatrix}, \quad b = \begin{bmatrix} 4 \\ 4 \\ 4 \\ 4 \end{bmatrix}.`}</DisplayMath>
          <p>The two LDLᵀ counts come out as</p>
          <DisplayMath>{String.raw`\operatorname{diag}(D) = \begin{bmatrix} 174.0 & 1.8 & 0.0 \end{bmatrix}, \qquad \operatorname{diag}(D_e) = \begin{bmatrix} 174.0 & 1.8 & 0.0 & 0.0 \end{bmatrix}.`}</DisplayMath>
          <p>
            Both have <strong>two</strong> non-zero entries, so <InlineMath>{'k_e = k = 2'}</InlineMath>:
            <InlineMath>{'\\;b'}</InlineMath> is a linear combination of the columns and the system <em>has</em> a
            solution (e.g. <InlineMath>{'x = (0,-1,1)^{\\top}'}</InlineMath>). But <InlineMath>{'k = 2 < 3 = m'}</InlineMath>,
            so the columns are dependent — the solution is <strong>not unique</strong>. Swap to
            <InlineMath>{'\\;b = (20,11,12,14)^{\\top}'}</InlineMath> and the counts become
            <InlineMath>{'\\;[174,28.3,0.5,0.0]'}</InlineMath> for <InlineMath>{'D_e'}</InlineMath> — <strong>three</strong>
            non-zeros versus two, so <InlineMath>{'k_e > k'}</InlineMath> and there is <strong>no solution</strong> at all.
          </p>
          <p>
            <strong>The full verdict (7.15).</strong> For a <InlineMath>{'7\\times5'}</InlineMath> system with
            <InlineMath>{'\\;\\operatorname{diag}(D) = [15.6, 5.2, 4.4, 2.3, 0.0]'}</InlineMath> we read
            <InlineMath>{'\\;k = 4 < 5 = m'}</InlineMath> (columns dependent ⇒ not unique). Appending the given
            <InlineMath>{'\\;b'}</InlineMath> leaves the count at <InlineMath>{'k_e = 4 = k'}</InlineMath>
            (<InlineMath>{'b'}</InlineMath> reachable), so the system has <strong>infinitely many</strong> solutions. A
            different right-hand side pushes <InlineMath>{'k_e'}</InlineMath> to <InlineMath>{'5'}</InlineMath> — then there
            is no solution. Every case is settled by comparing two counts.
          </p>
          <div className="callout callout-warning">
            <strong>Map it to the widget.</strong> Its three presets are exactly these cases: independent columns spanning
            <InlineMath>{'\\;\\mathbb{R}^3'}</InlineMath> with <InlineMath>{'k_e=k=m'}</InlineMath> (unique); the Ex. 7.4
            geometry with <InlineMath>{'k_e>k'}</InlineMath> (none); and dependent columns with
            <InlineMath>{'\\;k_e=k<m'}</InlineMath> (infinite).
          </div>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <p>
            We have now <em>completely</em> resolved the exact-solution question for
            <InlineMath>{'\\;A\\mathbf{x}=b'}</InlineMath>: count, compare, and read off none / one / infinitely many.
            But notice the most common real-world case is the one we labelled a failure — <strong>no solution</strong>,
            because noisy, over-determined data almost never puts <InlineMath>{'b'}</InlineMath> exactly in the span.
          </p>
          <p>
            That is precisely where the next chapter begins. When <InlineMath>{'b'}</InlineMath> is <em>not</em> a linear
            combination of the columns, we stop demanding zero error and instead find the
            <InlineMath>{'\\;\\mathbf{x}'}</InlineMath> that gets <strong>closest</strong> — the
            <strong> least-squares</strong> solution, built on the <strong>Euclidean norm</strong>. The "no solution"
            verdict is not a dead end; it is the doorway to Lecture 10.
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
              <h3>Redundant Manipulators</h3>
              <p>
                A 7-joint arm reaching a 6-DOF pose has more columns than rows: the constraint system is reachable but the
                columns are dependent, so there are <strong>infinitely many</strong> joint solutions. Robots exploit that
                freedom to dodge obstacles.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📍</div>
              <h3>Localization Consistency</h3>
              <p>
                If a new sensor reading raises the augmented count <InlineMath>{'k_e > k'}</InlineMath>, it is
                <em> inconsistent</em> with the others — there is no state explaining them all. That is the cue to switch
                from exact solving to least squares.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🔌</div>
              <h3>Circuit &amp; Network Solvability</h3>
              <p>
                Kirchhoff's laws give a big linear system. Existence-and-uniqueness counting tells you whether the
                network has a well-defined operating point or a degenerate (under-determined) one before you ever solve.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧩</div>
              <h3>Calibration Coverage</h3>
              <p>
                Calibrating parameters needs enough <em>independent</em> excitations: if your data columns have
                <InlineMath>{'\\;k < m'}</InlineMath>, some parameters are unidentifiable (infinitely many fits). The count
                tells you to collect richer data.
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
            question="Using the Attractive Test, when does Ax = b HAVE a solution?"
            options={[
              'When A is square',
              'When [A b] has the SAME number of independent columns as A (appending b did not raise the count)',
              'When det(A) = 0',
              'When b is the zero vector',
            ]}
            correct={1}
            explanation="A solution exists iff b is a linear combination of A's columns, i.e. appending b adds no new independent direction. So the independence counts of A and [A b] are equal (kₑ = k). If kₑ > k, b is outside the span and there is no solution."
          />
          <QuizQ
            num={2} type="Computational"
            question="An LDLᵀ analysis gives: A (4 columns) has k = 3 independent columns, and [A b] has kₑ = 3. What is the nature of the solution set of Ax = b?"
            options={[
              'No solution',
              'Exactly one solution',
              'Infinitely many solutions (b is reachable since kₑ = k, but columns are dependent since k = 3 < 4)',
              'Cannot be determined',
            ]}
            correct={2}
            explanation="kₑ = k = 3 means b is in the span, so a solution exists. But k = 3 < m = 4 means the columns are dependent, so the solution is not unique — there are infinitely many."
          />
          <QuizQ
            num={3} type="Geometric"
            question="Columns of A span a plane in ℝ³, and b sticks up out of that plane. Which outcome?"
            options={[
              'Exactly one solution',
              'No solution — b is not a linear combination of the columns, so kₑ > k',
              'Infinitely many solutions',
              'It depends on the length of b',
            ]}
            correct={1}
            explanation="If b is off the span (the plane), it cannot be written as a combination of the columns. Appending it raises the count (kₑ > k), so Ax = b has no exact solution. This is the widget's 'No solution (Ex. 7.4)' preset."
          />
          <QuizQ
            num={4} type="Transfer"
            question="Two solutions x̄ and x̄̄ both satisfy Ax = b. Why does linear independence of A's columns force them to be equal?"
            options={[
              'Because A is invertible only when square',
              'Their difference α = x̄̄ − x̄ satisfies Aα = 0; independence makes α = 0 the only solution, so x̄̄ = x̄',
              'Because b must be zero',
              'They need not be equal even then',
            ]}
            correct={1}
            explanation="Aα = Ax̄̄ − Ax̄ = b − b = 0. If the columns are independent, the only solution of Aα = 0 is α = 0, hence x̄̄ = x̄ (uniqueness). If they were dependent, a nonzero α gives x̄ + tα as infinitely many solutions."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>State the three outcomes of Ax = b in terms of the counts k (of A), kₑ (of [A b]), and m: none (kₑ&gt;k), unique (kₑ=k=m), infinite (kₑ=k&lt;m).</div>
            <div className="review-item"><span className="review-day">Day 1</span>Answer: (a) the Attractive Test for "is b a linear combination of A's columns?" (b) why can a linear system never have exactly two solutions?</div>
            <div className="review-item"><span className="review-day">Day 3</span>Redo Grizzle 7.14: from diag(D) = [174, 1.8, 0] and diag(Dₑ) = [174, 1.8, 0, 0], conclude a (non-unique) solution exists; then with kₑ = 3 conclude no solution.</div>
            <div className="review-item"><span className="review-day">Day 7</span>Prove uniqueness from independence: if Ax̄ = Ax̄̄ = b then Aα = 0 for α = x̄̄ − x̄, and independence ⇒ α = 0.</div>
            <div className="review-item"><span className="review-day">Day 14</span>Explain to a friend, using the widget, how appending b as a column reveals whether a solution exists.</div>
          </div>
        </div>
      </section>

    </div>
  )
}
