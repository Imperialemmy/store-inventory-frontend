import { useState } from 'react';
import { signupUser } from './authService';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { SignupData } from './SignupForm';

export const useSignup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (data: SignupData) => {
    setLoading(true);
    setError(null);
    try {
      await signupUser(data);
      navigate('/login');
    } catch (err: unknown) {
      const message = axios.isAxiosError<{ detail?: string }>(err)
        ? err.response?.data?.detail
        : null;
      setError(message || 'Account creation failed. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return { handleSignup, loading, error };
};
