import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import styles from "./login.module.css";
import ThemeToggle from "../../components/ThemeToggle";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await axios.post("/auth/users/reset_password/", { email }, { baseURL });
      setSent(true);
    } catch {
      setError("Could not send the reset email. Check the address and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.authPage} style={{ gridTemplateColumns: "1fr" }}>
      <div className={styles.themeToggle}><ThemeToggle className="button button--ghost button--small" /></div>
      <section className={styles.authPanel}>
        <div className={styles.authCard}>
          <p className={styles.authEyebrow}>Account recovery</p>
          <h2>Forgot your password?</h2>
          <p className={styles.authIntro}>
            Enter your account email and we&rsquo;ll send you a link to choose a new password.
          </p>

          {sent ? (
            <p className={styles.authSuccess} role="status">
              If an account exists for <strong>{email}</strong>, a reset link is on its way.
              Check your inbox (and spam folder).
            </p>
          ) : (
            <form className={styles.authForm} onSubmit={handleSubmit}>
              {error && <p className={styles.authError} role="alert">{error}</p>}
              <label className={styles.authField}>
                <span>Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          <div className={styles.authLinks}>
            <Link to="/login">Back to login</Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ForgotPassword;
