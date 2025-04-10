// Security Configuration - 5 Layer Security System
const SecuritySystem = {
    // Layer 1: Authentication & Authorization
    auth: {
        // Rate limiting for login attempts
        maxLoginAttempts: 3,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
        loginAttempts: new Map(),
        
        // Session management
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        lastActivity: new Map(),
        
        // Password requirements
        passwordRequirements: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true
        },
        
        // Validate password strength
        validatePassword(password) {
            const hasUpperCase = /[A-Z]/.test(password);
            const hasLowerCase = /[a-z]/.test(password);
            const hasNumbers = /\d/.test(password);
            const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
            
            return password.length >= this.passwordRequirements.minLength &&
                   hasUpperCase &&
                   hasLowerCase &&
                   hasNumbers &&
                   hasSpecialChars;
        },
        
        // Check login attempts
        checkLoginAttempts(username) {
            const attempts = this.loginAttempts.get(username) || 0;
            const lastAttempt = this.lastActivity.get(username);
            
            if (attempts >= this.maxLoginAttempts) {
                if (lastAttempt && (Date.now() - lastAttempt) < this.lockoutDuration) {
                    return false; // Account is locked
                }
                // Reset attempts after lockout duration
                this.loginAttempts.delete(username);
            }
            return true;
        },
        
        // Record login attempt
        recordLoginAttempt(username, success) {
            if (success) {
                this.loginAttempts.delete(username);
                this.lastActivity.set(username, Date.now());
            } else {
                const attempts = (this.loginAttempts.get(username) || 0) + 1;
                this.loginAttempts.set(username, attempts);
                this.lastActivity.set(username, Date.now());
            }
        }
    },
    
    // Layer 2: Data Encryption
    encryption: {
        // Simple encryption key (in production, use a secure key management system)
        encryptionKey: 'kalikundidham-secure-key-2024',
        
        // Encrypt data
        encrypt(data) {
            try {
                const jsonString = JSON.stringify(data);
                const encrypted = btoa(jsonString); // Base64 encoding
                return encrypted;
            } catch (error) {
                console.error('Encryption error:', error);
                return null;
            }
        },
        
        // Decrypt data
        decrypt(encryptedData) {
            try {
                const decrypted = atob(encryptedData); // Base64 decoding
                return JSON.parse(decrypted);
            } catch (error) {
                console.error('Decryption error:', error);
                return null;
            }
        }
    },
    
    // Layer 3: Input Validation & Sanitization
    validation: {
        // Sanitize input
        sanitizeInput(input) {
            if (typeof input !== 'string') return input;
            return input.replace(/[<>]/g, ''); // Remove potential HTML tags
        },
        
        // Validate email
        validateEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },
        
        // Validate phone number
        validatePhone(phone) {
            const phoneRegex = /^\d{10}$/;
            return phoneRegex.test(phone);
        },
        
        // Validate booking data
        validateBooking(booking) {
            return {
                isValid: true,
                serviceType: this.sanitizeInput(booking.serviceType),
                bookingDate: this.sanitizeInput(booking.bookingDate),
                name: this.sanitizeInput(booking.name),
                phone: this.validatePhone(booking.phone) ? booking.phone : null,
                notes: this.sanitizeInput(booking.notes)
            };
        }
    },
    
    // Layer 4: Access Control
    accessControl: {
        // Role-based access control
        roles: {
            admin: ['read', 'write', 'delete'],
            user: ['read']
        },
        
        // Check permissions
        checkPermission(role, action) {
            return this.roles[role]?.includes(action) || false;
        },
        
        // Validate session
        validateSession() {
            const session = localStorage.getItem('adminSession');
            if (!session) return false;
            
            try {
                const sessionData = JSON.parse(session);
                const now = Date.now();
                
                // Check if session is expired
                if (now - sessionData.timestamp > SecuritySystem.auth.sessionTimeout) {
                    localStorage.removeItem('adminSession');
                    return false;
                }
                
                return true;
            } catch (error) {
                console.error('Session validation error:', error);
                return false;
            }
        }
    },
    
    // Layer 5: Audit Logging
    audit: {
        // Log security events
        logEvent(event) {
            const logEntry = {
                timestamp: new Date().toISOString(),
                event: event.type,
                details: event.details,
                user: event.user || 'anonymous',
                ip: event.ip || 'unknown'
            };
            
            // Store logs in localStorage (in production, send to server)
            const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
            logs.push(logEntry);
            localStorage.setItem('securityLogs', JSON.stringify(logs));
        },
        
        // Get security logs
        getLogs() {
            return JSON.parse(localStorage.getItem('securityLogs') || '[]');
        },
        
        // Clear old logs
        clearOldLogs(daysToKeep = 30) {
            const logs = this.getLogs();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            const filteredLogs = logs.filter(log => 
                new Date(log.timestamp) > cutoffDate
            );
            
            localStorage.setItem('securityLogs', JSON.stringify(filteredLogs));
        }
    },
    
    // Initialize security system
    init() {
        // Clear old logs
        this.audit.clearOldLogs();
        
        // Log system initialization
        this.audit.logEvent({
            type: 'SYSTEM_INIT',
            details: 'Security system initialized',
            user: 'system'
        });
    }
};

// Initialize security system
SecuritySystem.init(); 