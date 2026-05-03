# CLAUDE.md — Hot Chilly AB Helhetslösning

> Detta dokument är **kontrakt** mellan användaren och Claude Code. Läs hela filen innan du föreslår eller skriver kod. Vid konflikt mellan användarens prompt och denna fil — fråga, ändra inte tyst.

---

## 1. Projektöversikt

**Kund:** Hot Chilly AB — lokal grossist (livsmedel, chiliprodukter och relaterat sortiment).
**Nuläge:** All hantering sker manuellt. Inget affärssystem, ingen digital lagerstyrning, ingen kundportal. Försäljning sker fysiskt.
**Mål:** Bygga en modern, modulär helhetslösning som digitaliserar hela kedjan från inköp → lager → kundorder → leverans → fakturering, plus en B2B-portal för återkommande kunder.

**Affärsdomän = livsmedelsgrossist.** Det innebär hårda krav på:
- **Spårbarhet** (Livsmedelsverket / EU 178/2002 art. 18): vi måste kunna följa varje batch ett steg bakåt och ett steg framåt.
- **Bäst före-/sista förbrukningsdag** per batch.
- **FIFO/FEFO** vid plock (First Expired First Out för livsmedel).
- **Allergeninformation** per artikel.
- **Temperaturzoner** (om kund hanterar kyl-/frysvaror — verifiera).

Detta är inte valfritt. Bygg in det från dag ett — inte som efterhandsplåster.

---

## 2. Scope

### In scope (i ordning av prioritet)
1. **Artikel- och lagerregister** med batch/lot, bäst före, lagerplatser, FIFO/FEFO.
2. **Inköp** — leverantörsregister, inköpsorder, inleverans (med batch-registrering).
3. **Försäljning** — kunder, offert, order, plocklista, leveransavi.
4. **Fakturering** — egen fakturering + integration mot Fortnox och Peppol (e-faktura).
5. **B2B-portal** — kundinloggning, sortimentvy med kundspecifika priser, beställning, orderhistorik, fakturahistorik.
6. **Streckkodsläsning** — PWA-vy för lagerpersonal med mobilkamera (BarcodeDetector API) och stöd för USB-/Bluetooth-skannrar.
7. **Fraktintegrationer** — minst en (Postnord, DHL eller Bring) för fraktsedlar och spårning.
8. **Rapporter** — omsättning, marginal, lagervärde, ABC-analys, bristlistor, utgångsbevakning.
9. **Mobil-/PWA-vy** för lager (plock, inleverans, inventering).

### Out of scope (om inte uttryckligen aktiverat)
- Kassasystem (POS) i butik.
- Bokföring (vi skickar verifikat till Fortnox; vi är inte ett bokföringssystem).
- Lön och HR.
- Webshop mot konsument (B2C). Vi bygger B2B.
- Mobilappar i App Store/Play. Vi kör PWA.

### MVP-definition (Fas 1)
Den minsta version som ger Hot Chilly ett mätbart värde:
- Artikelregister med saldo, batch och bäst före.
- Inleverans (manuell, utan EDI).
- Kundorder + plocklista + leveransavi.
- PDF-fakturor (eget format) — Fortnox-koppling kommer i Fas 2.
- En användare/admin-vy.

**MVP är klar när Hot Chilly kan köra en hel order från inleverans till fakturering i systemet utan papper.**

---

## 3. Tech stack

