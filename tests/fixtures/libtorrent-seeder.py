#!/usr/bin/env python3
"""Deterministic localhost seeder used only by M07 integration tests."""

from __future__ import annotations

import pathlib
import signal
import sys
import time

import libtorrent as lt


if len(sys.argv) not in (4, 5):
    raise SystemExit("usage: libtorrent-seeder.py TORRENT DATA_ROOT RATE [CONNECT_FILE]")

torrent_path = pathlib.Path(sys.argv[1]).resolve(strict=True)
data_root = pathlib.Path(sys.argv[2]).resolve(strict=True)
rate = int(sys.argv[3])
connect_file = pathlib.Path(sys.argv[4]) if len(sys.argv) == 5 else None
session = lt.session(
    {
        "listen_interfaces": "127.0.0.1:0",
        "enable_dht": False,
        "enable_lsd": False,
        "enable_upnp": False,
        "enable_natpmp": False,
        "peer_fingerprint": "-UT0001-",
        "upload_rate_limit": rate,
        "ignore_limits_on_local_network": False,
        "alert_mask": int(lt.alert.category_t.all_categories),
    }
)
params = lt.load_torrent_file(str(torrent_path))
params.save_path = str(data_root)
params.flags |= lt.torrent_flags.seed_mode
params.flags &= ~lt.torrent_flags.paused
params.flags &= ~lt.torrent_flags.auto_managed
handle = session.add_torrent(params)
handle.set_upload_limit(rate)
stopping = False


def stop(_signal: int, _frame: object) -> None:
    global stopping
    stopping = True


signal.signal(signal.SIGTERM, stop)
signal.signal(signal.SIGINT, stop)
print(session.listen_port(), flush=True)
last_report = 0.0
connected_port = None
last_connect = 0.0
while not stopping and handle.is_valid():
    now = time.monotonic()
    if now - last_report >= 1:
        status = handle.status()
        print(
            f"seed={status.is_seeding} progress={status.progress:.3f} "
            f"peers={status.num_peers} upload={status.upload_rate}",
            file=sys.stderr,
            flush=True,
        )
        last_report = now
    if (
        connect_file
        and connect_file.is_file()
        and handle.status().num_peers == 0
        and now - last_connect >= 1
    ):
        connected_port = int(connect_file.read_text(encoding="utf-8").strip())
        last_connect = now
        print(f"connect={connected_port}", file=sys.stderr, flush=True)
        handle.connect_peer(
            ("127.0.0.1", connected_port), lt.tracker_source.source_client
        )
    for alert in session.pop_alerts():
        print(f"alert={alert.what()} {alert.message()}", file=sys.stderr, flush=True)
    time.sleep(0.1)
