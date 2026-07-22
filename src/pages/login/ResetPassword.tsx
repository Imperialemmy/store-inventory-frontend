import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import styles from "./login.module.css";
import ThemeToggle from "../../components/ThemeToggle";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const ResetPassword = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        "/auth/users/reset_password_confirm/",
        { uid, token, new_password: password, re_new_password: confirm },
        { baseURL },
      );
      navigate("/login?reset=1");
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      const firstMessage = data && Object.values(data).flat()[0];
      setError(
        typeof firstMessage === "string"
          ? firstMessage
          : "This reset link is invalid or has expired. Request a new one.",
      );
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
          <h2>Choose a new password</h2>
          <p className={styles.authIntro}>Enter your new password twice to confirm it.</p>

          <form className={styles.authForm} onSubmit={handleSubmit}>
            {error && <p className={styles.authError} role="alert">{error}</p>}
            <label className={styles.authField}>
              <span>New password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <label className={styles.authField}>
              <span>Confirm new password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
              />
            </label>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? "Saving…" : "Set new password"}
            </button>
          </form>

          <div className={styles.authLinks}>
            <Link to="/forgot-password">Request a new link</Link>
            <Link to="/login">Back to login</Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ResetPassword;
