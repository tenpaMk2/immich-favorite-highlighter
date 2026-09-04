#!/usr/bin/env python3
"""Render toolbar icons: gold heart inside a gold thumbnail frame."""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BG = (17, 24, 39)
GOLD = (245, 196, 0)
SAMPLES = 4


def write_png(path: Path, width: int, height: int, rgba: bytes) -> None:
    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    raw = bytearray()
    for y in range(height):
        raw.append(0)
        start = y * width * 4
        raw.extend(rgba[start : start + width * 4])

    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )


def clamp01(value: float) -> float:
    return 0.0 if value < 0 else 1.0 if value > 1 else value


def mix(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    t = clamp01(t)
    return (
        int(round(a[0] + (b[0] - a[0]) * t)),
        int(round(a[1] + (b[1] - a[1]) * t)),
        int(round(a[2] + (b[2] - a[2]) * t)),
    )


def heart_coverage(x: float, y: float, size: float) -> float:
    nx = (x / size - 0.5) * 3.9
    ny = -((y / size - 0.53) * 3.9)
    value = (nx * nx + ny * ny - 1) ** 3 - nx * nx * ny * ny * ny
    return 1.0 if value <= 0 else 0.0


def rounded_box_sdf(x: float, y: float, size: float, inset: float, radius: float) -> float:
    half = size / 2 - inset
    dx = abs(x - size / 2) - (half - radius)
    dy = abs(y - size / 2) - (half - radius)
    return math.hypot(max(dx, 0.0), max(dy, 0.0)) + min(max(dx, dy), 0.0) - radius


def frame_coverage(x: float, y: float, size: float) -> float:
    inset = size * 0.1
    thickness = max(size * 0.075, 1.5)
    radius = size * 0.12
    return 1.0 if abs(rounded_box_sdf(x, y, size, inset, radius)) <= thickness / 2 else 0.0


def sample(x: float, y: float, size: float) -> tuple[int, int, int]:
    gold = max(heart_coverage(x, y, size), frame_coverage(x, y, size))
    return mix(BG, GOLD, gold)


def render(size: int) -> bytes:
    pixels = bytearray()
    step = 1.0 / SAMPLES
    for y in range(size):
        for x in range(size):
            acc = [0.0, 0.0, 0.0]
            for sy in range(SAMPLES):
                for sx in range(SAMPLES):
                    color = sample(x + (sx + 0.5) * step, y + (sy + 0.5) * step, size)
                    acc[0] += color[0]
                    acc[1] += color[1]
                    acc[2] += color[2]
            denom = SAMPLES * SAMPLES
            pixels.extend(
                (
                    int(round(acc[0] / denom)),
                    int(round(acc[1] / denom)),
                    int(round(acc[2] / denom)),
                    255,
                )
            )
    return bytes(pixels)


def main() -> None:
    for size in (16, 48, 128):
        write_png(ROOT / f"icon{size}.png", size, size, render(size))


if __name__ == "__main__":
    main()
