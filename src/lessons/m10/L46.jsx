import { useState, useMemo } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  CAUCHY SEQUENCE VISUALIZER
//  Shows a sequence converging (or failing to converge), with an ε-band.
// ════════════════════════════════════════════════════════════════════════════

const SEQUENCES = [
  {
    label: '1/n → 0',
    fn: n => 1 / n,
    limit: 0,
    converges: true,
    desc: 'Classic convergent: terms squeeze to 0',
  },
  {
    label: '(−1)ⁿ/n',
    fn: n => Math.pow(-1, n) / n,
    limit: 0,
    converges: true,
    desc: 'Oscillating but convergent to 0',
  },
  {
    label: 'sin(n)/√n',
    fn: n => Math.sin(n) / Math.sqrt(n),
    limit: 0,
    converges: true,
    desc: 'Oscillating amplitude decays',
  },
  {
    label: '(−1)ⁿ (diverges)',
    fn: n => Math.pow(-1, n),
    limit: null,
    converges: false,
    desc: 'Oscillates between ±1: NOT Cauchy',
  },
]

function CauchyWidget() {
  const [seqIdx, setSeqIdx] = useState(0)
  const [eps, setEps] = useState(0.2)
  const [N, setN] = useState(30)

  const { fn, limit, converges, desc } = SEQUENCES[seqIdx]
  const pts = useMemo(() => Array.from({ length: N }, (_, i) => ({ n: i + 1, y: fn(i + 1) })), [seqIdx, N])

  const W = 360, H = 200
  const margin = { left: 30, right: 10, top: 20, bottom: 20 }
  const iW = W - margin.left - margin.right
  const iH = H - margin.top - margin.bottom

  const yMin = -1.5, yMax = 1.5
  const px = n => margin.left + ((n - 1) / (N - 1)) * iW
  const py = y => margin.top + iH - ((Math.max(yMin, Math.min(yMax, y)) - yMin) / (yMax - yMin)) * iH

  // Find N* where all terms within ε of limit (if converges)
  let Nstar = null
  if (converges && limit !== null) {
    for (let i = 0; i < pts.length; i++) {
      if (pts.slice(i).every(p => Math.abs(p.y - limit) < eps)) {
        Nstar = pts[i].n
        break
      }
    }
  }

  return (
    <div className="widget">
      <p className="widget-caption">
        A sequence is Cauchy if its terms eventually cluster together within any
        <InlineMath>{'\\varepsilon'}</InlineMath>. The green band shows the
        <InlineMath>{'\\varepsilon'}</InlineMath>-neighborhood of the limit. A
        convergent sequence is always Cauchy; a divergent one is not.
      </p>
      <div className="widget-card">
        <svg width={W} height={H} style={{ background: '#f4f8fd', borderRadius: '8px', display: 'block' }}>
          {/* ε-band around limit */}
          {converges && limit !== null && (
            <rect x={margin.left} y={py(limit + eps)}
              width={iW} height={py(limit - eps) - py(limit + eps)}
              fill="rgba(22,160,133,0.12)" />
          )}
          {/* y=0 axis */}
          <line x1={margin.left} y1={py(0)} x2={W-margin.right} y2={py(0)}
            stroke="#8899bb" strokeWidth="0.7" />
          <line x1={margin.left} y1={margin.top} x2={margin.left} y2={H-margin.bottom}
            stroke="#8899bb" strokeWidth="0.7" />
          {/* Limit line */}
          {converges && limit !== null && (
            <line x1={margin.left} y1={py(limit)} x2={W-margin.right} y2={py(limit)}
              stroke="#16a085" strokeWidth="1" strokeDasharray="5 3" />
          )}
          {/* Sequence dots */}
          {pts.map((p, i) => (
            <circle key={i} cx={px(p.n)} cy={py(p.y)} r="3"
              fill={converges && limit !== null && Math.abs(p.y - limit) < eps
                ? '#16a085' : '#c92a2a'}
              opacity="0.8" />
          ))}
          {/* N* marker */}
          {Nstar !== null && (
            <line x1={px(Nstar)} y1={margin.top} x2={px(Nstar)} y2={H-margin.bottom}
              stroke="#7950f2" strokeWidth="1.5" strokeDasharray="3 3" />
          )}
          {/* Labels */}
          {[1, Math.floor(N/2), N].map(v => (
            <text key={v} x={px(v)} y={H-margin.bottom+14} fontSize="9" fill="#8899bb" textAnchor="middle">
              {v}
            </text>
          ))}
          <text x={margin.left - 4} y={py(0) + 4} fontSize="8" fill="#5c6b85" textAnchor="end">0</text>
        </svg>

        <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label className="slider-row">
              <span className="slider-label">
                <InlineMath>{'\\varepsilon'}</InlineMath> = <b>{eps.toFixed(2)}</b>
              </span>
              <input type="range" min={0.02} max={0.5} step={0.02} value={eps}
                onChange={e => setEps(Number(e.target.value))} />
            </label>
            <label className="slider-row">
              <span className="slider-label">Show N = <b>{N}</b> terms</span>
              <input type="range" min={10} max={100} step={5} value={N}
                onChange={e => setN(Number(e.target.value))} />
            </label>
          </div>
          <div className="hud-panel" style={{ minWidth: '140px' }}>
            <div className="hud-row">
              <span>Converges?</span>
              <strong style={{ color: converges ? '#16a085' : '#c92a2a' }}>
                {converges ? 'Yes' : 'No'}
              </strong>
            </div>
            <div className="hud-row">
              <span>N* (enters band)</span>
              <strong>{Nstar !== null ? Nstar : '—'}</strong>
            </div>
            <div className="hud-row">
              <span>Cauchy?</span>
              <strong style={{ color: converges ? '#16a085' : '#c92a2a' }}>
                {converges ? 'Yes' : 'No'}
              </strong>
            </div>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: '#5c6b85', marginTop: '6px' }}>{desc}</div>
        <div className="preset-bar" style={{ marginTop: '8px' }}>
          {SEQUENCES.map((s, i) => (
            <button key={i}
              className={`preset-btn ${seqIdx === i ? 'active' : ''}`}
              onClick={() => setSeqIdx(i)}>
              {s.label}
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
export default function L46() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#e8f8f5', color: '#0e6655', borderColor: '#a2d9ce' }}>
          Module 10 · Lecture 46 · ROB 201
        </div>
        <h1 className="lesson-title">Sequences &amp; Cauchy Completeness</h1>
        <p className="lesson-subtitle">
          A sequence converges if its terms approach a limit. A Cauchy sequence is one where
          the terms cluster together — even before we know what they converge to. The real numbers
          are special because every Cauchy sequence in <InlineMath>{'\\mathbb{R}'}</InlineMath>
          converges: this <em>completeness</em> property is what makes analysis work.
        </p>
      </div>

      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Suppose you run an iterative algorithm (gradient descent, Newton's method, Kalman
            filter updates). How do you know it will converge? You need two things: (1) the
            iterates get arbitrarily close together (Cauchy), and (2) the space has no "holes"
            where those clustering iterates might fall through to a missing limit point.
          </p>
          <p>
            The rationals <InlineMath>{'\\mathbb{Q}'}</InlineMath> have "holes" — Cauchy sequences
            of rationals can converge to irrational limits (like
            <InlineMath>{'\\sqrt{2}'}</InlineMath>), which are not in
            <InlineMath>{'\\mathbb{Q}'}</InlineMath>. The reals fill in all the holes:
            every Cauchy sequence of reals has a real limit. This is what
            <em> completeness</em> means.
          </p>
        </div>
      </section>

      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · SEQUENCES, CONVERGENCE &amp; COMPLETENESS</span>
        </h2>
        <div className="content-block">
          <p>
            <strong>Convergence.</strong> A sequence <InlineMath>{'(x_n)_{n=1}^\\infty'}</InlineMath>
            in a metric space <InlineMath>{'(X,d)'}</InlineMath> converges to
            <InlineMath>{'\\;L \\in X'}</InlineMath> if:
          </p>
          <DisplayMath>{String.raw`\forall\varepsilon>0,\; \exists N\in\mathbb{N}:\; n>N \implies d(x_n, L) < \varepsilon.`}</DisplayMath>
          <p>
            <strong>Cauchy sequence.</strong> <InlineMath>{'(x_n)'}</InlineMath> is Cauchy if:
          </p>
          <DisplayMath>{String.raw`\forall\varepsilon>0,\; \exists N:\; m,n>N \implies d(x_m, x_n) < \varepsilon.`}</DisplayMath>
          <p>
            Every convergent sequence is Cauchy. In a <em>complete</em> metric space, every Cauchy
            sequence converges.
          </p>
          <div className="callout callout-success">
            <strong>Completeness:</strong> A metric space <InlineMath>{'(X,d)'}</InlineMath> is
            complete if every Cauchy sequence in <InlineMath>{'X'}</InlineMath> has a limit in
            <InlineMath>{'X'}</InlineMath>. Complete normed vector spaces are called
            <em> Banach spaces</em>. <InlineMath>{'\\mathbb{R}^n'}</InlineMath> with any
            <InlineMath>{'L_p'}</InlineMath> norm is a Banach space.
          </div>
          <p>
            <strong>Completeness via nested intervals (Cantor's theorem).</strong> In
            <InlineMath>{'\\mathbb{R}'}</InlineMath>, if <InlineMath>{'[a_1,b_1] \\supseteq [a_2,b_2] \\supseteq \\cdots'}</InlineMath>
            with <InlineMath>{'b_n - a_n \\to 0'}</InlineMath>, then there is exactly one point in all
            the intervals.
          </p>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · CAUCHY SEQUENCE VISUALIZER</span>
        </h2>
        <CauchyWidget />
      </section>

      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · SEQUENCES IN ℚ WITH IRRATIONAL LIMITS</span>
        </h2>
        <div className="content-block">
          <p>
            Consider the sequence of rational approximations to
            <InlineMath>{'\\sqrt{2}'}</InlineMath>: <InlineMath>{'1, 1.4, 1.41, 1.414, 1.4142, \\ldots'}</InlineMath>.
            This is a Cauchy sequence in <InlineMath>{'\\mathbb{Q}'}</InlineMath>: for any
            <InlineMath>{'\\varepsilon > 0'}</InlineMath>, successive terms eventually agree to
            more decimal places than <InlineMath>{'\\varepsilon'}</InlineMath>. But
            <InlineMath>{'\\sqrt{2} \\notin \\mathbb{Q}'}</InlineMath> — the limit does not exist
            in <InlineMath>{'\\mathbb{Q}'}</InlineMath>. The sequence "wants" to converge but
            the space has a hole at <InlineMath>{'\\sqrt{2}'}</InlineMath>.
          </p>
          <p>
            In <InlineMath>{'\\mathbb{R}'}</InlineMath>, the same sequence converges to
            <InlineMath>{'\\sqrt{2}'}</InlineMath> — the hole is filled.
            <InlineMath>{'\\mathbb{R}'}</InlineMath> was literally constructed from
            <InlineMath>{'\\mathbb{Q}'}</InlineMath> by filling in all such holes (Cauchy
            completion or Dedekind cuts).
          </p>
        </div>
      </section>

      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            Lecture 47 adds the concept of compactness — the property that guarantees maxima and
            minima exist. The Weierstrass theorem says a continuous function on a compact set
            attains its minimum — the theoretical bedrock under every optimization algorithm.
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
              <div className="app-icon">📉</div>
              <h3>Convergence of Gradient Descent</h3>
              <p>
                The iterates <InlineMath>{'w_{k+1} = w_k - \\alpha \\nabla L(w_k)'}</InlineMath>
                converge (for appropriate step size on convex functions) because they form a Cauchy
                sequence in a complete space. Completeness of <InlineMath>{'\\mathbb{R}^n'}</InlineMath>
                guarantees the limit exists.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🔄</div>
              <h3>Kalman Filter Convergence</h3>
              <p>
                The Riccati equation for the Kalman gain converges to a steady-state value under
                observability and controllability conditions. The iterates form a Cauchy sequence;
                completeness of the positive semi-definite matrix space ensures the limit exists.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🌡️</div>
              <h3>Sensor Calibration Iteration</h3>
              <p>
                Iterative calibration algorithms (Procrustes, ICP) converge when the sequence of
                error norms is Cauchy. Monitoring successive iteration changes
                <InlineMath>{'\\|\\theta_{k+1}-\\theta_k\\|'}</InlineMath> is the practical
                convergence check used in engineering.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📐</div>
              <h3>Numerical Methods in Banach Spaces</h3>
              <p>
                Iterative solvers for linear systems (CG, GMRES) converge because they minimize
                residuals in finite-dimensional Hilbert spaces (complete inner-product spaces).
                Completeness is what guarantees the method cannot "get stuck" with a Cauchy iterate
                sequence that has no limit.
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
            question="What is the difference between a Cauchy sequence and a convergent sequence?"
            options={[
              'They are identical concepts in any metric space',
              'A convergent sequence has a limit in the space; a Cauchy sequence only requires terms to get close to each other (the limit may not be in the space)',
              'A Cauchy sequence always diverges',
              'A convergent sequence requires finitely many terms',
            ]}
            correct={1}
            explanation="A convergent sequence has a specific limit L in the space: d(xₙ,L) → 0. A Cauchy sequence only requires d(xₘ,xₙ) → 0 — the terms cluster, but the limit L may not exist in the space (if the space has 'holes'). In a COMPLETE space, Cauchy ⟺ convergent."
          />
          <QuizQ
            num={2} type="Concept"
            question="Why is ℚ (the rationals) not a complete metric space?"
            options={[
              'ℚ has too many elements to be complete',
              'There exist Cauchy sequences in ℚ whose limit is irrational (not in ℚ)',
              'The metric on ℚ does not satisfy the triangle inequality',
              'ℚ is finite and finite spaces are never complete',
            ]}
            correct={1}
            explanation="The sequence 1, 1.4, 1.41, 1.414, … is Cauchy in ℚ (successive terms get closer) but its limit √2 is irrational. Since √2 ∉ ℚ, the Cauchy sequence has no limit within ℚ — violating completeness. The reals ℝ are the completion of ℚ: every hole is filled."
          />
          <QuizQ
            num={3} type="Application"
            question="An iterative algorithm produces weights w₁, w₂, w₃, … with ‖wₙ₊₁−wₙ‖ ≤ C·(0.9)ⁿ. Is this a Cauchy sequence?"
            options={[
              'No — the terms approach zero, not each other',
              'Yes — for any ε, choose N large enough so that ∑_{k>N} C·0.9^k < ε, bounding ‖wₘ−wₙ‖',
              'Only if C = 1',
              'Cannot determine without knowing the limit',
            ]}
            correct={1}
            explanation="For m > n > N: ‖wₘ−wₙ‖ ≤ ∑_{k=n}^{m−1} ‖wₖ₊₁−wₖ‖ ≤ C·0.9ⁿ/(1−0.9) = 10C·0.9ⁿ. Choose N so that 10C·0.9ᴺ < ε. Then ‖wₘ−wₙ‖ < ε for all m,n > N. This is precisely the Cauchy criterion. The sequence converges in the complete space ℝⁿ."
          />
          <QuizQ
            num={4} type="Concept"
            question="A 'Banach space' is a complete normed vector space. Why does ℝⁿ qualify?"
            options={[
              'ℝⁿ is finite-dimensional, so every sequence converges',
              'Every Cauchy sequence in ℝⁿ converges to a point in ℝⁿ — there are no holes',
              'ℝⁿ has an inner product, not just a norm',
              'Banach spaces require only countably many dimensions',
            ]}
            correct={1}
            explanation="ℝⁿ with any Lp norm is complete: every Cauchy sequence has a limit in ℝⁿ. This follows from completeness of ℝ (applied coordinatewise). 'No holes' is the intuition — unlike ℚⁿ where irrational limits can fall through. Note: ℝⁿ also has an inner product (making it a Hilbert space, a special Banach space)."
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
              Write the definition of convergence using quantifiers. Apply it to show
              <InlineMath>{'a_n = 1/n \\to 0'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              Write the Cauchy criterion. Explain why every convergent sequence is Cauchy.
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Show that <InlineMath>{'a_n = (-1)^n'}</InlineMath> is NOT Cauchy. (Hint: show
              that for <InlineMath>{'\\varepsilon = 1'}</InlineMath> the criterion fails.)
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              Define completeness. Give one example each of a complete and an incomplete metric
              space. In the incomplete example, exhibit a Cauchy sequence with no limit in the space.
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Without notes: state the definitions of convergence, Cauchy, and completeness. Explain
              the practical relevance to iterative algorithms (e.g., gradient descent in
              <InlineMath>{'\\mathbb{R}^n'}</InlineMath>).
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
