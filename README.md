# LAzZY TRXDR

A real-time cryptocurrency trading comparison platform that helps users track and compare cryptocurrency prices, with automatic conversion to Kenyan Shillings (KES).

## 📋 Table of Contents

- [Author Information](#author-information)
- [Problem Statement](#problem-statement)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [API Dependencies](#api-dependencies)
- [Performance Features](#performance-features)
- [Future Features](#future-features)

## 👤 Author Information {#author-information}

**Project Name:** LAzZY TRXDR  
**Author:** Michael Muniu

## 🎯 Problem Statement {#problem-statement}

The cryptocurrency market is highly volatile and dynamic, with exchange rates fluctuating significantly within short periods. Traders and investors need access to the latest and most accurate exchange rates from reliable sources to make informed decisions.

However, finding and comparing exchange rates across different cryptocurrencies can be challenging and time-consuming. Many platforms offer varying rates and fees, making it difficult for users to:

- Quickly compare multiple cryptocurrencies side-by-side
- Access real-time price updates
- Convert prices to local currencies (like Kenyan Shillings)
- Track favorite cryptocurrencies efficiently
- Make informed trading decisions based on current market data

LAzZY TRXDR addresses these challenges by providing a streamlined, user-friendly interface for real-time cryptocurrency price tracking and comparison.

## ✨ Features {#features}

### Core Features

- **Real-Time Price Tracking**: Automatically fetches and displays current cryptocurrency prices
- **Multi-Currency Display**: Shows prices in both USD and KES (Kenyan Shillings)
- **Search Functionality**: Search for cryptocurrencies by name or symbol
- **24-Hour Price Change**: Displays percentage change over the last 24 hours with color-coded indicators
- **Mini Price Charts**: Visual representation of price trends using interactive charts
- **Favorites Management**: Add cryptocurrencies to a favorites list for quick access
- **Auto-Refresh**: Automatically updates prices every 60 seconds
- **Compare Feature**: Placeholder for future cryptocurrency comparison functionality

### Supported Cryptocurrencies

The app currently tracks the following popular cryptocurrencies:
- Bitcoin (BTC)
- Ethereum (ETH)
- Solana (SOL)
- Cardano (ADA)
- Ripple (XRP)

## 🛠 Technologies Used {#technologies-used}

- **HTML5**: Structure and markup
- **CSS3**: Styling and responsive design
- **JavaScript (ES6+)**: Application logic and API integration
- **Chart.js**: Interactive price charts visualization
- **External APIs**:
  - CoinGecko API: Cryptocurrency price data
  - ExchangeRate-API: USD to KES conversion rates

## 🚀 Installation & Setup {#installation--setup}

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A stable internet connection

### Setup Instructions

1. **Clone or download the repository**
   ```bash
   git clone <repository-url>
   cd lazzy-trader
   ```

2. **Open the application**
   - Simply open `index.html` in your web browser
   - Or use a local development server:
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js (if you have http-server installed)
     npx http-server
     ```

3. **Access the application**
   - Navigate to `http://localhost:8000` (or the port your server uses)
   - The application will automatically load and start fetching cryptocurrency data

### No Build Process Required

This is a pure client-side application with no build process, dependencies to install, or configuration needed. Just open the HTML file in a browser!

## 📖 Usage {#usage}

### Viewing Cryptocurrency Prices

1. Upon loading, the app automatically displays current prices for popular cryptocurrencies
2. Each row shows:
   - Currency name and icon
   - Price in USD and KES
   - 24-hour percentage change (green for positive, red for negative)
   - Mini price chart
   - Action buttons (Add and Compare)

### Searching for Cryptocurrencies

1. Type a cryptocurrency name or symbol in the search field (e.g., "bitcoin", "BTC", "ethereum")
2. Click the "Search" button
3. The list will filter to show only matching cryptocurrencies
4. To reset, refresh the page or clear the search

### Managing Favorites

1. Click the "Add" button next to any cryptocurrency
2. The cryptocurrency will be added to the Favorites section at the bottom
3. To remove from favorites, click the "Remove" button in the favorites list

### Auto-Refresh

- Prices automatically refresh every 60 seconds
- The page updates seamlessly without requiring manual refresh
- Loading indicators show during data updates

## 🔌 API Dependencies {#api-dependencies}

### CoinGecko API
- **Endpoint**: `https://api.coingecko.com/api/v3/simple/price`
- **Purpose**: Fetches real-time cryptocurrency prices and 24-hour change data
- **Rate Limits**: Free tier available (no API key required for basic usage)

### ExchangeRate-API
- **Endpoint**: `https://api.exchangerate-api.com/v4/latest/USD`
- **Purpose**: Provides USD to KES (Kenyan Shillings) conversion rates
- **Caching**: Exchange rates are cached for 5 minutes to reduce API calls

## ⚡ Performance Features {#performance-features}

The application includes several performance optimizations:

### Parallel API Calls
- All cryptocurrency data is fetched in parallel instead of sequentially
- Reduces load time from ~5-10 seconds to ~1-2 seconds

### Request Timeout Handling
- 10-second timeout on all API requests
- Prevents indefinite hanging on slow or unresponsive APIs

### Retry Logic with Exponential Backoff
- Automatic retry mechanism (up to 3 attempts) for failed requests
- Exponential backoff between retries
- Only retries on network/server errors, not client errors

### Intelligent Caching
- KES exchange rate cached for 5 minutes
- Reduces unnecessary API calls
- Falls back to cached value if API fails

### Memory Management
- Chart.js instances are properly destroyed and recreated
- Prevents memory leaks during refresh cycles
- Efficient cleanup of DOM elements

### Error Handling
- Graceful error handling for failed API calls
- Shows error states instead of hiding failed cryptocurrencies
- All cryptocurrencies appear even if some API calls fail

## 🔮 Future Features {#future-features}

- **Compare Functionality**: Side-by-side comparison of multiple cryptocurrencies
- **Historical Data**: View price history over different time periods
- **Price Alerts**: Set notifications for price thresholds
- **More Cryptocurrencies**: Expand the list of supported cryptocurrencies
- **Portfolio Tracking**: Track your cryptocurrency holdings
- **Dark Mode**: Toggle between light and dark themes
- **Export Data**: Export price data to CSV or PDF
- **Mobile App**: Native mobile application version

## 📝 License

See [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Suppoort

For questions or support, please contact Michael Muniu at mikemuniu.ke@gmail.com

---

**Note**: This application is for informational purposes only. Cryptocurrency trading involves risk, and users should conduct their own research before making trading decisions.
