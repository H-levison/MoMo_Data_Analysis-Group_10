from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

DB_FILE = 'transactions.db'

def get_db_connection():
    # Open a connection to the SQLite database
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/transactions', methods=['GET'])
def get_transactions():
    # Get filter parameters from the request 
    tx_type = request.args.get('type')
    min_amount = request.args.get('min_amount', type=int)
    max_amount = request.args.get('max_amount', type=int)
    date = request.args.get('date')

    # Build the SQL query with optional filters
    query = "SELECT * FROM transactions WHERE 1=1"
    params = []
    if tx_type:
        query += " AND category = ?"
        params.append(tx_type)
    if min_amount is not None:
        query += " AND amount >= ?"
        params.append(min_amount)
    if max_amount is not None:
        query += " AND amount <= ?"
        params.append(max_amount)
    if date:
        query += " AND date(datetime) = ?"
        params.append(date)

    # Execute the query and fetch results
    conn = get_db_connection()
    transactions = conn.execute(query, params).fetchall()
    conn.close()
    # Return the results as a list of dictionaries (JSON)
    return jsonify([dict(tx) for tx in transactions])

@app.route('/transactions/<int:tx_id>', methods=['GET'])
def get_transaction(tx_id):
    # Fetch a single transaction by its ID
    conn = get_db_connection()
    tx = conn.execute('SELECT * FROM transactions WHERE id = ?', (tx_id,)).fetchone()
    conn.close()
    if tx is None:
        return jsonify({'error': 'Transaction not found'}), 404
    return jsonify(dict(tx))

if __name__ == '__main__':
    # Start the Flask development server
    app.run(debug=True)