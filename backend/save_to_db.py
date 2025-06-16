import sqlite3
import json
import os

DB_FILE = "transactions.db"
JSON_FILE = "parsed_sms_data.json"

def create_db():
    """Create the transactions table with constraints and indexes."""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()

    # Create table with NOT NULL constraints and UNIQUE constraint on datetime+raw_text
    c.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            datetime TEXT NOT NULL,
            amount INTEGER NOT NULL DEFAULT 0,
            fee INTEGER NOT NULL DEFAULT 0,
            recipient TEXT,
            code TEXT,
            account_or_phone TEXT,
            sender TEXT,
            raw_text TEXT NOT NULL,
            UNIQUE(datetime, raw_text)
        )
    ''')
    # Add indexes for performance
    c.execute('CREATE INDEX IF NOT EXISTS idx_category ON transactions(category)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_datetime ON transactions(datetime)')
    conn.commit()
    conn.close()

def insert_transactions():
    """Insert transactions from JSON file into the database."""
    if not os.path.exists(JSON_FILE):
        print(f"❌ JSON file '{JSON_FILE}' not found.")
        return

    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        transactions = json.load(f)

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    inserted = 0
    for tx in transactions:
        try:
            c.execute('''
                INSERT OR IGNORE INTO transactions (
                    category, datetime, amount, fee,
                    recipient, code, account_or_phone, sender, raw_text
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                tx.get("category"),
                tx.get("datetime"),
                tx.get("amount", 0),
                tx.get("fee", 0),
                tx.get("recipient"),
                tx.get("code"),
                tx.get("account_or_phone"),
                tx.get("sender"),
                tx.get("raw_text")
            ))
            inserted += c.rowcount
        except Exception as e:
            print(f"Error inserting transaction: {tx.get('raw_text', '')[:30]}... Error: {e}")
    conn.commit()
    conn.close()
    print(f"Inserted {inserted} new transactions into {DB_FILE}")

if __name__ == "__main__":
    create_db()
    insert_transactions()
