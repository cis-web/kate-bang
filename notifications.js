/* ═══════════════════════════════════════════
   notifications.js — ناردنی Notification بۆ SW
   چارەسەرکراو: کێشەی بانگدان
   ═══════════════════════════════════════════ */
'use strict';

let _notifTimers = [];
let _lastNotificationTime = {};
let _currentAdhanAudio = null;  // گلۆباڵ بۆ کۆنترۆڵ

/* ══════════════════════════════════════════
   دەستپێکردن
   ══════════════════════════════════════════ */
function initNotifications() {
  console.log('🔔 Initializing notifications...');
  _loadSettings();
  _startPrayerWatcher();
  _requestNotificationPermission();
  
  // ئامادەکردنی _playAdhanSafe و window._playAdhan
  window._playAdhanSafe = function() {
    const soundId = localStorage.getItem('droood_sound') || 'makkah2';
    if (typeof SOUNDS !== 'undefined') {
      const s = SOUNDS.find(x => x.id === soundId);
      if (s && s.url) {
        _playAdhanDirect(s.url);
        return;
      }
    }
    _playBeepFallback();
  };
  
  window._playAdhan = window._playAdhanSafe;
  
  window.stopPrayerAlert = function() {
    // وەستاندنی دەنگ
    if (_currentAdhanAudio) {
      _currentAdhanAudio.pause();
      _currentAdhanAudio.currentTime = 0;
      _currentAdhanAudio = null;
    }
    // داخستنی کارتی هوشیارکردنەوە
    const card = document.getElementById('prayer-alert-card');
    if (card) card.remove();
  };
  
  setInterval(_checkPrayerTimesNow, 15000);
  console.log('✅ Notification system ready');
}

/* ══════════════════════════════════════════
   داواکردنی ئیزن
   ══════════════════════════════════════════ */
function _requestNotificationPermission() {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    console.log('✅ Notification permission granted');
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(perm => {
      console.log('Notification permission:', perm);
    });
  }
}

/* ══════════════════════════════════════════
   پشکنینی کاتی نوێژ
   ══════════════════════════════════════════ */
