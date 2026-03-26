#!/usr/bin/env python3
"""
Pronunciation Guide Lookup

Fetches IPA pronunciation from multiple sources:
1. Free Dictionary API (dictionaryapi.dev)
2. Known tech terms (hardcoded from official sources)
3. User overrides

Usage:
  python3 pronounce.py sigil drizzle postgresql vite
  python3 pronounce.py --all    # show full guide
"""

import json
import sys
import requests

# ── Known tech term pronunciations (from official sources / common usage) ──

TECH_PRONUNCIATIONS = {
    # Sigil ecosystem
    "sigil": {"ipa": "/ˈsɪdʒəl/", "spoken": "SIJ-ul", "note": "Like 'vigil' with an S. NOT 'SY-jil' or 'sig-EEL'."},
    "netrun": {"ipa": "/ˈnɛtɹʌn/", "spoken": "NET-run", "note": "Two syllables, stress on first."},
    "drizzle": {"ipa": "/ˈdɹɪz.əl/", "spoken": "DRIZ-ul", "note": "As in light rain. Drizzle ORM."},
    "sigil cms": {"ipa": "/ˈsɪdʒəl siː ɛm ɛs/", "spoken": "SIJ-ul C-M-S", "note": "Spell out CMS."},

    # JavaScript/TypeScript ecosystem
    "vite": {"ipa": "/vit/", "spoken": "VEET", "note": "French for 'fast'. Rhymes with 'feet'. NOT 'vight'."},
    "pnpm": {"ipa": "/piː ɛn piː ɛm/", "spoken": "P-N-P-M", "note": "Spell it out. Or 'performant npm'."},
    "turborepo": {"ipa": "/ˈtɜːboʊˌɹɛpoʊ/", "spoken": "TUR-bo-REP-oh", "note": "Turbo + repo."},
    "tsup": {"ipa": "/tiːsʌp/", "spoken": "TEE-sup", "note": "TypeScript bundler. T-S-up."},
    "tsx": {"ipa": "/tiː ɛs ɛks/", "spoken": "T-S-X", "note": "Spell it out."},
    "vitest": {"ipa": "/vaɪˈtɛst/", "spoken": "VY-test", "note": "Vite + test."},
    "shadcn": {"ipa": "/ʃæd.siːɛn/", "spoken": "SHAD-C-N", "note": "shad + CN. The creator's handle."},
    "radix": {"ipa": "/ˈɹeɪdɪks/", "spoken": "RAY-diks", "note": "As in radix tree. Latin root."},
    "zod": {"ipa": "/zɒd/", "spoken": "ZAHD", "note": "Rhymes with 'odd'. Schema validation library."},
    "nuxt": {"ipa": "/nʌkst/", "spoken": "NUKST", "note": "Rhymes with 'ducks-t'. Vue framework."},
    "astro": {"ipa": "/ˈæstɹoʊ/", "spoken": "AS-tro", "note": "As in astronaut."},

    # Database
    "postgresql": {"ipa": "/ˌpoʊstɡɹɛsˈkjuːɛl/", "spoken": "post-GRES-Q-L", "note": "Post-gres-Q-L. NOT 'post-gray-sequel'. The 'SQL' is spelled out."},
    "postgres": {"ipa": "/ˈpoʊstɡɹɛs/", "spoken": "POST-gres", "note": "Stress on first syllable."},
    "pgvector": {"ipa": "/piː dʒiː ˈvɛktər/", "spoken": "P-G vector", "note": "P-G then vector."},

    # Cloud/DevOps
    "kubernetes": {"ipa": "/ˌk(j)uːbərˈnɛtiːz/", "spoken": "koo-ber-NET-eez", "note": "Greek for 'helmsman'. Often K8s."},
    "nginx": {"ipa": "/ˌɛndʒɪnˈɛks/", "spoken": "engine-X", "note": "Engine-X. NOT 'N-jinx'."},
    "gcloud": {"ipa": "/dʒiː klaʊd/", "spoken": "G-cloud", "note": "G then cloud."},

    # AI/ML
    "gemini": {"ipa": "/ˈdʒɛmɪnaɪ/", "spoken": "JEM-in-eye", "note": "As in the zodiac sign."},
    "ollama": {"ipa": "/oʊˈlɑːmə/", "spoken": "oh-LAH-muh", "note": "Stress on second syllable."},
    "rag": {"ipa": "/ɹæɡ/", "spoken": "RAG", "note": "Retrieval Augmented Generation. Say as a word, not spelled out."},

    # Netrun products
    "kog": {"ipa": "/kɒɡ/", "spoken": "KAHG", "note": "Rhymes with 'log'. The CRM product."},
    "intirkast": {"ipa": "/ɪnˈtɪəɹkæst/", "spoken": "in-TEER-kast", "note": "Inter + broadcast. Stress on second syllable."},
    "intirfix": {"ipa": "/ɪnˈtɪəɹfɪks/", "spoken": "in-TEER-fix", "note": "Inter + fix."},
    "intirkon": {"ipa": "/ɪnˈtɪəɹkɒn/", "spoken": "in-TEER-kon", "note": "Inter + connection."},
    "kamera": {"ipa": "/kəˈmɛɹə/", "spoken": "kuh-MARE-uh", "note": "Like 'camera' with a K."},
    "charlotte": {"ipa": "/ˈʃɑːɹlət/", "spoken": "SHAR-lut", "note": "As in the name. The AI orchestrator."},
    "wilbur": {"ipa": "/ˈwɪlbɜːɹ/", "spoken": "WIL-bur", "note": "As in the name. The CLI client."},
    "frost": {"ipa": "/fɹɒst/", "spoken": "FRAWST", "note": "As in ice. The reference artist site."},
    "resonance": {"ipa": "/ˈɹɛzənəns/", "spoken": "REZ-uh-nunce", "note": "Block-level analytics plugin."},
    "tessera": {"ipa": "/ˈtɛsəɹə/", "spoken": "TESS-ur-uh", "note": "Latin for 'mosaic tile'. Was a name candidate."},

    # Protocols/Standards
    "oauth": {"ipa": "/ˈoʊɔːθ/", "spoken": "OH-auth", "note": "Open Authorization."},
    "jwt": {"ipa": "/dʒɒt/", "spoken": "JOT", "note": "JSON Web Token. Officially 'jot'."},
    "hmac": {"ipa": "/ˈeɪtʃmæk/", "spoken": "H-MAC", "note": "Hash-based Message Authentication Code."},
    "cors": {"ipa": "/kɔːɹz/", "spoken": "KORZ", "note": "Cross-Origin Resource Sharing. Say as a word."},
    "crud": {"ipa": "/kɹʌd/", "spoken": "KRUD", "note": "Create Read Update Delete. Say as a word."},
    "saas": {"ipa": "/sæs/", "spoken": "SASS", "note": "Software as a Service. Rhymes with 'class'."},
    "gdpr": {"ipa": "/dʒiː diː piː ɑːɹ/", "spoken": "G-D-P-R", "note": "Spell it out."},
    "wcag": {"ipa": "/ˈwɪkæɡ/", "spoken": "WI-kag", "note": "Web Content Accessibility Guidelines."},
    "ssr": {"ipa": "/ɛs ɛs ɑːɹ/", "spoken": "S-S-R", "note": "Server-Side Rendering. Spell it out."},
    "ssg": {"ipa": "/ɛs ɛs dʒiː/", "spoken": "S-S-G", "note": "Static Site Generation."},

    # Payment
    "stripe": {"ipa": "/stɹaɪp/", "spoken": "STRIPE", "note": "As in a stripe of paint."},
    "printful": {"ipa": "/ˈpɹɪntfʊl/", "spoken": "PRINT-ful", "note": "Print + ful."},

    # File formats
    "woff": {"ipa": "/wɒf/", "spoken": "WOFF", "note": "Web Open Font Format. Rhymes with 'off'."},
    "woff2": {"ipa": "/wɒf tuː/", "spoken": "WOFF-two", "note": "WOFF version 2."},
    "yaml": {"ipa": "/ˈjæməl/", "spoken": "YAM-ul", "note": "Rhymes with 'camel'. NOT 'Y-A-M-L'."},
    "json": {"ipa": "/ˈdʒeɪsən/", "spoken": "JAY-son", "note": "Like the name Jason."},
    "toml": {"ipa": "/tɒml/", "spoken": "TOM-ul", "note": "Tom's Obvious Minimal Language."},
}

