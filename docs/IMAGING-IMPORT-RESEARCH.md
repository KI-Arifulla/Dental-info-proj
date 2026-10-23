# Research: Importing X-rays and 3D Intraoral Scans

Status: research / pre-spike · Date: 2026-09-16 · Owner: TBD

## Goal

Show the patient's **own** X-rays and 3D scans inside our chairside and patient-link screens, without the dentist exporting files by hand. Vendor imaging software is built for diagnosis, not for explaining things to patients. Our screens should be:

- **Faster:** the image shows up in the open consult on its own.
- **Clearer:** patient mode, highlights and side-by-side comparisons.
- **Personal:** the patient's own anatomy drives the visuals.

Scope is patient education and communication. We **do not** replace the diagnostic viewer or the image archive, in line with the "not a CRM / PMS" position.

---

## Part 1: X-rays from portable / RVG setups

### 1.1 What "portable X-ray" means in practice

A handheld X-ray unit only **emits** radiation and produces no file. The image comes from one of two receptors:

| Receptor | How it works | Where the image lands |
|---|---|---|
| **RVG / CMOS sensor** (most common) | USB sensor in the mouth; the image appears in seconds | Vendor capture software on a Windows PC |
| **PSP phosphor plate** | Plate is exposed, then read by a scanner | Scanner software on a Windows PC |

So the integration target is the **imaging software on the clinic PC**, not the X-ray unit. Common software:

- Carestream CS Imaging
- Dentsply Sirona Sidexis
- Planmeca Romexis
- Vatech EzDent-i
- Dürr VistaSoft
- Acteon Sopix / AIS
- Dexis
- Low-cost sensors that ship their own capture app

The exact brands in our target clinics still need checking (see §4).

### 1.2 Integration options (ranked)

| # | Approach | How | Vendor deal needed? | Effort | Verdict |
|---|---|---|---|---|---|
| **A** | **Watch-folder auto-import** | Set the imaging software to auto-export or save each capture (DICOM, 16-bit PNG/TIFF, or JPG) to a folder. Our local server watches it (e.g. `chokidar`) and attaches new images to the consult currently open ("Waiting for X-ray…" → auto-attached). | No | **S–M** | **v1 pick.** Works with almost any software that can export. Fits our LAN Express server. |
| **B** | **DICOM Storage SCP** | Our server acts as a DICOM receiver (`dcmjs-dimse` or DCMTK `storescp`). The imaging software sends ("pushes") each image to it. Patient matching uses DICOM PatientName/ID tags. | No, but the DICOM module is sometimes a paid add-on | **M** | **v2.** Cleanest metadata. Romexis documents Storage SCU/SCP [1]. |
| **C** | **Direct TWAIN capture** | Windows companion app (.NET + NTwain, or the commercial Dynamic Web TWAIN) captures from the sensor driver directly. | No | **L** | **Avoid for now.** We would own driver and 32/64-bit issues, and we'd lose the vendor's image processing (raw images can look *worse*). TWAIN also gives only single images with limited metadata [2]. |
| **D** | **Vendor SDK / bridge** | Official SDK (e.g. Carestream SDK [2]) or practice-software bridge conventions (VDDS, Open Dental-style bridges [3]). | **Yes** | **L** | Later, once we have traction and partner leverage. |
| **E** | **Browser-only** | A browser can't reach X-ray sensor drivers (WebUSB doesn't help). | — | — | Not possible for X-ray sensors. It **does** work for USB intraoral cameras (standard webcam protocol) via `getUserMedia`: live capture into a consult with no driver work. |
| F | Fallback (exists today) | Phone photo of the monitor, or manual upload | No | Done | Keep as a safety net. Quality is poor. |

**Recommendation:** ship A (watch folder) plus intraoral camera capture (E) first, then add B (DICOM receive) for clinics whose software supports it.

### 1.3 Matching an image to the right patient

This is the main operational risk: the wrong X-ray shown to the wrong patient.

1. **Active-consult pairing (v1):** a tablet taps "Capture X-ray". The next file to arrive within N minutes goes to that consult. Staff see a thumbnail and must confirm it.
2. **Metadata match (v2):** DICOM `PatientName` / `PatientID` / `StudyDate`, or filename patterns, matched against case records.
3. Always keep the untouched original file. Any audit trail records the source file path and hash.

