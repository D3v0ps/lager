-- Lager: demoseed
-- Innehåller realistiska svenska produkter och lagerrörelser för demo.
-- OBS: Skriptet kör truncate först — all befintlig data i public.products
-- och public.stock_movements raderas innan ny demodata skrivs in.

begin;

-- Töm tabellerna så skriptet är säkert att köra om.
truncate table public.stock_movements, public.products restart identity cascade;

-- ---------------------------------------------------------------------------
-- Produkter
-- ---------------------------------------------------------------------------
-- Notera: quantity sätts inte här — triggern på stock_movements räknar
-- upp/ner saldot när rörelser läggs in nedan.

insert into public.products (sku, name, category, unit_price, reorder_point, notes) values
  -- Skruv & spik
  ('SKR-001', 'Skruv 4x40 mm trä, 100-pack',         'Skruv & spik',      89.00,  20, 'Försänkt huvud, torx T20'),
  ('SKR-002', 'Skruv 5x80 mm trä, 50-pack',          'Skruv & spik',     129.00,  15, 'Helgängad, torx T25'),
  ('SKR-003', 'Spik 75 mm varmförzinkad, 1 kg',      'Skruv & spik',      79.50,  25, 'För utomhusbruk'),
  ('SKR-004', 'Gipsskruv 3,9x35 mm, 200-pack',       'Skruv & spik',      69.00,  30, 'Fosfaterad, för gipsskivor'),

  -- Verktyg
  ('VRK-001', 'Hammare 500 g',                        'Verktyg',          249.00,  10, 'Snickarhammare med trähandtag'),
  ('VRK-002', 'Skruvdragare 18V borstlös',            'Verktyg',         1990.00,   5, 'Inkl. 2 batterier och laddare'),
  ('VRK-003', 'Tumstock 2 m trä',                     'Verktyg',           59.00,  20, 'Klassisk gul, mm-skala'),
  ('VRK-004', 'Vattenpass 600 mm aluminium',          'Verktyg',          189.00,  10, '3 libeller'),
  ('VRK-005', 'Bitsats 32 delar',                     'Verktyg',          299.00,  12, 'Torx, insex, kryss, spår'),
  ('VRK-006', 'Fogsvans 500 mm',                      'Verktyg',          179.00,   8, 'Härdade tänder'),

  -- El-tillbehör
  ('ELT-001', 'Skarvsladd 5 m vit',                   'El-tillbehör',     149.00,  15, 'Jordad, 3x1,5 mm²'),
  ('ELT-002', 'Grenuttag 4-vägs med jord',            'El-tillbehör',     199.00,  10, 'Med strömbrytare'),
  ('ELT-003', 'LED-lampa E27 9W varmvit',             'El-tillbehör',      49.50,  40, '806 lm, 2700K'),
  ('ELT-004', 'Vägguttag jordat vit',                 'El-tillbehör',      89.00,  25, 'För infällt montage'),
  ('ELT-005', 'Förlängningskabel 25 m utomhus',       'El-tillbehör',     449.00,   5, 'IP44, orange'),

  -- Färg
  ('FRG-001', 'Väggfärg vit matt 10 L',               'Färg',             599.00,  10, 'För inomhusbruk, klass 7'),
  ('FRG-002', 'Träolja transparent 1 L',              'Färg',             189.00,  15, 'För utomhusträ'),
  ('FRG-003', 'Penselsats 5 delar',                   'Färg',              99.50,  20, 'Syntetborst, 25–75 mm'),
  ('FRG-004', 'Maskeringstejp 38 mm x 50 m',          'Färg',              45.00,  30, 'Lätt avtagbar'),

  -- Skyddsutrustning
  ('SKY-001', 'Skyddsglasögon klar',                  'Skyddsutrustning',  79.00,  20, 'Reptåliga, EN166'),
  ('SKY-002', 'Arbetshandskar nitril stl 10',         'Skyddsutrustning',  39.50,  50, 'Skärbeständighet B'),
  ('SKY-003', 'Hörselskydd öronkåpor SNR 30',         'Skyddsutrustning', 199.00,   8, 'Justerbar bygel'),
  ('SKY-004', 'Andningsskydd FFP3, 5-pack',           'Skyddsutrustning', 149.00,  15, 'Med ventil'),

  -- Förpackning
  ('FPK-001', 'Wellpapplåda 400x300x200 mm',          'Förpackning',       12.50, 100, 'Dubbelvågig, brun'),
  ('FPK-002', 'Packtejp brun 50 mm x 66 m',           'Förpackning',       29.00,  40, 'Akrylbaserad'),

  -- Kontorsmaterial
  ('KON-001', 'Kopieringspapper A4 80g, 500 ark',     'Kontorsmaterial',   59.00,  50, 'Vitt, FSC-märkt');

