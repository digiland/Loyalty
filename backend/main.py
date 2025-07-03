from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import models
from database import engine
from routers import auth, loyalty
from routers.loyalty_programs import router as loyalty_programs_router

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(loyalty.router)
app.include_router(loyalty_programs_router)

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the Loyalty Platform API"}

# Mount static files for customer portal if directory exists
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "src", "assets", "customer")
if os.path.exists(frontend_dir):
    app.mount("/customer", StaticFiles(directory=frontend_dir, html=True), name="customer")
