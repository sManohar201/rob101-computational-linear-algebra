import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { useOrbitScene } from '../shared/useOrbitScene.js'
import { useAnimatedParams } from '../shared/useAnimatedParams.js'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'
import {
  COL, tube, sphere, axisArrow, arrowFromTo, gridFloor, label, planeMesh, disposeObject,
} from '../shared/three-helpers.js'

const mv = (A, x) => A.map(row => row[0] * x[0] + row[1] * x[1] + row[2] * x[2])
const f2 = n => { const r = Math.round(n * 100) / 100; return (Object.is(r, -0) ? 0 : r).toFixed(2) }

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — The solution set is a shifted null space
//  Grizzle §10.4: every solution of Ax = b is xₚ + η, η ∈ null(A). We draw
//  null(A) through the origin (purple) and the parallel solution set xₚ + null(A)
//  (teal). Slide along the null direction — Ax stays pinned at b the whole time.
// ════════════════════════════════════════════════════════════════════════════

const SOL_PRESETS = [
  {
    label: 'rank 2, nullity 1 → solution is a LINE',
    A: [[1, 0, 1], [0, 1, 1], [0, 0, 0]], b: [1, 2, 0],
    xp: [1, 2, 0], nul: [[-1, -1, 1]], rank: 2, nullity: 1, kind: 'line',
  },
  {
    label: 'rank 1, nullity 2 → solution is a PLANE',
    A: [[1, 1, 1], [2, 2, 2], [0, 0, 0]], b: [1, 2, 0],
    xp: [1, 0, 0], nul: [[-1, 1, 0], [-1, 0, 1]], rank: 1, nullity: 2, kind: 'plane',
  },
  {
    label: 'rank 3, nullity 0 → unique POINT',
    A: [[2, 0, 0], [0, 2, 0], [0, 0, 2]], b: [2, -2, 1],
    xp: [1, -1, 0.5], nul: [], rank: 3, nullity: 0, kind: 'point',
  },
  {
    label: 'b ∉ range(A) → NO solution',
    A: [[1, 0, 1], [0, 1, 1], [0, 0, 0]], b: [1, 2, 1],
    xp: null, nul: [[-1, -1, 1]], rank: 2, nullity: 1, kind: 'none',
  },
]

