const destinations = [
  {
    title: "Maui Cove",
    location: "Hawaii, USA",
    tag: "Beach",
    price: "$980",
    rating: "4.8",
    image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Northern Lights Lodge",
    location: "Reykjavík, Iceland",
    tag: "Nature",
    price: "$1,240",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Metro Bloom Hotel",
    location: "Tokyo, Japan",
    tag: "City",
    price: "$760",
    rating: "4.7",
    image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Golden Bay Escape",
    location: "Bali, Indonesia",
    tag: "Beach",
    price: "$890",
    rating: "4.8",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80"
  }
];

const itinerary = [
  { day: "Day 1", title: "Arrival + sunset cruise", details: "Check in, enjoy a welcome dinner, and board a golden-hour cruise." },
  { day: "Day 2", title: "Hidden beaches and cafés", details: "Rent a bike, discover local beaches, and pause for coffee at a seaside café." },
  { day: "Day 3", title: "Scenic lookout and spa", details: "End with a panoramic hike and a restorative spa session." }
];

const destinationContainer = document.getElementById("destinations");
const itineraryList = document.getElementById("itinerary-list");
const filterButtons = document.querySelectorAll("[data-filter]");

function renderDestinations(filter = "All") {
  const visible = filter === "All"
    ? destinations
    : destinations.filter((item) => item.tag === filter);

  if (!destinationContainer) return;

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

function renderItinerary() {
  if (!itineraryList) return;

  itineraryList.innerHTML = itinerary.map((item) => `
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

const activityScroller = document.getElementById("activity-logo-scroller");
let isActivityPaused = false;
let activityFrame = null;
const activityScrollSpeed = 0.5;

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

if (document.readyState !== "loading") {
  initActivityScroller();
} else {
  window.addEventListener("DOMContentLoaded", initActivityScroller);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => {
      btn.classList.remove("bg-slate-900", "text-white");
      btn.classList.add("border-slate-200", "text-slate-600");
    });

    button.classList.add("bg-slate-900", "text-white");
    button.classList.remove("border-slate-200", "text-slate-600");

    renderDestinations(button.getAttribute("data-filter") || "All");
  });
});

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

renderDestinations();
renderItinerary();

