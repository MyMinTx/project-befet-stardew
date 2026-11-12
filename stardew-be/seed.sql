-- seed.sql ข้อมูลตั้งต้นของ Stardew Guide
-- ข้อมูลอ้างอิงจาก stardewvalleywiki.com (คำอธิบายเขียนใหม่เป็นภาษาไทยโดยทีม)
-- ⚠️ รันแล้วจะล้างไอเทม/NPC/ไกด์เดิม (รวมคอมเมนต์ bookmark หัวใจ ของขวัญ) แต่ไม่แตะตาราง members
-- ต้องมีบัญชี admin อย่างน้อย 1 คนก่อนรัน (ใช้เป็นผู้เขียนไกด์)

BEGIN;

TRUNCATE items, npcs, guides RESTART IDENTITY CASCADE;

-- ===== ไอเทม =====
INSERT INTO items (name, category, description, image_url, sell_price, seasons, source) VALUES
 ('Parsnip', 'crop', 'ผักหัวสีขาว ปลูกง่าย โตใน 4 วัน เหมาะกับวันแรก ๆ ของฟาร์ม',
  'https://stardewvalleywiki.com/mediawiki/images/d/db/Parsnip.png', 35, '{spring}', 'เมล็ดจากร้าน Pierre (20g)'),
 ('Cauliflower', 'crop', 'ใช้เวลาโต 12 วัน มีโอกาสกลายเป็นกะหล่ำยักษ์ถ้าปลูกเต็มช่อง 3×3',
  'https://stardewvalleywiki.com/mediawiki/images/a/aa/Cauliflower.png', 175, '{spring}', 'เมล็ดจากร้าน Pierre (80g)'),
 ('Strawberry', 'crop', 'ปลูกครั้งเดียวเก็บได้ทุก 4 วัน ควรปลูกตั้งแต่วันที่ 13 ฤดูใบไม้ผลิ',
  'https://stardewvalleywiki.com/mediawiki/images/6/6d/Strawberry.png', 120, '{spring}', 'เมล็ดจากเทศกาลไข่ (Egg Festival)'),
 ('Blueberry', 'crop', 'ผลไม้ฤดูร้อน เก็บได้ทุก 4 วัน และมักได้หลายลูกต่อต้น',
  'https://stardewvalleywiki.com/mediawiki/images/9/9e/Blueberry.png', 50, '{summer}', 'เมล็ดจากร้าน Pierre (80g)'),
 ('Melon', 'crop', 'ผลไม้ราคาดีของฤดูร้อน มีโอกาสกลายเป็นแตงโมยักษ์',
  'https://stardewvalleywiki.com/mediawiki/images/1/19/Melon.png', 250, '{summer}', 'เมล็ดจากร้าน Pierre (80g)'),
 ('Starfruit', 'crop', 'พืชที่ทำเงินได้มากที่สุดของฤดูร้อน นิยมนำไปทำไวน์',
  'https://stardewvalleywiki.com/mediawiki/images/d/db/Starfruit.png', 750, '{summer}', 'เมล็ดจากร้าน Oasis ในทะเลทราย'),
 ('Pumpkin', 'crop', 'พืชประจำฤดูใบไม้ร่วง ของขวัญชิ้นโปรดของหลายคนในเมือง',
  'https://stardewvalleywiki.com/mediawiki/images/6/64/Pumpkin.png', 320, '{fall}', 'เมล็ดจากร้าน Pierre (100g)'),
 ('Cranberries', 'crop', 'ปลูกครั้งเดียวเก็บได้ทั้งฤดู ได้ผลครั้งละ 2 ลูก',
  'https://stardewvalleywiki.com/mediawiki/images/6/6e/Cranberries.png', 75, '{fall}', 'เมล็ดจากร้าน Pierre (240g)'),
 ('Daffodil', 'forage', 'ดอกไม้ป่าสีเหลือง เก็บได้ตามพื้นในเมืองช่วงฤดูใบไม้ผลิ',
  'https://stardewvalleywiki.com/mediawiki/images/4/4b/Daffodil.png', 30, '{spring}', 'หาเก็บตามพื้นในเมือง'),
 ('Leek', 'forage', 'ต้นหอมป่า ใช้ใน Bundle ของศูนย์ชุมชน',
  'https://stardewvalleywiki.com/mediawiki/images/5/57/Leek.png', 60, '{spring}', 'หาเก็บในป่าและภูเขา'),
 ('Wild Plum', 'forage', 'ลูกพลัมป่า หาได้ตามพื้นช่วงฤดูใบไม้ร่วง',
  'https://stardewvalleywiki.com/mediawiki/images/3/3b/Wild_Plum.png', 80, '{fall}', 'หาเก็บในป่าและภูเขา'),
 ('Snow Yam', 'forage', 'มันฝรั่งหิมะ ต้องขุดจากจุดที่มีหนอนขยับในฤดูหนาว',
  'https://stardewvalleywiki.com/mediawiki/images/3/3f/Snow_Yam.png', 100, '{winter}', 'ขุดจากจุดหนอน (Artifact Spot)'),
 ('Sardine', 'fish', 'ปลาทะเลตัวเล็ก จับง่าย ใช้ทำอาหารได้หลายเมนู',
  'https://stardewvalleywiki.com/mediawiki/images/0/04/Sardine.png', 40, '{spring,fall,winter}', 'ทะเล 6:00–19:00'),
 ('Largemouth Bass', 'fish', 'ปลาน้ำจืดที่พบในทะเลสาบบนภูเขาได้ทั้งปี',
  'https://stardewvalleywiki.com/mediawiki/images/1/11/Largemouth_Bass.png', 100, '{spring,summer,fall,winter}', 'ทะเลสาบบนภูเขา 6:00–19:00'),
 ('Catfish', 'fish', 'ปลาหนังที่ออกมาเฉพาะวันฝนตก ค่อนข้างจับยาก',
  'https://stardewvalleywiki.com/mediawiki/images/9/99/Catfish.png', 200, '{spring,fall}', 'แม่น้ำ วันฝนตก 6:00–24:00'),
 ('Pufferfish', 'fish', 'ปลาปักเป้า ออกเฉพาะวันแดดออกช่วงกลางวันในฤดูร้อน',
  'https://stardewvalleywiki.com/mediawiki/images/b/ba/Pufferfish.png', 200, '{summer}', 'ทะเล วันแดดออก 12:00–16:00'),
 ('Amethyst', 'mineral', 'อัญมณีสีม่วง พบบ่อยในเหมืองชั้นต้น',
  'https://stardewvalleywiki.com/mediawiki/images/2/2e/Amethyst.png', 100, '{}', 'เหมือง ชั้น 1–39 หรือเปิดจาก Geode'),
 ('Diamond', 'mineral', 'อัญมณีหายาก เป็นของขวัญที่หลายคนชอบมาก',
  'https://stardewvalleywiki.com/mediawiki/images/e/ea/Diamond.png', 750, '{}', 'เหมือง ชั้น 50 ขึ้นไป'),
 ('Prismatic Shard', 'mineral', 'แร่หายากที่สุด เกือบทุกคนในเมืองชอบมาก ยกเว้น Haley',
  'https://stardewvalleywiki.com/mediawiki/images/5/56/Prismatic_Shard.png', 2000, '{}', 'เปิดจาก Omni Geode หรือเหมืองชั้นลึก'),
 ('Frozen Tear', 'mineral', 'คริสตัลน้ำแข็ง ของขวัญที่ Sebastian ชอบที่สุด',
  'https://stardewvalleywiki.com/mediawiki/images/e/ec/Frozen_Tear.png', 75, '{}', 'เหมือง ชั้น 40–79'),
 ('Truffle Oil', 'artisan', 'น้ำมันทรัฟเฟิลจากเครื่อง Oil Maker ราคาสูงมาก',
  'https://stardewvalleywiki.com/mediawiki/images/3/3d/Truffle_Oil.png', 1065, '{}', 'ใส่ Truffle ใน Oil Maker'),
 ('Cheese', 'artisan', 'ชีสจากนมวัว ทำจากเครื่อง Cheese Press',
  'https://stardewvalleywiki.com/mediawiki/images/a/a5/Cheese.png', 230, '{}', 'ใส่ Milk ใน Cheese Press'),
 ('Pale Ale', 'artisan', 'เบียร์จากฮอปส์ ทำจากถัง Keg',
  'https://stardewvalleywiki.com/mediawiki/images/7/78/Pale_Ale.png', 300, '{}', 'ใส่ Hops ใน Keg'),
 ('Pink Cake', 'cooking', 'เค้กสีชมพูหน้าเมลอน เมนูที่ Haley ชอบที่สุด',
  'https://stardewvalleywiki.com/mediawiki/images/3/32/Pink_Cake.png', 480, '{}', 'สูตรจากรายการทีวี Queen of Sauce'),
 ('Pizza', 'cooking', 'พิซซ่าร้อน ๆ ซื้อได้ที่ Stardrop Saloon',
  'https://stardewvalleywiki.com/mediawiki/images/f/f4/Pizza.png', 300, '{}', 'สูตรจากรายการทีวี Queen of Sauce'),
 ('Spaghetti', 'cooking', 'สปาเกตตีซอสมะเขือเทศ ทำง่าย ฟื้นพลังได้ดี',
  'https://stardewvalleywiki.com/mediawiki/images/0/08/Spaghetti.png', 120, '{}', 'ได้สูตรจาก Lewis เมื่อมีหัวใจ 3 ดวง'),
 ('Fried Mushroom', 'cooking', 'เห็ดทอด เพิ่มพลังโจมตีชั่วคราว',
  'https://stardewvalleywiki.com/mediawiki/images/4/4a/Fried_Mushroom.png', 200, '{}', 'ได้สูตรจาก Demetrius เมื่อมีหัวใจ 3 ดวง'),
 ('Wood', 'resource', 'ไม้ ทรัพยากรพื้นฐานสำหรับสร้างของเกือบทุกอย่าง',
  'https://stardewvalleywiki.com/mediawiki/images/d/df/Wood.png', 2, '{}', 'ตัดต้นไม้และกิ่งไม้'),
 ('Stone', 'resource', 'หิน ใช้สร้างทางเดินและอุปกรณ์ต่าง ๆ',
  'https://stardewvalleywiki.com/mediawiki/images/d/d4/Stone.png', 2, '{}', 'ทุบหินในฟาร์มและเหมือง'),
 ('Iron Bar', 'resource', 'แท่งเหล็ก ใช้อัปเกรดเครื่องมือและสร้างเครื่องจักร',
  'https://stardewvalleywiki.com/mediawiki/images/6/6c/Iron_Bar.png', 120, '{}', 'หลอม Iron Ore 5 ก้อนในเตาหลอม'),
 ('Pearl', 'other', 'ไข่มุกหายาก เป็นของขวัญที่ทุกคนในเมืองชอบมาก',
  'https://stardewvalleywiki.com/mediawiki/images/7/73/Pearl.png', 2500, '{}', 'ได้จาก Blobfish Mask หรือหีบสมบัติจากการตกปลา');

