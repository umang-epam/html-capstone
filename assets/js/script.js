const uiDataUrl = "./data/ui-data.json";
let uiData = null;
let activeDestinationFilter = "All";
let heroSearchQuery = "";

const activityScroller = document.getElementById("activity-logo-scroller");
let isActivityPaused = false;
let activityFrame = null;
const activityScrollSpeed = 0.5;

function setTextContent(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function renderHero(data) {
  if (!data?.hero) return;

  const hero = data.hero;

  setTextContent("hero-brand-name", hero.brand?.name || "Velora");
  setTextContent("hero-brand-tagline", hero.brand?.tagline || "Travel Studio");

  const heroNavLinks = document.getElementById("hero-nav-links");
  if (heroNavLinks) {
    heroNavLinks.innerHTML = (hero.nav || []).map((item) => `
      <a href="${item.href || "#"}" class="transition hover:text-white">${item.label}</a>
    `).join("");
  }

  const heroTitle = document.getElementById("hero-title");
  if (heroTitle) {
    heroTitle.innerHTML = `Begin Your <span class="font-bold text-cyan-300">${hero.highlight || "Fantastic Travel"}</span> Experience Here`;
  }

  const heroDescription = document.getElementById("hero-description");
  if (heroDescription) {
    heroDescription.textContent = hero.description || "";
  }

  const heroPrimaryCta = document.getElementById("hero-primary-cta");
  if (heroPrimaryCta) {
    heroPrimaryCta.textContent = hero.primaryCta?.label || "Discover Now";
    heroPrimaryCta.href = hero.primaryCta?.href || "#discover";
  }

  const heroSecondaryCta = document.getElementById("hero-secondary-cta");
  if (heroSecondaryCta) {
    heroSecondaryCta.innerHTML = `
      <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow">
        <span class="block h-2.5 w-2.5 rounded-full bg-slate-950"></span>
      </span>
      ${hero.secondaryCta?.label || "How it works?"}
    `;
  }

  const heroStats = document.getElementById("hero-stats");
  if (heroStats && hero.stats?.length) {
    heroStats.innerHTML = hero.stats.map((item) => `
      <div class="rounded-[1.5rem] bg-white/90 px-5 py-4 text-slate-900 shadow-sm">
        <p class="text-lg font-semibold">${item.value}</p>
        <p class="mt-1 text-sm text-slate-500">${item.label}</p>
      </div>
    `).join("");
  }

  const heroBackgroundImage = document.getElementById("hero-background-image");
  if (heroBackgroundImage) {
    heroBackgroundImage.src = hero.backgroundImage || heroBackgroundImage.src;
  }

  const heroMainImage = document.getElementById("hero-main-image");
  if (heroMainImage) {
    heroMainImage.src = hero.mainImage || heroMainImage.src;
    heroMainImage.alt = hero.mainImageAlt || heroMainImage.alt;
  }
}

function renderPartners(data) {
  const partnerLogos = document.getElementById("partner-logos");
  const partners = data?.partners || [];

  if (!partnerLogos) return;

  if (partners.length) {
    partnerLogos.innerHTML = partners.map((partner) => `
      <div class="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
        <img src="${partner.image}" alt="${partner.name} logo" class="h-6 object-contain" />
      </div>
    `).join("");
  }

  setTextContent("partners-eyebrow", "Partner with");
  setTextContent("partners-title", "Trusted by leading travel and payment brands");
}

function renderDiscover(data) {
  const discover = data?.discover;
  if (!discover) return;

  const filterButtons = document.getElementById("filter-buttons");
  if (filterButtons) {
    filterButtons.innerHTML = discover.filters?.map((filter) => `
      <button
        data-filter="${filter.value}"
        class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 ${filter.value === activeDestinationFilter ? "bg-slate-900 text-white" : ""}"
      >
        ${filter.label}
      </button>
    `).join("");

    filterButtons.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        activeDestinationFilter = button.getAttribute("data-filter") || "All";
        renderDiscover(data);
      });
    });
  }

  setTextContent("discover-eyebrow", discover.eyebrow || "Live search");
  setTextContent("discover-title", discover.title || "Pick a vibe that fits your mood");
  renderDestinations(discover.destinations || []);
}

function getVisibleDestinations(destinations = []) {
  const query = heroSearchQuery.trim().toLowerCase();
  const byTag = activeDestinationFilter === "All"
    ? destinations
    : destinations.filter((item) => item.tag === activeDestinationFilter);

  if (!query) {
    return byTag;
  }

  return byTag.filter((item) => {
    const haystack = `${item.title} ${item.location}`.toLowerCase();
    return haystack.includes(query);
  });
}

