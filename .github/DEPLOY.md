# Deploy till One.com

Detta repo deployas automatiskt till One.com via GitHub Actions vid varje push till `main`. Workflow-filen finns i `.github/workflows/deploy.yml`.

## Krävda GitHub Secrets

Följande sex secrets måste vara konfigurerade i repot innan workflowen kan köras:

| Secret | Beskrivning |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL:en till ditt Supabase-projekt (t.ex. `https://xxxx.supabase.co`). Bakas in i JS-bundlen vid build. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publik anon-nyckel från Supabase. Bakas in i JS-bundlen vid build. |
| `SFTP_HOST` | One.coms SFTP-server, typiskt `ssh.one.com`. |
| `SFTP_USERNAME` | Ditt SFTP-användarnamn hos One.com. |
| `SFTP_PASSWORD` | Lösenordet till SFTP-användaren. |
| `SFTP_REMOTE_PATH` | Absolut sökväg på servern dit `out/`-innehållet ska laddas upp, t.ex. `/customers/X/Y/Z/portal.karimkhalil.se/`. |

## Lägga till en secret

1. Gå till repot på GitHub.
2. Klicka **Settings**.
3. I sidomenyn: **Secrets and variables** -> **Actions**.
4. Klicka **New repository secret**.
5. Ange namnet exakt enligt tabellen ovan och klistra in värdet.
6. Klicka **Add secret**. Upprepa för alla sex secrets.

## One.com-specifika tips

- **SFTP-host**: One.com kör SFTP på `ssh.one.com`, port `22`. Workflowen anger porten direkt i `deploy.yml`.
- **Användarnamn**: One.com-användarnamn är ofta på formatet `username.domain` eller `domain.tld` - kontrollera under SSH/SFTP-inställningarna i One.coms kontrollpanel om du är osäker.
- **Lösenord**: Du sätter (eller återställer) SFTP-lösenordet i One.coms kontrollpanel under SSH/SFTP-sektionen. Det är inte samma som ditt One.com-konto-lösenord.
- **Remote path**: Den absoluta sökvägen ser typiskt ut som `/customers/X/Y/Z/portal.karimkhalil.se/`. Du hittar den exakta sökvägen i One.coms filhanterare - leta upp katalogen för domänen och kopiera sökvägen från adressfältet eller egenskaperna. Se till att avsluta sökvägen med `/`.

## Trigga deploy manuellt

Förutom automatisk deploy vid push till `main` kan du trigga workflowen manuellt:

1. Gå till **Actions**-fliken i repot.
2. Välj workflowen **Deploy to One.com** i listan till vänster.
3. Klicka **Run workflow** uppe till hoger.
4. Välj branch (vanligen `main`) och klicka **Run workflow**.

## Noter om beteende

- **Concurrency**: Workflowen anvander gruppen `deploy-production` med `cancel-in-progress: false`. Pagaende deploys avbryts inte - nya deploys koas och kor i tur och ordning, sa du undviker halvfardiga uppladdningar.
- **delete_remote_files**: Satt till `true`. Filer i `SFTP_REMOTE_PATH` som inte finns i `out/` raderas vid varje deploy. Se till att `SFTP_REMOTE_PATH` pekar exakt pa domanens webbrot och inget annat.
