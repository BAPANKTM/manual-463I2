// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const amount = urlParams.get('amount') || 1500; // Default amount if not specified

// Update amount display
document.getElementById('payableAmount').textContent = amount;

// Add this at the top with other constants
let successUTRs = [];

// Fetch success UTRs
async function fetchSuccessUTRs() {
    try {
        const response = await fetch('succes.json');
        const data = await response.json();
        successUTRs = Object.values(data);
    } catch (error) {
        console.error('Error loading success UTRs:', error);
    }
}

// Fetch UPI ID from upi.txt
async function fetchUpiId() {
    try {
        const response = await fetch('upi.txt');
        const upiId = await response.text();
        document.getElementById('upiId').textContent = upiId.trim();
        generateQR(upiId.trim(), amount);
    } catch (error) {
        console.error('Error fetching UPI ID:', error);
        document.getElementById('upiId').textContent = 'Error loading UPI ID';
    }
}

// Generate QR code
function generateQR(upiId, amount) {
    const upiUrl = `upi://pay?pa=${upiId}&pn=ALPHX&am=${amount}&cu=INR`;
    
    const qr = qrcode(0, 'M');
    qr.addData(upiUrl);
    qr.make();
    
    document.getElementById('qrCode').innerHTML = qr.createImgTag(6);
}

// Copy UPI ID
function copyUpiId() {
    const upiId = document.getElementById('upiId').textContent;
    navigator.clipboard.writeText(upiId).then(() => {
        showSuccess('UPI ID copied successfully');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Submit UTR
async function submitUTR() {
    const utrNumber = document.getElementById('utrNumber').value.trim();
    const submitBtn = document.querySelector('.submit-btn');
    
    if (!utrNumber) {
        showInfo('Please enter your UTR/Reference number');
        return;
    }
    
    if (!/^\d+$/.test(utrNumber)) {
        showInfo('UTR number should contain only numbers');
        return;
    }

    if (utrNumber.length !== 12) {
        showInfo('Please enter a valid 12-digit UTR number');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Verifying Payment...';

    try {
        await simulateServerCheck(utrNumber);
        
        if (successUTRs.includes(utrNumber)) {
            showSuccessAnimation();
        } else {
            showInfo(`
                <div class="verification-status">
                    <i class="fas fa-info-circle"></i>
                    <div class="status-details">
                        <p>Payment verification in progress</p>
                        <ul>
                            <li>If you have just made the payment, please wait 2-3 minutes and try again</li>
                            <li>Make sure you have entered the correct UTR number</li>
                            <li>Ensure you have paid the exact amount: ₹${amount}</li>
                        </ul>
                        <p class="support-note">Need assistance? Contact our support team</p>
                    </div>
                </div>
            `);
        }
    } catch (error) {
        showInfo('Our servers are a bit busy. Please try again in a moment.');
    } finally {
        if (!successUTRs.includes(utrNumber)) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Verify Payment';
        }
    }
}

function simulateServerCheck(utrNumber) {
    return new Promise((resolve) => {
        const randomDelay = Math.floor(Math.random() * (3000 - 1500 + 1) + 1500);
        setTimeout(() => {
            resolve();
        }, randomDelay);
    });
}

function showInfo(message) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'info-message';
    infoDiv.innerHTML = message;
    
    const existingInfo = document.querySelector('.info-message');
    if (existingInfo) {
        existingInfo.remove();
    }
    
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.parentNode.insertBefore(infoDiv, submitBtn.nextSibling);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.parentNode.insertBefore(successDiv, submitBtn.nextSibling);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

function showSuccessAnimation() {
    const depositCard = document.querySelector('.deposit-card');
    depositCard.innerHTML = `
        <div class="success-animation">
            <div class="celebration">
                ${Array(50).fill().map((_, i) => `
                    <div class="confetti" style="
                        left: ${Math.random() * 100}%;
                        animation-delay: ${Math.random() * 3}s;
                        background: ${['#1a73e8', '#fbbc04', '#ea4335', '#34a853'][i % 4]};
                    "></div>
                `).join('')}
            </div>
            <div class="success-content">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2>Payment Successful!</h2>
                <div class="success-amount-wrapper">
                    <span class="amount-label">Amount Paid</span>
                    <p class="success-amount">₹${amount}</p>
                </div>
                <div class="success-message-details">
                    <p class="congrats-text">Congratulations! 🎉</p>
                    <p>Your benefits have been activated</p>
                </div>
                <div class="success-footer">
                    <p>Thank you for your payment!</p>
                    <small>Transaction ID: ${Date.now()}</small>
                </div>
            </div>
        </div>
    `;
}

// Initialize
fetchUpiId();
fetchSuccessUTRs(); 