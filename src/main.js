(async function () {
  "use strict";
  const head = document.getElementById("head");
  const drip = document.getElementById("drip");
  const backdrop = document.getElementById("backdrop");
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const song = document.getElementById("song");
  const entities = new Map();
  const [headImage, dripImage] = await Promise.all([
    loadImage("img/head.png"),
    loadImage(
      "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/cda1ac80-15c2-4968-b824-de1d9b8a6125/decawm1-4801c61e-2516-409c-8bcc-c1ac2050074c.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOiIsImlzcyI6InVybjphcHA6Iiwib2JqIjpbW3sicGF0aCI6IlwvZlwvY2RhMWFjODAtMTVjMi00OTY4LWI4MjQtZGUxZDliOGE2MTI1XC9kZWNhd20xLTQ4MDFjNjFlLTI1MTYtNDA5Yy04YmNjLWMxYWMyMDUwMDc0Yy5wbmcifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6ZmlsZS5kb3dubG9hZCJdfQ.KxMqslrciNgYbL0pdvGh7K9J2EBjfTGteYkZCjkpUP0"
    ),
  ]);

  const CONFIG = {};

  let running = false;
  let nextId = 0;
  let ww = window.innerWidth;
  let wh = window.innerHeight;
  let lastFrame = 0;
  let reloadTimeout = null;

  function generateParticle() {
    const { velocity: maxVel, size } = CONFIG.particles;
    const s = (size / 100) * wh;
    const h = Math.floor(Math.random() * s + s);
    const v = Math.random() * maxVel;
    const vx = Math.floor(v * (Math.random() < 0.5 ? 1 : -1));
    const vy = Math.floor((maxVel - v) * (Math.random() < 0.5 ? 1 : -1));
    const el = head.cloneNode();

    el.id = `head_${(nextId = nextId > 1000 ? 0 : nextId + 1)}`;
    el.style.height = `${h}px`;
    el.style.left = `${Math.floor(ww / 2 - h / 2)}px`;
    el.style.top = `${Math.floor(wh / 2 - h / 2)}px`;

    entities.set(el, [h, vx, vy]);
    document.body.appendChild(el);

    drawImage(headImage, el);
  }

  function loadImage(src) {
    const img = Object.assign(new Image(), { src });
    return new Promise((resolve) => {
      img.onload = () => resolve(img);
    });
  }

  function drawImage(img, canvas) {
    const {
      pixelation: { enabled, size },
    } = CONFIG;
    const ctx = canvas.getContext("2d");

    const { height } = canvas.getBoundingClientRect();
    const width = height * (img.width / img.height);

    canvas.height = height;
    canvas.width = width;

    ctx.clearRect(0, 0, width, height);

    if (enabled) {
      const tempCanvas = canvas.cloneNode();
      const tempCtx = tempCanvas.getContext("2d");
      const sArgs = [0, 0, width / size, height / size];
      const dArgs = [0, 0, width, height];
      tempCtx.drawImage(img, 0, 0, width / size, height / size);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tempCanvas, ...sArgs, ...dArgs);
    } else {
      ctx.drawImage(img, 0, 0, width, height);
    }
  }

  function update() {
    if (lastFrame) {
      const frameDelay = Date.now() - lastFrame;
      const probability = CONFIG.particles.frequency / 1000;
      if (Math.random() < probability * frameDelay) {
        generateParticle();
      }
    }
    for (const [el, [h, vx, vy]] of entities) {
      const x = Number(el.style.left.slice(0, -2)) + vx;
      const y = Number(el.style.top.slice(0, -2)) + vy;
      if (x < -h || x > ww || y < -h || y > wh) {
        el.remove();
        entities.delete(el);
      } else {
        el.style.left = `${Math.round(x)}px`;
        el.style.top = `${Math.round(y)}px`;
      }
    }
    lastFrame = Date.now();
    if (running) requestAnimationFrame(update);
  }

  function toggle() {
    running = !running;
    if (running) {
      song.play();
      update();
    } else {
      song.pause();
    }
  }

  function reload(force = false) {
    if (reloadTimeout) {
      clearTimeout(reloadTimeout);
    }
    setTimeout(
      () => {
        song.volume = CONFIG.music.volume / 10;

        ww = window.innerWidth;
        wh = window.innerHeight;

        drawImage(headImage, head);
        drawImage(dripImage, drip);
      },
      force ? 0 : 100
    );
  }

  // Event handlers.
  backdrop.addEventListener("animationend", () => backdrop.remove());
  backdrop.addEventListener("mousedown", () => {
    if (running) return;
    backdrop.innerText = "ENJOY!";
    backdrop.classList.add("fadeout");
    toggle();
  });
  head.addEventListener("mousedown", toggle);
  window.addEventListener("keydown", ({ key }) => {
    switch (key) {
      case " ":
        return toggle();
      case "Escape":
        return sidebar.classList.toggle("opened");
    }
  });
  window.addEventListener("resize", reload);
  sidebarToggle.addEventListener("mousedown", () =>
    sidebar.classList.toggle("opened")
  );
  for (const configInput of document.getElementsByClassName("field-value")) {
    const type = configInput.type;
    const [, category, key] = configInput.id.split("-");
    if (!(category in CONFIG)) {
      CONFIG[category] = {};
    }
    function updateValue(ev) {
      CONFIG[category][key] =
        type === "checkbox" ? configInput.checked : configInput.value;
      if (ev) reload();
    }
    configInput.addEventListener("change", updateValue);
    updateValue();
  }

  // Initial load.
  reload(true);
})();
