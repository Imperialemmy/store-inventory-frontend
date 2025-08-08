import useLogin from "./useLogin";
import styles from "./login.module.css";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const Login = () => {
  const {
    username,
    password,
    showPassword,
    error,
    setUsername,
    setPassword,
    setShowPassword,
    handleLogin,
  } = useLogin();

  return (
    <div className= {styles.loginBackground}>
      <form 
        onSubmit={handleLogin}
        className="backdrop-blur-md bg-white/70 p-6 rounded-xl shadow-md w-full max-w-md"
      >
        <h2 className={`text-2xl font-semibold mb-4 text-center ${styles.title}`}>Akinfolu foods</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <div className="relative w-full mb-4">
        <input
          type="text"
          placeholder="Username"
          className="w-full mb-3 px-4 py-2 border rounded-sm"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        </div>
      <div className="relative w-full mb-4">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          className="w-full mb-4 px-4 py-2 border rounded-md"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-2"
      >
        {showPassword ? (
          <EyeSlashIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <EyeIcon className="h-5 w-5 text-gray-500" />
        )}
      </button>
    </div>

        <button
          type="submit"
          className="w-full bg-blue-500/80 backdrop-blur-md text-white py-2 rounded-md shadow hover:bg-blue-500/100 transition"
        >
          Login
        </button>

          {/* Forgot password link */}
        <div className="text-center mt-3 space-y-1">
          <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Forgot password?
          </a>
        </div>

          {/* Sign up link */}
        <div className= "text-center">
          <span className="text-sm center text-gray-600">Don't have an account? </span>
            <a href="/signup" className="text-sm text-blue-600 hover:underline">
              Create one
            </a>
        </div>
      </form>
    </div>
  );
};

export default Login;
