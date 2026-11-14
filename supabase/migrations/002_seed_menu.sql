-- Sample menu: Singaporean favourites. Prices in cents (SGD).
-- Photos: Wikimedia Commons (free licences — see each file's Commons page).

insert into public.categories (id, name, sort) values
  (1, 'Mains', 1),
  (2, 'Sides', 2),
  (3, 'Drinks', 3);

insert into public.menu_items (id, category_id, name, description, price_cents, image_url, sort) values
  (1, 1, 'Hainanese Chicken Rice', 'Poached chicken, fragrant rice, chilli and ginger sauce.', 650,
     'https://commons.wikimedia.org/wiki/Special:FilePath/Hainanese_Chicken_Rice.jpg?width=500', 1),
  (2, 1, 'Char Kway Teow', 'Wok-fried flat noodles with prawns, cockles, egg and Chinese sausage.', 700,
     'https://commons.wikimedia.org/wiki/Special:FilePath/Char_kway_teow.jpg?width=500', 2),
  (3, 1, 'Laksa', 'Spicy coconut curry noodle soup with prawns, fishcake and tau pok.', 750,
     'https://commons.wikimedia.org/wiki/Special:FilePath/Nyonya_Laksa.jpg?width=500', 3),
  (4, 1, 'Nasi Lemak', 'Coconut rice with fried chicken wing, ikan bilis, peanuts, egg and sambal.', 680,
     'https://commons.wikimedia.org/wiki/Special:FilePath/Nasi_Lemak_dengan_Chili_Nasi_Lemak_dan_Sotong_Pedas,_di_Penang_Summer_Restaurant.jpg?width=500', 4),
  (5, 2, 'Chicken Satay (6 sticks)', 'Grilled marinated chicken skewers with peanut sauce, cucumber and onion.', 900,
     'https://commons.wikimedia.org/wiki/Special:FilePath/CHICKEN_SATAY.jpg?width=500', 1),
  (6, 2, 'Kaya Toast Set', 'Toast with kaya and butter, two soft-boiled eggs.', 480,
     'https://commons.wikimedia.org/wiki/Special:FilePath/Kaya_toast_on_a_plate.jpg?width=500', 2),
  (7, 3, 'Teh Tarik', 'Pulled milk tea, frothy and sweet.', 220,
     'https://commons.wikimedia.org/wiki/Special:FilePath/Teh_Tarik_at_the_Iskandar_Curry_House_at_One_Riverside_(DSCF0286).jpg?width=500', 1),
  (8, 3, 'Kopi', 'Traditional Nanyang coffee with condensed milk.', 200,
     'https://commons.wikimedia.org/wiki/Special:FilePath/Kopi_O.jpg?width=500', 2),
  (9, 3, 'Iced Lime Juice', 'Freshly squeezed lime with ice.', 280,
     'https://commons.wikimedia.org/wiki/Special:FilePath/Limeade.jpg?width=500', 3);

insert into public.option_groups (id, menu_item_id, name, min_select, max_select, sort) values
  -- Mains: size (pick exactly 1) + add-ons (pick any)
  (1, 1, 'Size', 1, 1, 1), (2, 1, 'Add-ons', 0, 3, 2),
  (3, 2, 'Size', 1, 1, 1), (4, 2, 'Add-ons', 0, 3, 2),
  (5, 3, 'Size', 1, 1, 1), (6, 3, 'Add-ons', 0, 3, 2),
  (7, 4, 'Size', 1, 1, 1), (8, 4, 'Add-ons', 0, 3, 2),
  -- Sides
  (9, 5, 'Add-ons', 0, 1, 1),
  (10, 6, 'Add-ons', 0, 1, 1),
  -- Drinks: hot/iced (pick 1) + sweetness (optional)
  (11, 7, 'Temperature', 1, 1, 1), (12, 7, 'Sweetness', 0, 1, 2),
  (13, 8, 'Temperature', 1, 1, 1), (14, 8, 'Sweetness', 0, 1, 2);

insert into public.options (group_id, name, price_cents, sort) values
  (1, 'Regular', 0, 1), (1, 'Large', 150, 2),
  (2, 'Extra egg', 100, 1), (2, 'Extra chicken', 250, 2), (2, 'Extra sambal', 50, 3),
  (3, 'Regular', 0, 1), (3, 'Large', 150, 2),
  (4, 'Extra egg', 100, 1), (4, 'Extra prawns', 200, 2), (4, 'Extra sambal', 50, 3),
  (5, 'Regular', 0, 1), (5, 'Large', 150, 2),
  (6, 'Extra egg', 100, 1), (6, 'Extra prawns', 200, 2), (6, 'Extra sambal', 50, 3),
  (7, 'Regular', 0, 1), (7, 'Large', 150, 2),
  (8, 'Extra egg', 100, 1), (8, 'Extra chicken wing', 200, 2), (8, 'Extra sambal', 50, 3),
  (9, 'Extra ketupat (rice cake)', 120, 1),
  (10, 'Extra egg', 100, 1),
  (11, 'Hot', 0, 1), (11, 'Iced', 30, 2),
  (12, 'Less sweet', 0, 1), (12, 'No sugar', 0, 2),
  (13, 'Hot', 0, 1), (13, 'Iced', 30, 2),
  (14, 'Less sweet', 0, 1), (14, 'No sugar', 0, 2);

-- keep the auto-number counters in step with the ids we set by hand
select setval('public.categories_id_seq',    (select max(id) from public.categories));
select setval('public.menu_items_id_seq',    (select max(id) from public.menu_items));
select setval('public.option_groups_id_seq', (select max(id) from public.option_groups));
