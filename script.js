/*
  Vista Učilica
  Jednostavna edukativna aplikacija za djecu s ADHD-om i disleksijom.
  Tehnologije: HTML, CSS, JavaScript, localStorage, SpeechSynthesis API.

  Dorade prema povratnoj informaciji:
  - kviz sada ima 10 pitanja
  - slova u zadatku slaganja riječi nikada se ne prikažu već složena pravilnim redoslijedom
  - teža razina zadatka "Što je nestalo?" nudi i barem jedan predmet koji nije bio prikazan
  - uputa u zadatku "Što je nestalo?" traje dulje i ne prekida se prerano
*/

const PROFILE_KEY = "vistaProfile";
const PROGRESS_KEY = "vistaProgress";
const TOTAL_QUESTIONS = 10;

let currentProfile = null;
let selectedAvatar = "👧";
let selectedTheme = "light";
let selectedLevel = "easy";
let sessionResult = { stars: 0, tasks: 0, correct: 0 };

let quizPlan = [];
let currentQuestionIndex = 0;
let currentQuestionType = "letter";

let currentLetter = "A";
let letterAnswered = false;

let missingCorrectObject = null;
let missingAnswered = false;
let currentObjects = [];

let currentWord = null;
let selectedLetters = [];
let wordAnswered = false;

const letterTasks = [
  { letter: "A", optionsEasy: ["A", "O", "M"], optionsHard: ["A", "O", "M", "E", "I"] },
  { letter: "M", optionsEasy: ["M", "N", "A"], optionsHard: ["M", "N", "A", "L", "S"] },
  { letter: "S", optionsEasy: ["S", "Š", "Z"], optionsHard: ["S", "Š", "Z", "C", "M"] },
  { letter: "P", optionsEasy: ["P", "B", "R"], optionsHard: ["P", "B", "R", "D", "T"] },
  { letter: "L", optionsEasy: ["L", "I", "T"], optionsHard: ["L", "I", "T", "M", "N"] },
  { letter: "E", optionsEasy: ["E", "A", "O"], optionsHard: ["E", "A", "O", "I", "U"] }
];

const objectPool = [
  { name: "mačka", icon: "🐱" },
  { name: "lopta", icon: "⚽" },
  { name: "knjiga", icon: "📘" },
  { name: "pas", icon: "🐶" },
  { name: "sunce", icon: "☀️" },
  { name: "auto", icon: "🚗" },
  { name: "jabuka", icon: "🍎" },
  { name: "cvijet", icon: "🌸" },
  { name: "riba", icon: "🐟" },
  { name: "kuća", icon: "🏠" },
  { name: "medo", icon: "🧸" },
  { name: "balon", icon: "🎈" }
];

const wordTasksEasy = [
  { word: "PAS", icon: "🐶" },
  { word: "LAV", icon: "🦁" },
  { word: "MIŠ", icon: "🐭" },
  { word: "DOM", icon: "🏠" },
  { word: "SOK", icon: "🧃" }
];

const wordTasksHard = [
  { word: "MAČKA", icon: "🐱" },
  { word: "ŠKOLA", icon: "🏫" },
  { word: "SUNCE", icon: "☀️" },
  { word: "KNJIGA", icon: "📘" },
  { word: "CVIJET", icon: "🌸" }
];

window.addEventListener("load", () => {
  loadSavedProfile();
  updateContinueButton();
  showScreen("startScreen");
});

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });

  document.getElementById(screenId).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openProfileScreen() {
  const input = document.getElementById("childName");
  input.value = "";
  document.getElementById("profileMessage").textContent = "";
  showScreen("profileScreen");
}

function selectAvatar(button) {
  selectedAvatar = button.dataset.avatar;
  document.querySelectorAll(".avatar-choice").forEach((btn) => btn.classList.remove("selected"));
  button.classList.add("selected");
}

function selectTheme(button) {
  selectedTheme = button.dataset.theme;
  document.querySelectorAll(".theme-choice").forEach((btn) => btn.classList.remove("selected"));
  button.classList.add("selected");
  applyTheme(selectedTheme);
}

function saveProfile() {
  const nameInput = document.getElementById("childName");
  const name = nameInput.value.trim();

  if (name.length < 2) {
    document.getElementById("profileMessage").textContent = "Upiši ime od najmanje 2 slova.";
    nameInput.focus();
    return;
  }

  currentProfile = {
    name,
    avatar: selectedAvatar,
    theme: selectedTheme
  };

  localStorage.setItem(PROFILE_KEY, JSON.stringify(currentProfile));

  if (!localStorage.getItem(PROGRESS_KEY)) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(createDefaultProgress()));
  }

  applyProfileToMenu();
  updateContinueButton();
  showScreen("mainMenuScreen");
}

