// =========================
// 単語
// =========================
const wordString = `
apple
orange
banana
grape
peach
strawberry
watermelon
pineapple
rhythm
accommodate
embarrass
conscience
miscellaneous
pronunciation
questionnaire
entrepreneur
privilege
psychology
acknowledge
occurrence
maintenance
independent
apparently
definitely
existence
superintendent
restaurant
calendar
government
separate
consensus
millennium
liaison
hierarchy
archaeology
exaggerate
fluorescent
perseverance
conscientious
indispensable
accidentally
commitment
recommend
fulfillment
recognizable
irresistible
possession
supersede
threshold
maneuver
subtle
chaos
yacht
choir
receipt
debt
doubt
pneumonia
mnemonic
knowledge
wrist
answer
honest
hour
heir
vehicle
leisure
weird
foreign
neighbor
beige
caffeine
seize
counterfeit
surveillance
silhouette
boutique
genre
debris
elite
ballet
facade
resume
naive
fiance
cafe
protocol
algorithm
hypothesis
bureaucracy
diagnosis
analysis
synthesis
phenomenon
criterion
curriculum
apparatus
parallel
harassment
accessible
necessary
occasion
opportunity
immediately
successful
experience
`;

// =========================
// データ生成
// =========================
const originalQuizData = wordString
  .split(/\n+/)
  .map(w => w.trim())
  .filter(w => w !== "")
  .map(w => ({ word: w }));

// =========================
// 状態
// =========================
let quizData = [];
let currentIndex = 0;
let score = 0;
let playCount = 0;
let isAnswered = false;
let autoNextTimer = null;

let missCount = 0;
const maxMisses = 3;
const maxPlay = 2;

// =========================
// LocalStorage Key
// =========================
const STORAGE_KEYS = {
  playerName: "audioSpelling_playerName",
  history: "audioSpelling_history"
};

// =========================
// 要素
// =========================
const answerInput = document.getElementById("answerInput");
const resultEl = document.getElementById("result");
const hintEl = document.getElementById("hint");

const playAudioBtn = document.getElementById("playAudioBtn");
const checkBtn = document.getElementById("checkBtn");

const stateImage = document.getElementById("stateImage");

const hearts = [
  document.getElementById("heart1"),
  document.getElementById("heart2"),
  document.getElementById("heart3")
];

const feedbackBox = document.getElementById("feedbackBox");
const correctAnswerText = document.getElementById("correctAnswerText");
const compareBox = document.getElementById("compareBox");
const userCompare = document.getElementById("userCompare");
const correctCompare = document.getElementById("correctCompare");

const endButtons = document.getElementById("endButtons");
const reviewBtn = document.getElementById("reviewBtn");
const restartBtn = document.getElementById("restartBtn");

// 追加UI
const playerNameInput = document.getElementById("playerNameInput");
const summaryBox = document.getElementById("summaryBox");
const summaryUserName = document.getElementById("summaryUserName");
const summaryScore = document.getElementById("summaryScore");
const summaryBestScore = document.getElementById("summaryBestScore");
const todayHistoryList = document.getElementById("todayHistoryList");

// =========================
// 画像
// =========================
const imagePaths = {
  idle: "images/idle.png",
  typing: "images/type.png",
  correct: "images/correct.png",
  incorrect: "images/incorrect.png",
  gameover: "images/gameover.png"
};

const HEART_BLACK = "images/Heart-black.png";
const HEART_WHITE = "images/Heart-white.png";

// =========================
// 音
// =========================
const correctSound = new Audio("audio/correct.mp3");
const incorrectSound = new Audio("audio/incorrect.mp3");

// =========================
// 基本ヘルパー
// =========================
function setStateImage(state) {
  stateImage.src = imagePaths[state];
}

