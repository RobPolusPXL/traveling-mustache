// Pad-inhoud van de svg-pictogrammen.
export const FACT_ICONS = {
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  talk: '<path d="M4 5h16v10H10l-4 4v-4H4z"/><path d="M8 9h8M8 12h5"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M15 9.2a3.4 3.4 0 0 0-3-1.2c-1.7 0-3 1.1-3 2.4 0 3.2 6.2 1.6 6.2 4.6 0 1.3-1.4 2.2-3.2 2.2a3.8 3.8 0 0 1-3.2-1.4M12 6v2m0 8v2"/>',
  plane: '<path d="M3 14l18-9-4 15-5-5-3 3-1-5-5-1z"/><path d="M11 13l10-8"/>',
  ship: '<path d="M3 15h18l-2.500 4.500h-13z"/><path d="M6.500 15V9.500h11V15M9.500 9.500V6h5v3.500"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
};

// complete svg's voor de links bij een tekstblok (Instagram, Google Maps)
export const LINK_ICONS = {
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="igg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".35" stop-color="#fa7e1e"/><stop offset=".6" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect width="24" height="24" rx="6.5" fill="url(#igg)"/><rect x="5.2" y="5.2" width="13.6" height="13.6" rx="4.2" fill="none" stroke="#fff" stroke-width="1.7"/><circle cx="12" cy="12" r="3.2" fill="none" stroke="#fff" stroke-width="1.7"/><circle cx="16.3" cy="7.7" r="1" fill="#fff"/></svg>',
  maps: '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><clipPath id="gmc"><path d="M12 1.2a7.6 7.6 0 0 0-7.6 7.6c0 5.6 7.6 14 7.6 14s7.6-8.4 7.6-14A7.6 7.6 0 0 0 12 1.2z"/></clipPath></defs><g clip-path="url(#gmc)"><rect x="0" y="0" width="12" height="9" fill="#4285f4"/><rect x="12" y="0" width="12" height="9" fill="#ea4335"/><rect x="0" y="9" width="12" height="16" fill="#34a853"/><rect x="12" y="9" width="12" height="16" fill="#fbbc04"/></g><circle cx="12" cy="8.8" r="3" fill="#fff"/></svg>',
};
