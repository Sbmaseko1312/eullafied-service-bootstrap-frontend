// it-staff.js
checkAuth("IT Staff");

const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");
const userId = localStorage.getItem("user_id");
const username = localStorage.getItem("username");

// Redirect if token missing
if (!token) {
  alert("You are not logged in!");
  window.location.href = "../../index.html";
}

// Check if user_id exists
if (!userId) {
  alert("User ID not found. Please log in again.");
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

// Load performance data for logged-in user
async function loadPerformanceData() {
  try {
    performanceData = await apiRequest(`/staff-performance-counter/user/${userId}`);
    
    // Sort by date descending
    performanceData.sort((a, b) => new Date(b.metric_date) - new Date(a.metric_date));
    
    // Update overview cards
    updateOverviewCards();
    
    // Render chart
    renderPerformanceChart();
    
    // Update summary text
    updateSummary();
    
  } catch (error) {
    console.error("Error loading performance data:", error);
    
    // Show user-friendly message in the UI
    const chartCanvas = document.getElementById("performanceChart");
    if (chartCanvas) {
      const ctx = chartCanvas.getContext('2d');
      ctx.font = '16px Arial';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('No performance data available yet', chartCanvas.width / 2, chartCanvas.height / 2);
    }
  }
}

// Update overview cards with real data
function updateOverviewCards() {
  if (performanceData.length === 0) return;
  
  // Calculate totals
  const totalTickets = performanceData.reduce((sum, item) => sum + item.tickets_resolved, 0);
  const avgResolution = performanceData.reduce((sum, item) => sum + item.avg_resolution_seconds, 0) / performanceData.length;
  
  // Update Tickets Completed card
  const statCards = document.querySelectorAll('.stat-card h3');
  if (statCards.length >= 2) {
    statCards[0].textContent = totalTickets;
    statCards[1].textContent = formatTime(avgResolution);
  }
}

// Render performance chart
function renderPerformanceChart() {
  const chartCanvas = document.getElementById('performanceChart');
  if (!chartCanvas) return;
  
  if (performanceData.length === 0) {
    const ctx = chartCanvas.getContext('2d');
    ctx.font = '16px Arial';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('No performance data available', chartCanvas.width / 2, 175);
    return;
  }
  
  // Prepare data for chart (sorted by date)
  const sortedData = [...performanceData].sort((a, b) => 
    new Date(a.metric_date) - new Date(b.metric_date)
  );
  
  // Take last 30 days or all available data
  const displayData = sortedData.slice(-30);
  
  const labels = displayData.map(item => 
    new Date(item.metric_date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
  );
  const ticketData = displayData.map(item => item.tickets_resolved);
  const scoreData = displayData.map(item => 
    calculatePerformanceScore(item.tickets_resolved, item.avg_resolution_seconds)
  );
  
  // Destroy existing chart if it exists
  if (performanceChart) {
    performanceChart.destroy();
  }
  
  // Load Chart.js if not already loaded
  if (typeof Chart === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => createChart();
    document.head.appendChild(script);
  } else {
    createChart();
  }
  
  function createChart() {
    const ctx = chartCanvas.getContext('2d');
    performanceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Tickets Resolved',
            data: ticketData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            yAxisID: 'y'
          },
          {
            label: 'Performance Score',
            data: scoreData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          mode: 'index',
          intersect: false
        },
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
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            padding: 15,
            titleFont: {
              size: 14,
              weight: '600'
            },
            bodyFont: {
              size: 13
            },
            borderColor: '#e2e8f0',
            borderWidth: 1,
            displayColors: true,
            callbacks: {
              afterLabel: function(context) {
                if (context.datasetIndex === 1) {
                  const score = context.parsed.y;
                  if (score >= 80) return '⭐ Excellent';
                  if (score >= 60) return '✓ Good';
                  if (score >= 40) return '→ Average';
                  return '↓ Needs Improvement';
                }
                return '';
              }
            }
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: {
                size: 11
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            title: {
              display: true,
              text: 'Tickets Resolved',
              font: {
                size: 12,
                weight: '600'
              },
              color: '#10b981'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20,
              font: {
                size: 11
              }
            },
            grid: {
              drawOnChartArea: false
            },
            title: {
              display: true,
              text: 'Performance Score',
              font: {
                size: 12,
                weight: '600'
              },
              color: '#3b82f6'
            }
          },
          x: {
            ticks: {
              font: {
                size: 11
              },
              maxRotation: 45,
              minRotation: 0
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }
}

// Update summary text with insights
function updateSummary() {
  const summaryCard = document.querySelector('.card.mt-20 p');
  if (!summaryCard || performanceData.length < 2) return;
  
  // Calculate improvement
  const recentData = performanceData.slice(0, 7); // Last 7 days
  const olderData = performanceData.slice(7, 14); // Previous 7 days
  
  if (olderData.length === 0) {
    summaryCard.innerHTML = `You have <strong>${performanceData.length}</strong> days of performance data. Keep up the great work resolving tickets efficiently!`;
    return;
  }
  
  const recentAvg = recentData.reduce((sum, item) => sum + item.tickets_resolved, 0) / recentData.length;
  const olderAvg = olderData.reduce((sum, item) => sum + item.tickets_resolved, 0) / olderData.length;
  
  const improvement = ((recentAvg - olderAvg) / olderAvg * 100).toFixed(1);
  const totalTickets = performanceData.reduce((sum, item) => sum + item.tickets_resolved, 0);
  const avgScore = performanceData.reduce((sum, item) => {
    return sum + calculatePerformanceScore(item.tickets_resolved, item.avg_resolution_seconds);
  }, 0) / performanceData.length;
  
  let performanceText = '';
  if (avgScore >= 80) {
    performanceText = '⭐ <strong>Excellent work!</strong> You are performing exceptionally well.';
  } else if (avgScore >= 60) {
    performanceText = '✓ <strong>Good performance!</strong> You are meeting expectations consistently.';
  } else if (avgScore >= 40) {
    performanceText = '→ <strong>Average performance.</strong> There is room for improvement.';
  } else {
    performanceText = '↓ <strong>Performance needs attention.</strong> Focus on faster resolution times.';
  }
  
  if (improvement > 0) {
    summaryCard.innerHTML = `${performanceText} Your ticket resolution has improved by <strong>${improvement}%</strong> compared to the previous week. You have resolved <strong>${totalTickets}</strong> total tickets with an average performance score of <strong>${Math.round(avgScore)}/100</strong>. Keep maintaining high response times!`;
  } else {
    summaryCard.innerHTML = `${performanceText} You have resolved <strong>${totalTickets}</strong> total tickets with an average performance score of <strong>${Math.round(avgScore)}/100</strong>. Focus on maintaining consistency and improving resolution times.`;
  }
}

// Logout function
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('department_id');
    window.location.href = '../../index.html';
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  // Display username in header
  const usernameElement = document.getElementById("username");
  if (usernameElement) {
    usernameElement.textContent = username || "IT Staff";
  }
  
  // Load performance data
  loadPerformanceData();
});