import json

from cpu_reader import get_cpu_info
from memory_reader import get_memory_info
from disk_reader import get_disk_info


def collect_system_info():
    return {
        "cpu": get_cpu_info(),
        "memory": get_memory_info(),
        "disk": get_disk_info(),
    }


if __name__ == "__main__":
    data = collect_system_info()

    print(
        json.dumps(
            data,
            indent=2
        )
    )