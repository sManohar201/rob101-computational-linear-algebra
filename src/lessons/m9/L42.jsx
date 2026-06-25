import { useState } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  TRUTH TABLE / DIRECT PROOF WIDGET
//  Lets the user build a truth table for simple propositional logic statements.
// ════════════════════════════════════════════════════════════════════════════

const STATEMENTS = [
  {
    label: 'P ∧ Q ⟹ P',
    vars: ['P', 'Q'],
    formula: (p, q) => ({ hyp: p && q, conc: p }),
    name: 'Conjunction elimination',
    tautology: true,
  },
  {
    label: '(P ⟹ Q) ∧ P ⟹ Q',
    vars: ['P', 'Q'],
    formula: (p, q) => ({ hyp: (!p || q) && p, conc: q }),
    name: 'Modus Ponens',
    tautology: true,
  },
  {
    label: 'P ∨ Q ⟹ P',
    vars: ['P', 'Q'],
    formula: (p, q) => ({ hyp: p || q, conc: p }),
    name: 'Disjunction elimination (false!)',
    tautology: false,
  },
]

function TruthTableWidget() {
  const [stmtIdx, setStmtIdx] = useState(0)
  const { vars, formula, name, tautology } = STATEMENTS[stmtIdx]

  const rows = []
  for (let i = 0; i < 4; i++) {
    const p = (i >> 1) === 1
    const q = (i & 1) === 1
    const { hyp, conc } = formula(p, q)
    // Implication: if hyp is false, whole thing is vacuously true
    const impl = !hyp || conc
    rows.push({ p, q, hyp, conc, impl })
  }

  const cell = v => (
    <td style={{
      textAlign: 'center', padding: '6px 12px', fontSize: '13px',
      color: v ? '#2f9e44' : '#c92a2a', fontWeight: 'bold',
    }}>
      {v ? 'T' : 'F'}
    </td>
  )

  return (
    <div className="widget">
      <p className="widget-caption">
        A truth table checks a logical statement for all combinations of truth values of its
        variables. A statement that is always true is a <em>tautology</em> — the foundation of
        a valid proof rule. Select a statement and verify whether it is a tautology.
      </p>
      <div className="widget-card">
        <div className="preset-bar" style={{ marginBottom: '12px' }}>
          {STATEMENTS.map((s, i) => (
            <button key={i}
              className={`preset-btn ${stmtIdx === i ? 'active' : ''}`}
              onClick={() => setStmtIdx(i)}>
              {s.label}
            </button>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', minWidth: '360px' }}>
            <thead>
              <tr style={{ background: '#eaecee' }}>
                <th style={{ padding: '6px 12px', borderBottom: '2px solid #aab7b8' }}>P</th>
                <th style={{ padding: '6px 12px', borderBottom: '2px solid #aab7b8' }}>Q</th>
                <th style={{ padding: '6px 12px', borderBottom: '2px solid #aab7b8' }}>Hypothesis</th>
                <th style={{ padding: '6px 12px', borderBottom: '2px solid #aab7b8' }}>Conclusion</th>
                <th style={{ padding: '6px 12px', borderBottom: '2px solid #aab7b8' }}>
                  Implication
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#f8f9fa' : '#ffffff',
                  outline: !r.impl ? '2px solid #c92a2a' : 'none' }}>
                  {cell(r.p)}{cell(r.q)}{cell(r.hyp)}{cell(r.conc)}
                  <td style={{ textAlign: 'center', padding: '6px 12px',
                    background: !r.impl ? 'rgba(201,42,42,0.1)' : 'transparent',
                    color: r.impl ? '#2f9e44' : '#c92a2a', fontWeight: 'bold', fontSize: '13px' }}>
                    {r.impl ? 'T' : 'F ⚠'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '10px', padding: '8px 12px',
          background: tautology ? 'rgba(47,158,68,0.1)' : 'rgba(201,42,42,0.1)',
          borderRadius: '6px', fontSize: '13px', color: tautology ? '#1a5e30' : '#7a1919' }}>
          <strong>{name}</strong> — {tautology
            ? 'Tautology ✓ (all rows true → valid proof rule)'
            : 'NOT a tautology ✗ (has false row → invalid rule)'}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L42() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#eaecee', color: '#2c3e50', borderColor: '#aab7b8' }}>
          Module 9 · Lecture 42 · ROB 201
        </div>
        <h1 className="lesson-title">Mathematical Logic &amp; Direct Proofs</h1>
        <p className="lesson-subtitle">
          Engineering intuition tells you what is true; mathematical proof tells you why it must
          be true — and prevents you from being fooled by cases that seem to work but don't.
          Propositional logic, quantifiers, and direct proof are the language of rigorous mathematics.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Why do we need proof? Simulation shows that PID control works for 1000 random initial
            conditions — but it cannot guarantee it works for all initial conditions. A proof can.
            The same gap exists everywhere in engineering: testing validates specific cases; proof
            guarantees all cases.
          </p>
          <p>
            A <em>proposition</em> is a statement that is either true or false.
            An <em>implication</em> <InlineMath>{'P \\Rightarrow Q'}</InlineMath> says: whenever
            <InlineMath>{'\\;P'}</InlineMath> is true, <InlineMath>{'\\;Q'}</InlineMath> must also
            be true. It is only false when <InlineMath>{'\\;P'}</InlineMath> is true but
            <InlineMath>{'\\;Q'}</InlineMath> is false. A <em>direct proof</em> of
            <InlineMath>{'\\;P \\Rightarrow Q'}</InlineMath> assumes
            <InlineMath>{'\\;P'}</InlineMath> and deduces <InlineMath>{'\\;Q'}</InlineMath>
            using definitions, axioms, and previously proved results.
          </p>
          <p>
            Quantifiers complete the language: <InlineMath>{'\\forall x'}</InlineMath> ("for all
            <InlineMath>{'\\;x'}</InlineMath>") and <InlineMath>{'\\exists x'}</InlineMath> ("there
            exists an <InlineMath>{'\\;x'}</InlineMath>"). Their interaction is subtle: to disprove
            <InlineMath>{'\\forall x\\; P(x)'}</InlineMath>, it suffices to find a single
            counterexample; to disprove <InlineMath>{'\\exists x\\; P(x)'}</InlineMath>, you must
            show no such <InlineMath>{'x'}</InlineMath> exists.
          </p>
        </div>
      </section>

      {/* ── Formalism ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · PROPOSITIONAL LOGIC &amp; QUANTIFIERS</span>
        </h2>
        <div className="content-block">
          <p><strong>Connectives and their truth conditions:</strong></p>
          <div className="callout callout-info">
            <InlineMath>{'\\neg P'}</InlineMath> (NOT): true iff <InlineMath>{'P'}</InlineMath> is
            false. &ensp;
            <InlineMath>{'P \\land Q'}</InlineMath> (AND): true iff both are true. &ensp;
            <InlineMath>{'P \\lor Q'}</InlineMath> (OR): true iff at least one is true.
          </div>
          <div className="callout callout-info">
            <InlineMath>{'P \\Rightarrow Q'}</InlineMath> (implication): false only when
            <InlineMath>{'\\;P'}</InlineMath> is true and <InlineMath>{'\\;Q'}</InlineMath> is false.
            Equivalently: <InlineMath>{'\\neg P \\lor Q'}</InlineMath>.
          </div>
          <div className="callout callout-info">
            <InlineMath>{'P \\Leftrightarrow Q'}</InlineMath> (biconditional, "iff"): true iff
            <InlineMath>{'\\;P'}</InlineMath> and <InlineMath>{'\\;Q'}</InlineMath> have the same
            truth value. Equivalent to <InlineMath>{'(P\\Rightarrow Q) \\land (Q\\Rightarrow P)'}</InlineMath>.
          </div>
          <p>
            <strong>Contrapositive.</strong> <InlineMath>{'P \\Rightarrow Q'}</InlineMath> is
            logically equivalent to <InlineMath>{'\\neg Q \\Rightarrow \\neg P'}</InlineMath>.
            Proving the contrapositive is a valid strategy when the direct direction is hard.
          </p>
          <p>
            <strong>De Morgan's laws.</strong>
          </p>
          <DisplayMath>{String.raw`\neg(P \land Q) \equiv \neg P \lor \neg Q,\qquad \neg(P \lor Q) \equiv \neg P \land \neg Q.`}</DisplayMath>
          <p>
            <strong>Direct proof template.</strong> To prove <InlineMath>{'P \\Rightarrow Q'}</InlineMath>:
            (1) Assume <InlineMath>{'P'}</InlineMath>. (2) By a chain of valid inference steps,
            conclude <InlineMath>{'Q'}</InlineMath>.
          </p>
        </div>
      </section>

      {/* ── Interactive ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · TRUTH TABLE BUILDER</span>
        </h2>
        <TruthTableWidget />
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · DIRECT PROOF: SUM OF EVEN INTEGERS</span>
        </h2>
        <div className="content-block">
          <p>
            <strong>Claim.</strong> If <InlineMath>{'m'}</InlineMath> and
            <InlineMath>{'\\;n'}</InlineMath> are even integers, then
            <InlineMath>{'\\;m + n'}</InlineMath> is even.
          </p>
          <p>
            <strong>Proof.</strong> Assume <InlineMath>{'m'}</InlineMath> and
            <InlineMath>{'n'}</InlineMath> are even. Then by definition there exist integers
            <InlineMath>{'\\;k_1, k_2'}</InlineMath> such that <InlineMath>{'m = 2k_1'}</InlineMath>
            and <InlineMath>{'n = 2k_2'}</InlineMath>. Therefore:
          </p>
          <DisplayMath>{String.raw`m + n = 2k_1 + 2k_2 = 2(k_1 + k_2).`}</DisplayMath>
          <p>
            Since <InlineMath>{'k_1 + k_2'}</InlineMath> is an integer,
            <InlineMath>{'\\;m + n'}</InlineMath> is divisible by 2 and hence even. ∎
          </p>
          <p>
            The structure is canonical: assume the hypothesis, apply a definition (even = 2k),
            manipulate algebraically, recognize the conclusion by the same definition. This is
            direct proof.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            Lecture 43 adds more proof strategies: proof by contradiction (assume the negation and
            derive a contradiction), mathematical induction (prove a base case and an inductive
            step), and proof by exhaustion. These tools together cover the vast majority of proofs
            encountered in linear algebra and analysis.
          </div>
        </div>
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span>
        </h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🔒</div>
              <h3>Safety Certificates</h3>
              <p>
                A formally verified safety controller provides a proof that the robot will never
                enter an unsafe state. The proof obligation is
                <InlineMath>{'\\forall x_0 \\in \\mathcal{X}_0,\\; \\forall t \\geq 0:\\; x(t) \\notin \\mathcal{X}_{\\text{unsafe}}'}</InlineMath>.
                Testing cannot cover all <InlineMath>{'x_0'}</InlineMath>; formal proof can.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧪</div>
              <h3>Correctness of Numerical Algorithms</h3>
              <p>
                Proving that Gaussian elimination with partial pivoting does not lose more than
                <InlineMath>{'\\;2^n'}</InlineMath> precision requires a rigorous bound on the
                growth factor — a direct proof with quantifiers ranging over all
                <InlineMath>{'\\;n\\times n'}</InlineMath> matrices.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📐</div>
              <h3>Stability Proofs</h3>
              <p>
                The proof that LQR produces a stable closed-loop (A−BK has all eigenvalues with
                negative real parts) uses the structure of the Riccati equation solution —
                a direct proof using the positive-definiteness of the cost matrices.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧠</div>
              <h3>Universal Approximation Theorem</h3>
              <p>
                The theorem states that a neural network with a single hidden layer can approximate
                any continuous function on a compact domain to arbitrary precision. The proof is a
                direct construction using the Stone-Weierstrass theorem — quantifiers and all.
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
            question="The implication P ⟹ Q is false only when:"
            options={[
              'P is false and Q is true',
              'Both P and Q are false',
              'P is true and Q is false',
              'P is false and Q is false',
            ]}
            correct={2}
            explanation="An implication P ⟹ Q fails only when the hypothesis is true but the conclusion is false. If P is false, the implication is vacuously true (you cannot blame someone for failing to satisfy a promise they were never required to make). Check: F⟹F = T, F⟹T = T, T⟹T = T, T⟹F = F."
          />
          <QuizQ
            num={2} type="Concept"
            question="What is the contrapositive of 'If n² is even, then n is even'?"
            options={[
              'If n is even, then n² is even',
              'If n is odd, then n² is odd',
              'If n² is odd, then n is odd',
              'If n is not odd, then n² is not odd',
            ]}
            correct={2}
            explanation="The contrapositive of P ⟹ Q is ¬Q ⟹ ¬P. Here P = 'n² is even', Q = 'n is even'. Contrapositive: 'If n is NOT even (n is odd), then n² is NOT even (n² is odd).' This is logically equivalent to the original and is often easier to prove directly."
          />
          <QuizQ
            num={3} type="Application"
            question="To prove ∀x ∈ ℝ, x² ≥ 0, which proof strategy is most direct?"
            options={[
              'Find a counterexample',
              'Proof by contradiction: assume x² < 0 and derive a contradiction',
              'Direct proof: write x² = x·x and use the definition of the real number product',
              'Proof by induction on x',
            ]}
            correct={2}
            explanation="Direct proof: for any real x, either x > 0, x = 0, or x < 0. In all cases x·x ≥ 0 (positive × positive = positive, zero × zero = zero, negative × negative = positive). So x² ≥ 0 for all real x. ∎ Induction applies to natural numbers, not reals; contradiction is valid but indirect when direct is simpler."
          />
          <QuizQ
            num={4} type="Transfer"
            question="A stability theorem states: 'If all eigenvalues of A have Re(λ) < 0, then ẋ = Ax is stable.' To disprove this theorem, you would need to:"
            options={[
              'Show that no eigenvalues can have negative real parts',
              'Find a matrix A where all eigenvalues have Re(λ) < 0 but the system ẋ = Ax is unstable',
              'Prove that stability implies negative eigenvalues',
              'Show that Re(λ) < 0 is not necessary for stability',
            ]}
            correct={1}
            explanation="To disprove ∀A [all Re(λ_i) < 0 ⟹ stability], you need one counterexample: a specific matrix A with all eigenvalues having Re < 0 but whose trajectories diverge. (In fact this theorem is true for autonomous LTI systems, so no such counterexample exists — but logically, one would suffice to disprove it.)"
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span>
        </h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item">
              <span className="review-day">Day 0</span>
              Write the truth table for <InlineMath>{'P \\Rightarrow Q'}</InlineMath>. State the
              contrapositive and verify they are logically equivalent.
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              Prove: if <InlineMath>{'n'}</InlineMath> is odd, then <InlineMath>{'n^2'}</InlineMath>
              is odd. Use a direct proof with <InlineMath>{'n = 2k+1'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              State De Morgan's laws. Apply them to simplify
              <InlineMath>{'\\neg(A \\land \\neg B)'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              Prove the contrapositive: if <InlineMath>{'n^2'}</InlineMath> is even, then
              <InlineMath>{'\\;n'}</InlineMath> is even. (Hint: prove the contrapositive — if
              <InlineMath>{'\\;n'}</InlineMath> is odd, then <InlineMath>{'n^2'}</InlineMath>
              is odd.)
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Without notes: state the direct proof strategy. What is a counterexample? When is
              the contrapositive strategy preferred?
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
