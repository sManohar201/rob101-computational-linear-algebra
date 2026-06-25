# Chapter 11: Changing Gears: Solutions of Nonlinear Equations

## Overview
This chapter shifts focus from linear equations ($Ax = b$) to systems of nonlinear equations ($f(x) = 0$). It develops numerical algorithms to solve root-finding problems using local linear approximations, introducing:
1. **Scalar Root-Finding:** Bisection Method and Newton's Method.
2. **Numerical Differentiation:** Forward, Backward, and Symmetric Difference approximations of derivatives.
3. **Vector-Valued Functions:** Partial derivatives, Gradients, and Jacobians.
4. **Systems of Nonlinear Equations:** The Newton-Raphson Algorithm.

---

## 11.1 Motivation & Simple Ideas
* **Nonlinear System:** A system where equations contain terms of degree $\neq 1$ (e.g., $x^2 + \sin(x) = 0$). Unlike linear systems, they may have zero, one, multiple, or infinitely many real solutions.
* **Root of an Equation:** A value $x^* \in \mathbb{R}^n$ such that $f(x^*) = 0$.
* **Continuity:** A function $f: \mathbb{R} \to \mathbb{R}$ is continuous if its graph can be drawn without lifting the pencil. Formally, $f$ is continuous at $x_0$ if:
  $$\lim_{x \to x_0} f(x) = f(x_0)$$

---

## 11.2 Bisection Method (Scalar Functions)
The Bisection Method is a robust root-finding algorithm for continuous functions of a single variable, $f: \mathbb{R} \to \mathbb{R}$.

### Intermediate Value Theorem (IVT)
If a continuous function $f(x)$ satisfies $f(a) \cdot f(b) < 0$ for two real numbers $a < b$, then $f$ must have opposite signs at the endpoints. Thus, there exists a root $c \in (a, b)$ such that $f(c) = 0$. The interval $[a, b]$ is said to **bracket** the root.

### Bisection Algorithm Steps
1. **Initialize:** Choose $a < b$ such that $f(a) \cdot f(b) < 0$.
2. **Compute Midpoint:** Calculate $c = \frac{a+b}{2}$.
3. **Check Termination:** If $|f(c)| \le \text{tol}$, declare convergence and return $x^* = c$.
4. **Update Bracket:**
   * If $f(c) \cdot f(a) < 0$, set $b = c$ (the root lies in $[a, c]$).
   * Otherwise, set $a = c$ (the root lies in $[c, b]$).
5. **Repeat:** Loop back to step 2.

* **Pros/Cons:** Guarantees convergence but can be slow to converge. In cases like solving $x^2 - 2 = 0$ (where root $\sqrt{2}$ is irrational), the midpoint $c$ remains rational, requiring infinite steps without a tolerance threshold.

---

## 11.3 Concept of a Derivative & Numerical Approximations
A derivative represents the **local slope** of a function at a point. Geometrically, it is the linear approximation of the function in a small neighborhood around that point.

### Calculus Definition
$$\frac{df(x_0)}{dx} := \lim_{h \to 0} \frac{f(x_0 + h) - f(x_0)}{h}$$

### Numerical Differentiation Methods
When the analytical form of the derivative is difficult to compute, we approximate it using small values of $h > 0$:
1. **Forward Difference:**
   $$\frac{df(x_0)}{dx} \approx \frac{f(x_0 + h) - f(x_0)}{h} \quad (\text{Exact for linear functions})$$
2. **Backward Difference:**
   $$\frac{df(x_0)}{dx} \approx \frac{f(x_0) - f(x_0 - h)}{h} \quad (\text{Exact for linear functions})$$
3. **Symmetric (Central) Difference:**
   $$\frac{df(x_0)}{dx} \approx \frac{f(x_0 + h) - f(x_0 - h)}{2h} \quad (\text{Exact for quadratic functions})$$

* **Differentiability:** A function is differentiable at $x_0$ if these three approximations agree as $h \to 0$. For example, $f(x) = |x|$ is not differentiable at $x_0 = 0$ because the forward difference yields $+1$ while the backward difference yields $-1$.

---

## 11.4 Newton's Method (Scalar Functions)
Newton's Method uses local slope information to converge to a root much faster than the Bisection Method.

