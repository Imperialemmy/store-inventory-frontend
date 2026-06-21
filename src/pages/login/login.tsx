import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
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
      <section className={styles.authStory} aria-label="AkinFolu Foods">
        <div className={styles.storyBrand}>AkinFolu Foods · Lagos</div>
        <div className={styles.storyCopy}>
          <h1>Know what is on every shelf.</h1>
          <p>A calm, reliable control desk for products, pack sizes, stock batches, and the people keeping the store moving.</p>
        </div>
        <div className={styles.storyFoot}>Food inventory, without the paper chase.</div>
      </section>

      <section className={styles.authPanel}>
        <div className={styles.authCard}>
          <p className={styles.authEyebrow}>Store access</p>
          <h2>Welcome back</h2>
          <p className={styles.authIntro}>Sign in to open today’s inventory desk.</p>

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

            <button type="submit" className={styles.submitButton}>Open inventory desk</button>
          </form>

          <div className={styles.authLinks}>
            <span>New to the team? <Link to="/signup">Create an account</Link></span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
