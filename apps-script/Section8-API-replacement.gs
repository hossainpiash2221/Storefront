/* =====================================================================
 * REPLACE the whole "8. WEB APP API FOR REACT" section of Code.gs with this file's content
 * (delete the old json_, getPublicProducts_, doGet, doPost). Nothing else in Code.gs changes.
 *
 * ONE-TIME SETUP (Project Settings > Script properties > Add):
 *   API_SECRET   = long random string (run generateToken() once and copy its log)  -> same value goes in the website's .env
 *   ADMIN_TOKEN  = a NEW random string (the old one was pasted in a chat, so treat it as leaked)
 * Then delete the ADMIN_TOKEN constant at the top of Code.gs.
 * Deploy > Manage deployments > pencil > Version: New version > Deploy.
 * (Execute as: Me, Who has access: Anyone. The secret is what protects it.)
 *
 * PRODUCT COLOURS / SIZES without changing your sheet: add lines like these to a product's Description:
 *     Colors: Black, Navy, Maroon
 *     Sizes: M, L, XL
 * They become selectable options on the website and are validated server-side. The lines are hidden from the public description.
 * The customer's choice is written into the order's Delivery Note ("Variants: ...").
 * Stock is still per product (your sheet has no per-colour stock).
 * ===================================================================== */

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ---- auth: fail closed. If API_SECRET is not set, nothing works. ---- */
function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function authOk_(s) { const k = prop_('API_SECRET'); return k.length >= 20 && String(s || '') === k; }

/* ---- colours / sizes parsed from Description ---- */
function parseVariants_(desc) {
  const out = { colors: [], sizes: [], text: [] };
  String(desc || '').split(/\r?\n/).forEach(line => {
    const m = /^\s*(colou?rs?|sizes?)\s*:\s*(.+)$/i.exec(line);
    if (!m) { out.text.push(line); return; }
    const list = m[2].split(',').map(x => x.trim()).filter(Boolean).slice(0, 20);
    const target = /^colou?r/i.test(m[1]) ? out.colors : out.sizes;
    list.forEach(x => { if (target.indexOf(x) < 0) target.push(x); });
  });
  out.text = out.text.join('\n').trim();
  return out;
}
function publicProduct_(p) {
  const v = parseVariants_(p.description);
  return Object.assign({}, p, { description: v.text, colors: v.colors, sizes: v.sizes });
}

function getPublicProducts_() {
  const cache = CacheService.getScriptCache(), hit = cache.get('pub_products');   // key cleared by clearCache_()
  if (hit) return JSON.parse(hit);
  const data = groupProducts_(readProducts_()).map(publicProduct_);
  try { cache.put('pub_products', JSON.stringify(data), 120); } catch (e) {}
  return data;
}

function publicConfig_() {
  return {
    storeName: String(getSetting_('Store Name') || ''),
    deliveryCharge: Number(getSetting_('Delivery Charge')) || 0,
    freeDeliveryAbove: Number(getSetting_('Free Delivery Above (0 = off)')) || 0
  };
}

/* ---- server-side cart validation + pricing. The browser's prices are never read. ---- */
function quote_(d) {
  if (!Array.isArray(d.items) || !d.items.length || d.items.length > 30) throw new Error('Your cart is empty.');
  const rows = readProducts_(), groups = groupProducts_(rows), used = {};
  let subtotal = 0;
  const lines = d.items.map(it => {
    const id = String(it.productId || '').trim(), q = Math.floor(Number(it.quantity));
    const color = String(it.color || '').trim(), size = String(it.size || '').trim();
    const out = { productId: id, ok: false, error: '', color: color, size: size, quantity: q };
    const row = rows.filter(x => x.id === id)[0];
    const g = row && groups.filter(x => nameKey_(x.productName) === nameKey_(row.productName))[0];
    if (!g) { out.error = 'This product is no longer available.'; return out; }
    out.productId = g.id; out.name = g.productName; out.price = g.price; out.stock = g.stock; out.image = g.images[0] || '';
    if (!(q >= 1 && q <= 50)) { out.error = 'Invalid quantity.'; return out; }
    const v = parseVariants_(g.description);
    if (v.colors.length ? v.colors.indexOf(color) < 0 : color) { out.error = 'Please choose an available colour.'; return out; }
    if (v.sizes.length ? v.sizes.indexOf(size) < 0 : size) { out.error = 'Please choose an available size.'; return out; }
    if (g.status !== 'Active' || g.stock < 1) { out.error = 'Sold out.'; return out; }
    const k = nameKey_(g.productName); used[k] = (used[k] || 0) + q;
    if (used[k] > g.stock) { out.error = 'Only ' + g.stock + ' left.'; return out; }
    out.ok = true; out.sub = g.price * q; subtotal += out.sub;
    return out;
  });
  const cfg = publicConfig_();
  const deliveryCharge = (cfg.freeDeliveryAbove > 0 && subtotal >= cfg.freeDeliveryAbove) ? 0 : cfg.deliveryCharge;
  return { lines: lines, subtotal: subtotal, deliveryCharge: deliveryCharge, total: subtotal + deliveryCharge, allOk: lines.every(l => l.ok) };
}

