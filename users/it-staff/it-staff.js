// it-staff.js
checkAuth("IT Staff");

const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");
let currentUser = null;
let allAssignments = [];
let ticketStatuses = [];

// Attach auth header for all fetch requests
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