const fs = require('fs');

async function seedEbooks() {
  const appJs = fs.readFileSync('app.js', 'utf8');
  const urlMatch = appJs.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
  const keyMatch = appJs.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
  const sbUrl = urlMatch[1];
  const sbKey = keyMatch[1];

  const headers = {
    'apikey': sbKey,
    'Authorization': `Bearer ${sbKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const books = [
    {
      ebook_id: 1,
      title: 'คุณพี่ที่ผมมาส่งข้าวให้จะน่ากลัวเกินไปแล้ว เล่ม 1',
      author_id: 1,
      category_id: 1,
      price: 152.00,
      original_price: 169.00,
      point_reward: 45,
      description: 'เรื่องราวสุดป่วนของเด็กหนุ่มส่งข้าวกล่องกับคุณพี่สาวข้างห้องที่ดูลึกลับและน่ากลัว แต่แท้จริงแล้วมีมุมที่คาดไม่ถึง!',
      sample_text: 'ตัวอย่างเนื้อหา: "นี่เธอ... วันนี้เอาเมนูอะไรมาส่งงั้นเหรอ?" เสียงทุ้มต่ำดังขึ้นหลังบานประตูที่เปิดแง้มเพียงเล็กน้อย...',
      cover_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80',
      file_url: 'https://mockfile.nothave.com/ebooks/scary_sister_vol1.pdf',
      is_active: true
    },
    {
      ebook_id: 2,
      title: 'คุณพี่ที่ผมมาส่งข้าวให้จะน่ากลัวเกินไปแล้ว เล่ม 2',
      author_id: 1,
      category_id: 1,
      price: 152.00,
      original_price: 169.00,
      point_reward: 45,
      description: 'ความสัมพันธ์เริ่มคืบหน้า เมื่อคุณพี่สาวเริ่มขอร้องให้ทำข้าวกล่องเมนูพิเศษให้!',
      sample_text: 'ตัวอย่างเนื้อหา: "ถ้าคราวหน้าเธอทำไข่ม้วนหวานมาให้ ฉันอาจจะมีรางวัลให้ก็ได้นะ..."',
      cover_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80',
      file_url: 'https://mockfile.nothave.com/ebooks/scary_sister_vol2.pdf',
      is_active: true
    },
    {
      ebook_id: 3,
      title: 'คุณพี่ที่ผมมาส่งข้าวให้จะน่ากลัวเกินไปแล้ว เล่ม 3',
      author_id: 1,
      category_id: 1,
      price: 152.00,
      original_price: 169.00,
      point_reward: 45,
      description: 'การปรากฏตัวของแขกที่ไม่ได้รับเชิญทำให้ความลับของคุณพี่สาวเกือบถูกเปิดเผย!',
      sample_text: 'ตัวอย่างเนื้อหา: "อย่าบอกเรื่องห้องนี้กับใครเด็ดขาดนะ... สัญญากับฉันสิ"',
      cover_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80',
      file_url: 'https://mockfile.nothave.com/ebooks/scary_sister_vol3.pdf',
      is_active: true
    },
    {
      ebook_id: 4,
      title: 'คุณพี่ที่ผมมาส่งข้าวให้จะน่ากลัวเกินไปแล้ว เล่ม 4 (จบภาคแรก)',
      author_id: 1,
      category_id: 1,
      price: 152.00,
      original_price: 169.00,
      point_reward: 45,
      description: 'บทสรุปความอบอุ่นของความสัมพันธ์ระหว่างผู้ส่งข้าวกับคุณพี่สาวข้างห้อง!',
      sample_text: 'ตัวอย่างเนื้อหา: "ขอบคุณนะ สำหรับข้าวกล่องตลอดหนึ่งปีที่ผ่านมา..."',
      cover_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=80',
      file_url: 'https://mockfile.nothave.com/ebooks/scary_sister_vol4.pdf',
      is_active: true
    },
    {
      ebook_id: 5,
      title: 'ยมแพ่งยมโลก เล่ม 12',
      author_id: 2,
      category_id: 1,
      price: 152.00,
      original_price: 169.00,
      point_reward: 45,
      description: 'การต่อสู้สุดดุเดือดในแดนชำระบาปที่เดิมพันด้วยจิตวิญญาณแห่งมวลมนุษยชาติ',
      sample_text: 'ตัวอย่างเนื้อหา: "ถ้าการมีชีวิตอยู่มันทรมานนัก ข้าจะช่วยปลดปล่อยเจ้าเอง!"',
      cover_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
      file_url: 'https://mockfile.nothave.com/ebooks/underworld_vol12.pdf',
      is_active: true
    },
    {
      ebook_id: 6,
      title: 'เพื่อนสะดวกคิส มิตรสะดวกเลิฟ เล่ม 4',
      author_id: 3,
      category_id: 1,
      price: 152.00,
      original_price: 169.00,
      point_reward: 45,
      description: 'ความสัมพันธ์แบบเพื่อนสนิทคิดไม่ซื่อที่เริ่มเลยเถิดจนเกินจะถอยกลับ!',
      sample_text: 'ตัวอย่างเนื้อหา: "เราเป็นแค่เพื่อนกันจริงๆ น่ะเหรอ? แล้วที่จูบกันเมื่อวานคืออะไร?"',
      cover_url: 'https://images.unsplash.com/photo-1560972550-aba3456b5564?w=500&auto=format&fit=crop&q=80',
      file_url: 'https://mockfile.nothave.com/ebooks/kiss_friend_vol4.pdf',
      is_active: true
    },
    {
      ebook_id: 7,
      title: 'เพื่อนคนแรกของผมคือสาวสวยอันดับสองของห้อง เล่ม 1',
      author_id: 3,
      category_id: 2,
      price: 185.00,
      original_price: 220.00,
      point_reward: 50,
      description: 'หนังสือทั่วไปยอดฮิต เมื่อหนุ่มจืดชืดได้สนิทกับดาวโรงเรียนอันดับสองด้วยความบังเอิญ',
      sample_text: 'ตัวอย่างเนื้อหา: "ทำไมนายถึงคุยกับฉันแบบสบายใจจัง ไม่เกร็งเหมือนคนอื่นเลยล่ะ?"',
      cover_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
      file_url: 'https://mockfile.nothave.com/ebooks/second_beauty_vol1.pdf',
      is_active: true
    },
    {
      ebook_id: 8,
      title: 'ซาซากิกับมิยาโนะ เล่ม 11',
      author_id: 1,
      category_id: 1,
      price: 152.00,
      original_price: 169.00,
      point_reward: 45,
      description: 'ชีวิตประจำวันอันสดใสของรุ่นพี่แบดบอยกับรุ่นน้องหนุ่มน้อยผู้รักการ์ตูนวาย',
      sample_text: 'ตัวอย่างเนื้อหา: "มิยาโนะ... วันนี้มีมังงะเรื่องใหม่มาแนะนำพี่อีกมั้ย?"',
      cover_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
      file_url: 'https://mockfile.nothave.com/ebooks/sasaki_miya_vol11.pdf',
      is_active: true
    },
    {
      ebook_id: 9,
      title: 'มิเอรุโกะจัง ใครว่าหนูเห็นผี เล่ม 14',
      author_id: 2,
      category_id: 1,
      price: 152.00,
      original_price: 169.00,
      point_reward: 45,
      description: 'สาวมัธยมผู้มองเห็นวิญญาณสยองขวัญแต่ต้องแกล้งทำเป็นมองไม่เห็นเพื่อเอาชีวิตรอด!',
      sample_text: 'ตัวอย่างเนื้อหา: "(อย่ามองนะ... ถ้ามองมันจะรู้ว่าเราเห็น... กรี๊ดดดด!)"',
      cover_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
      file_url: 'https://mockfile.nothave.com/ebooks/mieruko_vol14.pdf',
      is_active: true
    },
    {
      ebook_id: 10,
      title: 'เส้นทางจาริกอาถรรพ์ เล่ม 1',
      author_id: 4,
      category_id: 3,
      price: 230.00,
      original_price: 329.00,
      point_reward: 60,
      description: 'นิยายดาร์กแฟนตาซีผจญภัย เดินทางข้ามทวีปต้องสาปเพื่อค้นหาคำตอบแห่งชีวิต',
      sample_text: 'ตัวอย่างเนื้อหา: "ดินแดนแห่งนี้ไม่มีเทพเจ้าคอยคุ้มครอง มีเพียงดาบในมือเจ้าเท่านั้น..."',
      cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=80',
      file_url: 'https://mockfile.nothave.com/ebooks/dark_pilgrim_vol1.pdf',
      is_active: true
    },
    {
      ebook_id: 11,
      title: 'คัมภีร์ฐานข้อมูลและการป้องกันภัยไซเบอร์',
      author_id: 5,
      category_id: 5,
      price: 290.00,
      original_price: 350.00,
      point_reward: 80,
      description: 'คู่มือออกแบบ RDBMS 3NF พร้อมเทคนิคความปลอดภัย Web & Database ฉบับสมบูรณ์',
      sample_text: 'ตัวอย่างเนื้อหา: "บทที่ 1: การป้องกัน SQL Injection และ Broken Access Control ในระบบงานจริง..."',
      cover_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=80',
      file_url: 'https://mockfile.nothave.com/ebooks/db_security_handbook.pdf',
      is_active: true
    },
    {
      ebook_id: 12,
      title: 'รวมภาพศิลป์สุดอลังการ Artbook Fantasy 2026',
      author_id: 1,
      category_id: 4,
      price: 390.00,
      original_price: 450.00,
      point_reward: 100,
      description: 'อาร์ตบุ๊ครวมผลงานภาพประกอบสีน้ำและดิจิทัลเพ้นท์ระดับมาสเตอร์พีซ',
      sample_text: 'ตัวอย่างเนื้อหา: "รวมภาพร่างเบื้องหลังการออกแบบตัวละครและฉากแฟนตาซีสุดตระการตา..."',
      cover_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=80',
      file_url: 'https://mockfile.nothave.com/ebooks/fantasy_artbook_2026.pdf',
      is_active: true
    }
  ];

  const res = await fetch(`${sbUrl}/rest/v1/ebooks`, {
    method: 'POST',
    headers,
    body: JSON.stringify(books)
  });

  const data = await res.json();
  console.log('Insert status:', res.status, 'Inserted count:', Array.isArray(data) ? data.length : data);
}

seedEbooks().catch(console.error);
