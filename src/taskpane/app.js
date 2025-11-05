const STORAGE_KEY = "wordcount-goals";
const WEEK_DAYS = ["L", "Ma", "Me", "J", "V", "S", "D"];

const goalForm = document.getElementById("goal-form");
const modeSelect = document.getElementById("mode-select");
const dailyGoalInput = document.getElementById("daily-goal");
const weeklyGoalInput = document.getElementById("weekly-goal");
const projectGoalInput = document.getElementById("project-goal");
const projectNameInput = document.getElementById("project-name");
const soundEnabledInput = document.getElementById("sound-enabled");
const notifEnabledInput = document.getElementById("notif-enabled");
const refreshButton = document.getElementById("refresh-count");
const saveProgressButton = document.getElementById("save-progress");
const manualCountInput = document.getElementById("manual-count");
const currentStats = document.getElementById("current-stats");
const alertArea = document.getElementById("alert-area");
const calendarGrid = document.getElementById("calendar-grid");
const calendarTitle = document.getElementById("calendar-title");
const prevMonthButton = document.getElementById("prev-month");
const nextMonthButton = document.getElementById("next-month");
const statsSummary = document.getElementById("stats-summary");
const audio = document.getElementById("goal-audio");
const dayTemplate = document.getElementById("calendar-day-template");

let data = loadData();
let selectedMonth = startOfMonth(new Date());
let latestCount = 0;

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptyState();
    }
    return { ...createEmptyState(), ...JSON.parse(raw) };
  } catch (error) {
    console.error("Impossible de lire les données", error);
    return createEmptyState();
  }
}

function createEmptyState() {
  return {
    goals: {
      mode: "words",
      daily: 0,
      weekly: 0,
      project: 0,
      name: "",
    },
    soundEnabled: true,
    notifEnabled: true,
    progress: {},
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getTodayKey() {
  return formatDate(new Date());
}

function renderGoals() {
  modeSelect.value = data.goals.mode;
  dailyGoalInput.value = data.goals.daily || "";
  weeklyGoalInput.value = data.goals.weekly || "";
  projectGoalInput.value = data.goals.project || "";
  projectNameInput.value = data.goals.name || "";
  soundEnabledInput.checked = data.soundEnabled;
  notifEnabledInput.checked = data.notifEnabled;
}

function renderCurrentStats() {
  const todayKey = getTodayKey();
  const todaysProgress = data.progress[todayKey];
  const unitLabel = data.goals.mode === "words" ? "mots" : "caractères";
  const pieces = [];

  if (todaysProgress) {
    pieces.push(`<strong>${todaysProgress.count}</strong>${unitLabel} aujourd'hui`);
  } else {
    pieces.push("Aucune progression enregistrée pour aujourd'hui.");
  }

  if (data.goals.project) {
    const total = getTotalProgress();
    const remaining = Math.max(data.goals.project - total, 0);
    const projectName = data.goals.name || "Projet";
    pieces.push(`${projectName}: ${total}/${data.goals.project} ${unitLabel} (reste ${remaining})`);
  }

  currentStats.innerHTML = pieces.map((piece) => `<div>${piece}</div>`).join("");
}

function getTotalProgress() {
  return Object.values(data.progress).reduce((acc, entry) => acc + (entry.count || 0), 0);
}

function renderCalendar() {
  calendarGrid.innerHTML = "";
  const monthStart = new Date(selectedMonth);
  const monthTitle = monthStart.toLocaleString("fr-FR", { month: "long", year: "numeric" });
  calendarTitle.textContent = capitalize(monthTitle);

  WEEK_DAYS.forEach((day) => {
    const label = document.createElement("div");
    label.className = "weekday";
    label.textContent = day;
    calendarGrid.appendChild(label);
  });

  const firstDayWeekday = (monthStart.getDay() + 6) % 7; // convert to Monday first
  for (let i = 0; i < firstDayWeekday; i++) {
    const placeholder = document.createElement("div");
    calendarGrid.appendChild(placeholder);
  }

  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const unitLabel = data.goals.mode === "words" ? "mots" : "caractères";

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    const key = formatDate(date);
    const entry = data.progress[key];
    const node = dayTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".date").textContent = day.toString();

    if (entry) {
      node.querySelector(".value").textContent = `${entry.count} ${unitLabel}`;
      const status = computeStatus(entry.count);
      if (status) {
        node.classList.add(status);
      }
    } else {
      node.querySelector(".value").textContent = "";
      node.classList.add("empty");
    }

    calendarGrid.appendChild(node);
  }
}

