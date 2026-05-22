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
  submitButtonPreset?: string;
  extraData?: Record<string, string>;
  compact?: boolean;
};

function fieldInputType(type: string) {
  if (type === "phone") return "tel";
  if (["email", "tel", "number", "date", "url"].includes(type)) return type;
  return "text";
}

function normalizeButtonPreset(value?: string) {
  return ["primary", "secondary", "outline", "ghost"].includes(value || "")
    ? value
    : "primary";
}

export function ContactForm({ form, formId, submitButtonPreset, extraData, compact }: Props) {
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
        await submitForm(effectiveFormId, { ...(extraData || {}), ...values });
      }
      setStatus("sent");
      setValues({});
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className={compact ? "contact-form contact-form-compact" : "contact-form"} onSubmit={handleSubmit}>
      <div className="form-grid">
        {fields.map((field) => {
          const value = values[field.key] || "";
          const fieldClass =
            field.type === "textarea" || field.width === "full" ? "field field-wide" : "field";
          const options = field.includeOther ? [...(field.options || []), "Other"] : field.options || [];

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
                  {options.map((option) => {
                    const optionValue = typeof option === "string" ? option : option.value;
                    const optionLabel = typeof option === "string" ? option : option.label;
                    return (
                      <option key={optionValue} value={optionValue}>
                        {optionLabel}
                      </option>
                    );
                  })}
                </select>
              ) : field.type === "radio" ? (
                <div className="choice-group">
                  {options.map((option) => {
                    const optionValue = typeof option === "string" ? option : option.value;
                    const optionLabel = typeof option === "string" ? option : option.label;
                    return (
                      <label className="choice-field" key={optionValue}>
                        <input
                          checked={value === optionValue}
                          name={field.key}
                          required={field.required}
                          type="radio"
                          value={optionValue}
                          onChange={(event) =>
                            setValues((current) => ({ ...current, [field.key]: event.target.value }))
                          }
                        />
                        <span>{optionLabel}</span>
                      </label>
                    );
                  })}
                </div>
              ) : field.type === "checkbox" && options.length ? (
                <div className="choice-group">
                  {options.map((option) => {
                    const optionValue = typeof option === "string" ? option : option.value;
                    const optionLabel = typeof option === "string" ? option : option.label;
                    const selected = value ? value.split(",").filter(Boolean) : [];
                    return (
                      <label className="choice-field" key={optionValue}>
                        <input
                          checked={selected.includes(optionValue)}
                          type="checkbox"
                          value={optionValue}
                          onChange={(event) =>
                            setValues((current) => {
                              const next = event.target.checked
                                ? [...selected, optionValue]
                                : selected.filter((item) => item !== optionValue);
                              return { ...current, [field.key]: next.join(",") };
                            })
                          }
                        />
                        <span>{optionLabel}</span>
                      </label>
                    );
                  })}
                </div>
              ) : field.type === "checkbox" ? (
                <label className="choice-field solo">
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
                  <span>{field.placeholder || field.label}</span>
                </label>
              ) : field.type === "file" ? (
                <input
                  type="file"
                  required={field.required}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.key]: event.target.files?.[0]?.name || "",
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
      </div>

      {status === "sent" ? (
        <p className="form-note success">
          {form?.success_message || "Brief received. We will follow up shortly."}
        </p>
      ) : null}
      {status === "error" ? (
        <p className="form-note error">
          The message could not send. Please try again later.
        </p>
      ) : null}
    </form>
  );
}
