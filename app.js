const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwb-bndT6vxAKsZNVHX5KHcj_VU8bVPDvegjW6a6nHyMApWOqOgDqAwu8KPWEc1-o6k1Q/exec";

// حالة التطبيق
const sessionId = "usr_" + Math.random().toString(36).substring(2, 11);
let currentQuestionIndex = 0;
let userAnswers = [];
let scores = { hosp: 0, corp: 0, reg: 0, acad: 0, insur: 0 };
let userData = { name: "" };
let testCompleted = false;

// عناصر الواجهة
const introScreen = document.getElementById("intro-screen");
const quizScreen = document.getElementById("quiz-screen");
const loadingScreen = document.getElementById("loading-screen");
const resultScreen = document.getElementById("result-screen");
const mainCard = document.querySelector("main");

const startBtn = document.getElementById("start-btn");
const prevBtn = document.getElementById("prev-btn");
const questionCounter = document.getElementById("question-counter");
const progressBar = document.getElementById("progress-bar");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");

// عناصر النتيجة
const cardUserName = document.getElementById("card-user-name");
const cardDate = document.getElementById("card-date");
const topTrackTitle = document.getElementById("top-track-title");
const topTrackDesc = document.getElementById("top-track-desc");
const topTrackMatch = document.getElementById("top-track-match");
const secondTrackTitle = document.getElementById("second-track-title");
const secondTrackMatch = document.getElementById("second-track-match");
const tracksProgressList = document.getElementById("tracks-progress-list");
const trackAdvice = document.getElementById("track-advice");

const downloadCardBtn = document.getElementById("download-card-btn");
const shareXBtn = document.getElementById("share-x-btn");
const copyLinkBtn = document.getElementById("copy-link-btn");
const copyLinkText = document.getElementById("copy-link-text");
const restartBtn = document.getElementById("restart-btn");

// دالة تتبع الزيارات والانسحاب
function sendTracking(status, questionNum) {
  const payload = {
    type: "tracking",
    sessionId: sessionId,
    name: userData.name || "مجهول",
    lastQuestion: questionNum,
    status: status
  };

  fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  }).catch(() => {});
}
// 1. بدء الاختبار
startBtn.addEventListener("click", () => {
  const nameInput = document.getElementById("user-name").value.trim();
  userData.name = nameInput !== "" ? nameInput : "ممارس مخبري";
  testCompleted = false;

  introScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  loadQuestion(0);
  sendTracking("بدأ التقييم", 1);
});

// 2. تحميل السؤال
// 2. تحميل السؤال مع خلط الخيارات عشوائياً
// 2. تحميل السؤال مع خلط الخيارات عشوائياً
function loadQuestion(index) {
  const q = QUESTIONS[index];

  questionCounter.textContent = `سؤال ${index + 1} من ${QUESTIONS.length}`;
  const progressPercent = ((index + 1) / QUESTIONS.length) * 100;
  progressBar.style.width = `${progressPercent}%`;

  if (index === 0) {
    prevBtn.classList.add("invisible");
  } else {
    prevBtn.classList.remove("invisible");
  }

  questionText.classList.remove("question-animate");
  optionsContainer.classList.remove("question-animate");
  void questionText.offsetWidth;
  questionText.classList.add("question-animate");
  optionsContainer.classList.add("question-animate");

  questionText.textContent = q.question;
  optionsContainer.innerHTML = "";

  // عمل نسخة من الخيارات وخلط ترتيبها عشوائياً
  const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);

  shuffledOptions.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "opt-btn w-full text-right p-3.5 md:p-4 rounded-2xl border border-slate-200/90 bg-white text-slate-800 text-xs md:text-sm font-medium transition duration-150 flex items-center justify-between group active:scale-[0.99] select-none";

    btn.innerHTML = `
      <span class="leading-relaxed flex-grow pl-2">${opt.text}</span>
      <span class="opt-dot w-4 h-4 rounded-full border border-slate-300 flex-shrink-0 flex items-center justify-center">
        <span class="opt-dot-inner w-2 h-2 rounded-full bg-blue-600 opacity-0 transition"></span>
      </span>
    `;

    btn.addEventListener("click", () => {
      btn.blur();
      btn.classList.add("border-blue-600", "bg-blue-50");
      const dotInner = btn.querySelector(".opt-dot-inner");
      if (dotInner) dotInner.classList.remove("opacity-0");

      setTimeout(() => {
        handleSelectOption(opt.weights);
      }, 140);
    });

    optionsContainer.appendChild(btn);
  });
}
// 3. معالجة الإجابة
function handleSelectOption(weights) {
  userAnswers[currentQuestionIndex] = weights;

  for (let track in weights) {
    scores[track] += weights[track];
  }

  currentQuestionIndex++;

  if (currentQuestionIndex < QUESTIONS.length) {
    loadQuestion(currentQuestionIndex);
  } else {
    testCompleted = true;
    showLoadingAndResults();
  }
}

// 4. زر الرجوع
prevBtn.addEventListener("click", () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    const prevWeights = userAnswers[currentQuestionIndex];

    for (let track in prevWeights) {
      scores[track] -= prevWeights[track];
    }

    loadQuestion(currentQuestionIndex);
  }
});

