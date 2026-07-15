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
          <button data-title="${item.title}" data-price="${item.price}" class="book-now-btn rounded-full bg-yellow-400 hover:bg-yellow-300 px-4 py-1.5 text-xs font-bold text-black transition">
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

// ── Become Local Expert Modal & Validations ────────────────
function initBecomeExpertModal() {
  const modal = document.getElementById("become-expert-modal");
  const card = document.getElementById("become-expert-card");
  const openBtn = document.getElementById("become-expert-btn");
  const closeBtn = document.getElementById("close-expert-modal-btn");
  const cancelBtn = document.getElementById("cancel-expert-btn");
  const submitBtn = document.getElementById("submit-expert-btn");
  const form = document.getElementById("become-expert-form");
  const successScreen = document.getElementById("expert-success-screen");
  const successCloseBtn = document.getElementById("success-close-btn");

  if (!modal || !card || !openBtn || !form) return;

  // Fields
  const nameInput = document.getElementById("expert-name");
  const emailInput = document.getElementById("expert-email");
  const phoneInput = document.getElementById("expert-phone");
  const cityInput = document.getElementById("expert-city");
  const specialtySelect = document.getElementById("expert-specialty");
  const bioTextarea = document.getElementById("expert-bio");
  const bioCounter = document.getElementById("bio-char-counter");
  const termsCheckbox = document.getElementById("expert-terms");
  const fileInput = document.getElementById("expert-file");
  const dropzone = document.getElementById("expert-dropzone");
  const dropzoneText = document.getElementById("dropzone-text");

  let autoCloseTimer = null;

  // Open Modal
  function openModal() {
    modal.classList.remove("opacity-0", "pointer-events-none");
    modal.classList.add("opacity-100");
    card.classList.remove("scale-95", "opacity-0");
    card.classList.add("scale-100", "opacity-100");
    document.body.classList.add("overflow-hidden");
  }

  // Close Modal
  function closeModal() {
    modal.classList.add("opacity-0", "pointer-events-none");
    modal.classList.remove("opacity-100");
    card.classList.add("scale-95", "opacity-0");
    card.classList.remove("scale-100", "opacity-100");
    document.body.classList.remove("overflow-hidden");
    
    // Clear any timers
    if (autoCloseTimer) clearTimeout(autoCloseTimer);
    
    // Reset Form & Success screen after closing transition
    setTimeout(() => {
      form.reset();
      // Clear validation styles
      const fields = [nameInput, emailInput, phoneInput, cityInput, specialtySelect, bioTextarea, termsCheckbox];
      fields.forEach(field => toggleFieldError(field, false));
      // Reset file upload
      if (dropzoneText) {
        dropzoneText.textContent = "Click or drag & drop here to upload";
        dropzoneText.classList.remove("text-cyan-600", "font-semibold");
      }
      // Reset bio character count
      if (bioCounter) {
        bioCounter.textContent = "0 / 30 chars";
        bioCounter.classList.remove("text-emerald-500");
        bioCounter.classList.add("text-slate-400");
      }
      // Reset success screen
      if (successScreen) {
        successScreen.classList.add("hidden");
        successScreen.classList.remove("flex");
      }
      // Reset submit button state
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Submit Application";
    }, 300);
  }

  // Event Listeners for Open/Close
  openBtn.addEventListener("click", openModal);
  [closeBtn, cancelBtn, successCloseBtn].forEach(btn => {
    if (btn) btn.addEventListener("click", closeModal);
  });

  // Close on Backdrop Click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close on Escape Key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("opacity-100")) {
      closeModal();
    }
  });

  // Helper to show/hide validation errors
  function toggleFieldError(inputEl, isError) {
    const container = inputEl.closest("div");
    if (!container) return;
    const errorSpan = container.querySelector(".error-msg");
    
    if (inputEl.type === "checkbox") {
      if (isError) {
        inputEl.classList.add("border-red-500");
        if (errorSpan) errorSpan.classList.remove("hidden");
      } else {
        inputEl.classList.remove("border-red-500");
        if (errorSpan) errorSpan.classList.add("hidden");
      }
      return;
    }
    
    if (isError) {
      inputEl.classList.remove("border-slate-200", "focus:border-cyan-500", "focus:ring-cyan-100");
      inputEl.classList.add("border-red-500", "focus:border-red-500", "focus:ring-red-100");
      if (errorSpan) errorSpan.classList.remove("hidden");
    } else {
      inputEl.classList.add("border-slate-200", "focus:border-cyan-500", "focus:ring-cyan-100");
      inputEl.classList.remove("border-red-500", "focus:border-red-500", "focus:ring-red-100");
      if (errorSpan) errorSpan.classList.add("hidden");
    }
  }

  // Real-time validations
  function validateName() {
    const val = nameInput.value.trim();
    const isValid = val.length >= 3 && /^[a-zA-Z\s]+$/.test(val);
    toggleFieldError(nameInput, !isValid);
    return isValid;
  }

  function validateEmail() {
    const val = emailInput.value.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    toggleFieldError(emailInput, !isValid);
    return isValid;
  }

  function validatePhone() {
    const val = phoneInput.value.trim();
    const isValid = val.length >= 10 && val.length <= 20 && /^\+?[0-9\s\-()]+$/.test(val);
    toggleFieldError(phoneInput, !isValid);
    return isValid;
  }

  function validateCity() {
    const val = cityInput.value.trim();
    const isValid = val.length >= 2;
    toggleFieldError(cityInput, !isValid);
    return isValid;
  }

  function validateSpecialty() {
    const isValid = specialtySelect.value !== "";
    toggleFieldError(specialtySelect, !isValid);
    return isValid;
  }

  function validateBio() {
    const val = bioTextarea.value.trim();
    const isValid = val.length >= 30;
    toggleFieldError(bioTextarea, !isValid);
    return isValid;
  }

  function validateTerms() {
    const isValid = termsCheckbox.checked;
    toggleFieldError(termsCheckbox, !isValid);
    return isValid;
  }

  // Bind input/change events for real-time validation
  nameInput.addEventListener("input", validateName);
  emailInput.addEventListener("input", validateEmail);
  phoneInput.addEventListener("input", validatePhone);
  cityInput.addEventListener("input", validateCity);
  specialtySelect.addEventListener("change", validateSpecialty);
  
  bioTextarea.addEventListener("input", () => {
    const len = bioTextarea.value.length;
    bioCounter.textContent = `${len} / 30 chars`;
    if (len >= 30) {
      bioCounter.classList.remove("text-slate-400");
      bioCounter.classList.add("text-emerald-500");
    } else {
      bioCounter.classList.remove("text-emerald-500");
      bioCounter.classList.add("text-slate-400");
    }
    validateBio();
  });
  
  termsCheckbox.addEventListener("change", validateTerms);

  // File Upload Handlers
  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());
    
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("border-cyan-500", "bg-cyan-50/50");
    });
    
    ["dragleave", "drop"].forEach(eventName => {
      dropzone.addEventListener(eventName, () => {
        dropzone.classList.remove("border-cyan-500", "bg-cyan-50/50");
      });
    });
    
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        updateFileName(fileInput.files[0]);
      }
    });
    
    fileInput.addEventListener("change", () => {
      if (fileInput.files.length) {
        updateFileName(fileInput.files[0]);
      }
    });
  }

  function updateFileName(file) {
    if (file) {
      dropzoneText.textContent = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
      dropzoneText.classList.add("text-cyan-600", "font-semibold");
    } else {
      dropzoneText.textContent = "Click or drag & drop here to upload";
      dropzoneText.classList.remove("text-cyan-600", "font-semibold");
    }
  }

  // Submit Handler
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Trigger validation on all fields
    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isPhoneValid = validatePhone();
    const isCityValid = validateCity();
    const isSpecialtyValid = validateSpecialty();
    const isBioValid = validateBio();
    const isTermsValid = validateTerms();

    const isFormValid = isNameValid && isEmailValid && isPhoneValid && isCityValid && isSpecialtyValid && isBioValid && isTermsValid;

    if (!isFormValid) {
      // Focus first invalid field
      const invalidFields = [
        { valid: isNameValid, el: nameInput },
        { valid: isEmailValid, el: emailInput },
        { valid: isPhoneValid, el: phoneInput },
        { valid: isCityValid, el: cityInput },
        { valid: isSpecialtyValid, el: specialtySelect },
        { valid: isBioValid, el: bioTextarea },
        { valid: isTermsValid, el: termsCheckbox }
      ];
      
      const firstInvalid = invalidFields.find(f => !f.valid);
      if (firstInvalid && firstInvalid.el) {
        firstInvalid.el.focus();
      }
      return;
    }

    // Submit animation
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Submitting...
    `;

    // Simulate Server Request
    setTimeout(() => {
      // Show Success Overlay
      if (successScreen) {
        successScreen.classList.remove("hidden");
        successScreen.classList.add("flex");
      }
      
      // Auto close after 2.5 seconds
      autoCloseTimer = setTimeout(() => {
        closeModal();
      }, 2500);
    }, 1200);
  });
}

// ── Booking Modal & Validations ──────────────────────────
function initBookingModal() {
  const modal = document.getElementById("booking-modal");
  const card = document.getElementById("booking-card");
  const closeBtn = document.getElementById("close-booking-modal-btn");
  const cancelBtn = document.getElementById("cancel-booking-btn");
  const submitBtn = document.getElementById("submit-booking-btn");
  const form = document.getElementById("booking-form");
  const successScreen = document.getElementById("booking-success-screen");
  const successCloseBtn = document.getElementById("booking-success-close-btn");

  if (!modal || !card || !form) return;

  // Form inputs
  const nameInput = document.getElementById("booking-name");
  const emailInput = document.getElementById("booking-email");
  const phoneInput = document.getElementById("booking-phone");
  const dateInput = document.getElementById("booking-date");
  const guestsInput = document.getElementById("booking-guests");
  const requestsInput = document.getElementById("booking-requests");

  // Dynamic elements
  const destNameSpan = document.getElementById("booking-dest-name");
  const unitPriceSpan = document.getElementById("booking-unit-price");
  const guestsDisplaySpan = document.getElementById("booking-guests-display");
  const totalPriceSpan = document.getElementById("booking-total-price");

  // Success summary elements
  const successIdSpan = document.getElementById("booking-success-id");
  const successDestVal = document.getElementById("success-dest-val");
  const successDateVal = document.getElementById("success-date-val");
  const successGuestsVal = document.getElementById("success-guests-val");
  const successPriceVal = document.getElementById("success-price-val");

  let bookingUnitPrice = 0;
  let activeDestTitle = "";
  let autoCloseTimer = null;

  // Open modal
  function openModal(destTitle, destPrice) {
    activeDestTitle = destTitle;
    
    // Parse package base price
    const parsedPrice = parseFloat(destPrice.replace(/[^0-9.]/g, "")) || 0;
    bookingUnitPrice = parsedPrice;

    // Set destination text
    if (destNameSpan) destNameSpan.textContent = destTitle;
    if (unitPriceSpan) unitPriceSpan.textContent = destPrice;

    // Set date input limit to today or future
    if (dateInput) {
      const todayStr = new Date().toISOString().split("T")[0];
      dateInput.setAttribute("min", todayStr);
    }

    // Reset default values
    if (guestsInput) guestsInput.value = "1";
    updateCalculatedPrice();

    modal.classList.remove("opacity-0", "pointer-events-none");
    modal.classList.add("opacity-100");
    card.classList.remove("scale-95", "opacity-0");
    card.classList.add("scale-100", "opacity-100");
    document.body.classList.add("overflow-hidden");
  }

  // Close modal
  function closeModal() {
    modal.classList.add("opacity-0", "pointer-events-none");
    modal.classList.remove("opacity-100");
    card.classList.add("scale-95", "opacity-0");
    card.classList.remove("scale-100", "opacity-100");
    document.body.classList.remove("overflow-hidden");

    if (autoCloseTimer) clearTimeout(autoCloseTimer);

    setTimeout(() => {
      form.reset();
      const fields = [nameInput, emailInput, phoneInput, dateInput, guestsInput];
      fields.forEach(field => toggleFieldError(field, false));

      if (successScreen) {
        successScreen.classList.add("hidden");
        successScreen.classList.remove("flex");
      }
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Confirm Booking";
    }, 300);
  }

  // Event Delegation for Book Now buttons
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".book-now-btn");
    if (btn) {
      const title = btn.getAttribute("data-title") || "Adventure Tour";
      const price = btn.getAttribute("data-price") || "$0";
      openModal(title, price);
    }
  });

  [closeBtn, cancelBtn, successCloseBtn].forEach(btn => {
    if (btn) btn.addEventListener("click", closeModal);
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("opacity-100")) {
      closeModal();
    }
  });

  // Price calculator
  function updateCalculatedPrice() {
    if (!guestsInput || !totalPriceSpan || !guestsDisplaySpan) return;
    let guests = parseInt(guestsInput.value) || 1;
    if (guests < 1) guests = 1;
    if (guests > 10) guests = 10;
    
    guestsDisplaySpan.textContent = guests;
    const total = bookingUnitPrice * guests;
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(total);
    
    totalPriceSpan.textContent = formatted;
  }

  if (guestsInput) {
    guestsInput.addEventListener("input", updateCalculatedPrice);
    guestsInput.addEventListener("change", updateCalculatedPrice);
  }

  // Helper to show/hide validation errors
  function toggleFieldError(inputEl, isError) {
    const container = inputEl.closest("div");
    if (!container) return;
    const errorSpan = container.querySelector(".error-msg");
    
    if (isError) {
      inputEl.classList.remove("border-slate-200", "focus:border-cyan-500", "focus:ring-cyan-100");
      inputEl.classList.add("border-red-500", "focus:border-red-500", "focus:ring-red-100");
      if (errorSpan) errorSpan.classList.remove("hidden");
    } else {
      inputEl.classList.add("border-slate-200", "focus:border-cyan-500", "focus:ring-cyan-100");
      inputEl.classList.remove("border-red-500", "focus:border-red-500", "focus:ring-red-100");
      if (errorSpan) errorSpan.classList.add("hidden");
    }
  }

  // Validation functions
  function validateName() {
    const val = nameInput.value.trim();
    const isValid = val.length >= 3 && /^[a-zA-Z\s]+$/.test(val);
    toggleFieldError(nameInput, !isValid);
    return isValid;
  }

  function validateEmail() {
    const val = emailInput.value.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    toggleFieldError(emailInput, !isValid);
    return isValid;
  }

  function validatePhone() {
    const val = phoneInput.value.trim();
    const isValid = val.length >= 10 && val.length <= 20 && /^\+?[0-9\s\-()]+$/.test(val);
    toggleFieldError(phoneInput, !isValid);
    return isValid;
  }

  function validateDate() {
    const val = dateInput.value;
    if (!val) {
      toggleFieldError(dateInput, true);
      return false;
    }
    const selectedDate = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isValid = selectedDate >= today;
    toggleFieldError(dateInput, !isValid);
    return isValid;
  }

  function validateGuests() {
    const val = parseInt(guestsInput.value);
    const isValid = !isNaN(val) && val >= 1 && val <= 10;
    toggleFieldError(guestsInput, !isValid);
    return isValid;
  }

  // Real-time validations
  nameInput.addEventListener("input", validateName);
  emailInput.addEventListener("input", validateEmail);
  phoneInput.addEventListener("input", validatePhone);
  dateInput.addEventListener("change", validateDate);
  guestsInput.addEventListener("input", validateGuests);

  // Submit handler
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isPhoneValid = validatePhone();
    const isDateValid = validateDate();
    const isGuestsValid = validateGuests();

    const isFormValid = isNameValid && isEmailValid && isPhoneValid && isDateValid && isGuestsValid;

    if (!isFormValid) {
      const invalidFields = [
        { valid: isNameValid, el: nameInput },
        { valid: isEmailValid, el: emailInput },
        { valid: isPhoneValid, el: phoneInput },
        { valid: isDateValid, el: dateInput },
        { valid: isGuestsValid, el: guestsInput }
      ];
      const firstInvalid = invalidFields.find(f => !f.valid);
      if (firstInvalid && firstInvalid.el) firstInvalid.el.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Processing...
    `;

    setTimeout(() => {
      // Mock Success details
      const mockBookingId = `TRV-${Math.floor(100000 + Math.random() * 900000)}`;
      if (successIdSpan) successIdSpan.textContent = mockBookingId;
      if (successDestVal) successDestVal.textContent = activeDestTitle;
      if (successDateVal) successDateVal.textContent = dateInput.value;
      if (successGuestsVal) successGuestsVal.textContent = guestsInput.value;
      if (successPriceVal) successPriceVal.textContent = totalPriceSpan.textContent;

      if (successScreen) {
        successScreen.classList.remove("hidden");
        successScreen.classList.add("flex");
      }

      autoCloseTimer = setTimeout(() => {
        closeModal();
      }, 2500);
    }, 1200);
  });
}

// ── Theme Toggler ────────────────────────────────────────
function initThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle-btn");
  const sunIcon = document.getElementById("theme-sun-icon");
  const moonIcon = document.getElementById("theme-moon-icon");
  if (!toggleBtn) return;

  function setDarkMode(isDark) {
    if (isDark) {
      document.documentElement.classList.add("dark");
      sunIcon?.classList.add("hidden");
      moonIcon?.classList.remove("hidden");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      sunIcon?.classList.remove("hidden");
      moonIcon?.classList.add("hidden");
      localStorage.setItem("theme", "light");
    }
  }

  // Load initial theme state
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
  setDarkMode(initialDark);

  toggleBtn.addEventListener("click", () => {
    const isCurrentlyDark = document.documentElement.classList.contains("dark");
    setDarkMode(!isCurrentlyDark);
  });
}

// ── App Init ─────────────────────────────────────────────
function initApp() {
  initThemeToggle();
  initNavDropdowns();
  initFilters();
  initActivityScroller();
  initNewsletter();
  loadCardData();
  initActivitiesSection();
  renderGallery();
  initBecomeExpertModal();
  initBookingModal();
}

window.addEventListener("DOMContentLoaded", initApp);