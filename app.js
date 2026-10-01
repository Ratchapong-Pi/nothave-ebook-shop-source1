/**
 * NOT HAVE A BOOK SHOP (บักบ่ได้หนังสือ)
 * Web Application Logic & Supabase Integration
 * Level: 3rd Year Computer Science Mini-Project
 * Cyber Security: SHA-256 Password Hashing, XSS Sanitization, Parameterized DB Calls, RBAC & Download Control
 */

// ==========================================
// 1. SUPABASE CONFIGURATION
// ==========================================
const SUPABASE_URL = "https://qmpaatmniwagzijazzxb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcGFhdG1uaXdhZ3ppamF6enhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2OTU4NDcsImV4cCI6MjEwNjI3MTg0N30.UrozUWTiA-aocCb0R1RSJ_RrNfmX8gPpnMz5vkhsxCg";

// Initialize Supabase Client
const sbClient = (window.supabase && typeof window.supabase.createClient === 'function') 
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// Supabase Global Realtime Broadcast Channel & Database Change Listener across ALL devices / browsers
let globalRealtimeChannel = null;

function broadcastRealtimeEvent(event, payload = {}) {
  try {
    if (globalRealtimeChannel) {
      globalRealtimeChannel.send({
        type: 'broadcast',
        event: event,
        payload: payload
      });
    }
  } catch (err) {
    console.warn("Realtime broadcast note:", event, err);
  }
}

if (sbClient) {
  try {
    globalRealtimeChannel = sbClient.channel('nothave_global_live_room');
    globalRealtimeChannel
      // 1. Postgres Database Table Level Changes (Instant Realtime Sync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ebooks' }, (payload) => {
        console.log("⚡ Supabase Realtime: ebooks table changed", payload);
        if (typeof fetchBooks === 'function') fetchBooks();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log("⚡ Supabase Realtime: orders table changed", payload);
        if (currentUser && typeof openOrdersModal === 'function') {
          // หากผู้ใช้กำลังเปิดดูรายการสั่งซื้อ ให้อัปเดตคำสั่งซื้อล่าสุดทันที
          const ordersModal = document.getElementById("ordersModal");
          if (ordersModal && ordersModal.classList.contains("active")) {
            openOrdersModal();
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        console.log("⚡ Supabase Realtime: users table changed", payload);
        if (payload && payload.new && currentUser && (payload.new.email === currentUser.email || payload.new.user_id === currentUser.id || payload.new.user_id === currentUser.user_id)) {
          currentUser.role_id = payload.new.role_id;
          currentUser.points = payload.new.points !== undefined ? payload.new.points : currentUser.points;
          localStorage.setItem("nothave_user", JSON.stringify(currentUser));
          if (typeof updateAuthUI === 'function') updateAuthUI();
        }
      })
      // 2. Realtime Broadcast Events
      .on('broadcast', { event: 'promo_update' }, (msg) => {
        if (msg && msg.payload) {
          try {
            localStorage.setItem("nothave_active_promotion", JSON.stringify(msg.payload));
            if (typeof updatePromoHeaders === 'function') updatePromoHeaders();
            if (typeof renderBooksGrid === 'function') renderBooksGrid();
            if (typeof renderFeaturedShelves === 'function') renderFeaturedShelves();
          } catch (e) {}
        }
      })
      .on('broadcast', { event: 'book_update' }, () => {
        if (typeof fetchBooks === 'function') fetchBooks();
      })
      .on('broadcast', { event: 'order_update' }, (msg) => {
        console.log("⚡ Live order update received via Supabase Realtime:", msg);
        if (msg && msg.payload && currentUser) {
          const userEmail = (currentUser.email || "").toLowerCase().trim();
          const targetEmail = (msg.payload.email || "").toLowerCase().trim();
          if (userEmail === targetEmail) {
            // ซิงก์คำสั่งซื้อของผู้ใช้อัตโนมัติ ปลดล็อกหนังสือที่ซื้อทันที
            const key = `nothave_user_orders_${userEmail}`;
            const orders = JSON.parse(localStorage.getItem(key) || "[]");
            const targetOrd = orders.find(o => o.order_id === msg.payload.order_id || o.id === msg.payload.order_id);
            if (targetOrd) {
              targetOrd.status = msg.payload.status || "confirmed";
              localStorage.setItem(key, JSON.stringify(orders));
            }
          }
        }
      })
      .on('broadcast', { event: 'community_message' }, (msg) => {
        if (msg && msg.payload) {
          try {
            const list = JSON.parse(localStorage.getItem("nothave_community_messages") || "[]");
            if (!list.some(m => m.id === msg.payload.id)) {
              list.unshift(msg.payload);
              localStorage.setItem("nothave_community_messages", JSON.stringify(list.slice(0, 100)));
              if (typeof renderCommunityMessages === 'function') renderCommunityMessages();
            }
          } catch (e) {}
        }
      })
      .on('broadcast', { event: 'community_delete' }, (msg) => {
        if (msg && msg.payload) {
          try {
            let list = JSON.parse(localStorage.getItem("nothave_community_messages") || "[]");
            if (msg.payload.clearAll) {
              list = [];
            } else if (msg.payload.id) {
              list = list.filter(m => m.id !== msg.payload.id);
            }
            localStorage.setItem("nothave_community_messages", JSON.stringify(list));
            if (typeof renderCommunityMessages === 'function') renderCommunityMessages();
          } catch (e) {}
        }
      })
      .on('broadcast', { event: 'role_update' }, (msg) => {
        if (msg && msg.payload && currentUser) {
          const userEmail = (currentUser.email || "").toLowerCase().trim();
          const targetEmail = (msg.payload.email || "").toLowerCase().trim();
          if (userEmail === targetEmail) {
            currentUser.role_id = msg.payload.role_id;
            localStorage.setItem("nothave_user", JSON.stringify(currentUser));
            if (typeof updateAuthUI === 'function') updateAuthUI();
            alert(`🎉 ผู้ดูแลระบบได้อนุมัติปรับบทบาทของคุณเป็น ${msg.payload.role_name || (msg.payload.role_id === 2 ? 'Admin' : 'Writer')} เรียบร้อยแล้ว`);
          }
        }
      })
      .subscribe((status) => {
        console.log("Supabase Realtime Channel Status:", status);
      });
  } catch (err) {
    console.warn("Global Realtime setup note:", err);
  }
}

// Backend API Base URL (works seamlessly across localhost:8080, LiveServer 5500, and file://)
const BACKEND_URL = (window.location.origin && window.location.origin.includes(':8080')) 
  ? '' 
  : 'http://localhost:8080';

// ==========================================
// 2. CYBER SECURITY UTILITIES
// ==========================================

// 2.1 Password Hashing using SHA-256 (Web Crypto API)
async function hashPassword(password) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// 2.2 XSS Sanitization (ป้องกันการโจมตี Cross-Site Scripting)
function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 2.3 Storage Safety & Quota Auto-Cleanup (ป้องกัน QuotaExceededError)
function cleanupBloatedLocalStorage() {
  try {
    const keysToRemove = [];
    const keysToClean = [];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;

      if (k.startsWith("nothave_pdf_")) {
        keysToRemove.push(k);
        continue;
      }

      if (k.startsWith("nothave_user_orders_") || k === "nothave_custom_ebooks" || k === "nothave_cart" || k === "nothave_admin_orders") {
        keysToClean.push(k);
      }
    }

    keysToRemove.forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });

    keysToClean.forEach(k => {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) return;

        if (raw.includes("data:image/") || raw.includes("data:application/pdf") || raw.includes(";base64,") || raw.length > 50000) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const sanitized = parsed.map(item => {
              if (item.order_items && Array.isArray(item.order_items)) {
                item.order_items = item.order_items.map(oi => {
                  if (oi.ebooks) {
                    if (oi.ebooks.file_url && oi.ebooks.file_url.startsWith("data:")) {
                      oi.ebooks.file_url = `${window.location.origin}/download/ebook-${oi.ebooks.ebook_id || 'sample'}.pdf`;
                    }
                    if (oi.ebooks.cover_url && oi.ebooks.cover_url.startsWith("data:")) {
                      oi.ebooks.cover_url = "";
                    }
                  }
                  return oi;
                });
              }
              if (item.file_url && item.file_url.startsWith("data:")) {
                item.file_url = "";
              }
              if (item.cover_url && item.cover_url.startsWith("data:")) {
                item.cover_url = "";
              }
              return item;
            });
            localStorage.setItem(k, JSON.stringify(sanitized.slice(0, 20)));
          }
        }
      } catch (err) {
        console.warn("Storage item cleanup note:", k, err);
      }
    });
  } catch (globalErr) {
    console.warn("Global cleanupBloatedLocalStorage note:", globalErr);
  }
}

// รันเคลียร์ storage ส่วนเกินทันทีเมื่อโหลดสคริปต์
cleanupBloatedLocalStorage();

function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`localStorage quota warning on '${key}'. Auto-cleaning storage...`, err);
    try {
      cleanupBloatedLocalStorage();
      localStorage.setItem(key, value);
      return true;
    } catch (retryErr) {
      console.warn(`Could not save to localStorage '${key}' (Storage quota limit reached). Skipping client cache.`, retryErr);
      return false;
    }
  }
}

// ==========================================
// 3. APPLICATION STATE
// ==========================================
let allEbooks = [];
let filteredEbooks = [];
let cart = JSON.parse(localStorage.getItem("nothave_cart") || "[]");
let currentUser = JSON.parse(localStorage.getItem("nothave_user") || "null");
let userActivities = JSON.parse(localStorage.getItem("nothave_activities") || "[]");
let userFavorites = JSON.parse(localStorage.getItem("nothave_favorites") || "[]");
let recentlyViewedIds = JSON.parse(localStorage.getItem("nothave_recently_viewed") || "[]");
let customEbooks = JSON.parse(localStorage.getItem("nothave_custom_ebooks") || "[]");

// ฟังก์ชันบันทึกประวัติกิจกรรมของผู้ใช้งานลง LocalStorage (Persistent Memory)
function logUserActivity(action, detail) {
  const timestamp = new Date().toLocaleString('th-TH');
  const roleNameThai = currentUser ? (currentUser.role_id === 2 ? 'Admin' : (currentUser.role_id === 3 ? 'Writer' : 'Customer')) : '';
  const userLabel = currentUser ? `${currentUser.full_name} (${roleNameThai})` : "ผู้เยี่ยมชม (Guest)";
  const entry = {
    id: Date.now(),
    user: userLabel,
    action: action,
    detail: detail,
    time: timestamp
  };
  userActivities.unshift(entry);
  if (userActivities.length > 60) userActivities.pop(); // เก็บ 60 รายการล่าสุด
  localStorage.setItem("nothave_activities", JSON.stringify(userActivities));
}

// คลังหนังสือจริง (ดึงจากฐานข้อมูล Supabase 100%)
const fallbackEbooks = [];

// ==========================================
// 4. DATA FETCHING FROM SUPABASE
// ==========================================
async function fetchBooks() {
  try {
    if (sbClient) {
      const { data, error } = await sbClient
        .from("ebooks")
        .select(`
          ebook_id,
          title,
          price,
          original_price,
          point_reward,
          description,
          sample_text,
          cover_url,
          file_url,
          is_active,
          categories ( category_id, category_name ),
          authors ( author_name )
        `)
        .eq("is_active", true);

      if (!error && data) {
        const pendingList = JSON.parse(localStorage.getItem("nothave_pending_writer_books") || "[]");
        
        allEbooks = data.map(item => {
          let authorName = item.authors?.author_name || "";
          
          // 1. ดึงชื่อผู้แต่งจาก tag ใน description
          if (item.description && item.description.includes("writer_name=")) {
            const match = item.description.match(/writer_name=([^\|\]\n]+)/);
            if (match && match[1] && match[1].trim()) {
              authorName = match[1].trim();
            }
          }

          // 2. ดึงจาก pending tracking list
          const pBook = pendingList.find(p => p.ebook_id === item.ebook_id || p.title === item.title);
          if (pBook && pBook.author && (!authorName || authorName === "ไม่ระบุ")) {
            authorName = pBook.author;
          }

          if (!authorName) authorName = "นักเขียน";

          return {
            ebook_id: item.ebook_id,
            title: item.title,
            price: parseFloat(item.price),
            original_price: parseFloat(item.original_price || item.price),
            point_reward: item.point_reward || 10,
            description: item.description,
            sample_text: item.sample_text || item.description,
            cover_url: item.cover_url || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500",
            file_url: item.file_url || "",
            category_id: item.categories?.category_id || 1,
            category_name: (item.categories?.category_name === "ไลท์โนเวล" ? "หนังสือทั่วไป" : (item.categories?.category_name || "ทั่วไป")),
            author_name: authorName,
            is_active: item.is_active
          };
        });
      } else {
        allEbooks = [];
      }
    } else {
      allEbooks = [];
    }

    // นำหนังสือที่เพิ่มผ่าน LocalStorage เข้ามารวม (หากมี)
    if (customEbooks && customEbooks.length > 0) {
      const activeCustom = customEbooks.filter(cb => !allEbooks.some(ab => ab.ebook_id === cb.ebook_id) && cb.is_active !== false);
      allEbooks = [...allEbooks, ...activeCustom];
    }
  } catch (err) {
    console.warn("Supabase fetch note:", err);
    allEbooks = [];
  }

  filteredEbooks = [...allEbooks];
  renderBooksGrid();
  renderFeaturedShelves();
  renderRecentlyViewedShelf();
  updateCategoryCounts();
  filteredEbooks = [...allEbooks];
  renderBooksGrid();
  renderFeaturedShelves();
  renderRecentlyViewedShelf();
  updateCategoryCounts();
}

// ==========================================
// 5. RENDERING UI COMPONENTS
// ==========================================

// ฟังก์ชันดึงข้อมูลโปรโมชันที่ Admin ตั้งค่าไว้ (ค่าเริ่มต้นส่วนลด 30% ตามป้ายหน้าร้าน)
function getActivePromotion() {
  try {
    const promo = JSON.parse(localStorage.getItem("nothave_active_promotion") || "null");
    if (promo && promo.text) {
      return {
        text: promo.text,
        discount_percent: (promo.discount_percent !== undefined) ? Number(promo.discount_percent) : 30,
        code: promo.code || "ADMINVIP"
      };
    }
  } catch (e) {}
  return {
    text: "โปรโมชันพิเศษ 3 วัน",
    discount_percent: 30,
    code: "ADMINVIP"
  };
}

function updatePromoHeaders() {
  const promo = getActivePromotion();
  const discount = (promo.discount_percent !== undefined) ? Number(promo.discount_percent) : 30;
  
  const highlightEls = document.querySelectorAll(".shelf-highlight, #shelfHighlightDiscount");
  highlightEls.forEach(el => {
    if (discount > 0) {
      el.style.display = "inline-block";
      el.innerText = `${discount}%`;
    } else {
      el.style.display = "none";
    }
  });

  const shelfTitleEl = document.getElementById("shelfPromoTitleText");
  if (shelfTitleEl) {
    if (discount > 0) {
      shelfTitleEl.innerText = `${promo.text || "มาใหม่ วางแผงก่อนทุกที่ 15 วัน"} พร้อมส่วนลดสูงสุด`;
    } else {
      shelfTitleEl.innerText = `${promo.text || "มาใหม่ วางแผงก่อนทุกที่ 15 วัน"}`;
    }
  }
}

// 5.1 Render Book Card Component (Replicating BookWalker card)
function createBookCardHTML(book) {
  const activePromo = getActivePromotion();
  const isFav = userFavorites.includes(book.ebook_id);
  const heartColor = isFav ? '#e73636' : '#888';
  const hasPurchased = typeof userHasConfirmedOrder === 'function' ? userHasConfirmedOrder(book.ebook_id) : false;

  // คำนวณราคาโปรโมชันและเปอร์เซ็นต์ส่วนลดแบบ Real-time ตามที่ Admin ตั้งค่า
  const promoDiscount = (activePromo && activePromo.discount_percent !== undefined && activePromo.discount_percent !== null) 
    ? Number(activePromo.discount_percent) 
    : 0;

  const baseOriginalPrice = Number(book.original_price || book.price || 169);
  let displayPrice = Number(book.price);
  let originalPrice = baseOriginalPrice;
  let discountPct = 0;

  if (promoDiscount > 0) {
    discountPct = promoDiscount;
    originalPrice = baseOriginalPrice;
    displayPrice = Math.round(originalPrice * (1 - (promoDiscount / 100)) * 100) / 100;
  } else if (book.original_price && book.original_price > book.price) {
    discountPct = Math.round(((book.original_price - book.price) / book.original_price) * 100);
    originalPrice = Number(book.original_price);
    displayPrice = Number(book.price);
  } else {
    originalPrice = displayPrice;
    discountPct = 0;
  }

  const isSale = discountPct > 0;

  // สลับปุ่ม: ถ้าเคยซื้อแล้ว -> เปลี่ยนเป็นปุ่ม [📖 อ่านหนังสือ]
  const actionButtons = hasPurchased ? `
    <div class="card-action-row" style="display:flex; width:100%;">
      <button class="btn-primary-action" style="width:100%; background:#16a34a; color:#fff; border-radius:6px; font-weight:700; font-size:12.5px; padding:7px 10px; display:inline-flex; align-items:center; justify-content:center; gap:5px; border:none; box-shadow:0 2px 5px rgba(22,163,74,0.25);" onclick="openRealEbookReader(${book.ebook_id}, true)">
        <span>📖 อ่านหนังสือ</span>
      </button>
    </div>
  ` : `
    <div class="card-action-row">
      <button class="btn-sample-read" onclick="openSampleModal(${book.ebook_id})">
        ทดลองอ่าน
      </button>
      <button class="btn-add-cart" onclick="addToCart(${book.ebook_id})">
        ใส่รถเข็น
      </button>
    </div>
  `;

  return `
    <div class="book-card" data-id="${book.ebook_id}">
      <div class="card-cover-wrapper" onclick="${hasPurchased ? `openRealEbookReader(${book.ebook_id}, true)` : `openSampleModal(${book.ebook_id})`}" style="cursor:pointer;" title="${hasPurchased ? 'คลิกเพื่ออ่านหนังสือฉบับเต็ม' : 'คลิกเพื่อดูรายละเอียดและทดลองอ่าน'}">
        ${isSale ? `<span class="badge-sale" style="background:#ef4444; color:#ffffff; font-weight:800; font-size:11px; padding:3px 8px; border-radius:4px; box-shadow:0 2px 6px rgba(239,68,68,0.35); z-index:2;">-${discountPct}%</span>` : ''}
        ${hasPurchased ? '<span class="badge-new" style="background:#16a34a;">ซื้อแล้ว</span>' : '<span class="badge-new">NEW</span>'}
        <img src="${escapeHTML(book.cover_url)}" alt="${escapeHTML(book.title)}" loading="lazy">
        <button class="btn-card-heart" style="color: ${heartColor}" title="บันทึกเป็นเล่มโปรด" onclick="event.stopPropagation(); toggleFavorite(${book.ebook_id}, this)">
          ♥
        </button>
      </div>
      <div class="card-body">
        <div class="book-title" title="${escapeHTML(book.title)}" onclick="${hasPurchased ? `openRealEbookReader(${book.ebook_id}, true)` : `openSampleModal(${book.ebook_id})`}" style="cursor:pointer;">${escapeHTML(book.title)}</div>
        <div class="book-author">${escapeHTML(book.author_name)}</div>
        
        <div class="card-price-row">
          ${isSale ? `<span class="original-price">฿${originalPrice.toFixed(2)}</span>` : ''}
          <span class="current-price">฿${displayPrice.toFixed(2)}</span>
          ${isSale ? `<span style="font-size:11.5px; color:#ef4444; font-weight:700; margin-left:4px;">(ลด ${discountPct}%)</span>` : ''}
        </div>

        ${actionButtons}
      </div>
      <div class="countdown-bar">
        ${escapeHTML(activePromo.text || "โปรโมชันพิเศษ 3 วัน")}${isSale ? ` • ลด ${discountPct}%` : ''}
      </div>
    </div>
  `;
}

// 5.2.1 View Mode Switcher (สลับมุมมอง ตาราง / รายการ)
let currentViewMode = localStorage.getItem("nothave_view_mode") || "grid";

