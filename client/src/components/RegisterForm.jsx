import "../css/RegisterForm.css";

function RegisterForm() {
    return (
        <div className="register-box">
            <div className="register-form">
                <h2>Register for PRS</h2>
                <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" name="fullname" placeholder="Your Full Name" required />
                    
                    <label>Email</label>
                    <input type="email" name="email" placeholder="Your Email" required />

                    <label>National Identifier</label>
                    <input type="text" name="NationalIdentifier" placeholder="Your National Identifier" required />

                    <label>DOB</label>
                    <input type="date" name="DOB" placeholder="dd/mm/yyyy" required />

                    <label>Address</label>
                    <input type="address" name="Address" placeholder="First Line of Address" required />

                    <label>Postcode</label>
                    <input type="text" name="Postcode" placeholder="Your Postcode" required />

                    <label>Password</label>
                    <input type="password" name="password" placeholder="Choose a Password" required />

                    <label>Confirm Password</label>
                    <input type="password" name="confirmPassword" placeholder="Confirm Password" required />
                </div>
                <div className="terms-agree">
                    <input className="tick-box" type="checkbox" id="agree" name="agree" />
                    <label htmlFor="agree">I agree to the Terms and Conditions</label>
                </div>
                <div className="register-container">
                    <button className="register-button" type="submit">Register</button>
                </div>
            </div>
        </div>
    );
}

export default RegisterForm;