-- ===== NPC =====
INSERT INTO npcs (name, birthday_season, birthday_day, location, marriageable, description, image_url) VALUES
 ('Abigail', 'fall', 13, 'Pierre''s General Store', true, 'สาวชอบผจญภัย เล่นวิดีโอเกม และชอบสำรวจเหมือง',
  'https://stardewvalleywiki.com/mediawiki/images/8/88/Abigail.png'),
 ('Emily', 'spring', 27, '2 Willow Lane', true, 'ช่างเย็บผ้าใจดี ทำงานที่ Stardrop Saloon ชอบอัญมณีทุกชนิด',
  'https://stardewvalleywiki.com/mediawiki/images/2/28/Emily.png'),
 ('Haley', 'spring', 14, '2 Willow Lane', true, 'สาวชอบถ่ายรูป ดูเย่อหยิ่งในตอนแรกแต่จะใจอ่อนลงเมื่อสนิท',
  'https://stardewvalleywiki.com/mediawiki/images/1/1b/Haley.png'),
 ('Leah', 'winter', 23, 'Leah''s Cottage (Cindersap Forest)', true, 'ศิลปินที่ย้ายมาอยู่ใกล้ธรรมชาติ ชอบแกะสลักไม้และวาดภาพ',
  'https://stardewvalleywiki.com/mediawiki/images/e/e6/Leah.png'),
 ('Maru', 'summer', 10, 'Carpenter''s Shop (24 Mountain Road)', true, 'นักประดิษฐ์ ทำงานพาร์ตไทม์ที่คลินิก ชอบดูดาว',
  'https://stardewvalleywiki.com/mediawiki/images/f/f8/Maru.png'),
 ('Penny', 'fall', 2, 'Trailer (River Road)', true, 'คุณครูประจำเมือง สอนหนังสือให้ Jas และ Vincent',
  'https://stardewvalleywiki.com/mediawiki/images/a/ab/Penny.png'),
 ('Harvey', 'winter', 14, 'Harvey''s Clinic', true, 'หมอประจำเมือง ใจดี ชอบเครื่องบินจำลองและวิทยุ',
  'https://stardewvalleywiki.com/mediawiki/images/9/95/Harvey.png'),
 ('Sebastian', 'winter', 10, 'Carpenter''s Shop (24 Mountain Road)', true, 'โปรแกรมเมอร์เก็บตัว ชอบอยู่ห้องใต้ดินและขี่มอเตอร์ไซค์',
  'https://stardewvalleywiki.com/mediawiki/images/a/a8/Sebastian.png'),
 ('Shane', 'spring', 20, 'Marnie''s Ranch', true, 'ทำงานที่ JojaMart ดูหยาบแต่รักไก่และหลานสาว Jas มาก',
  'https://stardewvalleywiki.com/mediawiki/images/8/8b/Shane.png'),
 ('Clint', 'winter', 26, 'Blacksmith', false, 'ช่างตีเหล็ก รับอัปเกรดเครื่องมือและเปิด Geode',
  'https://stardewvalleywiki.com/mediawiki/images/3/31/Clint.png'),
 ('Robin', 'fall', 21, 'Carpenter''s Shop (24 Mountain Road)', false, 'ช่างไม้ประจำเมือง รับสร้างและขยายอาคารในฟาร์ม',
  'https://stardewvalleywiki.com/mediawiki/images/1/1b/Robin.png'),
 ('Willy', 'summer', 24, 'Fish Shop', false, 'ชาวประมงผู้มอบเบ็ดอันแรกให้ผู้เล่น ขายอุปกรณ์ตกปลา',
  'https://stardewvalleywiki.com/mediawiki/images/8/82/Willy.png');

