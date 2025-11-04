// // // document.getElementById("loginForm").addEventListener("submit", async (e) => {
// // //   e.preventDefault();

// // //   const email = document.getElementById("email").value;
// // //   const password = document.getElementById("password").value;

// // //   try {
// // //     const response = await fetch("http://localhost:3000/api/auth/login", {
// // //       method: "POST",
// // //       headers: { "Content-Type": "application/json" },
// // //       body: JSON.stringify({ email, password }),
// // //     });

// // //     const data = await response.json();

// // //     if (response.ok) {
// // //       // Save token and user info
// // //       localStorage.setItem("token", data.access_token);
// // //       localStorage.setItem("role", data.user.role.role_name);
// // //       localStorage.setItem("username", data.user.name + " " + data.user.surname);

// // //       // Redirect by role
// // //       const role = data.user.role.role_name
// // //       // login.js - Corrected paths
// // //       if (role === "Manager") window.location.href = "users/manager/manager.html";
// // //       else if (role === "Admin") window.location.href = "users/admin/admin.html";
// // //       else if (role === "IT Staff") window.location.href = "users/it-staff/it-staff.html";
// // //       else if (role === "Staff Emp") window.location.href = "users/staff-emp/staff-emp.html";
// // //       else window.location.href = "../login.html";
// // //     } else {
// // //       document.getElementById("errorMessage").textContent = data.message || "Invalid login!";
// // //     }
// // //   } catch (err) {
// // //     document.getElementById("errorMessage").textContent = "Server error!";
// // //   }
// // // });
// // document.getElementById("loginForm").addEventListener("submit", async (e) => {
// //   e.preventDefault();

// //   const email = document.getElementById("email").value;
// //   const password = document.getElementById("password").value;

// //   try {
// //     const response = await fetch("http://localhost:3000/api/auth/login", {
// //       method: "POST",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify({ email, password }),
// //     });

// //     const data = await response.json();

// //     if (response.ok) {
// //       // Save token and user info
// //       localStorage.setItem("token", data.access_token);
// //       localStorage.setItem("role", data.user.role.role_name);
// //       localStorage.setItem("username", data.user.name + " " + data.user.surname);

// //       // Save user ID and department ID for ticket creation
// //       localStorage.setItem("user_id", data.user.user_id);
// //       localStorage.setItem("department_id", data.user.department.department_id);

// //       if (data.user) {
// //         localStorage.setItem("user_id", data.user.user_id || "");

// //         if (data.user.department) {
// //           localStorage.setItem("department_id", data.user.department.department_id || "");
// //         } else {
// //           console.warn("Department data missing in user object");
// //         }
// //       } else {
// //         console.warn("User object missing in response:", data);
// //       }


// //       // Save full user object for reference
// //       localStorage.setItem("user", JSON.stringify(data.user));

// //       // Redirect by role
// //       const role = data.user.role.role_name;

// //       if (role === "Manager") {
// //         window.location.href = "users/manager/manager.html";
// //       } else if (role === "Admin") {
// //         window.location.href = "users/admin/admin.html";
// //       } else if (role === "IT Staff") {
// //         window.location.href = "users/it-staff/it-staff.html";
// //       } else if (role === "Staff Emp") {
// //         window.location.href = "users/staff-emp/staff-emp.html";
// //       } else {
// //         window.location.href = "../login.html";
// //       }
// //     } else {
// //       document.getElementById("errorMessage").textContent = data.message || "Invalid login!";
// //     }
// //   } catch (err) {
// //     console.error("Login error:", err);
// //     document.getElementById("errorMessage").textContent = "Server error! Please try again.";
// //   }
// // });
// document.getElementById("loginForm").addEventListener("submit", async (e) => {
//   e.preventDefault();

//   const email = document.getElementById("email").value.trim();
//   const password = document.getElementById("password").value.trim();
//   const errorBox = document.getElementById("errorMsg");

//   // Reset alert before each login attempt
//   errorBox.innerHTML = "";
//   errorBox.className = "alert hidden";

//   try {
//     const response = await fetch("http://localhost:3000/api/auth/login", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ email, password }),
//     });

//     const data = await response.json();

//     if (response.ok) {
//       // Save token and user info
//       localStorage.setItem("token", data.access_token);
//       localStorage.setItem("role", data.user.role.role_name);
//       localStorage.setItem("username", `${data.user.name} ${data.user.surname}`);
//       localStorage.setItem("user_id", data.user.user_id || "");
//       localStorage.setItem("department_id", data.user.department?.department_id || "");
//       localStorage.setItem("user", JSON.stringify(data.user));

//       const role = data.user.role.role_name;
//       if (role === "Manager") window.location.href = "users/manager/manager.html";
//       else if (role === "Admin") window.location.href = "users/admin/admin.html";
//       else if (role === "IT Staff") window.location.href = "users/it-staff/it-staff.html";
//       else if (role === "Staff Emp") window.location.href = "users/staff-emp/staff-emp.html";
//       else window.location.href = "../login.html";
//     } else {
//       showAlert(data.message || "Invalid login credentials!", "danger");
//     }
//   } catch (err) {
//     console.error("Login error:", err);
//     showAlert("Server error! Please try again later.", "danger");
//   }

//   function showAlert(message, type = "danger") {
//     errorBox.className = `alert alert-${type}`;
//     errorBox.innerHTML = `<strong>${message}</strong>`;
//   }
// });
// =============================
// LOGIN FORM HANDLER
// =============================

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorBox = document.getElementById("errorMsg");

  // Reset alert before each login attempt
  if (errorBox) {
    errorBox.innerHTML = "";
    errorBox.className = "alert hidden";
  }

  try {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Save token and user info
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", data.user.role.role_name);
      localStorage.setItem("username", `${data.user.name} ${data.user.surname}`);
      localStorage.setItem("user_id", data.user.user_id || "");
      localStorage.setItem("department_id", data.user.department?.department_id || "");
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect by role with correct absolute paths
      const role = data.user.role.role_name;
      
      if (role === "Manager") {
        window.location.href = "/users/manager/manager.html";
      } else if (role === "Admin") {
        window.location.href = "/users/admin/admin-dashboard.html";
      } else if (role === "IT Staff") {
        window.location.href = "/users/it-staff/it-staff.html";
      } else if (role === "Staff Emp") {
        window.location.href = "/users/staff-emp/staff-emp.html";
      } else {
        showAlert("Unknown role. Please contact administrator.", "warning");
      }
    } else {
      showAlert(data.message || "Invalid login credentials!", "danger");
    }
  } catch (err) {
    console.error("Login error:", err);
    showAlert("Server error! Please try again later.", "danger");
  }
});

// Helper function to show alerts
function showAlert(message, type = "danger") {
  const errorBox = document.getElementById("errorMsg");
  if (errorBox) {
    errorBox.className = `alert alert-${type}`;
    errorBox.innerHTML = `<strong>${message}</strong>`;
  }
}