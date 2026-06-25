import { useState, useMemo } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'

const TAG = { background: '#fef0e7', color: '#922b21', borderColor: '#f5cba7' }
const W = 340, H = 280, CX = 170, CY = 140, SCALE = 70

function CovWidget() {
  const [s1, setS1] = useState(1.2)
  const [s2, setS2] = useState(0.6)
  const [rho, setRho] = useState(0.5)

  const { rx1, ry1, rx2, ry2, deg, lam1, lam2 } = useMemo(() => {
    const a = s1 * s1, c = s2 * s2, b = rho * s1 * s2
    const mid = (a + c) / 2
    const disc = Math.sqrt(((a - c) / 2) ** 2 + b * b)
    const lam1 = mid + disc, lam2 = Math.max(0, mid - disc)
    const theta = 0.5 * Math.atan2(2 * b, a - c)
    const deg = theta * 180 / Math.PI
    return {
      rx1: SCALE * Math.sqrt(lam1), ry1: SCALE * Math.sqrt(lam2),
      rx2: 2 * SCALE * Math.sqrt(lam1), ry2: 2 * SCALE * Math.sqrt(lam2),
      deg, lam1, lam2
    }
  }, [s1, s2, rho])

  const ev1x = Math.cos(deg * Math.PI / 180) * SCALE * Math.sqrt(lam1)
  const ev1y = Math.sin(deg * Math.PI / 180) * SCALE * Math.sqrt(lam1)
  const ev2x = Math.cos((deg + 90) * Math.PI / 180) * SCALE * Math.sqrt(lam2)
  const ev2y = Math.sin((deg + 90) * Math.PI / 180) * SCALE * Math.sqrt(lam2)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg width={W} height={H} style={{ background: '#fff9f5', borderRadius: 8, border: '1px solid #f5cba7' }}>
        <defs>
          <marker id="ah49" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#922b21" />
          </marker>
        </defs>
        <line x1={10} y1={CY} x2={W-10} y2={CY} stroke="#ccc" strokeWidth={1} />
        <line x1={CX} y1={10} x2={CX} y2={H-10} stroke="#ccc" strokeWidth={1} />
        <text x={W-16} y={CY-4} fontSize={10} fill="#999">x₁</text>
        <text x={CX+4} y={14} fontSize={10} fill="#999">x₂</text>
        <ellipse cx={CX} cy={CY} rx={rx2} ry={ry2}
          transform={`rotate(${deg}, ${CX}, ${CY})`}
          fill="#f5cba7" fillOpacity={0.3} stroke="#e59866" strokeWidth={1.5} strokeDasharray="5,3" />
        <ellipse cx={CX} cy={CY} rx={rx1} ry={ry1}
          transform={`rotate(${deg}, ${CX}, ${CY})`}
          fill="#f0b27a" fillOpacity={0.4} stroke="#922b21" strokeWidth={2} />
        <line x1={CX} y1={CY} x2={CX + ev1x} y2={CY - ev1y}
          stroke="#c0392b" strokeWidth={2} markerEnd="url(#ah49)" />
        <line x1={CX} y1={CY} x2={CX + ev2x} y2={CY - ev2y}
          stroke="#7b241c" strokeWidth={2} markerEnd="url(#ah49)" />
        <circle cx={CX} cy={CY} r={4} fill="#922b21" />
        <text x={CX+6} y={CY+14} fontSize={11} fill="#922b21">μ</text>
        <text x={CX + ev1x + 6} y={CY - ev1y + 4} fontSize={10} fill="#c0392b">v₁</text>
        <text x={CX + ev2x + 6} y={CY - ev2y + 4} fontSize={10} fill="#7b241c">v₂</text>
      </svg>
      <div style={{ fontSize: 12, color: '#6e2e22', background: '#fef0e7', padding: '6px 14px', borderRadius: 6, border: '1px solid #f5cba7' }}>
        λ₁ = {fmt(lam1)} &nbsp;|&nbsp; λ₂ = {fmt(lam2)} &nbsp;|&nbsp; θ = {fmt(deg)}°
      </div>
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SliderRow label="σ₁" min={0.3} max={2} step={0.05} value={s1} onChange={setS1} />
        <SliderRow label="σ₂" min={0.3} max={2} step={0.05} value={s2} onChange={setS2} />
        <SliderRow label="ρ (correlation)" min={-0.95} max={0.95} step={0.05} value={rho} onChange={setRho} />
      </div>
      <div style={{ fontSize: 12, color: '#555', textAlign: 'center' }}>
        Σ = [{fmt(s1*s1)}, {fmt(rho*s1*s2)}; {fmt(rho*s1*s2)}, {fmt(s2*s2)}] — inner: 1σ, outer: 2σ
      </div>
    </div>
  )
}

