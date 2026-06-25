import { useState, useMemo } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  COMPACTNESS / WEIERSTRASS WIDGET
//  Shows a continuous function on a closed interval (compact) vs open interval.
//  Demonstrates that the min/max is attained on [a,b] but not on (a,b).
// ════════════════════════════════════════════════════════════════════════════

const FUNCTIONS = [
  {
    label: 'f(x) = x sin(1/x)',
    fn: x => x === 0 ? 0 : x * Math.sin(1 / x),
    domain: [0.05, 1],
    note: 'Compact [0.05,1]: min and max attained',
  },
  {
    label: 'f(x) = 1/x (open)',
    fn: x => 1 / x,
    domain: [0.1, 1],
    note: 'Compact [0.1,1]: max at x=0.1; min at x=1',
  },
  {
    label: 'f(x) = x² on [−1,1]',
    fn: x => x * x,
    domain: [-1, 1],
    note: 'Compact [−1,1]: min=0 at x=0, max=1 at x=±1',
  },
]

function CompactnessWidget() {
  const [fnIdx, setFnIdx] = useState(2)
  const [open, setOpen] = useState(false)

  const { fn, domain, label, note } = FUNCTIONS[fnIdx]
  const [xMin, xMax] = domain
  const margin = open ? 0.05 : 0   // shrink domain for open interval
  const domLo = xMin + margin
  const domHi = xMax - margin

  const W = 360, H = 200
  const pad = { left: 28, right: 10, top: 12, bottom: 18 }
  const iW = W - pad.left - pad.right
  const iH = H - pad.top - pad.bottom

  const N = 200
  const xs = Array.from({ length: N }, (_, i) => domLo + (i / (N-1)) * (domHi - domLo))
  const ys = xs.map(fn)
  const yMin = Math.min(...ys), yMax = Math.max(...ys)
  const yRange = yMax - yMin || 1

  const px = x => pad.left + ((x - domLo) / (domHi - domLo)) * iW
  const py = y => pad.top + iH - ((y - yMin) / yRange) * iH

  const line = xs.map(x => `${px(x).toFixed(1)},${py(fn(x)).toFixed(1)}`).join(' ')

  // Find min/max with attaining x
  const minIdx = ys.indexOf(Math.min(...ys))
  const maxIdx = ys.indexOf(Math.max(...ys))

  return (
    <div className="widget">
      <p className="widget-caption">
        The Weierstrass Extreme Value Theorem: a continuous function on a <em>compact</em> (closed
        and bounded) set attains its minimum and maximum. Toggle to an open interval to see what
        fails — the extremes may not be attained.
      </p>
      <div className="widget-card">
        <svg width={W} height={H} style={{ background: '#f4f8fd', borderRadius: '8px', display: 'block' }}>
          <polyline points={line} fill="none" stroke="#16a085" strokeWidth="2" strokeLinejoin="round" />
          {/* Min marker */}
          <circle cx={px(xs[minIdx])} cy={py(ys[minIdx])} r="5" fill="#1c7ed6" />
          <text x={px(xs[minIdx])+6} y={py(ys[minIdx])-4} fontSize="9" fill="#1c7ed6">
            min={ys[minIdx].toFixed(3)}
          </text>
          {/* Max marker */}
          <circle cx={px(xs[maxIdx])} cy={py(ys[maxIdx])} r="5" fill="#c92a2a" />
          <text x={px(xs[maxIdx])+6} y={py(ys[maxIdx])-4} fontSize="9" fill="#c92a2a">
            max={ys[maxIdx].toFixed(3)}
          </text>
          {/* Domain endpoints */}
          <line x1={px(domLo)} y1={pad.top} x2={px(domLo)} y2={H-pad.bottom}
            stroke={open ? '#e8590c' : '#5c6b85'} strokeWidth="1.5"
            strokeDasharray={open ? '4 3' : 'none'} />
          <line x1={px(domHi)} y1={pad.top} x2={px(domHi)} y2={H-pad.bottom}
            stroke={open ? '#e8590c' : '#5c6b85'} strokeWidth="1.5"
            strokeDasharray={open ? '4 3' : 'none'} />
          <text x={px(domLo)} y={H-pad.bottom+12} fontSize="8" fill="#5c6b85" textAnchor="middle">
            {open ? '(a' : '[a'}
          </text>
          <text x={px(domHi)} y={H-pad.bottom+12} fontSize="8" fill="#5c6b85" textAnchor="middle">
            {open ? 'b)' : 'b]'}
          </text>
        </svg>
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer', fontSize: '13px' }}>
            <input type="checkbox" checked={open} onChange={e => setOpen(e.target.checked)} />
            Open interval (shrinks by 0.05 each side)
          </label>
        </div>
        <div style={{ marginTop: '6px', fontSize: '12px', color: '#5c6b85' }}>
          {note}{open ? ' — open: near-extremes may shift' : ''}
        </div>
        <div className="preset-bar" style={{ marginTop: '8px' }}>
          {FUNCTIONS.map((f, i) => (
            <button key={i}
              className={`preset-btn ${fnIdx === i ? 'active' : ''}`}
              onClick={() => setFnIdx(i)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════
export default function L47() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#e8f8f5', color: '#0e6655', borderColor: '#a2d9ce' }}>
          Module 10 · Lecture 47 · ROB 201
        </div>
        <h1 className="lesson-title">Compactness &amp; Weierstrass Theorem</h1>
        <p className="lesson-subtitle">
          Compactness is the topological property that makes optimization possible: on a compact
          set, every continuous function attains its minimum and maximum. This is the Weierstrass
          Extreme Value Theorem — the theoretical guarantee behind every optimization algorithm
          that converges to a global optimum.
        </p>
      </div>

      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Why does the minimum of a function exist? It is not obvious. Consider
            <InlineMath>{'f(x) = x'}</InlineMath> on the open interval <InlineMath>{'(0,1)'}</InlineMath>:
            the infimum is 0, but 0 is not in the domain — the minimum is never attained. Or
            <InlineMath>{'f(x) = 1/x'}</InlineMath> on <InlineMath>{'(0,\\infty)'}</InlineMath>:
            no finite minimum.
          </p>
          <p>
            Compactness prevents these failures. In <InlineMath>{'\\mathbb{R}^n'}</InlineMath>,
            compact = closed and bounded (Heine-Borel theorem). A closed set contains all its
            limit points, so the infimum cannot "escape" to a boundary point outside the domain.
            Boundedness prevents the minimum from running off to infinity.
          </p>
          <p>
            The Weierstrass theorem is the bedrock of optimization theory. Every time a textbook
            says "the minimum exists," it is implicitly invoking compactness (or some equivalent
            condition).
          </p>
        </div>
      </section>

      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · COMPACTNESS &amp; EXTREME VALUE THEOREM</span>
        </h2>
        <div className="content-block">
          <p>
            <strong>Compact set.</strong> A set <InlineMath>{'K \\subseteq X'}</InlineMath> is
            compact if every open cover of <InlineMath>{'K'}</InlineMath> has a finite subcover.
            In <InlineMath>{'\\mathbb{R}^n'}</InlineMath> (Heine-Borel):
          </p>
          <div className="callout callout-success">
            <strong>Heine-Borel Theorem.</strong> <InlineMath>{'K \\subseteq \\mathbb{R}^n'}</InlineMath>
            is compact <InlineMath>{'\\iff'}</InlineMath> K is <em>closed</em> and <em>bounded</em>.
          </div>
          <p>
            <strong>Sequential compactness (equivalent in metric spaces).</strong>{' '}
            <InlineMath>{'K'}</InlineMath> is compact iff every sequence in <InlineMath>{'K'}</InlineMath>
            has a convergent subsequence with limit in <InlineMath>{'K'}</InlineMath>
            (Bolzano-Weierstrass).
          </p>
          <p>
            <strong>Weierstrass Extreme Value Theorem.</strong> If
            <InlineMath>{'f: K \\to \\mathbb{R}'}</InlineMath> is continuous and
            <InlineMath>{'K'}</InlineMath> is compact, then <InlineMath>{'f'}</InlineMath> attains
            its minimum and maximum on <InlineMath>{'K'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`\exists x^*, x^{**} \in K:\quad f(x^*) = \min_{x\in K} f(x),\quad f(x^{**}) = \max_{x\in K} f(x).`}</DisplayMath>
          <p>
            <strong>Proof sketch.</strong> Let <InlineMath>{'m = \\inf_{K} f'}</InlineMath>.
            Choose <InlineMath>{'x_n \\in K'}</InlineMath> with <InlineMath>{'f(x_n) \\to m'}</InlineMath>.
            By compactness, pass to a convergent subsequence <InlineMath>{'x_{n_k} \\to x^*'}</InlineMath>.
            By continuity, <InlineMath>{'f(x^*) = \\lim f(x_{n_k}) = m'}</InlineMath>. ∎
          </p>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · WEIERSTRASS ON COMPACT VS. OPEN DOMAIN</span>
        </h2>
        <CompactnessWidget />
      </section>

      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · WHY CLOSED MATTERS</span>
        </h2>
        <div className="content-block">
          <p>
            Let <InlineMath>{'f(x) = x'}</InlineMath> on <InlineMath>{'K = (0,1]'}</InlineMath>
            (half-open). <InlineMath>{'\\inf f = 0'}</InlineMath>, but there is no
            <InlineMath>{'x \\in (0,1]'}</InlineMath> with <InlineMath>{'f(x) = 0'}</InlineMath>
            — the minimum is not attained because 0 is not in <InlineMath>{'K'}</InlineMath>.
          </p>
          <p>
            Now let <InlineMath>{'K = [0,1]'}</InlineMath> (closed). <InlineMath>{'f(0) = 0'}</InlineMath>
            is attained. The only difference: closing the interval by adding the limit point 0.
            This is why Heine-Borel requires both <em>closed</em> and <em>bounded</em>.
          </p>
        </div>
      </section>

      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            Lecture 48 studies contraction mappings — functions that bring points closer together.
            Banach's fixed-point theorem guarantees that any contraction on a complete metric space
            has a unique fixed point, reachable by simple iteration. This is the foundation of
            Newton's method, value iteration in RL, and many iterative numerical algorithms.
          </div>
        </div>
      </section>

      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span>
        </h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🎯</div>
              <h3>Global Optimization Guarantees</h3>
              <p>
                Trajectory optimization over a compact set of control inputs guarantees a minimum-cost
                trajectory exists (Weierstrass). Without compactness, the optimal trajectory might
                be a limit of trajectories but itself not realizable.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🤖</div>
              <h3>Joint Limit Constraints</h3>
              <p>
                Robot joint limits define a compact constraint set
                <InlineMath>{'\\mathbf{q} \\in [q_{\\min}, q_{\\max}]^n'}</InlineMath>.
                Inverse kinematics over this set is guaranteed to have a minimum-error solution
                (even if that solution is not exact).
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📊</div>
              <h3>Neural Network Expressivity</h3>
              <p>
                The universal approximation theorem's compactness version: a neural network can
                approximate any continuous function on a <em>compact</em> domain to arbitrary
                precision. Without compactness (open or unbounded domain), convergence is not
                guaranteed.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🔋</div>
              <h3>Optimal Battery Dispatch</h3>
              <p>
                Energy storage dispatch over a finite time horizon with bounded charge/discharge
                rates lives in a compact feasible set. The existence of an optimal dispatch policy
                follows from Weierstrass applied to a continuous cost function.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag quiz-tag">QUIZ</span></h2>
        <div className="content-block">
          <QuizQ
            num={1} type="Concept"
            question="By Heine-Borel, which of these subsets of ℝ² is compact?"
            options={[
              '(0,1) × (0,1)  (open square)',
              '[0,1] × [0,1]  (closed square)',
              'ℝ² (the entire plane)',
              '{(x,y) : x² + y² > 1}  (exterior of unit disk)',
            ]}
            correct={1}
            explanation="By Heine-Borel, K ⊆ ℝⁿ is compact iff K is closed AND bounded. [0,1]×[0,1] is closed (contains all limit points) and bounded (diameter √2). The open square is not closed (boundary points missing); ℝ² is not bounded; the exterior is not bounded."
          />
          <QuizQ
            num={2} type="Concept"
            question="Does the function f(x) = 1/x attain its minimum on (0,1)?  Why or why not?"
            options={[
              'Yes, the minimum is 1 at x = 1',
              'No — f(x) → ∞ as x → 0⁺, so f is unbounded above; and the infimum over (0,1) is 1 (at x=1), which IS attained',
              'No — (0,1) is not compact (not closed); the infimum near 0 is ∞ (attained at no point)',
              'Yes, the minimum is 0',
            ]}
            correct={1}
            explanation="On (0,1): as x → 0⁺, 1/x → +∞, so f is unbounded above. The infimum of f on (0,1) is lim_{x→1⁻} 1/x = 1, and f(x) approaches 1 as x→1 but x=1 is not in (0,1). So the infimum is 1, not attained. On [0,1], x=1 is included: f(1) = 1 is the minimum. Compactness (closed interval) fixes it."
          />
          <QuizQ
            num={3} type="Concept"
            question="The proof of Weierstrass uses compactness in which step?"
            options={[
              'To show f is differentiable at its minimum',
              'To extract a convergent subsequence from a minimizing sequence',
              'To guarantee the infimum is finite',
              'To show the gradient equals zero at the minimum',
            ]}
            correct={1}
            explanation="The proof: let xₙ be a minimizing sequence (f(xₙ) → inf f). Sequential compactness guarantees a subsequence xₙₖ converges to some x* in K. Continuity gives f(x*) = lim f(xₙₖ) = inf f. So the minimum IS attained at x*. Without compactness, the subsequence might not exist or x* might not be in the domain."
          />
          <QuizQ
            num={4} type="Transfer"
            question="A robot planner minimizes path length over all joint trajectories satisfying q(t) ∈ [q_min, q_max]^n and q(0) = q₀, q(T) = q_f. Does a minimum-length trajectory exist?"
            options={[
              'Only if the trajectory space is finite-dimensional',
              'No — path length minimization always produces a degenerate solution',
              'Yes — the feasible trajectory set is compact (closed, bounded joint limits) and path length is a continuous function of the trajectory',
              'Yes, but only if n = 1',
            ]}
            correct={2}
            explanation="With appropriate function space topology, the set of feasible trajectories (satisfying the joint bounds and endpoint conditions) is compact, and path length is a continuous functional. By Weierstrass, a minimum-length trajectory exists. This is why robot motion planning guarantees a solution exists in bounded joint spaces — the mathematical backbone of RRT and trajectory optimization solvers."
          />
        </div>
      </section>

      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span>
        </h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item">
              <span className="review-day">Day 0</span>
              State Heine-Borel. Verify: is the set
              <InlineMath>{'\\{(x,y): x^2+y^2 \\leq 4\\}'}</InlineMath> compact in
              <InlineMath>{'\\mathbb{R}^2'}</InlineMath>?
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              State the Weierstrass EVT. Give an example where the minimum is NOT attained and
              identify which compactness condition fails.
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Sketch the proof of Weierstrass EVT using sequential compactness (Bolzano-Weierstrass).
              What role does continuity play?
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              Show that <InlineMath>{'f(x) = \\sin(1/x)'}</InlineMath> on
              <InlineMath>{'(0,1]'}</InlineMath> is bounded but does not attain its infimum.
              Which hypothesis of Weierstrass fails?
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Without notes: define compact (two equivalent definitions). State Weierstrass EVT.
              Explain why closed AND bounded are both needed.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
