// users/admin/admin-dashboard.js
checkAuth("Admin");

const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");

// Generic API request
async function apiRequest(url, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${url}`, options);
  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  return res.json();
}

// Cache for frequently accessed data
let statusCache = null;
let priorityCache = null;

// Get all ticket statuses
async function getStatuses() {
  if (statusCache) return statusCache;
  statusCache = await apiRequest("/ticket-status");
  return statusCache;
}

// Get all ticket priorities
async function getPriorities() {
  if (priorityCache) return priorityCache;
  priorityCache = await apiRequest("/ticket-priorities");
  return priorityCache;
}

// Display current user
function displayUser() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const usernameEl = document.getElementById("username");
  if (usernameEl && user.name) {
    usernameEl.textContent = `${user.name} ${user.surname || ""}`.trim();
  }
}

// Logout function
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "../../i.html";
  }
}

// 🟢 Load dashboard statistics (Cards + Counts)
async function loadDashboardStats() {
  try {
    const [users, tickets, departments, categories, assignments, statuses] =
      await Promise.all([
        apiRequest("/user"),
        apiRequest("/tickets"),
        apiRequest("/department"),
        apiRequest("/ticket-category"),
        apiRequest("/ticket-assignment"),
        getStatuses(),
      ]);

    // --- CARD COUNTS ---
    const totalStaff = users.length;
    const totalTickets = tickets.length;
    const totalDepartments = departments.length;
    const totalCategories = categories.length;

    // ✅ Map status names for readability
    const statusMap = {};
    statuses.forEach((s) => {
      statusMap[s.status_name.trim().toLowerCase()] = s.status_name;
    });

    const openStatusName = "Approved-Awaiting Assistance".toLowerCase();
    const resolvedStatusName = "Completed".toLowerCase();

    // ✅ Count by matching status name from DTO
    const openTickets = tickets.filter(
      (t) =>
        t.status &&
        t.status.status_name &&
        t.status.status_name.trim().toLowerCase() === openStatusName
    ).length;

    const resolvedTickets = tickets.filter(
      (t) =>
        t.status &&
        t.status.status_name &&
        t.status.status_name.trim().toLowerCase() === resolvedStatusName
    ).length;

    // ✅ Active assignments (still assigned)
    const activeAssignments = assignments.filter(
      (a) => a.unassigned_at === null
    ).length;

    // ✅ Unassigned tickets
    const assignedTicketIds = new Set(
      assignments
        .filter((a) => a.unassigned_at === null)
        .map((a) => a.ticket_id)
    );

    const unassignedTickets = tickets.filter(
      (t) => !assignedTicketIds.has(t.ticket_id)
    ).length;

    // ✅ Average resolution time for completed tickets
    const resolvedTicketsWithTime = tickets.filter(
      (t) =>
        t.status &&
        t.status.status_name &&
        t.status.status_name.trim().toLowerCase() === resolvedStatusName &&
        t.closed_at &&
        t.created_at
    );

    let avgResolutionTime = "--";
    if (resolvedTicketsWithTime.length > 0) {
      const totalSeconds = resolvedTicketsWithTime.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at);
        const closed = new Date(ticket.closed_at);
        return sum + (closed - created) / 1000;
      }, 0);

      const avgSeconds = totalSeconds / resolvedTicketsWithTime.length;
      const hours = Math.floor(avgSeconds / 3600);
      const minutes = Math.floor((avgSeconds % 3600) / 60);
      avgResolutionTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    // ✅ Update dashboard cards
    document.getElementById("totalStaff").textContent = totalStaff;
    document.getElementById("totalTickets").textContent = totalTickets;
    document.getElementById("openTickets").textContent = openTickets;
    document.getElementById("resolvedTickets").textContent = resolvedTickets;
    document.getElementById("totalDepartments").textContent = totalDepartments;
    document.getElementById("avgResolutionTime").textContent = avgResolutionTime;
    document.getElementById("totalCategories").textContent = totalCategories;
    document.getElementById("activeAssignments").textContent =
      activeAssignments;
    document.getElementById("unassignedTickets").textContent =
      unassignedTickets;

    return { tickets, statuses };
  } catch (error) {
    console.error("Error loading dashboard stats:", error);
    alert("Failed to load dashboard statistics. Please refresh the page.");
  }
}


// 🟠 Pie Chart - Ticket Status
// 🟠 Pie Chart - Ticket Status
async function initStatusPieChart(tickets, statuses) {
  try {
    
    const statusCounts = {};
    
    // Initialize all statuses with 0 count
    statuses.forEach((status) => {
      statusCounts[status.status_name] = 0;
    });
    
    // Count tickets by status using status_id
    tickets.forEach((ticket) => {
      const status = statuses.find(s => s.status_id === ticket.status.status_id);
      if (status) {
        statusCounts[status.status_name]++;
      }
    });

    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);

    // Updated color mapping for your actual statuses
    const colorMap = {
      "approved-awaiting assistance": "#f59e0b",
      "completed": "#10b981",
      "declined": "#ef4444",
      "finished": "#64748b",
      "in progress": "#3b82f6",
      "pending approval": "#8b5cf6"
    };

    const backgroundColors = labels.map(
      (label) => colorMap[label.toLowerCase()] || "#94a3b8"
    );

    const ctx = document.getElementById("statusPieChart").getContext("2d");
    new Chart(ctx, {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: backgroundColors,
            borderWidth: 2,
            borderColor: "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 15,
              font: {
                size: 12,
                weight: "600",
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error initializing status pie chart:", error);
  }
}

// 🟡 Doughnut Chart - Priority
// 🟡 Doughnut Chart - Priority
async function initPriorityChart() {
  try {
    const [tickets, priorities] = await Promise.all([
      apiRequest("/tickets"),
      getPriorities(),
    ]);

    const priorityCounts = {};
    
    // Initialize all priorities with 0 count
    priorities.forEach((priority) => {
      priorityCounts[priority.name] = 0;
    });
    
    // Count tickets by priority using priority_id
    tickets.forEach((ticket) => {
      const priority = priorities.find(p => p.priority_id === ticket.priority.priority_id);
      if (priority) {
        priorityCounts[priority.name]++;
      }
    });

    const labels = Object.keys(priorityCounts);
    const data = Object.values(priorityCounts);

    // Updated color mapping for your actual priorities
    const colorMap = {
      "low": "#10b981",
      "medium": "#3b82f6",
      "moderate": "#6366f1",
      "high": "#f59e0b",
      "critical": "#ef4444"
    };

    const backgroundColors = labels.map(
      (label) => colorMap[label.toLowerCase()] || "#94a3b8"
    );

    const ctx = document.getElementById("priorityChart").getContext("2d");
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: backgroundColors,
            borderWidth: 2,
            borderColor: "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 15,
              font: {
                size: 12,
                weight: "600",
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error initializing priority chart:", error);
  }
}

// 🏆 Load Top Performers (Fixed with names)
async function loadTopPerformers() {
  try {
    const performances = await apiRequest("/staff-performance-counter");
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    const userPerformance = {};
    performances.forEach((perf) => {
      if (perf.metric_date.startsWith(currentMonth)) {
        const userId = perf.user?.user_id || perf.user_id;
        if (!userPerformance[userId]) {
          userPerformance[userId] = {
            name: `${perf.user?.name || "Unknown"} ${
              perf.user?.surname || ""
            }`.trim(),
            tickets_resolved: 0,
            total_seconds: 0,
            count: 0,
          };
        }
        userPerformance[userId].tickets_resolved += perf.tickets_resolved || 0;
        if (perf.avg_resolution_seconds) {
          userPerformance[userId].total_seconds += perf.avg_resolution_seconds;
          userPerformance[userId].count++;
        }
      }
    });

    const performers = Object.values(userPerformance)
      .map((perf) => ({
        name: perf.name,
        resolved: perf.tickets_resolved,
        avgTime:
          perf.count > 0 ? formatTime(perf.total_seconds / perf.count) : "--",
      }))
      .filter((p) => p.resolved > 0)
      .sort((a, b) => b.resolved - a.resolved)
      .slice(0, 5);

    if (performers.length > 0) performers[0].badge = "gold";
    if (performers.length > 1) performers[1].badge = "silver";
    if (performers.length > 2) performers[2].badge = "bronze";
    performers.slice(3).forEach((p) => (p.badge = "none"));

    const badges = {
      gold: '<i class="fas fa-trophy" style="color: #f59e0b; margin-right: 8px;"></i>',
      silver:
        '<i class="fas fa-medal" style="color: #94a3b8; margin-right: 8px;"></i>',
      bronze:
        '<i class="fas fa-award" style="color: #cd7f32; margin-right: 8px;"></i>',
      none: '<i class="fas fa-star" style="color: #cbd5e1; margin-right: 8px;"></i>',
    };

    const html =
      performers.length > 0
        ? performers
            .map(
              (p) => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f8fafc; border-radius: 8px; margin-bottom: 10px;">
            <div style="display: flex; align-items: center;">
              ${badges[p.badge]}
              <div>
                <div style="font-weight: 600; color: #0f172a;">${p.name}</div>
                <div style="font-size: 0.85rem; color: #64748b;">Avg: ${p.avgTime}</div>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 1.5rem; font-weight: 700; color: #2563eb;">${p.resolved}</div>
              <div style="font-size: 0.75rem; color: #64748b;">resolved</div>
            </div>
          </div>
        `
            )
            .join("")
        : `<p style="text-align:center;color:#64748b;padding:20px;">No performance data available for this month.</p>`;

    document.getElementById("topPerformers").innerHTML = html;
  } catch (error) {
    console.error("Error loading top performers:", error);
    document.getElementById("topPerformers").innerHTML =
      '<p style="text-align:center;color:#ef4444;padding:20px;">Failed to load performance data.</p>';
  }
}

