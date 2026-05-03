# Saldo — uppstartsguide

Alla steg för att få Saldo igång från noll. Behövs första gången, plus när du
lägger till en ny kund.

## En gång — Supabase-uppsättning

### 1. Kör migrationer

I Supabase Dashboard → **SQL Editor**, kör i tur och ordning:

1. `supabase/migrations/0001_init_lager.sql` — produkter + lagerrörelser
2. `supabase/migrations/0002_multi_tenant.sql` — tenants + RLS + auth-koppling
3. `supabase/migrations/0003_admin_helpers.sql` — admin-funktioner
4. `supabase/migrations/0004_suppliers_and_pos.sql` — leverantörer + inköpsorder
5. `supabase/migrations/0005_orders_customers.sql` — kunder + sälj-order
6. `supabase/migrations/0006_team_invitations.sql` — owner kan bjuda in användare
7. `supabase/migrations/0007_cost_of_goods.sql` — inköpspris/marginal
8. `supabase/migrations/0008_tenant_branding.sql` — logo + primärfärg per kund
9. `supabase/migrations/0009_rls_recursion_fix.sql` — fix för RLS-rekursion

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

**Två sätt:**

**A. Du skapar manuellt (snabbast för första owner per kund):**
1. Supabase Dashboard → Authentication → Users → Add user
2. Skicka inloggningsuppgifterna till kunden
3. I admin-UI — koppla användaren till deras kund med rollen `owner`

**B. Owner bjuder in själva (för deras lageransvarig osv):**
- Owner går till `/<slug>/team/`, fyller i e-post + roll, klickar **Bjud in**
- Inbjudan + magisk länk skickas via Supabase Auth e-postmall
- När mottagaren klickar länken loggas de in och kopplas automatiskt till kunden
- Du behöver inte göra något i Supabase

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
| `owner` | Hela kundens portal + kan bjuda in/ta bort medlemmar via /<slug>/team/ |
| `member` | Hela kundens portal — kan inte ändra team |

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
/<slug>/team/              Team management (owners + admins)
/<slug>/dashboard/         KPIer, lågnivå, senaste rörelser
/<slug>/reports/           Värde per produkt, döda lager, top movers
/<slug>/scan/              Streckkods-scanner (mobil)
/<slug>/customers/         Kunder
/<slug>/orders/            Sälj-ordrar
/<slug>/orders/new/        Ny order
/<slug>/suppliers/         Leverantörer
/<slug>/purchasing/        Inköpsorder
/<slug>/purchasing/new/    Ny inköpsorder
```

## GitHub Secrets som måste finnas

Workflow `Deploy to One.com` förväntar sig:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — bakas in i build (för browser-klienten)
- `SSH_HOST`, `SSH_USER`, `SSH_PASSWORD`, `SSH_REMOTE_PATH` — One.com SFTP

Se `.github/DEPLOY.md` för detaljer.