function updateHearts() {
  const livesLeft = maxMisses - missCount;
  hearts.forEach((heart, i) => {
    heart.src = i < livesLeft ? HEART_BLACK : HEART_WHITE;
  });
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function playWord(word) {
  if (playCount >= maxPlay) return;

  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  speechSynthesis.speak(u);

  playCount++;
}

function playEffect(sound) {
  sound.pause();
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function hideFeedback() {
  feedbackBox.style.display = "none";
  compareBox.style.display = "none";
  correctAnswerText.textContent = "";
  userCompare.innerHTML = "";
  correctCompare.innerHTML = "";
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildCompareHtml(user, correct) {
  const maxLen = Math.max(user.length, correct.length);
  let userHtml = "";
  let correctHtml = "";

  for (let i = 0; i < maxLen; i++) {
    const u = user[i] ?? "";
    const c = correct[i] ?? "";

    const safeU = escapeHtml(u);
    const safeC = escapeHtml(c);

    if (u === c) {
      if (u !== "") userHtml += `<span class="char-correct">${safeU}</span>`;
      if (c !== "") correctHtml += `<span class="char-correct">${safeC}</span>`;
    } else {
      if (u === "") {
        userHtml += `<span class="char-missing">_</span>`;
      } else if (c === "") {
        userHtml += `<span class="char-extra">${safeU}</span>`;
      } else {
        userHtml += `<span class="char-wrong">${safeU}</span>`;
      }

      if (c === "") {
        correctHtml += `<span class="char-extra">_</span>`;
      } else if (u === "") {
        correctHtml += `<span class="char-missing">${safeC}</span>`;
      } else {
        correctHtml += `<span class="char-wrong">${safeC}</span>`;
      }
    }
  }

  return { userHtml, correctHtml };
}

function showIncorrect(user, correct) {
  feedbackBox.style.display = "block";
  compareBox.style.display = "block";
  correctAnswerText.textContent = correct;

  const compared = buildCompareHtml(user, correct);
  userCompare.innerHTML = compared.userHtml;
  correctCompare.innerHTML = compared.correctHtml;
}

// =========================
// ユーザー名
// =========================
function getPlayerName() {
  const name = playerNameInput.value.trim();
  return name || "Guest";
}

function savePlayerName() {
  localStorage.setItem(STORAGE_KEYS.playerName, playerNameInput.value.trim());
}

function loadPlayerName() {
  const savedName = localStorage.getItem(STORAGE_KEYS.playerName);
  if (savedName) {
    playerNameInput.value = savedName;
  }
}

// =========================
// 履歴
// =========================
function getTodayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getCurrentTimeString() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function getAllHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.history)) || {};
  } catch {
    return {};
  }
}

function saveAllHistory(history) {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
}

function saveResultToHistory(finalPercent) {
  const playerName = getPlayerName();
  const today = getTodayString();
  const time = getCurrentTimeString();

  const allHistory = getAllHistory();

  if (!allHistory[playerName]) {
    allHistory[playerName] = [];
  }

  allHistory[playerName].push({
    date: today,
    time,
    score: finalPercent
  });

  saveAllHistory(allHistory);
}

function getPlayerHistoryToday() {
  const playerName = getPlayerName();
  const today = getTodayString();
  const allHistory = getAllHistory();

  const playerHistory = allHistory[playerName] || [];
  return playerHistory.filter(item => item.date === today);
}

function getPlayerBestScore() {
  const playerName = getPlayerName();
  const allHistory = getAllHistory();
  const playerHistory = allHistory[playerName] || [];

  if (playerHistory.length === 0) return null;

  return Math.max(...playerHistory.map(item => item.score));
}