function continueGame() {
  const savedProfile = localStorage.getItem(PROFILE_KEY);

  if (!savedProfile) {
    openProfileScreen();
    return;
  }

  currentProfile = JSON.parse(savedProfile);
  selectedAvatar = currentProfile.avatar;
  selectedTheme = currentProfile.theme;

  applyTheme(selectedTheme);
  applyProfileToMenu();
  showScreen("mainMenuScreen");
}

function loadSavedProfile() {
  const savedProfile = localStorage.getItem(PROFILE_KEY);
  if (!savedProfile) return;

  currentProfile = JSON.parse(savedProfile);
  selectedAvatar = currentProfile.avatar;
  selectedTheme = currentProfile.theme;
  applyTheme(selectedTheme);
}

function applyProfileToMenu() {
  if (!currentProfile) return;

  document.getElementById("profileBadge").textContent = currentProfile.avatar;
  document.getElementById("greeting").textContent = `Bok, ${currentProfile.name}!`;
}

function applyTheme(theme) {
  document.body.classList.remove("theme-blue", "theme-cream");

  if (theme === "blue") {
    document.body.classList.add("theme-blue");
  }

  if (theme === "cream") {
    document.body.classList.add("theme-cream");
  }
}

function updateContinueButton() {
  const continueBtn = document.getElementById("continueBtn");
  const hasProfile = Boolean(localStorage.getItem(PROFILE_KEY));
  continueBtn.classList.toggle("hidden", !hasProfile);
}

function createDefaultProgress() {
  return {
    stars: 0,
    totalTasks: 0,
    correctAnswers: 0,
    tasks: {
      letterSound: { label: "Slovo koje čuješ", correct: 0, total: 0 },
      missingObject: { label: "Što je nestalo?", correct: 0, total: 0 },
      wordPuzzle: { label: "Složi riječ", correct: 0, total: 0 }
    }
  };
}

function getProgress() {
  const savedProgress = localStorage.getItem(PROGRESS_KEY);

  if (!savedProgress) {
    const progress = createDefaultProgress();
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    return progress;
  }

  return JSON.parse(savedProgress);
}

function saveProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function saveAnswer(taskName, isCorrect) {
  const progress = getProgress();

  progress.totalTasks += 1;
  progress.tasks[taskName].total += 1;
  sessionResult.tasks += 1;

  if (isCorrect) {
    progress.correctAnswers += 1;
    progress.tasks[taskName].correct += 1;
    progress.stars += 1;
    sessionResult.correct += 1;
    sessionResult.stars += 1;
  }

  saveProgress(progress);
  updateTaskStarCounters();
}

function selectLevel(level) {
  selectedLevel = level;
  sessionResult = { stars: 0, tasks: 0, correct: 0 };
  quizPlan = createQuizPlan();
  currentQuestionIndex = 0;
  startCurrentQuestion();
}

function createQuizPlan() {
  // Kviz ima 10 pitanja. Tipovi zadataka se izmjenjuju kako bi igra trajala dulje,
  // ali da dijete i dalje dobiva poznate i jednostavne obrasce zadataka.
  return [
    "letter",
    "missing",
    "word",
    "letter",
    "missing",
    "word",
    "letter",
    "missing",
    "word",
    "letter"
  ];
}

function startCurrentQuestion() {
  currentQuestionType = quizPlan[currentQuestionIndex];

  if (currentQuestionType === "letter") {
    startLetterSoundTask();
    return;
  }

  if (currentQuestionType === "missing") {
    startMissingObjectTask();
    return;
  }

  startWordPuzzleTask();
}

function goToNextQuestion() {
  currentQuestionIndex += 1;

  if (currentQuestionIndex >= quizPlan.length) {
    showFinalScreen();
    return;
  }

  startCurrentQuestion();
}

function getQuestionLabel() {
  return `Pitanje ${currentQuestionIndex + 1}/${TOTAL_QUESTIONS}`;
}

function updateTaskHeader(chipId) {
  const chip = document.getElementById(chipId);
  if (chip) {
    chip.textContent = getQuestionLabel();
  }
}

