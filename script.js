// Booking Form Handling
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize form elements
        const bookingForm = document.getElementById('bookingForm');
        const serviceTypeSelect = document.getElementById('serviceType');
        const bookingDateInput = document.getElementById('bookingDate');
        const honeypotField = document.getElementById('website');
        
        if (bookingForm && serviceTypeSelect && bookingDateInput) {
            // Set minimum date to today
            const today = new Date().toISOString().split('T')[0];
            bookingDateInput.min = today;
            
            // Handle service type change
            serviceTypeSelect.addEventListener('change', function() {
                const selectedService = this.value;
                bookingDateInput.value = ''; // Reset date
                
                if (selectedService === 'khichuri-bhog') {
                    // Remove any existing event listeners to prevent duplicates
                    const newBookingDateInput = bookingDateInput.cloneNode(true);
                    bookingDateInput.parentNode.replaceChild(newBookingDateInput, bookingDateInput);
                    bookingDateInput = newBookingDateInput;
                    
                    bookingDateInput.addEventListener('input', function() {
                        const selectedDate = new Date(this.value);
                        if (selectedDate.getDay() !== 6) {
                            showNotification('Khichuri Bhog is only available on Saturdays', 'warning');
                            this.value = '';
                        }
                    });
                }
            });
            
            // Handle form submission
            bookingForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                try {
                    // Check honeypot field
                    if (honeypotField && honeypotField.value) {
                        // If honeypot is filled, silently reject the submission
                        console.log('Bot detected - form submission rejected');
                        return;
                    }
                    
                    // Get form values
                    const formData = {
                        serviceType: serviceTypeSelect.value,
                        bookingDate: bookingDateInput.value,
                        name: document.getElementById('name').value.trim(),
                        phone: document.getElementById('phone').value.trim(),
                        notes: document.getElementById('notes').value.trim()
                    };
                    
                    // Validate required fields
                    if (!formData.serviceType) {
                        showNotification('Please select a service type', 'error');
                        return;
                    }
                    
                    if (!formData.bookingDate) {
                        showNotification('Please select a booking date', 'error');
                        return;
                    }
                    
                    if (!formData.name) {
                        showNotification('Please enter your name', 'error');
                        return;
                    }
                    
                    if (!formData.phone) {
                        showNotification('Please enter your phone number', 'error');
                        return;
                    }
                    
                    // Validate phone number
                    if (!/^\d{10}$/.test(formData.phone)) {
                        showNotification('Please enter a valid 10-digit phone number', 'error');
                        return;
                    }
                    
                    // Check terms and conditions
                    const termsCheck = document.getElementById('termsCheck');
                    if (!termsCheck.checked) {
                        showNotification('Please agree to the terms and conditions', 'error');
                        return;
                    }
                    
                    // Check if booking is for today and current time is after 9:30 AM
                    const bookingDate = new Date(formData.bookingDate);
                    const today = new Date();
                    
                    if (isSameDay(bookingDate, today) && isAfterCutoffTime()) {
                        showNotification('Bookings for today must be made before 9:30 AM', 'error');
                        return;
                    }
                    
                    // Create and save booking
                    const booking = {
                        id: Date.now(),
                        ...formData,
                        serviceName: getServiceName(formData.serviceType),
                        status: 'pending',
                        timestamp: new Date().toISOString()
                    };
                    
                    // Save booking and send email
                    saveBooking(booking);
                    sendBookingEmail(booking);
                    
                    // Forward to admin portal
                    forwardToAdminPortal(booking);
                    
                    // Show success message and reset form
                    showNotification('Booking submitted successfully! You will be redirected to the admin portal.', 'success');
                    
                    // Redirect to admin portal after a short delay
                    setTimeout(() => {
                        window.location.href = 'admin-login.html';
                    }, 2000);
                    
                    bookingForm.reset();
                    bookingDateInput.min = today;
                    termsCheck.checked = false;
                    
                } catch (error) {
                    console.error('Booking error:', error);
                    showNotification('An error occurred while processing your booking. Please try again.', 'error');
                }
            });
        } else {
            console.error('Booking form elements not found');
        }
        
        // Calculate and display upcoming Purnima dates
        calculatePurnimaDates();
        
        // Add smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });
        
        // Add animation on scroll for service cards
        const serviceCards = document.querySelectorAll('.service-card');
        
        if (serviceCards.length > 0) {
            const observerOptions = {
                threshold: 0.1
            };
            
            const observer = new IntersectionObserver(function(entries, observer) {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, observerOptions);
            
            serviceCards.forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                observer.observe(card);
            });
        }
    } catch (error) {
        console.error('Error initializing page:', error);
        showNotification('An error occurred while loading the page. Please refresh.', 'error');
    }
});

