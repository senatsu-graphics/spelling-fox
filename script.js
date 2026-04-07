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

let currentIndex = 0;
let score = 0;
let playCount = 0;
const maxPlay = 2;
let isAnswered = false;
let autoNextTimer = null;

const quizForm = document.getElementById("quizForm");
const hintEl = document.getElementById("hint");
const answerInput = document.getElementById("answerInput");
const resultEl = document.getElementById("result");
const scoreEl = document.getElementById("score");
const playCountText = document.getElementById("playCountText");

const playAudioBtn = document.getElementById("playAudioBtn");
const checkBtn = document.getElementById("checkBtn");
const stateImage = document.getElementById("stateImage");

const imagePaths = {
  idle: "images/idle.png",
  typing: "images/type.png",
  correct: "images/correct.png",
  incorrect: "images/incorrect.png"
};

// 効果音
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

function loadQuestion() {
  const q = quizData[currentIndex];

  if (autoNextTimer) {
    clearTimeout(autoNextTimer);
    autoNextTimer = null;
  }

  hintEl.textContent = q.hint ? `Hint: ${q.hint}` : "";
  answerInput.value = "";
  resultEl.textContent = "";

  answerInput.disabled = false;
  checkBtn.disabled = false;

  playCount = 0;
  isAnswered = false;

  updatePlayCountText();
  setStateImage("idle");
  scoreEl.textContent = `Score: ${score} / ${quizData.length}`;

  answerInput.focus();
}

function checkAnswer() {
  if (isAnswered) return;

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
    resultEl.textContent = `Incorrect. Answer: ${quizData[currentIndex].word}. Next question in 3 seconds...`;
    setStateImage("incorrect");
    playEffect(incorrectSound);
  }

  scoreEl.textContent = `Score: ${score} / ${quizData.length}`;

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
    hintEl.textContent = "Finished!";
    resultEl.textContent = `Final Score: ${score} / ${quizData.length}`;
    scoreEl.textContent = "";
    playCountText.textContent = "";

    quizForm.style.display = "none";
    playAudioBtn.style.display = "none";

    setStateImage("idle");
  }
}

playAudioBtn.addEventListener("click", () => {
  playWord(quizData[currentIndex].word);
});

answerInput.addEventListener("input", () => {
  if (isAnswered) return;

  if (answerInput.value.trim() === "") {
    setStateImage("idle");
  } else {
    setStateImage("typing");
  }
});

quizForm.addEventListener("submit", (event) => {
  event.preventDefault();
  checkAnswer();
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    if (isAnswered) return;

    event.preventDefault();
    playWord(quizData[currentIndex].word);
  }
});

loadQuestion();
