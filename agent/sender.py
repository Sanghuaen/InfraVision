
import os
import requests


# Backend configuration
BACKEND_URL = os.getenv(
    "INFRAVISION_BACKEND_URL",
    "http://localhost:3000",
).rstrip("/")

# Unique ID for each monitored machine
SERVER_ID = os.getenv(
    "INFRAVISION_SERVER_ID",
    "test-server",
)


def send_metrics(data):
    url = f"{BACKEND_URL}/servers/{SERVER_ID}/metrics"

    try:
        response = requests.post(
            url,
            json=data,
            timeout=(5, 10),
        )

        response.raise_for_status()

        return response.json()

    except requests.exceptions.Timeout as error:
        raise RuntimeError(
            f"Backend request timed out: {url}"
        ) from error

    except requests.exceptions.ConnectionError as error:
        raise RuntimeError(
            f"Cannot connect to Backend: {url}"
        ) from error

    except requests.exceptions.HTTPError as error:
        raise RuntimeError(
            f"Backend returned HTTP {response.status_code}: "
            f"{response.text}"
        ) from error
