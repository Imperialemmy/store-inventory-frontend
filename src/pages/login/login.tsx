import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Link, useSearchParams } from "react-router-dom";
import { Leaf, Shield, Store } from "lucide-react";
import styles from "./login.module.css";
import useLogin from "./useLogin";
import ThemeToggle from "../../components/ThemeToggle";

const Login = () => {
  const [params] = useSearchParams();
  const pending = params.get("pending") === "1";
  const sessionReplaced = params.get("reason") === "session-replaced";
  const passwordReset = params.get("reset") === "1";
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
    <main className={styles.authPage}>
      <div className={styles.themeToggle}><ThemeToggle className="button button--ghost button--small" /></div>
      <section className={styles.authHero} aria-label="AkinFolu Foods">
        <div className={styles.heroBrand}>
          <span className={styles.heroLogo}><Leaf size={22} /></span>
          <span className={styles.heroName}>AkinFolu Foods</span>
        </div>
        <div className={styles.heroCopy}>
          <h1>Fresh. Quality. Delivered.</h1>
          <p>The control desk for your food wholesale business — stock, sales, customers and spend, all in one place.</p>
        </div>
        <div className={styles.heroFoot}>Food inventory, without the paper chase.</div>
      </section>

      <section className={styles.authPanel}>
        <div className={styles.authCard}>
          <p className={styles.authEyebrow}>Store access</p>
          <h2>Welcome back</h2>
          <p className={styles.authIntro}>Sign in to open today’s desk.</p>

          {pending && (
            <p className={styles.authSuccess} role="status">
              Account created. An admin needs to approve it before you can sign in.
            </p>
          )}
          {passwordReset && (
            <p className={styles.authSuccess} role="status">
              Password changed. Sign in with your new password.
            </p>
          )}
          {sessionReplaced && (
            <p className={styles.authError} role="status">
              You were signed out because this account signed in on another device.
            </p>
          )}

          <form className={styles.authForm} onSubmit={handleLogin}>
            {error && <p className={styles.authError} role="alert">{error}</p>}
            <label className={styles.authField}>
              <span>Username</span>
              <input
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </label>

            <label className={styles.authField}>
              <span>Password</span>
              <div className={styles.authInputWrap}>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeSlashIcon width={19} /> : <EyeIcon width={19} />}
                </button>
              </div>
            </label>

            <button type="submit" className={styles.submitButton}>Login</button>
            <Link to="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
          </form>

          <div className={styles.signupChoice}>
            <span className={styles.signupChoice__label}>New to the team? Sign up as</span>
            <div className={styles.signupChoice__cards}>
              <Link to="/signup?role=seller" className={styles.roleCard}>
                <Store size={18} />
                <strong>Seller</strong>
                <small>Ring up sales · needs approval</small>
              </Link>
              <Link to="/signup?role=admin" className={styles.roleCard}>
                <Shield size={18} />
                <strong>Admin</strong>
                <small>Full access · needs admin code</small>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
