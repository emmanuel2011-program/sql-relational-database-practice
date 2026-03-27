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
function showPage(pageId, element) {
    // Hide all sections
    document.querySelectorAll('.page-section').forEach(sec => sec.style.display = 'none');
    // Show selected section
    document.getElementById(pageId + '-page').style.display = 'block';

    // Update Sidebar CSS
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    element.classList.add('active');

    // Trigger specific SQL data load
    if (pageId === 'dashboard') loadDashboardStats();
    if (pageId === 'investors') loadInvestorsTable();
    if (pageId === 'loans') loadLoansTable();
}

// 2. Load Dashboard (Requirement: AGGREGATE)
async function loadDashboardStats() {
    const res = await fetch('/api/stats');
    const data = await res.json();
    document.getElementById('total-funds').innerText = `₦${Number(data.total).toLocaleString()}`;
    document.getElementById('avg-funds').innerText = `₦${Number(data.average).toLocaleString()}`;
}

// 3. Load Investors (Requirement: JOIN)
async function loadInvestorsTable() {
    const res = await fetch('/api/member-portfolio');
    const data = await res.json();
    const body = document.getElementById('investor-table-body');
    
    body.innerHTML = data.map(item => `
        <tr>
            <td>${item.first_name} ${item.surname}</td>
            <td>₦${Number(item.amount).toLocaleString()}</td>
            <td>
                <span class="badge ${item.status === 'approved' ? 'bg-success' : 'bg-warning'}">
                    ${item.status}
                </span>
            </td>
            <td>
                ${item.status !== 'approved' ? 
                    `<button class="btn-approve" onclick="approveInvestment('${item.id}')">Approve</button>` : 
                    `✅`
                }
                <button class="btn-delete" onclick="removeMember('${item.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Function to trigger the UPDATE SQL
async function approveInvestment(id) {
    const response = await fetch(`/api/investments/approve/${id}`, { method: 'PUT' });
    if (response.ok) {
        alert("Status Updated in Database!");
        loadInvestorsTable(); // Refresh the table to show the change
        loadDashboardStats(); // Refresh the total liquidity on the dashboard
    }
}

// Initial load
loadDashboardStats();
async function deleteRecord(id) {
    if (confirm("Are you sure you want to remove this investment?")) {
        const response = await fetch(`/api/investments/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert("Record Deleted!");
            loadInvestors();    // Refresh the table
            loadDashboard();    // Refresh the totals
        }
    }
}
async function registerInvestor(event) {
    event.preventDefault(); // Prevents page refresh

    const payload = {
        first_name: document.getElementById('fname').value,
        surname: document.getElementById('sname').value,
        email: document.getElementById('email').value,
        amount: document.getElementById('amount').value
    };

    const response = await fetch('/api/investors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        alert("New Member & Investment Added!");
        document.getElementById('investor-form').reset(); // Clear form
        loadInvestors();   // Refresh the table below
        loadDashboard();   // Refresh the total liquidity
    } else {
        alert("Error: Check if email already exists.");
    }
}
async function loadRecentActivity() {
    const response = await fetch('/api/investments/recent');
    const data = await response.json();
    
    // Demonstrate filtering logic
    console.log(`Found ${data.length} investments in the last 30 days.`);
    
    const container = document.getElementById('recent-list');
    if(container) {
        container.innerHTML = data.map(item => `
            <li>New Investment: ₦${item.amount} (${new Date(item.created_at).toLocaleDateString()})</li>
        `).join('');
    }
}