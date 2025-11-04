// manager.js
checkAuth("Manager");

const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");

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

/* =========================================================
   🎟️ CREATE TICKET (status = Approved by default)
   ========================================================= */
async function createTicket() {
  const description = document.getElementById("description").value;
  const categoryId = document.getElementById("category").value;
  const priorityId = document.getElementById("priority").value;
  const departmentId = localStorage.getItem("department_id");
  const managerId = localStorage.getItem("user_id");

  // Validation
  if (!description || !categoryId || !priorityId) {
    alert("Please fill in all required fields!");
    return;
  }

  if (!departmentId || !managerId) {
    alert("User information missing. Please login again.");
    return;
  }

  try {
    const ticketNumber = generateTicketNumber();
    const statusId = await getStatusIdByName("Approved-Awaiting Assistance");

    // Ensure ALL IDs are strings as required by backend
    const ticketData = {
      ticket_number: ticketNumber,
      description: description.trim(),
      requester_id: String(managerId),
      department_id: String(departmentId),
      category_id: String(categoryId),
      priority_id: String(priorityId),
      status_id: String(statusId),
      manager_id: String(managerId)
    };

    console.log("Creating ticket with data:", ticketData);

    const ticket = await apiRequest("/tickets", "POST", ticketData);
    alert("Ticket created successfully!");
    console.log("Created ticket:", ticket);
    
    // Clear form
    document.getElementById("description").value = "";
    document.getElementById("category").value = "";
    document.getElementById("priority").value = "";
    
    // Optionally redirect to view tickets
    // window.location.href = "view-tickets.html";
  } catch (err) {
    console.error("Failed to create ticket:", err);
    alert("Error creating ticket: " + err.message);
  }
}

function generateTicketNumber() {
  const lastNumber = parseInt(localStorage.getItem("last_ticket_number") || "0", 10);
  const nextNumber = lastNumber + 1;
  localStorage.setItem("last_ticket_number", nextNumber);
  return `TN-${String(nextNumber).padStart(3, "0")}`;
}

/* =========================================================
   📋 GET MANAGER'S TICKETS (My Tickets)
   ========================================================= */
async function loadMyTickets() {
  const managerId = localStorage.getItem("user_id");
  try {
    const tickets = await apiRequest(`/tickets/department/${localStorage.getItem("department_id")}`);
    const myTickets = tickets.filter(t => t.manager && t.manager.user_id === managerId);

    const tbody = document.getElementById("myTicketsTableBody");
    tbody.innerHTML = "";
    myTickets.forEach(t => {
      const row = `
        <tr>
          <td>${t.ticket_number}</td>
          <td>${t.description}</td>
          <td>${t.priority?.name}</td>
          <td>${t.status?.status_name}</td>
          <td>${new Date(t.created_at).toLocaleString()}</td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="cancelTicket('${t.ticket_id}')">Cancel</button>
          </td>
        </tr>`;
      tbody.innerHTML += row;
    });
  } catch (err) {
    console.error("Error loading tickets:", err);
  }
}

/* =========================================================
   ❌ CANCEL TICKET
   ========================================================= */
async function cancelTicket(ticketId) {
  if (!confirm("Are you sure you want to cancel this ticket?")) return;
  try {
    const statusId = await getStatusIdByName("Cancelled");
    await apiRequest(`/tickets/${ticketId}`, "PATCH", {
      cancelled_at: new Date().toISOString(),
      status_id: String(statusId)
    });
    alert("Ticket cancelled!");
    loadMyTickets();
  } catch (err) {
    console.error("Error cancelling ticket:", err);
    alert("Error cancelling ticket: " + err.message);
  }
}

/* =========================================================
   👥 TEAM MEMBER REQUESTS (for approval/decline)
   ========================================================= */
