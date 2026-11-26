import { chapters } from "./chapters.js";
import { createRenderer } from "./renderer.js";

const byId = (id) => document.getElementById(id);
const chapterList = byId("chapter-list");
const title = byId("chapter-title");
const intro = byId("chapter-intro");
const selector = byId("example");
const editor = byId("shader");
const stage = byId("stage");
const canvas = byId("preview");
const status = byId("status");
const pause = byId("pause");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

let renderer;
let chapter;
let drafts;
let activeStage = "fragment";
let programState = {};
let frame = 0;
let seconds = 0;
let lastFrameTime;
let paused = reducedMotion.matches;
let pointer = [0.5, 0.5];

function showStatus(message, error = false) {
  status.textContent = message;
  status.dataset.error = String(error);
}

function stopFrame() {
  cancelAnimationFrame(frame);
  frame = 0;
  lastFrameTime = undefined;
}

function draw(timestamp) {
  frame = 0;
  if (lastFrameTime !== undefined) seconds += (timestamp - lastFrameTime) / 1000;
  lastFrameTime = timestamp;
  renderer?.draw(seconds, pointer);
  if (programState.animated && !paused && !document.hidden) {
    frame = requestAnimationFrame(draw);
  } else {
    lastFrameTime = undefined;
  }
}

function scheduleFrame() {
  if (renderer && !frame && !document.hidden) frame = requestAnimationFrame(draw);
}

function updatePause() {
  pause.hidden = !programState.animated;
  pause.textContent = paused ? "播放动画" : "暂停动画";
}

function run() {
  if (!renderer) return;
  drafts[activeStage] = editor.value;
  try {
    const nextState = renderer.setSource(drafts);
    stopFrame();
    programState = nextState;
    seconds = 0;
    updatePause();
    showStatus(programState.pointer ? "运行成功。移动指针或触碰画布试试。" : "运行成功。");
    scheduleFrame();
  } catch (error) {
    showStatus(error.message, true);
  }
}

function loadExample() {
  drafts = { ...chapter.examples[Number(selector.value)] };
  editor.value = drafts[activeStage];
  editor.scrollTop = 0;
  pointer = [0.5, 0.5];
  run();
}

function chapterLink(item, label = item.title) {
  const link = document.createElement("a");
  link.href = "#" + item.id;
  link.textContent = label;
  return link;
}

function textWithCode(element, text) {
  text.split("|").forEach((part, index) => {
    if (index % 2 === 0) {
      element.append(part);
      return;
    }
    const code = document.createElement("code");
    code.textContent = part;
    element.append(code);
  });
  return element;
}

function renderChapter(focus = false) {
  const index = Math.max(0, chapters.findIndex((item) => "#" + item.id === location.hash));
  chapter = chapters[index];
  title.textContent = chapter.title;
  intro.textContent = chapter.intro;
  document.title = chapter.title + " | GLSL 中文互动教程";
  for (const link of chapterList.querySelectorAll("a")) {
    if (link.hash === "#" + chapter.id) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }

  selector.replaceChildren(...chapter.examples.map(({ name }, position) => new Option(name, position)));
  stage.value = activeStage = "fragment";
  loadExample();

  const heading = document.createElement("h2");
  heading.textContent = "原理";
  const exercises = document.createElement("h2");
  exercises.textContent = "动手练习";
  const list = document.createElement("ol");
  list.append(...chapter.exercises.map((text) => textWithCode(document.createElement("li"), text)));
  byId("lesson").replaceChildren(
    heading,
    ...chapter.paragraphs.map((text) => textWithCode(document.createElement("p"), text)),
    exercises,
    list,
  );

  const previous = chapters[index - 1];
  const next = chapters[index + 1];
  const navigation = byId("chapter-nav");
  navigation.replaceChildren();
  if (previous) navigation.append(chapterLink(previous, "上一章 · " + previous.title));
  if (next) navigation.append(chapterLink(next, "下一章 · " + next.title));
  if (focus) {
    title.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}

chapters.forEach((item, index) => {
  const entry = document.createElement("li");
  const link = chapterLink(item);
  const number = document.createElement("span");
  number.className = "chapter-number";
  number.textContent = String(index + 1).padStart(2, "0");
  number.setAttribute("aria-hidden", "true");
  const name = document.createElement("span");
  name.textContent = item.title;
  link.replaceChildren(number, name);
  entry.append(link);
  chapterList.append(entry);
});

function initializeRenderer() {
  try {
    renderer = createRenderer(canvas);
    byId("run").disabled = false;
    if (drafts) run();
  } catch (error) {
    byId("run").disabled = true;
    showStatus(error.message, true);
  }
}

selector.addEventListener("change", loadExample);
byId("reset").addEventListener("click", loadExample);
byId("run").addEventListener("click", run);
stage.addEventListener("change", () => {
  drafts[activeStage] = editor.value;
  activeStage = stage.value;
  editor.value = drafts[activeStage];
  editor.scrollTop = 0;
});
editor.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    run();
  }
});
pause.addEventListener("click", () => {
  paused = !paused;
  stopFrame();
  updatePause();
  scheduleFrame();
});
reducedMotion.addEventListener("change", (event) => {
  paused = event.matches;
  stopFrame();
  updatePause();
  scheduleFrame();
});
function movePointer(event) {
  const rect = canvas.getBoundingClientRect();
  pointer = [(event.clientX - rect.left) / rect.width, 1 - (event.clientY - rect.top) / rect.height];
  if (programState.pointer) scheduleFrame();
}
canvas.addEventListener("pointerdown", movePointer);
canvas.addEventListener("pointermove", movePointer);
canvas.addEventListener("webglcontextlost", (event) => {
  event.preventDefault();
  stopFrame();
  renderer = undefined;
  byId("run").disabled = true;
  showStatus("WebGL 上下文已丢失，正在等待浏览器恢复。", true);
});
canvas.addEventListener("webglcontextrestored", initializeRenderer);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopFrame();
  else scheduleFrame();
});
new ResizeObserver(scheduleFrame).observe(canvas);
window.addEventListener("hashchange", () => renderChapter(true));

initializeRenderer();
renderChapter();
