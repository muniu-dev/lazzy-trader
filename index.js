// Function to fetch data and update the results
function updateResults(crypto) {
    fetch('https://api.coingecko.com/api/v3/coins/' + crypto)
        .then(response => response.json())
        .then(data => {
            let usdPrice = data.market_data.current_price.usd;
            let kshPrice = usdPrice * 150;
            let formattedUsdPrice = usdPrice.toLocaleString('en-US');
            let formattedKshPrice = kshPrice.toLocaleString('en-US');
            document.getElementById('info').innerHTML = `
                <h2>${data.name}</h2>
                <p><strong>Symbol:</strong> ${data.symbol}</p>
                <p><strong>US Dollars:</strong> $ ${formattedUsdPrice}</p>
                <p><strong>Kenya Shillings:</strong> KES ${formattedKshPrice} <button id="buyButton">Buy via Mpesa</button></p>
            `;
            // Add event listener to buyButton
            document.getElementById('buyButton').addEventListener('click', function() {
                // Display browser alert
                alert("Are you sure you want to make this purchase ?");
            });
        })
        .catch(() => {
            document.getElementById('info').innerHTML = 'Oops! Something went wrong...please try again.';
        });
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

// Add event listeners
document.getElementById('searchButton').addEventListener('click', handleSearch);
window.addEventListener('load', handleLoad);

