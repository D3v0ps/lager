# Saldo — demoseed

Det här skriptet (`seed.sql`) fyller databasen med realistisk svensk
demodata: ca 25 produkter spridda över sju kategorier samt ett 50-tal
lagerrörelser ('in', 'out' och 'adjust') under de senaste 60 dagarna.

Triggern `apply_stock_movement` i migrationen sköter saldoräkningen
automatiskt, så produkter läggs in med saldo 0 och rörelserna driver upp
och ner antalet. Några produkter hamnar med vilje under sin
`reorder_point` så att låg-saldo-vyn i UI:t kan demonstreras.

> **Varning:** Skriptet börjar med
> `truncate table public.stock_movements, public.products restart identity cascade;`
> Alla befintliga rader i de två tabellerna raderas. Kör inte mot produktion.

## Förutsättning

Migrationen `supabase/migrations/0001_init_lager.sql` måste vara körd
först så att tabellerna och triggern finns på plats.

## Köra seed:en

### Alternativ 1 — Supabase Dashboard

1. Öppna ditt projekt i [Supabase](https://supabase.com/dashboard).
2. Gå till **SQL Editor** → **New query**.
3. Klistra in hela innehållet från `supabase/seed/seed.sql`.
4. Klicka **Run**.

### Alternativ 2 — `psql` lokalt

Sätt `DATABASE_URL` till din Postgres-anslutningssträng (finns under
*Project settings → Database → Connection string* i Supabase) och kör:

```bash
psql "$DATABASE_URL" -f supabase/seed/seed.sql
```

## Verifiering

Efter körning bör du se ungefär:

```sql
select count(*) from public.products;         -- 26
select count(*) from public.stock_movements;  -- ~50
select count(*) from public.products
  where quantity < reorder_point;             -- ~6 (låg-saldo-demo)
```
