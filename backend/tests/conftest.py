import os

os.environ.setdefault("JWT_SECRET", "test-secret-at-least-thirty-two-characters")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("INITIAL_ADMIN_PASSWORD", "safe-test-password")

