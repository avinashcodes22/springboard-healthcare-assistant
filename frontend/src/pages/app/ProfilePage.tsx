import { useCallback, useEffect, useState, type FormEvent } from "react";
import { BadgeCheck, Mail, ShieldCheck, UserRound } from "lucide-react";

import { errorMessage } from "../../api/client";
import { getMe, updateMe } from "../../api/users";
import { ErrorBlock, LoadingBlock } from "../../components/ui/AsyncState";
import { Button } from "../../components/ui/Button";
import { Field, TextInput } from "../../components/ui/FormField";
import { LanguageSelect } from "../../components/ui/LanguageSelect";
import { Notice } from "../../components/ui/Notice";
import { PageIntro } from "../../components/ui/PageIntro";
import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../context/LocaleContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import { languageName } from "../../lib/languages";
import type { User } from "../../types";

export function ProfilePage() {
  const { t } = useLocale();
  const { setUser } = useAuth();
  usePageTitle("My profile");

  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("en");
  const [errors, setErrors] = useState<{
    fullName?: string;
    phone?: string;
  }>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await getMe();
      setProfile(data);
      setUser(data);
      setFullName(data.full_name);
      setPhone(data.phone ?? "");
      setLanguage(data.preferred_language);
    } catch (requestError) {
      setLoadError(
        errorMessage(
          requestError,
          "We could not load your profile. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    void load();
  }, [load]);

  const startEditing = () => {
    if (!profile) return;
    setFullName(profile.full_name);
    setPhone(profile.phone ?? "");
    setLanguage(profile.preferred_language);
    setErrors({});
    setFeedback(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    if (!profile) return;
    setFullName(profile.full_name);
    setPhone(profile.phone ?? "");
    setLanguage(profile.preferred_language);
    setErrors({});
    setFeedback(null);
    setEditing(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: { fullName?: string; phone?: string } = {};

    if (fullName.trim().length < 2) nextErrors.fullName = t("auth.nameError");
    if (phone.trim().length > 20) nextErrors.phone = t("auth.phoneError");

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setFeedback(null);

    try {
      const updated = await updateMe({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        preferred_language: language,
      });
      setProfile(updated);
      setUser(updated);
      setEditing(false);
      setFeedback({ tone: "success", message: t("profile.saved") });
    } catch (requestError) {
      setFeedback({
        tone: "error",
        message: errorMessage(requestError, t("profile.failed")),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageIntro
          eyebrow={t("profile.eyebrow")}
          title={t("profile.title")}
          lead={t("profile.intro")}
        />
        <LoadingBlock />
      </>
    );
  }

  if (loadError || !profile) {
    return (
      <>
        <PageIntro
          eyebrow={t("profile.eyebrow")}
          title={t("profile.title")}
          lead={t("profile.intro")}
        />
        <ErrorBlock
          title="Profile unavailable"
          body={loadError}
          onRetry={() => void load()}
        />
      </>
    );
  }

  const roleLabel =
    profile.role === "administrator"
      ? t("profile.accountRoleAdmin")
      : profile.role === "healthcare_worker"
        ? t("profile.accountRoleWorker")
        : t("profile.accountRolePatient");

  return (
    <div className="profile-page">
      <PageIntro
        eyebrow={t("profile.eyebrow")}
        title={t("profile.title")}
        lead={t("profile.intro")}
        actions={
          !editing ? (
            <Button variant="secondary" onClick={startEditing}>
              {t("profile.edit")}
            </Button>
          ) : undefined
        }
      />

      {feedback ? (
        <Notice
          tone={feedback.tone}
          title={
            feedback.tone === "success" ? t("profile.saved") : undefined
          }
        >
          {feedback.tone === "error" ? feedback.message : null}
        </Notice>
      ) : null}

      <div className="profile-grid">
        <aside className="profile-identity">
          <span className="profile-identity__avatar" aria-hidden="true">
            {profile.full_name
              .split(" ")
              .slice(0, 2)
              .map((part) => part.charAt(0))
              .join("")
              .toUpperCase()}
          </span>
          <p className="eyebrow">{t("profile.identity")}</p>
          <h2>{profile.full_name}</h2>
          <p className="profile-identity__role">{roleLabel}</p>

          <dl className="profile-meta">
            <div>
              <dt>
                <Mail size={15} aria-hidden="true" />
                {t("profile.email")}
              </dt>
              <dd>{profile.email}</dd>
            </div>
            <div>
              <dt>
                <BadgeCheck size={15} aria-hidden="true" />
                {t("profile.status")}
              </dt>
              <dd>
                <span
                  className={`inline-status ${
                    profile.is_active ? "is-active" : "is-pending"
                  }`}
                >
                  <span aria-hidden="true" />
                  {profile.is_active
                    ? t("profile.active")
                    : t("profile.pending")}
                </span>
              </dd>
            </div>
            <div>
              <dt>
                <UserRound size={15} aria-hidden="true" />
                {t("profile.role")}
              </dt>
              <dd>{roleLabel}</dd>
            </div>
            <div>
              <dt>
                <ShieldCheck size={15} aria-hidden="true" />
                {t("profile.preferred")}
              </dt>
              <dd lang={profile.preferred_language}>
                {languageName(profile.preferred_language)}
              </dd>
            </div>
          </dl>

          <p className="profile-identity__note">
            {t("profile.readOnlyNote")}
          </p>
        </aside>

        <section className="profile-form-panel" aria-labelledby="profile-details">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">EDITABLE DETAILS</p>
              <h2 id="profile-details">
                {editing ? t("profile.edit") : t("profile.identity")}
              </h2>
            </div>
          </div>

          {!editing ? (
            <dl className="profile-detail-list">
              <div>
                <dt>{t("auth.fullName")}</dt>
                <dd>{profile.full_name}</dd>
              </div>
              <div>
                <dt>{t("auth.phone")}</dt>
                <dd>{profile.phone || t("profile.notSet")}</dd>
              </div>
              <div>
                <dt>{t("auth.preferredLanguage")}</dt>
                <dd>{languageName(profile.preferred_language)}</dd>
              </div>
            </dl>
          ) : (
            <form className="profile-form" onSubmit={handleSubmit} noValidate>
              <Field
                label={t("auth.fullName")}
                htmlFor="profile-full-name"
                error={errors.fullName}
              >
                <TextInput
                  id="profile-full-name"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setErrors((current) => ({
                      ...current,
                      fullName: undefined,
                    }));
                  }}
                  invalid={Boolean(errors.fullName)}
                  autoComplete="name"
                  aria-describedby={
                    errors.fullName ? "profile-full-name-error" : undefined
                  }
                  required
                />
              </Field>

              <Field
                label={t("auth.phone")}
                htmlFor="profile-phone"
                optional
                error={errors.phone}
              >
                <TextInput
                  id="profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setErrors((current) => ({
                      ...current,
                      phone: undefined,
                    }));
                  }}
                  invalid={Boolean(errors.phone)}
                  autoComplete="tel"
                  maxLength={20}
                  aria-describedby={
                    errors.phone ? "profile-phone-error" : undefined
                  }
                />
              </Field>

              <Field
                label={t("auth.preferredLanguage")}
                htmlFor="profile-language"
                hint={t("auth.languageHelp")}
              >
                <LanguageSelect
                  id="profile-language"
                  value={language}
                  onChange={setLanguage}
                />
              </Field>

              <div className="form-actions">
                <Button type="submit" loading={saving}>
                  {saving ? t("common.saving") : t("common.save")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
