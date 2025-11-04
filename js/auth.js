function checkAuth(expectedRole) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== expectedRole) {
    window.location.href = "../../index.html";
  }
}

function logout() {
  localStorage.clear();
  window.location.href = "../../index.html";
}
