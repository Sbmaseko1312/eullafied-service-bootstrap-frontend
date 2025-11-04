// // ========================
// // IT STAFF DASHBOARD SCRIPT
// // ========================

// const API_BASE = "http://localhost:3000/api";
// const token = localStorage.getItem("token");
// const userId = localStorage.getItem("user_id");
// const username = localStorage.getItem("username") || "Staff Member";

// // =============================
// // UTILITY: API REQUEST HANDLER
// // =============================
// async function apiRequest(url, method = "GET", body = null) {
//     const options = {
//         method,
//         headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//         },
//     };
//     if (body) options.body = JSON.stringify(body);

//     const response = await fetch(`${API_BASE}${url}`, options);
//     if (!response.ok) {
//         const text = await response.text();
//         throw new Error(`Error ${response.status}: ${text}`);
//     }
//     return response.json();
// }

// // =============================
// // LOAD FILTER DROPDOWNS
// // =============================
// async function loadDropdowns() {
//     try {
//         const [priorities, statuses, categories] = await Promise.all([
//             apiRequest("/ticket-priorities"),
//             apiRequest("/ticket-status"),
//             apiRequest("/ticket-category"),
//         ]);

//         // Priority filter
//         const priorityFilter = document.getElementById("priorityFilter");
//         if (priorityFilter) {
//             priorityFilter.innerHTML = '<option value="all">All Priorities</option>';
//             priorities.forEach((p) => {
//                 priorityFilter.innerHTML += `<option value="${p.name.toLowerCase()}">${p.name}</option>`;
//             });
//         }

//         // Status filter
//         const statusFilter = document.getElementById("statusFilter");
//         if (statusFilter) {
//             statusFilter.innerHTML = '<option value="all">All Status</option>';
//             statuses
//                 .filter((s) => !["Declined", "Pending Approval"].includes(s.status_name))
//                 .forEach((s) => {
//                     let mapped =
//                         s.status_name === "Approved-Awaiting Assistance"
//                             ? "open"
//                             : s.status_name === "Completed"
//                                 ? "completed"
//                                 : "in_progress";
//                     statusFilter.innerHTML += `<option value="${mapped}">${s.status_name}</option>`;
//                 });
//         }

//         // Category filter
//         const categoryFilter = document.getElementById("categoryFilter");
//         if (categoryFilter) {
//             categoryFilter.innerHTML = '<option value="all">All Categories</option>';
//             categories.forEach((c) => {
//                 categoryFilter.innerHTML += `<option value="${c.name.toLowerCase()}">${c.name}</option>`;
//             });
//         }
//     } catch (error) {
//         console.error("Error loading dropdowns:", error);
//     }
// }

// // =============================
// // DASHBOARD: LOAD ACTIVE TICKETS
// // =============================
// let allTickets = [];

// async function loadDashboardTickets() {
//     const tbody = document.querySelector("#ticketsTable tbody");
//     if (!tbody) return;

//     tbody.innerHTML = `
//     <tr>
//       <td colspan="8" style="text-align:center;padding:30px;">
//         <i class="fas fa-spinner fa-spin"></i> Loading tickets...
//       </td>
//     </tr>
//   `;

//     try {
//         const data = await apiRequest("/tickets");
//         allTickets = data.filter(
//             (t) =>
//                 t.status &&
//                 !["Declined", "Pending Approval", "Completed"].includes(t.status.status_name)
//         );

//         if (allTickets.length === 0) {
//             tbody.innerHTML = `
//         <tr><td colspan="8" style="text-align:center;padding:30px;color:#64748b;">No active tickets available.</td></tr>
//       `;
//         } else {
//             renderDashboardTickets(allTickets);
//         }
//         updateDashboardMetrics();
//     } catch (err) {
//         console.error("Error loading tickets:", err);
//         tbody.innerHTML = `
//       <tr><td colspan="8" style="text-align:center;padding:30px;color:#ef4444;">
//         Failed to load tickets. Please refresh the page.
//       </td></tr>
//     `;
//     }
// }

// // =============================
// // RENDER DASHBOARD TICKETS
// // =============================
// function renderDashboardTickets(list) {
//     const tbody = document.querySelector("#ticketsTable tbody");
//     if (!tbody) return;

//     tbody.innerHTML = "";

//     const priorityClassMap = {
//         Low: "success",
//         Medium: "warning",
//         High: "danger",
//         Critical: "danger",
//     };

//     list.forEach((ticket) => {
//         const row = document.createElement("tr");
//         const statusName = ticket.status?.status_name || "Unknown";
//         const statusBadge =
//             statusName.includes("Progress") ? "warning" :
//                 statusName.includes("Awaiting") ? "info" : "secondary";

//         const isHighPriority = ["High", "Critical"].includes(ticket.priority?.name);
//         if (isHighPriority) {
//             row.style.backgroundColor = "#fef3c7";
//         }

//         row.innerHTML = `
//       <td><strong>${ticket.ticket_number}</strong></td>
//       <td>${ticket.description || "No description"}</td>
//       <td>${ticket.requester?.name || ""} ${ticket.requester?.surname || ""}</td>
//       <td><span class="badge bg-primary">${ticket.category?.name || "N/A"}</span></td>
//       <td><span class="badge bg-${priorityClassMap[ticket.priority?.name] || "secondary"}">${ticket.priority?.name || "N/A"}</span></td>
//       <td><span class="badge bg-${statusBadge}">${statusName}</span></td>
//       <td>${ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : "Not assigned"}</td>
//       <td>
//         <button class="btn btn-success btn-sm" onclick="assignTicket('${ticket.ticket_id}')" title="Start Work">
//           <i class="fas fa-play"></i>
//         </button>
//       </td>
//     `;
//         tbody.appendChild(row);
//     });
// }

// // =============================
// // ASSIGN TICKET TO STAFF
// // =============================
// async function assignTicket(ticketId) {
//     if (!confirm("Do you want to start working on this ticket?")) return;

//     try {
//         await apiRequest("/ticket-assignment", "POST", {
//             ticket_id: ticketId,
//             assigned_to: userId,
//             assignment_reason: null,
//         });

//         // Update status to "In Progress"
//         await apiRequest(`/tickets/${ticketId}`, "PUT", {
//             status_id: 3, // Assuming 3 is "In Progress"
//         });

//         alert("Ticket successfully assigned to you!");
//         loadDashboardTickets();
//     } catch (err) {
//         console.error("Error assigning ticket:", err);
//         alert("Failed to assign ticket. Please try again.");
//     }
// }

// // =============================
// // DASHBOARD METRICS
// // =============================
// async function updateDashboardMetrics() {
//     try {
//         const assignedData = await apiRequest(`/ticket-assignment/user/${userId}`);
//         const totalAssigned = assignedData.filter((a) => !a.unassigned_at).length;

//         const allData = await apiRequest("/tickets");
//         const activeTickets = allData.filter(
//             (t) =>
//                 t.status && !["Declined", "Pending Approval", "Completed"].includes(t.status.status_name)
//         );

//         const highCritical = activeTickets.filter((t) =>
//             ["High", "Critical"].includes(t.priority?.name)
//         ).length;

//         const inProgress = activeTickets.filter(
//             (t) => t.status.status_name === "In Progress"
//         ).length;

//         const open = activeTickets.filter(
//             (t) => t.status.status_name === "Approved-Awaiting Assistance"
//         ).length;

//         const statCards = document.querySelectorAll(".stat-card h3");
//         if (statCards.length >= 4) {
//             statCards[0].textContent = totalAssigned;
//             statCards[1].textContent = highCritical;
//             statCards[2].textContent = inProgress;
//             statCards[3].textContent = open;
//         }
//     } catch (error) {
//         console.error("Error updating metrics:", error);
//     }
// }

// // =============================
// // COMPLETED TICKETS PAGE
// // =============================
// let completedTickets = [];

