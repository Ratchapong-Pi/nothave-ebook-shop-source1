// Local dev server for NOT HAVE A BOOK SHOP with Automated Real Email Dispatch
const http = require('http');
const fs = require('fs');
const path = require('path');
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.warn("Nodemailer not loaded yet, run npm install nodemailer");
}

const PORT = 8080;
const CONFIG_FILE = path.join(__dirname, 'email_config.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml'
};

function readEmailConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (err) {
    console.warn("Error reading email_config.json:", err);
  }
  return { email: "", appPassword: "", senderName: "NOT HAVE A BOOK SHOP" };
}

function saveEmailConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error saving email_config.json:", err);
    return false;
  }
}

const server = http.createServer((req, res) => {
  let [reqPath, queryString] = req.url.split('?');

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API 1: GET Email Configuration
  if (reqPath === '/api/email-config' && (req.method === 'GET' || req.method === 'HEAD')) {
    const config = readEmailConfig();
    const maskedPass = config.appPassword ? "•".repeat(12) : "";
    const emailjs = config.emailjs || { serviceId: "service_ljiywib", templateId: "template_nhy5wtl", publicKey: "", privateKey: "" };
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      provider: config.provider || "emailjs",
      email: config.email || "ratchapong.pi@rmuti.ac.th",
      isConfigured: !!(emailjs.publicKey || (config.email && config.appPassword)),
      maskedPassword: maskedPass,
      senderName: config.senderName || "NOT HAVE A BOOK SHOP (บักบ่ได้หนังสือ)",
      emailjs: {
        serviceId: emailjs.serviceId || "service_ljiywib",
        templateId: emailjs.templateId || "template_nhy5wtl",
        publicKey: emailjs.publicKey || "",
        maskedPublicKey: emailjs.publicKey ? `${emailjs.publicKey.slice(0, 4)}••••${emailjs.publicKey.slice(-4)}` : "",
        hasPrivateKey: !!emailjs.privateKey,
        maskedPrivateKey: emailjs.privateKey ? `${emailjs.privateKey.slice(0, 4)}••••••••` : ""
      }
    }));
    return;
  }

  // API 2: SAVE Email Configuration
  if (reqPath === '/api/save-email-config' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const curConfig = readEmailConfig();
        if (payload.email) curConfig.email = payload.email.trim();
        if (payload.senderName) curConfig.senderName = payload.senderName.trim();
        if (payload.provider) curConfig.provider = payload.provider;

        if (payload.emailjs) {
          const prevPrivate = (curConfig.emailjs && curConfig.emailjs.privateKey) || "";
          let newPrivate = prevPrivate;
          if (payload.emailjs.privateKey !== undefined && !payload.emailjs.privateKey.startsWith("•••")) {
            newPrivate = payload.emailjs.privateKey.trim();
          }
          curConfig.emailjs = {
            serviceId: (payload.emailjs.serviceId || "service_ljiywib").trim(),
            templateId: (payload.emailjs.templateId || "template_nhy5wtl").trim(),
            publicKey: (payload.emailjs.publicKey || "").trim(),
            privateKey: newPrivate
          };
          curConfig.provider = "emailjs";
        }

        const newPass = (payload.appPassword || "").trim();
        if (newPass && !newPass.startsWith("•••")) {
          curConfig.appPassword = newPass;
        }

        saveEmailConfig(curConfig);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: "บันทึกการตั้งค่าอีเมลเรียบร้อยแล้ว" }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // API 3: SEND Real Email via EmailJS or Nodemailer
  if (reqPath === '/api/send-email' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { to, subject, html, text, orderId, orders, total, name } = payload;

        if (!to || !to.includes('@')) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: "ที่อยู่อีเมลผู้รับไม่ถูกต้อง" }));
          return;
        }

        const config = readEmailConfig();

        // 1. Try EmailJS first if publicKey is configured
        if (config.emailjs && config.emailjs.publicKey) {
          try {
            const emailjsParams = {
              email: to,
              to_email: to,
              user_email: to,
              recipient: to,
              to_name: name || "คุณลูกค้า",
              user_name: name || "คุณลูกค้า",
              customer_name: name || "คุณลูกค้า",
              order_id: orderId || "",
              orders: orders || [],
              cost: { shipping: "0.00", tax: "0.00" },
              total: typeof total === 'number' ? total.toFixed(2) : (total || "0.00"),
              download_links: text || "",
              message: text || ""
            };

            const emailPayload = {
              service_id: config.emailjs.serviceId || "service_ljiywib",
              template_id: config.emailjs.templateId || "template_nhy5wtl",
              user_id: config.emailjs.publicKey,
              template_params: emailjsParams
            };
            if (config.emailjs.privateKey) {
              emailPayload.accessToken = config.emailjs.privateKey;
            }

            const emailjsRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(emailPayload)
            });

            if (emailjsRes.ok) {
              console.log(`[EmailJS Sent] Email to ${to} sent successfully via EmailJS!`);
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({
                success: true,
                provider: "emailjs",
                message: `จัดส่งใบเสร็จไปยัง ${to} สำเร็จเรียบร้อยแล้วผ่าน EmailJS`
              }));
              return;
            } else {
              const errTxt = await emailjsRes.text();
              console.warn("[EmailJS Warn]:", errTxt);
            }
          } catch (ejsErr) {
            console.warn("[EmailJS Dispatch Error]:", ejsErr);
          }
        }

        // 2. Fallback to Nodemailer SMTP
        if (!config.email || !config.appPassword) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ 
            success: false, 
            needConfig: true, 
            message: "ระบบต้องการ Public Key ของ EmailJS (จากหน้า Account) หรือ App Password 16 หลัก" 
          }));
          return;
        }

        if (!nodemailer) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: "Nodemailer library missing" }));
          return;
        }

        // Create or Reuse Pooled Transporter for Ultra-Fast Delivery
        const cleanPassword = config.appPassword.replace(/\s+/g, '');
        const senderDomain = (config.email || "").toLowerCase();
        const transportKey = `${config.email}_${cleanPassword}`;

        if (!global._cachedTransporter || global._cachedTransportKey !== transportKey) {
          let transportConfig = {
            service: 'gmail',
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            rateLimit: 10,
            auth: {
              user: config.email,
              pass: cleanPassword
            }
          };

          if (senderDomain.includes('@outlook.') || senderDomain.includes('@hotmail.')) {
            transportConfig = {
              service: 'hotmail',
              pool: true,
              auth: { user: config.email, pass: cleanPassword }
            };
          }

          global._cachedTransporter = nodemailer.createTransport(transportConfig);
          global._cachedTransportKey = transportKey;
        }

        const transporter = global._cachedTransporter;

        const mailOptions = {
          from: `"${config.senderName || 'NOT HAVE A BOOK SHOP'}" <${config.email}>`,
          to: to,
          subject: subject || `[NOT HAVE A BOOK SHOP] ใบเสร็จคำสั่งซื้อ #${orderId || ''}`,
          text: text || "ขอขอบคุณสำหรับคำสั่งซื้อของคุณ",
          html: html || `<p>${(text || "").replace(/\n/g, '<br>')}</p>`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Sent] Message to ${to} sent successfully! ID: ${info.messageId}`);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          messageId: info.messageId,
          message: `จัดส่งใบเสร็จไปยัง ${to} สำเร็จเรียบร้อยแล้ว`
        }));

      } catch (sendErr) {
        console.error("[Email Send Error]:", sendErr);
        let userMessage = sendErr.message;
        if (sendErr.message.includes("535") || sendErr.message.includes("BadCredentials") || sendErr.message.includes("Invalid login")) {
          userMessage = "รหัสผ่านแอป (App Password) ไม่ถูกต้อง: บัญชี Gmail จำเป็นต้องใช้ App Password 16 หลัก (ไม่ใช่รหัสผ่าน Gmail ปกติ) จาก myaccount.google.com/apppasswords";
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: false,
          error: sendErr.message,
          message: userMessage
        }));
      }
    });
    return;
  }

  // API 4: TEST Email Connection & Delivery
  if (reqPath === '/api/test-email' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const curConfig = readEmailConfig();
        const testTo = (payload.to || curConfig.email || "").trim();
        const testUser = (payload.email || curConfig.email || "").trim();
        let testPass = (payload.appPassword || "").trim();
        if (!testPass || testPass.startsWith("•••")) {
          testPass = curConfig.appPassword || "";
        }
        testPass = testPass.replace(/\s+/g, '');

        // Test via EmailJS if publicKey provided or configured
        const emailjsKey = ((payload.emailjs && payload.emailjs.publicKey) || payload.publicKey || (curConfig.emailjs && curConfig.emailjs.publicKey) || "").trim();
        if (emailjsKey) {
          const sId = ((payload.emailjs && payload.emailjs.serviceId) || payload.serviceId || (curConfig.emailjs && curConfig.emailjs.serviceId) || "service_ljiywib").trim();
          const tId = ((payload.emailjs && payload.emailjs.templateId) || payload.templateId || (curConfig.emailjs && curConfig.emailjs.templateId) || "template_nhy5wtl").trim();

          try {
            const testPayload = {
              service_id: sId,
              template_id: tId,
              user_id: emailjsKey,
              template_params: {
                email: testTo,
                to_email: testTo,
                user_email: testTo,
                recipient: testTo,
                to_name: "คุณลูกค้า (ทดสอบ)",
                user_name: "คุณลูกค้า (ทดสอบ)",
                customer_name: "คุณลูกค้า (ทดสอบ)",
                order_id: "TEST-8888",
                orders: [{ name: "หนังสือทดสอบระบบ E-Book", units: 1, price: "152.00" }],
                cost: { shipping: "0.00", tax: "0.00" },
                total: "152.00",
                download_links: "https://mockfile.nothave.com/ebooks/test.pdf",
                message: "ทดสอบการเชื่อมต่อระบบ EmailJS สำเร็จ 100%! พร้อมส่งใบเสร็จจริงอัตโนมัติ"
              }
            };
            const pKey = ((payload.emailjs && payload.emailjs.privateKey) || payload.privateKey || (curConfig.emailjs && curConfig.emailjs.privateKey) || "").trim();
            if (pKey) {
              testPayload.accessToken = pKey;
            }

            const emailjsRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(testPayload)
            });

            if (emailjsRes.ok) {
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ 
                success: true, 
                message: `ทดสอบสำเร็จ! ส่งอีเมลทดสอบผ่าน EmailJS ไปยัง ${testTo} สำเร็จเรียบร้อยแล้ว` 
              }));
              return;
            } else {
              const errTxt = await emailjsRes.text();
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ 
                success: false, 
                error: errTxt,
                message: `EmailJS ส่งไม่สำเร็จ: ${errTxt} (กรุณาตรวจสอบ Public Key ให้ถูกต้อง)` 
              }));
              return;
            }
          } catch (eErr) {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: "เกิดข้อผิดพลาดในการเชื่อมต่อ EmailJS: " + eErr.message }));
            return;
          }
        }

        if (!testUser || !testPass) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ 
            success: false, 
            message: "กรุณาระบุ Public Key ของ EmailJS หรือ App Password 16 หลักก่อนทดสอบ" 
          }));
          return;
        }

        if (!testTo || !testTo.includes('@')) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ 
            success: false, 
            message: "กรุณาระบุอีเมลปลายทางที่จะส่งข้อความทดสอบไปให้ถูกต้อง" 
          }));
          return;
        }

        if (!nodemailer) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: "Nodemailer library not installed" }));
          return;
        }

        const senderDomain = testUser.toLowerCase();
        let transportConfig = {
          service: 'gmail',
          auth: { user: testUser, pass: testPass }
        };
        if (senderDomain.includes('@outlook.') || senderDomain.includes('@hotmail.')) {
          transportConfig = {
            service: 'hotmail',
            auth: { user: testUser, pass: testPass }
          };
        }

        const transporter = nodemailer.createTransport(transportConfig);

        // Verify connection first
        await transporter.verify();

        // Send test email
        const testInfo = await transporter.sendMail({
          from: `"NOT HAVE A BOOK SHOP (ทดสอบ)" <${testUser}>`,
          to: testTo,
          subject: "[ทดสอบระบบอีเมล] ยืนยันการเชื่อมต่อ SMTP สำเร็จ - NOT HAVE A BOOK SHOP",
          text: `สวัสดีครับ,\n\nอีเมลฉบับนี้ส่งมาจากระบบร้านหนังสือ NOT HAVE A BOOK SHOP (บักบ่ได้หนังสือ)\nเพื่อยืนยันว่าการตั้งค่าบัญชีส่งอีเมล (${testUser}) ทำงานได้ถูกต้องสมบูรณ์แบบ 100% แล้ว!\n\nเมื่อลูกค้าสั่งซื้อหนังสือ ระบบจะส่งใบเสร็จและลิงก์ดาวน์โหลดเข้ากล่องข้อความจริงของผู้ซื้ออัตโนมัติทันทีครับ\n\nทดสอบเมื่อ: ${new Date().toLocaleString('th-TH')}`,
          html: `
            <div style="font-family:'Prompt',sans-serif,Arial; max-width:550px; margin:0 auto; padding:20px; border:1px solid #bae6fd; border-radius:10px; background:#f0f9ff;">
              <h3 style="color:#0284c7; margin-top:0;">🎉 การเชื่อมต่อระบบอีเมลสำเร็จ 100%!</h3>
              <p>สวัสดีครับ,</p>
              <p>อีเมลฉบับนี้เป็นการทดสอบส่งจากระบบร้านหนังสือ <strong>NOT HAVE A BOOK SHOP (บักบ่ได้หนังสือ)</strong></p>
              <div style="background:#ffffff; border:1px solid #e0f2fe; padding:12px; border-radius:6px; margin:14px 0; font-size:13px;">
                <div><strong>ผู้ส่งที่เชื่อมต่อ:</strong> ${testUser}</div>
                <div><strong>ผู้รับทดสอบ:</strong> ${testTo}</div>
                <div><strong>เวลาที่ทดสอบ:</strong> ${new Date().toLocaleString('th-TH')}</div>
                <div><strong>สถานะ:</strong> <span style="color:#16a34a; font-weight:700;">พร้อมส่งใบเสร็จจริงอัตโนมัติทุกคำสั่งซื้อ</span></div>
              </div>
              <p style="font-size:12px; color:#64748b;">
                ต่อจากนี้ เมื่อลูกค้ากดยืนยันการชำระเงิน ระบบจะส่งใบเสร็จพร้อมลิงก์ดาวน์โหลด E-Book เข้า Inbox จริงของผู้ซื้อโดยอัตโนมัติทันทีครับ
              </p>
            </div>
          `
        });

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ 
          success: true, 
          message: `ทดสอบสำเร็จ! ส่งอีเมลทดสอบไปยัง ${testTo} เรียบร้อยแล้ว (Message ID: ${testInfo.messageId})` 
        }));

      } catch (testErr) {
        console.error("[Test Email Error]:", testErr);
        let friendlyMsg = testErr.message;
        if (testErr.message.includes("535") || testErr.message.includes("BadCredentials") || testErr.message.includes("Invalid login")) {
          friendlyMsg = "รหัสผ่านแอป (App Password) ไม่ถูกต้อง: หากใช้บัญชี Gmail ต้องเปิด 2-Step Verification และสร้างรหัสผ่านแอป 16 ตัวจาก myaccount.google.com/apppasswords มาใส่แทนรหัสผ่านปกติครับ";
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ 
          success: false, 
          error: testErr.message,
          message: friendlyMsg 
        }));
      }
    });
    return;
  }

  // API 5: GET Role Requests
  if (reqPath === '/api/role-requests' && req.method === 'GET') {
    const ROLE_REQ_FILE = path.join(__dirname, 'role_requests.json');
    let reqs = [];
    try {
      if (fs.existsSync(ROLE_REQ_FILE)) {
        reqs = JSON.parse(fs.readFileSync(ROLE_REQ_FILE, 'utf8'));
      }
    } catch (e) {}
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(reqs));
    return;
  }

  // API 6: SAVE / UPDATE Role Request
  if (reqPath === '/api/role-requests' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const ROLE_REQ_FILE = path.join(__dirname, 'role_requests.json');
        let reqs = [];
        try {
          if (fs.existsSync(ROLE_REQ_FILE)) {
            reqs = JSON.parse(fs.readFileSync(ROLE_REQ_FILE, 'utf8'));
          }
        } catch (e) {}

        const idx = reqs.findIndex(r => r.id === payload.id);
        if (idx !== -1) {
          reqs[idx] = { ...reqs[idx], ...payload };
        } else {
          reqs.unshift(payload);
        }

        fs.writeFileSync(ROLE_REQ_FILE, JSON.stringify(reqs, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: "บันทึกคำขอสำเร็จ", data: payload }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // API 7: UPDATE Role Request Status (approve/reject)
  if (reqPath === '/api/role-requests/status' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { id, status } = JSON.parse(body);
        const ROLE_REQ_FILE = path.join(__dirname, 'role_requests.json');
        let reqs = [];
        try {
          if (fs.existsSync(ROLE_REQ_FILE)) {
            reqs = JSON.parse(fs.readFileSync(ROLE_REQ_FILE, 'utf8'));
          }
        } catch (e) {}

        const item = reqs.find(r => r.id === id);
        if (item) {
          item.status = status;
          fs.writeFileSync(ROLE_REQ_FILE, JSON.stringify(reqs, null, 2), 'utf8');
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: `อัปเดตสถานะเป็น ${status} เรียบร้อย` }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // API 8: GET User Roles Overrides
  if (reqPath === '/api/user-roles' && req.method === 'GET') {
    const ROLES_OVERRIDE_FILE = path.join(__dirname, 'user_roles.json');
    let userRoles = {};
    try {
      if (fs.existsSync(ROLES_OVERRIDE_FILE)) {
        userRoles = JSON.parse(fs.readFileSync(ROLES_OVERRIDE_FILE, 'utf8'));
      }
    } catch (e) {}
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(userRoles));
    return;
  }

  // API 9: SET User Role Override
  if (reqPath === '/api/user-roles' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { userId, email, roleId, roleName } = JSON.parse(body);
        const ROLES_OVERRIDE_FILE = path.join(__dirname, 'user_roles.json');
        let userRoles = {};
        try {
          if (fs.existsSync(ROLES_OVERRIDE_FILE)) {
            userRoles = JSON.parse(fs.readFileSync(ROLES_OVERRIDE_FILE, 'utf8'));
          }
        } catch (e) {}

        if (userId) userRoles[String(userId)] = { roleId: parseInt(roleId), roleName };
        if (email) userRoles[String(email).toLowerCase()] = { roleId: parseInt(roleId), roleName };

        fs.writeFileSync(ROLES_OVERRIDE_FILE, JSON.stringify(userRoles, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: "บันทึกบทบาทผู้ใช้สำเร็จ", data: userRoles }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // API 10: FILE UPLOAD (Save PDF / Cover Images to local /uploads/ to prevent massive DB payloads)
  if (reqPath === '/api/upload' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { fileName, fileData } = JSON.parse(body);
        if (!fileData) throw new Error("No file data provided");

        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const ext = path.extname(fileName || '') || (fileData.startsWith('data:image/') ? '.png' : '.pdf');
        const base = path.basename(fileName || 'file', ext).replace(/[^a-zA-Z0-9_-]/g, '_') || 'file';
        const uniqueName = `${Date.now()}_${base}${ext}`;
        const savePath = path.join(uploadsDir, uniqueName);

        const base64Data = fileData.includes(';base64,') ? fileData.split(';base64,')[1] : fileData;
        fs.writeFileSync(savePath, Buffer.from(base64Data, 'base64'));

        const fileUrl = `/uploads/${uniqueName}`;
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, url: fileUrl, fileName: uniqueName }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // STATIC FILE HANDLER
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(__dirname, reqPath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/ with Automated Email Delivery Support`);
  });
}

module.exports = server;