// Format seconds to readable time
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

// 🧾 Load Recent Tickets (Unchanged)
async function loadRecentTickets() {
  try {
    const [tickets, users, departments, categories, priorities, statuses] =
      await Promise.all([
        apiRequest("/tickets"),
        apiRequest("/user"),
        apiRequest("/department"),
        apiRequest("/ticket-category"),
        getPriorities(),
        getStatuses(),
      ]);

    const userMap = {};
    users.forEach((u) => (userMap[u.id] = `${u.name} ${u.surname || ""}`.trim()));

    const deptMap = {};
    departments.forEach((d) => (deptMap[d.id] = d.department_name));

    const catMap = {};
    categories.forEach((c) => (catMap[c.id] = c.name));

    const prioMap = {};
    priorities.forEach((p) => (prioMap[p.id] = p.name));

    const statusMap = {};
    statuses.forEach((s) => (statusMap[s.id] = s.status_name));

    const recentTickets = tickets
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    const priorityColors = {
      low: "#10b981",
      medium: "#3b82f6",
      high: "#f59e0b",
      critical: "#ef4444",
      urgent: "#dc2626",
    };

    const statusColors = {
      open: "#f59e0b",
      "in progress": "#3b82f6",
      resolved: "#10b981",
      closed: "#64748b",
      cancelled: "#ef4444",
      pending: "#8b5cf6",
    };

    const html = recentTickets
      .map((t) => {
        const priority = prioMap[t.priority_id] || "Unknown";
        const status = statusMap[t.status_id] || "Unknown";
        const createdDate = new Date(t.created_at).toLocaleDateString();

        return `
        <tr>
          <td><strong>${t.ticket_number || "N/A"}</strong></td>
          <td>${userMap[t.requester_id] || "Unknown"}</td>
          <td>${deptMap[t.department_id] || "N/A"}</td>
          <td>${catMap[t.category_id] || "N/A"}</td>
          <td><span style="background: ${
            priorityColors[priority.toLowerCase()] || "#94a3b8"
          }; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">${priority}</span></td>
          <td><span style="background: ${
            statusColors[status.toLowerCase()] || "#94a3b8"
          }; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">${status}</span></td>
          <td>${createdDate}</td>
        </tr>`;
      })
      .join("");

    document.getElementById("recentTicketsBody").innerHTML =
      html ||
      '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #64748b;">No tickets found</td></tr>';
  } catch (error) {
    console.error("Error loading recent tickets:", error);
    document.getElementById("recentTicketsBody").innerHTML =
      '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #ef4444;">Failed to load tickets</td></tr>';
  }
}

// Initialize dashboard
async function initializeDashboard() {
  try {
    displayUser();
    const { tickets, statuses } = await loadDashboardStats();

    await Promise.all([
      initStatusPieChart(tickets, statuses),
      initPriorityChart(),
      loadTopPerformers(),
      loadRecentTickets(),
    ]);
  } catch (error) {
    console.error("Error initializing dashboard:", error);
    alert("Failed to initialize dashboard. Please check your connection.");
  }
}

// Start initialization when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeDashboard);
} else {
  initializeDashboard();
}