### Derivation
Using the first-order Taylor expansion about the current guess $x_k$:
$$f(x) \approx f(x_k) + \frac{df(x_k)}{dx}(x - x_k)$$
To find the next guess $x_{k+1}$ that approximates the root, we set $f(x_{k+1}) = 0$:
$$0 \approx f(x_k) + \frac{df(x_k)}{dx}(x_{k+1} - x_k)$$
Solving for $x_{k+1}$ gives the standard update rule:
$$x_{k+1} = x_k - \left(\frac{df(x_k)}{dx}\right)^{-1} f(x_k)$$

### Damped Newton's Method
If the linear approximation is poor, Newton's method can take excessively large steps and diverge. To mitigate this, a damping factor $\epsilon \in (0, 1)$ is added:
$$x_{k+1} = x_k - \epsilon \left(\frac{df(x_k)}{dx}\right)^{-1} f(x_k)$$

---

## 11.5 Vector-Valued Functions: Gradients and Jacobians
For functions $f: \mathbb{R}^m \to \mathbb{R}^n$, the derivative generalizes to multi-dimensional structures.

### Partial Derivatives
A partial derivative represents the slope of a multi-variable function with respect to one variable, holding all other variables constant:
$$\frac{\partial f(x_0)}{\partial x_j} := \lim_{h \to 0} \frac{f(x_0 + h e_j) - f(x_0)}{h}$$
where $e_j$ is the $j$-th canonical basis vector.

### The Gradient
For a scalar-valued function ($f: \mathbb{R}^m \to \mathbb{R}$), the gradient $\nabla f(x_0)$ is the row vector of its partial derivatives:
$$\nabla f(x_0) := \begin{bmatrix} \frac{\partial f(x_0)}{\partial x_1} & \frac{\partial f(x_0)}{\partial x_2} & \dots & \frac{\partial f(x_0)}{\partial x_m} \end{bmatrix}$$
The linear approximation of a scalar function is given by:
$$f(x) \approx f(x_0) + \nabla f(x_0)(x - x_0)$$

### The Jacobian Matrix
For a vector-valued function ($f: \mathbb{R}^m \to \mathbb{R}^n$), the Jacobian matrix $\frac{\partial f(x)}{\partial x}$ packages the partial derivative vectors of each component function:
$$\frac{\partial f(x)}{\partial x} := \begin{bmatrix} \frac{\partial f(x)}{\partial x_1} & \frac{\partial f(x)}{\partial x_2} & \dots & \frac{\partial f(x)}{\partial x_m} \end{bmatrix} = \begin{bmatrix} \frac{\partial f_1(x)}{\partial x_1} & \dots & \frac{\partial f_1(x)}{\partial x_m} \\ \vdots & \ddots & \vdots \\ \frac{\partial f_n(x)}{\partial x_1} & \dots & \frac{\partial f_n(x)}{\partial x_m} \end{bmatrix}$$
Its linear approximation is:
$$f(x) \approx f(x_0) + \frac{\partial f(x_0)}{\partial x}(x - x_0)$$

---

## 11.6 Newton-Raphson Algorithm (Vector Functions)
The Newton-Raphson algorithm solves systems of nonlinear equations $f(x) = 0$ where $f: \mathbb{R}^n \to \mathbb{R}^n$.

### Update Formulation
Using the vector linear approximation, we define the update vector $\Delta x_k = x_{k+1} - x_k$:
$$\frac{\partial f(x_k)}{\partial x} \Delta x_k = -f(x_k)$$
To avoid computing the matrix inverse of the Jacobian, we solve this linear system in two steps:
1. **Solve for step:** Compute $\Delta x_k$ from the linear system using LU or QR factorization.
2. **Update guess:** 
   $$x_{k+1} = x_k + \Delta x_k \quad (\text{or } x_{k+1} = x_k + \epsilon \Delta x_k \text{ for damped version})$$

---

## 11.8 Looking Ahead: Optimization
Approximating nonlinear functions locally with linear structures (gradients and Jacobians) forms the foundation of modern **optimization** algorithms (e.g., finding the minimum or maximum of a loss function $c(x)$). In the next chapter, these derivatives will be used to generalize least-squares and regression techniques to nonlinear datasets.
