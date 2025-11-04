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
  const departmentId = localStorage.getItem("department_id"); // if stored on login
  const managerId = localStorage.getItem("user_id");

  const ticketData = {
    description,
    category_id: categoryId,
    priority_id: priorityId,
    department_id: departmentId,
    manager_id: managerId,
    status_id: await getStatusIdByName("Approved"), // sets default Approved status
    requester_id: managerId,
  };

  try {
    const ticket = await apiRequest("/tickets", "POST", ticketData);
    alert("Ticket created successfully!");
    console.log(ticket);
  } catch (err) {
    console.error("Failed to create ticket:", err);
    alert("Error creating ticket!");
  }
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
    await apiRequest(`/tickets/${ticketId}`, "PATCH", {
      cancelled_at: new Date(),
      status_id: await getStatusIdByName("Cancelled"),
    });
    alert("Ticket cancelled!");
    loadMyTickets();
  } catch (err) {
    console.error("Error cancelling ticket:", err);
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

    tickets.forEach(t => {
      if (t.status.status_name === "Pending") {
        const row = `
          <tr>
            <td>${t.ticket_number}</td>
            <td>${t.requester?.name} ${t.requester?.surname}</td>
            <td>${t.description}</td>
            <td>${t.priority?.name}</td>
            <td>${t.status?.status_name}</td>
            <td>
              <button class="btn btn-success btn-sm" onclick="updateTicketStatus('${t.ticket_id}', 'Approved')">Approve</button>
              <button class="btn btn-warning btn-sm" onclick="updateTicketStatus('${t.ticket_id}', 'Declined')">Decline</button>
            </td>
          </tr>`;
        tbody.innerHTML += row;
      }
    });
  } catch (err) {
    console.error("Error loading team tickets:", err);
  }
}

/* =========================================================
   🔁 UPDATE STATUS (approve / decline)
   ========================================================= */
async function updateTicketStatus(ticketId, newStatusName) {
  try {
    const statusId = await getStatusIdByName(newStatusName);
    await apiRequest(`/tickets/${ticketId}`, "PATCH", {
      status_id: statusId,
      manager_approved_at: new Date(),
    });
    alert(`Ticket ${newStatusName}!`);
    loadTeamMemberTickets();
  } catch (err) {
    console.error(`Error updating status to ${newStatusName}:`, err);
  }
}

/* =========================================================
   📊 LOAD DROPDOWNS (priority, status)
   ========================================================= */
async function loadDropdowns() {
  try {
    const [priorities, statuses] = await Promise.all([
      apiRequest("/ticket-priority"),
      apiRequest("/ticket-status"),
    ]);

    const prioritySelect = document.getElementById("priority");
    const statusSelect = document.getElementById("status");

    priorities.forEach(p => {
      prioritySelect.innerHTML += `<option value="${p.priority_id}">${p.name}</option>`;
    });

    statuses.forEach(s => {
      statusSelect.innerHTML += `<option value="${s.status_id}">${s.status_name}</option>`;
    });
  } catch (err) {
    console.error("Error loading dropdowns:", err);
  }
}

/* =========================================================
   🔎 HELPER: get status ID by name
   ========================================================= */
async function getStatusIdByName(statusName) {
  const statuses = await apiRequest("/ticket-status");
  const found = statuses.find(s => s.status_name.toLowerCase() === statusName.toLowerCase());
  return found ? found.status_id : null;
}
