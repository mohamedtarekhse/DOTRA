// Authentication & Role Management (with Per-User Salted Password Hashing)
// إدارة المصادقة والأدوار - مع تشفير كلمات المرور لكل مستخدم

class AuthService {
    constructor() {
        this.currentUser = JSON.parse(sessionStorage.getItem('gate_current_user') || 'null');
    }

    getCurrentUser() {
        return this.currentUser;
    }

    generateSalt() {
        const arr = new Uint8Array(16);
        crypto.getRandomValues(arr);
        return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async hashPassword(password, salt) {
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(password + salt);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
        return password;
    }

    async createPasswordHash(password) {
        const salt = this.generateSalt();
        const hash = await this.hashPassword(password, salt);
        return `${salt}:${hash}`;
    }

    async verifyPassword(inputPassword, storedHash) {
        if (storedHash && storedHash.includes(':')) {
            const [salt, hash] = storedHash.split(':');
            const inputHash = await this.hashPassword(inputPassword, salt);
            return inputHash === hash;
        }
        return false;
    }

    async loginManager(email, password) {
        const users = window.DB.getUsers();
        const user = users.find(u => (u.role === 'manager' || u.role === 'ceo' || u.role === 'admin') && u.email && u.email.toLowerCase() === email.trim().toLowerCase());

        if (user && user.password_hash) {
            const isMatch = await this.verifyPassword(password.trim(), user.password_hash);
            if (isMatch) {
                this.currentUser = user;
                sessionStorage.setItem('gate_current_user', JSON.stringify(user));
                return { success: true, user };
            }
        }
        return { success: false, message: 'بيانات البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    async loginOfficer(badgeId, pinCode) {
        const users = window.DB.getUsers();
        const user = users.find(u => u.role === 'officer' && u.badge_id.toUpperCase() === badgeId.trim().toUpperCase());

        if (user) {
            let pinMatch = false;
            if (user.pin_hash) {
                pinMatch = await this.verifyPassword(pinCode.trim(), user.pin_hash);
            } else if (user.pin_code) {
                pinMatch = user.pin_code === pinCode.trim();
            }
            if (pinMatch) {
                this.currentUser = user;
                sessionStorage.setItem('gate_current_user', JSON.stringify(user));
                return { success: true, user };
            }
        }
        return { success: false, message: 'رقم الشارة أو الرمز السري (PIN) غير صحيح' };
    }

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('gate_current_user');
        window.location.reload();
    }
}

window.Auth = new AuthService();
