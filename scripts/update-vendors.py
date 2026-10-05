#!/usr/bin/env python3
"""Generate an offline MA-L vendor table from a downloaded public IEEE CSV."""
import argparse
import csv
import hashlib
import json
from pathlib import Path

def generate(source: Path, destination: Path) -> None:
    vendors = {}
    with source.open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if not {"Registry", "Assignment", "Organization Name"}.issubset(reader.fieldnames or []):
            raise ValueError("Unexpected IEEE CSV columns")
        for row in reader:
            prefix = row["Assignment"].upper()
            name = " ".join(row["Organization Name"].split())
            if row["Registry"] != "MA-L" or len(prefix) != 6 or any(c not in "0123456789ABCDEF" for c in prefix):
                raise ValueError("Invalid MA-L prefix")
            if not name or len(name.encode("utf-8")) > 1024:
                raise ValueError("Invalid vendor name")
            if prefix in vendors and vendors[prefix] != name:
                name = ""
            vendors[prefix] = name if vendors.get(prefix) != "" else ""
    if not 10000 < len(vendors) < 100000:
        raise ValueError("Unexpected registry size")
    vendors = {prefix: name for prefix, name in vendors.items() if name}
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text("".join(f"{prefix}\t{vendors[prefix]}\n" for prefix in sorted(vendors)), encoding="utf-8")
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    metadata = {"source": "https://standards-oui.ieee.org/oui/oui.csv", "registry": "MA-L", "csv_sha256": digest, "entries": len(vendors)}
    destination.with_suffix(".json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    generate(args.source, args.destination)