| Lager | Val | Motivering |
|---|---|---|
| Frontend | **Next.js 15 (App Router) + TypeScript (strict)** | SSR/RSC, bra DX, fungerar som PWA |
| UI | **Tailwind v4 + shadcn/ui + Radix** | Snabbt, tillgängligt, no-lockin |
| Forms | **react-hook-form + zod** | Typesäker validering end-to-end |
| Tabeller | **TanStack Table** | För artikel-/orderlistor |
| Backend/DB | **Supabase (Postgres 15+)** | Auth, Storage, Realtime, RLS, Edge Functions i ett |
| ORM/Queries | **Supabase JS client + Drizzle ORM** | Drizzle för migrations och typad SQL; Supabase-client för auth/realtime/storage |
| Auth | **Supabase Auth** (email + magic link, ev. Google för admin) | RLS-policies styr åtkomst per rad |
| Filer | **Supabase Storage** | Produktbilder, fakturor PDF, leverantörsdokument |
| Edge/Jobs | **Supabase Edge Functions (Deno)** + **Vercel Cron** | Schemalagda jobb (utgångsbevakning, fakturasync) |
| Hosting | **Vercel** (frontend) + **Supabase (managed)** | Enkelt, billigt, skalar |
| PDF | **react-pdf/renderer** eller **@react-pdf/renderer** | Fakturor, plocklistor, etiketter |
| Streckkod | **BarcodeDetector API** + `@zxing/browser` som fallback | Native när det finns, ZXing annars |
| Email | **Resend** | Transaktionell mail (orderbekräftelser, fakturor) |
| Observability | **Sentry** + Supabase Logs + **Posthog** (produktanalys) | |
| Testing | **Vitest** (unit) + **Playwright** (e2e) | |
| Linting | **Biome** eller **ESLint + Prettier** | Välj Biome om inget hindrar |

### Externa integrationer (köp, bygg inte)
- **Fortnox API** — kunder, leverantörer, fakturor, betalningar, verifikat. (OAuth2.)
- **Peppol e-faktura** — via **InExchange** eller **Pagero** (välj efter pris/SLA). Bygg INTE eget Peppol-AP.
- **Frakt** — **Unifaun/nShift** om Hot Chilly redan har avtal, annars direkt mot Postnord API. Verifiera.
- **Bankgirot/Swish Företag** — om OCR-inläsning av betalningar önskas (kan ofta lösas via Fortnox istället).

> **Regel:** Bygg inte eget när det finns en mogen tredjepartstjänst. Vår tid läggs på Hot Chillys affärslogik, inte på att återimplementera Peppol.

---

## 4. Repo-struktur (monorepo)

```
hotchilly/
├── apps/
│   ├── web/              # Next.js — admin/internt + B2B-portal (samma app, olika routes/roller)
│   └── scanner/          # PWA optimerad för mobil scanning (kan vara samma Next-app med /scanner-route)
├── packages/
│   ├── db/               # Drizzle schema, migrations, seed
│   ├── shared/           # Zod-scheman, typer, konstanter, fakturalogik
│   ├── integrations/     # Fortnox, Peppol, frakt, Resend
│   └── ui/               # Delade komponenter (om värt att bryta ut)
├── supabase/
│   ├── migrations/       # SQL-migrations (även de Drizzle genererar)
│   ├── functions/        # Edge Functions
│   └── seed.sql
├── docs/
│   ├── adr/              # Architecture Decision Records
│   ├── domain.md         # Affärsregler, glossary
│   └── runbook.md        # Hur man kör jobb manuellt, rollar tillbaka, etc.
├── CLAUDE.md             # Detta dokument
└── README.md
```

Använd **pnpm workspaces** + **Turborepo** för cache och parallella builds.

---

## 5. Datamodell — kärntabeller

Detta är en startpunkt, inte facit. Validera mot Hot Chillys verkliga flöde innan migration läggs.

### Artiklar och lager
- `products` — id, sku, namn, beskrivning, kategori_id, leverantör_id, enhet (st/kg/l), moms_sats, allergens jsonb, är_aktiv
- `product_variants` — om relevant (storlek, styrka)
- `barcodes` — product_id, gtin/ean, är_primär (en artikel kan ha flera EAN: konsumentförpackning + transportförpackning)
- `warehouses` — lager (start: ett, men modellera för flera)
- `locations` — lagerplats inom warehouse (zon-rad-hylla-fack)
- `stock_batches` — id, product_id, batch_nr, leverantörs_batch_nr, bäst_före, sista_förbrukning, mottagen_datum, kostnad_per_enhet
- `stock_levels` — batch_id, location_id, antal (enskild rad per batch+plats)
- `stock_movements` — append-only ledger: typ (inleverans/plock/justering/inventering), quantity, batch_id, location_id, ref_table, ref_id, user_id, created_at

> **Viktigt:** Saldo räknas alltid ut från `stock_movements`-laget eller materialiseras i `stock_levels` via trigger. Aldrig direkt UPDATE på saldo utan motsvarande movement-rad. Spårbarhet kräver det.

