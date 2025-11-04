// staff-performance.js
// Check authentication first
checkAuth("Admin");

const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");

// Redirect if token missing
if (!token) {
  alert("You are not logged in!");
  window.location.href = "../../index.html";
}

// Generic API request helper
async function apiRequest(url, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE}${url}`, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }

  return await response.json();
}

// Global variables
let performanceData = [];
let performanceChart = null;

// Format seconds to readable time
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
  
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

// Calculate performance score (0-100)
function calculatePerformanceScore(ticketsResolved, avgResolutionSeconds) {
  // Base score on tickets resolved (up to 50 points)
  const ticketScore = Math.min(ticketsResolved * 5, 50);
  
  // Resolution time score (up to 50 points)
  // Faster resolution = higher score
  // Assuming 24 hours (86400 seconds) or less is excellent
  const maxTime = 86400; // 24 hours in seconds
  const timeScore = avgResolutionSeconds <= maxTime 
    ? 50 
    : Math.max(0, 50 - ((avgResolutionSeconds - maxTime) / maxTime) * 50);
  
  return Math.round(ticketScore + timeScore);
}

// Load performance data
async function loadPerformanceData() {
  try {
    performanceData = await apiRequest("/staff-performance-counter");
    
    // Sort by date descending
    performanceData.sort((a, b) => new Date(b.metric_date) - new Date(a.metric_date));
    
    // Populate staff filter
    populateStaffFilter();
    
    // Initial render
    filterPerformance();
    displayUser();
    
  } catch (error) {
    console.error("Error loading performance data:", error);
    alert("Failed to load performance data: " + error.message);
  }
}

// Populate staff filter dropdown
function populateStaffFilter() {
  const staffFilter = document.getElementById("staffFilter");
  const uniqueStaff = new Map();
  
  performanceData.forEach(item => {
    if (!uniqueStaff.has(item.user_id)) {
      uniqueStaff.set(item.user_id, {
        id: item.user_id,
        name: `${item.user.name} ${item.user.surname}`
      });
    }
  });
  
  // Clear existing options except "All Staff"
  staffFilter.innerHTML = '<option value="all">All Staff</option>';
  
  // Add staff options
  uniqueStaff.forEach(staff => {
    const option = document.createElement("option");
    option.value = staff.id;
    option.textContent = staff.name;
    staffFilter.appendChild(option);
  });
}

// Filter performance data
function filterPerformance() {
  const fromDate = document.getElementById("fromDate").value;
  const toDate = document.getElementById("toDate").value;
  const staffFilter = document.getElementById("staffFilter").value;
  
  let filteredData = [...performanceData];
  
  // Filter by date range
  if (fromDate) {
    filteredData = filteredData.filter(item => 
      new Date(item.metric_date) >= new Date(fromDate)
    );
  }
  
  if (toDate) {
    filteredData = filteredData.filter(item => 
      new Date(item.metric_date) <= new Date(toDate)
    );
  }
  
  // Filter by staff member
  if (staffFilter !== "all") {
    filteredData = filteredData.filter(item => item.user_id === staffFilter);
  }
  
  // Update table and chart
  renderPerformanceTable(filteredData);
  renderPerformanceChart(filteredData);
}

// Render performance table
function renderPerformanceTable(data) {
  const tbody = document.getElementById("performanceTableBody");
  tbody.innerHTML = "";
  
  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px; color: #64748b;">
          <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i>
          No performance data found for the selected filters.
        </td>
      </tr>
    `;
    return;
  }
  
  data.forEach(item => {
    const performanceScore = calculatePerformanceScore(
      item.tickets_resolved, 
      item.avg_resolution_seconds
    );
    
    // Determine badge color based on score
    let badgeColor = "#dc2626"; // red
    if (performanceScore >= 80) badgeColor = "#16a34a"; // green
    else if (performanceScore >= 60) badgeColor = "#eab308"; // yellow
    else if (performanceScore >= 40) badgeColor = "#f97316"; // orange
    
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700;">
            ${item.user.name.charAt(0)}${item.user.surname.charAt(0)}
          </div>
          <div>
            <div style="font-weight: 600; color: #0f172a;">${item.user.name} ${item.user.surname}</div>
            <div style="font-size: 0.875rem; color: #64748b;">${item.user.role.role_name}</div>
          </div>
        </div>
      </td>
      <td>${new Date(item.metric_date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
      <td>
        <span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 0.875rem;">
          ${item.tickets_resolved}
        </span>
      </td>
      <td>${formatTime(item.avg_resolution_seconds)}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="flex: 1; background: #e2e8f0; border-radius: 8px; height: 8px; overflow: hidden;">
            <div style="width: ${performanceScore}%; background: ${badgeColor}; height: 100%; transition: width 0.3s;"></div>
          </div>
          <span style="font-weight: 700; color: ${badgeColor}; min-width: 45px;">${performanceScore}</span>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Render performance chart
function renderPerformanceChart(data) {
  // Group data by date and aggregate
  const dateMap = new Map();
  
  data.forEach(item => {
    const date = new Date(item.metric_date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
    
    if (!dateMap.has(date)) {
      dateMap.set(date, {
        ticketsResolved: 0,
        count: 0
      });
    }
    
    const entry = dateMap.get(date);
    entry.ticketsResolved += item.tickets_resolved;
    entry.count += 1;
  });
  
  // Convert to arrays for chart
  const labels = Array.from(dateMap.keys()).slice(-10); // Last 10 dates
  const ticketData = labels.map(date => dateMap.get(date).ticketsResolved);
  
  // Destroy existing chart if it exists
  if (performanceChart) {
    performanceChart.destroy();
  }
  
  // Create new chart
  const ctx = document.getElementById('performanceChart').getContext('2d');
  performanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Tickets Resolved',
        data: ticketData,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: {
              size: 13,
              weight: '600'
            },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: '600'
          },
          bodyFont: {
            size: 13
          },
          borderColor: '#e2e8f0',
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: {
              size: 12
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: {
            font: {
              size: 12
            }
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Export performance data to CSV
function exportPerformance() {
  const fromDate = document.getElementById("fromDate").value;
  const toDate = document.getElementById("toDate").value;
  const staffFilter = document.getElementById("staffFilter").value;
  
  let filteredData = [...performanceData];
  
  if (fromDate) {
    filteredData = filteredData.filter(item => 
      new Date(item.metric_date) >= new Date(fromDate)
    );
  }
  
  if (toDate) {
    filteredData = filteredData.filter(item => 
      new Date(item.metric_date) <= new Date(toDate)
    );
  }
  
  if (staffFilter !== "all") {
    filteredData = filteredData.filter(item => item.user_id === staffFilter);
  }
  
  // Create CSV content
  let csv = "Staff Member,Email,Role,Department,Date,Tickets Resolved,Avg Resolution Time,Performance Score\n";
  
  filteredData.forEach(item => {
    const performanceScore = calculatePerformanceScore(
      item.tickets_resolved, 
      item.avg_resolution_seconds
    );
    
    csv += `"${item.user.name} ${item.user.surname}",`;
    csv += `"${item.user.email}",`;
    csv += `"${item.user.role.role_name}",`;
    csv += `"${item.user.department.department_name}",`;
    csv += `"${new Date(item.metric_date).toLocaleDateString('en-ZA')}",`;
    csv += `${item.tickets_resolved},`;
    csv += `"${formatTime(item.avg_resolution_seconds)}",`;
    csv += `${performanceScore}\n`;
  });
  
  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `staff-performance-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  loadPerformanceData();
  
  // Set default date range (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  document.getElementById("toDate").valueAsDate = today;
  document.getElementById("fromDate").valueAsDate = thirtyDaysAgo;
});

function displayUser() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const usernameEl = document.getElementById('username');
  if (usernameEl && user.name) {
    usernameEl.textContent = `${user.name} ${user.surname || ''}`.trim();
  }
}