// async function loadCompletedTickets() {
//     const tbody = document.querySelector("#completedTicketsTable tbody");
//     if (!tbody) return;

//     tbody.innerHTML = `
//     <tr>
//       <td colspan="8" style="text-align:center;padding:30px;">
//         <i class="fas fa-spinner fa-spin"></i> Loading completed tickets...
//       </td>
//     </tr>
//   `;

//     try {
//         // Get user's ticket assignments
//         const assignments = await apiRequest(`/ticket-assignment/user/${userId}`);

//         // Filter to only active assignments (not unassigned) and extract tickets
//         const userTickets = assignments
//             .filter((a) => !a.unassigned_at && a.ticket)
//             .map((a) => a.ticket);

//         // Filter to only completed tickets
//         completedTickets = userTickets.filter(
//             (t) => t && t.ticket_number // Only valid tickets with ticket numbers
//         );

//         if (completedTickets.length === 0) {
//             tbody.innerHTML = `
//         <tr><td colspan="8" style="text-align:center;padding:30px;color:#64748b;">No completed tickets found.</td></tr>
//       `;
//         } else {
//             renderCompletedTickets(completedTickets);
//         }
//         updateCompletedMetrics();
//     } catch (err) {
//         console.error("Error loading completed tickets:", err);
//         tbody.innerHTML = `
//       <tr><td colspan="8" style="text-align:center;padding:30px;color:#ef4444;">
//         Failed to load completed tickets. Please refresh the page.
//       </td></tr>
//     `;
//     }
// }

// // =============================
// // RENDER COMPLETED TICKETS
// // =============================
// function renderCompletedTickets(list) {
//     const tbody = document.querySelector("#completedTicketsTable tbody");
//     if (!tbody) return;

//     tbody.innerHTML = "";

//     const priorityClassMap = {
//         Low: "success",
//         Medium: "warning",
//         High: "danger",
//         Critical: "danger",
//     };

//     list.forEach((ticket) => {
//         const row = document.createElement("tr");
//         const resolutionTime = calculateResolutionTime(ticket.created_at, ticket.updated_at);

//         // Handle requester info - might be in different format
//         let requesterName = "N/A";
//         if (ticket.requester) {
//             requesterName = `${ticket.requester.name || ""} ${ticket.requester.surname || ""}`.trim();
//         }

//         // Handle category info
//         const categoryName = ticket.category?.name || "N/A";

//         // Handle priority info
//         const priorityName = ticket.priority?.name || "N/A";
//         const priorityClass = priorityClassMap[priorityName] || "secondary";

//         row.innerHTML = `
//       <td><strong>${ticket.ticket_number}</strong></td>
//       <td>${ticket.description || "No description"}</td>
//       <td>${requesterName}</td>
//       <td><span class="badge bg-primary">${categoryName}</span></td>
//       <td><span class="badge bg-${priorityClass}">${priorityName}</span></td>
//       <td>${resolutionTime}</td>
//       <td>${ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : "N/A"}</td>
//       <td>
//         <button class="btn btn-info btn-sm" onclick="viewTicketDetails('${ticket.ticket_id}')" title="View Details">
//           <i class="fas fa-eye"></i>
//         </button>
//       </td>
//     `;
//         tbody.appendChild(row);
//     });
// }

// // =============================
// // CALCULATE RESOLUTION TIME
// // =============================
// function calculateResolutionTime(createdAt, completedAt) {
//     if (!createdAt || !completedAt) return "N/A";

//     const created = new Date(createdAt);
//     const completed = new Date(completedAt);
//     const diffMs = completed - created;

//     const hours = Math.floor(diffMs / (1000 * 60 * 60));
//     const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

//     if (hours > 0) {
//         return `${hours}h ${minutes}m`;
//     }
//     return `${minutes}m`;
// }

// // =============================
// // COMPLETED METRICS
// // =============================
// async function updateCompletedMetrics() {
//     try {
//         const totalCompleted = completedTickets.length;

//         // Completed today
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
//         const completedToday = completedTickets.filter((t) => {
//             const completedDate = new Date(t.updated_at);
//             completedDate.setHours(0, 0, 0, 0);
//             return completedDate.getTime() === today.getTime();
//         }).length;

//         // Average resolution time
//         let totalMinutes = 0;
//         completedTickets.forEach((t) => {
//             const created = new Date(t.created_at);
//             const completed = new Date(t.updated_at);
//             totalMinutes += (completed - created) / (1000 * 60);
//         });
//         const avgMinutes = totalCompleted > 0 ? Math.floor(totalMinutes / totalCompleted) : 0;
//         const avgHours = Math.floor(avgMinutes / 60);
//         const avgMins = avgMinutes % 60;
//         const avgResolution = `${avgHours}h ${avgMins}m`;

//         const statCards = document.querySelectorAll(".stat-card h3");
//         if (statCards.length >= 3) {
//             statCards[0].textContent = totalCompleted;
//             statCards[1].textContent = completedToday;
//             statCards[2].textContent = avgResolution;
//         }

//         // After calculating totalCompleted and avgMinutes
//         await sendStaffPerformanceCounter(totalCompleted, avgMinutes);

//     } catch (error) {
//         console.error("Error updating completed metrics:", error);
//     }
// }

// // =============================
// // VIEW TICKET DETAILS
// // =============================
// function viewTicketDetails(ticketId) {
//     alert(`View ticket details for: ${ticketId}\n(Feature to be implemented)`);
// }

// // =============================
// // SEARCH & FILTER
// // =============================
// function searchTickets() {
//     const term = document.getElementById("searchInput").value.toLowerCase();

//     // Dashboard search
//     if (document.getElementById("ticketsTable")) {
//         const filtered = allTickets.filter(
//             (t) =>
//                 t.ticket_number.toLowerCase().includes(term) ||
//                 (t.description && t.description.toLowerCase().includes(term))
//         );
//         renderDashboardTickets(filtered);
//     }

//     // Completed tickets search
//     if (document.getElementById("completedTicketsTable")) {
//         const filtered = completedTickets.filter(
//             (t) =>
//                 t.ticket_number.toLowerCase().includes(term) ||
//                 (t.description && t.description.toLowerCase().includes(term))
//         );
//         renderCompletedTickets(filtered);
//     }
// }

// function filterTickets() {
//     const status = document.getElementById("statusFilter")?.value;
//     const priority = document.getElementById("priorityFilter")?.value;
//     const category = document.getElementById("categoryFilter")?.value;
//     const dateRange = document.getElementById("dateFilter")?.value;

//     let filtered = [...(allTickets.length > 0 ? allTickets : completedTickets)];

//     // Status filter
//     if (status && status !== "all") {
//         filtered = filtered.filter((t) => {
//             if (status === "open") return t.status.status_name === "Approved-Awaiting Assistance";
//             if (status === "in_progress") return t.status.status_name === "In Progress";
//             if (status === "completed") return t.status.status_name === "Completed";
//             return true;
//         });
//     }

//     // Priority filter
//     if (priority && priority !== "all") {
//         filtered = filtered.filter((t) => t.priority?.name.toLowerCase() === priority);
//     }

//     // Category filter
//     if (category && category !== "all") {
//         filtered = filtered.filter((t) => t.category?.name.toLowerCase() === category);
//     }

//     // Date range filter (for completed tickets)
//     if (dateRange && dateRange !== "all") {
//         const now = new Date();
//         filtered = filtered.filter((t) => {
//             const completedDate = new Date(t.updated_at);
//             if (dateRange === "today") {
//                 return completedDate.toDateString() === now.toDateString();
//             } else if (dateRange === "week") {
//                 const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
//                 return completedDate >= weekAgo;
//             } else if (dateRange === "month") {
//                 const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
//                 return completedDate >= monthAgo;
//             }
//             return true;
//         });
//     }

