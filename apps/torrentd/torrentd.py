#!/usr/bin/env python3
"""Ushark's isolated libtorrent inspection worker.

The process speaks bounded newline-delimited JSON over inherited stdio only. It
never opens an RPC listener and never logs magnets, host paths, or the startup
secret. Core remains the only process allowed to spawn and address it.
"""

from __future__ import annotations

import json
import datetime
import os
import pathlib
import sys
import threading
import time
import uuid
from typing import Any

import libtorrent as lt


PROTOCOL = "ushark-torrentd/1"
MAX_MESSAGE_BYTES = 1024 * 1024
MAX_FILES_PER_PAGE = 128
ALLOWED_METHODS = {
    "hello",
    "torrent.inspect",
    "operation.cancel",
    "operation.get",
    "operation.getFiles",
    "stream.describe",
    "stream.applySchedule",
    "stream.getDelivery",
    "stream.stop",
    "health.sample",
    "download.start",
    "download.status",
    "download.pause",
    "download.resume",
    "download.cancel",
    "download.setPriority",
    "download.configure",
    "download.removeData",
    "download.saveResume",
    "runtime.shutdown",
}
STREAM_MAX_ASSIGNMENTS = 8192
STREAM_ALLOWED_PRIORITIES = {0, 1, 3, 5, 7}
VIDEO_EXTENSIONS = {
    ".avi",
    ".m2ts",
    ".m4v",
    ".mkv",
    ".mov",
    ".mp4",
    ".mpeg",
    ".mpg",
    ".ts",
    ".webm",
    ".wmv",
}


class ProtocolError(Exception):
    def __init__(self, code: str, message: str, retryable: bool = False):
        super().__init__(message)
        self.code = code
        self.public_message = message
        self.retryable = retryable


