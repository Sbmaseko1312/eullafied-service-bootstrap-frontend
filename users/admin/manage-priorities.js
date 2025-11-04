// manage-priorities.js

checkAuth("Admin");

const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");
let priorities = [];

// Generic API request
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
  return res.json();
}

// ===== Load Priorities =====
document.addEventListener("DOMContentLoaded", async () => {
  await loadPriorities();
});

async function loadPriorities() {
  try {
    priorities = await apiRequest("/ticket-priorities");
    displayUser();
    displayPriorities(priorities);
  } catch (err) {
    alert("Failed to load priorities: " + err.message);
  }
}

function displayPriorities(list) {
  const tbody = document.getElementById("prioritiesTableBody");
  tbody.innerHTML = "";

  if (!list.length) {
    tbody.innerHTML = `
      <tr><td colspan="3" class="text-center py-4">No priorities found</td></tr>
    `;
    return;
  }

  list.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.priority_id}</td>
      <td>${p.name}</td>
      <td>
        <button class="btn-warning" onclick="editPriority('${p.priority_id}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn-danger" onclick="deletePriority('${p.priority_id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ===== Modal Controls =====
function openAddPriorityModal() {
  document.getElementById("modalTitle").textContent = "Add Priority";
  document.getElementById("priorityForm").reset();
  document.getElementById("priorityId").value = "";

  const modal = document.getElementById("priorityModal");
  modal.classList.add("show");
  document.body.classList.add("modal-open");

  setTimeout(() => document.getElementById("priorityName").focus(), 50);
}

function closePriorityModal() {
  const modal = document.getElementById("priorityModal");
  modal.classList.remove("show");
  document.body.classList.remove("modal-open");
  document.getElementById("priorityForm").reset();
}

// ===== Edit Priority =====
function editPriority(id) {
  const p = priorities.find(x => x.priority_id === id);
  if (!p) return alert("Priority not found");

  document.getElementById("modalTitle").textContent = "Edit Priority";
  document.getElementById("priorityId").value = p.priority_id;
  document.getElementById("priorityName").value = p.name;

  const modal = document.getElementById("priorityModal");
  modal.classList.add("show");
  document.body.classList.add("modal-open");

  setTimeout(() => document.getElementById("priorityName").focus(), 50);
}

// ===== Save (Add / Edit) =====
async function savePriority() {
  const id = document.getElementById("priorityId").value;
  const name = document.getElementById("priorityName").value.trim();

  if (!name) return alert("Priority name required");

  try {
    if (id) {
      const updated = await apiRequest(`/ticket-priorities/${id}`, "PATCH", { name });
      priorities = priorities.map(p => p.priority_id === id ? updated : p);
    } else {
      const created = await apiRequest(`/ticket-priorities`, "POST", { name });
      priorities.push(created);
    }

    displayPriorities(priorities);
    closePriorityModal();

  } catch (err) {
    alert("Save failed: " + err.message);
  }
}

// ===== Delete =====
async function deletePriority(id) {
  if (!confirm("Are you sure you want to delete this priority?")) return;

  try {
    await apiRequest(`/ticket-priorities/${id}`, "DELETE");
    priorities = priorities.filter(p => p.priority_id !== id);
    displayPriorities(priorities);

  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}

// ===== Search =====
function searchPriorities() {
  const term = document.getElementById("searchInput").value.toLowerCase();
  displayPriorities(priorities.filter(p => p.name.toLowerCase().includes(term)));
}


function displayUser() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const usernameEl = document.getElementById('username');
  if (usernameEl && user.name) {
    usernameEl.textContent = `${user.name} ${user.surname || ''}`.trim();
  }
}

// ===== Extra UX — Close modal via outside click or ESC =====
document.addEventListener("mousedown", (e) => {
  const modalOverlay = document.getElementById("priorityModal");
  const modalContent = modalOverlay.querySelector(".modal");

  if (modalOverlay.classList.contains("show") &&
      !modalContent.contains(e.target) &&
      e.target === modalOverlay) {
    closePriorityModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" &&
      document.getElementById("priorityModal").classList.contains("show")) {
    closePriorityModal();
  }
});


