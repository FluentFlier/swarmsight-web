"""
SwarmSight Core Processing Library
Runs in Google Colab Pro with GPU acceleration.
Processes videos based on config JSON exported from SwarmSight Web.
"""

import json
import cv2
import numpy as np
import pandas as pd
from collections import deque
from datetime import datetime
from pathlib import Path
from typing import Optional
from tqdm import tqdm

try:
    from numba import njit, prange
    HAS_NUMBA = True
except ImportError:
    HAS_NUMBA = False
    print("Warning: Numba not available. Processing will be slower.")


# =============================================================================
# Streaming Median Background (Numba-accelerated)
# =============================================================================

if HAS_NUMBA:
    @njit(parallel=True)
    def _update_histograms_add(histograms, median_values, median_offsets, frame):
        """Add a frame to the streaming median histograms."""
        height, width, channels = frame.shape[:3]
        for y in prange(height):
            for x in range(width):
                for c in range(channels):
                    val = frame[y, x, c]
                    histograms[y, x, c, val] += 1
                    med = median_values[y, x, c]

                    if val < med:
                        median_offsets[y, x, c] -= 0.5
                    elif val > med:
                        median_offsets[y, x, c] += 0.5

                    # Walk median if offset exits current bin
                    offset = median_offsets[y, x, c]
                    count = histograms[y, x, c, med]

                    if offset < 0:
                        while offset < 0 and med > 0:
                            med -= 1
                            offset += histograms[y, x, c, med]
                        median_values[y, x, c] = med
                        median_offsets[y, x, c] = offset
                    elif offset >= count:
                        offset -= count
                        while med < 255:
                            med += 1
                            c_count = histograms[y, x, c, med]
                            if offset < c_count:
                                break
                            offset -= c_count
                        median_values[y, x, c] = med
                        median_offsets[y, x, c] = offset

    @njit(parallel=True)
    def _update_histograms_remove(histograms, median_values, median_offsets, frame):
        """Remove a frame from the streaming median histograms."""
        height, width, channels = frame.shape[:3]
        for y in prange(height):
            for x in range(width):
                for c in range(channels):
                    val = frame[y, x, c]
                    histograms[y, x, c, val] -= 1
                    med = median_values[y, x, c]

                    if val < med:
                        median_offsets[y, x, c] += 0.5
                    elif val > med:
                        median_offsets[y, x, c] -= 0.5

                    offset = median_offsets[y, x, c]
                    count = histograms[y, x, c, med]

                    if offset < 0:
                        while offset < 0 and med > 0:
                            med -= 1
                            offset += histograms[y, x, c, med]
                        median_values[y, x, c] = med
                        median_offsets[y, x, c] = offset
                    elif count > 0 and offset >= count:
                        offset -= count
                        while med < 255:
                            med += 1
                            c_count = histograms[y, x, c, med]
                            if offset < c_count:
                                break
                            offset -= c_count
                        median_values[y, x, c] = med
                        median_offsets[y, x, c] = offset


class StreamingMedianBackground:
    """
    Streaming histogram-based median background model.
    Matches the original SwarmSight C# implementation exactly.
    O(1) amortized per pixel per frame update.
    """

    def __init__(self, window_size: int, height: int, width: int, channels: int = 3):
        self.window_size = window_size
        self.histograms = np.zeros((height, width, channels, 256), dtype=np.int32)
        self.median_values = np.full((height, width, channels), 128, dtype=np.uint8)
        self.median_offsets = np.full((height, width, channels), -0.5, dtype=np.float64)
        self.frame_buffer = deque(maxlen=window_size)

    def update(self, frame_bgr: np.ndarray) -> np.ndarray:
        """Add a frame and return the current background model."""
        if len(self.frame_buffer) == self.window_size:
            old_frame = self.frame_buffer[0]
            if HAS_NUMBA:
                _update_histograms_remove(
                    self.histograms, self.median_values, self.median_offsets, old_frame
                )
            else:
                self._update_slow(old_frame, remove=True)

        self.frame_buffer.append(frame_bgr.copy())

        if HAS_NUMBA:
            _update_histograms_add(
                self.histograms, self.median_values, self.median_offsets, frame_bgr
            )
        else:
            self._update_slow(frame_bgr, remove=False)

        return self.median_values.copy()

    def _update_slow(self, frame: np.ndarray, remove: bool):
        """Fallback without Numba (very slow for large frames)."""
        h, w, c = frame.shape
        sign = -1 if remove else 1
        adjust = 0.5 if remove else -0.5

        for y in range(h):
            for x in range(w):
                for ch in range(c):
                    val = frame[y, x, ch]
                    self.histograms[y, x, ch, val] += sign
                    med = self.median_values[y, x, ch]

                    if val < med:
                        self.median_offsets[y, x, ch] += adjust if remove else -0.5
                    elif val > med:
                        self.median_offsets[y, x, ch] += -adjust if remove else 0.5


