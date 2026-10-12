# Device test log (Section 21.2)

To be filled in on physical phones (not possible in the build environment). Measured in the build environment:

| Item | Value |
|---|---|
| First load, vision assets (uncompressed) | 29.5 MB: MediaPipe SIMD WASM 13.0 MB, OpenCV.js 10.4 MB, Pose Lite 5.8 MB, loader 0.3 MB |
| First load, vision assets (gzip) | ≈ 12.3 MB: 3.8 + 3.4 + 5.0 + 0.1 MB |
| Real pipeline in desktop Chromium with fake camera | camera opens, models load from cache, marker found live, no pose (no person), bitmaps released, no uploads (`tests/e2e/real.spec.ts`) |


| Phone | OS / browser | First-load size | Model download (3G) | Live check fps | 10 captures: median s (NFR-01) | Lens selection | Orientation permission | Wake lock | Audio EN / SW | Airplane-mode capture + later sync | Memory (no reloads) | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tecno Spark 30C (4 GB) | | | | | | | n/a | | | | | |
| Samsung Galaxy A16 4G | | | | | | main vs ultra-wide: | n/a | | | | | |
| iPhone 11 (iOS ≥ 16.4) | | | | | | auto-switch: | | | | | | |
| Infinix Smart 9 / Tecno Pop 9 (3 GB, floor) | | | | | | | n/a | | | | | |

Tailor screens: sunlight readability check, to be recorded here.