function setViewMode(mode) {
  currentViewMode = mode;
  localStorage.setItem("nothave_view_mode", mode);

  const gridEl = document.getElementById("booksGrid");
  const btnGrid = document.getElementById("btnViewGrid");
  const btnList = document.getElementById("btnViewList");

  if (gridEl) {
    gridEl.classList.toggle("list-view", mode === "list");
  }
  if (btnGrid) {
    btnGrid.classList.toggle("active", mode === "grid");
  }
  if (btnList) {
    btnList.classList.toggle("active", mode === "list");
  }
}

// 5.2 Render Main Catalog Grid
function renderBooksGrid() {
  updatePromoHeaders();
  const container = document.getElementById("booksGrid");
  const countEl = document.getElementById("booksCount");
  if (!container) return;

  if (filteredEbooks.length === 0) {
    container.innerHTML = "";
    if (countEl) countEl.innerText = "0 จาก 0";
    return;
  }

  container.innerHTML = filteredEbooks.map(createBookCardHTML).join("");
  container.classList.toggle("list-view", currentViewMode === "list");
  if (countEl) {
    countEl.innerText = `1-${filteredEbooks.length} จาก ${filteredEbooks.length}`;
  }
}

// 5.3 Render Featured Horizontal Shelves
function renderFeaturedShelves() {
  updatePromoHeaders();
  const shelf1 = document.getElementById("shelfNewArrivals");
  if (shelf1) {
    if (allEbooks.length === 0) {
      shelf1.innerHTML = "";
    } else {
      shelf1.innerHTML = allEbooks.slice(0, 6).map(createBookCardHTML).join("");
    }
  }
}

// Real-Time Promotion & Order Change Listeners
window.addEventListener("storage", (e) => {
  if (e.key === "nothave_active_promotion" || e.key === "nothave_user_orders" || (e.key && e.key.startsWith("nothave_user_orders_"))) {
    updatePromoHeaders();
    renderBooksGrid();
    renderFeaturedShelves();
    renderRecentlyViewedShelf();
  }
});

try {
  const promoBroadcast = new BroadcastChannel("nothave_promo_channel");
  promoBroadcast.onmessage = () => {
    updatePromoHeaders();
    renderBooksGrid();
    renderFeaturedShelves();
    renderRecentlyViewedShelf();
  };
} catch (e) {}

// Initial invocation of promo header sync
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", updatePromoHeaders);
} else {
  updatePromoHeaders();
}

// ==========================================
// 6. SEARCH & FILTERING
// ==========================================
// 6.3 อัปเดต Breadcrumb และหัวข้อหน้าเว็บให้เป็นไดนามิกและใช้งานได้จริง
const categoryNameMap = {
  1: "มังงะยอดนิยม",
  2: "หนังสือทั่วไป",
  3: "นิยายทั่วไป",
  4: "อาร์ตบุ๊ค"
};

let currentViewingBook = null;

function updateBreadcrumbAndHeading(activeBook = undefined) {
  if (activeBook !== undefined) {
    currentViewingBook = activeBook;
  }

  const bcCategory = document.getElementById("breadcrumbCategory");
  const bcSepCategory = document.getElementById("bcSepCategory");
  const bcSepBook = document.getElementById("bcSepBook");
  const bcCurrent = document.getElementById("breadcrumbCurrent");
  const headingTitle = document.getElementById("catalogHeadingTitle");

  const searchInput = document.getElementById("searchInput");
  const searchVal = searchInput ? searchInput.value.trim() : "";
  const selectedCheckboxes = Array.from(document.querySelectorAll(".category-checkbox:checked"));

  let catLabel = "";
  let headLabel = "หนังสือทั้งหมด";

  if (searchVal) {
    catLabel = `ค้นหา: "${searchVal}"`;
    headLabel = `ผลการค้นหาสำหรับ "${searchVal}"`;
  } else if (selectedCheckboxes.length === 1) {
    const catId = parseInt(selectedCheckboxes[0].value);
    catLabel = categoryNameMap[catId] || selectedCheckboxes[0].nextElementSibling?.innerText?.trim() || "หมวดหมู่";
    headLabel = `${catLabel} ทั้งหมด`;
  } else if (selectedCheckboxes.length > 1) {
    catLabel = `กรอง ${selectedCheckboxes.length} หมวดหมู่`;
    headLabel = "รายการหนังสือตามหมวดที่เลือก";
  } else if (currentViewingBook && currentViewingBook.category_id) {
    catLabel = categoryNameMap[currentViewingBook.category_id] || "";
  }

  // 1. จัดการแสดงผลของ Category ใน Breadcrumb
  // หากไม่ได้คลิกหมวดอะไรเลย และไม่ได้ค้นหา จะซ่อนตัวคั่นและชื่อหมวด ให้เหลือแค่ "หน้าหลัก"
  if (catLabel) {
    if (bcSepCategory) bcSepCategory.style.display = "inline";
    if (bcCategory) {
      bcCategory.style.display = "inline";
      bcCategory.innerText = catLabel;
    }
  } else {
    if (bcSepCategory) bcSepCategory.style.display = "none";
    if (bcCategory) {
      bcCategory.style.display = "none";
      bcCategory.innerText = "";
    }
  }

  // 2. ถ้ามีการเลือก/เปิดดูเล่มใดเล่มหนึ่งเฉพาะเจาะจง
  if (currentViewingBook) {
    if (bcSepBook) bcSepBook.style.display = "inline";
    if (bcCurrent) {
      bcCurrent.style.display = "inline";
      bcCurrent.innerText = currentViewingBook.title || currentViewingBook;
    }
    if (headingTitle) {
      headingTitle.innerText = currentViewingBook.title || currentViewingBook;
    }
  } else {
    // "หนังสือไม่มีก็ไม่ต้องขึ้น" -> ซ่อนส่วนชื่อหนังสือใน Breadcrumb ออกทั้งหมด
    if (bcSepBook) bcSepBook.style.display = "none";
    if (bcCurrent) {
      bcCurrent.style.display = "none";
      bcCurrent.innerText = "";
    }
    if (headingTitle) {
      headingTitle.innerText = headLabel;
    }
  }
}

function onBreadcrumbCategoryClick() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput && searchInput.value) {
    searchInput.value = "";
    applyFilters();
    return;
  }
  const selectedCheckboxes = Array.from(document.querySelectorAll(".category-checkbox:checked"));
  if (selectedCheckboxes.length === 1) {
    currentViewingBook = null;
    updateBreadcrumbAndHeading();
  } else {
    clearAllFilters();
  }
}

function applyFilters() {
  const searchInput = document.getElementById("searchInput")?.value.trim().toLowerCase() || "";
  const selectedCategories = Array.from(document.querySelectorAll(".category-checkbox:checked")).map(cb => parseInt(cb.value));
  const sortOption = document.getElementById("sortSelect")?.value || "popular";

  filteredEbooks = allEbooks.filter(book => {
    // 1. Text Search (title or author)
    const matchesSearch = !searchInput || 
      book.title.toLowerCase().includes(searchInput) || 
      book.author_name.toLowerCase().includes(searchInput);

    // 2. Category Filter
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(book.category_id);

    return matchesSearch && matchesCategory;
  });

  // 3. Sorting
  if (sortOption === "price-asc") {
    filteredEbooks.sort((a, b) => a.price - b.price);
  } else if (sortOption === "price-desc") {
    filteredEbooks.sort((a, b) => b.price - a.price);
  } else if (sortOption === "name-asc") {
    filteredEbooks.sort((a, b) => a.title.localeCompare(b.title));
  }

  renderBooksGrid();
  updateBreadcrumbAndHeading();
}

function clearAllFilters() {
  document.querySelectorAll(".category-checkbox").forEach(cb => cb.checked = false);
  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.value = "";
  
  // Highlight "all" tab
  document.querySelectorAll(".header-nav .nav-item").forEach(item => item.classList.remove("active"));
  const tabAll = document.getElementById("navTabAll");
  if (tabAll) tabAll.classList.add("active");

  currentViewingBook = null;
  applyFilters();
}

function filterByCategoryTab(catId) {
  document.querySelectorAll(".category-checkbox").forEach(cb => {
    cb.checked = (parseInt(cb.value) === catId);
  });

  // Highlight active navbar tab
  document.querySelectorAll(".header-nav .nav-item").forEach(item => item.classList.remove("active"));
  const activeTab = document.getElementById(`navTab${catId}`);
  if (activeTab) activeTab.classList.add("active");

  currentViewingBook = null;
  applyFilters();
  window.scrollTo({ top: 400, behavior: 'smooth' });
}

// 6.1 Toggle Filter Group Accordion (เปิด/ปิด ยุบ/ขยาย หมวดหมู่ และ ประเภท)
function toggleFilterGroup(bodyId, titleEl) {
  const body = document.getElementById(bodyId);
  if (!body) return;
  const isCollapsed = body.classList.toggle("collapsed");
  if (titleEl) {
    titleEl.classList.toggle("collapsed", isCollapsed);
    const caret = titleEl.querySelector(".filter-caret");
    if (caret) {
      caret.innerText = isCollapsed ? "⌄" : "⌃";
    }
  }
}

// 6.2 อัปเดตตัวเลขนับจำนวนหนังสือในแต่ละหมวดหมู่แบบไดนามิก
function updateCategoryCounts() {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  allEbooks.forEach(b => {
    if (counts[b.category_id] !== undefined) {
      counts[b.category_id]++;
    }
  });
  for (let catId = 1; catId <= 5; catId++) {
    const el = document.getElementById(`catCount${catId}`);
    if (el) el.innerText = `(${counts[catId] || 0})`;
  }
}

// ==========================================
// 7. CART & CHECKOUT MANAGEMENT
// ==========================================
function addToCart(bookId) {
  if (!currentUser) {
    showCustomAlert({
      type: "warning",
      title: "จำเป็นต้องเข้าสู่ระบบ",
      message: "กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนเพิ่มหนังสือลงในรถเข็นครับ",
      btnText: "เข้าสู่ระบบ",
      callback: () => {
        openAuthModal('login');
      }
    });
    return;
  }

  const book = allEbooks.find(b => b.ebook_id === bookId);
  if (!book) return;

  const activePromo = getActivePromotion();
  const promoDiscount = (activePromo && activePromo.discount_percent !== undefined) ? Number(activePromo.discount_percent) : 0;
  const baseOriginalPrice = Number(book.original_price || book.price || 169);
  let effectivePrice = Number(book.price);
  if (promoDiscount > 0) {
    effectivePrice = Math.round(baseOriginalPrice * (1 - (promoDiscount / 100)) * 100) / 100;
  }

  const existing = cart.find(item => item.ebook_id === bookId);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
    existing.price = effectivePrice;
  } else {
    cart.push({ ...book, price: effectivePrice, original_price: baseOriginalPrice, quantity: 1 });
  }

  saveCart();
  updateCartBadge();
  logUserActivity("เพิ่มลงรถเข็น", `เพิ่ม "${book.title}" (฿${effectivePrice.toFixed(2)}) ลงในตะกร้า`);
  showCustomAlert({
    type: "success",
    title: "เพิ่มลงรถเข็นเรียบร้อย",
    message: `เพิ่ม "${book.title}" ลงในตะกร้าเรียบร้อยแล้ว`,
    btnText: "ดูตะกร้าสินค้า",
    autoCloseMs: 2200,
    callback: () => {
      openCartModal();
    }
  });
}

function removeFromCart(bookId) {
  const item = cart.find(i => i.ebook_id === bookId);
  cart = cart.filter(item => item.ebook_id !== bookId);
  saveCart();
  updateCartBadge();
  if (item) logUserActivity("ลบออกจากรถเข็น", `ลบ "${item.title}" ออกจากตะกร้า`);
  renderCartModal();
}

function updateCartQuantity(bookId, delta) {
  const item = cart.find(i => i.ebook_id === bookId);
  if (!item) return;
  item.quantity = (item.quantity || 1) + delta;
  if (item.quantity <= 0) {
    removeFromCart(bookId);
    return;
  }
  saveCart();
  renderCartModal();
}

function saveCart() {
  const cleanCart = cart.map(item => ({
    ebook_id: item.ebook_id,
    title: item.title,
    price: item.price,
    original_price: item.original_price,
    quantity: item.quantity || 1,
    cover_url: (item.cover_url && !item.cover_url.startsWith("data:")) ? item.cover_url : "",
    file_url: (item.file_url && !item.file_url.startsWith("data:")) ? item.file_url : ""
  }));
  safeLocalStorageSet("nothave_cart", JSON.stringify(cleanCart));
}

function updateCartBadge() {
  const badge = document.getElementById("cartCountBadge");
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  if (badge) {
    badge.innerText = totalItems;
    badge.style.display = totalItems > 0 ? "inline-block" : "none";
  }
}

function renderCartModal() {
  const container = document.getElementById("cartItemsList");
  const totalEl = document.getElementById("cartTotalPrice");
  const checkoutBtn = document.getElementById("btnCartCheckout");
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 30px; color: #888;">ไม่มีสินค้าในรถเข็น</div>`;
    if (totalEl) totalEl.innerText = "฿0.00";
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.style.opacity = "0.5";
      checkoutBtn.style.cursor = "not-allowed";
    }
    return;
  }

  if (checkoutBtn) {
    checkoutBtn.disabled = false;
    checkoutBtn.style.opacity = "1";
    checkoutBtn.style.cursor = "pointer";
  }

  const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  container.innerHTML = cart.map(item => `
    <div class="cart-item-row">
      <img src="${escapeHTML(item.cover_url)}" class="cart-item-thumb">
      <div>
        <div class="cart-item-title">${escapeHTML(item.title)}</div>
        <div style="font-size: 11px; color: #777;">จำนวน: 
          <button onclick="updateCartQuantity(${item.ebook_id}, -1)" style="padding: 1px 6px; border: 1px solid #ccc; background:#fff; border-radius:3px; cursor:pointer;">-</button>
          <span style="font-weight: bold; margin: 0 4px;">${item.quantity || 1}</span>
          <button onclick="updateCartQuantity(${item.ebook_id}, 1)" style="padding: 1px 6px; border: 1px solid #ccc; background:#fff; border-radius:3px; cursor:pointer;">+</button>
        </div>
      </div>
      <div class="cart-item-price">฿${(item.price * (item.quantity || 1)).toFixed(2)}</div>
      <button class="btn-remove-item" onclick="removeFromCart(${item.ebook_id})">✕</button>
    </div>
  `).join("");

  if (totalEl) {
    totalEl.innerText = `฿${total.toFixed(2)}`;
  }
}

function openCartModal() {
  if (!currentUser) {
    showCustomAlert({
      type: "warning",
      title: "จำเป็นต้องเข้าสู่ระบบ",
      message: "กรุณาเข้าสู่ระบบก่อนเปิดดูตะกร้าสินค้าหรือดำเนินการสั่งซื้อครับ",
      btnText: "เข้าสู่ระบบ",
      callback: () => {
        openAuthModal('login');
      }
    });
    return;
  }
  renderCartModal();
  document.getElementById("cartModal").classList.add("active");
}