async function loadTeamMemberTickets() {
  const deptId = localStorage.getItem("department_id");
  try {
    const tickets = await apiRequest(`/tickets/department/${deptId}`);
    const tbody = document.getElementById("teamTicketsTableBody");
    tbody.innerHTML = "";

    // Update statistics
    updateTeamStatistics(tickets);

    // Apply filters
    const memberFilter = document.getElementById("memberFilter")?.value || "all";
    const statusFilter = document.getElementById("statusFilter")?.value || "all";
    const priorityFilter = document.getElementById("priorityFilter")?.value || "all";
    const categoryFilter = document.getElementById("categoryFilter")?.value || "all";

    let filteredTickets = tickets;

    // Filter by member
    if (memberFilter !== "all") {
      filteredTickets = filteredTickets.filter(t => t.requester?.user_id === memberFilter);
    }

    // Filter by status
    if (statusFilter !== "all") {
      filteredTickets = filteredTickets.filter(t => 
        t.status?.status_name.toLowerCase().includes(statusFilter.toLowerCase())
      );
    }

    // Filter by priority
    if (priorityFilter !== "all") {
      filteredTickets = filteredTickets.filter(t => 
        t.priority?.name.toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filteredTickets = filteredTickets.filter(t => t.category?.category_id === categoryFilter);
    }

    filteredTickets.forEach(t => {
      const row = `
        <tr>
          <td>${t.requester?.name || 'N/A'} ${t.requester?.surname || ''}</td>
          <td>${t.ticket_number}</td>
          <td>${t.description}</td>
          <td>${t.category?.name || 'N/A'}</td>
          <td><span class="badge bg-${getPriorityColor(t.priority?.name)}">${t.priority?.name || 'N/A'}</span></td>
          <td><span class="badge bg-${getStatusColor(t.status?.status_name)}">${t.status?.status_name || 'N/A'}</span></td>
          <td>${new Date(t.created_at).toLocaleString()}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick='openEditTicketModal(${JSON.stringify(t).replace(/'/g, "&#39;")})'>
              <i class="fas fa-edit"></i> Edit
            </button>
          </td>
        </tr>`;
      tbody.innerHTML += row;
    });

    // Populate filter dropdowns
    populateTeamFilters(tickets);

  } catch (err) {
    console.error("Error loading team tickets:", err);
    alert("Error loading team tickets: " + err.message);
  }
}

/* =========================================================
   📊 UPDATE TEAM STATISTICS
   ========================================================= */
function updateTeamStatistics(tickets) {
  const totalEl = document.getElementById("totalTeamTickets");
  const openEl = document.getElementById("openTeamTickets");
  const resolvedEl = document.getElementById("resolvedTeamTickets");
  const highPriorityEl = document.getElementById("highPriorityTeam");

  if (totalEl) totalEl.textContent = tickets.length;
  
  if (openEl) {
    const openCount = tickets.filter(t => 
      t.status?.status_name.toLowerCase().includes("pending") || 
      t.status?.status_name.toLowerCase().includes("open") ||
      t.status?.status_name.toLowerCase().includes("progress")
    ).length;
    openEl.textContent = openCount;
  }

  if (resolvedEl) {
    const resolvedCount = tickets.filter(t => 
      t.status?.status_name.toLowerCase().includes("resolved") ||
      t.status?.status_name.toLowerCase().includes("closed") ||
      t.status?.status_name.toLowerCase().includes("completed")
    ).length;
    resolvedEl.textContent = resolvedCount;
  }

  if (highPriorityEl) {
    const highPriorityCount = tickets.filter(t => 
      t.priority?.name.toLowerCase() === "high" ||
      t.priority?.name.toLowerCase() === "critical"
    ).length;
    highPriorityEl.textContent = highPriorityCount;
  }
}

/* =========================================================
   🎨 HELPER: Get badge colors
   ========================================================= */
function getPriorityColor(priority) {
  const colors = {
    'low': 'success',
    'medium': 'warning',
    'high': 'danger',
    'critical': 'danger'
  };
  return colors[priority?.toLowerCase()] || 'secondary';
}

function getStatusColor(status) {
  if (!status) return 'secondary';
  const statusLower = status.toLowerCase();
  if (statusLower.includes('pending')) return 'warning';
  if (statusLower.includes('approved') || statusLower.includes('awaiting')) return 'info';
  if (statusLower.includes('progress')) return 'primary';
  if (statusLower.includes('completed') || statusLower.includes('closed')) return 'success';
  if (statusLower.includes('declined') || statusLower.includes('cancelled')) return 'danger';
  return 'secondary';
}




/* =========================================================
   🔧 POPULATE FILTER DROPDOWNS
   ========================================================= */
function populateTeamFilters(tickets) {
  const memberFilter = document.getElementById("memberFilter");
if (memberFilter) {
  const currentValue = memberFilter.value;

  // Filter out nulls and remove duplicates by user_id
  const members = tickets
    .map(t => t.requester)
    .filter(r => r) // remove nulls
    .reduce((unique, member) => {
      if (!unique.some(m => m.user_id === member.user_id)) {
        unique.push(member);
      }
      return unique;
    }, []);

  // Populate the select
  memberFilter.innerHTML = '<option value="all">All Team Members</option>';
  members.forEach(member => {
    memberFilter.innerHTML += `<option value="${member.user_id}">${member.name} ${member.surname}</option>`;
  });

  memberFilter.value = currentValue;
}



  // Populate category filter
  
}

/* =========================================================
   ✏️ OPEN EDIT TICKET MODALconst categoryFilter = document.getElementById("categoryFilter");
  if (categoryFilter) {
    const categories = [...new Set(tickets.map(t => t.category).filter(c => c))];
    const currentValue = categoryFilter.value;
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(category => {
      categoryFilter.innerHTML += `<option value="${category.category_id}">${category.name}</option>`;
    });
    categoryFilter.value = currentValue;
  }
   ========================================================= */
function openEditTicketModal(ticket) {
  // Set current ticket data
  document.getElementById("editTicketId").value = ticket.ticket_id;
  document.getElementById("editTicketNumber").value = ticket.ticket_number;
  document.getElementById("editDescription").value = ticket.description;
  document.getElementById("editManagerComment").value = ticket.manager_comment || "";
  
  // Load status dropdown
  loadEditStatusDropdown(ticket.status?.status_id);
  
  // Show modal
  document.getElementById("editTicketModal").style.display = "flex";
}

/* =========================================================
   🚫 CLOSE EDIT TICKET MODAL
   ========================================================= */
function closeEditTicketModal() {
  document.getElementById("editTicketModal").style.display = "none";
}

/* =========================================================
   💾 SAVE TICKET CHANGES
   ========================================================= */
async function saveTicketChanges() {
  const ticketId = document.getElementById("editTicketId").value;
  const statusId = document.getElementById("editStatus").value;
  const managerComment = document.getElementById("editManagerComment").value;
  
  // Get status name to check if declined
  const statusSelect = document.getElementById("editStatus");
  const statusName = statusSelect.options[statusSelect.selectedIndex].text;
  
  // Validate: if declined, comment is required
  if (statusName.toLowerCase().includes("declined") && !managerComment.trim()) {
    alert("Manager comment is required when declining a ticket!");
    return;
  }

  // Ensure IDs are strings
  const updateData = {
    status_id: String(statusId),
    manager_id: String(localStorage.getItem("user_id")),
    manager_comment: managerComment.trim() || null
  };

  try {
    await apiRequest(`/tickets/${ticketId}`, "PATCH", updateData);
    alert("Ticket updated successfully!");
    closeEditTicketModal();
    loadTeamMemberTickets();
  } catch (err) {
    console.error("Error updating ticket:", err);
    alert("Error updating ticket: " + err.message);
  }
}

/* =========================================================
   📝 LOAD STATUS DROPDOWN FOR EDIT MODAL
   ========================================================= */
async function loadEditStatusDropdown(currentStatusId) {
  try {
    const statuses = await apiRequest("/ticket-status");
    const statusSelect = document.getElementById("editStatus");
    
    // Only show Approved-Awaiting Assistance and Declined statuses
    const allowedStatuses = statuses.filter(s => 
      s.status_name.toLowerCase().includes("approved") || 
      s.status_name.toLowerCase().includes("declined")
    );
    
    statusSelect.innerHTML = "";
    allowedStatuses.forEach(s => {
      const selected = s.status_id === currentStatusId ? "selected" : "";
      statusSelect.innerHTML += `<option value="${s.status_id}" ${selected}>${s.status_name}</option>`;
    });
  } catch (err) {
    console.error("Error loading statuses:", err);
  }
}

/* =========================================================
   👥 LOAD TEAM MEMBERS
   ========================================================= */
async function loadTeamMembers() {
  const deptId = localStorage.getItem("department_id");
  try {
    const members = await apiRequest(`/user/department/${deptId}`);
    const tbody = document.getElementById("teamMembersTableBody");
    tbody.innerHTML = "";

    // Update statistics
    const totalEl = document.getElementById("totalMembers");
    const activeEl = document.getElementById("activeMembers");
    const managerEl = document.getElementById("managerCount");

    if (totalEl) totalEl.textContent = members.length;
    if (activeEl) activeEl.textContent = members.length; // Assuming all are active
    if (managerEl) {
      const managerCount = members.filter(m => 
        m.role?.role_name.toLowerCase().includes("manager")
      ).length;
      managerEl.textContent = managerCount;
    }

    // Apply role filter
    const roleFilter = document.getElementById("roleFilter")?.value || "all";
    let filteredMembers = members;

    if (roleFilter !== "all") {
      filteredMembers = members.filter(m => 
        m.role?.role_name.toLowerCase() === roleFilter.toLowerCase()
      );
    }

    filteredMembers.forEach(member => {
      const row = `
        <tr>
          <td>${member.name}</td>
          <td>${member.surname}</td>
          <td>${member.email}</td>
          <td><span class="badge bg-primary">${member.role?.role_name || 'N/A'}</span></td>
          <td>${member.department?.department_name || 'N/A'}</td>
        
        </tr>`;
      tbody.innerHTML += row;
    });

  } catch (err) {
    console.error("Error loading team members:", err);
    alert("Error loading team members: " + err.message);
  }
}

/* =========================================================
   👁️ VIEW MEMBER DETAILS
   ========================================================= */
function viewMemberDetails(userId) {
  // This can be extended to show more details
  console.log("Viewing details for user:", userId);
  alert("Member details view - To be implemented");
}

/* =========================================================
   📊 LOAD DROPDOWNS (categories, priorities, statuses)
   ========================================================= */
async function loadDropdowns() {
  // Verify token exists before making requests
  if (!token) {
    console.error("No authentication token found");
    alert("Authentication required. Please login again.");
    window.location.href = "../../index.html";
    return;
  }

  try {
    // All requests now use apiRequest which includes Bearer token
    const [categories, priorities, statuses] = await Promise.all([
      apiRequest("/ticket-category"),
      apiRequest("/ticket-priorities"),
      apiRequest("/ticket-status"),
    ]);

    // Load Categories
    const categorySelect = document.getElementById("category");
    if (categorySelect) {
      categorySelect.innerHTML = '<option value="">Select a category...</option>';
      categories.forEach(c => {
        categorySelect.innerHTML += `<option value="${c.category_id}">${c.name}</option>`;
      });
    }

    // Load Priorities
    const prioritySelect = document.getElementById("priority");
    if (prioritySelect) {
      prioritySelect.innerHTML = '<option value="">Select priority level...</option>';
      priorities.forEach(p => {
        prioritySelect.innerHTML += `<option value="${p.priority_id}">${p.name}</option>`;
      });
    }

    // Load Statuses (if needed)
    const statusSelect = document.getElementById("status");
    if (statusSelect) {
      statusSelect.innerHTML = '<option value="">Select status...</option>';
      statuses.forEach(s => {
        statusSelect.innerHTML += `<option value="${s.status_id}">${s.status_name}</option>`;
      });
    }

    console.log("Dropdowns loaded successfully with authentication");
  } catch (err) {
    console.error("Error loading dropdowns:", err);
    
    // Handle 401 Unauthorized specifically
    if (err.message.includes("401")) {
      alert("Session expired. Please login again.");
      localStorage.clear();
      window.location.href = "../../index.html";
    } else {
      alert("Failed to load form options. Please refresh the page.");
    }
  }
}

/* =========================================================
   🔎 HELPER: get status ID by name
   ========================================================= */
async function getStatusIdByName(statusName) {
  // Uses apiRequest which includes Bearer token
  const statuses = await apiRequest("/ticket-status");
  const found = statuses.find(s => s.status_name.toLowerCase() === statusName.toLowerCase());
  if (!found) {
    throw new Error(`Status "${statusName}" not found`);
  }
  return found.status_id;
}


/* =========================================================
   📈 DASHBOARD METRICS & CHARTS
   ========================================================= */

/**
 * Fetch department tickets and update dashboard stats + chart
 */
async function loadDashboardMetrics() {
  const deptId = localStorage.getItem("department_id");
  try {
    const tickets = await apiRequest(`/tickets/department/${deptId}`);

    // Calculate metrics
    const metrics = calculateTicketMetrics(tickets);

    // Update number cards
    document.getElementById("totalTickets").textContent = metrics.total;
    document.getElementById("resolvedTickets").textContent = metrics.completed;
    document.getElementById("pendingTickets").textContent = metrics.pending;
    document.getElementById("highPriority").textContent = metrics.highPriority;

    // Render chart
    renderStatusChart(metrics);
  } catch (err) {
    console.error("Error loading dashboard metrics:", err);
    alert("Failed to load dashboard data: " + err.message);
  }
}

/**
 * Calculate summary data from tickets
 */
function calculateTicketMetrics(tickets) {
  const metrics = {
    total: tickets.length,
    approved: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    highPriority: 0
  };

  tickets.forEach(t => {
    const status = t.status?.status_name?.toLowerCase() || "";
    const priority = t.priority?.name?.toLowerCase() || "";

    if (status.includes("approved") || status.includes("awaiting")) metrics.approved++;
    if (status.includes("completed")) metrics.completed++;
    if (status.includes("progress")) metrics.inProgress++;
    if (status.includes("pending")) metrics.pending++;

    if (priority.includes("high") || priority.includes("critical")) metrics.highPriority++;
  });

  return metrics;
}

/**
 * Render Chart.js doughnut chart for ticket status distribution
 */
let statusChartInstance = null;
function renderStatusChart(metrics) {
  const ctx = document.getElementById("statusChart")?.getContext("2d");
  if (!ctx) return; // Chart element doesn't exist on this page

  const data = {
    labels: [
      "Approved-Awaiting Assistance",
      "In Progress",
      "Pending Approval",
      "Completed"
    ],
    datasets: [{
      label: "Ticket Status",
      data: [
        metrics.approved,
        metrics.inProgress,
        metrics.pending,
        metrics.completed
      ],
      backgroundColor: [
        "#3b82f6", // blue - approved
        "#2563eb", // deep blue - in progress
        "#f59e0b", // orange - pending
        "#10b981"  // green - completed
      ],
      borderColor: "#fff",
      borderWidth: 2,
      hoverOffset: 10
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed}` } }
    }
  };

  // Destroy previous chart if exists
  if (statusChartInstance) {
    statusChartInstance.destroy();
  }

  statusChartInstance = new Chart(ctx, {
    type: "doughnut",
    data,
    options
  });
}

/* =========================================================
   🚀 SMART PAGE INITIALIZATION
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  // Check which elements exist on the page to determine which functions to call
  
  // Dashboard page (has statusChart)
  if (document.getElementById("statusChart")) {
    loadDashboardMetrics();
  }
  
  // Create ticket page (has category and priority dropdowns)
  if (document.getElementById("category") || document.getElementById("priority")) {
    loadDropdowns();
  }
  
  // My tickets page (has myTicketsTableBody)
  if (document.getElementById("myTicketsTableBody")) {
    loadMyTickets();
  }
  
  // Team tickets page (has teamTicketsTableBody)
  if (document.getElementById("teamTicketsTableBody")) {
    loadDropdowns(); // Load dropdowns for filters
    loadTeamMemberTickets();
  }
  
  // Team members page (has teamMembersTableBody)
  if (document.getElementById("teamMembersTableBody")) {
    loadTeamMembers();
  }
});