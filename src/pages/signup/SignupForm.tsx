import React from "react";
import LabeledInput from "./LabeledInput";

interface Props {
  onSubmit: (data: any) => void;
  loading: boolean;
  error: string | null;
}

const SignupForm: React.FC<Props> = ({ onSubmit, loading, error }) => {
  const [form, setForm] = React.useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone_number: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 border-b border-gray-900/10 pb-12">
      <LabeledInput label="Username" name="username" value={form.username} onChange={handleChange} required placeholder="username" />
      <LabeledInput label="Firstname" name="first_name" value={form.first_name} onChange={handleChange} required placeholder="first name"/>
      <LabeledInput label="Lastname" name="last_name" value={form.last_name} onChange={handleChange} required placeholder="last name"/>
      <LabeledInput label="Email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com"/>
      <LabeledInput label="Password" name="password" type="password" value={form.password} onChange={handleChange} required placeholder="password" />
      <LabeledInput label="Phone Number" name="phone_number" type="tel" value={form.phone_number} onChange={handleChange} required placeholder="phone number" />

      {error && <p className="text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-md shadow hover:bg-blue-700 transition"
      >
        {loading ? "Signing up..." : "Sign Up"}
      </button>
    </form>
  );
};

export default SignupForm;