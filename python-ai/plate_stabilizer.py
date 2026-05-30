"""
plate_stabilizer.py
===================
Accumulates raw OCR readings per SORT car_id over a rolling time window,
then confirms a plate only when it passes majority-voting and confidence
thresholds.  All string normalisation lives here so util.py stays clean.

Public API
----------
stabilizer = PlateStabilizer()

# Call every frame when OCR produces a raw reading:
result = stabilizer.feed(car_id, raw_text, confidence, frame_timestamp)
# result → StabilizedPlate | None

# Call every frame even without an OCR hit (keeps idle buffers alive):
stabilizer.tick(frame_timestamp)

# Query display state for any car_id (for HUD overlay):
state = stabilizer.get_state(car_id)   # → DisplayState
"""

from __future__ import annotations

import re
import time
import logging
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from typing import Optional

log = logging.getLogger('PlateStabilizer')

# ══════════════════════════════════════════════════════════════════════════
# Tunable parameters
# ══════════════════════════════════════════════════════════════════════════
BUFFER_WINDOW_SEC   = 2.0   # collect readings for this long before voting
MIN_VOTES           = 3     # minimum identical (normalised) readings to confirm
MIN_CONFIDENCE      = 0.45  # discard readings below this confidence
SIMILARITY_THRESH   = 0.80  # treat two plate strings as "same" if similarity ≥ this
BUFFER_TTL_SEC      = 5.0   # drop buffer if car_id not seen for this long
MAX_BUFFER_SIZE     = 30    # hard cap – prevent unbounded growth on stuck cars


# ══════════════════════════════════════════════════════════════════════════
# Vietnamese plate normalisation
# ══════════════════════════════════════════════════════════════════════════

# Characters frequently confused by OCR on VN plates
_CHAR_MAP: dict[str, str] = {
    # digits that look like letters
    'O': '0', 'Q': '0',
    'I': '1', 'L': '1', 'l': '1',
    'Z': '2',
    'J': '3',
    'A': '4',
    'S': '5',
    'G': '6',
    'T': '7',
    'B': '8',
    'g': '9',
}

# Position-aware map: positions that MUST be digits on a VN plate
# Pattern: [digit][digit][letter(s)]-[digit×4-5]
# Positions 0,1 = province digits; positions after letter block = serial digits
# We apply the general map and then do positional fixups below.

_STRIP_RE = re.compile(r'[^A-Z0-9]')   # keep only alphanumerics after upper()

# Province codes 11-99 + motorcycle codes 1x–9x (single digit prefixed with 0)
_VALID_PROVINCES = frozenset(
    {str(i) for i in range(11, 100)} | {'0' + str(i) for i in range(1, 10)}
)

# VN plate patterns (applied AFTER normalisation + dash insertion)
_PLATE_PATTERNS = [
    re.compile(r'^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$'),   # 51F-12345 / 51AB-1234
    re.compile(r'^[0-9]{2}[A-Z]{1,2}-[0-9]{3}\.[0-9]{2}$'),  # 51F-123.45
]


def _apply_char_map(text: str) -> str:
    """Replace look-alike characters based on the global mapping."""
    return ''.join(_CHAR_MAP.get(ch, ch) for ch in text)


def normalise_plate(raw: str) -> Optional[str]:
    """
    Full normalisation pipeline:
      1. Strip whitespace / special chars, uppercase
      2. Apply char-map (O→0, I→1, …)
      3. Re-insert canonical dash separator
      4. Validate against VN patterns

    Returns the canonical plate string (e.g. "51F-12345") or None if invalid.
    """
    # Step 1 – clean
    text = raw.upper().strip()
    text = _STRIP_RE.sub('', text)   # keep A-Z 0-9 only

    if len(text) < 7 or len(text) > 10:
        return None

    # Step 2 – char-map (applied uniformly; positional logic below fixes mistakes)
    text = _apply_char_map(text)

    # Step 3 – positional fixup
    # Province code (pos 0-1) must be digits
    prefix = text[:2]
    if not prefix.isdigit():
        return None
    if prefix not in _VALID_PROVINCES:
        return None

    # Find letter block (1 or 2 uppercase letters after province digits)
    m = re.match(r'^([0-9]{2})([A-Z]{1,2})([0-9].*)$', text)
    if not m:
        return None
    province, letters, serial = m.group(1), m.group(2), m.group(3)

    # Serial must be all digits (apply digit-only corrections)
    serial_fixed = ''.join(_CHAR_MAP.get(ch, ch) if ch in _CHAR_MAP else ch
                           for ch in serial)
    # Remove any remaining non-digit in serial
    serial_fixed = re.sub(r'[^0-9.]', '', serial_fixed)

    canonical = f'{province}{letters}-{serial_fixed}'

    # Step 4 – pattern validation
    for pat in _PLATE_PATTERNS:
        if pat.match(canonical):
            return canonical

    return None


