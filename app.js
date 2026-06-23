/* ============================================================
   RECORD — interaction layer
   Vanilla JS. Theme, nav, an interactive quorum you can break,
   a filterable work index, and three live specimens.
   ============================================================ */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var d = function (ms) { return reduce ? 0 : ms; };

  function h(tag, attrs) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    for (var k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null) continue;
      if (Array.isArray(c)) c.forEach(function (x) { add(e, x); });
      else add(e, c);
    }
    return e;
  }
  function add(e, c) { e.appendChild(c && c.nodeType ? c : document.createTextNode(String(c))); }

  /* ---- Theme toggle (default light) ----------------------- */
  (function () {
    var root = document.documentElement;
    var btn = document.getElementById('theme-toggle');
    var label = btn.querySelector('.toggle-label');
    function sync() {
      var dark = root.getAttribute('data-theme') === 'dark';
      btn.setAttribute('aria-pressed', String(dark));
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      if (label) label.textContent = dark ? 'Dark' : 'Light';
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', dark ? '#0D1110' : '#F3F4F1');
    }
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      sync();
    });
    sync();
    requestAnimationFrame(function () { root.classList.add('theme-ready'); });
    setTimeout(function () { root.classList.add('theme-ready'); }, 320);
  })();

  /* ---- Nav active section --------------------------------- */
  (function () {
    var links = {};
    document.querySelectorAll('.masthead-nav a[href^="#"]').forEach(function (a) {
      links[a.getAttribute('href').slice(1)] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id;
        for (var k in links) links[k].classList.toggle('active', k === id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) {
      var el = document.getElementById(id); if (el) io.observe(el);
    });
  })();

  /* ---- Interactive consensus (hero) ----------------------- */
  (function () {
    var wrap = document.getElementById('consensus-nodes');
    var read = document.getElementById('consensus-read');
    if (!wrap) return;
    var N = 5;
    var up = [true, true, true, true, true];

    function render() {
      wrap.innerHTML = '';
      up.forEach(function (on, i) {
        wrap.appendChild(h('button', {
          class: 'c-node ' + (on ? 'up' : 'down'), type: 'button',
          'aria-pressed': String(on), 'aria-label': 'Node ' + i + (on ? ' online' : ' offline'),
          onClick: function () { up[i] = !up[i]; render(); }
        }, String(i)));
      });
      var online = up.filter(Boolean).length;
      var ok = online * 2 > N;
      read.innerHTML = '';
      read.appendChild(h('b', {}, online + ' / ' + N + ' online'));
      read.appendChild(h('span', { class: 'verdict ' + (ok ? 'ok' : 'no') }, ok ? 'quorum' : 'no quorum'));
      read.appendChild(h('span', {}, ok ? 'cluster commits' : 'writes stall'));
    }
    render();
  })();

  /* ---- Scroll reveal + count-up metrics ------------------- */
  (function () {
    if (!document.documentElement.classList.contains('anim') || !('IntersectionObserver' in window)) return;

    function countUp(el) {
      var txt = el.getAttribute('data-val') || el.textContent;
      el.setAttribute('data-val', txt);
      var m = txt.match(/\d[\d,]*\.?\d*/);
      if (!m) return;
      var raw = m[0].replace(/,/g, ''), target = parseFloat(raw);
      if (!isFinite(target) || target === 0) return;
      var dec = (raw.split('.')[1] || '').length;
      var comma = m[0].indexOf(',') !== -1 || target >= 1000;
      var pre = txt.slice(0, m.index), post = txt.slice(m.index + m[0].length);
      function fmt(v) {
        var n = dec ? v.toFixed(dec) : Math.round(v).toString();
        if (comma) n = Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
        return n;
      }
      var start = 0, dur = 1200;
      function step(t) {
        if (!start) start = t;
        var p = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + fmt(target * e) + post;
        if (p < 1) requestAnimationFrame(step); else el.textContent = txt;
      }
      requestAnimationFrame(step);
    }

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('revealed');
        if (!reduce && en.target.classList.contains('work')) {
          en.target.querySelectorAll('.metrics b').forEach(countUp);
        }
        obs.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.06 });
    document.querySelectorAll('.band-quote, .chapter-head, .warmup, .filters, .work, .exp, .about, .closer-title, .closer-sub, .closer-links')
      .forEach(function (t) { io.observe(t); });
  })();

  /* ---- Hero portrait parallax ----------------------------- */
  (function () {
    if (reduce || !matchMedia('(pointer: fine)').matches) return;
    var hero = document.querySelector('.cover');
    var img = document.querySelector('.cover-portrait-img img');
    if (!hero || !img) return;
    var raf = 0, tx = 0, ty = 0;
    function apply() { raf = 0; img.style.setProperty('--px', tx.toFixed(1) + 'px'); img.style.setProperty('--py', ty.toFixed(1) + 'px'); }
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = -((e.clientX - r.left) / r.width - 0.5) * 14;
      ty = -((e.clientY - r.top) / r.height - 0.5) * 14;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(apply); });
  })();

  /* ---- Work filter ---------------------------------------- */
  (function () {
    var box = document.getElementById('filters');
    if (!box) return;
    var chips = box.querySelectorAll('.chip');
    var works = document.querySelectorAll('.work');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
        works.forEach(function (w) {
          var themes = (w.getAttribute('data-themes') || '').split(' ');
          w.classList.toggle('dim', !(f === 'all' || themes.indexOf(f) !== -1));
        });
      });
    });
  })();

  /* ---- Mount specimens (lazy when possible, always reliably) */
  (function () {
    var builders = { dtq: buildDTQ, settle: buildSettle, converge: buildConverge, arch: buildArch };
    var targets = document.querySelectorAll('[data-mount]');
    function mount(el) {
      if (el.dataset.built) return;
      el.dataset.built = '1';
      try { builders[el.getAttribute('data-mount')](el); } catch (e) {}
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) { if (en.isIntersecting) { mount(en.target); obs.unobserve(en.target); } });
      }, { rootMargin: '300px' });
      targets.forEach(function (t) { io.observe(t); });
    }
    // Guarantee mount even if IntersectionObserver is throttled (background tabs, low-power).
    setTimeout(function () { targets.forEach(mount); }, 1400);
  })();

  /* ---- Floating avatar buddy ------------------------------ */
  buildBuddy();

  function scaffold(mount, readoutNode) {
    var read = h('div', { class: 'sp-readout' }, readoutNode);
    var stage = h('div', { class: 'sp-stage' });
    var controls = h('div', { class: 'sp-controls' });
    mount.appendChild(read); mount.appendChild(stage); mount.appendChild(controls);
    return { read: read, controls: controls, stage: stage };
  }
  function button(label, opts) {
    opts = opts || {};
    return h('button', { class: 'sp-btn' + (opts.primary ? ' primary' : ''), type: 'button', onClick: opts.on }, label);
  }

  /* =========================================================
     SPECIMEN 1 — Distributed Task Queue (Raft)
     ========================================================= */
  function buildDTQ(mount) {
    var N = 3, leader = 0, nextJob = 1, processed = 0, busy = false;
    var nodes = [];
    for (var i = 0; i < N; i++) nodes.push({ id: i, role: i === 0 ? 'leader' : 'follower', down: false, log: [] });

    var readout = h('div', { class: 'sp-line' });
    var s = scaffold(mount, readout);
    var nodesWrap = h('div', { class: 'dtq-nodes' });
    s.stage.appendChild(nodesWrap);
    s.controls.appendChild(button('Submit job', { primary: true, on: submitJob }));
    s.controls.appendChild(button('Kill leader', { on: killLeader }));
    mount.appendChild(h('p', { class: 'sp-note' }, 'Each job is replicated to a majority before it commits — so it runs exactly once, even when the leader dies.'));

    renderNodes(); renderReadout();

    function renderReadout() {
      readout.innerHTML = '';
      readout.appendChild(stat('processed', processed, true));
      readout.appendChild(stat('duplicates', 0));
      readout.appendChild(stat('lost', 0));
    }
    function stat(label, val, accent) { return h('span', { class: 'sp-stat' + (accent ? ' accent' : '') }, h('b', {}, String(val)), ' ' + label); }
    function renderNodes() {
      nodesWrap.innerHTML = '';
      nodes.forEach(function (n) {
        var role = n.down ? 'down' : n.role;
        var cells = h('div', { class: 'dtq-log' });
        n.log.slice(-6).forEach(function (e) { cells.appendChild(h('span', { class: 'dtq-cell' + (e.committed ? ' committed' : ''), title: 'job ' + e.id })); });
        nodesWrap.appendChild(h('div', { class: 'dtq-node', 'data-role': role },
          h('span', { class: 'dtq-dot' }), h('span', { class: 'dtq-name' }, 'node ' + n.id),
          h('span', { class: 'dtq-role' }, role), cells));
      });
    }
    function submitJob() {
      if (busy || leader === -1 || nodes[leader].down) return;
      busy = true;
      var jobId = nextJob++, ld = nodes[leader];
      ld.log.push({ id: jobId, committed: false }); renderNodes();
      setTimeout(function () {
        var acks = 1;
        nodes.forEach(function (n) { if (n.id !== leader && !n.down) { n.log.push({ id: jobId, committed: false }); acks++; } });
        renderNodes();
        setTimeout(function () {
          if (acks > N / 2) { nodes.forEach(function (n) { var e = find(n.log, jobId); if (e) e.committed = true; }); processed++; }
          renderNodes(); renderReadout(); busy = false;
        }, d(430));
      }, d(400));
    }
    function killLeader() {
      if (busy || leader === -1) return;
      busy = true;
      var dead = leader;
      nodes[dead].down = true; nodes[dead].role = 'follower'; leader = -1; renderNodes();
      setTimeout(function () {
        var cand = first(nodes, function (n) { return !n.down; });
        cand.role = 'candidate'; renderNodes();
        setTimeout(function () {
          nodes.forEach(function (n) { if (n.role === 'leader') n.role = 'follower'; });
          cand.role = 'leader'; leader = cand.id; renderNodes();
          setTimeout(function () {
            nodes[dead].down = false; nodes[dead].role = 'follower';
            nodes[dead].log = nodes[leader].log.map(function (e) { return { id: e.id, committed: e.committed }; });
            renderNodes(); renderReadout(); busy = false;
          }, d(850));
        }, d(650));
      }, d(650));
    }
    function find(log, id) { for (var i = 0; i < log.length; i++) if (log[i].id === id) return log[i]; return null; }
    function first(arr, fn) { for (var i = 0; i < arr.length; i++) if (fn(arr[i])) return arr[i]; return null; }
  }

  /* =========================================================
     SPECIMEN 2 — Settle (double-entry ledger)
     ========================================================= */
  function buildSettle(mount) {
    var names = ['Alice', 'Bob', 'Carol'], START = 500;
    var bal = { Alice: START, Bob: START, Carol: START };
    var initialTotal = names.length * START, journal = [], sims = 0, busy = false;

    var readout = h('div', { class: 'sp-line' });
    var s = scaffold(mount, readout);
    var accts = h('div', { class: 'ledger-accts' });
    var drift = h('div', { class: 'drift ok' });
    var journalWrap = h('div', { class: 'journal' });
    s.stage.appendChild(accts); s.stage.appendChild(drift); s.stage.appendChild(journalWrap);
    s.controls.appendChild(button('Post transfer', { primary: true, on: function () { if (!busy) postRandom(); } }));
    s.controls.appendChild(button('Inject crash', { on: injectCrash }));
    s.controls.appendChild(button('Run 100 crash sims', { on: runSims }));
    mount.appendChild(h('p', { class: 'sp-note' }, 'Every transfer posts a debit and an equal credit, so the books always sum to zero. Crash mid-write and the whole entry rolls back — never half.'));

    render();
    function fmt(n) { return '$' + n.toFixed(2); }
    function total() { return names.reduce(function (a, n) { return a + bal[n]; }, 0); }
    function render() {
      accts.innerHTML = '';
      names.forEach(function (n) { accts.appendChild(h('div', { class: 'ledger-acct' }, h('span', { class: 'la-name' }, n), h('b', {}, fmt(bal[n])))); });
      var dr = total() - initialTotal;
      drift.className = 'drift ' + (dr === 0 ? 'ok' : 'bad'); drift.innerHTML = '';
      drift.appendChild(h('span', { class: 'drift-k' }, 'balance drift'));
      drift.appendChild(h('b', {}, 'Δ ' + fmt(dr)));
      drift.appendChild(h('span', { class: 'drift-tag' }, dr === 0 ? 'balanced' : 'DRIFT'));
      readout.innerHTML = '';
      readout.appendChild(h('span', { class: 'sp-stat accent' }, h('b', {}, String(sims)), ' sims'));
      readout.appendChild(h('span', { class: 'sp-stat' }, h('b', {}, '0'), ' double-charges'));
      journalWrap.innerHTML = '';
      journal.slice(-4).reverse().forEach(function (j) {
        journalWrap.appendChild(h('div', { class: 'jrow' + (j.rolled ? ' rolled' : '') },
          h('span', { class: 'jx' }, j.from + ' → ' + j.to), h('span', { class: 'jd' }, '−' + fmt(j.amt)),
          h('span', { class: 'jc' }, '+' + fmt(j.amt)), h('span', { class: 'jstate' }, j.rolled ? 'rolled back' : 'posted')));
      });
    }
    function transfer(from, to, amt, crash) {
      if (bal[from] < amt) return null;
      var snap = bal[from];
      bal[from] -= amt;
      if (crash) { bal[from] = snap; return { from: from, to: to, amt: amt, rolled: true }; }
      bal[to] += amt; return { from: from, to: to, amt: amt, rolled: false };
    }
    function pick() { var f = names[(Math.random() * names.length) | 0], t; do { t = names[(Math.random() * names.length) | 0]; } while (t === f); return [f, t]; }
    function postRandom() { var p = pick(), amt = (Math.random() * 80 + 20) | 0; if (bal[p[0]] < amt) amt = (bal[p[0]] / 2) | 0; var r = transfer(p[0], p[1], amt, false); if (r) { journal.push(r); render(); } }
    function injectCrash() { if (busy) return; var p = pick(), amt = (Math.random() * 80 + 20) | 0; var r = transfer(p[0], p[1], amt, true); if (r) { journal.push(r); render(); drift.classList.add('flash'); setTimeout(function () { drift.classList.remove('flash'); }, d(500) || 1); } }
    function runSims() {
      if (busy) return; busy = true; var remaining = 100;
      (function step() {
        var batch = reduce ? 100 : 6;
        while (batch-- > 0 && remaining > 0) {
          var crash = Math.random() < 0.35, p = pick(), amt = (Math.random() * 60 + 10) | 0;
          if (bal[p[0]] < amt) amt = (bal[p[0]] / 2) | 0;
          var r = transfer(p[0], p[1], amt, crash); if (r) journal.push(r);
          sims++; remaining--;
        }
        render();
        if (remaining > 0) requestAnimationFrame(step); else busy = false;
      })();
    }
  }

  /* =========================================================
     SPECIMEN 3 — Converge (CRDT merge engine)
     ========================================================= */
  function buildConverge(mount) {
    var linkUp = true;
    function Replica(site) { this.site = site; this.clock = 0; this.ops = {}; this.outbox = []; }
    Replica.prototype.visible = function () { var a = []; for (var id in this.ops) { var o = this.ops[id]; if (!o.del) a.push(o); } a.sort(cmp); return a; };
    Replica.prototype.text = function () { return this.visible().map(function (o) { return o.ch; }).join(''); };
    Replica.prototype.insertEnd = function (ch) {
      var vis = this.visible(), left = vis.length ? vis[vis.length - 1].pos : 0, pos = (left + 1) / 2;
      var op = { id: this.site + ':' + (++this.clock), site: this.site, clock: this.clock, pos: pos, ch: ch, del: false };
      this.ops[op.id] = op; this.send(op);
    };
    Replica.prototype.backspace = function () {
      var vis = this.visible(); if (!vis.length) return; var last = vis[vis.length - 1];
      var op = { id: last.id, site: last.site, clock: last.clock, pos: last.pos, ch: last.ch, del: true };
      this.ops[op.id] = op; this.send(op);
    };
    Replica.prototype.send = function (op) { if (linkUp) peer(this).receive(op); else this.outbox.push(op); };
    Replica.prototype.receive = function (op) { var ex = this.ops[op.id]; if (!ex || (op.del && !ex.del)) this.ops[op.id] = clone(op); };
    function clone(o) { return { id: o.id, site: o.site, clock: o.clock, pos: o.pos, ch: o.ch, del: o.del }; }
    function cmp(a, b) { if (a.pos !== b.pos) return a.pos - b.pos; if (a.site !== b.site) return a.site < b.site ? -1 : 1; return a.clock - b.clock; }

    var A = new Replica('A'), B = new Replica('B');
    function peer(r) { return r === A ? B : A; }
    'Ship '.split('').forEach(function (c) { A.insertEnd(c); });

    var readout = h('div', { class: 'sp-line' });
    var s = scaffold(mount, readout);
    var edA = h('div', { class: 'cv-editor', tabindex: '0', 'aria-label': 'Replica A — click and type' });
    var edB = h('div', { class: 'cv-editor', tabindex: '0', 'aria-label': 'Replica B — click and type' });
    var wrap = h('div', { class: 'cv-wrap' },
      h('div', { class: 'cv-replica' }, h('div', { class: 'cv-head' }, h('span', {}, 'Replica A'), h('span', { class: 'cv-caret-hint' }, 'type here')), edA),
      h('div', { class: 'cv-link' }, h('span', { class: 'cv-link-line' }), h('span', { class: 'cv-link-label' }, 'online')),
      h('div', { class: 'cv-replica' }, h('div', { class: 'cv-head' }, h('span', {}, 'Replica B'), h('span', { class: 'cv-caret-hint' }, 'type here')), edB));
    s.stage.appendChild(wrap);
    var linkEl = wrap.querySelector('.cv-link');
    var linkBtn = button('Go offline', { on: toggleLink });
    s.controls.appendChild(linkBtn);
    s.controls.appendChild(button('Shuffle & replay', { on: shuffleReplay }));
    mount.appendChild(h('p', { class: 'sp-note' }, 'Type in both — even offline. On reconnect the merge engine reconciles every edit; both replicas always converge to the same text, in any delivery order.'));

    bind(edA, A); bind(edB, B); render();
    function bind(el, rep) {
      el.addEventListener('keydown', function (ev) {
        if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
        if (ev.key === 'Backspace') { ev.preventDefault(); rep.backspace(); render(); }
        else if (ev.key.length === 1) { ev.preventDefault(); rep.insertEnd(ev.key); render(); }
      });
    }
    function toggleLink() {
      linkUp = !linkUp;
      if (linkUp) {
        var ax = A.outbox; A.outbox = []; ax.forEach(function (o) { B.receive(o); });
        var bx = B.outbox; B.outbox = []; bx.forEach(function (o) { A.receive(o); });
      }
      linkBtn.textContent = linkUp ? 'Go offline' : 'Reconnect & merge'; render();
    }
    function shuffleReplay() {
      var all = {}; [A, B].forEach(function (r) { for (var id in r.ops) all[id] = r.ops[id]; });
      var ops = Object.keys(all).map(function (id) { return all[id]; });
      A.ops = {}; B.ops = {};
      shuffle(ops.slice()).forEach(function (o) { A.ops[o.id] = clone(o); });
      shuffle(ops.slice()).forEach(function (o) { B.ops[o.id] = clone(o); });
      render(true);
    }
    function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function render(replayed) {
      edA.textContent = A.text(); edB.textContent = B.text();
      var converged = A.text() === B.text(), pending = A.outbox.length + B.outbox.length;
      linkEl.className = 'cv-link' + (linkUp ? '' : ' offline');
      linkEl.querySelector('.cv-link-label').textContent = linkUp ? 'online' : (pending + ' queued');
      readout.innerHTML = '';
      if (converged) {
        readout.appendChild(h('span', { class: 'sp-stat accent' }, h('b', {}, '✓'), ' converged'));
        readout.appendChild(h('span', { class: 'sp-stat' }, h('b', {}, '0'), ' lost edits'));
        if (replayed) readout.appendChild(h('span', { class: 'sp-stat' }, 'same result, shuffled order'));
      } else {
        readout.appendChild(h('span', { class: 'sp-stat warn' }, h('b', {}, 'diverged'), ' — ' + pending + ' op' + (pending === 1 ? '' : 's') + ' pending'));
      }
    }
  }

  /* =========================================================
     P4SBU — architecture diagram (themed SVG)
     ========================================================= */
  function buildArch(mount) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 340 300'); svg.setAttribute('width', '100%'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Architecture: a React client to an Express API, fanning out to reservation, routing and payment services, backed by MongoDB and Neo4j.');
    function box(x, y, w, hh, label, sub, accent) {
      var g = document.createElementNS(ns, 'g');
      var r = document.createElementNS(ns, 'rect');
      r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', w); r.setAttribute('height', hh);
      r.setAttribute('style', 'fill:var(--paper);stroke:' + (accent ? 'var(--accent)' : 'var(--ink)') + ';stroke-width:1.5');
      g.appendChild(r);
      var t = document.createElementNS(ns, 'text');
      t.setAttribute('x', x + w / 2); t.setAttribute('y', y + (sub ? hh / 2 - 2 : hh / 2 + 4)); t.setAttribute('text-anchor', 'middle');
      t.setAttribute('style', 'fill:var(--ink);font:600 12px Bricolage Grotesque,sans-serif'); t.textContent = label; g.appendChild(t);
      if (sub) { var st = document.createElementNS(ns, 'text'); st.setAttribute('x', x + w / 2); st.setAttribute('y', y + hh / 2 + 13); st.setAttribute('text-anchor', 'middle'); st.setAttribute('style', 'fill:var(--ink-faint);font:400 9px DM Mono,monospace'); st.textContent = sub; g.appendChild(st); }
      svg.appendChild(g);
    }
    function line(x1, y1, x2, y2) { var l = document.createElementNS(ns, 'path'); l.setAttribute('d', 'M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2); l.setAttribute('style', 'stroke:var(--hairline-2);stroke-width:1.4;fill:none'); svg.appendChild(l); }
    line(170, 52, 170, 78);
    line(170, 122, 60, 148); line(170, 122, 170, 148); line(170, 122, 280, 148);
    line(60, 192, 110, 218); line(170, 192, 170, 218); line(280, 192, 230, 218);
    box(110, 18, 120, 34, 'React Client', 'students · faculty · admin', true);
    box(110, 78, 120, 44, 'Express API', 'auth · RBAC · sessions');
    box(20, 148, 80, 44, 'Reservations', 'spot-locking');
    box(130, 148, 80, 44, 'Routing', 'Dijkstra · Maps');
    box(240, 148, 80, 44, 'Payments', 'Stripe');
    box(70, 218, 80, 40, 'MongoDB', 'reservations');
    box(190, 218, 80, 40, 'Neo4j', 'campus graph');
    mount.appendChild(svg);
    mount.appendChild(h('p', { class: 'sp-note' }, 'Client → API (role-based auth) → reservation, routing, and payment services, backed by MongoDB and a Neo4j campus graph.'));
  }

  /* =========================================================
     Floating avatar — drag it, fling it, poke it
     ========================================================= */
  function buildBuddy() {
    try { if (localStorage.getItem('buddy-hidden') === '1') return; } catch (e) {}

    var el = h('div', { class: 'buddy', 'aria-hidden': 'true' });
    var ring = h('div', { class: 'buddy-ring' });
    var orb = h('div', { class: 'buddy-orb' }, h('img', { src: 'raghav-avatar.png', alt: '', draggable: 'false' }));
    var bubble = h('div', { class: 'buddy-bubble' });
    var coffeeBtn = h('button', { class: 'buddy-action', type: 'button', title: 'Feed me coffee', 'aria-label': 'Feed coffee' }, '☕');
    var gameBtn = h('button', { class: 'buddy-action', type: 'button', title: 'Play catch', 'aria-label': 'Play a game' }, '🎮');
    var actions = h('div', { class: 'buddy-actions' }, coffeeBtn, gameBtn);
    var closeBtn = h('button', { class: 'buddy-close', type: 'button', 'aria-label': 'Hide avatar', title: 'Hide' }, '×');
    el.appendChild(ring); el.appendChild(orb); el.appendChild(actions); el.appendChild(bubble); el.appendChild(closeBtn);
    document.body.appendChild(el);

    var quipsCalm = [
      "Hey 👋 drag me, fling me, feed me coffee.",
      "Yes — I built those live demos myself.",
      "I ship one prompt at a time. 🤖",
      "Psst… I'm after a full-stack role.",
      "Try to break one of my projects ↑"
    ];
    var quipsWired = [
      "WHOA. so much coffee. ⚡",
      "I could refactor the WHOLE app right now.",
      "can't. stop. shipping.",
      "10x dev mode: ENGAGED."
    ];
    var quipsSleepy = [
      "*yawn* … got any coffee? ☕",
      "running on four hours of sleep, tbh",
      "feed me caffeine and I'll fix any bug"
    ];

    var caffeine = 38, qi = 0, bubbleTimer;
    function pool() { return caffeine > 75 ? quipsWired : caffeine < 20 ? quipsSleepy : quipsCalm; }
    function say(msg, ms) {
      var arr = pool();
      bubble.textContent = msg || arr[qi++ % arr.length];
      bubble.classList.add('show');
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(function () { bubble.classList.remove('show'); }, ms || 2800);
    }
    function setCaf(v) {
      caffeine = Math.max(0, Math.min(100, v));
      el.style.setProperty('--caf', caffeine.toFixed(0));
      el.classList.toggle('caf', caffeine > 1);
      el.classList.toggle('wired', caffeine > 82);
    }
    setCaf(caffeine);

    var W = el.offsetWidth || 78, M = 20;
    var x = window.innerWidth - W - M, y = window.innerHeight - W - M;
    var vx = 0, vy = 0, bob = 0;
    var dragging = false, moved = 0, gdx = 0, gdy = 0, hist = [];
    var gameOn = false, score = 0, gameEnds = 0;
    el.style.transform = 'translate(' + x + 'px,' + y + 'px)';  // place immediately

    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation(); el.remove();
      try { localStorage.setItem('buddy-hidden', '1'); } catch (_) {}
    });

    coffeeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      setCaf(caffeine + 26);
      vy = -13 - Math.random() * 4; vx += (Math.random() - 0.5) * 5;  // happy hop
      var cup = h('div', { class: 'coffee-float' }, '☕');
      cup.style.left = (x + W / 2 - 12) + 'px'; cup.style.top = (y - 6) + 'px';
      document.body.appendChild(cup);
      setTimeout(function () { cup.remove(); }, 1000);
      say(caffeine > 82 ? "⚡ WIRED. thank you." : "mmm, caffeine. ☕", 2200);
    });

    gameBtn.addEventListener('click', function (e) { e.stopPropagation(); startGame(); });
    function fling() { vx = (Math.random() - 0.5) * 46; vy = -18 - Math.random() * 10; }
    function startGame() {
      if (gameOn) return;
      gameOn = true; score = 0; gameEnds = performance.now() + 12000;
      el.classList.add('game'); fling(); say("Catch me! 0", 1400);
    }
    function endGame() {
      gameOn = false; el.classList.remove('game');
      say("You caught me " + score + "×! " + (score >= 8 ? "nice reflexes 🔥" : "not bad 😄"), 3800);
    }

    el.addEventListener('pointerdown', function (e) {
      if (e.target === closeBtn || e.target === coffeeBtn || e.target === gameBtn) return;
      if (gameOn) { score++; say("Catch me! " + score, 1100); fling(); return; }
      dragging = true; moved = 0; el.classList.add('dragging');
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      gdx = e.clientX - x; gdy = e.clientY - y; vx = vy = 0;
      hist = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
    });
    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var nx = e.clientX - gdx, ny = e.clientY - gdy;
      moved += Math.abs(nx - x) + Math.abs(ny - y);
      x = nx; y = ny;
      hist.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (hist.length > 5) hist.shift();
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false; el.classList.remove('dragging');
      if (hist.length >= 2) {
        var a = hist[0], b = hist[hist.length - 1], dt = Math.max(16, b.t - a.t);
        vx = (b.x - a.x) / dt * 16; vy = (b.y - a.y) / dt * 16;
      }
      if (moved < 6) say();
    }
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
    el.addEventListener('dblclick', function () { if (gameOn) return; el.classList.remove('spin'); void el.offsetWidth; el.classList.add('spin'); });

    var GRAV = 0.7, FRICT = 0.985, REST = 0.72, lastCaf = 0;
    function frame(now) {
      var maxX = window.innerWidth - W - M, maxY = window.innerHeight - W - M;
      var g = gameOn ? 0.5 : GRAV, rest = gameOn ? 0.96 : REST, fr = gameOn ? 0.999 : FRICT;
      if (!dragging) {
        vy += g; x += vx; y += vy;
        if (x < M) { x = M; vx = -vx * rest; }
        if (x > maxX) { x = maxX; vx = -vx * rest; }
        if (y < M) { y = M; vy = -vy * rest; }
        if (y > maxY) { y = maxY; vy = -vy * rest; if (!gameOn) vx *= 0.82; }
        vx *= fr; vy *= fr;
        if (!gameOn && Math.abs(vx) < 0.04) vx = 0;
        if (gameOn && Math.abs(vx) < 6 && Math.abs(vy) < 6) fling();  // keep it lively
      } else {
        if (x < M) x = M; if (x > maxX) x = maxX;
        if (y < M) y = M; if (y > maxY) y = maxY;
      }
      var by = 0, onFloor = y >= maxY - 1.5;
      var resting = !dragging && !gameOn && onFloor && Math.abs(vx) < 0.06 && Math.abs(vy) < 1.4;
      if (resting && !reduce) {
        var sp = caffeine > 75 ? 0.11 : caffeine < 20 ? 0.025 : 0.05;
        bob += sp; by = Math.sin(bob) * (caffeine < 20 ? 2 : 4); vy = 0;
      }
      el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + (y + by).toFixed(1) + 'px)';

      if (now - lastCaf > 700) { lastCaf = now; if (!dragging) setCaf(caffeine - (gameOn ? 2 : 0.6)); }
      if (gameOn && now >= gameEnds) endGame();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    if (!reduce) setTimeout(function () { say("Hey 👋 feed me coffee, or hit play."); }, 1800);
  }

})();