/* ---- duplicate-order + abuse protection helpers (CacheService, guarded by a short lock) ---- */
function claim_(key, ttl) {                       // returns the existing record, or null after claiming the key
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const c = CacheService.getScriptCache(), hit = c.get(key);
    if (hit) return JSON.parse(hit);
    c.put(key, JSON.stringify({ state: 'pending' }), ttl);
    return null;
  } finally { lock.releaseLock(); }
}
function rateLimit_(key, max, ttl) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const c = CacheService.getScriptCache(), n = Number(c.get(key)) || 0;
    if (n >= max) throw new Error('Too many orders in a short time. Please try again later.');
    c.put(key, String(n + 1), ttl);
  } finally { lock.releaseLock(); }
}
function md5_(s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, s).map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join(''); }
const BUSY_MSG_ = 'Your order is still being processed. Please wait a few seconds, then press Place order again.';

/** Website checkout. Idempotent: the same requestId (or the same phone + items within 2 minutes) never creates a second order. */
function placeWebsiteOrder_(b) {
  const rid = String(b.requestId || '');
  if (!/^[A-Za-z0-9-]{16,64}$/.test(rid)) throw new Error('Invalid request.');
  if (b.website) throw new Error('Request rejected.');                                  // honeypot
  const phone = String(b.phone || '').trim().replace(/[\s-]/g, '');
  if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(phone)) throw new Error('Phone is required: enter a valid 11-digit mobile number.');
  const phone10 = phone.slice(-10);

  const cache = CacheService.getScriptCache(), idemKey = 'idem_' + rid;
  const prev = claim_(idemKey, 300);
  if (prev) {
    if (prev.state === 'done') return Object.assign({}, prev.result, { duplicate: true });
    throw new Error(BUSY_MSG_);
  }
  try {
    rateLimit_('rl_ph_' + phone10, 5, 3600);                                            // 5 orders / phone / hour
    rateLimit_('rl_all_' + Math.floor(Date.now() / 60000), 60, 120);                    // 60 orders / minute overall

    const q = quote_(b);                                                                // product, status, variant, price, stock: all from the sheet
    const bad = q.lines.filter(l => !l.ok)[0];
    if (bad) throw new Error((bad.name ? bad.name + ': ' : '') + bad.error);

    const fpKey = 'fp_' + md5_(phone10 + '|' + q.lines.map(l => [l.productId, l.quantity, l.color, l.size].join(':')).sort().join(',')), fpPrev = claim_(fpKey, 120);
    if (fpPrev) {
      if (fpPrev.state !== 'done') throw new Error(BUSY_MSG_);
      cache.put(idemKey, JSON.stringify({ state: 'done', result: fpPrev.result }), 21600);
      return Object.assign({}, fpPrev.result, { duplicate: true });
    }

    const vtxt = q.lines.filter(l => l.color || l.size).map(l => l.name + ' x' + l.quantity + ' (' + [l.color, l.size].filter(Boolean).join(', ') + ')').join('; ');
    const note = String(b.note || '').slice(0, 300) + (vtxt ? (b.note ? ' | ' : '') + 'Variants: ' + vtxt : '');
    let result;
    try {
      result = placeOrder_({
        customerName: String(b.customerName || '').slice(0, 100), phone: phone, email: String(b.email || '').slice(0, 100),
        address: String(b.address || '').slice(0, 250), city: String(b.city || '').slice(0, 100), note: note,
        items: q.lines.map(l => ({ productId: l.productId, quantity: l.quantity }))     // NO prices passed: createOrder_ re-reads them from the sheet
      });
    } catch (e) { cache.remove(fpKey); throw e; }
    cache.put(fpKey, JSON.stringify({ state: 'done', result: result }), 120);
    cache.put(idemKey, JSON.stringify({ state: 'done', result: result }), 21600);
    return result;
  } catch (e) { cache.remove(idemKey); throw e; }
}

/* ---- endpoints (only the Next.js server calls these; the secret never reaches a browser) ---- */
function doGet(e) {
  const p = (e && e.parameter) || {}, a = p.action || 'products';
  try {
    if (a === 'orders') {                                                               // admin only, own token
      const t = prop_('ADMIN_TOKEN');
      if (t.length < 20 || p.token !== t) throw new Error('Unauthorized.');
      return json_({ success: true, data: getOrders_() });
    }
    if (!authOk_(p.secret)) throw new Error('Unauthorized.');
    if (a === 'products') return json_({ success: true, data: getPublicProducts_() });
    if (a === 'product') {
      const rows = readProducts_(), row = rows.filter(x => x.id === p.id)[0];
      const g = row && groupProducts_(rows).filter(x => nameKey_(x.productName) === nameKey_(row.productName))[0];
      if (!g) throw new Error('Product not found.');
      return json_({ success: true, data: publicProduct_(g) });
    }
    if (a === 'config') return json_({ success: true, data: publicConfig_() });
    if (a === 'categories') {
      const list = readCategories_(true), byGender = {};
      list.forEach(c => { (byGender[c.gender] = byGender[c.gender] || []).push(c.category); });
      return json_({ success: true, data: { list: list, byGender: byGender } });
    }
    throw new Error('Unknown action.');
  } catch (err) { return json_({ success: false, error: err.message }); }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!authOk_(body.secret)) throw new Error('Unauthorized.');
    if (body.action === 'quote') return json_({ success: true, data: quote_(body) });
    if (body.action === 'placeOrder') return json_({ success: true, data: placeWebsiteOrder_(body) });
    throw new Error('Unknown action.');
  } catch (err) { return json_({ success: false, error: err.message }); }
}
