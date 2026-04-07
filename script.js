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

const originalQuizData = wordString
  .split(/\n+/)
  .map(word => word.trim())
  .filter(word => word !== "")
  .map(word => ({ word, hint: "" }));

let quizData = [];
let currentIndex = 0;
let score = 0;
let playCount = 0;
const maxPlay = 2;
let isAnswered = false;
let autoNextTimer = null;
let missedWords = [];
let isReviewMode = false;

let missCount = 0;
const maxMisses = 3;

const quizForm = document.getElementById("quizForm");
const hintEl = document.getElementById("hint");
const answerInput = document.getElementById("answerInput");
const resultEl = document.getElementById("result");
const scoreEl = document.getElementById("score");
const playCountText = document.getElementById("playCountText");

const playAudioBtn = document.getElementById("playAudioBtn");
const checkBtn = document.getElementById("checkBtn");
const nextBtn = document.getElementById("nextBtn");
const stateImage = document.getElementById("stateImage");

const endButtons = document.getElementById("endButtons");
const reviewBtn = document.getElementById("reviewBtn");
const restartBtn = document.getElementById("restartBtn");

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

const imagePaths = {
  idle: "images/idle.png",
  typing: "images/type.png",
  correct: "images/correct.png",
  incorrect: "images/incorrect.png",
  gameover: "images/gameover.png"
};

const HEART_BLACK = "images/Heart-black.png";
const HEART_WHITE = "images/Heart-white.png";

const correctSound = new Audio("audio/correct.mp3");
const incorrectSound = new Audio("audio/incorrect.mp3");

correctSound.preload = "auto";
incorrectSound.preload = "auto";

function setStateImage(state) {
  stateImage.src = imagePaths[state];
}

function updatePlayCountText() {
  playCountText.textContent = `Audio plays left: ${maxPlay - playCount}`;
}

function updateHearts() {
  const livesLeft = maxMisses - missCount;
  hearts.forEach((heart, index) => {
    heart.src = index < livesLeft ? HEART_BLACK : HEART_WHITE;
  });
}

function shuffleArray(array) {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

function playWord(word) {
  if (playCount >= maxPlay) {
    alert("You can only play the audio 2 times!");
    return;
  }

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);

  playCount++;
  updatePlayCountText();
}

function playEffect(sound) {
  sound.pause();
  sound.currentTime = 0;
  sound.play().catch((error) => {
    console.log("Effect sound could not play:", error);
  });
}

function getScorePercent() {
  return quizData.length === 0 ? 0 : Math.round((score / quizData.length) * 100);
}

function canPlayAudio() {
  return quizData.length > 0 && currentIndex < quizData.length && !isAnswered;
}

function canCheckAnswer() {
  return quizData.length > 0 && currentIndex < quizData.length && !isAnswered;
}