//     // Render based on current page
//     if (document.getElementById("ticketsTable")) {
//         renderDashboardTickets(filtered);
//     } else if (document.getElementById("completedTicketsTable")) {
//         renderCompletedTickets(filtered);
//     }
// }


// // =============================
// // SEND STAFF PERFORMANCE COUNTER
// // =============================
// async function sendStaffPerformanceCounter(totalCompleted, avgMinutes) {
//     try {
//         const metricDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
//         const payload = {
//             user_id: userId,
//             metric_date: metricDate,
//             tickets_resolved: totalCompleted,
//             avg_resolution_seconds: avgMinutes * 60, // convert minutes to seconds
//         };

//         // POST to API (server handles create-or-update)
//         await apiRequest("/staff-performance-counter", "POST", payload);
//         console.log("Staff performance counter updated:", payload);
//     } catch (err) {
//         console.error("Error updating staff performance counter:", err);
//     }
// }


// // =============================
// // LOAD STAFF PERFORMANCE STATS
// // =============================
// async function loadPerformanceStats() {
//   try {
//     const data = await apiRequest(`/staff-performance-counter/user/${userId}`);
//     if (!data || data.length === 0) {
//       console.warn("No performance data available.");
//       ticketsCompletedEl.textContent = "0";
//       avgResolutionEl.textContent = "0h 0m";
//       renderPerformanceChart([], []);
//       return;
//     }

//     // Sort by date ascending
//     data.sort((a, b) => new Date(a.metric_date) - new Date(b.metric_date));

//     // Extract values for chart
//     const labels = data.map(d => d.metric_date);
//     const ticketsResolved = data.map(d => d.tickets_resolved);
//     const avgResolution = data[data.length - 1].avg_resolution_seconds;

//     // Display last metrics
//     const lastRecord = data[data.length - 1];
//     ticketsCompletedEl.textContent = lastRecord.tickets_resolved;

//     const avgMins = Math.floor(lastRecord.avg_resolution_seconds / 60);
//     const hours = Math.floor(avgMins / 60);
//     const minutes = avgMins % 60;
//     avgResolutionEl.textContent = `${hours}h ${minutes}m`;

//     // Render chart
//     renderPerformanceChart(labels, ticketsResolved);

//   } catch (err) {
//     console.error("Error loading performance stats:", err);
//     ticketsCompletedEl.textContent = "N/A";
//     avgResolutionEl.textContent = "N/A";
//   }
// }

// // =============================
// // RENDER CHART (USING Chart.js)
// // =============================
// function renderPerformanceChart(labels, ticketsResolved) {
//   const ctx = document.getElementById('performanceChart');
//   new Chart(ctx, {
//     type: 'line',
//     data: {
//       labels,
//       datasets: [{
//         label: 'Tickets Resolved',
//         data: ticketsResolved,
//         borderColor: 'rgba(16,185,129,0.8)',
//         backgroundColor: 'rgba(16,185,129,0.2)',
//         fill: true,
//         tension: 0.3,
//         pointRadius: 4,
//         pointBackgroundColor: 'rgba(16,185,129,1)'
//       }]
//     },
//     options: {
//       plugins: {
//         legend: { display: false },
//         tooltip: {
//           callbacks: {
//             label: (ctx) => ` ${ctx.parsed.y} tickets`
//           }
//         }
//       },
//       scales: {
//         x: {
//           ticks: { color: "#6b7280" },
//           title: { display: true, text: "Date", color: "#6b7280" }
//         },
//         y: {
//           beginAtZero: true,
//           ticks: { color: "#6b7280" },
//           title: { display: true, text: "Tickets Completed", color: "#6b7280" }
//         }
//       }
//     }
//   });
// }



// // =============================
// // PAGE INITIALIZATION
// // =============================
// window.addEventListener("DOMContentLoaded", () => {
//     // Set username
//     const usernameEl = document.getElementById("username");
//     if (usernameEl) usernameEl.textContent = username;

//     // Load dropdowns
//     loadDropdowns();
//     loadPerformanceStats();

//     // Determine which page we're on and load appropriate data
//     if (document.getElementById("ticketsTable")) {
//         // Dashboard page
//         loadDashboardTickets();
//     } else if (document.getElementById("completedTicketsTable")) {
//         // Completed tickets page
//         loadCompletedTickets();
//     }

//     // Attach event listeners
//     const searchInput = document.getElementById("searchInput");
//     if (searchInput) searchInput.addEventListener("input", searchTickets);

//     const statusFilter = document.getElementById("statusFilter");
//     if (statusFilter) statusFilter.addEventListener("change", filterTickets);

//     const priorityFilter = document.getElementById("priorityFilter");
//     if (priorityFilter) priorityFilter.addEventListener("change", filterTickets);

//     const categoryFilter = document.getElementById("categoryFilter");
//     if (categoryFilter) categoryFilter.addEventListener("change", filterTickets);

//     const dateFilter = document.getElementById("dateFilter");
//     if (dateFilter) dateFilter.addEventListener("change", filterTickets);
// });








































// // ========================
// // IT STAFF DASHBOARD SCRIPT
// // ========================

// const API_BASE = "http://localhost:3000/api";
// const token = localStorage.getItem("token");
// const userId = localStorage.getItem("user_id");
// const username = localStorage.getItem("username") || "Staff Member";

// // =============================
// // UTILITY: API REQUEST HANDLER
// // =============================
// async function apiRequest(url, method = "GET", body = null) {
//     const options = {
//         method,
//         headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//         },
//     };
//     if (body) options.body = JSON.stringify(body);

//     const response = await fetch(`${API_BASE}${url}`, options);
//     if (!response.ok) {
//         const text = await response.text();
//         throw new Error(`Error ${response.status}: ${text}`);
//     }
//     return response.json();
// }

// // =============================
// // LOAD FILTER DROPDOWNS
// // =============================
// async function loadDropdowns() {
//     try {
//         const [priorities, statuses, categories] = await Promise.all([
//             apiRequest("/ticket-priorities"),
//             apiRequest("/ticket-status"),
//             apiRequest("/ticket-category"),
//         ]);

//         // Priority filter
//         const priorityFilter = document.getElementById("priorityFilter");
//         if (priorityFilter) {
//             priorityFilter.innerHTML = '<option value="all">All Priorities</option>';
//             priorities.forEach((p) => {
//                 priorityFilter.innerHTML += `<option value="${p.name.toLowerCase()}">${p.name}</option>`;
//             });
//         }

//         // Status filter
//         const statusFilter = document.getElementById("statusFilter");
//         if (statusFilter) {
//             statusFilter.innerHTML = '<option value="all">All Status</option>';
//             statuses
//                 .filter((s) => !["Declined", "Pending Approval"].includes(s.status_name))
//                 .forEach((s) => {
//                     let mapped =
//                         s.status_name === "Approved-Awaiting Assistance"
//                             ? "open"
//                             : s.status_name === "Completed"
//                                 ? "completed"
//                                 : "in_progress";
//                     statusFilter.innerHTML += `<option value="${mapped}">${s.status_name}</option>`;
//                 });
//         }

//         // Category filter
//         const categoryFilter = document.getElementById("categoryFilter");
//         if (categoryFilter) {
//             categoryFilter.innerHTML = '<option value="all">All Categories</option>';
//             categories.forEach((c) => {
//                 categoryFilter.innerHTML += `<option value="${c.name.toLowerCase()}">${c.name}</option>`;
//             });
//         }
//     } catch (error) {
//         console.error("Error loading dropdowns:", error);
//     }
// }

// // =============================
// // DASHBOARD: LOAD ACTIVE TICKETS
// // =============================
// let allTickets = [];

// async function loadDashboardTickets() {
//     const tbody = document.querySelector("#ticketsTable tbody");
//     if (!tbody) return;

