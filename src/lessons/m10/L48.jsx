import { useState, useMemo } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  CONTRACTION MAPPING WIDGET
//  Shows iteration x_{n+1} = f(x_n) converging to fixed point.
//  Cobweb diagram in SVG.
// ════════════════════════════════════════════════════════════════════════════

const CONTRACTIONS = [
  {
    label: 'x/2 + 0.3',
    fn: x => x / 2 + 0.3,
    fixedPt: 0.6,    // x = x/2 + 0.3 → x/2 = 0.3 → x = 0.6
    L: 0.5,
    domain: [0, 1],
    desc: 'f(x) = x/2 + 0.3, L=0.5. Fixed point: 0.6',
  },
  {
    label: '0.8·cos(x)',
    fn: x => 0.8 * Math.cos(x),
    fixedPt: 0.6947, // numerical
    L: 0.8,
    domain: [0, 1.4],
    desc: 'f(x) = 0.8·cos(x), L≈0.8. Fixed point ≈ 0.695',
  },
  {
    label: '(x+2/x)/2 (√2)',
    fn: x => (x + 2 / x) / 2,
    fixedPt: Math.SQRT2,
    L: null,
    domain: [1, 3],
    desc: 'Newton: f(x) = (x+2/x)/2, fixed point = √2',
    note: 'Quadratic convergence — not constant L!',
  },
]