function showNextButton(buttonId) {
  const button = document.getElementById(buttonId);
  button.textContent = currentQuestionIndex === quizPlan.length - 1 ? "Završi kviz" : "Sljedeće pitanje";
  button.classList.remove("hidden");
}

function updateTaskStarCounters() {
  const text = `⭐ ${sessionResult.stars}`;
  document.getElementById("letterStarCounter").textContent = text;
  document.getElementById("missingStarCounter").textContent = text;
  document.getElementById("wordStarCounter").textContent = text;
}

function startLetterSoundTask() {
  const task = randomItem(letterTasks);
  currentLetter = task.letter;
  letterAnswered = false;

  const options = selectedLevel === "easy" ? task.optionsEasy : task.optionsHard;
  const optionContainer = document.getElementById("letterOptions");
  optionContainer.innerHTML = "";

  shuffleArray([...options]).forEach((letter) => {
    const button = document.createElement("button");
    button.className = "answer-btn";
    button.textContent = letter;
    button.onclick = () => checkLetterAnswer(letter);
    optionContainer.appendChild(button);
  });

  updateTaskHeader("letterTaskChip");
  document.getElementById("letterFeedback").textContent = "";
  document.getElementById("letterFeedback").className = "feedback";
  document.getElementById("letterNextBtn").classList.add("hidden");

  updateTaskStarCounters();
  showScreen("letterTaskScreen");
  setTimeout(speakCurrentLetter, 500);
}

function speakCurrentLetter() {
  speak(`Slovo ${currentLetter}`);
}

function checkLetterAnswer(selectedLetter) {
  if (letterAnswered) return;
  letterAnswered = true;

  const isCorrect = selectedLetter === currentLetter;
  const feedback = document.getElementById("letterFeedback");

  if (isCorrect) {
    feedback.textContent = "✅ Točno! +1 zvjezdica ⭐";
    feedback.className = "feedback correct";
    playSuccessSound();
    speak("Bravo, točno!");
  } else {
    feedback.textContent = `Nema veze. Točno slovo je ${currentLetter}.`;
    feedback.className = "feedback wrong";
    playErrorSound();
    speak(`Nema veze. Točno slovo je ${currentLetter}.`);
  }

  saveAnswer("letterSound", isCorrect);
  showNextButton("letterNextBtn");
}

function startMissingObjectTask() {
  missingAnswered = false;
  missingCorrectObject = null;

  const count = selectedLevel === "easy" ? 3 : 5;
  currentObjects = shuffleArray([...objectPool]).slice(0, count);

  updateTaskHeader("missingTaskChip");
  document.getElementById("missingInstruction").textContent = "Pogledaj slike. Jedna će nestati.";
  document.getElementById("missingFeedback").textContent = "";
  document.getElementById("missingFeedback").className = "feedback";
  document.getElementById("missingChoices").classList.add("hidden");
  document.getElementById("missingChoices").innerHTML = "";
  document.getElementById("missingNextBtn").classList.add("hidden");
  document.getElementById("startMissingBtn").classList.remove("hidden");

  renderObjects(currentObjects);
  updateTaskStarCounters();
  showScreen("missingTaskScreen");
}

function beginMissingRound() {
  document.getElementById("startMissingBtn").classList.add("hidden");
  document.getElementById("missingInstruction").textContent = "Dobro pogledaj i zapamti slike.";

  speak("Dobro pogledaj slike. Jedna će nestati. Pokušaj zapamtiti sve slike na ekranu.");

  // Produljeno vrijeme kako se zvučna uputa ne bi prekinula prerano.
  const delay = selectedLevel === "easy" ? 7000 : 6500;

  setTimeout(() => {
    missingCorrectObject = randomItem(currentObjects);

    const remainingObjects = currentObjects.filter(
      (object) => object.name !== missingCorrectObject.name
    );

    renderObjects(remainingObjects);
    renderMissingChoices();

    document.getElementById("missingInstruction").textContent = "Što je nestalo?";
    document.getElementById("missingChoices").classList.remove("hidden");

    speak("Što je nestalo?");
  }, delay);
}

function renderObjects(objects) {
  const display = document.getElementById("objectDisplay");
  display.innerHTML = "";

  objects.forEach((object) => {
    const card = document.createElement("div");
    card.className = "object-card";
    card.innerHTML = `<div>${object.icon}</div><span>${object.name}</span>`;
    display.appendChild(card);
  });
}

