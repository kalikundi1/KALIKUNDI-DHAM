document.addEventListener('DOMContentLoaded', function() {
    // Calculate and display upcoming Purnima dates
    calculatePurnimaDates();
    
    // Form submission handling
    const bookingForm = document.getElementById('bookingForm');
    
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const serviceType = document.getElementById('serviceType').value;
        const date = document.getElementById('bookingDate').value;
        const name = document.getElementById('customerName').value;
        const phone = document.getElementById('customerPhone').value;
        const notes = document.getElementById('additionalNotes').value;
        
        // Validate form
        if (!serviceType || !date || !name || !phone) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // Validate phone number
        if (!isValidPhoneNumber(phone)) {
            showNotification('Please enter a valid phone number', 'error');
            return;
        }
        
        // Validate date based on service type
        if (!isValidBookingDate(serviceType, date)) {
            showNotification('Invalid date for the selected service', 'error');
            return;
        }
        
        // Create booking message
        const bookingMessage = `
            Booking Details:
            Service: ${getServiceName(serviceType)}
            Date: ${formatDate(date)}
            Name: ${name}
            Phone: ${phone}
            ${notes ? `Notes: ${notes}` : ''}
            
            Thank you for booking with Kalikundi Dham.
            We will contact you shortly to confirm your booking.
        `;
        
        // Send booking request via WhatsApp
        sendBookingWhatsApp(serviceType, date, name, phone, notes);
        
        // Show booking confirmation
        showNotification(bookingMessage, 'success');
        
        // Reset form
        bookingForm.reset();
    });
    
    // Set minimum date to today
    const dateInput = document.getElementById('bookingDate');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    
    // Add smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
    
    // Add animation on scroll for service cards
    const serviceCards = document.querySelectorAll('.service-card');
    
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
    
    // Service type change handler
    document.getElementById('serviceType').addEventListener('change', function() {
        const serviceType = this.value;
        const dateInput = document.getElementById('bookingDate');
        
        // Reset date input
        dateInput.value = '';
        
        // Set date restrictions based on service type
        if (serviceType === 'khichuri-bhog') {
            // For Khichuri Bhog, only allow Saturdays
            dateInput.addEventListener('change', function() {
                const selectedDate = new Date(this.value);
                const dayOfWeek = selectedDate.getDay();
                
                if (dayOfWeek !== 6) { // 6 is Saturday
                    showNotification('Khichuri Bhog is only available on Saturdays', 'error');
                    this.value = '';
                }
            });
        }
    });
});

// Function to calculate and display upcoming Purnima dates
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
    
    // Display Purnima dates
    purnimaDates.forEach(date => {
        const li = document.createElement('li');
        li.textContent = formatDate(date.toISOString().split('T')[0]);
        purnimaDatesList.appendChild(li);
    });
}

// Function to get the next Purnima date
function getNextPurnima(startDate, index) {
    // This is a simplified calculation and may not be 100% accurate
    // For accurate Purnima dates, you would need to use a proper astronomical calculation
    const purnimaDate = new Date(startDate);
    purnimaDate.setDate(purnimaDate.getDate() + (15 - purnimaDate.getDate() % 15) + (index * 30));
    return purnimaDate;
}

// Function to format date for display
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
}

// Function to validate phone number
function isValidPhoneNumber(phone) {
    // Simple validation for Indian phone numbers
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
}

// Function to validate booking date based on service type
function isValidBookingDate(serviceType, dateString) {
    const date = new Date(dateString);
    const today = new Date();
    
    // Check if date is in the future
    if (date < today) {
        return false;
    }
    
    // Special validation for Khichuri Bhog (Saturdays only)
    if (serviceType === 'khichuri-bhog') {
        return date.getDay() === 6; // 6 is Saturday
    }
    
    return true;
}

// Function to get service name from service type
function getServiceName(serviceType) {
    const serviceNames = {
        'birthday-pujan': 'Birthday Pujan',
        'onnopraton-pujan': 'Onnopraton Pujan',
        'special-pujan': 'Special Pujan',
        'purnima-event': 'Purnima Special Event',
        'sora-bhog': 'Sora Bhog (₹60)',
        'khichuri-bhog': 'Saturday Khichuri Bhog (₹60)',
        'family-dining': 'Family Dining (₹100 per person)'
    };
    
    return serviceNames[serviceType] || serviceType;
}

// Function to show notification
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// Function to send booking WhatsApp message
function sendBookingWhatsApp(serviceType, date, name, phone, notes) {
    const whatsappMessage = `
*New Booking Request - Kalikundi Dham*

Service: ${getServiceName(serviceType)}
Date: ${formatDate(date)}
Customer Name: ${name}
Phone Number: ${phone}
${notes ? `Additional Notes: ${notes}` : ''}

This is an automated message from the Kalikundi Dham booking system.
    `;
    
    // Create WhatsApp link
    const whatsappLink = `https://wa.me/919332097084?text=${encodeURIComponent(whatsappMessage)}`;
    
    // Open WhatsApp in a new tab
    window.open(whatsappLink, '_blank');
} 