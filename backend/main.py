from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models
from database import Base, engine
from routers import action_items, meetings, participants, search, transcripts

# Create tables on startup. Fine for this SQLite demo; a real app would use
# Alembic migrations instead of create_all.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fireflies Clone API")

# The Next.js dev server runs on :3000 and calls this API from the browser,
# so it needs an explicit CORS allow-list.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meetings.router)
app.include_router(transcripts.router)
app.include_router(action_items.router)
app.include_router(participants.router)
app.include_router(search.router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "fireflies-clone-api"}
