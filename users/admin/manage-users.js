// // manage-users.js
// checkAuth("Admin");

// const API_BASE = "http://localhost:3000/api";
// const token = localStorage.getItem("token");

// let users = [];
// let roles = [];
// let departments = [];

// // Generic API request with JWT
// async function apiRequest(url, method = "GET", body = null) {
//   const options = {
//     method,
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//   };
//   if (body) options.body = JSON.stringify(body);

//   const response = await fetch(`${API_BASE}${url}`, options);
//   if (!response.ok) {
//     const text = await response.text();
//     throw new Error(`Error ${response.status}: ${text}`);
//   }
//   return await response.json();
// }

// // ===== Load initial data =====
// async function loadRoles() {
//   try {
//     roles = await apiRequest("/role");
//     const select = document.getElementById("userRole");
//     const filter = document.getElementById("roleFilter");
//     select.innerHTML = "";
//     filter.innerHTML = `<option value="all">All Roles</option>`;

//     roles.forEach(role => {
//       select.innerHTML += `<option value="${role.role_id}">${role.role_name}</option>`;
//       filter.innerHTML += `<option value="${role.role_id}">${role.role_name}</option>`;
//     });
//   } catch (err) {
//     alert("Failed to load roles: " + err.message);
//   }
// }

// async function loadDepartments() {
//   try {
//     departments = await apiRequest("/department");
//     const select = document.getElementById("userDept");
//     const filter = document.getElementById("deptFilter");
//     select.innerHTML = "";
//     filter.innerHTML = `<option value="all">All Departments</option>`;

//     departments.forEach(dept => {
//       select.innerHTML += `<option value="${dept.department_id}">${dept.department_name}</option>`;
//       filter.innerHTML += `<option value="${dept.department_id}">${dept.department_name}</option>`;
//     });
//   } catch (err) {
//     alert("Failed to load departments: " + err.message);
//   }
// }

// async function loadUsers() {
//   try {
//     users = await apiRequest("/user");
//     displayUsers(users);
//   } catch (err) {
//     alert("Failed to load users: " + err.message);
//   }
// }

// // ===== Display Users =====
// function displayUsers(userList) {
//   const tbody = document.getElementById("usersTableBody");
//   tbody.innerHTML = "";

//   userList.forEach(user => {
//     const tr = document.createElement("tr");
//     tr.innerHTML = `
//       <td>${user.name} ${user.surname}</td>
//       <td>${user.email}</td>
//       <td>${user.role?.role_name || "-"}</td>
//       <td>${user.department?.department_name || "-"}</td>
//       <td>${new Date(user.assigned_at).toISOString().split('T')[0]}</td>
//       <td>
//         <button class="btn-warning" onclick="editUser('${user.user_id}')"><i class="fas fa-edit"></i> Edit</button>
//         <button class="btn-danger" onclick="deleteUser('${user.user_id}')"><i class="fas fa-trash"></i> Delete</button>
//       </td>
//     `;
//     tbody.appendChild(tr);
//   });
// }

// // ===== Add / Edit User =====
// async function saveUser() {
//   const userId = document.getElementById("userId").value;
//   const payload = {
//     name: document.getElementById("userName").value.trim(),
//     surname: document.getElementById("userSurname").value.trim(),
//     email: document.getElementById("userEmail").value.trim(),
//     role_id: document.getElementById("userRole").value,
//     department_id: document.getElementById("userDept").value
//   };
//   const password = document.getElementById("userPassword").value.trim();
//   if (password) payload.password = password;

//   try {
//     if (userId) {
//       await apiRequest(`/user/${userId}`, "PATCH", payload);
//       alert("User updated successfully");
//     } else {
//       if (!password) return alert("Password is required for new users");
//       await apiRequest("/user", "POST", payload);
//       alert("User created successfully");
//     }
//     closeUserModal();
//     loadUsers();
//   } catch (err) {
//     alert("Failed to save user: " + err.message);
//   }
// }

// // ===== Edit User =====
// async function editUser(userId) {
//   try {
//     const user = await apiRequest(`/user/${userId}`);
//     document.getElementById("modalTitle").textContent = "Edit User";
//     document.getElementById("userId").value = user.user_id;
//     document.getElementById("userName").value = user.name;
//     document.getElementById("userSurname").value = user.surname;
//     document.getElementById("userEmail").value = user.email;
//     document.getElementById("userPassword").value = "";
//     document.getElementById("userRole").value = user.role?.role_id || "";
//     document.getElementById("userDept").value = user.department?.department_id || "";
//     document.getElementById("userModal").style.display = "flex";
//   } catch (err) {
//     alert("Failed to load user: " + err.message);
//   }
// }

// // ===== Delete User =====
// async function deleteUser(userId) {
//   if (!confirm("Are you sure you want to delete this user?")) return;
//   try {
//     await apiRequest(`/user/${userId}`, "DELETE");
//     alert("User deleted successfully");
//     loadUsers();
//   } catch (err) {
//     alert("Failed to delete user: " + err.message);
//   }
// }

// // ===== Search & Filter =====
// function searchUsers() {
//   const query = document.getElementById("searchInput").value.toLowerCase();
//   const filtered = users.filter(u =>
//     `${u.name} ${u.surname}`.toLowerCase().includes(query) ||
//     u.email.toLowerCase().includes(query)
//   );
//   displayUsers(filtered);
// }

// function filterUsers() {
//   const roleId = document.getElementById("roleFilter").value;
//   const deptId = document.getElementById("deptFilter").value;

//   let filtered = [...users];
//   if (roleId !== "all") filtered = filtered.filter(u => u.role?.role_id === roleId);
//   if (deptId !== "all") filtered = filtered.filter(u => u.department?.department_id === deptId);

