import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password required");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // stores JWT token in browser 
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      navigate("/");
    } catch (err) {
      setError("Network or server error");
      console.error(err);
    }
  }

  return (
    <div align="center">
      <h1>Login</h1>

      {error && <p align="center" role="alert">{error}</p>}

      <form onSubmit={handleSubmit} aria-label="Login form">
        <table role="presentation" cellPadding="8" align="center">
          <tbody>
            <tr>
              <td align="right">
                <label htmlFor="email">Email</label>
              </td>
              <td align="left">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </td>
            </tr>

            <tr>
              <td align="right">
                <label htmlFor="password">Password</label>
              </td>
              <td align="left">
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </td>
            </tr>

            <tr>
              <td />
              <td align="left">
                <button type="submit">Login</button>
              </td>
            </tr>

            <tr>
              <td />
              <td align="left">
                <p>
                  Don't have an account? <Link to="/signup">Sign up</Link>
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  );
}

export default Login;