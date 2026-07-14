/* Titan prototype — login page behavior.
   Google SSO only (simulated — no backend). Sets a fake session and enters the app.
   Role is not chosen here; it defaults to employee and can be switched in-app. */
(function () {
  function signIn() {
    try {
      localStorage.setItem("titan-authed", "1");
    } catch (e) { /* private mode — proceed anyway */ }
    window.location.href = "index.html";
  }

  var btn = document.getElementById("google-signin");
  if (btn) btn.addEventListener("click", signIn);
})();
