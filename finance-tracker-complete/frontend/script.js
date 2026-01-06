const API_URL = "http://localhost:8080/api/transactions";
let transactions = [];

// Chart Instances
let mainChart = null;
let doughnutChart = null;
let barChart = null;
let lineChart = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    fetchTransactions();
    setupInputs();
    setupNavigation();
});

// --- NAVIGATION LOGIC ---
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-item[data-target]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 1. Sidebar Active State
            document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // 2. Switch Views
            const targetId = link.getAttribute('data-target');
            document.querySelectorAll('.view-section').forEach(section => {
                section.classList.add('hidden');
            });
            document.getElementById(`view-${targetId}`).classList.remove('hidden');

            // 3. Update Title
            const titles = { 'dashboard': 'Dashboard', 'wallet': 'Wallet', 'analytics': 'Analytics' };
            document.getElementById('pageTitle').innerText = titles[targetId];

            // 4. Trigger Specific Renders
            if (targetId === 'analytics') renderAnalyticsCharts();
            if (targetId === 'wallet') renderWalletTable(transactions);
        });
    });
}

// --- API ACTIONS ---
async function fetchTransactions() {
    try {
        const res = await fetch(API_URL);
        transactions = await res.json();
        transactions.reverse(); // Sort: Newest first
        
        updateDashboard(transactions);
        renderWalletTable(transactions); // Pre-load wallet data
    } catch (err) {
        showToast("Error connecting to server", "error");
    }
}

async function createTransaction(tx) {
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(tx)
        });
        if(res.ok) {
            closeModal();
            fetchTransactions();
            showToast("Transaction saved successfully");
        }
    } catch(err) {
        showToast("Failed to save", "error");
    }
}

async function deleteTransaction(id) {
    if(!confirm("Are you sure you want to delete this transaction?")) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if(res.ok) {
            showToast("Transaction deleted");
            fetchTransactions();
        } else {
            showToast("Failed to delete", "error");
        }
    } catch(err) {
        showToast("Error connecting to server", "error");
    }
}

// --- RENDER: DASHBOARD ---
function updateDashboard(data) {
    const income = data.filter(t => t.type === "INCOME").reduce((acc, t) => acc + t.amount, 0);
    const expense = data.filter(t => t.type === "EXPENSE").reduce((acc, t) => acc + t.amount, 0);
    
    document.getElementById("totalAmount").innerText = formatCurrency(income - expense);
    document.getElementById("incomeAmount").innerText = formatCurrency(income);
    document.getElementById("expenseAmount").innerText = formatCurrency(expense);

    const tbody = document.getElementById("recentList");
    tbody.innerHTML = "";
    
    // Show top 5 recent
    data.slice(0, 5).forEach(tx => {
        const isInc = tx.type === "INCOME";
        tbody.innerHTML += `
            <tr>
                <td>
                    <div>${tx.description}</div>
                    <div style="font-size:0.75rem;color:#a1a1aa">${tx.category || '-'}</div>
                </td>
                <td style="color:#a1a1aa">${new Date(tx.date).toLocaleDateString()}</td>
                <td class="text-right ${isInc?'text-success':''}">${isInc?'+':'-'}${formatCurrency(tx.amount)}</td>
                <td class="text-right">
                    <button class="delete-btn-sm" onclick="deleteTransaction(${tx.id})">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </td>
            </tr>`;
    });

    renderMainChart(data);
}

