# Saldo — marknads- och konkurrentanalys (2026-05)

Research-rapport för positionering och feature-prioritering. Sammanfattning
nedan; full rapport längre ned.

## TL;DR

- **Fortnox äger bokföringen.** Slåss inte där.
- **Inventory + order management + inköpsorder + Fortnox-sync** är den
  öppna luckan. Specter och Lagerkoll är direkta konkurrenter men
  betraktas som UX-tunga av forum-användare.
- **Positioneringsteori:** "Saldo är operativa navet — Fortnox är
  bokföringsnavet."
- **Pris:** flata tiers (~500 / 1 200 / 2 500 kr/mån), inte per-user.
  Gratis Fortnox-koppling som wedge mot konkurrenter som tar 190–500 kr.
- **UX-baseline att slå:** Specter kräver "8 musklick" för att ändra
  antal. Vi måste vara ≤ 2.

## v1-moduler att prioritera

| Prio | Modul | Status |
|---|---|---|
| 1 | Inventory tracking (variant SKU, multi-location, snabb scanning) | Delvis (lager finns, saknar variants + multi-location) |
| 2 | Order management (Shopify/Woo/manuell, picking, retur) | **Saknas** |
| 3 | Inköpsorder + leverantörshantering | **Saknas — största gapet** |
| 4 | Shipping (Fraktjakt-API, etiketter inifrån order) | **Saknas** |
| 5 | Sälj- och lagerrapporter (marginal/SKU, döda lager) | Delvis (dashboard finns) |
| 6 | Fortnox bidirektional sync (artiklar, kunder, fakturor, lager) | **Saknas — strategisk P0** |

## Bygg INTE — integrera istället

- Bokföring/moms/bokslut → **Fortnox** (primärt), Visma eEkonomi
- Lön → Fortnox Lön / Bokio
- Webshop → Shopify, Woo
- Betalning/kassa → Klarna, Stripe, Swish (ligger i webshop)
- Helpdesk → Zendesk, Front, HubSpot Service
- Tung WMS för 3PL → Ongoing WMS (vi tar inte 100 000+ ordrar/dag)
- POS för fysisk butik → Sitoo, Specter POS (eller partner)

## Konkurrenter — sammanfattning

| Vendor | Pris/mån | Vår fördel |
|---|---|---|
| Fortnox Lager | 369 + 75/anv | Modern UX, riktiga inköpsordrar, snabb scanning |
| Bokio | 249–599 | De har inget lager — komplement, ej konkurrent |
| Visma eEkonomi | ~269 | Lager är bolt-on, inte kärna |
| Specter | quote-only | Modern UI vs deras 99-tals känsla |
| Lagerkoll | ~250 | Bättre scanning UX + bredare modulutbud |
| Wint | 2 190+ | Helt annat segment (ekonomtjänst) |

## Verifierade smärtcitat från forum

- *"de har inte Inköpsordrar i Fortnox"* — ehandel.se
- *"8 musklick för att ändra antal"* (Specter) — ehandel.se
- *"lagerdelen är under all kritik"* (Fortnox) — Trustpilot
- *"dubbelregistreringar mellan e-handel, ERP och lager"* — Fellowmind
- *"testade lagerkoll … scanna och justera funktionen var lite krånglig"* — ehandel.se

## Pris-mätpunkter

| Vendor | Entry SMB |
|---|---|
| Fortnox Lager | 369 + 75/extra användare |
| Fortnox "Mellan"-paket | 490 |
| Bokio Plus | 599 |
| Visma eEkonomi Smart | ~269 |
| Lagerkoll | från ~250 |
| Wint | från 2 190 |
| Wallmander/SYNKA+ konnektor (Shopify–Fortnox) | 190–500 |

**Förslag Saldo:** 500 / 1 200 / 2 500 kr/mån, flat per kund med
användare inkluderade till ~5/15/obegränsat. Free Fortnox-sync som wedge.

## Källor

Hela research-rapporten med citerade länkar — se sektion "Sources" i
ursprunglig agent-output (sparad i Git-historiken vid commit av detta
dokument).
