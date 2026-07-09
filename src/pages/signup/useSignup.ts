import { useState } from 'react';
import { signupUser } from './authService';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { SignupData } from './SignupForm';

type ValidationPayload = Record<string, unknown>;

const formatSignupError = (payload?: ValidationPayload) => {
  if (!payload) return null;

  return Object.entries(payload)
    .flatMap(([field, value]) => {
      const messages = Array.isArray(value) ? value : [value];
      return messages
        .filter((message): message is string => typeof message === 'string')
        .map((message) => `${field.replace(/_/g, ' ')}: ${message}`);
    })
    .join(' ');
};

export const useSignup = (isAdmin: boolean) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (data: SignupData) => {
    setLoading(true);
    setError(null);
    try {
      await signupUser(data);
      // Admins are active immediately; sellers wait for admin approval.
      navigate(isAdmin ? '/login' : '/login?pending=1');
    } catch (err: unknown) {
      const message = axios.isAxiosError<ValidationPayload>(err)
        ? formatSignupError(err.response?.data)
        : null;
      setError(message || 'The signup request could not be completed. Check that the backend is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  return { handleSignup, loading, error };
};
