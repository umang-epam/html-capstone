// ── Config ───────────────────────────────────────────────
const cardsApiUrl = "./data/ui-data.json";
let cardData = [];
let activeDestinationFilter = "All";

// ── DOM References ───────────────────────────────────────
const destinationContainer = document.getElementById("destinations");
const filterButtons = () => document.querySelectorAll("#filter-buttons [data-filter]");
const activityScroller = document.getElementById("activity-logo-scroller");
let isActivityPaused = false;
let activityFrame = null;
const activityScrollSpeed = 0.5;

// ── Generic Nav Dropdowns (works for all dropdown buttons) ──
// ── Generic Nav Dropdowns (hover-based) ──────────────────
function initNavDropdowns() {
  const wrappers = document.querySelectorAll('.nav-dropdown-wrapper');
  if (!wrappers.length) return;

  let closeTimeout = null;

  function closeAll(except = null) {
    wrappers.forEach((wrapper) => {
      if (wrapper === except) return;
      wrapper.querySelector('.nav-dropdown-menu')?.classList.add('hidden');
      wrapper.querySelector('.nav-dropdown-icon')?.classList.remove('rotate-180');
    });
  }

  function openMenu(wrapper) {
    const menu = wrapper.querySelector('.nav-dropdown-menu');
    const icon = wrapper.querySelector('.nav-dropdown-icon');

    closeAll(wrapper);
    menu?.classList.remove('hidden');
    icon?.classList.add('rotate-180');
  }

  function closeMenu(wrapper) {
    const menu = wrapper.querySelector('.nav-dropdown-menu');
    const icon = wrapper.querySelector('.nav-dropdown-icon');

    menu?.classList.add('hidden');
    icon?.classList.remove('rotate-180');
  }

  wrappers.forEach((wrapper) => {
    wrapper.addEventListener('mouseenter', () => {
      clearTimeout(closeTimeout);
      openMenu(wrapper);
    });

    wrapper.addEventListener('mouseleave', () => {
      closeTimeout = setTimeout(() => {
        closeMenu(wrapper);
      }, 150); // small delay to avoid flicker when moving mouse toward menu
    });
  });

  // Optional: also close everything if mouse leaves the whole nav area
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
}

// ── Get filtered destinations ────────────────────────────
function getVisibleDestinations() {
  return cardData.filter(
    (item) => activeDestinationFilter === "All" || item.tag === activeDestinationFilter
  );
}

// ── Render destination cards ─────────────────────────────
function renderDestinations() {
  if (!destinationContainer) return;

  const visible = getVisibleDestinations();

  if (!visible.length) {
    destinationContainer.innerHTML = `
      <div class="md:col-span-2 xl:col-span-3 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
        <p class="text-lg font-semibold text-slate-900">No destinations found.</p>
        <p class="mt-2 text-sm">Try selecting a different filter.</p>
      </div>
    `;
    return;
  }

  destinationContainer.innerHTML = visible.map((item) => `
    <article
      data-location="${item.location}"
      data-title="${item.title}"
      data-tag="${item.tag}"
      class="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div class="relative">
        <img
          src="${item.image}"
          alt="${item.title}"
          class="h-48 w-full object-cover" />
        <span class="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
          ${item.tag}
        </span>
        <span class="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-amber-500 shadow-sm">
          ★ ${item.rating}
        </span>
      </div>
      <div class="p-4">
        <h4 class="text-base font-semibold text-slate-900">${item.title}</h4>
        <p class="mt-1 text-sm text-slate-500">📍 ${item.location}</p>
        <p class="mt-2 text-xs text-slate-500 leading-5 line-clamp-2">${item.description}</p>
        <div class="mt-3 flex flex-wrap gap-1">
          ${item.activities.slice(0, 3).map(a =>
            `<span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">${a}</span>`
          ).join('')}
        </div>
        <div class="mt-4 flex items-center justify-between">
          <div>
            <span class="text-lg font-bold text-slate-900">${item.price}</span>
            <span class="text-xs text-slate-400 ml-1">/ ${item.duration}</span>
          </div>
          <button class="rounded-full bg-yellow-400 hover:bg-yellow-300 px-4 py-1.5 text-xs font-bold text-black transition">
            Book Now
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

// ── Update active filter button styles ───────────────────
function updateFilterButtons() {
  filterButtons().forEach((button) => {
    const isActive = button.getAttribute("data-filter") === activeDestinationFilter;
    button.classList.toggle("bg-slate-900", isActive);
    button.classList.toggle("text-white", isActive);
    button.classList.toggle("border-slate-200", !isActive);
    button.classList.toggle("text-slate-600", !isActive);
  });
}

// ── Init filter buttons ──────────────────────────────────
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

// ── Activity scroller animation ──────────────────────────
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

  activityScroller.addEventListener("mouseenter", () => { isActivityPaused = true; });
  activityScroller.addEventListener("mouseleave", () => { isActivityPaused = false; });

  if (!activityFrame) {
    activityFrame = window.requestAnimationFrame(animateActivityScroll);
  }
}

