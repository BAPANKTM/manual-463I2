// crypto-script.js

// Constants for supported cryptocurrencies and their settings
const CRYPTO_DATA = {
    "usdt_trc20": {
        symbol: "USDT",
        network: "TRC20",
        decimals: 2
    },
    "usdt_erc20": {
        symbol: "USDT",
        network: "ERC20",
        decimals: 2
    },
    "usdt_polygon": {
        symbol: "USDT",
        network: "Polygon",
        decimals: 2
    },
    "usdt_bep20": {
        symbol: "USDT",
        network: "BEP20",
        decimals: 2
    },
    "btc": {
        symbol: "BTC",
        network: "Bitcoin",
        decimals: 5
    },
    "trx": {
        symbol: "TRX",
        network: "Tron",
        decimals: 2
    },
    "eth": {
        symbol: "ETH",
        network: "Ethereum",
        decimals: 4
    },
    "ltc": {
        symbol: "LTC",
        network: "Litecoin",
        decimals: 4
    }
};

// Get URL parameters from the current window location
const urlParams = new URLSearchParams(window.location.search);

// Identify the selected crypto type from the URL (e.g., btc, usdt_trc20, etc.)
let selectedCrypto = Object.keys(CRYPTO_DATA).find(key => urlParams.has(key));
const amount = urlParams.get(selectedCrypto) || 0;

// Read the currency parameter (default to 'inr' if not provided)
const currency = urlParams.get('currency') ? urlParams.get('currency').toLowerCase() : 'inr';

// Initialize the page
async function init() {
    if (!selectedCrypto || !amount) {
        showError("Invalid payment parameters");
        return;
    }

    const cryptoInfo = CRYPTO_DATA[selectedCrypto];

    // Determine the fiat symbol based on the currency value
    const fiatSymbol = currency === 'usd' ? '$' : '₹';

    // Update the displayed fiat amount (ensure your HTML has an element with id "fiatAmount")
    document.getElementById('fiatAmount').textContent = `${fiatSymbol}${amount}`;

    // Update other UI elements with crypto information
    document.getElementById('cryptoSymbol').textContent = cryptoInfo.symbol;
    document.getElementById('networkNote').textContent = cryptoInfo.network;
    document.getElementById('instructionSymbol').textContent = cryptoInfo.symbol;
    document.getElementById('networkName').textContent = `Network: ${cryptoInfo.network}`;

    await loadCryptoData();
}

// Fetch crypto data, calculate the crypto amount based on fiat conversion, and update the UI
async function loadCryptoData() {
    try {
        const response = await fetch('crypto.json');
        const data = await response.json();
        // Convert selectedCrypto key to the format used in crypto.json (e.g., uppercase with hyphen)
        const cryptoKey = selectedCrypto.toUpperCase().replace('_', '-');
        const cryptoData = data[cryptoKey];

        if (!cryptoData) {
            throw new Error('Invalid crypto selection');
        }

        let cryptoAmount;

        // For USDT deposits in USD, no conversion is needed—just use the entered amount.
        if (currency === 'usd' && selectedCrypto.startsWith('usdt')) {
            cryptoAmount = parseFloat(amount).toFixed(CRYPTO_DATA[selectedCrypto].decimals);
        } else {
            // Fetch the price using the appropriate vs_currency (inr or usd)
            const priceResponse = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoData.name.toLowerCase()}&vs_currencies=${currency}`
            );
            const priceData = await priceResponse.json();

            // Extract the conversion rate
            const cryptoPrice = priceData[cryptoData.name.toLowerCase()][currency];
            
            // Calculate the amount of crypto (use fixed decimals based on CRYPTO_DATA settings)
            cryptoAmount = (parseFloat(amount) / cryptoPrice).toFixed(CRYPTO_DATA[selectedCrypto].decimals);
        }
        
        // Update the UI with the calculated crypto amount and wallet address
        document.getElementById('cryptoAmount').textContent = cryptoAmount;
        document.getElementById('instructionAmount').textContent = cryptoAmount;
        document.getElementById('walletAddress').textContent = cryptoData.address;

        generateQR(cryptoData.address);
    } catch (error) {
        showError("Error loading crypto data");
        console.error(error);
    }
}

// Generate a QR code for the wallet address using the qrcode-generator library
function generateQR(address) {
    const qr = qrcode(0, 'M');
    qr.addData(address);
    qr.make();
    document.getElementById('qrCode').innerHTML = qr.createImgTag(6);
}

// Copy the wallet address to the clipboard and provide user feedback
function copyAddress() {
    const address = document.getElementById('walletAddress').textContent;
    const copyBtn = document.querySelector('.copy-btn');
    
    navigator.clipboard.writeText(address).then(() => {
        copyBtn.style.backgroundColor = '#34a853';
        copyBtn.textContent = 'Copied!';
        
        setTimeout(() => {
            copyBtn.style.backgroundColor = '';
            copyBtn.textContent = 'Copy';
        }, 1500);
    }).catch(err => {
        showError("Failed to copy address");
    });
}

// Screenshot handling: preview uploaded image for payment screenshot
document.getElementById('screenshotInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('screenshotPreview');
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Payment Screenshot">
                <button class="remove-screenshot" onclick="removeScreenshot()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
});

// Remove the screenshot preview
function removeScreenshot() {
    document.getElementById('screenshotInput').value = '';
    document.getElementById('screenshotPreview').innerHTML = '';
    document.getElementById('screenshotPreview').style.display = 'none';
}

// Submit the uploaded screenshot (simulate submission here)
async function submitScreenshot() {
    const screenshot = document.getElementById('screenshotInput').files[0];
    const submitBtn = document.querySelector('.submit-btn');
    
    if (!screenshot) {
        showError("Please upload payment screenshot");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';

    try {
        // Simulate a delay (replace with your actual submission code)
        await new Promise(resolve => setTimeout(resolve, 2000));
        showSuccess("Payment screenshot submitted successfully");
    } catch (error) {
        showError("Error submitting payment");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Payment';
    }
}

// Display an error message to the user
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    const submitBtn = document.querySelector('.submit-btn');
    const existingError = document.querySelector('.error-message');
    if (existingError) existingError.remove();
    
    submitBtn.parentNode.insertBefore(errorDiv, submitBtn.nextSibling);
}

// Display a success message to the user
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    const submitBtn = document.querySelector('.submit-btn');
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) existingSuccess.remove();
    
    submitBtn.parentNode.insertBefore(successDiv, submitBtn.nextSibling);
}

// Initialize the crypto payment page
init();
