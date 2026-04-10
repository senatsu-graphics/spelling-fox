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
receive
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
  .map((w) => w.trim())
  .filter((w) => w !== "")
  .map((w) => ({ word: w }));

// =========================
// 状態
// =========================
let quizData = [];
let currentIndex = 0;
let score = 0;
let playCount = 0;
let isAnswered = false;
let autoNextTimer = null;
let shareTimer = null;

let missCount = 0;
const maxMisses = 3;
const maxPlay = 2;

// review用
let missedWords = [];
let reviewMode = false;

// 10秒タイマー
let questionTimer = null;
let timerAnimationFrame = null;
let questionStartTime = 0;
const questionTimeLimit = 10000;

// Playボタン演出
let playAttentionTimer = null;

// =========================
// LocalStorage Key
// =========================
const STORAGE_KEYS = {
  playerName: "audioSpelling_playerName",
  history: "audioSpelling_history"
};

// =========================
// スコア別セリフ
// =========================
const scoreMessages = {
  babyFox: [
    "Baby Fox... but the brain is still loading.",
    "Ouch. Even a sleepy fox could do better.",
    "That was rough. Very rough.",
    "You tried. The dictionary is still crying though.",
    "Tiny fox, huge spelling disaster.",
    "Not your brightest forest moment.",
    "That was... impressively questionable."
  ],
  growingFox: [
    "Growing Fox. At least you survived.",
    "Not terrible. Not impressive either.",
    "You're getting there... slowly.",
    "A slightly less confused fox.",
    "Somewhere in the middle of the forest.",
    "You missed a lot, but hey, progress.",
    "Still fluffy. Slightly smarter."
  ],
  cleverFox: [
    "Clever Fox. Now we're talking.",
    "Pretty sharp for a forest creature.",
    "Nice work. The fox is learning.",
    "That was actually solid.",
    "You've got some real spelling instincts.",
    "Smart fox energy.",
    "You cooked. Not gonna lie."
  ],
  legendaryFox: [
    "Legendary Fox. Absolutely unfair.",
    "Too good. Suspiciously good.",
    "The forest bows before your spelling power.",
    "You didn't just pass. You dominated.",
    "A true spelling predator.",
    "Elite fox behavior.",
    "You ate that. No crumbs."
  ]
};

function getScoreRank(scorePercent) {
  if (scorePercent < 40) return "babyFox";
  if (scorePercent < 70) return "growingFox";
  if (scorePercent < 90) return "cleverFox";
  return "legendaryFox";
}

function getRankLabel(rank) {
  switch (rank) {
    case "babyFox":
      return "Baby Fox";
    case "growingFox":
      return "Growing Fox";
    case "cleverFox":
      return "Clever Fox";
    case "legendaryFox":
      return "Legendary Fox";
    default:
      return "";
  }
}

