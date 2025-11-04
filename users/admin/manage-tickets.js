checkAuth("Admin");

const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");

if (!token) {
    alert("You are not logged in!");
    window.location.href = "../../index.html";
}

let tickets = []; // all tickets
let filteredTickets = [];

// --- Generic API Helper ---
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
    if (!response.ok) throw new Error(`Error ${response.status}: ${await response.text()}`);
    return await response.json();
}

// --- Fetch all tickets and populate filters ---
async function loadTickets() {
    try {
        tickets = await apiRequest("/tickets"); // adjust API endpoint
        filteredTickets = tickets;
        renderTickets(filteredTickets);
        populateFilters(tickets);
    
    } catch (err) {
        console.error(err);
        alert("Failed to load tickets.");
    }
}

// --- Render tickets in table ---
function renderTickets(data) {
    const tbody = document.getElementById("ticketsTableBody");
    tbody.innerHTML = "";

    data.forEach(ticket => {
        const tr = document.createElement("tr");

        const ticketNumber = ticket.ticket_number || "-";
        const requester = ticket.requester ? `${ticket.requester.name} ${ticket.requester.surname}` : "-";
        const description = ticket.description || "-";
        const category = ticket.category ? ticket.category.name : "-";
        const priority = ticket.priority ? ticket.priority.name : "-";
        const status = ticket.status ? ticket.status.status_name : "-";
        const department = ticket.department ? ticket.department.department_name : "-";
        const createdAt = ticket.created_at ? new Date(ticket.created_at).toLocaleString() : "-";

        tr.innerHTML = `
      <td>${ticketNumber}</td>
      <td>${requester}</td>
      <td>${description}</td>
      <td>${category}</td>
      <td>${priority}</td>
      <td>${status}</td>
      <td>${createdAt}</td>
    `;

        tbody.appendChild(tr);
    });
}

// --- Populate filter dropdowns dynamically ---
function populateFilters(data) {
  const statusSet = new Set();
  const prioritySet = new Set();
  const deptSet = new Set();

  data.forEach(t => {
    if (t.status?.status_name) statusSet.add(t.status.status_name);
    if (t.priority?.name) prioritySet.add(t.priority.name);
    if (t.department?.department_name) deptSet.add(t.department.department_name);
  });

  addOptions("statusFilter", ["All Status", ...statusSet]);
  addOptions("priorityFilter", ["All Priorities", ...prioritySet]);
  addOptions("deptFilter", ["All Departments", ...deptSet]);
}

function addOptions(selectId, options) {
  const select = document.getElementById(selectId);
  select.innerHTML = ""; // clear existing options
  options.forEach(opt => {
    const el = document.createElement("option");
    el.value = opt.startsWith("All") ? "all" : opt;
    el.textContent = opt;
    select.appendChild(el);
  });
}

// --- Filter tickets based on search and dropdowns ---
function filterTickets() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const priority = document.getElementById("priorityFilter").value;
  const dept = document.getElementById("deptFilter").value;

  filteredTickets = tickets.filter(t => {
    const matchesStatus = status === "all" || t.status?.status_name === status;
    const matchesPriority = priority === "all" || t.priority?.name === priority;
    const matchesDept = dept === "all" || t.department?.department_name === dept;
    const matchesSearch =
      t.description?.toLowerCase().includes(searchTerm) ||
      t.requester?.name.toLowerCase().includes(searchTerm) ||
      t.requester?.surname.toLowerCase().includes(searchTerm);

    return matchesStatus && matchesPriority && matchesDept && matchesSearch;
  });

  renderTickets(filteredTickets);
}

// --- Search input triggers filtering ---
function searchTickets() {
  filterTickets();
}

// --- Logout ---
function logout() {
  if (confirm("Are you sure?")) {
    localStorage.removeItem("user");
    window.location.href = "../../index.html";
  }
}

function displayUser() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const usernameEl = document.getElementById('username');
  if (usernameEl && user.name) {
    usernameEl.textContent = `${user.name} ${user.surname || ''}`.trim();
  }
}

// --- Attach event listeners ---
document.getElementById("searchInput").addEventListener("input", searchTickets);
document.getElementById("statusFilter").addEventListener("change", filterTickets);
document.getElementById("priorityFilter").addEventListener("change", filterTickets);
document.getElementById("deptFilter").addEventListener("change", filterTickets);

// --- Initialize page ---
loadTickets();
    displayUser();