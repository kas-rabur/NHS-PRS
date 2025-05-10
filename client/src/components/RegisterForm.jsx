import React, { useState } from "react";
import "../css/RegisterForm.css";

function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    nationalId: "",
    dob: "",
    address: "",
    postcode: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        nationalId: formData.nationalId,
        dob: formData.dob,
        address: `${formData.address}, ${formData.postcode}`,
        password: formData.password,
        roleId: "public_user",
        userType: "Public"
      };

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      alert(`Registered successfully! Your PRS ID is ${result.prsId}`);
      setFormData({
        name: "",
        email: "",
        nationalId: "",
        dob: "",
        address: "",
        postcode: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to register");
    }
  };

  return (
    <div className="register-box">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Register for PRS</h2>

        <div className="form-group">
          <label>Full Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />

          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />

          <label>National Identifier</label>
          <input type="text" name="nationalId" value={formData.nationalId} onChange={handleChange} required />

          <label>DOB</label>
          <input type="date" name="dob" value={formData.dob} onChange={handleChange} required />

          <label>Address</label>
          <input type="text" name="address" value={formData.address} onChange={handleChange} required />

          <label>Postcode</label>
          <input type="text" name="postcode" value={formData.postcode} onChange={handleChange} required />

          <label>Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />

          <label>Confirm Password</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
        </div>

        <div className="terms-agree">
          <input className="tick-box" type="checkbox" id="agree" required />
          <label htmlFor="agree">I agree to the Terms and Conditions</label>
        </div>

        <div className="register-container">
          <button className="register-button" type="submit">Register</button>
        </div>
      </form>
    </div>
  );
}

export default RegisterForm;
