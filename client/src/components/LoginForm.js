import "../css/LoginForm.css";

function LoginForm() {
    return (
        <div className="login-box">
            <div className="login-form">
                <h2>Login Form</h2>
                <div className="form-group">
                    <label>Username</label>
                    <input type="text" id="username" name="username" placeholder="your-email@gmail.com" required />
                    <label>Password</label>
                    <input type="text" id="username" name="username" placeholder="Your Password" required />
                </div>
                <div className="check-remember">
                    <input className="tick-box" type="checkbox" id="remember" name="remember" />
                    <label >Remember me</label>
                    <button className="forgot-password">Forgot Password</button>
                </div>
                <div className="login-container">
                    <button className="login-button" type="submit">Login</button>
                </div>
            </div>
        </div>
    );
}
export default LoginForm;