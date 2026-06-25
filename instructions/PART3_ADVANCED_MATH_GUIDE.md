# Instruction Guide: Part 3 — Advanced Mathematics & Estimation (ROB 501)

This document provides step-by-step specifications for implementing Lectures 42 through 57.

---

## 🔏 MODULE 9: MATHEMATICAL ARGUMENTS, PROOFS & COUNTABILITY

### Lecture 42: Mathematical Logic & Direct Proofs
*   **Intuition:** Building statements with logical blocks. Contrapositive means if the result is false, the premise must be false.
*   **Widget (Truth Table Solver):**
    *   *Visual:* A logic flow graph where user connects inputs $p, q$ through gates (AND, OR, NOT, IMPLIES).
    *   *Controls:* Toggle $p$ (T/F) and $q$ (T/F). Select gate operators.
    *   *HUD:* Automatically generates the complete truth table, highlighting the current state row. Verifies equivalence:
        $$(p \Rightarrow q) \iff (\sim q \Rightarrow \sim p)$$
*   **Formalism:** Quantifiers ($\forall, \exists$). Definitions of Axioms, Theorems, Lemmas, Corollaries. Logic negation rules (e.g., negating $\forall \epsilon > 0 \dots$ yields $\exists \epsilon > 0 \dots$).
*   **Anchor:** Formal verification of state-machine transitions.

### Lecture 43: Contradiction, Induction & Exhaustion
*   **Intuition:** If assuming the opposite of a statement leads to a logical clash, then the statement must be true.
*   **Widget (Induction Domino Chain):**
    *   *Visual:* A row of dominos representing $P(1), P(2), \dots, P(k), P(k+1), \dots$
    *   *Controls:* Slider to select index $k$. Toggles for "Verify Base Case $P(1)$" and "Prove Inductive Step $P(k) \Rightarrow P(k+1)$".
    *   *HUD:* If both base case is checked and inductive step is proven, clicking "Run" knocks down all dominos. If either is missing, the chain stops.
*   **Formalism:**
    *   Exhaustion: Verifying every finite case.
    *   Induction: $P(1) = T \wedge (\forall k \ge 1, P(k) \Rightarrow P(k+1)) \Rightarrow \forall n \ge 1, P(n) = T$.
    *   Contradiction: Assume $\sim p$. If $\sim p \Rightarrow R \wedge \sim R$, then $p$ is true.
*   **Anchor:** Proofs of graph search algorithm termination.

### Lecture 44: Set Countability & Cantor's Diagonal
*   **Intuition:** Some infinities are larger than others. Rational fractions are countable; real numbers are uncountable.
*   **Widget (Diagonal Slash Simulator):**
    *   *Visual:* A list of infinite decimal numbers $r_1, r_2, r_3, \dots$
    *   *Controls:* "Slash Diagonal" button.
    *   *HUD:* Draws a diagonal line matching the $n$-th digit of the $n$-th number:
        $$r_1 = 0.\mathbf{3}4819\dots$$
        $$r_2 = 0.9\mathbf{1}025\dots$$
        $$r_3 = 0.23\mathbf{8}89\dots$$
        Creates a new number $d = 0.429\dots$ where $d_n \ne r_{n,n}$. Proves $d$ is missing from the list, demonstrating uncountability.
*   **Formalism:** Definitions of countable sets (bijective map to $\mathbb{N}$). Rational numbers countability proof. Cantor's diagonal argument.
*   **Anchor:** Defining bounds on sensor value representations.

---

## 🌐 MODULE 10: SET TOPOLOGY, COMPLETENESS & COMPACTNESS

### Lecture 45: Set Topology & Metric Spaces
*   **Intuition:** Interior points are safe. Boundary points are limits. Metrics define generalized distance.
*   **Widget (Set Probe Ball):**
    *   *Visual:* A 2D plane showing a region $S$. A draggable probe point $x$ is shown on screen.
    *   *Controls:* Drag probe $x$. Adjust $\epsilon$-ball radius.
    *   *HUD:*
        *   Green if $x \in interior(S)$ (exists $B_\epsilon(x) \subset S$).
        *   Yellow if $x \in boundary(S)$ ($B_\epsilon(x) \cap S \ne \emptyset \wedge B_\epsilon(x) \cap S^c \ne \emptyset$).
*   **Formalism:** Metric spaces $(X, d)$. Open sets, closed sets, closure ($\bar{S}$), interior ($S^\circ$), boundary ($\partial S$).
*   **Anchor:** Free-space configuration boundaries for obstacle avoidance.

### Lecture 46: Sequences & Cauchy Completeness
*   **Intuition:** A space is complete if every sequence of points that get closer to each other converges to a point that is inside the space.
*   **Widget (Cauchy Convergence Loop):**
    *   *Visual:* A 2D plot of a sequence (e.g., $x_n = 1/n$).
    *   *Controls:* Slider for $\epsilon > 0$ and index $N$.
    *   *HUD:* Highlights the band of height $2\epsilon$. Finds index $N$ such that $|x_m - x_n| < \epsilon$ for all $m,n > N$. Shows Supremum ($\sup$) and Infimum ($\inf$) lines.