// --- RENDER: WALLET ---
function renderWalletTable(data) {
    const tbody = document.getElementById("walletList");
    tbody.innerHTML = "";
    data.forEach(tx => {
        const isInc = tx.type === "INCOME";
        tbody.innerHTML += `
            <tr>
                <td><span style="font-size:0.75rem;padding:2px 6px;border-radius:4px;background:${isInc?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)'};color:${isInc?'#22c55e':'#ef4444'}">${tx.type}</span></td>
                <td>${tx.description}</td>
                <td>${tx.category || 'Uncategorized'}</td>
                <td>${new Date(tx.date).toLocaleDateString()}</td>
                <td class="text-right ${isInc?'text-success':''}">${formatCurrency(tx.amount)}</td>
                <td class="text-center">
                    <button class="delete-btn" onclick="deleteTransaction(${tx.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    });
}

function filterWallet() {
    const term = document.getElementById("searchInput").value.toLowerCase();
    const filtered = transactions.filter(t => 
        t.description.toLowerCase().includes(term) || 
        (t.category && t.category.toLowerCase().includes(term))
    );
    renderWalletTable(filtered);
}

// --- RENDER: ANALYTICS ---
function renderAnalyticsCharts() {
    // 1. Doughnut: Expense Categories
    const ctx1 = document.getElementById("doughnutChart").getContext("2d");
    if(doughnutChart) doughnutChart.destroy();

    const categories = {};
    transactions.filter(t => t.type === "EXPENSE").forEach(t => {
        const cat = t.category || "Others";
        categories[cat] = (categories[cat] || 0) + t.amount;
    });

    doughnutChart = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899'],
                borderWidth: 0
            }]
        },
        options: { plugins: { legend: { position: 'right', labels: { color: '#a1a1aa' } } } }
    });

    // 2. Bar: Income vs Expense
    const ctx2 = document.getElementById("barChart").getContext("2d");
    if(barChart) barChart.destroy();
    
    const inc = transactions.filter(t => t.type==="INCOME").reduce((a,b)=>a+b.amount,0);
    const exp = transactions.filter(t => t.type==="EXPENSE").reduce((a,b)=>a+b.amount,0);

    barChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: ['Total Income', 'Total Expense'],
            datasets: [{
                label: 'Amount',
                data: [inc, exp],
                backgroundColor: ['#22c55e', '#ef4444'],
                borderRadius: 4
            }]
        },
        options: {
            scales: {
                y: { grid: { color: '#27272a' }, ticks: { color: '#a1a1aa' } },
                x: { grid: { display: false }, ticks: { color: '#a1a1aa' } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // 3. Line: Trend Over Time
    const ctx3 = document.getElementById("lineChart").getContext("2d");
    if(lineChart) lineChart.destroy();

    const expenseMap = {};
    transactions.filter(t => t.type === "EXPENSE").forEach(t => {
        const dateKey = t.date.split('T')[0];
        expenseMap[dateKey] = (expenseMap[dateKey] || 0) + t.amount;
    });

    const sortedDates = Object.keys(expenseMap).sort();
    
    lineChart = new Chart(ctx3, {
        type: 'line',
        data: {
            labels: sortedDates.map(d => new Date(d).toLocaleDateString('en-US', {month:'short', day:'numeric'})),
            datasets: [{
                label: 'Daily Expenses',
                data: sortedDates.map(d => expenseMap[d]),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: '#27272a' }, ticks: { color: '#a1a1aa' } },
                x: { grid: { display: false }, ticks: { color: '#a1a1aa' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// --- RENDER: MAIN CHART (DASHBOARD) ---
function renderMainChart(data) {
    const ctx = document.getElementById("mainChart").getContext("2d");
    if(mainChart) mainChart.destroy();

    const sub = data.slice(0,10).reverse(); 
    
    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sub.map(d => new Date(d.date).toLocaleDateString('en-US',{day:'numeric',month:'short'})),
            datasets: [{
                data: sub.map(d => d.type==='INCOME'?d.amount:-d.amount),
                borderColor: '#fff',
                backgroundColor: 'rgba(255,255,255,0.05)',
                fill: true,
                tension: 0.4,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#52525b' } },
                y: { grid: { color: '#27272a' }, ticks: { color: '#52525b' } }
            }
        }
    });
}

// --- UTILS ---
function formatCurrency(n) { return new Intl.NumberFormat('en-IN', {style:'currency',currency:'INR'}).format(n); }
function showToast(msg, type="success") {
    const div = document.createElement("div"); div.className = "toast";
    div.innerHTML = `<i class="fa-solid fa-${type==='success'?'circle-check':'circle-exclamation'}"></i> ${msg}`;
    document.getElementById("toast-container").appendChild(div);
    setTimeout(() => div.remove(), 3000);
}
function exportCSV() { showToast("Exporting data..."); }

// --- MODAL HANDLING ---
const modal = document.getElementById("modal");
function openModal(){ modal.classList.add("open"); setupInputs(); }
function closeModal(){ modal.classList.remove("open"); }
function setupInputs(){ document.getElementById("dateInput").valueAsDate = new Date(); }

document.getElementById("expenseForm").addEventListener("submit", e => {
    e.preventDefault();
    createTransaction({
        description: document.getElementById("descInput").value,
        amount: parseFloat(document.getElementById("amountInput").value),
        type: document.getElementById("typeInput").value,
        category: document.getElementById("categoryInput").value,
        date: document.getElementById("dateInput").value
    });
});