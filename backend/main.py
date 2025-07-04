from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import models
from database import engine
from routers import auth, loyalty
from routers.loyalty_programs import router as loyalty_programs_router
from routers.extra import router as extra_router
from routers.mcp_server import router as mcp_router

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
app.include_router(extra_router)
app.include_router(mcp_router)

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the Loyalty Platform API - MCP Server Ready"}

# Mount static files for customer portal if directory exists
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "src", "assets", "customer")
if os.path.exists(frontend_dir):
    app.mount("/customer", StaticFiles(directory=frontend_dir, html=True), name="customer")

# Mount the new customer UI
customer_ui_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "customer-ui")
if os.path.exists(customer_ui_dir):
    app.mount("/customer-ui", StaticFiles(directory=customer_ui_dir, html=True), name="customer-ui")