function getRandomMessage(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getScoreMessage(scoreValue, totalValue) {
  const scorePercent = totalValue > 0 ? Math.round((scoreValue / totalValue) * 100) : 0;
  const rank = getScoreRank(scorePercent);
  const rankLabel = getRankLabel(rank);
  const message = getRandomMessage(scoreMessages[rank]);

  return {
    percent: scorePercent,
    rank,
    rankLabel,
    message
  };
}

// =========================
// 要素
// =========================
const answerInput = document.getElementById("answerInput");
const resultEl = document.getElementById("result");
const hintEl = document.getElementById("hint");

const playAudioBtn = document.getElementById("playAudioBtn");
const checkBtn = document.getElementById("checkBtn");

const stateImage = document.getElementById("stateImage");
const timerBar = document.getElementById("timerBar");

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

// SNSシェアボタン
const shareBtn = document.getElementById("shareBtn");

// =========================
// Shareボタン演出
// =========================
function startShareAttention() {
  if (!shareBtn) return;
  shareBtn.classList.add("share-attention");
}

function stopShareAttention() {
  if (!shareBtn) return;
  shareBtn.classList.remove("share-attention");
}

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

function addMissedWord(word) {
  if (!missedWords.includes(word)) {
    missedWords.push(word);
  }
}

function getCurrentWord() {
  return quizData[currentIndex].word.toLowerCase();
}

// =========================
// シェアボタン表示制御
// =========================
function showShareButton() {
  if (!shareBtn) return;
  shareBtn.style.display = "inline-block";
}

function hideShareButton() {
  if (!shareBtn) return;
  shareBtn.style.display = "none";
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

  return playerHistory.filter((item) => item.date === today);
}

function getPlayerBestScore() {
  const playerName = getPlayerName();
  const allHistory = getAllHistory();
  const playerHistory = allHistory[playerName] || [];

  if (playerHistory.length === 0) return null;
  return Math.max(...playerHistory.map((item) => item.score));
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
    .forEach((item) => {
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
// タイマー
// =========================
function stopQuestionTimer() {
  if (questionTimer) {
    clearTimeout(questionTimer);
    questionTimer = null;
  }

  if (timerAnimationFrame) {
    cancelAnimationFrame(timerAnimationFrame);
    timerAnimationFrame = null;
  }
}

function resetTimerBar() {
  if (!timerBar) return;
  timerBar.style.width = "100%";
}

function animateTimerBar() {
  if (!timerBar) return;

  const elapsed = Date.now() - questionStartTime;
  const remaining = Math.max(0, questionTimeLimit - elapsed);
  const percent = (remaining / questionTimeLimit) * 100;

  timerBar.style.width = `${percent}%`;

  if (remaining > 0) {
    timerAnimationFrame = requestAnimationFrame(animateTimerBar);
  }
}

function handleTimeUp() {
  if (isAnswered) return;

  isAnswered = true;
  stopQuestionTimer();

  missCount++;
  resultEl.textContent = "Time up!";
  setStateImage("incorrect");
  playEffect(incorrectSound);
  updateHearts();

  const correct = getCurrentWord();
  addMissedWord(correct);
  showIncorrect("", correct);

  if (missCount >= maxMisses) {
    autoNextTimer = setTimeout(gameOver, 1500);
    return;
  }

  autoNextTimer = setTimeout(nextQuestion, 5000);
}

function startQuestionTimer() {
  if (questionTimer) return;

  stopQuestionTimer();
  resetTimerBar();

  questionStartTime = Date.now();
  animateTimerBar();

  questionTimer = setTimeout(() => {
    handleTimeUp();
  }, questionTimeLimit);
}

// =========================
// Playボタン演出
// =========================
function stopPlayAttention() {
  playAudioBtn.classList.remove("attention");

  if (playAttentionTimer) {
    clearTimeout(playAttentionTimer);
    playAttentionTimer = null;
  }
}

function startPlayAttention() {
  stopPlayAttention();
  playAudioBtn.classList.add("attention");

  playAttentionTimer = setTimeout(() => {
    playAudioBtn.classList.remove("attention");
    playAttentionTimer = null;
  }, 5000);
}

// =========================
// SNSシェアボタン
// =========================
if (shareBtn) {
  shareBtn.onclick = () => {
    if (reviewMode) return;

    const playerName = getPlayerName();
    const finalPercent = Math.round((score / quizData.length) * 100);

    const text =
      `${playerName} scored ${finalPercent}% in Spelling Fox!\n` +
      `🦊Can you beat this score?\n`;

    const url = "https://spelling-fox.vercel.app/";

    const shareUrl =
      "https://twitter.com/intent/tweet?text=" +
      encodeURIComponent(text) +
      "&url=" +
      encodeURIComponent(url) +
      "&hashtags=spellingfox";

    window.open(shareUrl, "_blank");
  };
}

// =========================
// 問題
// =========================
function loadQuestion() {
  if (autoNextTimer) {
    clearTimeout(autoNextTimer);
    autoNextTimer = null;
  }

  if (shareTimer) {
    clearTimeout(shareTimer);
    shareTimer = null;
  }

  stopQuestionTimer();
  stopShareAttention();

  answerInput.value = "";
  resultEl.textContent = "";
  hintEl.textContent = reviewMode ? "Review Mistakes" : "";
  isAnswered = false;
  playCount = 0;

  setStateImage("idle");
  updateHearts();
  hideFeedback();
  resetTimerBar();

  hideShareButton();

  answerInput.focus();
}

// =========================
// 判定
// =========================
function checkAnswer() {
  if (isAnswered) return;

  stopQuestionTimer();

  const user = answerInput.value.trim().toLowerCase();
  const correct = getCurrentWord();

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
    addMissedWord(correct);
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

  stopQuestionTimer();

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
function updateReviewButtonVisibility() {
  if (reviewMode) {
    reviewBtn.style.display = "none";
    return;
  }

  reviewBtn.style.display = missedWords.length > 0 ? "inline-block" : "none";
}

function endGameScreen(titleText) {
  stopQuestionTimer();
  stopPlayAttention();

  const scoreInfo = getScoreMessage(score, quizData.length);
  const finalPercent = scoreInfo.percent;

  if (!reviewMode) {
    savePlayerName();
    saveResultToHistory(finalPercent);
  }

  setStateImage(titleText === "GAME OVER" ? "gameover" : "correct");

  hintEl.innerHTML = `
    <span class="big-title">${titleText}</span>
    <div class="score-rank">${scoreInfo.rankLabel}</div>
    <div class="score-message">${scoreInfo.message}</div>
  `;

  resultEl.innerHTML = `<span class="big-score">${finalPercent}%</span>`;
  endButtons.style.display = "block";

  updateReviewButtonVisibility();

  if (reviewMode) {
    hideSummary();
  } else {
    showSummary(finalPercent);
  }

  if (titleText === "GAME OVER" && !reviewMode) {
    showShareButton();

    if (shareTimer) {
      clearTimeout(shareTimer);
    }

    shareTimer = setTimeout(() => {
      startShareAttention();
    }, 2700);
  } else {
    hideShareButton();
    stopShareAttention();

    if (shareTimer) {
      clearTimeout(shareTimer);
      shareTimer = null;
    }
  }
}

function gameOver() {
  endGameScreen("GAME OVER");
}

function finish() {
  endGameScreen(reviewMode ? "REVIEW COMPLETE" : "RESULT");
}

// =========================
// Review Mistakes
// =========================
function startReviewMode() {
  if (missedWords.length === 0) {
    alert("You have no mistakes to review.");
    return;
  }

  reviewMode = true;
  quizData = shuffle(missedWords.map((word) => ({ word })));
  currentIndex = 0;
  score = 0;
  missCount = 0;
  playCount = 0;
  isAnswered = false;

  if (autoNextTimer) {
    clearTimeout(autoNextTimer);
    autoNextTimer = null;
  }

  if (shareTimer) {
    clearTimeout(shareTimer);
    shareTimer = null;
  }

  stopQuestionTimer();
  stopPlayAttention();
  stopShareAttention();
  resetTimerBar();

  endButtons.style.display = "none";
  hintEl.textContent = "Review Mistakes";
  resultEl.textContent = "";

  hideShareButton();
  hideSummary();
  updateHearts();
  hideFeedback();
  loadQuestion();
  startPlayAttention();
}

// =========================
// イベント
// =========================
if (playAudioBtn) {
  playAudioBtn.onclick = () => {
    if (!quizData.length) return;

    stopPlayAttention();
    playWord(quizData[currentIndex].word);
    startQuestionTimer();
  };
}

if (checkBtn) {
  checkBtn.onclick = (e) => {
    e.preventDefault();
    checkAnswer();
  };
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Enter") {
    if (document.activeElement !== answerInput) return;

    e.preventDefault();
    checkAnswer();
  }

  if (e.code === "Space") {
    if (document.activeElement === playerNameInput) return;

    e.preventDefault();
    if (!quizData.length) return;

    stopPlayAttention();
    playWord(quizData[currentIndex].word);
    startQuestionTimer();
  }
});

if (restartBtn) {
  restartBtn.onclick = startGame;
}

if (reviewBtn) {
  reviewBtn.onclick = startReviewMode;
}

if (playerNameInput) {
  playerNameInput.addEventListener("input", () => {
    savePlayerName();
  });

  playerNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      answerInput.focus();
    }
  });
}

if (answerInput) {
  answerInput.addEventListener("input", () => {
    if (answerInput.value.trim() !== "") {
      setStateImage("typing");
    } else {
      setStateImage("idle");
    }
  });
}

// =========================
// クレジット年取得
// =========================
const currentYearEl = document.getElementById("currentYear");

if (currentYearEl) {
  currentYearEl.textContent = new Date().getFullYear();
}

// =========================
// 開始
// =========================
function startGame() {
  reviewMode = false;
  missedWords = [];
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

  if (shareTimer) {
    clearTimeout(shareTimer);
    shareTimer = null;
  }

  stopQuestionTimer();
  stopPlayAttention();
  stopShareAttention();
  resetTimerBar();

  endButtons.style.display = "none";
  hintEl.textContent = "";
  resultEl.textContent = "";

  hideShareButton();
  hideSummary();
  updateHearts();
  hideFeedback();
  loadQuestion();
  startPlayAttention();
}

loadPlayerName();
hideShareButton();
startGame();
