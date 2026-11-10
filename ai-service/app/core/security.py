import hmac
from fastapi import Header, HTTPException, status
from app.core.config import settings


def verify_internal_key(x_internal_service_key: str | None = Header(default=None)) -> None:
    if not x_internal_service_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Internal-Service-Key header",
        )
    if not hmac.compare_digest(x_internal_service_key, settings.INTERNAL_SERVICE_KEY):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid internal service signature",
        )