# ── User overrides (add custom pronunciations here) ──

USER_OVERRIDES = {}


def lookup_dictionary(word: str) -> dict | None:
    """Fetch from the free Dictionary API."""
    try:
        resp = requests.get(f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}", timeout=5)
        if resp.status_code != 200:
            return None
        data = resp.json()
        if not isinstance(data, list) or len(data) == 0:
            return None
        entry = data[0]
        phonetic = entry.get("phonetic", "")
        audio = ""
        for p in entry.get("phonetics", []):
            if p.get("text"):
                phonetic = phonetic or p["text"]
            if p.get("audio"):
                audio = p["audio"]
        if not phonetic:
            return None
        return {"ipa": phonetic, "audio": audio, "source": "dictionaryapi.dev"}
    except Exception:
        return None


def lookup(word: str) -> dict:
    """Look up pronunciation from all sources."""
    key = word.lower().strip()

    # Check user overrides first
    if key in USER_OVERRIDES:
        return {**USER_OVERRIDES[key], "source": "user override"}

    # Check tech pronunciations
    if key in TECH_PRONUNCIATIONS:
        return {**TECH_PRONUNCIATIONS[key], "source": "tech guide"}

    # Fall back to dictionary API
    result = lookup_dictionary(key)
    if result:
        return result

    return {"ipa": "(unknown)", "spoken": "(unknown)", "note": "Not found in any source", "source": "none"}


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 pronounce.py <word> [word2] ...")
        print("       python3 pronounce.py --all")
        sys.exit(1)

    if sys.argv[1] == "--all":
        print("SIGIL CMS PRONUNCIATION GUIDE")
        print("=" * 70)
        for word, info in sorted(TECH_PRONUNCIATIONS.items()):
            print(f"\n  {word}")
            print(f"    IPA:    {info['ipa']}")
            print(f"    Say:    {info['spoken']}")
            if info.get('note'):
                print(f"    Note:   {info['note']}")
        return

    for word in sys.argv[1:]:
        info = lookup(word)
        print(f"\n  {word}")
        print(f"    IPA:     {info.get('ipa', '?')}")
        if info.get("spoken"):
            print(f"    Say:     {info['spoken']}")
        if info.get("audio"):
            print(f"    Audio:   {info['audio']}")
        if info.get("note"):
            print(f"    Note:    {info['note']}")
        print(f"    Source:  {info.get('source', '?')}")


if __name__ == "__main__":
    main()

# ── TTS Corrections ──
# Words that TTS mispronounces and need SSML or text substitution
TTS_CORRECTIONS = {
    "Sigil": {
        "ssml": '<phoneme alphabet="ipa" ph="ˈsɪdʒəl">Sigil</phoneme>',
        "text_sub": "Sijil",
        "note": "Google TTS Studio-Q says 'siggil' (hard G). Use SSML phoneme or spell as 'Sijil'.",
    },
    "Ojai": {
        "ssml": '<phoneme alphabet="ipa" ph="oʊˈhaɪ">Ojai</phoneme>',
        "text_sub": "Oh-hi",
        "note": "Spanish origin. OH-HI. Not 'oh-jay' or 'oh-jai'.",
    },
}

def apply_tts_corrections(text: str, use_ssml: bool = False) -> str:
    """Replace known mispronounced words with TTS-friendly versions."""
    for word, fix in TTS_CORRECTIONS.items():
        if use_ssml:
            text = text.replace(word, fix["ssml"])
        else:
            text = text.replace(word, fix["text_sub"])
    return text
