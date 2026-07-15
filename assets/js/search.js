(function SearchComponent() {

  // ── DOM References ───────────────────────────────────────
  const form        = document.getElementById('hero-search-form');
  const discoverSec = document.getElementById('discover');
  const destinGrid  = document.getElementById('destinations');

  if (!form) return; // guard: exit if form not found

  let activeTab = 'tours';

  // ── Helper to get active tab elements ───────────────────
  function getActiveTabElements() {
    const gridId = `grid-${activeTab}`;
    const grid = document.getElementById(gridId);
    if (!grid) return {};

    const locationSel = grid.querySelector('select[id*="-location"]') || document.getElementById('search-location');
    const checkInInp  = grid.querySelector('input[id*="-checkin"]') || document.getElementById('search-checkin');
    const checkOutInp = grid.querySelector('input[id*="-checkout"]');
    const guestsSel   = grid.querySelector('select[id*="-guests"]') || grid.querySelector('select[id*="-category"]');
    const submitBtn   = grid.querySelector('button[type="submit"]');

    return { grid, locationSel, checkInInp, checkOutInp, guestsSel, submitBtn };
  }

  // ── Set Default Dates ────────────────────────────────────
  function setDefaultDates() {
    const today    = new Date();
    const checkout = new Date();
    checkout.setDate(today.getDate() + 7);

    const todayStr    = formatDate(today);
    const checkoutStr = formatDate(checkout);

    // Set for all date inputs in the form
    form.querySelectorAll('input[type="date"]').forEach(inp => {
      inp.value = todayStr;
      inp.min   = todayStr;

      // If it's a checkout date, set it to 7 days later
      if (inp.id.includes('checkout')) {
        inp.value = checkoutStr;
      }
    });
  }

  // ── Bind Events ──────────────────────────────────────────
  function bindEvents() {
    form.addEventListener('submit', handleSearch);

    // Sync checkout min date dynamically for check-in/check-out pairs
    const tabs = ['tours', 'hotels', 'tickets', 'rental'];
    tabs.forEach(tab => {
      const checkIn  = document.getElementById(tab === 'tours' ? 'search-checkin' : `search-${tab}-checkin`);
      const checkOut = document.getElementById(tab === 'tours' ? 'search-checkout' : `search-${tab}-checkout`);
      if (checkIn && checkOut) {
        checkIn.addEventListener('change', () => {
          checkOut.min = checkIn.value;
          if (checkOut.value && checkOut.value <= checkIn.value) {
            const next = new Date(checkIn.value);
            next.setDate(next.getDate() + 1);
            checkOut.value = formatDate(next);
          }
        });
      }
    });

    // Bind tab headers click
    const tabHeaders = document.getElementById('search-tab-headers');
    if (tabHeaders) {
      tabHeaders.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        const tab = btn.dataset.tab;
        if (tab) switchTab(tab);
      });
    }
  }

  // ── Switch Tabs ──────────────────────────────────────────
  function switchTab(tab) {
    activeTab = tab;

    // Toggle tab header active styles
    const tabHeaders = document.getElementById('search-tab-headers');
    if (tabHeaders) {
      tabHeaders.querySelectorAll('.tab-btn').forEach(btn => {
        const isActive = btn.dataset.tab === tab;
        btn.classList.toggle('rounded-full', isActive);
        btn.classList.toggle('bg-black', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('px-6', isActive);
        btn.classList.toggle('py-2', isActive);

        btn.classList.toggle('px-4', !isActive);
        btn.classList.toggle('text-slate-700', !isActive);
        btn.classList.toggle('bg-transparent', !isActive);
      });
    }

    // Toggle form grids visibility
    form.querySelectorAll('.tab-grid').forEach(grid => {
      const isGridActive = grid.id === `grid-${tab}`;
      grid.classList.toggle('hidden', !isGridActive);
    });

    clearErrors();
  }

  // ── Handle Submit ────────────────────────────────────────
  function handleSearch(e) {
    e.preventDefault();
    clearErrors();

    const { checkInInp, checkOutInp } = getActiveTabElements();
    let hasError = false;

    // Validate check-in
    if (checkInInp && !checkInInp.value) {
      showError(checkInInp, 'Please select a date');
      hasError = true;
    }

    // Validate check-out (if present)
    if (checkOutInp && !checkOutInp.value) {
      showError(checkOutInp, 'Please select a date');
      hasError = true;
    }

    // Validate date order
    if (checkInInp && checkOutInp && checkInInp.value && checkOutInp.value && checkOutInp.value <= checkInInp.value) {
      showError(checkOutInp, 'Must be after start date');
      hasError = true;
    }

    if (hasError) return;

    runSearch();
  }

  // ── Run Search ───────────────────────────────────────────
  function runSearch() {
    const { locationSel, checkInInp, checkOutInp, guestsSel, submitBtn } = getActiveTabElements();
    if (!locationSel) return;

    const locationVal = locationSel.value.toLowerCase().trim();
    const checkIn     = checkInInp ? checkInInp.value : '';
    const checkOut    = checkOutInp ? checkOutInp.value : '';
    const nights      = (checkIn && checkOut) ? calcNights(checkIn, checkOut) : 0;
    const guests      = guestsSel ? guestsSel.value : '';

    setLoading(true, submitBtn);

    setTimeout(() => {
      setLoading(false, submitBtn);

      const cards = Array.from(destinGrid.querySelectorAll('article'));
      let matchCount = 0;

      cards.forEach(card => {
        const cardLocation = (card.dataset.location || '').toLowerCase().trim();
        const cardTitle    = (card.dataset.title || '').toLowerCase().trim();
        const cardTag      = (card.dataset.tag || '').toLowerCase().trim();

        // Match tags or locations
        const matches =
          locationVal === '' ||
          cardLocation === locationVal ||
          cardLocation.includes(locationVal) ||
          locationVal.includes(cardLocation);

        card.classList.toggle('hidden', !matches);
        if (matches) matchCount++;
      });

      showBanner({ locationVal, locationSel, checkIn, checkOut, nights, guests, matchCount });

      if (matchCount === 0) showEmptyState();
      else removeEmptyState();

      discoverSec?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    }, 600);
  }

  // ── Results Banner ───────────────────────────────────────
  function showBanner({ locationVal, locationSel, checkIn, checkOut, nights, guests, matchCount }) {
    removeBanner();

    const label = locationVal
      ? locationSel.options[locationSel.selectedIndex].text.replace(/^[📍🏨🛫🛬🚗🎟️]\s*/, '')
      : 'All Locations';

    const tabName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    const dateStr = checkOut
      ? `📅 ${formatDisplay(checkIn)} → ${formatDisplay(checkOut)}`
      : (checkIn ? `📅 ${formatDisplay(checkIn)}` : '');

    const durationStr = nights > 0
      ? `<span class="text-slate-400">·</span> 🌙 ${nights} night${nights !== 1 ? 's' : ''}`
      : '';

    const guestsStr = guests
      ? `<span class="text-slate-400">·</span> 👥 ${guests}`
      : '';

    const banner = document.createElement('div');
    banner.id = 'searchBanner';
    banner.className = 'mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-blue-50 border border-blue-100 px-5 py-4';
    banner.innerHTML = `
      <div class="flex flex-wrap items-center gap-2 text-sm text-slate-700">
        <span class="font-semibold text-blue-600 text-base">🔍 ${tabName} Results</span>
        <span class="rounded-full bg-blue-600 text-white text-xs font-bold px-3 py-1">${matchCount} found</span>
        <span class="text-slate-400 flex items-center justify-center">·</span>
        <span>📍 ${label}</span>
        ${dateStr ? `<span class="text-slate-400">·</span> <span>${dateStr}</span>` : ''}
        ${durationStr}
        ${guestsStr}
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
      <p class="text-lg font-semibold text-slate-700">No results found</p>
      <button id="emptyResetBtn"
        class="mt-5 rounded-full bg-black text-white text-sm font-semibold px-6 py-2.5 hover:bg-slate-800 transition">
        View All
      </button>
    `;
    destinGrid.appendChild(empty);
    document.getElementById('emptyResetBtn').addEventListener('click', clearSearch);
  }

  // ── Clear Search ─────────────────────────────────────────
  function clearSearch() {
    Array.from(destinGrid.querySelectorAll('article'))
      .forEach(card => card.classList.remove('hidden'));
    removeBanner();
    removeEmptyState();
    setDefaultDates();

    // Reset location select in all tabs
    form.querySelectorAll('select').forEach(sel => {
      sel.selectedIndex = 0;
    });
  }

  function removeEmptyState() {
    document.getElementById('searchEmpty')?.remove();
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
    form.querySelectorAll('input[type="date"], select').forEach(el => {
      el.classList.remove('border-red-400', 'ring-1', 'ring-red-400');
    });
  }

  // ── Loading State ────────────────────────────────────────
  function setLoading(loading, btn) {
    if (!btn) return;
    btn.disabled = loading;

    const originalText = activeTab === 'tours' ? 'Search' :
                         activeTab === 'hotels' ? 'Search Hotels' :
                         activeTab === 'tickets' ? 'Find Flights' :
                         activeTab === 'rental' ? 'Find Cars' : 'Find Activities';

    btn.innerHTML = loading
      ? `<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
           <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
           <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
         </svg> Searching...`
      : `🔍 ${originalText}`;
    btn.classList.toggle('opacity-70', loading);
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