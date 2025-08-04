import { useState } from 'react';
import { signupUser } from './authService';
import { useNavigate } from 'react-router-dom';

export const useSignup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (data: { username: string; first_name: string; last_name: string; email: string; password: string; phone_number: string; }) => {
    setLoading(true);
    setError(null);
    try {
      await signupUser(data);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return { handleSignup, loading, error };
};
