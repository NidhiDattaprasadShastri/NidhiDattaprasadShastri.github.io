// ===== Desktop window manager for Nidhi's website =====
// Handles opening, closing, minimizing, maximizing and dragging windows,
// plus the taskbar, Start menu and clock.
// No window opens automatically: visitors click an icon to open one.

const desktop = document.getElementById("desktop");
const taskList = document.getElementById("taskList");
const startMenu = document.getElementById("startMenu");
const windows = document.querySelectorAll(".window");
const isPhone = () => window.matchMedia("(max-width: 768px)").matches;

let topZ = 10;          // highest z-index so far
let openCount = 0;      // used to cascade new windows

// 1. Add a title bar with buttons to every window
windows.forEach((win) => {
  const bar = document.createElement("div");
  bar.className = "titlebar";
  bar.innerHTML = `
    <span class="title"><i class="bi ${win.dataset.icon}"></i>${win.dataset.title}</span>
    <button class="win-btn min" aria-label="Minimize"><i class="bi bi-dash-lg"></i></button>
    <button class="win-btn max" aria-label="Maximize"><i class="bi bi-square"></i></button>
    <button class="win-btn close" aria-label="Close"><i class="bi bi-x-lg"></i></button>`;
  win.prepend(bar);
  win.setAttribute("role", "dialog");
  win.setAttribute("aria-label", win.dataset.title);

  bar.querySelector(".min").addEventListener("click", () => minimizeWindow(win));
  bar.querySelector(".max").addEventListener("click", () => win.classList.toggle("maximized"));
  bar.querySelector(".close").addEventListener("click", () => closeWindow(win));
  bar.addEventListener("dblclick", (e) => { if (!e.target.closest(".win-btn")) win.classList.toggle("maximized"); });
  win.addEventListener("pointerdown", () => focusWindow(win));
  makeDraggable(win, bar);

  // Add this window to the Start menu
  const li = document.createElement("li");
  li.innerHTML = `<button class="dropdown-item"><i class="bi ${win.dataset.icon}"></i>${win.dataset.title}</button>`;
  li.querySelector("button").addEventListener("click", () => openWindow(win.id));
  startMenu.appendChild(li);
});

// 2. Open / focus / minimize / close
function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  if (win.hidden && !win.dataset.minimized) {
    // First time opening: place it in a cascade next to the icons
    win.hidden = false; // show first so its width can be measured
    const step = (openCount++ % 6) * 28;
    win.style.left = Math.min(140 + step, Math.max(16, desktop.clientWidth - win.offsetWidth - 16)) + "px";
    win.style.top = 24 + step + "px";
    win.classList.add("opening");
    setTimeout(() => win.classList.remove("opening"), 200);
    addTask(win);
  }
  win.hidden = false;
  delete win.dataset.minimized;
  focusWindow(win);
}

function focusWindow(win) {
  windows.forEach((w) => w.classList.remove("active"));
  win.classList.add("active");
  win.style.zIndex = ++topZ;
  document.querySelectorAll(".task").forEach((t) => t.classList.toggle("active", t.dataset.window === win.id));
}

function minimizeWindow(win) {
  win.hidden = true;
  win.dataset.minimized = "true";
  win.classList.remove("active");
  document.querySelector(`.task[data-window="${win.id}"]`)?.classList.remove("active");
}

function closeWindow(win) {
  win.hidden = true;
  delete win.dataset.minimized;
  win.classList.remove("maximized", "active");
  document.querySelector(`.task[data-window="${win.id}"]`)?.remove();
}

// 3. Taskbar buttons for open windows
function addTask(win) {
  if (document.querySelector(`.task[data-window="${win.id}"]`)) return;
  const btn = document.createElement("button");
  btn.className = "task";
  btn.dataset.window = win.id;
  btn.innerHTML = `<i class="bi ${win.dataset.icon}"></i><span>${win.dataset.title}</span>`;
  btn.addEventListener("click", () => {
    if (win.classList.contains("active") && !win.hidden) minimizeWindow(win);
    else openWindow(win.id);
  });
  taskList.appendChild(btn);
}

// 4. Dragging windows by their title bar (mouse, pen and touch)
function makeDraggable(win, handle) {
  let startX, startY, startLeft, startTop;
  handle.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".win-btn") || isPhone() || win.classList.contains("maximized")) return;
    startX = e.clientX; startY = e.clientY;
    startLeft = win.offsetLeft; startTop = win.offsetTop;
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener("pointermove", (e) => {
    if (!handle.hasPointerCapture(e.pointerId)) return;
    const maxLeft = desktop.clientWidth - 80;
    const maxTop = desktop.clientHeight - 40;
    win.style.left = Math.min(maxLeft, Math.max(-win.offsetWidth + 80, startLeft + e.clientX - startX)) + "px";
    win.style.top = Math.min(maxTop, Math.max(0, startTop + e.clientY - startY)) + "px";
  });
  handle.addEventListener("pointerup", (e) => handle.releasePointerCapture(e.pointerId));
}

// 5. Desktop icons and in-window buttons that open other windows
document.querySelectorAll("[data-window].icon, [data-open]").forEach((el) => {
  el.addEventListener("click", () => openWindow(el.dataset.window || el.dataset.open));
});

// 6. Press Escape to close the active window
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const active = document.querySelector(".window.active:not([hidden])");
  if (active) closeWindow(active);
});

// 7. Taskbar clock
function updateClock() {
  const now = new Date();
  document.getElementById("clock").innerHTML =
    now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + "<br>" +
    now.toLocaleDateString([], { month: "short", day: "numeric" });
}
updateClock();
setInterval(updateClock, 30000);

