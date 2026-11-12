INSERT INTO items (name, category, description, sell_price, seasons, source) VALUES
 ('Parsnip',  'crop',    'ผักหัวตัวแรกของฤดูใบไม้ผลิ', 35,  '{spring}', 'เมล็ดจากร้าน Pierre'),
 ('Amethyst', 'mineral', 'อัญมณีสีม่วง',               100, '{}',       'ขุดในเหมือง'),
 ('Pumpkin',  'crop',    NULL,                          320, '{fall}',   NULL);

INSERT INTO npcs (name, birthday_season, birthday_day, marriageable) VALUES
 ('Abigail', 'fall',   13, true),
 ('Linus',   'winter',  3, false);

-- (npc_id, item_id, preference)
INSERT INTO npc_gifts VALUES
 (1, 2, 'love'),   -- Abigail love Amethyst
 (1, 3, 'love'),   -- Abigail love Pumpkin
 (2, 1, 'like'),   -- Linus like Parsnip
 (1, 1, 'hate');   -- Abigail hate Parsnip