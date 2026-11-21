
import win32evtlog
import win32evtlogutil
import win32con
from datetime import datetime, timezone


LOG_CHANNELS = ["Application", "System"]
MAX_EVENTS = 50

# เก็บ Record ID ล่าสุดแยกตาม Channel
_last_record_ids = {}


def get_event_level(event_type):
    levels = {
        win32con.EVENTLOG_ERROR_TYPE: "error",
        win32con.EVENTLOG_WARNING_TYPE: "warning",
        win32con.EVENTLOG_INFORMATION_TYPE: "info",
        win32con.EVENTLOG_AUDIT_SUCCESS: "info",
        win32con.EVENTLOG_AUDIT_FAILURE: "warning",
    }

    return levels.get(event_type, "info")


def read_event_logs(channel, max_events=MAX_EVENTS):
    logs = []
    handle = None

    try:
        handle = win32evtlog.OpenEventLog(None, channel)

        flags = (
            win32evtlog.EVENTLOG_BACKWARDS_READ
            | win32evtlog.EVENTLOG_SEQUENTIAL_READ
        )

        events = win32evtlog.ReadEventLog(handle, flags, 0)

        if not events:
            return logs

        latest_record_id = _last_record_ids.get(channel)

        # รอบแรก: อ่าน Event ล่าสุดไม่เกิน max_events
        # รอบถัดไป: อ่านเฉพาะ Event ใหม่
        if latest_record_id is None:
            selected_events = events[:max_events]
        else:
            selected_events = [
                event for event in events
                if event.RecordNumber > latest_record_id
            ]

        new_record_ids = []

        for event in selected_events:
            try:
                source = event.SourceName
                event_id = event.EventID & 0xFFFF

                try:
                    message = win32evtlogutil.SafeFormatMessage(
                        event, channel
                    )
                except Exception:
                    message = "Unable to format event message"

                timestamp = datetime.fromtimestamp(
                    event.TimeGenerated.timestamp(),
                    tz=timezone.utc
                ).isoformat()

                logs.append({
                    "recordId": event.RecordNumber,
                    "timestamp": timestamp,
                    "level": get_event_level(event.EventType),
                    "source": source,
                    "eventId": event_id,
                    "channel": channel,
                    "message": message.strip(),
                })

                new_record_ids.append(event.RecordNumber)

            except Exception:
                continue

        if new_record_ids:
            _last_record_ids[channel] = max(new_record_ids)

    except Exception as error:
        print(f"Failed to read {channel} logs: {error}")

    finally:
        if handle:
            win32evtlog.CloseEventLog(handle)

    return logs


def get_windows_logs():
    logs = []

    for channel in LOG_CHANNELS:
        logs.extend(read_event_logs(channel))

    logs.sort(
        key=lambda item: item["timestamp"],
        reverse=True
    )

    return logs