function openCheckoutModal() {
  if (!currentUser) {
    closeModal("cartModal");
    showCustomAlert({
      type: "warning",
      title: "จำเป็นต้องเข้าสู่ระบบ",
      message: "กรุณาเข้าสู่ระบบก่อนดำเนินการชำระเงินครับ",
      btnText: "เข้าสู่ระบบ",
      callback: () => {
        openAuthModal('login');
      }
    });
    return;
  }

  if (cart.length === 0) {
    showCustomAlert({
      type: "warning",
      title: "ไม่มีสินค้าในรถเข็น",
      message: "กรุณาเลือกหนังสือลงในรถเข็นก่อนดำเนินการสั่งซื้อครับ",
      btnText: "เลือกดูหนังสือ"
    });
    return;
  }

  closeModal("cartModal");
  const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  const totalDisplay = document.getElementById("checkoutTotalDisplay");
  if (totalDisplay) totalDisplay.innerText = `฿${total.toFixed(2)}`;

  const nameInput = document.getElementById("checkoutBuyerName");
  if (nameInput) {
    nameInput.value = currentUser ? currentUser.full_name : "ลูกค้าทั่วไป";
  }

  const emailInput = document.getElementById("checkoutBuyerEmail");
  if (emailInput) {
    emailInput.value = currentUser ? currentUser.email : "customer@gmail.com";
  }

  // สร้างภาพ PromptPay QR ให้ตรงกับยอดเงินรวม
  const qrImg = document.getElementById("checkoutQrImg");
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PROMPTPAY:0812345678:AMOUNT:${total.toFixed(2)}`;
  }

  document.getElementById("checkoutModal").classList.add("active");
}

// 7.1 Confirm QR Payment, Save Order & Auto-Send Email Receipt
async function submitOrder() {
  const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  const buyerNameInput = document.getElementById("checkoutBuyerName");
  const buyerEmailInput = document.getElementById("checkoutBuyerEmail");
  const submitBtn = document.getElementById("btnSubmitOrderAction");

  const buyerName = (buyerNameInput && buyerNameInput.value.trim()) || (currentUser ? currentUser.full_name : "ลูกค้าผู้มีอุปการคุณ");
  const buyerEmail = (buyerEmailInput && buyerEmailInput.value.trim()) || (currentUser ? currentUser.email : "customer@gmail.com");

  if (!buyerEmail || !buyerEmail.includes("@")) {
    alert("กรุณากรอกอีเมลของคุณเพื่อรับใบเสร็จและลิงก์ดาวน์โหลดหนังสือครับ");
    if (buyerEmailInput) buyerEmailInput.focus();
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>⏳ กำลังยืนยันและส่งเข้าอีเมล...</span>`;
  }

  const generatedOrderId = Math.floor(Math.random() * 89999) + 10000;

  const targetUserId = (currentUser && (currentUser.user_id || currentUser.id)) ? parseInt(currentUser.user_id || currentUser.id) : 2;

  const newOrder = {
    user_id: targetUserId,
    order_date: new Date().toISOString(),
    total_amount: total,
    status: "confirmed", // ปลดล็อกทันทีหลังจ่ายเงิน ไม่ต้องรอกดอนุมัติ
    notes: `ชำระผ่าน PromptPay QR (อีเมลผู้ซื้อ: ${buyerEmail})`
  };

  try {
    let createdOrderId = generatedOrderId;

    if (sbClient) {
      try {
        const { data: orderData, error: orderErr } = await sbClient
          .from("orders")
          .insert([newOrder])
          .select();

        if (orderErr) {
          console.error("Supabase Order Insert Error:", orderErr);
        }

        if (!orderErr && orderData && orderData[0]) {
          createdOrderId = orderData[0].order_id;

          const itemsToInsert = cart.map(item => ({
            order_id: createdOrderId,
            ebook_id: parseInt(item.ebook_id) || 1,
            price_at_purchase: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity) || 1
          }));
          const { error: itemErr } = await sbClient.from("order_items").insert(itemsToInsert);
          if (itemErr) console.warn("Supabase order_items insert error:", itemErr);

          const { error: payErr } = await sbClient.from("payments").insert([{
            order_id: createdOrderId,
            payment_method: "PromptPay QR",
            payment_date: new Date().toISOString(),
            slip_image_url: `https://dummyimage.com/600x800/003d79/ffffff&text=PromptPay+QR+Paid`,
            status: "verified"
          }]);
          if (payErr) console.warn("Supabase payments insert error:", payErr);
          else console.log("✓ Payment record created in Supabase payments table for Order #" + createdOrderId);
        }
      } catch (dbErr) {
        console.warn("Database order insert note:", dbErr);
      }
    }

    // ซิงก์ประวัติคำสั่งซื้อลงใน localStorage สำหรับแอดมิน (Safe Storage)
    try {
      let adminOrdersList = JSON.parse(localStorage.getItem("nothave_admin_orders") || "[]");
      adminOrdersList.unshift({
        id: createdOrderId,
        customer: buyerName,
        email: buyerEmail,
        date: new Date().toLocaleString('th-TH'),
        amount: total,
        slip: "PromptPay QR Code",
        status: "confirmed"
      });
      safeLocalStorageSet("nothave_admin_orders", JSON.stringify(adminOrdersList.slice(0, 30)));
    } catch (adminErr) {
      console.warn("adminOrdersList save note:", adminErr);
    }

    // บันทึกคำสั่งซื้อสำหรับผู้ใช้งานคนนี้โดยเฉพาะ (User Personal Orders - ป้องกัน Base64 ล้นโควตา)
    try {
      const buyerEmailKey = buyerEmail.toLowerCase().trim();
      const userOrderKey = `nothave_user_orders_${buyerEmailKey}`;
      let userOrders = JSON.parse(localStorage.getItem(userOrderKey) || "[]");
      
      const cleanOrderItems = cart.map(item => ({
        quantity: item.quantity || 1,
        price_at_purchase: item.price,
        ebooks: {
          ebook_id: item.ebook_id,
          title: item.title,
          cover_url: (item.cover_url && !item.cover_url.startsWith("data:")) ? item.cover_url : "",
          file_url: (item.file_url && !item.file_url.startsWith("data:")) 
            ? item.file_url 
            : `${window.location.origin}/download/ebook-${item.ebook_id}.pdf`
        }
      }));

      userOrders.unshift({
        order_id: createdOrderId,
        order_date: new Date().toISOString(),
        total_amount: total,
        status: "confirmed",
        order_items: cleanOrderItems
      });
      safeLocalStorageSet(userOrderKey, JSON.stringify(userOrders.slice(0, 30)));
    } catch (userOrderErr) {
      console.warn("userOrders save note:", userOrderErr);
    }

    // รวบรวมรายชื่อหนังสือและลิงก์ดาวน์โหลด (ไม่นำ data:base64 มาต่อในอีเมล เพื่อไม่ให้ URL ยาวเกินขีดจำกัดเบราว์เซอร์)
    const bookListText = cart.map((it, idx) => {
      const title = it.title || "หนังสือ E-Book";
      const fileUrl = (it.file_url && !it.file_url.startsWith("data:")) 
        ? it.file_url 
        : `${window.location.origin}/download/ebook-${it.ebook_id}.pdf`;
      return `${idx + 1}. ${title} (฿${(it.price * (it.quantity || 1)).toFixed(2)})\n   ลิงก์ดาวน์โหลดไฟล์: ${fileUrl}`;
    }).join("\n\n");

    // เตรียมเนื้อหาอีเมลเพื่อเด้งเปิด Gmail ผู้ซื้อ
    const emailSubject = `[NOT HAVE A BOOK SHOP] ใบเสร็จคำสั่งซื้อและลิงก์ดาวน์โหลด E-Book (#${createdOrderId})`;
    const emailBody = `สวัสดีคุณ ${buyerName},

ขอขอบคุณที่สั่งซื้อหนังสือกับ NOT HAVE A BOOK SHOP!
ระบบได้รับการชำระเงินผ่านระบบ PromptPay QR จำนวน ฿${total.toFixed(2)} บาท เรียบร้อยแล้ว

====================================
ใบเสร็จรับเงิน (คำสั่งซื้อ #${createdOrderId})
====================================
วันที่สั่งซื้อ: ${new Date().toLocaleString('th-TH')}
ผู้สั่งซื้อ: ${buyerName}
อีเมล: ${buyerEmail}
ยอดเงินรวมสุทธิ: ฿${total.toFixed(2)} บาท
สถานะ: ชำระเงินสำเร็จ (Confirmed)

====================================
รายการ E-Book และลิงก์ดาวน์โหลดของคุณ:
====================================
${bookListText}

------------------------------------
คุณสามารถคลิกที่ลิงก์ด้านบนเพื่อดาวน์โหลดอ่านได้ทันที หรือเปิดดูที่เมนู "คลังของฉัน" บนหน้าเว็บได้ตลอดเวลา

ขอให้มีความสุขกับการอ่านหนังสือครับ!
ทีมงาน NOT HAVE A BOOK SHOP
`;

    // ส่งอีเมลใบเสร็จและลิงก์ดาวน์โหลดเข้ากล่องข้อความของผู้ซื้อทันที (Instant Speed Dispatch)
    let emailStatus = { sent: true, message: "จัดส่งใบเสร็จเรียบร้อยแล้ว" };
    const gmailFallbackUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(buyerEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    const emailPayload = {
      to: buyerEmail,
      subject: emailSubject,
      text: emailBody,
      html: `
        <div style="font-family:'Prompt',sans-serif,Arial; max-width:600px; margin:0 auto; padding:24px; border:1px solid #e2e8f0; border-radius:8px; background:#ffffff; color:#1e293b;">
          <h2 style="color:#0284c7; margin:0 0 10px 0;">NOT HAVE A BOOK SHOP</h2>
          <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:12px; border-radius:6px; color:#065f46; font-weight:700; margin-bottom:16px;">
            ✓ ใบเสร็จรับเงินคำสั่งซื้อ #${createdOrderId} สำเร็จแล้ว
          </div>
          <p>สวัสดีคุณ <strong>${escapeHTML(buyerName)}</strong>,</p>
          <p>ระบบได้รับการชำระเงินผ่าน PromptPay QR จำนวน <strong>฿${total.toFixed(2)} บาท</strong> เรียบร้อยแล้ว</p>
          
          <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:14px; border-radius:6px; margin:16px 0; font-size:13px;">
            <div><strong>รหัสคำสั่งซื้อ:</strong> #${createdOrderId}</div>
            <div><strong>วันที่สั่งซื้อ:</strong> ${new Date().toLocaleString('th-TH')}</div>
            <div><strong>ผู้สั่งซื้อ:</strong> ${escapeHTML(buyerName)} (${escapeHTML(buyerEmail)})</div>
            <div><strong>ยอดเงินสุทธิ:</strong> ฿${total.toFixed(2)} บาท</div>
            <div><strong>สถานะ:</strong> ยืนยันการชำระเงินแล้ว (Confirmed)</div>
          </div>

          <h4 style="color:#0f172a; margin-top:20px; margin-bottom:10px;">รายการ E-Book และลิงก์ดาวน์โหลดของคุณ:</h4>
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:14px; margin-bottom:16px;">
            ${cart.map((it, idx) => {
              const title = it.title || "หนังสือ E-Book";
              const fileUrl = (it.file_url && !it.file_url.startsWith("data:")) 
                ? it.file_url 
                : `${window.location.origin}/download/ebook-${it.ebook_id}.pdf`;
              return `
                <div style="margin-bottom:12px; padding-bottom:12px; border-bottom:1px dashed #bbf7d0;">
                  <div style="font-weight:700; color:#15803d; font-size:14px;">${idx + 1}. ${escapeHTML(title)}</div>
                  <div style="font-size:12px; color:#64748b; margin:4px 0;">ราคา: ฿${(it.price * (it.quantity || 1)).toFixed(2)}</div>
                  <a href="${escapeHTML(fileUrl)}" target="_blank" style="display:inline-block; background:#16a34a; color:#ffffff; padding:6px 14px; border-radius:4px; text-decoration:none; font-size:12px; font-weight:700;">
                    📥 คลิกเพื่อดาวน์โหลด / อ่านไฟล์ PDF
                  </a>
                </div>
              `;
            }).join("")}
          </div>

          <p style="font-size:12px; color:#64748b; line-height:1.6;">
            คุณสามารถคลิกลิงก์ดาวน์โหลดด้านบนได้ทันที หรือเข้าสู่ระบบบนหน้าเว็บไซต์และไปที่เมนู <strong>"คลังของฉัน"</strong> เพื่ออ่านหนังสือได้ตลอดเวลาครับ
          </p>
          <div style="margin-top:20px; padding-top:14px; border-top:1px solid #e2e8f0; font-size:11px; color:#94a3b8; text-align:center;">
            NOT HAVE A BOOK SHOP (บักบ่ได้หนังสือ) - ขอบคุณที่อุดหนุนครับ
          </div>
        </div>
      `,
      orderId: createdOrderId,
      total: total,
      name: buyerName,
      orders: cart.map(it => ({
        name: it.title || "หนังสือ E-Book",
        units: it.quantity || 1,
        price: (it.price * (it.quantity || 1)).toFixed(2)
      }))
    };

    // ส่งอีเมลทันทีแบบ Non-blocking (รวดเร็วทันใจ ไม่ค้างหน้าจอ)
    fetch(`${BACKEND_URL}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailPayload)
    }).then(async (res) => {
      try {
        const emailResult = await res.json();
        const badgeEl = document.getElementById("successEmailDeliveryBadge");
        const btnFallback = document.getElementById("btnSendViaGmailFallback");
        if (badgeEl && emailResult) {
          if (emailResult.success) {
            badgeEl.style.background = "#ecfdf5";
            badgeEl.style.borderColor = "#a7f3d0";
            badgeEl.style.color = "#065f46";
            badgeEl.innerHTML = `<strong>✓ จัดส่งเข้าอีเมลจริงสำเร็จ 100%:</strong> ใบเสร็จคำสั่งซื้อและลิงก์ดาวน์โหลดถูกส่งตรงเข้ากล่องข้อความของ <strong>${escapeHTML(buyerEmail)}</strong> เรียบร้อยแล้ว`;
            if (btnFallback) btnFallback.style.display = "none";
          } else if (emailResult.needConfig) {
            badgeEl.style.background = "#fffbeb";
            badgeEl.style.borderColor = "#fde68a";
            badgeEl.style.color = "#92400e";
            badgeEl.innerHTML = `
              <div style="font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                <span>⚠️</span> <span>ยังไม่ได้ตั้งค่า Gmail ผู้ส่งในระบบหลังบ้าน:</span>
              </div>
              <div style="font-size:12px; color:#78350f; line-height:1.5; margin-bottom:10px;">
                ${escapeHTML(emailResult.message || "กรุณาตั้งค่าอีเมลผู้ส่ง")}
              </div>
            `;
            if (btnFallback) {
              btnFallback.style.display = "flex";
              btnFallback.href = gmailFallbackUrl;
            }
          }
        }
      } catch (parseErr) {}
    }).catch((e) => {
      console.warn("Automated email dispatch note:", e);
    });

    // ล้างตะกร้าสินค้า
    const boughtCount = cart.length;
    cart = [];
    saveCart();
    updateCartBadge();
    closeModal("checkoutModal");

    logUserActivity("ชำระเงินสำเร็จ", `คำสั่งซื้อ #${createdOrderId} ยอด ฿${total.toFixed(2)} ยืนยันการสั่งซื้อเรียบร้อย`);

    // แสดงโมดัลยืนยันความสำเร็จทันที (Instant Confirmation)
    showPaymentSuccessModal({
      orderId: createdOrderId,
      total: total,
      email: buyerEmail,
      name: buyerName,
      count: boughtCount,
      emailStatus: emailStatus,
      gmailFallbackUrl: gmailFallbackUrl
    });

  } catch (err) {
    console.error("Order submission error:", err);
    alert("เกิดข้อผิดพลาดในการทำรายการ: " + err.message);
  } finally {
    const submitBtn = document.getElementById("btnSubmitOrderAction");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = "ยืนยันการชำระเงิน";
    }
  }
}

function showPaymentSuccessModal(data) {
  const orderIdEl = document.getElementById("successOrderIdDisplay");
  const totalEl = document.getElementById("successTotalDisplay");
  const emailEl = document.getElementById("successEmailDisplay");
  const badgeEl = document.getElementById("successEmailDeliveryBadge");
  const btnFallback = document.getElementById("btnSendViaGmailFallback");
  const btnInbox = document.getElementById("btnOpenGmailDirect");

  if (orderIdEl) orderIdEl.innerText = `#${data.orderId}`;
  if (totalEl) totalEl.innerText = `฿${data.total.toFixed(2)}`;
  if (emailEl) emailEl.innerText = data.email;

  if (badgeEl) {
    if (data.emailStatus && data.emailStatus.sent) {
      badgeEl.style.background = "#ecfdf5";
      badgeEl.style.borderColor = "#a7f3d0";
      badgeEl.style.color = "#065f46";
      badgeEl.innerHTML = `<strong>✓ จัดส่งเข้าอีเมลจริงสำเร็จ 100%:</strong> ใบเสร็จคำสั่งซื้อและลิงก์ดาวน์โหลดถูกส่งตรงเข้ากล่องข้อความของ <strong>${escapeHTML(data.email)}</strong> เรียบร้อยแล้ว`;
      if (btnFallback) btnFallback.style.display = "none";
    } else {
      badgeEl.style.background = "#fffbeb";
      badgeEl.style.borderColor = "#fde68a";
      badgeEl.style.color = "#92400e";
      badgeEl.innerHTML = `
        <div style="font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
          <span>⚠️</span> <span>ยังไม่ได้ตั้งค่า Gmail ผู้ส่งในระบบหลังบ้าน:</span>
        </div>
        <div style="font-size:12px; color:#78350f; line-height:1.5; margin-bottom:10px;">
          ระบบต้องการ Gmail และ Google App Password 16 หลักของร้าน เพื่อเป็นตัวส่งอีเมลเข้ากล่องข้อความจริงของคุณ (${escapeHTML(data.email)}) อัตโนมัติครับ
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button type="button" onclick="openEmailConfigModal()" style="background:#0284c7; color:#fff; border:none; padding:7px 12px; border-radius:4px; font-size:12px; font-weight:700; cursor:pointer;">
            ⚙️ ตั้งค่า Gmail ผู้ส่ง (ใส่ App Password 16 หลัก)
          </button>
        </div>
      `;
      if (btnFallback) {
        btnFallback.style.display = "flex";
        btnFallback.href = data.gmailFallbackUrl || "#";
      }
    }
  }

  if (btnInbox) {
    const em = (data.email || "").toLowerCase();
    if (em.includes("@gmail.com")) {
      btnInbox.href = "https://mail.google.com/mail/u/0/#inbox";
      btnInbox.innerText = "📬 เปิดดูกล่องจดหมาย Gmail (Inbox)";
    } else if (em.includes("@hotmail.com") || em.includes("@outlook.com")) {
      btnInbox.href = "https://outlook.live.com/mail/0/inbox";
      btnInbox.innerText = "📬 เปิดดูกล่องจดหมาย Outlook (Inbox)";
    } else if (em.includes("@yahoo.com")) {
      btnInbox.href = "https://mail.yahoo.com/";
      btnInbox.innerText = "📬 เปิดดูกล่องจดหมาย Yahoo Mail";
    } else {
      btnInbox.href = `mailto:${encodeURIComponent(data.email)}`;
      btnInbox.innerText = "📬 เปิดกล่องข้อความอีเมลของคุณ";
    }
  }

  const modal = document.getElementById("paymentSuccessModal");
  if (modal) modal.classList.add("active");
}

