INSERT INTO guides (title, category, summary, content, published, author_id) VALUES
 ('วันแรกในฟาร์ม', 'beginner', 'สิ่งที่ควรทำใน 7 วันแรก',
  E'1. เคลียร์พื้นที่หน้าบ้าน\n2. ปลูก Parsnip ที่ได้จาก Lewis\n3. รดน้ำทุกวัน',
  true, (SELECT id FROM members WHERE email = 'admin@test.com')),
 ('ตกปลาให้เก่ง', 'fishing', 'เทคนิคมินิเกมตกปลา',
  E'กดค้างให้แถบเขียวทับตัวปลา ปล่อยเมื่อปลาลง',
  true, (SELECT id FROM members WHERE email = 'admin@test.com')),
 ('หาเงินฤดูร้อน (ร่าง)', 'money', 'ยังเขียนไม่เสร็จ',
  E'ร่าง...',
  false, (SELECT id FROM members WHERE email = 'admin@test.com'));