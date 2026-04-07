const quizData = [
  { word: "apple", hint: "" },
  { word: "orange", hint: "" },
  { word: "banana", hint: "" }
];

let currentIndex = 0;
let score = 0;
let playCount = 0;
const maxPlay = 2;

const hintEl = document.getElementById("hint");
const answerInput = document.getElementById("answerInput");
const resultEl = document.getElementById("result");
const scoreEl = document.getElementById("score");
const playCountText = document.getElementById("playCountText");

const playAudioBtn = document.getElementById("playAudioBtn");
const checkBtn = document.getElementById("checkBtn");
const nextBtn = document.getElementById("nextBtn");
const stateImage = document.getElementById("stateImage");

// 画像の切り替え先
const imagePaths = {
  idle: "images/idle.png",
  typing: "images/type.png",
  correct: "images/correct.png",
  incorrect: "images/incorrect.png"
};

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

function loadQuestion() {
  const q = quizData[currentIndex];

  hintEl.textContent = q.hint ? `Hint: ${q.hint}` : "";
  answerInput.value = "";
  resultEl.textContent = "";

  playCount = 0;
  updatePlayCountText();

  setStateImage("idle");
  scoreEl.textContent = `Score: ${score} / ${quizData.length}`;
}

function checkAnswer() {
  const userAnswer = answerInput.value.trim().toLowerCase();
  const correctAnswer = quizData[currentIndex].word.toLowerCase();

  if (userAnswer === correctAnswer) {
    resultEl.textContent = "Correct!";
    score++;
    setStateImage("correct");
  } else {
    resultEl.textContent = `Incorrect. Answer: ${quizData[currentIndex].word}`;
    setStateImage("incorrect");
  }

  scoreEl.textContent = `Score: ${score} / ${quizData.length}`;
}

function nextQuestion() {
  currentIndex++;

  if (currentIndex < quizData.length) {
    loadQuestion();
  } else {
    hintEl.textContent = "Finished!";
    resultEl.textContent = `Final Score: ${score} / ${quizData.length}`;
    scoreEl.textContent = "";
    playCountText.textContent = "";

    answerInput.style.display = "none";
    playAudioBtn.style.display = "none";
    checkBtn.style.display = "none";
    nextBtn.style.display = "none";

    setStateImage("idle");
  }
}

// 音声はクリック時のみ
playAudioBtn.addEventListener("click", () => {
  playWord(quizData[currentIndex].word);
});

// 入力中の画像切り替え
answerInput.addEventListener("input", () => {
  if (answerInput.value.trim() === "") {
    setStateImage("idle");
  } else {
    setStateImage("typing");
  }
});

checkBtn.addEventListener("click", checkAnswer);
nextBtn.addEventListener("click", nextQuestion);

loadQuestion();
