# Mathematics for Robotics — Interactive Visual Learning Lab Course Plan

**Goal:** Teach mathematical foundations for robotics at Stanford/MIT graduate depth with live Three.js 3D visualizations, rigorous derivations, and concrete robotics anchors at every step.

**Synthesized Curriculum Parts:**
*   **Part 1: Computational Linear Algebra (ROB 101)** (Modules 1–4, Lectures 01–24 + Appendices) — kept exactly as originally planned to preserve existing codebase compatibility.
*   **Part 2: Calculus for the Modern Engineer (ROB 201)** (Modules 5–8, Lectures 25–41)
*   **Part 3: Advanced Mathematics & Estimation for Robotics (ROB 501)** (Modules 9–12, Lectures 42–57)

Every lecture follows the 6-step pedagogy:
`Intuition ➔ Three.js / Interactive SVG Widget ➔ Formalism ➔ Worked Example ➔ Robotics Application ➔ Spaced-Repetition Quiz`

---

## PART 1: Computational Linear Algebra (ROB 101)
*Lectures 01–24 | Kept exactly as originally planned to preserve compatibility with existing built components.*

### MODULE 1 — Linear Systems & Matrix Machinery
*   **L01: Why Computational Linear Algebra?**
    *   *Key Ideas:* Systems of equations as the universal language of engineering.
    *   *Robotics Anchor:* Robot arm: 3 joints, 3 angle constraints = 3 equations.
    *   *Widget:* Meeting planes in 3D / quadratic discriminant root slider.
*   **L02: Vectors, Matrices & Determinants**
    *   *Key Ideas:* Scalars vs arrays; row/column vectors; rectangular vs square matrices; det as uniqueness test.
    *   *Robotics Anchor:* Lidar scan = column vector of 360 range readings.
    *   *Widget:* System ⇄ Matrix assembler / determinant as 2D/3D area and volume.
*   **L03: Triangular Systems: Forward & Back Substitution**
    *   *Key Ideas:* Structure as the key to tractability; det of triangular = product of diagonal.
    *   *Robotics Anchor:* Chain of transforms in a kinematic chain = lower-triangular cascade.
    *   *Widget:* Forward/back substitution stepper highlighting pivots.
*   **L04: Matrix Multiplication**
    *   *Key Ideas:* Row·column definition; size rules; permutation matrices; block views.
    *   *Robotics Anchor:* Composing two rotation matrices = a single rotation.
    *   *Widget:* Matrix-multiply size-rule check / linear transformation grid.
*   **L05: LU Factorization**
    *   *Key Ideas:* Gaussian elimination encodes as L; solve Ly=b then Ux=y; PLU with pivoting.
    *   *Robotics Anchor:* Real-time solver on embedded hardware (must be O(n²) after factoring once).
    *   *Widget:* Animated LU elimination stepper.
*   **L06: det(AB), Matrix Inverses & Transposes**
    *   *Key Ideas:* det(AB)=det(A)det(B); inverse formula; why you almost never compute A⁻¹; Aᵀ.
    *   *Robotics Anchor:* Pseudo-inverse appears in robot Jacobian control.
    *   *Widget:* 2x2 inverse lab showing ad-bc gatekeeper.

### MODULE 2 — Vector Spaces: The Deep Structure
*   **L07: Vector Space ℝⁿ Pt 1: Linear Combinations & Independence**
    *   *Key Ideas:* n-tuples; span; linear independence; existence of Ax=b; LU/AᵀA test.
    *   *Robotics Anchor:* Point cloud from depth camera = set of vectors in ℝ³; are they independent?
    *   *Widget:* Span visualizer (line, plane, ℝ³) / linear-combination reachability.
*   **L08: Counting Independent Vectors: the LDLᵀ Factorization**
    *   *Key Ideas:* # independent columns = # non-zero diag(D); selecting independent columns via P; rank / dim span preview.
    *   *Robotics Anchor:* How many independent directions a robot Jacobian / sensor suite truly has.
    *   *Widget:* LDLᵀ pivot and independent column counter.
*   **L09: Existence & Uniqueness of Solutions to Ax=b**
    *   *Key Ideas:* Comparing diag(D) vs diag(Dₑ); none / unique / infinite via kₑ vs k vs m.
    *   *Robotics Anchor:* Redundant manipulator: reachable pose, dependent columns ⇒ infinitely many joint solutions.
    *   *Widget:* Existence & uniqueness classification boundary.
