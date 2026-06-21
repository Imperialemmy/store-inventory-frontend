interface LabeledInputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}

const LabeledInput: React.FC<LabeledInputProps> = ({
  label, name, type = "text", value, onChange, placeholder, required = false,
}) => (
  <div className="field">
    <label htmlFor={name}>{label}</label>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
    />
  </div>
);
export default LabeledInput;