-- ---------------------------------------------------------------------------
-- Lagerrörelser
-- ---------------------------------------------------------------------------
-- Rörelserna är spridda över de senaste 60 dagarna. Triggern
-- public.apply_stock_movement uppdaterar produktens saldo automatiskt.
-- Alla 'out'-rörelser är dimensionerade så att inget saldo blir negativt
-- (NOT NULL CHECK quantity >= 0 på products skulle annars stoppa skriptet).
--
-- Mål: minst 3–4 produkter ska hamna under reorder_point efter alla rörelser
-- så att UI:t för låg-saldo-varningar kan demonstreras.

-- Skruv & spik
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 80, 'Inleverans från leverantör Würth', now() - interval '55 days' from public.products where sku = 'SKR-001';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 30, 'Uttag till projekt Nyköping', now() - interval '40 days' from public.products where sku = 'SKR-001';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 12, 'Butiksförsäljning', now() - interval '12 days' from public.products where sku = 'SKR-001';
-- saldo SKR-001: 80 - 30 - 12 = 38 (>= reorder_point 20)

insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 40, 'Inleverans från leverantör', now() - interval '50 days' from public.products where sku = 'SKR-002';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 28, 'Uttag till projekt Solna kontor', now() - interval '20 days' from public.products where sku = 'SKR-002';
-- saldo SKR-002: 12 (under reorder_point 15) — LÅG-SALDO-DEMO

insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 50, 'Inleverans från leverantör', now() - interval '45 days' from public.products where sku = 'SKR-003';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 8,  'Uttag till takprojekt', now() - interval '15 days' from public.products where sku = 'SKR-003';
-- saldo SKR-003: 42 (>= 25)

insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 60, 'Inleverans från Beijer Bygg', now() - interval '38 days' from public.products where sku = 'SKR-004';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 35, 'Uttag till renovering Vasastan', now() - interval '10 days' from public.products where sku = 'SKR-004';
-- saldo SKR-004: 25 (under reorder_point 30) — LÅG-SALDO-DEMO

-- Verktyg
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 25, 'Inleverans från grossist', now() - interval '58 days' from public.products where sku = 'VRK-001';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 6,  'Uttag till verkstad', now() - interval '25 days' from public.products where sku = 'VRK-001';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'adjust', 18, 'Inventering — justerat efter räkning', now() - interval '5 days' from public.products where sku = 'VRK-001';
-- saldo VRK-001: 18 (>= 10)

insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 12, 'Inleverans från Bosch', now() - interval '52 days' from public.products where sku = 'VRK-002';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 9,  'Uttag till byggprojekt Uppsala', now() - interval '18 days' from public.products where sku = 'VRK-002';
-- saldo VRK-002: 3 (under reorder_point 5) — LÅG-SALDO-DEMO

insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 60, 'Inleverans från leverantör', now() - interval '48 days' from public.products where sku = 'VRK-003';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 14, 'Uttag till snickeriet', now() - interval '8 days' from public.products where sku = 'VRK-003';
-- saldo VRK-003: 46 (>= 20)

insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 30, 'Inleverans från leverantör', now() - interval '42 days' from public.products where sku = 'VRK-004';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 11, 'Uttag till plattläggning', now() - interval '14 days' from public.products where sku = 'VRK-004';
-- saldo VRK-004: 19 (>= 10)

insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 20, 'Inleverans från grossist', now() - interval '35 days' from public.products where sku = 'VRK-005';
-- saldo VRK-005: 20 (>= 12)

-- VRK-006 lämnas helt utan rörelser så saldot är 0 — bra för att visa "tomt" i UI.

-- El-tillbehör
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 60, 'Inleverans från elgrossist', now() - interval '47 days' from public.products where sku = 'ELT-001';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 22, 'Uttag till installationsprojekt', now() - interval '21 days' from public.products where sku = 'ELT-001';
-- saldo ELT-001: 38 (>= 15)

insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 35, 'Inleverans', now() - interval '40 days' from public.products where sku = 'ELT-002';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 14, 'Butiksförsäljning vecka 16', now() - interval '7 days' from public.products where sku = 'ELT-002';
-- saldo ELT-002: 21 (>= 10)

insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 200, 'Pallorder från Philips', now() - interval '50 days' from public.products where sku = 'ELT-003';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 65,  'Uttag till hotellprojekt Göteborg', now() - interval '28 days' from public.products where sku = 'ELT-003';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 40,  'Butiksförsäljning', now() - interval '6 days' from public.products where sku = 'ELT-003';
-- saldo ELT-003: 95 (>= 40)

insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 45, 'Inleverans', now() - interval '33 days' from public.products where sku = 'ELT-004';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 20, 'Uttag till nybyggnation', now() - interval '11 days' from public.products where sku = 'ELT-004';
-- saldo ELT-004: 25 (= reorder_point 25, ej under)

insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 8, 'Inleverans från leverantör', now() - interval '30 days' from public.products where sku = 'ELT-005';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 5, 'Uthyrning till entreprenör', now() - interval '4 days' from public.products where sku = 'ELT-005';
-- saldo ELT-005: 3 (under reorder_point 5) — LÅG-SALDO-DEMO

-- Färg
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 24, 'Inleverans från Alcro', now() - interval '44 days' from public.products where sku = 'FRG-001';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 9, 'Uttag till målningsprojekt skola', now() - interval '17 days' from public.products where sku = 'FRG-001';
-- saldo FRG-001: 15 (>= 10)

insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 30, 'Inleverans', now() - interval '36 days' from public.products where sku = 'FRG-002';
-- saldo FRG-002: 30 (>= 15)

insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 40, 'Inleverans från grossist', now() - interval '29 days' from public.products where sku = 'FRG-003';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 13, 'Butiksförsäljning', now() - interval '9 days' from public.products where sku = 'FRG-003';
-- saldo FRG-003: 27 (>= 20)

-- FRG-004 lämnas utan rörelser (saldo 0).

-- Skyddsutrustning
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 60, 'Inleverans från 3M', now() - interval '53 days' from public.products where sku = 'SKY-001';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 18, 'Uttag till byggarbetsplats', now() - interval '22 days' from public.products where sku = 'SKY-001';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 9,  'Uttag till skolprojekt', now() - interval '3 days' from public.products where sku = 'SKY-001';
-- saldo SKY-001: 33 (>= 20)

insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 120, 'Pallorder', now() - interval '46 days' from public.products where sku = 'SKY-002';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 50,  'Uttag till industrikund', now() - interval '19 days' from public.products where sku = 'SKY-002';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 30,  'Uttag till städföretag', now() - interval '2 days' from public.products where sku = 'SKY-002';
-- saldo SKY-002: 40 (under reorder_point 50) — LÅG-SALDO-DEMO

insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 25, 'Inleverans', now() - interval '37 days' from public.products where sku = 'SKY-003';
-- saldo SKY-003: 25 (>= 8)

-- Förpackning
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 300, 'Inleverans pall wellpapp', now() - interval '49 days' from public.products where sku = 'FPK-001';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 120, 'Uttag till e-handelspackning', now() - interval '26 days' from public.products where sku = 'FPK-001';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 75,  'Uttag till e-handelspackning', now() - interval '6 days' from public.products where sku = 'FPK-001';
-- saldo FPK-001: 105 (>= 100)

insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 80, 'Inleverans från leverantör', now() - interval '34 days' from public.products where sku = 'FPK-002';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 25, 'Uttag till lager', now() - interval '13 days' from public.products where sku = 'FPK-002';
-- saldo FPK-002: 55 (>= 40)

-- Kontorsmaterial
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'in', 100, 'Inleverans från Staples', now() - interval '41 days' from public.products where sku = 'KON-001';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 30,  'Uttag till kontoret', now() - interval '16 days' from public.products where sku = 'KON-001';
insert into public.stock_movements (product_id, type, quantity, note, created_at)
select id, 'out', 25,  'Uttag till kontoret', now() - interval '1 day'  from public.products where sku = 'KON-001';
-- saldo KON-001: 45 (under reorder_point 50) — LÅG-SALDO-DEMO

commit;
