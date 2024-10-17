let chart;

// Function to fetch data and update the results
function updateResults(crypto) {
    fetch(`https://api.coingecko.com/api/v3/coins/${crypto}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`)
        .then(response => response.json())
        .then(data => {
            let usdPrice = data.market_data.current_price.usd;
            let kshPrice = usdPrice * 130;
            let formattedUsdPrice = usdPrice.toLocaleString('en-US');
            let formattedKshPrice = kshPrice.toLocaleString('en-US');
            document.getElementById('info').innerHTML = `
                <h2>${data.name}</h2>
                <p><strong>Symbol:</strong> ${data.symbol}</p>
                <p><strong>US Dollars:</strong> $ ${formattedUsdPrice}</p>
                <p><strong>Kenya Shillings:</strong> KES ${formattedKshPrice} <button id="buyButton">Buy via Mpesa</button></p>
                <p><strong>24h Change:</strong> ${data.market_data.price_change_percentage_24h.toFixed(2)}%</p>
                <button id="addFavorite">Add to Favorites</button>
            `;
            // Add event listener to buyButton
            document.getElementById('buyButton').addEventListener('click', function() {
                alert("Are you sure you want to make this purchase?");
            });

            // Add event listener to addFavorite
            document.getElementById('addFavorite').addEventListener('click', function() {
                addFavorite(data.name, data.id);
            });

            updateChart(data.market_data.sparkline_7d.price);
            updateSentiment(data.market_data.price_change_percentage_24h);
        })
        .catch(() => {
            document.getElementById('info').innerHTML = 'Oops! Something went wrong...please try again.';
        });
}

function updateChart(priceData) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: priceData.length}, (_, i) => i + 1),
            datasets: [{
                label: '7 Day Price Trend',
                data: priceData,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

function updateSentiment(priceChange) {
    const sentimentIndicator = document.getElementById('sentiment-indicator');
    let sentiment, color;

    if (priceChange > 5) {
        sentiment = 'Very Bullish';
        color = '#4CAF50';
    } else if (priceChange > 0) {
        sentiment = 'Bullish';
        color = '#8BC34A';
    } else if (priceChange > -5) {
        sentiment = 'Bearish';
        color = '#FF9800';
    } else {
        sentiment = 'Very Bearish';
        color = '#F44336';
    }

    const width = Math.abs(priceChange) * 2; // Scale the width of the bar
    sentimentIndicator.innerHTML = `<div class="bar" style="width: ${width}%; background-color: ${color};"></div>`;
    sentimentIndicator.title = `${sentiment} (${priceChange.toFixed(2)}%)`;
}

// Function to handle search button click event
function handleSearch() {
    let crypto = document.getElementById('search').value;
    updateResults(crypto);
}

// Function to handle window when the page loads
function handleLoad() {
    let crypto = "bitcoin";
    document.getElementById('search').value = crypto;
    updateResults(crypto);
}

// Function to add favorite cryptocurrency
function addFavorite(name, id) {
    let favoritesList = document.getElementById('favoritesList');
    let listItem = document.createElement('li');
    listItem.innerHTML = `
        ${name}
        <button class="remove-favorite" data-id="${id}">Remove</button>
    `;
    favoritesList.appendChild(listItem);

    // Add event listener to remove button
    listItem.querySelector('.remove-favorite').addEventListener('click', function() {
        removeFavorite(this.parentNode);
    });
}

// Function to remove favorite cryptocurrency
function removeFavorite(listItem) {
    listItem.remove();
}

// Add event listeners
document.getElementById('searchButton').addEventListener('click', handleSearch);
window.addEventListener('load', handleLoad);

// Add event listener for favorites list
document.getElementById('favoritesList').addEventListener('click', function(e) {
    if (e.target.tagName === 'LI') {
        document.getElementById('search').value = e.target.textContent.trim();
        handleSearch();
    }
});