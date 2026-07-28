import uuid

import jwt
import pytest

from app.security import create_token, decode_token, hash_password, verify_password


def test_password_hashing() -> None:
    plain = "long-and-secure-password"
    hashed = hash_password(plain)
    assert hashed != plain
    assert verify_password(plain, hashed)
    assert not verify_password("wrong-password", hashed)


def test_access_token_round_trip() -> None:
    user_id = uuid.uuid4()
    token = create_token(user_id, 3, "access")
    payload = decode_token(token, "access")
    assert payload["sub"] == str(user_id)
    assert payload["ver"] == 3


def test_token_type_is_enforced() -> None:
    token = create_token(uuid.uuid4(), 0, "refresh")
    with pytest.raises(jwt.InvalidTokenError):
        decode_token(token, "access")

