// =======================
// データ
// =======================
const quizData = [
  { word: "apple", hint: "fruit" },
  { word: "beautiful", hint: "very pretty" },
  { word: "because", hint: "used to give a reason" }
];

// =======================
// 状態管理
// =======================
let currentIndex = 0;
let score = 0;

// 音声再生制限
let playCount = 0;
const maxPlay = 2;

// =======================
// 要素取得
// =======================
const hintEl = document.getElementById("hint");
const answerInput = document.getElementById("answerInput");
const resultEl = document.getElementById("result");

const playAudioBtn = document.getElementById("playAudioBtn");
const checkBtn = document.getElementById("checkBtn");
const nextBtn = document.getElementById("nextBtn");

// =======================
// 音声再生（2回まで）
// =======================
function playWord(word) {
  if (playCount >= maxPlay) {
    alert("You can only play the audio 2 times!");
    return;
  }

  // 前の音声を止める
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.9;

  speechSynthesis.speak(utterance);

  playCount++;
}

// =======================
// 問題読み込み
// =======================
function loadQuestion() {
  const q = quizData[currentIndex];

  hintEl.textContent = `Hint: ${q.hint}`;
  answerInput.value = "";
  resultEl.textContent = "";

  // 再生回数リセット
  playCount = 0;
}

// =======================
// 判定
// =======================
function checkAnswer() {
  const userAnswer = answerInput.value.trim().toLowerCase();
  const correct = quizData[currentIndex].word.toLowerCase();

  if (userAnswer === correct) {
    resultEl.textContent = "Correct!";
    score++;
  } else {
    resultEl.textContent = `Incorrect. Answer: ${correct}`;
  }
}

// =======================
// 次の問題
// =======================
function nextQuestion() {
  currentIndex++;

  if (currentIndex < quizData.length) {
    loadQuestion();
  } else {
    hintEl.textContent = "Finished!";
    resultEl.textContent = `Score: ${score} / ${quizData.length}`;

    answerInput.style.display = "none";
    playAudioBtn.style.display = "none";
    checkBtn.style.display = "none";
    nextBtn.style.display = "none";
  }
}

// =======================
// イベント
// =======================
playAudioBtn.addEventListener("click", () => {
  playWord(quizData[currentIndex].word);
});

checkBtn.addEventListener("click", checkAnswer);

nextBtn.addEventListener("click", nextQuestion);

// =======================
// 初期表示
// =======================
loadQuestion();