# ══════════════════════════════════════════════════════════════════════════
# Similarity (edit distance–based, lightweight)
# ══════════════════════════════════════════════════════════════════════════

def _similarity(a: str, b: str) -> float:
    """
    Normalised similarity in [0, 1] using character-level Levenshtein.
    Returns 1.0 for identical strings, 0.0 for completely different.
    """
    if a == b:
        return 1.0
    if not a or not b:
        return 0.0
    la, lb = len(a), len(b)
    # Use two-row DP for memory efficiency
    prev = list(range(lb + 1))
    for i, ca in enumerate(a):
        curr = [i + 1] + [0] * lb
        for j, cb in enumerate(b):
            cost = 0 if ca == cb else 1
            curr[j + 1] = min(curr[j] + 1, prev[j + 1] + 1, prev[j] + cost)
        prev = curr
    dist = prev[lb]
    return 1.0 - dist / max(la, lb)


def _fuzzy_canonical(plate: str, existing: list[str]) -> str:
    """
    If `plate` is very similar to an already-seen plate in `existing`,
    return that existing plate (so they get counted together).
    Otherwise return `plate` itself.
    """
    for e in existing:
        if _similarity(plate, e) >= SIMILARITY_THRESH:
            return e
    return plate


# ══════════════════════════════════════════════════════════════════════════
# Per-car buffer
# ══════════════════════════════════════════════════════════════════════════

@dataclass
class _Reading:
    plate:      str
    confidence: float
    ts:         float   # time.monotonic()


@dataclass
class _Buffer:
    car_id:     int | float
    readings:   list[_Reading] = field(default_factory=list)
    last_seen:  float = field(default_factory=time.monotonic)
    confirmed:  Optional[str] = None   # plate once stabilised


# ══════════════════════════════════════════════════════════════════════════
# Public result types
# ══════════════════════════════════════════════════════════════════════════

@dataclass(frozen=True)
class StabilizedPlate:
    """Emitted once when a plate is confirmed by majority voting."""
    car_id:     int | float
    plate:      str
    confidence: float   # average confidence of winning readings
    votes:      int     # how many matching readings
    total:      int     # total valid readings in the window


@dataclass
class DisplayState:
    """Snapshot for HUD overlay – updated every frame."""
    status:      str    # 'IDLE' | 'VERIFYING' | 'CONFIRMED'
    plate:       str    # best candidate so far (may be empty)
    confidence:  float
    votes:       int
    needed:      int    # MIN_VOTES
    progress:    float  # 0.0 – 1.0


# ══════════════════════════════════════════════════════════════════════════
# Stabilizer
# ══════════════════════════════════════════════════════════════════════════

