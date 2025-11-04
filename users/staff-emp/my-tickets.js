// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Global variables for My Tickets page
let myTicketsAll = [];
let myTicketsFiltered = [];
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
  initializeMyTicketsPage();
});

async function initializeMyTicketsPage() {
  try {
    // Get token from localStorage
    token = localStorage.getItem('token');
    if (!token) {
      alert('Authentication required. Please login.');
      window.location.href = '../../index.html';
      return;
    }

    // Get logged in user info from localStorage
    userInfo = JSON.parse(localStorage.getItem('user'));
    
    if (!userInfo || !userInfo.user_id) {
      alert('Please login first');
      window.location.href = '../../index.html';
      return;
    }

    // Display username
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
      usernameElement.textContent = `${userInfo.name} ${userInfo.surname}`;
    }

    // Show loading state
    const tbody = document.getElementById('myTicketsTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;"><i class="fas fa-spinner fa-spin"></i> Loading your tickets...</td></tr>';
    }

    // Load dropdown data and tickets
    await Promise.all([
      loadMyTicketsDropdowns(),
      loadMyTickets()
    ]);
    
  } catch (error) {
    console.error('Error initializing page:', error);
    if (error.message.includes('401') || error.message.includes('403')) {
      alert('Session expired. Please login again.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '../../index.html';
    } else {
      alert('Error loading data. Please refresh the page.');
    }
  }
}

// Load dropdown data for filters
async function loadMyTicketsDropdowns() {
  try {
    // Load priorities
    try {
      const priorities = await apiRequest('/ticket-priorities');
      populateMyTicketsPriorityFilter(priorities);
    } catch (error) {
      console.error('Error loading priorities:', error);
    }

    // Load statuses
    try {
      const statuses = await apiRequest('/ticket-status');
      populateMyTicketsStatusFilter(statuses);
    } catch (error) {
      console.error('Error loading statuses:', error);
    }

  } catch (error) {
    console.error('Error loading dropdown data:', error);
  }
}

function populateMyTicketsPriorityFilter(priorities) {
  const select = document.getElementById('myTicketsPriorityFilter');
  if (!select) return;
  
  select.innerHTML = '<option value="all">All Priorities</option>';
  
  priorities.forEach(priority => {
    const option = document.createElement('option');
    option.value = priority.name.toLowerCase();
    option.textContent = priority.name;
    select.appendChild(option);
  });
}

function populateMyTicketsStatusFilter(statuses) {
  const select = document.getElementById('myTicketsStatusFilter');
  if (!select) return;
  
  select.innerHTML = '<option value="all">All Tickets</option>';
  
  statuses.forEach(status => {
    const option = document.createElement('option');
    option.value = status.status_name.toLowerCase().replace(/ /g, '_');
    option.textContent = status.status_name;
    select.appendChild(option);
  });
}

// Load tickets created by the logged-in user
async function loadMyTickets() {
  try {
    const allTickets = await apiRequest('/tickets');
    
    console.log('All tickets received:', allTickets.length);
    console.log('Current user ID:', userInfo.user_id);
    console.log('Sample ticket structure:', allTickets[0]);

    // Filter to show only tickets created by this user
    // Check both requester_id directly and nested requester.user_id
    myTicketsAll = allTickets.filter(ticket => {
      const requesterId = ticket.requester_id || ticket.requester?.user_id;
      const matches = requesterId === userInfo.user_id;
      
      if (matches) {
        console.log('Match found:', ticket.ticket_number);
      }
      
      return matches;
    });

    console.log('Filtered tickets for user:', myTicketsAll.length);

    myTicketsFiltered = [...myTicketsAll];
    renderMyTickets();
  } catch (error) {
    console.error('Error loading tickets:', error);
    const tbody = document.getElementById('myTicketsTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #ef4444;">Error loading tickets. Please refresh the page.</td></tr>';
    }
  }
}

// Render tickets table
function renderMyTickets() {
  const tbody = document.getElementById('myTicketsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (myTicketsFiltered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">No tickets found</td></tr>';
    return;
  }

  myTicketsFiltered.forEach(ticket => {
    
    const row = document.createElement('tr');

    row.innerHTML = `
      <td><strong>${ticket.ticket_number || 'N/A'}</strong></td>
      <td>${ticket.description || 'No description'}</td>
      <td><span class="badge ${getPriorityBadgeClass(ticket.priority.name)}">${ticket.priority.name}</span></td>
      <td><span class="badge ${getStatusBadgeClass(ticket.status.status_name)}">${ticket.status.status_name}</span></td>
      <td>${formatDate(ticket.created_at)}</td>
      <td>
        <button class="btn-info" onclick="viewMyTicket('${ticket.ticket_id}')" title="View ticket">
          <i class="fas fa-eye"></i>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}


// Filter tickets
function filterMyTickets() {
  const statusFilter = document.getElementById('myTicketsStatusFilter');
  const priorityFilter = document.getElementById('myTicketsPriorityFilter');
  
  if (!statusFilter || !priorityFilter) return;
  
  const statusValue = statusFilter.value;
  const priorityValue = priorityFilter.value;

  myTicketsFiltered = myTicketsAll.filter(ticket => {
    // Status filter
    const matchesStatus = statusValue === 'all' || 
      ticket.status?.status_name.toLowerCase().replace(/ /g, '_') === statusValue;

    // Priority filter
    const matchesPriority = priorityValue === 'all' || 
      ticket.priority?.name.toLowerCase() === priorityValue;

    return matchesStatus && matchesPriority;
  });

  renderMyTickets();
}

// Helper functions
function getPriorityBadgeClass(priority) {
  console.log('Getting badge class for priority:', priority);
  const classes = {
    'Critical': 'badge-danger',
    'High': 'badge-danger',
    'Medium': 'badge-warning',
    'Low': 'badge-success'
  };
  const badgeClass = classes[priority] || 'badge-secondary';
  console.log('Badge class:', badgeClass);
  return badgeClass;
}

function getStatusBadgeClass(status) {
  console.log('Getting badge class for status:', status);
  let badgeClass = 'badge-secondary';
  
  if (status === 'Approved-Awaiting Assistance') badgeClass = 'badge-info';
  else if (status === 'Pending Approval') badgeClass = 'badge-warning';
  else if (status === 'In Progress') badgeClass = 'badge-warning';
  else if (status === 'Completed') badgeClass = 'badge-success';
  else if (status === 'Declined') badgeClass = 'badge-danger';
  
  console.log('Status badge class:', badgeClass);
  return badgeClass;
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

function viewMyTicket(ticketId) {
  window.location.href = `view-ticket.html?id=${ticketId}`;
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '../../index.html';
  }
}