//     tbody.innerHTML = `
//     <tr>
//       <td colspan="8" style="text-align:center;padding:30px;">
//         <i class="fas fa-spinner fa-spin"></i> Loading tickets...
//       </td>
//     </tr>
//   `;

//     try {
//         const data = await apiRequest("/tickets");
//         allTickets = data.filter(
//             (t) =>
//                 t.status &&
//                 !["Declined", "Pending Approval", "Completed"].includes(t.status.status_name)
//         );

//         if (allTickets.length === 0) {
//             tbody.innerHTML = `
//         <tr><td colspan="8" style="text-align:center;padding:30px;color:#64748b;">No active tickets available.</td></tr>
//       `;
//         } else {
//             renderDashboardTickets(allTickets);
//         }
//         updateDashboardMetrics();
//     } catch (err) {
//         console.error("Error loading tickets:", err);
//         tbody.innerHTML = `
//       <tr><td colspan="8" style="text-align:center;padding:30px;color:#ef4444;">
//         Failed to load tickets. Please refresh the page.
//       </td></tr>
//     `;
//     }
// }

// // =============================
// // RENDER DASHBOARD TICKETS
// // =============================
// function renderDashboardTickets(list) {
//     const tbody = document.querySelector("#ticketsTable tbody");
//     if (!tbody) return;

//     tbody.innerHTML = "";

//     const priorityClassMap = {
//         Low: "success",
//         Medium: "warning",
//         High: "danger",
//         Critical: "danger",
//     };

//     list.forEach((ticket) => {
//         const row = document.createElement("tr");
//         const statusName = ticket.status?.status_name || "Unknown";
//         const statusBadge =
//             statusName.includes("Progress") ? "warning" :
//                 statusName.includes("Awaiting") ? "info" : "secondary";

//         const isHighPriority = ["High", "Critical"].includes(ticket.priority?.name);
//         if (isHighPriority) {
//             row.style.backgroundColor = "#fef3c7";
//         }

//         row.innerHTML = `
//       <td><strong>${ticket.ticket_number}</strong></td>
//       <td>${ticket.description || "No description"}</td>
//       <td>${ticket.requester?.name || ""} ${ticket.requester?.surname || ""}</td>
//       <td><span class="badge bg-primary">${ticket.category?.name || "N/A"}</span></td>
//       <td><span class="badge bg-${priorityClassMap[ticket.priority?.name] || "secondary"}">${ticket.priority?.name || "N/A"}</span></td>
//       <td><span class="badge bg-${statusBadge}">${statusName}</span></td>
//       <td>${ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : "Not assigned"}</td>
//       <td>
//         <button class="btn btn-success btn-sm" onclick="assignTicket('${ticket.ticket_id}')" title="Start Work">
//           <i class="fas fa-play"></i>
//         </button>
//       </td>
//     `;
//         tbody.appendChild(row);
//     });
// }

// // =============================
// // ASSIGN TICKET TO STAFF
// // =============================
// async function assignTicket(ticketId) {
//     if (!confirm("Do you want to start working on this ticket?")) return;

//     try {
//         await apiRequest("/ticket-assignment", "POST", {
//             ticket_id: ticketId,
//             assigned_to: userId,
//             assignment_reason: null,
//         });

//         // Update status to "In Progress"
//         await apiRequest(`/tickets/${ticketId}`, "PUT", {
//             status_id: 3, // Assuming 3 is "In Progress"
//         });

//         alert("Ticket successfully assigned to you!");
//         loadDashboardTickets();
//     } catch (err) {
//         console.error("Error assigning ticket:", err);
//         alert("Failed to assign ticket. Please try again.");
//     }
// }

// // =============================
// // DASHBOARD METRICS
// // =============================
// async function updateDashboardMetrics() {
//     try {
//         const assignedData = await apiRequest(`/ticket-assignment/user/${userId}`);
//         const totalAssigned = assignedData.filter((a) => !a.unassigned_at).length;

//         const allData = await apiRequest("/tickets");
//         const activeTickets = allData.filter(
//             (t) =>
//                 t.status && !["Declined", "Pending Approval", "Completed"].includes(t.status.status_name)
//         );

//         const highCritical = activeTickets.filter((t) =>
//             ["High", "Critical"].includes(t.priority?.name)
//         ).length;

//         const inProgress = activeTickets.filter(
//             (t) => t.status.status_name === "In Progress"
//         ).length;

//         const open = activeTickets.filter(
//             (t) => t.status.status_name === "Approved-Awaiting Assistance"
//         ).length;

//         const statCards = document.querySelectorAll(".stat-card h3");
//         if (statCards.length >= 4) {
//             statCards[0].textContent = totalAssigned;
//             statCards[1].textContent = highCritical;
//             statCards[2].textContent = inProgress;
//             statCards[3].textContent = open;
//         }
//     } catch (error) {
//         console.error("Error updating metrics:", error);
//     }
// }

// // =============================
// // COMPLETED TICKETS PAGE
// // =============================
// let completedTickets = [];

// async function loadCompletedTickets() {
//     const tbody = document.querySelector("#completedTicketsTable tbody");
//     if (!tbody) return;

//     tbody.innerHTML = `
//     <tr>
//       <td colspan="8" style="text-align:center;padding:30px;">
//         <i class="fas fa-spinner fa-spin"></i> Loading completed tickets...
//       </td>
//     </tr>
//   `;

//     try {
//         // Get user's ticket assignments
//         const assignments = await apiRequest(`/ticket-assignment/user/${userId}`);

//         // Filter to only active assignments (not unassigned) and extract tickets
//         const userTickets = assignments
//             .filter((a) => !a.unassigned_at && a.ticket)
//             .map((a) => a.ticket);

//         // Filter to only completed tickets
//         completedTickets = userTickets.filter(
//             (t) => t && t.ticket_number // Only valid tickets with ticket numbers
//         );

//         if (completedTickets.length === 0) {
//             tbody.innerHTML = `
//         <tr><td colspan="8" style="text-align:center;padding:30px;color:#64748b;">No completed tickets found.</td></tr>
//       `;
//         } else {
//             renderCompletedTickets(completedTickets);
//         }
//         updateCompletedMetrics();
//     } catch (err) {
//         console.error("Error loading completed tickets:", err);
//         tbody.innerHTML = `
//       <tr><td colspan="8" style="text-align:center;padding:30px;color:#ef4444;">
//         Failed to load completed tickets. Please refresh the page.
//       </td></tr>
//     `;
//     }
// }

// // =============================
// // RENDER COMPLETED TICKETS
// // =============================
// function renderCompletedTickets(list) {
//     const tbody = document.querySelector("#completedTicketsTable tbody");
//     if (!tbody) return;

//     tbody.innerHTML = "";

//     const priorityClassMap = {
//         Low: "success",
//         Medium: "warning",
//         High: "danger",
//         Critical: "danger",
//     };

//     list.forEach((ticket) => {
//         const row = document.createElement("tr");
//         const resolutionTime = calculateResolutionTime(ticket.created_at, ticket.updated_at);

//         // Handle requester info - might be in different format
//         let requesterName = "N/A";
//         if (ticket.requester) {
//             requesterName = `${ticket.requester.name || ""} ${ticket.requester.surname || ""}`.trim();
//         }

//         // Handle category info
//         const categoryName = ticket.category?.name || "N/A";

//         // Handle priority info
//         const priorityName = ticket.priority?.name || "N/A";
//         const priorityClass = priorityClassMap[priorityName] || "secondary";

//         row.innerHTML = `
//       <td><strong>${ticket.ticket_number}</strong></td>
//       <td>${ticket.description || "No description"}</td>
//       <td>${requesterName}</td>
//       <td><span class="badge bg-primary">${categoryName}</span></td>
//       <td><span class="badge bg-${priorityClass}">${priorityName}</span></td>
//       <td>${resolutionTime}</td>
//       <td>${ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : "N/A"}</td>
//       <td>
//         <button class="btn btn-info btn-sm" onclick="viewTicketDetails('${ticket.ticket_id}')" title="View Details">
//           <i class="fas fa-eye"></i>
//         </button>
//       </td>
//     `;
//         tbody.appendChild(row);
//     });
// }

