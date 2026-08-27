// Web Push Notification Client Service (DOTRA Gate System)
// إدارة إشعارات الويب السحابية - دعم كامل لتنبيهات الدخول والخروج والتصاريح

class PushManagerService {
    constructor() {
        this.vapidPublicKey = 'BKwgzVplNP0DtEzEBV2MnQTtWIGLO8Cr7jdyAENM-b4zo2jodoLDY4d78M5LExz8UBYZU4DJKRcdTrSLGiAAsZ4';
        this.isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    async getSubscription() {
        if (!this.isSupported) return null;
        try {
            const reg = await navigator.serviceWorker.ready;
            return await reg.pushManager.getSubscription();
        } catch (e) {
            console.warn('[Push] Error getting subscription:', e);
            return null;
        }
    }

    async isSubscribed() {
        const sub = await this.getSubscription();
        return !!sub;
    }

    async requestPermissionAndSubscribe(role = 'manager', userId = null) {
        if (!this.isSupported) {
            return { success: false, message: 'Push notifications are not supported on this browser/device.' };
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                return { success: false, message: 'Notification permission denied.' };
            }

            const reg = await navigator.serviceWorker.ready;
            let sub = await reg.pushManager.getSubscription();

            if (!sub) {
                const convertedVapidKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
                sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidKey
                });
            }

            const subJSON = sub.toJSON();
            const payload = {
                endpoint: sub.endpoint,
                p256dh: subJSON.keys ? subJSON.keys.p256dh : '',
                auth: subJSON.keys ? subJSON.keys.auth : '',
                subscription: subJSON,
                role: role,
                user_id: userId,
                watch_all: 1
            };

            // Register with backend
            if (typeof fetch !== 'undefined') {
                await fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            localStorage.setItem('gate_push_enabled', 'true');
            return { success: true, subscription: sub };
        } catch (err) {
            console.error('[Push] Subscribe error:', err);
            return { success: false, message: err.message };
        }
    }

    async unsubscribe() {
        if (!this.isSupported) return { success: false };
        try {
            const sub = await this.getSubscription();
            if (sub) {
                const endpoint = sub.endpoint;
                await sub.unsubscribe();

                if (typeof fetch !== 'undefined') {
                    await fetch('/api/push/unsubscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ endpoint })
                    });
                }
            }
            localStorage.setItem('gate_push_enabled', 'false');
            return { success: true };
        } catch (err) {
            console.error('[Push] Unsubscribe error:', err);
            return { success: false, message: err.message };
        }
    }

    async showSystemNotification(title, body, type = 'info', tag = '') {
        // 1. Play Audio chime
        if (window.App && typeof window.App.playChime === 'function') {
            window.App.playChime(type);
        }

        // 2. Browser / OS Native Notification
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
                if ('serviceWorker' in navigator) {
                    const reg = await navigator.serviceWorker.ready;
                    if (reg && reg.showNotification) {
                        await reg.showNotification(title, {
                            body: body,
                            icon: 'assets/logo.jpg',
                            badge: 'assets/logo.jpg',
                            dir: 'rtl',
                            lang: 'ar',
                            tag: tag || `dotra-${Date.now()}`,
                            vibrate: [200, 100, 200],
                            renotify: true,
                            data: { url: './' }
                        });
                        return true;
                    }
                }
                new Notification(title, {
                    body: body,
                    icon: 'assets/logo.jpg',
                    badge: 'assets/logo.jpg',
                    dir: 'rtl',
                    lang: 'ar',
                    tag: tag || `dotra-${Date.now()}`
                });
                return true;
            } catch (e) {
                console.warn('[Push] showSystemNotification error:', e);
            }
        }
        return false;
    }

    async sendTestNotification() {
        return await this.showSystemNotification('🔔 اختبار إشعارات دوترا', 'نظام الإشعارات الفورية متصل ويعمل بنجاح!', 'info', 'test-notif');
    }

    startPolling(intervalMs = 3000) {
        if (this._pollTimer) clearInterval(this._pollTimer);
        this._pollTimer = setInterval(async () => {
            if (!window.DB) return;
            const notifs = await window.DB.getNotifications();
            const badge = document.getElementById('notif-badge');
            const mobileDot = document.getElementById('mobile-notif-dot');
            if (notifs && notifs.length > 0) {
                if (badge) { badge.textContent = notifs.length; badge.classList.remove('hidden'); }
                if (mobileDot) { mobileDot.classList.remove('hidden'); }
                for (const n of notifs) {
                    const type = n.type === 'entry' ? 'success' : (n.type === 'exit' ? 'warning' : (n.type === 'denied' ? 'error' : 'info'));
                    
                    // 1. Native Service Worker / OS Notification with Sound
                    await this.showSystemNotification(n.title, n.body, type, `notif-${n.id}`);

                    // 2. In-App Toast
                    if (window.App && typeof window.App.showToast === 'function') {
                        window.App.showToast(n.title, n.body, type, n.type === 'entry' ? 'check' : (n.type === 'exit' ? 'logout' : (n.type === 'denied' ? 'ban' : 'bell')));
                    }
                    // 3. Mark as read in Neon database
                    await window.DB.markNotificationRead(n.id);
                }
            } else {
                if (badge) { badge.classList.add('hidden'); }
            }
        }, intervalMs);
    }

    stopPolling() {
        if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    }
}

window.PushService = new PushManagerService();