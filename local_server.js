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
      email: config.email || "",
      senderName: config.senderName || "NOT HAVE A BOOK SHOP",
      hasPassword: !!config.appPassword,
      appPasswordMasked: maskedPass,
      emailjs: emailjs
    }));
    return;
  }

  // API 2: SAVE Email Configuration
  if (reqPath === '/api/save-email-config' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const currentConfig = readEmailConfig();

        const updated = {
          provider: data.provider || currentConfig.provider || "emailjs",
          email: data.email !== undefined ? data.email.trim() : currentConfig.email,
          senderName: data.senderName !== undefined ? data.senderName.trim() : currentConfig.senderName,
          appPassword: data.appPassword !== undefined && data.appPassword !== "" ? data.appPassword.trim() : currentConfig.appPassword,
          emailjs: {
            serviceId: (data.emailjs && data.emailjs.serviceId) || (currentConfig.emailjs && currentConfig.emailjs.serviceId) || "service_ljiywib",
            templateId: (data.emailjs && data.emailjs.templateId) || (currentConfig.emailjs && currentConfig.emailjs.templateId) || "template_nhy5wtl",
            publicKey: (data.emailjs && data.emailjs.publicKey !== undefined) ? data.emailjs.publicKey.trim() : ((currentConfig.emailjs && currentConfig.emailjs.publicKey) || ""),
            privateKey: (data.emailjs && data.emailjs.privateKey !== undefined) ? data.emailjs.privateKey.trim() : ((currentConfig.emailjs && currentConfig.emailjs.privateKey) || "")
          }
        };

        if (saveEmailConfig(updated)) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, message: "บันทึกการตั้งค่าอีเมลเรียบร้อยแล้ว" }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: "ไม่สามารถบันทึกไฟล์ email_config.json ได้" }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: "Invalid JSON body: " + e.message }));
      }
    });
    return;
  }

  // API 3: TEST Email Dispatch
  if (reqPath === '/api/test-email' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const targetEmail = data.targetEmail;
        if (!targetEmail) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: "กรุณาระบุอีเมลปลายทางที่ต้องการทดสอบ" }));
          return;
        }

        const config = readEmailConfig();
        const provider = data.provider || config.provider || "emailjs";

        if (provider === "emailjs") {
          const emailjs = config.emailjs || {};
          const serviceId = emailjs.serviceId || "service_ljiywib";
          const templateId = emailjs.templateId || "template_nhy5wtl";
          const publicKey = emailjs.publicKey || "";
          const privateKey = emailjs.privateKey || "";

          if (!publicKey) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: "ยังไม่ได้ระบุ EmailJS Public Key ในระบบ" }));
            return;
          }

          const templateParams = {
            to_email: targetEmail,
            to_name: targetEmail.split('@')[0],
            customer_name: targetEmail.split('@')[0],
            order_id: "TEST-" + Date.now().toString().slice(-6),
            items_list: "1. หนังสือนิยายทดสอบระบบ (1 เล่ม) - ฿0.00",
            total_price: "0.00",
            download_links: "https://qmpaatmniwagzijazzxb.supabase.co/storage/v1/object/public/ebooks_pdf/sample.pdf",
            app_name: config.senderName || "NOT HAVE A BOOK SHOP"
          };

          const payload = {
            service_id: serviceId,
            template_id: templateId,
            user_id: publicKey,
            template_params: templateParams
          };
          if (privateKey) payload.accessToken = privateKey;

          const emailjsRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (emailjsRes.ok) {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, message: `ส่งอีเมลทดสอบผ่าน EmailJS ไปยัง ${targetEmail} สำเร็จเรียบร้อยแล้ว!` }));
          } else {
            const errText = await emailjsRes.text();
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: `EmailJS ส่งไม่สำเร็จ (${emailjsRes.status}): ${errText}` }));
          }
          return;
        }

        // SMTP Nodemailer
        if (!nodemailer) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: "Nodemailer library is not installed." }));
          return;
        }

        const senderEmail = config.email;
        const appPassword = config.appPassword;
        const senderName = config.senderName || "NOT HAVE A BOOK SHOP";

        if (!senderEmail || !appPassword) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: "ยังไม่ได้ระบุอีเมลผู้ส่ง (Gmail) หรือ App Password" }));
          return;
        }

        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: senderEmail, pass: appPassword }
        });

        const mailOptions = {
          from: `"${senderName}" <${senderEmail}>`,
          to: targetEmail,
          subject: `[ทดสอบระบบ] ทดสอบส่งอีเมลอัตโนมัติจาก ${senderName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #2b5aed; text-align: center;">🎉 ทดสอบระบบส่งอีเมลสำเร็จ!</h2>
              <p>สวัสดีครับ,</p>
              <p>นี่คืออีเมลทดสอบการทำงานของระบบจัดส่งอีเมลอัตโนมัติจาก <strong>${senderName}</strong></p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #2b5aed; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #475569;">
                  <strong>สถานะ:</strong> พร้อมใช้งานจริงสำหรับการส่งลิงก์ดาวน์โหลด E-book ให้ลูกค้าอัตโนมัติเมื่อชำระเงินสำเร็จ
                </p>
              </div>
              <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 30px;">
                © ${new Date().getFullYear()} ${senderName}. All rights reserved.
              </p>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: `ส่งอีเมลทดสอบผ่าน Gmail SMTP ไปยัง ${targetEmail} สำเร็จแล้ว!` }));
      } catch (err) {
        console.error("Test email error:", err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: "เกิดข้อผิดพลาดในการส่งอีเมล: " + err.message }));
      }
    });
    return;
  }

  // API 4: Real E-book Automated Email Delivery
  if (reqPath === '/api/send-email' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { targetEmail, customerName, orderId, items, totalPrice } = data;

        if (!targetEmail) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: "Target email required" }));
          return;
        }

        const config = readEmailConfig();
        const provider = config.provider || "emailjs";
        const senderName = config.senderName || "NOT HAVE A BOOK SHOP";

        let itemsHtml = '';
        let itemsText = '';
        let downloadLinksText = '';

        if (Array.isArray(items)) {
          items.forEach((it, idx) => {
            const title = it.title || it.ebook_title || "E-book";
            const price = parseFloat(it.price || it.price_at_purchase || 0).toFixed(2);
            const dl = it.download_url || it.pdf_url || "https://qmpaatmniwagzijazzxb.supabase.co/storage/v1/object/public/ebooks_pdf/sample.pdf";
            
            itemsText += `${idx + 1}. ${title} - ฿${price}\n`;
            downloadLinksText += `• ${title}: ${dl}\n`;

            itemsHtml += `
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
                <table style="width: 100%;">
                  <tr>
                    <td>
                      <strong style="color: #1e293b; font-size: 15px;">📖 ${title}</strong>
                      <div style="color: #64748b; font-size: 13px; margin-top: 4px;">ราคา: ฿${price}</div>
                    </td>
                    <td style="text-align: right;">
                      <a href="${dl}" target="_blank" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: bold; display: inline-block;">
                        ⬇️ ดาวน์โหลด PDF
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
            `;
          });
        }

        if (provider === "emailjs") {
          const emailjs = config.emailjs || {};
          const serviceId = emailjs.serviceId || "service_ljiywib";
          const templateId = emailjs.templateId || "template_nhy5wtl";
          const publicKey = emailjs.publicKey || "";
          const privateKey = emailjs.privateKey || "";

          if (publicKey) {
            const payload = {
              service_id: serviceId,
              template_id: templateId,
              user_id: publicKey,
              template_params: {
                to_email: targetEmail,
                to_name: customerName || targetEmail.split('@')[0],
                customer_name: customerName || targetEmail.split('@')[0],
                order_id: orderId || "ORD-" + Date.now().toString().slice(-6),
                items_list: itemsText,
                total_price: parseFloat(totalPrice || 0).toFixed(2),
                download_links: downloadLinksText,
                app_name: senderName
              }
            };
            if (privateKey) payload.accessToken = privateKey;

            const emailjsRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });

            if (emailjsRes.ok) {
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ success: true, provider: "emailjs", message: "จัดส่งอีเมลลิงก์ดาวน์โหลดผ่าน EmailJS สำเร็จ!" }));
              return;
            }
          }
        }

        // SMTP Fallback
        if (nodemailer && config.email && config.appPassword) {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: config.email, pass: config.appPassword }
          });

          const mailHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; background: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #2563eb; margin: 0; font-size: 24px;">📚 ${senderName}</h1>
                <p style="color: #64748b; font-size: 14px; margin-top: 4px;">ขอบคุณสำหรับการสั่งซื้อหนังสือ E-book กับเรา</p>
              </div>

              <div style="background: #ffffff; padding: 18px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                <table style="width: 100%; font-size: 14px; color: #334155;">
                  <tr>
                    <td><strong>หมายเลขคำสั่งซื้อ:</strong></td>
                    <td style="text-align: right; color: #2563eb; font-weight: bold;">#${orderId || Date.now().toString().slice(-6)}</td>
                  </tr>
                  <tr>
                    <td><strong>ชื่อผู้ซื้อ:</strong></td>
                    <td style="text-align: right;">${customerName || targetEmail.split('@')[0]}</td>
                  </tr>
                  <tr>
                    <td><strong>ยอดชำระทั้งหมด:</strong></td>
                    <td style="text-align: right; font-weight: bold; color: #16a34a;">฿${parseFloat(totalPrice || 0).toFixed(2)}</td>
                  </tr>
                </table>
              </div>

              <h3 style="color: #1e293b; font-size: 16px; margin-bottom: 12px;">📥 รายการหนังสือและลิงก์ดาวน์โหลดของคุณ:</h3>
              ${itemsHtml}

              <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; border-radius: 4px; margin-top: 20px;">
                <p style="margin: 0; font-size: 13px; color: #1e40af;">
                  💡 <strong>คำแนะนำ:</strong> คุณสามารถกดปุ่ม "ดาวน์โหลด PDF" เพื่อเปิดอ่านหรือบันทึกไฟล์เก็บไว้ในอุปกรณ์ได้ตลอดเวลา
                </p>
              </div>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px;">
              <p style="text-align: center; font-size: 12px; color: #94a3b8; margin: 0;">
                อีเมลฉบับนี้ส่งจากระบบอัตโนมัติของ ${senderName}<br>หากมีข้อสงสัยกรุณาติดต่อผู้ดูแลระบบ
              </p>
            </div>
          `;

          await transporter.sendMail({
            from: `"${senderName}" <${config.email}>`,
            to: targetEmail,
            subject: `[${senderName}] คำสั่งซื้อ #${orderId || ''} สำเร็จ - ลิงก์ดาวน์โหลด E-book ของคุณ`,
            html: mailHtml
          });

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, provider: "smtp", message: "จัดส่งอีเมลสำเร็จผ่าน Gmail SMTP!" }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: "บันทึกการส่งอีเมลเรียบร้อย (Client Direct Fallback)" }));
      } catch (err) {
        console.error("Automated send-email error:", err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return;
  }

  // API 5: Role Requests Management
  const ROLE_REQ_FILE = path.join(__dirname, 'role_requests.json');
  if (reqPath === '/api/role-requests') {
    if (req.method === 'GET' || req.method === 'HEAD') {
      try {
        let list = [];
        if (fs.existsSync(ROLE_REQ_FILE)) {
          list = JSON.parse(fs.readFileSync(ROLE_REQ_FILE, 'utf8') || '[]');
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, requests: list }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: e.message, requests: [] }));
      }
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const reqData = JSON.parse(body);
          let list = [];
          if (fs.existsSync(ROLE_REQ_FILE)) {
            list = JSON.parse(fs.readFileSync(ROLE_REQ_FILE, 'utf8') || '[]');
          }

          const existingIdx = list.findIndex(r => r.userId === reqData.userId && r.targetRole === reqData.targetRole && r.status === 'pending');
          if (existingIdx !== -1) {
            list[existingIdx] = { ...list[existingIdx], ...reqData, updatedAt: new Date().toISOString() };
          } else {
            list.unshift({
              id: "REQ-" + Date.now().toString().slice(-6),
              ...reqData,
              status: "pending",
              createdAt: new Date().toISOString()
            });
          }

          fs.writeFileSync(ROLE_REQ_FILE, JSON.stringify(list, null, 2), 'utf8');
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, message: "บันทึกคำขอสิทธิ์เรียบร้อยแล้ว" }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }
  }

  // API 6: Update Role Request Status
  if (reqPath === '/api/role-requests/status' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { requestId, status, adminNote } = JSON.parse(body);
        let list = [];
        if (fs.existsSync(ROLE_REQ_FILE)) {
          list = JSON.parse(fs.readFileSync(ROLE_REQ_FILE, 'utf8') || '[]');
        }

        const idx = list.findIndex(r => r.id === requestId);
        if (idx !== -1) {
          list[idx].status = status;
          list[idx].adminNote = adminNote || "";
          list[idx].processedAt = new Date().toISOString();
          fs.writeFileSync(ROLE_REQ_FILE, JSON.stringify(list, null, 2), 'utf8');
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, message: "อัปเดตสถานะคำขอเรียบร้อยแล้ว", request: list[idx] }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: "ไม่พบคำขอดังกล่าว" }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // API 7: User Roles Local Storage
  const USER_ROLES_FILE = path.join(__dirname, 'user_roles.json');
  if (reqPath === '/api/user-roles') {
    if (req.method === 'GET' || req.method === 'HEAD') {
      try {
        let roles = {};
        if (fs.existsSync(USER_ROLES_FILE)) {
          roles = JSON.parse(fs.readFileSync(USER_ROLES_FILE, 'utf8') || '{}');
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, roles: roles }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: e.message, roles: {} }));
      }
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const { userId, email, roleId, roleName } = JSON.parse(body);
          let roles = {};
          if (fs.existsSync(USER_ROLES_FILE)) {
            roles = JSON.parse(fs.readFileSync(USER_ROLES_FILE, 'utf8') || '{}');
          }

          if (userId) {
            roles[userId] = { roleId, roleName, email, updatedAt: new Date().toISOString() };
          }
          if (email) {
            roles[email.toLowerCase()] = { roleId, roleName, userId, updatedAt: new Date().toISOString() };
          }

          fs.writeFileSync(USER_ROLES_FILE, JSON.stringify(roles, null, 2), 'utf8');
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, message: "บันทึก Role ผู้ใช้เรียบร้อยแล้ว" }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }
  }

  // API 8: File Upload Helper
  if (reqPath === '/api/upload' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { fileData, fileName } = JSON.parse(body);
        if (!fileData) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: "No fileData provided" }));
          return;
        }

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

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/ with Automated Email Delivery Support`);
});
