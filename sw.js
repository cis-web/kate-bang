// ===== Service Worker — بانگ سلێمانی v3 =====

let prayerTimes = null;
let dayIndex = -1;
let settings = { n: true, v: true, pre: false };
let firedToday = {};
let loopTimer = null;

self.addEventListener('install', function(e) {
    self.skipWaiting();
});

self.addEventListener('activate', function(e) {
    e.waitUntil(clients.claim());
});

self.addEventListener('message', function(e) {
    if (!e.data) return;
    var d = e.data;

    if (d.type === 'INIT') {
        prayerTimes = d.prayerTimes;
        dayIndex    = d.dayIndex;
        settings    = d.settings || settings;
        firedToday  = d.firedToday || {};
        startLoop();
    }

    if (d.type === 'SETTINGS') {
        settings = d.settings;
    }

    if (d.type === 'TEST_NOTIF') {
        showNotif(
            '🕌 تیست — فەجر  —  الفجر',
            'ئاگادارکردنەوە کار دەکات ✅ — لە کاتی قفلی شاشەش دەکات',
            'test-' + Date.now()
        );
    }

    if (d.type === 'NEW_DAY') {
        prayerTimes = d.prayerTimes;
        dayIndex    = d.dayIndex;
        firedToday  = {};
    }
});

function startLoop() {
    if (loopTimer) clearInterval(loopTimer);
    checkPrayers();
    loopTimer = setInterval(checkPrayers, 30000);
}

function getDayIndex() {
    var n = new Date();
    var s = new Date(n.getFullYear(), 0, 0);
    return Math.floor((n - s) / 86400000) - 1;
}

function prayerMs(h, m) {
    var d = new Date();
    d.setHours(h, m, 0, 0);
    return d.getTime();
}

function fmt(h, m) {
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}

function sendToClients(msg) {
    return clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
        list.forEach(function(c) { c.postMessage(msg); });
    });
}

var PR_NAMES = [
    { ar: 'الفجر',  ku: 'فەجر',    icon: '🌙', adhan: true  },
    { ar: 'الشروق', ku: 'سروو',    icon: '🌅', adhan: false },
    { ar: 'الظهر',  ku: 'نیوەڕۆ', icon: '☀️', adhan: true  },
    { ar: 'العصر',  ku: 'عەسر',   icon: '🌤', adhan: true  },
    { ar: 'المغرب', ku: 'مەغرب',  icon: '🌇', adhan: true  },
    { ar: 'العشاء', ku: 'عیشا',   icon: '🌃', adhan: true  }
];

function checkPrayers() {
    if (!prayerTimes) return;

    var now    = new Date();
    var nowMs  = now.getTime();
    var curDay = getDayIndex();

    if (curDay !== dayIndex) {
        dayIndex   = curDay;
        firedToday = {};
        sendToClients({ type: 'REQUEST_NEW_DAY' });
        return;
    }

    for (var i = 0; i < 6; i++) {
        var h   = prayerTimes[i][0];
        var m   = prayerTimes[i][1];
        var pMs = prayerMs(h, m);
        var key = dayIndex + '-' + i;
        var preKey = 'pre-' + key;

        // کاتی نوێژ (پەنجەرەی ٣٠ چرکە)
        if (!firedToday[key] && nowMs >= pMs && nowMs < pMs + 30000) {
            firedToday[key] = true;
            doAdhan(i, h, m, key);
        }

        // ١٥ خولەک پێش
        if (settings.pre) {
            var preMs = pMs - 900000;
            if (!firedToday[preKey] && nowMs >= preMs && nowMs < preMs + 30000) {
                firedToday[preKey] = true;
                showNotif(
                    '⏰ ' + PR_NAMES[i].ku + ' نزیکە',
                    PR_NAMES[i].ku + ' لە ١٥ خولەک دەگات — ' + fmt(h, m),
                    preKey
                );
            }
        }
    }
}

function doAdhan(idx, h, m, key) {
    var p = PR_NAMES[idx];

    if (settings.n) {
        showNotif(
            p.icon + ' ' + p.ar + '  —  ' + p.ku,
            'کاتی ' + p.ku + ' گەیشت — ' + fmt(h, m),
            key
        );
    }

    sendToClients({
        type:    'PRAYER_FIRED',
        idx:     idx,
        prayer:  p,
        time:    fmt(h, m),
        adhan:   p.adhan,
        vibrate: settings.v
    });

    sendToClients({ type: 'FIRED_UPDATE', firedToday: firedToday });
}

function showNotif(title, body, tag) {
    return self.registration.showNotification(title, {
        body:               body,
        icon:               'https://cdn-icons-png.flaticon.com/512/190/190411.png',
        badge:              'https://cdn-icons-png.flaticon.com/512/190/190411.png',
        tag:                tag,
        requireInteraction: true,
        silent:             false,
        vibrate:            settings.v ? [400, 150, 400, 150, 800] : undefined
    });
}

self.addEventListener('notificationclick', function(e) {
    e.notification.close();
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
            for (var i = 0; i < list.length; i++) {
                if ('focus' in list[i]) return list[i].focus();
            }
            return clients.openWindow('./');
        })
    );
});
