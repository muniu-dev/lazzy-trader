let chart;
let currentCrypto = null;
let favorites = new Set();
let chartInstances = new Map(); // Store Chart.js instances for cleanup

const popularCryptos = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'solana', name: 'Solana', symbol: 'SOL' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
    { id: 'ripple', name: 'Ripple', symbol: 'XRP' }
];

// KES rate caching
let kesRateCache = {
    rate: null,
    timestamp: null,
    cacheDuration: 5 * 60 * 1000 // 5 minutes in milliseconds
};

// Utility: Fetch with timeout
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}

// Utility: Retry fetch with exponential backoff
async function retryFetch(url, options = {}, maxRetries = 3, timeout = 10000) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetchWithTimeout(url, options, timeout);
            if (response.ok) {
                return response;
            }
            // Don't retry on client errors (4xx)
            if (response.status >= 400 && response.status < 500) {
                throw new Error(`Client error: ${response.status}`);
            }
            // Retry on server errors (5xx) or network errors
            if (attempt < maxRetries - 1) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        } catch (error) {
            if (attempt === maxRetries - 1) {
                throw error;
            }
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Function to fetch KES exchange rate with caching
async function getKESRate() {
    const now = Date.now();
    
    // Return cached rate if still valid
    if (kesRateCache.rate && kesRateCache.timestamp && 
        (now - kesRateCache.timestamp) < kesRateCache.cacheDuration) {
        return kesRateCache.rate;
    }
    
    try {
        const response = await retryFetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        const rate = data.rates.KES;
        
        // Update cache
        kesRateCache.rate = rate;
        kesRateCache.timestamp = now;
        
        return rate;
    } catch (error) {
        console.error('Error fetching KES rate:', error);
        // Return cached rate if available, otherwise fallback
        return kesRateCache.rate || 131;
    }
}

async function createMiniChart(containerId, prices) {
    // Destroy existing chart if it exists
    if (chartInstances.has(containerId)) {
        chartInstances.get(containerId).destroy();
        chartInstances.delete(containerId);
    }
    
    const canvas = document.getElementById(containerId);
    if (!canvas) {
        console.error(`Canvas element not found: ${containerId}`);
        return null;
    }
    
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 40);
    gradient.addColorStop(0, 'rgba(33, 150, 243, 0.1)');
    gradient.addColorStop(1, 'rgba(33, 150, 243, 0)');

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(prices.length).fill(''),
            datasets: [{
                data: prices,
                borderColor: '#2196F3',
                borderWidth: 2,
                fill: true,
                backgroundColor: gradient,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: false
                }
            }
        }
    });
    
    // Store chart instance
    chartInstances.set(containerId, chart);
    return chart;
}

function createCryptoRow(crypto, data, kesRate, error = null) {
    const row = document.createElement('div');
    row.className = 'crypto-row';
    
    if (error) {
        // Show error state
        row.innerHTML = `
            <div class="currency-info">
                <img src="https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${crypto.symbol.toLowerCase()}.png" 
                     alt="${crypto.name}" 
                     class="currency-icon"
                     onerror="this.src='https://via.placeholder.com/32'">
                <span class="currency-name">${crypto.name}</span>
            </div>
            <div class="price-container">
                <div class="usd-price" style="color: #697386;">Error loading</div>
                <div class="kes-price" style="color: #697386;">Please try again</div>
            </div>
            <div class="change negative">
                N/A
            </div>
            <div class="chart-container">
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #697386; font-size: 0.8rem;">
                    Error
                </div>
            </div>
            <div class="action-buttons">
                <button class="send-button" onclick="addToFavorites('${crypto.id}', '${crypto.name}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                    <span class="button-text">Add</span>
                </button>
                <button class="send-button compare-button" onclick="compareCrypto('${crypto.id}', '${crypto.name}')">
                    <span class="button-text">Compare</span>
                </button>
            </div>
        `;
        return row;
    }
    
    const price = data.usd;
    const kesPrice = price * kesRate;
    const change = data.usd_24h_change;
    
    // Generate random price data for the mini chart
    const mockPrices = Array(24).fill(0).map((_, i) => {
        return price * (1 + (Math.random() - 0.5) * 0.1);
    });

    const chartId = `chart-${crypto.id}`;
    
    row.innerHTML = `
        <div class="currency-info">
            <img src="https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${crypto.symbol.toLowerCase()}.png" 
                 alt="${crypto.name}" 
                 class="currency-icon"
                 onerror="this.src='https://via.placeholder.com/32'">
            <span class="currency-name">${crypto.name}</span>
        </div>
        <div class="price-container">
            <div class="usd-price">$${price.toLocaleString()}</div>
            <div class="kes-price">KES ${kesPrice.toLocaleString()}</div>
        </div>
        <div class="change ${change >= 0 ? 'positive' : 'negative'}">
            ${change >= 0 ? '+' : ''}${change.toFixed(2)}%
        </div>
        <div class="chart-container">
            <canvas id="${chartId}"></canvas>
        </div>
        <div class="action-buttons">
            <button class="send-button" onclick="addToFavorites('${crypto.id}', '${crypto.name}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"/>
                </svg>
                <span class="button-text">Add</span>
            </button>
            <button class="send-button compare-button" onclick="compareCrypto('${crypto.id}', '${crypto.name}')">
                <span class="button-text">Compare</span>
            </button>
        </div>
    `;
    
    // Create chart after a brief delay to ensure DOM is ready
    setTimeout(() => {
        createMiniChart(chartId, mockPrices);
    }, 10);
    
    return row;
}

