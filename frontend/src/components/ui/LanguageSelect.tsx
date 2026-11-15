import { LANGUAGES } from "../../lib/languages";
import { SelectInput } from "./FormField";

interface LanguageSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  includeAll?: boolean;
  allLabel?: string;
}

export function LanguageSelect({
  id,
  value,
  onChange,
  invalid,
  disabled,
  includeAll = false,
  allLabel = "All languages",
}: LanguageSelectProps) {
  return (
    <SelectInput
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      invalid={invalid}
      disabled={disabled}
    >
      {includeAll ? <option value="">{allLabel}</option> : null}
      {LANGUAGES.map((language) => (
        <option key={language.code} value={language.code}>
          {language.native === language.english
            ? language.english
            : `${language.native} — ${language.english}`}
        </option>
      ))}
    </SelectInput>
  );
}