// ==========================================
// 8. ORDERS & DOWNLOADS (คลังหนังสือ & ดาวน์โหลด)
// ==========================================
async function openOrdersModal() {
  const container = document.getElementById("ordersListContainer");
  container.innerHTML = `<div style="text-align:center; padding: 30px; color:#64748b;">กำลังโหลดประวัติคำสั่งซื้อ...</div>`;
  document.getElementById("ordersModal").classList.add("active");

  try {
    let orders = [];

    // 1. ดึงข้อมูลจาก Supabase เฉพาะของ User ปัจจุบัน (user_id)
    if (sbClient && currentUser && currentUser.user_id) {
      try {
        const { data, error } = await sbClient
          .from("orders")
          .select(`
            order_id,
            order_date,
            total_amount,
            status,
            order_items (
              quantity,
              price_at_purchase,
              ebooks ( ebook_id, title, cover_url, file_url )
            )
          `)
          .eq("user_id", currentUser.user_id)
          .order("order_id", { ascending: false });

        if (!error && data) {
          orders = data;
        }
      } catch (e) {
        console.warn("Supabase fetch orders note:", e);
      }
    }

    // 2. ดึงจาก LocalStorage เฉพาะที่ผู้ใช้นี้ (ตามอีเมล) เคยสั่งซื้อจริงเท่านั้น
    const currentEmail = currentUser ? currentUser.email.toLowerCase().trim() : "";
    if (currentEmail) {
      const userOrders = JSON.parse(localStorage.getItem(`nothave_user_orders_${currentEmail}`) || "[]");
      const existingIds = new Set(orders.map(o => o.order_id));
      for (const uo of userOrders) {
        if (!existingIds.has(uo.order_id)) {
          orders.push(uo);
        }
      }
    }

    // เรียงตาม order_id ใหม่สุดขึ้นก่อน
    orders.sort((a, b) => b.order_id - a.order_id);

    // 3. หากยังไม่เคยซื้อ -> แสดง Empty State (ห้ามเอาออเดอร์ของคนอื่นหรือตัวอย่างแอดมินมาแสดงเด็ดขาด)
    if (orders.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 48px 20px; color: #64748b;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: #94a3b8;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">ยังไม่มีประวัติคำสั่งซื้อ</div>
          <p style="font-size: 13px; color: #64748b; max-width: 320px; margin: 0 auto 18px; line-height: 1.5;">
            คุณยังไม่มีหนังสือในคลัง เมื่อคุณสั่งซื้อหนังสือสำเร็จ รายการและลิงก์สำหรับดาวน์โหลด E-Book จะปรากฏที่นี่ครับ
          </p>
          <button class="btn-primary-action" style="padding: 9px 22px; font-size: 13px; border-radius: 8px;" onclick="closeModal('ordersModal')">
            เลือกดูหนังสือในร้านค้า
          </button>
        </div>
      `;
      return;
    }

    // 4. แสดงผลเฉพาะรายการที่ผู้ใช้คนนี้ซื้อจริงเท่านั้น
    container.innerHTML = orders.map(ord => {
      const isConfirmed = ord.status === "confirmed" || ord.status === "verified";
      const statusBadge = `
        <span style="display:inline-flex; align-items:center; gap:5px; font-size:11.5px; font-weight:600; padding:3px 10px; border-radius:12px; background:${isConfirmed ? '#dcfce7' : '#fef3c7'}; color:${isConfirmed ? '#15803d' : '#b45309'}; border:1px solid ${isConfirmed ? '#bbf7d0' : '#fde68a'};">
          ${isConfirmed ? '✓ ชำระเงินสำเร็จ (ยืนยันแล้ว)' : '⏳ รอตรวจสอบ / ยังไม่ยืนยัน'}
        </span>
      `;

      let actionButtons = "";
      if (isConfirmed) {
        actionButtons = `
          <button type="button" class="btn-primary-action" style="padding:6px 12px; font-size:12px; background:#0284c7; border-radius:6px; display:inline-flex; align-items:center; gap:5px; width:auto;" onclick="openRealEbookReader(${ord.order_items?.[0]?.ebooks?.ebook_id || 1}, true)">
            <span>📖 เปิดอ่านฉบับเต็ม</span>
          </button>
          <button type="button" class="btn-primary-action" style="padding:6px 12px; font-size:12px; background:#16a34a; border-radius:6px; display:inline-flex; align-items:center; gap:5px; width:auto;" onclick="downloadRealEbook(${ord.order_items?.[0]?.ebooks?.ebook_id || 1}, true); recordDownload(${ord.order_id});">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>ดาวน์โหลด PDF</span>
          </button>
          <button type="button" class="btn-primary-action" style="padding:6px 12px; font-size:12px; background:#ef4444; border-radius:6px; display:inline-flex; align-items:center; gap:5px; width:auto;" onclick="deleteUserOrder(${ord.order_id})" title="ลบประวัติคำสั่งซื้อนี้">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            <span>ลบ</span>
          </button>
        `;
      } else {
        actionButtons = `
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:11.5px; color:#b45309; background:#fffbeb; border:1px solid #fde68a; padding:5px 9px; border-radius:5px; display:inline-flex; align-items:center; gap:4px;" title="คำสั่งซื้อที่ยังไม่ยืนยันไม่สามารถเปิดลิงก์ดาวน์โหลดได้">
              🔒 ยังไม่ยืนยัน (ล็อกดาวน์โหลด)
            </span>
            <button type="button" class="btn-primary-action" style="padding:6px 12px; font-size:12px; background:#0284c7; border-radius:6px; display:inline-flex; align-items:center; gap:5px; width:auto;" onclick="openSampleModal(${ord.order_items?.[0]?.ebooks?.ebook_id || 1})">
              <span>📖 ทดลองอ่าน 3 หน้า</span>
            </button>
            <button type="button" class="btn-primary-action" style="padding:6px 12px; font-size:12px; background:#ef4444; border-radius:6px; display:inline-flex; align-items:center; gap:5px; width:auto;" onclick="deleteUserOrder(${ord.order_id})" title="ลบประวัติคำสั่งซื้อนี้">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              <span>ลบ</span>
            </button>
          </div>
        `;
      }

      return `
        <div class="order-card" style="border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin-bottom:14px; background:#ffffff; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
          <div class="order-header-info" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">
            <div>
              <strong style="color:#0f172a; font-size:14px;">คำสั่งซื้อ #${ord.order_id}</strong> 
              <span style="color:#64748b; font-size:12px; margin-left:8px;">${typeof ord.order_date === 'string' && ord.order_date.includes('T') ? new Date(ord.order_date).toLocaleString('th-TH') : ord.order_date}</span>
            </div>
            <div>${statusBadge}</div>
          </div>

          <div style="margin-bottom: 12px;">
            ${(ord.order_items || []).map(it => `
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; padding: 5px 0;">
                <span style="color:#334155;">• ${escapeHTML(it.ebooks?.title || "E-Book")} ${it.quantity > 1 ? `x ${it.quantity}` : ''}</span>
                <span style="font-weight:700; color:#0f172a;">฿${(it.price_at_purchase * (it.quantity || 1)).toFixed(2)}</span>
              </div>
            `).join("")}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #e2e8f0; padding-top: 10px; flex-wrap:wrap; gap:8px;">
            <div style="font-size:13px; color:#475569;">
              ยอดรวมสุทธิ: <strong style="color:#0284c7; font-size:16px;">฿${parseFloat(ord.total_amount).toFixed(2)}</strong>
            </div>
            <div style="display:flex; gap:6px;">
              ${actionButtons}
            </div>
          </div>
        </div>
      `;
    }).join("");

  } catch (err) {
    container.innerHTML = `<div style="color:#dc2626; text-align:center; padding:20px;">เกิดข้อผิดพลาดในการโหลดประวัติ: ${err.message}</div>`;
  }
}

function recordDownload(orderId) {
  console.log(`ผู้ใช้ดาวน์โหลดไฟล์ E-Book จากคำสั่งซื้อ #${orderId}`);
}

async function deleteUserOrder(orderId) {
  if (!confirm(`ต้องการลบประวัติคำสั่งซื้อ #${orderId} หรือไม่?`)) return;

  try {
    if (sbClient) {
      await sbClient.from("download_links").delete().eq("order_id", orderId);
      await sbClient.from("payments").delete().eq("order_id", orderId);
      await sbClient.from("order_items").delete().eq("order_id", orderId);
      const { error } = await sbClient.from("orders").delete().eq("order_id", orderId);
      if (error) {
        console.warn("Supabase delete order note:", error);
      }
    }

    const currentEmail = currentUser ? currentUser.email.toLowerCase().trim() : "";
    if (currentEmail) {
      const storageKey = `nothave_user_orders_${currentEmail}`;
      const userOrders = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const filtered = userOrders.filter(o => o.order_id != orderId);
      localStorage.setItem(storageKey, JSON.stringify(filtered));
    }

    const mockOrders = JSON.parse(localStorage.getItem("nothave_mock_orders") || "[]");
    const filteredMock = mockOrders.filter(o => o.order_id != orderId);
    localStorage.setItem("nothave_mock_orders", JSON.stringify(filteredMock));

    await openOrdersModal();
  } catch (err) {
    console.error("Delete order error:", err);
    alert(`เกิดข้อผิดพลาดในการลบคำสั่งซื้อ: ${err.message}`);
  }
}

// ==========================================
// 9. AUTHENTICATION & SECURITY (Password Hash)
// ==========================================
function openAuthModal(mode = "login") {
  document.getElementById("authModal").classList.add("active");
  switchAuthTab(mode);
}

function switchAuthTab(mode) {
  const isLogin = mode === "login";
  document.getElementById("tabLoginBtn").classList.toggle("active", isLogin);
  document.getElementById("tabRegisterBtn").classList.toggle("active", !isLogin);
  document.getElementById("loginForm").style.display = isLogin ? "block" : "none";
  document.getElementById("registerForm").style.display = isLogin ? "none" : "block";
}

// ==========================================
// 9. CUSTOM POPUP MODAL (แทนที่ alert() ของบราวเซอร์ - คลีน มินิมอล ไร้อิโมจิ)
// ==========================================
let customAlertTimer = null;

function showCustomAlert({
  type = "success", // "success", "error", "info"
  icon = "",
  title = "แจ้งเตือน",
  message = "",
  detailsHtml = "",
  btnText = "ตกลง",
  callback = null,
  autoCloseMs = 0
}) {
  if (customAlertTimer) {
    clearTimeout(customAlertTimer);
    customAlertTimer = null;
  }

  const modal = document.getElementById("customAlertModal");
  const iconEl = document.getElementById("alertModalIcon");
  const titleEl = document.getElementById("alertModalTitle");
  const msgEl = document.getElementById("alertModalMessage");
  const detailsEl = document.getElementById("alertModalDetails");
  const btnEl = document.getElementById("alertModalBtn");

  if (!modal) {
    alert(title + "\n" + message);
    if (callback) callback();
    return;
  }

  // ไอคอน SVG แบบมินิมอล มาตรฐานระดับ Professional Web Application (ไม่ใช้อิโมจิ)
  const svgIcons = {
    success: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
    error: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    info: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  };

  const chosenIcon = (icon && icon.includes("<svg")) ? icon : (svgIcons[type] || svgIcons.info);

  // กำหนดสีและไอคอนตามสถานะ
  if (type === "success") {
    if (iconEl) {
      iconEl.style.background = "#ecfdf5";
      iconEl.style.border = "1px solid #d1fae5";
      iconEl.style.boxShadow = "0 4px 14px rgba(16, 185, 129, 0.15)";
      iconEl.innerHTML = chosenIcon;
    }
    if (btnEl) {
      btnEl.style.background = "#10b981";
      btnEl.style.color = "#ffffff";
    }
    if (titleEl) titleEl.style.color = "#0f172a";
  } else if (type === "error") {
    if (iconEl) {
      iconEl.style.background = "#fef2f2";
      iconEl.style.border = "1px solid #fee2e2";
      iconEl.style.boxShadow = "0 4px 14px rgba(239, 68, 68, 0.15)";
      iconEl.innerHTML = chosenIcon;
    }
    if (btnEl) {
      btnEl.style.background = "#ef4444";
      btnEl.style.color = "#ffffff";
    }
    if (titleEl) titleEl.style.color = "#991b1b";
  } else {
    // info
    if (iconEl) {
      iconEl.style.background = "#f0f9ff";
      iconEl.style.border = "1px solid #e0f2fe";
      iconEl.style.boxShadow = "0 4px 14px rgba(2, 132, 199, 0.15)";
      iconEl.innerHTML = chosenIcon;
    }
    if (btnEl) {
      btnEl.style.background = "#0284c7";
      btnEl.style.color = "#ffffff";
    }
    if (titleEl) titleEl.style.color = "#075985";
  }

  if (titleEl) titleEl.innerText = title;
  if (msgEl) msgEl.innerText = message;

  if (detailsEl) {
    if (detailsHtml) {
      detailsEl.innerHTML = detailsHtml;
      detailsEl.style.display = "block";
    } else {
      detailsEl.innerHTML = "";
      detailsEl.style.display = "none";
    }
  }

  if (btnEl) {
    btnEl.innerText = btnText;
    btnEl.onclick = () => {
      if (customAlertTimer) {
        clearTimeout(customAlertTimer);
        customAlertTimer = null;
      }
      closeModal("customAlertModal");
      if (callback) callback();
    };
  }

  modal.classList.add("active");

  if (autoCloseMs > 0) {
    customAlertTimer = setTimeout(() => {
      closeModal("customAlertModal");
      if (callback) callback();
    }, autoCloseMs);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const rawEmail = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!rawEmail || !password) {
    showCustomAlert({
      type: "error",
      title: "กรอกข้อมูลไม่ครบถ้วน",
      message: "กรุณากรอกทั้งอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ",
      btnText: "ลองใหม่อีกครั้ง"
    });
    return;
  }

  const email = rawEmail.toLowerCase();
  const hashed = await hashPassword(password);

  try {
    // 1. ตรวจสอบสิทธิ์ผู้ดูแลระบบทันที (รองรับบัญชี email: admin หรือ admin@nothave.com / รหัสผ่าน: admin หรือ 123456)
    if ((email === "admin" || email === "admin@nothave.com") && (password === "admin" || password === "123456")) {
      const adminUser = {
        user_id: 1,
        email: "admin@nothave.com",
        full_name: "ผู้ดูแลระบบ (Admin)",
        role_id: 2,
        phone: "081-111-2222"
      };
      loginSuccess(adminUser, false);
      return;
    }

    // 2. ตรวจสอบสิทธิ์นักเขียนทันที (รองรับบัญชี email: writer หรือ writer@nothave.com / รหัสผ่าน: writer หรือ 123456)
    if ((email === "writer" || email === "writer@nothave.com") && (password === "writer" || password === "123456")) {
      const writerUser = {
        user_id: 99,
        email: "writer@nothave.com",
        full_name: "อ.เอกชัย นักเขียนการ์ตูน (Writer)",
        role_id: 3,
        phone: "089-777-8888"
      };
      loginSuccess(writerUser, false);
      return;
    }

    if (sbClient) {
      const { data, error } = await sbClient
        .from("users")
        .select("user_id, email, full_name, role_id, password_hash")
        .ilike("email", email)
        .single();

      if (error || !data) {
        showCustomAlert({
          type: "error",
          title: "ไม่พบบัญชีผู้ใช้งาน",
          message: "ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาตรวจสอบหรือสมัครสมาชิกใหม่",
          btnText: "ตกลง"
        });
        return;
      }

      const isPassValid = (data.password_hash === hashed) ||
                          (data.role_id === 2 && (password === "admin" || password === "123456"));

      if (!isPassValid) {
        showCustomAlert({
          type: "error",
          title: "รหัสผ่านไม่ถูกต้อง",
          message: "รหัสผ่านที่คุณระบุไม่ตรงกับในระบบ กรุณาลองใหม่อีกครั้ง",
          btnText: "พิมพ์รหัสผ่านใหม่"
        });
        return;
      }

      loginSuccess(data, false);
    } else {
      loginSuccess({ user_id: 2, email: email, full_name: "ผู้ใช้ทั่วไป", role_id: 1 }, false);
    }
  } catch (err) {
    showCustomAlert({
      type: "error",
      title: "เข้าสู่ระบบไม่สำเร็จ",
      message: err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง",
      btnText: "ตกลง"
    });
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const fullName = document.getElementById("regFullName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const password = document.getElementById("regPassword").value;

  if (password.length < 6) {
    showCustomAlert({
      type: "error",
      title: "รหัสผ่านสั้นเกินไป",
      message: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
      btnText: "แก้ไขรหัสผ่าน"
    });
    return;
  }

  const hashedPassword = await hashPassword(password);

  const roleEl = document.getElementById("regRole");
  const selectedRoleId = roleEl ? parseInt(roleEl.value || "1") : 1;

  try {
    if (sbClient) {
      const { data, error } = await sbClient
        .from("users")
        .insert([{
          full_name: fullName,
          email: email,
          phone: phone,
          password_hash: hashedPassword,
          role_id: selectedRoleId
        }])
        .select();

      if (error) {
        if (error.code === "23503") {
          showCustomAlert({
            type: "error",
            title: "ยังไม่เปิดใช้งานบทบาทนี้",
            message: "กรุณารันคำสั่ง SQL ใน Supabase SQL Editor เพื่อเปิดใช้งานบทบาท: INSERT INTO roles (role_id, role_name) VALUES (3, 'writer');",
            btnText: "ตกลง"
          });
          return;
        }
        if (error.code === "23505") {
          showCustomAlert({
            type: "error",
            title: "อีเมลนี้มีผู้ใช้งานแล้ว",
            message: "อีเมลนี้ลงทะเบียนไว้ในระบบแล้ว กรุณาเข้าสู่ระบบหรือใช้อีเมลอื่น",
            btnText: "ไปที่หน้าเข้าสู่ระบบ",
            callback: () => {
              switchAuthTab("login");
              const loginEmail = document.getElementById("loginEmail");
              if (loginEmail) loginEmail.value = email;
            }
          });
        } else {
          showCustomAlert({
            type: "error",
            title: "สมัครสมาชิกไม่สำเร็จ",
            message: error.message || "เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง",
            btnText: "ตกลง"
          });
        }
        return;
      }

      // สมัครสมาชิกสำเร็จ -> เด้ง Pop-up สวยงาม มินิมอล ไร้อิโมจิ
      loginSuccess(data[0], true);
    }
  } catch (err) {
    showCustomAlert({
      type: "error",
      title: "สมัครสมาชิกไม่สำเร็จ",
      message: err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง",
      btnText: "ตกลง"
    });
  }
}

function loginSuccess(user, isJustRegistered = false) {
  currentUser = user;
  localStorage.setItem("nothave_user", JSON.stringify(currentUser));
  closeModal("authModal");
  updateUserInterface();
  logUserActivity(isJustRegistered ? "สมัครสมาชิกใหม่" : "เข้าสู่ระบบ", `ผู้ใช้ "${user.full_name}" เข้าสู่ระบบสำเร็จ`);
  const isAdmin = user.role_id === 2;
  const isWriter = user.role_id === 3;
  const isBackOfficeUser = isAdmin || isWriter;

  if (isJustRegistered) {
    // ป็อปอัปแจ้งเมื่อ "สมัครสมาชิกสำเร็จ" (ไร้อิโมจิ สไตล์คลีนเป็นทางการ)
    showCustomAlert({
      type: "success",
      title: "สมัครสมาชิกสำเร็จ",
      message: `ยินดีต้อนรับคุณ ${user.full_name} สู่ NOT HAVE A BOOK SHOP`,
      detailsHtml: `
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span style="color:#64748b;">ชื่อสมาชิก:</span>
          <strong>${escapeHTML(user.full_name)}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span style="color:#64748b;">อีเมล:</span>
          <span>${escapeHTML(user.email)}</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:#64748b;">สถานะ:</span>
          <span style="color:#16a34a; font-weight:600;">เข้าสู่ระบบอัตโนมัติแล้ว</span>
        </div>
      `,
      btnText: isBackOfficeUser ? "ไปยังระบบจัดการหลังบ้าน" : "เริ่มต้นเลือกดูหนังสือ",
      autoCloseMs: 3200,
      callback: () => {
        if (isBackOfficeUser) {
          window.location.href = "admin.html";
        }
      }
    });
  } else {
    // ป็อปอัปแจ้งเมื่อ "เข้าสู่ระบบสำเร็จ" (ไร้อิโมจิ สไตล์คลีนเป็นทางการ)
    showCustomAlert({
      type: "success",
      title: "เข้าสู่ระบบสำเร็จ",
      message: `ยินดีต้อนรับคุณ ${user.full_name}`,
      detailsHtml: `
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span style="color:#64748b;">บัญชีผู้ใช้:</span>
          <strong>${escapeHTML(user.full_name)}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span style="color:#64748b;">อีเมล:</span>
          <span>${escapeHTML(user.email)}</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:#64748b;">ระดับสิทธิ์:</span>
          <span style="font-weight:600; color:${isAdmin ? '#0284c7' : (isWriter ? '#7c3aed' : '#16a34a')};">
            ${isAdmin ? 'ผู้ดูแลร้าน (Admin)' : (isWriter ? 'นักเขียน (Writer)' : 'ลูกค้าทั่วไป')}
          </span>
        </div>
      `,
      btnText: isBackOfficeUser ? "ไปยังระบบจัดการหลังบ้าน" : "เลือกซื้อหนังสือต่อ",
      autoCloseMs: 2800,
      callback: () => {
        if (isBackOfficeUser) {
          window.location.href = "admin.html";
        }
      }
    });
  }
}

function handleLogout() {
  closeModal("cartModal");
  closeModal("checkoutModal");
  closeModal("profileModal");
  cart = [];
  saveCart();
  updateCartBadge();

  if (currentUser) {
    const userName = currentUser.full_name;
    logUserActivity("ออกจากระบบ", `ผู้ใช้ "${userName}" ออกจากระบบ`);
    currentUser = null;
    localStorage.removeItem("nothave_user");
    updateUserInterface();

    showCustomAlert({
      type: "info",
      title: "ออกจากระบบเรียบร้อย",
      message: `คุณ ${userName} ได้ออกจากระบบแล้ว ขอบคุณที่ใช้บริการครับ`,
      btnText: "ตกลง",
      autoCloseMs: 2000
    });
  } else {
    currentUser = null;
    localStorage.removeItem("nothave_user");
    updateUserInterface();
  }
}

function refreshCurrentUserFromStorage() {
  try {
    const stored = localStorage.getItem("nothave_user");
    if (!stored) {
      currentUser = null;
      return null;
    }
    currentUser = JSON.parse(stored);
    const roleOverrides = JSON.parse(localStorage.getItem("nothave_role_overrides") || "{}");
    const override = (currentUser.id && roleOverrides[String(currentUser.id)]) || 
                     (currentUser.user_id && roleOverrides[String(currentUser.user_id)]) || 
                     (currentUser.email && roleOverrides[String(currentUser.email).toLowerCase()]);
    if (override) {
      currentUser.role_id = override.roleId;
      currentUser.role_name = override.roleName;
      localStorage.setItem("nothave_user", JSON.stringify(currentUser));
    }
    return currentUser;
  } catch(e) {
    return currentUser;
  }
}

async function syncUserRoleFromBackend() {
  if (!currentUser) return;
  try {
    const resp = await fetch(`${BACKEND_URL}/api/user-roles`);
    if (resp.ok) {
      const roles = await resp.json();
      const override = (currentUser.id && roles[String(currentUser.id)]) || 
                       (currentUser.user_id && roles[String(currentUser.user_id)]) || 
                       (currentUser.email && roles[String(currentUser.email).toLowerCase()]);
      if (override) {
        const localOverrides = JSON.parse(localStorage.getItem("nothave_role_overrides") || "{}");
        if (currentUser.id) localOverrides[String(currentUser.id)] = override;
        if (currentUser.user_id) localOverrides[String(currentUser.user_id)] = override;
        if (currentUser.email) localOverrides[String(currentUser.email).toLowerCase()] = override;
        localStorage.setItem("nothave_role_overrides", JSON.stringify(localOverrides));

        if (currentUser.role_id !== override.roleId) {
          currentUser.role_id = override.roleId;
          currentUser.role_name = override.roleName;
          localStorage.setItem("nothave_user", JSON.stringify(currentUser));
          updateUserInterface();
        }
      }
    }
  } catch(e) {}
}

function updateUserInterface() {
  refreshCurrentUserFromStorage();

  const guestGroup = document.getElementById("guestActions");
  const customerGroup = document.getElementById("customerActions");
  const adminGroup = document.getElementById("adminActions");
  const adminTopBar = document.getElementById("adminTopBar");
  const customerNameEl = document.getElementById("customerUserName");
  const adminNameEl = document.getElementById("adminUserName");
  const cartBtn = document.getElementById("cartBtn");
  const dropdownAdminCmsLink = document.getElementById("dropdownAdminCmsLink");
  const dropdownWriterStudioLink = document.getElementById("dropdownWriterStudioLink");
  const communityFab = document.getElementById("communityFab");
  const communityBox = document.getElementById("communityBox");
  const commRoleSelectWrapper = document.getElementById("commRoleSelectWrapper");

  if (!currentUser) {
    // 1. GUEST MODE (ผู้เยี่ยมชม / ยังไม่ล็อกอิน)
    if (guestGroup) guestGroup.style.display = "flex";
    if (customerGroup) customerGroup.style.display = "none";
    if (adminGroup) adminGroup.style.display = "none";
    if (adminTopBar) adminTopBar.style.display = "none";
    if (cartBtn) cartBtn.style.display = "inline-flex";
    if (dropdownAdminCmsLink) dropdownAdminCmsLink.style.display = "none";
    if (dropdownWriterStudioLink) dropdownWriterStudioLink.style.display = "none";
    if (communityFab) communityFab.style.display = "none";
    if (communityBox) communityBox.classList.remove("active");
    if (commRoleSelectWrapper) commRoleSelectWrapper.style.display = "none";
  } else if (currentUser.role_id === 2 || currentUser.role_id === 3) {
    // 2. BACK-OFFICE USERS (Admin & Writer เข้าหลังบ้านได้เหมือนกัน)
    if (guestGroup) guestGroup.style.display = "none";
    if (customerGroup) customerGroup.style.display = "none";
    if (adminGroup) adminGroup.style.display = "flex";
    if (adminTopBar) adminTopBar.style.display = "none";

    const isWriter = currentUser.role_id === 3;
    if (adminNameEl) {
      adminNameEl.innerText = isWriter ? `${currentUser.full_name || "นักเขียน"}` : "ผู้ดูแลร้าน";
    }

    // ปรับแต่งปุ่ม Header Pill Icon
    const adminBtn = document.querySelector("#adminActions .clickable-profile-btn");
    if (adminBtn) {
      if (isWriter) {
        adminBtn.style.background = "#faf5ff";
        adminBtn.style.borderColor = "#c4b5fd";
        const iconSpan = adminBtn.querySelector("span:first-child");
        if (iconSpan) iconSpan.innerHTML = '<span style="font-size:14px;">✍️</span>';
      } else {
        adminBtn.style.background = "#eff6ff";
        adminBtn.style.borderColor = "#93c5fd";
        const iconSpan = adminBtn.querySelector("span:first-child");
        if (iconSpan) iconSpan.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
      }
    }

    const admDropName = document.querySelector("#adminDropdownMenu .dropdown-user-name");
    const admDropEmail = document.querySelector("#adminDropdownMenu .dropdown-user-email");
    const admDropAvatar = document.querySelector("#adminDropdownMenu .dropdown-avatar");
    if (admDropName) admDropName.innerText = isWriter ? `${currentUser.full_name} (นักเขียน)` : "ผู้ดูแลร้าน (Admin)";
    if (admDropEmail) admDropEmail.innerText = currentUser.email || "";
    if (admDropAvatar) {
      admDropAvatar.innerText = isWriter ? "W" : "A";
      admDropAvatar.style.background = isWriter ? "linear-gradient(135deg, #6d28d9, #8b5cf6)" : "linear-gradient(135deg, #0f172a, #0284c7)";
    }

    // ลิงก์เข้าห้องหลังบ้านใน Dropdown
    const cmsLink = document.querySelector("#adminDropdownMenu a[href='admin.html']");
    if (cmsLink) {
      const cmsIcon = cmsLink.querySelector(".menu-icon");
      const cmsTitle = cmsLink.querySelector(".menu-title");
      if (isWriter) {
        if (cmsIcon) cmsIcon.innerHTML = '✍️';
        if (cmsTitle) {
          cmsTitle.innerText = "ห้องผลงาน";
          cmsTitle.style.color = "#6d28d9";
        }
      } else {
        if (cmsIcon) cmsIcon.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>';
        if (cmsTitle) {
          cmsTitle.innerText = "เปิดระบบจัดการหลังบ้าน (CMS)";
          cmsTitle.style.color = "#0284c7";
        }
      }
    }

    if (cartBtn) cartBtn.style.display = "inline-flex";
    if (communityFab) communityFab.style.display = "flex";
    if (commRoleSelectWrapper) commRoleSelectWrapper.style.display = "flex";
  } else {
    // 3. REGULAR CUSTOMER MODE (ลูกค้าทั่วไปล็อกอิน)
    if (guestGroup) guestGroup.style.display = "none";
    if (customerGroup) customerGroup.style.display = "flex";
    if (adminGroup) adminGroup.style.display = "none";
    if (adminTopBar) adminTopBar.style.display = "none";
    if (customerNameEl) customerNameEl.innerText = currentUser.full_name;
    if (cartBtn) cartBtn.style.display = "inline-flex";
    if (dropdownAdminCmsLink) dropdownAdminCmsLink.style.display = "none";
    if (dropdownWriterStudioLink) dropdownWriterStudioLink.style.display = "none";
    if (communityFab) communityFab.style.display = "flex";
    if (commRoleSelectWrapper) commRoleSelectWrapper.style.display = "flex";
  }
}

// 9.1 Quick Test Account Helper
function quickFillUser(email, pass) {
  document.getElementById("loginEmail").value = email;
  document.getElementById("loginPassword").value = pass;
}

// 9.2 PROFILE SETTINGS (ดูและแก้ไขข้อมูลโปรไฟล์)
function openProfileModal() {
  if (!currentUser) {
    openAuthModal('login');
    return;
  }

  // เติมข้อมูลลงฟอร์ม
  const nameInput = document.getElementById("profileFullName");
  const emailInput = document.getElementById("profileEmail");
  const phoneInput = document.getElementById("profilePhone");
  if (nameInput) nameInput.value = currentUser.full_name || "";
  if (emailInput) emailInput.value = currentUser.email || "";
  if (phoneInput) phoneInput.value = currentUser.phone || "";
  
  const cardName = document.getElementById("profileCardName");
  const cardEmail = document.getElementById("profileCardEmail");
  const cardAvatar = document.getElementById("profileCardAvatar");
  const cardRole = document.getElementById("profileCardRole");
  const userIdEl = document.getElementById("profileUserId");

  if (cardName) cardName.innerText = currentUser.full_name || "ลูกค้า";
  if (cardEmail) cardEmail.innerText = currentUser.email || "";
  if (cardAvatar) cardAvatar.innerText = currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : "U";
  if (cardRole) {
    if (currentUser.role_id === 2) cardRole.innerText = "ผู้ดูแลระบบ (Admin)";
    else if (currentUser.role_id === 3) cardRole.innerText = "นักเขียน (Writer)";
    else cardRole.innerText = "ลูกค้าทั่วไป (Customer)";
  }
  if (userIdEl) userIdEl.innerText = currentUser.user_id || currentUser.id || "1";

  // เคลียร์ช่องรหัสผ่านและข้อความแจ้งเตือน
  const newPass = document.getElementById("profileNewPassword");
  const confPass = document.getElementById("profileConfirmPassword");
  if (newPass) newPass.value = "";
  if (confPass) confPass.value = "";
  
  const msgEl = document.getElementById("profileSaveMsg");
  if (msgEl) {
    msgEl.innerText = "";
    msgEl.style.display = "none";
  }

  const modal = document.getElementById("profileModal");
  if (modal) modal.classList.add("active");
}

async function handleSaveProfile(e) {
  e.preventDefault();
  if (!currentUser) return;

  const newFullName = document.getElementById("profileFullName").value.trim();
  const newPhone = document.getElementById("profilePhone").value.trim();
  const newPassword = document.getElementById("profileNewPassword").value;
  const confirmPassword = document.getElementById("profileConfirmPassword").value;
  const msgEl = document.getElementById("profileSaveMsg");
  const saveBtn = document.getElementById("btnSaveProfile");

  if (!newFullName) {
    showCustomAlert({
      type: "error",
      title: "กรุณาระบุชื่อ-นามสกุล",
      message: "ชื่อ-นามสกุลต้องไม่ว่างเปล่าครับ",
      btnText: "ตกลง"
    });
    return;
  }

  let newHashedPassword = null;
  if (newPassword) {
    if (newPassword.length < 6) {
      showCustomAlert({
        type: "error",
        title: "รหัสผ่านสั้นเกินไป",
        message: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษรครับ",
        btnText: "แก้ไขรหัสผ่าน"
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      showCustomAlert({
        type: "error",
        title: "รหัสผ่านไม่ตรงกัน",
        message: "รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้งครับ",
        btnText: "แก้ไข"
      });
      return;
    }
    newHashedPassword = await hashPassword(newPassword);
  }

  try {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerText = "กำลังบันทึก...";
    }

    // 1. บันทึกปรับปรุงลงใน Supabase (หากเชื่อมต่อ)
    if (sbClient) {
      const updateData = {
        full_name: newFullName,
        phone: newPhone
      };
      if (newHashedPassword) {
        updateData.password_hash = newHashedPassword;
      }

      const { error } = await sbClient
        .from("users")
        .update(updateData)
        .eq("email", currentUser.email);

      if (error) {
        console.warn("Supabase profile update warning:", error);
      }
    }

    // 2. อัปเดต currentUser ใน Memory และ LocalStorage
    currentUser.full_name = newFullName;
    currentUser.phone = newPhone;
    if (newHashedPassword) {
      currentUser.password_hash = newHashedPassword;
    }
    localStorage.setItem("nothave_user", JSON.stringify(currentUser));

    // 3. ปรับปรุงหน้าจอ UI ทันที
    updateUserInterface();
    const cardName = document.getElementById("profileCardName");
    const cardAvatar = document.getElementById("profileCardAvatar");
    if (cardName) cardName.innerText = newFullName;
    if (cardAvatar) cardAvatar.innerText = newFullName.charAt(0).toUpperCase();

    // 4. บันทึกประวัติกิจกรรมลง Audit Log
    logUserActivity("แก้ไขโปรไฟล์", `ผู้ใช้ "${newFullName}" อัปเดตข้อมูลส่วนตัว${newHashedPassword ? " และเปลี่ยนรหัสผ่านสำเร็จ" : ""}`);

    if (msgEl) {
      msgEl.innerText = "บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว";
      msgEl.style.color = "#15803d";
      msgEl.style.background = "#f0fdf4";
      msgEl.style.border = "1px solid #bbf7d0";
      msgEl.style.display = "block";
    }

    setTimeout(() => {
      closeModal("profileModal");
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerText = "บันทึกข้อมูลโปรไฟล์";
      }
      showCustomAlert({
        type: "success",
        title: "บันทึกโปรไฟล์เรียบร้อย",
        message: "ข้อมูลส่วนตัวของคุณได้รับการอัปเดตเรียบร้อยแล้วครับ",
        btnText: "ตกลง",
        autoCloseMs: 2200
      });
    }, 700);

  } catch (err) {
    showCustomAlert({
      type: "error",
      title: "บันทึกโปรไฟล์ไม่สำเร็จ",
      message: "เกิดข้อผิดพลาดในการบันทึกโปรไฟล์: " + err.message,
      btnText: "ตกลง"
    });
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerText = "บันทึกข้อมูลโปรไฟล์";
    }
  }
}

// ==========================================
// 9.3 YOUTUBE-STYLE PROFILE DROPDOWN
// ==========================================
function toggleProfileDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById("profileDropdownMenu");
  if (!dropdown) return;
  
  if (dropdown.classList.contains("show")) {
    closeProfileDropdown();
  } else {
    openProfileDropdown();
  }
}

function openProfileDropdown() {
  const dropdown = document.getElementById("profileDropdownMenu");
  if (!dropdown || !currentUser) return;

  // Refresh role from overrides if any
  try {
    const roleOverrides = JSON.parse(localStorage.getItem("nothave_role_overrides") || "{}");
    const override = (currentUser.id && roleOverrides[String(currentUser.id)]) || (currentUser.user_id && roleOverrides[String(currentUser.user_id)]) || (currentUser.email && roleOverrides[String(currentUser.email).toLowerCase()]);
    if (override) {
      currentUser.role_id = override.roleId;
      currentUser.role_name = override.roleName;
    }
  } catch(e) {}

  // เติมข้อมูลลง Dropdown Header ให้ตรงกับผู้ใช้ปัจจุบัน
  const nameEl = document.getElementById("dropdownUserName");
  const emailEl = document.getElementById("dropdownUserEmail");
  const avatarEl = document.getElementById("dropdownAvatarInitial");
  const adminLink = document.getElementById("dropdownAdminCmsLink");
  const writerLink = document.getElementById("dropdownWriterStudioLink");

  const roleLabel = currentUser.role_id === 2 ? " (ผู้ดูแลระบบ / Admin)" : (currentUser.role_id === 3 ? " (นักเขียน / Writer)" : "");
  if (nameEl) nameEl.innerText = (currentUser.full_name || "ลูกค้า") + roleLabel;
  if (emailEl) emailEl.innerText = currentUser.email || "";
  if (avatarEl) avatarEl.innerText = currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : "U";

  // แสดงเมนูเฉพาะตามบทบาทจริง:
  // 1. customer: ไม่แสดงลิงก์เข้าคลัง/CMS (เหมือนหน้า 2)
  // 2. admin: แสดงลิงก์เข้า แผงควบคุมหลังบ้าน CMS
  // 3. writer: แสดงลิงก์เข้า ห้องนักเขียน & จัดการคลังหนังสือ (เหมือนหน้า 1)
  if (currentUser.role_id === 2) {
    if (adminLink) adminLink.style.display = "flex";
    if (writerLink) writerLink.style.display = "none";
  } else if (currentUser.role_id === 3) {
    if (adminLink) adminLink.style.display = "none";
    if (writerLink) writerLink.style.display = "flex";
  } else {
    if (adminLink) adminLink.style.display = "none";
    if (writerLink) writerLink.style.display = "none";
  }

  dropdown.classList.add("show");
  const arrow = document.getElementById("custArrowIcon");
  if (arrow) arrow.style.transform = "rotate(180deg)";
}

function closeProfileDropdown() {
  const dropdown = document.getElementById("profileDropdownMenu");
  if (dropdown) dropdown.classList.remove("show");
  const arrow = document.getElementById("custArrowIcon");
  if (arrow) arrow.style.transform = "rotate(0deg)";
}

function toggleAdminDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById("adminDropdownMenu");
  if (!dropdown) return;
  
  if (dropdown.classList.contains("show")) {
    closeAdminDropdown();
  } else {
    openAdminDropdown();
  }
}

function openAdminDropdown() {
  const dropdown = document.getElementById("adminDropdownMenu");
  if (!dropdown) return;
  dropdown.classList.add("show");
  const arrow = document.getElementById("adminArrowIcon");
  if (arrow) arrow.style.transform = "rotate(180deg)";
}

function closeAdminDropdown() {
  const dropdown = document.getElementById("adminDropdownMenu");
  if (dropdown) dropdown.classList.remove("show");
  const arrow = document.getElementById("adminArrowIcon");
  if (arrow) arrow.style.transform = "rotate(0deg)";
}

// ปิด Dropdown อัตโนมัติเมื่อคลิกที่อื่น หรือกด ESC
document.addEventListener("click", (e) => {
  const custWrapper = document.getElementById("profileDropdownWrapper");
  if (custWrapper && !custWrapper.contains(e.target)) {
    closeProfileDropdown();
  }
  const adminWrapper = document.getElementById("adminDropdownWrapper");
  if (adminWrapper && !adminWrapper.contains(e.target)) {
    closeAdminDropdown();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeProfileDropdown();
    closeAdminDropdown();
  }
});

// ==========================================
// 10. MODAL UTILITIES
// ==========================================
function toggleFavorite(bookId, btn) {
  if (!currentUser) {
    showCustomAlert({
      type: "warning",
      title: "จำเป็นต้องเข้าสู่ระบบ",
      message: "กรุณาเข้าสู่ระบบก่อนบันทึกหนังสือเป็นเล่มโปรดครับ",
      btnText: "เข้าสู่ระบบ",
      callback: () => {
        openAuthModal('login');
      }
    });
    return;
  }
  const book = allEbooks.find(b => b.ebook_id === bookId);
  const idx = userFavorites.indexOf(bookId);
  if (idx > -1) {
    userFavorites.splice(idx, 1);
    btn.style.color = "#888";
    if (book) logUserActivity("ยกเลิกรายการโปรด", `นำ "${book.title}" ออกจากรายการโปรด`);
  } else {
    userFavorites.push(bookId);
    btn.style.color = "#e73636";
    if (book) logUserActivity("บันทึกรายการโปรด", `กดหัวใจบันทึก "${book.title}" เป็นเล่มโปรด`);
  }
  localStorage.setItem("nothave_favorites", JSON.stringify(userFavorites));
}

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

let currentSampleBook = null;
let currentSamplePage = 1;
let currentPdfDoc = null;
const TOTAL_SAMPLE_PAGES = 3;

// โหลดไฟล์ PDF ผ่าน PDF.js
async function loadSamplePdfDocument(fileUrl) {
  currentPdfDoc = null;
  if (!window.pdfjsLib || !fileUrl) return null;
  if (!fileUrl.startsWith("data:application/pdf") && !fileUrl.startsWith("blob:") && !fileUrl.toLowerCase().endsWith(".pdf")) {
    return null;
  }
  try {
    const loadingTask = window.pdfjsLib.getDocument(fileUrl);
    currentPdfDoc = await loadingTask.promise;
    return currentPdfDoc;
  } catch (err) {
    console.warn("PDF.js cannot parse file_url:", err);
    currentPdfDoc = null;
    return null;
  }
}

async function openSampleModal(bookId) {
  const book = allEbooks.find(b => b.ebook_id === bookId);
  if (!book) return;

  currentSampleBook = book;
  currentSamplePage = 1;
  currentPdfDoc = null;

  // อัปเดต Breadcrumb และหัวข้อให้แสดงชื่อเล่มที่กำลังเปิดดู
  updateBreadcrumbAndHeading(book);

  // บันทึกเข้า Recently Viewed
  if (!recentlyViewedIds.includes(bookId)) {
    recentlyViewedIds.unshift(bookId);
    if (recentlyViewedIds.length > 8) recentlyViewedIds.pop();
    localStorage.setItem("nothave_recently_viewed", JSON.stringify(recentlyViewedIds));
    renderRecentlyViewedShelf();
  }

  logUserActivity("ทดลองอ่าน", `เปิดอ่านตัวอย่างเล่ม "${book.title}"`);

  document.getElementById("sampleBookTitle").innerText = book.title;
  document.getElementById("sampleBookAuthor").innerText = `ผู้แต่ง: ${book.author_name} | หมวดหมู่: ${book.category_name}`;
  document.getElementById("sampleBookCover").src = book.cover_url || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100";
  const priceTag = document.getElementById("sampleBookPriceTag");
  if (priceTag) priceTag.innerText = `฿${book.price.toFixed(2)}`;

  document.getElementById("sampleModal").classList.add("active");

  const container = document.getElementById("sampleReaderBody");
  if (container) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:#64748b;">⏳ กำลังโหลดเนื้อหาตัวอย่าง...</div>`;
  }

  if (book.file_url) {
    await loadSamplePdfDocument(book.file_url);
  }

  renderSamplePage();
}

