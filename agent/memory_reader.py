import psutil

def get_memory_info():
    memory = psutil.virtual_memory()

    return {
        "total": memory.total,
        "used": memory.used,
        "usage": memory.percent,
    }