import { useState, useMemo } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'

const TAG = { background: '#fef0e7', color: '#922b21', borderColor: '#f5cba7' }
const W = 360, H = 220

function gaussian(x, mu, sigma2) {
  return Math.exp(-0.5 * (x - mu) ** 2 / sigma2) / Math.sqrt(2 * Math.PI * sigma2)
}

function EstimatorWidget() {
  const [sigmaP2, setSigmaP2] = useState(1.0)
  const [sigmaR2, setSigmaR2] = useState(0.5)
  const muPrior = 0, yMeas = 1.5

  const { muPost, sigmaPost2, muBLUE, sigmaBLUE2 } = useMemo(() => {
    const K = sigmaP2 / (sigmaP2 + sigmaR2)
    const muPost = muPrior + K * (yMeas - muPrior)
    const sigmaPost2 = (1 - K) * sigmaP2
    return { muPost, sigmaPost2, muBLUE: yMeas, sigmaBLUE2: sigmaR2 }
  }, [sigmaP2, sigmaR2])

  const xMin = -2, xMax = 4, nPts = 120
  const xs = Array.from({ length: nPts }, (_, i) => xMin + (xMax - xMin) * i / (nPts - 1))
  const toSvgX = x => 30 + (x - xMin) / (xMax - xMin) * (W - 60)
  const toSvgY = (y, maxY) => H - 30 - (y / maxY) * (H - 50)

  const maxY = 1.2
  const priorPts = xs.map(x => `${toSvgX(x)},${toSvgY(gaussian(x, muPrior, sigmaP2), maxY)}`).join(' ')
  const measPts  = xs.map(x => `${toSvgX(x)},${toSvgY(gaussian(x, yMeas, sigmaR2), maxY)}`).join(' ')
  const postPts  = xs.map(x => `${toSvgX(x)},${toSvgY(gaussian(x, muPost, sigmaPost2), maxY)}`).join(' ')

  const muP_x = toSvgX(muPrior)
  const muY_x = toSvgX(yMeas)
  const muMVE_x = toSvgX(muPost)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg width={W} height={H} style={{ background: '#fff9f5', borderRadius: 8, border: '1px solid #f5cba7' }}>
        <line x1={30} y1={H-30} x2={W-20} y2={H-30} stroke="#ccc" strokeWidth={1} />
        <polyline points={priorPts} fill="none" stroke="#2471a3" strokeWidth={2} strokeDasharray="4,3" />
        <polyline points={measPts}  fill="none" stroke="#e67e22" strokeWidth={2} strokeDasharray="6,2" />
        <polyline points={postPts}  fill="#f5cba7" fillOpacity={0.4} stroke="#922b21" strokeWidth={2.5} />
        <line x1={muP_x} y1={30} x2={muP_x} y2={H-30} stroke="#2471a3" strokeWidth={1} strokeDasharray="3,3" />
        <line x1={muY_x} y1={30} x2={muY_x} y2={H-30} stroke="#e67e22" strokeWidth={1} strokeDasharray="3,3" />
        <line x1={muMVE_x} y1={30} x2={muMVE_x} y2={H-30} stroke="#922b21" strokeWidth={2} />
        <text x={muP_x-2} y={22} textAnchor="end" fontSize={10} fill="#2471a3">prior μ</text>
        <text x={muY_x+2} y={22} textAnchor="start" fontSize={10} fill="#e67e22">y</text>
        <text x={muMVE_x+2} y={40} textAnchor="start" fontSize={10} fill="#922b21">MVE</text>
        <text x={18} y={16} fontSize={10} fill="#2471a3">— prior</text>
        <text x={18} y={28} fontSize={10} fill="#e67e22">— likelihood</text>
        <text x={18} y={40} fontSize={10} fill="#922b21">— posterior</text>
      </svg>
      <div style={{ fontSize: 12, color: '#6e2e22', background: '#fef0e7', padding: '6px 16px', borderRadius: 6, border: '1px solid #f5cba7' }}>
        MVE: μ̂ = {fmt(muPost)}, σ² = {fmt(sigmaPost2)} &nbsp;|&nbsp; BLUE: μ̂ = {fmt(yMeas)}, σ² = {fmt(sigmaBLUE2)}
      </div>
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SliderRow label="Prior variance σ²_p" min={0.1} max={3} step={0.1} value={sigmaP2} onChange={setSigmaP2} />
        <SliderRow label="Meas noise σ²_R" min={0.1} max={3} step={0.1} value={sigmaR2} onChange={setSigmaR2} />
      </div>
      <div style={{ fontSize: 11, color: '#777', textAlign: 'center' }}>
        Prior μ=0, measurement y=1.5. Kalman gain K = σ²_p/(σ²_p+σ²_R) = {fmt(sigmaP2/(sigmaP2+sigmaR2))}
      </div>
    </div>
  )
}

