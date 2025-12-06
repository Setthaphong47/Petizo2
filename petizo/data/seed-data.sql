-- Sample Blog Posts (จากฐานข้อมูลจริง)
INSERT OR IGNORE INTO blogs (id, admin_id, title, slug, content, excerpt, category, status, views, published_at, created_at) VALUES
(2, 1, 'รวม 7 เรื่องน่ารู้ของแมวที่ไม่ลับ แต่คุณอาจจะยังไม่รู้', 'cat-facts-you-may-not-know', 'แมวเป็นสัตว์เลี้ยงที่น่ารักและมีเสน่ห์ มีพฤติกรรมที่น่าสนใจมากมาย บทความนี้จะพาคุณไปรู้จักข้อเท็จจริงเกี่ยวกับแมวที่คุณอาจไม่เคยรู้มาก่อน', 'ข้อเท็จจริงน่ารู้เกี่ยวกับแมว', 'พฤติกรรม', 'published', 0, datetime('now'), datetime('now')),
(3, 1, 'ทำไมแมวถึงชอบให้เทอาหารใหม่ ทั้งที่ยังมีอยู่ในชาม?', 'why-cats-want-fresh-food', 'แมวมักจะขอให้เจ้าของเทอาหารใหม่ แม้ว่าจะยังมีอาหารเหลืออยู่ในชาม มาดูสาเหตุที่แท้จริงกัน', 'ทำไมแมวถึงขออาหารใหม่เสมอ', 'การดูแล', 'published', 0, datetime('now'), datetime('now')),
(4, 1, 'ทำไมแมวถึงชอบนอนบนกล่องหรือที่แคบ ๆ', 'why-cats-sleep-in-boxes', 'แมวชอบนอนในที่แคบอย่างกล่อง เพราะทำให้รู้สึกปลอดภัยและอบอุ่น', 'เหตุผลที่แมวชอบนอนในกล่อง', 'ทั่วไป', 'published', 0, datetime('now'), datetime('now')),
(5, 1, 'แมวระบายความร้อนอย่างไร', 'how-cats-cool-down', 'แมวไม่มีต่อมเหงื่อเหมือนมนุษย์ แต่มีวิธีระบายความร้อนของตัวเอง', 'วิธีที่แมวระบายความร้อน', 'พฤติกรรม', 'published', 0, datetime('now'), datetime('now')),
(6, 1, 'วิธีดูแลแมวสูงวัย ให้แข็งแรงและมีความสุขในทุกวัน', 'senior-cat-care', 'การดูแลแมวสูงวัยต้องใส่ใจเป็นพิเศษ เพื่อให้เขามีคุณภาพชีวิตที่ดี', 'คำแนะนำการดูแลแมวสูงวัย', 'การดูแล', 'published', 0, datetime('now'), datetime('now')),
(7, 1, 'สัญญาณที่บอกว่าแมวของคุณรักคุณ', 'signs-your-cat-loves-you', 'แมวแสดงความรักด้วยพฤติกรรมต่าง ๆ ที่เจ้าของควรรู้', 'พฤติกรรมที่แสดงว่าแมวรักคุณ', 'พฤติกรรม', 'published', 0, datetime('now'), datetime('now')),
(8, 1, 'อาหารที่ห้ามให้แมวกิน', 'forbidden-cat-foods', 'รายชื่ออาหารที่เป็นอันตรายต่อแมว ห้ามให้กินโดยเด็ดขาด', 'อาหารอันตรายสำหรับแมว', 'โภชนาการ', 'published', 0, datetime('now'), datetime('now'));

