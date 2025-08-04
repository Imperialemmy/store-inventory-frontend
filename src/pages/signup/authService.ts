import api from '../../services/api'; // your axios instance

interface SignupPayload {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number: string;
}

export const signupUser = async (payload: SignupPayload) => {
  const response = await api.post('/auth/users/', payload);
  return response.data;
};
