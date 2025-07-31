import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const useLogin = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/jwt/create/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = res.data;
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      navigate("/home");
    } catch (err) {
       console.error(err);
      setError("Login failed. Check your username and password.");
    }
  };

  return {
    username,
    password,
    error,
    setUsername,
    setPassword,
    handleLogin,
  };
};

export default useLogin;
