/* STUDENETSKIY — 3D barbell: drag, device tilt and scroll */
(function () {
  "use strict";
  if (!window.THREE) return;
  var T = THREE;
  var canvas = document.getElementById("bar3d");
  var stage = document.getElementById("stage");
  var hero = document.getElementById("hero");
  var modal = document.getElementById("coachModal");
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = window.matchMedia("(hover: none)").matches;

  var renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) { return; }
  if (!renderer.getContext()) return;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, touch ? 1.75 : 2));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.setClearColor(0x000000, 0);

  var scene = new T.Scene();
  var FOV = 30, DIST = 6;
  var camera = new T.PerspectiveCamera(FOV, 1, 0.1, 50);
  camera.position.set(0, 0, DIST);

  /* ---- studio environment for reflections (gym spotlight + red rims) ---- */
  var pmrem = new T.PMREMGenerator(renderer);
  var envScene = new T.Scene();
  envScene.add(new T.Mesh(new T.BoxGeometry(10, 10, 10), new T.MeshBasicMaterial({ color: 0x030303, side: T.BackSide })));
  function panel(w, h, hex, k, pos, rot) {
    var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(hex).multiplyScalar(k), side: T.DoubleSide }));
    m.position.set(pos[0], pos[1], pos[2]); m.rotation.set(rot[0], rot[1], rot[2]); envScene.add(m);
  }
  panel(2.6, 2.6, 0xfff1ea, 6, [0, 4.9, 0], [Math.PI / 2, 0, 0]);
  panel(1.5, 7, 0xff2418, 3, [-4.9, 0, 0.5], [0, Math.PI / 2, 0]);
  panel(1.5, 7, 0xff2418, 2, [4.9, 0, -0.5], [0, -Math.PI / 2, 0]);
  panel(8, 0.6, 0xffffff, 0.8, [0, -0.6, 4.9], [0, Math.PI, 0]);
  scene.environment = pmrem.fromScene(envScene, 0.035).texture;

  scene.add(new T.AmbientLight(0xffffff, 0.12));
  var key = new T.SpotLight(0xffe6dc, 2.6, 20, 0.5, 0.6, 1.2); key.position.set(0, 7, 2); scene.add(key);
  var rimL = new T.DirectionalLight(0xff2a1e, 1.6); rimL.position.set(-5, 1, -3); scene.add(rimL);
  var rimR = new T.DirectionalLight(0xff3a2a, 1.0); rimR.position.set(5, -1, -2); scene.add(rimR);

  /* ---- materials ---- */
  function knurlTexture() {
    var c = document.createElement("canvas"); c.width = c.height = 128;
    var g = c.getContext("2d"); g.fillStyle = "#808080"; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = "#ffffff"; g.lineWidth = 2;
    for (var i = -128; i < 256; i += 8) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.stroke();
      g.beginPath(); g.moveTo(i + 128, 0); g.lineTo(i, 128); g.stroke();
    }
    var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(40, 2); return t;
  }
  var steel = new T.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 1, roughness: 0.32 });
  var knurl = new T.MeshStandardMaterial({ color: 0xbdbdbd, metalness: 1, roughness: 0.45, bumpMap: knurlTexture(), bumpScale: 0.004 });
  var chrome = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.12 });
  var rubber = new T.MeshPhysicalMaterial({ color: 0x6e070c, roughness: 0.5, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.5 });
  var dark = new T.MeshPhysicalMaterial({ color: 0x1b1b1b, roughness: 0.4, metalness: 0.6, clearcoat: 0.4 });

  /* plate face with the club name, drawn once fonts are ready */
  function faceTexture(base, ring, big, small) {
    var S = 1024, c = document.createElement("canvas"); c.width = c.height = S;
    var g = c.getContext("2d"), R = S / 2;
    var grad = g.createRadialGradient(R, R, 60, R, R, R);
    grad.addColorStop(0, base[0]); grad.addColorStop(1, base[1]);
    g.fillStyle = grad; g.fillRect(0, 0, S, S);
    g.strokeStyle = ring; g.lineWidth = 6;
    [0.97, 0.62, 0.3].forEach(function (k) { g.beginPath(); g.arc(R, R, R * k, 0, 6.2832); g.stroke(); });
    g.fillStyle = "rgba(255,255,255,.92)"; g.textAlign = "center"; g.textBaseline = "middle";
    var font = '600 {s}px Oswald, "Arial Narrow", Impact, sans-serif';
    function arcText(text, radius, size, top) {
      g.font = font.replace("{s}", size);
      var total = g.measureText(text).width * 1.12, ang = total / radius;
      var start = top ? -Math.PI / 2 - ang / 2 : Math.PI / 2 + ang / 2;
      var a = start;
      for (var i = 0; i < text.length; i++) {
        var w = g.measureText(text[i]).width * 1.12, step = w / radius;
        a += top ? step / 2 : -step / 2;
        g.save(); g.translate(R + Math.cos(a) * radius, R + Math.sin(a) * radius);
        g.rotate(top ? a + Math.PI / 2 : a - Math.PI / 2); g.fillText(text[i], 0, 0); g.restore();
        a += top ? step / 2 : -step / 2;
      }
    }
    arcText("STUDENETSKIY", R * 0.8, 96, true);
    arcText(small, R * 0.8, 64, false);
    g.font = font.replace("{s}", 150); g.fillText(big, R, R - R * 0.46);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t;
  }

  /* ---- build the bar (length 2.2 units along X) ---- */
  var bar = new T.Group();
  function cyl(r, len, mat, x, seg) {
    var m = new T.Mesh(new T.CylinderGeometry(r, r, len, seg || 48), mat);
    m.rotation.z = Math.PI / 2; m.position.x = x; bar.add(m); return m;
  }
  cyl(0.0145, 1.33, knurl, 0, 32);
  var faces = [];
  [-1, 1].forEach(function (s) {
    cyl(0.042, 0.03, steel, s * 0.67);
    cyl(0.026, 0.42, chrome, s * 0.895);
    cyl(0.028, 0.012, chrome, s * 1.1);
    plate(s, 0.7235, 0.225, 0.067, rubber, "red");
    plate(s, 0.7925, 0.225, 0.067, rubber, "red");
    plate(s, 0.8405, 0.118, 0.026, dark, "dark");
    cyl(0.046, 0.045, chrome, s * 0.879);
  });
  function plate(s, x, R, t, mat, kind) {
    var g = new T.Group();
    var side = new T.Mesh(new T.CylinderGeometry(R, R, t - 0.006, 96, 1, true), mat);
    side.rotation.z = Math.PI / 2; g.add(side);
    var lipA = new T.Mesh(new T.TorusGeometry(R - 0.003, 0.004, 8, 96), mat); lipA.rotation.y = Math.PI / 2; lipA.position.x = t / 2 - 0.004; g.add(lipA);
    var lipB = lipA.clone(); lipB.position.x = -t / 2 + 0.004; g.add(lipB);
    var hub = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, t + 0.004, 48), chrome); hub.rotation.z = Math.PI / 2; g.add(hub);
    [1, -1].forEach(function (d) {
      var fm = mat.clone();
      var f = new T.Mesh(new T.RingGeometry(0.049, R - 0.002, 96, 1), fm);
      f.rotation.y = d * Math.PI / 2; f.position.x = d * (t / 2 - 0.001); g.add(f);
      faces.push({ mat: fm, kind: kind });
    });
    g.position.x = s * x; bar.add(g);
  }

  function applyFaces() {
    var red = faceTexture(["#8a0d14", "#4a0509"], "rgba(0,0,0,.35)", "25", "SPORT HUB · 25 KG");
    var drk = faceTexture(["#2a2a2a", "#111111"], "rgba(255,255,255,.12)", "5", "SPORT HUB · 5 KG");
    faces.forEach(function (f) { f.mat.map = f.kind === "red" ? red : drk; f.mat.color.set(0xffffff); f.mat.needsUpdate = true; });
  }
  var fontsReady = document.fonts && document.fonts.load ? document.fonts.load('600 96px Oswald') : Promise.resolve();
  Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 2500); })]).then(applyFaces, applyFaces);

  var pivot = new T.Group(); pivot.add(bar); scene.add(pivot);

  /* ---- interaction state ---- */
  var drag = { on: false, x: 0, y: 0, yaw: 0, pitch: 0, vy: 0, vp: 0, used: false };
  var gyro = { on: false, yaw: 0, pitch: 0, b0: null, g0: null };
  var cur = { yaw: 0.5, pitch: 0.2 };

  stage.addEventListener("pointerdown", function (e) {
    if (e.target.closest(".gyro-btn")) return;
    drag.on = true; drag.x = e.clientX; drag.y = e.clientY; drag.vy = drag.vp = 0;
    if (e.pointerType === "mouse") stage.setPointerCapture(e.pointerId);
  });
  window.addEventListener("pointermove", function (e) {
    if (!drag.on) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    drag.vy = dx * 0.009; drag.vp = dy * 0.006;
    drag.yaw += drag.vy; drag.pitch = Math.max(-1.1, Math.min(1.1, drag.pitch + drag.vp));
  }, { passive: true });
  ["pointerup", "pointercancel"].forEach(function (n) { window.addEventListener(n, function () { drag.on = false; }); });

  /* ---- device tilt ---- */
  function onOrient(e) {
    if (e.beta == null || e.gamma == null) return;
    if (gyro.b0 === null) { gyro.b0 = e.beta; gyro.g0 = e.gamma; }
    gyro.on = true;
    gyro.b0 += (e.beta - gyro.b0) * 0.004;           // slowly re-centre
    gyro.g0 += (e.gamma - gyro.g0) * 0.004;
    var d = Math.PI / 180;
    gyro.yaw = Math.max(-Math.PI, Math.min(Math.PI, (e.gamma - gyro.g0) * d * 2.4));
    gyro.pitch = Math.max(-0.95, Math.min(0.95, (e.beta - gyro.b0) * d * 1.4));
  }
  if (touch && ("ontouchstart" in window) && window.DeviceOrientationEvent) {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      // iOS asks once, on the visitor's first tap anywhere on the page
      var ask = function () {
        document.removeEventListener("touchend", ask);
        DeviceOrientationEvent.requestPermission().then(function (s) {
          if (s === "granted") window.addEventListener("deviceorientation", onOrient);
        }).catch(function () {});
      };
      document.addEventListener("touchend", ask);
    } else {
      window.addEventListener("deviceorientation", onOrient);
    }
  }

  /* ---- layout + render loop ---- */
  var W = 0, H = 0;
  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    if (w === W && Math.abs(h - H) < 2) return;
    W = w; H = h; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize); resize();

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  var last = performance.now(), spin = 0, started = false;
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden || (modal && !modal.hidden)) { last = now; return; }
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    var t = now / 1000;
    resize();

    var upp = (2 * Math.tan(FOV * Math.PI / 360) * DIST) / H;   // world units per CSS px
    var sr = stage.getBoundingClientRect();
    var wpx = Math.min(sr.width * 0.94, 820, (sr.height - 20) * 3.4);
    var hs = wpx * upp / 2.2;
    var hx = (sr.left + sr.width / 2 - W / 2) * upp;
    var hy = -(sr.top + sr.height / 2 - H / 2) * upp;
    var wide = W > 860;
    var bs = (wide ? W * 0.62 : W * 1.05) * upp / 2.2;
    var bx = wide ? W * 0.18 * upp : 0, by = wide ? 0 : H * 0.05 * upp;
    var p = ease(clamp(window.scrollY / (hero.offsetHeight * 0.8), 0, 1));

    pivot.position.set(lerp(hx, bx, p), lerp(hy, by, p), 0);
    pivot.scale.setScalar(lerp(hs, bs, p));
    canvas.style.setProperty("--dim", (1 - p * (wide ? 0.7 : 0.82)).toFixed(3));

    if (!drag.on) {                       // inertia, then settle
      drag.yaw += drag.vy; drag.vy *= 0.94;
      drag.vp *= 0.9;
      if (!gyro.on) drag.pitch *= 0.985;
    }
    spin += dt * (0.06 + p * 0.14) * (reduce ? 0 : 1);
    var sway = reduce ? 0 : Math.sin(t * 0.35) * 0.28;
    var tYaw = 0.55 + sway + spin + window.scrollY * 0.0011 + drag.yaw + gyro.yaw;
    var tPitch = 0.2 + (reduce ? 0 : Math.sin(t * 0.5) * 0.04) + drag.pitch + gyro.pitch + p * 0.25;
    var k = 1 - Math.exp(-dt * (drag.on ? 18 : 7));
    cur.yaw += (tYaw - cur.yaw) * k; cur.pitch += (tPitch - cur.pitch) * k;
    pivot.rotation.set(cur.pitch, 0, 0);
    bar.rotation.set(0, cur.yaw, Math.sin(t * 0.3) * 0.02);

    renderer.render(scene, camera);
    if (!started) { started = true; root.classList.add("has-3d"); setTimeout(function () { root.classList.add("bar3d-live"); }, 2600); }
  }
  requestAnimationFrame(frame);
})();
