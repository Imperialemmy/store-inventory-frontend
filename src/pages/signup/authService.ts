import api from '../../services/api';

export interface SignupPayload {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number: string;
  admin_code?: string;
}

export const signupUser = async (payload: SignupPayload) => {
  const response = await api.post('/auth/users/', payload);
  return response.data;
};