*   **Formalism:** Convergence: $x_n \to x$. Cauchy: $\forall \epsilon > 0, \exists N \text{ s.t. } m,n > N \Rightarrow d(x_m, x_n) < \epsilon$. Complete space (Banach space).
*   **Anchor:** Proofs that iterative solvers converge.

### Lecture 47: Compactness & Weierstrass Theorem
*   **Intuition:** Closed and bounded sets are compact. A continuous function on a compact set is guaranteed to reach its absolute maximum and minimum.
*   **Widget (Weierstrass Extremes):**
    *   *Visual:* Function plot $f(x)$ on $[a, b]$.
    *   *Controls:* Checkboxes for "Make Interval Open $(a, b)$", "Introduce Discontinuity", and "Snap to Optimum".
    *   *HUD:* Highlights absolute extremes. If the interval is open or discontinuous, shows how the function fails to contain its supremum/infimum.
*   **Formalism:** Bounded sets. Compact sets (closed + bounded in $\mathbb{R}^n$, Heine-Borel theorem). Weierstrass Extreme Value Theorem.
*   **Anchor:** Guaranteeing optimal trajectory profiles exist.

### Lecture 48: Continuity & Contraction Mappings
*   **Intuition:** A contraction mapping compresses space. If you repeatedly apply a contraction, you converge to a unique fixed point regardless of where you start.
*   **Widget (Contraction Mapping Grid):**
    *   *Visual:* A 2D grid containing an image of a robot. The contraction mapping deforms and compresses the grid.
    *   *Controls:* Slider for contraction factor $L \in (0, 1)$. Button to "Step Iteration".
    *   *HUD:* Displays fixed-point equation $T(x^*) = x^*$. Tracks convergence rate.
*   **Formalism:** Banach Fixed-Point Theorem: If $T: X \to X$ is a contraction on complete metric space $X$, $\exists! x^* \in X$ s.t. $T(x^*) = x^*$.
*   **Anchor:** Proving convergence of value iteration in RL and SLAM.

---

## 🎲 MODULE 11: PROBABILITY & STATE ESTIMATION

### Lecture 49: Probability Spaces & Random Vectors
*   **Intuition:** Random variables model uncertainty. Covariance describes how variations in one dimension scale with variations in another.
*   **Widget (Covariance Ellipsoid):**
    *   *Visual:* 2D plane showing a scatter plot of measurements. A 2D uncertainty ellipse is drawn.
    *   *Controls:* Sliders for variance in $x$, variance in $y$, and cross-correlation $\rho$.
    *   *HUD:* Computes eigenvalues/eigenvectors of the covariance matrix:
        $$\Sigma = \begin{bmatrix} \sigma_x^2 & \rho\sigma_x\sigma_y \\ \rho\sigma_x\sigma_y & \sigma_y^2 \end{bmatrix}$$
*   **Formalism:** Probability space $(\Omega, \mathcal{F}, P)$. Continuous random vectors, PDF, mean $\mu = E\{x\}$, covariance $\Sigma = E\{(x-\mu)(x-\mu)^\top\}$.
*   **Anchor:** Mapping coordinate uncertainty in SLAM.

### Lecture 50: Multivariate Gaussian Distributions
*   **Intuition:** Gaussians are the workhorses of estimation. Linear combinations of Gaussian vectors remain Gaussian.
*   **Widget (Joint Gaussian PDF):**
    *   *Visual:* A 3D bell curve surface plot.
    *   *Controls:* Correlation slider $\rho$, and rotation angle.
    *   *HUD:* Displays joint Gaussian formula:
        $$p(x) = \frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}} \exp\left(-\frac{1}{2}(x-\mu)^\top \Sigma^{-1} (x-\mu)\right)$$
*   **Anchor:** Modeling multi-sensor noise distributions.

### Lecture 51: Estimation Theory (BLUE & MVE)
*   **Intuition:** Finding the best estimate of a hidden state from noisy observations. MVE is the optimal estimator when states are random.
*   **Widget (MVE vs. BLUE):**
    *   *Visual:* A 2D coordinate system with hidden state $x$ and observations $y$.
    *   *Controls:* Noise level slider. Toggle prior probability on/off.
    *   *HUD:* Displays estimated coordinates and variance circles. Shows prior pull (MVE) vs. unbiased measurement focus (BLUE).
*   **Formalism:** Best Linear Unbiased Estimator (BLUE), Minimum Variance Estimator (MVE). Orthogonal projection theorem derivation.
*   **Anchor:** GPS and wheel encoder sensor fusion.

