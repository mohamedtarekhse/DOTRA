// Authentication & Role Management
// إدارة المصادقة والأدوار للحسابات

class AuthService {
    constructor() {
        this.currentUser = JSON.parse(sessionStorage.getItem('gate_current_user') || 'null');
    }

    getCurrentUser() {
        return this.currentUser;
    }

    loginManager(email, password) {
        const users = window.DB.getUsers();
        const user = users.find(u => u.role === 'manager' && u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password.trim());
        
        if (user) {
            this.currentUser = user;
            sessionStorage.setItem('gate_current_user', JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: 'بيانات البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    loginOfficer(badgeId, pinCode) {
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
