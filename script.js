const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
menuToggle?.addEventListener("click", () => {
  nav?.classList.toggle("open");
  const expanded = nav?.classList.contains("open") ?? false;
  menuToggle.setAttribute("aria-expanded", String(expanded));
});

document.querySelectorAll(".nav a").forEach(a => {
  a.addEventListener("click", () => nav?.classList.remove("open"));
});

const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".course-card");

function applyCourseFilter(value) {
  filters.forEach(f => f.classList.toggle("active", f.dataset.filter === value));
  cards.forEach(card => {
    card.classList.toggle("hidden", value !== "all" && card.dataset.category !== value);
  });
}

filters.forEach(filter => {
  filter.addEventListener("click", () => applyCourseFilter(filter.dataset.filter));
});

document.querySelectorAll("[data-jump-filter]").forEach(link => {
  link.addEventListener("click", () => {
    const value = link.dataset.jumpFilter;
    if (value) applyCourseFilter(value);
  });
});

document.querySelectorAll("[data-flow-filter]").forEach(node => {
  node.addEventListener("click", () => {
    const value = node.dataset.flowFilter;
    if (value) applyCourseFilter(value);
    document.querySelector("#courses")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
