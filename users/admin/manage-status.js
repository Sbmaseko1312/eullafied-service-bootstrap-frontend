// manage-status.js
checkAuth("Admin");

const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");
let statuses = [];

// API Request wrapper
async function apiRequest(url, method = "GET", body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${url}`, opts);
  if (!res.ok) {
    throw new Error(await res.text());
  }

  if (res.status !== 204) {
    return res.json();
  }
}

// Load on ready
document.addEventListener("DOMContentLoaded", () => loadStatuses());

// Load statuses
async function loadStatuses() {
  try {
    statuses = await apiRequest("/ticket-status");
    renderStatuses(statuses);
    displayUser();
  } catch (err) {
    alert("Failed to load statuses: " + err.message);
  }
}

function renderStatuses(list) {
  const tbody = document.getElementById("statusTableBody");
  tbody.innerHTML = "";

  if (!list.length) {
    tbody.innerHTML =
      `<tr><td colspan="4" class="text-center py-4">No statuses found</td></tr>`;
    return;
  }

  list.forEach(st => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${st.status_id}</td>
      <td>${st.status_name}</td>
      <td>
        <button class="btn-warning" onclick="editStatus('${st.status_id}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn-danger" onclick="deleteStatus('${st.status_id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Open modal
function openAddStatusModal() {
  document.getElementById("modalTitle").textContent = "Add Status";
  document.getElementById("statusForm").reset();
  document.getElementById("statusId").value = "";

  const modal = document.getElementById("statusModal");
  modal.classList.add("show");
  document.body.classList.add("modal-open");
}

// Close modal
function closeStatusModal() {
  document.getElementById("statusModal").classList.remove("show");
  document.body.classList.remove("modal-open");
}

// Edit
async function editStatus(id) {
  try {
    const s = await apiRequest(`/ticket-status/${id}`);

    document.getElementById("modalTitle").textContent = "Edit Status";
    document.getElementById("statusId").value = s.status_id;
    document.getElementById("statusName").value = s.status_name;

    const modal = document.getElementById("statusModal");
    modal.classList.add("show");
    document.body.classList.add("modal-open");
  } catch (err) {
    alert("Failed to fetch status: " + err.message);
  }
}

// Save (Create/Update)
async function saveStatus() {
  const id = document.getElementById("statusId").value;
  const status_name = document.getElementById("statusName").value.trim();
  if (!status_name) return alert("Status name is required");

  try {
    if (id) {
      await apiRequest(`/ticket-status/${id}`, "PATCH", { status_name });
    } else {
      await apiRequest(`/ticket-status`, "POST", { status_name });
    }

    closeStatusModal();
    loadStatuses();
  } catch (err) {
    alert("Failed to save: " + err.message);
  }
}

// Delete
async function deleteStatus(id) {
  if (!confirm("Are you sure? This affects tickets!")) return;

  try {
    await apiRequest(`/ticket-status/${id}`, "DELETE");
    statuses = statuses.filter(s => s.status_id !== id);
    renderStatuses(statuses);
  } catch (err) {
    alert("Failed to delete: " + err.message);
  }
}

// Search
function searchStatus() {
  const term = document.getElementById("searchInput").value.toLowerCase();
  renderStatuses(
    statuses.filter(s => s.status_name.toLowerCase().includes(term))
  );
}

// Close modal on backdrop click
document.addEventListener("mousedown", (e) => {
  const overlay = document.getElementById("statusModal");
  const modal = overlay.querySelector(".modal");
  if (overlay.classList.contains("show") && e.target === overlay) {
    closeStatusModal();
  }
});

// Close modal via ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" &&
      document.getElementById("statusModal").classList.contains("show")) {
    closeStatusModal();
  }
});

function displayUser() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const usernameEl = document.getElementById('username');
  if (usernameEl && user.name) {
    usernameEl.textContent = `${user.name} ${user.surname || ''}`.trim();
  }
}