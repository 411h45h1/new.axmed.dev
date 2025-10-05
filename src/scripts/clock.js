export function initClock() {
  const clockEl = document.getElementById("clock");
  if (!clockEl) return;
  function tick() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    clockEl.textContent = timeString.replace(/\./g, "").toUpperCase();
  }
  tick();
  return setInterval(tick, 1000);
}