*   **L10: Euclidean Norm, Least Squares & Linear Regression**
    *   *Key Ideas:* ‖v‖₂; error vector e = Ax−b; minimize ‖e‖; normal equations AᵀAx=Aᵀb; regressor matrix Φ, fitting line & quadratic.
    *   *Robotics Anchor:* Sensor fusion: overdetermined system, find best estimate.
    *   *Widget:* Least-squares line fit / line-vs-parabola regression.
*   **L11: Vector Space ℝⁿ Pt 2: Subspaces**
    *   *Key Ideas:* vector space axioms; subspace (closed under addition and scalar multiplication); range / col span / null space.
    *   *Robotics Anchor:* Robot workspace = range(J); null space = motions that don't move the end-effector.
    *   *Widget:* "Is this line a subspace?" checker / subspace zoo (3D col span and null space).
*   **L12: Dot Product & Orthonormal Vectors**
    *   *Key Ideas:* Inner product u·v=uᵀv; angle/orthogonality; norm; orthonormal sets; orthogonal⇒independent; orthogonal matrices QᵀQ=I.
    *   *Robotics Anchor:* IMU gyro axes must be orthonormal; misalignment = non-zero dot products.
    *   *Widget:* Dot product angle meter / Gram-Schmidt stepper.
*   **L13: QR Factorization**
    *   *Key Ideas:* A=QR via Gram-Schmidt; pipeline (factor, b̄=Qᵀb, back-sub Rx=b̄); least squares via QR (AᵀA=RᵀR); minimum-norm via QR of Aᵀ; underdetermined steering.
    *   *Robotics Anchor:* Steering a mobile robot to the origin on minimum control effort.
    *   *Widget:* QR pipeline solver / underdetermined steering simulator.
*   **L14: Basis Vectors & Eigenvalues**
    *   *Key Ideas:* Basis = independent + spanning; coordinates; Av=λv; characteristic equation det(λI−A)=0; symmetric⇒orthonormal.
    *   *Robotics Anchor:* Principal axes of a rigid body = eigenvectors of inertia tensor.
    *   *Widget:* Eigenvector finder showing Av alignment / power iteration convergence.
*   **L15: Range, Null Space, Rank & Nullity**
    *   *Key Ideas:* null(A), range = col span; general solution x=xₚ+null(A); rank+nullity=m.
    *   *Robotics Anchor:* Degrees of freedom of a robot = nullity of constraint matrix; range(J) = reachable workspace.
    *   *Widget:* Solution set = xₚ + null(A) geometry / rank–nullity ledger.
*   **L16: Checkpoint Recap: Chapters 1–10**
    *   *Key Ideas:* Consolidation: linear systems → factorizations → vector spaces.
    *   *Robotics Anchor:* Full pipeline: sensor data → solved state vector.
    *   *Widget:* Algorithm zoo comparison matrix / force-directed concept dependency graph.

### MODULE 3 — Nonlinear Methods & Optimization
*   **L17: Bisection & Newton's Method (scalar)**
    *   *Key Ideas:* Root finding f(x)=0; IVT bracket + bisection; finite differences; Newton updates.
    *   *Robotics Anchor:* Joint angle satisfying a reach constraint.
    *   *Widget:* Newton on a curve / bisection vs. Newton convergence race.
*   **L18: Vector-valued Functions: Gradient & Jacobian**
    *   *Key Ideas:* Partials; gradient ∇f (row); Jacobian (n×m); linear approximations.
    *   *Robotics Anchor:* Robot forward kinematics: J maps joint velocities → Cartesian velocities.
    *   *Widget:* Multi-joint arm Jacobian / gradient linear forecaster.
*   **L19: Newton-Raphson for Vector Functions**
    *   *Key Ideas:* Solve J·Δx = −f(x), damped variant; quadratic convergence.
    *   *Robotics Anchor:* Inverse kinematics: find joint angles given end-effector position.
    *   *Widget:* Newton-Raphson IK / quadratic-convergence ledger.
*   **L20: Optimization: First-Order (Gradient Descent)**
    *   *Key Ideas:* Cost f; steepest descent update; learning rates stability s<2/λₘₐₓ, condition number.
    *   *Robotics Anchor:* LiDAR-camera extrinsic calibration optimization.
    *   *Widget:* Loss surface gradient descent crawler / step-size stability cliff.
*   **L21: Optimization: Second-Order Unconstrained**
    *   *Key Ideas:* Hessian (symmetric); Newton min ∇²f·Δx=−[∇f]ᵀ; definiteness (min/max/saddle).
    *   *Robotics Anchor:* Optimal trajectory optimization / MPC.
    *   *Widget:* GD vs. Newton path comparison / curvature definiteness test.