// Calculate and display upcoming Purnima dates
function calculatePurnimaDates() {
    const purnimaDatesList = document.getElementById('purnima-dates');
    if (!purnimaDatesList) return;
    
    const today = new Date();
    const purnimaDates = [];
    
    // Calculate next 6 Purnima dates
    for (let i = 0; i < 6; i++) {
        const purnimaDate = getNextPurnima(today, i);
        purnimaDates.push(purnimaDate);
    }
    
    // Clear existing dates
    purnimaDatesList.innerHTML = '';
    
    // Display Purnima dates
    purnimaDates.forEach(date => {
        const li = document.createElement('li');
        li.textContent = formatDate(date);
        purnimaDatesList.appendChild(li);
    });
}

// Get next Purnima date
function getNextPurnima(startDate, index) {
    // This is a simplified calculation
    // For accurate Purnima dates, use astronomical calculations
    const purnimaDate = new Date(startDate);
    purnimaDate.setDate(purnimaDate.getDate() + (15 - purnimaDate.getDate() % 15) + (index * 30));
    return purnimaDate;
}

// Format date for display
function formatDate(date) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'Asia/Kolkata'
    };
    return date.toLocaleDateString('en-IN', options);
}

// Function to get service name
function getServiceName(serviceType) {
    const services = {
        'birthday-pujan': 'Birthday Pujan',
        'onnopraton-pujan': 'Onnopraton Pujan',
        'special-pujan': 'Special Pujan',
        'purnima-event': 'Purnima Special Event',
        'sora-bhog': 'Sora Bhog',
        'khichuri-bhog': 'Saturday Khichuri Bhog',
        'family-dining': 'Family Dining'
    };
    return services[serviceType] || serviceType;
}

// Notification System
function showNotification(message, type = 'info') {
    try {
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300); // Match transition duration
        }, 5000);
        
    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

// Function to save booking
function saveBooking(booking) {
    try {
        // Get existing bookings
        let bookings = JSON.parse(localStorage.getItem('kalikundiBookings') || '[]');
        
        // Add new booking
        bookings.push(booking);
        
        // Save back to localStorage
        localStorage.setItem('kalikundiBookings', JSON.stringify(bookings));
        
        // Log for debugging
        console.log('Booking saved successfully:', booking);
        return true;
    } catch (error) {
        console.error('Error saving booking:', error);
        throw new Error('Failed to save booking');
    }
}

// Function to send booking email
function sendBookingEmail(booking) {
    try {
        const subject = `New Booking Request - ${getServiceName(booking.serviceType)}`;
        const body = `
Booking Details:
Service: ${getServiceName(booking.serviceType)}
Date: ${formatDate(new Date(booking.bookingDate))}
Name: ${booking.name}
Phone: ${booking.phone}
Notes: ${booking.notes || 'No additional notes'}
Booking ID: ${booking.id}
Timestamp: ${new Date().toLocaleString()}
        `;

        const mailtoLink = `mailto:kalikundidham@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Open email client in a new window/tab
        window.open(mailtoLink, '_blank');
        
        return true;
    } catch (error) {
        console.error('Error sending booking email:', error);
        showNotification('Error sending email. Please try again or contact us directly.', 'error');
        return false;
    }
}

// Check if current time is after 9:30 AM
function isAfterCutoffTime() {
    const now = new Date();
    const cutoffTime = new Date(now);
    cutoffTime.setHours(9, 30, 0, 0);
    return now > cutoffTime;
}

// Check if two dates are the same day
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// Function to forward booking to admin portal
function forwardToAdminPortal(booking) {
    try {
        // Store the booking in sessionStorage for admin portal access
        sessionStorage.setItem('lastBooking', JSON.stringify(booking));
        
        // Also store in localStorage for admin dashboard
        let adminBookings = JSON.parse(localStorage.getItem('adminBookings') || '[]');
        
        // Check if booking already exists to avoid duplicates
        const existingBookingIndex = adminBookings.findIndex(b => b.id === booking.id);
        if (existingBookingIndex === -1) {
            // Add new booking only if it doesn't exist
            adminBookings.push(booking);
            localStorage.setItem('adminBookings', JSON.stringify(adminBookings));
            
            // Also update the kalikundiBookings in localStorage
            let kalikundiBookings = JSON.parse(localStorage.getItem('kalikundiBookings') || '[]');
            kalikundiBookings.push(booking);
            localStorage.setItem('kalikundiBookings', JSON.stringify(kalikundiBookings));
        }
        
        console.log('Booking forwarded to admin portal:', booking);
        return true;
    } catch (error) {
        console.error('Error forwarding to admin portal:', error);
        return false;
    }
} 