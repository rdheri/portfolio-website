/* ============================================================
   raghavdheri.com — interaction layer
   loader (hello ×5) · theme · scrollspy · blush · claude-code scene
   ============================================================ */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var anim = document.documentElement.classList.contains('anim');

  /* ---------- loader: hello in five languages ---------- */
  var loader = document.getElementById('loader');
  var word = document.getElementById('loader-word');
  var greetings = [
    'Hello',            // english
    'नमस्ते',            // hindi
    'Hola',             // spanish
    'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',      // punjabi
    'કેમ છો'             // gujarati
  ];

  document.body.classList.add('is-loading');

  function finishLoader() {
    if (!loader || loader.classList.contains('is-done')) return;
    loader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    document.body.classList.add('is-ready');
    setTimeout(function () { loader.classList.add('is-gone'); }, 800);
  }

  // The full five-language cycle runs on every load, not just the first of a
  // session — a repeat visit used to flash the static "Hello" and nothing else.
  function runLoader() {
    if (!loader || !word) return;
    if (reduce || !anim) { finishLoader(); return; }

    var i = 0;
    var step = 360;
    (function next() {
      word.textContent = greetings[i];
      word.classList.remove('is-in');
      void word.offsetWidth; // restart the entrance animation
      word.classList.add('is-in');
      i += 1;
      if (i < greetings.length) setTimeout(next, step);
      else setTimeout(finishLoader, step + 140);
    })();
    // skip on click / key
    loader.addEventListener('click', finishLoader);
  }
  runLoader();
  setTimeout(finishLoader, 4000); // failsafe: never trap the page

  /* ---------- theme toggle ---------- */
  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');
  var ttLabel = toggle ? toggle.querySelector('.tt-label') : null;

  function syncLabel() {
    if (ttLabel) ttLabel.textContent = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  }
  syncLabel();

  // Deliberately not persisted: every visit starts in dark, and the toggle
  // only switches the current page.
  if (toggle) toggle.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    syncLabel();
  });

  /* ---------- avatar blush ---------- */
  var avatar = document.getElementById('avatar');
  if (avatar) {
    var blushTimer = null;
    function blushOn() {
      clearTimeout(blushTimer);
      avatar.classList.add('is-blushing');
    }
    function blushOff() {
      clearTimeout(blushTimer);
      avatar.classList.remove('is-blushing');
    }
    function blushPulse() { // touch & keyboard: blush for a moment
      blushOn();
      blushTimer = setTimeout(blushOff, 2000);
    }
    avatar.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'touch') return; // touch fires pointerdown
      blushOn();
    });
    avatar.addEventListener('pointerleave', blushOff);
    avatar.addEventListener('pointerdown', blushPulse);
    avatar.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); blushPulse(); }
    });
  }

  /* ---------- scrollspy on the work bar ---------- */
  var spyLinks = {};
  document.querySelectorAll('.work-links a[data-spy]').forEach(function (a) {
    spyLinks[a.getAttribute('data-spy')] = a;
  });
  var spyIds = Object.keys(spyLinks);

  function setActive(id) {
    spyIds.forEach(function (k) {
      spyLinks[k].classList.toggle('is-active', k === id);
    });
  }

  if ('IntersectionObserver' in window && spyIds.length) {
    var spyObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) setActive(en.target.id);
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    spyIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spyObs.observe(el);
    });
    // clear highlight near the very top / in about+contact
    var hero = document.getElementById('home');
    if (hero) {
      var heroObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) setActive(''); });
      }, { rootMargin: '-20% 0px -60% 0px' });
      heroObs.observe(hero);
    }
  }

  /* ---------- scroll reveals (with failsafe) ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (anim && !reduce && 'IntersectionObserver' in window && reveals.length) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          revObs.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { revObs.observe(el); });
    // if anything goes wrong, show everything
    setTimeout(function () { document.body.classList.add('reveal-failsafe'); }, 3200);
  } else {
    document.body.classList.add('reveal-failsafe');
  }

  /* ---------- claude code scene: typing loop ---------- */
  var typed = document.getElementById('ai-typed');
  var caret = document.getElementById('ai-caret');
  var promptText = document.querySelector('.ai-prompt');
  var lines = document.querySelectorAll('#ai-response .ai-line');
  var done = document.getElementById('ai-done');

  var prompts = [
    'make this queue survive a crash',
    'add stripe refunds to parking',
    'fix the websocket losing edits'
  ];

  function showFinalFrame() {
    if (typed) typed.textContent = ' ' + prompts[0];
    lines.forEach(function (l) { l.classList.add('is-on'); });
    if (done) done.classList.add('is-on');
    positionCaret();
  }

  function positionCaret() {
    if (!caret || !promptText) return;
    try {
      var w = promptText.getBBox().width;
      caret.setAttribute('x', 326 + w + 6);
    } catch (e) {}
  }

  function clearFrame() {
    if (typed) typed.textContent = '';
    lines.forEach(function (l) { l.classList.remove('is-on'); });
    if (done) done.classList.remove('is-on');
    positionCaret();
  }

  if (typed && caret) {
    if (reduce || !anim) {
      showFinalFrame();
    } else {
      var pi = 0;
      (function loop() {
        clearFrame();
        var text = prompts[pi % prompts.length];
        pi += 1;
        var ci = 0;
        (function typeChar() {
          if (ci <= text.length) {
            typed.textContent = ' ' + text.slice(0, ci);
            positionCaret();
            ci += 1;
            setTimeout(typeChar, 34 + Math.random() * 40);
          } else {
            // "response" streams in
            var li = 0;
            (function streamLine() {
              if (li < lines.length) {
                lines[li].classList.add('is-on');
                li += 1;
                setTimeout(streamLine, 170);
              } else {
                setTimeout(function () {
                  if (done) done.classList.add('is-on');
                  setTimeout(loop, 2600);
                }, 300);
              }
            })();
          }
        })();
      })();
    }
  }
})();