-- ===== ของขวัญ (อ้างด้วยชื่อ ไม่ต้องจำเลข id) =====
INSERT INTO npc_gifts (npc_id, item_id, preference)
SELECT n.id, i.id, v.preference
FROM (VALUES
 ('Abigail', 'Pearl', 'love'),
 ('Abigail', 'Prismatic Shard', 'love'),
 ('Emily', 'Pearl', 'love'),
 ('Emily', 'Prismatic Shard', 'love'),
 ('Haley', 'Pearl', 'love'),
 ('Haley', 'Prismatic Shard', 'hate'),
 ('Leah', 'Pearl', 'love'),
 ('Leah', 'Prismatic Shard', 'love'),
 ('Maru', 'Pearl', 'love'),
 ('Maru', 'Prismatic Shard', 'love'),
 ('Penny', 'Pearl', 'love'),
 ('Penny', 'Prismatic Shard', 'love'),
 ('Harvey', 'Pearl', 'love'),
 ('Harvey', 'Prismatic Shard', 'love'),
 ('Sebastian', 'Pearl', 'love'),
 ('Sebastian', 'Prismatic Shard', 'love'),
 ('Shane', 'Pearl', 'love'),
 ('Shane', 'Prismatic Shard', 'love'),
 ('Clint', 'Pearl', 'love'),
 ('Clint', 'Prismatic Shard', 'love'),
 ('Robin', 'Pearl', 'love'),
 ('Robin', 'Prismatic Shard', 'love'),
 ('Willy', 'Pearl', 'love'),
 ('Willy', 'Prismatic Shard', 'love'),
 ('Abigail', 'Amethyst', 'love'),
 ('Abigail', 'Pumpkin', 'love'),
 ('Abigail', 'Pufferfish', 'love'),
 ('Abigail', 'Diamond', 'like'),
 ('Emily', 'Amethyst', 'love'),
 ('Emily', 'Diamond', 'like'),
 ('Haley', 'Pink Cake', 'love'),
 ('Leah', 'Pizza', 'hate'),
 ('Maru', 'Cauliflower', 'love'),
 ('Maru', 'Diamond', 'love'),
 ('Maru', 'Strawberry', 'love'),
 ('Maru', 'Snow Yam', 'hate'),
 ('Penny', 'Diamond', 'love'),
 ('Penny', 'Melon', 'love'),
 ('Penny', 'Pale Ale', 'hate'),
 ('Harvey', 'Truffle Oil', 'love'),
 ('Sebastian', 'Frozen Tear', 'love'),
 ('Sebastian', 'Diamond', 'like'),
 ('Shane', 'Pizza', 'love'),
 ('Clint', 'Amethyst', 'love'),
 ('Robin', 'Spaghetti', 'love'),
 ('Willy', 'Catfish', 'love'),
 ('Willy', 'Diamond', 'love'),
 ('Willy', 'Pumpkin', 'love')
) AS v(npc_name, item_name, preference)
JOIN npcs  n ON n.name = v.npc_name
JOIN items i ON i.name = v.item_name;

