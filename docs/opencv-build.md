# OpenCV.js build

**Result: no custom build is needed.** The stock OpenCV.js 4.10 build published as `@techstark/opencv-js@4.10.0-release.1` (Apache-2.0) exposes the ArUco detector from `objdetect`:

| Check | Result |
|---|---|
| `cv.aruco_ArucoDetector` | present (constructor) |
| `cv.ArucoDetector` | absent; the binding is namespaced `aruco_` |
| `cv.aruco_DetectorParameters`, `cv.aruco_RefineParameters` | present |
| `cv.getPredefinedDictionary(cv.DICT_4X4_50)` | works |
| `cornerRefinementMethod = cv.CORNER_REFINE_SUBPIX` | works |
| Detection of DICT_4X4_50 id 0 | verified in Node (synthetic marker) and in the browser worker on the printed sheet: side 600 px at 4 px/mm → 150 mm (`tests/e2e/real.spec.ts`) |

The marker worker (`src/lib/vision/marker.worker.ts`) checks for `cv.aruco_ArucoDetector` at start and fails with `opencv_without_aruco` if a future build drops it. It sits behind the `MarkerDetector` seam (the worker's `marker` operation), so a different detector could replace it.

## Size

| File | Raw | gzip |
|---|---|---|
| `opencv.js` (WASM embedded as base64, single-threaded SIMD) | 10.4 MB | 3.4 MB |

The host must serve `.js` and `.wasm` with gzip or Brotli (see `docs/api-contract.md` → Deployment headers).

## If a smaller build is wanted later

A custom build with only `core`, `imgproc` and `objdetect` would cut the file to roughly 3–4 MB raw. Steps (Emscripten 3.1.x, OpenCV 4.10 source):

```bash
git clone --branch 4.10.0 --depth 1 https://github.com/opencv/opencv.git
cd opencv
# Keep only the whitelisted functions/classes used by the marker worker:
#   imgproc: cvtColor; objdetect: aruco_ArucoDetector, aruco_DetectorParameters,
#   aruco_RefineParameters, getPredefinedDictionary; core: Mat, MatVector, matFromImageData
emcmake python3 ./platforms/js/build_js.py build_js --build_wasm --simd \
  --cmake_option="-DBUILD_LIST=core,imgproc,objdetect,js" \
  --config ./platforms/js/opencv_js.config.py   # edit the white list first
```

Then copy `build_js/bin/opencv.js` over `static/opencv/opencv.js` (or change `scripts/vendor-assets.mjs`), run `npm run vendor`, and rerun `tests/e2e/real.spec.ts`. Threads stay off (no SharedArrayBuffer, Section 2.2).
