#!/usr/bin/env python3
"""Generate toolbar PNGs without third-party libraries."""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent


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


def clamp(value: float) -> int:
    return max(0, min(255, int(round(value))))


def mix(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return (
        clamp(a[0] + (b[0] - a[0]) * t),
        clamp(a[1] + (b[1] - a[1]) * t),
        clamp(a[2] + (b[2] - a[2]) * t),
    )


def rounded_rect_alpha(x: float, y: float, size: float, radius: float) -> float:
    half = size / 2
    ax = abs(x - half)
    ay = abs(y - half)
    inner = half - radius
    if ax <= inner and ay <= inner:
        return 1.0
    if ax <= inner:
        return 1.0 if ay <= half else 0.0
    if ay <= inner:
        return 1.0 if ax <= half else 0.0
    dx = ax - inner
    dy = ay - inner
    dist = math.hypot(dx, dy)
    return max(0.0, min(1.0, radius - dist + 0.5))


def point_in_triangle(
    px: float,
    py: float,
    ax: float,
    ay: float,
    bx: float,
    by: float,
    cx: float,
    cy: float,
) -> bool:
    v0x, v0y = cx - ax, cy - ay
    v1x, v1y = bx - ax, by - ay
    v2x, v2y = px - ax, py - ay
    dot00 = v0x * v0x + v0y * v0y
    dot01 = v0x * v1x + v0y * v1y
    dot02 = v0x * v2x + v0y * v2y
    dot11 = v1x * v1x + v1y * v1y
    dot12 = v1x * v2x + v1y * v2y
    denom = dot00 * dot11 - dot01 * dot01
    if denom == 0:
        return False
    u = (dot11 * dot02 - dot01 * dot12) / denom
    v = (dot00 * dot12 - dot01 * dot02) / denom
    return u >= 0 and v >= 0 and u + v <= 1


def heart_alpha(x: float, y: float, size: float) -> float:
    nx = x / size
    ny = y / size
    radius = 0.2
    left = math.hypot(nx - 0.36, ny - 0.4)
    right = math.hypot(nx - 0.64, ny - 0.4)
    inside = (
        left <= radius
        or right <= radius
        or point_in_triangle(nx, ny, 0.2, 0.46, 0.8, 0.46, 0.5, 0.86)
    )
    edge = min(abs(left - radius), abs(right - radius))
    if inside:
        return 1.0 if edge > 0.02 else 0.7
    return 0.0


def render(size: int) -> bytes:
    bg = (17, 24, 39)
    gold = (255, 221, 0)
    pixels = bytearray()
    radius = size * 0.22
    for y in range(size):
        for x in range(size):
            tile = rounded_rect_alpha(x + 0.5, y + 0.5, size, radius)
            heart = heart_alpha(x + 0.5, y + 0.5, size)
            color = mix(bg, gold, heart)
            alpha = clamp(tile * 255)
            pixels.extend((color[0], color[1], color[2], alpha))
    return bytes(pixels)


def main() -> None:
    for size in (16, 48, 128):
        write_png(ROOT / f"icon{size}.png", size, size, render(size))


if __name__ == "__main__":
    main()
