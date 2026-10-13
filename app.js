'use strict';
(function () {
  /* ========== ثوابت ========== */
  var KEY = 'fireboq.v1', VERSION = '1.0';
  // أقطار داخلية تقريبية (Sch40) بالمم — للحاسبة فقط
  var ID_MM = { '1': 26.6, '1.25': 35.1, '1.5': 40.9, '2': 52.5, '2.5': 62.7, '3': 77.9, '4': 102.3, '5': 128.2, '6': 154.1, '8': 202.7, '10': 254.5, '12': 303.2 };
  var CATS = [
    { k: 'pipe', n: 'ماسورة', u: 'م', dia: 1 },
    { k: 'sprinkler', n: 'رشاش', u: 'عدد' },
    { k: 'box', n: 'صندوق حريق', u: 'عدد' },
    { k: 'valve', n: 'محبس', u: 'عدد', dia: 1 },
    { k: 'elbow', n: 'كوع', u: 'عدد', dia: 1 },
    { k: 'tee', n: 'تيه', u: 'عدد', dia: 1, dia2: 1 },
    { k: 'reducer', n: 'مسلوب', u: 'عدد', dia: 1, dia2: 1, need2: 1 },
    { k: 'nipple', n: 'ولد', u: 'عدد', dia: 1 },
    { k: 'pump', n: 'مضخة', u: 'عدد' },
    { k: 'tank', n: 'خزان', u: 'عدد' },
    { k: 'other', n: 'أخرى', u: 'عدد', custom: 1 }
  ];
  var catBy = {};
  CATS.forEach(function (c) { catBy[c.k] = c; });
  var catIdx = function (k) { return CATS.findIndex(function (c) { return c.k === k; }); };

  var I = {
    back: '<svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    more: '<svg class="ico" viewBox="0 0 24 24"><path d="M5 12h.01M12 12h.01M19 12h.01" stroke-width="3"/></svg>',
    buildings: '<svg class="ico" viewBox="0 0 24 24"><path d="M4 21V5l8-3 8 3v16M4 21h16M9 9h2M13 9h2M9 13h2M13 13h2M10 21v-4h4v4"/></svg>',
    summary: '<svg class="ico" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    tools: '<svg class="ico" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/></svg>',
    settings: '<svg class="ico" viewBox="0 0 24 24"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>'
  };

  /* ========== أدوات عامة ========== */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  };
  var num = function (n) { return (Math.round(n * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 }); };
  var uid = function () { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3); };
  var today = function () { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  var toLatin = function (s) {
    return String(s == null ? '' : s).replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }).replace(/[٫,،]/g, '.');
  };

  // يقبل: 12 | 12.5 | 12+8.5+20  (جمع مباشر للقياسات)
  function parseQty(s) {
    s = toLatin(s).replace(/\s+/g, '');
    if (!s || !/^[\d.+]+$/.test(s)) return NaN;
    var t = 0, parts = s.split('+');
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p === '') continue;
      var v = Number(p);
      if (!isFinite(v) || /\..*\./.test(p)) return NaN;
      t += v;
    }
    return Math.round(t * 1000) / 1000;
  }

  // القطر يُكتب يدوياً: 4 | 2.5 | 1.5 | 1/2 — يرجّع نصاً منظفاً أو null
  function normDia(s) {
    s = toLatin(s).replace(/["”″'’بوصة]/g, '').replace(/\s+/g, '');
    if (!s) return '';
    return /^\d+(\.\d+)?(\/\d+)?$/.test(s) ? s : null;
  }
  function diaNum(s) {
    s = String(s || '');
    if (s.indexOf('/') > -1) { var p = s.split('/'); return (Number(p[0]) / Number(p[1])) || 0; }
    return Number(s) || 0;
  }

  /* ========== الحالة ========== */
  function seed() {
    var names = ['جمالون الصيانة', 'مستودع تخزين 1', 'مستودع تخزين 2', 'المخزن العام – جزء 1', 'المخزن العام – جزء 2', 'المخزن العام – جزء 3', 'البنزينة الداخلية', 'غرفة المضخات والخزانات'];
    return {
      v: 1, last: {}, lastCat: 'pipe',
      project: { name: 'حصر نظام مكافحة الحريق', client: 'سيسكو', site: '', engineer: '' },
      buildings: names.map(function (n) { return { id: uid(), name: n, rows: [] }; })
    };
  }
  function fix(j) {
    if (!j || !Array.isArray(j.buildings)) return null;
    j.project = Object.assign({ name: '', client: '', site: '', engineer: '' }, j.project || {});
    j.last = j.last || {}; j.lastCat = j.lastCat || 'pipe';
    j.buildings.forEach(function (b) {
      b.id = b.id || uid(); b.name = b.name || 'مبنى'; b.rows = Array.isArray(b.rows) ? b.rows : [];
      b.rows.forEach(function (r) { r.id = r.id || uid(); r.qty = Number(r.qty) || 0; });
    });
    return j;
  }
  function load() {
    try { var j = fix(JSON.parse(localStorage.getItem(KEY))); if (j) return j; } catch (e) { /* ignore */ }
    return seed();
  }
  var S = load();
  var UI = { tab: 'buildings', bid: null, open: {} };
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('تعذّر الحفظ — خد نسخة احتياطية من الإعدادات'); }
  }

  /* ========== منطق الحصر ========== */
  var curB = function () { return S.buildings.find(function (b) { return b.id === UI.bid; }); };
  var unitOf = function (r) { return r.cat === 'other' ? (r.unit || 'عدد') : catBy[r.cat].u; };
  var rowKey = function (r) { return [r.cat, r.dia || '', r.dia2 || '', r.cat === 'other' ? (r.name || '').trim() + '|' + (r.unit || 'عدد') : ''].join('~'); };
  function diaText(r) { return r.dia ? (r.dia2 ? r.dia + '"×' + r.dia2 + '"' : r.dia + '"') : ''; }
  function nameOf(r) { return r.cat === 'other' ? (r.name || 'بند') : catBy[r.cat].n; }
  function labelTxt(r) { var d = diaText(r); return nameOf(r) + (d ? ' ' + d : ''); }
  function labelHTML(r) {
    var d = diaText(r);
    return esc(nameOf(r)) + (d ? ' <bdi class="dia">' + esc(d) + '</bdi>' : '');
  }
  var cmpItems = function (a, b) {
    return catIdx(a.cat) - catIdx(b.cat) || diaNum(b.dia) - diaNum(a.dia) || diaNum(b.dia2) - diaNum(a.dia2) ||
      String(a.name || '').localeCompare(String(b.name || ''), 'ar');
  };
  function bTotals(b) {
    var t = { pipe: 0, spr: 0, box: 0 };
    b.rows.forEach(function (r) {
      if (r.cat === 'pipe') t.pipe += r.qty; else if (r.cat === 'sprinkler') t.spr += r.qty; else if (r.cat === 'box') t.box += r.qty;
    });
    return t;
  }
  function gTotals() {
    var t = { pipe: 0, spr: 0, box: 0 };
    S.buildings.forEach(function (b) { var x = bTotals(b); t.pipe += x.pipe; t.spr += x.spr; t.box += x.box; });
    return t;
  }
  function aggregate() {
    var map = {}, list = [];
    S.buildings.forEach(function (b) {
      b.rows.forEach(function (r) {
        var k = rowKey(r), e = map[k];
        if (!e) {
          e = map[k] = { k: k, cat: r.cat, dia: r.dia || '', dia2: r.dia2 || '', name: r.name || '', unit: unitOf(r), per: {}, total: 0, approx: false };
          list.push(e);
        }
        e.per[b.id] = (e.per[b.id] || 0) + r.qty; e.total += r.qty;
        if (r.approx) e.approx = true;
      });
    });
    return list.sort(cmpItems);
  }

  /* ========== عرض الصفحات ========== */
  function tiles(t) {
    return '<div class="tiles"><div class="tile"><b>' + num(t.pipe) + '</b><span>مواسير (م)</span></div>' +
      '<div class="tile"><b>' + num(t.spr) + '</b><span>رشاش</span></div>' +
      '<div class="tile"><b>' + num(t.box) + '</b><span>صندوق حريق</span></div></div>';
  }

  function viewBuildings() {
    var h = '<header class="top"><div class="ttl"><h1>' + esc(S.project.name || 'حصر الحريق') + '</h1><p>' + esc(S.project.client) + '</p></div></header><main>';
    h += tiles(gTotals());
    S.buildings.forEach(function (b) {
      var t = bTotals(b);
      h += '<button class="card" data-a="openB" data-id="' + b.id + '"><h2>' + esc(b.name) + '</h2><div class="meta">' +
        '<span class="pill">' + b.rows.length + ' بند</span>' +
        (t.pipe ? '<span class="pill">مواسير ' + num(t.pipe) + ' م</span>' : '') +
        (t.spr ? '<span class="pill">رشاش ' + num(t.spr) + '</span>' : '') +
        (t.box ? '<span class="pill">صناديق ' + num(t.box) + '</span>' : '') + '</div></button>';
    });
    h += '<button class="btn ghost wide" data-a="addBuilding">＋ إضافة مبنى</button></main>';
    return h;
  }

  function rowCard(r) {
    var u = unitOf(r), step = u !== 'م';
    return '<div class="row" data-a="editItem" data-id="' + r.id + '"><div class="rmain"><div class="rname">' + labelHTML(r) +
      (r.approx ? '<span class="tag">تقريبي</span>' : '') + '</div>' + (r.note ? '<div class="rnote">' + esc(r.note) + '</div>' : '') + '</div>' +
      (step ? '<div class="step"><button data-a="inc" data-id="' + r.id + '" data-d="-1" aria-label="نقص">−</button><button data-a="inc" data-id="' + r.id + '" data-d="1" aria-label="زيادة">＋</button></div>' : '') +
      '<div class="rqty"><b>' + num(r.qty) + '</b><small>' + esc(u) + '</small></div></div>';
  }

  function viewBuilding() {
    var b = curB();
    if (!b) { UI.bid = null; return viewBuildings(); }
    var rows = b.rows.slice().sort(cmpItems);
    var h = '<header class="top"><button class="ibtn" data-a="back" aria-label="رجوع">' + I.back + '</button><div class="ttl"><h1>' + esc(b.name) +
      '</h1><p>' + b.rows.length + ' بند</p></div><button class="ibtn" data-a="bMenu" aria-label="خيارات">' + I.more + '</button></header><main>';
    h += tiles(bTotals(b));
    if (!rows.length) h += '<div class="empty">لا توجد بنود بعد.<br>اضغط «إضافة بند» وابدأ بالمواسير والرشاشات.</div>';
    var cur = '';
    rows.forEach(function (r) {
      if (r.cat !== cur) { cur = r.cat; h += '<h3 class="sec">' + esc(catBy[r.cat].n) + '</h3>'; }
      h += rowCard(r);
    });
    return h + '</main><button class="fab" data-a="addItem">＋ إضافة بند</button>';
  }

  function viewSummary() {
    var agg = aggregate(), h = '<header class="top"><div class="ttl"><h1>الإجمالي</h1><p>كل المباني معاً</p></div></header><main>';
    h += tiles(gTotals());
    if (!agg.length) h += '<div class="empty">لسه مفيش بنود. ابدأ بإدخال الكميات من تبويب «المباني».</div>';
    var cur = '';
    agg.forEach(function (e) {
      if (e.cat !== cur) { cur = e.cat; h += '<h3 class="sec">' + esc(catBy[e.cat].n) + '</h3>'; }
      var r = { cat: e.cat, dia: e.dia, dia2: e.dia2, name: e.name }, open = UI.open[e.k];
      h += '<div class="srow"><button class="shead" data-a="toggle" data-k="' + esc(e.k) + '"><div class="rname">' + labelHTML(r) +
        (e.approx ? '<span class="tag">تقريبي</span>' : '') + '</div><div class="rqty"><b>' + num(e.total) + '</b><small>' + esc(e.unit) + '</small></div></button>';
      if (open) {
        h += '<div class="sbrk">';
        S.buildings.forEach(function (b) { if (e.per[b.id]) h += '<div><span>' + esc(b.name) + '</span><b>' + num(e.per[b.id]) + '</b></div>'; });
        h += '</div>';
      }
      h += '</div>';
    });
    if (agg.length) h += '<div class="btns"><button class="btn" data-a="exportXlsx">تصدير Excel</button><button class="btn ghost" data-a="printReport">PDF / طباعة</button></div>';
    return h + '</main>';
  }

  function viewTools() {
    return '<header class="top"><div class="ttl"><h1>أدوات حسابية</h1><p>تقدير سريع في الموقع</p></div></header><main>' +
      '<section class="panel"><h3>فاقد الاحتكاك في الماسورة</h3><div class="grid2">' +
      '<label>التصرف (لتر/دقيقة)<input id="h-q" class="ltr" inputmode="decimal" value="1000"></label>' +
      '<label>القطر (بوصة)<input id="h-d" class="ltr" inputmode="decimal" value="4"></label>' +
      '<label>الطول (م)<input id="h-l" class="ltr" inputmode="decimal" value="50"></label>' +
      '<label>معامل C<input id="h-c" class="ltr" inputmode="decimal" value="120"></label></div>' +
      '<div id="h-idwrap" style="display:none;margin-top:10px"><label>قطر داخلي (مم) — قطر غير قياسي<input id="h-id" class="ltr" inputmode="decimal" placeholder="مثال: 102.3"></label></div>' +
      '<div id="h-out" class="out"></div><p class="hint">معادلة Hazen-Williams بقطر داخلي Sch40. تقدير سريع وليس بديلاً عن الحساب الهيدروليكي الكامل.</p></section>' +
      '<section class="panel"><h3>تصرف الرشاش وكثافة الصرف</h3><div class="grid2">' +
      '<label>معامل K (لتر/د/√بار)<input id="s-k" class="ltr" inputmode="decimal" value="80"></label>' +
      '<label>الضغط (بار)<input id="s-p" class="ltr" inputmode="decimal" value="1"></label>' +
      '<label>مساحة تغطية الرشاش (م²)<input id="s-a" class="ltr" inputmode="decimal" value="12"></label></div>' +
      '<div id="s-out" class="out"></div><p class="hint">Q = K × √P. المعامل 80 يساوي تقريباً K=5.6 (جالون/د/√psi).</p></section></main>';
  }

  function viewSettings() {
    var p = S.project, standalone = (navigator.standalone === true) || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
    var f = function (key, label, ph) {
      return '<label>' + label + '<input data-set="' + key + '" value="' + esc(p[key]) + '" placeholder="' + (ph || '') + '"></label>';
    };
    return '<header class="top"><div class="ttl"><h1>الإعدادات</h1><p>الإصدار ' + VERSION + '</p></div></header><main>' +
      '<section class="panel"><h3>بيانات المشروع (تظهر في التصدير)</h3>' + f('name', 'اسم المشروع') + '<div style="height:10px"></div>' +
      f('client', 'الشركة') + '<div style="height:10px"></div>' + f('site', 'الموقع') + '<div style="height:10px"></div>' + f('engineer', 'المهندس') + '</section>' +
      '<section class="panel"><h3>نسخة احتياطية</h3><p class="hint" style="margin-top:0">البيانات محفوظة على الجهاز فقط. خد نسخة بشكل دوري، خصوصاً قبل مسح بيانات المتصفح.</p>' +
      '<div class="btns"><button class="btn" data-a="exportJson">حفظ نسخة</button><button class="btn ghost" data-a="importJson">استرجاع</button></div>' +
      '<input type="file" id="imp" accept=".json,application/json" hidden></section>' +
      (standalone ? '' : '<section class="panel"><h3>التثبيت على الآيفون</h3><p class="hint" style="margin-top:0">افتح الرابط في Safari ← زر المشاركة ← «إضافة إلى الشاشة الرئيسية». بعدها يشتغل بدون إنترنت.</p></section>') +
      '<section class="panel"><h3>تصفير</h3><button class="btn danger wide" data-a="resetAll" style="margin-top:0">مسح كل البيانات</button></section></main>';
  }

  function render(top) {
    var y = window.scrollY;
    var views = { buildings: viewBuildings, summary: viewSummary, tools: viewTools, settings: viewSettings };
    $('#app').innerHTML = UI.bid ? viewBuilding() : views[UI.tab]();
    var items = [['buildings', 'المباني'], ['summary', 'الإجمالي'], ['tools', 'الأدوات'], ['settings', 'الإعدادات']];
    $('#nav').innerHTML = items.map(function (x) {
      return '<button data-a="tab" data-v="' + x[0] + '" class="' + (!UI.bid && UI.tab === x[0] || UI.bid && x[0] === 'buildings' ? 'on' : '') + '">' + I[x[0]] + '<span>' + x[1] + '</span></button>';
    }).join('');
    window.scrollTo(0, top === 0 ? 0 : y);
    if (!UI.bid && UI.tab === 'tools') { calcH(); calcS(); }
  }

  /* ========== النوافذ السفلية ========== */
  var SH = null, TXT = null, CONF = null;
  function showSheet(html) { $('#sheet-root').innerHTML = '<div class="backdrop" data-a="closeSheet"></div><div class="sheet" role="dialog">' + '<div class="grab"></div>' + html + '</div>'; }
  function closeSheet() { $('#sheet-root').innerHTML = ''; SH = null; TXT = null; CONF = null; }

  function textSheet(title, val, cb, ph) {
    TXT = { cb: cb };
    showSheet('<h2>' + esc(title) + '</h2><input id="t-in" class="inp" value="' + esc(val) + '" placeholder="' + esc(ph || '') + '" enterkeyhint="done">' +
      '<div class="btns"><button class="btn ghost" data-a="closeSheet">إلغاء</button><button class="btn" data-a="textOk">حفظ</button></div>');
    var i = $('#t-in'); i.focus(); i.select();
  }
  function confirmSheet(msg, label, cb) {
    CONF = cb;
    showSheet('<h2>' + esc(msg) + '</h2><div class="btns"><button class="btn ghost" data-a="closeSheet">إلغاء</button><button class="btn danger" data-a="confOk">' + esc(label) + '</button></div>');
  }

  /* ----- نافذة إدخال البند (الإدخال سريع: كل شيء يُكتب يدوياً) ----- */
  function openItem(id) {
    var b = curB(); if (!b) return;
    var r = id && b.rows.find(function (x) { return x.id === id; });
    if (r) {
      SH = { bid: b.id, id: r.id, cat: r.cat, dia: r.dia || '', dia2: r.dia2 || '', qtyStr: String(r.qty), approx: !!r.approx, note: r.note || '', name: r.name || '', unit: r.unit || 'عدد' };
    } else {
      var cat = S.lastCat || 'pipe';
      SH = { bid: b.id, id: null, cat: cat, dia: S.last[cat] || '', dia2: '', qtyStr: '', approx: false, note: '', name: '', unit: 'عدد' };
    }
    drawItem();
  }
  function drawItem() {
    var c = catBy[SH.cat], isPipe = SH.cat === 'pipe';
    var h = '<h2>' + (SH.id ? 'تعديل بند' : 'إضافة بند') + '</h2><div class="chips">' +
      CATS.map(function (x) { return '<button class="chip ' + (x.k === SH.cat ? 'on' : '') + '" data-a="pickCat" data-v="' + x.k + '">' + x.n + '</button>'; }).join('') + '</div>';
    if (c.custom) {
      h += '<label class="lbl" for="f-name">اسم البند</label><input id="f-name" class="inp" value="' + esc(SH.name) + '" placeholder="مثال: طلمبة جوكي" enterkeyhint="next">' +
        '<label class="lbl" for="f-unit">الوحدة</label><input id="f-unit" class="inp" value="' + esc(SH.unit) + '" placeholder="عدد / م / كجم" enterkeyhint="next">';
    }
    if (c.dia) {
      h += '<div class="grid2"><div><label class="lbl" for="f-dia">القطر (بوصة)</label><input id="f-dia" class="inp ltr" inputmode="decimal" value="' + esc(SH.dia) + '" placeholder="4 أو 2.5" enterkeyhint="next"></div>';
      if (c.dia2) h += '<div><label class="lbl" for="f-dia2">' + (c.need2 ? 'إلى قطر' : 'القطر الفرعي (اختياري)') + '</label><input id="f-dia2" class="inp ltr" inputmode="decimal" value="' + esc(SH.dia2) + '" placeholder="2" enterkeyhint="next"></div>';
      h += '</div>';
    }
    h += '<label class="lbl" for="f-qty">' + (isPipe ? 'الطول (م)' : 'العدد') + ' — اكتب 12+8+5 لو عايز تجمع قياسات</label>' +
      '<div class="pair"><input id="f-qty" class="inp ltr" inputmode="decimal" value="' + esc(SH.qtyStr) + '" placeholder="0" enterkeyhint="done"><button class="plus" data-a="qtyPlus" aria-label="جمع">＋</button></div>' +
      '<div class="qprev" id="qprev"></div>' +
      '<label class="chk"><input type="checkbox" id="f-ap" ' + (SH.approx ? 'checked' : '') + '> الرقم تقريبي</label>' +
      '<label class="lbl" for="f-note">ملاحظة (اختياري)</label><input id="f-note" class="inp" value="' + esc(SH.note) + '" placeholder="مثال: ESFR / داخل الغرفة / هنجر 2">';
    h += SH.id
      ? '<div class="btns"><button class="btn danger" data-a="delItem">حذف</button><button class="btn" data-a="saveClose">حفظ</button></div>'
      : '<div class="btns"><button class="btn ghost" data-a="saveClose">حفظ وإغلاق</button><button class="btn" data-a="saveNext">حفظ والتالي</button></div>';
    showSheet(h);
    qPrev();
    var f = function (i) { return document.getElementById(i); };
    if (c.custom && !SH.name) f('f-name').focus();
    else if (c.dia && !SH.dia) f('f-dia').focus();
    else f('f-qty').focus();
  }
  function readItem() {
    var g = function (i) { return document.getElementById(i); };
    if (g('f-qty')) SH.qtyStr = g('f-qty').value;
    if (g('f-note')) SH.note = g('f-note').value;
    if (g('f-name')) SH.name = g('f-name').value;
    if (g('f-unit')) SH.unit = g('f-unit').value;
    if (g('f-dia')) SH.dia = g('f-dia').value;
    if (g('f-dia2')) SH.dia2 = g('f-dia2').value;
    if (g('f-ap')) SH.approx = g('f-ap').checked;
  }
  function qPrev() {
    var el = document.getElementById('qprev'), q = document.getElementById('f-qty');
    if (!el || !q) return;
    var v = parseQty(q.value);
    el.textContent = q.value.indexOf('+') > -1 && v > 0 ? '= ' + num(v) : '';
    el.style.color = '';
    if (q.value.trim() && isNaN(v)) { el.textContent = 'اكتب أرقام فقط'; el.style.color = 'var(--bad)'; }
  }
  function saveItem(next) {
    readItem();
    var c = catBy[SH.cat], b = S.buildings.find(function (x) { return x.id === SH.bid; });
    if (!b) return closeSheet();
    var q = parseQty(SH.qtyStr);
    if (!(q > 0)) { toast('اكتب ' + (SH.cat === 'pipe' ? 'الطول' : 'العدد') + ' أولاً'); return; }
    var name = SH.name.trim(), unit = SH.unit.trim() || 'عدد', d1 = '', d2 = '';
    if (c.custom && !name) { toast('اكتب اسم البند'); return; }
    if (c.dia) {
      d1 = normDia(SH.dia);
      if (!d1) { toast(d1 === null ? 'القطر بالأرقام فقط (مثال 2.5)' : 'اكتب القطر'); return; }
      if (c.dia2) {
        d2 = normDia(SH.dia2);
        if (d2 === null) { toast('القطر الثاني بالأرقام فقط'); return; }
        if (c.need2 && !d2) { toast('اكتب القطر الثاني للمسلوب'); return; }
      }
    }
    var data = { cat: SH.cat, dia: d1, dia2: d2, name: c.custom ? name : '', unit: c.custom ? unit : '', qty: q, approx: SH.approx, note: SH.note.trim() };
    var msg = 'تم الحفظ';
    if (SH.id) {
      var row = b.rows.find(function (x) { return x.id === SH.id; });
      if (row) Object.assign(row, data);
    } else {
      var k = rowKey(data), same = b.rows.find(function (x) { return rowKey(x) === k; });
      if (same) {
        same.qty = Math.round((same.qty + q) * 1000) / 1000; same.approx = same.approx || data.approx;
        if (data.note && same.note.indexOf(data.note) < 0) same.note = same.note ? same.note + ' / ' + data.note : data.note;
        msg = 'اتجمع على البند الموجود → ' + num(same.qty);
      } else { data.id = uid(); b.rows.push(data); }
    }
    if (c.dia && d1) S.last[SH.cat] = d1;
    S.lastCat = SH.cat;
    save();
    if (next && !SH.id) {
      SH.qtyStr = ''; SH.note = ''; SH.approx = false; if (c.custom) { SH.name = ''; }
      drawItem(); render(); toast(msg);
    } else { closeSheet(); render(); toast(msg); }
  }

  /* ========== التصدير ========== */
  function dlCell(d1, d2) { return d2 ? d1 + '×' + d2 : (d1 && /^\d+(\.\d+)?$/.test(d1) ? Number(d1) : d1 || ''); }
  function buildXlsx() {
    var agg = aggregate(), nb = S.buildings.length, L = window.xlsxColLetter, sheets = [];
    var head = ['البند', 'القطر (بوصة)'].concat(S.buildings.map(function (b) { return b.name; }), ['الإجمالي', 'الوحدة']);
    var rows = [head.map(function (v) { return { v: v, st: 'h' }; })];
    agg.forEach(function (e, i) {
      var r = i + 2, line = [e.cat === 'other' ? (e.name || 'بند') : catBy[e.cat].n, dlCell(e.dia, e.dia2)];
      S.buildings.forEach(function (b) { line.push(e.per[b.id] ? Math.round(e.per[b.id] * 1000) / 1000 : ''); });
      line.push({ f: nb ? 'SUM(' + L(2) + r + ':' + L(1 + nb) + r + ')' : '0', v: e.total, st: 't' }, e.unit);
      rows.push(line);
    });
    var w = [24, 14]; for (var i = 0; i < nb; i++) w.push(16); w.push(12, 10);
    sheets.push({ name: 'الإجمالي', widths: w, rows: rows });
    S.buildings.forEach(function (b) {
      var rs = [['البند', 'القطر (بوصة)', 'الطول (م)', 'العدد', 'ملاحظات'].map(function (v) { return { v: v, st: 'h' }; })], pipe = 0, cnt = 0;
      b.rows.slice().sort(cmpItems).forEach(function (r) {
        var isLen = unitOf(r) === 'م', notes = [r.approx ? 'تقريبي' : '', r.cat === 'other' && !isLen ? 'الوحدة: ' + unitOf(r) : '', r.note].filter(Boolean).join(' - ');
        rs.push([r.cat === 'other' ? (r.name || 'بند') : catBy[r.cat].n, dlCell(r.dia, r.dia2), isLen ? r.qty : '', isLen ? '' : r.qty, notes]);
        if (isLen) pipe += r.qty; else cnt += r.qty;
      });
      if (b.rows.length) {
        var n = rs.length;
        rs.push([{ v: 'الإجمالي', st: 't' }, { v: '', st: 't' }, { f: 'SUM(C2:C' + n + ')', v: pipe, st: 't' }, { f: 'SUM(D2:D' + n + ')', v: cnt, st: 't' }, { v: '', st: 't' }]);
      }
      sheets.push({ name: b.name, widths: [24, 14, 14, 12, 34], rows: rs });
    });
    var p = S.project;
    sheets.push({
      name: 'بيانات المشروع', widths: [20, 40], rows: [
        [{ v: 'البيان', st: 'h' }, { v: 'القيمة', st: 'h' }], ['اسم المشروع', p.name], ['الشركة', p.client], ['الموقع', p.site],
        ['المهندس', p.engineer], ['تاريخ التصدير', today()], ['ملاحظة', 'حصر كميات منفّذة فعلياً (As-Built) من بيانات الموقع']
      ]
    });
    return window.makeXlsx(sheets);
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
  function printReport() {
    var p = S.project, agg = aggregate();
    var h = '<h1>' + esc(p.name) + '</h1><p>' + esc(p.client) + (p.site ? ' — ' + esc(p.site) : '') + '</p><p>المهندس: ' + esc(p.engineer) + ' — ' + today() + '</p>';
    var tbl = function (title, rs) {
      return '<h2>' + esc(title) + '</h2><table><tr><th>البند</th><th>القطر</th><th>الكمية</th><th>الوحدة</th><th>ملاحظات</th></tr>' +
        rs.map(function (x) { return '<tr><td>' + esc(x[0]) + '</td><td dir="ltr">' + esc(x[1]) + '</td><td>' + num(x[2]) + '</td><td>' + esc(x[3]) + '</td><td>' + esc(x[4] || '') + '</td></tr>'; }).join('') + '</table>';
    };
    h += tbl('الإجمالي العام', agg.map(function (e) { return [e.cat === 'other' ? e.name : catBy[e.cat].n, diaText(e), e.total, e.unit, e.approx ? 'تقريبي' : '']; }));
    S.buildings.forEach(function (b) {
      if (b.rows.length) h += tbl(b.name, b.rows.slice().sort(cmpItems).map(function (r) { return [nameOf(r), diaText(r), r.qty, unitOf(r), [r.approx ? 'تقريبي' : '', r.note].filter(Boolean).join(' - ')]; }));
    });
    $('#print-root').innerHTML = h;
    setTimeout(function () { window.print(); }, 50);
  }

  /* ========== الحاسبات ========== */
  var v = function (id) { var e = document.getElementById(id); return e ? Number(toLatin(e.value).replace(/\s/g, '')) : NaN; };
  function calcH() {
    var out = $('#h-out'); if (!out) return;
    var dRaw = normDia($('#h-d').value), key = dRaw, id = ID_MM[key];
    $('#h-idwrap').style.display = dRaw && !id ? 'block' : 'none';
    if (!id) id = v('h-id');
    var Q = v('h-q'), Lm = v('h-l'), C = v('h-c');
    if (!(Q > 0 && id > 0 && Lm >= 0 && C > 0)) { out.innerHTML = 'أدخل القيم بالأرقام'; return; }
    var perM = 6.05e5 * Math.pow(Q, 1.85) / (Math.pow(C, 1.85) * Math.pow(id, 4.87)); // بار/متر
    var vel = (Q / 60000) / (Math.PI * Math.pow(id / 1000, 2) / 4);
    var tot = perM * Lm;
    out.innerHTML = 'القطر الداخلي: <b>' + num(id) + '</b> مم<br>السرعة: <b>' + num(vel) + '</b> م/ث ' +
      (vel > 6 ? '<span class="warn">⚠ أعلى من 6 م/ث</span>' : '<span class="ok">✓</span>') +
      '<br>الفاقد: <b>' + perM.toFixed(4) + '</b> بار/م<br>الفاقد الكلي: <b>' + tot.toFixed(3) + '</b> بار (<b>' + (tot * 14.5038).toFixed(2) + '</b> psi)';
  }
  function calcS() {
    var out = $('#s-out'); if (!out) return;
    var K = v('s-k'), P = v('s-p'), A = v('s-a');
    if (!(K > 0 && P >= 0)) { out.innerHTML = 'أدخل القيم بالأرقام'; return; }
    var Q = K * Math.sqrt(P);
    out.innerHTML = 'التصرف: <b>' + num(Q) + '</b> لتر/د (<b>' + num(Q / 3.78541) + '</b> gpm)' +
      (A > 0 ? '<br>كثافة الصرف: <b>' + num(Q / A) + '</b> مم/د' : '');
  }

  /* ========== الأحداث ========== */
  var toastT;
  function toast(m) {
    var t = $('#toast'); t.textContent = m; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  var A = {
    tab: function (t) { UI.tab = t.dataset.v; UI.bid = null; render(0); },
    openB: function (t) { UI.bid = t.dataset.id; render(0); },
    back: function () { UI.bid = null; render(0); },
    addBuilding: function () {
      textSheet('اسم المبنى', '', function (val) { var b = { id: uid(), name: val, rows: [] }; S.buildings.push(b); save(); closeSheet(); UI.bid = b.id; render(0); }, 'مثال: مستودع 3');
    },
    bMenu: function () {
      var b = curB();
      showSheet('<h2>' + esc(b.name) + '</h2><button class="btn ghost wide" data-a="bRename">إعادة تسمية</button><button class="btn ghost wide" data-a="bDup">نسخ المبنى بكل بنوده</button>' +
        '<button class="btn danger wide" data-a="bDel">حذف المبنى</button>');
    },
    bRename: function () {
      var b = curB(); closeSheet();
      textSheet('اسم المبنى', b.name, function (val) { b.name = val; save(); closeSheet(); render(); });
    },
    bDup: function () {
      var b = curB(), c = JSON.parse(JSON.stringify(b)); c.id = uid(); c.name = b.name + ' (نسخة)';
      c.rows.forEach(function (r) { r.id = uid(); }); S.buildings.splice(S.buildings.indexOf(b) + 1, 0, c);
      save(); closeSheet(); UI.bid = c.id; render(0); toast('تم النسخ');
    },
    bDel: function () {
      var b = curB(); closeSheet();
      confirmSheet('حذف «' + b.name + '» وكل بنوده؟', 'حذف', function () { S.buildings = S.buildings.filter(function (x) { return x !== b; }); UI.bid = null; save(); closeSheet(); render(0); });
    },
    addItem: function () { openItem(null); },
    editItem: function (t) { openItem(t.dataset.id); },
    inc: function (t) {
      var b = curB(), r = b.rows.find(function (x) { return x.id === t.dataset.id; });
      r.qty = Math.max(1, r.qty + Number(t.dataset.d)); save(); render();
    },
    pickCat: function (t) {
      readItem(); SH.cat = t.dataset.v; SH.dia2 = '';
      if (!SH.id) SH.dia = S.last[SH.cat] || '';
      drawItem();
    },
    qtyPlus: function () {
      var q = document.getElementById('f-qty'), s = q.value.replace(/\s/g, '');
      if (s && /[\d.]$/.test(s)) q.value = s + '+';
      q.focus(); q.setSelectionRange(q.value.length, q.value.length); qPrev();
    },
    saveNext: function () { saveItem(true); },
    saveClose: function () { saveItem(false); },
    delItem: function () {
      var b = S.buildings.find(function (x) { return x.id === SH.bid; });
      b.rows = b.rows.filter(function (x) { return x.id !== SH.id; }); save(); closeSheet(); render(); toast('تم الحذف');
    },
    closeSheet: closeSheet,
    textOk: function () {
      var val = $('#t-in').value.trim(); if (!val) { toast('اكتب الاسم'); return; }
      if (TXT) TXT.cb(val);
    },
    confOk: function () { if (CONF) CONF(); },
    toggle: function (t) { var k = t.dataset.k; UI.open[k] = !UI.open[k]; render(); },
    exportXlsx: function () { deliver(buildXlsx(), 'fire-boq-' + today() + '.xlsx'); },
    printReport: printReport,
    exportJson: function () { deliver(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }), 'fire-boq-backup-' + today() + '.json'); },
    importJson: function () { $('#imp').click(); },
    resetAll: function () {
      confirmSheet('مسح كل البيانات نهائياً؟', 'مسح', function () { S = seed(); save(); closeSheet(); UI.bid = null; render(0); toast('تم المسح'); });
    }
  };

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-a]');
    if (t && A[t.dataset.a]) A[t.dataset.a](t, e);
  });

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'f-qty') qPrev();
    else if (t.dataset && t.dataset.set) { S.project[t.dataset.set] = t.value; save(); }
    else if (/^h-/.test(t.id)) calcH();
    else if (/^s-/.test(t.id)) calcS();
  });

  document.addEventListener('change', function (e) {
    if (e.target.id !== 'imp' || !e.target.files[0]) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var j = fix(JSON.parse(rd.result));
        if (!j) throw new Error('bad');
        confirmSheet('استرجاع النسخة؟ هيتم استبدال البيانات الحالية.', 'استرجاع', function () { S = j; save(); closeSheet(); UI.bid = null; render(0); toast('تم الاسترجاع'); });
      } catch (err) { toast('الملف غير صالح'); }
    };
    rd.readAsText(e.target.files[0]); e.target.value = '';
  });

  // Enter = الخانة التالية، وفي خانة الكمية = حفظ والتالي (سرعة في الموقع)
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var id = e.target.id, g = function (i) { return document.getElementById(i); };
    if (id === 't-in') { e.preventDefault(); A.textOk(); return; }
    if (!SH) return;
    var nxt = { 'f-name': 'f-unit', 'f-unit': g('f-dia') ? 'f-dia' : 'f-qty', 'f-dia': g('f-dia2') ? 'f-dia2' : 'f-qty', 'f-dia2': 'f-qty', 'f-note': null }[id];
    if (nxt) { e.preventDefault(); g(nxt).focus(); }
    else if (id === 'f-qty' || id === 'f-note') { e.preventDefault(); saveItem(!SH.id); }
  });

  window.__fireboq = { state: function () { return S; }, buildXlsx: buildXlsx, parseQty: parseQty, normDia: normDia, aggregate: aggregate };

  render(0);
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () { });
  if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { }); });
})();
