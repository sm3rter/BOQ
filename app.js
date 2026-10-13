'use strict';
(function () {
  var KEY = 'fireboq.v2', OLDKEY = 'fireboq.v1';

  /* ========== الأصناف وحقولها (مصطلحات السوق) ========== */
  var DIA = ['½', '¾', '1', '1¼', '1½', '2', '2½', '3', '4', '5', '6', '8', '10', '12'];
  var JT = ['جروف', 'لحام', 'قلاووظ', 'فلانشات'];
  var dia = function (l, req) { return { k: 'dia', l: l || 'القطر (بوصة)', t: 'dia', o: DIA, req: req, main: 1 }; };
  var dia2 = function (l, req) { return { k: 'dia2', l: l, t: 'dia', o: DIA, req: req, main: 1 }; };
  var BULB = [
    { v: '57°', n: 'برتقالي', c: '#f08a24' }, { v: '68°', n: 'أحمر', c: '#e5484d' },
    { v: '79°', n: 'أصفر', c: '#f2c94c' }, { v: '93°', n: 'أخضر', c: '#3fb67a' }, { v: '141°', n: 'أزرق', c: '#4c8df6' }
  ];
  var CATS = [
    { k: 'pipe', n: 'ماسورة', u: 'م', ql: 'الطول (م)', f: [dia(null, 1),
      { k: 'mat', l: 'الخامة', o: ['أسود Sch40', 'مجلفن Sch40', 'أسود Sch10', 'HDPE', 'CPVC'], def: 'أسود Sch40' },
      { k: 'jt', l: 'التوصيل', o: JT },
      { k: 'ins', l: 'التركيب', o: ['ظاهر', 'مدفون', 'فوق السقف'] }] },
    { k: 'sprinkler', n: 'رشاش', u: 'عدد', ql: 'العدد', f: [
      { k: 'type', l: 'النوع', req: 1, o: ['متدلي Pendent', 'قائم Upright', 'جانبي Sidewall', 'مخفي Concealed', 'جاف Dry'] },
      { k: 'temp', l: 'درجة حرارة الزجاجة', o: BULB },
      { k: 'k', l: 'معامل K', o: ['K5.6', 'K8', 'K11.2', 'K14'] },
      { k: 'fin', l: 'التشطيب', o: ['كروم', 'أبيض', 'نحاسي'] },
      { k: 'rsp', l: 'الاستجابة', o: ['قياسي', 'سريعة QR'] }] },
    { k: 'cabinet', n: 'صندوق حريق', u: 'عدد', ql: 'العدد', f: [
      { k: 'type', l: 'النوع', req: 1, o: ['بكرة خرطوم Hose Reel', 'محبس خرطوم Landing Valve', 'طفاية', 'مدمج بكرة + طفاية'] },
      { k: 'hose', l: 'قطر الخرطوم', o: ['1″', '1½″', '2½″'] },
      { k: 'len', l: 'طول الخرطوم', o: ['20 م', '30 م', '45 م'] },
      { k: 'mnt', l: 'التركيب', o: ['سطحي', 'غاطس في الحائط', 'قائم على الأرض'] }] },
    { k: 'valve', n: 'محبس', u: 'عدد', ql: 'العدد', f: [
      { k: 'type', l: 'النوع', req: 1, o: ['بوابة OS&Y Gate', 'فراشة Butterfly', 'عدم رجوع Check', 'كرة Ball', 'محبس خرطوم Landing', 'إنذار Alarm Check', 'تست ودرين Test & Drain', 'تنفيس هواء', 'تخفيض ضغط PRV'] },
      dia(null, 1),
      { k: 'end', l: 'النهايات', o: ['جروف', 'فلانشات', 'قلاووظ'] },
      { k: 'sup', l: 'المراقبة', o: ['مع تامبر سويتش', 'بدون'] },
      { k: 'rt', l: 'الضغط', o: ['175 psi', '300 psi', 'PN16'] }] },
    { k: 'elbow', n: 'كوع', u: 'عدد', ql: 'العدد', f: [dia(null, 1),
      { k: 'ang', l: 'الزاوية', req: 1, o: ['90°', '45°', '22.5°', '11.25°'], def: '90°' },
      { k: 'jt', l: 'التوصيل', o: JT }] },
    { k: 'tee', n: 'تيه', u: 'عدد', ql: 'العدد', f: [dia('القطر الرئيسي', 1),
      dia2('قطر الفرع (لو مختلف)'),
      { k: 'jt', l: 'التوصيل', o: JT }] },
    { k: 'reducer', n: 'مسلوب', u: 'عدد', ql: 'العدد', f: [dia('القطر الكبير', 1), dia2('القطر الصغير', 1),
      { k: 'ecc', l: 'النوع', o: ['متحد المركز Concentric', 'لا مركزي Eccentric'], def: 'متحد المركز Concentric' },
      { k: 'jt', l: 'التوصيل', o: JT }] },
    { k: 'coupling', n: 'وصلة جروف', u: 'عدد', ql: 'العدد', f: [
      { k: 'type', l: 'النوع', req: 1, o: ['صلبة Rigid', 'مرنة Flexible', 'ميكانيكال تيه', 'فلانج أدابتر'] },
      dia(null, 1), dia2('قطر الفرع (للميكانيكال تيه)')] },
    { k: 'flange', n: 'فلانشة', u: 'عدد', ql: 'العدد', f: [
      { k: 'type', l: 'النوع', req: 1, o: ['Slip-on', 'Weld Neck', 'عمياء Blind', 'قلاووظ'] },
      dia(null, 1), { k: 'rt', l: 'الضغط', o: ['PN16', 'PN10', '150#'] }] },
    { k: 'misc', n: 'قطع أخرى', u: 'عدد', ql: 'العدد', f: [
      { k: 'type', l: 'النوع', req: 1, o: ['كاب Cap', 'نبل Nipple', 'صليب Cross', 'بوشن Bushing', 'يونيون Union', 'سدادة Plug', 'Sockolet'] },
      dia(null, 1), dia2('القطر الثاني (للبوشن)')] },
    { k: 'support', n: 'حامل', u: 'عدد', ql: 'العدد', f: [
      { k: 'type', l: 'النوع', req: 1, o: ['كلفس Clevis', 'مشبك رأسي Riser Clamp', 'مشبك ماسورة', 'سيزمك براس', 'قضيب مسنن Rod'] },
      dia('قطر الماسورة')] },
    { k: 'accessory', n: 'ملحقات', u: 'عدد', ql: 'العدد', f: [
      { k: 'type', l: 'النوع', req: 1, o: ['فلو سويتش Flow Switch', 'مانومتر Gauge', 'سيامي FDC', 'حنفية حريق Hydrant', 'جرس إنذار Gong', 'مصفاة Strainer'] },
      dia()] },
    { k: 'pump', n: 'مضخة', u: 'عدد', ql: 'العدد', f: [
      { k: 'type', l: 'النوع', req: 1, o: ['رئيسية كهرباء', 'ديزل', 'جوكي', 'بوستر'] },
      { k: 'flow', l: 'التصرف (gpm)', t: 'num', o: ['250', '500', '750', '1000', '1500'] },
      { k: 'head', l: 'الضغط (بار)', t: 'num', o: ['7', '8', '10'] }] },
    { k: 'tank', n: 'خزان', u: 'عدد', ql: 'العدد', f: [
      { k: 'type', l: 'النوع', req: 1, o: ['أرضي', 'علوي', 'ضغط Pressure'] },
      { k: 'cap', l: 'السعة (م³)', t: 'num', o: ['50', '100', '150', '200', '300'] },
      { k: 'mat', l: 'الخامة', o: ['خرسانة', 'صلب', 'GRP'] }] },
    { k: 'other', n: 'أخرى', u: 'عدد', ql: 'الكمية', f: [
      { k: 'name', l: 'اسم البند', t: 'text', req: 1, main: 1 },
      { k: 'unit', l: 'الوحدة', o: ['عدد', 'م', 'م²', 'كجم', 'طقم'], def: 'عدد', req: 1, main: 1 }] }
  ];
  var catBy = {}; CATS.forEach(function (c, i) { c.i = i; catBy[c.k] = c; });
  var P = function (d) { return '<svg class="ico" viewBox="0 0 24 24">' + d + '</svg>'; };
  var CI = {
    pipe: P('<path d="M3 9h18M3 15h18M7 9v6M17 9v6"/>'),
    sprinkler: P('<path d="M12 2v5M8 7h8M10 7v3a2 2 0 1 0 4 0V7M5 17l-1.5 2.5M12 17v4M19 17l1.5 2.5"/>'),
    cabinet: P('<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="11" r="4"/><path d="M12 15v3"/>'),
    valve: P('<path d="M3 13h5M16 13h5M8 8l8 10V8L8 18zM12 13V5M9 5h6"/>'),
    elbow: P('<path d="M6 4v10a6 6 0 0 0 6 6h8M10 4v7a3 3 0 0 0 3 3h7"/>'),
    tee: P('<path d="M3 6h18v4H3zM9 10v10M15 10v10"/>'),
    reducer: P('<path d="M3 7h5l8 3v4l-8 3H3zM16 10h5v4h-5"/>'),
    coupling: P('<path d="M3 9h5v6H3M16 9h5v6h-5M8 7h8v10H8z"/>'),
    flange: P('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 5.5v.01M12 18.5v.01M5.5 12h.01M18.5 12h.01"/>'),
    misc: P('<path d="M5 8h9a4 4 0 0 1 0 8H5zM3 6v12"/>'),
    support: P('<path d="M12 3v6M8 9h8M7 9v6a5 5 0 0 0 10 0V9"/>'),
    accessory: P('<circle cx="12" cy="13" r="8"/><path d="M12 13l4-4M7 13h.01M12 8h.01"/>'),
    pump: P('<circle cx="11" cy="14" r="6"/><path d="M11 8V3h8v3M17 14h4"/>'),
    tank: P('<path d="M5 6c0-1.7 3-3 7-3s7 1.3 7 3v12c0 1.7-3 3-7 3s-7-1.3-7-3zM5 6c0 1.7 3 3 7 3s7-1.3 7-3M5 12c0 1.7 3 3 7 3s7-1.3 7-3"/>'),
    other: P('<path d="M12 5v14M5 12h14"/>')
  };
  var I = {
    back: P('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    more: P('<path d="M5 12h.01M12 12h.01M19 12h.01" stroke-width="3"/>'),
    plus: P('<path d="M12 5v14M5 12h14"/>'),
    chev: P('<path d="M15 6l-6 6 6 6"/>'),
    places: P('<path d="M4 21V5l8-3 8 3v16M4 21h16M9 9h2M13 9h2M9 13h2M13 13h2M10 21v-4h4v4"/>'),
    total: P('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
    tools: P('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>'),
    set: P('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
    xls: P('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13l4 5M13 13l-4 5"/>'),
    trash: P('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>')
  };

  /* ========== أدوات عامة ========== */
  var ID_MM = { '0.5': 15.8, '0.75': 20.9, '1': 26.6, '1.25': 35.1, '1.5': 40.9, '2': 52.5, '2.5': 62.7, '3': 77.9, '4': 102.3, '5': 128.2, '6': 154.1, '8': 202.7, '10': 254.5, '12': 303.2 };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); };
  var num = function (n) { return (Math.round(n * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 }); };
  var uid = function () { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3); };
  var today = function () { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  var toLatin = function (s) { return String(s == null ? '' : s).replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }).replace(/[٫,،]/g, '.'); };

  function parseQty(s) {
    s = toLatin(s).replace(/\s+/g, '');
    if (!s || !/^[\d.+]+$/.test(s)) return NaN;
    var t = 0, parts = s.split('+');
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i]; if (p === '') continue;
      var v = Number(p); if (!isFinite(v) || /\..*\./.test(p)) return NaN; t += v;
    }
    return Math.round(t * 1000) / 1000;
  }
  function diaNum(s) {
    s = toLatin(s).replace(/[″"”\s]/g, '').replace(/¼/g, '.25').replace(/½/g, '.5').replace(/¾/g, '.75');
    if (s.indexOf('/') > -1) { var p = s.split('/'); return (Number(p[0]) / Number(p[1])) || 0; }
    return Number(s) || 0;
  }
  var GL = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
  function fmtDia(s) {
    s = String(s == null ? '' : s).trim(); if (!s) return '';
    var n = diaNum(s); if (!(n > 0)) return s;
    var w = Math.floor(n), fr = Math.round((n - w) * 100) / 100;
    if (fr === 0) return String(w);
    if (GL[fr]) return (w || '') + GL[fr];
    return String(n);
  }

  /* ========== الحالة والتخزين ========== */
  function emptyState() { return { v: 2, project: { name: '', site: '', engineer: '' }, places: [], custom: {}, last: {}, lastCat: 'pipe' }; }
  function migrate(o) {
    var map = { sprinkler: 'sprinkler', box: 'cabinet', valve: 'valve', elbow: 'elbow', tee: 'tee', reducer: 'reducer', nipple: 'misc', pump: 'pump', tank: 'tank', pipe: 'pipe', other: 'other' };
    var s = emptyState();
    s.project.site = (o.project && o.project.site) || ''; s.project.engineer = (o.project && o.project.engineer) || '';
    s.project.name = (o.project && o.project.name && o.project.name !== 'حصر نظام مكافحة الحريق') ? o.project.name : '';
    s.places = (o.buildings || []).map(function (b) {
      return { id: b.id || uid(), name: b.name || 'مكان', rows: (b.rows || []).map(function (r) {
        var cat = map[r.cat] || 'other', f = {};
        if (r.dia) f.dia = fmtDia(r.dia); if (r.dia2) f.dia2 = fmtDia(r.dia2);
        if (cat === 'misc') f.type = 'نبل Nipple';
        if (cat === 'other') { f.name = r.name || 'بند'; f.unit = r.unit || 'عدد'; }
        return { id: r.id || uid(), cat: cat, f: f, qty: Number(r.qty) || 0, note: r.note || '', approx: !!r.approx };
      }) };
    });
    return s;
  }
  function fix(j) {
    if (!j || typeof j !== 'object') return null;
    if (j.v !== 2) { if (Array.isArray(j.buildings)) return migrate(j); return null; }
    var s = emptyState();
    s.project = Object.assign(s.project, j.project || {}); s.custom = j.custom || {}; s.last = j.last || {};
    s.lastCat = catBy[j.lastCat] ? j.lastCat : 'pipe';
    s.places = (Array.isArray(j.places) ? j.places : []).map(function (p) {
      return { id: p.id || uid(), name: String(p.name || 'مكان'), rows: (Array.isArray(p.rows) ? p.rows : []).filter(function (r) { return catBy[r.cat]; }).map(function (r) {
        return { id: r.id || uid(), cat: r.cat, f: r.f || {}, qty: Number(r.qty) || 0, note: r.note || '', approx: !!r.approx };
      }) };
    });
    return s;
  }
  function load() {
    try {
      var a = localStorage.getItem(KEY); if (a) { var s = fix(JSON.parse(a)); if (s) return s; }
      var o = localStorage.getItem(OLDKEY); if (o) { var m = fix(JSON.parse(o)); if (m) return m; }
    } catch (e) {}
    return emptyState();
  }
  var S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var UI = { tab: 'places', pid: null, open: {} };
  var curP = function () { return S.places.find(function (p) { return p.id === UI.pid; }); };

  /* ========== بنية الصف والنصوص ========== */
  function optObj(o) { return typeof o === 'string' ? { v: o } : o; }
  function fieldOpts(c, fd) {
    var base = (fd.o || []).map(optObj), have = {}; base.forEach(function (o) { have[o.v] = 1; });
    (S.custom[c.k + '.' + fd.k] || []).forEach(function (v) { if (!have[v]) base.push({ v: v }); });
    return base;
  }
  function optText(c, k, val) {
    var fd = c.f.find(function (x) { return x.k === k; }), o = fd && (fd.o || []).map(optObj).find(function (x) { return x.v === val; });
    return o && o.n ? o.v + ' ' + o.n : val;
  }
  function optColor(c, k, val) {
    var fd = c.f.find(function (x) { return x.k === k; }), o = fd && (fd.o || []).map(optObj).find(function (x) { return x.v === val; });
    return o && o.c;
  }
  function unitOf(r) { return r.cat === 'other' ? (r.f.unit || 'عدد') : catBy[r.cat].u; }
  function rowKey(cat, f) {
    var c = catBy[cat];
    return cat + '|' + c.f.map(function (fd) { var v = String(f[fd.k] || '').trim(); return fd.k === 'name' ? v.toLowerCase() : v; }).join('~');
  }
  function diaTxt(f) { return f.dia ? (f.dia2 ? f.dia + '″×' + f.dia2 + '″' : f.dia + '″') : (f.dia2 ? '×' + f.dia2 + '″' : ''); }
  function titleOf(r) { var c = catBy[r.cat], d = diaTxt(r.f); return (r.cat === 'other' ? (r.f.name || 'بند') : c.n) + (d && r.cat !== 'other' ? ' ' + d : ''); }
  function specList(cat, f) {
    var c = catBy[cat], out = [];
    c.f.forEach(function (fd) { if (fd.main || !f[fd.k]) return; out.push({ t: optText(c, fd.k, f[fd.k]), c: optColor(c, fd.k, f[fd.k]) }); });
    return out;
  }
  var specTxt = function (cat, f) { return specList(cat, f).map(function (x) { return x.t; }).join(' - '); };
  function tagsHTML(cat, f, approx) {
    var h = specList(cat, f).map(function (s) { return '<span class="tag">' + (s.c ? '<i class="dot" style="background:' + s.c + '"></i>' : '') + esc(s.t) + '</span>'; });
    if (approx) h.push('<span class="tag ap">تقريبي</span>');
    return h.length ? '<span class="tags">' + h.join('') + '</span>' : '';
  }
  var cmp = function (a, b) {
    return a.cat === b.cat ? (diaNum(a.f.dia) - diaNum(b.f.dia) || diaNum(a.f.dia2) - diaNum(b.f.dia2) || specTxt(a.cat, a.f).localeCompare(specTxt(b.cat, b.f), 'ar')) : catBy[a.cat].i - catBy[b.cat].i;
  };
  function sumByCat(p) {
    var m = {}; p.rows.forEach(function (r) { var k = r.cat === 'other' ? 'other' : r.cat; m[k] = (m[k] || 0) + r.qty; }); return m;
  }
  function aggregate() {
    var m = {};
    S.places.forEach(function (p) {
      p.rows.forEach(function (r) {
        var k = rowKey(r.cat, r.f), e = m[k] || (m[k] = { cat: r.cat, f: r.f, unit: unitOf(r), total: 0, per: {}, approx: false });
        e.total += r.qty; e.per[p.id] = (e.per[p.id] || 0) + r.qty; if (r.approx) e.approx = true;
      });
    });
    return Object.keys(m).map(function (k) { return m[k]; }).sort(cmp);
  }

  /* ========== العروض ========== */
  function miniHTML(p) {
    var m = sumByCat(p), h = '';
    CATS.forEach(function (c) { if (m[c.k]) h += '<span>' + CI[c.k] + '<b class="num">' + num(m[c.k]) + '</b>' + (c.k === 'pipe' ? ' م' : '') + '</span>'; });
    return h || '<span class="none">فاضي</span>';
  }
  function viewPlaces() {
    var h = '<div class="top"><h1>' + (S.project.name ? esc(S.project.name) : 'حصر الحريق') + '<span class="sub">' + S.places.length + ' مكان</span></h1></div>';
    if (!S.places.length) {
      h += '<div class="empty">' + I.places + '<h2>ابدأ بإضافة مكان</h2><p>سمّه زي ما إنت عايز: مستودع، جمالون، غرفة مضخات. وبعدها ضيف فيه الأصناف.</p><button class="btn pri" data-a="addPlace">' + I.plus + 'مكان جديد</button></div>';
    } else {
      h += '<div class="places">' + S.places.map(function (p) {
        return '<button class="place" data-a="openP" data-id="' + p.id + '"><div class="nm"><span>' + esc(p.name) + '</span>' + I.chev + '</div><div class="minis">' + miniHTML(p) + '</div></button>';
      }).join('') + '</div><button class="fab" data-a="addPlace">' + I.plus + 'مكان جديد</button>';
    }
    return h;
  }
  function rowHTML(r) {
    var u = unitOf(r), noInc = u === 'م';
    return '<div class="row"><button class="mn" data-a="edit" data-id="' + r.id + '"><span class="tt">' + esc(titleOf(r)) + '</span>' + tagsHTML(r.cat, r.f, r.approx) +
      (r.note ? '<span class="nt">' + esc(r.note) + '</span>' : '') + '</button>' +
      '<button class="qv" data-a="edit" data-id="' + r.id + '"><b class="num">' + num(r.qty) + '</b><small>' + esc(u) + '</small></button>' +
      (noInc ? '' : '<button class="inc" data-a="inc" data-id="' + r.id + '" aria-label="زيادة واحد">' + I.plus + '</button>') + '</div>';
  }
  function viewPlace() {
    var p = curP(); if (!p) { UI.pid = null; return viewPlaces(); }
    var h = '<div class="top"><button class="ib" data-a="back" aria-label="رجوع">' + I.back + '</button><h1>' + esc(p.name) + '<span class="sub">' + p.rows.length + ' بند</span></h1><button class="ib" data-a="pMenu" aria-label="خيارات">' + I.more + '</button></div>';
    if (!p.rows.length) h += '<div class="empty">' + CI.pipe + '<h2>المكان فاضي</h2><p>اضغط «إضافة بند» واختار الصنف.</p></div>';
    var rows = p.rows.slice().sort(cmp), cur = null;
    rows.forEach(function (r) {
      if (r.cat !== cur) {
        if (cur) h += '</div>'; cur = r.cat;
        var sub = rows.filter(function (x) { return x.cat === cur; }).reduce(function (a, x) { return a + x.qty; }, 0);
        h += '<div class="cat-h">' + CI[cur] + '<span>' + catBy[cur].n + '</span><em class="num">' + num(sub) + (cur === 'pipe' ? ' م' : '') + '</em></div><div class="rows">';
      }
      h += rowHTML(r);
    });
    if (cur) h += '</div>';
    return h + '<button class="fab" data-a="addItem">' + I.plus + 'إضافة بند</button>';
  }
  function viewTotal() {
    var agg = aggregate();
    var h = '<div class="top"><h1>الإجمالي<span class="sub">كل الأماكن معاً</span></h1><button class="ib" data-a="exportXlsx" aria-label="تصدير Excel">' + I.xls + '</button></div>';
    if (!agg.length) return h + '<div class="empty">' + I.total + '<h2>مفيش كميات لسه</h2><p>الإجمالي بيتجمع تلقائي من كل الأماكن.</p></div>';
    var cur = null;
    agg.forEach(function (e, i) {
      if (e.cat !== cur) {
        if (cur) h += '</div>'; cur = e.cat;
        var sub = agg.filter(function (x) { return x.cat === cur; }).reduce(function (a, x) { return a + x.total; }, 0);
        h += '<div class="cat-h">' + CI[cur] + '<span>' + catBy[cur].n + '</span><em class="num">' + num(sub) + (cur === 'pipe' ? ' م' : '') + '</em></div><div class="rows">';
      }
      var open = UI.open['l' + i];
      var title = titleOf({ cat: e.cat, f: e.f });
      h += '<div class="line"><button data-a="toggle" data-k="l' + i + '"><span class="mn"><span class="tt">' + esc(title) + '</span>' + tagsHTML(e.cat, e.f, e.approx) + '</span>' +
        '<span class="qv" style="align-items:flex-end;display:flex;flex-direction:column"><b class="num" style="font-size:21px">' + num(e.total) + '</b><small style="color:var(--dim);font-size:12px">' + esc(e.unit) + '</small></span></button>';
      if (open) h += '<div class="per">' + S.places.filter(function (p) { return e.per[p.id]; }).map(function (p) { return '<div><span>' + esc(p.name) + '</span><b class="num">' + num(e.per[p.id]) + '</b></div>'; }).join('') + '</div>';
      h += '</div>';
    });
    return h + '</div><div style="height:12px"></div>';
  }
  function viewTools() {
    return '<div class="top"><h1>أدوات<span class="sub">تقديرات سريعة للمراجعة</span></h1></div><div style="height:14px"></div>' +
      '<div class="card"><h3>فاقد الاحتكاك في الماسورة</h3><div class="g2">' +
      '<label class="fld"><span>القطر (بوصة)</span><input class="in" id="h-d" inputmode="decimal" value="4"></label>' +
      '<label class="fld"><span>التصرف (لتر/د)</span><input class="in" id="h-q" inputmode="decimal" value="1000"></label>' +
      '<label class="fld"><span>الطول (م)</span><input class="in" id="h-l" inputmode="decimal" value="100"></label>' +
      '<label class="fld"><span>معامل C</span><input class="in" id="h-c" inputmode="decimal" value="120"></label></div>' +
      '<label class="fld" id="h-idwrap" style="display:none"><span>القطر الداخلي (مم)</span><input class="in" id="h-id" inputmode="decimal"></label>' +
      '<div id="h-out" class="out"></div></div>' +
      '<div class="card"><h3>تصرف الرشاش</h3><div class="g2">' +
      '<label class="fld"><span>معامل K (gpm/√psi)</span><input class="in" id="s-k" inputmode="decimal" value="5.6"></label>' +
      '<label class="fld"><span>الضغط (بار)</span><input class="in" id="s-p" inputmode="decimal" value="1"></label></div>' +
      '<label class="fld"><span>مساحة التغطية (م²) اختياري</span><input class="in" id="s-a" inputmode="decimal" value="12"></label>' +
      '<div id="s-out" class="out"></div></div>' +
      '<p class="hint">معادلة Hazen-Williams بقطر داخلي Sch40، والأرقام تقديرية وليست بديلاً عن الحساب الهيدروليكي الكامل.</p>';
  }
  function viewSettings() {
    var f = function (key, label) { return '<label class="fld"><span>' + label + '</span><input class="in" data-set="' + key + '" value="' + esc(S.project[key]) + '"></label>'; };
    return '<div class="top"><h1>الإعدادات</h1></div><div style="height:14px"></div>' +
      '<div class="card"><h3>بيانات المشروع</h3>' + f('name', 'اسم المشروع') + f('site', 'الموقع') + f('engineer', 'المهندس') + '</div>' +
      '<div class="card"><h3>التصدير</h3><button class="btn pri blk" data-a="exportXlsx">' + I.xls + 'تصدير Excel</button></div>' +
      '<div class="card"><h3>نسخة احتياطية</h3><div class="btns"><button class="btn" data-a="exportJson">حفظ نسخة</button><button class="btn" data-a="importJson">استرجاع</button></div>' +
      '<p class="hint" style="padding:10px 0 0">البيانات محفوظة على الجهاز فقط. خد نسخة قبل ما تمسح بيانات Safari.</p></div>' +
      '<div class="card"><h3>مسح</h3><button class="btn bad blk" data-a="resetAll">مسح كل البيانات</button></div>';
  }
  function render() {
    var v = UI.tab === 'places' ? (UI.pid ? viewPlace() : viewPlaces()) : UI.tab === 'total' ? viewTotal() : UI.tab === 'tools' ? viewTools() : viewSettings();
    var app = $('#app'), st = app.scrollTop; app.innerHTML = v;
    app.scrollTop = (arguments[0] === 0) ? 0 : st;
    var items = [['places', 'الأماكن', I.places], ['total', 'الإجمالي', I.total], ['tools', 'أدوات', I.tools], ['set', 'الإعدادات', I.set]];
    $('#nav').innerHTML = items.map(function (x) { return '<button data-a="tab" data-v="' + x[0] + '" class="' + (UI.tab === x[0] ? 'on' : '') + '"><i>' + x[2] + '</i>' + x[1] + '</button>'; }).join('');
    if (UI.tab === 'tools') { calcH(); calcS(); }
  }

  /* ========== الشيتات ========== */
  var SH = null, TXT = null, CONF = null;
  function showSheet(html, cls) {
    $('#sheet-root').innerHTML = '<div class="backdrop" data-a="closeSheet"></div><div class="sheet ' + (cls || '') + '" role="dialog"><div class="grab"></div>' + html + '</div>';
    document.body.classList.add('sheeted');
  }
  function closeSheet() { $('#sheet-root').innerHTML = ''; SH = null; TXT = null; CONF = null; document.body.classList.remove('sheeted'); }
  var PLACE_IDEAS = ['جمالون الصيانة', 'مستودع تخزين 1', 'مستودع تخزين 2', 'المخزن العام – جزء 1', 'المخزن العام – جزء 2', 'المخزن العام – جزء 3', 'البنزينة الداخلية', 'غرفة المضخات والخزانات'];
  function textSheet(title, val, cb, ph, ideas) {
    TXT = cb;
    var used = {}; S.places.forEach(function (p) { used[p.name] = 1; });
    var sug = (ideas || []).filter(function (n) { return !used[n]; });
    showSheet('<div class="sh-h"><h2>' + esc(title) + '</h2></div><div class="sh-b"><input class="in" id="t-in" placeholder="' + esc(ph || '') + '" value="' + esc(val || '') + '">' +
      (sug.length ? '<div class="sugg">' + sug.map(function (n) { return '<button class="chip" data-a="sugg" data-v="' + esc(n) + '">' + esc(n) + '</button>'; }).join('') + '</div>' : '') +
      '<button class="btn pri blk" data-a="textOk">حفظ</button></div>');
    var i = $('#t-in'); if (i) { i.focus(); i.select(); }
  }
  function confirmSheet(msg, label, cb) {
    CONF = cb;
    showSheet('<div class="sh-h"><h2>' + esc(msg) + '</h2></div><div class="sh-b"><div class="btns"><button class="btn" data-a="closeSheet">إلغاء</button><button class="btn pri" data-a="confOk">' + esc(label) + '</button></div></div>');
  }

  /* --- شيت البند --- */
  function defaultsFor(c) {
    var f = {}; c.f.forEach(function (fd) { if (fd.def) f[fd.k] = fd.def; });
    var l = S.last[c.k]; if (l) Object.keys(l).forEach(function (k) { if (l[k]) f[k] = l[k]; });
    return f;
  }
  function openItem(id) {
    var p = curP(), r = id && p.rows.find(function (x) { return x.id === id; });
    var cat = r ? r.cat : (catBy[S.lastCat] ? S.lastCat : 'pipe');
    SH = { pid: p.id, id: r ? r.id : null, cat: cat, f: r ? Object.assign({}, r.f) : defaultsFor(catBy[cat]), qs: r ? String(r.qty) : '', fresh: !!r, approx: r ? r.approx : false, note: r ? r.note : '', showNote: !!(r && r.note), tg: null, ci: null };
    drawSheet();
  }
  function chipHTML(c, fd, o, i, on) {
    return '<button class="chip' + (on ? ' on' : '') + '" data-a="opt" data-k="' + fd.k + '" data-i="' + i + '">' + (o.c ? '<i class="dot" style="background:' + o.c + '"></i>' : '') + esc(o.n ? o.v + ' ' + o.n : o.v) + '</button>';
  }
  function fieldsHTML() {
    var c = catBy[SH.cat], h = '';
    c.f.forEach(function (fd) {
      h += '<div class="fl">' + esc(fd.l) + (fd.req ? '<i></i>' : '') + '</div>';
      if (fd.t === 'text') { h += '<input class="in" id="f-' + fd.k + '" data-f="' + fd.k + '" placeholder="اكتب الاسم" value="' + esc(SH.f[fd.k] || '') + '" style="margin:0">'; return; }
      var opts = fieldOpts(c, fd), sel = SH.f[fd.k], found = false;
      h += '<div class="chips">';
      opts.forEach(function (o, i) { var on = sel === o.v; if (on) found = true; h += chipHTML(c, fd, o, i, on); });
      if (sel && !found) h += '<button class="chip on" data-a="opt" data-k="' + fd.k + '" data-i="-1">' + esc(sel) + '</button>';
      if (fd.t === 'dia' || fd.t === 'num') h += '<button class="chip more' + (SH.tg && SH.tg === fd.k ? ' on' : '') + '" data-a="tg" data-k="' + fd.k + '">' + (SH.tg === fd.k ? 'بكتب…' : 'غير ذلك') + '</button>';
      else h += '<button class="chip more" data-a="ci" data-k="' + fd.k + '">+ غير ذلك</button>';
      h += '</div>';
      if (SH.ci === fd.k) h += '<div class="ci"><input class="in" id="ci-in" placeholder="اكتب القيمة"><button class="btn pri" data-a="ciOk">إضافة</button></div>';
    });
    h += '<div class="fl">ملاحظات</div><div class="chips"><button class="chip' + (SH.approx ? ' on' : '') + '" data-a="approx">تقريبي</button><button class="chip' + (SH.showNote ? ' on' : '') + '" data-a="noteT">ملاحظة</button></div>';
    if (SH.showNote) h += '<input class="in" id="f-note" placeholder="اكتب ملاحظة" value="' + esc(SH.note) + '" style="margin:10px 0 0">';
    return h;
  }
  function drawSheet() {
    var c = catBy[SH.cat], editing = !!SH.id;
    var head = '<div class="sh-h"><h2>' + CI[SH.cat] + (editing ? 'تعديل ' + esc(c.n) : 'بند جديد') + '</h2>' +
      (editing ? '<button class="ib" data-a="delItem" aria-label="حذف">' + I.trash + '</button>' : '') +
      '<button class="btn" style="height:42px;padding:0 16px" data-a="closeSheet">' + (editing ? 'إلغاء' : 'تم') + '</button></div>';
    var strip = editing ? '' : '<div class="strip" id="strip">' + CATS.map(function (x) { return '<button class="cbtn' + (x.k === SH.cat ? ' on' : '') + '" data-a="cat" data-v="' + x.k + '">' + CI[x.k] + x.n + '</button>'; }).join('') + '</div>';
    var keys = ['7', '8', '9', 'back', '4', '5', '6', 'plus', '1', '2', '3', '.', '0', 'clr'];
    var kp = '<div class="kp" id="kp">' + keys.map(function (k) { return '<button class="k' + (/^[a-z]/.test(k) ? ' op' : '') + '" data-a="key" data-v="' + k + '" id="k-' + k + '">' + ({ back: '⌫', plus: '+', clr: 'مسح' }[k] || k) + '</button>'; }).join('') +
      '<button class="k go" data-a="go" id="k-go"></button></div>';
    var keep = $('#strip') ? $('#strip').scrollLeft : 0;
    showSheet(head + strip + '<div class="fields" id="fields"></div><div class="qwrap" id="qwrap"></div>' + kp, 'tall');
    $('#fields').innerHTML = fieldsHTML(); drawQty();
    if ($('#strip')) { var on = $('#strip .on'); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' }); }
  }
  function drawFields() { var f = $('#fields'); if (!f) return; var st = f.scrollTop; f.innerHTML = fieldsHTML(); f.scrollTop = st; }
  function qPreview() {
    if (SH.tg || SH.qs.indexOf('+') < 0) return '';
    var v = parseQty(SH.qs.replace(/\+$/, '')); return isNaN(v) ? '' : '= ' + num(v);
  }
  function drawQty() {
    var c = catBy[SH.cat], q = $('#qwrap'); if (!q) return;
    var tgf = SH.tg && c.f.find(function (x) { return x.k === SH.tg; });
    var label = tgf ? tgf.l : c.ql, val = tgf ? (SH.tgs || '') : SH.qs, u = tgf ? '' : (SH.cat === 'other' ? (SH.f.unit || 'عدد') : c.u);
    q.innerHTML = '<div class="ql">' + esc(label) + '<small>' + (tgf ? 'اكتب القيمة واضغط تم' : qPreview()) + '</small></div><div class="qv' + (val ? '' : ' ph') + '">' + esc(val || '0') + '</div><div class="qu">' + esc(u) + '</div>';
    var go = $('#k-go'); if (go) go.textContent = tgf ? 'تم' : (SH.id ? 'حفظ' : 'حفظ والتالي');
    var pl = $('#k-plus'); if (pl) { pl.textContent = tgf ? (tgf.t === 'dia' ? '/' : '') : '+'; pl.classList.toggle('off', !!tgf && tgf.t !== 'dia'); }
  }
  function pressKey(v) {
    var tg = !!SH.tg, key = tg ? 'tgs' : 'qs', s = SH[key] || '';
    if (v === 'back') { s = s.slice(0, -1); SH.fresh = false; }
    else if (v === 'clr') { s = ''; SH.fresh = false; }
    else if (v === 'plus') {
      var sep = tg ? '/' : '+';
      if (!s || /[+/]$/.test(s) || (tg && s.indexOf('/') > -1)) return; s += sep; SH.fresh = false;
    } else {
      if (SH.fresh && !tg) { s = ''; SH.fresh = false; }
      var seg = s.split(/[+/]/).pop();
      if (v === '.') { if (seg.indexOf('.') > -1) return; s += seg === '' ? '0.' : '.'; }
      else { if (seg === '0') s = s.slice(0, -1) + v; else s += v; }
      if (s.length > 22) return;
    }
    SH[key] = s; drawQty();
  }
  function commitTarget() {
    var c = catBy[SH.cat], fd = c.f.find(function (x) { return x.k === SH.tg; }), raw = toLatin(SH.tgs || '').replace(/[+/]$/, '');
    if (!raw) { SH.tg = null; SH.tgs = ''; drawFields(); drawQty(); return; }
    var val;
    if (fd.t === 'dia') { var n = diaNum(raw); if (!(n > 0)) { toast('قطر غير صالح'); return; } val = fmtDia(raw); }
    else { var n2 = Number(raw); if (!isFinite(n2) || n2 <= 0) { toast('رقم غير صالح'); return; } val = String(n2); }
    SH.f[fd.k] = val; addCustom(c, fd, val);
    SH.tg = null; SH.tgs = ''; drawFields(); drawQty();
  }
  function addCustom(c, fd, val) {
    var have = (fd.o || []).map(optObj).some(function (o) { return o.v === val; }), key = c.k + '.' + fd.k;
    var list = S.custom[key] || (S.custom[key] = []);
    if (!have && list.indexOf(val) < 0) list.push(val);
  }
  function saveItem() {
    var c = catBy[SH.cat], p = S.places.find(function (x) { return x.id === SH.pid; });
    for (var i = 0; i < c.f.length; i++) {
      var fd = c.f[i]; if (fd.req && !String(SH.f[fd.k] || '').trim()) { toast('اختار: ' + fd.l); return; }
    }
    var qty = parseQty(SH.qs.replace(/\+$/, ''));
    if (!(qty > 0)) { toast('اكتب الكمية'); return; }
    var f = {}; c.f.forEach(function (fd) { var v = String(SH.f[fd.k] || '').trim(); if (v) f[fd.k] = v; });
    var data = { cat: SH.cat, f: f, qty: qty, note: String(SH.note || '').trim(), approx: SH.approx };
    var lf = Object.assign({}, f); if (SH.cat === 'other') delete lf.name;
    S.last[SH.cat] = lf; S.lastCat = SH.cat;
    var msg;
    if (SH.id) {
      var row = p.rows.find(function (x) { return x.id === SH.id; });
      Object.assign(row, data);
      var k = rowKey(row.cat, row.f), twin = p.rows.find(function (x) { return x !== row && rowKey(x.cat, x.f) === k; });
      if (twin) { twin.qty = Math.round((twin.qty + row.qty) * 1000) / 1000; twin.approx = twin.approx || row.approx; p.rows = p.rows.filter(function (x) { return x !== row; }); }
      msg = 'تم الحفظ';
    } else {
      var k2 = rowKey(data.cat, data.f), same = p.rows.find(function (x) { return rowKey(x.cat, x.f) === k2; });
      if (same) { same.qty = Math.round((same.qty + qty) * 1000) / 1000; same.approx = same.approx || data.approx; if (data.note) same.note = data.note; msg = 'اتجمع على البند — الإجمالي ' + num(same.qty); }
      else { data.id = uid(); p.rows.push(data); msg = 'تم حفظ ' + titleOf(data) + ' — ' + num(qty); }
    }
    save();
    if (SH.id) { closeSheet(); render(); toast(msg); return; }
    SH.qs = ''; SH.note = ''; SH.showNote = false; SH.approx = false; SH.fresh = false;
    drawFields(); drawQty(); toast(msg); render();
  }

  /* ========== التصدير ========== */
  var dlCell = function (f) {
    if (f.dia2) return (f.dia || '') + '×' + f.dia2;
    var n = diaNum(f.dia); return f.dia && /^\d+(\.\d+)?$/.test(f.dia) ? Number(f.dia) : (f.dia || '');
  };
  function buildXlsx() {
    var H = function (arr) { return arr.map(function (v) { return { v: v, st: 'h' }; }); };
    var agg = aggregate(), sheets = [];
    var head = ['البند', 'المواصفات', 'القطر (بوصة)'].concat(S.places.map(function (p) { return p.name; }), ['الإجمالي', 'الوحدة']);
    var rows = [H(head)];
    agg.forEach(function (e, i) {
      var line = [e.cat === 'other' ? (e.f.name || 'بند') : catBy[e.cat].n, specTxt(e.cat, e.f) + (e.approx ? (specTxt(e.cat, e.f) ? ' - ' : '') + 'تقريبي' : ''), e.cat === 'other' ? '' : dlCell(e.f)];
      S.places.forEach(function (p) { line.push(e.per[p.id] ? Math.round(e.per[p.id] * 1000) / 1000 : ''); });
      line.push({ v: Math.round(e.total * 1000) / 1000, f: 'SUM(D' + (i + 2) + ':' + xlsxColLetter(2 + S.places.length) + (i + 2) + ')' }, e.unit);
      rows.push(line);
    });
    sheets.push({ name: 'الإجمالي', widths: [18, 34, 12].concat(S.places.map(function () { return 14; }), [12, 9]), rows: rows });
    S.places.forEach(function (p) {
      var rs = [H(['البند', 'المواصفات', 'القطر (بوصة)', 'الطول (م)', 'العدد', 'ملاحظات'])], pipe = 0, cnt = 0;
      p.rows.slice().sort(cmp).forEach(function (r) {
        var u = unitOf(r), isLen = u === 'م', notes = [];
        if (!isLen && u !== 'عدد') notes.push('الوحدة: ' + u);
        if (r.approx) notes.push('تقريبي'); if (r.note) notes.push(r.note);
        if (isLen) pipe += r.qty; else cnt += r.qty;
        rs.push([r.cat === 'other' ? (r.f.name || 'بند') : catBy[r.cat].n, specTxt(r.cat, r.f), r.cat === 'other' ? '' : dlCell(r.f), isLen ? r.qty : '', isLen ? '' : r.qty, notes.join(' - ')]);
      });
      var n = rs.length;
      rs.push([{ v: 'الإجمالي', st: 't' }, { v: '', st: 't' }, { v: '', st: 't' }, { v: pipe, f: 'SUM(D2:D' + n + ')', st: 't' }, { v: cnt, f: 'SUM(E2:E' + n + ')', st: 't' }, { v: '', st: 't' }]);
      sheets.push({ name: p.name, widths: [18, 34, 12, 11, 9, 28], rows: rs });
    });
    sheets.push({ name: 'بيانات المشروع', widths: [16, 36], rows: [H(['البيان', 'القيمة']), ['المشروع', S.project.name || ''], ['الموقع', S.project.site || ''], ['المهندس', S.project.engineer || ''], ['تاريخ التصدير', today()]] });
    return makeXlsx(sheets);
  }
  async function deliver(blob, filename) {
    try {
      var file = new File([blob], filename, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: filename }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }

  /* ========== الحاسبات ========== */
  var v = function (id) { var e = document.getElementById(id); return e ? Number(toLatin(e.value).replace(/\s/g, '')) : NaN; };
  function calcH() {
    var out = $('#h-out'); if (!out) return;
    var dn = diaNum(($('#h-d') || {}).value || ''), id = ID_MM[String(dn)];
    $('#h-idwrap').style.display = dn && !id ? 'block' : 'none';
    if (!id) id = v('h-id');
    var Q = v('h-q'), Lm = v('h-l'), C = v('h-c');
    if (!(Q > 0 && id > 0 && Lm >= 0 && C > 0)) { out.innerHTML = 'أدخل القيم بالأرقام'; return; }
    var perM = 6.05e5 * Math.pow(Q, 1.85) / (Math.pow(C, 1.85) * Math.pow(id, 4.87));
    var vel = (Q / 60000) / (Math.PI * Math.pow(id / 1000, 2) / 4), tot = perM * Lm;
    out.innerHTML = 'القطر الداخلي: <b>' + num(id) + '</b> مم<br>السرعة: <b>' + num(vel) + '</b> م/ث ' + (vel > 6 ? '<span class="warn">⚠ أعلى من 6 م/ث</span>' : '<span class="ok">✓</span>') +
      '<br>الفاقد: <b>' + perM.toFixed(4) + '</b> بار/م<br>الفاقد الكلي: <b>' + tot.toFixed(3) + '</b> بار (<b>' + (tot * 14.5038).toFixed(2) + '</b> psi)';
  }
  function calcS() {
    var out = $('#s-out'); if (!out) return;
    var K = v('s-k'), Pp = v('s-p'), A = v('s-a');
    if (!(K > 0 && Pp >= 0)) { out.innerHTML = 'أدخل القيم بالأرقام'; return; }
    var Q = K * Math.sqrt(Pp * 14.5038) * 1; // K بوحدة gpm/√psi
    var lpm = Q * 3.78541;
    out.innerHTML = 'التصرف: <b>' + num(lpm) + '</b> لتر/د (<b>' + num(Q) + '</b> gpm)' + (A > 0 ? '<br>كثافة الصرف: <b>' + num(lpm / A) + '</b> مم/د' : '');
  }

  /* ========== الأحداث ========== */
  var toastT;
  function toast(m) {
    var t = $('#toast'); t.textContent = m; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2000);
  }
  var A = {
    tab: function (t) { UI.tab = t.dataset.v; UI.pid = null; render(0); },
    openP: function (t) { UI.pid = t.dataset.id; render(0); },
    back: function () { UI.pid = null; render(0); },
    addPlace: function () {
      textSheet('اسم المكان', '', function (val) { var p = { id: uid(), name: val, rows: [] }; S.places.push(p); save(); closeSheet(); UI.tab = 'places'; UI.pid = p.id; render(0); }, 'مثال: مستودع 3', PLACE_IDEAS);
    },
    sugg: function (t) { var i = $('#t-in'); i.value = t.dataset.v; i.focus(); },
    pMenu: function () {
      showSheet('<div class="sh-h"><h2>' + esc(curP().name) + '</h2></div><div class="sh-b"><div class="opts"><button class="btn" data-a="pRename">تغيير الاسم</button><button class="btn" data-a="pDup">نسخ المكان بكل بنوده</button><button class="btn bad" data-a="pDel">حذف المكان</button></div></div>');
    },
    pRename: function () { var p = curP(); textSheet('اسم المكان', p.name, function (val) { p.name = val; save(); closeSheet(); render(); }); },
    pDup: function () {
      var p = curP(), c = JSON.parse(JSON.stringify(p)); c.id = uid(); c.name = p.name + ' (نسخة)'; c.rows.forEach(function (r) { r.id = uid(); });
      S.places.splice(S.places.indexOf(p) + 1, 0, c); save(); closeSheet(); UI.pid = c.id; render(0); toast('تم النسخ');
    },
    pDel: function () {
      var p = curP(); confirmSheet('حذف «' + p.name + '» وكل بنوده؟', 'حذف', function () { S.places = S.places.filter(function (x) { return x !== p; }); UI.pid = null; save(); closeSheet(); render(0); });
    },
    addItem: function () { openItem(null); },
    edit: function (t) { openItem(t.dataset.id); },
    inc: function (t) { var r = curP().rows.find(function (x) { return x.id === t.dataset.id; }); r.qty = Math.round((r.qty + 1) * 1000) / 1000; save(); render(); },
    cat: function (t) {
      SH.cat = t.dataset.v; SH.f = defaultsFor(catBy[SH.cat]); SH.tg = null; SH.ci = null; SH.tgs = '';
      var strip = $('#strip'), sl = strip ? strip.scrollLeft : 0;
      document.querySelectorAll('#strip .cbtn').forEach(function (b) { b.classList.toggle('on', b.dataset.v === SH.cat); });
      var h2 = $('.sh-h h2'); if (h2) h2.innerHTML = CI[SH.cat] + 'بند جديد';
      drawFields(); drawQty(); $('#fields').scrollTop = 0;
    },
    opt: function (t) {
      var c = catBy[SH.cat], fd = c.f.find(function (x) { return x.k === t.dataset.k; }), i = Number(t.dataset.i);
      if (i < 0) { delete SH.f[fd.k]; } else { var val = fieldOpts(c, fd)[i].v; if (SH.f[fd.k] === val) delete SH.f[fd.k]; else SH.f[fd.k] = val; }
      drawFields();
    },
    tg: function (t) { SH.tg = SH.tg === t.dataset.k ? null : t.dataset.k; SH.tgs = ''; SH.ci = null; drawFields(); drawQty(); },
    ci: function (t) {
      SH.ci = SH.ci === t.dataset.k ? null : t.dataset.k; SH.tg = null; drawFields(); drawQty();
      var i = $('#ci-in'); if (i) i.focus();
    },
    ciOk: function () {
      var c = catBy[SH.cat], fd = c.f.find(function (x) { return x.k === SH.ci; }), val = ($('#ci-in').value || '').trim();
      if (!val) { SH.ci = null; drawFields(); return; }
      SH.f[fd.k] = val; addCustom(c, fd, val); SH.ci = null; drawFields();
    },
    approx: function () { SH.approx = !SH.approx; drawFields(); },
    noteT: function () { SH.showNote = !SH.showNote; drawFields(); if (SH.showNote) { var i = $('#f-note'); if (i) i.focus(); } },
    key: function (t) { pressKey(t.dataset.v); },
    go: function () { if (SH.tg) commitTarget(); else saveItem(); },
    closeSheet: function () { closeSheet(); render(); },
    delItem: function () {
      var id = SH.id, pid = SH.pid;
      confirmSheet('حذف هذا البند؟', 'حذف', function () { var p = S.places.find(function (x) { return x.id === pid; }); p.rows = p.rows.filter(function (x) { return x.id !== id; }); save(); closeSheet(); render(); toast('تم الحذف'); });
    },
    textOk: function () { var val = ($('#t-in').value || '').trim(); if (!val) return; if (TXT) TXT(val); },
    confOk: function () { if (CONF) CONF(); },
    toggle: function (t) { var k = t.dataset.k; UI.open[k] = !UI.open[k]; render(); },
    exportXlsx: function () { if (!S.places.length) { toast('ضيف مكان الأول'); return; } deliver(buildXlsx(), 'fire-boq-' + today() + '.xlsx'); },
    exportJson: function () { deliver(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }), 'fire-boq-backup-' + today() + '.json'); },
    importJson: function () { $('#imp').click(); },
    resetAll: function () { confirmSheet('مسح كل البيانات نهائياً؟', 'مسح', function () { S = emptyState(); save(); closeSheet(); UI.pid = null; render(0); toast('تم المسح'); }); }
  };

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-a]');
    if (t && A[t.dataset.a]) A[t.dataset.a](t, e);
  });
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.f && SH) SH.f[t.dataset.f] = t.value;
    else if (t.id === 'f-note' && SH) SH.note = t.value;
    else if (t.dataset && t.dataset.set) { S.project[t.dataset.set] = t.value; save(); }
    else if (/^h-/.test(t.id)) calcH();
    else if (/^s-/.test(t.id)) calcS();
  });
  document.addEventListener('change', function (e) {
    if (e.target.id !== 'imp' || !e.target.files[0]) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var j = fix(JSON.parse(rd.result)); if (!j) throw new Error('bad');
        confirmSheet('استرجاع النسخة؟ هيتم استبدال البيانات الحالية.', 'استرجاع', function () { S = j; save(); closeSheet(); UI.pid = null; render(0); toast('تم الاسترجاع'); });
      } catch (err) { toast('الملف غير صالح'); }
    };
    rd.readAsText(e.target.files[0]); e.target.value = '';
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var id = e.target.id;
    if (id === 't-in') { e.preventDefault(); A.textOk(); }
    else if (id === 'ci-in') { e.preventDefault(); A.ciOk(); }
    else if (id === 'f-note' || (e.target.dataset && e.target.dataset.f)) { e.preventDefault(); e.target.blur(); }
  });

  /* ========== سلوك التطبيق: لا زووم، لوحة المفاتيح، أوفلاين ========== */
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (n) { document.addEventListener(n, function (e) { e.preventDefault(); }, { passive: false }); });
  document.addEventListener('touchmove', function (e) { if (e.touches.length > 1 || (e.scale && e.scale !== 1)) e.preventDefault(); }, { passive: false });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); });
  document.addEventListener('focusin', function (e) {
    var sh = $('.sheet'); if (sh && /^(INPUT|TEXTAREA)$/.test(e.target.tagName) && sh.classList.contains('tall')) sh.classList.add('kbd');
  });
  document.addEventListener('focusout', function () {
    setTimeout(function () { var sh = $('.sheet'), a = document.activeElement; if (sh && !(a && /^(INPUT|TEXTAREA)$/.test(a.tagName))) sh.classList.remove('kbd'); window.scrollTo(0, 0); }, 60);
  });
  if (window.visualViewport) {
    var fit = function () {
      var vv = window.visualViewport, kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty('--kb', (kb > 80 ? kb : 0) + 'px'); window.scrollTo(0, 0);
    };
    window.visualViewport.addEventListener('resize', fit); window.visualViewport.addEventListener('scroll', fit);
  }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }

  window.__fireboq = { state: function () { return S; }, build: buildXlsx };
  render(0);
})();
