(() => {
  const BTN_ID = "quickspeak-tts-button";
  let button = null;
  let selectedText = "";
  let hideTimer = null;

  function ensureButton() {
    if (button) return button;
    button = document.createElement("button");
    button.id = BTN_ID;
    button.type = "button";
    button.title = "Baca teks";
    button.textContent = "🔊";
    button.addEventListener("mousedown", e => e.preventDefault());
    button.addEventListener("click", async e => {
      e.stopPropagation();
      if (!selectedText) return;
      button.classList.add("qs-playing");
      chrome.runtime.sendMessage(
        { type: "SPEAK", text: selectedText },
        response => {
          const err = chrome.runtime.lastError;
          if (err) {
            // Background/service worker unreachable (extension reloaded,
            // context invalidated, etc).
            console.error("QuickSpeak: gagal mengirim pesan —", err.message);
            flashError(err.message);
            return;
          }
          if (response && response.ok === false) {
            console.error("QuickSpeak TTS gagal:", response.error);
            flashError(response.error);
          }
        }
      );
      setTimeout(() => button?.classList.remove("qs-playing"), 500);
    });
    document.documentElement.appendChild(button);
    return button;
  }

  function showButton() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const text = sel.toString().trim();
    if (!text) {
      hideButton();
      return;
    }

    selectedText = text;
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    const b = ensureButton();
    const x = Math.min(
      Math.max(window.scrollX + rect.right - 17, window.scrollX + 5),
      window.scrollX + document.documentElement.clientWidth - 42
    );
    const y = Math.max(window.scrollY + rect.top - 44, window.scrollY + 5);

    b.style.left = `${x}px`;
    b.style.top = `${y}px`;
    b.style.display = "flex";
  }

  function hideButton() {
    if (button) button.style.display = "none";
    selectedText = "";
  }

  function flashError(message) {
    if (!button) return;
    button.classList.remove("qs-playing");
    button.classList.add("qs-error");
    button.title = message || "TTS gagal";
    setTimeout(() => {
      button?.classList.remove("qs-error");
      button.title = "Baca teks";
    }, 2000);
  }

  document.addEventListener("mouseup", () => {
    clearTimeout(hideTimer);
    setTimeout(showButton, 20);
  });

  document.addEventListener("keyup", e => {
    if (e.key === "Shift" || e.key.startsWith("Arrow")) {
      setTimeout(showButton, 20);
    }
  });

  document.addEventListener("mousedown", e => {
    if (e.target !== button) hideTimer = setTimeout(hideButton, 150);
  });

  window.addEventListener("scroll", hideButton, {passive: true});
  window.addEventListener("resize", hideButton);
})();