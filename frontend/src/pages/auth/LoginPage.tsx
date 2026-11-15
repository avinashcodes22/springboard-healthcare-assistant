import { useState, type FormEvent } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { ArrowRight, Clock3 } from "lucide-react";

import { ApiError } from "../../api/client";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Field, PasswordInput, TextInput } from "../../components/ui/FormField";
import { Notice } from "../../components/ui/Notice";
import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../context/LocaleContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import { isSafeReturnPath, roleHome } from "../../lib/roles";

interface LocationState {
  registered?: boolean;
  email?: string;
  from?: string;
}

export function LoginPage() {
  const { t } = useLocale();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = location.state as LocationState | null;

  usePageTitle("Sign in");

  const [email, setEmail] = useState(state?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setPending(false);
    setLoading(true);

    try {
      const signedInUser = await login(email.trim(), password);
      const target =
        state?.from && isSafeReturnPath(state.from, signedInUser.role)
          ? state.from
          : roleHome(signedInUser.role);
      navigate(target, { replace: true });
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 403) {
        setPending(true);
      } else if (
        requestError instanceof ApiError &&
        requestError.status === 401
      ) {
        setError(t("auth.invalidCredentials"));
      } else if (requestError instanceof ApiError) {
        setError(requestError.detail);
      } else {
        setError(
          "Unable to reach Sahaaya. Check that the backend is running and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const expired = searchParams.get("expired") === "1";

  return (
    <AuthLayout
      eyebrow={t("auth.loginEyebrow")}
      title={t("auth.loginTitle")}
      intro={t("auth.loginIntro")}
      asideTitle="Return to your records, whenever you need them."
      asideBody="Your documents and history stay tied to your private account."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {expired ? (
          <Notice tone="warning">{t("auth.sessionExpired")}</Notice>
        ) : null}

        {state?.registered ? (
          <Notice tone="success">{t("auth.registered")}</Notice>
        ) : null}

        {pending ? (
          <Notice tone="warning" title={t("auth.pendingTitle")}>
            <p>{t("auth.pendingBody")}</p>
            <Link className="text-link" to="/pending-approval">
              {t("auth.pendingLink")}
              <Clock3 size={15} aria-hidden="true" />
            </Link>
          </Notice>
        ) : null}

        {error ? (
          <Notice tone="error" title={t("auth.signInFailed")}>
            {error}
          </Notice>
        ) : null}

        <Field label={t("auth.email")} htmlFor="login-email">
          <TextInput
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.org"
            required
          />
        </Field>

        <Field label={t("auth.password")} htmlFor="login-password">
          <PasswordInput
            id="login-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            showLabel={t("auth.showPassword")}
            hideLabel={t("auth.hidePassword")}
            required
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          loading={loading}
          className="auth-form__submit"
          iconAfter={<ArrowRight size={18} />}
        >
          {loading ? t("auth.signingIn") : t("auth.signIn")}
        </Button>

        <p className="auth-switch">
          {t("auth.noAccount")}{" "}
          <Link to="/register">{t("auth.createAccount")}</Link>
        </p>

        <div className="auth-worker-link">
          <span>{t("auth.workerQuestion")}</span>
          <Link to="/register/worker">{t("auth.workerRegister")}</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
