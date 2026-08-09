import psutil

def get_disk_info():
    disk = psutil.disk_usage("C:\\")

    return {
        "total": disk.total,
        "used": disk.used,
        "usage": disk.percent,
    }