export function initWallpaper() {
  const noiseCanvas = document.getElementById("noiseCanvas");
  if (!noiseCanvas) return;
  const ctx = noiseCanvas.getContext("2d");
  function draw() {
    const { width, height } = noiseCanvas;
    const img = ctx.createImageData(width, height);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 40;
    }
    ctx.putImageData(img, 0, 0);
  }
  function resize() {
    noiseCanvas.width = window.innerWidth;
    noiseCanvas.height = window.innerHeight;
    draw();
  }
  resize();
  window.addEventListener("resize", resize);
  setInterval(draw, 4000);
}
