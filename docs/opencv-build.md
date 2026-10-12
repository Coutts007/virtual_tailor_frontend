# OpenCV.js build

> **Status: Phase 3.** To do: check whether the stock OpenCV.js build exposes `cv.aruco_ArucoDetector` or `cv.ArucoDetector` (OpenCV 4.7+ moved ArUco into `objdetect`). If it does not, produce a custom build with only `core`, `imgproc` and `objdetect`, single-threaded SIMD, and record the exact commands and the output size here.
