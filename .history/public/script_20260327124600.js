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

// 1. Update your table loop to include an "onclick"
function displayRows(data) {
    const tableBody = document.getElementById('investor-table-body');
    tableBody.innerHTML = data.map(item => `
        <tr onclick="showInformation('${item.id}')" style="cursor:pointer hover:background:#f0f0f0">
            <td>${item.first_name} ${item.surname}</td>
            <td>₦${Number(item.amount).toLocaleString()}</td>
            <td>${item.inv_status || 'Pending'}</td>
        </tr>
    `).join('');
}

// 2. The function that takes you to the "Information"
async function showInformation(id) {
    const response = await fetch(`/api/member-details/${id}`);
    const info = await response.json();

    // Use the results to fill an "Info Box" or Modal
    const infoHtml = `
        <div class="info-card">
            <h2>Detailed Information for ${info.first_name} ${info.surname}</h2>
            <p><strong>Email:</strong> ${info.email}</p>
            <p><strong>Phone:</strong> ${info.mobile_phone}</p>
            <p><strong>Nationality:</strong> ${info.nationality}</p>
            <hr>
            <h3>Investment Details</h3>
            <p><strong>Total Amount:</strong> ₦${Number(info.amount).toLocaleString()}</p>
            <p><strong>Monthly Interest:</strong> ${info.monthly_interest}%</p>
            <p><strong>Duration:</strong> ${info.duration}</p>
            <button onclick="document.getElementById('details-view').style.display='none'">Close</button>
        </div>
    `;

    const detailsDiv = document.getElementById('details-view');
    detailsDiv.innerHTML = infoHtml;
    detailsDiv.style.display = 'block';
}