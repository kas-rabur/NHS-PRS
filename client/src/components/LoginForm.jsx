import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "../css/LoginForm.css";

export default function LoginForm() {
  const [formData, setFormData] = useState({
    nationalId: "",
    password: ""
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nationalId: formData.nationalId,
          password: formData.password
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Login failed");
      }

      login(result.token);
      navigate("/userdashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-box">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login to PRS</h2>
        {error && <p className="error-msg">{error}</p>}

        <div className="form-group">
          <label>PRS Username</label>
          <input
            type="text"
            name="nationalId"
            value={formData.nationalId}
            onChange={handleChange}
            placeholder="Your National ID"
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Your Password"
            required
          />
        </div>

        <div className="check-remember">
          <input className="tick-box" type="checkbox" id="remember" name="remember" />
          <label htmlFor="remember">Remember me</label>
          <button type="button" className="forgot-password">Forgot Password</button>
        </div>

        <div className="login-container">
          <button className="login-button" type="submit">Login</button>
        </div>
      </form>
    </div>
  );
}
