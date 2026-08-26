// Authentication & Role Management (with Password Hashing)
// إدارة المصادقة والأدوار - مع تشفير كلمات المرور

class AuthService {
    constructor() {
        this.currentUser = JSON.parse(sessionStorage.getItem('gate_current_user') || 'null');
    }

    getCurrentUser() {
        return this.currentUser;
    }

    async hashPassword(password) {
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(password + 'dotra_gate_salt_2026');
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
        return password;
    }

    async verifyPassword(inputPassword, storedHash) {
        const inputHash = await this.hashPassword(inputPassword);
        return inputHash === storedHash;
    }

    async loginManager(email, password) {
        const users = window.DB.getUsers();
        const user = users.find(u => u.role === 'manager' && u.email.toLowerCase() === email.trim().toLowerCase());

        if (user) {
            const storedHash = user.password_hash;
            if (storedHash) {
                const isMatch = await this.verifyPassword(password.trim(), storedHash);
                if (isMatch) {
                    this.currentUser = user;
                    sessionStorage.setItem('gate_current_user', JSON.stringify(user));
                    return { success: true, user };
                }
            }
        }
        return { success: false, message: 'بيانات البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    async loginOfficer(badgeId, pinCode) {
        const users = window.DB.getUsers();
        const user = users.find(u => u.role === 'officer' && u.badge_id.toUpperCase() === badgeId.trim().toUpperCase() && u.pin_code === pinCode.trim());

        if (user) {
            this.currentUser = user;
            sessionStorage.setItem('gate_current_user', JSON.stringify(user));
            return { success: true, user };
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
