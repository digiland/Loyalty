# Multi-Business Loyalty Platform

This is a Minimum Viable Product (MVP) for a multi-business loyalty program where customers can earn and redeem points across different businesses using their phone number as the primary identifier.

## Project Structure

- `backend/`: FastAPI backend application
- `frontend/`: Angular admin interface
- `loyalty.db`: SQLite database file

## Tech Stack

- **Backend**: FastAPI (Python)
- **Database**: SQLite
- **Admin UI**: Angular with Tailwind CSS
- **Customer UI**: Simple HTML/CSS/JavaScript

## Features

### Phase 1 (Complete)
- Business registration and authentication
- Setting loyalty rates for businesses
- Adding points for customers
- Customer points lookup

### Phase 2 (Partially Implemented)
- Point redemption
- Customer management

## Running the Application

### Backend (FastAPI)

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Start the FastAPI server:
```bash
uvicorn main:app --reload
```

The API will be available at http://localhost:8000

API Documentation will be available at http://localhost:8000/docs

### Frontend (Angular)

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the Angular development server:
```bash
ng serve
```

The admin interface will be available at http://localhost:4200

### Customer Portal

The customer-facing portal is served by FastAPI at http://localhost:8000/customer

## Admin Interface

The admin interface allows businesses to:

1. Register and log in
2. Set their loyalty rate
3. Add points for customers
4. Redeem points for customers
5. Search for customers and view their transaction history

## Customer Interface

The customer interface allows customers to:

1. Check their points balance
2. View their recent transactions

## API Endpoints

### Authentication
- `POST /auth/register_business`: Register a new business
- `POST /auth/login_business`: Log in a business and get a JWT token
- `GET /auth/me`: Get current business details (protected)

### Loyalty Management
- `POST /businesses/{business_id}/loyalty_rules`: Set or update the loyalty rate for a business
- `POST /transactions/add_points`: Add points for a customer
- `POST /transactions/redeem_points`: Redeem points for a customer
- `GET /customers/points/{phone_number}`: Get customer points and recent transactions

## Demo Business Account

For testing purposes, you can register a new business account using the registration form.

## Notes

- The SMS functionality is currently a placeholder. In a production environment, it would integrate with Twilio or another SMS service.
- For the MVP, authentication tokens are stored in localStorage. In a production environment, a more secure approach would be implemented.
- CORS is currently configured to allow all origins. In a production environment, this would be restricted to specific domains.
