// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Global variables
let allTickets = [];
let filteredTickets = [];
let userInfo = null;
let token = null;

// API Request helper with authentication
async function apiRequest(url, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE_URL}${url}`, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }
  return await response.json();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializePage();
});

async function initializePage() {
  try {
    // Get token from localStorage
    token = localStorage.getItem('token');
    if (!token) {
      alert('Authentication required. Please login.');
      window.location.href = '../../login.html';
      return;
    }

    // Get logged in user info from localStorage
    userInfo = JSON.parse(localStorage.getItem('user'));
    
    if (!userInfo || !userInfo.user_id) {
      alert('Please login first');
      window.location.href = '../../login.html';
      return;
    }

    // Display username
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
      usernameElement.textContent = `${userInfo.name} ${userInfo.surname}`;
    }

    // Show loading state
    const tbody = document.querySelector('.table tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px;"><i class="fas fa-spinner fa-spin"></i> Loading tickets...</td></tr>';
    }

    // Load all data
    await Promise.all([
      loadDropdownData(),
      loadTickets()
    ]);
    
    // Load metrics after tickets are loaded
    await loadMetrics();
  } catch (error) {
    console.error('Error initializing page:', error);
    if (error.message.includes('401') || error.message.includes('403')) {
      alert('Session expired. Please login again.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '../../login.html';
    } else {
      alert('Error loading data. Please refresh the page.');
    }
  }
}

// Load metrics for stat cards
async function loadMetrics() {
  try {
    const userId = userInfo.user_id;

    // Get all assigned tickets for this user
    let totalAssigned = 0;
    try {
      const assignedTickets = await apiRequest(`/ticket-assignment/${userId}`);
      totalAssigned = Array.isArray(assignedTickets) ? assignedTickets.length : 0;
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }

    // Filter tickets assigned to this user from allTickets
    const userTickets = allTickets.filter(ticket => {
      if (!ticket.assignments || !Array.isArray(ticket.assignments)) return false;
      return ticket.assignments.some(a => a.assigned_to === userId);
    });

    // Critical/High count - count both Critical AND High priorities
    const criticalHighCount = userTickets.filter(ticket => 
      ticket.priority && (
        ticket.priority.name === 'Critical' || 
        ticket.priority.name === 'High'
      )
    ).length;

    // In Progress count
    const inProgressCount = userTickets.filter(ticket => 
      ticket.status && ticket.status.status_name === 'In Progress'
    ).length;

    // Open count (Approved-Awaiting Assistance)
    const openCount = userTickets.filter(ticket => 
      ticket.status && ticket.status.status_name === 'Approved-Awaiting Assistance'
    ).length;

    // Update UI
    updateMetricCard(0, totalAssigned);
    updateMetricCard(1, criticalHighCount);
    updateMetricCard(2, inProgressCount);
    updateMetricCard(3, openCount);

  } catch (error) {
    console.error('Error loading metrics:', error);
  }
}

function updateMetricCard(index, value) {
  const cards = document.querySelectorAll('.stat-card h3');
  if (cards[index]) {
    cards[index].textContent = value;
  }
}

// Load tickets
async function loadTickets() {
  try {
    const tickets = await apiRequest('/tickets');

    // Filter out declined and pending approval tickets
    allTickets = tickets.filter(ticket => 
      ticket.status && 
      ticket.status.status_name !== 'Declined' && 
      ticket.status.status_name !== 'Pending Approval'
    );

    filteredTickets = [...allTickets];
    renderTickets();
  } catch (error) {
    console.error('Error loading tickets:', error);
    const tbody = document.querySelector('.table tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px; color: #ef4444;">Error loading tickets. Please refresh the page.</td></tr>';
    }
  }
}

// Load dropdown data
async function loadDropdownData() {
  try {
    // Load priorities
    try {
      const priorities = await apiRequest('/ticket-priorities');
      populatePriorityFilter(priorities);
    } catch (error) {
      console.error('Error loading priorities:', error);
    }

    // Load categories
    try {
      const categories = await apiRequest('/ticket-category');
      populateCategoryFilter(categories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }

    // Load statuses
    try {
      const statuses = await apiRequest('/ticket-status');
      populateStatusFilter(statuses);
    } catch (error) {
      console.error('Error loading statuses:', error);
    }

  } catch (error) {
    console.error('Error loading dropdown data:', error);
  }
}

function populatePriorityFilter(priorities) {
  const select = document.getElementById('priorityFilter');
  if (!select) return;
  
  select.innerHTML = '<option value="all">All Priorities</option>';
  
  priorities.forEach(priority => {
    const option = document.createElement('option');
    option.value = priority.name.toLowerCase();
    option.textContent = priority.name;
    select.appendChild(option);
  });
}

function populateCategoryFilter(categories) {
  const select = document.getElementById('categoryFilter');
  if (!select) return;
  
  select.innerHTML = '<option value="all">All Categories</option>';
  
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.name.toLowerCase();
    option.textContent = category.name;
    select.appendChild(option);
  });
}

function populateStatusFilter(statuses) {
  const select = document.getElementById('statusFilter');
  if (!select) return;
  
  select.innerHTML = '<option value="all">All Status</option>';
  
  // Filter out declined and pending approval
  const filteredStatuses = statuses.filter(status => 
    status.status_name !== 'Declined' && 
    status.status_name !== 'Pending Approval'
  );
  
  filteredStatuses.forEach(status => {
    const option = document.createElement('option');
    // Map status names for display
    let displayName = status.status_name;
    if (status.status_name === 'Approved-Awaiting Assistance') {
      displayName = 'Open';
      option.value = 'open';
    } else if (status.status_name === 'Completed') {
      displayName = 'Resolved/Closed';
      option.value = 'completed';
    } else {
      option.value = status.status_name.toLowerCase().replace(/ /g, '_');
    }
    option.textContent = displayName;
    select.appendChild(option);
  });
}

// Render tickets table
function renderTickets() {
  const tbody = document.querySelector('.table tbody');
  if (!tbody) return;
  
  // Clear all existing rows (including dummy data)
  tbody.innerHTML = '';

  if (filteredTickets.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px;">No tickets found</td></tr>';
    return;
  }

  filteredTickets.forEach(ticket => {
    const row = document.createElement('tr');
    
    // Apply background color for critical/high priority
    if (ticket.priority && (ticket.priority.name === 'Critical' || ticket.priority.name === 'High')) {
      if (ticket.priority.name === 'Critical') {
        row.style.backgroundColor = '#fee2e2';
      } else {
        row.style.backgroundColor = '#fef3c7';
      }
    }

    const requesterName = ticket.requester ? `${ticket.requester.name} ${ticket.requester.surname}` : 'N/A';
    const categoryName = ticket.category?.name || 'N/A';
    const priorityName = ticket.priority?.name || 'N/A';
    const statusName = ticket.status?.status_name || 'N/A';

    row.innerHTML = `
      <td><strong>${ticket.ticket_number || 'N/A'}</strong></td>
      <td>${ticket.description || 'No description'}</td>
      <td>${requesterName}</td>
      <td><span class="badge ${getCategoryBadgeClass(categoryName)}">${categoryName}</span></td>
      <td><span class="badge ${getPriorityBadgeClass(priorityName)}">${priorityName}</span></td>
      <td><span class="badge ${getStatusBadgeClass(statusName)}">${getStatusDisplayName(statusName)}</span></td>
      <td>${formatDate(ticket.created_at)}</td>
      <td>
        ${renderActionButtons(ticket)}
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