class TorrentDaemon:
    def __init__(self) -> None:
        self.secret = os.environ.get("USHARK_TORRENTD_SECRET", "")
        data_root = os.environ.get("USHARK_TORRENTD_DATA_ROOT", "")
        import_root = os.environ.get("USHARK_TORRENTD_IMPORT_ROOT", "")
        self.data_root = pathlib.Path(data_root).resolve()
        self.import_root = pathlib.Path(import_root).resolve()
        if (
            len(self.secret) < 32
            or not data_root
            or not import_root
            or not self.data_root.is_absolute()
            or not self.import_root.is_absolute()
        ):
            raise RuntimeError("torrentd startup configuration is invalid")
        self.data_root.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.import_root.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.write_lock = threading.Lock()
        self.state_lock = threading.Lock()
        self.operations: dict[str, dict[str, Any]] = {}
        self.files: dict[str, list[dict[str, Any]]] = {}
        self.runtimes: dict[str, Any] = {}
        self.stream_schedules: dict[str, dict[str, Any]] = {}
        self.downloads: dict[str, dict[str, Any]] = {}
        self.download_limits = {"download": 8 * 1024 * 1024, "upload": 1024 * 1024}
        self.playback_active = False
        self.resume_root = self.data_root / "resume"
        self.resume_root.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.authenticated = False
        self.stopping = threading.Event()
        test_peer_endpoint = os.environ.get("USHARK_TORRENTD_TEST_PEER", "")
        session_settings = {
            "listen_interfaces": (
                "127.0.0.1:0" if test_peer_endpoint else "0.0.0.0:0,[::]:0"
            ),
            "enable_dht": True,
            "enable_lsd": not bool(test_peer_endpoint),
            "enable_upnp": False,
            "enable_natpmp": False,
        }
        if os.environ.get("USHARK_TORRENTD_ALLOW_LOOPBACK_TRACKERS") == "1":
            session_settings["ssrf_mitigation"] = False
        if test_peer_endpoint:
            # libtorrent's default peer id is deterministic in the isolated test
            # processes, so give the leecher its own client fingerprint.
            session_settings["peer_fingerprint"] = "-US0001-"
            session_settings["alert_mask"] = int(lt.alert.category_t.all_categories)
        self.session = lt.session(session_settings)

    def send(self, value: dict[str, Any]) -> None:
        encoded = json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode(
            "utf-8"
        )
        if len(encoded) > MAX_MESSAGE_BYTES:
            raise ProtocolError(
                "TORRENT_RPC_LIMIT", "A resposta do torrent excede o limite de IPC."
            )
        with self.write_lock:
            sys.stdout.buffer.write(encoded + b"\n")
            sys.stdout.buffer.flush()

    def response(
        self,
        request_id: str,
        *,
        value: Any | None = None,
        error: ProtocolError | None = None,
    ) -> None:
        envelope: dict[str, Any] = {
            "kind": "response",
            "protocolVersion": PROTOCOL,
            "requestId": request_id,
            "ok": error is None,
            "timestamp": int(time.time() * 1000),
        }
        if error is None:
            envelope["value"] = value
        else:
            envelope["error"] = {
                "code": error.code,
                "message": error.public_message,
                "recoverable": error.retryable,
                "retryable": error.retryable,
            }
        self.send(envelope)

    def event(self, operation_id: str, event_type: str) -> None:
        with self.state_lock:
            snapshot = dict(self.operations[operation_id])
        snapshot.pop("cancelRequested", None)
        self.send(
            {
                "kind": "event",
                "protocolVersion": PROTOCOL,
                "eventId": str(uuid.uuid4()),
                "operationId": operation_id,
                "correlationId": snapshot["correlationId"],
                "sequence": snapshot["sequence"],
                "type": event_type,
                "snapshot": snapshot,
                "timestamp": snapshot["updatedAt"],
            }
        )

    def update(self, operation_id: str, event_type: str, **changes: Any) -> None:
        with self.state_lock:
            current = self.operations[operation_id]
            current.update(changes)
            current["sequence"] += 1
            current["updatedAt"] = self.timestamp()
        self.event(operation_id, event_type)

    @staticmethod
    def timestamp() -> str:
        return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    @staticmethod
    def failure(code: str, message: str, retryable: bool) -> dict[str, Any]:
        return {
            "code": code,
            "message": message,
            "recoverable": retryable,
            "retryable": retryable,
        }

    @staticmethod
    def info_hash(torrent_info: Any) -> str:
        hashes = torrent_info.info_hashes()
        value = str(hashes.v1)
        if len(value) != 40:
            raise ProtocolError(
                "TORRENT_INPUT_INVALID",
                "M06 v1 exige um infoHash BitTorrent v1.",
            )
        return value.lower()

    @staticmethod
    def classify(name: str, size: int) -> str:
        lowered = name.lower().replace("_", " ").replace(".", " ")
        extension = pathlib.PurePosixPath(name).suffix.lower()
        if extension not in VIDEO_EXTENSIONS:
            return "other"
        if " sample " in f" {lowered} " or size < 50 * 1024 * 1024:
            return "sample"
        if any(token in lowered for token in ("extra", "featurette", "making of", "trailer")):
            return "extra"
        return "video"

    def normalize_files(self, torrent_info: Any) -> list[dict[str, Any]]:
        storage = torrent_info.files()
        piece_length = torrent_info.piece_length()
        result: list[dict[str, Any]] = []
        for index in range(storage.num_files()):
            file_path = storage.file_path(index).replace("\\", "/")
            size = int(storage.file_size(index))
            offset = int(storage.file_offset(index))
            kind = self.classify(file_path, size)
            result.append(
                {
                    "id": f"file:{index}",
                    "index": index,
                    "path": file_path,
                    "name": storage.file_name(index),
                    "extension": pathlib.PurePosixPath(file_path).suffix.lower(),
                    "sizeBytes": size,
                    "offsetBytes": offset,
                    "firstPiece": offset // piece_length if size else None,
                    "lastPiece": (offset + size - 1) // piece_length if size else None,
                    "kind": kind,
                    "selectable": kind == "video",
                }
            )
        return result

    def snapshot_from_metadata(
        self, operation_id: str, torrent_info: Any, input_type: str, input_label: str
    ) -> dict[str, Any]:
        info_hash = self.info_hash(torrent_info)
        files = self.normalize_files(torrent_info)
        self.files[operation_id] = files
        return {
            "state": "files-ready",
            "runtime": {"infoHash": info_hash, "torrentId": f"torrent:{info_hash}"},
            "displayName": torrent_info.name(),
            "totalFileCount": len(files),
            "files": files[:MAX_FILES_PER_PAGE],
            "filesComplete": len(files) <= MAX_FILES_PER_PAGE,
            "progress": {
                "phase": "classifying",
                "fileCount": len(files),
                "message": "Arquivos prontos para revisão.",
            },
            "inputType": input_type,
            "inputLabel": input_label,
        }

    def ensure_runtime(self, atp: Any, info_hash: str) -> Any:
        with self.state_lock:
            existing = self.runtimes.get(info_hash)
            if existing is not None and existing.is_valid():
                return existing
            resume_path = self.resume_root / f"{info_hash}.resume"
            if resume_path.is_file():
                try:
                    restored = lt.read_resume_data(resume_path.read_bytes())
                    if getattr(atp, "ti", None) is not None:
                        restored.ti = atp.ti
                    atp = restored
                except Exception:
                    invalid = resume_path.with_suffix(".resume.invalid")
                    try:
                        resume_path.replace(invalid)
                    except OSError:
                        pass
            atp.save_path = str(self.data_root)
            atp.storage_mode = lt.storage_mode_t.storage_mode_sparse
            atp.flags |= lt.torrent_flags.upload_mode
            handle = self.session.add_torrent(atp)
            self.runtimes[info_hash] = handle
            return handle

    def save_resume(self, info_hash: str, handle: Any) -> dict[str, Any]:
        if not handle.is_valid() or not handle.has_metadata():
            raise ProtocolError("DOWNLOAD_RESUME_INVALID", "A source ainda não possui estado para retomar.", True)
        handle.save_resume_data(lt.save_resume_flags_t.flush_disk_cache)
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            self.session.wait_for_alert(100)
            for alert in self.session.pop_alerts():
                if isinstance(alert, lt.save_resume_data_alert) and alert.handle == handle:
                    payload = bytes(lt.write_resume_data_buf(alert.params))
                    target = self.resume_root / f"{info_hash}.resume"
                    temporary = self.resume_root / f".{info_hash}.{uuid.uuid4().hex}.tmp"
                    temporary.write_bytes(payload)
                    os.chmod(temporary, 0o600)
                    temporary.replace(target)
                    return {"resumeVersion": 1, "saved": True, "bytes": len(payload)}
                if isinstance(alert, lt.save_resume_data_failed_alert) and alert.handle == handle:
                    raise ProtocolError("DOWNLOAD_RESUME_INVALID", "Não foi possível salvar o estado de retomada.", True)
        raise ProtocolError("DOWNLOAD_RESUME_INVALID", "O estado de retomada não ficou pronto a tempo.", True)

    def resolve_stream_file(self, payload: dict[str, Any]) -> tuple[str, Any, Any, int]:
        torrent_id = payload.get("torrentId")
        file_id = payload.get("fileId")
        if (
            not isinstance(torrent_id, str)
            or not torrent_id.startswith("torrent:")
            or len(torrent_id) != 48
            or any(character not in "0123456789abcdef" for character in torrent_id[8:])
            or not isinstance(file_id, str)
            or not file_id.startswith("file:")
            or not file_id[5:].isdigit()
        ):
            raise ProtocolError("STREAM_INVALID", "A source de streaming não é válida.")
        info_hash = torrent_id[8:]
        with self.state_lock:
            handle = self.runtimes.get(info_hash)
        if handle is None or not handle.is_valid() or not handle.has_metadata():
            raise ProtocolError(
                "STREAM_SOURCE_UNAVAILABLE",
                "A source não está pronta no runtime de torrent.",
                True,
            )
        torrent_info = handle.torrent_file()
        file_index = int(file_id[5:])
        if file_index < 0 or file_index >= torrent_info.num_files():
            raise ProtocolError("STREAM_FILE_MISSING", "O arquivo não foi encontrado.")
        storage = torrent_info.files()
        size = int(storage.file_size(file_index))
        if size <= 0:
            raise ProtocolError("STREAM_FILE_MISSING", "O arquivo está vazio.")
        return info_hash, handle, torrent_info, file_index

    def stream_description(self, payload: dict[str, Any]) -> dict[str, Any]:
        info_hash, handle, torrent_info, file_index = self.resolve_stream_file(payload)
        storage = torrent_info.files()
        size = int(storage.file_size(file_index))
        offset = int(storage.file_offset(file_index))
        piece_length = int(torrent_info.piece_length())
        first_piece = offset // piece_length
        last_piece = (offset + size - 1) // piece_length
        completed = 0
        piece_priority_counts: dict[str, int] = {}
        for piece in range(first_piece, last_piece + 1):
            if handle.have_piece(piece):
                completed += 1
            priority = str(int(handle.piece_priority(piece)))
            piece_priority_counts[priority] = piece_priority_counts.get(priority, 0) + 1
        file_priorities = [int(value) for value in handle.get_file_priorities()]
        status = handle.status()
        if os.environ.get("USHARK_TORRENTD_TEST_PEER"):
            for alert in self.session.pop_alerts():
                print(
                    f"torrentd-alert={alert.what()} {alert.message()}",
                    file=sys.stderr,
                    flush=True,
                )
        return {
            "torrentId": f"torrent:{info_hash}",
            "fileId": f"file:{file_index}",
            "fileIndex": file_index,
            "fileOffsetBytes": offset,
            "fileSizeBytes": size,
            "pieceLengthBytes": piece_length,
            "firstPiece": first_piece,
            "lastPiece": last_piece,
            "pieceCount": last_piece - first_piece + 1,
            "completedPieceCount": completed,
            "complete": completed == last_piece - first_piece + 1,
            "selectedFilePriority": file_priorities[file_index],
            "piecePriorityCounts": piece_priority_counts,
            "numPeers": int(status.num_peers),
            "downloadRateBytesPerSecond": int(status.download_rate),
            "totalWantedBytes": int(status.total_wanted),
            "totalWantedDoneBytes": int(status.total_wanted_done),
            "testPeerConfigured": os.environ.get("USHARK_TORRENTD_TEST_PEER", ""),
            "torrentFlags": int(handle.flags()),
            "torrentState": str(status.state),
            "listenPort": int(self.session.listen_port()),
        }

    def validate_stream_schedule(
        self, payload: dict[str, Any], torrent_info: Any, file_index: int
    ) -> dict[str, Any]:
        session_id = payload.get("streamSessionId")
        generation = payload.get("seekGeneration")
        schedule_sequence = payload.get("scheduleSequence", 0)
        mode = payload.get("mode")
        assignments = payload.get("assignments")
        cache = payload.get("cache")
        if (
            not isinstance(session_id, str)
            or not 0 < len(session_id) <= 160
            or not isinstance(generation, int)
            or isinstance(generation, bool)
            or generation < 0
            or not isinstance(schedule_sequence, int)
            or isinstance(schedule_sequence, bool)
            or schedule_sequence < 0
            or mode not in ("stream-only", "keep", "download")
            or not isinstance(assignments, list)
            or len(assignments) > STREAM_MAX_ASSIGNMENTS
            or not isinstance(cache, dict)
        ):
            raise ProtocolError("STREAM_INVALID", "O plano de streaming não é válido.")
        ram_bytes = cache.get("ramBytes")
        disk_bytes = cache.get("diskBytes")
        if (
            not isinstance(ram_bytes, int)
            or isinstance(ram_bytes, bool)
            or ram_bytes < 64 * 1024 * 1024
            or ram_bytes > 512 * 1024 * 1024
            or (mode == "stream-only" and disk_bytes != 512 * 1024 * 1024)
            or (mode != "stream-only" and disk_bytes is not None)
            or cache.get("activeProtected") is not True
            or cache.get("evictionAllowed") is not False
        ):
            raise ProtocolError("STREAM_INVALID", "O cache de streaming não é válido.")
        storage = torrent_info.files()
        size = int(storage.file_size(file_index))
        offset = int(storage.file_offset(file_index))
        piece_length = int(torrent_info.piece_length())
        first_piece = offset // piece_length
        last_piece = (offset + size - 1) // piece_length
        normalized: dict[int, dict[str, Any]] = {}
        for assignment in assignments:
            if not isinstance(assignment, dict):
                raise ProtocolError("STREAM_INVALID", "Uma prioridade de piece é inválida.")
            piece = assignment.get("piece")
            priority = assignment.get("priority")
            deadline = assignment.get("deadlineMs")
            if (
                not isinstance(piece, int)
                or isinstance(piece, bool)
                or piece < first_piece
                or piece > last_piece
                or not isinstance(priority, int)
                or isinstance(priority, bool)
                or priority not in STREAM_ALLOWED_PRIORITIES
                or not isinstance(deadline, int)
                or isinstance(deadline, bool)
                or deadline < 0
                or deadline > 300000
                or piece in normalized
            ):
                raise ProtocolError("STREAM_INVALID", "Uma prioridade de piece é inválida.")
            normalized[piece] = {"priority": priority, "deadlineMs": deadline}
            roles = assignment.get("roles", [])
            if not isinstance(roles, list) or any(
                not isinstance(role, str) or len(role) > 32 for role in roles
            ):
                raise ProtocolError("STREAM_INVALID", "Um papel de piece é inválido.")
            normalized[piece]["required"] = priority == 7
        return {
            "streamSessionId": session_id,
            "seekGeneration": generation,
            "scheduleSequence": schedule_sequence,
            "mode": mode,
            "fileIndex": file_index,
            "assignments": normalized,
            "cache": {"ramBytes": ram_bytes, "diskBytes": disk_bytes},
        }

    def reapply_stream_schedules(self, info_hash: str, handle: Any) -> None:
        with self.state_lock:
            schedules = [
                schedule
                for schedule in self.stream_schedules.values()
                if schedule["infoHash"] == info_hash
            ]
            downloads = [
                download
                for download in self.downloads.values()
                if download["infoHash"] == info_hash
                and download["state"] in ("queued", "downloading")
            ]
        torrent_info = handle.torrent_file()
        background = 1 if any(item["mode"] != "stream-only" for item in schedules) else 0
        file_priorities = [background] * torrent_info.num_files()
        for download in downloads:
            file_priorities[download["fileIndex"]] = max(
                file_priorities[download["fileIndex"]], 2 + download["priority"] * 2
            )
        for schedule in schedules:
            # Priority zero sends pieces to libtorrent's partfile. The selected
            # file needs a sparse on-disk path so MPV can consume completed ranges.
            file_priorities[schedule["fileIndex"]] = max(
                1, file_priorities[schedule["fileIndex"]]
            )
        aggregate: dict[int, dict[str, int]] = {}
        touched: set[int] = set()
        for schedule in schedules:
            touched.update(schedule.get("previousPieces", set()))
            for piece, assignment in schedule["assignments"].items():
                touched.add(piece)
                current = aggregate.get(piece)
                if current is None:
                    aggregate[piece] = dict(assignment)
                else:
                    current["priority"] = max(current["priority"], assignment["priority"])
                    current["deadlineMs"] = min(
                        current["deadlineMs"], assignment["deadlineMs"]
                    )
                    current["required"] = current["required"] or assignment["required"]
        handle.prioritize_files(file_priorities)
        priority_deadline = time.monotonic() + 0.5
        while [int(value) for value in handle.get_file_priorities()] != file_priorities:
            if time.monotonic() >= priority_deadline:
                raise ProtocolError(
                    "STREAM_TIMEOUT",
                    "As prioridades de arquivo não foram aplicadas a tempo.",
                    True,
                )
            time.sleep(0.005)
        piece_priorities = [background] * torrent_info.num_pieces()
        storage = torrent_info.files()
        piece_length = int(torrent_info.piece_length())
        for download in downloads:
            offset = int(storage.file_offset(download["fileIndex"]))
            size = int(storage.file_size(download["fileIndex"]))
            first = offset // piece_length
            last = (offset + size - 1) // piece_length
            for piece in range(first, last + 1):
                piece_priorities[piece] = max(
                    piece_priorities[piece], 2 + download["priority"] * 2
                )
        for piece, assignment in aggregate.items():
            piece_priorities[piece] = assignment["priority"]
        handle.prioritize_pieces(piece_priorities)
        priority_deadline = time.monotonic() + 0.5
        while any(
            int(handle.piece_priority(piece)) != priority
            for piece, priority in enumerate(piece_priorities)
        ):
            if time.monotonic() >= priority_deadline:
                raise ProtocolError(
                    "STREAM_TIMEOUT",
                    "As prioridades de streaming não foram aplicadas a tempo.",
                    True,
                )
            time.sleep(0.005)
        for piece in touched:
            handle.reset_piece_deadline(piece)
            assignment = aggregate.get(piece)
            if assignment is not None and assignment["priority"] == 7:
                handle.set_piece_deadline(piece, assignment["deadlineMs"])
        handle.unset_flags(
            lt.torrent_flags.upload_mode
            | lt.torrent_flags.paused
            | lt.torrent_flags.auto_managed
        )
        if not schedules and not downloads:
            handle.pause()
        test_peer = os.environ.get("USHARK_TORRENTD_TEST_PEER", "")
        if (
            handle.status().num_peers == 0
            and test_peer.startswith("127.0.0.1:")
            and test_peer[10:].isdigit()
        ):
            handle.connect_peer(
                ("127.0.0.1", int(test_peer[10:])),
                lt.tracker_source.source_client,
            )
        handle.force_reannounce()

    def apply_stream_schedule(self, payload: dict[str, Any]) -> dict[str, Any]:
        info_hash, handle, torrent_info, file_index = self.resolve_stream_file(payload)
        schedule = self.validate_stream_schedule(payload, torrent_info, file_index)
        session_id = schedule["streamSessionId"]
        with self.state_lock:
            previous = self.stream_schedules.get(session_id)
            if previous is not None:
                if previous["infoHash"] != info_hash or previous["fileIndex"] != file_index:
                    raise ProtocolError(
                        "STREAM_CONFLICT", "A sessão pertence a outra source."
                    )
                if schedule["seekGeneration"] < previous["seekGeneration"]:
                    return {
                        "streamSessionId": session_id,
                        "applied": False,
                        "stale": True,
                        "activeGeneration": previous["seekGeneration"],
                    }
                if schedule["seekGeneration"] == previous["seekGeneration"]:
                    if schedule["scheduleSequence"] < previous["scheduleSequence"]:
                        return {
                            "streamSessionId": session_id,
                            "applied": False,
                            "stale": True,
                            "activeGeneration": previous["seekGeneration"],
                        }
                    if (
                        schedule["scheduleSequence"] == previous["scheduleSequence"]
                        and schedule["mode"] == previous["mode"]
                        and schedule["assignments"] == previous["assignments"]
                        and schedule["cache"] == previous["cache"]
                    ):
                        return {
                            "streamSessionId": session_id,
                            "applied": False,
                            "replay": True,
                            "activeGeneration": previous["seekGeneration"],
                        }
                    if schedule["scheduleSequence"] == previous["scheduleSequence"]:
                        raise ProtocolError(
                            "STREAM_CONFLICT", "A revisão já possui outro plano."
                        )
            schedule["infoHash"] = info_hash
            schedule["previousPieces"] = (
                set(previous["assignments"]) if previous is not None else set()
            )
            self.stream_schedules[session_id] = schedule
        self.reapply_stream_schedules(info_hash, handle)
        return {
            "streamSessionId": session_id,
            "applied": True,
            "stale": False,
            "activeGeneration": schedule["seekGeneration"],
            "appliedPieceCount": len(schedule["assignments"]),
            "selectedFilePriority": 1,
            "otherFilePriority": 0 if schedule["mode"] == "stream-only" else 1,
            "cache": schedule["cache"],
            "activeProtected": True,
        }

    def stream_delivery(self, payload: dict[str, Any]) -> dict[str, Any]:
        session_id = payload.get("streamSessionId")
        if not isinstance(session_id, str) or not session_id:
            raise ProtocolError("STREAM_INVALID", "A sessão de streaming não é válida.")
        with self.state_lock:
            schedule = self.stream_schedules.get(session_id)
        if schedule is None:
            raise ProtocolError("STREAM_NOT_FOUND", "A sessão não foi encontrada.")
        handle = self.runtimes.get(schedule["infoHash"])
        if handle is None or not handle.is_valid():
            raise ProtocolError(
                "STREAM_SOURCE_UNAVAILABLE", "A source não está disponível.", True
            )
        required = [
            piece
            for piece, assignment in schedule["assignments"].items()
            if assignment["required"]
        ]
        completed = sum(1 for piece in required if handle.have_piece(piece))
        torrent_info = handle.torrent_file()
        relative_path = torrent_info.files().file_path(schedule["fileIndex"]).replace(
            "\\", "/"
        )
        candidate = (self.data_root / pathlib.PurePosixPath(relative_path)).resolve()
        try:
            candidate.relative_to(self.data_root)
            contained = True
        except ValueError:
            contained = False
        if not contained:
            raise ProtocolError("STREAM_FILE_MISSING", "O delivery não é válido.")
        ready = len(required) > 0 and completed == len(required) and candidate.is_file()
        return {
            "streamSessionId": session_id,
            "seekGeneration": schedule["seekGeneration"],
            "ready": ready,
            "requiredPieceCount": len(required),
            "completedRequiredPieceCount": completed,
            "relativePath": relative_path if candidate.is_file() else None,
        }

    def health_sample(self, payload: dict[str, Any]) -> dict[str, Any]:
        info_hash, handle, torrent_info, file_index = self.resolve_stream_file(payload)
        storage = torrent_info.files()
        size = int(storage.file_size(file_index))
        offset = int(storage.file_offset(file_index))
        piece_length = int(torrent_info.piece_length())
        file_first = offset // piece_length
        file_last = (offset + size - 1) // piece_length
        first_piece = payload.get("wantedFirstPiece", file_first)
        last_piece = payload.get("wantedLastPiece", file_last)
        if (
            not isinstance(first_piece, int)
            or isinstance(first_piece, bool)
            or not isinstance(last_piece, int)
            or isinstance(last_piece, bool)
            or first_piece < file_first
            or last_piece > file_last
            or last_piece < first_piece
            or last_piece - first_piece + 1 > STREAM_MAX_ASSIGNMENTS
        ):
            raise ProtocolError("STREAM_INVALID", "A janela de Health não é válida.")
        availability = list(handle.piece_availability())
        wanted = [
            int(availability[piece]) for piece in range(first_piece, last_piece + 1)
        ]
        ordered = sorted(wanted)
        median = (
            float(ordered[len(ordered) // 2])
            if len(ordered) % 2 == 1
            else (ordered[len(ordered) // 2 - 1] + ordered[len(ordered) // 2])
            / 2
        )
        useful = 0
        for peer in handle.get_peer_info():
            if any(
                bool(peer.pieces[piece])
                for piece in range(first_piece, last_piece + 1)
            ):
                useful += 1
        status = handle.status()
        return {
            "torrentId": f"torrent:{info_hash}",
            "fileId": f"file:{file_index}",
            "observedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "downloadThroughputBytesPerSecond": int(status.download_rate),
            "connectedPeers": int(status.num_peers),
            "usefulPeers": useful,
            "wantedPieceAvailabilityMinimum": min(wanted),
            "wantedPieceAvailabilityMedian": median,
            "wantedPiecesAvailableRatio": sum(1 for value in wanted if value > 0)
            / len(wanted),
            "wantedPieceCount": len(wanted),
            "completedLocal": all(
                handle.have_piece(piece) for piece in range(file_first, file_last + 1)
            ),
        }

    def download_snapshot(self, download_id: str) -> dict[str, Any]:
        with self.state_lock:
            download = self.downloads.get(download_id)
        if download is None:
            raise ProtocolError("DOWNLOAD_NOT_FOUND", "O download não foi encontrado.")
        handle = self.runtimes.get(download["infoHash"])
        if handle is None or not handle.is_valid() or not handle.has_metadata():
            raise ProtocolError("DOWNLOAD_SOURCE_UNAVAILABLE", "A source do download não está disponível.", True)
        torrent_info = handle.torrent_file()
        size = int(torrent_info.files().file_size(download["fileIndex"]))
        progress = list(handle.file_progress())[download["fileIndex"]]
        status = handle.status()
        state = download["state"]
        if progress >= size and state not in ("cancelled", "paused"):
            state = "complete"
            with self.state_lock:
                download["state"] = state
        error_message = (
            str(status.errc.message())
            if status.errc is not None and int(status.errc.value()) != 0
            else ""
        )
        error = None
        if error_message:
            code = "DOWNLOAD_DISK_FULL" if "space" in error_message.lower() else "DOWNLOAD_SOURCE_UNAVAILABLE"
            error = {"code": code, "message": "Sem espaço: escrita pausada." if code == "DOWNLOAD_DISK_FULL" else "A transferência foi interrompida.", "recoverable": True, "retryable": True}
            state = "error"
            handle.pause()
            with self.state_lock:
                download["state"] = state
        return {
            "downloadId": download_id,
            "torrentId": f"torrent:{download['infoHash']}",
            "fileId": f"file:{download['fileIndex']}",
            "state": state,
            "bytesCompleted": int(progress),
            "bytesTotal": size,
            "downloadRateBytesPerSecond": int(status.download_rate) if state == "downloading" else 0,
            "connectedPeers": int(status.num_peers),
            "priority": download["priority"],
            "playbackYielding": self.playback_active,
            "error": error,
        }

    def download_start(self, payload: dict[str, Any]) -> dict[str, Any]:
        download_id = payload.get("downloadId")
        priority = payload.get("priority", 1)
        if not isinstance(download_id, str) or not 0 < len(download_id) <= 160 or priority not in (0, 1, 2):
            raise ProtocolError("DOWNLOAD_INVALID", "O download não é válido.")
        info_hash, handle, _torrent_info, file_index = self.resolve_stream_file(payload)
        with self.state_lock:
            previous = self.downloads.get(download_id)
            if previous is not None and (previous["infoHash"] != info_hash or previous["fileIndex"] != file_index):
                raise ProtocolError("DOWNLOAD_CONFLICT", "O download pertence a outra source.")
            self.downloads[download_id] = {"infoHash": info_hash, "fileIndex": file_index, "priority": priority, "state": "downloading"}
        self.reapply_stream_schedules(info_hash, handle)
        return self.download_snapshot(download_id)

    def download_command(self, payload: dict[str, Any], action: str) -> dict[str, Any]:
        download_id = payload.get("downloadId")
        if not isinstance(download_id, str):
            raise ProtocolError("DOWNLOAD_INVALID", "O comando de download não é válido.")
        with self.state_lock:
            download = self.downloads.get(download_id)
            if download is None:
                raise ProtocolError("DOWNLOAD_NOT_FOUND", "O download não foi encontrado.")
            if action == "pause" and download["state"] not in ("complete", "cancelled"):
                download["state"] = "paused"
            elif action == "resume" and download["state"] != "complete":
                download["state"] = "downloading"
            elif action == "cancel" and download["state"] != "complete":
                download["state"] = "cancelled"
        handle = self.runtimes.get(download["infoHash"])
        if handle is not None and handle.is_valid():
            self.reapply_stream_schedules(download["infoHash"], handle)
            if action == "pause":
                self.save_resume(download["infoHash"], handle)
        return self.download_snapshot(download_id)

    def download_set_priority(self, payload: dict[str, Any]) -> dict[str, Any]:
        download_id = payload.get("downloadId")
        priority = payload.get("priority")
        if not isinstance(download_id, str) or priority not in (0, 1, 2):
            raise ProtocolError("DOWNLOAD_INVALID", "A prioridade não é válida.")
        with self.state_lock:
            download = self.downloads.get(download_id)
            if download is None:
                raise ProtocolError("DOWNLOAD_NOT_FOUND", "O download não foi encontrado.")
            download["priority"] = priority
        handle = self.runtimes.get(download["infoHash"])
        if handle is not None and handle.is_valid():
            self.reapply_stream_schedules(download["infoHash"], handle)
        return self.download_snapshot(download_id)

    def download_configure(self, payload: dict[str, Any]) -> dict[str, Any]:
        download = payload.get("downloadLimitBytesPerSecond")
        upload = payload.get("uploadLimitBytesPerSecond")
        playback = payload.get("playbackActive", False)
        if any(not isinstance(value, int) or isinstance(value, bool) or value < 0 or value > 1024 * 1024 * 1024 for value in (download, upload)) or not isinstance(playback, bool):
            raise ProtocolError("DOWNLOAD_INVALID", "Os limites de rede não são válidos.")
        self.download_limits = {"download": download, "upload": upload}
        self.playback_active = playback
        effective_download = download // 4 if playback and download > 0 else download
        self.session.apply_settings({"download_rate_limit": effective_download, "upload_rate_limit": upload})
        return {"downloadLimitBytesPerSecond": download, "uploadLimitBytesPerSecond": upload, "effectiveDownloadLimitBytesPerSecond": effective_download, "playbackActive": playback}

    def download_remove_data(self, payload: dict[str, Any]) -> dict[str, Any]:
        download_id = payload.get("downloadId")
        if payload.get("confirmed") is not True or not isinstance(download_id, str):
            raise ProtocolError("DOWNLOAD_INVALID", "A remoção de dados exige confirmação explícita.")
        with self.state_lock:
            download = self.downloads.get(download_id)
            if download is None:
                raise ProtocolError("DOWNLOAD_NOT_FOUND", "O download não foi encontrado.")
            busy_stream = any(item["infoHash"] == download["infoHash"] for item in self.stream_schedules.values())
            other_download = any(key != download_id and item["infoHash"] == download["infoHash"] and item["state"] not in ("cancelled", "complete") for key, item in self.downloads.items())
            if busy_stream or other_download:
                raise ProtocolError("DOWNLOAD_CONFLICT", "Os dados estão protegidos por outra operação ativa.", True)
            self.downloads.pop(download_id)
        handle = self.runtimes.pop(download["infoHash"], None)
        if handle is not None and handle.is_valid():
            self.session.remove_torrent(handle, lt.options_t.delete_files)
        resume_path = self.resume_root / f"{download['infoHash']}.resume"
        try:
            resume_path.unlink()
        except FileNotFoundError:
            pass
        return {"downloadId": download_id, "removed": True}

    def stop_stream(self, payload: dict[str, Any]) -> dict[str, Any]:
        session_id = payload.get("streamSessionId")
        generation = payload.get("seekGeneration")
        if (
            not isinstance(session_id, str)
            or not session_id
            or not isinstance(generation, int)
            or isinstance(generation, bool)
            or generation < 0
        ):
            raise ProtocolError("STREAM_INVALID", "O stop de streaming não é válido.")
        with self.state_lock:
            schedule = self.stream_schedules.get(session_id)
            if schedule is None:
                return {"streamSessionId": session_id, "stopped": False}
            if schedule["seekGeneration"] != generation:
                raise ProtocolError(
                    "STREAM_CONFLICT", "A geração de streaming não é a atual."
                )
            removed = self.stream_schedules.pop(session_id)
        handle = self.runtimes.get(removed["infoHash"])
        if handle is not None and handle.is_valid():
            self.reapply_stream_schedules(removed["infoHash"], handle)
            with self.state_lock:
                remaining_pieces = {
                    piece
                    for item in self.stream_schedules.values()
                    if item["infoHash"] == removed["infoHash"]
                    for piece in item["assignments"]
                }
            background = 1 if removed["mode"] != "stream-only" else 0
            for piece in removed["assignments"]:
                if piece in remaining_pieces:
                    continue
                handle.reset_piece_deadline(piece)
                handle.piece_priority(piece, background)
        return {"streamSessionId": session_id, "stopped": True}

    def inspect_file(self, operation_id: str, payload: dict[str, Any]) -> None:
        candidate = payload.get("path")
        if not isinstance(candidate, str) or not pathlib.Path(candidate).is_absolute():
            raise ProtocolError("TORRENT_PATH_REJECTED", "O path gerenciado não é válido.")
        candidate_path = pathlib.Path(candidate)
        try:
            lexical_relative = candidate_path.relative_to(self.import_root)
        except ValueError as error:
            raise ProtocolError(
                "TORRENT_PATH_REJECTED", "O arquivo está fora do staging gerenciado."
            ) from error
        current = self.import_root
        for component in lexical_relative.parts:
            current = current / component
            if current.is_symlink():
                raise ProtocolError(
                    "TORRENT_PATH_REJECTED", "Symlink não é permitido no staging."
                )
        resolved = candidate_path.resolve(strict=True)
        try:
            resolved.relative_to(self.import_root)
        except ValueError as error:
            raise ProtocolError(
                "TORRENT_PATH_REJECTED", "O arquivo está fora do staging gerenciado."
            ) from error
        if not resolved.is_file() or resolved.suffix.lower() != ".torrent":
            raise ProtocolError(
                "TORRENT_PATH_REJECTED", "O arquivo gerenciado não é válido."
            )
        atp = lt.load_torrent_file(str(resolved))
        torrent_info = atp.ti
        info_hash = self.info_hash(torrent_info)
        handle = self.ensure_runtime(atp, info_hash)
        handle.prioritize_files([0] * torrent_info.num_files())
        changes = self.snapshot_from_metadata(
            operation_id, torrent_info, "torrent-file", payload["inputLabel"]
        )
        self.update(operation_id, "inspection.files-ready", **changes)

    def inspect_magnet(self, operation_id: str, payload: dict[str, Any]) -> None:
        magnet = payload.get("magnet")
        if not isinstance(magnet, str) or len(magnet.encode("utf-8")) > 4096:
            raise ProtocolError("TORRENT_INPUT_INVALID", "O magnet não é válido.")
        atp = lt.parse_magnet_uri(magnet)
        hashes = atp.info_hashes
        info_hash = str(hashes.v1).lower()
        if len(info_hash) != 40:
            raise ProtocolError(
                "TORRENT_INPUT_INVALID", "M06 v1 exige um infoHash BitTorrent v1."
            )
        handle = self.ensure_runtime(atp, info_hash)
        started = time.monotonic()
        soft_timeout = max(0.1, min(float(payload.get("softTimeoutMs", 5000)) / 1000, 30))
        hard_timeout = max(
            soft_timeout, min(float(payload.get("hardTimeoutMs", 30000)) / 1000, 120)
        )
        warned = False
        while not handle.has_metadata():
            with self.state_lock:
                cancelled = self.operations[operation_id].get("cancelRequested", False)
            if cancelled:
                self.update(
                    operation_id,
                    "inspection.cancelled",
                    state="cancelled",
                    failure=self.failure(
                        "TORRENT_CANCELLED", "A inspeção foi cancelada.", False
                    ),
                    progress=None,
                )
                return
            elapsed = time.monotonic() - started
            status = handle.status()
            if not warned and elapsed >= soft_timeout:
                warned = True
                self.update(
                    operation_id,
                    "inspection.metadata-waiting",
                    progress={
                        "phase": "metadata",
                        "discoveredPeers": int(status.num_peers),
                        "usefulPeers": 0,
                        "message": "A metadata está demorando; a tentativa pode ser salva.",
                    },
                )
            if elapsed >= hard_timeout:
                self.update(
                    operation_id,
                    "inspection.failed",
                    state="failed",
                    failure=self.failure(
                        "TORRENT_METADATA_TIMEOUT",
                        "A metadata não chegou no tempo limite. Salve para tentar depois.",
                        True,
                    ),
                    progress=None,
                )
                return
            time.sleep(0.1)
        torrent_info = handle.torrent_file()
        handle.prioritize_files([0] * torrent_info.num_files())
        changes = self.snapshot_from_metadata(
            operation_id, torrent_info, "magnet", payload["inputLabel"]
        )
        self.update(operation_id, "inspection.files-ready", **changes)

    def inspect_worker(self, operation_id: str, payload: dict[str, Any]) -> None:
        try:
            self.update(
                operation_id,
                "inspection.metadata-waiting",
                state="resolving-metadata",
                progress={
                    "phase": "metadata",
                    "message": "Resolvendo metadata no runtime isolado.",
                },
            )
            input_type = payload.get("type")
            if input_type == "torrent-file":
                self.inspect_file(operation_id, payload)
            elif input_type == "magnet":
                self.inspect_magnet(operation_id, payload)
            else:
                raise ProtocolError("TORRENT_INPUT_INVALID", "A entrada não é suportada.")
        except ProtocolError as error:
            self.update(
                operation_id,
                "inspection.failed",
                state="failed",
                failure=self.failure(error.code, error.public_message, error.retryable),
                progress=None,
            )
        except Exception:
            self.update(
                operation_id,
                "inspection.failed",
                state="failed",
                failure=self.failure(
                    "TORRENT_DAEMON_UNAVAILABLE",
                    "O runtime de torrent não conseguiu concluir a inspeção.",
                    True,
                ),
                progress=None,
            )

    def handle(self, request: dict[str, Any]) -> Any:
        if request.get("secret") != self.secret:
            raise ProtocolError("TORRENT_UNAUTHORIZED", "Canal torrent não autorizado.")
        method = request.get("method")
        if method not in ALLOWED_METHODS:
            raise ProtocolError("TORRENT_UNAUTHORIZED", "Método torrent não permitido.")
        if method == "hello":
            supported = request.get("payload", {}).get("supportedProtocols", [])
            if PROTOCOL not in supported:
                raise ProtocolError(
                    "TORRENT_PROTOCOL_UNSUPPORTED",
                    "Core e torrentd não possuem protocolo compatível.",
                )
            self.authenticated = True
            return {
                "server": "torrentd",
                "serverVersion": "1",
                "libtorrentVersion": str(lt.version),
                "selectedProtocol": PROTOCOL,
                "capabilities": [
                    "magnet-metadata",
                    "torrent-file-metadata",
                    "operation-cancel",
                    "runtime-rebind",
                    "piece-scheduler",
                    "sparse-storage",
                    "partial-file-delivery",
                    "generation-cancel",
                    "download-manager",
                    "resume-data-v1",
                    "network-rate-limits",
                ],
            }
        if not self.authenticated or request.get("protocolVersion") != PROTOCOL:
            raise ProtocolError(
                "TORRENT_PROTOCOL_UNSUPPORTED", "O handshake do torrentd é obrigatório."
            )
        payload = request.get("payload")
        if not isinstance(payload, dict):
            raise ProtocolError("TORRENT_INPUT_INVALID", "Payload torrent inválido.")
        if method == "torrent.inspect":
            operation_id = payload.get("operationId")
            correlation_id = payload.get("correlationId")
            input_label = payload.get("inputLabel")
            if not all(
                isinstance(item, str) and 0 < len(item) <= 160
                for item in (operation_id, correlation_id)
            ) or not isinstance(input_label, str):
                raise ProtocolError("TORRENT_INPUT_INVALID", "Identidades inválidas.")
            with self.state_lock:
                if operation_id in self.operations:
                    return self.operations[operation_id]
                snapshot = {
                    "schemaVersion": 1,
                    "operationId": operation_id,
                    "correlationId": correlation_id,
                    "sequence": 0,
                    "state": "created",
                    "inputType": payload.get("type"),
                    "inputLabel": input_label,
                    "totalFileCount": 0,
                    "files": [],
                    "filesComplete": True,
                    "progress": {"phase": "validating", "message": "Entrada recebida."},
                    "updatedAt": self.timestamp(),
                    "cancelRequested": False,
                }
                self.operations[operation_id] = snapshot
            threading.Thread(
                target=self.inspect_worker,
                args=(operation_id, payload),
                name=f"inspect-{operation_id[:8]}",
                daemon=True,
            ).start()
            public = dict(snapshot)
            public.pop("cancelRequested", None)
            return public
        if method == "operation.cancel":
            operation_id = payload.get("operationId")
            with self.state_lock:
                snapshot = self.operations.get(operation_id)
                if snapshot is None:
                    return {"operationId": operation_id, "status": "not-found"}
                if snapshot["state"] in ("files-ready", "completed", "failed", "cancelled"):
                    return {"operationId": operation_id, "status": "already-completed"}
                snapshot["cancelRequested"] = True
            return {"operationId": operation_id, "status": "cancelled"}
        if method == "operation.get":
            operation_id = payload.get("operationId")
            with self.state_lock:
                snapshot = self.operations.get(operation_id)
                if snapshot is None:
                    raise ProtocolError("TORRENT_NOT_FOUND", "A operação não foi encontrada.")
                public = dict(snapshot)
            public.pop("cancelRequested", None)
            return public
        if method == "operation.getFiles":
            operation_id = payload.get("operationId")
            cursor = payload.get("cursor", 0)
            limit = payload.get("limit", MAX_FILES_PER_PAGE)
            if not isinstance(cursor, int) or cursor < 0 or not isinstance(limit, int):
                raise ProtocolError("TORRENT_INPUT_INVALID", "A página de arquivos é inválida.")
            limit = min(max(limit, 1), MAX_FILES_PER_PAGE)
            with self.state_lock:
                files = self.files.get(operation_id)
                if files is None:
                    raise ProtocolError("TORRENT_NOT_FOUND", "Os arquivos não estão disponíveis.")
                page = files[cursor : cursor + limit]
            next_cursor = cursor + len(page)
            return {
                "operationId": operation_id,
                "files": page,
                "nextCursor": next_cursor if next_cursor < len(files) else None,
                "total": len(files),
            }
        if method == "stream.describe":
            return self.stream_description(payload)
        if method == "stream.applySchedule":
            return self.apply_stream_schedule(payload)
        if method == "stream.getDelivery":
            return self.stream_delivery(payload)
        if method == "stream.stop":
            return self.stop_stream(payload)
        if method == "health.sample":
            return self.health_sample(payload)
        if method == "download.start":
            return self.download_start(payload)
        if method == "download.status":
            return self.download_snapshot(payload.get("downloadId"))
        if method == "download.pause":
            return self.download_command(payload, "pause")
        if method == "download.resume":
            return self.download_command(payload, "resume")
        if method == "download.cancel":
            return self.download_command(payload, "cancel")
        if method == "download.setPriority":
            return self.download_set_priority(payload)
        if method == "download.configure":
            return self.download_configure(payload)
        if method == "download.removeData":
            return self.download_remove_data(payload)
        if method == "download.saveResume":
            download_id = payload.get("downloadId")
            with self.state_lock:
                download = self.downloads.get(download_id)
            if download is None:
                raise ProtocolError("DOWNLOAD_NOT_FOUND", "O download não foi encontrado.")
            return self.save_resume(download["infoHash"], self.runtimes[download["infoHash"]])
        if method == "runtime.shutdown":
            for info_hash, handle in list(self.runtimes.items()):
                try:
                    self.save_resume(info_hash, handle)
                except ProtocolError:
                    pass
            self.stopping.set()
            return {"stopping": True}
        raise ProtocolError("TORRENT_UNAUTHORIZED", "Método torrent não permitido.")

    def run(self) -> None:
        while not self.stopping.is_set():
            raw = sys.stdin.buffer.readline(MAX_MESSAGE_BYTES + 1)
            if not raw:
                break
            request_id = "unknown"
            try:
                if len(raw) > MAX_MESSAGE_BYTES or not raw.endswith(b"\n"):
                    raise ProtocolError(
                        "TORRENT_RPC_LIMIT", "A mensagem excede o limite de IPC."
                    )
                request = json.loads(raw)
                if not isinstance(request, dict):
                    raise ProtocolError("TORRENT_INPUT_INVALID", "Envelope RPC inválido.")
                request_id = request.get("requestId", "unknown")
                if not isinstance(request_id, str) or not request_id:
                    raise ProtocolError("TORRENT_INPUT_INVALID", "requestId inválido.")
                value = self.handle(request)
                self.response(request_id, value=value)
            except ProtocolError as error:
                self.response(request_id, error=error)
            except Exception:
                self.response(
                    request_id,
                    error=ProtocolError(
                        "TORRENT_DAEMON_UNAVAILABLE",
                        "O runtime de torrent rejeitou a solicitação.",
                        True,
                    ),
                )


if __name__ == "__main__":
    TorrentDaemon().run()