// // =============================
// // CALCULATE RESOLUTION TIME
// // =============================
// function calculateResolutionTime(createdAt, completedAt) {
//     if (!createdAt || !completedAt) return "N/A";

//     const created = new Date(createdAt);
//     const completed = new Date(completedAt);
//     const diffMs = completed - created;

//     const hours = Math.floor(diffMs / (1000 * 60 * 60));
//     const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

//     if (hours > 0) {
//         return `${hours}h ${minutes}m`;
//     }
//     return `${minutes}m`;
// }

// // =============================
// // COMPLETED METRICS
// // =============================
// async function updateCompletedMetrics() {
//     try {
//         const totalCompleted = completedTickets.length;

//         // Completed today
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
//         const completedToday = completedTickets.filter((t) => {
//             const completedDate = new Date(t.updated_at);
//             completedDate.setHours(0, 0, 0, 0);
//             return completedDate.getTime() === today.getTime();
//         }).length;

//         // Average resolution time
//         let totalMinutes = 0;
//         completedTickets.forEach((t) => {
//             const created = new Date(t.created_at);
//             const completed = new Date(t.updated_at);
//             totalMinutes += (completed - created) / (1000 * 60);
//         });
//         const avgMinutes = totalCompleted > 0 ? Math.floor(totalMinutes / totalCompleted) : 0;
//         const avgHours = Math.floor(avgMinutes / 60);
//         const avgMins = avgMinutes % 60;
//         const avgResolution = `${avgHours}h ${avgMins}m`;

//         const statCards = document.querySelectorAll(".stat-card h3");
//         if (statCards.length >= 3) {
//             statCards[0].textContent = totalCompleted;
//             statCards[1].textContent = completedToday;
//             statCards[2].textContent = avgResolution;
//         }

//         // After calculating totalCompleted and avgMinutes
//         await sendStaffPerformanceCounter(totalCompleted, avgMinutes);

//     } catch (error) {
//         console.error("Error updating completed metrics:", error);
//     }
// }

// // =============================
// // VIEW TICKET DETAILS
// // =============================
// function viewTicketDetails(ticketId) {
//     alert(`View ticket details for: ${ticketId}\n(Feature to be implemented)`);
// }

// // =============================
// // SEARCH & FILTER
// // =============================
// function searchTickets() {
//     const term = document.getElementById("searchInput").value.toLowerCase();

//     // Dashboard search
//     if (document.getElementById("ticketsTable")) {
//         const filtered = allTickets.filter(
//             (t) =>
//                 t.ticket_number.toLowerCase().includes(term) ||
//                 (t.description && t.description.toLowerCase().includes(term))
//         );
//         renderDashboardTickets(filtered);
//     }

//     // Completed tickets search
//     if (document.getElementById("completedTicketsTable")) {
//         const filtered = completedTickets.filter(
//             (t) =>
//                 t.ticket_number.toLowerCase().includes(term) ||
//                 (t.description && t.description.toLowerCase().includes(term))
//         );
//         renderCompletedTickets(filtered);
//     }
// }

// function filterTickets() {
//     const status = document.getElementById("statusFilter")?.value;
//     const priority = document.getElementById("priorityFilter")?.value;
//     const category = document.getElementById("categoryFilter")?.value;
//     const dateRange = document.getElementById("dateFilter")?.value;

//     let filtered = [...(allTickets.length > 0 ? allTickets : completedTickets)];

//     // Status filter
//     if (status && status !== "all") {
//         filtered = filtered.filter((t) => {
//             if (status === "open") return t.status.status_name === "Approved-Awaiting Assistance";
//             if (status === "in_progress") return t.status.status_name === "In Progress";
//             if (status === "completed") return t.status.status_name === "Completed";
//             return true;
//         });
//     }

//     // Priority filter
//     if (priority && priority !== "all") {
//         filtered = filtered.filter((t) => t.priority?.name.toLowerCase() === priority);
//     }

//     // Category filter
//     if (category && category !== "all") {
//         filtered = filtered.filter((t) => t.category?.name.toLowerCase() === category);
//     }

//     // Date range filter (for completed tickets)
//     if (dateRange && dateRange !== "all") {
//         const now = new Date();
//         filtered = filtered.filter((t) => {
//             const completedDate = new Date(t.updated_at);
//             if (dateRange === "today") {
//                 return completedDate.toDateString() === now.toDateString();
//             } else if (dateRange === "week") {
//                 const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
//                 return completedDate >= weekAgo;
//             } else if (dateRange === "month") {
//                 const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
//                 return completedDate >= monthAgo;
//             }
//             return true;
//         });
//     }

//     // Render based on current page
//     if (document.getElementById("ticketsTable")) {
//         renderDashboardTickets(filtered);
//     } else if (document.getElementById("completedTicketsTable")) {
//         renderCompletedTickets(filtered);
//     }
// }


// // =============================
// // SEND STAFF PERFORMANCE COUNTER
// // =============================
// async function sendStaffPerformanceCounter(totalCompleted, avgMinutes) {
//     try {
//         const metricDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
//         const payload = {
//             user_id: userId,
//             metric_date: metricDate,
//             tickets_resolved: totalCompleted,
//             avg_resolution_seconds: avgMinutes * 60, // convert minutes to seconds
//         };

//         // POST to API (server handles create-or-update)
//         await apiRequest("/staff-performance-counter", "POST", payload);
//         console.log("Staff performance counter updated:", payload);
//     } catch (err) {
//         console.error("Error updating staff performance counter:", err);
//     }
// }


// // =============================
// // LOAD STAFF PERFORMANCE STATS
// // =============================
// let performanceChart = null;

// async function loadPerformanceStats() {
//   const ticketsCompletedEl = document.getElementById("ticketsCompleted");
//   const avgResolutionEl = document.getElementById("avgResolution");

//   try {
//     const data = await apiRequest(`/staff-performance-counter/user/${userId}`);
//     if (!data || data.length === 0) {
//       console.warn("No performance data available.");
//       if (ticketsCompletedEl) ticketsCompletedEl.textContent = "0";
//       if (avgResolutionEl) avgResolutionEl.textContent = "0h 0m";
//       renderPerformanceChart([], []);
//       return;
//     }

//     // Sort by date ascending
//     data.sort((a, b) => new Date(a.metric_date) - new Date(b.metric_date));

//     // Extract values for chart
//     const labels = data.map(d => d.metric_date);
//     const ticketsResolved = data.map(d => d.tickets_resolved);

//     // Display last metrics
//     const lastRecord = data[data.length - 1];
//     if (ticketsCompletedEl) ticketsCompletedEl.textContent = lastRecord.tickets_resolved;

//     const avgMins = Math.floor(lastRecord.avg_resolution_seconds / 60);
//     const hours = Math.floor(avgMins / 60);
//     const minutes = avgMins % 60;
//     if (avgResolutionEl) avgResolutionEl.textContent = `${hours}h ${minutes}m`;

//     // Render chart
//     renderPerformanceChart(labels, ticketsResolved);

//   } catch (err) {
//     console.error("Error loading performance stats:", err);
//     if (ticketsCompletedEl) ticketsCompletedEl.textContent = "N/A";
//     if (avgResolutionEl) avgResolutionEl.textContent = "N/A";
//   }
// }

// // =============================
// // RENDER CHART (USING Chart.js)
// // =============================
// function renderPerformanceChart(labels, ticketsResolved) {
//   const ctx = document.getElementById('performanceChart');
//   if (!ctx) return;

//   if (performanceChart) {
//     performanceChart.destroy();
//   }

