import { useState } from 'react';
import { signupUser } from './authService';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { SignupData } from './SignupForm';

type ValidationPayload = Record<string, unknown>;
export type SignupFieldErrors = Record<string, string>;

const parseSignupErrors = (payload?: ValidationPayload) => {
  const fields: SignupFieldErrors = {};
  let summary = '';
  if (!payload) return { fields, summary };
  Object.entries(payload).forEach(([field, value]) => {
    const message = (Array.isArray(value) ? value : [value])
      .filter((item): item is string => typeof item === 'string')
      .join(' ');
    if (!message) return;
    if (field === 'detail' || field === 'non_field_errors') summary = message;
    else fields[field] = message;
  });
  return { fields, summary };
};

export const useSignup = (isAdmin: boolean) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
  const navigate = useNavigate();

  const handleSignup = async (data: SignupData) => {
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      await signupUser(data);
      navigate(isAdmin ? '/login?reason=admin-created' : '/login?reason=seller-created');
      return true;
    } catch (err: unknown) {
      const parsed = axios.isAxiosError<ValidationPayload>(err)
        ? parseSignupErrors(err.response?.data)
        : { fields: {}, summary: '' };
      setFieldErrors(parsed.fields);
      setError(parsed.summary || (Object.keys(parsed.fields).length > 0
        ? 'Check the highlighted details and try again.'
        : 'The signup request could not be completed. Check the connection and try again.'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { handleSignup, loading, error, fieldErrors };
};
