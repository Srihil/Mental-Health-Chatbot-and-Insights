import React, { useContext, useState } from "react";
import "./Login.css";
import assets from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import axios from "../../config/api";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { loadUserData } = useContext(AppContext);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let response;

      if (isLogin) {
        response = await axios.post("/auth/login", { email, password });
      } else {
        response = await axios.post("/auth/signup", {
          username: name,
          email,
          password,
        });
      }

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      loadUserData(user);

      // ✅ Redirect based on profile completeness
      if (!user.avatar || !user.username) {
        navigate("/profile");
      } else {
        navigate("/");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  return (
    <div className="login">
      <img className="logo" src={assets.logo_big} alt="logo" />
      <form onSubmit={handleSubmit} className="login-form">
        <h2>{isLogin ? "Login" : "Create Account"}</h2>

        {!isLogin && (
          <input
            type="text"
            placeholder="Your Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
          />
        )}

        <input
          type="email"
          placeholder="Your Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
        />

        <input
          type="password"
          placeholder="Your Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
        />

        <button type="submit">
          {isLogin ? "Login now" : "Create account"}
        </button>

        <div className="login-forgot">
          <p className="login-toggle" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Create an account " : "Already have an account? "}
            <span>{isLogin ? "Click here" : "Login here"}</span>
          </p>
          {isLogin && (
            <p className="login-toggle">
              Forgot Password?{" "}
              <span onClick={() => resetPass(email)}>Click here</span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default Login;