### MODULE 4 — Geometry, Hyperplanes & Machine Learning
*   **L22: Affine Spaces & Hyperplanes**
    *   *Key Ideas:* Hyperplane H=xc+N; half-spaces H⁺/H⁻; signed distance; orthogonal projection theorem.
    *   *Robotics Anchor:* Collision detection: is a point on the safe side of a boundary?
    *   *Widget:* Hyperplane & signed distance query tool / orthogonal projection on V=span{v₁,v₂}.
*   **L23: Hyperplanes in ℝⁿ, QP & Max-Margin Classifier**
    *   *Key Ideas:* Signed-distance score; margin 2/‖w‖; support vectors; hard-margin SVM as QP.
    *   *Robotics Anchor:* Terrain classification for a walking robot.
    *   *Widget:* Max-margin separating hyperplane rotator / QP behind the margin.
*   **L24: Soft Margin & Gaussian SVM**
    *   *Key Ideas:* Slack variables; kernel trick; Gaussian RBF kernel φ(x)=exp(−γ‖x−c‖²); nonlinear boundary.
    *   *Robotics Anchor:* Obstacle classification from lidar with non-separable point clouds.
    *   *Widget:* Gaussian RBF kernel 3D lift / soft-margin C-regularization tradeoff.

### APPENDICES — Omitted Computational Linear Algebra Extras
*   **Appendix A — SVD, Complex Vectors & PD Matrices** (LA widget: complex DT spirals, spectral decomp quadratic form ellipse, PD bowl, SVD rotate-scale-rotate stages).
*   **Appendix B — Ordinary Differential Equations (ODEs)** (LB widget: Forward Euler phase portraits sink/spiral/center, nonlinear pendulum vs. linearized pendulum).
*   **Appendix C — Camera & LiDAR Models** (LC widget: pinhole camera intrinsics/extrinsics frustum ray projection, LiDAR-to-camera extrinsic calibration).

---

## PART 2: Calculus for the Modern Engineer (ROB 201)
*Lectures 25–41 | Focus: Bounding, limits, integration, differentiation, auto-diff, and dynamic control.*

### MODULE 5 — Pre-Calculus Foundations & Limits
*   **L25: Pre-Calculus Foundations & Bounding**
    *   *Key Ideas:* Confidence bounds $x^{low} \le x \le x^{up}$, error metrics $x^{error} = \frac{x^{up} - x^{low}}{2}$, continuous compounding $\lim_{n \to \infty} (1 + \frac{1}{n})^n$, constant $e$, inequality algebra, triangle inequality, shift/scale, binomial theorem, Pascal's triangle.
    *   *Robotics Anchor:* Archimedes' $\pi$ polygon algorithm; bounding roots ($\sqrt{2}$, $\sqrt[7]{3}$).
    *   *Widget:* Archimedes' $\pi$ polygon approximation rate slider and bisection root-finder.
*   **L26: Functions & Inverse Trigonometry**
    *   *Key Ideas:* Domain, Range, Codomain, compositions, strict monotonicity, inverse trig functions.
    *   *Robotics Anchor:* 3-Link Robot Kinematic Chain joint angles.
    *   *Widget:* 3-Link Robot Manipulator forward kinematics coordinate tracker.
*   **L27: Finite One-Sided & Two-Sided Limits**
    *   *Key Ideas:* Limits of functions, asymptotes, finite one-sided limits ($\lim_{x \to x_0^\pm} f(x)$), two-sided finite limits.
    *   *Widget:* One-sided limits jump graph.
*   **L28: Continuity & Squeeze Theorem**
    *   *Key Ideas:* Continuity definitions, $\epsilon$-$\delta$ limit formulations, Squeeze Theorem, Intermediate Value Theorem, Mean Value Theorem, piecewise continuity.
    *   *Widget:* Squeeze theorem limits graph.

### MODULE 6 — Definite Integration & Applications
*   **L29: Definite Integrals & Riemann Sums**
    *   *Key Ideas:* Riemann-Darboux integrals, upper and lower Riemann sums, definite integral properties (linearity, interval additivity, shifting, scaling).
    *   *Widget:* Riemann upper/lower sum partitions integrator.
*   **L30: Numerical Quadrature Schemes**
    *   *Key Ideas:* Bounding integrals using the Trapezoidal Rule, Simpson’s Rule, and error convergence rates.
    *   *Widget:* Trapezoidal and Simpson quadrature error decay comparison.
