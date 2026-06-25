# Instruction Guide: Part 2 — Calculus for the Modern Engineer (ROB 201)

This document provides step-by-step specifications for implementing Lectures 25 through 41.

---

## 📘 MODULE 5: PRE-CALCULUS FOUNDATIONS & LIMITS

### Lecture 25: Pre-Calculus Foundations & Bounding
*   **Intuition:** Approximating irrational numbers by sandwiching them between two reachable fractions. Finding Euler's $e$ by compounding interest at shorter and shorter intervals.
*   **Widget (Archimedes & Compounding):**
    *   *Visual:* A circle of radius 1 on a 2D canvas, showing an inscribed regular $N$-gon in blue and a circumscribed $N$-gon in orange.
    *   *Controls:* Slider for number of sides $N$ ($6 \le N \le 96$), and checkbox to toggle "Compound Compounding Interval" which shows a compounding bar graph for $(1 + 1/n)^n$ converging to $e$.
    *   *HUD:* Displays Archimedes bounds $3.1058 < \pi < 3.2153$ for $N=6$, and compound output converging to $2.71828$.
*   **Formalism:**
    *   Confidence bounds: $x^{low} \le x \le x^{up}$ and error metric $x^{error} = \frac{x^{up} - x^{low}}{2}$.
    *   Compound Interest: $A(t) = P(1 + \frac{r}{n})^{nt}$. As $n \to \infty$, $A(t) = P e^{rt}$.
    *   Triangle inequality: $|x+y| \le |x| + |y|$, and $|x-y| \ge ||x| - |y||$.
*   **Example:** Prove $|x| < a \iff -a < x < a$.
*   **Anchor:** Evaluating sensor range noise confidence intervals.
*   **Quiz:** Conceptual: Why does increasing $N$ shrink the error metric? Computational: If $|x - 5| \le 0.1$, what is the upper bound on $x$?

### Lecture 26: Functions & Inverse Trigonometry
*   **Intuition:** Domain is where the robot can look; Range is what the sensors can actually measure. Kinematic configurations of a robot arm in Cartesian coordinates.
*   **Widget (3-Link Kinematics):**
    *   *Visual:* A planar 3-link robotic manipulator with joints at $(0,0)$, $(x_1, y_1)$, $(x_2, y_2)$ and end-effector at $(x_3, y_3)$.
    *   *Controls:* Sliders for link lengths $l_1, l_2, l_3$ and joint angles $\theta_1, \theta_2, \theta_3$.
    *   *HUD:* Computes forward kinematics:
        $$x_3 = l_1 \cos\theta_1 + l_2 \cos(\theta_1 + \theta_2) + l_3 \cos(\theta_1 + \theta_2 + \theta_3)$$
        $$y_3 = l_1 \sin\theta_1 + l_2 \sin(\theta_1 + \theta_2) + l_3 \sin(\theta_1 + \theta_2 + \theta_3)$$
*   **Formalism:** Mappings $f: \mathcal{D} \to \mathcal{R}$. Inverse functions exist iff strict monotonicity. Inverse trig definitions (arcsin, arccos, arctan) and their domains.
*   **Example:** Show $f(x) = x^3$ has a global inverse while $f(x) = x^2$ requires a domain restriction ($x \ge 0$).
*   **Anchor:** Rigid body joint frame compositions.

### Lecture 27: Finite One-Sided & Two-Sided Limits
*   **Intuition:** If you approach a step boundary from the left vs. the right, do you read the same value?
*   **Widget (Limit Jump Probe):**
    *   *Visual:* A graph of a piecewise function with a jump discontinuity (e.g., $f(x) = x^2$ for $x < 2$, and $f(x) = x + 3$ for $x \ge 2$).
    *   *Controls:* Draggable query point $x_0$. A vertical probe line approaches $x_0$ from left (orange) and right (blue).
    *   *HUD:* Displays $\lim_{x \to x_0^-} f(x) = 4$ and $\lim_{x \to x_0^+} f(x) = 5$ at $x_0 = 2$.