function renderStats() {
  const entries = Object.entries(data.progress)
    .filter(([date]) => new Date(date) <= new Date())
    .sort(([a], [b]) => (a < b ? -1 : 1));

  if (!entries.length) {
    statsSummary.innerHTML = "Pas encore de statistiques disponibles.";
    return;
  }

  const counts = entries.map(([, entry]) => entry.count);
  const total = counts.reduce((acc, value) => acc + value, 0);
  const average = Math.round(total / counts.length);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const streak = computeStreak(entries);
  const unitLabel = data.goals.mode === "words" ? "mots" : "caractères";

  statsSummary.innerHTML = `
    <div><strong>${average}</strong>${unitLabel} en moyenne par jour</div>
    <div>Minimum: ${min} · Maximum: ${max}</div>
    <div>Streak: ${streak} jour${streak > 1 ? "s" : ""} consécutif${streak > 1 ? "s" : ""} avec objectif atteint</div>
  `;
}

function computeStreak(entries) {
  let longest = 0;
  let current = 0;
  const goal = data.goals.daily;

  entries.forEach(([, entry]) => {
    if (goal && entry.count >= goal) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  });

  return longest;
}

function computeStatus(count) {
  const goal = data.goals.daily;
  if (!goal) return "";
  if (count >= goal) return "success";
  if (count >= goal * 0.8) return "partial";
  return "miss";
}

function showAlert(message) {
  if (!message) {
    alertArea.classList.add("hidden");
    alertArea.textContent = "";
    return;
  }
  alertArea.textContent = message;
  alertArea.classList.remove("hidden");
}

function playSuccessFeedback() {
  if (data.soundEnabled) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
  if (data.notifEnabled) {
    showAlert("🎉 Objectif atteint ! Bravo !");
  }
}

async function refreshFromDocument() {
  try {
    const counts = await getDocumentCounts();
    latestCount = counts[data.goals.mode];
    manualCountInput.value = latestCount;
    showAlert(`Dernière lecture: ${latestCount} ${data.goals.mode === "words" ? "mots" : "caractères"}.`);
  } catch (error) {
    console.error(error);
    showAlert("Impossible de lire le document. Vous pouvez saisir la valeur manuellement.");
  }
}

async function getDocumentCounts() {
  if (!window.Office || !Office.context || !Office.context.document) {
    throw new Error("Office.js n'est pas disponible");
  }

  return Word.run(async (context) => {
    const body = context.document.body;
    context.load(body, "text");
    await context.sync();
    const text = body.text || "";
    const sanitized = text.replace(/[\u0000-\u001F]/g, " ");
    const words = sanitized.trim() ? sanitized.trim().split(/\s+/).length : 0;
    const characters = sanitized.length;
    return { words, characters };
  });
}

function saveProgress(count) {
  const todayKey = getTodayKey();
  data.progress[todayKey] = {
    count,
    timestamp: Date.now(),
  };
  persist();
  renderCurrentStats();
  renderCalendar();
  renderStats();

  if (data.goals.daily && count >= data.goals.daily) {
    playSuccessFeedback();
    return;
  }

  if (data.goals.project) {
    const total = getTotalProgress();
    if (total >= data.goals.project) {
      playSuccessFeedback();
      return;
    }
  }

  showAlert("Progression sauvegardée !");
}

function bindEvents() {
  goalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    data.goals.mode = modeSelect.value;
    data.goals.daily = Number(dailyGoalInput.value) || 0;
    data.goals.weekly = Number(weeklyGoalInput.value) || 0;
    data.goals.project = Number(projectGoalInput.value) || 0;
    data.goals.name = projectNameInput.value.trim();
    data.soundEnabled = soundEnabledInput.checked;
    data.notifEnabled = notifEnabledInput.checked;
    persist();
    renderCalendar();
    renderStats();
    renderCurrentStats();
    showAlert("Objectifs mis à jour !");
  });

  refreshButton.addEventListener("click", () => {
    refreshFromDocument();
  });

  saveProgressButton.addEventListener("click", () => {
    const value = Number(manualCountInput.value || latestCount || 0);
    saveProgress(value);
  });

  prevMonthButton.addEventListener("click", () => {
    selectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
    renderCalendar();
  });

  nextMonthButton.addEventListener("click", () => {
    selectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
    renderCalendar();
  });
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function init() {
  renderGoals();
  renderCurrentStats();
  renderCalendar();
  renderStats();
  bindEvents();
}

if (window.Office) {
  Office.onReady(() => init());
} else {
  document.addEventListener("DOMContentLoaded", () => init());
}
