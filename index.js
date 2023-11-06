document.getElementById('searchButton').addEventListener('click', function() {
    var crypto = document.getElementById('search').value;

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
        })
        .catch(() => {
            document.getElementById('info').innerHTML = 'Try again in a minute...';
            
        });
});