import SignupForm from './SignupForm';
import { useSignup } from './useSignup';
import styles from '../login/login.module.css';

const SignupPage = () => {
  const { handleSignup, loading, error } = useSignup();

  return (
    <main className={styles.authPage}>
      <section className={styles.authStory} aria-label="AkinFolu Foods">
        <div className={styles.storyBrand}>AkinFolu Foods · Lagos</div>
        <div className={styles.storyCopy}>
          <h1>Join the store team.</h1>
          <p>Create your inventory account and keep product information dependable from delivery to shelf.</p>
        </div>
        <div className={styles.storyFoot}>One team. One clear inventory.</div>
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
