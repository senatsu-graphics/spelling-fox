const quizData = [
  { word: "apple", hint: "fruit" },
  { word: "beautiful", hint: "very pretty" },
  { word: "because", hint: "reason" }
];

function playWord(word) {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  speechSynthesis.speak(utterance);
}

playAudioBtn.addEventListener("click", () => {
  playWord(quizData[currentIndex].word);
});