function renderActionButtons(ticket) {
  const isOpen = ticket.status?.status_name === 'Approved-Awaiting Assistance';
  const isInProgress = ticket.status?.status_name === 'In Progress';
  
  if (isOpen) {
    // Show "take task" button for open tickets
    return `
      <button class="btn-success" onclick="assignTicketToMe('${ticket.ticket_id}')" title="Assign to me">
        <i class="fas fa-user-check"></i>
      </button>
    `;
  } else if (isInProgress) {
    // Show edit button for in-progress tickets
    return `
      <button class="btn-warning" onclick="updateTicket('${ticket.ticket_id}')" title="Edit ticket">
        <i class="fas fa-edit"></i>
      </button>
    `;
  } else {
    // For completed/other statuses, just show view button
    return `
      <button class="btn-info" onclick="viewTicket('${ticket.ticket_id}')" title="View ticket">
        <i class="fas fa-eye"></i>
      </button>
    `;
  }
}

// Assign ticket to logged in user
async function assignTicketToMe(ticketId) {
  if (!confirm('Assign this ticket to yourself?\n\nThis will add the ticket to your workload.')) {
    return;
  }

  try {
    await apiRequest('/ticket-assignment', 'POST', {
      ticket_id: ticketId,
      assigned_to: userInfo.user_id,
      assignment_reason: null
    });

    alert('Ticket assigned successfully!');
    // Reload data
    await loadTickets();
    await loadMetrics();
  } catch (error) {
    console.error('Error assigning ticket:', error);
    alert('Error assigning ticket: ' + error.message);
  }
}

