import SignupForm from './SignupForm';
import { useSignup } from './useSignup';

const SignupPage = () => {
  const { handleSignup, loading, error } = useSignup();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full space-y-10 p-16 bg-white rounded-2xl shadow-xl">
        <h2 className="text-2xl font-semibold">Create an Account</h2>
        <SignupForm onSubmit={handleSignup} loading={loading} error={error} />
      </div>
    </div>
  );
};

export default SignupPage;
