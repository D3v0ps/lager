# Saldo — uppstartsguide

Alla steg för att få Saldo igång från noll. Behövs första gången, plus när du
lägger till en ny kund.

## En gång — Supabase-uppsättning

### 1. Kör migrationer

I Supabase Dashboard → **SQL Editor**, kör i tur och ordning:

1. `supabase/migrations/0001_init_lager.sql` — produkter + lagerrörelser
2. `supabase/migrations/0002_multi_tenant.sql` — tenants + RLS + auth-koppling
3. `supabase/migrations/0003_admin_helpers.sql` — admin-funktioner

Migration 2 skapar automatiskt en `demo`-tenant och flyttar all befintlig
data dit.

### 2. (Valfritt) Lägg in seed-data

Om du vill ha demo-produkter att titta på:

```
supabase/seed/seed.sql
```

Kör den i SQL Editor. Den raderar all befintlig data och lägger in 26
svenska produkter + 50 rörelser. Allt landar under `demo`-tenanten.

### 3. Aktivera e-post-inloggning

Supabase Dashboard → **Authentication → Providers** → slå på **Email**.
Stäng av "Confirm email" om du själv skapar konton manuellt och inte vill
hantera bekräftelsemejl.

### 4. Skapa din admin-användare

Supabase Dashboard → **Authentication → Users** → **Add user**:
- E-post + lösenord
- Markera "Auto Confirm User" om kryssrutan finns

Sen i SQL Editor — koppla användaren till `demo`-tenanten som admin:

```sql
insert into tenant_users (tenant_id, user_id, role)
select
  (select id from tenants where slug = 'demo'),
  id,
  'admin'
from auth.users
where email = 'din-epost@exempel.se';
```

Nu kan du logga in på `/demo/login/` med ditt admin-konto, och även gå till
`/admin/` för att skapa fler kunder.

## När du lägger till en ny kund

### Via admin-UI (rekommenderat)

1. Gå till `https://portal.karimkhalil.se/admin/`
2. Logga in med ditt admin-konto
3. Klicka **+ Ny kund**, fyll i slug (URL-namnet, t.ex. `hotchilly`) och företagsnamn
4. På kund-sidan — lägg till medlem från listan av befintliga användare

### Skapa användarkontot

Användarkonton skapas i Supabase Dashboard (Auth API kräver service-role som
inte ska finnas i en statisk SPA):

1. Supabase Dashboard → Authentication → Users → Add user
2. Skicka inloggningsuppgifterna till kunden
3. I admin-UI — koppla användaren till deras kund med rollen `member` eller `owner`

### Trigga om deploy

Tenant-listan hämtas vid build-tid för att pre-rendera sidor per kund. När
du lägger till en kund:

1. Workflowet auto-deployar inte vid DB-ändringar — du måste trigga
   GitHub Actions manuellt: **Actions → Deploy to One.com → Run workflow**
2. Cirka 1 minut senare är `/<ny-slug>/` live

> **Tip:** Vill du slippa det manuella steget? Skapa ett cronjob i
> GitHub Actions som triggar deploy varje natt — eller bygg en webhook
> från Supabase som triggar `repository_dispatch`.

## Roller

| Roll | Vad de kan |
|---|---|
| `admin` | Allt — inkl. /admin/ för alla kunder |
| `owner` | Hela kundens portal (men inte /admin/) |
| `member` | Hela kundens portal (samma som owner i v1) |

Roll-skillnaden mellan `owner` och `member` används inte ännu — finns för
framtida funktioner som faktura-godkännande, användarhantering per kund etc.

## URL-struktur

```
/                          Marketing landing
/admin/                    Admin (skapa kunder, hantera medlemmar)
/admin/tenant/?slug=…      Hantera en kund
/<slug>/login/             Login för en kund
/<slug>/                   Produktlista
/<slug>/dashboard/         Dashboard
/<slug>/categories/        Kategori-översikt
/<slug>/movements/         Rörelsehistorik
/<slug>/product/?id=…      Produktdetalj
/<slug>/product/edit/?id=… Redigera produkt
/<slug>/products/new/      Ny produkt
/<slug>/import/            CSV import/export
```

## GitHub Secrets som måste finnas

Workflow `Deploy to One.com` förväntar sig:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — bakas in i build (för browser-klienten)
- `SSH_HOST`, `SSH_USER`, `SSH_PASSWORD`, `SSH_REMOTE_PATH` — One.com SFTP

Se `.github/DEPLOY.md` för detaljer.
