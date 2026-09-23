import docker


def get_docker_containers():
    try:
        client = docker.from_env()

        containers = client.containers.list(all=True)

        result = []

        for container in containers:
            result.append(
                {
                    "id": container.short_id,
                    "name": container.name,
                    "status": container.status,
                    "image": (
                        container.image.tags[0]
                        if container.image.tags
                        else None
                    ),
                    "ports": container.attrs.get("NetworkSettings", {}).get(
                        "Ports", {}
                    ),
                }
            )

        return result

    except docker.errors.DockerException as error:
        return {
            "error": f"Unable to connect to Docker: {str(error)}"
        }