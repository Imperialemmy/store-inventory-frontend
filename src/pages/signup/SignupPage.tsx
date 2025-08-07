import SignupForm from './SignupForm';
import { useSignup } from './useSignup';
import styles from  '../login/login.module.css';

const SignupPage = () => {
  const { handleSignup, loading, error } = useSignup();

  return (
    <div className= {styles.loginBackground}>
      <div className="max-w-2xl w-full space-y-10 p-16 bg-white rounded-2xl shadow-xl bg-white/70 backdrop-blur-md rounded-xl shadow-md p-6">
        <h2 className={`text-2xl font-semibold ${styles.title}`}>Create an Account with Akinfolu Foods</h2>
        <SignupForm onSubmit={handleSignup} loading={loading} error={error} />
      </div>
    </div>
  );
};

export default SignupPage;
