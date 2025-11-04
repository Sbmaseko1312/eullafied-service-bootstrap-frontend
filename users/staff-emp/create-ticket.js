// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Global variables
let userInfo = null;
let token = null;
let categories = [];
let priorities = [];

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
  console.log('DOM Content Loaded - Starting initialization');
  initializeCreateTicketPage();
});

async function initializeCreateTicketPage() {
  console.log('Initializing Create Ticket Page...');
  
  try {
    // Get token from localStorage
    token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    
    if (!token) {
      alert('Authentication required. Please login.');
      window.location.href = '../../index.html';
      return;
    }

    // Get logged in user info from localStorage
    userInfo = JSON.parse(localStorage.getItem('user'));
    console.log('User info loaded:', userInfo);
    
    if (!userInfo || !userInfo.user_id) {
      alert('Please login first');
      window.location.href = '../../index.html';
      return;
    }

    // Display username
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
      usernameElement.textContent = `${userInfo.name} ${userInfo.surname}`;
      console.log('Username displayed');
    } else {
      console.warn('Username element not found');
    }

    // Load dropdown data from API
    console.log('Loading dropdowns...');
    await loadCreateTicketDropdowns();
    console.log('Initialization complete');
    
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

// Load dropdown data for create ticket form
async function loadCreateTicketDropdowns() {
  console.log('Starting to load dropdowns...');
  
  try {
    // Load categories from API
    console.log('Fetching categories...');
    const categoriesResponse = await apiRequest('/ticket-category');
    console.log('Categories received:', categoriesResponse);
    categories = categoriesResponse;
    populateCategoryDropdown(categories);

    // Load priorities from API
    console.log('Fetching priorities...');
    const prioritiesResponse = await apiRequest('/ticket-priorities');
    console.log('Priorities received:', prioritiesResponse);
    priorities = prioritiesResponse;
    populatePriorityDropdown(priorities);

    console.log('All dropdowns loaded successfully');
  } catch (error) {
    console.error('Error loading dropdown data:', error);
    alert('Error loading form data. Please refresh the page.');
  }
}

function populateCategoryDropdown(categories) {
  console.log('Populating category dropdown with:', categories);
  
  const select = document.getElementById('category');
  console.log('Category select element:', select);
  
  if (!select) {
    console.error('Category select element not found!');
    return;
  }
  
  select.innerHTML = '<option value="">Select a category...</option>';
  
  if (!categories || categories.length === 0) {
    console.warn('No categories available');
    select.innerHTML = '<option value="">No categories available</option>';
    select.disabled = true;
    return;
  }
  
  categories.forEach(category => {
    console.log('Adding category:', category.name, category.category_id);
    const option = document.createElement('option');
    option.value = category.category_id;
    option.textContent = category.name;
    select.appendChild(option);
  });
  
  console.log('Category dropdown populated with', categories.length, 'items');
}

function populatePriorityDropdown(priorities) {
  console.log('Populating priority dropdown with:', priorities);
  
  const select = document.getElementById('priority');
  console.log('Priority select element:', select);
  
  if (!select) {
    console.error('Priority select element not found!');
    return;
  }
  
  select.innerHTML = '<option value="">Select priority level...</option>';
  
  if (!priorities || priorities.length === 0) {
    console.warn('No priorities available');
    select.innerHTML = '<option value="">No priorities available</option>';
    select.disabled = true;
    return;
  }
  
  priorities.forEach(priority => {
    console.log('Adding priority:', priority.name, priority.priority_id);
    const option = document.createElement('option');
    option.value = priority.priority_id;
    option.textContent = priority.name;
    select.appendChild(option);
  });
  
  console.log('Priority dropdown populated with', priorities.length, 'items');
}

// Generate ticket number
function generateTicketNumber() {
  const lastNumber = parseInt(localStorage.getItem("last_ticket_number") || "0", 10);
  const nextNumber = lastNumber + 1;
  localStorage.setItem("last_ticket_number", nextNumber);
  return `TN-${String(nextNumber).padStart(3, "0")}`;
}

// Get status ID by name
async function getStatusIdByName(statusName) {
  const statuses = await apiRequest("/ticket-status");
  const found = statuses.find(s => s.status_name.toLowerCase() === statusName.toLowerCase());
  if (!found) {
    throw new Error(`Status "${statusName}" not found`);
  }
  return found.status_id;
}

// Create ticket function
async function createTicket() {
  console.log('Create ticket function called');
  console.log('Current userInfo:', userInfo);
  
  const description = document.getElementById('description').value.trim();
  const categoryId = document.getElementById('category').value;
  const priorityId = document.getElementById('priority').value;

  console.log('Form values:', { description, categoryId, priorityId });

  // Validation
  if (!description || !categoryId || !priorityId) {
    alert('Please fill in all required fields');
    return;
  }

  // Try multiple possible field names for department_id
  const departmentId = userInfo.department_id || userInfo.departmentId || userInfo.department?.department_id;
  const userId = userInfo.user_id || userInfo.userId;

  console.log('Extracted IDs:', { userId, departmentId });

  if (!userId) {
    alert('User ID missing. Please login again.');
    console.error('userInfo object:', userInfo);
    return;
  }

  if (!departmentId) {
    console.warn('Department ID not found. Proceeding without it...');
  }

  try {
    // Generate ticket number
    const ticketNumber = generateTicketNumber();
    console.log('Generated ticket number:', ticketNumber);
    
    // Get "Pending Approval" status ID (tickets created by users need approval)
    const statusId = await getStatusIdByName("Pending Approval");
    console.log('Status ID for Pending Approval:', statusId);

    // Prepare ticket data - Ensure ALL IDs are strings as required by backend
    const ticketData = {
      ticket_number: ticketNumber,
      description: description,
      requester_id: String(userId),
      department_id: departmentId ? String(departmentId) : null,
      category_id: String(categoryId),
      priority_id: String(priorityId),
      status_id: String(statusId),
      manager_id: null,
      manager_comment: null,
      closed_at: null,
      cancelled_at: null,
      resolution_summary: null
    };

    console.log('Creating ticket with data:', ticketData);

    const result = await apiRequest('/tickets', 'POST', ticketData);

    console.log('Ticket created successfully:', result);
    alert('Ticket created successfully! Awaiting manager approval.');
    
    // Reset form
    document.getElementById('description').value = '';
    document.getElementById('category').value = '';
    document.getElementById('priority').value = '';
    
    // Redirect to my tickets page
    setTimeout(() => {
      window.location.href = 'my-tickets.html';
    }, 500);

  } catch (error) {
    console.error('Error creating ticket:', error);
    alert('Error creating ticket: ' + error.message);
  }
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '../../index.html';
  }
}