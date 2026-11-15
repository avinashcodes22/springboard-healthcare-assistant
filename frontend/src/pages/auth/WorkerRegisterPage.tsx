import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Clock3 } from "lucide-react";

import { registerWorkerRequest } from "../../api/auth";
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
  language: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WorkerRegisterPage() {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  usePageTitle("Healthcare worker registration");

  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    language: locale === "te" ? "te" : "en",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      await registerWorkerRequest({
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        password: form.password,
        preferred_language: form.language,
      });
      setSuccess(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setErrors({ email: error.detail });
      } else {
        setFormError(
          errorMessage(
            error,
            "We could not submit your registration. Please try again.",
          ),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        eyebrow={t("auth.workerEyebrow")}
        title={t("auth.workerSuccessTitle")}
        intro={t("auth.workerSuccessBody")}
      >
        <div className="auth-success">
          <span className="auth-success__icon" aria-hidden="true">
            <Clock3 size={30} strokeWidth={1.6} />
          </span>
          <h2>{t("auth.pendingTitle")}</h2>
          <p>{t("auth.pendingBody")}</p>
          <div className="auth-success__actions">
            <Link className="btn btn--primary btn--lg" to="/login">
              {t("auth.workerSuccessLogin")}
            </Link>
            <Link className="btn btn--secondary btn--lg" to="/">
              {t("auth.workerSuccessHome")}
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow={t("auth.workerEyebrow")}
      title={t("auth.workerTitle")}
      intro={t("auth.workerIntro")}
      asideTitle="Health education, guided by people who serve."
      asideBody="Approved healthcare workers can publish general health education for their communities."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Notice tone="warning" title={t("auth.workerNoticeTitle")}>
          {t("auth.workerNotice")}
        </Notice>

        {formError ? (
          <Notice tone="error" title={t("auth.formRequired")}>
            {formError}
          </Notice>
        ) : null}

        <Field
          label={t("auth.fullName")}
          htmlFor="worker-full-name"
          error={errors.fullName}
        >
          <TextInput
            id="worker-full-name"
            value={form.fullName}
            onChange={(event) => update("fullName", event.target.value)}
            invalid={Boolean(errors.fullName)}
            autoComplete="name"
            placeholder="Your full name"
            aria-describedby={
              errors.fullName ? "worker-full-name-error" : undefined
            }
            required
          />
        </Field>

        <div className="form-grid">
          <Field
            label={t("auth.email")}
            htmlFor="worker-email"
            error={errors.email}
          >
            <TextInput
              id="worker-email"
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              invalid={Boolean(errors.email)}
              autoComplete="email"
              placeholder="you@example.org"
              aria-describedby={errors.email ? "worker-email-error" : undefined}
              required
            />
          </Field>

          <Field
            label={t("auth.phone")}
            htmlFor="worker-phone"
            optional
            error={errors.phone}
          >
            <TextInput
              id="worker-phone"
              type="tel"
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
              invalid={Boolean(errors.phone)}
              autoComplete="tel"
              placeholder="Optional"
              maxLength={20}
              aria-describedby={errors.phone ? "worker-phone-error" : undefined}
            />
          </Field>
        </div>

        <Field
          label={t("auth.password")}
          htmlFor="worker-password"
          hint={t("auth.passwordHint")}
          error={errors.password}
        >
          <PasswordInput
            id="worker-password"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            invalid={Boolean(errors.password)}
            autoComplete="new-password"
            showLabel={t("auth.showPassword")}
            hideLabel={t("auth.hidePassword")}
            aria-describedby={
              errors.password
                ? "worker-password-error"
                : "worker-password-hint"
            }
            required
          />
        </Field>

        <Field
          label={t("auth.preferredLanguage")}
          htmlFor="worker-language"
          hint={t("auth.languageHelp")}
        >
          <LanguageSelect
            id="worker-language"
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
          {loading ? t("auth.creating") : t("auth.createWorker")}
        </Button>

        <p className="auth-switch">
          {t("auth.alreadyAccount")} <Link to="/login">{t("auth.signIn")}</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