*   **Formalism:** Formal $\epsilon$-$\delta$ limit definition:
    $$\forall \epsilon > 0, \exists \delta > 0 \text{ s.t. } 0 < |x - x_0| < \delta \Rightarrow |f(x) - L| < \epsilon$$
*   **Anchor:** Step modifications in motion profiling (e.g., bumper collisions).

### Lecture 28: Continuity & Squeeze Theorem
*   **Intuition:** Continuous means you can draw the function without lifting your pen. The Squeeze theorem is like trapping a rogue signal between two known bounds to prove where it converges.
*   **Widget (Squeeze Solver):**
    *   *Visual:* Graphs of $u(x) = x^2$ (upper), $l(x) = -x^2$ (lower), and $f(x) = x^2 \sin(1/x)$ (squeezed).
    *   *Controls:* Slider to zoom in on origin $x \to 0$.
    *   *HUD:* Proves $l(x) \le f(x) \le u(x) \Rightarrow \lim_{x \to 0} f(x) = 0$.
*   **Formalism:** Continuity criteria: $f(x_0) = \lim_{x \to x_0} f(x)$. IVT: If $f(a) < d < f(b)$, $\exists c \in (a, b)$ s.t. $f(c) = d$. MVT: $f'(c) = \frac{f(b)-f(a)}{b-a}$.
*   **Anchor:** Proving that path clearance is continuous over waypoint configurations.

---

## 🧮 MODULE 6: DEFINITE INTEGRATION & APPLICATIONS

### Lecture 29: Definite Integrals & Riemann Sums
*   **Intuition:** Bounding the total area under a curve by stacking rectangles.
*   **Widget (Riemann Sum Partition):**
    *   *Visual:* 2D graph of $f(x) = \sin(x) + 1.2$ on $[0, \pi]$. Bounded rectangles fill the area.
    *   *Controls:* Slider for partitions $N$ ($4 \le N \le 100$), and dropdown for Lower Sum vs. Upper Sum.
    *   *HUD:* Displays Upper Area, Lower Area, and the difference (error).
*   **Formalism:** Riemann-Darboux partitions: $L(f, P) \le \int_{a}^{b} f(x)dx \le U(f, P)$.
*   **Anchor:** Dead-reckoning odometry integration.