### 1.4 Showing the X-ray better

**Viewer tech:**
- Cornerstone3D (`@cornerstonejs/core` + `dicom-image-loader`) or `dwv`.
- Both handle 12/16-bit grayscale and window/level.
- Plain 8-bit JPG/PNG can go into an HTML canvas.
- **Prefer DICOM or 16-bit exports.** JPG export throws away most of the grey levels.

**Staff (chairside) mode:**
- Brightness/contrast (window/level), invert, sharpen, zoom, and a magnifier loupe.
- Tooth-number overlay.
- Draw, circle and label: this is the "Show Me Mine" feature from the feature ideas.
- Side-by-side with a previous X-ray.
- Ruler **only** when DICOM pixel spacing is present, and labelled "approximate".

**Patient mode (our differentiator):**
- Auto-crop to the area of concern, and apply a gentle contrast preset.
- Dim everything except the highlighted tooth (spotlight).
- "Healthy tooth vs your tooth" illustrated reference beside the real image.
- Plain-language labels with a tap for more detail (e.g. "dark area = decay / infection").
- Link from the X-ray finding to our 3D treatment stages.

**Patient link:** a web-optimised copy with annotations baked in and the original kept on the server, using the same unlock and expiry rules as other attachments.

### 1.5 Regulatory and privacy

- **Position as patient education.** Label images "Not for diagnostic use" and never replace the diagnostic viewer. Enhancements apply to a display copy only.
- **AI detection** (caries, bone loss, periapical lesions) turns the product into Software as a Medical Device. CDSCO's Oct 2025 draft guidance on medical device software classifies such software by risk class, A to D, and explicitly lists AI imaging tools [4][5]. Keep AI out of v1, or limit it to suggestions the dentist confirms, after regulatory advice.
- **DPDP:** X-rays are sensitive health data. LAN-only storage helps. We still need encryption at rest, backups, access logs and patient consent before images go into share links.

---

## Part 2: 3D intraoral scanners

### 2.1 Can we import? Yes, via open export formats. Direct APIs are mostly partner-gated.

| Scanner | Where scans live | Open export | Colour | Blockers |
|---|---|---|---|---|
| **Medit** (i600/i700/i900) | Medit Link (desktop + web) | STL, OBJ, PLY [6] | **Yes**, in OBJ/PLY [6] | Integrated "apps" exist inside Medit Link [6]. Programmatic access needs Medit's partner program (to verify). |
| **3Shape TRIOS** | Unite / Dental Desktop | DCM, STL, PLY [7] | DCM = real colour (3Shape-only format); PLY = "adapted" colour; STL = none [7] | Real-colour DCM can't be read outside 3Shape tools. API access goes through 3Shape partner integration. |
| **iTero** (Align) | MyAligntech **cloud** portal | STL ("Open Shell", two arches in occlusion) [8] | No (STL) | Cloud-only, with manual export per case. Scan available ~30 min after scanning [8]. Align's ecosystem is closed, and iTero already bundles Invisalign simulators. |
| Dentsply Primescan / Connect | DS Core / Connect Case Center | STL, PLY (verify) | PLY (verify) | Partner API (verify) |
| Shining 3D Aoralscan, Carestream CS 3700/3800, Planmeca Emerald | Vendor software | STL / PLY / OBJ (verify) | Varies | Usually open export; verify per model |

**Conclusion:** every major scanner can export open STL/PLY/OBJ, so import is **not** blocked.

What we give up without partnerships:
- **Automation:** the dentist exports manually, or we use watch-folder export where the software allows it.
- **Colour** on TRIOS (PLY colour only) and iTero (none).

### 2.2 Blockers and risks