function renderDestinations(destinations = []) {
  const destinationContainer = document.getElementById("destinations");
  if (!destinationContainer) return;

  const visible = getVisibleDestinations(destinations);
  const searchResultsText = document.getElementById("hero-search-results");
  const activeQuery = heroSearchQuery.trim();

  if (searchResultsText) {
    if (activeQuery) {
      searchResultsText.textContent = `${visible.length} stay${visible.length === 1 ? "" : "s"} match “${activeQuery}”.`;
    } else {
      searchResultsText.textContent = "Search by city, hotel, or destination to find your next stay.";
    }
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

function renderActivities(data) {
  const activities = data?.activities;
  if (!activities) return;

  setTextContent("activities-eyebrow", activities.eyebrow || "Travel By Activities");
  setTextContent("activities-title", activities.title || "Navigate the Globe with Confidence");
  setTextContent("activities-featured-eyebrow", activities.featured?.eyebrow || "Featured places");
  setTextContent("activities-featured-title", activities.featured?.title || "Popular destinations and experiences");

  const scroller = document.getElementById("activity-logo-scroller");
  if (scroller) {
    scroller.innerHTML = (activities.scroller || []).map((item) => `
      <article class="flex min-w-[120px] flex-col items-center gap-3 rounded-[1.75rem] border border-slate-200 bg-white px-4 py-5 text-center shadow-sm">
        <img src="${item.image}" alt="${item.title}" class="h-20 w-20 rounded-full object-cover" />
        <p class="text-sm font-semibold text-slate-900">${item.title}</p>
      </article>
    `).join("");
  }

  const cardsContainer = document.getElementById("activities-cards");
  if (cardsContainer) {
    cardsContainer.innerHTML = (activities.cards || []).map((card) => `
      <div class="rounded-[1.75rem] overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
        <img src="${card.image}" alt="${card.title}" class="h-48 w-full object-cover" />
        <div class="space-y-3 p-6">
          <p class="text-lg font-semibold text-slate-900">${card.title}</p>
          <div class="grid gap-2 text-sm text-slate-600">
            ${card.items.map((item) => `<p>${item}</p>`).join("")}
          </div>
        </div>
      </div>
    `).join("");
  }
}

function renderItinerary(data) {
  const itineraryList = document.getElementById("itinerary-list");
  const itinerary = data?.itinerary;
  if (!itineraryList || !itinerary) return;

  setTextContent("itinerary-eyebrow", itinerary.eyebrow || "Suggested plan");
  setTextContent("itinerary-title", itinerary.title || "Your 3-day adventure");
  setTextContent("itinerary-badge", itinerary.badge || "Handpicked");

  itineraryList.innerHTML = (itinerary.items || []).map((item) => `
    <div class="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
      <div class="flex items-center justify-between">
        <p class="text-sm font-semibold text-cyan-600">${item.day}</p>
        <span class="text-sm text-slate-400">Included</span>
      </div>
      <h4 class="mt-2 font-semibold text-slate-900">${item.title}</h4>
      <p class="mt-1 text-sm text-slate-600">${item.details}</p>
    </div>
  `).join("");
}

function renderInsights(data) {
  const insights = data?.insights;
  if (!insights) return;

  setTextContent("insights-eyebrow", insights.eyebrow || "Traveler insights");
  setTextContent("insights-title", insights.title || "Why explorers love Velora");

  const insightsCards = document.getElementById("insights-cards");
  if (insightsCards) {
    insightsCards.innerHTML = (insights.cards || []).map((card) => `
      <div class="rounded-[1.25rem] border border-white/10 bg-white/10 p-4">
        <p class="text-3xl font-semibold">${card.value}</p>
        <p class="mt-1 text-sm text-slate-300">${card.description}</p>
      </div>
    `).join("") + `
      <div class="rounded-[1.25rem] border border-white/10 bg-white/10 p-4 md:col-span-2">
        <p id="insights-quote-text" class="text-lg font-semibold">“${insights.quote?.text || "Every plan felt personal and effortless."}”</p>
        <p id="insights-quote-author" class="mt-2 text-sm text-slate-300">${insights.quote?.author || "— Mia, solo explorer"}</p>
      </div>
    `;
  }
}

function renderOffers(data) {
  const offers = data?.offers;
  if (!offers) return;

  setTextContent("offers-eyebrow", offers.eyebrow || "Flight Offer Deals");
  setTextContent("offers-title", offers.title || "Competitive fares for your route-specific searches.");

  const offersGrid = document.getElementById("offers-grid");
  if (offersGrid) {
    offersGrid.innerHTML = (offers.items || []).map((offer) => `
      <article class="group overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
        <div class="relative overflow-hidden rounded-t-[2rem]">
          <img src="${offer.image}" alt="${offer.destination}" class="h-56 w-full object-cover transition duration-500 group-hover:scale-105" />
          <button class="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white bg-white/90 text-slate-900 shadow-sm transition hover:bg-white">
            <span class="text-lg">♥</span>
          </button>
        </div>
        <div class="p-6 sm:p-7">
          <div class="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
            <span>${offer.dates}</span>
          </div>
          <div class="mt-5 grid gap-4 md:grid-cols-2">
            <div class="rounded-[1.5rem] bg-white p-4 shadow-sm">
              <p class="text-sm uppercase tracking-[0.2em] text-slate-500">${offer.origin}</p>
              <p class="mt-2 text-lg font-semibold text-slate-900">${offer.destination}</p>
              <p class="mt-2 text-sm text-slate-500">${offer.tag}</p>
            </div>
            <div class="rounded-[1.5rem] bg-white p-4 shadow-sm">
              <p class="text-sm uppercase tracking-[0.2em] text-slate-500">Business</p>
              <p class="mt-2 text-2xl font-semibold text-slate-900">${offer.price}</p>
            </div>
          </div>
          <div class="mt-5 flex flex-wrap items-center justify-between gap-4">
            <span class="text-sm text-slate-500">${offer.seats}</span>
            <button class="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">${offer.buttonText}</button>
          </div>
        </div>
      </article>
    `).join("");
  }
}

function renderTestimonials(data) {
  const testimonials = data?.testimonials;
  if (!testimonials) return;

  setTextContent("testimonials-title", testimonials.title || "What our clients are saying about us?");
  setTextContent("testimonials-description", testimonials.description || "");

  const testimonialsGrid = document.getElementById("testimonials-grid");
  if (testimonialsGrid) {
    testimonialsGrid.innerHTML = (testimonials.items || []).map((item) => `
      <article class="rounded-[2rem] bg-white p-6 shadow-sm">
        <div class="flex items-center gap-4">
          <img src="${item.image}" alt="${item.name}" class="h-16 w-16 rounded-full object-cover" />
          <div>
            <p class="text-lg font-semibold text-slate-900">${item.name}</p>
            <p class="text-sm text-slate-500">${item.location}</p>
          </div>
        </div>
        <div class="mt-4 flex items-center gap-1 text-amber-400">
          <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
        </div>
        <p class="mt-4 text-sm leading-7 text-slate-600">${item.quote}</p>
      </article>
    `).join("");
  }
}

function renderNewsletter(data) {
  const newsletter = data?.newsletter;
  if (!newsletter) return;

  setTextContent("newsletter-eyebrow", newsletter.eyebrow || "Join our newsletter");
  setTextContent("newsletter-title", newsletter.title || "Subscribe to see secret deals prices drop the moment you sign up!");
  setTextContent("newsletter-description", newsletter.description || "");

  const newsletterImage = document.getElementById("newsletter-image");
  if (newsletterImage) {
    newsletterImage.src = newsletter.image || newsletterImage.src;
  }

  const newsletterSubmitButton = document.getElementById("newsletter-submit-button");
  if (newsletterSubmitButton) {
    newsletterSubmitButton.textContent = newsletter.buttonText || "Subscribe";
  }
}

function renderFooter(data) {
  const footer = data?.footer;
  if (!footer) return;

  setTextContent("footer-brand", footer.brand || "Travila");
  setTextContent("footer-description", footer.description || "");
  setTextContent("footer-phone-label", footer.phoneLabel || "Need help? Call us");
  setTextContent("footer-phone-number", footer.phoneNumber || "1-800-222-8888");
  setTextContent("footer-copyright", footer.copyright || "");

  const footerColumns = document.querySelectorAll(".footer-links-column");
  const footerColumnData = footer.columns || [];
  footerColumns.forEach((column, index) => {
    const title = column.querySelector("h3");
    const list = column.querySelector("ul");
    if (title && footerColumnData[index]) {
      title.textContent = footerColumnData[index].title || title.textContent;
    }

    if (list && footerColumnData[index]) {
      list.innerHTML = footerColumnData[index].links.map((link) => `
        <li><a href="#" class="transition hover:text-slate-900">${link}</a></li>
      `).join("");
    }
  });
}

function renderSigninModal(data) {
  const signin = data?.hero?.signin;
  if (!signin) return;

  const openSigninButton = document.getElementById("open-signin-modal");
  if (openSigninButton) {
    openSigninButton.textContent = signin.label || "Sign in";
  }

  setTextContent("signin-modal-label", signin.modalLabel || "Sign in");
  setTextContent("signin-modal-title", signin.modalTitle || "Welcome back");
  setTextContent("signin-modal-subtitle", signin.modalSubtitle || "Access your saved trips and exclusive offers.");
  const signinSubmitButton = document.getElementById("signin-modal-submit");
  if (signinSubmitButton) {
    signinSubmitButton.textContent = signin.submitLabel || "Sign in";
  }
  const signinLink = document.getElementById("signin-modal-link");
  if (signinLink) {
    signinLink.textContent = signin.accountLink || "Create an account";
  }
}

function renderApp(data) {
  renderHero(data);
  renderPartners(data);
  renderDiscover(data);
  renderActivities(data);
  renderItinerary(data);
  renderInsights(data);
  renderOffers(data);
  renderTestimonials(data);
  renderNewsletter(data);
  renderFooter(data);
  renderSigninModal(data);
}

function initHeroSearch() {
  const searchForm = document.getElementById("hero-search-form");
  const searchInput = document.getElementById("hero-search-input");

  if (!searchForm || !searchInput) return;

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    heroSearchQuery = searchInput.value.trim();
    renderDiscover(uiData);
  });

  searchInput.addEventListener("input", () => {
    heroSearchQuery = searchInput.value.trim();
    renderDiscover(uiData);
  });
}