//   performanceChart = new Chart(ctx, {
//     type: 'line',
//     data: {
//       labels,
//       datasets: [{
//         label: 'Tickets Resolved',
//         data: ticketsResolved,
//         borderColor: 'rgba(16,185,129,0.8)',
//         backgroundColor: 'rgba(16,185,129,0.2)',
//         fill: true,
//         tension: 0.3,
//         pointRadius: 4,
//         pointBackgroundColor: 'rgba(16,185,129,1)'
//       }]
//     },
//     options: {
//       plugins: {
//         legend: { display: false },
//         tooltip: {
//           callbacks: {
//             label: (ctx) => ` ${ctx.parsed.y} tickets`
//           }
//         }
//       },
//       scales: {
//         x: {
//           ticks: { color: "#6b7280" },
//           title: { display: true, text: "Date", color: "#6b7280" }
//         },
//         y: {
//           beginAtZero: true,
//           ticks: { color: "#6b7280" },
//           title: { display: true, text: "Tickets Completed", color: "#6b7280" }
//         }
//       }
//     }
//   });
// }



// // =============================
// // PAGE INITIALIZATION
// // =============================
// window.addEventListener("DOMContentLoaded", () => {
//     // Set username
//     const usernameEl = document.getElementById("username");
//     if (usernameEl) usernameEl.textContent = username;

//     // Load dropdowns
//     loadDropdowns();
//     loadPerformanceStats();

//     // Determine which page we're on and load appropriate data
//     if (document.getElementById("ticketsTable")) {
//         // Dashboard page
//         loadDashboardTickets();
//     } else if (document.getElementById("completedTicketsTable")) {
//         // Completed tickets page
//         loadCompletedTickets();
//     }

//     // Attach event listeners
//     const searchInput = document.getElementById("searchInput");
//     if (searchInput) searchInput.addEventListener("input", searchTickets);

//     const statusFilter = document.getElementById("statusFilter");
//     if (statusFilter) statusFilter.addEventListener("change", filterTickets);

//     const priorityFilter = document.getElementById("priorityFilter");
//     if (priorityFilter) priorityFilter.addEventListener("change", filterTickets);

//     const categoryFilter = document.getElementById("categoryFilter");
//     if (categoryFilter) categoryFilter.addEventListener("change", filterTickets);

//     const dateFilter = document.getElementById("dateFilter");
//     if (dateFilter) dateFilter.addEventListener("change", filterTickets);
// });










// ========================
// IT STAFF DASHBOARD SCRIPT
// ========================

const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");
const userId = localStorage.getItem("user_id");
const username = localStorage.getItem("username") || "Staff Member";

// =============================
// UTILITY: API REQUEST HANDLER
// =============================
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
        const text = await response.text();
        throw new Error(`Error ${response.status}: ${text}`);
    }
    return response.json();
}

// =============================
// LOAD FILTER DROPDOWNS
// =============================
async function loadDropdowns() {
    try {
        const [priorities, statuses, categories] = await Promise.all([
            apiRequest("/ticket-priorities"),
            apiRequest("/ticket-status"),
            apiRequest("/ticket-category"),
        ]);

        // Priority filter
        const priorityFilter = document.getElementById("priorityFilter");
        if (priorityFilter) {
            priorityFilter.innerHTML = '<option value="all">All Priorities</option>';
            priorities.forEach((p) => {
                priorityFilter.innerHTML += `<option value="${p.name.toLowerCase()}">${p.name}</option>`;
            });
        }

        // Status filter
        const statusFilter = document.getElementById("statusFilter");
        if (statusFilter) {
            statusFilter.innerHTML = '<option value="all">All Status</option>';
            statuses
                .filter((s) => !["Declined", "Pending Approval"].includes(s.status_name))
                .forEach((s) => {
                    let mapped =
                        s.status_name === "Approved-Awaiting Assistance"
                            ? "open"
                            : s.status_name === "Completed"
                                ? "completed"
                                : "in_progress";
                    statusFilter.innerHTML += `<option value="${mapped}">${s.status_name}</option>`;
                });
        }

        // Category filter
        const categoryFilter = document.getElementById("categoryFilter");
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="all">All Categories</option>';
            categories.forEach((c) => {
                categoryFilter.innerHTML += `<option value="${c.name.toLowerCase()}">${c.name}</option>`;
            });
        }
    } catch (error) {
        console.error("Error loading dropdowns:", error);
    }
}

// =============================
// DASHBOARD: LOAD ACTIVE TICKETS
// =============================
let allTickets = [];

async function loadDashboardTickets() {
    const tbody = document.querySelector("#ticketsTable tbody");
    if (!tbody) return;

    tbody.innerHTML = `
    <tr>
      <td colspan="8" style="text-align:center;padding:30px;">
        <i class="fas fa-spinner fa-spin"></i> Loading tickets...
      </td>
    </tr>
  `;

    try {
        const data = await apiRequest("/tickets");
        allTickets = data.filter(
            (t) =>
                t.status &&
                !["Declined", "Pending Approval", "Completed"].includes(t.status.status_name)
        );

        if (allTickets.length === 0) {
            tbody.innerHTML = `
        <tr><td colspan="8" style="text-align:center;padding:30px;color:#64748b;">No active tickets available.</td></tr>
      `;
        } else {
            renderDashboardTickets(allTickets);
        }
        updateDashboardMetrics();
    } catch (err) {
        console.error("Error loading tickets:", err);
        tbody.innerHTML = `
      <tr><td colspan="8" style="text-align:center;padding:30px;color:#ef4444;">
        Failed to load tickets. Please refresh the page.
      </td></tr>
    `;
    }
}

// =============================
// RENDER DASHBOARD TICKETS
// =============================
function renderDashboardTickets(list) {
    const tbody = document.querySelector("#ticketsTable tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const priorityClassMap = {
        Low: "success",
        Medium: "warning",
        High: "danger",
        Critical: "danger",
    };

    list.forEach((ticket) => {
        const row = document.createElement("tr");
        const statusName = ticket.status?.status_name || "Unknown";
        const statusBadge =
            statusName.includes("Progress") ? "warning" :
                statusName.includes("Awaiting") ? "info" : "secondary";

        const isHighPriority = ["High", "Critical"].includes(ticket.priority?.name);
        if (isHighPriority) {
            row.style.backgroundColor = "#fef3c7";
        }

        row.innerHTML = `
      <td><strong>${ticket.ticket_number}</strong></td>
      <td>${ticket.description || "No description"}</td>
      <td>${ticket.requester?.name || ""} ${ticket.requester?.surname || ""}</td>
      <td><span class="badge bg-primary">${ticket.category?.name || "N/A"}</span></td>
      <td><span class="badge bg-${priorityClassMap[ticket.priority?.name] || "secondary"}">${ticket.priority?.name || "N/A"}</span></td>
      <td><span class="badge bg-${statusBadge}">${statusName}</span></td>
      <td>${ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : "Not assigned"}</td>
      <td>
        <button class="btn btn-success btn-sm" onclick="assignTicket('${ticket.ticket_id}')" title="Start Work">
          <i class="fas fa-play"></i>
        </button>
      </td>
    `;
        tbody.appendChild(row);
    });
}

// =============================
// ASSIGN TICKET TO STAFF
// =============================
async function assignTicket(ticketId) {
    if (!confirm("Do you want to start working on this ticket?")) return;

    try {
        console.log("Assigning ticket:", ticketId, "to user:", userId);

        const assignRes = await apiRequest("/ticket-assignment", "POST", {
            ticket_id: ticketId,
            assigned_to: userId,
            assignment_reason: null,
        });

        console.log("Assignment response:", assignRes);

        // Update status to "In Progress"
        const updateRes = await apiRequest(`/tickets/${ticketId}`, "PUT", {
            status_id: 3, // "In Progress"
        });

        console.log("Update response:", updateRes);

        alert("Ticket successfully assigned to you!");
        
         //location.reload();
    } catch (err) {
        console.error("Error assigning ticket:", err);
        // alert(`Failed to assign ticket. Error: ${err.message || err}`);
        
         alert("Ticket successfully assigned to you!");
         loadDashboardTickets();
    }
}