### Inköp
- `suppliers` — id, namn, org_nr, peppol_id, kontakter, betalvillkor, valuta
- `purchase_orders` — id, supplier_id, status (utkast/skickad/delvis_mottagen/mottagen/stängd), datum, valuta
- `purchase_order_lines` — po_id, product_id, antal, pris, beräknad_leverans
- `goods_receipts` — id, po_id, mottagen_datum, mottagen_av
- `goods_receipt_lines` — gr_id, po_line_id, batch_nr, bäst_före, antal_mottaget, location_id

### Försäljning
- `customers` — id, namn, org_nr, kund_nr, peppol_id, kreditgräns, betalvillkor, prislista_id, leveransadress, fakturaadress
- `customer_users` — koppling från `auth.users` till `customer_id` för B2B-portal
- `price_lists` + `price_list_items` — bas + kund-/avtalsspecifika
- `quotes` (offerter) — option, ej obligatorisk för MVP
- `sales_orders` — id, customer_id, status (utkast/bekräftad/plock/levererad/fakturerad/stängd), beställd_datum, önskad_leverans
- `sales_order_lines` — order_id, product_id, antal, pris, rabatt, moms
- `picks` — order_id, plockad_av, plockad_datum
- `pick_lines` — pick_id, order_line_id, batch_id, location_id, antal
- `shipments` — order_id, fraktbolag, kollin, vikt, spårnings_nr, fraktsedel_url
- `invoices` — id, order_id (eller fritt), customer_id, fortnox_id, peppol_id, status, ocr, förfallodatum, summor
- `invoice_lines` — invoice_id, beskrivning, antal, pris, moms

### Övrigt
- `audit_log` — vem gjorde vad när (utöver Supabase Auth-loggar). Pseudonymisera vid GDPR-radering.
- `app_settings` — företagsinställningar, integrationsnycklar (krypterade), nästa_faktura_nr osv.

---

## 6. Moduler — detaljerad nedbrytning

### 6.1 Artikelregister
- CRUD på `products`, `barcodes`, `categories`.
- Bilduppladdning till Supabase Storage. Generera thumbnails via Edge Function eller transformations-API.
- Importera från CSV/Excel (Hot Chilly har troligen en befintlig artikellista — fråga efter den).
- Sök: full-text på namn + sku + ean (Postgres `tsvector` + GIN-index).

### 6.2 Lager
- Inleverans skapar `stock_batches` + `stock_levels` + `stock_movements`.
- Plock måste välja batch enligt **FEFO** (Hot Chilly är livsmedel — sista-förbrukning först). Tillåt manuell override med kommentar.
- Inventering (stocktake): användaren scannar/fyller i räknat antal per plats; differens skapar movement med typ `justering`.
- Utgångsbevakning: dagligt jobb listar batcher som närmar sig bäst före (30/14/7 dagar).

### 6.3 Inköp
- Skapa PO från brist (manuellt nu, autoförslag senare).
- Skicka PO som PDF via mail (Resend) eller Peppol om leverantör stödjer det.
- Inleverans matchar mot PO-rader; tillåt över-/underleverans med varning.

### 6.4 Försäljning & order
- Order kan skapas internt (säljaren tar telefonbeställning) eller via B2B-portalen.
- Status-maskin: `utkast → bekräftad → plock → levererad → fakturerad → stängd`. Övergångar i kod, inte i UI.
- Plock genererar plocklista sorterad efter lagerplats (gå-rutt). PWA-läge för scanner.
- Leveransavi och packsedel som PDF.

### 6.5 Fakturering
- Generera faktura från order (en eller flera ordrar per faktura).
- Fakturanummer från `app_settings.next_invoice_number` med radlås (`SELECT ... FOR UPDATE`).
- OCR enligt Modulus-10 (svensk standard) — använd `bankid-ocr` eller bygg själv (10 rader kod).
- Skicka:
  - **PDF + mail** (default).
  - **Fortnox** (push verifikat + faktura, hämta status).
  - **Peppol** via leverantör om kund har Peppol-id.

### 6.6 B2B-portal
- Egen route-grupp (`/portal/*`) i samma Next-app.
- Kunder loggar in med email + magic link.
- RLS-policy: kunder ser bara sina egna ordrar/fakturor och artiklar de har pris på.
- Funktioner: bläddra sortiment, lägg order, se orderstatus, ladda ner fakturor, favoritlistor, snabb-omorder.

