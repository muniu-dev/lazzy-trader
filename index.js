document.getElementById('searchButton').addEventListener('click', function() {
    var crypto = document.getElementById('search').value;

    fetch('https://api.coingecko.com/api/v3/coins/' + crypto)
        .then(response => response.json())
        .then(data => {
            var usdPrice = data.market_data.current_price.usd;
            var kshPrice = usdPrice * 150;
            var formattedUsdPrice = usdPrice.toLocaleString('en-US');
            var formattedKshPrice = kshPrice.toLocaleString('en-US');
            document.getElementById('info').innerHTML = `
            <h2>${data.name}</h2>
            <p><strong>Symbol:</strong> ${data.symbol}</p>
            <p><strong>US Dollars:</strong> $ ${formattedUsdPrice}</p>
            <p><strong>Kenya Shillings:</strong> KES ${formattedKshPrice}</p>
            `;
        })
        .catch(() => {
            document.getElementById('info').innerHTML = 'Crypto not found.';
        });
});