from cpu_reader import get_cpu_info
from memory_reader import get_memory_info
from disk_reader import get_disk_info


print("CPU")
print(get_cpu_info())

print("\nMemory")
print(get_memory_info())

print("\nDisk")
print(get_disk_info())