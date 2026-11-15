import { ArrowRight, Languages, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { PageIntro } from "../../components/ui/PageIntro";
import { usePageTitle } from "../../hooks/usePageTitle";
import { LANGUAGES } from "../../lib/languages";

export function WorkerTranslationPage() {
  usePageTitle("Translation support");

  return (
    <>
      <PageIntro
        eyebrow="Language access"
        title="Translation support"
        lead="Sahaaya keeps language preferences and publishing languages, but it does not automatically translate medical content yet."
        actions={<span className="status-chip">Planned phase</span>}
      />

      <div className="workspace-grid">
        <section className="workspace-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Available now</p>
              <h2>Language-aware publishing</h2>
            </div>
            <Languages size={21} aria-hidden="true" />
          </div>
          <p className="panel-lead">
            You can write general health education in any of the supported
            languages and publish it to the public health library. Patients can
            save a preferred language on their account.
          </p>
          <ul className="language-chip-list" aria-label="Supported languages">
            {LANGUAGES.map((language) => (
              <li key={language.code}>
                <strong>{language.native}</strong>
                <span>{language.english}</span>
              </li>
            ))}
          </ul>
          <Link className="text-link" to="/worker/content">
            Manage health content <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>

        <section className="workspace-panel workspace-panel--roadmap">
          <p className="eyebrow">Next phase</p>
          <h2>What translation support will include</h2>
          <ol className="roadmap-list">
            <li>
              <span>01</span>
              <div>
                <strong>Assisted plain-language drafting</strong>
                <p>
                  Support for simplifying health education while preserving the
                  original meaning and clinical caution.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Human review before publishing</strong>
                <p>
                  Translated medical information will require review by a
                  qualified speaker before it becomes public.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Clear translation provenance</strong>
                <p>
                  Readers will see the source language, target language and
                  review status for translated articles.
                </p>
              </div>
            </li>
          </ol>
        </section>
      </div>

      <div className="workspace-panel workspace-panel--note">
        <ShieldCheck size={20} aria-hidden="true" />
        <div>
          <h2>Medical text needs a human in the loop.</h2>
          <p>
            Machine translation alone is not safe for clinical instructions.
            This roadmap is intentionally limited until review workflows are
            available.
          </p>
        </div>
      </div>
    </>
  );
}
