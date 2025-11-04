const token = localStorage.getItem("token");
const departmentId = localStorage.getItem("department_id");

// Fetch Tickets by Department
async function fetchTickets() {
  const res = await fetch(`http://localhost:3000/api/tickets/department/${departmentId}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return res.json();
}

// Render Table
function renderTickets(tickets) {
  const tbody = document.querySelector("#ticketsTable tbody");
  tbody.innerHTML = "";
  tickets.forEach(ticket => {
    const row = `
      <tr>
        <td>${ticket.ticket_number}</td>
        <td>${ticket.requester?.name} ${ticket.requester?.surname}</td>
        <td>${ticket.category?.name || ""}</td>
        <td>${ticket.description}</td>
        <td>${ticket.priority?.name}</td>
        <td>${ticket.status?.status_name}</td>
        <td>${new Date(ticket.created_at).toLocaleString()}</td>
        <td>${new Date(ticket.updated_at).toLocaleString()}</td>
        <td>${ticket.closed_at ? new Date(ticket.closed_at).toLocaleString() : ""}</td>
        <td>${ticket.cancelled_at ? new Date(ticket.cancelled_at).toLocaleString() : ""}</td>
        <td>
          <button class="btn btn-info btn-sm" onclick="viewTicket('${ticket.ticket_id}')">View</button>
          <button class="btn btn-warning btn-sm" onclick="editTicket('${ticket.ticket_id}', '${ticket.status?.status_name}')">Edit</button>
        </td>
      </tr>`;
    tbody.insertAdjacentHTML("beforeend", row);
  });
}

// Search
document.getElementById("searchInput").addEventListener("keyup", function() {
  const search = this.value.toLowerCase();
  document.querySelectorAll("#ticketsTable tbody tr").forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(search) ? "" : "none";
  });
});

// View Ticket
async function viewTicket(ticketId) {
  const res = await fetch(`http://localhost:3000/api/tickets/${ticketId}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const ticket = await res.json();
  document.getElementById("viewBody").innerHTML = `
    <p><strong>Ticket #:</strong> ${ticket.ticket_number}</p>
    <p><strong>Requester:</strong> ${ticket.requester?.name} ${ticket.requester?.surname}</p>
    <p><strong>Category:</strong> ${ticket.category?.name || ""}</p>
    <p><strong>Description:</strong> ${ticket.description}</p>
    <p><strong>Priority:</strong> ${ticket.priority?.name}</p>
    <p><strong>Status:</strong> ${ticket.status?.status_name}</p>
    <p><strong>Manager Comment:</strong> ${ticket.manager_comment || ""}</p>
    <p><strong>Created At:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
    <p><strong>Updated At:</strong> ${new Date(ticket.updated_at).toLocaleString()}</p>
  `;
  new bootstrap.Modal(document.getElementById("viewModal")).show();
}

// Edit Ticket
function editTicket(ticketId, currentStatus) {
  document.getElementById("editTicketId").value = ticketId;
  document.getElementById("editStatus").value = currentStatus === "Approved" ? "Approved" : "Declined";
  document.getElementById("editComment").value = "";
  new bootstrap.Modal(document.getElementById("editModal")).show();
}

// Submit Edit
document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const ticketId = document.getElementById("editTicketId").value;
  const status = document.getElementById("editStatus").value;
  const comment = document.getElementById("editComment").value;

  await fetch(`http://localhost:3000/api/tickets/${ticketId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status: { status_name: status }, manager_comment: comment })
  });

  bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
  loadTickets();
});

// Submit Create
document.getElementById("createForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const category_id = document.getElementById("createCategoryId").value;
  const description = document.getElementById("createDescription").value;
  const priority_id = document.getElementById("createPriorityId").value;

  await fetch(`http://localhost:3000/api/tickets`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      category_id,
      description,
      priority_id,
      department_id: departmentId
    })
  });

  bootstrap.Modal.getInstance(document.getElementById("createModal")).hide();
  loadTickets();
});

// Load Tickets
async function loadTickets() {
  const tickets = await fetchTickets();
  renderTickets(tickets);
}

loadTickets();