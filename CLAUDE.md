# CLAUDE.md — Projektgrund

> Det här är inte ett strikt kontrakt utan en **gemensam grund**. Använd fantasin fritt, föreslå förbättringar, ifrågasätt val. När du är osäker — fråga hellre än att gissa.

---

## 1. Vad vi bygger

En digital ersättare för en kunds papper-och-penna-flöde. Slutmålet är dubbelt:

1. **Imponera och stänga affären.** Det här är säljmaterial — det måste se proffsigt ut, kännas snabbt, och fungera utan tafs på golden path.
2. **Vara en bra grund att bygga vidare på** när kunden köpt in. Inte en prototyp som måste skrivas om.

**Domänen är öppen.** Vi vet inte än om kunden är en grossist, klinik, verkstad, butik eller något annat. Sektion 11 fylls i när det klarnar.

---

## 2. Hur vi jobbar ihop

- Du får — och ska — föreslå funktioner, alternativ, designval. Det är önskat.
- När jag säger "bygg X", bygg X. När du har en bättre idé, säg till och vänta på OK.
- Stora ändringar (>200 rader) — dela upp i flera commits/PR.
- Innan migrations — visa SQL-diff och rationalen. DB-ändringar är dyra att rulla tillbaka.
- Vid val mellan två rimliga lösningar — välj den enklare. YAGNI.
- Tester på minst happy path innan något kallas klart.
- Lämna en kort `## Nästa steg`-lista i slutet av varje session.

---

## 3. Demo-principer (det här är säljmaterial)

- **Golden path är heligt.** Den vanligaste användarvägen ska vara silkeslen. Edge cases får hänga med, men huvudflödet ska aldrig kännas halvfärdigt.
- **Hastighet är ett feature.** Sub-100ms på interaktioner där det går. Skeletons istället för spinners.
- **Inga placeholders i demo.** Lorem ipsum, "TODO", `console.log("hej")` — bort innan vi visar.
- **Mikro-interaktioner.** Hovers, transitions, optimistiska updates. Det är skillnaden mellan "okej" och "wow".
- **Mobilvänligt.** Kunden kommer scrolla på sin telefon innan mötet. Den vyn räknas.
- **Tom data är ett designtillfälle.** Empty states ska säga vad användaren kan göra härnäst, inte bara "Inget hittades".

---

## 4. Tech stack

| Lager | Val | Varför |
|---|---|---|
| Build | **Vite** | Snabb, modern, statisk output |
| Frontend | **React + TypeScript (strict)** | Stort ekosystem, typesäkerhet |
| Router | **React Router** eller **TanStack Router** | Välj när vi vet komplexiteten |
| Styling | **Tailwind v4** | Snabb iteration, konsekvent design |
| Komponenter | **shadcn/ui + Radix** | Tillgängligt, no-lockin, snyggt |
| Forms | **react-hook-form + zod** | Validering end-to-end |
| Tabeller | **TanStack Table** | För datatunga listor |
| Backend | **Supabase** (Postgres, Auth, Storage, Realtime, Edge Functions) | Allt-i-ett, RLS för säkerhet |
| ORM/Migrations | **Drizzle** | Typad SQL, versionsstyrda migrations |
| Auth | **Supabase Auth** (email + magic link) | RLS gör resten |
| Datum | **date-fns** + Europe/Stockholm | UTC i DB, lokalt i UI |
| Pengar (om relevant) | **dinero.js** eller integerören | Aldrig `number` direkt |
| PDF (om relevant) | **@react-pdf/renderer** | Fakturor, etiketter, rapporter |
| Email (om relevant) | **Resend** | Transaktionell mail |
| Streckkod (om relevant) | **BarcodeDetector API** + `@zxing/browser` fallback | |
| Testing | **Vitest** + **Playwright** | Unit + e2e |
| Linting | **Biome** | Ersätter ESLint+Prettier |
| Hosting | **one.com** (statisk via SFTP) + **Supabase managed** | |
| CI/CD | **GitHub Actions** | Build + SFTP + Supabase migrations på push |
| Domän | `portal.karimkhalil.se` (DNS via one.com) | |

**Regel:** Lägg bara till bibliotek vi faktiskt behöver. Inga preemptiva installationer "för säkerhets skull".

---

## 5. Repo-struktur

```
.
├── src/
│   ├── components/        # PascalCase, små återanvändbara
│   ├── features/          # Feature-baserade moduler (logik + UI ihop)
│   ├── lib/               # supabase-client, utils, formatters
│   ├── routes/            # eller pages/ beroende på router
│   └── main.tsx
├── supabase/
│   ├── migrations/        # Drizzle-genererade SQL-migrations
│   ├── functions/         # Edge Functions (Deno)
│   └── seed.sql
├── public/
├── .github/workflows/
│   └── deploy.yml
├── docs/                  # ADR, domänregler, runbooks
├── CLAUDE.md
└── README.md
```