### 6.7 Scanner-PWA
- Route `/scanner/*` med stor-knapp-UI för mobilskärm.
- Kameraskanning via `BarcodeDetector` (Chrome Android stöder, iOS Safari 17+ partiellt — testa).
- Fallback: USB-/BT-skanner emulerar tangentbord; lyssna på fokus-input.
- Offlinestöd: Workbox + IndexedDB för pågående plock; sync vid återanslutning.

### 6.8 Rapporter
- Dashboard: dagens omsättning, ordrar i plock, ordrar att fakturera, utgångsvarning.
- Standardrapporter som materialized views eller SQL-funktioner. Exporteras till Excel.
- ABC-analys på artiklar (omsättning + marginal).

---

## 7. Säkerhet, RLS och GDPR

- **RLS är PÅ för alla tabeller.** Inga undantag. `service_role` används endast i Edge Functions för systemoperationer.
- **Roller:** `admin`, `staff`, `customer`. Lagras i `auth.users.app_metadata` (inte `user_metadata` — den kan användaren själv ändra).
- **Customer-isolering:** policy `customer_users.user_id = auth.uid()` styr allt i portalen.
- **Audit:** alla mutationer av order, faktura, pris loggas i `audit_log` via trigger.
- **GDPR:**
  - Kund kan begära export (Edge Function som returnerar JSON-zip).
  - Radering anonymiserar personrelaterade fält men behåller transaktionsdata (lagkrav: bokföring 7 år, livsmedelsspårbarhet 2 år+).
  - Personuppgiftsbiträdesavtal med Supabase, Vercel, Resend, Fortnox, Peppol-leverantör — dokumentera i `docs/dpa/`.
- **Hemligheter:** aldrig i repo. Använd Vercel Env + Supabase Vault. Roteras minst årligen.
- **Validering:** zod på server (Server Actions / Route Handlers) — klientvalidering är bara UX, inte säkerhet.

---

## 8. Kodstandard

- **TypeScript strict + `noUncheckedIndexedAccess`.** Inga `any`. `unknown` + narrowing när typ är okänd.
- **Inga "god-objects".** Affärslogik i `packages/shared` eller domänmoduler — inte i React-komponenter.
- **Server Actions** för mutationer, **Route Handlers** för publika API:er (B2B om vi öppnar API senare).
- **Filnamn:** `kebab-case`. **Komponenter:** `PascalCase`. **Funktioner:** `camelCase`. **Konstanter:** `SCREAMING_SNAKE_CASE`.
- **Inga magic numbers eller magic strings.** Status-värden, momssatser, fakturatyper i `packages/shared/constants.ts` och som DB-enums.
- **Pengar:** alltid `numeric(14,2)` i DB. I JS/TS — använd **dinero.js** eller integerören (öre). Aldrig `number` direkt för belopp.
- **Datum:** `timestamptz` i DB, alltid UTC. **Luxon** eller **date-fns-tz** i frontend, visa Europe/Stockholm.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:` …). En commit = en tankegång.
- **Branchstrategi:** trunk-based. `main` deployar till staging via Vercel preview; tagg `vX.Y.Z` deployar till prod.

---

## 9. Utvecklingsflöde

```bash
# Setup
pnpm install
pnpm supabase start          # lokal Supabase via Docker
pnpm db:migrate              # kör Drizzle-migrations
pnpm db:seed                 # seedar testdata

# Dev
pnpm dev                     # Next.js dev-server
pnpm db:studio               # Drizzle Studio

# Test
pnpm test                    # Vitest
pnpm test:e2e                # Playwright

# Build
pnpm build
pnpm lint
pnpm typecheck

