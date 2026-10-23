# Nandini Dental Care — Feature Log

Living record of every feature planned or built, its status, and known gaps.
Update this file whenever a feature is added, changed, or a gap is found.

**Last updated:** 2026-09-16
**Status key:** ✅ Done · 🟡 Partial · ⬜ Planned · ⏸️ Deferred (needs decision / legal review)

---

## 1. Product summary

A clinic web app used chairside on an iPad and shared with patients by link.

- **Staff side:** explain treatments in 3D, record a consult, attach X-rays and photos, and send the patient a personal case link.
- **Patient side:** a mobile page (`/c/:token`) showing their problem, attachments, treatment stages, option comparison, costs, and FAQs.

**Current mode:** local only. A Node server with SQLite runs on the clinic computer, and patients open links over the clinic Wi-Fi. There is no cloud deployment yet.

### Run locally

```bash
npm install
STAFF_PIN=5678 npm run dev:all    # API on :8787, app on :5173 (LAN-visible)
```

- Staff app: `http://localhost:5173` → passcode.
- Data lives in `data/clinic.db` and uploaded files in `data/uploads/`. `data/` is gitignored and must be backed up manually.

---

## 2. Feature status

### 2.1 Treatment explainer (original prototype)

| Feature | Status | Notes / gaps |
|---|---|---|
| Treatment library (Implants, Aligners & Braces, Root Canal) | ✅ | Only 3 treatments. |
| Options per treatment (3 each) with pros/cons/specs | ✅ | See clinical gap G-C2 (options that aren't true alternatives). |
| Compare up to 3 options side by side | ✅ | Staff compare uses 2D SVG cutaways. |
| 3D option detail: stage slider, "look inside" peel slider, rotate/zoom | ✅ | GLB models from `blender/` scripts. |
| Patient view toggle (`?patient=1`) | ✅ | Presentation mode only, **not** a privacy boundary. |
| Price overrides in Settings | 🟡 | Stored in the iPad browser's localStorage, not the server. "Default price" label shows even when overridden. |

### 2.2 Consult & case management (staff)

| Feature | Status | Notes / gaps |
|---|---|---|
| Cases board `/cases` with filters (follow-up due, considering, link sent, accepted, drafts) and search | ✅ | No pagination; fine for local volume. |
| Board shows link opens and patient requests (book / interested / callback) | ✅ | |
| New consult `/consult/new`: patient, complaint chips, findings, tooth (FDI text), urgency | ✅ | Tooth is free text; no interactive tooth chart yet (see 2.6). |
| Mark each option suitable / not suitable with reason, per-patient price, doctor note | ✅ | |
| Outcome status + follow-up date | ✅ | No reminders fire yet (see 2.5). |
| Attach X-rays, photos, PDFs (JPG/PNG/WEBP/HEIC/PDF, 15 MB max) | ✅ | No annotation / drawing on images. HEIC may not preview in all browsers. |
| Delete case (removes attachments and links) | ✅ | Hard delete; no audit trail or undo. |
| "Explain in 3D" shortcut from case to treatment | ✅ | Does not carry patient context into the explainer. |
| Quick-explain mode (no patient data) | 🟡 | Possible by using `/treatments` directly; no dedicated fast flow. |

### 2.3 Patient Case Link

| Feature | Status | Notes / gaps |
|---|---|---|
| Create link with expiry (7–90 days), copy, preview, revoke | ✅ | |
| Send via WhatsApp (`wa.me` prefilled message) | ✅ | Manual send from staff device; assumes Indian +91 numbers. |
| LAN-address link so phones on clinic Wi-Fi can open it | ✅ | Link only works on clinic network until deployed. |
| Unlock with last 4 phone digits | ✅ | Weak factor (see G-S3). No OTP. |
| **Your problem:** urgency, complaint, tooth, finding, doctor's note | ✅ | |
| **X-rays & documents** gallery | ✅ | Opens in new tab; no zoom/lightbox. |
| **If untreated:** possible progression + warning signs | ✅ | Text timeline only; no 3D progression. |
| **How treatment works:** option tabs, 3D viewer, stage slider + step list | ✅ | Falls back to steps when phone lacks WebGL. No pre-rendered video fallback. |
| **Compare options:** price, difference vs lowest, longevity range, visits, time, comfort, appearance, upkeep, if it fails, pros/cons, "also plan for" | ✅ | "Lowest cost" / "Longest lasting" tags are factual, not recommendations. |
| Single-option "at a glance" card | ✅ | |
| Options not suitable, with reason | ✅ | |
| Aftercare list | ✅ | |
| FAQs: search + "Listen" (browser text-to-speech) | ✅ | English only; TTS voice quality varies by phone. |
| Next step buttons: Book / I'm interested / Call me back → staff board | ✅ | No actual booking; staff must call. |
| Disclaimer (not a final quote or guarantee) | ✅ | Wording not legally reviewed. |
| Aligner tooth-movement simulation | 🟡 | Existing braces stages show crooked → aligned. No per-tooth animated morph; no import of a lab's patient-specific plan. |
| Share with family (separate revocable link) | ⬜ | Currently patient forwards the same link. |
| Estimate / quote PDF download | ⬜ | Can be attached manually as a PDF. |

### 2.4 Content

| Feature | Status | Notes / gaps |
|---|---|---|
| Treatment guides: problem, if untreated, warning signs, aftercare, FAQs (`src/data/guides.ts`) | ✅ | **Draft copy: must be reviewed by the clinic's dentists before real patient use.** |
| Option facts: longevity ranges, visits, duration, comfort, appearance, upkeep, if it fails, considerations, FAQs | ✅ | Same review needed. No sources/citations recorded. |
| Price as line items (procedure, crown, X-ray, medicines, exclusions) | ⬜ | Single price per option today. |
| More treatments: crowns, bridges, veneers, whitening, extraction, wisdom tooth, scaling, dentures, kids | ⬜ | Geometry types for crown/veneer/bridge already exist in `toothGeometries.tsx`. |
| Admin content editor with draft → review → publish | ⬜ | Content is in code today. |
| Languages (Hindi, Telugu, Kannada, Tamil) | ⬜ | Language is saved per patient but all content is English. |

### 2.5 Conversion & follow-up

| Feature | Status | Notes / gaps |
|---|---|---|
| Patient activity log (opened, unlocked, wrong digits, requests) | ✅ | Opens deduplicated to once per 30 min. |
| Follow-up reminders (WhatsApp) for undecided cases | ⬜ | Needs WhatsApp Business API + scheduler. |
| Recall reminders (cleaning, post-op, aligner checks, implant maintenance) | ⬜ | |
| Appointment booking (slots) | ⬜ | |
| Advance payment / UPI QR, receipts | ⬜ | |
| EMI / finance calculator | ⬜ | |
| Procedure-specific consent + signature | ⬜ | Must include risks, alternatives, no-treatment option, language, version (see G-L2). |
| Analytics dashboard (link → interested → accepted) | ⬜ | Wait until outcome data is reliable. |
| Export to PMS (Dentee / Clinicea) / CSV | ⬜ | |

### 2.6 Clinical decision support

| Feature | Status | Notes / gaps |
|---|---|---|
| Complaint-first flow (complaint → suggested treatment) | ✅ | Simple mapping; dentist can override. |
| Urgency set by dentist (today / soon / routine / monitor) | ✅ | |
| Interactive tooth chart (FDI) with conditions per tooth | ⬜ | |
| Structured findings (decay depth, restorability, bone, gum status) | ⬜ | Free text today. |
| Preference toggles (budget / appearance / fewer visits) → "Preference summary" | ⬜ | Must not be labelled "best match" (G-C1). |
| Multi-tooth, phased treatment plan | ⬜ | One treatment per case today. |
| Photo / X-ray annotation (arrows, drawing) | ⬜ | |
| Before/after gallery, reviews, AI smile preview | ⏸️ | Needs DCI advertising + privacy legal review first. |

### 2.7 Security, privacy & platform

| Feature | Status | Notes / gaps |
|---|---|---|
| Server-side staff login; HttpOnly + SameSite=Strict session cookie (12 h) | ✅ | Single shared passcode, no individual accounts. |
| Staff login lockout: 10 failures / 15 min | ✅ | Keyed by IP. |
| Patient link lockout: 5 failures / 15 min, stored in SQLite | ✅ | Survives restart. |
| Unguessable link tokens (192-bit), expiry, revoke | ✅ | |
| Pre-unlock page reveals only link validity/expiry | ✅ | |
| Patient session key (2 h, HMAC-signed, persisted secret) | ✅ | Key passed in file URL query string. |
| Patient page re-fetches case on every load (revocation/edits apply immediately) | ✅ | |
| Public API excludes phone number and staff-only data | ✅ | |
| Default passcode warning at startup | ✅ | |
| Individual staff accounts + roles (dentist / front desk / admin), audit log | ⬜ | |
| HTTPS | ⬜ | **Required before real patient data** (G-S1). |
| Backups / export / device migration | ⬜ | (G-D1) |
| DPDP Act compliance: consent notice, retention, deletion/export on request | ⬜ | (G-L1) |
| Cloud deployment (e.g. Supabase / hosted Node) | ⏸️ | Deferred by decision: local-first for now. |
| PWA / offline caching for iPad | ⬜ | |
| 3D asset compression (Draco/meshopt), video fallback | ⬜ | ModelViewer chunk ≈ 287 KB gzip; loaded only when needed. |

### 2.8 Design polish

| Feature | Status | Notes / gaps |
|---|---|---|
| Patient Case Page premium styling (Fraunces + Manrope, clinic header, cards) | ✅ | Fonts from Google Fonts: needs internet on patient phone, falls back gracefully. |
| Staff app brand font, icon set (replace emojis), real logo | ⬜ | Staff app still uses system font + emoji icons. |
| Dark mode | ⬜ | |

---

## 3. Known gaps & risks (for future work)

### Security
- **G-S1: No HTTPS.** On clinic Wi-Fi, traffic including the staff cookie and case data is readable by anyone on the network. Add TLS or deploy before real patients.
- **G-S2: Shared passcode.** Everyone uses one PIN, so there's no per-person accountability. The default is `1234` unless `STAFF_PIN` is set.
- **G-S3: Last-4 digits is a weak factor.** It's rate-limited, but family and acquaintances may know it. Consider OTP via SMS/WhatsApp once deployed.
- **G-S4: Patient key in file URLs** (`?key=`) can appear in browser history. The key is short-lived (2 h), but header-based access is better.
- **G-S5: No audit log** of staff views, edits, price changes or deletes.

### Data
- **G-D1: Single SQLite file, no backup.** Losing the computer means losing all cases. Add scheduled backup/export.
- **G-D2: No estimate versioning.** Price changes after sending aren't tracked, and the patient simply sees the new price.
- **G-D3: Attachments are stored unencrypted** on disk.

### Clinical / legal
- **G-C1:** Never add automated "best match" recommendations. Only the dentist decides suitability.
- **G-C2:** Some current options aren't true alternatives. Single vs multi-sitting root canal depends on the case, "RCT with crown" is a bundle, and mini implants have different indications. Model indications, contraindications and components.
- **G-C3:** Longevity, healing and FAQ content has no citations and hasn't had clinical review.
- **G-L1:** DPDP Act obligations (notice, consent, retention, deletion, guardian consent for minors) aren't implemented. Get Indian privacy counsel.
- **G-L2:** A drawn signature alone isn't informed consent. The consent feature must capture risks, alternatives, no-treatment option, language and version.
- **G-L3:** Before/after photos, reviews and AI smile previews need Dental Council of India advertising review.

### Product / adoption
- **G-P1:** Not tested with real consults. Plan: observe 20–30 consults. Track time to first explanation (target < 2 min), link open rate and "interested" taps.
- **G-P2:** No children/guardian handling (guardian details, consent, child-friendly content).
- **G-P3:** WhatsApp send is manual, and there are no automated follow-ups.
- **G-P4:** Staff price overrides (Settings, localStorage) and per-case prices (server) are separate systems. Unify into server-side price list.

---

## 4. Recommended next steps (in order)

1. Dentist review of `src/data/guides.ts` content; fix option modelling (G-C2).
2. Backups/export (G-D1) and individual staff accounts + audit log (G-S2, G-S5).
3. Implants + aligners end-to-end in real consults; aligner movement animation.
4. Line-item estimates with versioning, quote PDF, family share link.
5. Follow-up/recall reminders, booking, UPI advance, consent.
6. Hindi + regional languages with audio.
7. HTTPS + deployment decision; DPDP compliance review.

---

## 5. Future plan (all planned features, consolidated)

Single backlog merging three sources:
- Roadmap v2 (the ⬜/⏸️ items in section 2)
- The 2026-09-16 Codex + Claude feature brainstorm
- The imaging import research

Where ideas overlapped, they are merged into one row.

**Product focus:** premium clinics. Goals are patient understanding, faster communication from the dentist, and converting understanding into accepted treatment. **Not** a CRM, billing or PMS product.

**Priority key:**
- **P0:** foundation / blocker
- **P1:** next 90 days
- **P2:** after P1 is validated
- **P3:** later
- **Hold:** needs legal, regulatory or partner decision

**Source key:**
- **R:** Roadmap v2
- **CX:** Codex
- **CL:** Claude
- **IM:** [Imaging import research](IMAGING-IMPORT-RESEARCH.md)

### 5.1 Foundation (blocks patient-facing, AI and off-LAN features)

| Feature | Priority | Effort | Source | Notes |
|---|---|---|---|---|
| Dentist review of guide content; fix option modelling | P0 | S | R | G-C2, G-C3 |
| Backups / export / device migration | P0 | S | R | G-D1 |
| Individual staff accounts + roles + audit log | P0 | M | R | G-S2, G-S5 |
| HTTPS / TLS | P0 | S–M | R | G-S1. Required before real patient data. |
| DPDP compliance: consent notice, retention, deletion/export | P0 | M | R | G-L1 |
| Encrypt attachments at rest | P1 | S | R | G-D3 |
| OTP unlock (SMS/WhatsApp) instead of last-4 digits | P2 | M | R | G-S3, needs deployment |
| Header-based patient file access (remove `?key=`) | P1 | S | R | G-S4 |
| Unified server-side price list (replace localStorage overrides) | P1 | S | R | G-P4 |
| Cloud deployment decision (Supabase / hosted Node) | Hold | L | R | Local-first for now. Required for post-visit, AI and remote features. |
| PWA / offline caching for iPad | P3 | M | R | |
| 3D asset compression (Draco/meshopt) + video fallback | P2 | S–M | R | Also needed for scan import (5.4). |

### 5.2 Patient understanding (chairside + patient link)

| Feature | Priority | Effort | Source | What it does |
|---|---|---|---|---|
| **"Show Me Mine" X-ray/photo annotation** | P1 | M | CX + R | Dentist circles and labels the problem tooth in about 20 s. Patient sees their image next to a healthy reference. Replaces "Photo / X-ray annotation". |
| **Concern-first comparison** (preference toggles) | P1 | S | CX + R | Patient picks their top 2 concerns (pain, looks, visits, longevity, cost). Comparison reorders around them. Never "best match" (G-C1). |
| **Teach-back check** | P1 | S–M | CX | 3 visual questions after the explanation. A wrong or unsure answer reopens that section and is logged on the case. |
| **Issue Fingerprint** (structured findings) | P1 | M | CX + R | 5 taps (trigger, swelling, mobility, restorability, bone) → a one-screen "why this is happening" for the patient. Replaces free-text findings. |
| **Personal procedure journey** | P2 | M | CX | Timeline of visits, sensations, temporary stages and recovery for the chosen option. |
| **Comfort plan** | P2 | S–M | CX | Patient picks fears (injection, drill sound, gagging) and sees the clinic's coping measures plus a stop signal. |
| **Progression checkpoints** | P2 | M | CX | Visual "if untreated" path using cautious "may/can" wording. Upgrades the text-only timeline. |
| **Live chairside mirror** | P2 | M | CX | Patient scans a QR code; their phone follows the dentist's selected image, 3D stage or option. |
| **Change-over-time slider** | P2 | M | CX | Two photos or X-rays from different dates on a scrub slider, with dentist captions. |
| Aligner per-tooth movement animation | P2 | L | R | Upgrades the partial braces stages. |
| More treatments: crowns, bridges, veneers, whitening, extraction, wisdom tooth, scaling, dentures, kids | P2 | M each | R | Crown/veneer/bridge geometry already exists. |
| Languages: Hindi, Telugu, Kannada, Tamil + audio | P2 | L | R | Language already saved per patient. |
| Admin content editor (draft → review → publish) | P3 | L | R | |
| Children / guardian handling | P3 | M | R | G-P2 |
| Staff brand font, icon set, real logo; dark mode | P3 | S | R | |

### 5.3 Conversion (turning understanding into accepted treatment)

| Feature | Priority | Effort | Source | What it does |
|---|---|---|---|---|
| **Cost of waiting** | P1 | S | CL | Shows, e.g., root canal ₹X now vs extraction + implant ₹Y later, from the clinic's own prices, with cautious wording. |
| **Now / next / later phased plan** (multi-tooth plan) | P1 | M | CL + R | Splits the plan into urgent, soon and cosmetic phases, each with its own cost and visits. Patient commits to phase 1 today. Replaces "Multi-tooth, phased treatment plan". |
| **Why they didn't accept** | P1 | S | CL | One reason recorded per lost case (cost, fear, family, time, second opinion). Dashboard of the clinic's loss reasons. |
| **Whole-mouth health map** (tooth chart) | P1–P2 | M | CL + R | Full-mouth red/amber/green chart that surfaces other treatment the patient needs. Replaces "Interactive tooth chart (FDI)". |
| **Family decision pack** (family share link) | P2 | S–M | CL + R | Separate revocable link for family, with the doctor's voice note and a family FAQ. |
| Line-item estimates with versioning + quote PDF | P2 | M | R | G-D2 |
| Follow-up reminders for undecided cases (WhatsApp) | P2 | M | R | Needs WhatsApp Business API; G-P3 |
| Recall reminders (cleaning, post-op, aligner, implant) | P3 | M | R | |
| EMI / finance calculator | P2 | S | R | |
| Procedure-specific consent + signature | P2 | M | R | Must satisfy G-L2. |
| Appointment booking (slots) | P3 | M | R | Keep light; avoid becoming a PMS. |
| Advance payment / UPI QR, receipts | P3 | M | R | Keep light; avoid becoming a billing tool. |
| Analytics dashboard (link → interested → accepted) | P2 | M | R | Also track teach-back gaps and loss reasons. |
| Export to PMS (Dentee / Clinicea) / CSV | P3 | M | R | Integrate with PMS, don't replace it. |
| **Structured "Ask the dentist" queue** | P3 | M | CX | Post-visit question by topic or voice; staff reply with approved answers. Needs deployment. |

### 5.4 Imaging import & patient-specific 3D

Details, blockers, sources and spikes are in [IMAGING-IMPORT-RESEARCH.md](IMAGING-IMPORT-RESEARCH.md).

| Feature | Priority | Effort | Source | What it does |
|---|---|---|---|---|
| Clinic survey: sensors, imaging software, scanners, export options | P0 | S | IM | 10 target clinics plus sample files. Gates everything below. |
| **X-ray watch-folder auto-import** | P1 | S–M | IM | Imaging software exports to a folder; server attaches the file to the open consult; staff confirm it. |
| **Intraoral camera live capture** (`getUserMedia`) | P1 | S | IM | USB webcam-type cameras, no driver work. |
| **Patient-friendly X-ray viewer** | P1 | M | IM | 16-bit/DICOM support, window/level, zoom, loupe, patient-mode spotlight and crop, "healthy vs yours". Pairs with Show Me Mine. |
| DICOM receive (Storage SCP) with metadata patient match | P2 | M | IM | For Romexis, Sidexis, CS Imaging clinics with a DICOM module. |
| **3D scan import** (STL/PLY/OBJ → GLB) | P2 | M | IM | Medit, TRIOS, iTero exports; auto-orient; ~2–5 MB GLB; colour kept where available. |
| **L1: My mouth, marked up** | P2 | S–M | IM | Pins and painted highlights on the patient's own scan. |
| **L3: My treatment on my scan** | P2 | M–L | IM | Our implant/crown GLB anchored in the patient's gap; stage slider on their anatomy. |
| L2: Tooth identified on scan (manual → AI segmentation) | P3 | M → L | IM | Linked to the whole-mouth map. |
| L4: Scan-over-time deviation heat map | P3 | L | IM | Wear, recession, tooth movement. |
| Medit / 3Shape partner integration (automated scan import) | Hold | L | IM | After the survey shows scanner mix. |
| Direct TWAIN sensor capture / vendor SDKs | Hold | L | IM | Avoid until needed; high support burden. |
| CBCT volume viewer (educational) | Hold | L | IM | Close to diagnostic territory. |

### 5.5 AI-assisted (all Hold until deployment + regulatory advice)

AI imaging and diagnostic tools fall under CDSCO's medical device software guidance. Needed before building any of these:
- dentist approval of every AI output
- no autonomous diagnosis
- a DPDP consent design

| Feature | Priority | Effort | Source | Notes |
|---|---|---|---|---|
| Doctor voice note → approved patient summary | Hold | M–L | CX | Voice + LLM; mandatory dentist review. |
| AI region suggestions on X-rays | Hold | L | CX + IM | Suggestions only; the dentist confirms. |
| AI smile / outcome preview | Hold | L | CX + R | Needs Dental Council of India advertising review (G-L3). Watermark, consent. Avoid aligner simulation (iTero/Invisalign own it). |
| Matched clinic case gallery / before-after / reviews | Hold | M–L | CX + R | Needs DCI advertising review; media consent, de-identification. |

### 5.6 Long-term moat: Explanation Outcome Engine (CX)

**What it records:** consented, de-identified links between:
- clinical pattern
- explanation shown
- patient concern
- teach-back gap
- follow-up engagement
- decision

**What it learns:** the clearest explanation sequence per concern, language and treatment. It **never** recommends clinical treatment.

**Start now:** log events from Teach-back, Why they didn't accept, and Concern-first comparison.

**Needs:** multi-clinic volume.

### 5.7 Phase plan

Every item in 5.1–5.6 is assigned to exactly one phase below. Phases are ordered by dependency first, then by conversion impact.

**Timing assumptions:**
- Durations are indicative for a small team (1–2 devs).
- A phase starts only when the previous phase's **exit criteria** are met.
- Each phase ends with real-consult testing before the next one starts.

**Overview:**

| Phase | Theme | Indicative timing | Why this order |
|---|---|---|---|
| 0 | Foundation & discovery | Weeks 0–3 | Real patient data must be safe; the imaging survey decides the import approach |
| 1 | Make it personal | Weeks 4–9 | Biggest gap today: visuals are the same for every patient |
| 2 | Decision & conversion | Weeks 10–15 | Turns understanding into an accepted plan, and starts measuring why cases are lost |
| 3 | Deploy & reach beyond the chair | Weeks 16–24 | Family, reminders and languages only work once links work outside the clinic Wi-Fi |
| 4 | Deeper understanding & patient-specific 3D | Months 6–9 | Builds on proven Phase 1–2 flows and survey results |
| 5 | Scale & intelligence | Months 9–12+ | Multi-clinic features, automation, and outcome data |
| Hold | Gated items | When the gate clears | Legal, regulatory or partner decisions |

---

#### Phase 0: Foundation & discovery (weeks 0–3)

**Goal:** safe to use with real patients, and the right imaging path is known.

| Item | From | Notes |
|---|---|---|
| Dentist review of guide content; fix option modelling | 5.1 | G-C2, G-C3. Blocks real patient use. |
| Backups / export / device migration | 5.1 | G-D1 |
| Individual staff accounts + roles + audit log | 5.1 | G-S2, G-S5. Needed so annotations and prices have an author. |
| HTTPS / TLS on the LAN server | 5.1 | G-S1 |
| Encrypt attachments at rest | 5.1 | G-D3. X-ray volume grows in Phase 1. |
| Header-based patient file access (remove `?key=`) | 5.1 | G-S4 |
| Unified server-side price list | 5.1 | G-P4. Prerequisite for Cost of waiting and the phased plan. |
| DPDP compliance: consent notice, retention, deletion/export (start) | 5.1 | Legal review starts now; implementation finishes in Phase 3. |
| Clinic survey: sensors, imaging software, scanners, export options + sample files | 5.4 | Gates the Phase 1 and Phase 4 imaging work. |
| Event logging schema for the Explanation Outcome Engine | 5.6 | Log only; no analysis yet. |

**Exit criteria:**
- Content signed off by a dentist.
- Nightly backup verified by a test restore.
- Every staff member logs in individually.
- HTTPS is live.
- 10 clinics surveyed.

---

#### Phase 1: Make it personal (weeks 4–9)

**Goal:** every consult shows *this* patient's problem on *their* image, set up in under 60 s.

| Item | From | Depends on |
|---|---|---|
| **Show Me Mine** X-ray/photo annotation | 5.2 | Staff accounts (author), encrypted attachments |
| **Patient-friendly X-ray viewer** (16-bit/DICOM, window/level, spotlight, "healthy vs yours") | 5.4 | Survey (formats) |
| **X-ray watch-folder auto-import** with confirm step | 5.4 | Survey shows at least 70% of clinics can auto-export |
| **Intraoral camera live capture** | 5.4 | None |
| **Issue Fingerprint** (structured findings) | 5.2 | Content review (templates) |
| **Whole-mouth health map** (FDI tooth chart) | 5.3 | Issue Fingerprint (per-tooth conditions) |

**Exit criteria:**
- At least 80% of test consults include an annotated image.
- Median setup under 60 s.
- Zero wrong-patient imports in testing.

---

#### Phase 2: Decision & conversion (weeks 10–15)

**Goal:** the patient leaves with a clear, affordable plan, and the clinic learns why patients say no.

| Item | From | Depends on |
|---|---|---|
| Line-item estimates with versioning + quote PDF | 5.3 | Unified price list |
| **Now / next / later phased plan** | 5.3 | Line items, Whole-mouth map |
| **Cost of waiting** | 5.3 | Unified price list; dentist-approved progression wording |
| **Concern-first comparison** | 5.2 | None |
| EMI / finance calculator | 5.3 | Phased plan totals |
| **Teach-back check** | 5.2 | Event logging |
| **Why they didn't accept** | 5.3 | Event logging |
| Analytics dashboard v1 (link → interested → accepted, loss reasons, teach-back gaps) | 5.3 | Phase 2 events |
| Real-consult test: 20–30 consults | G-P1 | Everything above |

**Exit criteria:**
- Baseline measured for:
  - accepted-treatment rate
  - time to decision
  - teach-back uncertainty
  - top 3 loss reasons
- Quote PDF used in real consults.

---

#### Phase 3: Deploy & reach beyond the chair (weeks 16–24)

**Goal:** a secure link that works anywhere, and reaches the family and the patient's own language.

| Item | From | Depends on |
|---|---|---|
| Cloud deployment decision + deploy | 5.1 | Currently Hold; this phase **forces the decision** |
| DPDP compliance: finish implementation | 5.1 | Deployment |
| OTP unlock (SMS/WhatsApp) | 5.1 | Deployment |
| 3D asset compression + video fallback | 5.1 | Needed for mobile data off Wi-Fi |
| **Family decision pack** (separate revocable link + voice note) | 5.3 | Deployment, OTP |
| Follow-up reminders for undecided cases (WhatsApp Business API) | 5.3 | Deployment, loss-reason data |
| Procedure-specific consent + signature | 5.3 | Legal review (G-L2), languages |
| Languages: Hindi first, then Telugu, Kannada, Tamil + audio | 5.2 | Content frozen after review |
| **Structured "Ask the dentist" queue** | 5.3 | Deployment, staff accounts |

**Exit criteria:**
- Links work off-LAN over HTTPS with OTP.
- DPDP review signed off.
- At least 1 regional language live.
- Family link used in real cases.

---

#### Phase 4: Deeper understanding & patient-specific 3D (months 6–9)

**Goal:** reduce fear and uncertainty, and bring the patient's own 3D anatomy into the explanation.

| Item | From | Depends on |
|---|---|---|
| **Personal procedure journey** | 5.2 | Content review per treatment |
| **Comfort plan** | 5.2 | Clinic coping-measure list |
| **Progression checkpoints** | 5.2 | Clinically reviewed wording |
| **Change-over-time slider** | 5.2 | Phase 1 viewer |
| **Live chairside mirror** (QR follow mode) | 5.2 | Deployment or LAN sockets |
| DICOM receive (Storage SCP) with metadata match | 5.4 | Survey shows DICOM modules in use |
| **3D scan import** (STL/PLY/OBJ → GLB, auto-orient) | 5.4 | Survey scanner mix, 3D compression |
| **L1: My mouth, marked up** | 5.4 | Scan import |
| **L3: My treatment on my scan** | 5.4 | L1, implant/crown GLBs |
| More treatments: crowns, bridges, veneers first; then extraction, wisdom tooth, scaling, whitening, dentures, kids | 5.2 | Content editor not required; dentist review |
| Aligner per-tooth movement animation | 5.2 | None |

**Exit criteria:**
- L1/L3 used in real implant consults.
- Teach-back uncertainty lower than the Phase 2 baseline.

---

#### Phase 5: Scale & intelligence (months 9–12+)

**Goal:** run across multiple clinics with less manual work, and start learning from outcome data.

| Item | From | Notes |
|---|---|---|
| Recall reminders (cleaning, post-op, aligner, implant) | 5.3 | |
| Appointment booking (light) | 5.3 | Integrate with the PMS where possible; don't become one. |
| Advance payment / UPI QR, receipts (light) | 5.3 | Same. |
| Export to PMS (Dentee / Clinicea) / CSV | 5.3 | |
| Admin content editor (draft → review → publish) | 5.2 | Needed once there are many treatments and languages. |
| Children / guardian handling | 5.2 | G-P2 |
| PWA / offline caching for iPad | 5.1 | |
| **L2: Tooth identified on scan** (manual → AI segmentation) | 5.4 | AI part requires Hold-gate clearance. |
| **L4: Scan-over-time deviation heat map** | 5.4 | |
| Staff brand font, icon set, logo; dark mode | 5.2 | Can be pulled earlier if needed for sales demos. |
| **Explanation Outcome Engine v1** (analysis of logged events) | 5.6 | Needs multi-clinic volume and consent. |

**Exit criteria:** running in at least 3 clinics; outcome engine shows explanation patterns backed by enough data.

---

#### Hold track (not scheduled; each item has a gate)

| Item | From | Gate to clear | Earliest phase |
|---|---|---|---|
| Doctor voice note → approved patient summary | 5.5 | Deployment + CDSCO/DPDP advice + data-processing agreement | 4 |
| AI region suggestions on X-rays | 5.5 | CDSCO medical device software classification advice; clinical validation | 5 |
| AI smile / outcome preview | 5.5 | DCI advertising review (G-L3); consent + watermark design | 5 |
| Matched clinic case gallery / before-after / reviews | 5.5 | DCI advertising review; media consent + de-identification | 4 |
| Medit / 3Shape partner integration | 5.4 | Survey scanner mix + partner acceptance | 4–5 |
| Direct TWAIN sensor capture / vendor SDKs | 5.4 | Watch folder + DICOM fail to cover target clinics | 5 |
| CBCT volume viewer (educational) | 5.4 | Regulatory advice; clinic demand | 5 |

**Measure across all phases:**
- median setup time (< 60 s)
- teach-back uncertainty rate
- link open rate
- time to decision
- accepted-treatment rate
- loss reasons

---

## 6. Change log

| Date | Change |
|---|---|
| 2026-09-16 | Roadmap v1 drafted; adversarial review by Codex (40 findings) → roadmap v2 centred on the Patient Case Link. |
| 2026-09-16 | Built local server (Express 5 + node:sqlite), cases board, consult flow, attachments, share links, patient Case Page, content guides. |
| 2026-09-16 | Codex code review: fixed 1 critical + 5 advisory issues. Server-side staff login, minimal pre-unlock metadata, no cached case data, status sync, deduplicated opens, persistent lockouts. |
| 2026-09-16 | Added section 5, the consolidated future plan: Roadmap v2 + Codex/Claude feature brainstorm + imaging import research (`docs/IMAGING-IMPORT-RESEARCH.md`). |
| 2026-09-16 | Replaced the 90-day sequence with the 5.7 phase plan (Phases 0–5 + Hold track), covering every future item. |

## 7. Key files

| Area | Path |
|---|---|
| API server | `server/index.ts`, `server/db.ts` |
| API client & types | `src/api/client.ts` |
| Staff pages | `src/pages/CasesBoardPage.tsx`, `src/pages/ConsultPage.tsx` |
| Patient page | `src/pages/PatientCasePage.tsx` |
| Patient content | `src/data/guides.ts` |
| Treatments & 3D scenes | `src/data/treatments.ts`, `src/data/scenes.ts`, `src/three/` |
| Styles | `src/styles/consult.css`, `src/styles/case.css` |
| Roadmap (planning doc) | `~/.claude/plans/we-have-built-a-frolicking-sunbeam.md` |
| Imaging import research (X-ray, 3D scans) | `docs/IMAGING-IMPORT-RESEARCH.md` |
