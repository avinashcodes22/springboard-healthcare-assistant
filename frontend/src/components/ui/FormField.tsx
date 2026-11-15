import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Eye, EyeOff } from "lucide-react";

import { useLocale } from "../../context/LocaleContext";

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
}: FieldProps) {
  const { t } = useLocale();

  return (
    <div className={`field${error ? " field--invalid" : ""}`}>
      <label className="field__label" htmlFor={htmlFor}>
        {label}
        {optional ? (
          <span className="field__optional">{t("common.optional")}</span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p className="field__hint" id={`${htmlFor}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field__error" id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function TextInput({
  className = "",
  invalid,
  ...rest
}: TextInputProps) {
  return (
    <input
      className={`input ${className}`.trim()}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  invalid?: boolean;
  showLabel: string;
  hideLabel: string;
}

export function PasswordInput({
  className = "",
  invalid,
  showLabel,
  hideLabel,
  ...rest
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div className="input-wrap">
      <input
        className={`input input--password ${className}`.trim()}
        type={visible ? "text" : "password"}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      <button
        type="button"
        className="input-wrap__toggle"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? hideLabel : showLabel}
        aria-controls={rest.id ?? id}
        aria-pressed={visible}
      >
        {visible ? (
          <EyeOff aria-hidden="true" size={20} />
        ) : (
          <Eye aria-hidden="true" size={20} />
        )}
      </button>
    </div>
  );
}

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function SelectInput({
  className = "",
  invalid,
  children,
  ...rest
}: SelectInputProps) {
  return (
    <select
      className={`select ${className}`.trim()}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function TextArea({
  className = "",
  invalid,
  ...rest
}: TextAreaProps) {
  return (
    <textarea
      className={`textarea ${className}`.trim()}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}
