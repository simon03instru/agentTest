#!/usr/bin/env python3
import argparse
import json
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from chatbot.cognee_client import add_documents, cognify


def parse_args():
    parser = argparse.ArgumentParser(
        description="Ingest markdown/text files into Cognee and run cognify."
    )
    parser.add_argument(
        "--dataset",
        default=os.getenv("COGNEE_DATASET", "station_knowledge"),
        help="Cognee dataset name (default: COGNEE_DATASET or station_knowledge).",
    )
    parser.add_argument(
        "--glob",
        dest="pattern",
        default="knowledge/**/*.{md,txt}",
        help="Glob pattern for knowledge files (default: knowledge/**/*.{md,txt}).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only print matched files and payload preview.",
    )
    return parser.parse_args()


def discover_files(pattern: str) -> list[Path]:
    root = Path.cwd()
    # Path.glob does not support brace expansion reliably, so we support md/txt explicitly.
    if "{md,txt}" in pattern:
        md_pattern = pattern.replace("{md,txt}", "md")
        txt_pattern = pattern.replace("{md,txt}", "txt")
        files = list(root.glob(md_pattern)) + list(root.glob(txt_pattern))
    else:
        files = list(root.glob(pattern))
    return sorted([f for f in files if f.is_file()])


def main():
    args = parse_args()
    files = discover_files(args.pattern)

    if not files:
        print(f"No files found for pattern: {args.pattern}")
        return

    file_paths = [str(path) for path in files]
    print(f"Discovered {len(file_paths)} files for dataset '{args.dataset}'.")

    if args.dry_run:
        print("Dry-run files:")
        for path in file_paths[:10]:
            print(f"- {path}")
        if len(file_paths) > 10:
            print(f"... and {len(file_paths) - 10} more")
        return

    add_result = add_documents(file_paths, dataset=args.dataset)
    print("Add result:", json.dumps(add_result, ensure_ascii=False))

    cognify_result = cognify(dataset=args.dataset)
    print("Cognify result:", json.dumps(cognify_result, ensure_ascii=False))


if __name__ == "__main__":
    main()
