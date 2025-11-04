//manage-assignments.js
checkAuth("Admin");

const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");
let assignments = [];
let users = [];
let tickets = [];

// ===== Generic API helper =====
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
  return await res.json();
}

// ===== Page Load =====
document.addEventListener("DOMContentLoaded", loadData);

async function loadData() {
  try {
    // Fetch assignments and tickets as usual
    [assignments, tickets] = await Promise.all([
      apiRequest("/ticket-assignment"),
      apiRequest("/tickets"),
    ]);

    // Fetch only users in IT department
    users = await apiRequest("/user/department/9ba08d7a-5689-49bb-b7e3-fe778321ca4f");

    displayUser();
    populateFilters();
    populateTicketSelect();
    populateUserSelect();
    displayAssignments(assignments);
  } catch (err) {
    alert("Failed to load data: " + err.message);
  }
}

// ===== Display =====
function displayAssignments(list) {
  const tbody = document.getElementById("assignmentsTableBody");
  tbody.innerHTML = "";

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:40px; color:#64748b;">
          <i class="fas fa-inbox" style="font-size:48px; opacity:0.5;"></i>
          <div>No assignments found</div>
        </td>
      </tr>`;
    return;
  }

  list.forEach(a => {
    const assignedDate = a.assigned_at ? new Date(a.assigned_at).toLocaleString() : "N/A";
    const unassignedDate = a.unassigned_at ? new Date(a.unassigned_at).toLocaleString() : "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.assignment_id.substring(0, 8)}...</td>
      <td>${a.ticket.ticket_number}</td>
      <td>${a.assigned_to.name} ${a.assigned_to.surname}</td>
      <td>${assignedDate}</td>
      <td>${unassignedDate}</td>
      <td>
        <button class="btn-warning" onclick="editAssignment('${a.assignment_id}')"><i class="fas fa-edit"></i> Edit</button>
        <button class="btn-danger" onclick="deleteAssignment('${a.assignment_id}')"><i class="fas fa-trash"></i> Delete</button>
        <button class="btn-secondary" onclick="unassignTicket('${a.assignment_id}')"><i class="fas fa-times"></i> Unassign</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ===== Populate filters & selects =====
function populateFilters() {
  const userFilter = document.getElementById("userFilter");
  userFilter.innerHTML = `<option value="all">All Users</option>`;
  users.forEach(u => {
    userFilter.innerHTML += `<option value="${u.user_id}">${u.name} ${u.surname}</option>`;
  });
}

function populateTicketSelect() {
  const select = document.getElementById("assignmentTicket");
  select.innerHTML = `<option value="">Select ticket...</option>`;
  tickets.forEach(t => {
    select.innerHTML += `<option value="${t.ticket_id}">${t.ticket_number}</option>`;
  });
}

function populateUserSelect() {
  const select = document.getElementById("assignmentUser");
  select.innerHTML = `<option value="">Select user...</option>`;

  // Users are already filtered server-side by IT department
  users.forEach(u => {
    select.innerHTML += `<option value="${u.user_id}">${u.name} ${u.surname}</option>`;
  });
}

// ===== Modal Functions =====
function openAddAssignmentModal() {
  document.getElementById("modalTitle").textContent = "New Assignment";
  document.getElementById("assignmentForm").reset();
  document.getElementById("assignmentId").value = "";
  document.getElementById("assignedAt").value = new Date().toISOString().slice(0, 16);
  document.getElementById("assignmentModal").classList.add("show");
  document.body.classList.add("modal-open");
}

function closeAssignmentModal() {
  document.getElementById("assignmentModal").classList.remove("show");
  document.body.classList.remove("modal-open");
  document.getElementById("assignmentForm").reset();
}

// ===== CRUD =====
async function saveAssignment() {
  const id = document.getElementById("assignmentId").value;
  const ticket_id = document.getElementById("assignmentTicket").value;
  const assigned_to = document.getElementById("assignmentUser").value;
  const assignment_reason = "Task assignment"; // can be dynamic if needed

  if (!ticket_id || !assigned_to)
    return alert("Ticket and user are required");

  try {
    if (id) {
      // ✅ PATCH (update existing)
      const updated = await apiRequest(`/ticket-assignment/${id}`, "PATCH", {
        ticket_id,
        assigned_to,
        assignment_reason,
      });
      assignments = assignments.map(a => (a.assignment_id === id ? updated : a));
      alert("Assignment updated successfully!");
    } else {
      // ✅ POST (create new)
      const created = await apiRequest("/ticket-assignment", "POST", {
        ticket_id,
        assigned_to,
        assignment_reason,
      });
      assignments.push(created);
      alert("Assignment created successfully!");
    }

    displayAssignments(assignments);
    closeAssignmentModal();
  } catch (err) {
    alert("Save failed: " + err.message);
  }
}


async function editAssignment(id) {
  const a = assignments.find(asg => asg.assignment_id === id);
  if (!a) return alert("Assignment not found");

  document.getElementById("modalTitle").textContent = "Edit Assignment";
  document.getElementById("assignmentId").value = a.assignment_id;
  document.getElementById("assignmentTicket").value = a.ticket.id;
  document.getElementById("assignmentUser").value = a.assigned_to.id;
  document.getElementById("assignedAt").value = new Date(a.assigned_at).toISOString().slice(0, 16);
  document.getElementById("unassignedAt").value = a.unassigned_at
    ? new Date(a.unassigned_at).toISOString().slice(0, 16)
    : "";

  document.getElementById("assignmentModal").classList.add("show");
  document.body.classList.add("modal-open");
}

async function deleteAssignment(id) {
  if (!confirm("Delete this assignment?")) return;
  try {
    await apiRequest(`/ticket-assignment/${id}`, "DELETE");
    assignments = assignments.filter(a => a.assignment_id !== id);
    displayAssignments(assignments);
    alert("Assignment deleted successfully!");
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}

async function unassignTicket(id) {
  if (!confirm("Unassign this ticket?")) return;
  try {
    await apiRequest(`/ticket-assignment/${id}`, "PATCH");
    const a = assignments.find(a => a.assignment_id === id);
    if (a) a.unassigned_at = new Date().toISOString();
    displayAssignments(assignments);
  } catch (err) {
    alert("Unassign failed: " + err.message);
  }
}

// ===== Search & Filter =====
function searchAssignments() {
  const term = document.getElementById("searchInput").value.toLowerCase();
  const filtered = assignments.filter(a =>
    a.ticket.ticket_number.toLowerCase().includes(term) ||
    `${a.assigned_to.name} ${a.assigned_to.surname}`.toLowerCase().includes(term)
  );
  filterAssignments(filtered);
}

function filterAssignments(filteredFromSearch = null) {
  let filtered = filteredFromSearch ? [...filteredFromSearch] : [...assignments];
  
  const user = document.getElementById("userFilter").value;
  const status = document.getElementById("assignmentStatusFilter").value;

  if (user !== "all") filtered = filtered.filter(a => a.assigned_to.id === user);
  if (status === "active") filtered = filtered.filter(a => !a.unassigned_at);
  else if (status === "completed") filtered = filtered.filter(a => a.unassigned_at);

  displayAssignments(filtered);
}


function displayUser() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const usernameEl = document.getElementById('username');
  if (usernameEl && user.name) {
    usernameEl.textContent = `${user.name} ${user.surname || ''}`.trim();
  }
}


// ===== Logout =====
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("token");
    window.location.href = "../../index.html";
  }
}