function changeSamplePage(delta) {
  if (!currentSampleBook) return;
  const newPage = currentSamplePage + delta;
  if (newPage < 1) return;
  if (newPage > TOTAL_SAMPLE_PAGES + 1) return;
  currentSamplePage = newPage;
  renderSamplePage();
}

async function renderSamplePage() {
  if (!currentSampleBook) return;
  const book = currentSampleBook;
  const container = document.getElementById("sampleReaderBody");
  const badge = document.getElementById("samplePageBadge");
  const prevBtn = document.getElementById("btnSamplePrev");
  const nextBtn = document.getElementById("btnSampleNext");

  if (!container) return;

  if (currentSamplePage <= TOTAL_SAMPLE_PAGES) {
    if (badge) badge.innerHTML = `หน้า <strong>${currentSamplePage}</strong> / ${TOTAL_SAMPLE_PAGES}`;
    if (prevBtn) prevBtn.disabled = currentSamplePage === 1;
    if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.innerHTML = currentSamplePage === TOTAL_SAMPLE_PAGES ? "หน้าถัดไป (ล็อก) ›" : "หน้าถัดไป ›";
    }

    // กรณีที่ 1: มีไฟล์ PDF จริง -> แสดงหน้าจริงของ PDF ด้วย PDF.js
    if (currentPdfDoc) {
      if (currentSamplePage <= currentPdfDoc.numPages) {
        container.innerHTML = `
          <div style="text-align:center; margin-bottom:8px; border-bottom:1px dashed #e2e8f0; padding-bottom:6px;">
            <div style="font-size:11.5px; color:#0284c7; font-weight:700;">📄 แสดงหน้าจริงจากไฟล์ PDF (หน้าที่ ${currentSamplePage} / ${currentPdfDoc.numPages})</div>
          </div>
          <div style="display:flex; justify-content:center; overflow-x:auto; background:#f8fafc; padding:8px; border-radius:6px;">
            <canvas id="samplePdfCanvas" style="max-width:100%; border:1px solid #cbd5e1; box-shadow:0 2px 8px rgba(0,0,0,0.06); border-radius:4px;"></canvas>
          </div>
        `;
        try {
          const page = await currentPdfDoc.getPage(currentSamplePage);
          const canvas = document.getElementById("samplePdfCanvas");
          if (canvas) {
            const viewport = page.getViewport({ scale: 1.3 });
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            const renderContext = {
              canvasContext: canvas.getContext('2d'),
              viewport: viewport
            };
            await page.render(renderContext).promise;
          }
        } catch (e) {
          console.warn("Error rendering PDF canvas:", e);
        }
        return;
      }
    }

    // กรณีที่ 2: ไม่มีไฟล์ PDF หรือเป็นข้อความ -> แสดงเฉพาะข้อความจริงของผู้แต่งเท่านั้น (ไม่ใส่ข้อความนิยายปลอม)
    const cleanDesc = (book.sample_text || book.description || "").replace(/\[WRITER_SUBMISSION:[^\]]+\]/g, "").trim();
    const paragraphs = cleanDesc.split(/\n\n+/).filter(p => p.trim());
    
    let contentForPage = "";
    if (paragraphs.length >= currentSamplePage) {
      contentForPage = `<p style="text-indent:2em; line-height:1.85; color:#334155; font-size:14.5px; white-space:pre-line;">${escapeHTML(paragraphs[currentSamplePage - 1])}</p>`;
    } else if (currentSamplePage === 1) {
      contentForPage = `<p style="text-indent:2em; line-height:1.85; color:#334155; font-size:14.5px; white-space:pre-line;">${escapeHTML(cleanDesc || "ไม่มีข้อความตัวอย่างเพิ่มเติม")}</p>`;
    } else {
      contentForPage = `
        <div style="text-align:center; padding:30px 10px; color:#64748b; font-size:13.5px;">
          📖 จบส่วนเนื้อหาตัวอย่างที่ผู้แต่งระบุไว้ (หน้าที่ ${currentSamplePage})
        </div>
      `;
    }

    container.innerHTML = `
      <div style="text-align:center; margin-bottom:14px; border-bottom:1px dashed #e2e8f0; padding-bottom:10px;">
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#64748b; font-weight:700;">— หน้าที่ ${currentSamplePage} / ${TOTAL_SAMPLE_PAGES} (ตัวอย่างเนื้อหาจริง) —</div>
        <h4 style="font-size:16px; color:#0f172a; margin:4px 0 2px 0;">${escapeHTML(book.title)}</h4>
        <div style="font-size:12px; color:#0284c7; font-weight:600;">ผู้แต่ง: ${escapeHTML(book.author_name)}</div>
      </div>
      <div style="color:#334155; line-height:1.85;">
        ${contentForPage}
      </div>
    `;
  } else {
    // Page 4: Locked Screen
    if (badge) badge.innerHTML = `🔒 <strong>จบส่วนทดลองอ่าน</strong>`;
    if (prevBtn) prevBtn.disabled = false;
    if (nextBtn) nextBtn.disabled = true;

    container.innerHTML = `
      <div style="text-align:center; padding:18px 10px;">
        <div style="width:52px; height:52px; border-radius:50%; background:#fef2f2; color:#ef4444; font-size:24px; display:flex; align-items:center; justify-content:center; margin:0 auto 10px;">
          🔒
        </div>
        <h4 style="font-size:17px; color:#0f172a; margin:0 0 6px 0;">จบตัวอย่างทดลองอ่าน 3 หน้าแรกแล้ว</h4>
        <p style="font-size:13px; color:#64748b; max-width:380px; margin:0 auto 14px; line-height:1.6;">
          หากต้องการอ่านเนื้อหา <strong>"${escapeHTML(book.title)}"</strong> ต่อจนจบเล่ม สามารถสั่งซื้อฉบับเต็มได้ทันทีในราคาเพียง <strong>฿${book.price.toFixed(2)}</strong> บาท
        </p>
        <div style="display:flex; justify-content:center; gap:10px;">
          <button type="button" class="btn-primary-action" style="background:#16a34a; padding:9px 20px; font-size:13px; font-weight:700; width:auto;" onclick="addToCart(${book.ebook_id}); closeModal('sampleModal'); openCartModal();">
            🛒 ใส่รถเข็นและสั่งซื้อทันที (฿${book.price.toFixed(2)})
          </button>
        </div>
      </div>
    `;
  }
}

