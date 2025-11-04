// it-staff-completed-tickets.js
checkAuth("IT Staff");

const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");
let currentUser = null;
let allAssignments = [];
let ticketStatuses = [];

// Attach auth header for all fetch requests
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

// Get current user info
async function getCurrentUser() {
  try {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData && userData.user_id) {
      currentUser = userData;
      document.getElementById("username").textContent = `${userData.name} ${userData.surname}`;
      return userData;
    }
  } catch (error) {
    console.error("Error getting current user:", error);
  }
}

// Fetch all ticket statuses
async function fetchTicketStatuses() {
  try {
    ticketStatuses = await apiRequest("/ticket-status");
  } catch (error) {
    console.error("Error fetching ticket statuses:", error);
  }
}

// Fetch ticket assignments for current user
async function fetchTicketAssignments() {
  try {
    if (!currentUser) {
      await getCurrentUser();
    }
    
    const assignments = await apiRequest(`/ticket-assignment/user/${currentUser.user_id}`);
    
    allAssignments = assignments;
    
    updateStats();
    renderTickets(allAssignments);
    populateFilters();
  } catch (error) {
    console.error("Error fetching assignments:", error);
    document.querySelector("#completedTicketsTable tbody").innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center;padding:30px;color:#dc2626;">
          <i class="fas fa-exclamation-circle"></i> Error loading tickets: ${error.message}
        </td>
      </tr>
    `;
  }
}

// Update statistics
function updateStats() {
  const completed = allAssignments.filter(a => a.ticket?.status?.status_name === "Completed");
  const today = new Date().toDateString();
  const completedToday = completed.filter(a => {
    const closedDate = new Date(a.ticket?.closed_at).toDateString();
    return closedDate === today;
  });

  // Calculate average resolution time
  let totalSeconds = 0;
  let count = 0;
  completed.forEach(assignment => {
    const ticket = assignment.ticket;
    if (ticket.created_at && ticket.closed_at) {
      const created = new Date(ticket.created_at);
      const closed = new Date(ticket.closed_at);
      totalSeconds += (closed - created) / 1000;
      count++;
    }
  });

  const avgSeconds = count > 0 ? totalSeconds / count : 0;
  const hours = Math.floor(avgSeconds / 3600);
  const minutes = Math.floor((avgSeconds % 3600) / 60);

  // Update stat cards
  const statCards = document.querySelectorAll(".stat-card h3");
  statCards[0].textContent = completed.length;
  statCards[1].textContent = completedToday.length;
  statCards[2].textContent = `${hours}h ${minutes}m`;
}

// Populate filter dropdowns
function populateFilters() {
  const priorities = [...new Set(allAssignments.map(a => a.ticket?.priority?.name).filter(Boolean))];
  const categories = [...new Set(allAssignments.map(a => a.ticket?.category?.name).filter(Boolean))];

  const priorityFilter = document.getElementById("priorityFilter");
  const categoryFilter = document.getElementById("categoryFilter");

  priorityFilter.innerHTML = '<option value="all">All Priorities</option>';
  priorities.forEach(priority => {
    priorityFilter.innerHTML += `<option value="${priority}">${priority}</option>`;
  });

  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(category => {
    categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
  });
}

// Render tickets table
function renderTickets(assignments) {
  const tbody = document.querySelector("#completedTicketsTable tbody");
  
  if (assignments.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center;padding:30px;color:#64748b;">
          <i class="fas fa-inbox"></i> No tickets found
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = assignments.map(assignment => {
    const ticket = assignment.ticket;
    const requester = ticket.requester;
    const status = ticket.status;
    const priority = ticket.priority;
    const category = ticket.category;
    
    const resolutionTime = calculateResolutionTime(ticket);
    const completedDate = ticket.closed_at ? formatDate(ticket.closed_at) : formatDate(ticket.updated_at);
    
    const statusColor = status?.status_name === "Completed" ? "#10b981" : "#f59e0b";
    const priorityColor = getPriorityColor(priority?.name);
    
    return `
      <tr>
        <td style="font-weight: 600; color: #3b82f6;">${ticket.ticket_number || 'N/A'}</td>
        <td style="max-width: 250px;">${ticket.description || 'No description'}</td>
        <td>${requester?.name} ${requester?.surname}</td>
        <td>
          <span style="padding: 4px 12px; background: #f1f5f9; border-radius: 6px; font-size: 0.85rem;">
            ${category?.name || 'Uncategorized'}
          </span>
        </td>
        <td>
          <span style="padding: 4px 12px; background: ${priorityColor}20; color: ${priorityColor}; border-radius: 6px; font-weight: 600; font-size: 0.85rem;">
            ${priority?.name || 'N/A'}
          </span>
        </td>
        <td>${resolutionTime}</td>
        <td>${completedDate}</td>
        <td>
          <select 
            class="status-select" 
            data-ticket-id="${ticket.ticket_id}"
            data-current-status="${status?.status_id}"
            style="padding: 6px 12px; border: 2px solid ${statusColor}; border-radius: 6px; color: ${statusColor}; font-weight: 600; background: ${statusColor}10; cursor: pointer;"
            onchange="updateTicketStatus(this)"
          >
            <option value="${status?.status_id}" selected>${status?.status_name}</option>
            ${getStatusOptions(status?.status_name)}
          </select>
        </td>
      </tr>
    `;
  }).join('');
}

// Get status options based on current status
function getStatusOptions(currentStatus) {
  const allowedStatuses = ["In Progress", "Completed"];
  return allowedStatuses
    .filter(s => s !== currentStatus)
    .map(statusName => {
      const status = ticketStatuses.find(ts => ts.status_name === statusName);
      return status ? `<option value="${status.status_id}">${statusName}</option>` : '';
    })
    .join('');
}

// Update ticket status
async function updateTicketStatus(selectElement) {
  const ticketId = selectElement.dataset.ticketId;
  const newStatusId = selectElement.value;
  const oldStatusId = selectElement.dataset.currentStatus;
  
  try {
    selectElement.disabled = true;
    
    const updateData = {
      status_id: newStatusId
    };
    
    // If changing to completed, set closed_at
    const newStatus = ticketStatuses.find(s => s.status_id === newStatusId);
    if (newStatus?.status_name === "Completed") {
      updateData.closed_at = new Date().toISOString();
    }
    
    await apiRequest(`/tickets/${ticketId}`, "PUT", updateData);
    
    // Show success message
    showNotification("Status updated successfully!", "success");
    
    // Refresh the data
    await fetchTicketAssignments();
    
  } catch (error) {
    console.error("Error updating status:", error);
    showNotification("Failed to update status: " + error.message, "error");
    
    // Revert the select
    selectElement.value = oldStatusId;
  } finally {
    selectElement.disabled = false;
  }
}

// Show notification
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === "success" ? "#10b981" : "#dc2626"};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  notification.innerHTML = `
    <i class="fas fa-${type === "success" ? "check-circle" : "exclamation-circle"}" style="margin-right: 8px;"></i>
    ${message}
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Calculate resolution time
function calculateResolutionTime(ticket) {
  if (!ticket.created_at) return "N/A";
  
  const created = new Date(ticket.created_at);
  const ended = ticket.closed_at ? new Date(ticket.closed_at) : new Date(ticket.updated_at);
  
  const diffMs = ended - created;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}

// Format date
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Get priority color
function getPriorityColor(priority) {
  const colors = {
    "Low": "#10b981",
    "Medium": "#f59e0b",
    "High": "#ef4444",
    "Critical": "#dc2626"
  };
  return colors[priority] || "#64748b";
}

// Filter tickets
function filterTickets() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const dateFilter = document.getElementById("dateFilter").value;
  const priorityFilter = document.getElementById("priorityFilter").value;
  const categoryFilter = document.getElementById("categoryFilter").value;

  let filtered = allAssignments.filter(assignment => {
    const ticket = assignment.ticket;
    
    // Search filter
    const matchesSearch = !searchTerm || 
      ticket.ticket_number?.toLowerCase().includes(searchTerm) ||
      ticket.description?.toLowerCase().includes(searchTerm);
    
    // Date filter
    let matchesDate = true;
    if (dateFilter !== "all" && ticket.closed_at) {
      const ticketDate = new Date(ticket.closed_at);
      const now = new Date();
      
      switch(dateFilter) {
        case "today":
          matchesDate = ticketDate.toDateString() === now.toDateString();
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = ticketDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = ticketDate >= monthAgo;
          break;
      }
    }
    
    // Priority filter
    const matchesPriority = priorityFilter === "all" || ticket.priority?.name === priorityFilter;
    
    // Category filter
    const matchesCategory = categoryFilter === "all" || ticket.category?.name === categoryFilter;
    
    return matchesSearch && matchesDate && matchesPriority && matchesCategory;
  });

  renderTickets(filtered);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  .status-select {
    transition: all 0.3s ease;
  }
  .status-select:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  .status-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
document.head.appendChild(style);

// Event listeners
document.getElementById("searchInput").addEventListener("input", filterTickets);
document.getElementById("dateFilter").addEventListener("change", filterTickets);
document.getElementById("priorityFilter").addEventListener("change", filterTickets);
document.getElementById("categoryFilter").addEventListener("change", filterTickets);

// Make updateTicketStatus globally available
window.updateTicketStatus = updateTicketStatus;

// Initialize
async function init() {
  await getCurrentUser();
  await fetchTicketStatuses();
  await fetchTicketAssignments();
}

init();