// =========================
// サマリー表示
// =========================
function renderTodayHistory() {
  const todayHistory = getPlayerHistoryToday();
  todayHistoryList.innerHTML = "";

  if (todayHistory.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No plays yet today.";
    todayHistoryList.appendChild(li);
    return;
  }

  todayHistory
    .slice()
    .reverse()
    .forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.time} - ${item.score}%`;
      todayHistoryList.appendChild(li);
    });
}

function showSummary(finalPercent) {
  const playerName = getPlayerName();
  const bestScore = getPlayerBestScore();

  summaryUserName.textContent = playerName;
  summaryScore.textContent = `${finalPercent}%`;
  summaryBestScore.textContent = bestScore !== null ? `${bestScore}%` : "-";

  renderTodayHistory();
  summaryBox.style.display = "block";
}

function hideSummary() {
  summaryBox.style.display = "none";
  summaryUserName.textContent = "";
  summaryScore.textContent = "";
  summaryBestScore.textContent = "";
  todayHistoryList.innerHTML = "";
}

// =========================
// 問題
// =========================
function loadQuestion() {
  if (autoNextTimer) {
    clearTimeout(autoNextTimer);
    autoNextTimer = null;
  }

  answerInput.value = "";
  resultEl.textContent = "";
  hintEl.textContent = "";
  isAnswered = false;
  playCount = 0;

  setStateImage("idle");
  updateHearts();
  hideFeedback();

  answerInput.focus();
}

// =========================
// 判定
// =========================
function checkAnswer() {
  if (isAnswered) return;

  const user = answerInput.value.trim().toLowerCase();
  const correct = quizData[currentIndex].word.toLowerCase();

  let isCorrect = false;
  isAnswered = true;

  if (user === correct) {
    isCorrect = true;
    score++;
    resultEl.textContent = "Correct!";
    setStateImage("correct");
    playEffect(correctSound);
  } else {
    resultEl.textContent = "Incorrect!";
    missCount++;
    setStateImage("incorrect");
    playEffect(incorrectSound);
    updateHearts();
    showIncorrect(user, correct);
  }

  if (missCount >= maxMisses) {
    autoNextTimer = setTimeout(gameOver, 1500);
    return;
  }

  const delay = isCorrect ? 3000 : 5000;
  autoNextTimer = setTimeout(nextQuestion, delay);
}

// =========================
// 次
// =========================
function nextQuestion() {
  if (autoNextTimer) {
    clearTimeout(autoNextTimer);
    autoNextTimer = null;
  }

  currentIndex++;

  if (currentIndex >= quizData.length) {
    finish();
    return;
  }

  loadQuestion();
}

// =========================
// 終了
// =========================
function endGameScreen(titleText) {
  const finalPercent = Math.round((score / quizData.length) * 100);

  savePlayerName();
  saveResultToHistory(finalPercent);

  setStateImage(titleText === "GAME OVER" ? "gameover" : "correct");
  hintEl.innerHTML = `<span class="big-title">${titleText}</span>`;
  resultEl.innerHTML = `<span class="big-score">${finalPercent}%</span>`;
  endButtons.style.display = "block";

  showSummary(finalPercent);
}

function gameOver() {
  endGameScreen("GAME OVER");
}

function finish() {
  endGameScreen("RESULT");
}

// =========================
// イベント
// =========================
playAudioBtn.onclick = () => {
  if (!quizData.length) return;
  playWord(quizData[currentIndex].word);
};

checkBtn.onclick = (e) => {
  e.preventDefault();
  checkAnswer();
};

document.addEventListener("keydown", (e) => {
  if (e.code === "Enter") {
    // ⭐ Enter暴発防止
    if (document.activeElement !== answerInput) return;

    e.preventDefault();
    checkAnswer();
  }

  if (e.code === "Space") {
    e.preventDefault();
    if (!quizData.length) return;
    playWord(quizData[currentIndex].word);
  }
});

restartBtn.onclick = startGame;

playerNameInput.addEventListener("input", () => {
  savePlayerName();
});


// =========================
// 開始
// =========================
function startGame() {
  quizData = shuffle(originalQuizData);
  currentIndex = 0;
  score = 0;
  missCount = 0;
  playCount = 0;
  isAnswered = false;

  if (autoNextTimer) {
    clearTimeout(autoNextTimer);
    autoNextTimer = null;
  }

  endButtons.style.display = "none";
  hintEl.textContent = "";
  resultEl.textContent = "";

  hideSummary();
  updateHearts();
  hideFeedback();
  loadQuestion();
}

loadPlayerName();
startGame();
