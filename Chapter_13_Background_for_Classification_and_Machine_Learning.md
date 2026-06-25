# Chapter 13: Background for Classification and Machine Learning

## Overview
This chapter presents the mathematical foundations of classification and machine learning, linking geometric concepts to numerical optimization. The chapter covers:
1. **Hyperplanes & Half-Spaces:** Using linear structures to segment $\mathbb{R}^n$.
2. **Signed Distance:** Computing the distance and orientation of a point relative to a hyperplane.
3. **Max-Margin Classifier (SVM):** Formulating the linear Support Vector Machine (SVM) as a Quadratic Program (QP).
4. **Orthogonal Projection:** The Orthogonal Projection Theorem, Gram matrices, and their relation to Least Squares and Normal Equations.

---

## 13.1 Separating Hyperplanes

### Lines in $\mathbb{R}^2$
To represent any line in $\mathbb{R}^2$ (including vertical lines where slope $m = \infty$), we define the line as a zero set:
$$\text{Line} := \{(x_1, x_2) \in \mathbb{R}^2 \mid a_0 + a_1 x_1 + a_2 x_2 = 0\}$$
where at least one of $a_1$ or $a_2$ is non-zero.

### Half-Spaces
A hyperplane divides the space into two disjoint regions called **half-spaces**:
$$H^+ := \{(x_1, x_2) \in \mathbb{R}^2 \mid a_0 + a_1 x_1 + a_2 x_2 > 0\}$$
$$H^- := \{(x_1, x_2) \in \mathbb{R}^2 \mid a_0 + a_1 x_1 + a_2 x_2 < 0\}$$

### Hyper-Subspaces
A subspace $N \subset \mathbb{R}^n$ with dimension $n - 1$ (co-dimension one) is a **hyper-subspace**. It can be defined as the null space of a single non-zero row vector $a^T$:
$$N = \text{null}(a^T) = \{x \in \mathbb{R}^n \mid a \cdot x = 0\}$$

### Hyperplanes (General $\mathbb{R}^n$)
A **hyperplane** $H$ is a translation of a hyper-subspace $N$ by a vector $x_c$:
$$H := x_c + N = \{x \in \mathbb{R}^n \mid a \cdot (x - x_c) = 0\}$$
The real-valued function $y(x) = a \cdot (x - x_c)$ divides $\mathbb{R}^n$ into two half-spaces:
* $H^+ := \{x \in \mathbb{R}^n \mid a \cdot (x - x_c) > 0\}$ (points forming an acute angle with normal vector $a$)
* $H^- := \{x \in \mathbb{R}^n \mid a \cdot (x - x_c) < 0\}$ (points forming an oblique angle with normal vector $a$)

---

## 13.2 Signed Distance to a Hyperplane
* **Distance to Subspace $V$:** The minimum distance from a point $x_0$ to any point in $V$:
  $$d(x_0, V) := \min_{v \in V} \|x_0 - v\|_2$$
* **Distance to Linear Variety (Translated Subspace) $W = v_c + V$:**
  $$d(x_0, W) = d(x_0 - v_c, V)$$
* **Signed Distance to Hyperplane:** For a hyperplane $H^0 := \{x \in \mathbb{R}^n \mid a \cdot (x - x_c) = 0\}$:
  * If $\|a\|_2 = 1$, the signed distance is $y(x) = a \cdot (x - x_c)$.
  * If $\|a\|_2 \neq 1$, the signed distance is $\frac{a \cdot (x - x_c)}{\|a\|_2}$.
  The absolute value of this quantity yields the Euclidean distance $d(x, H^0)$.

---

## 13.3 Max-Margin Classifier (SVM)
The goal is to find a separating hyperplane that maximizes the "margin" (buffer) between two classes of data labeled $\ell_i \in \{-1, +1\}$.

### Formulation
Represent the hyperplane as $y(x) = a^T x + a_0 = 0$. By combining the weights and bias into $w = \begin{bmatrix} a \\ a_0 \end{bmatrix}$ and appending $1$ to the inputs ($\tilde{x}_i = \begin{bmatrix} x_i \\ 1 \end{bmatrix}$), the separation constraints are written as:
$$\ell_i(w^T \tilde{x}_i) \ge 1, \quad i = 1, \dots, n$$

### Optimization (Quadratic Program)
The max-margin classifier is formulated as the following QP:
$$\min_{w \in \mathbb{R}^{d+1}} \frac{1}{2} \|w\|_2^2 \quad \text{subject to: } \ell_i(w^T \tilde{x}_i) \ge 1$$
For a new query point $x_{\text{data}}$, the predicted class is:
$$\text{Class} = \text{sign}(a^* \cdot x_{\text{data}} + a_0^*)$$

---

## 13.4 Orthogonal Projection

### Orthogonal Projection Theorem
Let $V$ be a subspace of $\mathbb{R}^n$ and $x_0$ be a point. There exists a unique vector $x^* \in V$ that minimizes the distance $\|x_0 - x\|_2$. This unique minimizer is characterized by:
$$x^* = \arg\min_{x \in V} \|x_0 - x\|_2^2 \iff (x_0 - x^*) \perp V \text{ and } x^* \in V$$
* **Error Vector:** $x_0 - x^*$ is orthogonal to $V$.
* **Pythagorean Theorem:** $\|x_0 - x^*\|_2^2 + \|x^*\|_2^2 = \|x_0\|_2^2$.

### Computing the Projection
1. **Orthonormal Basis $\{v_1, \dots, v_m\}$:**
   $$x^* = \sum_{k=1}^m (x_0 \cdot v_k) v_k$$
2. **Orthogonal Basis $\{v_1, \dots, v_m\}$:**
   $$x^* = \sum_{k=1}^m \frac{x_0 \cdot v_k}{v_k \cdot v_k} v_k$$
3. **General Basis $\{u_1, \dots, u_m\}$:**
   $$x^* = \sum_{i=1}^m \alpha_i u_i$$
   where the coefficient vector $\alpha$ is solved using the **Normal Equations**:
   $$G \alpha = \beta \implies \begin{bmatrix} u_1 \cdot u_1 & \dots & u_1 \cdot u_m \\ \vdots & \ddots & \vdots \\ u_m \cdot u_1 & \dots & u_m \cdot u_m \end{bmatrix} \begin{bmatrix} \alpha_1 \\ \vdots \\ \alpha_m \end{bmatrix} = \begin{bmatrix} u_1 \cdot x_0 \\ \vdots \\ u_m \cdot x_0 \end{bmatrix}$$
   The matrix $G$ is the symmetric, invertible **Gram Matrix** ($G_{ij} = u_i^T u_j$).

### Connection to Least Squares
Let $U$ be a matrix whose columns form a basis for $V$. The projection of $x_0$ onto $V$ satisfies:
$$U^T U \alpha^* = U^T x_0, \quad x^* = U\alpha^*$$
If we set $U = A$ (matrix columns) and $x_0 = b$ (target vector), the projection normal equations match the least-squares equations:
$$A^T A x^* = A^T b$$
This proves that solving a standard least-squares problem is geometrically equivalent to finding the orthogonal projection of $b$ onto the column span of $A$.

### Projection onto Linear Varieties ($W = v_c + V$)
To project $x_0$ onto a translated subspace $W$:
1. Subtract the offset: $x_0' = x_0 - v_c$.
2. Project $x_0'$ onto $V$ to get $v^*$.
3. Add the offset back: $w^* = v^* + v_c$.
