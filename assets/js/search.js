(function SearchComponent() {

  // ── DOM References ───────────────────────────────────────
  const form          = document.getElementById('hero-search-form');
  const locationSel   = document.getElementById('search-location');
  const checkInInp    = document.getElementById('search-checkin');
  const checkOutInp   = document.getElementById('search-checkout');
  const submitBtn     = form ? form.querySelector('button[type="submit"]') : null;
  const discoverSec   = document.getElementById('discover');
  const destinGrid    = document.getElementById('destinations');

  if (!form) return; // guard: exit if form not found

  // ── Set Default Dates ────────────────────────────────────
  function setDefaultDates() {
    const today    = new Date();
    const checkout = new Date();
    checkout.setDate(today.getDate() + 7);

    checkInInp.value  = formatDate(today);
    checkOutInp.value = formatDate(checkout);
    checkInInp.min    = formatDate(today);
    checkOutInp.min   = formatDate(today);
  }

  // ── Bind Events ──────────────────────────────────────────
  function bindEvents() {
    // Prevent default form submit (stops the ?-route issue)
    form.addEventListener('submit', handleSearch);

    // Keep checkout min date in sync
    checkInInp.addEventListener('change', () => {
      checkOutInp.min = checkInInp.value;
      if (checkOutInp.value && checkOutInp.value <= checkInInp.value) {
        const next = new Date(checkInInp.value);
        next.setDate(next.getDate() + 1);
        checkOutInp.value = formatDate(next);
      }
    });
  }

  // ── Handle Submit ────────────────────────────────────────
  function handleSearch(e) {
    e.preventDefault(); // ← THIS stops the ?-route navigation

    clearErrors();

    const checkIn  = checkInInp.value;
    const checkOut = checkOutInp.value;
    let hasError   = false;

    // Validate check-in
    if (!checkIn) {
      showError(checkInInp, 'Please select a check-in date');
      hasError = true;
    }

    // Validate check-out
    if (!checkOut) {
      showError(checkOutInp, 'Please select a check-out date');
      hasError = true;
    }

    // Validate date order
    if (checkIn && checkOut && checkOut <= checkIn) {
      showError(checkOutInp, 'Check-out must be after check-in');
      hasError = true;
    }

    if (hasError) return;

    // Run the search
    runSearch();
  }

  // ── Run Search ───────────────────────────────────────────
  // ── Run Search ───────────────────────────────────────────
function runSearch() {
  const locationVal = locationSel.value.toLowerCase().trim(); // e.g. "hawaii, usa"
  const checkIn     = checkInInp.value;
  const checkOut    = checkOutInp.value;
  const nights      = calcNights(checkIn, checkOut);
  const guests      = document.getElementById('search-guests')?.value || '';

  setLoading(true);

  setTimeout(() => {
    setLoading(false);

    const cards = Array.from(destinGrid.querySelectorAll('article'));
    let matchCount = 0;

    cards.forEach(card => {
      const cardLocation = (card.dataset.location || '').toLowerCase().trim();
      const cardTitle    = (card.dataset.title || '').toLowerCase().trim();
      const cardTag      = (card.dataset.tag || '').toLowerCase().trim();

      // If no location selected → show all
      // Otherwise → check if card location contains selected value OR vice versa
      const matches =
        locationVal === '' ||
        cardLocation === locationVal ||
        cardLocation.includes(locationVal) ||
        locationVal.includes(cardLocation);

      card.classList.toggle('hidden', !matches);
      if (matches) matchCount++;
    });

    showBanner({ locationVal, checkIn, checkOut, nights, guests, matchCount });

    if (matchCount === 0) showEmptyState();
    else removeEmptyState();

    discoverSec?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  }, 600);
}

  // ── Results Banner ───────────────────────────────────────
  function showBanner({ locationVal, checkIn, checkOut, nights, guests, matchCount }) {
    removeBanner();

    const label = locationVal
      ? locationSel.options[locationSel.selectedIndex].text.replace('📍 ', '')
      : 'All Locations';

    const banner = document.createElement('div');
    banner.id = 'searchBanner';
    banner.className = 'mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-blue-50 border border-blue-100 px-5 py-4';
    banner.innerHTML = `
      <div class="flex flex-wrap items-center gap-2 text-sm text-slate-700">
        <span class="font-semibold text-blue-600 text-base">🔍 Results</span>
        <span class="rounded-full bg-blue-600 text-white text-xs font-bold px-3 py-1">${matchCount} found</span>
        <span class="text-slate-400">·</span>
        <span>📍 ${label}</span>
        <span class="text-slate-400">·</span>
        <span>📅 ${formatDisplay(checkIn)} → ${formatDisplay(checkOut)}</span>
        <span class="text-slate-400">·</span>
        <span>🌙 ${nights} night${nights !== 1 ? 's' : ''}</span>
        <span class="text-slate-400">·</span>
        <span>👥 ${guests}</span>
      </div>
      <button id="clearSearchBtn" class="text-xs font-semibold text-blue-600 hover:text-blue-800 transition">
        ✕ Clear
      </button>
    `;

    destinGrid.before(banner);
    document.getElementById('clearSearchBtn').addEventListener('click', clearSearch);
  }

  // ── Empty State ──────────────────────────────────────────
  function showEmptyState() {
    removeEmptyState();
    const empty = document.createElement('div');
    empty.id = 'searchEmpty';
    empty.className = 'col-span-full flex flex-col items-center justify-center py-16 text-center';
    empty.innerHTML = `
      <div class="text-5xl mb-4">🗺️</div>
      <p class="text-lg font-semibold text-slate-700">No destinations found</p>
      <p class="text-sm text-slate-500 mt-1">Try a different location or adjust your dates.</p>
      <button id="emptyResetBtn"
        class="mt-5 rounded-full bg-black text-white text-sm font-semibold px-6 py-2.5 hover:bg-slate-800 transition">
        View All
      </button>
    `;
    destinGrid.appendChild(empty);
    document.getElementById('emptyResetBtn').addEventListener('click', clearSearch);
  }

  function removeEmptyState() {
    document.getElementById('searchEmpty')?.remove();
  }

  // ── Clear Search ─────────────────────────────────────────
  function clearSearch() {
    Array.from(destinGrid.querySelectorAll('article'))
      .forEach(card => card.classList.remove('hidden'));
    removeBanner();
    removeEmptyState();
    setDefaultDates();
    locationSel.selectedIndex = 0;
  }

  function removeBanner() {
    document.getElementById('searchBanner')?.remove();
  }

  // ── Validation Helpers ───────────────────────────────────
  function showError(input, msg) {
    input.classList.add('border-red-400', 'ring-1', 'ring-red-400');
    const err = document.createElement('p');
    err.className = 'search-field-error text-xs text-red-500 mt-1';
    err.textContent = msg;
    input.parentElement.appendChild(err);
  }

  function clearErrors() {
    document.querySelectorAll('.search-field-error').forEach(e => e.remove());
    [checkInInp, checkOutInp].forEach(el => {
      el.classList.remove('border-red-400', 'ring-1', 'ring-red-400');
    });
  }

  // ── Loading State ────────────────────────────────────────
  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.innerHTML = loading
      ? `<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
           <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
           <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
         </svg> Searching...`
      : '🔍 Search';
    submitBtn.classList.toggle('opacity-70', loading);
  }

  // ── Utils ────────────────────────────────────────────────
  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  function formatDisplay(str) {
    return new Date(str).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  function calcNights(checkIn, checkOut) {
    return Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    setDefaultDates();
    bindEvents();
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();