-- ===== ไกด์ (ผู้เขียน = admin คนแรกในระบบ) =====
INSERT INTO guides (title, category, summary, content, published, author_id) VALUES
 ('วันแรกในฟาร์ม: 7 วันแรกทำอะไรดี', 'beginner', 'เช็กลิสต์สัปดาห์แรก ตั้งแต่เคลียร์ที่ดินจนได้เงินก้อนแรก',
  'วันที่ 1
- เปิดกล่องข้างเตียง จะได้เมล็ด Parsnip 15 เมล็ด ปลูกให้หมดแล้วรดน้ำ
- เดินคุยกับทุกคนในเมือง ได้ทั้งมิตรภาพและรู้จักแผนที่

วันที่ 2–4
- ตัดไม้และทุบหินเก็บไว้ ใช้สร้าง Chest และของอื่น ๆ
- วันที่ 2 Willy จะส่งจดหมายมา ไปรับเบ็ดตกปลาที่ร้านริมทะเล

วันที่ 5 เป็นต้นไป
- เหมืองเปิดแล้ว ลงไปเก็บแร่ทองแดงมาทำ Furnace
- เก็บ Parsnip ขาย แล้วซื้อเมล็ด Cauliflower หรือ Potato เพิ่ม

เคล็ดลับ: ดูช่อง Fortune บนทีวีทุกเช้า วันที่ดวงดีเหมาะกับการลงเหมือง',
  true, (SELECT id FROM members WHERE role = 'admin' ORDER BY id LIMIT 1)),
 ('ปลูกอะไรดีในแต่ละฤดู', 'farming', 'สรุปพืชทำเงินของแต่ละฤดู และจังหวะที่ควรปลูก',
  'ฤดูใบไม้ผลิ (Spring)
- Strawberry ทำเงินดีที่สุด แต่เมล็ดซื้อได้แค่วันเทศกาลไข่ (วันที่ 13)
- Cauliflower ราคาดี และมีโอกาสได้กะหล่ำยักษ์

ฤดูร้อน (Summer)
- Blueberry ปลูกครั้งเดียวเก็บได้ทั้งฤดู
- Starfruit ทำเงินสูงสุด เมล็ดซื้อที่ Oasis หลังซ่อมรถบัส

ฤดูใบไม้ร่วง (Fall)
- Cranberries เก็บได้ทั้งฤดู ครั้งละ 2 ลูก
- Pumpkin ราคาดีและใช้เป็นของขวัญได้

ฤดูหนาว (Winter)
- ปลูกอะไรกลางแจ้งไม่ได้ ใช้เวลาลงเหมือง ตกปลา และเก็บ Snow Yam

อย่าลืม: พืชที่ปลูกค้างข้ามฤดูจะเหี่ยวตายทันทีในวันแรกของฤดูใหม่',
  true, (SELECT id FROM members WHERE role = 'admin' ORDER BY id LIMIT 1)),
 ('ตกปลาให้เก่ง ตั้งแต่ระดับ 0', 'fishing', 'วิธีเล่นมินิเกมตกปลา และปลาที่ควรจับช่วงแรก',
  'วิธีเล่นมินิเกม
- กดค้างให้แถบสีเขียวลอยขึ้น ปล่อยให้ตกลง พยายามให้แถบทับตัวปลาไว้
- หลอดด้านขวาเต็มเมื่อไหร่ก็จับได้

ปลาแนะนำช่วงแรก
- Sardine (ทะเล) จับง่าย เหมาะฝึกมือ
- Largemouth Bass (ทะเลสาบบนภูเขา) ราคาดีและเจอได้ทั้งปี

ปลาที่ต้องรอจังหวะ
- Catfish ออกเฉพาะวันฝนตก ฤดูใบไม้ผลิและใบไม้ร่วง
- Pufferfish ออกเฉพาะวันแดดออก 12:00–16:00 ในฤดูร้อน

เคล็ดลับ: เลเวลตกปลาขึ้นเร็วมากถ้าตกปลาตั้งแต่สัปดาห์แรก',
  true, (SELECT id FROM members WHERE role = 'admin' ORDER BY id LIMIT 1)),
 ('ลงเหมืองชั้น 1–40 อย่างปลอดภัย', 'mining', 'เตรียมตัวก่อนลงเหมือง และแร่ที่ควรเก็บในแต่ละช่วงชั้น',
  'ก่อนลง
- พกอาหารฟื้นพลังไว้เสมอ เช่น Spaghetti หรือ Fried Mushroom
- ทุก 5 ชั้นจะมีลิฟต์ ลงถึงชั้นลิฟต์แล้วกลับบ้านได้ ครั้งหน้าลงต่อจากตรงนั้น

ชั้น 1–39
- แร่ทองแดง (Copper Ore) และ Amethyst พบบ่อย
- ชั้น 10 จะได้รองเท้า ชั้น 20 ได้ดาบ Steel Smallsword

ชั้น 40 ขึ้นไป
- เป็นโซนน้ำแข็ง เริ่มเจอแร่เหล็ก และ Frozen Tear

เคล็ดลับ: ทุบลังไม้และถังด้วย อาจได้อาหารหรือของมีค่า',
  true, (SELECT id FROM members WHERE role = 'admin' ORDER BY id LIMIT 1)),
 ('ให้ของขวัญยังไงให้หัวใจขึ้นไว', 'relationships', 'กติกาการให้ของขวัญ และของที่ทุกคนชอบ',
  'กติกาพื้นฐาน
- ให้ของขวัญได้คนละ 2 ครั้งต่อสัปดาห์ และวันละ 1 ครั้ง
- วันเกิดได้หัวใจเพิ่ม 8 เท่า ดูวันเกิดได้จากปฏิทินหน้าร้าน Pierre

ของที่ (เกือบ) ทุกคนชอบมาก
- Pearl
- Prismatic Shard (ยกเว้น Haley ที่เกลียด)

ตัวอย่างของโปรด
- Abigail: Amethyst, Pumpkin
- Sebastian: Frozen Tear
- Penny: Diamond, Melon
- Haley: Pink Cake

เคล็ดลับ: ใช้หน้าตัวติดตามหัวใจของเว็บนี้บันทึกความคืบหน้าของแต่ละคนได้',
  true, (SELECT id FROM members WHERE role = 'admin' ORDER BY id LIMIT 1)),
 ('หาเงินก้อนแรกให้ถึง 10,000g', 'money', 'แนวทางเพิ่มรายได้ช่วงปีแรก',
  '1. ปลูกพืชที่เก็บซ้ำได้ เช่น Strawberry, Blueberry, Cranberries จะได้กำไรต่อเมล็ดสูงกว่า
2. แปรรูปผลผลิต นำผลไม้ใส่ Keg ทำไวน์ ราคาเพิ่มขึ้นหลายเท่า
3. ตกปลาวันฝนตก ปลาหายากออกมาเยอะ
4. ทุบ Geode ที่ Clint บางลูกมีแร่ราคาดีอย่าง Diamond
5. เก็บของป่าทุกวัน ไม่เสียค่าเมล็ดเลย

ข้อควรระวัง: อย่าขายของที่ต้องใช้ใน Bundle ของศูนย์ชุมชนหมดก่อน',
  true, (SELECT id FROM members WHERE role = 'admin' ORDER BY id LIMIT 1)),
 ('เริ่มซ่อมศูนย์ชุมชน (Community Center)', 'community-center', 'Bundle คืออะไร และควรเริ่มจากห้องไหน',
  'ศูนย์ชุมชนคืออะไร
- อาคารร้างกลางเมือง ซ่อมได้โดยส่งของตามรายการ (Bundle) ให้ Junimo
- ซ่อมห้องไหนเสร็จจะได้รางวัล เช่น สะพานไปเหมืองหิน หรือรถบัสไปทะเลทราย

ควรเริ่มจาก
- Crafts Room ใช้ของป่าตามฤดู เก็บได้ตั้งแต่สัปดาห์แรก
- Pantry ใช้พืชผลที่ปลูกเองในแต่ละฤดู

เคล็ดลับ
- เก็บของป่าทุกชนิดอย่างน้อยอย่างละ 1 ชิ้นไว้ใน Chest
- ผลผลิตคุณภาพทอง (Gold Quality) จำเป็นสำหรับบาง Bundle',
  true, (SELECT id FROM members WHERE role = 'admin' ORDER BY id LIMIT 1));

COMMIT;

-- ===== ตรวจผล (ต้องได้ items 31, npcs 12, npc_gifts 48, guides 7) =====
SELECT (SELECT count(*) FROM items) AS items, (SELECT count(*) FROM npcs) AS npcs,
       (SELECT count(*) FROM npc_gifts) AS npc_gifts, (SELECT count(*) FROM guides) AS guides;
