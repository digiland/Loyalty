# AI-Powered Multi-Business Loyalty Platform MVP

Use nvm 22 touse node 22 for the frontend

## Project Goal
Develop a Minimum Viable Product (MVP) to demonstrate the core functionality of a multi-business loyalty program where customers earn points across different businesses using their phone number as the primary identifier. The MVP will include basic AI-driven recommendations and a placeholder for affiliate marketing.

## Technology Stack
- **Backend**: FastAPI (Python)
- **Database**: SQLite
- **Admin UI**: Angular with Tailwind CSS
- **Customer UI**: Simple HTML/CSS/JavaScript (served by FastAPI or a simple static server)
- **SMS Gateway**: Twilio (or equivalent for local SMS in Zimbabwe, if specified)
- **Chatbot Integration**: A chatbot will be developed to interact with the loyalty platform. It will use a Model Context Protocol (MCP) server to access data.

## Phase 1: Core Loyalty System (Backend & Basic Admin UI)
**Goal**: Enable businesses to register, set up basic loyalty rules, and manually add points for customers using phone numbers. Customers can check their points balance.

### Backend (FastAPI)

#### Project Setup
- Initialize a FastAPI project.
- Set up a SQLite database connection using SQLAlchemy.
- Implement basic environment variable management for sensitive credentials (database, Twilio, etc.).

#### Database Models
- **Business**: `id`, `name`, `contact_person`, `email`, `password_hash`, `loyalty_rate` (e.g., points per currency unit), `created_at`.
- **Customer**: `id`, `phone_number` (unique), `total_points`, `created_at`.
- **Transaction**: `id`, `business_id` (FK to Business), `customer_id` (FK to Customer), `amount_spent`, `points_earned`, `timestamp`.

#### Authentication (for Businesses)
- Implement JWT-based authentication for business users.
- Endpoints for:
  - `POST /auth/register_business`: Register a new business.
  - `POST /auth/login_business`: Log in a business, return JWT token.
  - `GET /auth/me`: Get current business user details (protected).

#### Loyalty Management Endpoints
- `POST /businesses/{business_id}/loyalty_rules`: (Protected) Set or update the `loyalty_rate` for a specific business.
- `POST /transactions/add_points`: (Protected by business JWT)
  - **Input**: `business_id`, `customer_phone_number`, `amount_spent`.
  - **Logic**:
    1. Find or create `Customer` by `customer_phone_number`.
    2. Calculate `points_earned` based on `amount_spent` and `business.loyalty_rate`.
    3. Update `customer.total_points`.
    4. Create a new `Transaction` record.
    5. (Optional for MVP, but good for future) Trigger an SMS notification to the customer (via Twilio) about points earned.

#### Customer Points Lookup Endpoint
- `GET /customers/points/{phone_number}`: (Public, or with a simple PIN/OTP for security)
  - **Input**: `phone_number`.
  - **Output**: `total_points`, `recent_transactions` (last 5, including business name and points earned).

### Admin UI (Angular + Tailwind CSS)

#### Project Setup
- Initialize an Angular project.
- Integrate Tailwind CSS for styling.
- Set up basic routing.

#### Business Authentication
- Login page for businesses.
- Registration page for new businesses.
- Store JWT token securely (e.g., in `localStorage` for MVP).

#### Business Dashboard
- Display the logged-in business's name.
- Display the current `loyalty_rate`.
- **"Add Points" Form**:
  - Input field for Customer Phone Number.
  - Input field for Amount Spent.
  - Button: "Add Points".
  - Display confirmation message after adding points (e.g., "Points added successfully for [phone number]!").
- (Optional for MVP) A very basic list of recent transactions made by this business.

### Customer Facing (Simple Web Portal)

#### Basic HTML Page
- A single HTML page with minimal styling (Tailwind classes can be directly embedded).
- Input field for Phone Number.
- Button: "Check Points".
- Area to display Total Points and a list of Recent Transactions (Business Name, Points Earned, Amount, Date).
- This page will make a `GET` request to the FastAPI `/customers/points/{phone_number}` endpoint.

### SMS Integration (Twilio Placeholder)
- Backend code should include a function to send SMS. For MVP, this can be a placeholder function that prints to console or logs, with a note that it will integrate with Twilio in a later phase.

## Phase 2: Enhanced Customer Experience & Initial AI Logic
**Goal**: Improve customer interaction with transaction history, basic reward redemption, and introduce the very first rule-based AI "recommendation."

### Backend (FastAPI)

#### Reward Redemption Endpoints
- `POST /transactions/redeem_points`: (Protected by business JWT)
  - **Input**: `business_id`, `customer_phone_number`, `points_to_redeem`, `reward_description`.
  - **Logic**:
    1. Check if `customer.total_points` is sufficient.
    2. Deduct `points_to_redeem` from `customer.total_points`.
    3. Record the redemption (e.g., in `Transaction` table with a `type='redemption'`).
    4. Trigger an SMS notification to the customer about the redemption.

#### Basic AI Recommendation Engine (Rule-Based)
- Create a Python function (e.g., `get_recommendations(customer_id)`) that implements simple rules:
  - **Rule 1: Near Reward Threshold**: If `customer.total_points` is within X points of a common redemption value (e.g., 100 points for a $5 discount), recommend making another purchase.
  - **Rule 2: Inactivity**: If a customer hasn't had a transaction in Y days, suggest visiting a popular business they frequent.
  - **Rule 3: Cross-Promotion (Static)**: If a customer frequently buys from "Coffee Shop A," suggest trying "Bakery B" (initially hardcoded, later configurable).
- Add an endpoint `GET /customers/recommendations/{phone_number}` that calls this function.

### Admin UI (Angular + Tailwind CSS)