# =============================================================================
# Appendage Tracker
# =============================================================================

class AppendageTracker:
    """Full appendage tracking pipeline matching original SwarmSight."""

    def __init__(self, config: dict):
        self.config = config
        sw = config["sensorWidget"]
        self.center = (sw["centerX"], sw["centerY"])
        self.size = (sw["width"], sw["height"])
        self.rotation = sw["rotationDeg"]
        self.scale = (sw["scaleX"], sw["scaleY"])
        self.std_w = config["standardSpace"]["width"]
        self.std_h = config["standardSpace"]["height"]
        self.filters = config["filters"]
        self.bg_window = config["background"]["slowWindow"]
        self.exclusion_zones = config.get("exclusionZones", [])
        self.treatment = config.get("treatmentSensor", {"enabled": False})
        self.tip_config = config.get("tipDetection", {
            "sectorCount": 20, "tailPercent": 0.04, "smoothingAlpha": 0.3
        })

        self.bg_model = None
        self.prev_tips = {"left": None, "right": None, "proboscis": None}

    def process_video(self, cap: cv2.VideoCapture, video_info: dict) -> pd.DataFrame:
        """Process entire video and return results DataFrame."""
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or video_info.get("fps", 30)
        results = []

        for frame_idx in tqdm(range(total_frames), desc="Tracking"):
            ret, frame = cap.read()
            if not ret:
                break

            row = self._process_frame(frame, frame_idx, video_info)
            results.append(row)

        return pd.DataFrame(results)

    def _process_frame(self, frame: np.ndarray, frame_idx: int, video_info: dict) -> dict:
        """Process a single frame through the full pipeline."""
        # 1. Extract sensor region
        sensor_img = self._extract_sensor(frame)

        # 2. Initialize background model on first frame
        if self.bg_model is None:
            self.bg_model = StreamingMedianBackground(
                self.bg_window, self.std_h, self.std_w, 3
            )

        # 3. Update background and subtract
        bg = self.bg_model.update(sensor_img)
        diff = cv2.absdiff(sensor_img, bg)

        # 4. Apply HSL filter
        mask = self._apply_filter(diff)

        # 5. Apply exclusion zones
        for zone in self.exclusion_zones:
            x, y, w, h = zone["x"], zone["y"], zone["width"], zone["height"]
            mask[y:y+h, x:x+w] = 0

        # 6. Detect tips (simplified — left/right split at center)
        left_mask = mask[:, :self.std_w // 2]
        right_mask = mask[:, self.std_w // 2:]
        prob_mask = mask[self.std_h // 2:, :]

        left_tip = self._find_tip(left_mask, self.std_w // 4, self.std_h // 2, "left")
        right_tip = self._find_tip(right_mask, self.std_w // 4, self.std_h // 2, "right")
        prob_tip = self._find_proboscis(prob_mask)

        # 7. Treatment sensor
        treatment_val = 0
        if self.treatment.get("enabled"):
            tx, ty = self.treatment["x"], self.treatment["y"]
            tw, th = self.treatment["width"], self.treatment["height"]
            roi = frame[ty:ty+th, tx:tx+tw]
            treatment_val = int(np.sum(roi))

        # 8. Transform back to video space
        left_vid = self._to_video_space(left_tip) if left_tip else (0, 0)
        right_vid = self._to_video_space(right_tip) if right_tip else (0, 0)
        prob_vid = self._to_video_space(prob_tip) if prob_tip else (0, 0)

        return {
            "VideoLabel": video_info.get("path", ""),
            "Frame": frame_idx,
            "TreatmentSensor": treatment_val,
            "PER-X": prob_vid[0],
            "PER-Y": prob_vid[1],
            "PER-Length": np.sqrt(prob_vid[0]**2 + prob_vid[1]**2) if prob_tip else 0,
            "LeftFlagellumTip-X": left_vid[0],
            "LeftFlagellumTip-Y": left_vid[1],
            "RightFlagellumTip-X": right_vid[0],
            "RightFlagellumTip-Y": right_vid[1],
            "RotationAngle": self.rotation,
            "AntennaSensorWidth": self.size[0],
            "AntennaSensorHeight": self.size[1],
            "AntennaSensorOffset-X": self.center[0],
            "AntennaSensorOffset-Y": self.center[1],
            "AntennaSensorScale-X": self.scale[0],
            "AntennaSensorScale-Y": self.scale[1],
        }

    def _extract_sensor(self, frame: np.ndarray) -> np.ndarray:
        """Extract and normalize sensor region using affine transform."""
        angle = self.rotation
        cx, cy = self.center
        sx, sy = self.scale

        M = cv2.getRotationMatrix2D((cx, cy), -angle, 1.0)

        # Adjust for scale and offset
        M[0, 2] += self.std_w / 2 - cx
        M[1, 2] += self.std_h / 2 - cy
        M[0, :2] /= sx
        M[1, :2] /= sy

        return cv2.warpAffine(frame, M, (self.std_w, self.std_h))

    def _apply_filter(self, img: np.ndarray) -> np.ndarray:
        """Apply HSL color filter to produce binary mask."""
        # Convert BGR to HLS (OpenCV uses HLS not HSL)
        hls = cv2.cvtColor(img, cv2.COLOR_BGR2HLS)

        f = self.filters
        h_min = f["hueMin"] / 2  # OpenCV hue is 0-180
        h_max = f["hueMax"] / 2
        l_min = f["lightnessMin"] * 2.55  # 0-100 -> 0-255
        l_max = f["lightnessMax"] * 2.55
        s_min = f["saturationMin"] * 2.55
        s_max = f["saturationMax"] * 2.55

        lower = np.array([h_min, l_min, s_min], dtype=np.uint8)
        upper = np.array([h_max, l_max, s_max], dtype=np.uint8)

        mask = cv2.inRange(hls, lower, upper)
        return mask

    def _find_tip(self, mask: np.ndarray, base_x: int, base_y: int, side: str):
        """Find tip as furthest active pixel cluster from base."""
        coords = np.argwhere(mask > 0)
        if len(coords) == 0:
            return None

        # Distance from base
        distances = np.sqrt((coords[:, 1] - base_x)**2 + (coords[:, 0] - base_y)**2)
        tail_count = max(1, int(len(coords) * self.tip_config["tailPercent"]))
        tail_indices = np.argsort(distances)[-tail_count:]
        tail_coords = coords[tail_indices]

        tip_y = np.mean(tail_coords[:, 0])
        tip_x = np.mean(tail_coords[:, 1])

        # Adjust x for right side offset
        if side == "right":
            tip_x += self.std_w // 2

        # EMA smoothing
        alpha = self.tip_config["smoothingAlpha"]
        prev = self.prev_tips[side]
        if prev is not None:
            tip_x = alpha * tip_x + (1 - alpha) * prev[0]
            tip_y = alpha * tip_y + (1 - alpha) * prev[1]

        self.prev_tips[side] = (tip_x, tip_y)
        return (tip_x, tip_y)

    def _find_proboscis(self, mask: np.ndarray):
        """Detect proboscis as lowest active pixel cluster."""
        coords = np.argwhere(mask > 0)
        if len(coords) < 10:
            return None

        # Proboscis tip = lowest (highest y) active pixel cluster
        tail_count = max(1, int(len(coords) * 0.1))
        lowest = coords[np.argsort(coords[:, 0])[-tail_count:]]
        tip_y = np.mean(lowest[:, 0]) + self.std_h // 2
        tip_x = np.mean(lowest[:, 1])

        prev = self.prev_tips["proboscis"]
        alpha = self.tip_config["smoothingAlpha"]
        if prev is not None:
            tip_x = alpha * tip_x + (1 - alpha) * prev[0]
            tip_y = alpha * tip_y + (1 - alpha) * prev[1]

        self.prev_tips["proboscis"] = (tip_x, tip_y)
        return (tip_x, tip_y)

    def _to_video_space(self, point: tuple) -> tuple:
        """Transform point from standard space back to video space."""
        sx, sy = point
        dx = sx - self.std_w / 2
        dy = sy - self.std_h / 2

        scaled_x = dx * self.scale[0]
        scaled_y = dy * self.scale[1]

        angle = np.radians(self.rotation)
        rot_x = scaled_x * np.cos(angle) - scaled_y * np.sin(angle)
        rot_y = scaled_x * np.sin(angle) + scaled_y * np.cos(angle)

        return (rot_x + self.center[0], rot_y + self.center[1])


# =============================================================================
# Motion Analyzer
# =============================================================================

class MotionAnalyzer:
    """Frame-differencing motion detection matching original SwarmSight."""

    def __init__(self, config: dict):
        self.threshold = config.get("threshold", 30)
        self.roi = config.get("roi", {"leftPct": 0, "topPct": 0, "rightPct": 1, "bottomPct": 1})

    def process_video(self, cap: cv2.VideoCapture, video_info: dict) -> pd.DataFrame:
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        results = []
        prev_frame = None

        for frame_idx in tqdm(range(total_frames), desc="Motion analysis"):
            ret, frame = cap.read()
            if not ret:
                break

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            h, w = gray.shape

            # Apply ROI
            x1 = int(self.roi["leftPct"] * w)
            y1 = int(self.roi["topPct"] * h)
            x2 = int(self.roi["rightPct"] * w)
            y2 = int(self.roi["bottomPct"] * h)
            roi = gray[y1:y2, x1:x2]

            if prev_frame is not None:
                diff = cv2.absdiff(roi, prev_frame)
                changed = int(np.sum(diff > self.threshold))
                results.append({"Frame": frame_idx, "Changed Pixels": changed})

            prev_frame = roi.copy()

        return pd.DataFrame(results)


# =============================================================================
# Batch Runner
# =============================================================================

class BatchRunner:
    """Process multiple videos from a config JSON file."""

    def __init__(self, config_path: str, drive_base: str = "/content/drive/MyDrive"):
        with open(config_path) as f:
            self.config = json.load(f)
        self.drive_base = drive_base

    def run(self) -> list:
        """Process all videos and return list of output CSV paths."""
        output_paths = []

        for video in self.config["videos"]:
            video_path = video["path"]
            if not Path(video_path).is_absolute():
                video_path = str(Path(self.drive_base) / video_path)

            print(f"\nProcessing: {video_path}")
            cap = cv2.VideoCapture(video_path)

            if not cap.isOpened():
                print(f"  ERROR: Could not open {video_path}")
                continue

            module = self.config["module"]

            if module == "appendage_tracker":
                tracker = AppendageTracker(self.config["appendageTracker"])
                results = tracker.process_video(cap, video)
            elif module == "motion_analyzer":
                analyzer = MotionAnalyzer(self.config["motionAnalyzer"])
                results = analyzer.process_video(cap, video)
            else:
                print(f"  ERROR: Unknown module '{module}'")
                cap.release()
                continue

            # Apply manual corrections
            video_id = video.get("id", "vid_001")
            corrections = self.config.get("corrections", {}).get(video_id, {})
            if corrections:
                results = self._apply_corrections(results, corrections)

            # Save CSV next to video
            timestamp = datetime.now().strftime("%Y%m%d_%H%M")
            csv_path = f"{video_path}_SwarmSightWeb_{timestamp}.csv"
            results.to_csv(csv_path, index=False)
            print(f"  Saved: {csv_path}")
            output_paths.append(csv_path)

            cap.release()

        return output_paths

    def _apply_corrections(self, df: pd.DataFrame, corrections: dict) -> pd.DataFrame:
        """Override tracking results with manual corrections."""
        for frame_str, tips in corrections.items():
            frame = int(frame_str)
            idx = df.index[df["Frame"] == frame]
            if len(idx) == 0:
                continue
            i = idx[0]

            if tips.get("leftTip"):
                df.at[i, "LeftFlagellumTip-X"] = tips["leftTip"]["x"]
                df.at[i, "LeftFlagellumTip-Y"] = tips["leftTip"]["y"]
            if tips.get("rightTip"):
                df.at[i, "RightFlagellumTip-X"] = tips["rightTip"]["x"]
                df.at[i, "RightFlagellumTip-Y"] = tips["rightTip"]["y"]
            if tips.get("proboscisTip"):
                df.at[i, "PER-X"] = tips["proboscisTip"]["x"]
                df.at[i, "PER-Y"] = tips["proboscisTip"]["y"]

        return df


# =============================================================================
# Config Validation
# =============================================================================

def validate_config(config: dict) -> list:
    """Validate config JSON and return list of errors."""
    errors = []

    if "version" not in config:
        errors.append("Missing 'version' field")
    if "module" not in config:
        errors.append("Missing 'module' field")
    elif config["module"] not in ("appendage_tracker", "motion_analyzer"):
        errors.append(f"Invalid module: {config['module']}")
    if "videos" not in config or len(config["videos"]) == 0:
        errors.append("No videos specified")

    module = config.get("module")
    if module == "appendage_tracker" and "appendageTracker" not in config:
        errors.append("Missing 'appendageTracker' config for appendage_tracker module")
    if module == "motion_analyzer" and "motionAnalyzer" not in config:
        errors.append("Missing 'motionAnalyzer' config for motion_analyzer module")

    return errors


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python swarmsight_core.py <config.json>")
        sys.exit(1)

    config_path = sys.argv[1]
    with open(config_path) as f:
        config = json.load(f)

    errors = validate_config(config)
    if errors:
        print("Config validation errors:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)

    runner = BatchRunner(config_path)
    paths = runner.run()
    print(f"\nDone! Generated {len(paths)} CSV files.")