// ── Load card data from JSON ─────────────────────────────
async function loadCardData() {
  try {
    const response = await fetch(cardsApiUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const data = await response.json();
    cardData = data.destinations || [];

  } catch (error) {
    console.warn("JSON load failed, using fallback data.", error);

    cardData = [
      {
        title: "Maui Cove",
        location: "Hawaii, USA",
        tag: "Beach",
        price: "$980",
        duration: "5 nights",
        rating: "4.8",
        description: "A stunning beachside escape with crystal-clear waters, surfing, and tropical sunsets.",
        activities: ["Surfing", "Snorkeling", "Whale watching"],
        image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80"
      },
      {
        title: "Northern Lights Lodge",
        location: "Reykjavík, Iceland",
        tag: "Nature",
        price: "$1,240",
        duration: "6 nights",
        rating: "4.9",
        description: "Experience the magical aurora borealis from a cozy lodge in Iceland.",
        activities: ["Northern lights", "Glacier hiking", "Hot springs"],
        image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=80"
      },
      {
        title: "Metro Bloom Hotel",
        location: "Tokyo, Japan",
        tag: "City",
        price: "$760",
        duration: "4 nights",
        rating: "4.7",
        description: "Immerse yourself in Tokyo's vibrant culture, world-class cuisine, and neon-lit streets.",
        activities: ["City tours", "Street food", "Temple visits"],
        image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=900&q=80"
      },
      {
        title: "Golden Bay Escape",
        location: "Bali, Indonesia",
        tag: "Beach",
        price: "$890",
        duration: "6 nights",
        rating: "4.8",
        description: "Relax on golden beaches, explore rice terraces, and enjoy Balinese spa treatments.",
        activities: ["Beach relaxation", "Temple tours", "Surfing"],
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80"
      },
      {
        title: "Alpine Retreat",
        location: "Zermatt, Switzerland",
        tag: "Nature",
        price: "$1,340",
        duration: "5 nights",
        rating: "4.9",
        description: "Ski the Swiss Alps or hike stunning mountain trails with views of the Matterhorn.",
        activities: ["Skiing", "Snowboarding", "Mountain hiking"],
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80"
      },
      {
        title: "Harborlight Suites",
        location: "Barcelona, Spain",
        tag: "City",
        price: "$690",
        duration: "4 nights",
        rating: "4.6",
        description: "Explore Gaudí architecture, tapas bars, and beautiful Mediterranean beaches.",
        activities: ["Sightseeing", "Food tours", "Museum visits"],
        image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=900&q=80"
      },
      {
        title: "Coral Reef Resort",
        location: "Malé, Maldives",
        tag: "Beach",
        price: "$1,560",
        duration: "7 nights",
        rating: "4.95",
        description: "Luxurious overwater bungalows with direct access to vibrant coral reefs.",
        activities: ["Scuba diving", "Snorkeling", "Sunset cruises"],
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80"
      },
      {
        title: "Sage Canyon Lodge",
        location: "Sedona, USA",
        tag: "Nature",
        price: "$810",
        duration: "4 nights",
        rating: "4.7",
        description: "Red rock canyon views, spiritual retreats, and adventure hiking in Sedona.",
        activities: ["Jeep tours", "Hiking", "Stargazing"],
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"
      }
    ];
  }

  renderDestinations();
}


// ── Activities Cards Interactions ─────────────────────────
function initActivitiesSection() {
  const loadMoreBtn = document.getElementById('load-more-btn');
  const promoBtn    = document.getElementById('promo-view-more');
  const cardsGrid   = document.getElementById('activities-cards');

  loadMoreBtn?.addEventListener('click', () => {
    loadMoreBtn.disabled = true;
    loadMoreBtn.innerHTML = `
      <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Loading...
    `;

    // Simulate loading more cards (replace with real fetch/append logic)
    setTimeout(() => {
      loadMoreBtn.disabled = false;
      loadMoreBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="5" cy="5" r="1.5" /><circle cx="12" cy="5" r="1.5" /><circle cx="19" cy="5" r="1.5" />
          <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
          <circle cx="5" cy="19" r="1.5" /><circle cx="12" cy="19" r="1.5" /><circle cx="19" cy="19" r="1.5" />
        </svg>
        Load More Tours
      `;
      console.log('Load more clicked — hook this up to your data source.');
    }, 1000);
  });

  promoBtn?.addEventListener('click', () => {
    console.log('View more clicked — dummy action, no redirect.');
  });
}



// ── Newsletter modal ─────────────────────────────────────
function initNewsletter() {
  const form        = document.getElementById("newsletter-form");
  const modal       = document.getElementById("newsletter-modal");
  const emailConf   = document.getElementById("newsletter-email-confirmation");
  const closeBtn    = document.getElementById("close-newsletter-button");
  const okBtn       = document.getElementById("newsletter-ok-button");
  const closeBack   = document.getElementById("close-newsletter-modal");

  if (!form || !modal) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("newsletter-email").value;
    if (emailConf) emailConf.textContent = email;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  });

  [closeBtn, okBtn, closeBack].forEach((el) => {
    el?.addEventListener("click", () => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      form.reset();
    });
  });
}


// Corosel Data

const images = [
  {
    src: "https://images.unsplash.com/photo-1548013146-72479768bada?w=600",
    alt: "Pagodas with mountains"
  },
  {
    src: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600",
    alt: "Woman by the sea"
  },
  {
    src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600",
    alt: "Hiker with backpack"
  },
  {
    src: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=600",
    alt: "Two women sitting on cliff"
  },
];

function renderGallery() {
  const galleryStrip = document.getElementById('gallery-strip');

  images.forEach((image) => {
    const imgContainer = document.createElement('div');
    imgContainer.className = 'flex-1 h-64 md:h-80 overflow-hidden relative group cursor-pointer';

    const img = document.createElement('img');
    img.src = image.src;
    img.alt = image.alt;
    img.className = 'w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110';

    imgContainer.appendChild(img);
    galleryStrip.appendChild(imgContainer);
  });
}

// document.addEventListener('DOMContentLoaded', renderGallery);

// ── App Init ─────────────────────────────────────────────
function initApp() {
  initNavDropdowns();
  initFilters();
  initActivityScroller();
  initNewsletter();
  loadCardData();
initActivitiesSection();
renderGallery();
}

window.addEventListener("DOMContentLoaded", initApp);