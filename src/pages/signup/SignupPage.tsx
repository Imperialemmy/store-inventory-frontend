import { Leaf } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import SignupForm from './SignupForm';
import { useSignup } from './useSignup';
import styles from '../login/login.module.css';

const SignupPage = () => {
  const [params] = useSearchParams();
  const isAdmin = params.get('role') === 'admin';
  const { handleSignup, loading, error } = useSignup(isAdmin);

  return (
    <main className={styles.authPage}>
      <section className={styles.authHero} aria-label="AkinFolu Foods">
        <div className={styles.heroBrand}>
          <span className={styles.heroLogo}><Leaf size={22} /></span>
          <span className={styles.heroName}>AkinFolu Foods</span>
        </div>
        <div className={styles.heroCopy}>
          <h1>{isAdmin ? 'Create an admin account.' : 'Join the store team.'}</h1>
          <p>
            {isAdmin
              ? 'Admins manage products and approve new sellers. You’ll need the store’s admin code.'
              : 'Sellers ring up sales and manage customers. Your account will be reviewed by an admin before you can sign in.'}
          </p>
        </div>
        <div className={styles.heroFoot}>One team. One clear inventory.</div>
      </section>

      <section className={styles.authPanel}>
        <div className={styles.authCard}>
          <p className={styles.authEyebrow}>{isAdmin ? 'Admin registration' : 'Seller registration'}</p>
          <h2>Create your account</h2>
          <p className={styles.authIntro}>
            {isAdmin ? 'Enter your details and the admin code.' : 'Sign up, then wait for an admin to approve your account.'}
          </p>
          <SignupForm onSubmit={handleSignup} loading={loading} error={error} isAdmin={isAdmin} />
          <div className={styles.authLinks} style={{ justifyContent: 'space-between' }}>
            <Link to={isAdmin ? '/signup' : '/signup?role=admin'}>
              {isAdmin ? 'Sign up as seller instead' : 'Sign up as admin instead'}
            </Link>
            <Link to="/login">Back to login</Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default SignupPage;