function animateActivityScroll() {
  if (!activityScroller) return;

  if (!isActivityPaused && activityScroller.scrollWidth > activityScroller.clientWidth) {
    activityScroller.scrollLeft += activityScrollSpeed;

    if (activityScroller.scrollLeft >= activityScroller.scrollWidth - activityScroller.clientWidth) {
      activityScroller.scrollLeft = 0;
    }
  }

  activityFrame = window.requestAnimationFrame(animateActivityScroll);
}

function initActivityScroller() {
  if (!activityScroller) return;

  activityScroller.scrollLeft = 0;

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

const signinModal = document.getElementById("signin-modal");
const signinOpenButton = document.getElementById("open-signin-modal");
const signinCloseOverlay = document.getElementById("close-signin-modal");
const signinCloseButton = document.getElementById("close-modal-button");

function openSigninModal() {
  if (!signinModal) return;
  signinModal.classList.remove("hidden");
  signinModal.classList.add("flex");
}

function closeSigninModal() {
  if (!signinModal) return;
  signinModal.classList.add("hidden");
  signinModal.classList.remove("flex");
}

if (signinOpenButton) {
  signinOpenButton.addEventListener("click", (event) => {
    event.preventDefault();
    openSigninModal();
  });
}

if (signinCloseOverlay) {
  signinCloseOverlay.addEventListener("click", closeSigninModal);
}

if (signinCloseButton) {
  signinCloseButton.addEventListener("click", closeSigninModal);
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSigninModal();
    closeNewsletterModal();
  }
});

