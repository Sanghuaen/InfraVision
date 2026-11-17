
import psutil
import socket


def get_network_info():
    interfaces = psutil.net_if_addrs()
    io_counters = psutil.net_io_counters(pernic=True)

    networks = []

    for interface, addresses in interfaces.items():
        ip_address = None
        mac_address = None

        for address in addresses:
            if address.family == socket.AF_INET:
                ip_address = address.address

            elif address.family == psutil.AF_LINK:
                mac_address = address.address

        stats = io_counters.get(interface)

        networks.append({
            "interface": interface,
            "ip_address": ip_address,
            "mac_address": mac_address,
            "bytes_sent": stats.bytes_sent if stats else 0,
            "bytes_recv": stats.bytes_recv if stats else 0,
            "packets_sent": stats.packets_sent if stats else 0,
            "packets_recv": stats.packets_recv if stats else 0,
        })

    return networks