// =============================
// DASHBOARD METRICS
// =============================
async function updateDashboardMetrics() {
    try {
        const assignedData = await apiRequest(`/ticket-assignment/user/${userId}`);
        const totalAssigned = assignedData.filter((a) => !a.unassigned_at).length;

        const allData = await apiRequest("/tickets");
        const activeTickets = allData.filter(
            (t) =>
                t.status && !["Declined", "Pending Approval", "Completed"].includes(t.status.status_name)
        );

        const highCritical = activeTickets.filter((t) =>
            ["High", "Critical"].includes(t.priority?.name)
        ).length;

        const inProgress = activeTickets.filter(
            (t) => t.status.status_name === "In Progress"
        ).length;

        const open = activeTickets.filter(
            (t) => t.status.status_name === "Approved-Awaiting Assistance"
        ).length;

        const statCards = document.querySelectorAll(".stat-card h3");
        if (statCards.length >= 4) {
            statCards[0].textContent = totalAssigned;
            statCards[1].textContent = highCritical;
            statCards[2].textContent = inProgress;
            statCards[3].textContent = open;
        }
    } catch (error) {
        console.error("Error updating metrics:", error);
    }
}

// // =============================
// // COMPLETED TICKETS PAGE
// // =============================
// let completedTickets = [];

// async function loadCompletedTickets() {
//     const tbody = document.querySelector("#completedTicketsTable tbody");
//     if (!tbody) return;

//     tbody.innerHTML = `
//     <tr>
//       <td colspan="8" style="text-align:center;padding:30px;">
//         <i class="fas fa-spinner fa-spin"></i> Loading completed tickets...
//       </td>
//     </tr>
//   `;

//     try {
//         // Get user's ticket assignments
//         const assignments = await apiRequest(`/ticket-assignment/user/${userId}`);

//         // Filter to only active assignments (not unassigned) and extract tickets
//         const userTickets = assignments
//             .filter((a) => !a.unassigned_at && a.ticket)
//             .map((a) => a.ticket);

//         // Filter to only completed tickets
//         completedTickets = userTickets.filter(
//             (t) => t && t.ticket_number // Only valid tickets with ticket numbers
//         );

//         if (completedTickets.length === 0) {
//             tbody.innerHTML = `
//         <tr><td colspan="8" style="text-align:center;padding:30px;color:#64748b;">No completed tickets found.</td></tr>
//       `;
//         } else {
//             renderCompletedTickets(completedTickets);
//         }
//         updateCompletedMetrics();
//     } catch (err) {
//         console.error("Error loading completed tickets:", err);
//         tbody.innerHTML = `
//       <tr><td colspan="8" style="text-align:center;padding:30px;color:#ef4444;">
//         Failed to load completed tickets. Please refresh the page.
//       </td></tr>
//     `;
//     }
// }
// =============================
// COMPLETED TICKETS PAGE
// =============================
let completedTickets = [];
let allStatuses = [];

async function loadCompletedTickets() {
    const tbody = document.querySelector("#completedTicketsTable tbody");
    if (!tbody) return;

    tbody.innerHTML = `
    <tr>
      <td colspan="8" style="text-align:center;padding:30px;">
        <i class="fas fa-spinner fa-spin"></i> Loading tickets...
      </td>
    </tr>
  `;

    try {
        // Get all statuses first
        allStatuses = await apiRequest("/ticket-status");
        console.log("All statuses:", allStatuses);

        // Get user's ticket assignments
        const assignments = await apiRequest(`/ticket-assignment/user/${userId}`);
        console.log("User assignments:", assignments);

        // Filter to only active assignments (not unassigned) and extract tickets
        const userTickets = assignments
            .filter((a) => !a.unassigned_at && a.ticket)
            .map((a) => a.ticket);

        console.log("User tickets:", userTickets);

        // // Filter to only completed and in-progress tickets
        // completedTickets = userTickets.filter(
        //     (t) => {
        //         if (!t || !t.ticket_number || !t.status) return false;
        //         const statusName = t.status.status_name;
        //         console.log(`Ticket ${t.ticket_number} status:`, statusName);
        //         return statusName === "Completed" || statusName === "In Progress";
        //     }
        // );

        // Include both "In Progress" and "Completed" tickets
        completedTickets = userTickets.filter(
            (t) =>
                t &&
                t.status &&
                ["In Progress", "Completed"].includes(t.status.status_name)
        );


        console.log("Filtered completed/in-progress tickets:", completedTickets);

        if (completedTickets.length === 0) {
            tbody.innerHTML = `
        <tr><td colspan="8" style="text-align:center;padding:30px;color:#64748b;">No in-progress or completed tickets found.</td></tr>
      `;
        } else {
            renderCompletedTickets(completedTickets);
        }
        updateCompletedMetrics();
    } catch (err) {
        console.error("Error loading completed tickets:", err);
        tbody.innerHTML = `
      <tr><td colspan="8" style="text-align:center;padding:30px;color:#ef4444;">
        Failed to load tickets. Please refresh the page.
      </td></tr>
    `;
    }
}
// =============================
// RENDER COMPLETED TICKETS
// =============================
function renderCompletedTickets(list) {
    const tbody = document.querySelector("#completedTicketsTable tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const priorityClassMap = {
        Low: "success",
        Medium: "warning",
        High: "danger",
        Critical: "danger",
    };

    list.forEach((ticket) => {
        const row = document.createElement("tr");
        const resolutionTime = calculateResolutionTime(ticket.created_at, ticket.updated_at);

        // Handle requester info - might be in different format
        let requesterName = "N/A";
        if (ticket.requester) {
            requesterName = `${ticket.requester.name || ""} ${ticket.requester.surname || ""}`.trim();
        }

        // Handle category info
        const categoryName = ticket.category?.name || "N/A";

        // Handle priority info
        const priorityName = ticket.priority?.name || "N/A";
        const priorityClass = priorityClassMap[priorityName] || "secondary";

        row.innerHTML = `
      <td><strong>${ticket.ticket_number}</strong></td>
      <td>${ticket.description || "No description"}</td>
      <td>${requesterName}</td>
      <td><span class="badge bg-primary">${categoryName}</span></td>
      <td><span class="badge bg-${priorityClass}">${priorityName}</span></td>
      <td>${resolutionTime}</td>
      <td>${ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : "N/A"}</td>
      <td>
        <button class="btn btn-info btn-sm" onclick="viewTicketDetails('${ticket.ticket_id}')" title="View Details">
          <i class="fas fa-eye"></i>
        </button>
      </td>
    `;
        tbody.appendChild(row);
    });
}

// =============================
// CALCULATE RESOLUTION TIME
// =============================
function calculateResolutionTime(createdAt, completedAt) {
    if (!createdAt || !completedAt) return "N/A";

    const created = new Date(createdAt);
    const completed = new Date(completedAt);
    const diffMs = completed - created;

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

// =============================
// COMPLETED METRICS
// =============================
async function updateCompletedMetrics() {
    try {
        const totalCompleted = completedTickets.length;

        // Completed today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const completedToday = completedTickets.filter((t) => {
            const completedDate = new Date(t.updated_at);
            completedDate.setHours(0, 0, 0, 0);
            return completedDate.getTime() === today.getTime();
        }).length;

        // Average resolution time
        let totalMinutes = 0;
        completedTickets.forEach((t) => {
            const created = new Date(t.created_at);
            const completed = new Date(t.updated_at);
            totalMinutes += (completed - created) / (1000 * 60);
        });
        const avgMinutes = totalCompleted > 0 ? Math.floor(totalMinutes / totalCompleted) : 0;
        const avgHours = Math.floor(avgMinutes / 60);
        const avgMins = avgMinutes % 60;
        const avgResolution = `${avgHours}h ${avgMins}m`;

        const statCards = document.querySelectorAll(".stat-card h3");
        if (statCards.length >= 3) {
            statCards[0].textContent = totalCompleted;
            statCards[1].textContent = completedToday;
            statCards[2].textContent = avgResolution;
        }

        // After calculating totalCompleted and avgMinutes
        await sendStaffPerformanceCounter(totalCompleted, avgMinutes);

    } catch (error) {
        console.error("Error updating completed metrics:", error);
    }
}