---

## 6. Kodstandard

- **TypeScript strict + `noUncheckedIndexedAccess`.** Inga `any`. `unknown` + narrowing när typ är okänd.
- **Filnamn:** `kebab-case`. **Komponenter:** `PascalCase`. **Funktioner:** `camelCase`. **Konstanter:** `SCREAMING_SNAKE_CASE`.
- **Affärslogik utanför komponenter** — i `src/lib` eller feature-moduler.
- **Inga magic strings/numbers.** Konstanter eller DB-enums.
- **Pengar:** `numeric(14,2)` i DB. I JS — `dinero.js` eller heltal i öre. Aldrig `number` direkt.
- **Datum:** `timestamptz` i DB (UTC). Visa Europe/Stockholm i UI.
- **Klientvalidering är UX, serverside-validering är säkerhet.** zod på båda sidor, men förlita dig aldrig på klienten.
- **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:` ...). En commit = en tankegång.
- **Branchstrategi:** trunk-based. `main` deployar live; allt annat går via PR.

---

## 7. Säkerhet

- **RLS är PÅ för alla tabeller** från första migrationen. Inga undantag.
- `service_role`-nyckeln används ENDAST i Edge Functions, aldrig i frontend.
- `SUPABASE_ANON_KEY` är publik och får ligga i bundlen — den ger bara det RLS tillåter.
- **Roller** lagras i `auth.users.app_metadata` (inte `user_metadata` — användaren kan ändra det själv).
- **Hemligheter** i GitHub Actions secrets + Supabase Vault. Aldrig i repot, aldrig i `.env` som committas.
- **GDPR-tänk** från start: minimal datainsamling, krypterad transport (HTTPS överallt), exportbar/raderbar per user på begäran.

---

## 8. Deploy

GitHub Actions workflow på push till `main`:
1. Bygger med Vite (`pnpm build` → `dist/`).
2. SFTP:ar `dist/` till one.com.
3. Kör eventuella nya Supabase-migrations.
4. (Senare:) Skickar Lighthouse-rapport till PR.

**Secrets som behövs i GitHub Actions:**
- `ONE_COM_HOST`, `ONE_COM_USER`, `ONE_COM_PASSWORD` (eller SSH-nyckel om one.com-planen stödjer det)
- `SUPABASE_DB_URL` (för migrations)
- `SUPABASE_ACCESS_TOKEN` (för CLI)
- `SUPABASE_PROJECT_REF`

**Branchskydd:** push direkt till `main` blockerat. Allt via PR.

---

## 9. Vad du inte ska göra

- Pusha till `main` direkt — alltid via branch + PR.
- Lägga affärslogik i React-komponenter.
- Hantera pengar som `number` (float-fel kostar pengar och förtroende).
- Stänga av RLS "tillfälligt".
- Hårdkoda config — använd en `app_settings`-tabell eller env vars.
- Installera bibliotek utan att motivera valet i PR-beskrivningen.
- Anta att en uppgift är klar utan minst happy path-test.
- Lämna `console.log`, `TODO`, eller mockdata som ser ut som riktig kunddata i demovisning.

---

## 10. Vad du *får* göra (och uppmuntras till)

- Föreslå features kunden inte tänkt på men kommer älska.
- Föreslå förbättringar av existerande val (även de i den här filen).
- Skapa skissar / wireframes / mockups i kod när det är snabbare än att diskutera i text.
- Bryta ut delar i återanvändbara komponenter när mönstret blir tydligt (men inte i förebyggande syfte).
- Ifrågasätta scope. "Behöver vi verkligen X för demo?" är en bra fråga.

---

## 11. Öppna frågor (fyll i när vi vet)

| # | Fråga | Status |
|---|---|---|
| 1 | **Bransch / domän** — vad gör kunden? | Okänt |
| 2 | **Volym** — användare, transaktioner, datamängd | Okänt |
| 3 | **Hanteras pengar?** Faktura, moms, OCR, bokföringskoppling? | Okänt |
| 4 | **Mobil-/PWA-behov?** Streckkod, plock, fält-vy? | Okänt |
| 5 | **Befintlig data** — Excel/CSV att importera? | Okänt |
| 6 | **Användare och roller** — admin, personal, kund? | Okänt |
| 7 | **Integrationer** — Fortnox, Peppol, frakt, betalning? | Okänt |
| 8 | **Demo-deadline** — när ska säljmötet hållas? | Okänt |
| 9 | **Brand** — kundens logotyp, färger, ton? | Okänt |

Markera `[BESLUT KRÄVS]` i kod/PR där dessa påverkar.

---

## 12. Glossary (svenska ↔ engelska)

Fylls i baserat på kundens domän. Generellt: **engelska i kod, svenska i UI** om kunden är svensk.

---

**Version:** 0.2 — generisk grund.
**Ägare:** Karim.
**Senast uppdaterad:** 2026-05-03.
