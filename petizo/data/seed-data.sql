-- Sample Blog Posts
INSERT INTO blogs (id, admin_id, title, slug, content, excerpt, category, status, published_at, created_at) VALUES
(1, 1, 'การดูแลสุนัขในช่วงฤดูร้อน', 'dog-summer-care', 'เนื้อหาบทความเกี่ยวกับการดูแลสุนัขในช่วงฤดูร้อน...', 'วิธีดูแลสุนัขให้ปลอดภัยในช่วงอากาศร้อน', 'สุขภาพ', 'published', datetime('now'), datetime('now')),
(2, 1, 'วัคซีนสำหรับแมว ฉีดอะไรบ้าง', 'cat-vaccines', 'คู่มือวัคซีนสำหรับแมวทุกช่วงวัย...', 'ข้อมูลครบถ้วนเกี่ยวกับวัคซีนแมว', 'วัคซีน', 'published', datetime('now'), datetime('now')),
(3, 1, 'อาหารที่ห้ามให้สัตว์เลี้ยงกิน', 'forbidden-pet-foods', 'รายชื่ออาหารที่เป็นอันตรายต่อสุนัขและแมว...', 'อาหารอะไรบ้างที่ไม่ควรให้สัตว์เลี้ยงกิน', 'โภชนาการ', 'published', datetime('now'), datetime('now')),
(4, 1, 'วิธีฝึกสุนัขให้เชื่อฟัง', 'dog-training-tips', 'เทคนิคการฝึกสุนัขให้เชื่อฟังคำสั่งพื้นฐาน...', 'เคล็ดลับการฝึกสุนัขสำหรับมือใหม่', 'การฝึก', 'published', datetime('now'), datetime('now')),
(5, 1, 'อาการป่วยที่พบบ่อยในสัตว์เลี้ยง', 'common-pet-illness', 'อาการเจ็บป่วยที่เจ้าของควรรู้และสังเกต...', 'รู้จักอาการป่วยทั่วไปในสุนัขและแมว', 'สุขภาพ', 'published', datetime('now'), datetime('now'));

-- Sample Breeds
INSERT INTO breeds (id, name, description) VALUES
(1, 'Golden Retriever', 'สุนัขพันธุ์ใหญ่ที่เป็นมิตรและฉลาด'),
(2, 'Labrador', 'สุนัขพันธุ์ยอดนิยม รักครอบครัว'),
(3, 'Beagle', 'สุนัขพันธุ์เล็กถึงกลาง มีจมูกไว'),
(4, 'Scottish Fold', 'แมวหูพับที่น่ารัก'),
(5, 'Persian', 'แมวเปอร์เซียขนยาว'),
(6, 'Siamese', 'แมวสยามพันธุ์ไทย');

-- Vaccine Schedules
INSERT INTO vaccine_schedules (id, vaccine_name, description, pet_type, age_weeks, age_months, is_core) VALUES
(1, 'DHPP (5 in 1)', 'วัคซีนป้องกันโรคหลัก 5 ชนิด', 'dog', 6, NULL, 1),
(2, 'DHPP (5 in 1) - Booster 1', 'วัคซีนป้องกันโรคหลัก 5 ชนิด (เข็มที่ 2)', 'dog', 9, NULL, 1),
(3, 'DHPP (5 in 1) - Booster 2', 'วัคซีนป้องกันโรคหลัก 5 ชนิด (เข็มที่ 3)', 'dog', 12, NULL, 1),
(4, 'Rabies', 'วัคซีนป้องกันโรคพิษสุนัขบ้า', 'dog', 16, NULL, 1),
(5, 'FVRCP (3 in 1)', 'วัคซีนป้องกันโรคหลักแมว', 'cat', 8, NULL, 1),
(6, 'FVRCP - Booster', 'วัคซีนป้องกันโรคหลักแมว (เข็มที่ 2)', 'cat', 12, NULL, 1),
(7, 'Rabies (Cat)', 'วัคซีนป้องกันโรคพิษสุนัขบ้าสำหรับแมว', 'cat', 16, NULL, 1);
