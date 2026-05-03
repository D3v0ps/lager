# Lager

Enkel lagerhanterings-app byggd med Next.js 16 (App Router), TypeScript, Tailwind v4 och Supabase.

## Funktioner

- Lista produkter med SKU, kategori, pris, antal och beställningspunkt
- Lägg till, redigera och ta bort produkter
- Registrera lagerrörelser (inleverans, uttag, justering) med automatisk uppdatering av antal
- Global rörelsehistorik
- Markering av produkter som nått beställningspunkten

## Kom igång

### 1. Installera beroenden

```bash
npm install
```

### 2. Konfigurera Supabase

Skapa ett projekt på [supabase.com](https://supabase.com) och kör SQL-migrationen
i `supabase/migrations/0001_init_lager.sql` i SQL-editorn.

Kopiera sedan `.env.example` till `.env.local` och fyll i värden:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Starta dev-servern

```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000).

## Struktur

```
app/
  actions.ts                  Server actions (CRUD + rörelser)
  layout.tsx, page.tsx        Layout + produktlista
  movements/page.tsx          Global rörelsehistorik
  not-found.tsx               404
  products/
    new/page.tsx              Skapa produkt
    [id]/page.tsx             Detaljvy + rörelseregistrering
    [id]/edit/page.tsx        Redigera produkt
    _components/              Klient- och formulärkomponenter
lib/
  supabase/server.ts          Supabase-klient (server)
  supabase/client.ts          Supabase-klient (browser)
  database.types.ts           Generade DB-typer
  format.ts                   Hjälpare för pris/datum
supabase/migrations/          SQL-migrationer
```

## Säkerhet

Migrationen sätter en öppen RLS-policy (`using (true)`) för enkel lokal utveckling.
**Lås ner detta innan produktion** — koppla till Supabase Auth och begränsa
policies till `auth.uid()`.