| Blocker | Impact | Mitigation |
|---|---|---|
| No open API without a partnership | Manual export step (~30–60 s) | Watch folder; drag-drop upload; pursue Medit partner program first (most open) |
| Large files (typically tens of MB; to verify with real samples) | Slow on tablet and phone links | Server converts to GLB with `gltfpack` (meshopt) or Draco and decimates to ~2–5 MB; original kept |
| Scanner coordinate systems differ | Model appears rotated or off-centre | Auto-orient: detect the biting surface (PCA plane fit), centre it, fixed camera presets |
| No colour (STL, iTero) | Looks like a plaster model | "Stone model" material in the style of the 3D look already in the app; colour when PLY/OBJ is available |
| Tooth identification needs segmentation | Can't auto-highlight "tooth 36" | v1: dentist taps or paints a region. v2: AI segmentation (see §2.4) |
| Separate upper, lower and bite files | Arches not aligned | Use "arches in occlusion" export (iTero two-file [8], Medit/3Shape bite-aligned export) |
| Clinical / legal | Visual could be taken as a treatment design | "Illustrative, not a treatment plan" label; no measurements shown as clinical |

### 2.3 How to show it (fits our three.js / R3F stack)

- **Loaders:** `STLLoader`, `PLYLoader` (vertex colours), `OBJLoader` from `three/examples`, or load the server-converted GLB with the existing `useGLTF`.
- **Viewer:** reuse `ModelViewer` (rotate/zoom).
- **Presets:**
  - front smile view
  - biting surface of the upper and lower arch
  - open/close jaw animation
  - tooth close-up
- **Staff tools:**
  - tap to drop a pin with a note (raycast)
  - paint a region to highlight it (vertex colour)
  - hide one arch
  - cut away a cross-section
- **Patient link:** a light GLB with the pins, auto-rotate, and the same unlock as other attachments.

### 2.4 Client-specific visualization: levels

| Level | What the patient sees | How | Effort | AI? |
|---|---|---|---|---|
| **L1: My mouth, marked up** | Their own scan with the dentist's pins and highlights ("this crack", "this gap") | Raycast pins and vertex painting | **S–M** | No |
| **L2: My tooth, identified** | Tap "36" on the tooth chart → that tooth glows on their scan | v1 manual click-to-assign. v2 AI tooth segmentation with FDI numbering; open research exists: the 3DTeethSeg'22 challenge / Teeth3DS dataset, MeshSegNet, TSegNet (verify licences before use) | M → L | v2 yes |
| **L3: My treatment, on my scan** | Our implant/crown/veneer GLB placed on *their* tooth or gap, then the treatment stages play on their anatomy | Anchor to the selected tooth position; scale our model to the gap width; reuse the stage slider | **M–L** | No (manual anchor) |
| **L4: My change over time** | Two scans from different dates overlaid, with a colour heat map for wear, gum recession or tooth movement | ICP surface registration + distance-to-surface colouring | **L** | No |
| L5: My future smile | Aligner or cosmetic outcome simulation | Needs tooth movement or generative modelling | **XL** | Yes. **Avoid in v1:** high clinical and legal risk, and iTero/Invisalign already own this |

**Bonus (CBCT 3D X-ray volumes):**
- DICOM volume rendering via vtk.js or Cornerstone3D volume.
- Useful for implant explanation: bone height, where the implant sits.
- Close to diagnostic territory, so keep it educational only; later phase.

**Recommended path:** L1 → L3 (manual anchor) → L2 with AI once volume justifies it → L4 for monitoring cases.

L1 + L3 is the conversion win: "this is *your* mouth, and this is the implant going *here*".

---

## Part 3: Proposed architecture (LAN, v1)

```
Clinic Windows PC                          Our local server (Express + SQLite)
┌───────────────────────┐   export to     ┌──────────────────────────────────────┐
│ X-ray imaging software├──folder / DICOM─▶│ importer: watch folder + DICOM SCP  │
│ Scanner software      ├──STL/PLY/OBJ────▶│  → match to open consult             │
└───────────────────────┘                  │  → keep original (hash)              │
USB intraoral camera ──getUserMedia (tablet/browser)──▶│  → X-ray: display PNG + thumbnail    │
                                           │  → 3D: gltfpack → GLB (~2–5 MB)      │
                                           └───────────────┬──────────────────────┘
                                                           ▼
                           Consult screen (annotate) → Patient link (view)
```