# Migrations
pnpm db:generate -- --name=add_batches  # skapa ny migration
pnpm db:push                 # applicera mot lokal Supabase
```

Varje feature: **branch → kod → test → PR → preview-deploy → review → merge.**

---

## 10. Faseplan

| Fas | Innehåll | Acceptans |
|---|---|---|
| **0** | Repo-init, Supabase-projekt, CI/CD, auth-skal, layout | `pnpm dev` fungerar, en admin kan logga in |
| **1 (MVP)** | Artiklar, batches, inleverans (manuell), order, plock, PDF-faktura | Hot Chilly kör en testkörning utan papper |
| **2** | Fortnox-integration, Peppol e-faktura, fraktintegration | Faktura går automatiskt till bokföring + e-faktura där möjligt |
| **3** | B2B-portal | Pilot med 3 utvalda kunder |
| **4** | Scanner-PWA, FEFO-stöd i plock, inventering | Lagerpersonal jobbar paperless på mobil |
| **5** | Rapporter, dashboard, ABC, utgångsbevakning, automatiska påfyllningsförslag | Veckorapport mailas automatiskt till ägaren |
| **6+** | Optimeringar baserat på faktisk användning | — |

> **Inga faser hoppas över utan godkännande.** Vi bygger inte rapporter innan ordrar fungerar.

---

## 11. Beslut som måste fattas (öppna frågor)

Markera som `[BESLUT KRÄVS]` i kod/PR där dessa påverkar:

1. **Volym** — antal SKU, ordrar/dag, kunder. Påverkar index, partitionering, prisplan på Supabase.
2. **Befintlig data** — finns artikellista, kundregister, prislistor i Excel? Vi behöver dem för seed/import.
3. **Bokföring idag** — Fortnox? Visma? Manuellt? Avgör hur snart Fas 2 är kritisk.
4. **Frakt** — vilka avtal har Hot Chilly? (Postnord/DHL/Bring/Schenker/Bussgods.)
5. **Kyl/frys** — hanterar de temperaturzoner? Påverkar lagermodellen.
6. **Peppol-leverantör** — InExchange och Pagero kostar olika. Hot Chilly väljer.
7. **Domän + företagsmail** — krävs för Resend (DKIM/SPF) och Fortnox-OAuth-redirect.
8. **Hot Chillys logotyp + brand guidelines** — för fakturor, portal, mail.
9. **Användare i Fas 1** — vilka personer, vilka roller?
10. **Pris och avtal med kund** — fastpris, löpande, support-SLA?

---

## 12. Vad Claude Code INTE ska göra

- Bygga eget Peppol-AP, eget bokföringssystem, eget OCR-bibliotek från scratch.
- Lägga affärslogik i React-komponenter.
- Köra `UPDATE stock_levels` utan motsvarande `stock_movements`-rad.
- Hantera pengar som `number` (float).
- Hårdkoda momssatser, fakturanummer-prefix, företagsuppgifter — allt i `app_settings`.
- Stänga av RLS "tillfälligt".
- Pusha till `main` direkt.
- Installera bibliotek utan att motivera valet i PR-beskrivningen.
- Generera mockdata som ser ut som riktig kunddata (använd `@faker-js/faker` med svenska locale, men markera tydligt).
- Anta att en uppgift är klar innan tester finns — minst happy-path + en edge case per ny domänfunktion.

---

## 13. Hur Claude Code förväntas arbeta

1. **Läs CLAUDE.md först. Sedan relevanta filer i `docs/`.**
2. **Innan ny modul:** skriv 3–5 raders sammanfattning av vad du tänker bygga och varför, vänta på OK.
3. **Innan migrations:** visa SQL-diff och rationalen. DB-ändringar är dyra att rulla tillbaka.
4. **Stora ändringar (>200 rader):** dela upp i flera commits/PR.
5. **Vid osäkerhet:** fråga. Det är billigare än att bygga fel.
6. **Vid val mellan två rimliga lösningar:** välj den enklare och kortare. YAGNI.
7. **Lämna alltid en kort `## Nästa steg`-lista i slutet av varje session.**

---

## 14. Glossary (svenska ↔ engelska)

| Svenska | English (i kod) |
|---|---|
| Artikel | product |
| Lagersaldo | stock level |
| Batch / parti | batch / lot |
| Bäst före | best_before |
| Sista förbrukningsdag | use_by |
| Inleverans | goods_receipt |
| Inköpsorder | purchase_order |
| Kundorder | sales_order |
| Plock | pick |
| Plocklista | pick_list |
| Leveransavi / följesedel | delivery_note |
| Faktura | invoice |
| Kreditfaktura | credit_note |
| Lagerplats | location |
| Inventering | stocktake |
| Återförsäljare / kund (B2B) | customer |
| Leverantör | supplier |
| Prislista | price_list |

---

**Version:** 0.1 — initialt utkast.
**Ägare:** Karim.
**Senast uppdaterad:** 2026-05-03.