// Search tickets
function searchTickets() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  
  const searchTerm = searchInput.value.toLowerCase();
  
  filteredTickets = allTickets.filter(ticket => {
    const searchableText = `
      ${ticket.ticket_number || ''} 
      ${ticket.description || ''} 
      ${ticket.requester?.name || ''} 
      ${ticket.requester?.surname || ''}
    `.toLowerCase();
    
    return searchableText.includes(searchTerm);
  });
  
  applyFilters();
}

// Filter tickets
function filterTickets() {
  applyFilters();
}

function applyFilters() {
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const priorityFilter = document.getElementById('priorityFilter');
  const categoryFilter = document.getElementById('categoryFilter');
  
  if (!searchInput || !statusFilter || !priorityFilter || !categoryFilter) return;
  
  const searchTerm = searchInput.value.toLowerCase();
  const statusValue = statusFilter.value;
  const priorityValue = priorityFilter.value;
  const categoryValue = categoryFilter.value;

  filteredTickets = allTickets.filter(ticket => {
    // Search filter
    const searchableText = `
      ${ticket.ticket_number || ''} 
      ${ticket.description || ''} 
      ${ticket.requester?.name || ''} 
      ${ticket.requester?.surname || ''}
    `.toLowerCase();
    
    const matchesSearch = searchTerm === '' || searchableText.includes(searchTerm);

    // Status filter
    let matchesStatus = true;
    if (statusValue !== 'all') {
      if (statusValue === 'open') {
        matchesStatus = ticket.status?.status_name === 'Approved-Awaiting Assistance';
      } else if (statusValue === 'completed') {
        matchesStatus = ticket.status?.status_name === 'Completed';
      } else if (statusValue === 'in_progress') {
        matchesStatus = ticket.status?.status_name === 'In Progress';
      } else {
        matchesStatus = ticket.status?.status_name.toLowerCase().replace(/ /g, '_') === statusValue;
      }
    }

    // Priority filter
    const matchesPriority = priorityValue === 'all' || 
      ticket.priority?.name.toLowerCase() === priorityValue;

    // Category filter
    const matchesCategory = categoryValue === 'all' || 
      ticket.category?.name.toLowerCase() === categoryValue;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  renderTickets();
}

// Helper functions
function getCategoryBadgeClass(category) {
  const classes = {
    'Hardware': 'badge-primary',
    'Software': 'badge-success',
    'Network': 'badge-danger',
    'Access': 'badge-warning'
  };
  return classes[category] || 'badge-secondary';
}

function getPriorityBadgeClass(priority) {
  const classes = {
    'Critical': 'badge-danger',
    'High': 'badge-danger',
    'Medium': 'badge-warning',
    'Low': 'badge-success'
  };
  return classes[priority] || 'badge-secondary';
}

function getStatusBadgeClass(status) {
  if (status === 'Approved-Awaiting Assistance') return 'badge-info';
  if (status === 'In Progress') return 'badge-warning';
  if (status === 'Completed') return 'badge-success';
  return 'badge-secondary';
}

function getStatusDisplayName(status) {
  if (status === 'Approved-Awaiting Assistance') return 'Open';
  if (status === 'Completed') return 'Resolved/Closed';
  return status || 'N/A';
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  } catch (error) {
    return 'N/A';
  }
}

function viewTicket(ticketId) {
  window.location.href = `staff-view-ticket.html?id=${ticketId}`;
}

function updateTicket(ticketId) {
  window.location.href = `staff-update-ticket.html?id=${ticketId}`;
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '../../index.html';
  }
}