document.getElementById('searchButton').addEventListener('click', function() {
    var crypto = document.getElementById('search').value;

    fetch('https://api.coingecko.com/api/v3/coins/' + crypto)
        .then(response => response.json())
        .then(data => {
            document.getElementById('info').innerHTML = `
            <h2>${data.name}</h2>
            <p><strong>Symbol:</strong> ${data.symbol}</p>
            <p><strong>US Dollars:</strong> ${data.market_data.current_price.usd}</p>
            <p><strong>Kenya Shillings:</strong> ${(data.market_data.current_price.usd)*150}</p>
                
            `;
        })
        .catch(() => {
            document.getElementById('info').innerHTML = 'Crypto not found.';
        });
});