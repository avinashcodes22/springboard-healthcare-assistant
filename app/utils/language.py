SUPPORTED_LANGUAGES: dict[str, str] = {
    "en": "English",
    "te": "Telugu",
    "hi": "Hindi",
    "ta": "Tamil",
    "kn": "Kannada",
    "ml": "Malayalam",
    "mr": "Marathi",
    "gu": "Gujarati",
    "bn": "Bengali",
}

_LANGUAGE_ALIASES: dict[str, str] = {
    "english": "en",
    "telugu": "te",
    "hindi": "hi",
    "tamil": "ta",
    "kannada": "kn",
    "malayalam": "ml",
    "marathi": "mr",
    "gujarati": "gu",
    "bengali": "bn",
    "bangla": "bn",
}

SUPPORTED_LANGUAGE_CODES = frozenset(SUPPORTED_LANGUAGES)


def normalize_language(value: str) -> str:
    """Return a supported ISO 639-1 language code.

    Accepts language codes and common English language names.
    Raises ValueError for unsupported values.
    """
    if not isinstance(value, str):
        raise ValueError("Language must be a string")

    candidate = value.strip().lower()

    if candidate in SUPPORTED_LANGUAGE_CODES:
        return candidate

    if candidate in _LANGUAGE_ALIASES:
        return _LANGUAGE_ALIASES[candidate]

    raise ValueError(
        "Unsupported language. Use one of: "
        + ", ".join(sorted(SUPPORTED_LANGUAGE_CODES))
    )
