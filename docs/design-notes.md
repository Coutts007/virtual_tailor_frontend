# Design notes

## Corrections to the source documents (Section 2.4)

| # | Source says | Built instead | Where in code |
|---|---|---|---|
| C1 | Activity diagram: level if \|beta\| ≤ 2° and \|gamma\| ≤ 2° | Level when **beta ∈ [88°, 92°]** (upright portrait) **and \|gamma\| ≤ 2°** | `src/lib/capture/config.ts`, `orientation.ts` (Phase 2–3) |
| C2 | Figure 5.2: outline fills 85% of frame height | Outline drawn at the **2–2.5 m target band: 31–63% of frame height** (600–1,200 px on 1920), centred | `capture/config.ts`, capture overlay (Phase 2) |
| C3 | NFR-12: Chrome 90, Android 9, Safari 15 | Floor in Section 2.2: Android 11+, Chrome 91+ / Samsung Internet 16+, iOS/Safari 16.4+ | `device/preflight.ts` (Phase 2) |
| C4 | DDL `value_mm NOT NULL` | Failed site: `value_mm = null`, `confidence_flag = 'fail'` | `api/types.ts` `Measurement.value_mm: number \| null`; flagged in `api-contract.md` |
| C5 | FR-09 vs Section 3.6.2 (study photos) | Study image vault behind `VITE_FEATURE_STUDY_IMAGES=false`, consent-gated, encrypted, local download only, stubbed until approval | `study/imageVault.ts` (Phase 6) |
| C6 | CAPTURE_SESSION lacks lighting, distance, fit | `session.study` object in the payload; backend asked to add columns | `api/types.ts` `StudyBlock` |

## Deviations from Figure 5.2

- The capture check list has **seven rows** (Level · Whole body in frame · Distance · Facing camera · Arms away · Sheet found · Light and sharp) rather than five, adding Distance and Light-and-sharp from Section 2.8.8. "Person found" folds into "Whole body in frame"; "Stability" appears only as the "Hold still" instruction.

## Colour contrast (WCAG 2.2 AA)

Measured with the WCAG 2.x relative-luminance formula. The light-theme pairs are enforced by `tests/unit/contrast.test.ts`.

### Light theme (default)

| Foreground | Background | Ratio | Use / requirement |
|---|---|---|---|
| `ink` #1F1C18 | `chalk` #F7F3EC | 15.34:1 | Body text, ≥ 4.5 |
| `ink` #1F1C18 | `paper` #FFFFFF | 16.97:1 | Body text on cards, ≥ 4.5 |
| `ink-muted` #5C554C | `chalk` #F7F3EC | 6.64:1 | Secondary text, ≥ 4.5 |
| `ink-muted` #5C554C | `paper` #FFFFFF | 7.35:1 | Secondary text, ≥ 4.5 |
| `thread-ink` #FFFFFF | `thread` #2E3A87 | 10.14:1 | Primary button label, ≥ 4.5 |
| `thread` #2E3A87 | `chalk` #F7F3EC | 9.17:1 | Links, ≥ 4.5 |
| `pass` #1E7B45 | `paper` #FFFFFF | 5.28:1 | "Good" flag text, ≥ 4.5 |
| `pass` #1E7B45 | `pass-fill` #E3F3E9 | 4.60:1 | Flag badge, ≥ 4.5 |
| `check-ink` #5C3700 | `check-fill` #FDF0D5 | 9.29:1 | "Check" badge text (dark text on light amber, per 8.2), ≥ 4.5 |
| `check` #B26B00 | `paper` #FFFFFF | 4.20:1 | **Icons and borders only** (≥ 3). Not used for body-size text; text uses `check-ink`. |
| `fail` #B3261E | `paper` #FFFFFF | 6.54:1 | "Not measured" text, ≥ 4.5 |
| `fail` #B3261E | `fail-fill` #FBE5E3 | 5.42:1 | Flag badge, ≥ 4.5 |
| `kitenge` #C8531E | `chalk` #F7F3EC | 4.03:1 | Focus ring / active-tab accent (UI component, ≥ 3) |
| `line-strong` #8A8174 | `paper` #FFFFFF | 3.84:1 | Input borders (UI component, ≥ 3) |
| `offline-ink` #FFFFFF | `offline-fill` #3D3833 | 11.59:1 | Offline banner, ≥ 4.5 |
| `border-ok` #22C55E | `capture-bg` #0E0E10 | 8.46:1 | Capture frame, ≥ 3 |
| `border-wait` #FBBF24 | `capture-bg` #0E0E10 | 11.55:1 | Capture frame, ≥ 3 |
| `border-stop` #EF4444 | `capture-bg` #0E0E10 | 5.12:1 | Capture frame, ≥ 3 |

The capture border colours were brightened from the usual UI greens and reds so they read from 2.5 m against the dark capture background. Green / amber / red is never the only signal: each state also has a word and an icon in the main instruction, and audio.

### Dark theme (capture screen and `prefers-color-scheme: dark`)

| Foreground | Background | Ratio |
|---|---|---|
| ink #F3EFE8 | chalk #161412 | 16.03:1 |
| ink-muted #B8B0A4 | paper #221F1C | 7.64:1 |
| thread-ink #10142E | thread #8F9CF0 | 7.04:1 |
| thread #8F9CF0 | paper #221F1C | 6.39:1 |
| pass #5FD08F | paper #221F1C | 8.51:1 |
| check-ink #F7CF85 | check-fill #3A2B10 | 9.28:1 |
| fail #FF8A80 | paper #221F1C | 7.18:1 |
| kitenge (focus) #F08A55 | chalk #161412 | 7.41:1 |

## UX principle notes

- Language toggle (`EN | SW`) is a two-button group with `aria-pressed` and full language names as accessible labels; each button carries its own `lang` attribute so screen readers pronounce it correctly.
