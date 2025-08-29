import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = ({ setLoggedIn }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const loginData = { email, password };

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (res.ok) {
        localStorage.setItem("token", data.token); // Save token
        if (setLoggedIn) {
          setLoggedIn(true); // Update login state in parent component
        }
        navigate("/"); // Redirect to home
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong! Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupRedirect = () => {
    navigate("/signup");
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "20px" }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Password:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: isLoading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: "16px"
          }}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <p style={{ margin: 0 }}>
          Don't have an account?{" "}
          <button 
            onClick={handleSignupRedirect}
            style={{
              background: "none",
              border: "none",
              color: "#007bff",
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            Sign up here
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
