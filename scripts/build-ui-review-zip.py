#!/usr/bin/env python3
import os
import sys
import zipfile


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: scripts/build-ui-review-zip.py <artifact_dir>", file=sys.stderr)
        return 1

    artifact_dir = sys.argv[1]
    if not os.path.isdir(artifact_dir):
        print(f"Artifact directory not found: {artifact_dir}", file=sys.stderr)
        return 1

    archive_path = f"{artifact_dir}.zip"
    with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(artifact_dir):
            for name in files:
                full_path = os.path.join(root, name)
                rel_path = os.path.relpath(full_path, os.path.dirname(artifact_dir))
                zf.write(full_path, rel_path)

    print(archive_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
