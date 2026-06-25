# Appendix B and C: Ordinary Differential Equations & Robotics Sensor Models

## Overview of Appendix B: What is an Ordinary Differential Equation?
Appendix B introduces Ordinary Differential Equations (ODEs) and demonstrates how to discretize continuous-time systems into difference equations that can be simulated numerically on digital computers.

### B.1 Expanding the Concept of an Equation
* **Static Equations:** Traditional equations (e.g., $ax = b$ or $F(x) = 0$) solve for static variables.
* **Dynamic Equations:** Expand the concept to include time as a variable, where the value of a variable $x(t)$ at time $t$ depends on its history (e.g., $x(t - \delta t)$).

### B.2 Discrete vs. Continuous Time
* **Discrete Time:** Digital computers process time sequentially: $k = 1, 2, 3, \dots$
* **Difference Equation:** Expresses the next state $x[k+1]$ as a function of the current state $x[k]$:
  $$x[k+1] = \frac{1}{2}x[k] + 1, \quad x[1] = 4 \quad (\text{Initial Condition})$$
  Iterating this equation simulates the system's trajectory over time (which converges to $2.0$ in this example).

### B.3 Continuous Time Discretization
To approximate continuous physical processes, we choose a very small time step $\delta t > 0$ (e.g., $\delta t = 0.01$ seconds) and approximate the continuous variable $x(t)$ at discrete intervals: $x[k] := x(k \delta t)$. This yields the discretized difference equation:
$$x[k+1] = x[k] - \delta t(x[k] + 2)$$

### B.4 Modeling Physical Systems (ODEs)
* **Definition:** An equation that relates a function to its derivatives (rates of change).
* **Newton's Law example ($F = ma$):** For a mass $m$ falling through the air with gravity $g$ and drag coefficient $k_d$, the velocity $v(t)$ satisfies:
  $$m\frac{dv(t)}{dt} = -k_d v(t) - mg \quad (\text{Continuous ODE})$$
* **Discretizing the Derivative (Forward Difference):**
  $$\frac{dv(t)}{dt} \approx \frac{v(t + \delta t) - v(t)}{\delta t}$$
* **Forward Euler Integration:** Substituting the approximation yields the discrete simulation model:
  $$v[k+1] = v[k] - \delta t \frac{k_d}{m}v[k] - \delta t g$$

### B.5 Higher-Dimensional and Nonlinear ODEs
* **Linear Vector ODE:**
  $$\frac{dx(t)}{dt} = Ax(t) + b \implies x[k+1] = x[k] + \delta t Ax[k] + \delta t b$$
* **Nonlinear Pendulum ODE:** A pendulum of mass $m$ and length $\ell$ satisfies:
  $$\frac{dx_1(t)}{dt} = x_2(t), \quad \frac{dx_2(t)}{dt} = -\frac{g}{\ell}\sin(x_1(t))$$
* **Symmetric Difference Approximation:** For better numerical behavior, the derivative can be approximated symmetrically over $2\delta t$:
  $$\frac{dx(t)}{dt} \approx \frac{x(t + \delta t) - x(t - \delta t)}{2\delta t} \implies x[k+1] = x[k-1] + 2\delta t f(x[k])$$

---

## Overview of Appendix C: Camera and LiDAR Models for Students of Robotics
Appendix C provides the projective geometry and coordinate transformation principles that underpin robot vision and 3D sensor fusion.

### C.1 Pinhole Camera Model
Camera calibration determines the intrinsic parameters of a camera (focal length, principal point, pixel skew) to correct lens distortions. This enables the mapping of 2D pixel coordinates back to 3D rays in the real world.

### C.2 Geometrical Transformations & Homogeneous Coordinates
* **Homogeneous Coordinates:** Stacking an extra coordinate (usually $1$ or a scaling factor) allows translation, rotation, scaling, and perspective projection to be represented as linear matrix multiplications.
  * **2D Cartesian:** $\begin{bmatrix} x \\ y \end{bmatrix} \to$ **Homogeneous:** $\begin{bmatrix} x \\ y \\ 1 \end{bmatrix}$ (Infinity is represented when the final coordinate is $0$).
  * **Homogeneous $\to$ Cartesian:** Divide by the last coordinate and drop it: $\begin{bmatrix} x \\ y \\ z \end{bmatrix} \to \begin{bmatrix} x/z \\ y/z \end{bmatrix}$.