export default function L51() {
  return (
    <div className="lesson">
      <div className="lesson-section">
        <span className="section-tag intuition-tag" style={TAG}>Intuition</span>
        <h2>Estimation Theory: BLUE and MVE</h2>
        <div className="content-block">
          <p>
            A robot has two sources of knowledge about its position: a <em>prior</em> from its
            motion model, and a noisy <em>measurement</em> from a sensor. How should it combine them?
          </p>
          <p>
            Two classic answers: the <strong>Best Linear Unbiased Estimator (BLUE)</strong> ignores
            the prior entirely and finds the linear combination of measurements with minimum variance
            and zero bias. The <strong>Minimum Variance Estimator (MVE)</strong> treats the unknown
            state as a random variable with a prior distribution and fuses prior + data optimally.
          </p>
          <p>
            When the prior is Gaussian and the model is linear-Gaussian, MVE is exactly the
            Kalman filter update. Geometrically, the posterior is the product of two Gaussians —
            a narrower bell that sits between the prior and the likelihood, pulled toward whichever
            is more confident.
          </p>
        </div>
      </div>

      <div className="lesson-section widget-section">
        <span className="section-tag widget-tag" style={TAG}>Widget — Prior × Likelihood = Posterior</span>
        <div className="content-block">
          <p>
            The prior (blue dashed) is <InlineMath math="\mathcal{N}(0, \sigma^2_p)" />, the
            measurement (orange dashed) is <InlineMath math="y = 1.5" /> with noise
            <InlineMath math="\sigma^2_R" />, and the MVE posterior (orange solid) is their
            Gaussian product. BLUE always stays at <InlineMath math="y = 1.5" />.
          </p>
          <EstimatorWidget />
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag formalism-tag" style={TAG}>Formalism</span>
        <div className="content-block">
          <h3>BLUE (no prior)</h3>
          <p>Measurement model: <InlineMath math="\mathbf{y} = H\mathbf{x} + \mathbf{v}" />, <InlineMath math="\mathbf{v} \sim \mathcal{N}(\mathbf{0}, R)" />.</p>
          <DisplayMath math="\hat{\mathbf{x}}_{\text{BLUE}} = (H^\top R^{-1} H)^{-1} H^\top R^{-1} \mathbf{y}" />
          <p>
            Unbiased: <InlineMath math="\mathbb{E}[\hat{\mathbf{x}}] = \mathbf{x}" />.
            Covariance: <InlineMath math="P_{\text{BLUE}} = (H^\top R^{-1} H)^{-1}" />.
          </p>
          <h3>MVE (with Gaussian prior)</h3>
          <p>Prior: <InlineMath math="\mathbf{x} \sim \mathcal{N}(\boldsymbol{\mu}_0, P_0)" />. Kalman gain:</p>
          <DisplayMath math="K = P_0 H^\top (H P_0 H^\top + R)^{-1}" />
          <DisplayMath math="\hat{\mathbf{x}}_{\text{MVE}} = \boldsymbol{\mu}_0 + K(\mathbf{y} - H\boldsymbol{\mu}_0), \qquad P_{\text{MVE}} = (I - KH)P_0" />
          <p>
            As <InlineMath math="P_0 \to \infty" /> (flat prior), <InlineMath math="K \to (H^\top R^{-1} H)^{-1} H^\top R^{-1}" />
            and MVE → BLUE. As <InlineMath math="R \to \infty" /> (no data), <InlineMath math="K \to 0" /> and MVE → prior mean.
          </p>
          <h3>Gauss–Markov Theorem</h3>
          <p>
            Among all linear unbiased estimators, BLUE has the smallest variance. No linear estimator
            can do better without incorporating prior information.
          </p>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag example-tag" style={TAG}>Worked Example</span>
        <div className="content-block">
          <p>
            Prior: <InlineMath math="x \sim \mathcal{N}(0, 0.8)" />. Sensor: <InlineMath math="y = x + v" />,
            <InlineMath math="v \sim \mathcal{N}(0, 0.2)" />. Observation: <InlineMath math="y = 1.5" />.
          </p>
          <p><strong>Kalman gain:</strong></p>
          <DisplayMath math="K = \frac{0.8}{0.8 + 0.2} = 0.8" />
          <p><strong>MVE estimate:</strong></p>
          <DisplayMath math="\hat{x} = 0 + 0.8(1.5 - 0) = 1.2" />
          <p><strong>Posterior variance:</strong></p>
          <DisplayMath math="P = (1 - 0.8) \cdot 0.8 = 0.16" />
          <p>
            The estimate (1.2) sits closer to the measurement (1.5) than the prior mean (0)
            because the prior variance (0.8) is much larger than the sensor noise (0.2) — data
            is more trustworthy here.
          </p>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag apps-tag" style={TAG}>Robotics Applications</span>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🛰️</div>
              <h3>GPS/IMU Fusion</h3>
              <p>MVE fuses a high-rate, low-noise IMU prediction (prior) with low-rate, high-noise GPS (likelihood). The Kalman gain automatically weights the more reliable source.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🔬</div>
              <h3>Sensor Calibration</h3>
              <p>BLUE estimates bias in a batch of calibration measurements. Gauss-Markov guarantees no linear method can reduce the calibration variance further with the same data.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧠</div>
              <h3>Bayesian Neural Networks</h3>
              <p>MVE is the scalar/Gaussian version of Bayesian inference. Weights have a prior; training data is the likelihood; the posterior distribution over weights quantifies epistemic uncertainty.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag quiz-tag" style={TAG}>Quiz</span>
        <div className="content-block">
          <QuizQ num={1} type="mc"
            question="When the prior variance → ∞, the MVE estimate approaches:"
            options={["BLUE (measurement-only estimate)","The prior mean","Zero","The measurement variance"]}
            correct={0}
            explanation="A flat prior carries no information, so K → (HᵀR⁻¹H)⁻¹HᵀR⁻¹ and MVE collapses to BLUE." />
          <QuizQ num={2} type="mc"
            question="The Gauss-Markov theorem states that among linear unbiased estimators, BLUE has:"
            options={["Minimum variance","Minimum bias","Maximum likelihood","Minimum mean"]}
            correct={0}
            explanation="Gauss-Markov: BLUE achieves the lowest possible variance among all linear unbiased estimators (without requiring Gaussian noise)." />
          <QuizQ num={3} type="mc"
            question="The Kalman gain K = P₀Hᵀ(HP₀Hᵀ+R)⁻¹. When R → 0 (perfect sensor), K approaches:"
            options={["H⁻¹ (or H† for non-square H)","0","1","P₀"]}
            correct={0}
            explanation="As R→0, K→P₀Hᵀ(HP₀Hᵀ)⁻¹ = H⁻¹ (when H is square invertible), so the estimate trusts the measurement completely." />
          <QuizQ num={4} type="mc"
            question="The posterior variance P_MVE = (I−KH)P₀ is always ___ the prior variance P₀:"
            options={["Less than or equal to","Greater than","Equal to","Unrelated to"]}
            correct={0}
            explanation="Each observation reduces uncertainty: P_MVE ≤ P₀ in the PSD order, with equality only if the sensor adds no information (K=0)." />
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag review-tag" style={TAG}>Spaced Repetition</span>
        <div className="content-block">
          <p><strong>Day 0</strong> — BLUE formula: <InlineMath math="\hat{x} = (H^\top R^{-1}H)^{-1}H^\top R^{-1}y" /> — weighted least squares with noise covariance.</p>
          <p><strong>Day 1</strong> — Kalman gain: <InlineMath math="K = P_0 H^\top (HP_0H^\top + R)^{-1}" /> — blends prior confidence and sensor noise.</p>
          <p><strong>Day 3</strong> — MVE update: <InlineMath math="\hat{x} = \mu_0 + K(y - H\mu_0)" />, posterior covariance <InlineMath math="P = (I-KH)P_0" />.</p>
          <p><strong>Day 7</strong> — Gauss-Markov: BLUE is the minimum-variance linear unbiased estimator.</p>
          <p><strong>Day 14</strong> — When prior is flat (<InlineMath math="P_0 \to \infty" />), MVE = BLUE; when prior is perfect (<InlineMath math="P_0 \to 0" />), MVE = prior mean.</p>
        </div>
      </div>
    </div>
  )
}