function showLoadingState() {
    const container = document.getElementById('cryptoRows');
    container.innerHTML = '';
    
    popularCryptos.forEach(crypto => {
        const row = document.createElement('div');
        row.className = 'crypto-row';
        row.innerHTML = `
            <div class="currency-info">
                <img src="https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${crypto.symbol.toLowerCase()}.png" 
                     alt="${crypto.name}" 
                     class="currency-icon"
                     onerror="this.src='https://via.placeholder.com/32'">
                <span class="currency-name">${crypto.name}</span>
            </div>
            <div class="price-container">
                <div class="usd-price" style="color: #697386;">Loading...</div>
                <div class="kes-price" style="color: #697386;">Please wait</div>
            </div>
            <div class="change" style="background-color: #f8f9fa; color: #697386;">
                ...
            </div>
            <div class="chart-container">
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #697386;">
                    <div style="width: 20px; height: 20px; border: 2px solid #2196F3; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                </div>
            </div>
            <div class="action-buttons">
                <button class="send-button" disabled style="opacity: 0.5;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                    <span class="button-text">Add</span>
                </button>
                <button class="send-button compare-button" disabled style="opacity: 0.5;">
                    <span class="button-text">Compare</span>
                </button>
            </div>
        `;
        container.appendChild(row);
    });
}

async function updateCryptoList() {
    const container = document.getElementById('cryptoRows');
    
    // Show loading state
    showLoadingState();
    
    // Destroy all existing chart instances
    chartInstances.forEach((chart, id) => {
        chart.destroy();
    });
    chartInstances.clear();
    
    // Fetch KES rate (uses cache if available)
    const kesRate = await getKESRate();
    
    // Fetch all cryptos in parallel - each promise handles its own errors
    const fetchPromises = popularCryptos.map(async (crypto) => {
        try {
            const response = await retryFetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${crypto.id}&vs_currencies=usd&include_24hr_change=true`
            );
            const data = await response.json();
            
            if (data[crypto.id]) {
                return {
                    success: true,
                    crypto: crypto,
                    data: data[crypto.id]
                };
            } else {
                throw new Error('Invalid response data');
            }
        } catch (error) {
            console.error(`Error fetching ${crypto.name}:`, error);
            return {
                success: false,
                crypto: crypto,
                error: error.message || 'Failed to fetch data'
            };
        }
    });
    
    // Wait for all promises to complete (they all resolve, never reject)
    const results = await Promise.all(fetchPromises);
    
    // Clear container and rebuild with results
    container.innerHTML = '';
    
    results.forEach((result) => {
        let row;
        
        if (result.success) {
            // Success case
            row = createCryptoRow(result.crypto, result.data, kesRate);
        } else {
            // Error case
            row = createCryptoRow(result.crypto, null, kesRate, result.error);
        }
        
        container.appendChild(row);
    });
}

function addToFavorites(id, name) {
    if (favorites.has(id)) {
        alert('This cryptocurrency is already in your favorites!');
        return;
    }

    favorites.add(id);
    updateFavoritesList();
}

function compareCrypto(id, name) {
    // Placeholder function - does nothing for now
    // TODO: Implement compare functionality
}

function updateFavoritesList() {
    const favoritesList = document.getElementById('favoritesList');
    favoritesList.innerHTML = '';

    favorites.forEach(id => {
        const crypto = popularCryptos.find(c => c.id === id);
        if (crypto) {
            const item = document.createElement('div');
            item.className = 'favorite-item';
            item.innerHTML = `
                <div class="currency-info">
                    <img src="https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${crypto.symbol.toLowerCase()}.png" 
                         alt="${crypto.name}" 
                         class="currency-icon"
                         onerror="this.src='https://via.placeholder.com/32'">
                    <span>${crypto.name}</span>
                </div>
                <button class="send-button" onclick="removeFromFavorites('${id}')">
                    <span class="button-text">Remove</span>
                </button>
            `;
            favoritesList.appendChild(item);
        }
    });
}

function removeFromFavorites(id) {
    favorites.delete(id);
    updateFavoritesList();
}

document.getElementById('searchButton').addEventListener('click', function() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const filteredCryptos = popularCryptos.filter(crypto => 
        crypto.name.toLowerCase().includes(searchTerm) || 
        crypto.symbol.toLowerCase().includes(searchTerm)
    );
    
    if (filteredCryptos.length > 0) {
        popularCryptos.length = 0;
        popularCryptos.push(...filteredCryptos);
        updateCryptoList();
    } else {
        alert('No cryptocurrencies found matching your search.');
    }
});

// Initialize app
window.addEventListener('load', function() {
    updateCryptoList();
    // Refresh data every 60 seconds
    setInterval(updateCryptoList, 60000);
});