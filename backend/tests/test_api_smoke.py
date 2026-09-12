"""Offline smoke test for the backend API.

Runs against a throwaway SQLite database so the full API logic can be
verified without a live PostgreSQL instance. Set DATABASE_URL to a real
PostgreSQL/Supabase URL for integration testing.

Run:  python -m pytest tests/test_api_smoke.py -v
"""

import os

os.environ["DATABASE_URL"] = "sqlite:///./smoke_test.db"
os.environ["DATABASE_NAME"] = "smoke_test"
os.environ["AUTO_CREATE_TABLES"] = "true"

from datetime import date  # noqa: E402

from fastapi.testclient import TestClient  # noqa: E402

from app.services.revision_algorithm import revision_dates  # noqa: E402

STUDIED_ON = date(2026, 9, 12)
EXPECTED_DATES = [
    date(2026, 9, 13),
    date(2026, 9, 15),
    date(2026, 9, 19),
    date(2026, 9, 27),
    date(2026, 10, 12),
    date(2026, 12, 11),
    date(2027, 3, 11),
    date(2027, 9, 7),
]


def test_revision_algorithm_matches_spec():
    dates = [d for _, d in revision_dates(STUDIED_ON)]
    assert dates == EXPECTED_DATES
    assert len(dates) == 8


def test_full_api_flow():
    from app.main import app

    with TestClient(app) as client:
        # --- auth ---
        res = client.post(
            "/api/auth/register",
            json={
                "email": "alice@example.com",
                "username": "alice",
                "password": "supersecret",
                "full_name": "Alice",
            },
        )
        assert res.status_code == 201, res.text
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = client.post(
            "/api/auth/login",
            json={"identifier": "alice@example.com", "password": "supersecret"},
        )
        assert res.status_code == 200

        res = client.get("/api/auth/me", headers=headers)
        assert res.status_code == 200
        assert res.json()["username"] == "alice"

        # --- create topic ---
        res = client.post(
            "/api/topics",
            headers=headers,
            json={
                "title": "Java OOP",
                "subject": "Java",
                "description": "Classes and objects",
                "studied_on": str(STUDIED_ON),
                "source": "https://example.com/oop",
                "difficulty": "medium",
                "notes": "Remember inheritance.",
            },
        )
        assert res.status_code == 201, res.text
        topic = res.json()
        assert topic["total_revisions"] == 8
        assert [r["revision_number"] for r in topic["revisions"]] == [1, 2, 3, 4, 5, 6, 7, 8]
        assert [r["scheduled_date"] for r in topic["revisions"]] == [
            d.isoformat() for d in EXPECTED_DATES
        ]
        topic_id = topic["id"]
        first_revision_id = topic["revisions"][0]["id"]
        assert topic["status"] == "upcoming"  # next revision is tomorrow

        # --- list topics ---
        res = client.get("/api/topics", headers=headers)
        assert res.status_code == 200
        assert len(res.json()) == 1

        res = client.get("/api/topics?q=oop&subject=java", headers=headers)
        assert res.status_code == 200
        assert len(res.json()) == 1

        res = client.get("/api/topics?status=overdue", headers=headers)
        assert res.status_code == 200
        assert len(res.json()) == 0

        # --- topic detail ---
        res = client.get(f"/api/topics/{topic_id}", headers=headers)
        assert res.status_code == 200
        assert len(res.json()["revisions"]) == 8

        # --- calendar ---
        res = client.get("/api/revisions/calendar?year=2026&month=9", headers=headers)
        assert res.status_code == 200
        days = res.json()["days"]
        day15 = next(d for d in days if d["date"] == "2026-09-15")
        assert len(day15["revisions"]) == 1
        assert day15["revisions"][0]["topic"]["title"] == "Java OOP"

        # --- today's revisions (none: first revision is tomorrow) ---
        res = client.get("/api/revisions/today", headers=headers)
        assert res.status_code == 200
        assert res.json() == []

        # --- complete a revision ---
        res = client.post(f"/api/revisions/{first_revision_id}/complete", headers=headers)
        assert res.status_code == 200, res.text
        assert res.json()["status"] == "completed"

        # idempotency
        res = client.post(f"/api/revisions/{first_revision_id}/complete", headers=headers)
        assert res.status_code == 200

        res = client.get(f"/api/topics/{topic_id}", headers=headers)
        assert res.json()["completed_revisions"] == 1
        assert res.json()["revisions"][0]["status"] == "completed"

        # --- user isolation ---
        res = client.post(
            "/api/auth/register",
            json={"email": "bob@example.com", "username": "bob", "password": "supersecret"},
        )
        bob_token = res.json()["access_token"]
        res = client.get(
            "/api/topics", headers={"Authorization": f"Bearer {bob_token}"}
        )
        assert res.status_code == 200
        assert res.json() == []

        # alice trying to complete bob-visible revision -> 404
        res = client.post(
            f"/api/revisions/{first_revision_id}/complete",
            headers={"Authorization": f"Bearer {bob_token}"},
        )
        assert res.status_code == 404

        # --- delete topic ---
        res = client.delete(f"/api/topics/{topic_id}", headers=headers)
        assert res.status_code == 204

        res = client.get("/api/topics", headers=headers)
        assert res.json() == []


def _cleanup():
    import glob
    import os as _os

    for path in glob.glob("./smoke_test.db*"):
        try:
            _os.remove(path)
        except OSError:
            pass


_cleanup()