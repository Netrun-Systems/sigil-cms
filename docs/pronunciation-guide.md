# Sigil CMS — Pronunciation Guide

Reference for voiceovers, demos, and presentations. Includes TTS corrections for Google Cloud TTS.

## Sigil Ecosystem

| Term | IPA | Say As | Note |
|------|-----|--------|------|
| **Sigil** | /ˈsɪdʒəl/ | **SIJ-ul** | Like "vigil" with an S. Soft G (J sound). NOT "siggil". |
| Netrun | /ˈnɛtɹʌn/ | NET-run | Two syllables, stress on first. |
| Frost | /fɹɒst/ | FRAWST | The reference artist site. |
| Resonance | /ˈɹɛzənəns/ | REZ-uh-nunce | Block-level analytics plugin. |

## Netrun Products

| Term | IPA | Say As | Note |
|------|-----|--------|------|
| KOG | /kɒɡ/ | KAHG | Rhymes with "log". The CRM. |
| Intirkast | /ɪnˈtɪəɹkæst/ | in-TEER-kast | Inter + broadcast. |
| Intirfix | /ɪnˈtɪəɹfɪks/ | in-TEER-fix | Inter + fix. |
| Intirkon | /ɪnˈtɪəɹkɒn/ | in-TEER-kon | Inter + connection. |
| KAMERA | /kəˈmɛɹə/ | kuh-MARE-uh | Like "camera" with a K. |
| Charlotte | /ˈʃɑːɹlət/ | SHAR-lut | The AI orchestrator. |
| Wilbur | /ˈwɪlbɜːɹ/ | WIL-bur | The CLI client. |

## Tech Stack

| Term | IPA | Say As | Note |
|------|-----|--------|------|
| Vite | /vit/ | VEET | French for "fast". NOT "vight". |
| Drizzle | /ˈdɹɪz.əl/ | DRIZ-ul | As in light rain. The ORM. |
| PostgreSQL | /ˌpoʊstɡɹɛsˈkjuːɛl/ | post-GRES-Q-L | NOT "post-gray-sequel". |
| pnpm | — | P-N-P-M | Spell it out. |
| Turborepo | /ˈtɜːboʊˌɹɛpoʊ/ | TUR-bo-REP-oh | |
| tsup | /tiːsʌp/ | TEE-sup | TypeScript bundler. |
| Vitest | /vaɪˈtɛst/ | VY-test | |
| Zod | /zɒd/ | ZAHD | Rhymes with "odd". |
| Radix | /ˈɹeɪdɪks/ | RAY-diks | UI component library. |
| Shadcn | /ʃæd.siːɛn/ | SHAD-C-N | |

## Protocols & Acronyms

| Term | IPA | Say As | Note |
|------|-----|--------|------|
| JWT | /dʒɒt/ | JOT | Officially pronounced as a word. |
| HMAC | — | H-MAC | |
| OAuth | /ˈoʊɔːθ/ | OH-auth | |
| CORS | /kɔːɹz/ | KORZ | Say as a word. |
| SaaS | /sæs/ | SASS | Rhymes with "class". |
| YAML | /ˈjæməl/ | YAM-ul | Rhymes with "camel". |
| JSON | /ˈdʒeɪsən/ | JAY-son | Like the name Jason. |
| WOFF | /wɒf/ | WOFF | Web Open Font Format. |
| SSR | — | S-S-R | Spell it out. |
| RAG | /ɹæɡ/ | RAG | Say as a word. |

## AI Terms

| Term | IPA | Say As | Note |
|------|-----|--------|------|
| Gemini | /ˈdʒɛmɪnaɪ/ | JEM-in-eye | As in the zodiac sign. |
| pgvector | — | P-G-vector | |

## Cloud & Infrastructure

| Term | IPA | Say As | Note |
|------|-----|--------|------|
| nginx | /ˌɛndʒɪnˈɛks/ | engine-X | NOT "N-jinx". |
| Kubernetes | /ˌk(j)uːbərˈnɛtiːz/ | koo-ber-NET-eez | Often K8s. |

## Places

| Term | IPA | Say As | Note |
|------|-----|--------|------|
| Ojai | /oʊˈhaɪ/ | OH-hi | Spanish origin. NOT "oh-jay". |

---

## TTS Corrections (Google Cloud TTS)

Some words are mispronounced by Google Cloud TTS Studio voices. Use these substitutions in Studiocast scripts:

| Word | TTS Says (Wrong) | Fix: Text Sub | Fix: SSML Phoneme |
|------|-------------------|---------------|-------------------|
| Sigil | "siggil" (hard G) | Write "Sijil" | `<phoneme alphabet="ipa" ph="ˈsɪdʒəl">Sigil</phoneme>` |
| Ojai | "oh-jai" | Write "Oh-hi" | `<phoneme alphabet="ipa" ph="oʊˈhaɪ">Ojai</phoneme>` |

### Adding New Corrections

1. Generate test variants: `python3 studiocast/pronounce.py <word>`
2. If TTS is wrong, add to `TTS_CORRECTIONS` in `studiocast/pronounce.py`
3. Update this doc
4. Re-render affected tour scenes

### Audio Reference

- Full pronunciation guide: `/data/media/pronunciation-guide.mp3` (2:17)
- Lookup tool: `python3 studiocast/pronounce.py <word> [word2] ...`
- Full guide: `python3 studiocast/pronounce.py --all`
