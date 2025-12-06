// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const CONFIG = {
    // API Endpoints
    API: {
        COINGECKO: 'https://api.coingecko.com/api/v3/simple/price',
        EXCHANGE_RATE: 'https://api.exchangerate-api.com/v4/latest/USD',
        ICON_BASE: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color',
        PLACEHOLDER_ICON: 'https://via.placeholder.com/32'
    },
    
    // Timing Configuration
    TIMEOUT: {
        REQUEST: 10000,        // 10 seconds
        CHART_DELAY: 10        // 10ms delay for chart creation
    },
    
    // Retry Configuration
    RETRY: {
        MAX_ATTEMPTS: 3,
        BASE_DELAY: 1000       // 1 second base delay for exponential backoff
    },
    
    // Cache Configuration
    CACHE: {
        KES_RATE_DURATION: 5 * 60 * 1000,  // 5 minutes
        FALLBACK_KES_RATE: 131
    },
    
    // Refresh Configuration
    REFRESH: {
        INTERVAL: 60000        // 60 seconds
    },
    
    // Chart Configuration
    CHART: {
        COLOR: '#2196F3',
        GRADIENT_START: 'rgba(33, 150, 243, 0.1)',
        GRADIENT_END: 'rgba(33, 150, 243, 0)',
        HEIGHT: 40,
        POINT_COUNT: 24
    },
    
    // UI Colors
    COLORS: {
        TEXT_SECONDARY: '#697386',
        BACKGROUND_LIGHT: '#f8f9fa'
    }
};

// Initial cryptocurrency list
const popularCryptos = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'solana', name: 'Solana', symbol: 'SOL' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
    { id: 'ripple', name: 'Ripple', symbol: 'XRP' }
];

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const state = {
    favorites: new Set(),
    chartInstances: new Map(),
    kesRateCache: {
        rate: null,
        timestamp: null
    }
};

// ============================================================================
// API UTILITIES
// ============================================================================

/**
 * Fetch with timeout wrapper
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeout = CONFIG.TIMEOUT.REQUEST) {
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

/**
 * Retry fetch with exponential backoff
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
async function retryFetch(url, options = {}, maxRetries = CONFIG.RETRY.MAX_ATTEMPTS, timeout = CONFIG.TIMEOUT.REQUEST) {
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
                const delay = Math.pow(2, attempt) * CONFIG.RETRY.BASE_DELAY;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        } catch (error) {
            if (attempt === maxRetries - 1) {
                throw error;
            }
            const delay = Math.pow(2, attempt) * CONFIG.RETRY.BASE_DELAY;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Fetch KES exchange rate with caching
 * @returns {Promise<number>}
 */
async function getKESRate() {
    const now = Date.now();
    
    // Return cached rate if still valid
    if (state.kesRateCache.rate && state.kesRateCache.timestamp && 
        (now - state.kesRateCache.timestamp) < CONFIG.CACHE.KES_RATE_DURATION) {
        return state.kesRateCache.rate;
    }
    
    try {
        const response = await retryFetch(CONFIG.API.EXCHANGE_RATE);
        const data = await response.json();
        const rate = data.rates.KES;
        
        // Update cache
        state.kesRateCache.rate = rate;
        state.kesRateCache.timestamp = now;
        
        return rate;
    } catch (error) {
        console.error('Error fetching KES rate:', error);
        // Return cached rate if available, otherwise fallback
        return state.kesRateCache.rate || CONFIG.CACHE.FALLBACK_KES_RATE;
    }
}

/**
 * Fetch cryptocurrency price data
 * @param {Object} crypto - Cryptocurrency object
 * @returns {Promise<Object>}
 */
