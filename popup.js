const $ = id => document.getElementById(id);
let voices = [];

function updateLabels() {
  $("rateVal").textContent = Number($("rate").value).toFixed(2) + "x";
  $("pitchVal").textContent = Number($("pitch").value).toFixed(2);
  $("volumeVal").textContent = Math.round(Number($("volume").value) * 100) + "%";
}

function loadVoices() {
  chrome.tts.getVoices(list => {
    voices = list || [];
    const select = $("voice");
    const current = select.value;
    select.innerHTML = "";

    if (voices.length === 0) {
      const opt = document.createElement("option");
      opt.textContent = "Tidak ada voice terdeteksi";
      select.appendChild(opt);
      $("status").style.color = "#dc2626";
      $("status").textContent =
        "⚠ Tidak ada voice TTS di sistem/Chrome ini — suara tidak akan keluar. Cek pengaturan text-to-speech di OS atau chrome://settings/languages.";
      return;
    }

    voices.forEach((v, i) => {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = `${v.voiceName || "Voice"} — ${v.lang || ""}${v.extensionId ? " (extension)" : ""}`;
      select.appendChild(opt);
    });

    chrome.storage.sync.get({voiceName:""}, s => {
      const idx = voices.findIndex(v => v.voiceName === s.voiceName);
      if (idx >= 0) select.value = String(idx);
      else if (voices.length) select.value = "0";
    });
  });
}

function save() {
  const v = voices[Number($("voice").value)];
  chrome.storage.sync.set({
    rate: Number($("rate").value),
    pitch: Number($("pitch").value),
    volume: Number($("volume").value),
    voiceName: v?.voiceName || ""
  });
  $("status").textContent = "Tersimpan ✓";
  setTimeout(() => $("status").textContent = "", 900);
}

chrome.storage.sync.get(
  {rate:1, pitch:1, volume:1, voiceName:""},
  s => {
    $("rate").value = s.rate;
    $("pitch").value = s.pitch;
    $("volume").value = s.volume;
    updateLabels();
    loadVoices();
  }
);

["rate","pitch","volume","voice"].forEach(id => {
  $(id).addEventListener("input", () => { updateLabels(); save(); });
  $(id).addEventListener("change", save);
});

$("test").onclick = () => {
  const v = voices[Number($("voice").value)];
  chrome.tts.stop();
  chrome.tts.speak(
    "Hello, this is a QuickSpeak TTS voice test by Rizqiemn. Don’t forget to follow my social media. Thank you.",
    {
      voiceName: v?.voiceName,
      rate: Number($("rate").value),
      pitch: Number($("pitch").value),
      volume: Number($("volume").value),
      enqueue: false
    }
  );
};

loadVoices();