/* 우리반 허브 사이트 공통 스크립트: 좁은 화면 메뉴 여닫기, 탭, 등장 효과. 움직임 줄이기·IntersectionObserver 미지원이면 그대로 보인다 */
(function () {
  var bar = document.querySelector(".bar");
  var nav = document.querySelector(".nav"), toggle = document.querySelector(".nav__toggle");
  var setOpen = function (open) { nav.classList.toggle("is-open", open); toggle.setAttribute("aria-expanded", String(open)); };
  toggle.addEventListener("click", function () { setOpen(!nav.classList.contains("is-open")); });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
  /* 키보드 초점이 메뉴 밖으로 나가면 닫는다 */
  nav.addEventListener("focusout", function (e) { if (nav.classList.contains("is-open") && !nav.contains(e.relatedTarget)) setOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); } });
  document.addEventListener("click", function (e) { if (!bar.contains(e.target)) setOpen(false); });
  /* 탭(data-tabs): 스크립트가 있을 때만 탭으로 바꾼다. 없으면 모든 묶음이 차례로 보인다. 좌우 화살표·Home·End로 이동 */
  document.querySelectorAll("[data-tabs]").forEach(function (box) {
    var tabs = [].slice.call(box.querySelectorAll('[role="tab"]'));
    var panelOf = function (t) { return document.getElementById(t.getAttribute("aria-controls")); };
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        panelOf(t).hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach(function (t, i) {
      var panel = panelOf(t);
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", t.id);
      t.addEventListener("click", function () { select(t); });
      t.addEventListener("keydown", function (e) {
        var next = e.key === "ArrowRight" ? tabs[(i + 1) % tabs.length] : e.key === "ArrowLeft" ? tabs[(i - 1 + tabs.length) % tabs.length]
          : e.key === "Home" ? tabs[0] : e.key === "End" ? tabs[tabs.length - 1] : null;
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
    if (tabs.length) select(tabs[0]);
  });
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.documentElement.classList.add("js");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
})();
