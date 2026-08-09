import psutil

def get_cpu_info():
    return {
        "usage": psutil.cpu_percent(interval=1), # Get CPU usage percentage over a 1-second interval
        "cores": psutil.cpu_count(logical=True),
    }