function ContractionWidget() {
  const [cIdx, setCIdx] = useState(0)
  const [x0, setX0] = useState(0.1)
  const [steps, setSteps] = useState(8)

  const { fn, fixedPt, domain, desc, note, L } = CONTRACTIONS[cIdx]
  const [xMin, xMax] = domain

  // Cobweb iteration
  const iterates = useMemo(() => {
    const pts = [x0]
    let x = x0
    for (let i = 0; i < 20; i++) {
      x = fn(x)
      if (!isFinite(x) || x < xMin - 0.5 || x > xMax + 0.5) break
      pts.push(x)
    }
    return pts
  }, [cIdx, x0, fn, xMin, xMax])

  const W = 280, H = 260
  const pad = { left: 28, right: 10, top: 12, bottom: 20 }
  const iW = W - pad.left - pad.right
  const iH = H - pad.top - pad.bottom

  const px = v => pad.left + ((v - xMin) / (xMax - xMin)) * iW
  const py = v => {
    const clamped = Math.max(xMin, Math.min(xMax, v))
    return pad.top + iH - ((clamped - xMin) / (xMax - xMin)) * iH
  }

  // f curve
  const fPts = Array.from({ length: 100 }, (_, i) => {
    const x = xMin + (i / 99) * (xMax - xMin)
    return `${px(x).toFixed(1)},${py(fn(x)).toFixed(1)}`
  }).join(' ')

  // Diagonal y=x
  const diagPts = `${px(xMin)},${py(xMin)} ${px(xMax)},${py(xMax)}`

  // Cobweb segments: (x_n, x_n) → (x_n, f(x_n)) → (f(x_n), f(x_n)) → …
  const cobweb = []
  const shown = iterates.slice(0, steps + 1)
  for (let i = 0; i < shown.length - 1; i++) {
    const xn = shown[i]
    const xn1 = shown[i + 1]
    cobweb.push(`${px(xn).toFixed(1)},${py(xn).toFixed(1)}`)
    cobweb.push(`${px(xn).toFixed(1)},${py(xn1).toFixed(1)}`)
    cobweb.push(`${px(xn1).toFixed(1)},${py(xn1).toFixed(1)}`)
  }

  const finalErr = Math.abs(iterates[iterates.length - 1] - fixedPt)

  return (
    <div className="widget">
      <p className="widget-caption">
        Cobweb diagram: bounce vertically to <InlineMath>{'f(x_n)'}</InlineMath>, then
        horizontally to the diagonal <InlineMath>{'y=x'}</InlineMath>. Each bounce is one
        iteration <InlineMath>{'x_{n+1} = f(x_n)'}</InlineMath>. The fixed point is where
        <InlineMath>{'f(x^*) = x^*'}</InlineMath>.
      </p>
      <div className="widget-card">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <svg width={W} height={H} style={{ background: '#f4f8fd', borderRadius: '8px', flexShrink: 0 }}>
            {/* Diagonal y=x */}
            <polyline points={diagPts} fill="none" stroke="#aab7b8" strokeWidth="1" strokeDasharray="4 3" />
            {/* f(x) curve */}
            <polyline points={fPts} fill="none" stroke="#16a085" strokeWidth="2" strokeLinejoin="round" />
            {/* Cobweb */}
            <polyline points={cobweb.join(' ')} fill="none" stroke="#c92a2a" strokeWidth="1.5"
              strokeLinejoin="round" />
            {/* Fixed point */}
            <circle cx={px(fixedPt)} cy={py(fixedPt)} r="5" fill="#7950f2" stroke="white" strokeWidth="1.5" />
            {/* x0 */}
            <circle cx={px(x0)} cy={py(x0)} r="4" fill="#e8590c" />
            {/* Axes */}
            <line x1={pad.left} y1={H-pad.bottom} x2={W-pad.right} y2={H-pad.bottom} stroke="#8899bb" strokeWidth="0.7" />
            <line x1={pad.left} y1={pad.top} x2={pad.left} y2={H-pad.bottom} stroke="#8899bb" strokeWidth="0.7" />
            <text x={px(fixedPt)+6} y={py(fixedPt)-4} fontSize="9" fill="#7950f2">x*</text>
          </svg>

          <div style={{ flex: 1, minWidth: '130px' }}>
            <label className="slider-row">
              <span className="slider-label">x₀ = <b>{x0.toFixed(2)}</b></span>
              <input type="range" min={xMin + 0.01} max={xMax - 0.01} step={(xMax-xMin)/200}
                value={x0} onChange={e => setX0(Number(e.target.value))} />
            </label>
            <label className="slider-row">
              <span className="slider-label">Steps = <b>{steps}</b></span>
              <input type="range" min={1} max={15} step={1} value={steps}
                onChange={e => setSteps(Number(e.target.value))} />
            </label>
            <div className="hud-panel" style={{ marginTop: '8px' }}>
              <div className="hud-row"><span>Fixed pt x*</span><strong>{fixedPt.toFixed(5)}</strong></div>
              <div className="hud-row"><span>Iterate {steps}</span>
                <strong>{iterates[Math.min(steps, iterates.length-1)].toFixed(6)}</strong>
              </div>
              <div className="hud-row"><span>Error</span>
                <strong style={{ color: finalErr < 1e-4 ? '#16a085' : '#c92a2a' }}>
                  {finalErr.toFixed(2e-10 > finalErr ? 12 : 6)}
                </strong>
              </div>
              {L && <div className="hud-row"><span>Lip. const. L</span><strong>{L}</strong></div>}
            </div>
            <div style={{ fontSize: '11px', color: '#5c6b85', marginTop: '8px' }}>{desc}</div>
            {note && <div style={{ fontSize: '10px', color: '#7950f2', marginTop: '4px' }}>{note}</div>}
          </div>
        </div>
        <div className="preset-bar" style={{ marginTop: '10px' }}>
          {CONTRACTIONS.map((c, i) => (
            <button key={i}
              className={`preset-btn ${cIdx === i ? 'active' : ''}`}
              onClick={() => { setCIdx(i); setX0(CONTRACTIONS[i].domain[0] + 0.1); setSteps(8) }}>
              {c.label}
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
export default function L48() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#e8f8f5', color: '#0e6655', borderColor: '#a2d9ce' }}>
          Module 10 · Lecture 48 · ROB 201
        </div>
        <h1 className="lesson-title">Continuity &amp; Contraction Mappings</h1>
        <p className="lesson-subtitle">
          A contraction mapping brings points closer together. Banach's fixed-point theorem says
          that any contraction on a complete metric space has a unique fixed point, reachable by
          simple iteration from any starting point. This is the foundation of Newton's method,
          value iteration, and many iterative numerical algorithms.
        </p>
      </div>

      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Imagine repeatedly folding a rubber band in half and placing the fold at the center.
            No matter where you start, each fold brings your position closer to the center.
            Eventually you are indistinguishable from the center — you have reached the fixed point.
          </p>
          <p>
            A <em>contraction</em> is any map <InlineMath>{'f'}</InlineMath> that shrinks distances
            by a constant factor <InlineMath>{'L < 1'}</InlineMath>:
            <InlineMath>{'\\;d(f(x),f(y)) \\leq L \\cdot d(x,y)'}</InlineMath>. Every application of
            <InlineMath>{'f'}</InlineMath> reduces the distance to the fixed point by at least
            <InlineMath>{'(1-L)'}</InlineMath>. After <InlineMath>{'n'}</InlineMath> iterations
            the error is at most <InlineMath>{'L^n \\cdot d(x_0, x^*)'}</InlineMath> — geometric
            convergence.
          </p>
          <p>
            The key requirement: the space must be <em>complete</em> (Lecture 46). Without
            completeness, the iterates can be Cauchy but converge to a "hole" — a point not in
            the space. Completeness plus contraction guarantees convergence in the space itself.
          </p>
        </div>
      </section>

      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · BANACH FIXED-POINT THEOREM</span>
        </h2>
        <div className="content-block">
          <p>
            <strong>Contraction mapping.</strong> Let <InlineMath>{'(X,d)'}</InlineMath> be a
            metric space. <InlineMath>{'f: X \\to X'}</InlineMath> is a contraction if there
            exists <InlineMath>{'L \\in [0,1)'}</InlineMath> such that
          </p>
          <DisplayMath>{String.raw`d(f(x), f(y)) \leq L\,d(x,y) \quad \forall x,y \in X.`}</DisplayMath>
          <p>
            <strong>Banach Fixed-Point Theorem.</strong> If <InlineMath>{'(X,d)'}</InlineMath>
            is a <em>complete</em> metric space and <InlineMath>{'f'}</InlineMath> is a contraction
            with Lipschitz constant <InlineMath>{'L < 1'}</InlineMath>, then:
          </p>
          <ol style={{ lineHeight: 1.8, paddingLeft: '1.5rem' }}>
            <li><strong>Existence:</strong> <InlineMath>{'f'}</InlineMath> has a fixed point
              <InlineMath>{'\\;x^* \\in X'}</InlineMath> (i.e., <InlineMath>{'f(x^*) = x^*'}</InlineMath>).
            </li>
            <li><strong>Uniqueness:</strong> <InlineMath>{'x^*'}</InlineMath> is unique.</li>
            <li><strong>Convergence:</strong> For any <InlineMath>{'x_0 \\in X'}</InlineMath>,
              the sequence <InlineMath>{'x_{n+1} = f(x_n)'}</InlineMath> converges to
              <InlineMath>{'x^*'}</InlineMath>.</li>
          </ol>
          <DisplayMath>{String.raw`d(x_n, x^*) \leq \frac{L^n}{1-L}\,d(x_1,x_0).`}</DisplayMath>
          <div className="callout callout-success">
            <strong>Proof of uniqueness.</strong> If <InlineMath>{'f(x^*)=x^*'}</InlineMath> and
            <InlineMath>{'f(y^*)=y^*'}</InlineMath>, then
            <InlineMath>{'d(x^*,y^*) = d(f(x^*),f(y^*)) \\leq L\\,d(x^*,y^*)'}</InlineMath>.
            Since <InlineMath>{'L < 1'}</InlineMath>, this forces
            <InlineMath>{'d(x^*,y^*) = 0'}</InlineMath>, so <InlineMath>{'x^* = y^*'}</InlineMath>. ∎
          </div>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · CONTRACTION COBWEB TO FIXED POINT</span>
        </h2>
        <ContractionWidget />
      </section>

      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · NEWTON'S METHOD AS CONTRACTION</span>
        </h2>
        <div className="content-block">
          <p>
            Newton's method for solving <InlineMath>{'g(x) = 0'}</InlineMath>:
            <InlineMath>{'x_{n+1} = x_n - g(x_n)/g^{\\prime}(x_n)'}</InlineMath>. To find
            <InlineMath>{'\\sqrt{2}'}</InlineMath>, set <InlineMath>{'g(x) = x^2 - 2'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`x_{n+1} = x_n - \frac{x_n^2-2}{2x_n} = \frac{x_n+2/x_n}{2}.`}</DisplayMath>
          <p>
            Near the fixed point <InlineMath>{'x^* = \\sqrt{2}'}</InlineMath>, the iteration is a
            contraction with effectively quadratic convergence (error squares each step). Starting
            at <InlineMath>{'x_0 = 1'}</InlineMath>:
          </p>
          <pre className="code-block"><code>{`x₀ = 1.0
x₁ = 1.5            error ≈ 0.086
x₂ = 1.41667        error ≈ 0.00252
x₃ = 1.41422        error ≈ 0.0000212`}</code></pre>
          <p>
            Each iteration roughly squares the error — much faster than the geometric
            <InlineMath>{'L^n'}</InlineMath> rate of a linear contraction.
          </p>
        </div>
      </section>

      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            Module 11 shifts from analysis to probability. Lecture 49 introduces probability
            spaces, random vectors, and Gaussian distributions — the mathematical language for
            uncertain sensor measurements and the Kalman filter.
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
              <div className="app-icon">🔄</div>
              <h3>Value Iteration (Reinforcement Learning)</h3>
              <p>
                The Bellman operator for discounted infinite-horizon RL is a contraction with
                Lipschitz constant <InlineMath>{'L = \\gamma'}</InlineMath> (the discount factor).
                Banach guarantees the value function is the unique fixed point, reachable by
                iterating the Bellman backup from any initialization.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🤖</div>
              <h3>Inverse Kinematics via Jacobian</h3>
              <p>
                Damped-least-squares IK iterates
                <InlineMath>{'\\mathbf{q}_{n+1} = \\mathbf{q}_n + J^+(\\mathbf{x}_d - f(\\mathbf{q}_n))'}</InlineMath>.
                Near the solution, the iteration is a contraction; Banach's theorem guarantees
                convergence if the step size respects the Lipschitz constant of the Jacobian.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📐</div>
              <h3>Newton-Raphson in Control</h3>
              <p>
                Algebraic Riccati equation solvers use Newton iterations that are contractions near
                the solution. Quadratic convergence (error squares per iteration) means only
                ~10 iterations are needed even for high-dimensional systems.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🌐</div>
              <h3>Iterative Point Cloud Registration (ICP)</h3>
              <p>
                Iterative Closest Point alternates between correspondence assignment and
                transformation estimation. Each step reduces the sum-of-squared distances — under
                mild conditions, the algorithm is a contraction, and Banach guarantees convergence
                to a local minimum.
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
            question="What are the three conclusions of Banach's Fixed-Point Theorem?"
            options={[
              'The fixed point exists, is unique, and is reachable by iteration from any starting point',
              'The fixed point exists and the sequence is monotone decreasing',
              'There are exactly two fixed points for any contraction',
              'The contraction must be differentiable at the fixed point',
            ]}
            correct={0}
            explanation="Banach's theorem states: (1) Existence — f has at least one fixed point x*. (2) Uniqueness — x* is the only fixed point. (3) Convergence — for any x₀, the sequence xₙ₊₁ = f(xₙ) converges to x*. Additionally, the error bound d(xₙ,x*) ≤ Lⁿ/(1−L)·d(x₁,x₀) gives a rate."
          />
          <QuizQ
            num={2} type="Concept"
            question="Why does Banach's theorem require the space to be complete (not just any metric space)?"
            options={[
              'Incomplete spaces do not have contraction mappings',
              'In an incomplete space, the iterates xₙ form a Cauchy sequence but the limit may not exist in the space',
              'Contraction constants L < 1 only make sense in complete spaces',
              'Uniqueness of fixed points requires completeness',
            ]}
            correct={1}
            explanation="The proof of Banach's theorem shows the iterates form a Cauchy sequence (geometric convergence). In a complete space, every Cauchy sequence converges — guaranteeing the limit x* exists in the space. In an incomplete space (like ℚ), the Cauchy sequence might want to converge to an irrational number that is not in the space, so the fixed point would 'fall through a hole.'"
          />
          <QuizQ
            num={3} type="Computation"
            question="f(x) = x/3 + 1 on ℝ. What is the fixed point x*?"
            options={[
              'x* = 1',
              'x* = 3/2',
              'x* = 1/3',
              'x* = 2',
            ]}
            correct={1}
            explanation="Fixed point: f(x*) = x* → x*/3 + 1 = x* → 1 = x* − x*/3 = 2x*/3 → x* = 3/2. Lipschitz constant: |f(x)−f(y)| = |x−y|/3 → L = 1/3 < 1. Contraction ✓. Starting from x₀ = 0: x₁ = 1, x₂ = 4/3, x₃ = 13/9 ≈ 1.44, converging to 1.5."
          />
          <QuizQ
            num={4} type="Transfer"
            question="The Bellman backup T[V](s) = max_a [R(s,a) + γ·V(s')] with γ = 0.9 is a contraction. What is the Lipschitz constant and what does it imply for value iteration?"
            options={[
              'L = 1.0; value iteration converges but slowly',
              'L = 0.9; value iteration converges geometrically with error reducing by 10% each sweep',
              'L = 0.9; requires exactly 1/0.1 = 10 iterations to converge',
              'L = 0.1; the error halves every iteration',
            ]}
            correct={1}
            explanation="For discounted MDPs, ‖TV−TW‖∞ ≤ γ‖V−W‖∞, so L = γ = 0.9. Each sweep of value iteration reduces the error by at most 10% (multiplied by 0.9). After n sweeps: error ≤ 0.9ⁿ · initial_error. For 1% accuracy: n ≥ log(0.01)/log(0.9) ≈ 44 sweeps. This is why discount factors close to 1 slow down value iteration."
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
              State Banach's Fixed-Point Theorem. Find the fixed point of
              <InlineMath>{'f(x) = 0.5x + 1'}</InlineMath> on <InlineMath>{'\\mathbb{R}'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              Verify that <InlineMath>{'f(x) = \\cos(x)'}</InlineMath> is a contraction on
              <InlineMath>{'[0,1]'}</InlineMath>. (Hint: <InlineMath>{'|f^{\\prime}(x)| = |\\sin(x)| \\leq \\sin(1) < 1'}</InlineMath>.)
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Apply the error bound formula: starting at <InlineMath>{'x_0 = 0'}</InlineMath> with
              <InlineMath>{'L = 0.5'}</InlineMath> and <InlineMath>{'d(x_1,x_0) = 1'}</InlineMath>,
              how many iterations guarantee error below <InlineMath>{'10^{-6}'}</InlineMath>?
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              Prove the uniqueness part of Banach's theorem from scratch. (Hint: assume two fixed
              points and use the contraction inequality.)
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Without notes: state Banach's theorem with the three conclusions. Explain why
              completeness is required. Give one robotics or ML application.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
