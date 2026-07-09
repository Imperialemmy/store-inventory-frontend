import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import styles from "../login/login.module.css";

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
}) => {
  const isPassword = type === "password";
  const [show, setShow] = useState(false);
  const inputType = isPassword ? (show ? "text" : "password") : type;

  const input = (
    <input
      id={name}
      name={name}
      type={inputType}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
    />
  );

  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {isPassword ? (
        <div className={styles.authInputWrap}>
          {input}
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
      ) : (
        input
      )}
    </div>
  );
};
export default LabeledInput;
