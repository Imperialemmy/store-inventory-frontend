import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import PageHeader from "./PageHeader";

type FormValues = Record<string, string>;

interface FieldConfig<T extends FormValues> {
  name: keyof T & string;
  label: string;
  placeholder: string;
  type?: "text" | "number";
}

interface EntityCreatePageProps<T extends FormValues> {
  eyebrow: string;
  title: string;
  description: string;
  endpoint: string;
  initialValues: T;
  fields: FieldConfig<T>[];
  successMessage: string;
  backTo: string;
}

function EntityCreatePage<T extends FormValues>({
  eyebrow,
  title,
  description,
  endpoint,
  initialValues,
  fields,
  successMessage,
  backTo,
}: EntityCreatePageProps<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      await api.post(endpoint, values);
      setValues(initialValues);
      setStatus({ tone: "success", text: successMessage });
    } catch {
      setStatus({ tone: "error", text: "Nothing was saved. Check the details and try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container page-container--narrow">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <form className="surface form-card" onSubmit={handleSubmit}>
        {status && (
          <div className={`notice notice--${status.tone}`} role="status">
            {status.text}
          </div>
        )}
        <div className="form-grid">
          {fields.map((field) => (
            <label className="field" key={field.name}>
              <span>{field.label}</span>
              <input
                name={field.name}
                type={field.type ?? "text"}
                value={values[field.name]}
                placeholder={field.placeholder}
                onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
                required
              />
            </label>
          ))}
        </div>
        <div className="form-actions">
          <Link className="button button--ghost" to={backTo}>Cancel</Link>
          <button className="button button--primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : `Save ${title.toLowerCase()}`}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EntityCreatePage;