-- Vaccine Schedules (ครบถ้วน 24 รายการ)
INSERT OR IGNORE INTO vaccine_schedules (id, vaccine_name, description, pet_type, age_weeks, age_months, is_core) VALUES
-- สุนัข
(1, 'DHPP (5 in 1) - เข็มที่ 1', 'วัคซีนป้องกันโรค Distemper, Hepatitis, Parvovirus, Parainfluenza, Leptospirosis', 'dog', 6, NULL, 1),
(2, 'DHPP (5 in 1) - เข็มที่ 2', 'วัคซีนป้องกันโรคหลัก 5 ชนิด (เข็มกระตุ้น)', 'dog', 9, NULL, 1),
(3, 'DHPP (5 in 1) - เข็มที่ 3', 'วัคซีนป้องกันโรคหลัก 5 ชนิด (เข็มกระตุ้น)', 'dog', 12, NULL, 1),
(4, 'Rabies', 'วัคซีนป้องกันโรคพิษสุนัขบ้า', 'dog', 16, NULL, 1),
(5, 'DHPP - Annual', 'วัคซีน DHPP ประจำปี', 'dog', NULL, 12, 1),
(6, 'Rabies - Annual', 'วัคซีนพิษสุนัขบ้าประจำปี', 'dog', NULL, 12, 1),
(7, 'Bordetella', 'วัคซีนป้องกันไอสุนัข', 'dog', 8, NULL, 0),
(8, 'Coronavirus', 'วัคซีนป้องกันไวรัสโคโรนา', 'dog', 8, NULL, 0),
-- แมว  
(9, 'FVRCP (3 in 1) - เข็มที่ 1', 'วัคซีนป้องกัน Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia', 'cat', 8, NULL, 1),
(10, 'FVRCP - เข็มที่ 2', 'วัคซีนป้องกันโรคหลักแมว (เข็มกระตุ้น)', 'cat', 12, NULL, 1),
(11, 'Rabies (Cat)', 'วัคซีนป้องกันโรคพิษสุนัขบ้าสำหรับแมว', 'cat', 16, NULL, 1),
(12, 'FVRCP - Annual', 'วัคซีน FVRCP ประจำปี', 'cat', NULL, 12, 1),
(13, 'Rabies (Cat) - Annual', 'วัคซีนพิษสุนัขบ้าประจำปี', 'cat', NULL, 12, 1),
(14, 'FeLV (Feline Leukemia)', 'วัคซีนป้องกันมะเร็งเม็ดเลือดขาว', 'cat', 12, NULL, 0),
(15, 'FIP (Feline Infectious Peritonitis)', 'วัคซีนป้องกันโรคติดเชื้อช่องท้อง', 'cat', 16, NULL, 0),
-- วัคซีนเสริมสุนัข
(16, 'Lyme Disease', 'วัคซีนป้องกันโรคไลม์', 'dog', 12, NULL, 0),
(17, 'Canine Influenza', 'วัคซีนป้องกันไข้หวัดสุนัข', 'dog', 8, NULL, 0),
(18, 'Leptospirosis', 'วัคซีนป้องกันโรคเลปโตสไปโรสิส', 'dog', 12, NULL, 0),
-- วัคซีนกระตุ้นเพิ่มเติม
(19, 'DHPP - Booster Year 2', 'วัคซีน DHPP ปีที่ 2', 'dog', NULL, 24, 1),
(20, 'DHPP - Booster Year 3', 'วัคซีน DHPP ปีที่ 3', 'dog', NULL, 36, 1),
(21, 'FVRCP - Booster Year 2', 'วัคซีน FVRCP ปีที่ 2', 'cat', NULL, 24, 1),
(22, 'FVRCP - Booster Year 3', 'วัคซีน FVRCP ปีที่ 3', 'cat', NULL, 36, 1),
(23, 'Rabies (Dog) - Triennial', 'วัคซีนพิษสุนัขบ้า 3 ปี', 'dog', NULL, 36, 1),
(24, 'Rabies (Cat) - Triennial', 'วัคซีนพิษสุนัขบ้า 3 ปี', 'cat', NULL, 36, 1);

-- Breeds
INSERT OR IGNORE INTO breeds (id, name, description) VALUES
(1, 'Golden Retriever', 'สุนัขพันธุ์ใหญ่ที่เป็นมิตรและฉลาด เหมาะกับครอบครัว'),
(2, 'Labrador Retriever', 'สุนัขพันธุ์ยอดนิยม รักครอบครัว ซื่อสัตย์'),
(3, 'Beagle', 'สุนัขพันธุ์เล็กถึงกลาง มีจมูกไว เหมาะกับการตามล่า'),
(4, 'Poodle', 'สุนัขพันธุ์ฉลาด ขนไม่ร่วง เหมาะกับผู้แพ้ขนสัตว์'),
(5, 'Chihuahua', 'สุนัขพันธุ์เล็กที่สุด กล้าหาญและภักดี'),
(6, 'Scottish Fold', 'แมวหูพับที่น่ารัก มีนิสัยอ่อนโยน'),
(7, 'Persian', 'แมวเปอร์เซียขนยาว สง่างาม ต้องการการดูแลพิเศษ'),
(8, 'Siamese', 'แมวสยามพันธุ์ไทย มีเสียงดัง ชอบพูดคุย'),
(9, 'British Shorthair', 'แมวอังกฤษขนสั้น สงบเสงี่ยม น่ารัก'),
(10, 'Maine Coon', 'แมวขนาดใหญ่ อ่อนโยน เป็นมิตร');
