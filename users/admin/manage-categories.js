// manage-categories.js
checkAuth("Admin");

const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");
let categories = [];

// API Request
async function apiRequest(url, method = "GET", body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${url}`, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Load Categories
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  displayUser();
});

async function loadCategories() {
  try {
    categories = await apiRequest("/ticket-category");
    renderCategories(categories);
  } catch (err) {
    alert("Failed to load categories: " + err.message);
  }
}

function renderCategories(list) {
  const tbody = document.getElementById("categoriesTableBody");
  tbody.innerHTML = "";

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="2" class="text-center py-4">No categories found</td></tr>`;
    return;
  }

  list.forEach(cat => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${cat.name}</td>
      <td>
        <button class="btn-warning" onclick="editCategory('${cat.category_id}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn-danger" onclick="deleteCategory('${cat.category_id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Open Modal
function openAddCategoryModal() {
  document.getElementById("modalTitle").textContent = "Add Category";
  document.getElementById("categoryForm").reset();
  document.getElementById("categoryId").value = "";

  const modal = document.getElementById("categoryModal");
  modal.classList.add("show");
  document.body.classList.add("modal-open");

  setTimeout(() => document.getElementById("categoryName").focus(), 50);
}

// Close Modal
function closeCategoryModal() {
  const modal = document.getElementById("categoryModal");
  modal.classList.remove("show");
  document.body.classList.remove("modal-open");
}

// Edit Category
async function editCategory(id) {
  try {
    const category = await apiRequest(`/ticket-category/${id}`);

    document.getElementById("modalTitle").textContent = "Edit Category";
    document.getElementById("categoryId").value = category.category_id;
    document.getElementById("categoryName").value = category.name;

    document.getElementById("categoryModal").classList.add("show");
    document.body.classList.add("modal-open");

    setTimeout(() => document.getElementById("categoryName").focus(), 50);
  } catch (err) {
    alert("Failed to fetch category: " + err.message);
  }
}

// Save (Create/Update)
async function saveCategory() {
  const id = document.getElementById("categoryId").value;
  const name = document.getElementById("categoryName").value.trim();
  if (!name) return alert("Category name required");

  try {
    if (id) {
      await apiRequest(`/ticket-category/${id}`, "PATCH", { name });
    } else {
      await apiRequest("/ticket-category", "POST", { name });
    }
    closeCategoryModal();
    loadCategories();
  } catch (err) {
    alert("Save failed: " + err.message);
  }
}

// Delete
async function deleteCategory(id) {
  if (!confirm("Are you sure?")) return;
  try {
    await apiRequest(`/ticket-category/${id}`, "DELETE");
    loadCategories();
  } catch (err) {
    alert("Failed to delete: " + err.message);
  }
}

// Search
function searchCategories() {
  const term = document.getElementById("searchInput").value.toLowerCase();
  renderCategories(categories.filter(c => c.name.toLowerCase().includes(term)));
}

// Close modal via outside click + ESC
document.addEventListener("mousedown", (e) => {
  const overlay = document.getElementById("categoryModal");
  const modal = overlay.querySelector(".modal");
  if (overlay.classList.contains("show") && e.target === overlay) {
    closeCategoryModal();
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
      document.getElementById("categoryModal").classList.contains("show")) {
    closeCategoryModal();
  }
});