const newsletterForm = document.getElementById("newsletter-form");
const newsletterModal = document.getElementById("newsletter-modal");
const newsletterCloseOverlay = document.getElementById("close-newsletter-modal");
const newsletterCloseButton = document.getElementById("close-newsletter-button");
const newsletterOkButton = document.getElementById("newsletter-ok-button");
const newsletterEmailConfirmation = document.getElementById("newsletter-email-confirmation");

function openNewsletterModal(email) {
  if (!newsletterModal) return;
  if (newsletterEmailConfirmation) {
    newsletterEmailConfirmation.textContent = email;
  }
  newsletterModal.classList.remove("hidden");
  newsletterModal.classList.add("flex");
}

function closeNewsletterModal() {
  if (!newsletterModal) return;
  newsletterModal.classList.add("hidden");
  newsletterModal.classList.remove("flex");
}

if (newsletterForm) {
  newsletterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const emailInput = document.getElementById("newsletter-email");
    const emailValue = emailInput?.value.trim();

    if (emailValue) {
      openNewsletterModal(emailValue);
      emailInput.value = "";
    }
  });
}

if (newsletterCloseOverlay) {
  newsletterCloseOverlay.addEventListener("click", closeNewsletterModal);
}

if (newsletterCloseButton) {
  newsletterCloseButton.addEventListener("click", closeNewsletterModal);
}

if (newsletterOkButton) {
  newsletterOkButton.addEventListener("click", closeNewsletterModal);
}

async function initApp() {
  try {
    const response = await fetch(uiDataUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to fetch UI data");
    }
    uiData = await response.json();
  } catch (error) {
    console.warn("Unable to load UI data from API, keeping the existing UI content.", error);
  }

  if (uiData) {
    renderApp(uiData);
    initHeroSearch();
  }

  if (document.readyState !== "loading") {
    initActivityScroller();
  } else {
    window.addEventListener("DOMContentLoaded", initActivityScroller);
  }
}

initApp();