function renderMissingChoices() {
  const choices = document.getElementById("missingChoices");
  choices.innerHTML = "";

  let answerOptions = [];

  if (selectedLevel === "easy") {
    // Lakša razina nudi samo objekte koje je dijete vidjelo.
    answerOptions = [...currentObjects];
  } else {
    // Teža razina mora imati barem jedan objekt koji nije bio prikazan.
    const shownWrongOptions = currentObjects.filter(
      (object) => object.name !== missingCorrectObject.name
    );

    const notShownOptions = objectPool.filter(
      (object) =>
        !currentObjects.some(
          (shownObject) => shownObject.name === object.name
        )
    );

    answerOptions = [
      missingCorrectObject,
      ...shuffleArray([...shownWrongOptions]).slice(0, 2),
      ...shuffleArray([...notShownOptions]).slice(0, 1)
    ];
  }

  shuffleArray(answerOptions).forEach((object) => {
    const button = document.createElement("button");
    button.className = "answer-btn";
    button.textContent = `${object.icon} ${object.name}`;
    button.onclick = () => checkMissingAnswer(object.name);
    choices.appendChild(button);
  });
}

function checkMissingAnswer(selectedName) {
  if (missingAnswered) return;
  missingAnswered = true;

  const isCorrect = selectedName === missingCorrectObject.name;
  const feedback = document.getElementById("missingFeedback");

  if (isCorrect) {
    feedback.textContent = `✅ Točno! Nestala je: ${missingCorrectObject.name}. +1 zvjezdica ⭐`;
    feedback.className = "feedback correct";
    playSuccessSound();
    speak("Bravo, točno!");
  } else {
    feedback.textContent = `Nema veze. Nestala je: ${missingCorrectObject.name}.`;
    feedback.className = "feedback wrong";
    playErrorSound();
    speak(`Nema veze. Nestala je ${missingCorrectObject.name}.`);
  }

  saveAnswer("missingObject", isCorrect);
  showNextButton("missingNextBtn");
}

function startWordPuzzleTask() {
  const tasks = selectedLevel === "easy" ? wordTasksEasy : wordTasksHard;
  currentWord = randomItem(tasks);
  selectedLetters = new Array(currentWord.word.length).fill("");
  wordAnswered = false;

  updateTaskHeader("wordTaskChip");
  document.getElementById("wordEmoji").textContent = currentWord.icon;
  document.getElementById("wordHint").textContent = "Složi riječ prema slici.";
  document.getElementById("wordFeedback").textContent = "";
  document.getElementById("wordFeedback").className = "feedback";
  document.getElementById("wordNextBtn").classList.add("hidden");
  document.getElementById("wordResetBtn").classList.remove("hidden");

  renderDropZones();
  renderLetterTiles();
  updateTaskStarCounters();
  showScreen("wordTaskScreen");
}

function renderDropZones() {
  const container = document.getElementById("dropZones");
  container.innerHTML = "";

  selectedLetters.forEach((letter, index) => {
    const zone = document.createElement("div");
    zone.className = "drop-zone";
    zone.textContent = letter;
    zone.dataset.index = index;
    zone.ondragover = (event) => event.preventDefault();
    zone.ondrop = (event) => dropLetter(event, index);
    container.appendChild(zone);
  });
}

function renderLetterTiles() {
  const container = document.getElementById("letterTiles");
  container.innerHTML = "";

  const letters = shuffleLettersForPuzzle(currentWord.word);

  letters.forEach((letter, index) => {
    const tile = document.createElement("div");
    tile.className = "letter-tile";
    tile.textContent = letter;
    tile.draggable = true;
    tile.dataset.letter = letter;
    tile.dataset.id = `tile-${currentQuestionIndex}-${index}`;
    tile.onclick = () => clickLetterTile(tile);
    tile.ondragstart = (event) => {
      event.dataTransfer.setData("letter", letter);
      event.dataTransfer.setData("tileId", tile.dataset.id);
    };
    container.appendChild(tile);
  });
}

function shuffleLettersForPuzzle(word) {
  const original = word.split("");
  let shuffled = [...original];

  // Ponavlja miješanje dok se ne dobije redoslijed različit od točne riječi.
  // Time se uklanja slučaj u kojem je riječ odmah ponuđena već složena.
  for (let attempt = 0; attempt < 50; attempt++) {
    shuffled = shuffleArray([...original]);

    if (shuffled.join("") !== word) {
      return shuffled;
    }
  }

  // Sigurnosna zamjena prva dva slova ako slučajno više pokušaja vrati isti redoslijed.
  if (shuffled.length > 1) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }

  return shuffled;
}

