/* ═══════════════════════════════════════════
   adhan_test.js — تێستی بانگ (چارەسەرکراو)
   ═══════════════════════════════════════════ */

function _openAdhanTestPanel() {
  var old = document.getElementById('adhan-test-panel');
  if (old) { old.remove(); window._clearAdhanTest(); return; }

  var now = new Date();
  var hStr = String(now.getHours()).padStart(2,'0');
  var mStr = String(now.getMinutes()).padStart(2,'0');
  var sStr = String(now.getSeconds()).padStart(2,'0');

  var overlay = document.createElement('div');
  overlay.id = 'adhan-test-panel';
  overlay.style.cssText =
    'position:fixed;top:0;left:0;right:0;bottom:0;' +
    'background:rgba(0,0,0,0.82);z-index:99999;' +
    'display:flex;align-items:center;justify-content:center;' +
    'backdrop-filter:blur(8px);font-family:var(--font);direction:rtl;';

  var box = document.createElement('div');
  box.style.cssText =
    'background:#10101a;border:1.5px solid rgba(201,168,76,0.45);' +
    'border-radius:24px;padding:26px 22px;width:min(340px,88vw);' +
    'color:#eeeeff;text-align:center;';

  box.innerHTML =
    '<div style="font-size:40px;margin-bottom:6px">🕌</div>' +
    '<div style="font-size:17px;font-weight:800;color:#c9a84c;margin-bottom:4px">تێستی بانگ</div>' +
    '<div id="atp-now" style="font-size:12px;color:#555577;margin-bottom:18px">' +
      'کاتی ئێستا: ' + hStr + ':' + mStr + ':' + sStr +
    '</div>' +

    '<div style="margin-bottom:14px;text-align:right">' +
      '<div style="font-size:12px;color:#c9a84c;margin-bottom:7px">چرکە تا بانگ</div>' +
      '<div style="display:flex;gap:8px;">' +
        '<button id="atp-d5"  onclick="window._atpSetDelay(5)"   style="flex:1;padding:11px 0;border-radius:12px;border:1.5px solid rgba(201,168,76,0.25);background:#1c1c2a;color:#888899;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer">٥چ</button>' +
        '<button id="atp-d10"  onclick="window._atpSetDelay(10)"  style="flex:1;padding:11px 0;border-radius:12px;border:1.5px solid rgba(201,168,76,0.25);background:#1c1c2a;color:#888899;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer">١٠چ</button>' +
        '<button id="atp-d30"  onclick="window._atpSetDelay(30)"  style="flex:1;padding:11px 0;border-radius:12px;border:1.5px solid rgba(201,168,76,0.7);background:rgba(201,168,76,0.12);color:#c9a84c;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer">٣٠چ</button>' +
        '<button id="atp-d60"  onclick="window._atpSetDelay(60)"  style="flex:1;padding:11px 0;border-radius:12px;border:1.5px solid rgba(201,168,76,0.25);background:#1c1c2a;color:#888899;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer">٦٠چ</button>' +
      '</div>' +
    '</div>' +

    '<div id="atp-bar" style="background:rgba(201,168,76,0.07);border:1px solid rgba(201,168,76,0.18);border-radius:12px;padding:11px;margin-bottom:16px;font-size:14px;color:#555577;">' +
      'دوگمەی «دەستپێبکە» بکە' +
    '</div>' +

    '<div style="display:flex;gap:10px;margin-bottom:10px">' +
      '<button onclick="window._atpStart()" style="flex:2;padding:14px;border-radius:50px;border:none;background:linear-gradient(135deg,#a67c2e,#c9a84c);color:#0d0d08;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 4px 16px rgba(201,168,76,0.3)">▶ دەستپێبکە</button>' +
      '<button onclick="window._atpStop()" style="flex:1;padding:14px;border-radius:50px;border:1px solid rgba(201,168,76,0.25);background:#1c1c2a;color:#c9a84c;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">⏹ وەستان</button>' +
    '</div>' +

    '<button onclick="window._atpClose()" style="width:100%;padding:9px;border-radius:50px;border:none;background:transparent;color:#333355;font-size:13px;cursor:pointer;font-family:inherit">✕ داخستن</button>';

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // clock update
  window._atpClockInt = setInterval(function() {
    var n = new Date();
    var el = document.getElementById('atp-now');
    if (!el) { clearInterval(window._atpClockInt); return; }
    el.textContent = 'کاتی ئێستا: ' +
      String(n.getHours()).padStart(2,'0') + ':' +
      String(n.getMinutes()).padStart(2,'0') + ':' +
      String(n.getSeconds()).padStart(2,'0');
  }, 1000);
}