export default function L49() {
  return (
    <div className="lesson">
      <div className="lesson-section">
        <span className="section-tag intuition-tag" style={TAG}>Intuition</span>
        <h2>Probability Spaces and Random Vectors</h2>
        <div className="content-block">
          <p>
            A robot's sensor never returns the true value. Every GPS reading, every LIDAR
            return, every joint encoder tick arrives corrupted by noise. To reason about
            this noise — to filter it, fuse it, and navigate despite it — we need a
            precise mathematical language: <strong>probability theory</strong>.
          </p>
          <p>
            The fundamental object is a <em>probability space</em> <InlineMath math="(\Omega, \mathcal{F}, P)" />.
            Think of <InlineMath math="\Omega" /> as the set of all possible outcomes,
            <InlineMath math="\mathcal{F}" /> as the events we can assign probabilities to, and
            <InlineMath math="P" /> as the assignment itself. A <em>random variable</em> maps outcomes
            to numbers; a <em>random vector</em> maps outcomes to <InlineMath math="\mathbb{R}^n" />.
          </p>
          <p>
            The key descriptor is the <strong>covariance matrix</strong> <InlineMath math="\Sigma" />,
            which encodes both individual variances and cross-correlations. Its shape is the
            confidence ellipsoid — visualizing exactly where we expect the random vector to land.
          </p>
        </div>
      </div>

      <div className="lesson-section widget-section">
        <span className="section-tag widget-tag" style={TAG}>Widget — Covariance Ellipsoid</span>
        <div className="content-block">
          <p>
            Adjust <InlineMath math="\sigma_1, \sigma_2" /> (marginal standard deviations) and
            <InlineMath math="\rho" /> (correlation). The eigenvectors <InlineMath math="v_1, v_2" />
            of <InlineMath math="\Sigma" /> point along the principal axes; eigenvalues determine
            the semi-axis lengths. Inner ellipse = 1σ, outer = 2σ.
          </p>
          <CovWidget />
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag formalism-tag" style={TAG}>Formalism</span>
        <div className="content-block">
          <h3>Probability Space</h3>
          <p>A <em>probability space</em> <InlineMath math="(\Omega, \mathcal{F}, P)" /> requires:</p>
          <ul>
            <li><InlineMath math="\Omega" /> — sample space (all outcomes)</li>
            <li><InlineMath math="\mathcal{F}" /> — σ-algebra (closed under complement and countable union)</li>
            <li><InlineMath math="P: \mathcal{F} \to [0,1]" /> with <InlineMath math="P(\Omega)=1" /> and countable additivity</li>
          </ul>
          <h3>Expectation and Covariance</h3>
          <p>For a random vector <InlineMath math="\mathbf{x} \in \mathbb{R}^n" />:</p>
          <DisplayMath math="\boldsymbol{\mu} = \mathbb{E}[\mathbf{x}],\qquad \Sigma = \mathbb{E}\bigl[(\mathbf{x}-\boldsymbol{\mu})(\mathbf{x}-\boldsymbol{\mu})^\top\bigr]" />
          <p>
            <InlineMath math="\Sigma" /> is always <strong>symmetric positive semi-definite</strong>:
            <InlineMath math="\Sigma = \Sigma^\top" /> and <InlineMath math="\mathbf{v}^\top\Sigma\mathbf{v} \ge 0" /> for all <InlineMath math="\mathbf{v}" />.
          </p>
          <h3>Multivariate Gaussian</h3>
          <DisplayMath math="\mathbf{x} \sim \mathcal{N}(\boldsymbol{\mu}, \Sigma) \implies p(\mathbf{x}) = \frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}} \exp\!\Bigl(-\tfrac{1}{2}(\mathbf{x}-\boldsymbol{\mu})^\top \Sigma^{-1}(\mathbf{x}-\boldsymbol{\mu})\Bigr)" />
          <p>
            Constant-probability contours satisfy <InlineMath math="(\mathbf{x}-\boldsymbol{\mu})^\top\Sigma^{-1}(\mathbf{x}-\boldsymbol{\mu}) = c^2" />,
            which are ellipsoids. The spectral decomposition <InlineMath math="\Sigma = V\Lambda V^\top" />
            shows principal axes are eigenvectors with semi-axis lengths <InlineMath math="\sqrt{\lambda_i}" />.
          </p>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag example-tag" style={TAG}>Worked Example</span>
        <div className="content-block">
          <p>Let <InlineMath math="\Sigma = \begin{bmatrix}4 & 2\\2 & 2\end{bmatrix}" />. Find the 1-σ ellipse axes.</p>
          <p><strong>Step 1 — eigenvalues:</strong></p>
          <DisplayMath math="\lambda = \frac{4+2}{2} \pm \sqrt{\!\left(\frac{4-2}{2}\right)^{\!2} + 4} = 3 \pm \sqrt{5}" />
          <p>So <InlineMath math="\lambda_1 \approx 5.24" />, <InlineMath math="\lambda_2 \approx 0.76" />.</p>
          <p><strong>Step 2 — semi-axes:</strong> <InlineMath math="\sqrt{5.24} \approx 2.29" /> and <InlineMath math="\sqrt{0.76} \approx 0.87" />.</p>
          <p><strong>Step 3 — tilt angle:</strong></p>
          <DisplayMath math="\theta = \tfrac{1}{2}\arctan\!\left(\tfrac{2\cdot 2}{4-2}\right) = \tfrac{1}{2}\arctan(2) \approx 31.7°" />
          <p>
            Positive correlation <InlineMath math="\rho = 2/\sqrt{8} \approx 0.71" /> tilts the major axis
            toward the <InlineMath math="x_1 = x_2" /> diagonal.
          </p>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag apps-tag" style={TAG}>Robotics Applications</span>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🗺️</div>
              <h3>SLAM Landmark Uncertainty</h3>
              <p>Each landmark carries a 2D covariance ellipsoid. Loop closure fuses a new observation with the stored Gaussian, shrinking the ellipse and correcting accumulated drift.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">📡</div>
              <h3>GPS + IMU Sensor Fusion</h3>
              <p>GPS gives a large circular uncertainty; the IMU drifts on an elongated ellipse aligned with heading. The Kalman filter fuses both, yielding a tighter ellipse combining their strengths.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🦾</div>
              <h3>End-Effector Pose Uncertainty</h3>
              <p>Joint angle errors propagate through the robot Jacobian <InlineMath math="\Sigma_y = J\Sigma_x J^\top" />. The resulting 6D covariance ellipsoid guides grasp planning under uncertainty.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag quiz-tag" style={TAG}>Quiz</span>
        <div className="content-block">
          <QuizQ num={1} type="mc"
            question="A covariance matrix must always be:"
            options={["Symmetric positive semi-definite","Diagonal","Invertible","Orthogonal"]}
            correct={0}
            explanation="Σ = E[(x−μ)(x−μ)ᵀ] is always symmetric and positive semi-definite. It need not be diagonal or invertible." />
          <QuizQ num={2} type="mc"
            question="If ρ = 0, the covariance ellipse is:"
            options={["Axis-aligned (no tilt)","Tilted 45°","A circle","Undefined"]}
            correct={0}
            explanation="ρ=0 makes Σ diagonal, so eigenvectors align with coordinate axes — no tilt." />
          <QuizQ num={3} type="mc"
            question="The 1-σ ellipse semi-axis lengths along principal directions are:"
            options={["√λ₁ and √λ₂","λ₁ and λ₂","1/λ₁ and 1/λ₂","λ₁² and λ₂²"]}
            correct={0}
            explanation="Along eigenvector v_i the contour condition reduces to x_i²/λ_i = 1, giving semi-axis √λ_i." />
          <QuizQ num={4} type="mc"
            question="For Y = AX with X ~ N(μ, Σ), the covariance of Y is:"
            options={["AΣAᵀ","AᵀΣA","AΣ","ΣAᵀ"]}
            correct={0}
            explanation="Cov(AX) = A Cov(X) Aᵀ = AΣAᵀ — the standard propagation of covariance through a linear map." />
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag review-tag" style={TAG}>Spaced Repetition</span>
        <div className="content-block">
          <p><strong>Day 0</strong> — Three probability axioms: non-negativity, <InlineMath math="P(\Omega)=1" />, countable additivity.</p>
          <p><strong>Day 1</strong> — <InlineMath math="\Sigma_{ij} = \mathbb{E}[(X_i-\mu_i)(X_j-\mu_j)]" />; diagonal = variances, off-diagonal = covariances.</p>
          <p><strong>Day 3</strong> — <InlineMath math="\Sigma = V\Lambda V^\top" />: eigenvectors → principal axes; eigenvalues → squared semi-axis lengths.</p>
          <p><strong>Day 7</strong> — Mahalanobis distance <InlineMath math="d_M^2 = (\mathbf{x}-\boldsymbol{\mu})^\top\Sigma^{-1}(\mathbf{x}-\boldsymbol{\mu})" /> measures surprise in standard-deviation units.</p>
          <p><strong>Day 14</strong> — Covariance propagation through linear map: <InlineMath math="\Sigma_Y = A\Sigma_X A^\top" />.</p>
        </div>
      </div>
    </div>
  )
}