*   **L31: Geometric Integration Applications**
    *   *Key Ideas:* Path/Arc length integration via Pythagorean differentials, solids of revolution (washer and shell methods).
    *   *Robotics Anchor:* Total mass, center of mass, and moments of inertia for planar robot links.
    *   *Widget:* Solids of revolution rotating visualizer.
*   **L32: Improper Integrals & Probability Densities**
    *   *Key Ideas:* Type-I unbounded evaluation boundaries, Type-II vertical asymptotes, convergence diagnostics, absolute integrability.
    *   *Widget:* Improper integral comparison test tail bounder.

### MODULE 7 — Differential Calculus & Methods
*   **L33: Analytical Integration Techniques**
    *   *Key Ideas:* Inversion formulas, $u$-substitution, Integration by Parts, Partial Fraction Expansion (PFE), trigonometric substitutions.
    *   *Widget:* Accumulator function first FTC sweep tool.
*   **L34: Single-Variable Differentiation & Taylor Series**
    *   *Key Ideas:* Tangent limits, local linear coordinates, Product/Quotient/Chain rules, monotonicity, L'Hôpital's rule, Taylor/Maclaurin expansions.
    *   *Widget:* Trajectory tracking derivative slope tangent lines.
*   **L35: Software Differentiation & Auto-Diff**
    *   *Key Ideas:* Symbolic differentiation, symmetric numerical differences, Automatic Differentiation (AD) using Dual Numbers ($a + \epsilon a'$), multivariable chain rule, Jacobians, Gradients, Hessians.
    *   *Widget:* Dual number automatic differentiation graph visualizer.

### MODULE 8 — ODEs, Laplace & Feedback Control
*   **L36: ODE Modeling & Numerical Integration**
    *   *Key Ideas:* First-order scalar ODEs, analytical solutions, numerical integrations, finite escape time, Picard-Lindelöf existence/uniqueness, Lipschitz continuity.
    *   *Widget:* Vector field slope orbits showing Lipschitz boundaries.
*   **L37: LTI State-Space Systems & Matrix Exponentials**
    *   *Key Ideas:* State-space systems ($\dot{x} = Ax + Bu$), Matrix Exponential ($e^{At}$), higher-order systems to first-order, LTI linearization, stability analysis.
    *   *Robotics Anchor:* DC motor model.
    *   *Widget:* DC motor trajectories showing eigenvalue stability/instability.
*   **L38: Laplace Transforms & Transfer Functions**
    *   *Key Ideas:* Laplace transform properties, transfer functions ($G(s) = \frac{N(s)}{D(s)}$), poles and zeros, s-plane mapping.
    *   *Widget:* Laplace s-domain poles positioning and step response curves.
*   **L39: Poles, Zeros & Dirac Delta**
    *   *Key Ideas:* Poles, Zeros, BIBO stability, Impulse response (Dirac delta).
    *   *Widget:* Impulse response (Dirac delta) interactive system response.
*   **L40: Feedback Control & PID Design**
    *   *Key Ideas:* Closed-loop unity feedback dynamics, steady-state error, transient specifications, compensators: Proportional (P), Proportional-Derivative (PD) cascade control.
    *   *Widget:* PID tuning simulator with motor/drone response plot.
*   **L41: Nonlinear Dynamics & Segway Control**
    *   *Key Ideas:* Phase portraits, equilibrium points, Jacobian linearization, Segway lean control.
    *   *Robotics Anchor:* Balancing control of an inverted pendulum Segway transporter.
    *   *Widget:* Planar Segway balancer physics model with Jacobian linearization control.

---

## PART 3: Advanced Mathematics & Estimation for Robotics (ROB 501)
*Lectures 42–57 | Focus: Rigorous proofs, topology, estimation, probability, Kalman filters, and convex programming.*

### MODULE 9 — Mathematical Arguments, Proofs & Set Countability
*   **L42: Mathematical Logic & Direct Proofs**
    *   *Key Ideas:* Logic notation: definitions vs. equations ($:=$ vs. $=$), set elements ($\in, \notin$), logical quantifiers ($\forall, \exists$), conditional implications ($p \Rightarrow q$), bi-conditional equivalence ($p \iff q$), logical AND ($\wedge$), OR ($\vee$), converses, and contrapositives.
    *   *Proofs:* Truth table construction and verification of contrapositive equivalence.
    *   *Widget:* Interactive Truth Table builder.
*   **L43: Contradiction, Induction & Exhaustion**
    *   *Key Ideas:* Proof by contradiction, induction, proof by exhaustion, Fundamental Theorem of Arithmetic.
    *   *Widget:* Domino Induction falling chain simulation.
*   **L44: Set Countability & Cantor's Diagonal**
    *   *Key Ideas:* Countable vs uncountable sets, proving $\mathbb{Q}$ is countable, proving $\mathbb{R}$ is uncountable (Cantor's diagonal argument).
    *   *Widget:* Interactive Cantor's diagonal slash simulator.

### MODULE 10 — Set Topology, Completeness & Compactness
*   **L45: Set Topology & Metric Spaces**
    *   *Key Ideas:* Metric spaces, open/closed sets, interior, closure, boundary, limit points, accumulation points.
    *   *Widget:* Draggable query point in open/closed sets with adjustable $\epsilon$-ball.
*   **L46: Sequences & Cauchy Completeness**
    *   *Key Ideas:* Sequences, Cauchy sequences, completeness of $\mathbb{R}^n$, Banach spaces, supremum and infimum.
    *   *Widget:* Cauchy clustering $\epsilon$-band sequence visualizer.
*   **L47: Compactness & Weierstrass Theorem**
    *   *Key Ideas:* Boundedness, closedness, compact sets, Heine-Borel theorem, Extreme Value Theorem (existence of global maxima/minima).
    *   *Widget:* Weierstrass boundary and continuity validator on open/closed domains.
*   **L48: Continuity & Contraction Mappings**
    *   *Key Ideas:* Continuity definitions, Lipschitz continuity, Banach Fixed-Point theorem, value iteration.
    *   *Widget:* Contraction mapping grid deforming to find unique fixed points.

### MODULE 11 — Probability & State Estimation
*   **L49: Probability Spaces & Random Vectors**
    *   *Key Ideas:* Probability spaces, continuous density functions (PDF), multivariable expected value means ($\mu$), covariance matrices ($\Sigma$), information matrices.
    *   *Widget:* Multivariate Gaussian covariance ellipsoid mapper.
*   **L50: Multivariate Gaussian Distributions**
    *   *Key Ideas:* Properties of normal random vectors, independence vs. un-correlation, linear transformations of Gaussian vectors.
    *   *Widget:* Linear transformation mapping of Gaussian noise distributions.
*   **L51: Estimation Theory (BLUE & MVE)**
    *   *Key Ideas:* Best Linear Unbiased Estimator (BLUE), Minimum Variance Estimator (MVE), Gauss-Markov theorem, conditional Gaussian densities derivation.
    *   *Robotics Anchor:* Multi-sensor fusion (GPS and encoders).
    *   *Widget:* BLUE vs. MVE estimator comparison and uncertainty ellipses.
*   **L52: Recursive Least Squares (RLS)**
    *   *Key Ideas:* Recursive solution to least squares, sequential parameter updates, forgetting factors.
    *   *Robotics Anchor:* Real-time mass estimation of robot payloads.
    *   *Widget:* RLS online parameter updates fitting streaming measurements.
*   **L53: The Kalman Filter & EKF**
    *   *Key Ideas:* Dynamic systems with process/measurement noise, recursive estimation cycle (propagate, update, gain $K_k$, innovation), Kalman Filter induction proof, Extended Kalman Filter (EKF), Luenberger observer.
    *   *Widget:* EKF 2D trajectory tracking and error bounds.

### MODULE 12 — Convexity & Optimization
*   **L54: Convex Sets & Convex Functions**
    *   *Key Ideas:* Convex combinations, convex hulls, epigraphs, Jensen's inequality.
    *   *Widget:* Convexity checking line-segment explorer.
*   **L55: Constrained Optimization & Lagrangians**
    *   *Key Ideas:* Equality constraints, Lagrangian function ($\mathcal{L}(x, \lambda) = f(x) + \lambda^\top g(x)$), constrained gradient descent (gradient projection onto null space).
    *   *Widget:* Draggable constraints boundary projection visualizer.
*   **L56: Linear & Quadratic Programming**
    *   *Key Ideas:* Quadratic programs (QP), Linear programs (LP), Simplex method, active-set QP methods, $L_1$ and $L_\infty$ norm minimization via LP.
    *   *Robotics Anchor:* Model Predictive Control (MPC) joint torque optimization.
    *   *Widget:* LP/QP Simplex active-set path visualizer comparing $L_1, L_2, L_\infty$ fits.
*   **L57: Grand Engineering Capstones**
    *   *Key Ideas:* Feedback system synthesis, state reconstruction observers.
    *   *Robotics Capstones:* Stabilizing a Planar Segway Transporter and an unstable BallBot system.
    *   *Widget:* Dual-screen Segway/BallBot PD feedback stabilizer physics simulation.