function canSkipToNext() {
  return quizData.length > 0 && currentIndex < quizData.length;
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
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildComparisonHtml(user, correct) {
  const maxLen = Math.max(user.length, correct.length);
  let userHtml = "";
  let correctHtml = "";

  for (let i = 0; i < maxLen; i++) {
    const u = user[i] ?? "";
    const c = correct[i] ?? "";

    if (u === c && u !== "") {
      userHtml += `<span class="char-correct">${escapeHtml(u)}</span>`;
      correctHtml += `<span class="char-correct">${escapeHtml(c)}</span>`;
    } else {
      if (u === "" && c !== "") {
        correctHtml += `<span class="char-missing">${escapeHtml(c)}</span>`;
        userHtml += `<span class="char-missing">_</span>`;
      } else if (u !== "" && c === "") {
        userHtml += `<span class="char-extra">${escapeHtml(u)}</span>`;
      } else {
        userHtml += `<span class="char-wrong">${escapeHtml(u)}</span>`;
        correctHtml += `<span class="char-wrong">${escapeHtml(c)}</span>`;
      }
    }
  }

  return { userHtml, correctHtml };
}

function showIncorrectFeedback(user, correct) {
  feedbackBox.style.display = "block";
  compareBox.style.display = "block";
  correctAnswerText.textContent = correct;

  const { userHtml, correctHtml } = buildComparisonHtml(user, correct);
  userCompare.innerHTML = userHtml;
  correctCompare.innerHTML = correctHtml;
}

function startNormalMode() {
  isReviewMode = false;
  missedWords = [];
  score = 0;
  missCount = 0;
  currentIndex = 0;
  quizData = shuffleArray(originalQuizData);
  showQuizUI();
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
  showQuizUI();
  updateHearts();
  loadQuestion();
}

function showQuizUI() {
  quizForm.style.display = "block";
  endButtons.style.display = "none";
}

function showEndUI() {
  quizForm.style.display = "none";
  endButtons.style.display = "block";
  reviewBtn.style.display = missedWords.length > 0 ? "inline-block" : "none";
}

function loadQuestion() {
  if (autoNextTimer) {
    clearTimeout(autoNextTimer);
    autoNextTimer = null;
  }

  const q = quizData[currentIndex];

  answerInput.value = "";
  resultEl.textContent = "";
  hintEl.textContent = q.hint ? `Hint: ${q.hint}` : "";

  answerInput.disabled = false;
  checkBtn.disabled = false;

  isAnswered = false;
  playCount = 0;

  setStateImage("idle");
  updatePlayCountText();
  updateHearts();
  hideFeedback();

  const modeLabel = isReviewMode ? "Review Mode" : "Normal Mode";
  scoreEl.textContent = `${modeLabel} | Score: ${score} / ${quizData.length} | Miss: ${missCount} / ${maxMisses}`;

  answerInput.focus();
}

function checkAnswer() {
  if (!canCheckAnswer()) return;

  const userAnswer = answerInput.value.trim().toLowerCase();
  const correctAnswer = quizData[currentIndex].word.toLowerCase();

  isAnswered = true;
  answerInput.disabled = true;
  checkBtn.disabled = true;

  if (userAnswer === correctAnswer) {
    resultEl.textContent = "Correct! Next question in 3 seconds...";
    score++;
    setStateImage("correct");
    playEffect(correctSound);
    hideFeedback();
  } else {
    missCount++;
    resultEl.textContent = "Incorrect! Next question in 5 seconds...";
    setStateImage("incorrect");
    playEffect(incorrectSound);
    missedWords.push(quizData[currentIndex]);
    updateHearts();

    showIncorrectFeedback(userAnswer, correctAnswer);
  }

  const modeLabel = isReviewMode ? "Review Mode" : "Normal Mode";
  scoreEl.textContent = `${modeLabel} | Score: ${score} / ${quizData.length} | Miss: ${missCount} / ${maxMisses}`;

  if (missCount >= maxMisses) {
    autoNextTimer = setTimeout(() => {
      gameOver();
    }, 1500);
    return;
  }

  const delay = userAnswer === correctAnswer ? 3000 : 5000;

  autoNextTimer = setTimeout(() => {
    nextQuestion();
  }, delay);
}

function nextQuestion() {
  if (autoNextTimer) {
    clearTimeout(autoNextTimer);
    autoNextTimer = null;
  }

  currentIndex++;

  if (currentIndex < quizData.length) {
    loadQuestion();
  } else {
    finishQuiz();
  }
}

function gameOver() {
  if (autoNextTimer) {
    clearTimeout(autoNextTimer);
    autoNextTimer = null;
  }

  setStateImage("gameover");
  hintEl.innerHTML = `<span class="big-title">GAME OVER</span>`;
  resultEl.innerHTML = `
    <span class="big-score">${getScorePercent()}%</span><br>
    ${score} / ${quizData.length}
  `;
  playCountText.textContent = "";
  showEndUI();
}

function finishQuiz() {
  setStateImage("idle");
  hintEl.innerHTML = `<span class="big-title">RESULT</span>`;
  resultEl.innerHTML = `
    <span class="big-score">${getScorePercent()}%</span><br>
    ${score} / ${quizData.length}
  `;
  playCountText.textContent = "";
  showEndUI();
}

playAudioBtn.addEventListener("click", () => {
  if (!canPlayAudio()) return;
  playWord(quizData[currentIndex].word);
});

checkBtn.addEventListener("click", (e) => {
  e.preventDefault();
  checkAnswer();
});

nextBtn.addEventListener("click", () => {
  if (!canSkipToNext()) return;
  nextQuestion();
});

quizForm.addEventListener("submit", (e) => {
  e.preventDefault();
  checkAnswer();
});

answerInput.addEventListener("input", () => {
  if (isAnswered) return;

  if (answerInput.value.trim() === "") {
    setStateImage("idle");
  } else {
    setStateImage("typing");
  }
});

document.addEventListener("keydown", (e) => {
  if (endButtons.style.display === "block") return;

  if (e.code === "Enter") {
    e.preventDefault();
    checkAnswer();
    return;
  }

  if (e.code === "Space") {
    e.preventDefault();
    playWord(quizData[currentIndex].word);
  }
});

reviewBtn.addEventListener("click", () => {
  startReviewMode();
});

restartBtn.addEventListener("click", () => {
  startNormalMode();
});

startNormalMode();
