"""Thin command line over the pipeline steps.

uv run pipeline ingest --from ./downloads --year 2023 --category laptop
uv run pipeline benchmark --source local_csv --year 2023
"""

import argparse
from pathlib import Path

from pipeline import benchmark as bench
from pipeline import normalize, raw, settings
from pipeline.sources import LocalCsvSource


def cmd_ingest(args: argparse.Namespace) -> None:
    source = LocalCsvSource(Path(args.source_dir))
    path = raw.ingest(source, args.year, args.category)
    print(f"raw written: {path}")


def cmd_benchmark(args: argparse.Namespace) -> None:
    frame = raw.read_raw(args.source, args.year)
    normalized = normalize.normalize(frame)
    usable, rejected = normalize.split_usable(normalized)

    print(f"rows: {len(frame)}  usable: {len(usable)}  rejected: {len(rejected)}")
    if len(rejected):
        print(rejected["reject_reason"].value_counts(sort=True))

    normalized_path = raw.write_normalized(usable, args.source, args.year)
    print(f"normalized written: {normalized_path}")

    benchmarks = bench.run(usable, min_group_size=args.min_group_size)
    destination = settings.data_dir() / "benchmarks" / f"{args.source}-{args.year}.parquet"
    bench.write_benchmarks(benchmarks, destination)
    print(f"benchmarks written: {destination}  groups: {len(benchmarks)}")
    print(benchmarks)


def main() -> None:
    parser = argparse.ArgumentParser(prog="pipeline", description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    ingest = sub.add_parser("ingest", help="read a source and land raw Parquet")
    ingest.add_argument("--from", dest="source_dir", required=True, help="directory of CSV files")
    ingest.add_argument("--year", type=int, required=True)
    ingest.add_argument("--category", default=None, help="substring filter on item description")
    ingest.set_defaults(func=cmd_ingest)

    run = sub.add_parser("benchmark", help="normalize raw Parquet and compute benchmarks")
    run.add_argument("--source", default="local_csv")
    run.add_argument("--year", type=int, required=True)
    run.add_argument("--min-group-size", type=int, default=bench.DEFAULT_MIN_GROUP_SIZE)
    run.set_defaults(func=cmd_benchmark)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
