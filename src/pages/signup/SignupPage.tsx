import { Leaf } from 'lucide-react';
import SignupForm from './SignupForm';
import { useSignup } from './useSignup';
import styles from '../login/login.module.css';

const SignupPage = () => {
  const { handleSignup, loading, error } = useSignup();

  return (
    <main className={styles.authPage}>
      <section className={styles.authHero} aria-label="AkinFolu Foods">
        <div className={styles.heroBrand}>
          <span className={styles.heroLogo}><Leaf size={22} /></span>
          <span className={styles.heroName}>AkinFolu Foods</span>
        </div>
        <div className={styles.heroCopy}>
          <h1>Join the store team.</h1>
          <p>Create your account and keep product information dependable from delivery to shelf.</p>
        </div>
        <div className={styles.heroFoot}>One team. One clear inventory.</div>
      </section>

      <section className={styles.authPanel}>
        <div className={styles.authCard}>
          <p className={styles.authEyebrow}>Team registration</p>
          <h2>Create your account</h2>
          <p className={styles.authIntro}>Use your work details so the team knows who is making updates.</p>
          <SignupForm onSubmit={handleSignup} loading={loading} error={error} />
        </div>
      </section>
    </main>
  );
};

export default SignupPage;