### Lecture 52: Recursive Least Squares (RLS)
*   **Intuition:** Instead of keeping all measurements in memory and solving $A^\top A x = A^\top b$ over and over, RLS updates the estimate using only the latest data and the previous covariance.
*   **Widget (RLS Line Fitter):**
    *   *Visual:* A plot with streaming data points. The fitted line updates in real time.
    *   *Controls:* Forgetting factor $\lambda$ ($0.9 \le \lambda \le 1.0$), noise level, and "Inject Outlier" button.
    *   *HUD:* Computes the recursive updates:
        $$K_k = P_{k-1} H_k^\top (H_k P_{k-1} H_k^\top + R)^{-1}$$
        $$x_k = x_{k-1} + K_k (y_k - H_k x_{k-1})$$
        $$P_k = (I - K_k H_k) P_{k-1}$$
*   **Anchor:** Estimation of robot payload mass changes.

### Lecture 53: The Kalman Filter & EKF
*   **Intuition:** Propagation estimates the state based on physics; correction updates the estimate based on measurements.
*   **Widget (Kalman Filter Tracker):**
    *   *Visual:* 2D coordinate canvas. Green path: ground truth. Red dots: noisy measurements. Blue circle: estimated state and covariance ellipse.
    *   *Controls:* Sliders for process noise $Q$ and measurement noise $R$.
    *   *HUD:* Propagates state and covariance through prediction and update steps.
*   **Formalism:** Proving the Kalman Filter update equations by induction. Luenberger Observer comparison. Extended Kalman Filter (EKF) linearization updates.
*   **Anchor:** Position tracking for autonomous vehicles.

---

## 📐 MODULE 12: CONVEXITY & OPTIMIZATION

### Lecture 54: Convex Sets & Convex Functions
*   **Intuition:** A set is convex if the line segment connecting any two points in the set stays inside the set. A function is convex if its secant line lies above the curve.
*   **Widget (Convex Segment Tester):**
    *   *Visual:* A 2D shape (convex or non-convex). User drags points $x, y$.
    *   *Controls:* Toggle Convex shape vs. Non-Convex shape.
    *   *HUD:* Segments turn red and trigger a warning if they cross the set boundary.
*   **Formalism:** Convex sets: $\theta x + (1-\theta)y \in C$ for $\theta \in [0, 1]$. Convex functions: $f(\theta x + (1-\theta)y) \le \theta f(x) + (1-\theta)f(y)$. Epigraphs, Jensen's inequality.
*   **Anchor:** Convex free-spaces for path planning.

### Lecture 55: Constrained Optimization & Lagrangians
*   **Intuition:** Optimizing a cost function while satisfying strict boundaries. Lagrange multipliers act as force vectors that keep the solution on the constraint surface.
*   **Widget (Constrained Gradient Descent):**
    *   *Visual:* A 3D cost contour map with a constraint boundary line.
    *   *Controls:* Sliders to warp the constraint line and cost function.
    *   *HUD:* Displays the gradient vector $\nabla f(x)$ and constraint normal $\nabla g(x)$, showing alignment at the optimum ($\nabla f(x^*) + \lambda \nabla g(x^*) = 0$).
*   **Formalism:** Lagrangian $\mathcal{L}(x, \lambda) = f(x) + \lambda^\top g(x)$. Equality constraints, constrained gradient descent.
*   **Anchor:** Manipulator kinematic path constraints.

### Lecture 56: Linear & Quadratic Programming
*   **Intuition:** LP minimizes linear objectives over polyhedral boundaries. QP minimizes quadratic shapes (like energy) over boundaries.
*   **Widget (Polytope Simplex Solver):**
    *   *Visual:* A 3D cost landscape bounded by flat inequality planes (forming a polytope).
    *   *Controls:* Toggle LP vs. QP. Sliders for constraints.
    *   *HUD:* Simplex pathway crawling from vertex to vertex (LP) vs. active-set paths sliding along boundaries (QP). Shows $L_1$ vs. $L_\infty$ fits.
*   **Formalism:**
    *   LP: $\min c^\top x \text{ s.t. } Ax \le b$.
    *   QP: $\min \frac{1}{2}x^\top Q x + q^\top x \text{ s.t. } Ax \le b$.
*   **Anchor:** Model Predictive Control (MPC) joint torque allocation.

### Lecture 57: Grand Engineering Capstones
*   **Intuition:** Stabilizing unstable physical systems (like a balancing Segway or a BallBot riding on a sphere) by combining state estimation (Kalman filter) and feedback control.
*   **Widget (BallBot Stabilizer):**
    *   *Visual:* 3D BallBot (a robot balancing on top of a single sphere).
    *   *Controls:* Sliders for disturbances, sensor noise, and controller gains.
    *   *HUD:* Live phase portraits showing stability metrics.
*   **Formalism:** Closed-loop LTI synthesis with state feedback and observers.
*   **Anchor:** Dynamic balancing of personal transporter robots and BallBot systems.
