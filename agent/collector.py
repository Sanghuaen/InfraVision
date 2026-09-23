
from cpu_reader import get_cpu_info
from memory_reader import get_memory_info
from disk_reader import get_disk_info
from process_reader import get_processes
from docker_reader import get_docker_containers
from sender import send_metrics

import platform
import socket
import json
from datetime import datetime, timezone


def collect_system_info():
    return {
        "agent": {
            "hostname": socket.gethostname(),
            "platform": platform.system(),
            "platform_version": platform.version(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },

        "cpu": get_cpu_info(),
        "memory": get_memory_info(),
        "disk": get_disk_info(),
        "processes": get_processes(),
        "docker": get_docker_containers(),
    }


if __name__ == "__main__":
    data = collect_system_info()

    print("=== Collected System Information ===")
    print(json.dumps(data, indent=2))

    print("\n=== Sending metrics to Backend ===")

    try:
        response = send_metrics(data)

        print("=== Backend Response ===")
        print(json.dumps(response, indent=2))

    except Exception as error:
        print("Failed to send metrics to Backend:")
        print(error)