window._atpDelay = 30;

window._atpSetDelay = function(s) {
  window._atpDelay = s;
  [5,10,30,60].forEach(function(x) {
    var b = document.getElementById('atp-d' + x);
    if (!b) return;
    if (x === s) {
      b.style.borderColor = 'rgba(201,168,76,0.7)';
      b.style.background  = 'rgba(201,168,76,0.12)';
      b.style.color       = '#c9a84c';
    } else {
      b.style.borderColor = 'rgba(201,168,76,0.25)';
      b.style.background  = '#1c1c2a';
      b.style.color       = '#888899';
    }
  });
};

window._atpTimer = null;
window._atpInt   = null;

window._atpStart = function() {
  window._clearAdhanTest();
  var left = window._atpDelay;
  var bar  = document.getElementById('atp-bar');

  // نیشاندانی ژمارەی دەستپێک
  if (bar) {
    bar.innerHTML =
      '<span style="color:#c9a84c;font-size:22px;font-weight:800">' + left + '</span>' +
      '<span style="color:#555577;font-size:13px"> چرکە تا بانگ...</span>';
  }

  window._atpInt = setInterval(function() {
    if (!document.getElementById('atp-bar')) { window._clearAdhanTest(); return; }
    bar = document.getElementById('atp-bar');
    left--;
    if (left > 0) {
      bar.innerHTML =
        '<span style="color:#c9a84c;font-size:22px;font-weight:800">' + left + '</span>' +
        '<span style="color:#555577;font-size:13px"> چرکە تا بانگ...</span>';
    } else {
      bar.innerHTML = '<span style="color:#c9a84c;font-size:15px;font-weight:800">🕌 بانگ دەدرێت!</span>';
      clearInterval(window._atpInt);
      window._atpInt = null;

      // لێدانی بانگ — ئێستا درست کراوە
      var soundId = localStorage.getItem('droood_sound') || 'makkah2';
      var adhanUrl = null;

      if (typeof SOUNDS !== 'undefined') {
        var s = SOUNDS.find(function(x) { return x.id === soundId; });
        if (s && s.url) adhanUrl = s.url;
      }

      if (adhanUrl) {
        // ڕاستەوخۆ دەنگ لێبدە
        var audio = new Audio(adhanUrl);
        audio.volume = 1.0;
        window._atpCurrentAudio = audio;
        audio.play()
          .then(function() {
            console.log('✅ Test adhan playing');
            bar.innerHTML = '<span style="color:#4CAF50;font-size:13px;font-weight:800">🔊 بانگ دادرێت...</span>';
          })
          .catch(function(e) {
            console.warn('Play failed:', e.name);
            bar.innerHTML = '<span style="color:#ff9800;font-size:12px">⚠️ کلیکێک بکە تا بانگ بدرێت</span>';
            // کاتی کلیک بانگ لێبدە
            document.addEventListener('click', function handler() {
              audio.play().catch(function(){});
              document.removeEventListener('click', handler);
            }, { once: true });
          });
        audio.onended = function() { window._atpCurrentAudio = null; };
      } else if (typeof window._playAdhanSafe === 'function') {
        window._playAdhanSafe();
      } else if (typeof window.playAdhan === 'function') {
        window.playAdhan(soundId);
      }
    }
  }, 1000);
};

window._atpStop = function() {
  window._clearAdhanTest();
  // وەستاندنی دەنگی تێست
  if (window._atpCurrentAudio) {
    window._atpCurrentAudio.pause();
    window._atpCurrentAudio.currentTime = 0;
    window._atpCurrentAudio = null;
  }
  if (typeof window.stopAllAdhan === 'function') window.stopAllAdhan();
  if (typeof window.stopPrayerAlert === 'function') window.stopPrayerAlert();
  var bar = document.getElementById('atp-bar');
  if (bar) bar.innerHTML = '<span style="color:#555577">وەستێنرا</span>';
};

window._atpClose = function() {
  window._clearAdhanTest();
  if (window._atpCurrentAudio) {
    window._atpCurrentAudio.pause();
    window._atpCurrentAudio = null;
  }
  if (typeof window.stopAllAdhan === 'function') window.stopAllAdhan();
  var el = document.getElementById('adhan-test-panel');
  if (el) el.remove();
};

window._clearAdhanTest = function() {
  if (window._atpInt)      { clearInterval(window._atpInt);      window._atpInt      = null; }
  if (window._atpTimer)    { clearTimeout(window._atpTimer);     window._atpTimer    = null; }
  if (window._atpClockInt) { clearInterval(window._atpClockInt); window._atpClockInt = null; }
};

window._openAdhanTestPanel = _openAdhanTestPanel;
