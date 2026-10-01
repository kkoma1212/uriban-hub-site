const examples = [
  { word: "discover", meaning: "발견하다" },
  { word: "improve", meaning: "개선하다, 향상시키다" },
  { word: "remember", meaning: "기억하다" },
];
let position = 0;
const reveal = document.querySelector("#reveal-word");
const meaning = document.querySelector("#demo-meaning");
const prompt = document.querySelector("#demo-prompt");
reveal?.addEventListener("click", () => {
  meaning.hidden = !meaning.hidden;
  prompt.hidden = !meaning.hidden;
  reveal.firstChild.textContent = meaning.hidden
    ? "뜻 확인하기 "
    : "단어로 돌아가기 ";
});
document.querySelector("#next-word")?.addEventListener("click", () => {
  position = (position + 1) % examples.length;
  document.querySelector("#demo-word").textContent = examples[position].word;
  meaning.textContent = examples[position].meaning;
  meaning.hidden = true;
  prompt.hidden = false;
  reveal.firstChild.textContent = "뜻 확인하기 ";
  document.querySelector("#card-position").textContent =
    `0${position + 1} / 03`;
  document.querySelector("#card-progress").style.width =
    `${((position + 1) / examples.length) * 100}%`;
});
const tabs = [...document.querySelectorAll('[role="tab"]')];
const panel = document.querySelector("#audience-panel");
const audience = {
  student: {
    kicker: "나의 시험 준비",
    heading: "선생님께 받은 단어 자료로<br>내 공부를 시작해요.",
    steps: [
      "선생님이 안내한 CSV·텍스트 PDF를 준비해요.",
      "단어와 뜻을 확인하고, 오늘 공부할 DAY를 골라요.",
      "카드 → 시험 → 오늘 복습으로 이어가요.",
    ],
    note: "LEXI는 개인 학습 서비스예요. 우리반 허브 계정과 별도로 가입해요.",
  },
  teacher: {
    kicker: "수업 자료 활용",
    heading: "내가 준비한 자료로<br>학습 흐름을 먼저 살펴보세요.",
    steps: [
      "수업 단어 자료를 CSV·텍스트 PDF로 준비해요.",
      "내 계정에서 단어·뜻·DAY와 학습 흐름을 확인해요.",
      "학생에게 원본 자료와 LEXI 접속 방법을 안내해요.",
    ],
    note: "현재 학급 자동 배포·학생 결과 관리는 제공하지 않아요. 각자 자료를 가져와 공부해요.",
  },
};
function selectTab(tab) {
  const data = audience[tab.id === "teacher-tab" ? "teacher" : "student"];
  tabs.forEach((item) => {
    item.setAttribute("aria-selected", String(item === tab));
    item.tabIndex = item === tab ? 0 : -1;
  });
  panel.setAttribute("aria-labelledby", tab.id);
  document.querySelector("#audience-kicker").textContent = data.kicker;
  document.querySelector("#audience-heading").innerHTML = data.heading;
  document.querySelector("#audience-steps").replaceChildren(
    ...data.steps.map((step, index) => {
      const li = document.createElement("li"),
        number = document.createElement("b"),
        text = document.createElement("span");
      number.textContent = `0${index + 1}`;
      text.textContent = step;
      li.append(number, text);
      return li;
    }),
  );
  document.querySelector("#audience-footnote").textContent = data.note;
}
tabs.forEach((tab) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? tabs[0]
        : event.key === "End"
          ? tabs[tabs.length - 1]
          : tabs[(tabs.indexOf(tab) + 1) % tabs.length];
    selectTab(next);
    next.focus();
  });
});

// Match the shared site's mobile menu, including keyboard dismissal.
const siteNav = document.querySelector(".nav");
const menuToggle = document.querySelector(".nav__toggle");
function closeMenu() {
  siteNav?.classList.remove("is-open");
  menuToggle?.setAttribute("aria-expanded", "false");
}
menuToggle?.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  siteNav.classList.toggle("is-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
});
siteNav
  ?.querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && siteNav?.classList.contains("is-open")) {
    closeMenu();
    menuToggle.focus();
  }
});
document.addEventListener("click", (event) => {
  if (!siteNav?.contains(event.target)) closeMenu();
});
