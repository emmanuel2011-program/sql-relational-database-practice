// Example: How your software "submits" and "receives" results
async function getStats() {
  const response = await fetch('http://localhost:3000/api/stats');
  const data = await response.json();
  
  // Using the results in the software
  document.getElementById('total-display').innerText = `Total: ${data.total}`;
}

async function deleteUser(userId) {
  await fetch(`http://localhost:3000/api/members/${userId}`, {
    method: 'DELETE'
  });
  alert('Member removed from database');
}
// Function to fetch and display the SQL JOIN results
async function loadDashboard() {
    try {
        // 1. Fetching data from the server (which builds the SQL)
        const response = await fetch('/api/investments');
        const data = await response.json();

        // 2. Receiving the results and using them in the software
        const tableBody = document.getElementById('investor-table-body');
        tableBody.innerHTML = ''; // Clear old data

        data.forEach(item => {
            const row = `
                <tr>
                    <td>${item.first_name} ${item.surname}</td>
                    <td>₦${Number(item.amount).toLocaleString()}</td>
                    <td><button class="btn-delete" onclick="removeMember('${item.id}')">Delete</button></td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });

    } catch (error) {
        console.error('Error loading database results:', error);
    }
}

// Function to demonstrate the DELETE requirement
async function removeMember(id) {
    if (confirm('Are you sure you want to delete this record?')) {
        await fetch(`/api/members/${id}`, { method: 'DELETE' });
        loadDashboard(); // Refresh the table
    }
}

// Run the function when the page loads
loadDashboard();

function showPage(pageName, element) {
    // 1. Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.style.display = 'none');

    // 2. Show the selected page
    document.getElementById(pageName + '-page').style.display = 'block';

    // 3. Update Sidebar Styling
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    element.classList.add('active');

    // 4. Trigger the correct SQL Query based on the page
    if (pageName === 'dashboard') {
        fetchStats();    // Runs the SUM/AVG SQL
    } else if (pageName === 'investors') {
        fetchInvestors(); // Runs the JOIN SQL
    }
}

// Example of the fetch function for the Dashboard
async function fetchStats() {
    const res = await fetch('/api/stats');
    const data = await res.json();
    document.getElementById('total-funds').innerText = `₦${Number(data.total).toLocaleString()}`;
    document.getElementById('avg-funds').innerText = `₦${Number(data.average).toLocaleString()}`;
}

// 1. Function to switch pages
// 1. NAVIGATION
// 1. NAVIGATION LOGIC
function showPage(pageId, element) {
    console.log("Navigating to:", pageId);
    // Hide all sections
    document.querySelectorAll('.page-section').forEach(sec => sec.style.display = 'none');
    
    // Show the specific page
    const targetPage = document.getElementById(pageId + '-page');
    if (targetPage) {
        targetPage.style.display = 'block';
    }

    // Update Sidebar Active Class
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (element) element.classList.add('active');

    // Load fresh data from SQL for the specific page
    if (pageId === 'dashboard') loadDashboardStats();
    if (pageId === 'investors') loadInvestorsTable();
    if (pageId === 'loans') loadLoansTable();
}

// 2. DASHBOARD DATA (SQL AGGREGATES)
async function loadDashboardStats() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        document.getElementById('total-funds').innerText = `₦${Number(data.total).toLocaleString()}`;
        document.getElementById('avg-funds').innerText = `₦${Number(data.average).toLocaleString()}`;
    } catch (err) {
        console.error("Dashboard error:", err);
    }
}

// 3. INVESTOR LOGIC (SQL JOIN & INSERT)
async function registerInvestor(event) {
    event.preventDefault();
    const payload = {
        first_name: document.getElementById('fname').value,
        surname: document.getElementById('sname').value,
        email: document.getElementById('email').value,
        amount: document.getElementById('amount').value
    };

    const res = await fetch('/api/investors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) { 
        alert("Investor Added!"); 
        document.getElementById('investor-form').reset(); 
        loadInvestorsTable(); 
    }
}

async function loadInvestorsTable() {
    const res = await fetch('/api/member-portfolio');
    const data = await res.json();
    const tableBody = document.getElementById('investor-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = data.map(item => `
        <tr>
            <td>${item.first_name} ${item.surname}</td>
            <td>₦${Number(item.amount).toLocaleString()}</td>
            <td><span class="status-${item.status}">${item.status}</span></td>
            <td>
                ${item.status !== 'approved' ? `<button onclick="approveInvestment(${item.id})">Approve</button>` : '✅'}
                <button class="btn-delete" onclick="removeMember(${item.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// 4. LOAN LOGIC (THE UNRESPONSIVE BUTTON FIX)
async function issueLoan(event) {
    event.preventDefault(); // This stops the page from refreshing!
    console.log("Issue Loan Form Submitted");

    const payload = {
        borrower_name: document.getElementById('borrower').value,
        principal: document.getElementById('principal').value,
        interest_rate: document.getElementById('rate').value
    };

    try {
        const res = await fetch('/api/loans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) { 
            alert("✅ Loan Issued Successfully!"); 
            document.getElementById('loan-form').reset(); 
            loadLoansTable(); // Refresh the table below
        } else {
            alert("❌ Server Error: Could not save loan.");
        }
    } catch (error) {
        console.error("Loan post error:", error);
    }
}

async function loadLoansTable() {
    try {
        const res = await fetch('/api/loans');
        const data = await res.json();
        const tableBody = document.getElementById('loan-table-body');
        if (!tableBody) return;

        tableBody.innerHTML = data.map(l => `
            <tr>
                <td>${l.borrower_name}</td>
                <td>₦${Number(l.principal).toLocaleString()}</td>
                <td>${l.interest_rate}%</td>
                <td><button class="btn-delete" onclick="deleteLoan(${l.id})">Settled</button></td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Load loans error:", err);
    }
}

// 5. UPDATE & DELETE ACTIONS
async function approveInvestment(id) { 
    await fetch(`/api/investments/approve/${id}`, { method: 'PUT' }); 
    loadInvestorsTable(); 
    loadDashboardStats(); 
}

async function removeMember(id) { 
    if(confirm("Permanently delete this record from Sforte database?")) { 
        await fetch(`/api/investments/${id}`, { method: 'DELETE' }); 
        loadInvestorsTable(); 
        loadDashboardStats(); 
    }
}

async function deleteLoan(id) { 
    if(confirm("Confirm loan settlement?")) { 
        await fetch(`/api/loans/${id}`, { method: 'DELETE' }); 
        loadLoansTable(); 
    }
}

// Initialization
window.onload = () => {
    console.log("Sforte Admin Initialized");
    loadDashboardStats();
};