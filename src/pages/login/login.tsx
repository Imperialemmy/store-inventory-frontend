import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";
import styles from "./login.module.css";
import useLogin from "./useLogin";

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
    <main className={styles.authPage}>
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
          </form>

          <div className={styles.authLinks}>
            <span>New to the team? <Link to="/signup">Sign up</Link></span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