function _getPrayerTimeKey(prayer) {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}_${prayer.id}`;
}

function _checkPrayerTimesNow() {
  if (typeof PRAYER_TIMES === 'undefined') return;
  
  const now = _getCurrentTime();
  const nowMins = now.h * 60 + now.m;
  
  PRAYER_TIMES.forEach(prayer => {
    const prayerMins = prayer.hour * 60 + prayer.min;
    const diffMins = nowMins - prayerMins;
    const key = _getPrayerTimeKey(prayer);
    
    if (diffMins >= 0 && diffMins <= 3 && !_lastNotificationTime[key]) {
      _lastNotificationTime[key] = Date.now();
      console.log(`🔔 Prayer time: ${prayer.name} at ${prayer.hour}:${prayer.min}`);
      _sendPrayerNotification(prayer);
      
      setTimeout(() => {
        delete _lastNotificationTime[key];
      }, 60000);
    }
  });
}

/* ══════════════════════════════════════════
   ناردنی هوشیارکردنەوەی نوێژ
   ══════════════════════════════════════════ */
function _sendPrayerNotification(prayer) {
  const ph = String(prayer.hour).padStart(2, '0');
  const pm = String(prayer.min).padStart(2, '0');
  const title = `🕌 کاتی ${prayer.name} گەیشت`;
  const body = `${prayer.arabic || ''} — ${ph}:${pm}`;
  
  // دۆزینەوەی دەنگی ئەزان
  const soundId = localStorage.getItem('droood_sound') || 'makkah2';
  let adhanUrl = null;
  if (typeof SOUNDS !== 'undefined') {
    const s = SOUNDS.find(x => x.id === soundId);
    if (s && s.url) adhanUrl = s.url;
  }
  
  // ١. ئەگەر ئەپ کراوەیە — دەنگ لێبدە + کارت نیشان بدە
  if (document.visibilityState === 'visible') {
    _showInAppAlert(title, body, adhanUrl);
    _playAdhanDirect(adhanUrl);
    return;
  }
  
  // ٢. ئەپ پاشزەمینەیە — SW + دەنگ
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_PRAYER_NOTIFICATION',
      title, body,
      withAdhan: true,
      adhanUrl,
      prayerId: prayer.id,
      prayerName: prayer.name
    });
  }
  
  // ٣. Notification ئاسایی بە هەر حاڵ
  if (Notification.permission === 'granted') {
    const n = new Notification(title, {
      body,
      icon: '/icon-192.png',
      requireInteraction: true,
      data: { adhanUrl }
    });
    n.onclick = () => {
      window.focus();
      if (adhanUrl) _playAdhanDirect(adhanUrl);
    };
  }
}

/* ══════════════════════════════════════════
   لێدانی دەنگ — چارەسەرکراو
   ══════════════════════════════════════════ */
function _playAdhanDirect(url) {
  // ئەگەر هیچ url نەبوو، beep لێبدە
  if (!url) {
    _playBeepFallback();
    return;
  }
  
  // ئەگەر دەنگی پێشوو هەیە وەستێنە
  if (_currentAdhanAudio) {
    _currentAdhanAudio.pause();
    _currentAdhanAudio = null;
  }
  
  try {
    const audio = new Audio(url);
    audio.volume = 1.0;
    _currentAdhanAudio = audio;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => console.log('✅ Adhan playing:', url))
        .catch(err => {
          console.warn('⚠️ Adhan play failed:', err.name);
          // AutoPlay بلۆک کرا — کاتی کلیک کردنی بەکارهێنەر لێبدە
          _scheduleAdhanOnInteraction(url);
        });
    }
    
    audio.onended = () => { _currentAdhanAudio = null; };
    audio.onerror = () => {
      console.warn('⚠️ Audio error, playing beep');
      _currentAdhanAudio = null;
      _playBeepFallback();
    };
    
    // دوای ٥ خولەک ئۆتۆماتیکی وەستێنە
    setTimeout(() => {
      if (_currentAdhanAudio === audio) {
        audio.pause();
        _currentAdhanAudio = null;
      }
    }, 300000);
    
  } catch(e) {
    console.error('Audio creation failed:', e);
    _playBeepFallback();
  }
}

// ئەگەر AutoPlay بلۆک کرا — کاتی دەستخستنی بەکارهێنەر لێبدە
function _scheduleAdhanOnInteraction(url) {
  const handler = () => {
    _playAdhanDirect(url);
    document.removeEventListener('click', handler);
    document.removeEventListener('touchstart', handler);
  };
  document.addEventListener('click', handler, { once: true });
  document.addEventListener('touchstart', handler, { once: true });
  console.log('ℹ️ Adhan will play on next user interaction');
}

// Beep فالبەک ئەگەر دەنگی ئەزان نەبوو
function _playBeepFallback() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const patterns = [
      { freq: 880, start: 0,   dur: 0.3 },
      { freq: 660, start: 0.4, dur: 0.3 },
      { freq: 880, start: 0.8, dur: 0.3 },
      { freq: 550, start: 1.2, dur: 0.5 },
    ];
    patterns.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.4, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.1);
    });
  } catch(e) {
    console.warn('Beep fallback failed:', e);
  }
}

/* ══════════════════════════════════════════
   کارتی هوشیارکردنەوە لەناو ئەپ
   ══════════════════════════════════════════ */
function _showInAppAlert(title, body, adhanUrl) {
  const existing = document.getElementById('prayer-alert-card');
  if (existing) existing.remove();
  
  const card = document.createElement('div');
  card.id = 'prayer-alert-card';
  card.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(300px, 85vw);
    background: linear-gradient(135deg, #1e3a5f, #0f2a44);
    border-radius: 28px;
    padding: 24px;
    z-index: 99999;
    text-align: center;
    border: 1px solid #c9a84c;
    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    animation: fadeInScale 0.3s ease;
  `;
  card.innerHTML = `
    <style>
      @keyframes fadeInScale {
        from { opacity:0; transform:translate(-50%,-50%) scale(0.8); }
        to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
      }
    </style>
    <div style="font-size:48px;margin-bottom:8px">🕌</div>
    <div style="font-size:18px;font-weight:bold;color:#c9a84c;margin:12px 0">${title}</div>
    <div style="font-size:14px;color:#ccc;margin-bottom:20px">${body}</div>
    <button id="prayer-alert-stop-btn" style="
      background:#dc2626;color:white;border:none;
      padding:12px 24px;border-radius:40px;
      font-size:16px;font-weight:bold;cursor:pointer;width:100%;
    ">⏹ وەستاندن</button>
  `;
  document.body.appendChild(card);
  
  document.getElementById('prayer-alert-stop-btn').onclick = () => {
    if (_currentAdhanAudio) {
      _currentAdhanAudio.pause();
      _currentAdhanAudio = null;
    }
    card.remove();
  };
  
  // ئۆتۆماتیکی دوای ٥ خولەک دابخە
  setTimeout(() => {
    if (document.getElementById('prayer-alert-card') === card) card.remove();
  }, 300000);
}

/* ══════════════════════════════════════════
   یاریدەدەرەکان
   ══════════════════════════════════════════ */
function _getCurrentTime() {
  if (typeof nowInCityTZ === 'function') return nowInCityTZ();
  const now = new Date();
  return { h: now.getHours(), m: now.getMinutes() };
}

function _startPrayerWatcher() {
  setInterval(_checkPrayerTimesNow, 10000);
}

function _loadSettings() {
  if (typeof PRAYER_TIMES !== 'undefined') {
    PRAYER_TIMES.forEach(p => {
      localStorage.getItem('droood_notif_' + p.id);
    });
  }
}
