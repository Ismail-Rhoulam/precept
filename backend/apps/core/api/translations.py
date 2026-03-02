from typing import Any, Dict, List

from ninja import Router

router = Router()

# ---------------------------------------------------------------------------
# Supported languages
# ---------------------------------------------------------------------------

SUPPORTED_LANGUAGES = [
    {"code": "en", "label": "English"},
    {"code": "ar", "label": "Arabic"},
    {"code": "de", "label": "German"},
    {"code": "es", "label": "Spanish"},
    {"code": "fr", "label": "French"},
    {"code": "hi", "label": "Hindi"},
    {"code": "it", "label": "Italian"},
    {"code": "ja", "label": "Japanese"},
    {"code": "ko", "label": "Korean"},
    {"code": "nl", "label": "Dutch"},
    {"code": "pl", "label": "Polish"},
    {"code": "pt", "label": "Portuguese"},
    {"code": "ru", "label": "Russian"},
    {"code": "tr", "label": "Turkish"},
    {"code": "zh", "label": "Chinese (Simplified)"},
]

# ---------------------------------------------------------------------------
# Translation strings — keyed by language code.
# Translations will be populated here as they are added.
# ---------------------------------------------------------------------------

TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "en": {},
    # Other languages will have their strings populated here:
    # "es": {"Save": "Guardar", ...},
}


# ---------------------------------------------------------------------------
# GET /translations
# ---------------------------------------------------------------------------


@router.get("/translations", response=Dict[str, str])
def get_translations(request, lang: str = "en"):
    """
    Return a flat dict of translation strings for the requested language.
    Falls back to English if the language is not found.
    """
    return TRANSLATIONS.get(lang, TRANSLATIONS.get("en", {}))


# ---------------------------------------------------------------------------
# GET /languages
# ---------------------------------------------------------------------------


@router.get("/languages", response=List[Dict[str, str]])
def list_languages(request):
    """Return the list of supported languages with their code and label."""
    return SUPPORTED_LANGUAGES
