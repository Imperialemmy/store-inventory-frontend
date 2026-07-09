import React from "react";
import LabeledInput from "./LabeledInput";

interface Props {
  onSubmit: (data: SignupData) => void;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
}

export interface SignupData {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number: string;
  admin_code?: string;
}

const SignupForm: React.FC<Props> = ({ onSubmit, loading, error, isAdmin }) => {
  const [form, setForm] = React.useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone_number: "",
    admin_code: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { admin_code, ...rest } = form;
    onSubmit(isAdmin ? { ...rest, admin_code } : rest);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <LabeledInput label="User name" name="username" value={form.username} onChange={handleChange} required placeholder="e.g. akinfolu123" />
      <LabeledInput label="First name" name="first_name" value={form.first_name} onChange={handleChange} required placeholder="e.g. Ayomide" />
      <LabeledInput label="Last name" name="last_name" value={form.last_name} onChange={handleChange} required placeholder="e.g. Adeeko" />
      <LabeledInput label="Email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
      <LabeledInput label="Password" name="password" type="password" value={form.password} onChange={handleChange} required placeholder="password" />
      <LabeledInput label="Phone Number" name="phone_number" type="tel" value={form.phone_number} onChange={handleChange} required placeholder="e.g. 08012345678" />

      {isAdmin && (
        <LabeledInput
          label="Admin code"
          name="admin_code"
          value={form.admin_code}
          onChange={handleChange}
          required
          placeholder="Provided by the store owner"
        />
      )}

      {error && <p className="notice notice--error" role="alert">{error}</p>}

      <button type="submit" disabled={loading} className="button button--primary w-full">
        {loading ? "Signing up..." : isAdmin ? "Create admin account" : "Sign up as seller"}
      </button>
    </form>
  );
};

export default SignupForm;
