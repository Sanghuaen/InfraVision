import psutil


def get_processes(limit: int = 10):
    processes = []

    for process in psutil.process_iter(
        ["pid", "name", "username", "status", "cpu_percent", "memory_info"]
    ):
        try:
            info = process.info
            memory_info = info.get("memory_info")

            processes.append(
                {
                    "pid": info.get("pid"),
                    "name": info.get("name"),
                    "username": info.get("username"),
                    "status": info.get("status"),
                    "cpu_percent": info.get("cpu_percent") or 0,
                    "memory_mb": round(
                        memory_info.rss / (1024 * 1024), 2
                    )
                    if memory_info
                    else 0,
                }
            )

        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    processes.sort(
        key=lambda process: process["cpu_percent"],
        reverse=True,
    )

    return processes[:limit]