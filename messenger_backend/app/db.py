from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///./app.db"  # für den Start reicht SQLite
engine = create_engine(DATABASE_URL, echo=False)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session