function clickLetterTile(tile) {
  if (tile.classList.contains("used") || wordAnswered) return;

  const emptyIndex = selectedLetters.findIndex((letter) => letter === "");
  if (emptyIndex === -1) return;

  selectedLetters[emptyIndex] = tile.dataset.letter;
  tile.classList.add("used");
  renderDropZones();
  checkWordIfComplete();
}

function dropLetter(event, index) {
  if (wordAnswered) return;

  const letter = event.dataTransfer.getData("letter");
  const tileId = event.dataTransfer.getData("tileId");
  const tile = document.querySelector(`[data-id="${tileId}"]`);

  if (!letter || !tile || tile.classList.contains("used")) return;

  selectedLetters[index] = letter;
  tile.classList.add("used");
  renderDropZones();
  checkWordIfComplete();
}

function checkWordIfComplete() {
  if (selectedLetters.includes("")) return;

  const answer = selectedLetters.join("");
  const isCorrect = answer === currentWord.word;
  const feedback = document.getElementById("wordFeedback");

  wordAnswered = true;

  if (isCorrect) {
    feedback.textContent = "✅ Točno! +1 zvjezdica ⭐";
    feedback.className = "feedback correct";
    playSuccessSound();
    speak("Bravo, točno si složio riječ!");
  } else {
    feedback.textContent = `Nema veze. Točna riječ je ${currentWord.word}.`;
    feedback.className = "feedback wrong";
    playErrorSound();
    speak(`Nema veze. Točna riječ je ${currentWord.word}.`);
  }

  saveAnswer("wordPuzzle", isCorrect);
  document.getElementById("wordResetBtn").classList.add("hidden");
  showNextButton("wordNextBtn");
}

function resetWordPuzzle() {
  if (!currentWord || wordAnswered) return;

  selectedLetters = new Array(currentWord.word.length).fill("");
  document.getElementById("wordFeedback").textContent = "";
  document.getElementById("wordFeedback").className = "feedback";
  document.getElementById("wordNextBtn").classList.add("hidden");
  renderDropZones();
  renderLetterTiles();
}

function showFinalScreen() {
  document.getElementById("finalStars").textContent = `Osvojene zvjezdice: ${sessionResult.stars} ⭐`;
  document.getElementById("finalTasks").textContent = `Broj riješenih pitanja: ${sessionResult.tasks}`;
  document.getElementById("finalCorrect").textContent = `Točni odgovori: ${sessionResult.correct}/${TOTAL_QUESTIONS}`;

  speak("Bravo! Uspješno si riješio kviz od deset pitanja.");
  showScreen("finalScreen");
}

function showProgressScreen() {
  const progress = getProgress();
  const percent = progress.totalTasks === 0 ? 0 : Math.round((progress.correctAnswers / progress.totalTasks) * 100);

  document.getElementById("progressName").textContent = currentProfile
    ? `${currentProfile.avatar} ${currentProfile.name}`
    : "Korisnik";

  document.getElementById("progressStars").textContent = progress.stars;
  document.getElementById("progressTasks").textContent = progress.totalTasks;
  document.getElementById("progressPercent").textContent = `${percent}%`;

  const tbody = document.getElementById("progressTableBody");
  tbody.innerHTML = "";

  Object.values(progress.tasks).forEach((task) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${task.label}</td>
      <td>${task.correct}</td>
      <td>${task.total}</td>
    `;
    tbody.appendChild(row);
  });

  showScreen("progressScreen");
}

function resetProgress() {
  const confirmed = confirm("Želiš li obrisati samo napredak? Profil ostaje spremljen.");

  if (!confirmed) return;

  saveProgress(createDefaultProgress());
  showProgressScreen();
}

function speakStartInstructions() {
  speak("Dobrodošao u Vista Učilicu. Možeš izraditi novi profil ili nastaviti igru ako već imaš profil.");
}

function speakMainMenuInstructions() {
  speak("Odaberi rješavanje zadataka ako želiš riješiti kviz od deset pitanja. Odaberi pregled napretka ako želiš vidjeti rezultate.");
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "hr-HR";
  utterance.rate = 0.82;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function playSuccessSound() {
  playTone(660, 0.12);
  setTimeout(() => playTone(880, 0.14), 130);
}

function playErrorSound() {
  playTone(220, 0.18);
}

function playTone(frequency, duration) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gainNode.gain.value = 0.08;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    // Ako preglednik blokira zvuk, aplikacija i dalje radi bez zvučnog signala.
  }
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}
