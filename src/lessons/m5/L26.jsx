import { useState } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET — 3-Link Planar Robot Arm (SVG)
//  Forward kinematics: given joint angles θ1, θ2, θ3 and link lengths L1,L2,L3,
//  compute the position of every joint and the end-effector.
// ════════════════════════════════════════════════════════════════════════════

const L1 = 60, L2 = 50, L3 = 40  // link lengths in SVG px

function RobotArmWidget() {
  const [t1, setT1] = useState(30)
  const [t2, setT2] = useState(-45)
  const [t3, setT3] = useState(20)

  const deg = Math.PI / 180
  const a1 = t1 * deg
  const a2 = (t1 + t2) * deg
  const a3 = (t1 + t2 + t3) * deg

  const x0 = 0, y0 = 0
  const x1 = x0 + L1 * Math.cos(a1)
  const y1 = y0 - L1 * Math.sin(a1)
  const x2 = x1 + L2 * Math.cos(a2)
  const y2 = y1 - L2 * Math.sin(a2)
  const x3 = x2 + L3 * Math.cos(a3)
  const y3 = y2 - L3 * Math.sin(a3)

  const eeAngle = ((t1 + t2 + t3) % 360).toFixed(1)
  const worldX = x3.toFixed(1)
  const worldY = (-y3).toFixed(1)

  const cx = 80, cy = 200

  return (
    <div className="widget">
      <p className="widget-caption">
        Drag the sliders to change each joint angle. The robot's forward kinematics — composing three
        rotation functions — moves the end-effector (red dot). The total orientation angle of the
        end-effector equals <InlineMath>{'\\theta_1 + \\theta_2 + \\theta_3'}</InlineMath> because planar
        rotations add under composition. Inverse trig (<InlineMath>{'\\mathrm{atan2}'}</InlineMath>)
        recovers the pointing direction from the endpoint coordinates.
      </p>
      <div className="widget-card">
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <svg width={300} height={260}
            style={{ background: '#f4f8fd', borderRadius: '8px', flexShrink: 0 }}>
            <line x1={cx} y1={cy} x2={cx + 80} y2={cy} stroke="#ccd3de" strokeWidth="1" />
            <line x1={cx} y1={cy} x2={cx} y2={cy - 70} stroke="#ccd3de" strokeWidth="1" />
            <text x={cx + 82} y={cy + 4} fontSize="10" fill="#8899bb">x</text>
            <text x={cx - 4} y={cy - 74} fontSize="10" fill="#8899bb">y</text>
            <line x1={cx + x1} y1={cy + y1} x2={cx} y2={cy} stroke="#1c7ed6" strokeWidth="5" strokeLinecap="round" />
            <line x1={cx + x1} y1={cy + y1} x2={cx + x2} y2={cy + y2} stroke="#e8590c" strokeWidth="5" strokeLinecap="round" />
            <line x1={cx + x2} y1={cy + y2} x2={cx + x3} y2={cy + y3} stroke="#099268" strokeWidth="5" strokeLinecap="round" />
            <circle cx={cx} cy={cy} r="7" fill="#2c3e50" />
            <circle cx={cx + x1} cy={cy + y1} r="5" fill="#2c3e50" />
            <circle cx={cx + x2} cy={cy + y2} r="5" fill="#2c3e50" />
            <circle cx={cx + x3} cy={cy + y3} r="6" fill="#c92a2a" />
            <text x={cx + 10} y={cy - 8} fontSize="10" fill="#1c7ed6">θ₁</text>
            <text x={cx + x1 + 8} y={cy + y1 - 6} fontSize="10" fill="#e8590c">θ₂</text>
            <text x={cx + x2 + 8} y={cy + y2 - 6} fontSize="10" fill="#099268">θ₃</text>
            <text x={cx + x3 + 6} y={cy + y3 - 6} fontSize="10" fill="#c92a2a">EE</text>
            <line x1={cx - 12} y1={cy + 1} x2={cx + 12} y2={cy + 1} stroke="#495057" strokeWidth="2" />
          </svg>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <div className="hud-panel">
              <div className="hud-row"><span style={{ color: '#1c7ed6' }}><InlineMath>{'\\theta_1'}</InlineMath></span><strong>{t1}°</strong></div>
              <div className="hud-row"><span style={{ color: '#e8590c' }}><InlineMath>{'\\theta_2'}</InlineMath></span><strong>{t2}°</strong></div>
              <div className="hud-row"><span style={{ color: '#099268' }}><InlineMath>{'\\theta_3'}</InlineMath></span><strong>{t3}°</strong></div>
              <div className="hud-row"><span>EE (x, y)</span><strong>({worldX}, {worldY})</strong></div>
              <div className="hud-row"><span>Total angle</span><strong>{eeAngle}°</strong></div>
            </div>
            <label className="slider-row">
              <span className="slider-label"><InlineMath>{'\\theta_1'}</InlineMath> = <b>{t1}°</b></span>
              <input type="range" min={-90} max={90} step={1} value={t1} onChange={e => setT1(Number(e.target.value))} />
            </label>
            <label className="slider-row">
              <span className="slider-label"><InlineMath>{'\\theta_2'}</InlineMath> = <b>{t2}°</b></span>
              <input type="range" min={-135} max={135} step={1} value={t2} onChange={e => setT2(Number(e.target.value))} />
            </label>
            <label className="slider-row">
              <span className="slider-label"><InlineMath>{'\\theta_3'}</InlineMath> = <b>{t3}°</b></span>
              <input type="range" min={-135} max={135} step={1} value={t3} onChange={e => setT3(Number(e.target.value))} />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L26() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#fef3e8', color: '#b05e0a', borderColor: '#fad5a5' }}>
          Module 5 · Lecture 26 · ROB 201
        </div>
        <h1 className="lesson-title">Functions &amp; Inverse Trigonometry</h1>
        <p className="lesson-subtitle">
          Every computation is a function — a rule that takes inputs and produces unique outputs. This
          lecture builds the precise vocabulary: domain, codomain, range, composition, and the
          strict-monotonicity condition that allows an inverse to exist. We then meet the inverse
          trigonometric functions that robot kinematics depends on daily.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            A function is a reliable machine: feed it an input and it produces a unique output. You have
            used functions your whole life — squaring a number, computing a sine, applying a matrix to a
            vector. What calculus adds is the question of how the output changes when the input changes
            by a tiny amount. Before we can ask that question precisely, we need to know what the
            function's inputs and outputs actually are — its <strong>domain</strong> and
            <strong> range</strong> — and we need to understand how functions combine.
          </p>
          <p>
            The inverse-function question is the fundamental robotics question. A robot arm's
            <em> forward kinematics</em> is a function: joint angles in, end-effector position out.
            Engineers build and program forward kinematics first because it is straightforward — just
            follow the chain of rotations. But to actually command the arm, you need the
            <em> inverse</em>: desired position in, required joint angles out. That inverse exists
            only when the forward function is a bijection — one input maps to one output and vice versa.
            For simple one-link arms the inverse is exact. For three-link arms it may have multiple
            solutions or none.
          </p>
          <p>
            The inverse trigonometric functions — arcsin, arccos, arctan — are the essential tools for
            extracting angles from coordinates. Every atan2 call in robot navigation, every pose recovery
            in computer vision, every joint-angle computation in inverse kinematics passes through these
            functions. The domain restrictions that define them are not arbitrary: they encode which
            branch of the multi-valued inverse you are computing.
          </p>
        </div>
      </section>

      {/* ── Formalism: functions ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · FUNCTIONS, DOMAIN &amp; RANGE</span>
        </h2>
        <div className="content-block">
          <p>
            A <strong>function</strong> <InlineMath>{'f: D \\to C'}</InlineMath> assigns to every element
            <InlineMath>{'\\;x'}</InlineMath> in the <strong>domain</strong> <InlineMath>{'D'}</InlineMath>
            exactly one element <InlineMath>{'f(x)'}</InlineMath> in the <strong>codomain</strong>
            <InlineMath>{'\\;C'}</InlineMath>. The <strong>range</strong> (image) is the subset of
            <InlineMath>{'C'}</InlineMath> actually achieved:
          </p>
          <DisplayMath>{String.raw`\mathrm{range}(f) = \{f(x) : x \in D\} \;\subseteq\; C.`}</DisplayMath>
          <p>
            A function is <strong>injective</strong> (one-to-one) if distinct inputs give distinct outputs:
            <InlineMath>{'\\;x_1 \\ne x_2 \\Rightarrow f(x_1) \\ne f(x_2)'}</InlineMath>. It is
            <strong> surjective</strong> (onto) if its range equals all of <InlineMath>{'C'}</InlineMath>.
            A function that is both is a <strong>bijection</strong>, and bijections have well-defined
            inverses.
          </p>
          <p>
            A function is <strong>strictly monotone increasing</strong> on an interval if
            <InlineMath>{'\\;x_1 < x_2 \\Rightarrow f(x_1) < f(x_2)'}</InlineMath>. Strict monotonicity
            implies injectivity — so a strictly monotone function on a closed interval
            <InlineMath>{'\\;[a,b]'}</InlineMath> is guaranteed to have an inverse on its range.
          </p>
        </div>
      </section>

      {/* ── Formalism: composition ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · FUNCTION COMPOSITION</span>
        </h2>
        <div className="content-block">
          <p>
            Given <InlineMath>{'f: D \\to C'}</InlineMath> and <InlineMath>{'g: C \\to E'}</InlineMath>,
            the <strong>composition</strong> <InlineMath>{'g \\circ f : D \\to E'}</InlineMath> is defined
            by
          </p>
          <DisplayMath>{String.raw`(g \circ f)(x) = g(f(x)).`}</DisplayMath>
          <p>
            Composition is generally <em>not</em> commutative:
            <InlineMath>{'\\;g \\circ f \\ne f \\circ g'}</InlineMath>. For the planar robot arm, each
            joint adds its angle to the accumulated rotation. The full forward kinematics is
            <InlineMath>{'\\;\\mathrm{FK} = R_3 \\circ R_2 \\circ R_1'}</InlineMath>, and the end-effector
            orientation angle is <InlineMath>{'\\theta_1 + \\theta_2 + \\theta_3'}</InlineMath> precisely
            because 2D rotations compose by addition.
          </p>
          <div className="callout callout-success">
            <strong>Composition and the chain rule.</strong> Lecture 34 will show that the derivative of
            <InlineMath>{'\\;g \\circ f'}</InlineMath> at <InlineMath>{'x'}</InlineMath> is
            <InlineMath>{'\\;g^{\\prime}(f(x)) \\cdot f^{\\prime}(x)'}</InlineMath>. This is the chain rule, and the
            "chain" is literal: each link in the function composition contributes a multiplicative
            derivative factor.
          </div>
        </div>
      </section>

      {/* ── Formalism: inverse trig ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · INVERSE TRIGONOMETRIC FUNCTIONS</span>
        </h2>
        <div className="content-block">
          <p>
            The sine function <InlineMath>{'\\sin : \\mathbb{R} \\to [-1, 1]'}</InlineMath> is not injective
            — it repeats every <InlineMath>{'2\\pi'}</InlineMath>. To invert it we restrict to a domain
            where it is strictly monotone. The standard choice is <InlineMath>{'[-\\pi/2, \\pi/2]'}</InlineMath>,
            where sine increases from <InlineMath>{'\\;-1'}</InlineMath> to <InlineMath>{'\\;1'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`\arcsin : [-1,1] \to \left[-\frac{\pi}{2},\frac{\pi}{2}\right].`}</DisplayMath>
          <p>
            Restricting cosine to <InlineMath>{'[0,\\pi]'}</InlineMath> (strictly decreasing, injective)
            and tangent to <InlineMath>{'(-\\pi/2, \\pi/2)'}</InlineMath> (strictly increasing):
          </p>
          <DisplayMath>{String.raw`\arccos : [-1,1] \to [0,\pi],\qquad \arctan : \mathbb{R} \to \left(-\frac{\pi}{2},\frac{\pi}{2}\right).`}</DisplayMath>
          <p>
            For robotics the most important variant is the <strong>two-argument arctangent</strong>
            <InlineMath>{'\\;\\mathrm{atan2}(y, x)'}</InlineMath>, which recovers the full-circle angle
            in <InlineMath>{'(-\\pi, \\pi]'}</InlineMath> by examining which quadrant
            <InlineMath>{'\\;(x, y)'}</InlineMath> lies in:
          </p>
          <DisplayMath>{String.raw`\mathrm{atan2}(y, x) = \begin{cases}\arctan(y/x) & x > 0,\\\arctan(y/x)+\pi & x < 0,\; y\ge 0,\\\arctan(y/x)-\pi & x < 0,\; y < 0,\\ +\pi/2 & x=0,\; y>0,\\ -\pi/2 & x=0,\; y<0.\end{cases}`}</DisplayMath>
          <div className="callout callout-warning">
            <strong>atan vs atan2.</strong> Single-argument <InlineMath>{'\\arctan(y/x)'}</InlineMath>
            loses the quadrant — it cannot distinguish <InlineMath>{'45°'}</InlineMath> from
            <InlineMath>{'\\;225°'}</InlineMath> because both have <InlineMath>{'y/x = 1'}</InlineMath>.
            Always use <InlineMath>{'\\mathrm{atan2}(y, x)'}</InlineMath> in code when recovering a
            full-circle angle from two-dimensional coordinates.
          </div>
        </div>
      </section>

      {/* ── Interactive ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · 3-LINK ROBOT ARM FORWARD KINEMATICS</span>
        </h2>
        <RobotArmWidget />
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · RECOVERING A JOINT ANGLE WITH atan2</span>
        </h2>
        <div className="content-block">
          <p>
            A single-link arm of length <InlineMath>{'L = 1'}</InlineMath> has its end-effector at
            <InlineMath>{'\\;(x, y) = (-0.5,\\; 0.866)'}</InlineMath>. Find the joint angle
            <InlineMath>{'\\;\\theta'}</InlineMath>.
          </p>
          <p>
            Forward kinematics: <InlineMath>{'x = \\cos\\theta'}</InlineMath>,
            <InlineMath>{'\\;y = \\sin\\theta'}</InlineMath>. Since <InlineMath>{'x < 0'}</InlineMath>
            and <InlineMath>{'y > 0'}</InlineMath> (second quadrant):
          </p>
          <DisplayMath>{String.raw`\theta = \mathrm{atan2}(0.866, -0.5) = \arctan\!\left(\frac{0.866}{-0.5}\right) + \pi = -\frac{\pi}{3} + \pi = \frac{2\pi}{3} \approx 120°.`}</DisplayMath>
          <p>
            The single-argument <InlineMath>{'\\arctan(-\\sqrt{3}) = -60°'}</InlineMath> gives the wrong
            quadrant. The <InlineMath>{'\\mathrm{atan2}'}</InlineMath> correction of
            <InlineMath>{'\\;+\\pi'}</InlineMath> places the angle correctly at
            <InlineMath>{'\\;120°'}</InlineMath>.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            <strong>Building toward limits.</strong> You now have precise language for what a function
            is, what its domain and range are, and how to compose and invert functions under
            monotonicity. Lecture 27 asks: <em>what value does a function approach as its input
            approaches some point?</em> This is the formal limit — and whether the limit equals the
            function's actual value at that point is precisely continuity, the subject of Lecture 28.
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
              <div className="app-icon">🦾</div>
              <h3>Inverse Kinematics</h3>
              <p>
                Given a desired end-effector position, inverse kinematics recovers joint angles using
                atan2. For a 2-link arm, closed-form solutions exist. For 6-DOF arms, numerical methods
                (Newton-Raphson, Lecture 19) iterate from an initial guess built on atan2 calls.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧭</div>
              <h3>Heading from Odometry</h3>
              <p>
                A wheeled robot integrating encoder ticks accumulates displacement
                <InlineMath>{'\\;(\\Delta x, \\Delta y)'}</InlineMath>. The heading is
                <InlineMath>{'\\;\\psi = \\mathrm{atan2}(\\Delta y, \\Delta x)'}</InlineMath> — a direct
                application of the two-argument arctangent to recover a full-circle angle.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧬</div>
              <h3>Neural Activation Functions</h3>
              <p>
                The sigmoid <InlineMath>{'\\sigma(x) = 1/(1+e^{-x})'}</InlineMath> is a strictly increasing
                bijection from <InlineMath>{'\\mathbb{R}'}</InlineMath> to <InlineMath>{'(0,1)'}</InlineMath>.
                Its inverse <InlineMath>{'\\log(p/(1-p))'}</InlineMath> (the logit) is used in logistic
                regression — a composition of logarithm and a rational function.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📷</div>
              <h3>Euler Angles from Rotation Matrices</h3>
              <p>
                Extracting roll-pitch-yaw from a <InlineMath>{'3\\times3'}</InlineMath> rotation matrix
                uses arcsin and atan2 with exactly the domain restrictions defined here. Gimbal-lock
                singularities arise precisely when the function loses injectivity at the boundary of its
                domain.
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
            question="Why does sin: ℝ → ℝ not have an inverse without a domain restriction?"
            options={[
              'Because sin is not continuous on ℝ',
              'Because sin is not surjective — its range is only [−1, 1]',
              'Because sin is not injective — sin(0) = sin(π) = 0, so two inputs map to the same output',
              'Because sin maps ℝ to an uncountably infinite set',
            ]}
            correct={2}
            explanation="An inverse requires injectivity (one-to-one). sin(0) = sin(π) = sin(2π) = 0, so distinct inputs give the same output. Restricting to [−π/2, π/2] makes sine strictly increasing and therefore injective, enabling the inverse arcsin."
          />
          <QuizQ
            num={2} type="Computation"
            question="A unit-length arm reaches (−0.707, −0.707). Use atan2 to find the joint angle θ (in degrees)."
            options={['−45°', '225°', '−135°', '135°']}
            correct={2}
            explanation="Both x and y are negative (third quadrant). atan(y/x) = atan(1) = 45°. Since x < 0 and y < 0, atan2 = 45° − 180° = −135°. (atan2 returns values in (−180°, 180°].)"
          />
          <QuizQ
            num={3} type="Concept"
            question="In the 3-link arm widget, the total end-effector orientation equals θ₁ + θ₂ + θ₃. Why?"
            options={[
              'Because all three links have the same length',
              'Because planar rotations compose by addition: a rotation by α followed by β gives net rotation α + β',
              'Because the links are rigid and cannot flex',
              'Because all angles are measured from the same absolute reference frame',
            ]}
            correct={1}
            explanation="A planar rotation by θ₁ followed by θ₂ gives net rotation θ₁ + θ₂ — this is the composition law for 2D rotations. Each joint adds its angle to the running total, so the absolute orientation of the end-effector is the sum of all joint angles."
          />
          <QuizQ
            num={4} type="Transfer"
            question="arcsin returns values only in [−π/2, π/2]. A sensor reports sin(θ) = 0.5. What are all possible θ in [0°, 360°), and which does arcsin return?"
            options={[
              'θ = 30° only; arcsin returns 30°',
              'θ ∈ {30°, 150°}; arcsin returns 30°',
              'θ ∈ {30°, 150°, 210°, 330°}; arcsin returns 30°',
              'θ = 150° only; arcsin returns 150°',
            ]}
            correct={1}
            explanation="sin(θ) = 0.5 has two solutions in [0°, 360°): θ = 30° (first quadrant) and θ = 150° (second quadrant). arcsin can only return 30° since its range is [−90°, 90°]. Distinguishing 30° from 150° requires additional information, such as the sign of cos(θ)."
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
              State the definitions of domain, codomain, range, injective, surjective, and bijective.
              Give one concrete example of each: a function that is injective but not surjective, and one
              that is surjective but not injective.
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              State the domain and range of arcsin, arccos, and arctan without notes. Explain in one
              sentence why strict monotonicity implies injectivity.
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Given end-effector coordinates <InlineMath>{'(-1, 0)'}</InlineMath> for a unit-length arm,
              compute <InlineMath>{'\\theta = \\mathrm{atan2}(0, -1)'}</InlineMath> step-by-step and explain
              why single-argument arctan gives the wrong answer.
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              Set <InlineMath>{'\\theta_1 = 45°, \\theta_2 = -90°, \\theta_3 = 45°'}</InlineMath> in
              the arm. What is the total orientation? Trace each composition step, explaining why
              the endpoint orientation is the sum of all joint angles.
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Explain in under 2 minutes: what makes a function invertible, why sine needs a domain
              restriction, and why atan2 is preferred over arctan in robotics code.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
