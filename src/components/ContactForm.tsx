import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import {
  contactFormId,
  submitForm,
  type CmsForm,
  type CmsFormField,
} from "../lib/squareflo";

const fallbackFields: CmsFormField[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "email", label: "Email", type: "email", required: true },
  { key: "project", label: "Project urgency", type: "text", required: true },
  { key: "message", label: "Brief", type: "textarea", required: true },
];

type Props = {
  form: CmsForm | null;
  formId?: string;
  email?: string;
  submitButtonPreset?: string;
};

function fieldInputType(type: string) {
  if (["email", "tel", "number", "date", "url"].includes(type)) return type;
  return "text";
}

function normalizeButtonPreset(value?: string) {
  return ["primary", "secondary", "outline", "ghost"].includes(value || "")
    ? value
    : "primary";
}

export function ContactForm({ form, formId, email, submitButtonPreset }: Props) {
  const fields = form?.fields?.length ? form.fields : fallbackFields;
  const effectiveFormId = form?.id || formId || contactFormId;
  const buttonPreset = normalizeButtonPreset(submitButtonPreset);
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    try {
      if (effectiveFormId) {
        await submitForm(effectiveFormId, values);
      }
      setStatus("sent");
      setValues({});
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        {fields.map((field) => {
          const value = values[field.key] || "";
          const fieldClass = field.type === "textarea" ? "field field-wide" : "field";

          return (
            <label className={fieldClass} key={field.key}>
              <span>{field.label}</span>
              {field.type === "textarea" ? (
                <textarea
                  required={field.required}
                  value={value}
                  placeholder={field.placeholder || ""}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                />
              ) : field.type === "select" ? (
                <select
                  required={field.required}
                  value={value}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                >
                  <option value="">{field.placeholder || "Select an option"}</option>
                  {(field.options || []).map((option) => {
                    const optionValue = typeof option === "string" ? option : option.value;
                    const optionLabel = typeof option === "string" ? option : option.label;
                    return (
                      <option key={optionValue} value={optionValue}>
                        {optionLabel}
                      </option>
                    );
                  })}
                </select>
              ) : field.type === "checkbox" ? (
                <input
                  checked={value === "true"}
                  required={field.required}
                  type="checkbox"
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.key]: event.target.checked ? "true" : "",
                    }))
                  }
                />
              ) : (
                <input
                  type={fieldInputType(field.type)}
                  required={field.required}
                  value={value}
                  placeholder={field.placeholder || ""}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                />
              )}
            </label>
          );
        })}
      </div>

      <div className="form-actions">
        <button className={`btn btn-${buttonPreset}`} type="submit" disabled={status === "sending"}>
          <span>{status === "sending" ? "Sending" : form?.submit_label || "Send brief"}</span>
          <Send aria-hidden="true" size={18} />
        </button>
        {email ? (
          <a className="text-link" href={`mailto:${email}`}>
            {email}
          </a>
        ) : null}
      </div>

      {status === "sent" ? (
        <p className="form-note success">
          {form?.success_message || "Brief received. We will follow up shortly."}
        </p>
      ) : null}
      {status === "error" ? (
        <p className="form-note error">
          {email
            ? "The message could not send. Please use the email link."
            : "The message could not send. Please try again later."}
        </p>
      ) : null}
    </form>
  );
}