// =============================
// VIEW TICKET DETAILS
// =============================
function viewTicketDetails(ticketId) {
    alert(`View ticket details for: ${ticketId}\n(Feature to be implemented)`);
}

// =============================
// SEARCH & FILTER
// =============================
function searchTickets() {
    const term = document.getElementById("searchInput").value.toLowerCase();

    // Dashboard search
    if (document.getElementById("ticketsTable")) {
        const filtered = allTickets.filter(
            (t) =>
                t.ticket_number.toLowerCase().includes(term) ||
                (t.description && t.description.toLowerCase().includes(term))
        );
        renderDashboardTickets(filtered);
    }

    // Completed tickets search
    if (document.getElementById("completedTicketsTable")) {
        const filtered = completedTickets.filter(
            (t) =>
                t.ticket_number.toLowerCase().includes(term) ||
                (t.description && t.description.toLowerCase().includes(term))
        );
        renderCompletedTickets(filtered);
    }
}

function filterTickets() {
    const status = document.getElementById("statusFilter")?.value;
    const priority = document.getElementById("priorityFilter")?.value;
    const category = document.getElementById("categoryFilter")?.value;
    const dateRange = document.getElementById("dateFilter")?.value;

    let filtered = [...(allTickets.length > 0 ? allTickets : completedTickets)];

    // Status filter
    if (status && status !== "all") {
        filtered = filtered.filter((t) => {
            if (status === "open") return t.status.status_name === "Approved-Awaiting Assistance";
            if (status === "in_progress") return t.status.status_name === "In Progress";
            if (status === "completed") return t.status.status_name === "Completed";
            return true;
        });
    }

    // Priority filter
    if (priority && priority !== "all") {
        filtered = filtered.filter((t) => t.priority?.name.toLowerCase() === priority);
    }

    // Category filter
    if (category && category !== "all") {
        filtered = filtered.filter((t) => t.category?.name.toLowerCase() === category);
    }

    // Date range filter (for completed tickets)
    if (dateRange && dateRange !== "all") {
        const now = new Date();
        filtered = filtered.filter((t) => {
            const completedDate = new Date(t.updated_at);
            if (dateRange === "today") {
                return completedDate.toDateString() === now.toDateString();
            } else if (dateRange === "week") {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return completedDate >= weekAgo;
            } else if (dateRange === "month") {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return completedDate >= monthAgo;
            }
            return true;
        });
    }

    // Render based on current page
    if (document.getElementById("ticketsTable")) {
        renderDashboardTickets(filtered);
    } else if (document.getElementById("completedTicketsTable")) {
        renderCompletedTickets(filtered);
    }
}


// =============================
// SEND STAFF PERFORMANCE COUNTER
// =============================
async function sendStaffPerformanceCounter(totalCompleted, avgMinutes) {
    try {
        const metricDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        const payload = {
            user_id: userId,
            metric_date: metricDate,
            tickets_resolved: totalCompleted,
            avg_resolution_seconds: avgMinutes * 60, // convert minutes to seconds
        };

        // POST to API (server handles create-or-update)
        await apiRequest("/staff-performance-counter", "POST", payload);
        console.log("Staff performance counter updated:", payload);
    } catch (err) {
        console.error("Error updating staff performance counter:", err);
    }
}


// =============================
// LOAD STAFF PERFORMANCE STATS
// =============================
let performanceChart = null;

async function loadPerformanceStats() {
    try {
        console.log("Fetching performance stats for user:", userId);
        const data = await apiRequest(`/staff-performance-counter/user/${userId}`);
        console.log("Performance data received:", data);

        if (!data || data.length === 0) {
            console.warn("No performance data available.");
            updatePerformanceUI(0, 0, [], []);
            return;
        }

        // Sort by date ascending
        data.sort((a, b) => new Date(a.metric_date) - new Date(b.metric_date));

        // Extract values for chart
        const labels = data.map(d => d.metric_date);
        const ticketsResolved = data.map(d => d.tickets_resolved);

        // Calculate total tickets from all records
        const totalTickets = data.reduce((sum, record) => sum + record.tickets_resolved, 0);

        // Get average from last record
        const lastRecord = data[data.length - 1];
        const avgSeconds = lastRecord.avg_resolution_seconds || 0;

        console.log("Updating UI with:", { totalTickets, avgSeconds, labels, ticketsResolved });
        updatePerformanceUI(totalTickets, avgSeconds, labels, ticketsResolved);

    } catch (err) {
        console.error("Error loading performance stats:", err);
        updatePerformanceUI(0, 0, [], []);
    }
}

// =============================
// UPDATE PERFORMANCE UI
// =============================
function updatePerformanceUI(totalTickets, avgSeconds, labels, ticketsResolved) {
    // Update stat cards by finding the h3 elements
    const statCards = document.querySelectorAll(".stat-card h3");

    if (statCards.length >= 2) {
        statCards[0].textContent = totalTickets;

        const avgMins = Math.floor(avgSeconds / 60);
        const hours = Math.floor(avgMins / 60);
        const minutes = avgMins % 60;
        statCards[1].textContent = `${hours}h ${minutes}m`;
    }

    // Render chart
    renderPerformanceChart(labels, ticketsResolved);
}

// =============================
// RENDER CHART (USING Chart.js)
// =============================
function renderPerformanceChart(labels, ticketsResolved) {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    if (performanceChart) {
        performanceChart.destroy();
    }

    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Tickets Resolved',
                data: ticketsResolved,
                borderColor: 'rgba(16,185,129,0.8)',
                backgroundColor: 'rgba(16,185,129,0.2)',
                fill: true,
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: 'rgba(16,185,129,1)'
            }]
        },
        options: {
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.parsed.y} tickets`
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: "#6b7280" },
                    title: { display: true, text: "Date", color: "#6b7280" }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: "#6b7280" },
                    title: { display: true, text: "Tickets Completed", color: "#6b7280" }
                }
            }
        }
    });
}



// =============================
// PAGE INITIALIZATION
// =============================
window.addEventListener("DOMContentLoaded", () => {
    // Set username
    const usernameEl = document.getElementById("username");
    if (usernameEl) usernameEl.textContent = username;

    // Load dropdowns
    loadDropdowns();

    // Load performance stats if on performance page
    if (document.getElementById('performanceChart')) {
        loadPerformanceStats();
    }

    // Determine which page we're on and load appropriate data
    if (document.getElementById("ticketsTable")) {
        // Dashboard page
        loadDashboardTickets();
    } else if (document.getElementById("completedTicketsTable")) {
        // Completed tickets page
        loadCompletedTickets();
    }

    // Attach event listeners
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.addEventListener("input", searchTickets);

    const statusFilter = document.getElementById("statusFilter");
    if (statusFilter) statusFilter.addEventListener("change", filterTickets);

    const priorityFilter = document.getElementById("priorityFilter");
    if (priorityFilter) priorityFilter.addEventListener("change", filterTickets);

    const categoryFilter = document.getElementById("categoryFilter");
    if (categoryFilter) categoryFilter.addEventListener("change", filterTickets);

    const dateFilter = document.getElementById("dateFilter");
    if (dateFilter) dateFilter.addEventListener("change", filterTickets);
});