function SolutionWidget() {
  const [idx, setIdx] = useState(0)
  const [params, setParams] = useState({ s: 0, t: 0 })
  const dyn = useRef([])
  const P = SOL_PRESETS[idx]
  const shown = useAnimatedParams(params)

  // current probe point on the solution set: xₚ + s·n₁ (+ t·n₂)
  let probe = null
  if (P.xp) {
    probe = [...P.xp]
    if (P.nul[0]) probe = probe.map((v, i) => v + shown.s * P.nul[0][i])
    if (P.nul[1]) probe = probe.map((v, i) => v + shown.t * P.nul[1][i])
  }
  const Aprobe = probe ? mv(P.A, probe) : null

  const { containerRef, ctxRef } = useOrbitScene(
    scene => {
      scene.add(gridFloor(6, 1))
      scene.add(axisArrow([1, 0, 0], 5, COL.x))
      scene.add(axisArrow([0, 1, 0], 5, COL.y))
      scene.add(axisArrow([0, 0, 1], 5, COL.z))
      scene.add(label('x₁', new THREE.Vector3(5.3, 0, 0), '#c92a2a'))
      scene.add(label('x₂', new THREE.Vector3(0, 5.3, 0), '#2b8a3e'))
      scene.add(label('x₃', new THREE.Vector3(0, 0, 5.3), '#1864ab'))
    },
    { target: [0, 0, 0], camStart: { theta: 0.7, phi: 1.05, r: 15 }, zoom: [8, 26] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }
    const V = a => new THREE.Vector3(a[0], a[1], a[2])

    // null(A) through the origin (purple)
    if (P.nul.length === 1) {
      const d = V(P.nul[0]).normalize().multiplyScalar(5)
      add(tube(d.clone().multiplyScalar(-1), d, COL.vertex, 0.03))
      add(label('null(A)', d.clone().multiplyScalar(0.7), '#6741d9', 0.45))
    } else if (P.nul.length === 2) {
      const n = new THREE.Vector3().crossVectors(V(P.nul[0]), V(P.nul[1]))
      add(planeMesh(n.x, n.y, n.z, 0, COL.vertex, 4.5, 0.18))
      add(label('null(A)', new THREE.Vector3(0, 0, 0).addScaledVector(V(P.nul[0]).normalize(), 3.2), '#6741d9', 0.45))
    }

    if (P.xp) {
      // the solution set xₚ + null(A) (teal), parallel to null(A)
      const o = V(P.xp)
      if (P.nul.length === 1) {
        const d = V(P.nul[0]).normalize().multiplyScalar(5)
        add(tube(o.clone().add(d.clone().multiplyScalar(-1)), o.clone().add(d), COL.point, 0.035))
      } else if (P.nul.length === 2) {
        const n = new THREE.Vector3().crossVectors(V(P.nul[0]), V(P.nul[1]))
        add(planeMesh(n.x, n.y, n.z, n.dot(o), COL.point, 4.5, 0.22))
      }
      // particular solution xₚ
      add(arrowFromTo(new THREE.Vector3(0, 0, 0), o, 0xb5740a, 0.035))
      add(sphere(o, 0xb5740a, 0.13))
      add(label('xₚ', o.clone().add(new THREE.Vector3(0.2, 0.25, 0)), '#9c6608', 0.42))
      // live probe point
      if (probe) {
        add(sphere(V(probe), COL.point, 0.17))
        add(label('x', V(probe).add(new THREE.Vector3(0.25, -0.2, 0.25)), '#0c8599', 0.45))
      }
    }
  }, [idx, shown.s, shown.t]) // eslint-disable-line react-hooks/exhaustive-deps

  const badge = P.kind === 'none'
    ? { cls: 'badge-none', txt: 'b ∉ range(A) — no solution set to draw' }
    : P.kind === 'point'
      ? { cls: 'badge-unique', txt: '✓ nullity 0 → exactly one solution (a point)' }
      : { cls: 'badge-infinite', txt: `✓ Ax = b on the whole ${P.kind} · A·x stays = b as you slide` }

  return (
    <div className="widget">
      <p className="widget-caption">
        If <InlineMath>{'x_p'}</InlineMath> is one solution of <InlineMath>{'\\;Ax = b'}</InlineMath>, then
        <strong> every</strong> solution is <InlineMath>{'\\;x_p + \\eta'}</InlineMath> with
        <InlineMath>{'\\;\\eta\\in\\text{null}(A)'}</InlineMath>. So the solution set is the null space (purple, through the
        origin) <strong>slid over</strong> to pass through <InlineMath>{'x_p'}</InlineMath> (teal). Slide along it: the
        point moves, but <InlineMath>{'\\;Ax'}</InlineMath> never leaves <InlineMath>{'b'}</InlineMath>.
      </p>
      <p className="widget-instructions">drag to orbit · slide along null directions · watch A·x stay pinned at b</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq">rank = {P.rank} · nullity = {P.nullity}</div>
              <div className="hud-eq" style={{ color: '#ffb066' }}>rank + nullity = {P.rank + P.nullity} = m (cols)</div>
              {Aprobe
                ? <div className="hud-note">A·x = ({f2(Aprobe[0])}, {f2(Aprobe[1])}, {f2(Aprobe[2])}) · b = ({P.b.join(', ')})</div>
                : <div className="hud-note">contradiction: a zero row of A meets a non-zero entry of b</div>}
            </div>
            <div className={`hud-badge ${badge.cls}`}>{badge.txt}</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {SOL_PRESETS.map((p, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`}
              onClick={() => { setIdx(i); setParams({ s: 0, t: 0 }) }}>{p.label}</button>
          ))}
        </div>
        {P.xp && P.nul.length >= 1 && (
          <div className="controls-grid">
            <div className="controls-col">
              <SliderRow label="η along n₁" k="s" value={params.s} min={-2} max={2} step={0.1}
                onChange={(k, v) => setParams(p => ({ ...p, s: v }))} />
              {P.nul.length === 2 && (
                <SliderRow label="η along n₂" k="t" value={params.t} min={-2} max={2} step={0.1}
                  onChange={(k, v) => setParams(p => ({ ...p, t: v }))} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — The rank–nullity ledger
//  Grizzle §10.5: rank(A) + nullity(A) = m for ANY n×m matrix. A DOM table over
//  several shapes (incl. non-square) makes the bookkeeping click.
// ════════════════════════════════════════════════════════════════════════════

const LEDGER = [
  { label: '3×3 invertible', n: 3, m: 3, rank: 3 },
  { label: '3×3 rank-2', n: 3, m: 3, rank: 2 },
  { label: '3×3 rank-1', n: 3, m: 3, rank: 1 },
  { label: '2×4 wide (full row rank)', n: 2, m: 4, rank: 2 },
  { label: '5×2 tall (full col rank)', n: 5, m: 2, rank: 2 },
  { label: '7×5 (Grizzle Ex.)', n: 7, m: 5, rank: 4 },
]

function LedgerWidget() {
  return (
    <div className="widget">
      <p className="widget-caption">
        The <strong>rank–nullity theorem</strong> says the columns of any
        <InlineMath>{'\\;n\\times m'}</InlineMath> matrix split cleanly into "useful" directions (rank, the dimension of
        the range) and "wasted" ones (nullity, the dimension of the null space), and the two <em>always</em> add up to the
        number of columns <InlineMath>{'\\;m'}</InlineMath>. Notice it depends on
        <InlineMath>{'\\;m'}</InlineMath> (columns), not <InlineMath>{'\\;n'}</InlineMath> (rows).
      </p>
      <div className="widget-card">
        <div style={{ padding: '16px 20px', background: '#0f1729', borderRadius: 10, color: '#dbe4f3', fontFamily: 'monospace', fontSize: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr repeat(4, 1fr)', gap: '6px 14px', alignItems: 'center' }}>
            {['matrix', 'cols m', 'rank', 'nullity', 'rank + nullity'].map(h => (
              <span key={h} style={{ color: '#9aa7bd', borderBottom: '1px solid #2a3550', paddingBottom: 4 }}>{h}</span>
            ))}
            {LEDGER.map(r => {
              const nullity = r.m - r.rank
              return [
                <span key={`l${r.label}`}>{r.label}</span>,
                <span key={`m${r.label}`}>{r.m}</span>,
                <span key={`r${r.label}`} style={{ color: '#69db7c' }}>{r.rank}</span>,
                <span key={`nu${r.label}`} style={{ color: '#b197fc' }}>{nullity}</span>,
                <span key={`s${r.label}`} style={{ color: '#ffb066' }}>{r.rank} + {nullity} = {r.m} ✓</span>,
              ]
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L15() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#e9f0ff', color: '#2563eb', borderColor: '#c9dbf6' }}>
          Module 2 · Lecture 15 · Grizzle Ch. 10 §10.4–10.6
        </div>
        <h1 className="lesson-title">Range, Null Space, Rank &amp; Nullity</h1>
        <p className="lesson-subtitle">
          A matrix has two signature subspaces: the <strong>range</strong> (everywhere it can send a vector) and the
          <strong> null space</strong> (everything it crushes to zero). Their dimensions — <strong>rank</strong> and
          <strong> nullity</strong> — obey one of the most useful conservation laws in mathematics:
          <InlineMath>{'\\;\\text{rank} + \\text{nullity} = m'}</InlineMath>.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Think of <InlineMath>{'A'}</InlineMath> as a machine that takes an input vector and produces an output. The
            <strong> range</strong> is the set of outputs the machine can actually produce — its reachable set. The
            <strong> null space</strong> is the set of inputs it flattens to nothing; pushing a vector in a null direction
            changes the input but not the output at all.
          </p>
          <p>
            That immediately explains <em>solutions</em>. <InlineMath>{'Ax = b'}</InlineMath> is solvable only if
            <InlineMath>{'\\;b'}</InlineMath> is in the range. And if it is, you can add any null-space vector to a
            solution and still land on <InlineMath>{'\\;b'}</InlineMath> — so the answer set is a particular solution
            <strong> plus the entire null space</strong>. The null space measures how much freedom (redundancy) the system
            has. For a robot, that freedom is the joint motions that don't move the hand.
          </p>
        </div>
      </section>

      {/* ── Formalism: subspaces ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · THE TWO SUBSPACES &amp; THE SOLUTION SET</span></h2>
        <div className="content-block">
          <div className="callout callout-info">
            <DisplayMath>{String.raw`\text{null}(A) := \{x\in\mathbb{R}^m \mid Ax = 0\}, \qquad \text{range}(A) := \{y \mid y = Ax \text{ for some }x\} = \text{col span}\{A\}.`}</DisplayMath>
          </div>
          <p>These two control everything about <InlineMath>{'Ax = b'}</InlineMath>:</p>
          <ul>
            <li><strong>Existence:</strong> a solution exists <InlineMath>{'\\iff b\\in\\text{range}(A)'}</InlineMath>.</li>
            <li><strong>Uniqueness:</strong> if one exists, it is unique <InlineMath>{'\\iff \\text{null}(A)=\\{0\\}'}</InlineMath>.</li>
            <li><strong>General solution:</strong> if <InlineMath>{'Ax_p = b'}</InlineMath>, the full set is</li>
          </ul>
          <div className="callout callout-success">
            <DisplayMath>{String.raw`\{x : Ax = b\} = x_p + \text{null}(A) = \{x_p + \eta : \eta\in\text{null}(A)\}.`}</DisplayMath>
            A single particular solution plus the entire null space — a copy of <InlineMath>{'\\text{null}(A)'}</InlineMath>
            slid over to pass through <InlineMath>{'x_p'}</InlineMath>. The first widget is this picture exactly.
          </div>
          <p>
            Computationally, <InlineMath>{'Ax = 0'}</InlineMath> says <InlineMath>{'x'}</InlineMath> is
            <strong> orthogonal to every row</strong> of <InlineMath>{'A'}</InlineMath>, so the null space is the
            orthogonal complement of the row space — and Gram–Schmidt on the rows (augmented with the identity) produces a
            basis for it.
          </p>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · THE SOLUTION SET = xₚ + null(A)</span></h2>
        <SolutionWidget />
      </section>

      {/* ── Formalism: rank-nullity ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · RANK, NULLITY &amp; THE THEOREM</span></h2>
        <div className="content-block">
          <p>
            The <strong>rank</strong> is the dimension of the range; the <strong>nullity</strong> is the dimension of the
            null space:
          </p>
          <DisplayMath>{String.raw`\text{rank}(A) := \dim(\text{range}(A)), \qquad \text{nullity}(A) := \dim(\text{null}(A)).`}</DisplayMath>
          <div className="callout callout-success">
            <strong>Rank–Nullity Theorem.</strong> For any <InlineMath>{'n\\times m'}</InlineMath> matrix
            <InlineMath>{'\\;A'}</InlineMath> (with <InlineMath>{'m'}</InlineMath> columns),
            <DisplayMath>{String.raw`\text{rank}(A) + \text{nullity}(A) = m.`}</DisplayMath>
            Each column either adds a genuinely new output direction (counts toward rank) or is redundant and buys a degree
            of freedom in the null space (counts toward nullity). There is no third option, so the two always sum to
            <InlineMath>{'\\;m'}</InlineMath>.
          </div>
          <p><strong>Proof sketch (Grizzle §10.6).</strong> Partition the columns as
            <InlineMath>{'\\;A = [A_1\\;\\,A_2]'}</InlineMath> with <InlineMath>{'A_1'}</InlineMath>'s
            <InlineMath>{'\\;\\rho = \\text{rank}(A)'}</InlineMath> columns independent and
            <InlineMath>{'\\;A_2 = A_1 B'}</InlineMath> (the rest depend on them). Then
            <InlineMath>{'\\;Ax = 0 \\iff x_1 = -Bx_2'}</InlineMath>, so <InlineMath>{'x_2\\in\\mathbb{R}^{m-\\rho}'}</InlineMath>
            is free and the canonical basis of <InlineMath>{'\\;\\mathbb{R}^{m-\\rho}'}</InlineMath> maps to a basis of the
            null space. Hence <InlineMath>{'\\;\\text{nullity}(A) = m - \\rho'}</InlineMath>. ∎</p>
          <p>Handy identities that follow:
            <InlineMath>{'\\;\\text{rank}(A^{\\top}A) = \\text{rank}(A^{\\top}) = \\text{rank}(A)'}</InlineMath> and
            <InlineMath>{'\\;\\text{rank}(AB) \\le \\text{rank}(A)'}</InlineMath>.</p>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · THE RANK–NULLITY LEDGER</span></h2>
        <LedgerWidget />
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · A RANK-2 SYSTEM IN ℝ³</span></h2>
        <div className="content-block">
          <p>
            Let <InlineMath>{String.raw`A = \begin{bmatrix}1&0&1\\0&1&1\\0&0&0\end{bmatrix}`}</InlineMath>,
            <InlineMath>{String.raw`\;b = \begin{bmatrix}1\\2\\0\end{bmatrix}`}</InlineMath> (the first preset). Columns 1
            and 2 are independent and column 3 = column 1 + column 2, so <InlineMath>{'\\;\\text{rank}(A) = 2'}</InlineMath>
            and, with <InlineMath>{'m = 3'}</InlineMath> columns, <InlineMath>{'\\;\\text{nullity}(A) = 1'}</InlineMath>.
          </p>
          <p>Solving <InlineMath>{'\\;Ax = 0'}</InlineMath>: <InlineMath>{'\\;x_1 + x_3 = 0'}</InlineMath> and
            <InlineMath>{'\\;x_2 + x_3 = 0'}</InlineMath> give the null-space direction
            <InlineMath>{'\\;\\eta = t(-1,-1,1)'}</InlineMath>. A particular solution is
            <InlineMath>{'\\;x_p = (1,2,0)'}</InlineMath>. So the complete solution set is the line</p>
          <DisplayMath>{String.raw`x = (1,2,0) + t\,(-1,-1,1), \qquad t\in\mathbb{R}.`}</DisplayMath>
          <p>Check: <InlineMath>{'\\;A\\big((1,2,0)+t(-1,-1,1)\\big) = (1,2,0) + t\\,A(-1,-1,1) = (1,2,0)'}</InlineMath>
            for every <InlineMath>{'t'}</InlineMath> — which is exactly why the probe point in the widget never leaves
            <InlineMath>{'\\;b'}</InlineMath> as you slide.</p>
        </div>
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span></h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🦾</div>
              <h3>Degrees of freedom</h3>
              <p>The nullity of a constraint matrix is the number of independent motions a mechanism can still make — its
                true degrees of freedom. A redundant arm has a non-trivial null space of "self-motions".</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🎯</div>
              <h3>Reachable workspace</h3>
              <p>range(J) of a robot Jacobian is the set of end-effector velocities you can command. If it isn't all of
                ℝ³, the robot is in a singular configuration.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">📡</div>
              <h3>Sensor redundancy</h3>
              <p>rank of a sensing matrix tells you how many independent quantities you can actually observe; the nullity
                flags unobservable states.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧮</div>
              <h3>Least squares ↔ rank</h3>
              <p>AᵀAx = Aᵀb has a unique solution iff A has full column rank — rank(AᵀA) = rank(A) is exactly the identity
                that guarantees it.</p>
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
            question="What is the null space of A?"
            options={[
              'The set of all outputs y = Ax',
              'The set of inputs x with Ax = 0',
              'The columns of A',
              'The inverse image of every b',
            ]}
            correct={1}
            explanation="null(A) = {x : Ax = 0} — the inputs the matrix crushes to zero. The range (column span) is the set of outputs."
          />
          <QuizQ
            num={2} type="Computational"
            question="A 3×7 matrix has rank 3. What is its nullity?"
            options={['0', '3', '4', '7']}
            correct={2}
            explanation="Rank–nullity uses the number of COLUMNS m = 7: nullity = m − rank = 7 − 3 = 4. (Not the rows.)"
          />
          <QuizQ
            num={3} type="Geometric"
            question="If Axₚ = b and null(A) is a line, the full solution set is:"
            options={[
              'Just the point xₚ',
              'A plane through the origin',
              'A line through xₚ parallel to null(A)',
              'Empty',
            ]}
            correct={2}
            explanation="The solution set is xₚ + null(A): the null-space line slid over to pass through xₚ. Slide along it and Ax stays equal to b."
          />
          <QuizQ
            num={4} type="Transfer"
            question="Ax = b has a UNIQUE solution exactly when:"
            options={[
              'b = 0',
              'A is square',
              'b ∈ range(A) AND null(A) = {0}',
              'rank(A) = 0',
            ]}
            correct={2}
            explanation="Existence needs b ∈ range(A); uniqueness needs a trivial null space (nullity 0), so no free direction can be added. Both together give exactly one solution."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>State the definitions of range, null space, rank, nullity, and the theorem rank + nullity = m.</div>
            <div className="review-item"><span className="review-day">Day 1</span>Answer: (a) When is Ax = b solvable? (b) When is the solution unique?</div>
            <div className="review-item"><span className="review-day">Day 3</span>Redo the worked example: find rank, nullity, and the full solution line of the rank-2 system.</div>
            <div className="review-item"><span className="review-day">Day 7</span>Explain why the solution set is xₚ + null(A) using A(xₚ + η) = b.</div>
            <div className="review-item"><span className="review-day">Day 14</span>Explain rank vs nullity to a friend with the "useful vs wasted column" picture in under 2 minutes.</div>
          </div>
        </div>
      </section>

    </div>
  )
}
