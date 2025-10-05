export function initClock() {
  const clockEl = document.getElementById("clock");
  if (!clockEl) return;
  function tick() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  tick();
  return setInterval(tick, 1000);
}
