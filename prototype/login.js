/* Titan prototype — login page behavior.
   Fake auth: no backend. Captures the chosen role, sets an auth flag,
   then hands off to the app (index.html). Theme is applied in the <head>. */
(function () {
  var role = "employee";

  // Role selector (Employee / Leader) — drives which view the app opens as.
  var roleSwitch = document.getElementById("auth-role");
  if (roleSwitch) {
    roleSwitch.addEventListener("click", function (e) {
      var btn = e.target.closest(".role-btn");
      if (!btn) return;
      role = btn.dataset.role;
      roleSwitch.querySelectorAll(".role-btn").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
    });
  }

  // Persist the fake session, then enter the app.
  function signIn() {
    try {
      localStorage.setItem("titan-role", role);
      localStorage.setItem("titan-authed", "1");
    } catch (e) { /* private mode — proceed anyway */ }
    window.location.href = "index.html";
  }

  var form = document.getElementById("login-form");
  if (form) form.addEventListener("submit", function (e) { e.preventDefault(); signIn(); });

  // SSO buttons are decorative for the prototype — they sign in the same way.
  document.querySelectorAll("[data-sso]").forEach(function (b) {
    b.addEventListener("click", signIn);
  });
})();