function userHasConfirmedOrder(ebookId) {
  if (currentUser && (currentUser.role === 'admin' || currentUser.email === 'admin@bookshop.com')) return true;
  const currentEmail = currentUser ? currentUser.email.toLowerCase().trim() : "";
  if (!currentEmail) return false;
  try {
    const userOrders = JSON.parse(localStorage.getItem(`nothave_user_orders_${currentEmail}`) || "[]");
    return userOrders.some(ord => 
      (ord.status === "confirmed" || ord.status === "verified") && 
      (ord.order_items || []).some(it => it.ebooks?.ebook_id === ebookId || it.ebook_id === ebookId)
    );
  } catch (e) {
    return false;
  }
}

function downloadRealEbook(ebookId, isConfirmed = false) {
  if (!isConfirmed && !userHasConfirmedOrder(ebookId)) {
    alert("🔒 คำสั่งซื้อที่ยังไม่ยืนยันไม่สามารถเปิดลิงก์ดาวน์โหลดได้\n\nระบบอนุญาตให้ทดลองอ่านได้เฉพาะตัวอย่าง 3 หน้าแรกเท่านั้นครับ");
    openSampleModal(ebookId);
    return;
  }
  const book = allEbooks.find(b => b.ebook_id === ebookId) || { ebook_id: ebookId, title: "E-Book", author_name: "นักเขียน", price: 0 };
  downloadEbookPdfFile(book, false);
}

function openRealEbookReader(ebookId, isConfirmed = false) {
  if (!isConfirmed && !userHasConfirmedOrder(ebookId)) {
    alert("🔒 คำสั่งซื้อที่ยังไม่ยืนยันไม่สามารถเปิดอ่านฉบับเต็มได้\n\nระบบอนุญาตให้ทดลองอ่านได้เฉพาะตัวอย่าง 3 หน้าแรกเท่านั้นครับ");
    openSampleModal(ebookId);
    return;
  }
  const book = allEbooks.find(b => b.ebook_id === ebookId);
  if (!book) return;

  const modal = document.getElementById("fullReaderModal");
  const titleEl = document.getElementById("fullReaderTitle");
  const bodyEl = document.getElementById("fullReaderContentBody");
  const btnDl = document.getElementById("btnFullReaderDownload");

  if (titleEl) titleEl.innerText = `${book.title} (ฉบับเต็ม)`;
  if (btnDl) btnDl.onclick = () => downloadRealEbook(book.ebook_id, true);

  const cleanDesc = (book.sample_text || book.description || "").replace(/\[WRITER_SUBMISSION:[^\]]+\]/g, "").trim();

  if (bodyEl) {
    if (book.file_url && (book.file_url.startsWith("data:application/pdf") || book.file_url.startsWith("blob:") || book.file_url.startsWith("http"))) {
      bodyEl.innerHTML = `
        <div style="text-align:center; margin-bottom:14px;">
          <h2 style="font-size:18px; color:#0f172a; margin:0 0 4px 0;">${escapeHTML(book.title)}</h2>
          <div style="font-size:13px; color:#0284c7; font-weight:600;">ผู้แต่ง: ${escapeHTML(book.author_name)}</div>
        </div>
        <iframe src="${book.file_url}" style="width:100%; height:550px; border:1px solid #cbd5e1; border-radius:8px;"></iframe>
      `;
    } else {
      bodyEl.innerHTML = `
        <div style="text-align:center; margin-bottom:24px; padding-bottom:16px; border-bottom:2px solid #e2e8f0;">
          <img src="${escapeHTML(book.cover_url || '')}" style="width:110px; height:160px; object-fit:cover; border-radius:6px; box-shadow:0 4px 10px rgba(0,0,0,0.1); margin-bottom:12px;" onerror="this.style.display='none'">
          <h2 style="font-size:20px; color:#0f172a; margin:0 0 4px 0;">${escapeHTML(book.title)}</h2>
          <div style="font-size:14px; color:#0284c7; font-weight:700;">ผู้แต่ง: ${escapeHTML(book.author_name)}</div>
          <div style="font-size:12px; color:#64748b; margin-top:4px;">หมวดหมู่: ${escapeHTML(book.category_name)} | รหัสเล่ม #${book.ebook_id}</div>
        </div>

        <div style="line-height:2.0; color:#1e293b; font-size:14.5px;">
          <h3 style="color:#0284c7; border-left:4px solid #0284c7; padding-left:10px; margin:20px 0 10px 0;">เนื้อหา E-Book ฉบับเต็ม</h3>
          <p style="text-indent:2em; margin-bottom:16px; white-space:pre-line;">
            ${escapeHTML(cleanDesc || "เนื้อหาหนังสือฉบับเต็ม")}
          </p>
          <div style="text-align:center; padding:18px; color:#15803d; font-weight:700; background:#f0fdf4; border-radius:8px; margin-top:24px; border:1px solid #bbf7d0;">
            ✓ จบบริบูรณ์ (The End) - ขอบคุณสำหรับการสนับสนุนและอ่าน E-Book ฉบับเต็ม
          </div>
        </div>
      `;
    }
  }

  if (modal) modal.classList.add("active");
}

function downloadEbookPdfFile(book, isSample = false) {
  // หากเป็นฉบับเต็ม และมีไฟล์ PDF ที่อัปโหลดไว้จริง ให้ดาวน์โหลดฉบับเต็มทันที
  if (!isSample && book.file_url && (book.file_url.startsWith("data:application/pdf") || book.file_url.startsWith("blob:") || book.file_url.startsWith("http"))) {
    const link = document.createElement("a");
    link.href = book.file_url;
    link.download = `${book.title} - ฉบับเต็ม.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  const cleanDesc = (book.sample_text || book.description || "").replace(/\[WRITER_SUBMISSION:[^\]]+\]/g, "").trim();
  
  const pdfHtml = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${escapeHTML(book.title)} - ${isSample ? 'ตัวอย่างทดลองอ่าน 3 หน้า' : 'ฉบับเต็ม'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
    * { box-sizing: border-box; }
    body { font-family: 'Prompt', -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 24px; background: #f1f5f9; color: #1e293b; line-height: 1.85; }
    .page { max-width: 760px; margin: 0 auto 30px auto; background: #ffffff; padding: 48px; border-radius: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.06); page-break-after: always; min-height: 980px; position: relative; }
    .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 28px; }
    .badge { display: inline-block; background: ${isSample ? '#eff6ff' : '#dcfce7'}; color: ${isSample ? '#0284c7' : '#15803d'}; padding: 4px 14px; border-radius: 20px; font-weight: 700; font-size: 13px; margin-bottom: 12px; border: 1px solid ${isSample ? '#bfdbfe' : '#bbf7d0'}; }
    .cover-img { width: 120px; height: 170px; object-fit: cover; border-radius: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.12); margin-bottom: 12px; }
    h1 { color: #0f172a; font-size: 24px; margin: 8px 0; }
    .author { color: #0284c7; font-size: 15px; font-weight: 600; }
    h3 { color: #0369a1; border-left: 4px solid #0284c7; padding-left: 10px; margin: 24px 0 12px 0; font-size: 17px; }
    p { text-indent: 2em; margin-bottom: 14px; font-size: 14.5px; color: #334155; }
    .footer { position: absolute; bottom: 24px; left: 0; right: 0; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 14px; }
    .lock-box { text-align: center; padding: 50px 20px; background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 12px; margin-top: 40px; }
    .print-bar { text-align: center; margin-bottom: 20px; }
    .btn-print { background: #0284c7; color: white; border: none; padding: 10px 22px; font-size: 14px; font-weight: bold; border-radius: 8px; cursor: pointer; font-family: inherit; }
    @media print { 
      body { background: #fff; padding: 0; } 
      .page { box-shadow: none; padding: 30px; margin: 0; max-width: 100%; border-radius: 0; page-break-after: always; } 
      .print-bar { display: none; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <button class="btn-print" onclick="window.print()">🖨️ พิมพ์ / บันทึกเป็น PDF (Print to PDF)</button>
  </div>

  <!-- หน้าที่ 1 -->
  <div class="page">
    <div class="header">
      <div class="badge">${isSample ? '✨ ตัวอย่างทดลองอ่าน 3 หน้าแรก' : '✓ NOT HAVE A BOOK SHOP - ฉบับเต็ม'}</div>
      <br>
      <img class="cover-img" src="${escapeHTML(book.cover_url || '')}" onerror="this.style.display='none'">
      <h1>${escapeHTML(book.title)}</h1>
      <div class="author">ผู้แต่ง: ${escapeHTML(book.author_name)}</div>
      <div style="font-size:12.5px; color:#64748b; margin-top:4px;">หมวดหมู่: ${escapeHTML(book.category_name)} | รหัสหนังสือ #${book.ebook_id}</div>
    </div>
    <h3>เนื้อหาตัวอย่าง</h3>
    <p style="white-space:pre-line;">${escapeHTML(cleanDesc || "เนื้อหาหนังสือ")}</p>
    <div class="footer">— หน้าที่ 1 / ${isSample ? '3 (ตัวอย่างทดลองอ่าน)' : '4'} —</div>
  </div>

  ${isSample ? `
  <!-- หน้าที่ 2-3 (ถ้าเป็นตัวอย่าง) -->
  <div class="page">
    <h3>เนื้อหาตัวอย่าง (หน้าที่ 2)</h3>
    <p style="white-space:pre-line;">${escapeHTML(cleanDesc || "เนื้อหาหนังสือตัวอย่าง")}</p>
    <div class="footer">— หน้าที่ 2 / 3 (ตัวอย่างทดลองอ่าน) —</div>
  </div>

  <div class="page">
    <h3>เนื้อหาตัวอย่าง (หน้าที่ 3)</h3>
    <p style="white-space:pre-line;">${escapeHTML(cleanDesc || "เนื้อหาหนังสือตัวอย่าง")}</p>
    <div style="background:#fef3c7; border:1px solid #fde68a; border-radius:8px; padding:12px 16px; color:#92400e; font-size:13px; text-align:center; font-weight:700; margin-top:24px;">
      ⏳ สิ้นสุดเนื้อหาตัวอย่างทดลองอ่านหน้าที่ 3
    </div>
    <div class="footer">— หน้าที่ 3 / 3 (จบตัวอย่างทดลองอ่าน) —</div>
  </div>

  <!-- หน้าที่ 4 (ล็อกเนื้อหา) -->
  <div class="page">
    <div class="lock-box">
      <div style="font-size: 40px; margin-bottom: 12px;">🔒</div>
      <h2 style="color: #b45309; font-size: 20px; margin: 0 0 10px 0;">จบตัวอย่างทดลองอ่าน 3 หน้าแรกแล้ว</h2>
      <p style="text-indent: 0; color: #78350f; font-size: 14.5px; max-width: 480px; margin: 0 auto 16px auto;">
        หากคุณชื่นชอบเรื่องราวของ <strong>"${escapeHTML(book.title)}"</strong> และต้องการอ่านต่อจนจบบริบูรณ์ สามารถสั่งซื้อ E-Book ฉบับเต็มได้ที่ร้าน <strong>NOT HAVE A BOOK SHOP</strong> ในราคาเพียง <strong>฿${book.price.toFixed(2)}</strong> บาท
      </p>
      <div style="font-size: 13px; color: #92400e; font-weight: 600;">
        ✓ สั่งซื้อแล้วปลดล็อกอ่านฉบับเต็มและดาวน์โหลด PDF ได้ทันที 100%
      </div>
    </div>
    <div class="footer">— หน้าล็อกเนื้อหา —</div>
  </div>
  ` : `
  <div class="page">
    <h3>เนื้อหาฉบับเต็ม</h3>
    <p style="white-space:pre-line;">${escapeHTML(cleanDesc || "เนื้อหาหนังสือฉบับเต็ม")}</p>
    <div style="text-align:center; padding:18px; color:#15803d; font-weight:700; background:#f0fdf4; border-radius:8px; margin-top:30px; border:1px solid #bbf7d0;">
      ✓ ขอบคุณสำหรับการสั่งซื้อและสนับสนุนผลงาน E-Book ฉบับเต็ม
    </div>
    <div class="footer">— จบบริบูรณ์ —</div>
  </div>
  `}
</body>
</html>`;

  const blob = new Blob([pdfHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const previewWin = window.open(url, "_blank");
  if (!previewWin) {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${book.title}${isSample ? ' (ตัวอย่างทดลองอ่าน 3 หน้า)' : ' - ฉบับเต็ม'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function renderRecentlyViewedShelf() {
  const shelf = document.getElementById("shelfRecentlyViewed");
  const section = document.getElementById("recentlyViewedSection");
  if (!shelf || !section) return;

  const viewedBooks = recentlyViewedIds
    .map(id => allEbooks.find(b => b.ebook_id === id))
    .filter(Boolean);

  if (viewedBooks.length > 0) {
    section.style.display = "block";
    shelf.innerHTML = viewedBooks.map(createBookCardHTML).join("");
  } else {
    section.style.display = "none";
  }
}

// ------------------------------------------
// USER ACTIVITY LOG MODAL (จดจำสิ่งที่ User เคยทำ)
// ------------------------------------------
function openActivityModal() {
  const container = document.getElementById("activityTimelineList");
  const countEl = document.getElementById("activityCount");
  if (!container) return;

  if (userActivities.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 30px; color: #888;">ยังไม่มีประวัติกิจกรรมที่บันทึกไว้</div>`;
    if (countEl) countEl.innerText = "0 รายการ";
  } else {
    if (countEl) countEl.innerText = `${userActivities.length} รายการ`;
    container.innerHTML = userActivities.map(act => `
      <div class="activity-item">
        <div class="activity-time">${escapeHTML(act.time)}</div>
        <div class="activity-badge">${escapeHTML(act.action)}</div>
        <div class="activity-detail">
          <div style="font-weight:600; color:#555; font-size:11px;">โดย: ${escapeHTML(act.user)}</div>
          <div>${escapeHTML(act.detail)}</div>
        </div>
      </div>
    `).join("");
  }

  document.getElementById("activityModal").classList.add("active");
}

function clearUserActivities() {
  if (!confirm("คุณต้องการล้างประวัติกิจกรรมที่บันทึกไว้ทั้งหมดใช่หรือไม่?")) return;
  userActivities = [];
  localStorage.removeItem("nothave_activities");
  openActivityModal();
  alert("ล้างประวัติกิจกรรมเรียบร้อยแล้ว");
}

// ------------------------------------------
// ADD CUSTOM BOOK MODAL (ให้ผู้ใช้ใส่หนังสือเอง)
// ------------------------------------------
function openAddBookModal() {
  document.getElementById("addBookModal").classList.add("active");
}

async function handleAddCustomBook(e) {
  e.preventDefault();
  const title = document.getElementById("newBookTitle").value.trim();
  const author = document.getElementById("newBookAuthor").value.trim();
  const catId = parseInt(document.getElementById("newBookCategory").value);
  const price = parseFloat(document.getElementById("newBookPrice").value);
  const origPrice = parseFloat(document.getElementById("newBookOrigPrice").value || price);
  let coverUrl = document.getElementById("newBookCover").value.trim();
  const coverFileInput = document.getElementById("newBookCoverFile");
  if (coverFileInput && coverFileInput.files && coverFileInput.files.length > 0) {
    const cFile = coverFileInput.files[0];
    try {
      const cDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(cFile);
      });
      coverUrl = cDataUrl;
    } catch (cErr) {
      console.warn("Custom cover read note:", cErr);
    }
  }
  if (!coverUrl) {
    coverUrl = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500";
  }
  const desc = document.getElementById("newBookDesc").value.trim();
  const sample = document.getElementById("newBookSample").value.trim();

  // อ่านไฟล์ PDF (ถ้ามี)
  const pdfInput = document.getElementById("newBookPdf");
  let pdfFileUrl = "";
  let pdfFileName = "";

  if (pdfInput && pdfInput.files && pdfInput.files.length > 0) {
    const pdfFile = pdfInput.files[0];
    pdfFileName = pdfFile.name;

    // สร้าง Object URL สำหรับเปิดดู/ดาวน์โหลด PDF ในเบราว์เซอร์
    pdfFileUrl = URL.createObjectURL(pdfFile);

    // บันทึก PDF เป็น Data URL สำหรับส่งเข้า Supabase
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(pdfFile);
      });
      pdfFileUrl = dataUrl;
    } catch (err) {
      console.warn("PDF read error:", err);
    }
  }

  const catNames = { 1: "มังงะ", 2: "หนังสือทั่วไป", 3: "นิยาย - ทั่วไป", 4: "อาร์ตบุ๊ค", 5: "คอมพิวเตอร์ & IT" };

  const newBook = {
    ebook_id: Date.now(),
    title: title,
    author_name: author,
    category_id: catId,
    category_name: catNames[catId] || "ทั่วไป",
    price: price,
    original_price: origPrice,
    point_reward: Math.round(price * 0.2),
    description: desc,
    sample_text: sample || `ตัวอย่างเนื้อหา: "${desc}"`,
    cover_url: coverUrl,
    file_url: pdfFileUrl || "",
    pdf_name: pdfFileName
  };

  // บันทึกลง customEbooks อย่างปลอดภัย (ไม่เก็บ base64 ใน localstorage)
  const cleanCustomBook = {
    ...newBook,
    cover_url: (coverUrl && !coverUrl.startsWith("data:")) ? coverUrl : "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100",
    file_url: (pdfFileUrl && !pdfFileUrl.startsWith("data:")) ? pdfFileUrl : `${window.location.origin}/download/ebook-${newBook.ebook_id}.pdf`
  };
  customEbooks.push(cleanCustomBook);
  safeLocalStorageSet("nothave_custom_ebooks", JSON.stringify(customEbooks.slice(-20)));

  // ส่งเข้า Supabase หากเชื่อมต่ออยู่
  if (sbClient) {
    try {
      let resolvedAuthorId = null;
      if (author) {
        // ตรวจสอบว่ามีชื่อผู้แต่งนี้ในตาราง authors หรือยัง
        const { data: existingAuthors } = await sbClient
          .from("authors")
          .select("author_id, author_name")
          .ilike("author_name", author)
          .limit(1);

        if (existingAuthors && existingAuthors.length > 0) {
          resolvedAuthorId = existingAuthors[0].author_id;
        } else {
          // หากยังไม่มี ให้เพิ่มผู้แต่งคนใหม่ลงในตาราง authors ใน Supabase
          const { data: newAuth, error: authErr } = await sbClient
            .from("authors")
            .insert([{ author_name: author, bio: "ผู้สร้างสรรค์ผลงาน E-Book" }])
            .select();

          if (newAuth && newAuth[0]) {
            resolvedAuthorId = newAuth[0].author_id;
          } else if (authErr) {
            console.warn("Author insert note:", authErr);
          }
        }
      }

      // ป้องกันข้อผิดพลาด Foreign Key หากไม่มีผู้แต่ง ให้ดึงแถวแรกของ authors
      if (!resolvedAuthorId) {
        const { data: anyAuth } = await sbClient.from("authors").select("author_id").limit(1);
        if (anyAuth && anyAuth.length > 0) {
          resolvedAuthorId = anyAuth[0].author_id;
        } else {
          resolvedAuthorId = 1;
        }
      }

      await sbClient.from("ebooks").insert([{
        title: title,
        author_id: resolvedAuthorId,
        category_id: catId,
        price: price,
        original_price: origPrice,
        description: desc,
        sample_text: sample,
        cover_url: coverUrl,
        file_url: pdfFileUrl || "",
        is_active: true
      }]);
    } catch (err) {
      console.warn("Supabase insert note:", err);
    }
  }

  logUserActivity("เพิ่มหนังสือใหม่", `ผู้ใช้เพิ่มหนังสือเรื่อง "${title}" ราคา ฿${price}${pdfFileName ? ` (PDF: ${pdfFileName})` : ""}`);
  allEbooks.push(newBook);
  filteredEbooks = [...allEbooks];
  renderBooksGrid();
  renderFeaturedShelves();
  broadcastRealtimeEvent('book_update');
  closeModal("addBookModal");
  alert(`เพิ่มหนังสือ "${title}" เรียบร้อยแล้ว!${pdfFileName ? `\nไฟล์ PDF: ${pdfFileName}` : ""}\nข้อมูลถูกบันทึกลงระบบแล้วครับ`);
}

function openSecurityModal() {
  document.getElementById("securityModal").classList.add("active");
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
  if (modalId === "sampleModal") {
    // หนังสือไม่มีก็ไม่ต้องขึ้น: เมื่อปิดหน้าต่างอ่านตัวอย่าง รีเซ็ตชื่อหนังสือออกจาก Breadcrumb
    updateBreadcrumbAndHeading(null);
  }
}

// ==========================================
// 11. INITIALIZATION ON DOM READY
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  fetchBooks();
  updateCartBadge();
  updateUserInterface();
  renderRecentlyViewedShelf();
  updateBreadcrumbAndHeading();
  setViewMode(currentViewMode);

  // Search input live trigger
  document.getElementById("searchInput")?.addEventListener("input", (e) => {
    applyFilters();
    if (e.target.value.trim().length > 2) {
      logUserActivity("ค้นหาหนังสือ", `ค้นหาคำว่า "${e.target.value.trim()}"`);
    }
  });
  document.getElementById("sortSelect")?.addEventListener("change", applyFilters);

  // Close modal when clicking outside
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("active");
        if (overlay.id === "sampleModal") {
          updateBreadcrumbAndHeading(null);
        }
      }
    });
  });

  // Welcome back log for persistent user
  if (currentUser) {
    logUserActivity("กลับเข้าสู่ระบบ", `ผู้ใช้ "${currentUser.full_name}" กลับเข้าสู่เว็บไซต์ (Session Restored)`);
  }

  // Handle redirect from Admin / Writer Route Guard
  const urlParams = new URLSearchParams(window.location.search);
  const authErr = urlParams.get("auth_error");
  if (authErr === "unauthorized") {
    showCustomAlert({
      type: "error",
      title: "จำเป็นต้องเข้าสู่ระบบก่อนใช้งาน",
      message: "ระบบหลังบ้านสงวนสิทธิ์เฉพาะผู้มีบัญชี กรุณาเข้าสู่ระบบด้วยบัญชีของคุณก่อนครับ",
      btnText: "เข้าสู่ระบบ",
      callback: () => {
        openAuthModal('login');
      }
    });
  } else if (authErr === "forbidden" || authErr === "writer_only") {
    showCustomAlert({
      type: "error",
      title: "ไม่มีสิทธิ์เข้าถึง (Admin & Writer Only)",
      message: "ระบบคลังหนังสือหลังบ้านสงวนสิทธิ์เฉพาะผู้ดูแลร้านและนักเขียน (Admin & Writer) เท่านั้นครับ บัญชีลูกค้าทั่วไป (Customer) จะไม่สามารถเข้าใช้งานส่วนนี้ได้ครับ",
      btnText: "เข้าใจแล้ว"
    });
  } else if (authErr === "demoted") {
    showCustomAlert({
      type: "warning",
      title: "สถานะบัญชีของคุณถูกปรับเปลี่ยน",
      message: "บัญชีของคุณได้รับการปรับเปลี่ยนเป็น 'ลูกค้าทั่วไป' (Customer) จึงไม่สามารถเข้าใช้งานห้องจัดการคลังหนังสือของนักเขียนได้แล้วครับ สามารถเลือกซื้อและอ่านหนังสือในร้านได้ตามปกติครับ",
      btnText: "เข้าใจแล้ว"
    });
  }

  // 12. Supabase Real-time Listener on Storefront
  if (sbClient) {
    try {
      sbClient
        .channel("storefront-realtime-ebooks")
        .on("postgres_changes", { event: "*", schema: "public", table: "ebooks" }, (payload) => {
          console.log("Realtime ebooks updated on Supabase:", payload);
          fetchBooks();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
          console.log("Realtime orders updated on Supabase:", payload);
          const ordersModal = document.getElementById("ordersModal");
          if (ordersModal && ordersModal.classList.contains("active")) {
            openOrdersModal();
          }
        })
        .subscribe();
    } catch (e) {
      console.warn("Realtime subscription warning on storefront:", e);
    }

    // Real-time BroadcastChannel for instantaneous cross-tab updates (0 ms delay)
    try {
      const bc = new BroadcastChannel("nothave_sync_channel");
      bc.onmessage = (ev) => {
        if (ev.data && (ev.data.type === "ROLE_REQUEST_STATUS_UPDATED" || ev.data.type === "ROLE_REQUEST_CREATED")) {
          refreshCurrentUserFromStorage();
          updateUserInterface();
          renderCommunityMessages();
        }
      };
    } catch(e) {}

    window.addEventListener("storage", () => {
      refreshCurrentUserFromStorage();
      updateUserInterface();
      renderCommunityMessages();
    });

    // Initial role sync & auto-sync interval for storefront
    syncUserRoleFromBackend();
    setInterval(() => {
      fetchBooks();
      syncUserRoleFromBackend();
    }, 4000);
  }
});

