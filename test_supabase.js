const fs = require('fs');

async function testSupabase() {
  const sbUrl = "https://qmpaatmniwagzijazzxb.supabase.co";
  const sbKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcGFhdG1uaXdhZ3ppamF6enhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2OTU4NDcsImV4cCI6MjEwNjI3MTg0N30.UrozUWTiA-aocCb0R1RSJ_RrNfmX8gPpnMz5vkhsxCg";
  const headers = { 'apikey': sbKey, 'Authorization': 'Bearer ' + sbKey };

  const tables = ['roles', 'users', 'categories', 'authors', 'ebooks', 'orders', 'order_items', 'payments', 'download_links'];

  for (const table of tables) {
    try {
      const res = await fetch(`${sbUrl}/rest/v1/${table}?select=*&limit=3`, { headers });
      const text = await res.text();
      console.log(`[${table}] HTTP ${res.status}:`, text.slice(0, 150));
    } catch (e) {
      console.error(`[${table}] Error:`, e.message);
    }
  }
}

testSupabase();
