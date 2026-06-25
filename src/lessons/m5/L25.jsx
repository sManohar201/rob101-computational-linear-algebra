import { useState } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — Archimedes' polygon bounding of π.
//  An inscribed N-gon (blue) gives a lower bound; a circumscribed N-gon
//  (orange) gives an upper bound. Slide N and watch the two bounds converge.
// ════════════════════════════════════════════════════════════════════════════

function ArchimedesWidget() {
  const [N, setN] = useState(6)

  const alpha = Math.PI / N
  const piLow  = N * Math.sin(alpha)   // inscribed perimeter / 2
  const piHigh = N * Math.tan(alpha)   // circumscribed perimeter / 2
  const errorBound = (piHigh - piLow) / 2

  const pts = (radius) =>
    Array.from({ length: N }, (_, i) => {
      const θ = (2 * Math.PI * i) / N - Math.PI / 2
      return `${(radius * Math.cos(θ)).toFixed(4)},${(radius * Math.sin(θ)).toFixed(4)}`
    }).join(' ')

  const circumR = 1 / Math.cos(alpha)

  return (
    <div className="widget">
      <p className="widget-caption">
        The blue polygon is <em>inscribed</em> (vertices on the circle) — its perimeter is shorter than the
        circumference, so it underestimates π. The orange polygon is <em>circumscribed</em> (sides tangent
        to the circle) — its perimeter is longer, so it overestimates. As you increase <InlineMath>{'N'}</InlineMath>,
        both polygons hug the circle more tightly and the bounds squeeze toward <InlineMath>{'\\pi'}</InlineMath>.
      </p>
      <div className="widget-card">
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <svg viewBox="-1.45 -1.45 2.9 2.9"
            style={{ width: '210px', minWidth: '180px', flexShrink: 0, background: '#f4f8fd', borderRadius: '8px' }}>
            {/* unit circle (dashed reference) */}
            <circle cx="0" cy="0" r="1" fill="none" stroke="#8899bb" strokeWidth="0.025" strokeDasharray="0.07 0.04" />
            {/* circumscribed */}
            <polygon points={pts(circumR)} fill="rgba(232,89,12,0.07)" stroke="#e8590c" strokeWidth="0.028" />
            {/* inscribed */}
            <polygon points={pts(1)} fill="rgba(28,126,214,0.07)" stroke="#1c7ed6" strokeWidth="0.028" />
            <circle cx="0" cy="0" r="0.045" fill="#495057" />
          </svg>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <div className="hud-panel">
              <div className="hud-row"><span>Sides <InlineMath>{'N'}</InlineMath></span><strong>{N}</strong></div>
              <div className="hud-row">
                <span style={{ color: '#1c7ed6' }}><InlineMath>{'\\pi^{\\rm low}'}</InlineMath></span>
                <strong>{piLow.toFixed(5)}</strong>
              </div>
              <div className="hud-row">
                <span style={{ color: '#e8590c' }}><InlineMath>{'\\pi^{\\rm up}'}</InlineMath></span>
                <strong>{piHigh.toFixed(5)}</strong>
              </div>
              <div className="hud-row"><span>True <InlineMath>{'\\pi'}</InlineMath></span><strong>3.14159…</strong></div>
              <div className="hud-row">
                <span>Error <InlineMath>{'\\pm'}</InlineMath></span>
                <strong style={{ color: '#099268' }}>{errorBound.toFixed(5)}</strong>
              </div>
            </div>
            <label className="slider-row">
              <span className="slider-label">Sides <InlineMath>{'N'}</InlineMath> = <b>{N}</b></span>
              <input type="range" min={3} max={96} step={1} value={N}
                onChange={e => setN(Number(e.target.value))} />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — Convergence of (1 + 1/n)^n to Euler's e.
//  An SVG polyline traces the approach; the dashed green line marks e.
// ════════════════════════════════════════════════════════════════════════════

function EulerWidget() {
  const [n, setN] = useState(1)

  const val = Math.pow(1 + 1 / n, n)
  const err = Math.E - val

  // Build up to 200 sample points for the chart
  const samples = Math.min(n, 200)
  const pts = Array.from({ length: samples }, (_, i) => {
    const k = Math.round(1 + (i / (samples - 1 || 1)) * (n - 1))
    return Math.pow(1 + 1 / k, k)
  })

  const W = 200, H = 120
  const xOf = (i) => (i / (pts.length - 1 || 1)) * W
  const yOf = (v) => H - ((v - 2.0) / 0.8) * H
  const eY = yOf(Math.E)

  const polyline = pts.map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ')

  return (
    <div className="widget">
      <p className="widget-caption">
        Drag the slider to increase <InlineMath>{'n'}</InlineMath> and watch <InlineMath>{'(1+1/n)^n'}</InlineMath> climb
        toward the dashed green line — Euler's number <InlineMath>{'e'}</InlineMath>. Each additional compounding
        interval adds less than the last. The approach is monotone from below: the sequence is always an
        <em> underestimate</em> of <InlineMath>{'e'}</InlineMath>.
      </p>
      <div className="widget-card">
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <svg width={W} height={H}
            style={{ background: '#f4f8fd', borderRadius: '6px', flexShrink: 0 }}>
            {/* e reference line */}
            <line x1="0" y1={eY.toFixed(1)} x2={W} y2={eY.toFixed(1)}
              stroke="#099268" strokeWidth="1.2" strokeDasharray="5 3" />
            <text x="4" y={(eY - 3).toFixed(1)} fontSize="9" fill="#099268">e ≈ 2.71828</text>
            {/* convergence curve */}
            {pts.length > 1 && (
              <polyline points={polyline} fill="none" stroke="#1c7ed6" strokeWidth="1.8" />
            )}
            {/* current value dot */}
            <circle
              cx={xOf(pts.length - 1).toFixed(1)}
              cy={yOf(val).toFixed(1)}
              r="4" fill="#e8590c" />
            {/* axis labels */}
            <text x="2" y={H - 2} fontSize="9" fill="#8899bb">n=1</text>
            <text x={W - 34} y={H - 2} fontSize="9" fill="#8899bb">n={n}</text>
          </svg>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <div className="hud-panel">
              <div className="hud-row"><span><InlineMath>{'n'}</InlineMath></span><strong>{n}</strong></div>
              <div className="hud-row">
                <span><InlineMath>{'(1+1/n)^n'}</InlineMath></span>
                <strong>{val.toFixed(6)}</strong>
              </div>
              <div className="hud-row"><span>True <InlineMath>{'e'}</InlineMath></span><strong>2.718282</strong></div>
              <div className="hud-row">
                <span>Error <InlineMath>{'e - (1+1/n)^n'}</InlineMath></span>
                <strong style={{ color: '#c2255c' }}>{err.toFixed(6)}</strong>
              </div>
            </div>
            <label className="slider-row">
              <span className="slider-label"><InlineMath>{'n'}</InlineMath> = <b>{n}</b></span>
              <input type="range" min={1} max={500} step={1} value={n}
                onChange={e => setN(Number(e.target.value))} />
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

export default function L25() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#fef3e8', color: '#b05e0a', borderColor: '#fad5a5' }}>
          Module 5 · Lecture 25 · ROB 201
        </div>
        <h1 className="lesson-title">Pre-Calculus Foundations &amp; Bounding</h1>
        <p className="lesson-subtitle">
          Calculus is the mathematics of the continuous — but in engineering, we rarely know continuous
          quantities exactly. This lecture builds the scaffolding: how to trap an unknown between two known
          bounds, and how that discipline connects to the two most important constants in analysis,
          <InlineMath>{'\\pi'}</InlineMath> and <InlineMath>{'e'}</InlineMath>.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Before computers could represent numbers with 64-bit floating-point precision — before calculus
            existed — mathematicians needed a way to reason rigorously about quantities they could not pin
            down exactly. Their answer was beautifully practical: don't find the answer, <em>trap</em> it.
            Establish a lower fence and an upper fence, and prove that the truth lies between them. As long
            as the gap between the fences is small enough for your purposes, you're done.
          </p>
          <p>
            Archimedes used exactly this idea around 250 BCE to compute <InlineMath>{'\\pi'}</InlineMath>
            to three decimal places — centuries before modern algebra. He drew a polygon <em>inside</em>
            a circle (shorter perimeter, so the polygon underestimates the circumference) and a polygon
            <em> outside</em> the circle (longer perimeter, so it overestimates). Both bound the
            circumference from opposite sides. Adding more sides squeezed the bounds together. The method
            is the ancestor of every numerical analysis algorithm in this course.
          </p>
          <p>
            In modern robotics, the same principle appears constantly. A GPS receiver does not report a
            precise position — it reports a position plus an uncertainty radius. A Kalman filter does not
            track an exact state — it tracks a mean with covariance bounds. The whole edifice of reliable
            autonomous systems is built on the discipline of maintaining honest bounds on what you know.
            This lecture gives you the formal language for that discipline.
          </p>
        </div>
      </section>

      {/* ── Formalism: confidence bounds ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · CONFIDENCE BOUNDS</span>
        </h2>
        <div className="content-block">
          <p>
            For any unknown quantity <InlineMath>{'x'}</InlineMath>, a <strong>confidence bound</strong>
            is a pair of computable values satisfying
          </p>
          <DisplayMath>{String.raw`x^{\rm low} \le x \le x^{\rm up}.`}</DisplayMath>
          <p>
            The <strong>error metric</strong> summarizes how tight the bound is — it is the half-width of
            the interval:
          </p>
          <DisplayMath>{String.raw`x^{\rm error} = \frac{x^{\rm up} - x^{\rm low}}{2}.`}</DisplayMath>
          <p>
            The estimate you would report is the midpoint
            <InlineMath>{'\\;x^{\\rm est} = \\tfrac{1}{2}(x^{\\rm low}+x^{\\rm up})'}</InlineMath>,
            and you can guarantee <InlineMath>{'|x - x^{\\rm est}| \\le x^{\\rm error}'}</InlineMath>.
            Notice what this machinery gives you: a correct statement about an irrational or uncertain
            quantity, derived entirely from rational arithmetic or simple geometry.
          </p>
          <div className="callout callout-success">
            <strong>Key property: bounds compose under addition.</strong> If
            <InlineMath>{'\\;a^{\\rm low}\\le a\\le a^{\\rm up}'}</InlineMath> and
            <InlineMath>{'\\;b^{\\rm low}\\le b\\le b^{\\rm up}'}</InlineMath>, then
            <DisplayMath>{String.raw`a^{\rm low}+b^{\rm low} \;\le\; a+b \;\le\; a^{\rm up}+b^{\rm up}.`}</DisplayMath>
            Scalar multiplication by <InlineMath>{'c>0'}</InlineMath> scales both bounds by
            <InlineMath>{'\\;c'}</InlineMath>; multiplication by <InlineMath>{'c<0'}</InlineMath>
            flips the inequality. These rules let you propagate bounds through arithmetic without losing
            correctness.
          </div>
        </div>
      </section>

      {/* ── Formalism: Archimedes' π ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · ARCHIMEDES' BOUNDING OF π</span>
        </h2>
        <div className="content-block">
          <p>
            Consider a unit circle (radius <InlineMath>{'R = 1'}</InlineMath>, circumference
            <InlineMath>{'\\;2\\pi'}</InlineMath>). Inscribe a regular <InlineMath>{'N'}</InlineMath>-gon
            inside it. Each of the <InlineMath>{'N'}</InlineMath> equal arcs subtends a central angle
            <InlineMath>{'\\;2\\alpha = 2\\pi/N'}</InlineMath>, so <InlineMath>{'\\alpha = \\pi/N'}</InlineMath>.
            Each chord has length <InlineMath>{'2\\sin\\alpha'}</InlineMath>, giving inscribed perimeter
            <InlineMath>{'\\;2N\\sin(\\pi/N)'}</InlineMath>. Since the straight chord is shorter than the
            arc it subtends,
          </p>
          <DisplayMath>{String.raw`\pi^{\rm low} = N\sin\!\left(\frac{\pi}{N}\right) \;\le\; \pi.`}</DisplayMath>
          <p>
            For the circumscribed <InlineMath>{'N'}</InlineMath>-gon (sides tangent to the circle), each
            half-side has length <InlineMath>{'\\tan\\alpha'}</InlineMath>, giving circumscribed perimeter
            <InlineMath>{'\\;2N\\tan(\\pi/N)'}</InlineMath>. Since the tangent segment is longer than the
            arc,
          </p>
          <DisplayMath>{String.raw`\pi \;\le\; N\tan\!\left(\frac{\pi}{N}\right) = \pi^{\rm up}.`}</DisplayMath>
          <p>
            Together: <InlineMath>{'N\\sin(\\pi/N) \\le \\pi \\le N\\tan(\\pi/N)'}</InlineMath>. The
            bounds converge because both <InlineMath>{'\\sin(\\pi/N)'}</InlineMath> and
            <InlineMath>{'\\tan(\\pi/N)'}</InlineMath> approach <InlineMath>{'\\pi/N'}</InlineMath> as
            <InlineMath>{'\\;N\\to\\infty'}</InlineMath> — a preview of the limit
            <InlineMath>{'\\;\\lim_{\\theta\\to0}\\sin\\theta/\\theta = 1'}</InlineMath> we will prove
            formally in Lecture 28.
          </p>
        </div>
      </section>

      {/* ── Interactive: Archimedes ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · POLYGON π BOUNDING</span>
        </h2>
        <ArchimedesWidget />
      </section>

      {/* ── Formalism: Euler's e ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · EULER'S NUMBER e</span>
        </h2>
        <div className="content-block">
          <p>
            Suppose a bank pays annual interest rate <InlineMath>{'r = 1'}</InlineMath> (100%), compounded
            <InlineMath>{'\\;n'}</InlineMath> times per year. Starting with 1 dollar, after one year you
            have <InlineMath>{'(1 + 1/n)^n'}</InlineMath>. What happens as compounding becomes continuous —
            <InlineMath>{'n\\to\\infty'}</InlineMath>?
          </p>
          <DisplayMath>{String.raw`e \;=\; \lim_{n\to\infty}\left(1+\frac{1}{n}\right)^n \;\approx\; 2.71828\ldots`}</DisplayMath>
          <p>
            This is <strong>Euler's number</strong> <InlineMath>{'e'}</InlineMath>. More generally,
            continuous compounding at rate <InlineMath>{'r'}</InlineMath> gives
          </p>
          <DisplayMath>{String.raw`e^r \;=\; \lim_{n\to\infty}\left(1+\frac{r}{n}\right)^n,`}</DisplayMath>
          <p>
            which defines the exponential function <InlineMath>{'e^r'}</InlineMath> for all real
            <InlineMath>{'\\;r'}</InlineMath>. The sequence <InlineMath>{'(1+1/n)^n'}</InlineMath> is
            monotone increasing and bounded above by <InlineMath>{'e'}</InlineMath> — so every finite
            <InlineMath>{'\\;n'}</InlineMath> gives a lower bound, and bounding machinery applies here
            too. We will see <InlineMath>{'e'}</InlineMath> again in every ODE solution, every matrix
            exponential, and every Laplace transform in Part 2.
          </p>
          <div className="callout callout-success">
            <strong>The binomial theorem connects these ideas.</strong> Expanding
            <InlineMath>{'\\;(1+1/n)^n'}</InlineMath> via the binomial theorem and taking
            <InlineMath>{'\\;n\\to\\infty'}</InlineMath> yields the Maclaurin series for
            <InlineMath>{'\\;e'}</InlineMath>:
            <DisplayMath>{String.raw`e = 1 + 1 + \frac{1}{2!} + \frac{1}{3!} + \cdots = \sum_{k=0}^{\infty}\frac{1}{k!},`}</DisplayMath>
            which converges rapidly enough that partial sums give excellent lower bounds for
            <InlineMath>{'\\;e'}</InlineMath>. We derive this series properly in Lecture 34.
          </div>
        </div>
      </section>

      {/* ── Interactive: Euler's e ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · COMPOUNDING CONVERGENCE TO e</span>
        </h2>
        <EulerWidget />
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · BOUNDING π WITH A 12-GON</span>
        </h2>
        <div className="content-block">
          <p>
            Take <InlineMath>{'N = 12'}</InlineMath>. Then <InlineMath>{'\\alpha = \\pi/12 = 15^\\circ'}</InlineMath>.
            Using the half-angle identities:
            <InlineMath>{'\\;\\sin 15^\\circ = (\\sqrt{6}-\\sqrt{2})/4'}</InlineMath> and
            <InlineMath>{'\\;\\cos 15^\\circ = (\\sqrt{6}+\\sqrt{2})/4'}</InlineMath>, so
            <InlineMath>{'\\;\\tan 15^\\circ = \\sqrt{6}-\\sqrt{2}'}</InlineMath> (approximately
            <InlineMath>{'\\;0.26795'}</InlineMath>).
          </p>
          <DisplayMath>{String.raw`\pi^{\rm low} = 12\sin 15^{\circ} \approx 12 \times 0.25882 = 3.10583`}</DisplayMath>
          <DisplayMath>{String.raw`\pi^{\rm up} = 12\tan 15^{\circ} \approx 12 \times 0.26795 = 3.21539`}</DisplayMath>
          <p>
            So <InlineMath>{'3.10583 \\le \\pi \\le 3.21539'}</InlineMath>, with
            error <InlineMath>{'(3.21539 - 3.10583)/2 \\approx 0.0548'}</InlineMath>. Not bad for a
            polygon you could draw with a compass. Archimedes used a 96-gon
            (<InlineMath>{'N = 96'}</InlineMath>) to establish <InlineMath>{'3\\tfrac{10}{71} < \\pi < 3\\tfrac{10}{70}'}</InlineMath>,
            a bound that survived as the engineering standard for over a millennium. Try it in the widget above.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            <strong>Foundations established.</strong> You now have the formal language of confidence
            bounds — <InlineMath>{'x^{\\rm low} \\le x \\le x^{\\rm up}'}</InlineMath> — and two
            canonical examples: Archimedes' polygon bounding of <InlineMath>{'\\pi'}</InlineMath> and the
            discrete-to-continuous limit defining <InlineMath>{'e'}</InlineMath>. Lecture 26 introduces
            the concept of a <em>function</em> (domain, range, composition) and the inverse trigonometric
            functions that Archimedes' geometry is silently using. Lectures 27–28 make the "both bounds
            converge" argument rigorous with the formal definition of a limit and the Squeeze Theorem.
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
              <div className="app-icon">📡</div>
              <h3>Sensor Confidence Intervals</h3>
              <p>
                Every range sensor, IMU, or LIDAR channel ships with a datasheet bound:
                <InlineMath>{'\\;d^{\\rm true} \\in [d^{\\rm meas} \\pm \\epsilon]'}</InlineMath>. The
                path planner must commit to the worst-case boundary, not the measured value, to guarantee
                collision-free trajectories.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📐</div>
              <h3>Numerical Root-Finding</h3>
              <p>
                Bisection search (Lecture 17, revisited in Lecture 35) works entirely in confidence bounds:
                it halves the bracket at each step, giving a certified bound on the root location with
                <InlineMath>{'\\;x^{\\rm error} = (b-a)/2^k'}</InlineMath> after
                <InlineMath>{'\\;k'}</InlineMath> steps.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🎰</div>
              <h3>Kalman Filter Covariance</h3>
              <p>
                The Kalman filter (Lecture 53) maintains a Gaussian uncertainty ellipse. Its diagonal entries
                are the variance bounds on each state coordinate — the multivariate generalization of
                <InlineMath>{'\\;x^{\\rm error}'}</InlineMath>. The filter narrows those bounds each time a
                measurement arrives.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">⚡</div>
              <h3>Continuous Compounding in Control</h3>
              <p>
                The matrix exponential <InlineMath>{'e^{At}'}</InlineMath> (Lecture 37) propagates a
                continuous-time state <InlineMath>{'\\dot{x}=Ax'}</InlineMath> forward in time. Its
                derivation mirrors the compound-interest limit: discretize, take step-size to zero, and
                recover the continuous solution.
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
            question="What makes a confidence bound useful even when the exact value of x is unknown?"
            options={[
              'It gives the exact value of x to arbitrary precision',
              'It certifies that the truth lies in a known interval, enabling worst-case safety guarantees',
              'It converts irrational numbers to rational ones',
              'It requires measuring x first before applying the bound',
            ]}
            correct={1}
            explanation="A confidence bound xᴸᵒʷ ≤ x ≤ xᵘᵖ is a provable statement about where the truth lies. You don't need the exact value — you need to know the worst-case, which the bound directly provides."
          />
          <QuizQ
            num={2} type="Computation"
            question="For a regular N = 6 hexagon inscribed in a unit circle, what is π^low = N·sin(π/N)?"
            options={['2.598', '3.000', '3.141', '3.464']}
            correct={1}
            explanation="With N=6: α = π/6 = 30°, sin(30°) = 0.5, so π^low = 6 × 0.5 = 3.000. The inscribed hexagon perimeter is exactly 6 (each side = 1 = circle radius), giving the lower bound 3.000."
          />
          <QuizQ
            num={3} type="Concept"
            question="The sequence (1 + 1/n)^n is monotone increasing and bounded above by e. What does this imply about its use as a bound on e?"
            options={[
              'Every finite n gives an overestimate of e',
              'Every finite n gives an underestimate of e, i.e., a lower bound',
              'The sequence overshoots e for large n before converging',
              'The sequence gives neither a lower nor an upper bound',
            ]}
            correct={1}
            explanation="Since (1+1/n)^n is strictly less than e for all finite n and approaches e from below, every evaluation gives a lower bound: (1+1/n)^n ≤ e. The sequence provides certified underestimates."
          />
          <QuizQ
            num={4} type="Transfer"
            question="A GPS module reports position with ±2.5 m accuracy. A robot must stop 1 m from a wall. What is the closest nominal reported distance at which it must begin braking?"
            options={['1.0 m', '2.5 m', '3.5 m', '0.0 m']}
            correct={2}
            explanation="The true distance could be 2.5 m less than the reported value (worst case: the wall is closer than the sensor says). To guarantee stopping ≥1 m from the wall, the robot needs dᵣᵉᵖᵒʳᵗᵉᵈ - 2.5 ≥ 1, i.e., dᵣᵉᵖᵒʳᵗᵉᵈ ≥ 3.5 m."
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
              Write the confidence bound inequality and the error formula from memory. Then derive the
              inscribed-polygon lower bound <InlineMath>{'N\\sin(\\pi/N) \\le \\pi'}</InlineMath> geometrically
              (half-chord argument).
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              Compute both Archimedes bounds for <InlineMath>{'N = 12'}</InlineMath> by hand (or with a calculator)
              and verify the error is approximately 0.055.
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Evaluate <InlineMath>{'(1 + 1/n)^n'}</InlineMath> for <InlineMath>{'n = 1, 2, 10, 100'}</InlineMath>
              and confirm the sequence is strictly increasing toward <InlineMath>{'e'}</InlineMath>. Explain in one
              sentence why every term is a lower bound.
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              State the rule for how confidence bounds compose under addition and under multiplication by a
              negative scalar. Give a 1-sentence robotics motivation for each rule.
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Without notes, explain Archimedes' method in under 90 seconds, state the error formula, and
              connect it to the concept of a limit we define in Lecture 27.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
