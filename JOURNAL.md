### Project Journal

Reset completed. Minimal master dataset confirmed with payment_status removed per request.

Current master headers:

```
event_code,badge_uid,full_name,email,category,meal_entitled(yes/no),kit_entitled(yes/no),institution,phone,badge_print_template,notes
```

Next: lock Category list and badge_print_template code, then proceed to Phase 1 (scan → local lookup).

## Phase 1 requirements (confirmed)
- Auto-scan hands-free: Presentation-mode scanner on a stand. On a valid read, show attendee preview and expose a big Print button. Prevent double-prints with a 1–2s duplicate guard.
- Manual code box: A visible text box where staff can type/paste a known `badge_uid` (e.g., MED0023) and get the same preview + Print flow.
- New registration: Compact form to capture minimal fields (name, email, badge_uid, category, institution, phone) with checkboxes for Meal and Kit. On submit: add to local index, download a `new-registrations-<timestamp>.csv` line for merge, and allow instant print.
- Printing (Phase 1): Basic browser print for A6 preview; Phase 2 will switch to QZ Tray and ZPL for sub-second device printing.
- Always-ready focus: Input stays focused for continuous scanning/typing without mouse clicks.

## Phase 2 — Printing integration (in progress)
- Added QZ Tray scaffolding: `printer/qz-setup.html` for connect/list/test; `printer/zpl-templates.js` for A6 ZPL output.
- On the main page, the Print button attempts QZ raw ZPL first; if not connected, it falls back to browser print preview.
- Next: expose printer selection (remember choice), and add duplicate-scan guard before we enable auto-print.

### Project Journal

This document tracks the clean‑slate rebuild of the medical conference registration and check‑in system.

---

## 2025-08-09 — Reset to zero
- Emptied the repository to start fresh. No prior code, assets, or configurations remain.
- Goal: Design a minimal, surgically precise data backbone and build the system iteratively, one world‑class phase at a time.

## Minimal Master Dataset (single source of truth)
- Constraint: Must stay compact and human‑operable; only absolutely necessary fields that operational teams actually know at registration time.
- Purpose: Power check‑in, badge printing, kit eligibility, and meal entitlements with zero ambiguity.

CSV headers (authoritative order):

```
event_code,badge_uid,full_name,email,category,meal_entitled(yes/no),kit_entitled(yes/no),institution,phone,payment_status(paid/comp/unpaid),badge_print_template,notes
```

Field rationale:
- event_code: Disambiguates multi‑event datasets and prevents cross‑mix.
- badge_uid: The ONLY identifier encoded in the QR; short, unique, human readable.
- full_name: Printed prominently on the badge; used verbally by staff.
- email: Primary contact/lookup if manual reconciliation is required.
- category: Drives badge color and access logic (e.g., Delegate, Speaker, Exhibitor).
- meal_entitled: High‑level flag for whether meals are included (complimentary or purchased); detailed splits can live in a separate entitlements sheet if needed.
- kit_entitled: Eligibility to receive the delegate kit.
- institution: Printed secondary line on badge; useful for networking.
- phone: Secondary contact for onsite resolution.
- payment_status: Lightweight operational view (paid/comp/unpaid) that influences entitlement activation.
- badge_print_template: Version pin for A6 print layout.
- notes: Short operational note (e.g., dietary exception, accessibility).

Deliberately excluded (for minimality): DOB, address, detailed meal by day, workshop lists, multiple consents, multi‑hall counters. These will be tracked in append‑only logs and/or derived entitlements later without polluting the master.

## Next steps (iteration 1 scope)
1) Validate master CSV schema and generate an example file.
2) Build Phase 1: Scan → Local lookup (sub‑100 ms) with hardware scanner input, no printing yet.
3) Define A6 badge ZPL template keyed by `badge_print_template`.
4) Add print step: auto‑print on successful scan, log print event.

Each subsequent phase (Kits, Meals, Halls) will extend via separate append‑only logs and minimal additional config sheets, keeping the master sheet clean.


