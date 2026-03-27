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
