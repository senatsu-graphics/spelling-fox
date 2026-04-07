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

const quizForm = document.getElementById("quizForm");
const hintEl = document.getElementById("hint");
const answerInput = document.getElementById("answerInput");
const resultEl = document.getElementById("result");
const scoreEl = document.getElementById("score");
const playCountText = document.getElementById("playCountText");

const playAudioBtn = document.getElementById("playAudioBtn");
const checkBtn = document.getElementById("checkBtn");
const stateImage = document.getElementById("stateImage");

const endButtons = document.getElementById("endButtons");
const reviewBtn = document.getElementById("reviewBtn");
const restartBtn = document.getElementById("restartBtn");

const imagePaths = {
  idle: "images/idle.png",
  typing: "images/type.png",
  correct: "images/correct.png",
  incorrect: "images/incorrect.png"
};

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

function canPlayAudio() {
  return quizData.length > 0 && currentIndex < quizData.length && !isAnswered;
}

function canCheckAnswer() {
  return quizData.length > 0 && currentIndex < quizData.length && !isAnswered;
}

function startNormalMode() {
  isReviewMode = false;
  missedWords = [];
  score = 0;
  currentIndex = 0;
  quizData = shuffleArray(originalQuizData);
  showQuizUI();
  loadQuestion();
}

function startReviewMode() {
  if (missedWords.length === 0) return;

  isReviewMode = true;
  score = 0;
  currentIndex = 0;
  quizData = shuffleArray(missedWords);
  missedWords = [];
  showQuizUI();
  loadQuestion();
}

function showQuizUI() {
  quizForm.style.display = "block";
  playAudioBtn.style.display = "inline-block";
  endButtons.style.display = "none";
  answerInput.style.display = "block";
  checkBtn.style.display = "inline-block";
}

function showEndUI() {
  quizForm.style.display = "none";
  playAudioBtn.style.display = "none";
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

  const modeLabel = isReviewMode ? "Review Mode" : "Normal Mode";
  scoreEl.textContent = `${modeLabel} | Score: ${score} / ${quizData.length}`;

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
  } else {
    resultEl.textContent = `Incorrect: ${quizData[currentIndex].word}`;
    setStateImage("incorrect");
    playEffect(incorrectSound);
    missedWords.push(quizData[currentIndex]);
  }

  const modeLabel = isReviewMode ? "Review Mode" : "Normal Mode";
  scoreEl.textContent = `${modeLabel} | Score: ${score} / ${quizData.length}`;

  autoNextTimer = setTimeout(() => {
    nextQuestion();
  }, 3000);
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

function finishQuiz() {
  setStateImage("idle");
  playCountText.textContent = "";

  if (isReviewMode) {
    if (missedWords.length > 0) {
      resultEl.textContent = `Review finished. You still have ${missedWords.length} mistake(s).`;
    } else {
      resultEl.textContent = `Great! You cleared all review words. Final Score: ${score}/${quizData.length}`;
    }
  } else {
    resultEl.textContent = `Finished! Final Score: ${score}/${quizData.length}`;
  }

  hintEl.textContent = "";
  showEndUI();
}

playAudioBtn.addEventListener("click", () => {
  if (!canPlayAudio()) return;
  playWord(quizData[currentIndex].word);
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
    if (!canCheckAnswer()) return;
    e.preventDefault();
    checkAnswer();
    return;
  }

  if (e.code === "Space") {
    if (!canPlayAudio()) return;
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
