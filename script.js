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
`;

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

let isAnswered = false;

// =========================
// 要素
// =========================
const answerInput = document.getElementById("answerInput");
const resultEl = document.getElementById("result");
const scoreEl = document.getElementById("score");

const playBtn = document.getElementById("playAudioBtn");
const form = document.getElementById("quizForm");

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
// ハート更新
// =========================
function updateHearts() {
  for (let i = 0; i < maxMisses; i++) {
    if (i < maxMisses - missCount) {
      hearts[i].src = "images/Heart-black.png";
    } else {
      hearts[i].src = "images/Heart-white.png";
    }
  }
}

// =========================
// シャッフル
// =========================
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// =========================
// 音声
// =========================
function playWord(word) {
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  speechSynthesis.speak(u);
}

// =========================
// 問題
// =========================
function loadQuestion() {
  answerInput.value = "";
  resultEl.textContent = "";
  isAnswered = false;

  scoreEl.textContent = `Score: ${score}/${quizData.length}`;
  answerInput.focus();
}

// =========================
// 判定
// =========================
function checkAnswer() {
  if (isAnswered) return;

  const user = answerInput.value.trim().toLowerCase();
  const correct = quizData[currentIndex].word;

  isAnswered = true;

  if (user === correct) {
    resultEl.textContent = "Correct!";
    score++;
  } else {
    resultEl.textContent = `Incorrect: ${correct}`;
    missCount++;
    updateHearts();

    if (missCount >= maxMisses) {
      gameOver();
      return;
    }
  }

  setTimeout(nextQuestion, 1500);
}

// =========================
// 次
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
// ゲームオーバー
// =========================
function gameOver() {
  resultEl.textContent = `Game Over! Score: ${score}/${quizData.length}`;
  endButtons.style.display = "block";
}

// =========================
// 完了
// =========================
function finish() {
  resultEl.textContent = `Finished! Score: ${score}/${quizData.length}`;
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
  if (e.code === "Enter") {
    e.preventDefault();
    checkAnswer();
  }

  if (e.code === "Space") {
    e.preventDefault();
    playWord(quizData[currentIndex].word);
  }
});

restartBtn.onclick = startGame;

// =========================
// 開始
// =========================
function startGame() {
  quizData = shuffle(originalQuizData);
  currentIndex = 0;
  score = 0;
  missCount = 0;

  updateHearts();
  endButtons.style.display = "none";

  loadQuestion();
}

startGame();
