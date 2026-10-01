const fs = require('fs');

async function seedAllToSupabase() {
  const sbUrl = "https://qmpaatmniwagzijazzxb.supabase.co";
  const sbKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcGFhdG1uaXdhZ3ppamF6enhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2OTU4NDcsImV4cCI6MjEwNjI3MTg0N30.UrozUWTiA-aocCb0R1RSJ_RrNfmX8gPpnMz5vkhsxCg";
  const headers = {
    'apikey': sbKey,
    'Authorization': 'Bearer ' + sbKey,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
  };

  console.log("=== 1. SEEDING ROLES ===");
  const roles = [
    { role_id: 1, role_name: 'customer' },
    { role_id: 2, role_name: 'admin' },
    { role_id: 3, role_name: 'writer' }
  ];
  const rRes = await fetch(`${sbUrl}/rest/v1/roles`, {
    method: 'POST',
    headers,
    body: JSON.stringify(roles)
  });
  console.log("Roles status:", rRes.status, await rRes.text());

  console.log("=== 2. SEEDING USERS ===");
  const users = [
    { user_id: 1, email: 'admin@nothave.com', password_hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', full_name: 'ผู้ดูแลร้าน บักบ่ได้หนังสือ', phone: '081-111-2222', role_id: 2 },
    { user_id: 2, email: 'somchai@gmail.com', password_hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', full_name: 'สมชาย สายอ่าน', phone: '089-123-4567', role_id: 1 },
    { user_id: 3, email: 'ananya@gmail.com', password_hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', full_name: 'อนัญญา มังงะฟิน', phone: '082-345-6789', role_id: 1 },
    { user_id: 4, email: 'kittipong@gmail.com', password_hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', full_name: 'กิตติพงษ์ ซื้อแหลก', phone: '084-555-8888', role_id: 1 },
    { user_id: 5, email: 'nattaporn@gmail.com', password_hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', full_name: 'ณัฐพร คอการ์ตูน', phone: '086-777-9999', role_id: 1 },
    { user_id: 6, email: 'writer@nothave.com', password_hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', full_name: 'อาจารย์นักเขียน มังงะโปร', phone: '085-999-0000', role_id: 3 },
    { user_id: 7, email: 'admin', password_hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', full_name: 'ผู้ดูแลระบบ (Admin)', phone: '081-111-2222', role_id: 2 }
  ];
  const uRes = await fetch(`${sbUrl}/rest/v1/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify(users)
  });
  console.log("Users status:", uRes.status, await uRes.text());

  console.log("=== 3. SEEDING CATEGORIES ===");
  const categories = [
    { category_id: 1, category_name: 'มังงะ', description: 'การ์ตูนแปลญี่ปุ่น มังงะยอดนิยม แอ็กชัน แฟนตาซี คอมเมดี้' },
    { category_id: 2, category_name: 'หนังสือทั่วไป', description: 'หนังสือทั่วไป วรรณกรรม และสารคดีหลากหลายแนว' },
    { category_id: 3, category_name: 'นิยาย - ทั่วไป', description: 'นิยายรัก โรแมนซ์ สืบสวน และวรรณกรรมร่วมสมัย' },
    { category_id: 4, category_name: 'อาร์ตบุ๊ค', description: 'รวมภาพวาดประกอบ ผลงานภาพสีเลอค่า' },
    { category_id: 5, category_name: 'คอมพิวเตอร์ & เทคโนโลยี', description: 'หนังสือเรียนรู้ฐานข้อมูล โปรแกรมมิ่ง และไซเบอร์ซีเคียวริตี้' }
  ];
  const cRes = await fetch(`${sbUrl}/rest/v1/categories`, {
    method: 'POST',
    headers,
    body: JSON.stringify(categories)
  });
  console.log("Categories status:", cRes.status, await cRes.text());

  console.log("=== 4. SEEDING AUTHORS ===");
  const authors = [
    { author_id: 1, author_name: 'Abe Tsukasa / Yamada Kanehito', bio: 'ผู้สร้างสรรค์ผลงานแฟนตาซีระดับตำนาน' },
    { author_id: 2, author_name: 'Fujimoto Tatsuki', bio: 'นักเขียนการ์ตูนมือฉมัง เจ้าของผลงานสุดแหวกแนว' },
    { author_id: 3, author_name: 'Akasaka Aka', bio: 'นักแต่งเรื่องแนวโรแมนติกคอมเมดี้และจิตวิทยา' },
    { author_id: 4, author_name: 'Rifujin na Magonote', bio: 'นักเขียนไลท์โนเวลผู้บุกเบิกกระแสต่างโลก' },
    { author_id: 5, author_name: 'อาจารย์สมศักดิ์ ฐานข้อมูล', bio: 'ผู้เชี่ยวชาญด้าน RDBMS และความปลอดภัยระบบสารสนเทศ' }
  ];
  const aRes = await fetch(`${sbUrl}/rest/v1/authors`, {
    method: 'POST',
    headers,
    body: JSON.stringify(authors)
  });
  console.log("Authors status:", aRes.status, await aRes.text());

  console.log("=== 5. SEEDING EBOOKS ===");
  const ebooks = [
    { ebook_id: 1, title: 'คุณพี่ที่ผมมาส่งข้าวให้จะน่ากลัวเกินไปแล้ว เล่ม 1', author_id: 1, category_id: 1, price: 152.00, original_price: 169.00, point_reward: 45, description: 'เรื่องราวสุดป่วนของเด็กหนุ่มส่งข้าวกล่องกับคุณพี่สาวข้างห้องที่ดูลึกลับและน่ากลัว แต่แท้จริงแล้วมีมุมที่คาดไม่ถึง!', sample_text: 'ตัวอย่างเนื้อหา: "นี่เธอ... วันนี้เอาเมนูอะไรมาส่งงั้นเหรอ?"', cover_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80', file_url: 'https://mockfile.nothave.com/ebooks/scary_sister_vol1.pdf', is_active: true },
    { ebook_id: 2, title: 'คุณพี่ที่ผมมาส่งข้าวให้จะน่ากลัวเกินไปแล้ว เล่ม 2', author_id: 1, category_id: 1, price: 152.00, original_price: 169.00, point_reward: 45, description: 'ความสัมพันธ์เริ่มคืบหน้า เมื่อคุณพี่สาวเริ่มขอร้องให้ทำข้าวกล่องเมนูพิเศษให้!', sample_text: 'ตัวอย่างเนื้อหา: "ถ้าคราวหน้าเธอทำไข่ม้วนหวานมาให้ ฉันอาจจะมีรางวัลให้ก็ได้นะ..."', cover_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80', file_url: 'https://mockfile.nothave.com/ebooks/scary_sister_vol2.pdf', is_active: true },
    { ebook_id: 3, title: 'คุณพี่ที่ผมมาส่งข้าวให้จะน่ากลัวเกินไปแล้ว เล่ม 3', author_id: 1, category_id: 1, price: 152.00, original_price: 169.00, point_reward: 45, description: 'การปรากฏตัวของแขกที่ไม่ได้รับเชิญทำให้ความลับของคุณพี่สาวเกือบถูกเปิดเผย!', sample_text: 'ตัวอย่างเนื้อหา: "อย่าบอกเรื่องห้องนี้กับใครเด็ดขาดนะ... สัญญากับฉันสิ"', cover_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80', file_url: 'https://mockfile.nothave.com/ebooks/scary_sister_vol3.pdf', is_active: true },
    { ebook_id: 4, title: 'คุณพี่ที่ผมมาส่งข้าวให้จะน่ากลัวเกินไปแล้ว เล่ม 4 (จบภาคแรก)', author_id: 1, category_id: 1, price: 152.00, original_price: 169.00, point_reward: 45, description: 'บทสรุปความอบอุ่นของความสัมพันธ์ระหว่างผู้ส่งข้าวกับคุณพี่สาวข้างห้อง!', sample_text: 'ตัวอย่างเนื้อหา: "ขอบคุณนะ สำหรับข้าวกล่องตลอดหนึ่งปีที่ผ่านมา..."', cover_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=80', file_url: 'https://mockfile.nothave.com/ebooks/scary_sister_vol4.pdf', is_active: true },
    { ebook_id: 5, title: 'ยมแพ่งยมโลก เล่ม 12', author_id: 2, category_id: 1, price: 152.00, original_price: 169.00, point_reward: 45, description: 'การต่อสู้สุดดุเดือดในแดนชำระบาปที่เดิมพันด้วยจิตวิญญาณแห่งมวลมนุษยชาติ', sample_text: 'ตัวอย่างเนื้อหา: "ถ้าการมีชีวิตอยู่มันทรมานนัก ข้าจะช่วยปลดปล่อยเจ้าเอง!"', cover_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80', file_url: 'https://mockfile.nothave.com/ebooks/underworld_vol12.pdf', is_active: true },
    { ebook_id: 6, title: 'เพื่อนสะดวกคิส มิตรสะดวกเลิฟ เล่ม 4', author_id: 3, category_id: 1, price: 152.00, original_price: 169.00, point_reward: 45, description: 'ความสัมพันธ์แบบเพื่อนสนิทคิดไม่ซื่อที่เริ่มเลยเถิดจนเกินจะถอยกลับ!', sample_text: 'ตัวอย่างเนื้อหา: "เราเป็นแค่เพื่อนกันจริงๆ น่ะเหรอ? แล้วที่จูบกันเมื่อวานคืออะไร?"', cover_url: 'https://images.unsplash.com/photo-1560972550-aba3456b5564?w=500&auto=format&fit=crop&q=80', file_url: 'https://mockfile.nothave.com/ebooks/kiss_friend_vol4.pdf', is_active: true },
    { ebook_id: 7, title: 'เพื่อนคนแรกของผมคือสาวสวยอันดับสองของห้อง เล่ม 1', author_id: 3, category_id: 2, price: 185.00, original_price: 220.00, point_reward: 50, description: 'หนังสือทั่วไปยอดฮิต เมื่อหนุ่มจืดชืดได้สนิทกับดาวโรงเรียนอันดับสองด้วยความบังเอิญ', sample_text: 'ตัวอย่างเนื้อหา: "ทำไมนายถึงคุยกับฉันแบบสบายใจจัง ไม่เกร็งเหมือนคนอื่นเลยล่ะ?"', cover_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80', file_url: 'https://mockfile.nothave.com/ebooks/second_beauty_vol1.pdf', is_active: true },
    { ebook_id: 8, title: 'ซาซากิกับมิยาโนะ เล่ม 11', author_id: 1, category_id: 1, price: 152.00, original_price: 169.00, point_reward: 45, description: 'ชีวิตประจำวันอันสดใสของรุ่นพี่แบดบอยกับรุ่นน้องหนุ่มน้อยผู้รักการ์ตูนวาย', sample_text: 'ตัวอย่างเนื้อหา: "มิยาโนะ... วันนี้มีมังงะเรื่องใหม่มาแนะนำพี่อีกมั้ย?"', cover_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80', file_url: 'https://mockfile.nothave.com/ebooks/sasaki_miya_vol11.pdf', is_active: true },
    { ebook_id: 9, title: 'มิเอรุโกะจัง ใครว่าหนูเห็นผี เล่ม 14', author_id: 2, category_id: 1, price: 152.00, original_price: 169.00, point_reward: 45, description: 'สาวมัธยมผู้มองเห็นวิญญาณสยองขวัญแต่ต้องแกล้งทำเป็นมองไม่เห็นเพื่อเอาชีวิตรอด!', sample_text: 'ตัวอย่างเนื้อหา: "(อย่ามองนะ... ถ้ามองมันจะรู้ว่าเราเห็น... กรี๊ดดดด!)"', cover_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80', file_url: 'https://mockfile.nothave.com/ebooks/mieruko_vol14.pdf', is_active: true },
    { ebook_id: 10, title: 'เส้นทางจาริกอาถรรพ์ เล่ม 1', author_id: 4, category_id: 3, price: 230.00, original_price: 329.00, point_reward: 60, description: 'นิยายดาร์กแฟนตาซีผจญภัย เดินทางข้ามทวีปต้องสาปเพื่อค้นหาคำตอบแห่งชีวิต', sample_text: 'ตัวอย่างเนื้อหา: "ดินแดนแห่งนี้ไม่มีเทพเจ้าคอยคุ้มครอง มีเพียงดาบในมือเจ้าเท่านั้น..."', cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=80', file_url: 'https://mockfile.nothave.com/ebooks/dark_pilgrim_vol1.pdf', is_active: true },
    { ebook_id: 11, title: 'คัมภีร์ฐานข้อมูลและการป้องกันภัยไซเบอร์', author_id: 5, category_id: 5, price: 290.00, original_price: 350.00, point_reward: 80, description: 'คู่มือออกแบบ RDBMS 3NF พร้อมเทคนิคความปลอดภัย Web & Database ฉบับสมบูรณ์', sample_text: 'ตัวอย่างเนื้อหา: "บทที่ 1: การป้องกัน SQL Injection และ Broken Access Control ในระบบงานจริง..."', cover_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=80', file_url: 'https://mockfile.nothave.com/ebooks/db_security_handbook.pdf', is_active: true },
    { ebook_id: 12, title: 'รวมภาพศิลป์สุดอลังการ Artbook Fantasy 2026', author_id: 1, category_id: 4, price: 390.00, original_price: 450.00, point_reward: 100, description: 'อาร์ตบุ๊ครวมผลงานภาพประกอบสีน้ำและดิจิทัลเพ้นท์ระดับมาสเตอร์พีซ', sample_text: 'ตัวอย่างเนื้อหา: "รวมภาพร่างเบื้องหลังการออกแบบตัวละครและฉากแฟนตาซีสุดตระการตา..."', cover_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=80', file_url: 'https://mockfile.nothave.com/ebooks/fantasy_artbook_2026.pdf', is_active: true }
  ];
  const eRes = await fetch(`${sbUrl}/rest/v1/ebooks`, {
    method: 'POST',
    headers,
    body: JSON.stringify(ebooks)
  });
  console.log("Ebooks status:", eRes.status, await eRes.text());

  console.log("=== 6. SEEDING 32 ORDERS ===");
  const orders = [
    { order_id: 101, user_id: 2, order_date: '2026-07-05 10:15:00', total_amount: 304.00, status: 'confirmed', notes: 'ชำระผ่าน PromptPay เรียบร้อย' },
    { order_id: 102, user_id: 3, order_date: '2026-07-06 14:20:00', total_amount: 152.00, status: 'confirmed', notes: 'สลิปถูกต้อง' },
    { order_id: 103, user_id: 4, order_date: '2026-07-10 09:45:00', total_amount: 456.00, status: 'confirmed', notes: 'สั่งซื้อ 3 เล่ม' },
    { order_id: 104, user_id: 5, order_date: '2026-07-12 16:30:00', total_amount: 185.00, status: 'confirmed', notes: 'ยืนยันยอดเงินแล้ว' },
    { order_id: 105, user_id: 2, order_date: '2026-07-15 11:10:00', total_amount: 152.00, status: 'cancelled', notes: 'ยกเลิกเนื่องจากโอนเงินไม่ทัน' },
    { order_id: 106, user_id: 3, order_date: '2026-07-20 18:00:00', total_amount: 290.00, status: 'confirmed', notes: 'ซื้อหนังสือคอมพิวเตอร์' },
    { order_id: 107, user_id: 4, order_date: '2026-07-25 12:35:00', total_amount: 608.00, status: 'confirmed', notes: 'ซื้อชุดคุณพี่ที่ผมมาส่งข้าวให้' },
    { order_id: 108, user_id: 5, order_date: '2026-07-28 20:15:00', total_amount: 152.00, status: 'confirmed', notes: 'ยืนยันแล้ว' },
    { order_id: 109, user_id: 2, order_date: '2026-08-02 08:30:00', total_amount: 390.00, status: 'confirmed', notes: 'ซื้อ Artbook' },
    { order_id: 110, user_id: 3, order_date: '2026-08-04 13:40:00', total_amount: 152.00, status: 'confirmed', notes: 'เรียบร้อย' },
    { order_id: 111, user_id: 4, order_date: '2026-08-08 19:25:00', total_amount: 337.00, status: 'confirmed', notes: 'มังงะ + ไลท์โนเวล' },
    { order_id: 112, user_id: 5, order_date: '2026-08-11 15:10:00', total_amount: 152.00, status: 'cancelled', notes: 'สลิปไม่ชัดเจน ยกเลิก' },
    { order_id: 113, user_id: 2, order_date: '2026-08-15 17:50:00', total_amount: 230.00, status: 'confirmed', notes: 'ซื้อเส้นทางจาริกอาถรรพ์' },
    { order_id: 114, user_id: 3, order_date: '2026-08-18 21:05:00', total_amount: 304.00, status: 'confirmed', notes: 'คุณพี่ส่งข้าว 2 เล่ม' },
    { order_id: 115, user_id: 4, order_date: '2026-08-22 10:00:00', total_amount: 580.00, status: 'confirmed', notes: 'ซื้อหนังสือเทคโนโลยี 2 เล่ม' },
    { order_id: 116, user_id: 5, order_date: '2026-08-25 14:15:00', total_amount: 152.00, status: 'confirmed', notes: 'ยืนยัน' },
    { order_id: 117, user_id: 2, order_date: '2026-08-29 16:45:00', total_amount: 152.00, status: 'confirmed', notes: 'มิเอรุโกะจัง' },
    { order_id: 118, user_id: 3, order_date: '2026-09-01 11:20:00', total_amount: 442.00, status: 'confirmed', notes: 'สั่งซื้อต้นเดือน' },
    { order_id: 119, user_id: 4, order_date: '2026-09-03 13:10:00', total_amount: 152.00, status: 'confirmed', notes: 'เรียบร้อย' },
    { order_id: 120, user_id: 5, order_date: '2026-09-05 18:30:00', total_amount: 304.00, status: 'confirmed', notes: 'ยืนยันยอด' },
    { order_id: 121, user_id: 2, order_date: '2026-09-08 09:15:00', total_amount: 185.00, status: 'confirmed', notes: 'เพื่อนคนแรก' },
    { order_id: 122, user_id: 3, order_date: '2026-09-10 15:40:00', total_amount: 152.00, status: 'confirmed', notes: 'ซาซากิกับมิยาโนะ' },
    { order_id: 123, user_id: 4, order_date: '2026-09-12 20:00:00', total_amount: 780.00, status: 'confirmed', notes: 'ซื้อ Artbook 2 เล่ม' },
    { order_id: 124, user_id: 5, order_date: '2026-09-15 12:25:00', total_amount: 152.00, status: 'confirmed', notes: 'เรียบร้อย' },
    { order_id: 125, user_id: 2, order_date: '2026-09-18 17:35:00', total_amount: 290.00, status: 'confirmed', notes: 'ความปลอดภัยไซเบอร์' },
    { order_id: 126, user_id: 3, order_date: '2026-09-20 14:50:00', total_amount: 152.00, status: 'pending', notes: 'รอตรวจสอบสลิปจำลอง' },
    { order_id: 127, user_id: 4, order_date: '2026-09-22 19:10:00', total_amount: 304.00, status: 'pending', notes: 'ลูกค้ารอแจ้งโอน' },
    { order_id: 128, user_id: 5, order_date: '2026-09-25 11:00:00', total_amount: 152.00, status: 'pending', notes: 'รอผู้ดูแลตรวจสอบ' },
    { order_id: 129, user_id: 2, order_date: '2026-09-27 16:20:00', total_amount: 152.00, status: 'confirmed', notes: 'ยมแพ่งยมโลก' },
    { order_id: 130, user_id: 3, order_date: '2026-09-28 10:45:00', total_amount: 230.00, status: 'confirmed', notes: 'ยืนยันยอดล่าสุด' },
    { order_id: 131, user_id: 4, order_date: '2026-09-29 13:00:00', total_amount: 456.00, status: 'confirmed', notes: 'ยอดซื้อดีเด่น' },
    { order_id: 132, user_id: 2, order_date: '2026-09-29 22:15:00', total_amount: 152.00, status: 'pending', notes: 'รอชำระเงินจำลอง' }
  ];
  const oRes = await fetch(`${sbUrl}/rest/v1/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(orders)
  });
  console.log("Orders status:", oRes.status, await oRes.text());

  console.log("=== 7. SEEDING ORDER ITEMS ===");
  const orderItems = [
    { item_id: 1, order_id: 101, ebook_id: 1, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 2, order_id: 101, ebook_id: 2, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 3, order_id: 102, ebook_id: 1, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 4, order_id: 103, ebook_id: 1, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 5, order_id: 103, ebook_id: 2, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 6, order_id: 103, ebook_id: 3, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 7, order_id: 104, ebook_id: 7, price_at_purchase: 185.00, quantity: 1 },
    { item_id: 8, order_id: 105, ebook_id: 5, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 9, order_id: 106, ebook_id: 11, price_at_purchase: 290.00, quantity: 1 },
    { item_id: 10, order_id: 107, ebook_id: 1, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 11, order_id: 107, ebook_id: 2, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 12, order_id: 107, ebook_id: 3, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 13, order_id: 107, ebook_id: 4, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 14, order_id: 108, ebook_id: 6, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 15, order_id: 109, ebook_id: 12, price_at_purchase: 390.00, quantity: 1 },
    { item_id: 16, order_id: 110, ebook_id: 8, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 17, order_id: 111, ebook_id: 1, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 18, order_id: 111, ebook_id: 7, price_at_purchase: 185.00, quantity: 1 },
    { item_id: 19, order_id: 112, ebook_id: 9, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 20, order_id: 113, ebook_id: 10, price_at_purchase: 230.00, quantity: 1 },
    { item_id: 21, order_id: 114, ebook_id: 2, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 22, order_id: 114, ebook_id: 3, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 23, order_id: 115, ebook_id: 11, price_at_purchase: 290.00, quantity: 2 },
    { item_id: 24, order_id: 116, ebook_id: 5, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 25, order_id: 117, ebook_id: 9, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 26, order_id: 118, ebook_id: 1, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 27, order_id: 118, ebook_id: 11, price_at_purchase: 290.00, quantity: 1 },
    { item_id: 28, order_id: 119, ebook_id: 6, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 29, order_id: 120, ebook_id: 3, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 30, order_id: 120, ebook_id: 4, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 31, order_id: 121, ebook_id: 7, price_at_purchase: 185.00, quantity: 1 },
    { item_id: 32, order_id: 122, ebook_id: 8, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 33, order_id: 123, ebook_id: 12, price_at_purchase: 390.00, quantity: 2 },
    { item_id: 34, order_id: 124, ebook_id: 5, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 35, order_id: 125, ebook_id: 11, price_at_purchase: 290.00, quantity: 1 },
    { item_id: 36, order_id: 126, ebook_id: 1, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 37, order_id: 127, ebook_id: 1, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 38, order_id: 127, ebook_id: 2, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 39, order_id: 128, ebook_id: 6, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 40, order_id: 129, ebook_id: 5, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 41, order_id: 130, ebook_id: 10, price_at_purchase: 230.00, quantity: 1 },
    { item_id: 42, order_id: 131, ebook_id: 1, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 43, order_id: 131, ebook_id: 2, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 44, order_id: 131, ebook_id: 3, price_at_purchase: 152.00, quantity: 1 },
    { item_id: 45, order_id: 132, ebook_id: 4, price_at_purchase: 152.00, quantity: 1 }
  ];
  const oiRes = await fetch(`${sbUrl}/rest/v1/order_items`, {
    method: 'POST',
    headers,
    body: JSON.stringify(orderItems)
  });
  console.log("Order items status:", oiRes.status, await oiRes.text());

  console.log("=== 8. SEEDING PAYMENTS ===");
  const payments = [
    { payment_id: 1, order_id: 101, payment_method: 'PromptPay', payment_date: '2026-07-05 10:20:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_101', status: 'verified', verified_by: 1 },
    { payment_id: 2, order_id: 102, payment_method: 'PromptPay', payment_date: '2026-07-06 14:25:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_102', status: 'verified', verified_by: 1 },
    { payment_id: 3, order_id: 103, payment_method: 'PromptPay', payment_date: '2026-07-10 09:50:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_103', status: 'verified', verified_by: 1 },
    { payment_id: 4, order_id: 104, payment_method: 'PromptPay', payment_date: '2026-07-12 16:35:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_104', status: 'verified', verified_by: 1 },
    { payment_id: 5, order_id: 106, payment_method: 'PromptPay', payment_date: '2026-07-20 18:05:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_106', status: 'verified', verified_by: 1 },
    { payment_id: 6, order_id: 107, payment_method: 'PromptPay', payment_date: '2026-07-25 12:40:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_107', status: 'verified', verified_by: 1 },
    { payment_id: 7, order_id: 108, payment_method: 'PromptPay', payment_date: '2026-07-28 20:20:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_108', status: 'verified', verified_by: 1 },
    { payment_id: 8, order_id: 109, payment_method: 'PromptPay', payment_date: '2026-08-02 08:35:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_109', status: 'verified', verified_by: 1 },
    { payment_id: 9, order_id: 110, payment_method: 'PromptPay', payment_date: '2026-08-04 13:45:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_110', status: 'verified', verified_by: 1 },
    { payment_id: 10, order_id: 111, payment_method: 'PromptPay', payment_date: '2026-08-08 19:30:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_111', status: 'verified', verified_by: 1 },
    { payment_id: 11, order_id: 113, payment_method: 'PromptPay', payment_date: '2026-08-15 17:55:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_113', status: 'verified', verified_by: 1 },
    { payment_id: 12, order_id: 114, payment_method: 'PromptPay', payment_date: '2026-08-18 21:10:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_114', status: 'verified', verified_by: 1 },
    { payment_id: 13, order_id: 115, payment_method: 'PromptPay', payment_date: '2026-08-22 10:05:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_115', status: 'verified', verified_by: 1 },
    { payment_id: 14, order_id: 116, payment_method: 'PromptPay', payment_date: '2026-08-25 14:20:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_116', status: 'verified', verified_by: 1 },
    { payment_id: 15, order_id: 117, payment_method: 'PromptPay', payment_date: '2026-08-29 16:50:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_117', status: 'verified', verified_by: 1 },
    { payment_id: 16, order_id: 118, payment_method: 'PromptPay', payment_date: '2026-09-01 11:25:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_118', status: 'verified', verified_by: 1 },
    { payment_id: 17, order_id: 119, payment_method: 'PromptPay', payment_date: '2026-09-03 13:15:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_119', status: 'verified', verified_by: 1 },
    { payment_id: 18, order_id: 120, payment_method: 'PromptPay', payment_date: '2026-09-05 18:35:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_120', status: 'verified', verified_by: 1 },
    { payment_id: 19, order_id: 121, payment_method: 'PromptPay', payment_date: '2026-09-08 09:20:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_121', status: 'verified', verified_by: 1 },
    { payment_id: 20, order_id: 122, payment_method: 'PromptPay', payment_date: '2026-09-10 15:45:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_122', status: 'verified', verified_by: 1 },
    { payment_id: 21, order_id: 123, payment_method: 'PromptPay', payment_date: '2026-09-12 20:05:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_123', status: 'verified', verified_by: 1 },
    { payment_id: 22, order_id: 124, payment_method: 'PromptPay', payment_date: '2026-09-15 12:30:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_124', status: 'verified', verified_by: 1 },
    { payment_id: 23, order_id: 125, payment_method: 'PromptPay', payment_date: '2026-09-18 17:40:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_125', status: 'verified', verified_by: 1 },
    { payment_id: 24, order_id: 126, payment_method: 'PromptPay', payment_date: '2026-09-20 14:55:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_126', status: 'pending', verified_by: null },
    { payment_id: 25, order_id: 127, payment_method: 'PromptPay', payment_date: '2026-09-22 19:15:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_127', status: 'pending', verified_by: null },
    { payment_id: 26, order_id: 128, payment_method: 'PromptPay', payment_date: '2026-09-25 11:05:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_128', status: 'pending', verified_by: null },
    { payment_id: 27, order_id: 129, payment_method: 'PromptPay', payment_date: '2026-09-27 16:25:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_129', status: 'verified', verified_by: 1 },
    { payment_id: 28, order_id: 130, payment_method: 'PromptPay', payment_date: '2026-09-28 10:50:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_130', status: 'verified', verified_by: 1 },
    { payment_id: 29, order_id: 131, payment_method: 'PromptPay', payment_date: '2026-09-29 13:05:00', slip_image_url: 'https://dummyimage.com/600x800/0070d2/ffffff&text=SLIP_ORDER_131', status: 'verified', verified_by: 1 }
  ];
  const pRes = await fetch(`${sbUrl}/rest/v1/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payments)
  });
  console.log("Payments status:", pRes.status, await pRes.text());

  console.log("=== 9. SEEDING DOWNLOAD LINKS ===");
  const downloadLinks = [
    { link_id: 1, order_id: 101, ebook_id: 1, token: 'token_101_1_abc', download_url: 'https://mockfile.nothave.com/download?id=1&token=token_101_1_abc', expires_at: '2026-12-31 23:59:59', download_count: 2 },
    { link_id: 2, order_id: 101, ebook_id: 2, token: 'token_101_2_def', download_url: 'https://mockfile.nothave.com/download?id=2&token=token_101_2_def', expires_at: '2026-12-31 23:59:59', download_count: 1 },
    { link_id: 3, order_id: 102, ebook_id: 1, token: 'token_102_1_ghi', download_url: 'https://mockfile.nothave.com/download?id=1&token=token_102_1_ghi', expires_at: '2026-12-31 23:59:59', download_count: 0 },
    { link_id: 4, order_id: 103, ebook_id: 1, token: 'token_103_1_jkl', download_url: 'https://mockfile.nothave.com/download?id=1&token=token_103_1_jkl', expires_at: '2026-12-31 23:59:59', download_count: 3 },
    { link_id: 5, order_id: 103, ebook_id: 2, token: 'token_103_2_mno', download_url: 'https://mockfile.nothave.com/download?id=2&token=token_103_2_mno', expires_at: '2026-12-31 23:59:59', download_count: 1 },
    { link_id: 6, order_id: 103, ebook_id: 3, token: 'token_103_3_pqr', download_url: 'https://mockfile.nothave.com/download?id=3&token=token_103_3_pqr', expires_at: '2026-12-31 23:59:59', download_count: 1 },
    { link_id: 7, order_id: 104, ebook_id: 7, token: 'token_104_7_stu', download_url: 'https://mockfile.nothave.com/download?id=7&token=token_104_7_stu', expires_at: '2026-12-31 23:59:59', download_count: 0 },
    { link_id: 8, order_id: 106, ebook_id: 11, token: 'token_106_11_vwx', download_url: 'https://mockfile.nothave.com/download?id=11&token=token_106_11_vwx', expires_at: '2026-12-31 23:59:59', download_count: 4 },
    { link_id: 9, order_id: 107, ebook_id: 1, token: 'token_107_1_yza', download_url: 'https://mockfile.nothave.com/download?id=1&token=token_107_1_yza', expires_at: '2026-12-31 23:59:59', download_count: 1 },
    { link_id: 10, order_id: 107, ebook_id: 2, token: 'token_107_2_bcd', download_url: 'https://mockfile.nothave.com/download?id=2&token=token_107_2_bcd', expires_at: '2026-12-31 23:59:59', download_count: 1 },
    { link_id: 11, order_id: 107, ebook_id: 3, token: 'token_107_3_efg', download_url: 'https://mockfile.nothave.com/download?id=3&token=token_107_3_efg', expires_at: '2026-12-31 23:59:59', download_count: 1 },
    { link_id: 12, order_id: 107, ebook_id: 4, token: 'token_107_4_hij', download_url: 'https://mockfile.nothave.com/download?id=4&token=token_107_4_hij', expires_at: '2026-12-31 23:59:59', download_count: 1 },
    { link_id: 13, order_id: 108, ebook_id: 6, token: 'token_108_6_klm', download_url: 'https://mockfile.nothave.com/download?id=6&token=token_108_6_klm', expires_at: '2026-12-31 23:59:59', download_count: 0 },
    { link_id: 14, order_id: 109, ebook_id: 12, token: 'token_109_12_nop', download_url: 'https://mockfile.nothave.com/download?id=12&token=token_109_12_nop', expires_at: '2026-12-31 23:59:59', download_count: 2 },
    { link_id: 15, order_id: 110, ebook_id: 8, token: 'token_110_8_qrs', download_url: 'https://mockfile.nothave.com/download?id=8&token=token_110_8_qrs', expires_at: '2026-12-31 23:59:59', download_count: 1 },
    { link_id: 16, order_id: 131, ebook_id: 1, token: 'token_131_1_tuv', download_url: 'https://mockfile.nothave.com/download?id=1&token=token_131_1_tuv', expires_at: '2026-12-31 23:59:59', download_count: 1 }
  ];
  const dlRes = await fetch(`${sbUrl}/rest/v1/download_links`, {
    method: 'POST',
    headers,
    body: JSON.stringify(downloadLinks)
  });
  console.log("Download links status:", dlRes.status, await dlRes.text());

  console.log("=== ALL SEEDING COMPLETED ===");
}

seedAllToSupabase();
