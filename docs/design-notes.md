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

## Component notes (Phase 1)

- **Silhouette (9.10):** a neutral drawn outline, never the client's photo or mask. Left labels Neck, Chest/Bust, Waist, Hip; right labels Shoulder, Sleeve, Outside leg, Inside leg. Each label is a button (≥ 48 px tall) with name, value, flag badge and ISO 8559-1 term. Below 400 px the ISO term is hidden inside the diagram (it stays in the list version and the detail sheet) so the labels fit at 360 px. A `numbers` mode draws numbered dots for the tailor's table view (13.5).
- **Arms on the review silhouette** are drawn about 12° from the body rather than 30°, so the arm does not cross the label columns. The 30° pose applies to the capture target outline (9.7), which is a separate drawing.
- **CodeInput:** one real `<input>` drawn as six boxes. Paste, autofill, screen readers and form state survive language switches. Mask: two letters then four digits; `inputmode` switches from `text` to `numeric` after the letters.
- **Dialog / BottomSheet:** native `<dialog>` with `showModal()`, so focus trapping and the inert background come from the browser; Escape closes; focus returns to the opener.
- **DataTable:** one markup, a table at ≥ 768 px and stacked cards below via CSS, so screen readers always get a real table.
- **FlagBadge:** icon + word + colour; the "Check" badge uses dark amber text (`check-ink`) on a light amber fill with an amber icon, per 8.2.
- **LevelBubble:** level per C1 (beta 88°–92°, |gamma| ≤ 2°); 10° of tilt moves the bubble to the edge. "Cannot check" state for missing sensors.

## Client app notes (Phase 2)

- **Capture screen (9.7/9.8):** 16 px full-screen border — red when two or more checks fail, amber when one check is left (or while walking back), green when all pass and during the countdown. One 56 px instruction (44 px below 380 px width) on a dark pill in the bottom third, `aria-live="assertive"`, changed at most once per 1.5 s by the hysteresis rules. Seven-row check list on the left, slim level bar on the right, mute and help at the bottom, privacy footer.
- **Side transition (9.8):** the full "turn to your right…" text is shown on a 22 px card with a 6-second count, and the 56 px line shows only "Turn to your right"; the long sentence did not fit the big-type line on a 360 px phone.
- **Target outline (C2):** drawn at 49% of the frame height (≈ 943 px on a 1920-tall stream, a 1.70 m adult at 2.5 m), centred, inside the 31–63% distance band. Arms ~30° out on the front outline; "Sheet here" on the chest (front) or right hip (side).
- **Details form:** when a height between 4 and 7.5 looks like feet, the conversion suggestion replaces the range error, so its button does not jump under the finger when the field loses focus (found by the e2e test).
- **Each capture view mounts fresh** (keyed component), so engine, timers and hysteresis state never leak from front to side.
- **Review (9.10):** the silhouette is the drawn neutral outline from Phase 1; the list version below it is the accessible equivalent; flagged rows explain themselves in one line; the retake button for the view behind the worst flag is highlighted with the reason.
- **Saved (9.11):** status in a polite live region; "Change code" for rejected codes; WhatsApp text-only share; shared-phone clearing keeps unsent profiles and says so; install offered only here.

## Measurement module (Phase 4)

**Measurement module.** Every constant lives in `rules.ts` and is hashed into `config_hash`. Levels are mapped between views by their normalised position between the top and bottom of each person mask, so a front level and its side counterpart refer to the same body height even when the client stands at a different distance for the side view. Correction factors are 1.0 until calibration (`0.1-uncalibrated`).

### Interpretation choices (Section 11 ambiguities)

1. **Appendix I.3 is not in the repo.** The waist follows the prompt's summary:
   - The level is 0.6 of the span below the shoulder midpoint.
   - The narrowest front width in the 0.5–0.7 band is only a check: if it is more than 0.05 span away, the flag is `waist_level_mismatch`.
   - Ties in width, common on coarse masks, resolve to the row nearest the rule level.
   - The waist is an ellipse × `CF.waist`.
2. **Female bust:** "check against the most-forward torso point in the side mask" is implemented as follows:
   - For female clients, the chest level is the row of greatest side-mask depth within 0.15–0.40 span (`bust_search`).
   - Male and unspecified clients use `CHEST_LEVEL` (0.25).
   - The chosen fraction is recorded in `level_fraction`.
3. **Arms masked out (13–16):** the torso run at a level is clipped at the arm centre lines (shoulder→elbow→wrist), wherever those lines span that height.
   - When the arms are out (as the capture requires), clipping changes nothing.
   - When an arm touches the torso, the run is cut at the arm's centre line, so half the arm's width remains. With arms hanging, chest reads up to about 25 % high; the capture "arms away" check prevents this case.
4. **Side-view torso centre:** interpolated between the near-side shoulder (12) and hip (24). These are the only side landmarks the rules use.
5. **Hip:**
   - The band runs from the hip-landmark midpoint down a quarter of the hip-to-knee distance.
   - The level is the front row whose mapped side row has the greatest depth.
   - The front width is taken at that same front row.
6. **Neck:**
   - Taken at the narrowest front width between `mouth + 0.3·(shoulder − mouth)` and the shoulder line, in the run around the shoulder-midpoint x.
   - The side depth is taken at the mapped row.
   - The 0.3 start is a placeholder (`neck_search_from`) for the pilot to tune.
7. **Inside leg:**
   - The scan runs upward along the column midway between the ankles (27/28).
   - It first looks for the gap, because feet may touch at the floor, and then for the first row where the gap closes. That row is the crotch.
   - If there is no gap below the hips, the result is `crotch_not_found` (fail, null).
   - The inside leg runs from the bottom edge of the crotch row to the bottom of the front mask.
8. **Shoulder cross-check:** the mask width at the shoulder row is recorded as `half_width_mm` (provenance). It raises no flag, because the deltoids make the mask wider than the acromion distance by design.
9. **Stature row:**
   - The value is the front mask height × the front marker scale.
   - It takes the scale flags like every other site, so the Review "height check" line can use its flag: ✓ within 2 %, ▲ beyond.
   - It is also flagged by `level_unchecked`. The Phase 1 seed did not do this; harmless.
10. **Disagreement > 4 %:**
    - Every site gets `check` + `scale_disagree` (not fail, per 11.1 "flag scale_check").
    - `retake_view` is the view with the lower marker confidence. Ties go to front, because the front view decides the disagreement.
    - 2–4 % gives the same check with no retake.
11. **Failed views:**
    - A view fails when its marker is missing or not square, its mask is empty, or (front) the span is ≤ 0.
    - Its sites become `fail` with `view_failed` and `value_mm = null`.
    - Its scale is reported as `0`, not `null`, to keep the numeric field types of `CaptureSession`.
    - When the front view failed, `scale_disagreement_pct` is 0.
    - `retake_view` is the first failed view.
12. **Visibility:**
    - The per-site minimum visibility of the required landmarks: < 0.5 is fail and < 0.7 is check (`landmark_low`).
    - The sleeve uses whichever arm chain has the higher mean visibility, so one hidden arm does not fail it.
13. **Marker image size:** corners are scaled per axis (`frame / image`) before measuring sides. Squareness is judged in the marker's own image.
14. **Rounding:** `value_mm` is rounded to integer mm. Scales are rounded to 4 dp and disagreement to 0.01 % in the result.
15. **Optional fields:** undefined optional fields (`correction_factor` etc. on length sites) are deleted from the rows, so payloads and Dexie records stay compact.