#### Coordinate Transformations
* **Translation:** 
  $$\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} = \begin{bmatrix} 1 & 0 & t_x \\ 0 & 1 & t_y \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} x \\ y \\ 1 \end{bmatrix} = T \cdot P$$
* **Scaling:**
  $$\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} = \begin{bmatrix} s_x & 0 & 0 \\ 0 & s_y & 0 \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} x \\ y \\ 1 \end{bmatrix} = S \cdot P$$
* **Rotation:**
  $$\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} = \begin{bmatrix} \cos\theta & -\sin\theta & 0 \\ \sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} x \\ y \\ 1 \end{bmatrix} = R \cdot P \quad (\text{where } R R^T = I, \det(R) = 1)$$
* **Composition:** Multiple transformations are composed via matrix multiplication (applied right-to-left): $P' = T \cdot R \cdot S \cdot P$.

### C.3 Pinhole Perspective Projection
A 3D point in the camera frame $P = (X, Y, Z)$ projects onto a 2D image plane at coordinates $(x, y)$ using similar triangles:
$$x = \frac{fX}{Z}, \quad y = \frac{fY}{Z}$$
where $f$ is the camera's focal length.

### C.4 Camera Transformation Matrices
Converting a 3D point in the world frame $X_w$ to a 2D pixel coordinate $u = [u, v, 1]^T$ involves three matrices:
1. **Extrinsic Matrix ($[R \;\; t]$):** Transforms 3D world coordinates to 3D camera coordinates:
   $$X^c = R X_w + t$$
2. **Projection Matrix ($[I_{3 \times 3} \;\; 0_{3 \times 1}]$):** Projects 3D camera coordinates to 2D normalized camera coordinates:
   $$\begin{bmatrix} x^c \\ y^c \\ 1 \end{bmatrix} = \frac{1}{Z^c} [I \;\; 0] \begin{bmatrix} X^c \\ 1 \end{bmatrix}$$
3. **Intrinsic Matrix ($K$):** Transforms 2D normalized coordinates into pixel coordinate space:
   $$K = \begin{bmatrix} \alpha & s & u_0 \\ 0 & \beta & v_0 \\ 0 & 0 & 1 \end{bmatrix}$$
   where $\alpha, \beta$ are focal length scales, $s$ is pixel skew, and $(u_0, v_0)$ is the principal point.
* **Full Projection Pipeline:**
  $$\begin{bmatrix} u' \\ v' \\ w' \end{bmatrix} = K [I \;\; 0] \begin{bmatrix} R & t \\ 0 & 1 \end{bmatrix} \begin{bmatrix} X \\ Y \\ Z \\ 1 \end{bmatrix}, \quad u = \frac{u'}{w'}, \quad v = \frac{v'}{w'}$$

### C.5 Calibration and Least Squares
To calibrate the camera's intrinsic affine parameters, we measure $N \ge 3$ known 3D-to-2D coordinates, stack the linear relationships into a system $Ax = b$, and solve via least-squares:
$$x^* = (A^T A)^{-1} A^T b$$

### C.6 Nonlinear Distortion
Actual camera lenses introduce distortions that violate the linear pinhole model:
* **Radial Distortion:** Light bends more near the lens edges (Barrel/Pincushion distortion).
* **Tangential Distortion:** Occurs when the lens and the physical sensor plane are not parallel.
Nonlinear root-finding algorithms (Newton-Raphson) are used to calibrate and undistort the images.

### C.7 & C.8 LiDAR-to-Camera Projection Map
The full projection map $\Pi(X_i; R, t) := Y_i$ projects a 3D LiDAR point cloud into a 2D image plane:
$$\begin{bmatrix} u' \\ v' \\ w' \end{bmatrix} = K \begin{bmatrix} I_{3 \times 3} \\ 0_{1 \times 3} \end{bmatrix}^T H^C_L \begin{bmatrix} x_i \\ y_i \\ z_i \\ 1 \end{bmatrix}$$
$$Y_i = \begin{bmatrix} u'/w' \\ v'/w' \end{bmatrix}$$
where $H^C_L$ is the rigid-body transformation from the LiDAR frame to the Camera frame.
