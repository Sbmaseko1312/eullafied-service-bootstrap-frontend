// manage-roles.js
// Check authentication first
checkAuth("Admin");

const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");

// Redirect if token missing
if (!token) {
  alert("You are not logged in!");
  window.location.href = "../../index.html";
}

// Generic API request helper
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

// Load roles on page load
document.addEventListener("DOMContentLoaded", async () => {
  await loadRoles();
});

// Load and display roles
async function loadRoles() {
  try {
    const roles = await apiRequest("/role", "GET");
    displayRoles(roles);
    displayUser();
  } catch (error) {
    console.error("Error loading roles:", error);
    alert("Failed to load roles: " + error.message);
  }
}

// Display roles in table
function displayRoles(roles) {
  const tbody = document.getElementById("rolesTableBody");
  tbody.innerHTML = "";

  if (!roles || roles.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 40px; color: #64748b;">
          <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
          <div>No roles found</div>
        </td>
      </tr>
    `;
    return;
  }

  roles.forEach((role) => {
    const row = document.createElement("tr");

    const badgeClass = getRoleBadgeClass(role.role_name);
    const createdDate = role.created_at
      ? new Date(role.created_at).toLocaleDateString()
      : "N/A";

    row.innerHTML = `
      <td>${role.role_id.substring(0, 8)}...</td>
      <td><span class="badge ${badgeClass}">${role.role_name}</span></td>
    
      <td>
        <button class="btn-warning" onclick="editRole('${role.role_id}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn-danger" onclick="deleteRole('${role.role_id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Badge color based on name
function getRoleBadgeClass(roleName) {
  const name = roleName.toLowerCase();
  if (name.includes("admin")) return "badge-danger";
  if (name.includes("manager")) return "badge-primary";
  if (name.includes("staff")) return "badge-success";
  if (name.includes("user")) return "badge-info";
  return "badge-secondary";
}

// ✅ Open Add Role Modal — fully fixed
function openAddRoleModal() {
  const modal = document.getElementById("roleModal");

  document.getElementById("modalTitle").textContent = "Add Role";
  document.getElementById("roleForm").reset();
  document.getElementById("roleId").value = "";

  modal.classList.add("show");
  document.body.classList.add("modal-open");

  setTimeout(() => document.getElementById("roleName").focus(), 50);
}

// ✅ Close modal
function closeRoleModal() {
  const modal = document.getElementById("roleModal");
  modal.classList.remove("show");
  document.body.classList.remove("modal-open");
  document.getElementById("roleForm").reset();
}

// ✅ Edit role + load data
async function editRole(roleId) {
  const modal = document.getElementById("roleModal");
  modal.classList.add("show");
  document.body.classList.add("modal-open");

  document.getElementById("modalTitle").textContent = "Edit Role";

  try {
    const role = await apiRequest(`/role/${roleId}`, "GET");

    document.getElementById("roleId").value = role.role_id;
    document.getElementById("roleName").value = role.role_name;

    setTimeout(() => document.getElementById("roleName").focus(), 50);

  } catch (error) {
    console.error("Error loading role:", error);
    alert("Failed to load role details");
  }
}

// ✅ Save role
async function saveRole() {
  const roleId = document.getElementById("roleId").value;
  const roleName = document.getElementById("roleName").value.trim();

  if (!roleName) {
    alert("Please enter a role name");
    return;
  }

  try {
    if (roleId) {
      await apiRequest(`/role/${roleId}`, "PATCH", { role_name: roleName });
      alert("Role updated successfully!");
    } else {
      await apiRequest("/role", "POST", { role_name: roleName });
      alert("Role created successfully!");
    }

    closeRoleModal();
    await loadRoles();

  } catch (error) {
    console.error("Error saving role:", error);
    alert("Failed to save role: " + error.message);
  }
}

// ✅ Delete role
async function deleteRole(roleId) {
  if (!confirm("Delete this role?")) return;

  try {
    await apiRequest(`/role/${roleId}`, "DELETE");
    alert("Role deleted successfully!");
    await loadRoles();

  } catch (error) {
    console.error("Error deleting role:", error);
    alert("Failed to delete role: " + error.message);
  }
}

// ✅ Search roles client-side
function searchRoles() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const rows = document.querySelectorAll("#rolesTableBody tr");

  rows.forEach((row) => {
    const roleNameCell = row.querySelector("td:nth-child(2)");
    const roleName = roleNameCell ? roleNameCell.textContent.toLowerCase() : "";
    row.style.display = roleName.includes(searchTerm) ? "" : "none";
  });
}

// ✅ Logout function
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("token");
    window.location.href = "../../index.html";
  }
}

// ✅ Close modal on outside click
document.addEventListener("mousedown", (e) => {
  const modalOverlay = document.getElementById("roleModal");
  const modalContent = modalOverlay.querySelector(".modal");

  if (modalOverlay.classList.contains("show") &&
      !modalContent.contains(e.target) &&
      e.target === modalOverlay) {
    closeRoleModal();
  }
});

// ✅ Close modal on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" &&
      document.getElementById("roleModal").classList.contains("show")) {
    closeRoleModal();
  }
});

function displayUser() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const usernameEl = document.getElementById('username');
  if (usernameEl && user.name) {
    usernameEl.textContent = `${user.name} ${user.surname || ''}`.trim();
  }
}