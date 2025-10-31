import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      alert("Account created successfully!");
      navigate('/login'); 
      
    } catch (err) {
      setError(err.message);
      console.error('Signup error:', err);
    }
  }

  return (
    <div align="center">
      <h1>SignUp</h1>

      {error && <p style={{color: 'red'}}>{error}</p>}

      <form onSubmit={handleSubmit} aria-label="Sign up form" >
        <table role="presentation" cellPadding="8" align="center">
          <tbody>
            <tr>
              <td align="right">
                <label htmlFor="fullName">Full Name</label>
              </td>
              <td align="left">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </td>
            </tr>

            <tr>
              <td align="right">
                <label htmlFor="email">Email Address</label>
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
              <td align="right">
                <label htmlFor="confirm">Confirm Password</label>
              </td>
              <td align="left">
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </td>
            </tr>

            <tr>
              <td />
              <td align="left">
                <button type="submit">Create account</button>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  );
}

export default SignUp;