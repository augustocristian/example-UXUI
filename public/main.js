"use strict";

document.querySelectorAll(".quote-form").forEach((form) => {
  const status = form.querySelector(".form-status");
  const button = form.querySelector("button[type=submit]");

  function show(kind, text) {
    status.hidden = false;
    status.className = "form-status " + kind;
    status.textContent = text;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    const firstInvalid = Array.from(form.elements).find((el) => el.willValidate && !el.checkValidity());
    if (firstInvalid) {
      firstInvalid.setAttribute("aria-invalid", "true");
      firstInvalid.focus();
      show("error", "Please check the highlighted field.");
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    button.disabled = true;
    status.hidden = true;

    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        form.reset();
        show("ok", "Thank you. We will call you back soon to talk about your project.");
      } else {
        (json.fields || []).forEach((name) => {
          const el = form.elements[name];
          if (el) el.setAttribute("aria-invalid", "true");
        });
        show("error", json.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      show("error", "We could not reach the server. Please check your connection and try again.");
    } finally {
      button.disabled = false;
    }
  });
});