async function fetchCryptoData(crypto) {
    try {
        const url = `${CONFIG.API.COINGECKO}?ids=${crypto.id}&vs_currencies=usd&include_24hr_change=true`;
        const response = await retryFetch(url);
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
}

// ============================================================================
// TEMPLATE FUNCTIONS
// ============================================================================

/**
 * Generate cryptocurrency icon HTML
 * @param {Object} crypto - Cryptocurrency object
 * @returns {string}
 */
function createCryptoIconHTML(crypto) {
    const iconUrl = `${CONFIG.API.ICON_BASE}/${crypto.symbol.toLowerCase()}.png`;
    return `
        <img src="${iconUrl}" 
             alt="${crypto.name}" 
             class="currency-icon"
             onerror="this.src='${CONFIG.API.PLACEHOLDER_ICON}'">
    `;
}

/**
 * Generate currency info HTML
 * @param {Object} crypto - Cryptocurrency object
 * @returns {string}
 */
function createCurrencyInfoHTML(crypto) {
    return `
        <div class="currency-info">
            ${createCryptoIconHTML(crypto)}
            <span class="currency-name">${crypto.name}</span>
        </div>
    `;
}

/**
 * Generate price display HTML
 * @param {number|null} price - USD price (null for error state)
 * @param {number|null} kesPrice - KES price (null for error state)
 * @param {boolean} isError - Whether to show error state
 * @returns {string}
 */
function createPriceHTML(price, kesPrice, isError = false) {
    if (isError) {
        return `
            <div class="price-container">
                <div class="usd-price" style="color: ${CONFIG.COLORS.TEXT_SECONDARY};">Error loading</div>
                <div class="kes-price" style="color: ${CONFIG.COLORS.TEXT_SECONDARY};">Please try again</div>
            </div>
        `;
    }
    
    return `
        <div class="price-container">
            <div class="usd-price">$${price.toLocaleString()}</div>
            <div class="kes-price">KES ${kesPrice.toLocaleString()}</div>
        </div>
    `;
}

/**
 * Generate change percentage HTML
 * @param {number|null} change - 24h change percentage (null for error state)
 * @returns {string}
 */
function createChangeHTML(change) {
    if (change === null) {
        return '<div class="change negative">N/A</div>';
    }
    
    const isPositive = change >= 0;
    const sign = isPositive ? '+' : '';
    const className = isPositive ? 'positive' : 'negative';
    
    return `
        <div class="change ${className}">
            ${sign}${change.toFixed(2)}%
        </div>
    `;
}

/**
 * Generate action buttons HTML with data attributes
 * @param {Object} crypto - Cryptocurrency object
 * @param {boolean} disabled - Whether buttons should be disabled
 * @returns {string}
 */
function createActionButtonsHTML(crypto, disabled = false) {
    const disabledAttr = disabled ? 'disabled style="opacity: 0.5;"' : '';
    const addButtonData = `data-action="add-favorite" data-crypto-id="${crypto.id}" data-crypto-name="${crypto.name}"`;
    const compareButtonData = `data-action="compare" data-crypto-id="${crypto.id}" data-crypto-name="${crypto.name}"`;
    
    return `
        <div class="action-buttons">
            <button class="send-button" ${addButtonData} ${disabledAttr}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"/>
                </svg>
                <span class="button-text">Add</span>
            </button>
            <button class="send-button compare-button" ${compareButtonData} ${disabledAttr}>
                <span class="button-text">Compare</span>
            </button>
        </div>
    `;
}

/**
 * Generate chart container HTML
 * @param {string} chartId - Chart container ID
 * @param {boolean} isError - Whether to show error state
 * @param {boolean} isLoading - Whether to show loading state
 * @returns {string}
 */
function createChartContainerHTML(chartId, isError = false, isLoading = false) {
    if (isError) {
        return `
            <div class="chart-container">
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: ${CONFIG.COLORS.TEXT_SECONDARY}; font-size: 0.8rem;">
                    Error
                </div>
            </div>
        `;
    }
    
    if (isLoading) {
        return `
            <div class="chart-container">
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: ${CONFIG.COLORS.TEXT_SECONDARY};">
                    <div style="width: 20px; height: 20px; border: 2px solid ${CONFIG.CHART.COLOR}; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="chart-container">
            <canvas id="${chartId}"></canvas>
        </div>
    `;
}

// ============================================================================
// CHART MANAGEMENT
// ============================================================================

/**
 * Create a mini chart for cryptocurrency price visualization
 * @param {string} containerId - Canvas element ID
 * @param {Array<number>} prices - Array of price values
 * @returns {Chart|null}
 */
async function createMiniChart(containerId, prices) {
    // Destroy existing chart if it exists
    if (state.chartInstances.has(containerId)) {
        state.chartInstances.get(containerId).destroy();
        state.chartInstances.delete(containerId);
    }
    
    const canvas = document.getElementById(containerId);
    if (!canvas) {
        console.error(`Canvas element not found: ${containerId}`);
        return null;
    }
    
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CHART.HEIGHT);
    gradient.addColorStop(0, CONFIG.CHART.GRADIENT_START);
    gradient.addColorStop(1, CONFIG.CHART.GRADIENT_END);

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(prices.length).fill(''),
            datasets: [{
                data: prices,
                borderColor: CONFIG.CHART.COLOR,
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
    state.chartInstances.set(containerId, chart);
    return chart;
}

/**
 * Clean up all chart instances
 */
function cleanupCharts() {
    state.chartInstances.forEach((chart) => {
        chart.destroy();
    });
    state.chartInstances.clear();
}

/**
 * Generate mock price data for chart visualization
 * @param {number} basePrice - Base price to generate variations from
 * @returns {Array<number>}
 */
function generateMockPrices(basePrice) {
    return Array(CONFIG.CHART.POINT_COUNT).fill(0).map(() => {
        return basePrice * (1 + (Math.random() - 0.5) * 0.1);
    });
}

// ============================================================================
// UI RENDERING
// ============================================================================

/**
 * Create a cryptocurrency row element
 * @param {Object} crypto - Cryptocurrency object
 * @param {Object|null} data - Price data (null for error state)
 * @param {number} kesRate - KES exchange rate
 * @param {string|null} error - Error message (null if no error)
 * @returns {HTMLElement}
 */
function createCryptoRow(crypto, data, kesRate, error = null) {
    const row = document.createElement('div');
    row.className = 'crypto-row';
    
    const isError = error !== null;
    const price = data?.usd || null;
    const kesPrice = price ? price * kesRate : null;
    const change = data?.usd_24h_change ?? null;
    
    const chartId = `chart-${crypto.id}`;
    
    row.innerHTML = `
        ${createCurrencyInfoHTML(crypto)}
        ${createPriceHTML(price, kesPrice, isError)}
        ${createChangeHTML(change)}
        ${createChartContainerHTML(chartId, isError, false)}
        ${createActionButtonsHTML(crypto, false)}
    `;
    
    // Create chart after a brief delay to ensure DOM is ready (only if not error)
    if (!isError && price) {
        const mockPrices = generateMockPrices(price);
        setTimeout(() => {
            createMiniChart(chartId, mockPrices);
        }, CONFIG.TIMEOUT.CHART_DELAY);
    }
    
    return row;
}

/**
 * Show loading state for all cryptocurrencies
 */
function showLoadingState() {
    const container = document.getElementById('cryptoRows');
    container.innerHTML = '';
    
    popularCryptos.forEach(crypto => {
        const row = document.createElement('div');
        row.className = 'crypto-row';
        row.innerHTML = `
            ${createCurrencyInfoHTML(crypto)}
            <div class="price-container">
                <div class="usd-price" style="color: ${CONFIG.COLORS.TEXT_SECONDARY};">Loading...</div>
                <div class="kes-price" style="color: ${CONFIG.COLORS.TEXT_SECONDARY};">Please wait</div>
            </div>
            <div class="change" style="background-color: ${CONFIG.COLORS.BACKGROUND_LIGHT}; color: ${CONFIG.COLORS.TEXT_SECONDARY};">
                ...
            </div>
            ${createChartContainerHTML('', false, true)}
            ${createActionButtonsHTML(crypto, true)}
        `;
        container.appendChild(row);
    });
}

/**
 * Update the cryptocurrency list with fresh data
 */
async function updateCryptoList() {
    const container = document.getElementById('cryptoRows');
    
    // Show loading state
    showLoadingState();
    
    // Clean up existing chart instances
    cleanupCharts();
    
    // Fetch KES rate (uses cache if available)
    const kesRate = await getKESRate();
    
    // Fetch all cryptos in parallel
    const fetchPromises = popularCryptos.map(crypto => fetchCryptoData(crypto));
    const results = await Promise.all(fetchPromises);
    
    // Clear container and rebuild with results
    container.innerHTML = '';
    
    results.forEach((result) => {
        const row = result.success
            ? createCryptoRow(result.crypto, result.data, kesRate)
            : createCryptoRow(result.crypto, null, kesRate, result.error);
        
        container.appendChild(row);
    });
}

// ============================================================================
// FAVORITES MANAGEMENT
// ============================================================================

/**
 * Add cryptocurrency to favorites
 * @param {string} id - Cryptocurrency ID
 * @param {string} name - Cryptocurrency name
 */
function addToFavorites(id, name) {
    if (state.favorites.has(id)) {
        alert('This cryptocurrency is already in your favorites!');
        return;
    }

    state.favorites.add(id);
    updateFavoritesList();
}

/**
 * Remove cryptocurrency from favorites
 * @param {string} id - Cryptocurrency ID
 */
function removeFromFavorites(id) {
    state.favorites.delete(id);
    updateFavoritesList();
}

/**
 * Update the favorites list display
 */
function updateFavoritesList() {
    const favoritesList = document.getElementById('favoritesList');
    favoritesList.innerHTML = '';

    state.favorites.forEach(id => {
        const crypto = popularCryptos.find(c => c.id === id);
        if (crypto) {
            const item = document.createElement('div');
            item.className = 'favorite-item';
            item.innerHTML = `
                <div class="currency-info">
                    ${createCryptoIconHTML(crypto)}
                    <span>${crypto.name}</span>
                </div>
                <button class="send-button" data-action="remove-favorite" data-crypto-id="${id}">
                    <span class="button-text">Remove</span>
                </button>
            `;
            favoritesList.appendChild(item);
        }
    });
}

/**
 * Compare cryptocurrency (placeholder)
 * @param {string} id - Cryptocurrency ID
 * @param {string} name - Cryptocurrency name
 */
function compareCrypto(id, name) {
    // Placeholder function - does nothing for now
    // TODO: Implement compare functionality
    console.log(`Compare functionality not yet implemented for ${name} (${id})`);
}

// ============================================================================
// SEARCH FUNCTIONALITY
// ============================================================================

/**
 * Handle search functionality
 */
function handleSearch() {
    const searchTerm = document.getElementById('search').value.toLowerCase().trim();
    
    if (!searchTerm) {
        // Reset to original list if search is empty
        popularCryptos.length = 0;
        popularCryptos.push(
            { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
            { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
            { id: 'solana', name: 'Solana', symbol: 'SOL' },
            { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
            { id: 'ripple', name: 'Ripple', symbol: 'XRP' }
        );
        updateCryptoList();
        return;
    }
    
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
}

// ============================================================================
// EVENT HANDLERS & INITIALIZATION
// ============================================================================

/**
 * Handle click events using event delegation
 * @param {Event} event - Click event
 */
function handleClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    
    const action = target.getAttribute('data-action');
    const cryptoId = target.getAttribute('data-crypto-id');
    const cryptoName = target.getAttribute('data-crypto-name');
    
    switch (action) {
        case 'add-favorite':
            addToFavorites(cryptoId, cryptoName);
            break;
        case 'remove-favorite':
            removeFromFavorites(cryptoId);
            break;
        case 'compare':
            compareCrypto(cryptoId, cryptoName);
            break;
        default:
            console.warn(`Unknown action: ${action}`);
    }
}

/**
 * Initialize the application
 */
function init() {
    // Set up event listeners
    document.getElementById('searchButton').addEventListener('click', handleSearch);
    
    // Use event delegation for dynamic buttons
    document.addEventListener('click', handleClick);
    
    // Initial data load
    updateCryptoList();
    
    // Set up auto-refresh
    setInterval(updateCryptoList, CONFIG.REFRESH.INTERVAL);
}

// Initialize app when DOM is ready
window.addEventListener('load', init);
