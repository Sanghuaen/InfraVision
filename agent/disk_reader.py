
import psutil


def get_disk_info():
    # Keep the original C: drive summary
    disk = psutil.disk_usage("C:\\")

    # Collect information from all available partitions
    partitions = []

    for partition in psutil.disk_partitions(all=False):
        try:
            usage = psutil.disk_usage(partition.mountpoint)

            partitions.append({
                "device": partition.device,
                "mountpoint": partition.mountpoint,
                "filesystem": partition.fstype,
                "total": usage.total,
                "used": usage.used,
                "free": usage.free,
                "usage": usage.percent,
            })

        except (PermissionError, OSError):
            # Skip drives that cannot be accessed
            continue

    return {
        # Original fields for Dashboard compatibility
        "total": disk.total,
        "used": disk.used,
        "usage": disk.percent,

        # New detailed partition information
        "partitions": partitions,
    }