class PlateStabilizer:
    """
    Thread-safe accumulator that converts noisy per-frame OCR hits into
    confirmed, stable plate strings.

    Lifecycle per car_id:
      IDLE → (first valid reading arrives) → VERIFYING
           → (MIN_VOTES readings of same plate in BUFFER_WINDOW_SEC) → CONFIRMED
           → emits StabilizedPlate once → resets buffer
    """

    def __init__(self) -> None:
        self._buffers: dict[int | float, _Buffer] = {}

    # ── Public ────────────────────────────────────────────────────────

    def feed(
        self,
        car_id:     int | float,
        raw_text:   str,
        confidence: float,
        ts:         Optional[float] = None,
    ) -> Optional[StabilizedPlate]:
        """
        Submit a new OCR reading for `car_id`.

        Returns a StabilizedPlate the moment the plate is confirmed,
        or None while still accumulating.
        """
        if ts is None:
            ts = time.monotonic()

        # ── 1. Normalise ─────────────────────────────────────────────
        plate = normalise_plate(raw_text)
        if plate is None:
            return None                     # failed regex – discard

        # ── 2. Confidence gate ───────────────────────────────────────
        if confidence < MIN_CONFIDENCE:
            return None

        # ── 3. Get / create buffer ───────────────────────────────────
        buf = self._get_buf(car_id, ts)
        if buf.confirmed:
            # already confirmed this session – ignore further readings
            # (parking_manager cooldown handles the 30-s window)
            return None

        # ── 4. Fuzzy-group with existing readings ────────────────────
        seen_plates = list({r.plate for r in buf.readings})
        plate = _fuzzy_canonical(plate, seen_plates)

        buf.readings.append(_Reading(plate, confidence, ts))
        buf.last_seen = ts

        # Trim to window
        cutoff = ts - BUFFER_WINDOW_SEC
        buf.readings = [r for r in buf.readings if r.ts >= cutoff]
        if len(buf.readings) > MAX_BUFFER_SIZE:
            buf.readings = buf.readings[-MAX_BUFFER_SIZE:]

        # ── 5. Majority vote ─────────────────────────────────────────
        return self._try_confirm(buf, ts)

    def tick(self, ts: Optional[float] = None) -> None:
        """
        Call once per frame (even without OCR hits) to evict stale buffers.
        """
        if ts is None:
            ts = time.monotonic()
        stale = [cid for cid, b in self._buffers.items()
                 if ts - b.last_seen > BUFFER_TTL_SEC]
        for cid in stale:
            del self._buffers[cid]

    def get_state(self, car_id: int | float) -> DisplayState:
        """Current HUD state for a car_id (safe to call every frame)."""
        buf = self._buffers.get(car_id)
        if buf is None or not buf.readings:
            return DisplayState('IDLE', '', 0.0, 0, MIN_VOTES, 0.0)

        if buf.confirmed:
            avg_conf = self._avg_conf(buf.confirmed, buf.readings)
            return DisplayState('CONFIRMED', buf.confirmed,
                                avg_conf, MIN_VOTES, MIN_VOTES, 1.0)

        counter = Counter(r.plate for r in buf.readings)
        best_plate, best_votes = counter.most_common(1)[0]
        avg_conf = self._avg_conf(best_plate, buf.readings)
        progress = min(best_votes / MIN_VOTES, 1.0)
        return DisplayState('VERIFYING', best_plate, avg_conf,
                            best_votes, MIN_VOTES, progress)

    def reset(self, car_id: int | float) -> None:
        """Force-reset a car_id buffer (e.g. after check-in/out handled)."""
        self._buffers.pop(car_id, None)

    # ── Internal ──────────────────────────────────────────────────────

    def _get_buf(self, car_id: int | float, ts: float) -> _Buffer:
        if car_id not in self._buffers:
            self._buffers[car_id] = _Buffer(car_id=car_id, last_seen=ts)
        return self._buffers[car_id]

    def _try_confirm(self, buf: _Buffer, ts: float) -> Optional[StabilizedPlate]:
        if len(buf.readings) < MIN_VOTES:
            return None

        counter  = Counter(r.plate for r in buf.readings)
        best_plate, best_votes = counter.most_common(1)[0]

        if best_votes < MIN_VOTES:
            return None

        # Confirmed!
        buf.confirmed = best_plate
        avg_conf = self._avg_conf(best_plate, buf.readings)
        log.info(f'[Stabilizer] CONFIRMED car={buf.car_id}  '
                 f'plate={best_plate}  votes={best_votes}/{len(buf.readings)}  '
                 f'conf={avg_conf:.2f}')
        return StabilizedPlate(
            car_id=buf.car_id,
            plate=best_plate,
            confidence=avg_conf,
            votes=best_votes,
            total=len(buf.readings),
        )

    @staticmethod
    def _avg_conf(plate: str, readings: list[_Reading]) -> float:
        matching = [r.confidence for r in readings if r.plate == plate]
        return sum(matching) / len(matching) if matching else 0.0
