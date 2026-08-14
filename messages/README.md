# Localization & Internationalization (i18n) Dictionaries

This directory contains the translation dictionaries loaded by `next-intl` (`i18n/request.ts`).
Each file follows standard two-letter **ISO 639-1** language codes:

| File Code | Language | Native Name | Region / Context |
| :--- | :--- | :--- | :--- |
| **`en.json`** | **English** | English | Global default language |
| **`es.json`** | **Spanish** | Español | Latin America, Spain, International |
| **`fr.json`** | **French** | Français | Francophone Africa, France, International |
| **`yo.json`** | **Yorùbá** | Èdè Yorùbá | West Africa (Southwestern Nigeria, Benin, Togo) |
| **`ig.json`** | **Igbo** | Asụsụ Igbo | West Africa (Southeastern Nigeria) |
| **`ha.json`** | **Hausa** | Harshen Hausa | West/Central Africa (Northern Nigeria, Niger, Ghana) |

---

## Architecture & Loading Rules

1. **Active Locale Resolution**:
   - The user's active language preference is persisted in the `NEXT_LOCALE` cookie.
   - Handled server-side by `app/actions/i18n.ts` (`setUserLocaleAction`).
   - Hydrated per-request in `i18n/request.ts` via `getRequestConfig`.

2. **Translation Key Namespaces**:
   - `Dashboard`: Core metrics, live orders, kitchen ticket states.
   - `Navigation`: Sidebar links and global navigation.
   - `Hardware`: Raw thermal ESC/POS printer pairing and protocol configuration.
   - `Guest`: Storefront customer UI, cart, dietary badges, checkout.
   - `Settings`: Venue details, operating hours, staff shifts, tax rules.
