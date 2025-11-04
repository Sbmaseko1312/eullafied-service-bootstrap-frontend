// manage-departments.js
checkAuth("Admin");

const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");
let departments = [];

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
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Load Departments
document.addEventListener("DOMContentLoaded", () => loadDepartments());

async function loadDepartments() {
  try {
    departments = await apiRequest("/department");
    displayUser();
    renderDepartments(departments);
  } catch (err) {
    alert("Error loading departments: " + err.message);
  }
}

function renderDepartments(list) {
  const tbody = document.getElementById("deptTableBody");
  tbody.innerHTML = "";

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">No departments found</td></tr>`;
    return;
  }

  list.forEach((dept, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td><i class="fas fa-building" style="margin-right: 8px; color: #2563eb;"></i>${dept.department_name}</td>
  
      <td>${new Date(dept.createdAt || Date.now()).toISOString().split('T')[0]}</td>
      <td>
        <button class="btn-warning" onclick="editDept('${dept.department_id}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn-danger" onclick="deleteDept('${dept.department_id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Modal Controls
function openAddDeptModal() {
  document.getElementById("modalTitle").textContent = "Add Department";
  document.getElementById("deptForm").reset();
  document.getElementById("deptId").value = "";

  const modal = document.getElementById("deptModal");
  modal.classList.add("show");
  document.body.classList.add("modal-open");

  setTimeout(() => document.getElementById("deptName").focus(), 50);
}

function closeDeptModal() {
  document.getElementById("deptModal").classList.remove("show");
  document.body.classList.remove("modal-open");
}

// Edit
async function editDept(id) {
  try {
    const dept = await apiRequest(`/department/${id}`);

    document.getElementById("modalTitle").textContent = "Edit Department";
    document.getElementById("deptId").value = dept.department_id;
    document.getElementById("deptName").value = dept.department_name;

    document.getElementById("deptModal").classList.add("show");
    document.body.classList.add("modal-open");

    setTimeout(() => document.getElementById("deptName").focus(), 50);
  } catch (err) {
    alert("Failed to fetch department: " + err.message);
  }
}

// Save (Add/Edit)
async function saveDept() {
  const id = document.getElementById("deptId").value;
  const name = document.getElementById("deptName").value.trim();
  if (!name) return alert("Department name required");

  try {
    if (id) {
      await apiRequest(`/department/${id}`, "PATCH", { department_name: name });
    } else {
      await apiRequest("/department", "POST", { department_name: name });
    }
    closeDeptModal();
    loadDepartments();
  } catch (err) {
    alert("Save failed: " + err.message);
  }
}

// Delete
async function deleteDept(id) {
  if (!confirm("Are you sure?")) return;
  try {
    await apiRequest(`/department/${id}`, "DELETE");
    loadDepartments();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}

// Search
function searchDepartments() {
  const term = document.getElementById("searchInput").value.toLowerCase();
  renderDepartments(departments.filter(d => d.department_name.toLowerCase().includes(term)));
}

// UX: Close Modal via click-outside + ESC
document.addEventListener("mousedown", (e) => {
  const overlay = document.getElementById("deptModal");
  const content = overlay.querySelector(".modal");
  if (overlay.classList.contains("show") &&
      e.target === overlay &&
      !content.contains(e.target)) {
    closeDeptModal();
  }
});


function displayUser() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const usernameEl = document.getElementById('username');
  if (usernameEl && user.name) {
    usernameEl.textContent = `${user.name} ${user.surname || ''}`.trim();
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" &&
      document.getElementById("deptModal").classList.contains("show")) {
    closeDeptModal();
  }
});
