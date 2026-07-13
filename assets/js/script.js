const cardsApiUrl = "./data/ui-data.json";
let cardData = [];
let activeDestinationFilter = "All";
let heroSearchQuery = "";

const destinationContainer = document.getElementById("destinations");
const searchForm = document.getElementById("hero-search-form");
const searchInput = document.getElementById("hero-search-input");
const heroSearchResults = document.getElementById("hero-search-results");
const filterButtons = () => document.querySelectorAll("#filter-buttons [data-filter]");
const activityScroller = document.getElementById("activity-logo-scroller");
let isActivityPaused = false;
let activityFrame = null;
const activityScrollSpeed = 0.5;

function getVisibleDestinations() {
  const query = heroSearchQuery.trim().toLowerCase();
  return cardData
    .filter((item) => activeDestinationFilter === "All" || item.tag === activeDestinationFilter)
    .filter((item) => {
      if (!query) return true;
      return `${item.title} ${item.location}`.toLowerCase().includes(query);
    });
}

function renderDestinations() {
  if (!destinationContainer) return;
  const visible = getVisibleDestinations();
  const activeQuery = heroSearchQuery.trim();

  if (heroSearchResults) {
    heroSearchResults.textContent = activeQuery
      ? `${visible.length} stay${visible.length === 1 ? "" : "s"} match “${activeQuery}”.`
      : "Search by city, hotel, or destination to find your next stay.";
  }

  if (!visible.length) {
    destinationContainer.innerHTML = `
      <div class="md:col-span-2 xl:col-span-3 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
        <p class="text-lg font-semibold text-slate-900">No stays match that search yet.</p>
        <p class="mt-2 text-sm">Try a city, hotel, or destination like Tokyo, Maui, or Reykjavík.</p>
      </div>
    `;
    return;
  }

  destinationContainer.innerHTML = visible.map((item) => `
    <article class="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
      <img src="${item.image}" alt="${item.title}" class="h-40 w-full object-cover" />
      <div class="p-4">
        <div class="flex items-center justify-between">
          <h4 class="text-lg font-semibold text-slate-900">${item.title}</h4>
          <span class="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-700">${item.tag}</span>
        </div>
        <p class="mt-1 text-sm text-slate-600">${item.location}</p>
        <div class="mt-4 flex items-center justify-between text-sm">
          <span class="font-semibold text-slate-900">${item.price}</span>
          <span class="text-slate-500">★ ${item.rating}</span>
        </div>
      </div>
    </article>
  `).join("");
}

function updateFilterButtons() {
  const buttons = filterButtons();
  buttons.forEach((button) => {
    const isActive = button.getAttribute("data-filter") === activeDestinationFilter;
    button.classList.toggle("bg-slate-900", isActive);
    button.classList.toggle("text-white", isActive);
    button.classList.toggle("border-slate-200", !isActive);
    button.classList.toggle("text-slate-600", !isActive);
  });
}

function initFilters() {
  const buttons = filterButtons();
  if (!buttons.length) return;

  updateFilterButtons();

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      activeDestinationFilter = button.getAttribute("data-filter") || "All";
      updateFilterButtons();
      renderDestinations();
    });
  });
}

function initHeroSearch() {
  if (!searchForm || !searchInput) return;

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    heroSearchQuery = searchInput.value.trim();
    renderDestinations();
  });

  searchInput.addEventListener("input", () => {
    heroSearchQuery = searchInput.value.trim();
    renderDestinations();
  });
}

function animateActivityScroll() {
  if (!activityScroller || isActivityPaused) return;

  if (activityScroller.scrollWidth > activityScroller.clientWidth) {
    activityScroller.scrollLeft += activityScrollSpeed;

    if (activityScroller.scrollLeft >= activityScroller.scrollWidth - activityScroller.clientWidth) {
      activityScroller.scrollLeft = 0;
    }
  }

  activityFrame = window.requestAnimationFrame(animateActivityScroll);
}

function initActivityScroller() {
  if (!activityScroller) return;

  activityScroller.addEventListener("mouseenter", () => {
    isActivityPaused = true;
  });

  activityScroller.addEventListener("mouseleave", () => {
    isActivityPaused = false;
  });

  if (!activityFrame) {
    activityFrame = window.requestAnimationFrame(animateActivityScroll);
  }
}

async function loadCardData() {
  try {
    const response = await fetch(cardsApiUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch card data: ${response.statusText}`);
    }

    const data = await response.json();
    cardData = data.destinations || [];
  } catch (error) {
    console.warn("Unable to load card data from API.", error);
    cardData = [];
  }

  renderDestinations();
}

function initApp() {
  initHeroSearch();
  initFilters();
  initActivityScroller();
  loadCardData();
}

window.addEventListener("DOMContentLoaded", initApp);
