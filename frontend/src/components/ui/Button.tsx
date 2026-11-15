import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Spinner } from "./Spinner";

type ButtonVariant = "primary" | "secondary" | "terracotta" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconAfter?: ReactNode;
}

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconAfter,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Spinner label="Working" />
      ) : icon ? (
        <span className="btn__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
      {iconAfter && !loading ? (
        <span className="btn__icon btn__icon--after" aria-hidden="true">
          {iconAfter}
        </span>
      ) : null}
    </button>
  );
}