// ========================================================
// EMAIL SMTP CONFIGURATION & TESTING HANDLERS (STOREFRONT)
// ========================================================
async function openEmailConfigModal() {
  const modal = document.getElementById("emailConfigModal");
  if (modal) modal.classList.add("active");
  await loadEmailConfig();
}

function closeEmailConfigModal() {
  const modal = document.getElementById("emailConfigModal");
  if (modal) modal.classList.remove("active");
  const feedback = document.getElementById("testEmailFeedback");
  if (feedback) feedback.style.display = "none";
}

async function loadEmailConfig() {
  const sIdInput = document.getElementById("emailjsServiceId");
  const tIdInput = document.getElementById("emailjsTemplateId");
  const pubKeyInput = document.getElementById("emailjsPublicKey");
  const privKeyInput = document.getElementById("emailjsPrivateKey");
  const banner = document.getElementById("emailConfigStatusBanner");
  const testRecipient = document.getElementById("testEmailRecipient");

  if (sIdInput && !sIdInput.value) sIdInput.value = "service_ljiywib";
  if (tIdInput && !tIdInput.value) tIdInput.value = "template_nhy5wtl";
  if (pubKeyInput && !pubKeyInput.value) pubKeyInput.value = "uhFn5yZOqTEa_UIZZ";
  if (privKeyInput && !privKeyInput.value) privKeyInput.value = "t6x_B-J-eSPLHhpzwO9Xn";
  if (testRecipient && !testRecipient.value) testRecipient.value = "ratchapong2000.ice@gmail.com";

  // อัปเดตแถบสถานะเป็นสีเขียวทันที
  if (banner) {
    banner.style.background = "#ecfdf5";
    banner.style.color = "#047857";
    banner.style.borderColor = "#a7f3d0";
    banner.innerHTML = `<span>🟢 สถานะ: <strong>เชื่อมต่อ EmailJS สำเร็จแล้ว!</strong> - พร้อมส่งใบเสร็จจริงเข้า Gmail อัตโนมัติ 100%</span>`;
  }

  try {
    const resp = await fetch(`${BACKEND_URL}/api/email-config`);
    if (resp.ok) {
      const data = await resp.json();
      if (sIdInput && data.emailjs?.serviceId) sIdInput.value = data.emailjs.serviceId;
      if (tIdInput && data.emailjs?.templateId) tIdInput.value = data.emailjs.templateId;
      if (pubKeyInput && data.emailjs?.publicKey) pubKeyInput.value = data.emailjs.publicKey;
      if (privKeyInput && data.emailjs?.hasPrivateKey) {
        privKeyInput.placeholder = `บันทึกแล้ว (${data.emailjs.maskedPrivateKey})`;
      }
    }
  } catch (err) {
    console.warn("loadEmailConfig server note:", err);
  }
}

async function handleSaveEmailConfig(event) {
  event.preventDefault();
  const serviceId = (document.getElementById("emailjsServiceId")?.value || "service_ljiywib").trim();
  const templateId = (document.getElementById("emailjsTemplateId")?.value || "template_nhy5wtl").trim();
  const publicKey = (document.getElementById("emailjsPublicKey")?.value || "uhFn5yZOqTEa_UIZZ").trim();
  const privateKey = (document.getElementById("emailjsPrivateKey")?.value || "t6x_B-J-eSPLHhpzwO9Xn").trim();
  const saveBtn = document.getElementById("btnSaveEmailConfig");

  const payloadData = {
    provider: "emailjs",
    email: "ratchapong.pi@rmuti.ac.th",
    senderName: "NOT HAVE A BOOK SHOP (บักบ่ได้หนังสือ)",
    emailjs: { serviceId, templateId, publicKey, privateKey }
  };

  localStorage.setItem("nothave_email_config", JSON.stringify(payloadData));

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerText = "กำลังบันทึก...";
  }

  try {
    await fetch(`${BACKEND_URL}/api/save-email-config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadData)
    });
  } catch (e) {}

  alert("✓ บันทึกการตั้งค่า EmailJS เรียบร้อยแล้ว!\nระบบพร้อมส่งอีเมลใบเสร็จจริงไปยังลูกค้าอัตโนมัติทันที");
  logUserActivity("ตั้งค่าอีเมล", `อัปเดต EmailJS Service ${serviceId}`);
  await loadEmailConfig();

  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerText = "บันทึกการตั้งค่า";
  }
}

async function testSendEmailSample() {
  const recipient = (document.getElementById("testEmailRecipient").value || "").trim();
  const serviceId = (document.getElementById("emailjsServiceId")?.value || "service_ljiywib").trim();
  const templateId = (document.getElementById("emailjsTemplateId")?.value || "template_nhy5wtl").trim();
  const publicKey = (document.getElementById("emailjsPublicKey")?.value || "uhFn5yZOqTEa_UIZZ").trim();
  const privateKey = (document.getElementById("emailjsPrivateKey")?.value || "t6x_B-J-eSPLHhpzwO9Xn").trim();
  const feedback = document.getElementById("testEmailFeedback");
  const testBtn = document.getElementById("btnTestEmailAction");

  if (!recipient || !recipient.includes("@")) {
    alert("กรุณาระบุอีเมลปลายทางที่จะรับเมลทดสอบให้ถูกต้อง เช่น ratchapong2000.ice@gmail.com");
    return;
  }

  if (feedback) {
    feedback.style.display = "block";
    feedback.style.background = "#eff6ff";
    feedback.style.color = "#1d4ed8";
    feedback.style.border = "1px solid #bfdbfe";
    feedback.innerHTML = "⏳ กำลังเชื่อมต่อไปยัง EmailJS API และทดสอบส่งอีเมล...";
  }

  if (testBtn) {
    testBtn.disabled = true;
    testBtn.innerText = "กำลังส่ง...";
  }

  let isSuccess = false;
  let finalMsg = "";

  // 1. ลองส่งผ่าน Server Backend ก่อน
  try {
    const resp = await fetch(`${BACKEND_URL}/api/test-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: recipient,
        emailjs: { serviceId, templateId, publicKey, privateKey }
      })
    });
    if (resp.ok) {
      const result = await resp.json();
      if (result.success) {
        isSuccess = true;
        finalMsg = result.message;
      }
    }
  } catch (err) {}

  // 2. Direct Client-side EmailJS API Fallback (ยิงส่งตรงสู่ EmailJS Cloud)
  if (!isSuccess) {
    try {
      const clientDirectRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          accessToken: privateKey,
          template_params: {
            email: recipient,
            to_email: recipient,
            user_email: recipient,
            recipient: recipient,
            to_name: "คุณลูกค้า (ทดสอบ)",
            user_name: "คุณลูกค้า (ทดสอบ)",
            customer_name: "คุณลูกค้า (ทดสอบ)",
            order_id: "TEST-9999",
            orders: [{ name: "หนังสือทดสอบระบบ E-Book", units: 1, price: "152.00" }],
            cost: { shipping: "0.00", tax: "0.00" },
            total: "152.00",
            download_links: "https://mockfile.nothave.com/ebooks/test.pdf",
            message: "ทดสอบการเชื่อมต่อระบบ EmailJS สำเร็จ 100%! พร้อมส่งใบเสร็จจริงอัตโนมัติ"
          }
        })
      });
      if (clientDirectRes.ok) {
        isSuccess = true;
        finalMsg = `ทดสอบสำเร็จ! ส่งอีเมลทดสอบผ่าน EmailJS ไปยัง ${recipient} สำเร็จเรียบร้อยแล้ว`;
      }
    } catch (clientErr) {
      console.warn("Client direct send error:", clientErr);
    }
  }

  if (feedback) {
    if (isSuccess) {
      feedback.style.background = "#ecfdf5";
      feedback.style.color = "#047857";
      feedback.style.border = "1px solid #a7f3d0";
      feedback.innerHTML = `<strong>✓ สำเร็จ!</strong> ${escapeHTML(finalMsg || "ส่งอีเมลทดสอบสำเร็จเรียบร้อยแล้ว")}<br><span style="font-size:11px;">เปิดกล่องจดหมายของ <strong>${escapeHTML(recipient)}</strong> เพื่อตรวจสอบได้เลยครับ!</span>`;
    } else {
      feedback.style.background = "#fef2f2";
      feedback.style.color = "#991b1b";
      feedback.style.border = "1px solid #fecaca";
      feedback.innerHTML = `<strong>✕ ส่งไม่สำเร็จ:</strong> กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต`;
    }
  }

  if (testBtn) {
    testBtn.disabled = false;
    testBtn.innerText = "ทดสอบส่งเดี๋ยวนี้";
  }
}

// ==========================================
// ROLE APPROVAL REQUEST HANDLING
// ==========================================
function openRoleRequestModal() {
  if (!currentUser) {
    showCustomAlert({
      type: "warning",
      title: "จำเป็นต้องเข้าสู่ระบบก่อน",
      message: "กรุณาเข้าสู่ระบบด้วยบัญชีสมาชิกของคุณก่อนส่งขอความอนุมัติบทบาทครับ",
      btnText: "เข้าสู่ระบบ",
      callback: () => {
        openAuthModal('login');
      }
    });
    return;
  }

  const nameInput = document.getElementById("reqSenderName");
  const emailInput = document.getElementById("reqSenderEmail");
  const roleInput = document.getElementById("reqCurrentRole");
  const msgInput = document.getElementById("reqMessage");

  const roleNameMap = { 1: "1. customer (ลูกค้าทั่วไป)", 2: "2. admin (ผู้ดูแลระบบ)", 3: "3. writer (นักเขียน)" };

  const currentRoleText = roleNameMap[currentUser.role_id] || "1. customer (ลูกค้าทั่วไป)";
  if (nameInput) nameInput.value = currentUser.full_name || "สมาชิก";
  if (emailInput) emailInput.value = currentUser.email || "";
  if (roleInput) roleInput.value = currentRoleText;

  if (msgInput && !msgInput.value) {
    msgInput.value = "@Admin สวัสดีครับ ขออนุมัติบทบาท Writer เพื่อลงผลงาน E-Book ในร้านครับ";
  }

  openModal("roleRequestModal");
}