// 5. الحساب والنتيجة
function showLoadingAndResults() {
  quizScreen.classList.add("hidden");
  loadingScreen.classList.remove("hidden");

  const maxPossible = 30;
  const percentages = {};

  for (let track in scores) {
    let pct = Math.round((scores[track] / maxPossible) * 100);
    if (pct > 96) pct = 96;
    if (pct < 35) pct = 35 + Math.floor(Math.random() * 8);
    percentages[track] = pct;
  }

  const sortedTracks = Object.keys(percentages).sort((a, b) => percentages[b] - percentages[a]);
  const topKey = sortedTracks[0];
  const secondKey = sortedTracks[1];

  const topTrack = TRACKS_INFO[topKey];
  const secondTrack = TRACKS_INFO[secondKey];

  setTimeout(() => {
    loadingScreen.classList.add("hidden");
    resultScreen.classList.remove("hidden");

    mainCard.classList.add("shake-effect");
    setTimeout(() => mainCard.classList.remove("shake-effect"), 500);

    if ("vibrate" in navigator) {
      navigator.vibrate([80, 40, 120]);
    }

    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.65 },
      colors: ['#2563eb', '#4f46e5', '#059669', '#d97706', '#e11d48']
    });

    cardUserName.textContent = `التقرير المهني: ${userData.name}`;
    const today = new Date();
    cardDate.textContent = today.toLocaleDateString("ar-SA", { year: "numeric", month: "long" });

    topTrackTitle.textContent = topTrack.title;
    topTrackDesc.textContent = topTrack.desc;
    topTrackMatch.textContent = `${percentages[topKey]}% تطابق`;

    secondTrackTitle.textContent = secondTrack.title;
    secondTrackMatch.textContent = `${percentages[secondKey]}%`;

    trackAdvice.textContent = topTrack.advice;

    tracksProgressList.innerHTML = "";
    sortedTracks.forEach((key) => {
      const item = TRACKS_INFO[key];
      const pct = percentages[key];

      const barRow = document.createElement("div");
      barRow.className = "space-y-1";
      barRow.innerHTML = `
        <div class="flex justify-between text-xs font-semibold text-slate-700">
          <span class="flex items-center gap-1.5">${item.icon} ${item.title}</span>
          <span class="text-slate-500 font-bold">${pct}%</span>
        </div>
        <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div class="${item.color} h-full rounded-full transition-all duration-700" style="width: ${pct}%"></div>
        </div>
      `;
      tracksProgressList.appendChild(barRow);
    });

    // تسجيل البيانات النهائية والتقرير
    sendDataToSheet(topTrack.title, percentages[topKey], percentages);
    sendTracking("مكتمل", QUESTIONS.length);

    shareXBtn.onclick = () => {
      const tweetText = encodeURIComponent(
        `أجريت مقياس المسار المهني لعلوم المختبرات الطبية وكانت نتيجتي:\n🎯 القطاع الأنسب: ${topTrack.title} بنسبة توافق (${percentages[topKey]}%)!\n\nاكتشف مسارك من هنا:`
      );
      const url = encodeURIComponent(window.location.href);
      window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${url}`, "_blank");
    };

    copyLinkBtn.onclick = () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        copyLinkText.textContent = "تم النسخ!";
        copyLinkBtn.classList.replace("text-blue-700", "text-emerald-700");
        copyLinkBtn.classList.replace("bg-blue-50", "bg-emerald-50");
        setTimeout(() => {
          copyLinkText.textContent = "نسخ الرابط";
          copyLinkBtn.classList.replace("text-emerald-700", "text-blue-700");
          copyLinkBtn.classList.replace("bg-emerald-50", "bg-blue-50");
        }, 2000);
      });
    };

  }, 1200);
}

// 6. إرسال النتائج النهائية
function sendDataToSheet(topTrack, topScore, allScores) {
  const payload = {
    name: userData.name,
    topTrack: topTrack,
    topScore: topScore,
    scores: allScores
  };

  fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch((err) => console.log("Sheet Sync Error:", err));
}

// 7. تصدير البطاقة
downloadCardBtn.addEventListener("click", () => {
  const target = document.getElementById("capture-area");
  downloadCardBtn.textContent = "جاري الحفظ...";

  html2canvas(target, { scale: 2.5, backgroundColor: "#ffffff" }).then((canvas) => {
    const link = document.createElement("a");
    link.download = `مسار-${userData.name}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    downloadCardBtn.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
      <span>حفظ بطاقة النتيجة كصورة</span>
    `;
  });
});

// 8. إعادة المحاولة
restartBtn.addEventListener("click", () => {
  currentQuestionIndex = 0;
  userAnswers = [];
  scores = { hosp: 0, corp: 0, reg: 0, acad: 0, insur: 0 };
  testCompleted = false;
  resultScreen.classList.add("hidden");
  introScreen.classList.remove("hidden");
});

// 9. رصد إغلاق الصفحة أو الخروج في منتصف الاختبار
window.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && !testCompleted && currentQuestionIndex > 0) {
    sendTracking("خرج ولم يكمل", currentQuestionIndex + 1);
  }
});
