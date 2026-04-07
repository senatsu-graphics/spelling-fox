// =========================
// 単語（ここだけ編集OK）
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
let missCount = 0;
const maxMisses = 3;

let playCount = 0;
const maxPlay = 2;

let isAnswered = false;
let autoNextTimer = null;
let missedWords = [];
let isReviewMode = false;

// =========================
// 要素
// =========================
const answerInput = document.getElementById("answerInput");
const resultEl = document.getElementById("result");
const scoreEl = document.getElementById("score");
const hintEl = document.getElementById("hint");
const playCountText = document.getElementById("playCountText");

const playBtn = document.getElementById("playAudioBtn");
const form = document.getElementById("quizForm");

const stateImage = document.getElementById("stateImage");

const reviewBtn = document.getElementById("reviewBtn");
const restartBtn = document.getElementById("restartBtn");
const endButtons = document.getElementById("endButtons");

// ❤️ ハート
const hearts = [
  document.getElementById("heart1"),
  document.getElementById("heart2"),
  document.getElementById("heart3")
];

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
// ヘルパー
// =========================
function setStateImage(state) {
  stateImage.src = imagePaths[state];
}

function shuffleArray(array) {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

function updateHearts() {
  const livesLeft = maxMisses - missCount;

  hearts.forEach((heart, i) => {
    heart.src = i < livesLeft ? HEART_BLACK : HEART_WHITE;
  });
}

function playEffect(sound) {
  sound.pause();
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function playWord(word) {
  if (playCount >= maxPlay) return;

  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  speechSynthesis.speak(u);

  playCount++;
}

function getScorePercent() {
  return Math.round((score / quizData.length) * 100);
}

// =========================
// ゲーム開始
// =========================
function startNormalMode() {
  isReviewMode = false;
  missedWords = [];
  score = 0;
  missCount = 0;
  currentIndex = 0;

  quizData = shuffleArray(originalQuizData);

  endButtons.style.display = "none";
  updateHearts();
  loadQuestion();
}

function startReviewMode() {
  if (missedWords.length === 0) return;

  isReviewMode = true;
  score = 0;
  missCount = 0;
  currentIndex = 0;

  quizData = shuffleArray(missedWords);
  missedWords = [];

  endButtons.style.display = "none";
  updateHearts();
  loadQuestion();
}

// =========================
// 問題表示
// =========================
function loadQuestion() {
  clearTimeout(autoNextTimer);

  answerInput.value = "";
  resultEl.textContent = "";
  isAnswered = false;
  playCount = 0;

  setStateImage("idle");
  updateHearts();

  answerInput.focus();
}

// =========================
// 判定
// =========================
function checkAnswer() {
  if (isAnswered) return;

  const user = answerInput.value.trim().toLowerCase();
  const correct = quizData[currentIndex].word.toLowerCase();

  isAnswered = true;

  if (user === correct) {
    score++;
    setStateImage("correct");
    playEffect(correctSound);
  } else {
    missCount++;
    missedWords.push(quizData[currentIndex]);

    setStateImage("incorrect");
    playEffect(incorrectSound);
    updateHearts();

    if (missCount >= maxMisses) {
      setTimeout(gameOver, 1500);
      return;
    }
  }

  autoNextTimer = setTimeout(nextQuestion, 2000);
}

// =========================
// 次の問題
// =========================
function nextQuestion() {
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
function gameOver() {
  setStateImage("gameover");

  hintEl.innerHTML = `<span class="big-title">GAME OVER</span>`;

  resultEl.innerHTML = `
    <span class="big-score">${getScorePercent()}%</span><br>
    ${score} / ${quizData.length}
  `;

  endButtons.style.display = "block";
}

function finish() {
  hintEl.innerHTML = `<span class="big-title">RESULT</span>`;

  resultEl.innerHTML = `
    <span class="big-score">${getScorePercent()}%</span><br>
    ${score} / ${quizData.length}
  `;

  endButtons.style.display = "block";
}

// =========================
// イベント
// =========================
playBtn.onclick = () => {
  playWord(quizData[currentIndex].word);
};

form.onsubmit = (e) => {
  e.preventDefault();
  checkAnswer();
};

document.addEventListener("keydown", (e) => {
  if (endButtons.style.display === "block") return;

  if (e.code === "Enter") {
    e.preventDefault();
    checkAnswer();
  }

  if (e.code === "Space") {
    e.preventDefault();
    playWord(quizData[currentIndex].word);
  }
});

reviewBtn.onclick = startReviewMode;
restartBtn.onclick = startNormalMode;

// =========================
// 初期化
// =========================
startNormalMode();