//   displayUsers(filtered);
// }

// // ===== Modal =====
// function openAddUserModal() {
//   document.getElementById('modalTitle').textContent = 'Add User';
//   document.getElementById('userForm').reset();
//   document.getElementById('userId').value = '';
//   document.getElementById('userModal').style.display = 'flex';
// }
// function closeUserModal() {
//   document.getElementById('userModal').style.display = 'none';
// }

// // ===== Logout =====
// function logout() {
//   if (confirm("Are you sure you want to logout?")) {
//     localStorage.removeItem("token");
//     window.location.href = '../../login.html';
//   }
// }

// // ===== Initialize =====
// document.addEventListener("DOMContentLoaded", async () => {
//   await loadRoles();
//   await loadDepartments();
//   await loadUsers();
// });
checkAuth("Admin");

const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");

if (!token) {
  alert("You are not logged in!");
  window.location.href = "../../index.html";
}

let users = [];
let roles = [];
let departments = [];

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

// --- Load Data ---
document.addEventListener("DOMContentLoaded", async () => {
  await loadRoles();
  await loadDepartments();
  await loadUsers();
});

async function loadRoles() {
  roles = await apiRequest("/role");
  const roleSelect = document.getElementById("userRole");
  roleSelect.innerHTML = roles.map(r => `<option value="${r.role_id}">${r.role_name}</option>`).join("");
}

async function loadDepartments() {
  departments = await apiRequest("/department");
  const deptSelect = document.getElementById("userDept");
  deptSelect.innerHTML = departments.map(d => `<option value="${d.department_id}">${d.department_name}</option>`).join("");
}

async function loadUsers() {
  try {
    users = await apiRequest("/user");
    displayUsers(users);
    displayUser();
  } catch (err) {
    console.error(err);
    alert("Failed to load users: " + err.message);
  }
}

// --- Display Users ---
function displayUsers(list) {
  const tbody = document.getElementById("usersTableBody");
  tbody.innerHTML = "";

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#64748b;">
      <i class="fas fa-inbox" style="font-size:48px; opacity:0.5;"></i><div>No users found</div>
    </td></tr>`;
    return;
  }

  list.forEach(user => {
    const created = user.assigned_at ? new Date(user.assigned_at).toLocaleDateString() : "N/A";
    tbody.innerHTML += `
      <tr>
        <td>${user.name} ${user.surname}</td>
        <td>${user.email}</td>
        <td><span class="badge badge-primary">${user.role?.role_name || "-"}</span></td>
        <td>${user.department?.department_name || "-"}</td>
        <td>${created}</td>
        <td>
          <button class="btn-warning" onclick="editUser('${user.user_id}')"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn-danger" onclick="deleteUser('${user.user_id}')"><i class="fas fa-trash"></i> Delete</button>
        </td>
      </tr>`;
  });
}

// --- Search ---
function searchUsers() {
  const term = document.getElementById("searchInput").value.toLowerCase();
  const filtered = users.filter(u =>
    `${u.name} ${u.surname}`.toLowerCase().includes(term) ||
    u.email.toLowerCase().includes(term)
  );
  displayUsers(filtered);
}

// --- Modal ---
function openAddUserModal() {
  const modal = document.getElementById("userModal");
  document.getElementById("modalTitle").textContent = "Add User";
  document.getElementById("userForm").reset();
  document.getElementById("userId").value = "";
  modal.classList.add("show");
  document.body.classList.add("modal-open");
}

function closeUserModal() {
  const modal = document.getElementById("userModal");
  modal.classList.remove("show");
  document.body.classList.remove("modal-open");
}

// --- Save User ---
async function saveUser() {
  const id = document.getElementById("userId").value;
  const payload = {
    name: document.getElementById("userName").value.trim(),
    surname: document.getElementById("userSurname").value.trim(),
    password:"1234",
    email: document.getElementById("userEmail").value.trim(),
    role_id: document.getElementById("userRole").value,
    department_id: document.getElementById("userDept").value,
  };

  try {
    if (id) {
      await apiRequest(`/user/${id}`, "PATCH", payload);
      alert("User updated successfully!");
    } else {
      await apiRequest("/user", "POST", payload);
      alert("User created successfully!");
    }
    closeUserModal();
    await loadUsers();
  } catch (err) {
    alert("Failed to save user: " + err.message);
  }
}

// --- Edit ---
async function editUser(userId) {
  const user = await apiRequest(`/user/${userId}`);
  document.getElementById("modalTitle").textContent = "Edit User";
  document.getElementById("userId").value = user.user_id;
  document.getElementById("userName").value = user.name;
  document.getElementById("userSurname").value = user.surname;
  document.getElementById("userEmail").value = user.email;
  document.getElementById("userPassword").value = "";
  document.getElementById("userRole").value = user.role?.role_id || "";
  document.getElementById("userDept").value = user.department?.department_id || "";

  const modal = document.getElementById("userModal");
  modal.classList.add("show");
  document.body.classList.add("modal-open");
}

// --- Delete ---
async function deleteUser(id) {
  if (!confirm("Delete this user?")) return;
  await apiRequest(`/user/${id}`, "DELETE");
  alert("User deleted successfully!");
  await loadUsers();
}

// --- Logout ---
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("token");
    window.location.href = "../../index.html";
  }
}

// --- Modal Close via Click or Escape ---
document.addEventListener("mousedown", (e) => {
  const overlay = document.getElementById("userModal");
  if (overlay.classList.contains("show") && e.target === overlay) closeUserModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.getElementById("userModal").classList.contains("show")) closeUserModal();
});

function displayUser() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const usernameEl = document.getElementById('username');
  if (usernameEl && user.name) {
    usernameEl.textContent = `${user.name} ${user.surname || ''}`.trim();
  }
}