**Notes:**
- The watch folder must be on the same PC as the imaging software, or on a shared network (SMB) drive the server can read.
- Keep imports off the public share route until HTTPS and backups exist (see FEATURES.md gaps).

---

## Part 4: Open questions and validation plan

### 4.1 Clinic survey (10 target premium clinics)

1. X-ray sensor brand/model, **and** the imaging software name and version.
2. Can the software auto-export to a folder? Which formats (DICOM / TIFF / PNG / JPG)? Is a DICOM network module licensed?
3. Is the PC running Windows? Is it on the same LAN as the tablets?
4. Intraoral scanner brand? Where are scans stored (local or cloud)? How often do they scan non-aligner patients?
5. Do they own CBCT? Which software?
6. Intraoral camera model (USB webcam-type)?
7. Who would press "export": dentist or assistant?

### 4.2 Collect sample data

Get de-identified samples, with consent: one DICOM and one JPG export per imaging software, plus STL/PLY/OBJ per scanner.

### 4.3 Spikes (time-boxed)

| Spike | Deliverable | Time box | Success criteria |
|---|---|---|---|
| S1 X-ray watch folder | Folder watcher → attach to open consult → Cornerstone viewer with window/level + annotation | 1 week | Capture-to-screen in under 10 s; 16-bit DICOM displays correctly |
| S2 Intraoral camera | `getUserMedia` capture into consult | 2 days | Works with 2 camera models on the clinic tablet/PC |
| S3 Scan pipeline | STL/PLY/OBJ → auto-orient → GLB → R3F viewer with pins | 1–2 weeks | Medit + TRIOS + iTero samples load in under 3 s on the tablet; colour preserved for Medit PLY/OBJ |
| S4 Treatment on scan (L3) | Place implant GLB at a clicked gap | 1 week | Dentist rates "understandable" in 5 test consults |
| S5 DICOM receive | Server receives images pushed from Romexis/Sidexis | 1 week | Metadata auto-match to patient |

### 4.4 Decision gates

- **After the survey:** if more than 70% of clinics can auto-export X-rays to a folder, commit to option A. Otherwise prioritise B or a vendor bridge.
- **After S3:** if Medit is the most common scanner, apply to Medit's partner program for automation.
- **Before any AI** (detection or segmentation): get regulatory advice under the CDSCO medical device software guidance, plus a DPDP consent design.

---

## Sources

1. [Planmeca Romexis: compatibility & DICOM](https://www.planmeca.com/dental-software/planmeca-romexis/specifications/compatibility-and-dicom/)
2. [Oralstack: dental sensor-bridge integration (Carestream, Dexis, Sopro, Schick)](https://oralstack.com/articles/dental-sensor-bridge-integration/)
3. [Open Dental: sensor compatibility](https://www.opendental.com/site/sensorcompatibility.html) · [MiPACS compatibility](https://www.mipacs.com/products/compatibility/)
4. [Emergo by UL: India CDSCO guidance on medical device software](https://www.emergobyul.com/news/india-cdsco-finalizes-guidance-medical-device-software)
5. [Freyr: SaMD regulation in India, CDSCO classes A–D](https://www.freyrsolutions.com/blog/samd-regulation-in-india-cdsco-classification-class-a-d-registration-requirements-emerging-market-strategy)
6. [Medit: exporting scan data & third-party CAD](https://support.medit.com/hc/en-us/articles/4408628900109--Guide-Exporting-Scan-Data-and-Using-Third-Party-CAD-Software) · [Medit: get result files (web download)](https://support.medit.com/hc/en-us/articles/360021126491--Get-Result-Files)
7. [3Shape: export DCM/STL/PLY from Unite](https://help.3shape.com/en-US/article/?id=a3421334-3abb-ec11-983f-000d3adf3179) · [3Shape: TRIOS STL export](https://www.3shape.com/en/press/2017/3shape-trios-now-with-stl-file-export)
8. [Align: MyAligntech STL export instructions (iTero)](http://storagy-itero-production-us.s3.amazonaws.com/download/iTeroSTLExportInstructions.pdf)

Items marked "verify" still need confirming against vendor docs or real sample files.
