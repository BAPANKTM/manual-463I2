// Constants
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
    }
};

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
let selectedCrypto = Object.keys(CRYPTO_DATA).find(key => urlParams.has(key));
const amount = urlParams.get(selectedCrypto) || 0;

// Initialize
async function init() {
    if (!selectedCrypto || !amount) {
        showError("Invalid payment parameters");
        return;
    }

    const cryptoInfo = CRYPTO_DATA[selectedCrypto];
    document.getElementById('inrAmount').textContent = amount;
    document.getElementById('cryptoSymbol').textContent = cryptoInfo.symbol;
    document.getElementById('networkNote').textContent = cryptoInfo.network;
    document.getElementById('instructionSymbol').textContent = cryptoInfo.symbol;
    document.getElementById('networkName').textContent = `Network: ${cryptoInfo.network}`;

    await loadCryptoData();
}

async function loadCryptoData() {
    try {
        const response = await fetch('crypto.json');
        const data = await response.json();
        const cryptoKey = selectedCrypto.toUpperCase().replace('_', '-');
        const cryptoData = data[cryptoKey];

        if (!cryptoData) {
            throw new Error('Invalid crypto selection');
        }

        const priceResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoData.name.toLowerCase()}&vs_currencies=inr`);
        const priceData = await priceResponse.json();
        const cryptoPrice = priceData[cryptoData.name.toLowerCase()].inr;

        const cryptoAmount = (parseFloat(amount) / cryptoPrice).toFixed(CRYPTO_DATA[selectedCrypto].decimals);
        
        document.getElementById('cryptoAmount').textContent = cryptoAmount;
        document.getElementById('instructionAmount').textContent = cryptoAmount;
        document.getElementById('walletAddress').textContent = cryptoData.address;

        generateQR(cryptoData.address);
    } catch (error) {
        showError("Error loading crypto data");
        console.error(error);
    }
}

function generateQR(address) {
    const qr = qrcode(0, 'M');
    qr.addData(address);
    qr.make();
    document.getElementById('qrCode').innerHTML = qr.createImgTag(6);
}

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

// Screenshot handling
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

function removeScreenshot() {
    document.getElementById('screenshotInput').value = '';
    document.getElementById('screenshotPreview').innerHTML = '';
    document.getElementById('screenshotPreview').style.display = 'none';
}

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
        await new Promise(resolve => setTimeout(resolve, 2000));
        showSuccess("Payment screenshot submitted successfully");
    } catch (error) {
        showError("Error submitting payment");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Payment';
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    const submitBtn = document.querySelector('.submit-btn');
    const existingError = document.querySelector('.error-message');
    if (existingError) existingError.remove();
    
    submitBtn.parentNode.insertBefore(errorDiv, submitBtn.nextSibling);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    const submitBtn = document.querySelector('.submit-btn');
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) existingSuccess.remove();
    
    submitBtn.parentNode.insertBefore(successDiv, submitBtn.nextSibling);
}

// Initialize the page
init(); 