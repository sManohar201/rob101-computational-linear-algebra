# Chapter 12: Changing Gears Again: Basic Ideas of Optimization

## Overview
This chapter wraps up the introduction to Computational Linear Algebra by exploring **Optimization**—the process of finding parameters that minimize or maximize a cost function. The chapter covers:
1. **First-Order Optimization:** Gradient Descent and local slopes.
2. **Second-Order Optimization:** Hessian matrices and multi-variable Newton-Raphson minimization.
3. **Convexity:** Convex functions and global vs. local minima.
4. **Constrained Optimization:** Quadratic Programs (QPs), splines, and numerical solvers in Julia (OSQP & JuMP).

---

## 12.1 Motivation & Basic Ideas
* **Cost Function:** A scalar-valued function $f: \mathbb{R}^m \to \mathbb{R}$ (also referred to as a loss or regret function in machine learning) that measures the "quality" or "error" of a solution.
* **Objective:** Find the optimal parameter vector $x^*$ that minimizes the cost:
  $$x^* = \arg\min_{x \in \mathbb{R}^m} f(x)$$
* **Global Minimum:** A point $x^*$ where $f(x^*) < f(x)$ for all $x \neq x^*$.
* **Local Minimum:** A point $x^*$ where $f(x^*) \le f(x)$ for all $x$ in a local neighborhood.

---

## 12.2 Contour Plots and the Gradient
For multi-variable optimization ($x \in \mathbb{R}^2$ or higher), contour plots are used to visualize lines of constant cost (e.g., concentric circles for $\|x - x_0\|_2^2$).
* **Gradient Properties:** The gradient vector $\nabla f(x)$ points in the direction of the **steepest increase (growth)** of the function.
* **Descent Direction:** The negative gradient $-\nabla f(x)$ points in the direction of the **steepest decrease** of the function.
* **Extremum Condition:** At any local minimum or maximum, the gradient vanishes:
  $$\nabla f(x^*) = 0_{1 \times m}$$

---

## 12.3 Gradient Descent
Gradient Descent is a first-order optimization algorithm that iteratively moves opposite to the gradient.

### Update Law
$$x_{k+1} = x_k - s [\nabla f(x_k)]^T$$
where $s > 0$ is the **step size** (learning rate).
* **Step Size Sensitivity:** If $s$ is too small, convergence is slow. If $s$ is too large, the algorithm will overshoot the minimum and diverge.
* **Termination:** The algorithm stops when the norm of the gradient falls below a tolerance threshold: $\|\nabla f(x_k)\|_2 < \text{tol}$.

---

## 12.4 Extrinsic Calibration (Robotics Case Study)
* **Problem:** Fusing a 3D LiDAR point cloud with 2D camera images (extrinsic calibration) by finding a rigid-body transformation:
  $$H := \begin{bmatrix} R & t \\ 0 & 1 \end{bmatrix}$$
  where $R$ is a rotation matrix and $t$ is a translation vector.
* **Formulation:** Minimizing the squared distance between projected LiDAR points and detected camera features:
  $$\arg\min_{R, t} \sum_{i=1}^{4n} \|\Pi(X_i; R, t) - Y_i\|_2^2$$
  To reduce parameters, $R$ is represented by a 3-parameter exponential map using skew-symmetric matrices.
* **Performance:** Basic Gradient Descent requires **5,745 iterations** to align the sensors.

---

## 12.5 Optimization using the Hessian
Since finding a minimum is equivalent to finding the root of the gradient ($\nabla f(x) = 0$), we can apply Newton-Raphson to the gradient. This requires the second derivative of the cost function.

### The Hessian Matrix
The Hessian matrix $\nabla^2 f(x)$ is the Jacobian of the transposed gradient, containing all second-order partial derivatives:
$$[\nabla^2 f(x)]_{ij} = \frac{\partial^2 f(x)}{\partial x_i \partial x_j}$$
* The Hessian is always a **symmetric matrix**: $[\nabla^2 f(x)]_{ij} = [\nabla^2 f(x)]_{ji}$.

### Second-Order Update (Newton's Minimization)
To update the guess, we solve the linear system for the step $\Delta x_k$ (using LU or QR decomposition):
$$\nabla^2 f(x_k) \Delta x_k = - [\nabla f(x_k)]^T$$
$$x_{k+1} = x_k + s \Delta x_k \quad (\text{where } 0 < s \le 1 \text{ is the damping factor})$$

### Optimality Verification
* **Local Minimum:** $\nabla f(x^*) = 0$ and the Hessian $\nabla^2 f(x^*)$ is **positive definite** (analogous to a positive second derivative $f''(x^*) > 0$ in 1D).
* **Local Maximum:** $\nabla f(x^*) = 0$ and the Hessian is **negative definite** ($f''(x^*) < 0$).
* **Performance Comparison:** On the Extrinsic Calibration problem, the Hessian-based Newton method converges in only **14 iterations**—a **400x speedup** over Gradient Descent.

---

## 12.6 Local vs. Global & Convexity
* **Convex Function:** A function is convex if the line segment connecting any two points on its graph lies on or above the graph:
  $$f(\alpha x + (1 - \alpha)y) \le \alpha f(x) + (1 - \alpha)f(y) \quad \text{for } 0 \le \alpha \le 1$$
* **Key Property:** Convex functions **only** have global minima (no local minima). If the Hessian is positive definite everywhere, the global minimum is unique.

---

## 12.7 Maximization
Maximizing a function $f(x)$ is mathematically equivalent to minimizing its negative:
$$\arg\max_{x \in \mathbb{R}^m} f(x) = \arg\min_{x \in \mathbb{R}^m} -f(x)$$

---

## 12.8 Quadratic Programs (QPs)
A Quadratic Program is an optimization problem with a quadratic cost function and linear equality/inequality constraints:
$$\arg\min_{x \in \mathbb{R}^m} \frac{1}{2} x^T Q x + q^x$$
$$\text{subject to: } A_{\text{in}} x \le b_{\text{in}}, \quad A_{\text{eq}} x = b_{\text{eq}}, \quad lb \le x \le ub$$
* **Uniqueness:** If $Q$ is symmetric positive definite and the feasible region is non-empty, the optimal solution exists and is unique.
* **Standard Least Squares as a QP:** The standard least squares problem $\|Ax - b\|_2^2$ can be rewritten as a QP with:
  $$Q = 2 A^T A, \quad q = -2 b^T A$$
* **Application (Splines):** QPs are used in spline regression to fit piecewise low-degree polynomials to noisy data while enforcing continuity constraints ($A_{\text{eq}} \alpha = 0$) at the boundaries ("knot points").

---

## 12.9 QP Solvers in Julia
In Julia, QPs can be solved using the **OSQP** (Operator Splitting Quadratic Program) solver. The solver wraps QPs into the general form:
$$\arg\min_x \frac{1}{2} x^T Q x + q^T x \quad \text{subject to: } l \le A x \le u$$
Piecewise splines and constrained regression are formulated in this standard form and solved in milliseconds.
