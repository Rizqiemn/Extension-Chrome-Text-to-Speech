chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    voiceName: ""
  });
});

function speakWithOptions(text, options, onDone) {
  chrome.tts.speak(text, options, () => {
    const err = chrome.runtime.lastError;
    if (err) {
      console.error("QuickSpeak TTS:", err.message);
    }
    onDone(err ? err.message : null);
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type !== "SPEAK" || !msg.text) return;

  chrome.storage.sync.get(
    { rate: 1.0, pitch: 1.0, volume: 1.0, voiceName: "" },
    settings => {
      chrome.tts.stop();

      const baseOptions = {
        rate: Number(settings.rate),
        pitch: Number(settings.pitch),
        volume: Number(settings.volume),
        enqueue: false
      };

      // First check if any voice exists at all — this is the #1 cause of
      // "button works but no sound" with zero visible error.
      chrome.tts.getVoices(voices => {
        if (!voices || voices.length === 0) {
          const noVoiceMsg =
            "Tidak ada voice TTS yang terdeteksi di sistem/Chrome ini.";
          console.error("QuickSpeak TTS:", noVoiceMsg);
          sendResponse({ok: false, error: noVoiceMsg});
          return;
        }

        const options = {...baseOptions};
        if (settings.voiceName) {
          options.voiceName = settings.voiceName;
        }

        speakWithOptions(msg.text, options, errMsg => {
          if (errMsg && settings.voiceName) {
            // Saved voice is probably stale/invalid (uninstalled, OS changed,
            // etc). Retry once with the system default voice instead of
            // failing silently.
            console.warn(
              "QuickSpeak TTS: voice tersimpan gagal, mencoba voice default..."
            );
            speakWithOptions(msg.text, baseOptions, errMsg2 => {
              sendResponse({ok: !errMsg2, error: errMsg2 || null});
            });
          } else {
            sendResponse({ok: !errMsg, error: errMsg || null});
          }
        });
      });
    }
  );

  return true; // keep sendResponse channel open for the async work above
});

chrome.commands?.onCommand?.addListener(command => {
  if (command === "stop-tts") chrome.tts.stop();
});