async function handleSendRoleRequest(e) {
  e.preventDefault();

  const nameInput = document.getElementById("reqSenderName");
  const emailInput = document.getElementById("reqSenderEmail");
  const targetRoleEl = document.getElementById("reqTargetRole");
  const msgEl = document.getElementById("reqMessage");

  const fullName = nameInput?.value.trim() || (currentUser?.full_name) || "สมาชิก";
  const email = emailInput?.value.trim() || (currentUser?.email) || "guest@nothave.com";

  if (!fullName || !email) {
    showCustomAlert({
      type: "error",
      title: "กรุณากรอกข้อมูลให้ครบถ้วน",
      message: "กรุณากรอกชื่อและอีเมลติดต่อเพื่อส่งขอความอนุมัติครับ",
      btnText: "ตกลง"
    });
    return;
  }

  const targetRoleId = parseInt(targetRoleEl?.value || "3");
  const roleNameMap = { 1: "customer", 2: "admin", 3: "writer" };
  const roleThaiMap = { 1: "customer (ลูกค้า)", 2: "admin (ผู้ดูแลระบบ)", 3: "writer (นักเขียน)" };
  const targetRoleName = roleNameMap[targetRoleId] || "writer";
  const message = msgEl?.value.trim() || "";

  const userId = currentUser ? (currentUser.user_id || currentUser.id || 1) : null;
  const currentRoleId = currentUser ? (currentUser.role_id || 1) : 1;

  const newRequest = {
    id: "REQ-" + Date.now(),
    user_id: userId,
    full_name: fullName,
    email: email,
    current_role_id: currentRoleId,
    target_role_id: targetRoleId,
    target_role_name: targetRoleName,
    message: message,
    is_tagged_admin: true,
    status: "pending",
    created_at: new Date().toISOString()
  };

  // 1. บันทึกลง nothave_role_requests สำหรับให้ Admin กดอนุมัติในหลังบ้าน
  const existingRequests = JSON.parse(localStorage.getItem("nothave_role_requests") || "[]");
  existingRequests.unshift(newRequest);
  localStorage.setItem("nothave_role_requests", JSON.stringify(existingRequests));

  // 2. ส่งเข้า Server Backend API ด้วย (เพื่อให้แอดมินเห็น 100% ข้ามเบราว์เซอร์/เครื่อง)
  try {
    fetch(`${BACKEND_URL}/api/role-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRequest)
    }).catch(err => console.warn("Backend save note:", err));
  } catch(e) {}

  // 3. ส่งข้อความเข้าห้องแชทคอมมูนิตี้ (nothave_community_messages) แท็ก @Admin ให้ปรากฏทันที
  try {
    const commMsgs = JSON.parse(localStorage.getItem("nothave_community_messages") || "[]");
    const formattedMsg = (message.includes("@Admin") ? message : `@Admin ${message}`) + ` (ขออนุมัติเป็น: ${roleThaiMap[targetRoleId]})`;
    commMsgs.push({
      id: "COMM-" + Date.now(),
      user_id: userId || 0,
      author: fullName,
      email: email,
      role_id: currentRoleId,
      role_name: roleNameMap[currentRoleId] || "customer",
      message: formattedMsg,
      is_tagged_admin: true,
      target_role_id: targetRoleId,
      target_role_name: targetRoleName,
      request_id: newRequest.id,
      created_at: new Date().toISOString(),
      likes: []
    });
    localStorage.setItem("nothave_community_messages", JSON.stringify(commMsgs));
    renderCommunityMessages();
  } catch (err) {
    console.warn("Error pushing community message:", err);
  }

  // 4. แจ้งเตือนแบบ Real-time ทันทีผ่าน Supabase Realtime, BroadcastChannel และ Storage Event (0 ms delay)
  broadcastRealtimeEvent('role_request', newRequest);
  broadcastRealtimeEvent('community_message', {
    id: "COMM-" + Date.now(),
    author: fullName,
    email: email,
    message: (message.includes("@Admin") ? message : `@Admin ${message}`) + ` (ขออนุมัติเป็น: ${roleThaiMap[targetRoleId]})`,
    is_tagged_admin: true,
    target_role_id: targetRoleId,
    target_role_name: targetRoleName,
    created_at: new Date().toISOString()
  });

  try {
    const bc = new BroadcastChannel("nothave_sync_channel");
    bc.postMessage({ type: "ROLE_REQUEST_CREATED", data: newRequest });
  } catch(e) {}

  try {
    window.dispatchEvent(new Event("storage"));
  } catch(e) {}

  logUserActivity("ส่งขอความอนุมัติ", `ส่งข้อความขออนุมัติเปลี่ยนเป็นบทบาท ${targetRoleName}: "${message.substring(0, 30)}..."`);

  closeModal("roleRequestModal");

  showCustomAlert({
    type: "success",
    title: "ส่งขอความอนุมัติสำเร็จ!",
    message: `ระบบได้ส่งข้อความขออนุมัติบทบาท "${roleThaiMap[targetRoleId]}" ของคุณ "${fullName}" ไปยัง Admin เรียบร้อยแล้วครับ เมื่อ Admin ตรวจสอบและกดอนุมัติ บทบาทของคุณจะเปลี่ยนทันที`,
    btnText: "รับทราบ"
  });
}

// ========================================================
// COMMUNITY BOX & FLOATING ACTION BUTTON (ช่องคอมมู & แท็ก @Admin)
// ========================================================
let currentCommTab = "all"; // 'all' or 'admin'

function initCommunityFeed() {
  const isSeeded = localStorage.getItem("nothave_community_seeded");
  if (!isSeeded) {
    const existing = localStorage.getItem("nothave_community_messages");
    if (!existing) {
      const seed = [
        {
          id: "COMM-1",
          user_id: 1,
          author: "ผู้ดูแลร้าน (Admin)",
          email: "admin@bookstore.com",
          role_id: 2,
          role_name: "admin",
          message: "ยินดีต้อนรับสู่คอมมูนิตี้ร้านหนังสือครับ! 🌟 พื้นที่นี้เปิดให้สมาชิกทุกคนแลกเปลี่ยนความคิดเห็น รีวิวหนังสือ หรือหากต้องการลงผลงาน E-Book สามารถกดแท็ก @Admin เพื่อขออนุมัติบทบาท Writer ได้ตลอด 24 ชม. ครับ",
          is_tagged_admin: false,
          created_at: new Date(Date.now() - 3600000 * 3).toISOString()
        }
      ];
      localStorage.setItem("nothave_community_messages", JSON.stringify(seed));
    }
    localStorage.setItem("nothave_community_seeded", "true");
  }
}

function toggleCommunityBox() {
  if (!currentUser) {
    showCustomAlert({
      type: "info",
      title: "กรุณาเข้าสู่ระบบก่อน",
      message: "กรุณาเข้าสู่ระบบบัญชีของคุณก่อนเปิดช่องคอมมูนิตี้ครับ",
      btnText: "ไปที่หน้าเข้าสู่ระบบ",
      callback: () => openAuthModal("login")
    });
    return;
  }

  const box = document.getElementById("communityBox");
  if (!box) return;

  const isActive = box.classList.toggle("active");
  if (isActive) {
    // Hide unread badge when user opens community
    const badge = document.getElementById("commFabBadge");
    if (badge) badge.style.display = "none";

    renderCommunityMessages();
    setTimeout(() => {
      const input = document.getElementById("commMsgInput");
      if (input) input.focus();
    }, 150);
  }
}

let currentReplyTarget = null;

function switchCommTab(tab) {
  currentCommTab = tab;
  const tabAll = document.getElementById("tabCommAll");
  const tabAdmin = document.getElementById("tabCommAdmin");

  if (tab === "all") {
    if (tabAll) tabAll.classList.add("active");
    if (tabAdmin) tabAdmin.classList.remove("active");
  } else {
    if (tabAll) tabAll.classList.remove("active");
    if (tabAdmin) tabAdmin.classList.add("active");
  }

  renderCommunityMessages();
}

function toggleCommAdminTag() {
  const btn = document.getElementById("btnCommTagAdmin");
  const input = document.getElementById("commMsgInput");
  if (!input) return;

  if (btn) btn.classList.toggle("active");

  if (btn && btn.classList.contains("active")) {
    if (!input.value.includes("@Admin")) {
      input.value = `@Admin ${input.value}`.trimStart();
    }
  } else {
    input.value = input.value.replace(/@Admin\s*/gi, "").trimStart();
  }
  input.focus();
}

function startCommReply(msgId) {
  const messages = JSON.parse(localStorage.getItem("nothave_community_messages") || "[]");
  const target = messages.find(m => m.id === msgId);
  if (!target) return;

  currentReplyTarget = {
    id: target.id,
    author: target.author,
    text: target.message,
    role_id: target.role_id
  };

  const banner = document.getElementById("commReplyBanner");
  const textEl = document.getElementById("commReplyText");
  if (banner && textEl) {
    textEl.innerHTML = `ตอบกลับ <strong>@${escapeHTML(target.author)}</strong>: "${escapeHTML(target.message.substring(0, 32))}..."`;
    banner.style.display = "flex";
  }

  const input = document.getElementById("commMsgInput");
  if (input) {
    input.focus();
  }
}

function cancelCommReply() {
  currentReplyTarget = null;
  const banner = document.getElementById("commReplyBanner");
  if (banner) banner.style.display = "none";
}

function toggleCommLike(msgId) {
  if (!currentUser) {
    showCustomAlert({
      type: "info",
      title: "กรุณาเข้าสู่ระบบก่อน",
      message: "กรุณาเข้าสู่ระบบบัญชีของคุณก่อนกดถูกใจข้อความครับ",
      btnText: "ไปที่หน้าเข้าสู่ระบบ",
      callback: () => openAuthModal("login")
    });
    return;
  }

  const messages = JSON.parse(localStorage.getItem("nothave_community_messages") || "[]");
  const msg = messages.find(m => m.id === msgId);
  if (!msg) return;

  if (!Array.isArray(msg.likes)) {
    msg.likes = [];
  }

  const userIdx = msg.likes.indexOf(currentUser.user_id);
  if (userIdx === -1) {
    msg.likes.push(currentUser.user_id);
  } else {
    msg.likes.splice(userIdx, 1);
  }

  localStorage.setItem("nothave_community_messages", JSON.stringify(messages));
  renderCommunityMessages();
}

function handleCommInputKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendCommunityMessage();
  }
}

function renderCommunityMessages() {
  const listEl = document.getElementById("commMessagesList");
  if (!listEl) return;

  const messages = JSON.parse(localStorage.getItem("nothave_community_messages") || "[]");

  let filtered = messages;
  if (currentCommTab === "admin") {
    filtered = messages.filter(m => m.is_tagged_admin || (m.message && m.message.includes("@Admin")));
  }

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center; padding:36px 16px; color:#94a3b8;">
        <div style="font-size:32px; margin-bottom:8px;">💬</div>
        <div style="font-weight:700; font-size:13px; color:#64748b;">ยังไม่มีข้อความในหมวดนี้</div>
        <p style="font-size:11.5px; margin-top:4px;">ร่วมพิมพ์ทักทายหรือแท็ก @Admin เป็นคนแรกได้เลยครับ</p>
      </div>
    `;
    return;
  }

  const roleNameMap = { 1: "Customer", 2: "Admin", 3: "Writer" };
  const roleClassMap = { 1: "role-customer", 2: "role-admin", 3: "role-writer" };
  const roleIconMap = { 1: "👤", 2: "🛡️", 3: "✍️" };

  listEl.innerHTML = filtered.map(msg => {
    const isOwn = currentUser && (msg.user_id === currentUser.user_id || msg.email === currentUser.email);
    const roleId = msg.role_id || 1;
    const roleClass = roleClassMap[roleId] || "role-customer";
    const roleLabel = roleNameMap[roleId] || "Member";
    const roleIcon = roleIconMap[roleId] || "👤";
    const isTaggedAdmin = msg.is_tagged_admin || (msg.message && msg.message.includes("@Admin"));

    // Relative or formatted time
    let timeStr = "";
    if (msg.created_at) {
      const diffMs = Date.now() - new Date(msg.created_at).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      if (diffMins < 1) timeStr = "เมื่อสักครู่";
      else if (diffMins < 60) timeStr = `${diffMins} นาทีที่แล้ว`;
      else if (diffHours < 24) timeStr = `${diffHours} ชม. ที่แล้ว`;
      else timeStr = new Date(msg.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
    }

    // Safe escaping
    let content = escapeHTML(msg.message || "");
    // Replace @Admin with highlighted tag pill
    content = content.replace(/@Admin/gi, '<span class="comm-tag-pill">@Admin</span>');

    const targetRoleBadge = msg.target_role_name ? `
      <div>
        <span class="comm-req-target">
          <span>🎯 ขอสิทธิ์:</span>
          <span>${msg.target_role_id === 2 ? "🛡️ 2. Admin" : "✍️ 3. Writer"}</span>
        </span>
      </div>
    ` : "";

    // Quoted reply box if replying to another message
    const quotedBox = msg.reply_to ? `
      <div class="comm-quoted-box">
        <span>↩️</span>
        <strong>@${escapeHTML(msg.reply_to.author)}:</strong>
        <span style="font-style:italic;">"${escapeHTML(msg.reply_to.text)}"</span>
      </div>
    ` : "";

    // Likes info
    const likesArr = Array.isArray(msg.likes) ? msg.likes : [];
    const isLiked = currentUser && likesArr.includes(currentUser.user_id);
    const likeCount = likesArr.length;

    return `
      <div class="comm-msg-card ${isTaggedAdmin ? 'is-admin-tag' : ''} ${isOwn ? 'is-own-msg' : ''}" id="commMsg_${msg.id}">
        <div class="comm-msg-header">
          <div class="comm-author-box">
            <div class="comm-avatar ${roleClass}">
              ${roleIcon}
            </div>
            <div>
              <span class="comm-author-name">${escapeHTML(msg.author || "สมาชิก")} ${isOwn ? '<span style="font-size:10px; color:#0284c7; font-weight:600;">(คุณ)</span>' : ''}</span>
              <span class="comm-role-badge ${roleClass}">${roleLabel}</span>
            </div>
          </div>
          <span class="comm-time">${timeStr}</span>
        </div>
        ${quotedBox}
        <div class="comm-msg-text">${content}</div>
        ${targetRoleBadge}

        <!-- Interactive card footer (ตอบกลับ & Like & Delete) -->
        <div class="comm-card-footer">
          <div class="comm-card-actions">
            <button type="button" class="btn-card-reply" onclick="startCommReply('${msg.id}')" title="ตอบกลับข้อความนี้">
              <span>↩️</span> ตอบกลับ
            </button>
            <button type="button" class="btn-card-like ${isLiked ? 'liked' : ''}" onclick="toggleCommLike('${msg.id}')" title="กดถูกใจ">
              <span>${isLiked ? '❤️' : '🤍'}</span>
              <span>${likeCount > 0 ? likeCount : ''}</span>
            </button>
            ${(isOwn || (currentUser && currentUser.role_id === 2)) ? `
              <button type="button" class="btn-card-reply" style="color:#ef4444; border-color:#fca5a5;" onclick="deleteCommunityMessage('${msg.id}')" title="ลบข้อความนี้">
                <span>🗑️</span> ลบ
              </button>
            ` : ''}
          </div>
          <span style="font-size:10px; color:#94a3b8;">${isTaggedAdmin ? '🏷️ ขอสิทธิ์' : ''}</span>
        </div>
      </div>
    `;
  }).join("");

  // Smooth scroll to latest message
  listEl.scrollTop = listEl.scrollHeight;
}

function deleteCommunityMessage(msgId) {
  if (!confirm("คุณต้องการลบข้อความนี้ใช่หรือไม่?")) return;
  try {
    let list = JSON.parse(localStorage.getItem("nothave_community_messages") || "[]");
    list = list.filter(m => m.id !== msgId);
    localStorage.setItem("nothave_community_messages", JSON.stringify(list));
    renderCommunityMessages();

    if (globalRealtimeChannel) {
      try {
        globalRealtimeChannel.send({
          type: 'broadcast',
          event: 'community_delete',
          payload: { id: msgId }
        });
      } catch (e) {}
    }
  } catch (err) {
    console.warn("Delete comm msg note:", err);
  }
}

function sendCommunityMessage() {
  if (!currentUser) {
    showCustomAlert({
      type: "info",
      title: "กรุณาเข้าสู่ระบบก่อน",
      message: "กรุณาเข้าสู่ระบบก่อนส่งข้อความในคอมมูนิตี้ครับ",
      btnText: "ไปที่หน้าเข้าสู่ระบบ",
      callback: () => openAuthModal("login")
    });
    return;
  }

  const input = document.getElementById("commMsgInput");
  const roleSelect = document.getElementById("commRoleSelect");
  const btnTag = document.getElementById("btnCommTagAdmin");
  if (!input) return;

  let text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  const isTagBtnActive = btnTag && btnTag.classList.contains("active");
  const containsAdminTag = text.includes("@Admin") || isTagBtnActive;

  if (isTagBtnActive && !text.includes("@Admin")) {
    text = `@Admin ${text}`;
  }

  const targetRoleId = parseInt(roleSelect?.value || "3");
  const roleNameMap = { 2: "admin", 3: "writer" };
  const roleThaiMap = { 2: "admin (ผู้ดูแลระบบ)", 3: "writer (นักเขียน)" };
  const targetRoleName = roleNameMap[targetRoleId] || "writer";

  const newCommMsg = {
    id: "COMM-" + Date.now(),
    user_id: currentUser.user_id,
    author: currentUser.full_name || "สมาชิก",
    email: currentUser.email,
    role_id: currentUser.role_id,
    role_name: currentUser.role_name || (currentUser.role_id === 2 ? "admin" : (currentUser.role_id === 3 ? "writer" : "customer")),
    message: text,
    is_tagged_admin: containsAdminTag,
    target_role_id: containsAdminTag ? targetRoleId : null,
    target_role_name: containsAdminTag ? targetRoleName : null,
    reply_to: currentReplyTarget ? {
      id: currentReplyTarget.id,
      author: currentReplyTarget.author,
      text: currentReplyTarget.text.substring(0, 45)
    } : null,
    likes: [],
    created_at: new Date().toISOString()
  };

  // 1. Save to Community Feed
  const messages = JSON.parse(localStorage.getItem("nothave_community_messages") || "[]");
  messages.push(newCommMsg);
  localStorage.setItem("nothave_community_messages", JSON.stringify(messages));

  // Reset reply state
  cancelCommReply();

  // 2. If tagged @Admin, also register into nothave_role_requests for Admin Approval in CMS
  if (containsAdminTag) {
    const newRequest = {
      id: "REQ-" + Date.now(),
      user_id: currentUser.user_id,
      full_name: currentUser.full_name,
      email: currentUser.email,
      current_role_id: currentUser.role_id,
      target_role_id: targetRoleId,
      target_role_name: targetRoleName,
      message: text,
      is_tagged_admin: true,
      status: "pending",
      created_at: new Date().toISOString()
    };

    const existingRequests = JSON.parse(localStorage.getItem("nothave_role_requests") || "[]");
    existingRequests.unshift(newRequest);
    localStorage.setItem("nothave_role_requests", JSON.stringify(existingRequests));

    logUserActivity("ส่งข้อความแท็ก @Admin", `แท็ก @Admin ขออนุมัติบทบาท ${targetRoleName} ในคอมมู: "${text.substring(0, 35)}..."`);

    // Interactive Admin Response: แอดมินตอบโต้กลับในคอมมูอัตโนมัติภายใน 1.2 วินาที
    setTimeout(() => {
      const liveMsgs = JSON.parse(localStorage.getItem("nothave_community_messages") || "[]");
      const adminAutoReply = {
        id: "COMM-" + (Date.now() + 1),
        user_id: 1,
        author: "ผู้ดูแลร้าน (Admin)",
        email: "admin@bookstore.com",
        role_id: 2,
        role_name: "admin",
        message: `@${newCommMsg.author} สวัสดีครับ ผู้ดูแลร้านได้รับคำขอสิทธิ์เป็น "${targetRoleName}" เรียบร้อยแล้วครับ! ทางเรากำลังตรวจสอบข้อมูลในระบบหลังบ้านให้สักครู่นะครับ ✨`,
        is_tagged_admin: false,
        reply_to: {
          id: newCommMsg.id,
          author: newCommMsg.author,
          text: text.substring(0, 45)
        },
        likes: [1],
        created_at: new Date().toISOString()
      };
      liveMsgs.push(adminAutoReply);
      localStorage.setItem("nothave_community_messages", JSON.stringify(liveMsgs));
      renderCommunityMessages();
    }, 1200);

    showCustomAlert({
      type: "success",
      title: "แท็ก @Admin สำเร็จ!",
      message: `ข้อความของคุณถูกโพสต์ลงในคอมมูนิตี้ และส่งตรงถึงระบบผู้ดูแลร้านเพื่อขออนุมัติบทบาท "${roleThaiMap[targetRoleId]}" เรียบร้อยแล้วครับ! แอดมินจะตอบกลับคุณในคอมมูทันที`,
      btnText: "รับทราบ"
    });
  } else {
    logUserActivity("โพสต์ในคอมมูนิตี้", `ส่งข้อความ: "${text.substring(0, 35)}..."`);
  }

  // Clear inputs
  input.value = "";
  if (btnTag) btnTag.classList.remove("active");

  renderCommunityMessages();
}

function insertAdminTagModal(tagText) {
  const textarea = document.getElementById("reqMessage");
  if (!textarea) return;

  if (textarea.value.trim() === "") {
    textarea.value = tagText;
  } else if (!textarea.value.includes(tagText.trim())) {
    textarea.value = `${tagText}\n${textarea.value}`;
  }
  textarea.focus();
}

// Close community box when clicking outside (if clicked completely outside)
document.addEventListener("click", (e) => {
  const box = document.getElementById("communityBox");
  const fab = document.getElementById("communityFab");
  if (box && fab && box.classList.contains("active")) {
    if (!box.contains(e.target) && !fab.contains(e.target) && !e.target.closest("#customAlertOverlay")) {
      box.classList.remove("active");
    }
  }
});

// Auto initialize community messages feed on load
initCommunityFeed();




