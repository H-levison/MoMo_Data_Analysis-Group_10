document.addEventListener('DOMContentLoaded', function() {
  // Transaction types and months for filtering and charts
  const transactionTypes = [
    'Incoming Money',
    'Bank Deposits',
    'Bank Transfers',
    'Airtime Bill Payments',
    'Internet and Voice Bundle Purchases',
    'Cash Power Bill Payments',
    'Payments to Code Holders',
    'Transactions Initiated by Third Parties',
    'Withdrawals from Agents',
    'Other'
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Color mapping for each transaction type
  const chartColors = {
    'Incoming Money': '#4CAF50',
    'Bank Deposits': '#9C27B0',
    'Bank Transfers': '#2196F3',
    'Airtime Bill Payments': '#F44336',
    'Internet and Voice Bundle Purchases': '#FF9800',
    'Cash Power Bill Payments': '#795548',
    'Payments to Code Holders': '#607D8B',
    'Transactions Initiated by Third Parties': '#00BCD4',
    'Withdrawals from Agents': '#FFEB3B',
    'Other': '#9E9E9E'
  };

  // API endpoint for fetching transaction data
  const API_URL = 'http://127.0.0.1:5000/transactions';

  // Fetch data from the API and initialize the dashboard
  function fetchAndInitDashboard(params = {}) {
    // Build the query string for API filtering
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_URL}?${query}` : API_URL;
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Failed to load data from API');
        return response.json();
      })
      .then(data => {
        if (!Array.isArray(data)) {
          console.error('API did not return an array:', data);
          return;
        }
        // Transform API data to the format expected by the dashboard
        const transformedData = data.map(txn => {
          try {
            let id = txn.id || Math.random().toString(36).substr(2, 9);
            let to = txn.recipient || 'N/A';
            let date = new Date();
            let formattedDate = '';
            let displayDate = '';
            try {
              date = new Date(txn.datetime);
              formattedDate = date.toISOString().split('T')[0];
              displayDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            } catch (e) {
              console.warn('Date parsing error:', e);
              formattedDate = txn.datetime || '';
              displayDate = txn.datetime || '';
            }
            return {
              id,
              type: txn.category || 'Other',
              amount: parseInt(txn.amount) || 0,
              fee: parseInt(txn.fee) || 0,
              date: formattedDate,
              displayDate,
              from: txn.sender || 'N/A',
              to,
              status: 'Completed',
              raw_text: txn.raw_text || '',
              code: txn.code || null,
              account_or_phone: txn.account_or_phone || null
            };
          } catch (e) {
            console.error('Error transforming transaction:', e, txn);
            return null;
          }
        }).filter(txn => txn !== null); // Remove any failed transformations

        if (transformedData.length === 0) {
          console.error('No valid transactions after transformation');
          return;
        }

        // Pass the processed data to the dashboard
        initDashboard(transformedData);
      })
      .catch(error => {
        console.error('API error:', error);
        alert('Error loading transaction data from API.');
      });
  }

  // Initial dashboard load
  fetchAndInitDashboard();

  // Main dashboard initialization
  function initDashboard(transactions) {
    updateMetrics(transactions);
    renderCharts(transactions);
    renderTransactionTable(transactions);
    setupFilters(transactions);
    setupShowMoreButton(transactions);
    setupExportButton(transactions);
    setupChartPeriodButtons(transactions);
    setupViewButtons();
  }

  // Update the summary metrics at the top of the dashboard
  function updateMetrics(transactions) {
    document.getElementById('total-transactions').textContent = transactions.length.toLocaleString();
    const totalVolume = transactions.reduce((sum, txn) => sum + txn.amount, 0);
    document.getElementById('total-volume').textContent = `${(totalVolume / 1000000).toFixed(1)}M RWF`;
    // Find the most common transaction type
    const typeCounts = {};
    transactionTypes.forEach(type => {
      typeCounts[type] = transactions.filter(txn => txn.type === type).length;
    });
    const topCategory = Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b);
    const percentage = Math.round((typeCounts[topCategory] / transactions.length) * 100);
    const topCategoryElement = document.querySelector('.top-category span:first-child');
    const progressBar = document.querySelector('.progress');
    const percentageSpan = document.querySelector('.top-category span:last-child');
    topCategoryElement.textContent = topCategory;
    progressBar.style.width = `${percentage}%`;
    percentageSpan.textContent = `${percentage}% of total`;
  }

  // Render all dashboard charts
  function renderCharts(transactions) {
    renderTypeChart(transactions);
    renderMonthlyChart(transactions);
  }

  // Pie chart for transaction type distribution
  function renderTypeChart(transactions) {
    const typeCounts = {};
    transactionTypes.forEach(type => {
      typeCounts[type] = transactions.filter(txn => txn.type === type).length;
    });
    const ctx = document.getElementById('type-chart').getContext('2d');
    if (window.typeChart) {
      window.typeChart.destroy();
    }
    window.typeChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(typeCounts),
        datasets: [{
          data: Object.values(typeCounts),
          backgroundColor: Object.keys(typeCounts).map(type => chartColors[type]),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 15,
              padding: 15
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  // Bar chart for monthly transaction volume
  function renderMonthlyChart(transactions) {
    const monthlyData = {};
    months.forEach(month => {
      monthlyData[month] = 0;
    });
    transactions.forEach(txn => {
      const monthIndex = new Date(txn.date).getMonth();
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyData[months[monthIndex]] += txn.amount;
      }
    });
    const ctx = document.getElementById('monthly-chart').getContext('2d');
    if (window.monthlyChart) {
      window.monthlyChart.destroy();
    }
    window.monthlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Transaction Volume (RWF)',
          data: Object.values(monthlyData),
          backgroundColor: '#FFCC00'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value >= 1000000 
                  ? `${(value / 1000000).toFixed(1)}M` 
                  : `${(value / 1000).toFixed(0)}K`;
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw.toLocaleString()} RWF`;
              }
            }
          }
        }
      }
    });
  }

  // Render the transaction table, optionally limiting the number of rows
  function renderTransactionTable(transactions, limit = 5) {
    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = '';
    const displayTransactions = limit ? transactions.slice(0, limit) : transactions;
    if (displayTransactions.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="7" class="no-results">No transactions found</td>';
      tbody.appendChild(row);
      return;
    }
    displayTransactions.forEach(txn => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${txn.displayDate}</td>
        <td><span class="txn-type" style="background-color: ${chartColors[txn.type]}">${txn.type}</span></td>
        <td>${txn.amount.toLocaleString()} RWF</td>
        <td>${txn.from}</td>
        <td>${txn.to}</td>
        <td>${txn.status}</td>
        <td>
          <button class="view-btn" data-transaction='${JSON.stringify(txn)}'>
            <i class="fas fa-eye"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Add click handlers for view buttons
    document.querySelectorAll('.view-btn').forEach(button => {
      button.addEventListener('click', function() {
        const transaction = JSON.parse(this.dataset.transaction);
        showTransactionDetails(transaction);
      });
    });
  }

  // Add event listeners for all filter controls
  function setupFilters(transactions) {
    const searchInput = document.getElementById('search-input');
    const typeFilter = document.getElementById('type-filter');
    const dateFilter = document.getElementById('date-filter');
    const minAmount = document.getElementById('min-amount');
    const maxAmount = document.getElementById('max-amount');

    function filterTransactions() {
      // Use API filtering for type, date, min/max amount
      const params = {};
      if (typeFilter.value) params.type = typeFilter.value;
      if (dateFilter.value) params.date = dateFilter.value;
      if (minAmount.value) params.min_amount = minAmount.value;
      if (maxAmount.value) params.max_amount = maxAmount.value;
      // For search, still filter client-side (API can be extended for this)
      fetchAndInitDashboard(params);
    }
    searchInput.addEventListener('input', function() {
      // For now, just filter client-side after API fetch
      // (You can extend API for search if needed)
      filterTransactions();
    });
    typeFilter.addEventListener('change', filterTransactions);
    dateFilter.addEventListener('change', filterTransactions);
    if (minAmount) minAmount.addEventListener('input', filterTransactions);
    if (maxAmount) maxAmount.addEventListener('input', filterTransactions);
  }

  // Add "Show More" button logic for the transaction table
  function setupShowMoreButton(transactions) {
    const showMoreBtn = document.getElementById('show-more-btn');
    let currentLimit = 5;
    showMoreBtn.disabled = false;
    showMoreBtn.textContent = 'Show More';
    showMoreBtn.onclick = function() {
      currentLimit += 5;
      renderTransactionTable(transactions, currentLimit);
      if (currentLimit >= transactions.length) {
        showMoreBtn.disabled = true;
        showMoreBtn.textContent = 'All transactions loaded';
      }
    };
  }

  function setupViewButtons() {
    // Use event delegation for dynamically created buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('view-btn')) {
            const transactionId = e.target.getAttribute('data-id');
            const row = e.target.closest('tr');
            
            // Get all transaction details from the row
            const transactionDetails = {
                id: transactionId,
                date: row.cells[0].textContent,
                type: row.cells[1].textContent,
                amount: row.cells[2].textContent,
                from: row.cells[3].textContent,
                to: row.cells[4].textContent,
                status: row.cells[5].textContent
            };
            
            // Show the transaction details
            showTransactionDetails(transactionDetails);
        }
        
        // Close button handler
        if (e.target.classList.contains('close-btn')) {
            hideTransactionDetails();
        }
    });
  }

  function showTransactionDetails(details) {
    const panel = document.getElementById('transaction-details-panel');
    const body = panel.querySelector('.transaction-body');
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.style.display = 'block';
    overlay.addEventListener('click', hideTransactionDetails);
    document.body.appendChild(overlay);
    
    // Update the transaction details
    body.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Transaction ID:</span>
            <span class="detail-value">${details.id}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${details.date}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Type:</span>
            <span class="detail-value">${details.type}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Amount:</span>
            <span class="detail-value">${details.amount}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">From:</span>
            <span class="detail-value">${details.from}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">To:</span>
            <span class="detail-value">${details.to}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value status-badge ${details.status.toLowerCase()}">${details.status}</span>
        </div>
    `;
    
    // Show the panel
    panel.classList.add('visible');
  }

  function hideTransactionDetails() {
    const panel = document.getElementById('transaction-details-panel');
    panel.classList.remove('visible');
    const overlay = document.querySelector('.overlay');
    if (overlay) {
        overlay.remove();
    }
  }

  function setupChartPeriodButtons(transactions) {
    console.log('Setting up chart period buttons...');
    const dailyBtn = document.getElementById('daily-btn');
    const weeklyBtn = document.getElementById('weekly-btn');
    const monthlyBtn = document.getElementById('monthly-btn');
    
    // Add All Time button dynamically if not present
    let allTimeBtn = document.getElementById('alltime-btn');
    if (!allTimeBtn) {
      allTimeBtn = document.createElement('button');
      allTimeBtn.id = 'alltime-btn';
      allTimeBtn.textContent = 'All Time';
      allTimeBtn.className = 'period-btn';
      monthlyBtn.parentNode.insertBefore(allTimeBtn, dailyBtn); // Insert before daily
    }

    // Helper to show/hide no data message
    function showNoDataMessage(show) {
      let msg = document.getElementById('no-data-message');
      if (!msg) {
        msg = document.createElement('div');
        msg.id = 'no-data-message';
        msg.textContent = 'No transactions found for this period.';
        msg.style.textAlign = 'center';
        msg.style.color = '#888';
        msg.style.margin = '30px 0';
        // Fallback: append to dashboard-content if it exists, else to body
        const container = document.getElementById('dashboard-content') || document.body;
        container.appendChild(msg);
      }
      msg.style.display = show ? 'block' : 'none';
    }

    function getDateRange(period) {
      const now = new Date();
      const start = new Date();
      switch(period) {
        case 'daily':
          start.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          start.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          start.setMonth(now.getMonth() - 1);
          break;
        case 'alltime':
        default:
          return null; // No filtering
      }
      return {
        start: start.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0]
      };
    }

    function updateCharts(period) {
      let filteredTransactions = transactions;
      const range = getDateRange(period);
      if (range) {
        filteredTransactions = transactions.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= new Date(range.start) && txDate <= new Date(range.end);
        });
      }
      showNoDataMessage(filteredTransactions.length === 0);
      updateMetrics(filteredTransactions);
      renderCharts(filteredTransactions);
      renderTransactionTable(filteredTransactions);
    }

    dailyBtn.addEventListener('click', () => {
      dailyBtn.classList.add('active');
      weeklyBtn.classList.remove('active');
      monthlyBtn.classList.remove('active');
      allTimeBtn.classList.remove('active');
      updateCharts('daily');
    });

    weeklyBtn.addEventListener('click', () => {
      dailyBtn.classList.remove('active');
      weeklyBtn.classList.add('active');
      monthlyBtn.classList.remove('active');
      allTimeBtn.classList.remove('active');
      updateCharts('weekly');
    });

    monthlyBtn.addEventListener('click', () => {
      dailyBtn.classList.remove('active');
      weeklyBtn.classList.remove('active');
      monthlyBtn.classList.add('active');
      allTimeBtn.classList.remove('active');
      updateCharts('monthly');
    });

    allTimeBtn.addEventListener('click', () => {
      dailyBtn.classList.remove('active');
      weeklyBtn.classList.remove('active');
      monthlyBtn.classList.remove('active');
      allTimeBtn.classList.add('active');
      updateCharts('alltime');
    });

    // Set All Time as default
    allTimeBtn.classList.add('active');
    updateCharts('alltime');
  }

  function setupExportButton(transactions) {
    const exportBtn = document.getElementById('export-btn');
    
    exportBtn.addEventListener('click', function() {
        // Create CSV content
        let csvContent = "Date,Type,Amount (RWF),From,To,Status\n";
        
        transactions.forEach(txn => {
            csvContent += `"${txn.displayDate}","${txn.type}","${txn.amount}","${txn.from}","${txn.to}","${txn.status}"\n`;
        });
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `MTN_MoMo_Transactions_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
  }

  // Add amount filter inputs to the filter section dynamically
  const filtersDiv = document.querySelector('.filters');
  if (filtersDiv && !document.getElementById('min-amount')) {
    const minInput = document.createElement('input');
    minInput.type = 'number';
    minInput.id = 'min-amount';
    minInput.placeholder = 'Min Amount';
    minInput.style.width = '110px';
    minInput.min = 0;
    filtersDiv.appendChild(minInput);

    const maxInput = document.createElement('input');
    maxInput.type = 'number';
    maxInput.id = 'max-amount';
    maxInput.placeholder = 'Max Amount';
    maxInput.style.width = '110px';
    maxInput.min = 0;
    filtersDiv.appendChild(maxInput);
  }
});
