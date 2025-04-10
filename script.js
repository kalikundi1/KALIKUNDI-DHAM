// Audio Player Functionality
let audioContext = null;
let audioBuffers = {};
let audioSources = {};
let isPlaying = false;

const SOUNDS = {
    morning: 'https://assets.mixkit.co/sfx/preview/mixkit-morning-birds-in-the-forest-2479.mp3',
    peacock: 'https://assets.mixkit.co/sfx/preview/mixkit-peacock-call-2469.mp3',
    river: 'https://assets.mixkit.co/sfx/preview/mixkit-river-stream-2468.mp3',
    krishnaFlute: 'https://assets.mixkit.co/sfx/preview/mixkit-indian-flute-melody-2467.mp3'
};

// Initialize audio context on user interaction
function initAudio() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return true;
    } catch (error) {
        console.error('Error initializing audio context:', error);
        showNotification('Your browser does not support audio playback', 'error');
        return false;
    }
}

// Load audio buffer
async function loadAudioBuffer(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
        console.error('Error loading audio:', error);
        showNotification('Error loading ambient sounds. Please try again.', 'error');
        return null;
    }
}

// Play ambient sounds
async function playAmbientSounds() {
    try {
        if (!initAudio()) {
            return;
        }
        
        // Load all sounds if not already loaded
        for (const [name, url] of Object.entries(SOUNDS)) {
            if (!audioBuffers[name]) {
                audioBuffers[name] = await loadAudioBuffer(url);
            }
            
            if (audioBuffers[name]) {
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffers[name];
                source.loop = true;
                
                const gainNode = audioContext.createGain();
                // Set lower volume for krishnaFlute
                gainNode.gain.value = name === 'krishnaFlute' ? 
                    (document.getElementById('volumeSlider').value / 100) * 0.7 : 
                    document.getElementById('volumeSlider').value / 100;
                
                source.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                source.start(0);
                audioSources[name] = { source, gainNode };
            }
        }
        
        isPlaying = true;
        updatePlayButton();
        
    } catch (error) {
        console.error('Error playing audio:', error);
        showNotification('Error playing ambient sounds. Please try again.', 'error');
    }
}

// Stop all sounds
function stopAmbientSounds() {
    try {
        for (const [name, { source }] of Object.entries(audioSources)) {
            try {
                source.stop();
            } catch (error) {
                console.error(`Error stopping ${name} sound:`, error);
            }
        }
        audioSources = {};
        isPlaying = false;
        updatePlayButton();
    } catch (error) {
        console.error('Error stopping sounds:', error);
    }
}

// Update play button state
function updatePlayButton() {
    const toggleButton = document.getElementById('toggleAudio');
    if (toggleButton) {
        if (isPlaying) {
            toggleButton.classList.add('playing');
            toggleButton.innerHTML = '<i class="fas fa-volume-up"></i> Stop Ambient Sounds';
        } else {
            toggleButton.classList.remove('playing');
            toggleButton.innerHTML = '<i class="fas fa-volume-up"></i> Play Ambient Sounds';
        }
    }
}

// Toggle audio playback
function toggleAudio() {
    try {
        if (!isPlaying) {
            if (audioContext) {
                audioContext.resume().then(() => {
                    playAmbientSounds();
                }).catch(error => {
                    console.error('Error resuming audio context:', error);
                    showNotification('Error playing sounds. Please try again.', 'error');
                });
            } else {
                playAmbientSounds();
            }
        } else {
            stopAmbientSounds();
        }
    } catch (error) {
        console.error('Error toggling audio:', error);
        showNotification('Error with audio playback. Please try again.', 'error');
    }
}

// Update volume for all playing sounds
function updateVolume(value) {
    try {
        const volume = value / 100;
        for (const { gainNode } of Object.values(audioSources)) {
            gainNode.gain.value = volume;
        }
    } catch (error) {
        console.error('Error updating volume:', error);
    }
}

// Booking Form Handling
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize form elements
        const bookingForm = document.getElementById('bookingForm');
        const serviceTypeSelect = document.getElementById('serviceType');
        const bookingDateInput = document.getElementById('bookingDate');
        
        if (bookingForm && serviceTypeSelect && bookingDateInput) {
            // Set minimum date to today
            const today = new Date().toISOString().split('T')[0];
            bookingDateInput.min = today;
            
            // Handle service type change
            serviceTypeSelect.addEventListener('change', function() {
                const selectedService = this.value;
                bookingDateInput.value = ''; // Reset date
                
                if (selectedService === 'khichuri-bhog') {
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
            bookingForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                try {
                    // Get and validate form values
                    const formData = {
                        serviceType: serviceTypeSelect.value,
                        bookingDate: bookingDateInput.value,
                        name: document.getElementById('name').value.trim(),
                        phone: document.getElementById('phone').value.trim(),
                        notes: document.getElementById('notes').value.trim()
                    };
                    
                    // Validate required fields
                    if (!formData.serviceType || !formData.bookingDate || !formData.name || !formData.phone) {
                        showNotification('Please fill in all required fields', 'error');
                        return;
                    }
                    
                    // Validate phone number
                    if (!/^\d{10}$/.test(formData.phone)) {
                        showNotification('Please enter a valid 10-digit phone number', 'error');
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
                    
                    // Show success message and reset form
                    showNotification('Booking submitted successfully! Check your email for confirmation.', 'success');
                    bookingForm.reset();
                    bookingDateInput.min = today;
                    
                } catch (error) {
                    console.error('Booking error:', error);
                    showNotification('An error occurred while processing your booking. Please try again.', 'error');
                }
            });
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
        
        // Initialize audio controls
        const toggleButton = document.getElementById('toggleAudio');
        const volumeSlider = document.getElementById('volumeSlider');
        
        if (toggleButton && volumeSlider) {
            toggleButton.addEventListener('click', toggleAudio);
            
            volumeSlider.addEventListener('input', function() {
                updateVolume(this.value);
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
    const subject = `New Booking Request - ${getServiceName(booking.serviceType)}`;
    const body = `
Booking Details:
Service: ${getServiceName(booking.serviceType)}
Date: ${formatDate(booking.bookingDate)}
Name: ${booking.name}
Phone: ${booking.phone}
Notes: ${booking.notes || 'No additional notes'}
Booking ID: ${booking.id}
    `;

    const mailtoLink = `mailto:kalikundidham@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
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