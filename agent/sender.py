import requests


BACKEND_URL = "http://localhost:3000"
SERVER_ID = "test-server"


def send_metrics(data):
    url = f"{BACKEND_URL}/servers/{SERVER_ID}/metrics"

    response = requests.post(
        url,
        json=data,
        timeout=10,
    )

    response.raise_for_status()

    return response.json()