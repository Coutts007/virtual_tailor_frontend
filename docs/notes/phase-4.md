# Phase 4 notes: measurement module (Section 11)

For the parent to merge into README, design-notes and traceability.

## What was built

`src/lib/measure/` is pure TypeScript with no DOM and is deterministic.

| File | Contents |
|---|---|
| `types.ts` | `BinaryMask`, `ViewInput`, `MeasureInput`, `MeasureResult` (the agreed API, unchanged) |
| `rules.ts` | `RULES_VERSION = '0.1-uncalibrated'`, `DEFAULT_RULES` (every constant), `resolveRules`, `configHash` (FNV-1a over sorted-key JSON, `cfg-xxxxxxxx`) |
| `scale.ts` | 11.1: marker scale with the 1.03 squareness rule and the corner conversion from a different-size image; stature scale; disagreement % |
| `levels.ts` | `View`: landmarks and mask rows in working-frame px, mask top/bottom, normalised level mapping front↔side, run width with arm clipping |
| `mask.ts` | Row runs, run at x, bounds |
| `girth.ts` | Ramanujan ellipse perimeter, girth × CF |
| `sites.ts` | The nine site rules of Table 3.1 |
| `flags.ts` | 11.3 flags and reason codes; null on fail (C4); plausible ranges from `domain/sites.PLAUSIBLE_MM` |
| `synthetic.ts` | `defaultBody`, `synthesizeView` (front/side masks, 33 landmarks, 150 mm marker) for tests and the FakeVisionWorker |
| `index.ts` | `computeProfile`, re-exports |

## Accuracy on synthetic bodies (tests/unit/measure/profile.test.ts)

Bodies of 1.5–1.9 m, female/male/unspecified, at 2.0–2.5 m.
- Full-resolution masks: lengths within ±1.5 %, girths within ±3 %. In practice most are under 0.5 %.
- Quarter-resolution masks (270×480): lengths within ±2 %, girths within ±4 %.

All flags are "pass" on a clean capture. Speed: `synthesizeView` takes about 5 ms per view and `computeProfile` about 13 ms at 270×480 in Node. At 1080×1920 they take about 40 ms in total.

## Tests and coverage

- 51 tests in `tests/unit/measure/` (161 in the whole suite).
- Coverage of `src/lib/measure` is 99.25 % of statements, 97.4 % of branches and 100 % of functions (NFR-13 asks for ≥ 90 %).
- Run it with `npx vitest run --coverage tests/unit/measure`. `@vitest/coverage-v8@3.2.7` was added as a dev dependency.
- **Suggestion:** add `thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 }` to `test.coverage` in `vite.config.ts` and a CI step `npx vitest run --coverage`. I did not edit `vite.config.ts` because it is outside my files.

## Interpretation choices (Section 11 ambiguities)

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

## Synthetic generator notes (for the FakeVisionWorker)

- **Projection and scale:** orthographic with one pixel scale, `k = (943·2500/1700)·(frameH/1920) / distance_mm` px per mm. The body is centred and its feet are on the floor line.
- **Level layout:**
  - Shoulder at 0.818 H.
  - The hip landmark is derived so that the rule's waist level lands exactly at `outleg_mm`.
  - Chest at the rule's 0.25 span.
  - The hip maximum is 0.1 of hip→knee below the hip landmark.
  - The crotch is at `inleg_mm`.
- **Cross-sections:** ellipses with a/b = 1.4 (chest), 1.3 (waist and hip) and 1.1 (neck). The neck runs up into the head so the union never pinches.
- **Legs:** a fixed 12 mm gap when `legGap`, or 3 mm overlap otherwise.
- **Arms:** 30° from vertical (3° when `armsOut: false`). Upper arm is 56 % of the sleeve.
- **Side view:** a right profile facing image left. Near-side landmarks (even indices) have visibility 0.95; far-side ones 0.3. Feet extend forward.
- **Marker:**
  - On the chest (front) or at the hip level (side).
  - `markerSidePx` overrides its size to simulate a mis-printed sheet. For example, `150·k·1.05` gives about 5 % disagreement.
- **Noise:** jitters landmarks by ±`noise` frame px using a seeded PRNG.
- **Truth:** `truth` holds every site (stature, shoulder, chest, waist, hip, neck, sleeve, inleg, outleg) plus `px_per_mm`.
- **Live-preview tip:** use `maskScale: 0.25` (270×480). One front+side synthesis and measurement takes under 20 ms.

## Things for the parent

- **Rules version in Settings:** `RULES_VERSION` can now be imported from `$lib/measure`. The Phase 5/6 fork was told to put a placeholder in `src/lib/version.ts`; repoint it.
- **Plausible ranges:** `PLAUSIBLE_MM` in `domain/sites.ts` is used as-is through `rules.plausible_mm`. `rules.ts` does not re-export it, so `domain/sites.ts` stays the single source. Nothing needs changing there.
- **Stray MSW worker file:** running `npm ci` in this fresh worktree created an untracked `static/mockServiceWorker.js`, probably MSW's postinstall. I deleted it and did not commit it. Consider adding `static/mockServiceWorker.js` to `.gitignore`, because it would ship in production builds if ever committed.

## README text: "Updating `rules_version` after calibration"

1. Fit the calibration subset outside the app (Section 3.6). Output the new constants: girth correction factors `cf.*`, `chest_level`, `waist_level`, `acromion_offset_mm`, and optionally `neck_search_from`, `bust_search` and the thresholds.
2. Edit `DEFAULT_RULES` in `src/lib/measure/rules.ts` with the fitted values.
3. Bump `RULES_VERSION` to a new frozen name, e.g. `"1.0-ke-cal25"`. Never reuse a version string.
4. Run `npx vitest run tests/unit/measure`. The synthetic-body tolerance tests assume CF = 1, so update their expected truth or tolerances to reflect the new factors (synthetic truth × CF), and keep coverage ≥ 90 %.
5. The config hash (`configHash()`) changes automatically. Every new profile records `rules_version`, `config_hash` and the model variant, so old and new profiles stay distinguishable on the server and in the study export.
6. Note the change, the calibration date and the data set in `docs/decisions.md`.

## Traceability rows

| Requirement | Test |
|---|---|
| FR-06 marker + stature scales, 4 % rule | `tests/unit/measure/scale.test.ts`; `profile.test.ts` › scale disagreement (2–4 % check, > 4 % retake view) |
| FR-07 eight measurements by Table 3.1 | `profile.test.ts` › full synthetic body (6 bodies, tolerances); `sites.test.ts` |
| FR-08 flags | `profile.test.ts` › flags, failed views (null on fail, C4) |
| NFR-13 versioned rules, unit tests | `rules.test.ts` (version, config hash); coverage 99.25 % of `src/lib/measure` |

## Design-notes text

**Measurement module.** Every constant lives in `rules.ts` and is hashed into `config_hash`. Levels are mapped between views by their normalised position between the top and bottom of each person mask, so a front level and its side counterpart refer to the same body height even when the client stands at a different distance for the side view. Correction factors are 1.0 until calibration (`0.1-uncalibrated`).
