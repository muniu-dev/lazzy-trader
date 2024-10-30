let chart;
let currentCrypto = null;
let favorites = new Set();

const popularCryptos = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'solana', name: 'Solana', symbol: 'SOL' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
    { id: 'ripple', name: 'Ripple', symbol: 'XRP' }
];

// Function to fetch KES exchange rate
async function getKESRate() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        return data.rates.KES;
    } catch (error) {
        console.error('Error fetching KES rate:', error);
        return 135; // Fallback rate if API fails
    }
}

async function createMiniChart(containerId, prices) {
    const ctx = document.getElementById(containerId).getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 40);
    gradient.addColorStop(0, 'rgba(33, 150, 243, 0.1)');
    gradient.addColorStop(1, 'rgba(33, 150, 243, 0)');

    return new Chart(ctx, {
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
}

async function updateCryptoList() {
    const container = document.getElementById('cryptoRows');
    container.innerHTML = '';
    const kesRate = await getKESRate();

    for (const crypto of popularCryptos) {
        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${crypto.id}&vs_currencies=usd&include_24hr_change=true`);
            const data = await response.json();
            const price = data[crypto.id].usd;
            const kesPrice = price * kesRate;
            const change = data[crypto.id].usd_24h_change;

            const row = document.createElement('div');
            row.className = 'crypto-row';
            
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
                <button class="send-button" onclick="addToFavorites('${crypto.id}', '${crypto.name}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                    <span class="button-text">Add</span>
                </button>
            `;

            container.appendChild(row);
            createMiniChart(chartId, mockPrices);
        } catch (error) {
            console.error(`Error fetching ${crypto.name}:`, error);
        }
    }
}

function addToFavorites(id, name) {
    if (favorites.has(id)) {
        alert('This cryptocurrency is already in your favorites!');
        return;
    }

    favorites.add(id);
    updateFavoritesList();
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