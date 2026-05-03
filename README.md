# Lager

Statisk SPA för lagerhantering byggd med Next.js 16 (App Router, `output: 'export'`),
TypeScript, Tailwind v4 och Supabase. Funkar på vilken statisk hosting som helst —
inkl. One.com SFTP.

## Funktioner

- Lista produkter med SKU, kategori, pris, antal och beställningspunkt
- Lägg till, redigera och ta bort produkter
- Registrera lagerrörelser (inleverans, uttag, justering) med automatisk uppdatering av antal
- Global rörelsehistorik
- Markering av produkter som nått beställningspunkten

## Arkitektur

Eftersom appen distribueras som ren statik utan Node-server pratar UI:t direkt med
Supabase via `@supabase/supabase-js`. Säkerhet hanteras av Postgres RLS — anon-nyckeln
är publik (designad så) och får aldrig ge bredare access än vad RLS-policyn tillåter.

Dynamiska routes är `/product/?id=…` och `/product/edit/?id=…` (query-string istället
för path-param) eftersom statisk export inte stödjer okända path-params.

## Kom igång

### 1. Installera beroenden

```bash
npm install
```

### 2. Konfigurera Supabase

Skapa ett projekt på [supabase.com](https://supabase.com) och kör SQL-migrationen
i `supabase/migrations/0001_init_lager.sql` i SQL-editorn.

Kopiera sedan `.env.example` till `.env.local`:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Bygg statiken

```bash
npm run build
```

Resultatet hamnar i `out/` — ladda upp innehållet till webroot på din host.

## Struktur

```
app/
  layout.tsx, page.tsx        Layout + produktlista
  movements/page.tsx          Global rörelsehistorik
  not-found.tsx               404
  products/new/page.tsx       Skapa produkt
  products/_components/       Formulärkomponent
  product/page.tsx            Detaljvy + rörelseregistrering (?id=...)
  product/edit/page.tsx       Redigera produkt (?id=...)
lib/
  supabase/client.ts          Supabase-klient (browser)
  data.ts                     Klient-side CRUD och queries
  database.types.ts           DB-typer
  format.ts                   Pris/datum-hjälpare
supabase/migrations/          SQL-migrationer
```

## Säkerhet

Migrationen sätter en öppen RLS-policy (`using (true)`) för enkel uppstart.
**Lås ner detta innan produktion** — koppla till Supabase Auth och begränsa
policies till `auth.uid()`.