#### Customer Management View
- Add a new section/page where businesses can search for customers by phone number.
- Display selected customer's `total_points` and full transaction history (earned and redeemed points).
- **"Redeem Points" Form**:
  - Input field for Points to Redeem.
  - Input field for Reward Description.
  - Button: "Redeem".
  - Display confirmation message.

#### Basic AI Rule Configuration (Optional for MVP, but good to show potential)
- A simple page where the business owner can see the types of recommendations the system could make (e.g., "Nudge when near reward," "Suggest related business"). No dynamic rule creation yet, just a static display of AI capabilities.

### Customer Facing (Simple Web Portal)

#### Enhanced Points View
- Display Total Points.
- Display Full Transaction History (earned and redeemed).
- **"Available Rewards" Section**: List rewards they can currently redeem based on their points.
- **"Recommendations for You" Section**: Display the AI-driven recommendations from `/customers/recommendations/{phone_number}`. This will be a simple text message for the MVP.

### SMS Integration (Activate Twilio)
- Integrate actual Twilio API calls for sending SMS notifications on points earned and rewards redeemed.
- Implement SMS command parsing for balance inquiries (e.g., customer texts "BALANCE" to your Twilio number, and your FastAPI webhook responds with their points).

## Phase 3: Affiliate Marketing Placeholder & Basic Reporting
**Goal**: Lay the groundwork for affiliate marketing and provide basic data insights to businesses.

### Backend (FastAPI)

#### Referral Model
- **Referral**: `id`, `referrer_customer_id` (FK to Customer), `referred_customer_id` (FK to Customer), `status` (e.g., 'pending', 'completed'), `referral_code_used` (optional), `timestamp`.

#### Affiliate Endpoints
- `POST /referrals/track`: (Protected by business JWT)
  - **Input**: `business_id`, `new_customer_phone_number`, `referrer_phone_number` (optional, if provided by new customer).
  - **Logic**: Record the potential referral.
- `POST /referrals/complete`: (Protected by business JWT)
  - **Input**: `referral_id` (or `new_customer_phone_number`), `points_to_award_referrer`.
  - **Logic**: Mark referral as complete, award points to the referrer.

#### Reporting Endpoints
- `GET /reports/total_points_issued`: (Protected) Total points issued by a specific business.
- `GET /reports/total_redemptions`: (Protected) Total redemptions by a specific business.
- `GET /reports/customer_count`: (Protected) Number of unique customers for a specific business.
- `GET /reports/top_customers`: (Protected) List of top N customers by points for a specific business.

### Admin UI (Angular + Tailwind CSS)

#### Referral Management Section
- Display a list of pending and completed referrals for the logged-in business.
- Ability to manually Complete Referral and award points to the referrer.

#### Basic Reporting Dashboard
- Display key metrics: Total Points Issued, Total Redemptions, Number of Unique Customers.
- (Optional) A simple table or list of "Top 5 Customers by Points."

### Customer Facing (Simple Web Portal)

#### "Refer a Friend" Section
- A static text explaining how to refer (e.g., "Tell your friends to mention your phone number when they sign up!").
- (Optional) A simple field where they can input a friend's phone number to send a pre-filled SMS invitation.

## Other Important Items Needed (Across All Phases)
- **Error Handling**: Implement robust error handling in both backend and frontend, providing meaningful error messages to the user.
- **Input Validation**: Strict validation for all input fields (phone numbers, amounts, etc.) on both frontend and backend.
- **Security Best Practices**:
  - Hash passwords for businesses.
  - Use HTTPS for all communication.
  - Protect API endpoints with JWT.
  - Sanitize all user inputs to prevent injection attacks.
- **Code Comments**: Extensive comments throughout the code explaining logic, purpose of functions, and complex sections.
- **README/Documentation**: Clear instructions on how to set up and run the project (backend, frontend, database).
- **Dockerization**: Provide a `Dockerfile` for the FastAPI backend for easy deployment.
- **CORS Configuration**: Properly configure CORS in FastAPI to allow requests from the Angular frontend.
- **UI/UX (for MVP)**: While simple, ensure the UI is clean, intuitive, and mobile-responsive using Tailwind CSS. Focus on clear calls to action.
- **Placeholder for AI Expansion**: In the code, add comments or empty functions where more sophisticated AI models (e.g., collaborative filtering, deep learning for recommendations) would be integrated in future iterations.

## Phase 4: Chatbot and MCP Integration
**Goal**: Enable a chatbot to interact with the loyalty platform using a Model Context Protocol (MCP) server.

### Backend (FastAPI)

#### MCP Server
- Develop a new MCP server to expose loyalty platform data to the chatbot.
- Endpoints for:
  - `GET /mcp/customer/points/{phone_number}`
  - `GET /mcp/customer/transactions/{phone_number}`
  - `GET /mcp/business/{business_id}`
  - `GET /mcp/recommendations/{phone_number}`

#### Chatbot
- Integrate the chatbot with the MCP server to retrieve data and provide answers to user queries.
- Example queries:
  - "How many points do I have?"
  - "Show my recent transactions."
  - "What are the latest offers from [business name]?"

#### Security
- Implement security measures to protect the MCP server from unauthorized access.

## Instructions for the Coding Agent
- Prioritize completing each phase fully before moving to the next.
- Focus on functionality over excessive styling for the initial MVP, but ensure Tailwind CSS is correctly integrated and used for basic layout and components.
- Use clear, modular code.
- Assume the database (SQLite) is accessible.
- For Twilio, use placeholder API keys and functions that print to console for the MVP; mention where actual Twilio integration would occur.
- Provide clear instructions on how to run the backend and frontend applications.

Let me know if you'd like any specific part elaborated further!