import { useLocale } from "../../context/LocaleContext";

interface LocaleToggleProps {
  tone?: "light" | "dark";
}

export function LocaleToggle({ tone = "dark" }: LocaleToggleProps) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className={`locale-toggle locale-toggle--${tone}`}
      role="group"
      aria-label="Interface language"
    >
      <button
        type="button"
        className={locale === "en" ? "is-active" : ""}
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
      >
        EN
        <span className="sr-only">English interface</span>
      </button>
      <span className="locale-toggle__divider" aria-hidden="true" />
      <button
        type="button"
        className={locale === "te" ? "is-active" : ""}
        onClick={() => setLocale("te")}
        aria-pressed={locale === "te"}
        lang="te"
      >
        తె
        <span className="sr-only">తెలుగు ఇంటర్ఫేస్</span>
      </button>
    </div>
  );
}