### Lecture 30: Numerical Quadrature Schemes
*   **Intuition:** Rectangles are bad approximations. Trapezoids are better, and parabolas (Simpson's rule) are extremely good.
*   **Widget (Trapezoidal vs. Simpson):**
    *   *Visual:* Comparison plots of $f(x) = x^3 - 2x^2 + 2$. Left: Trapezoidal panels. Right: Parabolic Simpson arcs.
    *   *Controls:* Slider for panels $N$ (even values).
    *   *HUD:* Convergence table showing error scaling: $O(1/N^2)$ for Trapezoid vs. $O(1/N^4)$ for Simpson's.
*   **Formalism:**
    *   Trapezoid: $T_N = \frac{\Delta x}{2} [f(x_0) + 2\sum f(x_i) + f(x_N)]$.
    *   Simpson: $S_N = \frac{\Delta x}{3} [f(x_0) + 4f(x_1) + 2f(x_2) + \dots + f(x_N)]$.
*   **Anchor:** Battery state-of-charge calculation from current integration.

### Lecture 31: Geometric Integration Applications
*   **Intuition:** Center of mass is the balance point of a robot link. Moment of inertia is how hard it is to spin.
*   **Widget (Planar Link Balancer):**
    *   *Visual:* A 2D link geometry on a grid. The user can drag the density profile distribution slider.
    *   *Controls:* Sliders for link thickness and density distribution.
    *   *HUD:* Computes mass $M = \int \rho(x)dx$, center of mass $x_{cm} = \frac{1}{M}\int x\rho(x)dx$, and inertia $I = \int x^2 \rho(x)dx$. Shows the balance pivot point in teal.
*   **Formalism:** Solids of revolution: $V = \pi \int [R(x)]^2 dx$ (discs) or $V = 2\pi \int x f(x) dx$ (shells).
*   **Anchor:** Modeling rigid-body link loads for actuators.

### Lecture 32: Improper Integrals & Probability Densities
*   **Intuition:** Integrating to infinity can yield a finite answer, which is how we verify that probabilities sum to 1.
*   **Widget (Gaussian Tail Integrator):**
    *   *Visual:* Plot of a Gaussian PDF $f(x) = \frac{1}{\sqrt{2\pi}\sigma}e^{-\frac{x^2}{2\sigma^2}}$. A slider sets the upper integration boundary $B$.
    *   *Controls:* Boundary $B$ ($0 \le B \le 5\sigma$), and noise parameter $\sigma$.
    *   *HUD:* Integrals over $[-B, B]$ converging to $1.0$ as $B \to \infty$.
*   **Formalism:** Type-I: $\int_{a}^{\infty} f(x)dx = \lim_{B \to \infty} \int_{a}^{B} f(x)dx$. Comparison test.
*   **Anchor:** Range-finder sensor noise probability distribution limits.

---

## 📈 MODULE 7: DIFFERENTIAL CALCULUS & METHODS

### Lecture 33: Analytical Integration Techniques
*   **Intuition:** Backtracking differentiation rules to find exact antiderivatives.
*   **Widget (FTC Accumulator):**
    *   *Visual:* Interactive plot displaying $f(x) = 3x^2 - 2x$. A shaded region sweeps from $a$ to $x$.
    *   *Controls:* Sliders for $a$ and $x$.
    *   *HUD:* Displays $\frac{d}{dx} [F(x) - F(a)] = f(x)$, verifying the first FTC.
*   **Formalism:** FTC 1: $\frac{d}{dx} \int_a^x f(t)dt = f(x)$. FTC 2: $\int_a^b f(x)dx = F(b) - F(a)$. u-substitution, integration by parts, PFE, trig substitutions.
*   **Anchor:** Analytical state trajectory estimators.

### Lecture 34: Single-Variable Differentiation & Taylor Series
*   **Intuition:** A derivative is a local speed limit. A Taylor series is a polynomial that matches the curve's derivatives at one point.
*   **Widget (Taylor Expansion Matcher):**
    *   *Visual:* Graph of $f(x) = \cos(x)$ or $e^x$. A Taylor polynomial $P_N(x)$ is overlaid.
    *   *Controls:* Slider for polynomial degree $N$ ($1 \le N \le 12$), and center point $x_0$.
    *   *HUD:* Displays $P_N(x) = \sum_{k=0}^{N} \frac{f^{(k)}(x_0)}{k!}(x-x_0)^k$.
*   **Anchor:** Local velocity estimation from noisy encoder steps.

### Lecture 35: Software Differentiation & Auto-Diff
*   **Intuition:** Numerical differences accumulate float noise. Symbolic math is slow. Automatic differentiation uses dual numbers to get exact derivatives at execution time.
*   **Widget (Dual Number Flow graph):**
    *   *Visual:* A 2D flow diagram of a function (e.g., $f(x) = x^2 + \sin(x)$). Dual number variables $(x, x')$ pass through operations.
    *   *Controls:* Sliders for input value $x$ and seed $x'$.
    *   *HUD:* Shows output value and exact derivative evaluated at the same time:
        $$(u + \epsilon u') + (v + \epsilon v') = (u+v) + \epsilon(u'+v')$$
        $$(u + \epsilon u') \cdot (v + \epsilon v') = (uv) + \epsilon(u'v + uv')$$
*   **Anchor:** Jacobian calculations in real-time robot controllers.

---

## ⚙️ MODULE 8: ODEs, LAPLACE & FEEDBACK CONTROL

### Lecture 36: ODE Modeling & Numerical Integration
*   **Intuition:** Differential equations describe the physics of change. Forward Euler steps the system forward in time.
*   **Widget (Euler Stability Sandbox):**
    *   *Visual:* Simulated orbit trajectory of a drone under wind force.
    *   *Controls:* Slider for step size $\Delta t$ ($0.01 \le \Delta t \le 1.0$), and damping coefficient.
    *   *HUD:* Shows stability alerts. Large step sizes cause the system to overshoot and diverge (numerical instability).
*   **Formalism:** $\dot{x} = f(t, x)$. Picard-Lindelöf: $\mathcal{f}$ is Lipschitz continuous $\Rightarrow$ unique solution exists. Euler: $x_{k+1} = x_k + \Delta t f(t_k, x_k)$.
*   **Anchor:** Simulating drone aerodynamics.

### Lecture 37: LTI State-Space Systems & Matrix Exponentials
*   **Intuition:** State-space models group variables into vectors to track systems of differential equations.
*   **Widget (DC Motor State Space):**
    *   *Visual:* DC motor with rotor angle and angular velocity dials.
    *   *Controls:* Load torque disturbance slider, and voltage input slider.
    *   *HUD:* Displays the state-space equation $\dot{x} = A x + B u$ where $x = [\theta, \omega]^\top$:
        $$e^{At} = \mathcal{I} + At + \frac{A^2 t^2}{2!} + \dots$$
*   **Anchor:** Direct Current (DC) motor controller dynamics.

### Lecture 38: Laplace Transforms & Transfer Functions
*   **Intuition:** Transforming differential equations into the frequency domain turns calculus into simple algebra.
*   **Widget (s-Plane Pole Mapper):**
    *   *Visual:* Dual panel. Left: s-plane showing poles (marked as X) and zeros (O). Right: Time-domain step response.
    *   *Controls:* Drag poles in the s-plane.
    *   *HUD:* Shows transfer function $G(s) = \frac{Y(s)}{U(s)}$ and stability status (BIBO stable if all poles in LHP).
*   **Anchor:** Frequency resonance filter configurations.

### Lecture 39: Poles, Zeros & Dirac Delta
*   **Intuition:** A Dirac delta is an instantaneous shock. The system response to it is its fundamental transfer signature.
*   **Widget (Impulse Response Tester):**
    *   *Visual:* A spring-mass-damper cart on a track.
    *   *Controls:* Sliders for mass, stiffness, damping, and a "Trigger Impulse" button.
    *   *HUD:* Time-domain output plotting the impulse response $h(t) = \mathcal{L}^{-1}\{G(s)\}$.
*   **Anchor:** Accelerometer impulse calibration testing.

### Lecture 40: Feedback Control & PID Design
*   **Intuition:** Proportional control corrects based on the current error, derivative control acts on the rate of change to damp oscillations, and integral control corrects steady-state offsets.
*   **Widget (PID Tuning Loop):**
    *   *Visual:* Dual view: A 3D drone adjusting to a target height and a 2D plot comparing reference height vs. actual height.
    *   *Controls:* Sliders for $K_p$, $K_i$, and $K_d$. Preset buttons for overdamped, underdamped, unstable, and critically damped.
    *   *HUD:* Displays rise time, settling time, overshoot, and steady-state error.
*   **Anchor:** Motor positioning loops.

### Lecture 41: Nonlinear Dynamics & Segway Control
*   **Intuition:** Non-linear systems can be linearized around operating points (like holding the Segway upright) to design controllers.
*   **Widget (Planar Segway Stabilizer):**
    *   *Visual:* A 2D Segway model (wheel + pendulum chassis).
    *   *Controls:* Sliders for pitch angle deviation, wheel torque limits, and disturbance forces.
    *   *HUD:* Computes the linearized Jacobian matrices $A$ and $B$, showing how feedback torque $u = -K x$ balances the pendulum.
*   **Anchor:** Balancing control of mobile transporters.
