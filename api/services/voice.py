"""
ElevenLabs voice service — handles signed URL generation for the
Conversational AI WebSocket connection.

The signed URL keeps the API key server-side. The frontend only
receives a temporary, scoped WebSocket URL.
"""

import httpx

from api.config import settings


async def get_signed_url() -> str:
    """
    Request a signed WebSocket URL from ElevenLabs for the configured agent.

    Returns:
        The signed wss:// URL that the frontend can connect to directly.

    Raises:
        httpx.HTTPStatusError: If the ElevenLabs API returns an error.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.elevenlabs.io/v1/convai/conversation/get_signed_url"
            f"?agent_id={settings.ELEVENLABS_AGENT_ID}",
            headers={
                "xi-api-key": settings.ELEVENLABS_API_KEY,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["signed_url"]
