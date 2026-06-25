import { useState } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  INDUCTION DOMINO WIDGET
// ════════════════════════════════════════════════════════════════════════════
function DominoWidget() {
  const [n, setN] = useState(6)
  const [falling, setFalling] = useState(false)
  const [fallen, setFallen] = useState(0)

  const startFall = () => {
    if (falling) return
    setFalling(true); setFallen(0)
    let i = 0
    const tick = () => {
      i++; setFallen(i)
      if (i < n) setTimeout(tick, 180)
      else setFalling(false)
    }
    setTimeout(tick, 200)
  }

  const W = 360, H = 120
  const domW = 20, domH = 56, gap = 16
  const totalW = n * (domW + gap)
  const startX = (W - totalW) / 2
  const sums = Array.from({ length: n + 1 }, (_, k) => k * (k + 1) / 2)

  return (
    <div className="widget">
      <p className="widget-caption">
        The <em>base case</em> is knocking over domino 1 (prove P(1) directly). The
        <em> inductive step</em> is "if domino k falls, domino k+1 falls" — prove P(k)→P(k+1).
        Together these guarantee all dominoes fall.
      </p>
      <div className="widget-card">
        <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
          {Array.from({ length: n }, (_, i) => {
            const x = startX + i * (domW + gap)
            const isFallen = i < fallen
            return (
              <g key={i} transform={isFallen
                ? `translate(${x + domW},${H - 24}) rotate(90)`
                : `translate(${x},${H - 24 - domH})`}>
                <rect x={0} y={0} width={domW} height={domH} rx="3"
                  fill={i === 0 ? '#7950f2' : isFallen ? '#c92a2a' : '#aed6f1'}
                  stroke={isFallen ? '#a12929' : '#5c6b85'} strokeWidth="1.2" />
                <text x={domW/2} y={domH/2+1} textAnchor="middle" dominantBaseline="middle"
                  fontSize="10" fill="white" fontWeight="bold">{i + 1}</text>
              </g>
            )
          })}
          <line x1={startX-10} y1={H-24} x2={startX+totalW+10} y2={H-24}
            stroke="#5c6b85" strokeWidth="2" />
        </svg>
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="slider-row" style={{ flex: '1 1 140px' }}>
            <span className="slider-label">n = <b>{n}</b> dominoes</span>
            <input type="range" min={3} max={12} step={1} value={n}
              onChange={e => { setN(Number(e.target.value)); setFallen(0) }} />
          </label>
          <button className="preset-btn active" onClick={startFall} disabled={falling}
            style={{ padding: '6px 16px', fontSize: '13px' }}>
            {falling ? 'Falling…' : '▶ Tip domino 1'}
          </button>
          <button className="preset-btn" onClick={() => { setFallen(0); setFalling(false) }}
            style={{ padding: '6px 16px', fontSize: '13px' }}>Reset</button>
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#5c6b85' }}>
          S(k) = 1+2+⋯+k = k(k+1)/2 :{' '}
          {sums.slice(1).map((s, i) => (
            <span key={i} style={{ color: i < fallen ? '#c92a2a' : '#5c6b85',
              marginRight: '8px', fontFamily: 'monospace' }}>
              {i+1}→{s}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════
export default function L43() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#eaecee', color: '#2c3e50', borderColor: '#aab7b8' }}>
          Module 9 · Lecture 43 · ROB 201
        </div>
        <h1 className="lesson-title">Contradiction, Induction &amp; Exhaustion</h1>
        <p className="lesson-subtitle">
          Three extensions of direct proof: contradiction (assume the opposite, find an impossibility),
          induction (chain base case to general case), and exhaustion (check all finite cases).
        </p>
      </div>

      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Sometimes a direct proof is blocked because you do not know how to get from A to B.
            Contradiction flips the problem: assume B is false and derive an impossibility.
          </p>
          <p>
            Induction solves: how do you prove something for all natural numbers? You cannot check
            each one. Prove it for <InlineMath>{'n=1'}</InlineMath> (base case), then prove that
            if it holds for <InlineMath>{'n=k'}</InlineMath> it holds for
            <InlineMath>{'n=k+1'}</InlineMath> (inductive step). Like dominoes: once one falls,
            the next must fall, and the first one is down.
          </p>
          <p>
            Exhaustion proves by checking all finite cases — valid but not elegant. Case splits in
            algorithm analysis ("if the array has 0 elements… else…") are exhaustion in disguise.
          </p>
        </div>
      </section>

      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · THREE PROOF TECHNIQUES</span>
        </h2>
        <div className="content-block">
          <p><strong>Proof by contradiction.</strong> To prove P:</p>
          <ol style={{ lineHeight: 1.8, paddingLeft: '1.5rem' }}>
            <li>Assume <InlineMath>{'\\neg P'}</InlineMath>.</li>
            <li>Derive a known-false statement (contradiction).</li>
            <li>Conclude P is true. ∎</li>
          </ol>
          <p><strong>Mathematical induction.</strong> To prove P(n) for all n ≥ 1:</p>
          <div className="callout callout-info">
            <strong>Base case:</strong> prove P(1) directly.
          </div>
          <div className="callout callout-info">
            <strong>Inductive step:</strong> assume P(k) (the inductive hypothesis) and prove P(k+1).
          </div>
          <p>
            <strong>Strong induction</strong> lets the inductive step assume P(j) for all j &lt; k
            (not just j = k−1). Useful for recursive definitions like the Fibonacci sequence.
          </p>
          <p>
            <strong>Classic example.</strong> Prove <InlineMath>{'\\sum_{i=1}^n i = n(n+1)/2'}</InlineMath>.
          </p>
          <DisplayMath>{String.raw`\textit{Base: } n=1:\quad 1 = \frac{1\cdot 2}{2} = 1.\;\checkmark`}</DisplayMath>
          <DisplayMath>{String.raw`\textit{Step: assume } \sum_{i=1}^k i = \frac{k(k+1)}{2}.\quad
\sum_{i=1}^{k+1} i = \frac{k(k+1)}{2} + (k+1) = \frac{(k+1)(k+2)}{2}.\;\checkmark`}</DisplayMath>
          <div className="callout callout-success">
            <strong>Contradiction classic: irrationality of </strong>
            <InlineMath>{'\\sqrt{2}'}</InlineMath>. Assume
            <InlineMath>{'\\sqrt{2} = p/q'}</InlineMath> in lowest terms. Then
            <InlineMath>{'2q^2 = p^2'}</InlineMath>, so <InlineMath>{'p'}</InlineMath> is even;
            write <InlineMath>{'p=2m'}</InlineMath>. Then
            <InlineMath>{'2q^2=4m^2 \\Rightarrow q^2=2m^2'}</InlineMath>, so
            <InlineMath>{'q'}</InlineMath> is also even — contradicting the assumption that
            <InlineMath>{'p/q'}</InlineMath> is in lowest terms. ∎
          </div>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · INDUCTION AS FALLING DOMINOES</span>
        </h2>
        <DominoWidget />
      </section>

      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · CONVERGENCE OF GEOMETRIC SERIES BY INDUCTION</span>
        </h2>
        <div className="content-block">
          <p>
            Prove <InlineMath>{'\\sum_{i=0}^n r^i = (r^{n+1}-1)/(r-1)'}</InlineMath> for
            <InlineMath>{'\\;r \\neq 1'}</InlineMath> and all <InlineMath>{'n \\geq 0'}</InlineMath>.
          </p>
          <p>
            <strong>Base (n=0):</strong> LHS = 1. RHS = (r−1)/(r−1) = 1. ✓
          </p>
          <p>
            <strong>Step:</strong> Assume the formula holds for n=k. Then:
          </p>
          <DisplayMath>{String.raw`\sum_{i=0}^{k+1} r^i = \frac{r^{k+1}-1}{r-1} + r^{k+1}
= \frac{r^{k+1}-1 + r^{k+1}(r-1)}{r-1} = \frac{r^{k+2}-1}{r-1}.\;\checkmark`}</DisplayMath>
        </div>
      </section>

      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            Lecture 44 uses contradiction to prove the most striking result in set theory: Cantor's
            diagonal argument, showing that the set of real numbers is strictly larger than the set
            of natural numbers — two infinite sets can have different sizes.
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
              <div className="app-icon">🔁</div>
              <h3>Inductive Loop Invariants</h3>
              <p>
                Proving a while-loop correct uses induction: state a loop invariant (a property true
                before every iteration), prove the base case (before the loop starts), then prove
                the inductive step (if it holds before iteration k, it holds before k+1).
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧮</div>
              <h3>Complexity Analysis</h3>
              <p>
                Proving that merge sort runs in <InlineMath>{'O(n\\log n)'}</InlineMath> uses
                the Master Theorem, itself proved by induction. Recurrence relations in algorithm
                analysis are solved by guessing the form and verifying by induction.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🎲</div>
              <h3>Irrationality &amp; Number Theory</h3>
              <p>
                Proving that sensor noise models based on irrational parameters cannot be expressed
                as exact rational ratios uses contradiction. The same argument underlies
                cryptographic primality tests.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🏗️</div>
              <h3>Structural Induction on Trees</h3>
              <p>
                Proving properties of tree-structured robot kinematics (URDF) or computation graphs
                uses structural induction: prove for leaf nodes (base case), then show the
                property propagates through each operator node (inductive step).
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
            question="In a proof by contradiction of P, you assume ¬P and then:"
            options={[
              'Prove Q for some unrelated Q',
              'Derive a statement that contradicts a known truth, forcing ¬P to be impossible',
              'Show that P implies ¬P',
              'Verify P for specific cases exhaustively',
            ]}
            correct={1}
            explanation="Proof by contradiction: assume ¬P is true, then by valid reasoning reach a statement C that is known to be false (e.g., 1 = 0, or A ∧ ¬A). Since ¬P leads to an impossibility, ¬P must be false — hence P is true. The contradiction can be anything logically impossible."
          />
          <QuizQ
            num={2} type="Computation"
            question="Inductive step for ∑ᵢ₌₁ⁿ i = n(n+1)/2: assuming the formula holds for k, what must you show for k+1?"
            options={[
              '∑ᵢ₌₁ᵏ⁺¹ i = (k+1)(k+2)/2',
              '∑ᵢ₌₁ᵏ⁺¹ i = k(k+1)/2 + 1',
              '∑ᵢ₌₁ᵏ⁺¹ i = (k+1)²/2',
              '∑ᵢ₌₁ᵏ⁺¹ i = k(k+2)/2',
            ]}
            correct={0}
            explanation="To prove the inductive step, substitute n = k+1 into the formula: ∑ᵢ₌₁ᵏ⁺¹ i = (k+1)(k+2)/2. The proof: use the inductive hypothesis ∑ᵢ₌₁ᵏ i = k(k+1)/2, then ∑ᵢ₌₁ᵏ⁺¹ i = k(k+1)/2 + (k+1) = (k+1)(k/2 + 1) = (k+1)(k+2)/2. ✓"
          />
          <QuizQ
            num={3} type="Concept"
            question="How does 'strong induction' differ from ordinary induction?"
            options={[
              'Strong induction proves harder statements',
              'Strong induction assumes P(j) for ALL j < k (not just j = k−1), useful when the step depends on multiple prior cases',
              'Strong induction skips the base case',
              'Strong induction uses contradiction as the inductive step',
            ]}
            correct={1}
            explanation="Ordinary induction: assume P(k), prove P(k+1). Strong induction: assume P(j) for all j ≤ k, prove P(k+1). Strong induction is needed when P(k+1) depends on more than just P(k) — for example, proving the Fundamental Theorem of Arithmetic (every integer factors uniquely into primes) where the inductive step needs P(m) for all m < k+1."
          />
          <QuizQ
            num={4} type="Transfer"
            question="A robot algorithm runs in T(n) = 2·T(n/2) + n steps. Prove by induction that T(n) ≤ n·log₂(n) for n a power of 2. What is the key step?"
            options={[
              'Use the inductive hypothesis T(n/2) ≤ (n/2)·log₂(n/2) and substitute into T(n) = 2·T(n/2)+n',
              'Guess T(n) = n² and verify by exhaustion',
              'Use strong induction with no base case needed',
              'Apply contradiction: assume T(n) > n·log₂(n)',
            ]}
            correct={0}
            explanation="Inductive step: assume T(n/2) ≤ (n/2)·log₂(n/2). Then T(n) = 2·T(n/2)+n ≤ 2·(n/2)·log₂(n/2)+n = n·log₂(n/2)+n = n·(log₂(n)−1)+n = n·log₂(n). This is the standard Master Theorem analysis for merge sort: O(n log n). ✓"
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
              Write the induction template. Prove by induction:
              <InlineMath>{'\\sum_{i=1}^n i^2 = n(n+1)(2n+1)/6'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              Prove by contradiction that <InlineMath>{'\\sqrt{3}'}</InlineMath> is irrational.
              Model the proof on the <InlineMath>{'\\sqrt{2}'}</InlineMath> argument.
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Use strong induction to prove that every integer <InlineMath>{'n \\geq 2'}</InlineMath>
              is either prime or a product of primes.
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              Prove by induction that <InlineMath>{'2^n > n'}</InlineMath> for all
              <InlineMath>{'n \\geq 1'}</InlineMath>. Identify the base case and inductive step clearly.
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Without notes: state all three proof strategies and give one canonical example of each.
              Explain when you would choose contradiction over direct proof.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
