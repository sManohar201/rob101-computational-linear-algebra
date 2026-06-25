import { useState } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  CANTOR DIAGONAL WIDGET
//  Shows a fictional list of real numbers in [0,1] and the diagonal construction.
// ════════════════════════════════════════════════════════════════════════════

// Generate a list of fake "real numbers" as decimal sequences
function makeList(n) {
  const list = []
  for (let i = 0; i < n; i++) {
    const digits = Array.from({ length: n }, () => Math.floor(Math.random() * 10))
    list.push(digits)
  }
  return list
}

function DiagonalWidget() {
  const [n, setN] = useState(6)
  const [seed, setSeed] = useState(0)
  const [showDiag, setShowDiag] = useState(true)
  const [showAnti, setShowAnti] = useState(true)

  // Use seed to regenerate
  const rng = (i, j) => ((i * 1234 + j * 5678 + seed * 91) % 97) % 10
  const list = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => rng(i, j)))

  // Diagonal digits
  const diag = list.map((row, i) => row[i])
  // Antidiagonal: change each digit (d+1) mod 10 ≠ d
  const anti = diag.map(d => (d + 1) % 10)

  return (
    <div className="widget">
      <p className="widget-caption">
        Suppose all reals in [0,1] could be listed as r₁, r₂, r₃, … The diagonal argument constructs a
        new real (orange) whose <InlineMath>{'n'}</InlineMath>-th decimal digit differs from the
        <InlineMath>{'n'}</InlineMath>-th digit of <InlineMath>{'r_n'}</InlineMath>. This new number
        cannot be anywhere on the list — contradicting the assumption that the list is complete.
      </p>
      <div className="widget-card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#eaecee' }}>
                <th style={{ padding: '6px 10px', borderBottom: '2px solid #aab7b8', textAlign: 'left' }}>
                  Row
                </th>
                <th style={{ padding: '6px 6px', borderBottom: '2px solid #aab7b8' }}>0.</th>
                {Array.from({ length: n }, (_, j) => (
                  <th key={j} style={{ padding: '6px 8px', borderBottom: '2px solid #aab7b8',
                    background: j < n ? 'rgba(47,158,68,0.06)' : 'transparent' }}>
                    d{j+1}
                  </th>
                ))}
                <th style={{ padding: '6px 6px', borderBottom: '2px solid #aab7b8' }}>…</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#f8f9fa' : '#fff' }}>
                  <td style={{ padding: '4px 10px', color: '#5c6b85' }}>r<sub>{i+1}</sub></td>
                  <td style={{ padding: '4px 6px', color: '#5c6b85' }}>0.</td>
                  {row.map((d, j) => (
                    <td key={j} style={{ padding: '4px 8px', textAlign: 'center',
                      background: showDiag && i === j ? 'rgba(47,158,68,0.25)' : 'transparent',
                      color: showDiag && i === j ? '#1a5e30' : '#2c3e50',
                      fontWeight: showDiag && i === j ? 'bold' : 'normal',
                      border: showDiag && i === j ? '2px solid #2f9e44' : '1px solid transparent',
                    }}>
                      {d}
                    </td>
                  ))}
                  <td style={{ padding: '4px 6px', color: '#8899bb' }}>…</td>
                </tr>
              ))}
              {showAnti && (
                <tr style={{ background: 'rgba(201,42,42,0.06)' }}>
                  <td style={{ padding: '4px 10px', color: '#c92a2a', fontWeight: 'bold' }}>d*</td>
                  <td style={{ padding: '4px 6px', color: '#c92a2a', fontWeight: 'bold' }}>0.</td>
                  {anti.map((d, j) => (
                    <td key={j} style={{ padding: '4px 8px', textAlign: 'center',
                      color: '#c92a2a', fontWeight: 'bold',
                      border: '2px solid #c92a2a' }}>
                      {d}
                    </td>
                  ))}
                  <td style={{ padding: '4px 6px', color: '#c92a2a' }}>…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#5c6b85' }}>
          Green diagonal digits: {diag.join(', ')}.{' '}
          Orange antidiagonal d* = 0.{anti.join('')}…
          — differs from every row in position {n}.
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="slider-row" style={{ flex: '1 1 140px' }}>
            <span className="slider-label">Rows = <b>{n}</b></span>
            <input type="range" min={4} max={9} step={1} value={n}
              onChange={e => setN(Number(e.target.value))} />
          </label>
          <button className="preset-btn active"
            onClick={() => setSeed(s => s + 1)}
            style={{ padding: '6px 14px', fontSize: '13px' }}>
            New list
          </button>
          <label style={{ fontSize: '12px', display: 'flex', gap: '4px', alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" checked={showDiag} onChange={e => setShowDiag(e.target.checked)} />
            Show diagonal
          </label>
          <label style={{ fontSize: '12px', display: 'flex', gap: '4px', alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" checked={showAnti} onChange={e => setShowAnti(e.target.checked)} />
            Show d*
          </label>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════
export default function L44() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#eaecee', color: '#2c3e50', borderColor: '#aab7b8' }}>
          Module 9 · Lecture 44 · ROB 201
        </div>
        <h1 className="lesson-title">Set Countability &amp; Cantor's Diagonal Argument</h1>
        <p className="lesson-subtitle">
          Infinite sets are not all the same size. Cantor's diagonal argument — a masterpiece of
          proof by contradiction — shows that the real numbers cannot be listed in any sequence,
          making them "more infinite" than the natural numbers. This result reshapes how we think
          about computation, probability, and the limits of algorithms.
        </p>
      </div>

      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Two sets have the same size (cardinality) if you can pair up their elements one-to-one
            — a bijection. The natural numbers <InlineMath>{'\\mathbb{N}'}</InlineMath> and the
            integers <InlineMath>{'\\mathbb{Z}'}</InlineMath> have the same size:
            0↔0, 1↔1, 2↔-1, 3↔2, 4↔-2, … Even the rationals
            <InlineMath>{'\\mathbb{Q}'}</InlineMath> can be listed systematically (Cantor's
            zigzag), so <InlineMath>{'|\\mathbb{Q}| = |\\mathbb{N}|'}</InlineMath> — both are
            <em>countably infinite</em>.
          </p>
          <p>
            The real numbers <InlineMath>{'\\mathbb{R}'}</InlineMath> are different. No matter
            how cleverly you try to list them, there will always be a real number missing from your
            list. Cantor's diagonal argument proves this by construction: given any list, build a
            number not on it.
          </p>
          <p>
            This has deep consequences. Since there are only countably many algorithms (programs),
            but uncountably many real functions, <em>most</em> functions cannot be computed by any
            algorithm. The halting problem is undecidable for the same reason.
          </p>
        </div>
      </section>

      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · COUNTABILITY &amp; THE DIAGONAL ARGUMENT</span>
        </h2>
        <div className="content-block">
          <p>
            <strong>Countably infinite:</strong> a set <InlineMath>{'S'}</InlineMath> is countable if
            there is a bijection <InlineMath>{'f : \\mathbb{N} \\to S'}</InlineMath>. Examples:
            <InlineMath>{'\\mathbb{Z},\\;\\mathbb{Q}'}</InlineMath>, all finite Cartesian products
            <InlineMath>{'\\mathbb{N}^k'}</InlineMath>.
          </p>
          <p>
            <strong>Cantor's Theorem.</strong>{' '}
            <InlineMath>{'\\mathbb{R}'}</InlineMath> is uncountable: there is no bijection
            <InlineMath>{'f : \\mathbb{N} \\to \\mathbb{R}'}</InlineMath>.
          </p>
          <p>
            <strong>Proof (diagonal argument).</strong> Suppose for contradiction that we have a
            listing <InlineMath>{'r_1, r_2, r_3, \\ldots'}</InlineMath> of all reals in
            <InlineMath>{'[0,1]'}</InlineMath>. Write each as a decimal:
            <InlineMath>{'\\;r_n = 0.d_{n,1}d_{n,2}d_{n,3}\\cdots'}</InlineMath>. Define
          </p>
          <DisplayMath>{String.raw`d^* = 0.d^*_1 d^*_2 d^*_3 \cdots,\quad d^*_n = \begin{cases}1 & \text{if }d_{n,n}\neq 1\\ 2 & \text{if }d_{n,n}=1.\end{cases}`}</DisplayMath>
          <p>
            Then <InlineMath>{'d^*'}</InlineMath> differs from <InlineMath>{'r_n'}</InlineMath>
            in position <InlineMath>{'n'}</InlineMath> for every <InlineMath>{'n'}</InlineMath>.
            So <InlineMath>{'d^*'}</InlineMath> is not on the list — contradicting the assumption
            that the list was complete. Therefore no such listing exists and
            <InlineMath>{'\\mathbb{R}'}</InlineMath> is uncountable. ∎
          </p>
          <div className="callout callout-success">
            <strong>Cantor's power set theorem.</strong> For any set <InlineMath>{'S'}</InlineMath>,
            the power set <InlineMath>{'\\mathcal{P}(S)'}</InlineMath> (set of all subsets) has
            strictly larger cardinality:
            <InlineMath>{'|\\mathcal{P}(S)| > |S|'}</InlineMath>. This creates an infinite tower
            of infinities: <InlineMath>{'|\\mathbb{N}| < |\\mathbb{R}| < |\\mathcal{P}(\\mathbb{R})| < \\cdots'}</InlineMath>.
          </div>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · CANTOR DIAGONAL VISUALIZER</span>
        </h2>
        <DiagonalWidget />
      </section>

      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · CANTOR ZIGZAG FOR RATIONALS</span>
        </h2>
        <div className="content-block">
          <p>
            The rationals <InlineMath>{'\\mathbb{Q}'}</InlineMath> are countable: arrange all fractions
            <InlineMath>{'\\;p/q'}</InlineMath> (<InlineMath>{'p,q \\in \\mathbb{N}'}</InlineMath>) in a
            2D grid and traverse diagonally: 1/1, 1/2, 2/1, 3/1, 2/2, 1/3, 1/4, 2/3, 3/2, 4/1, …
            Skip duplicates. Every rational is eventually hit — so this listing is a bijection
            <InlineMath>{'\\mathbb{N} \\to \\mathbb{Q}'}</InlineMath>.
          </p>
          <p>
            But the diagonal argument shows no such zigzag can enumerate the reals: no matter the
            order you choose, the diagonal construction produces a real not on your list.
          </p>
        </div>
      </section>

      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            Module 10 builds the topological foundations: open sets, limit points, compactness, and
            completeness. Lecture 45 introduces metric spaces — the right abstraction for distances
            in high-dimensional robot configuration spaces.
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
              <div className="app-icon">🖥️</div>
              <h3>Limits of Computation</h3>
              <p>
                There are only countably many programs (each is a finite string over a finite
                alphabet). There are uncountably many computable problems. So most functions cannot
                be computed — the halting problem and other undecidable problems exist precisely
                because of this cardinality gap.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🎲</div>
              <h3>Continuous Probability Spaces</h3>
              <p>
                The sample space for a continuous random variable (e.g., Gaussian sensor noise)
                is uncountable. This forces the use of measure theory — the probability of any
                single real number is zero, yet probabilities over intervals are positive and
                well-defined.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🔢</div>
              <h3>Floating-Point Arithmetic</h3>
              <p>
                IEEE 754 double-precision represents only a finite (hence countable) subset of the
                reals. The gap between representable numbers — machine epsilon — is the practical
                consequence of trying to approximate the uncountable reals with a finite computer.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🔒</div>
              <h3>Kolmogorov Complexity</h3>
              <p>
                Most bit strings have no short description (incompressible). Cantor's argument proves
                this: there are only countably many programs, but uncountably many infinite binary
                strings. "Random" strings — those that cannot be compressed — are, in a precise sense,
                the overwhelming majority.
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
            question="What does it mean for two infinite sets to have the same cardinality?"
            options={[
              'They both have infinitely many elements',
              'One can be obtained from the other by removing finitely many elements',
              'There exists a bijection (one-to-one correspondence) between them',
              'They have the same number of subsets',
            ]}
            correct={2}
            explanation="Cardinality equality means there is a bijection f: A → B — every element of A corresponds to exactly one element of B and vice versa, with nothing left over. This is Cantor's extension of 'same size' to infinite sets. ℤ and ℕ have the same cardinality despite ℕ ⊂ ℤ (a property unique to infinite sets — Dedekind's definition of infinity)."
          />
          <QuizQ
            num={2} type="Concept"
            question="In Cantor's diagonal argument, the constructed number d* cannot be on the list because:"
            options={[
              'd* is irrational, and the list contains only rationals',
              "d* differs from every rₙ in its n-th decimal digit, so it cannot equal any element of the list",
              'd* is defined to be larger than every element on the list',
              'd* uses only the digits 1 and 2, but the list might contain other digits',
            ]}
            correct={1}
            explanation="The key: d* is constructed so that its n-th decimal digit differs from the n-th digit of rₙ, for every n. Therefore d* ≠ r₁ (they differ in digit 1), d* ≠ r₂ (they differ in digit 2), and so on — d* ≠ rₙ for any n. This means d* is not on the list, contradicting the assumption that the list contains all reals."
          />
          <QuizQ
            num={3} type="Concept"
            question="The rationals ℚ are countable and the reals ℝ are uncountable. What about the irrationals ℝ∖ℚ?"
            options={[
              'Countably infinite — there are as many irrationals as rationals',
              'Uncountably infinite — if they were countable, ℝ = ℚ ∪ (ℝ∖ℚ) would be countable',
              'Finite — only finitely many irrationals are "computable"',
              'Neither countable nor uncountable',
            ]}
            correct={1}
            explanation="ℝ = ℚ ∪ (ℝ∖ℚ). If ℝ∖ℚ were countable, then ℝ = (countable) ∪ (countable) = countable. But ℝ is uncountable. Contradiction. Therefore ℝ∖ℚ must be uncountable. In fact, 'most' real numbers are irrational — the rationals are a negligible (measure-zero) subset."
          />
          <QuizQ
            num={4} type="Transfer"
            question="A robotics simulation uses double-precision floats to represent joint angles. Why can't it represent all possible configurations?"
            options={[
              'Floats are only 64 bits, so the program crashes for large angles',
              'The reals are uncountable but there are only finitely many 64-bit floats — most real angles have no exact float representation',
              'Angles must be rational, and floats cannot represent rationals',
              'The simulation discretizes time, not space',
            ]}
            correct={1}
            explanation="There are exactly 2^64 ≈ 1.8×10^19 distinct 64-bit patterns (double-precision floats). The set of joint angles in [0, 2π] is an uncountable subset of ℝ. Since 2^64 is finite (hence countable), most real angles have no exact float representation — they are rounded to the nearest representable value. This is why numerical analysis studies rounding error."
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
              Explain what a bijection is. Give an explicit bijection from
              <InlineMath>{'\\mathbb{N}'}</InlineMath> to the even natural numbers.
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              Reconstruct Cantor's diagonal argument from memory. What is the key property of the
              constructed number <InlineMath>{'d^*'}</InlineMath>?
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Show by the Cantor zigzag that <InlineMath>{'\\mathbb{N} \\times \\mathbb{N}'}</InlineMath>
              is countable. Explain the traversal order.
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              State Cantor's power set theorem. Explain why the set of all functions
              <InlineMath>{'\\mathbb{N} \\to \\{0,1\\}'}</InlineMath> is uncountable.
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Without notes: define countable set. Explain in two sentences why the reals are
              uncountable and what this implies about the limits of computation.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
