import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { registerPatientRequest } from "../../api/auth";
import { ApiError, errorMessage } from "../../api/client";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import {
  Field,
  PasswordInput,
  TextInput,
} from "../../components/ui/FormField";
import { LanguageSelect } from "../../components/ui/LanguageSelect";
import { Notice } from "../../components/ui/Notice";
import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../context/LocaleContext";
import { usePageTitle } from "../../hooks/usePageTitle";

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  language: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PatientRegisterPage() {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const navigate = useNavigate();
  usePageTitle("Create patient account");

  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    language: locale === "te" ? "te" : "en",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return (
      <Navigate
        to={user.role === "healthcare_worker" ? "/app/worker" : "/app"}
        replace
      />
    );
  }

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  };

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (form.fullName.trim().length < 2) {
      next.fullName = t("auth.nameError");
    }
    if (!emailPattern.test(form.email.trim())) {
      next.email = t("auth.emailError");
    }
    if (form.phone.trim().length > 20) {
      next.phone = t("auth.phoneError");
    }
    if (form.password.length < 8) {
      next.password = t("auth.passwordError");
    }
    if (form.confirmPassword !== form.password) {
      next.confirmPassword = t("auth.confirmError");
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!validate()) {
      setFormError(t("auth.formRequired"));
      return;
    }

    setLoading(true);

    try {
      await registerPatientRequest({
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        password: form.password,
        preferred_language: form.language,
      });

      navigate("/login", {
        replace: true,
        state: { registered: true, email: form.email.trim() },
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setErrors({ email: error.detail });
      } else {
        setFormError(
          errorMessage(
            error,
            "We could not create your account. Please try again.",
          ),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow={t("auth.patientEyebrow")}
      title={t("auth.patientTitle")}
      intro={t("auth.patientIntro")}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError ? (
          <Notice tone="error" title={t("auth.formRequired")}>
            {formError}
          </Notice>
        ) : null}

        <Field
          label={t("auth.fullName")}
          htmlFor="full-name"
          error={errors.fullName}
        >
          <TextInput
            id="full-name"
            name="fullName"
            value={form.fullName}
            onChange={(event) => update("fullName", event.target.value)}
            invalid={Boolean(errors.fullName)}
            autoComplete="name"
            placeholder="Your full name"
            aria-describedby={errors.fullName ? "full-name-error" : undefined}
            required
          />
        </Field>

        <div className="form-grid">
          <Field
            label={t("auth.email")}
            htmlFor="register-email"
            error={errors.email}
          >
            <TextInput
              id="register-email"
              name="email"
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              invalid={Boolean(errors.email)}
              autoComplete="email"
              placeholder="you@example.org"
              aria-describedby={
                errors.email ? "register-email-error" : undefined
              }
              required
            />
          </Field>

          <Field
            label={t("auth.phone")}
            htmlFor="register-phone"
            optional
            error={errors.phone}
          >
            <TextInput
              id="register-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
              invalid={Boolean(errors.phone)}
              autoComplete="tel"
              placeholder="Optional"
              maxLength={20}
              aria-describedby={
                errors.phone ? "register-phone-error" : undefined
              }
            />
          </Field>
        </div>

        <div className="form-grid">
          <Field
            label={t("auth.password")}
            htmlFor="register-password"
            hint={t("auth.passwordHint")}
            error={errors.password}
          >
            <PasswordInput
              id="register-password"
              name="password"
              value={form.password}
              onChange={(event) => update("password", event.target.value)}
              invalid={Boolean(errors.password)}
              autoComplete="new-password"
              showLabel={t("auth.showPassword")}
              hideLabel={t("auth.hidePassword")}
              aria-describedby={
                errors.password
                  ? "register-password-error"
                  : "register-password-hint"
              }
              required
            />
          </Field>

          <Field
            label={t("auth.confirmPassword")}
            htmlFor="register-confirm-password"
            error={errors.confirmPassword}
          >
            <PasswordInput
              id="register-confirm-password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={(event) =>
                update("confirmPassword", event.target.value)
              }
              invalid={Boolean(errors.confirmPassword)}
              autoComplete="new-password"
              showLabel={t("auth.showPassword")}
              hideLabel={t("auth.hidePassword")}
              aria-describedby={
                errors.confirmPassword
                  ? "register-confirm-password-error"
                  : undefined
              }
              required
            />
          </Field>
        </div>

        <Field
          label={t("auth.preferredLanguage")}
          htmlFor="register-language"
          hint={t("auth.languageHelp")}
        >
          <LanguageSelect
            id="register-language"
            value={form.language}
            onChange={(value) => update("language", value)}
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          loading={loading}
          className="auth-form__submit"
          iconAfter={<ArrowRight size={18} />}
        >
          {loading ? t("auth.creating") : t("auth.createPatient")}
        </Button>

        <p className="auth-switch">
          {t("auth.alreadyAccount")}{" "}
          <Link to="/login">{t("auth.signIn")}</Link>
        </p>

        <div className="auth-worker-link">
          <span>{t("auth.workerQuestion")}</span>
          <Link to="/register/worker">{t("auth.workerRegister")}</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
