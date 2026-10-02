#!/usr/bin/env python3
"""Generate decimal digits of pi with Chudnovsky binary splitting; no packages needed."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys
import time

if hasattr(sys, "set_int_max_str_digits"):
    sys.set_int_max_str_digits(0)

PREFIX = "14159265358979323846264338327950288419716939937510"
C3_OVER_24 = 640320 ** 3 // 24


def split(a, b):
    if b - a == 1:
        if a == 0:
            return 1, 1, 13591409
        p = (6 * a - 5) * (2 * a - 1) * (6 * a - 1)
        q = a ** 3 * C3_OVER_24
        t = p * (13591409 + 545140134 * a)
        return p, q, -t if a % 2 else t
    middle = (a + b) // 2
    p1, q1, t1 = split(a, middle)
    p2, q2, t2 = split(middle, b)
    return p1 * p2, q1 * q2, t1 * q2 + p1 * t2


def pi_digits(count):
    precision = count + 40
    _, q, t = split(0, precision // 14 + 1)
    scale = 10 ** precision
    root = math.isqrt(10005 * scale * scale)
    value = q * 426880 * root // t
    return str(value)[1:count + 1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--digits", type=int, default=1_000_000)
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "data/pi.txt")
    args = parser.parse_args()
    if not 1 <= args.digits <= 10_000_000:
        parser.error("--digits must be between 1 and 10000000")
    metadata_path = args.output.with_suffix(".json")
    if args.output.exists() and metadata_path.exists():
        content = args.output.read_text(encoding="ascii")
        metadata = json.loads(metadata_path.read_text())
        digest = hashlib.sha256(content.encode("ascii")).hexdigest()
        if len(content) == args.digits and metadata.get("digits") == args.digits and content.isascii() and content.isdigit() and content.startswith(PREFIX[:min(args.digits, len(PREFIX))]) and metadata.get("sha256") == digest:
            print(f"Verified existing {args.digits:,}-digit dataset ({digest}).")
            return
    started = time.monotonic()
    print(f"Computing {args.digits:,} digits of pi…", flush=True)
    content = pi_digits(args.digits)
    if len(content) != args.digits or not content.startswith(PREFIX[:min(args.digits, len(PREFIX))]):
        raise RuntimeError("Pi generation failed validation")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_suffix(".tmp")
    temporary.write_text(content, encoding="ascii")
    temporary.replace(args.output)
    metadata_path.write_text(json.dumps({"digits": args.digits, "sha256": hashlib.sha256(content.encode("ascii")).hexdigest(), "algorithm": "Chudnovsky binary splitting; 40 guard digits"}, indent=2) + "\n")
    print(f"Saved {args.digits:,} digits in {time.monotonic() - started:.1f}s.")


if __name__ == "__main__":
    main()
