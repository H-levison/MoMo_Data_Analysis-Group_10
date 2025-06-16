# MoMo Data Analysis Dashboard

## Overview
This project analyzes and visualizes MTN Mobile Money (MoMo) SMS transaction data. It parses raw SMS data, categorizes transactions, stores them in a database, and provides an interactive dashboard for insights.

## Video Presentation
Watch video here - [Youtube](https://youtu.be/HrZHUSeEhL8?si=IJihqCP2E2ZlPgPT)

## Features
- Parses and cleans SMS transaction data
- Categorizes transactions (Incoming Money, Transfers, Bill Payments, etc.)
- Stores data in a normalized SQLite database
- Interactive frontend dashboard with charts and filters
- Responsive and modern UI
- REST API for dynamic data access and filtering

## Project Structure
```
backend/
  parse_sms_transactions.py   # Parses SMS XML and outputs JSON
  save_to_db.py               # Loads JSON into SQLite DB
  api.py                      # Flask API for serving data
  parsed_sms_data.json        # Cleaned transaction data
  modified_sms_v2.xml         # Raw SMS data (input)
frontend/
  index.html                  # Dashboard UI
  script.js                   # Dashboard logic
  style.css                   # Dashboard styling
```

## Database Schema Design
The `transactions` table in SQLite is designed to capture all relevant fields for each transaction type. Here is the schema:

| Field             | Type     | Description                                 |
|-------------------|----------|---------------------------------------------|
| id                | INTEGER  | Primary key (auto-increment)                |
| category          | TEXT     | Transaction category                        |
| datetime          | TEXT     | Date and time of transaction (YYYY-MM-DD HH:MM:SS) |
| amount            | INTEGER  | Transaction amount (RWF)                    |
| fee               | INTEGER  | Transaction fee (RWF)                       |
| recipient         | TEXT     | Recipient name (if applicable)              |
| code              | TEXT     | Code for code-holder payments (if any)      |
| account_or_phone  | TEXT     | Account or phone number (if any)            |
| sender            | TEXT     | Sender name (if applicable)                 |
| raw_text          | TEXT     | Original SMS text                           |

- **Indexes:** Indexes are created on `category` and `datetime` for fast filtering.
- **Constraints:** NOT NULL constraints on key fields, and a UNIQUE constraint on (`datetime`, `raw_text`) to prevent duplicates.

## Database Link
You can download the transaction database from [here](https://github.com/H-levison/MoMo_Data_Analysis-Group_10/blob/c0fc4598044a17b9005b4a97a0202bb465dd7c23/backend/transactions.db).

## Setup Instructions
### Clone the Repository
1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/H-levison/MoMo_Data_Analysis-Group_10.git
   cd MoMo_Data_Analysis-Group_10/backend
   ```

### Backend
1. Place your SMS XML file as `backend/modified_sms_v2.xml`.
2. Run the parser:
   ```bash
   python parse_sms_transactions.py
   ```
   This creates `parsed_sms_data.json`.
3. Load data into SQLite:
   ```bash
   python save_to_db.py
   ```
   This creates `transactions.db`.
4. Start the API server:
   ```bash
   python api.py
   ```

### Frontend
1. Open `frontend/index.html` in your browser.
2. The dashboard will fetch data from the API (make sure the API server is running).

## Data Flow
1. **Raw SMS XML** → 2. **Parsed & Categorized JSON** → 3. **SQLite DB** → 4. **Flask API** → 5. **Frontend Dashboard**

## System Architecture Diagram
```mermaid
flowchart LR
    A[Raw SMS XML] --> B[Python Parser]
    B --> C[Categorized JSON]
    C --> D[SQLite Database]
    D --> E[Flask API]
    E --> F[Frontend Dashboard]
    F --> G[User]
    style A fill:#333300,stroke:#333,stroke-width:1px
    style B fill:#003333,stroke:#333,stroke-width:1px
    style C fill:#5a995a,stroke:#333,stroke-width:1px
    style D fill:#330033,stroke:#333,stroke-width:1px
    style E fill:#000000,stroke:#333,stroke-width:1px
    style F fill:#330033,stroke:#333,stroke-width:1px
    style G fill:#000033,stroke:#333,stroke-width:1px
```

## API Endpoints
### `GET /transactions`
- **Description:** Returns a list of all transactions.
- **Query Parameters (optional):**
  - `type`: Filter by transaction category (e.g., `Airtime Bill Payments`)
  - `date`: Filter by date (YYYY-MM-DD)
  - `min_amount`: Minimum transaction amount
  - `max_amount`: Maximum transaction amount
- **Example:**
  ```
  GET /transactions?type=Incoming%20Money&min_amount=1000
  ```
- **Response:**
  ```json
  [
    {
      "id": 1,
      "category": "Airtime Bill Payments",
      "datetime": "2024-06-01 12:34:56",
      "amount": 500,
      "fee": 10,
      "recipient": "MTN",
      "code": null,
      "account_or_phone": "078xxxxxxx",
      "sender": "John Doe",
      "raw_text": "..."
    },
    ...
  ]
  ```

## Design Decisions
- Used regular expressions for flexible SMS parsing.
- Category mapping is extensible for new transaction types.
- SQLite is used for simplicity and easy local development.
- REST API allows dynamic filtering and integration with the frontend.
- Dashboard is built with vanilla JS/HTML/CSS for easy deployment.

## Challenges
- Handling inconsistent SMS formats and missing fields.
- Ensuring robust category extraction and normalization.
- Keeping frontend and backend categories in sync.
- Integrating live API filtering with the dashboard UI.

## Extending/Improving
- Add more advanced visualizations (e.g., time series, heatmaps).
- Add authentication to the API for production use.
- Improve accessibility and mobile UX.
- Add more endpoints (e.g., summary stats) to the API.

## Testing

To test the system end-to-end:

1. **Backend Unit Tests:**
   - Run any provided test scripts in the `backend/` directory (if available).
   - Manually verify that parsing and DB loading scripts complete without errors and produce the expected output files.

2. **API Testing:**
   - Use tools like Postman or curl to query the Flask API endpoints (e.g., `/transactions`) and verify correct JSON responses and filtering.

3. **Frontend Testing:**
   - Open the dashboard in your browser and verify:
     - Data loads and displays correctly.
     - Filters and period buttons work as expected.
     - The "No transactions found for this period." message appears when appropriate.
     - Export and view features function correctly.

4. **Integration Testing:**
   - Make changes to the database and confirm the dashboard updates accordingly after a refresh.

5. **Error Handling:**
   - Stop the backend and confirm the frontend shows an error message when it cannot fetch data.

## Authors
See list of authors in AUTHORS.md file

## License
MIT License 