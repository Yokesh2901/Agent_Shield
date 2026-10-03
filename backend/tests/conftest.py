import pytest
import sys
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import Base, get_db
from app.main import app
from app.models.entities import User, Role, Tool, Policy
from app.core.security import get_password_hash, create_access_token

# In-memory SQLite for high-speed, isolated test runs
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db_engine():
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Seed base roles and tools for test
    roles = [
        Role(id="ADMIN", name="Admin", permissions=["*"]),
        Role(id="SECURITY_ANALYST", name="Analyst", permissions=["audit:read", "approvals:write"]),
        Role(id="DEVELOPER", name="Developer", permissions=["evaluate:write"]),
        Role(id="VIEWER", name="Viewer", permissions=["dashboard:read"])
    ]
    for r in roles:
        session.merge(r)

    # Seed users
    admin_user = User(
        id="usr_admin",
        email="admin@test.com",
        hashed_password=get_password_hash("testpass"),
        full_name="Admin Test",
        role="ADMIN",
        is_active=True
    )
    analyst_user = User(
        id="usr_analyst",
        email="analyst@test.com",
        hashed_password=get_password_hash("testpass"),
        full_name="Analyst Test",
        role="SECURITY_ANALYST",
        is_active=True
    )
    dev_user = User(
        id="usr_dev",
        email="dev@test.com",
        hashed_password=get_password_hash("testpass"),
        full_name="Dev Test",
        role="DEVELOPER",
        is_active=True
    )
    viewer_user = User(
        id="usr_viewer",
        email="viewer@test.com",
        hashed_password=get_password_hash("testpass"),
        full_name="Viewer Test",
        role="VIEWER",
        is_active=True
    )
    session.merge(admin_user)
    session.merge(analyst_user)
    session.merge(dev_user)
    session.merge(viewer_user)

    session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def admin_headers():
    token = create_access_token(subject="usr_admin", role="ADMIN")
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def analyst_headers():
    token = create_access_token(subject="usr_analyst", role="SECURITY_ANALYST")
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def dev_headers():
    token = create_access_token(subject="usr_dev", role="DEVELOPER")
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def viewer_headers():
    token = create_access_token(subject="usr_viewer", role="VIEWER")
    return {"Authorization": f"Bearer {token}"}
