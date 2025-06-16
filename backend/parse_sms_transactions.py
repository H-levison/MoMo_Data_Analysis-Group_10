import xml.etree.ElementTree as ET
import re
import json
from datetime import datetime
import os

UNPROCESSED_LOG = "unprocessed_sms.log"

def log_unprocessed(message, reason):
    """Log unprocessed or ignored SMS messages with a reason."""
    with open(UNPROCESSED_LOG, "a", encoding="utf-8") as f:
        f.write(f"Reason: {reason}\nMessage: {message}\n{'-'*40}\n")

def categorize_transaction(body):
    """Determine transaction category based on SMS content."""
    body_lower = body.lower()

    # Explicit exclusion check
    if any(x in body_lower for x in ["onafriq mauritius", "rwandaltd", "mtn data push"]):
        log_unprocessed(body, "Explicit exclusion keyword found")
        return "Other"

    if "you have received" in body_lower or "credited to your" in body_lower:
        return "Incoming Money"
    elif "bank deposit" in body_lower:
        return "Bank Deposits"
    elif "transferred" in body_lower:
        return "Bank Transfers"
    elif "airtime" in body_lower:
        return "Airtime Bill Payments"
    elif any(keyword in body_lower for keyword in ["bundle", "bundles", "packs", "mb", "gb", "internet", "voice", "data"]):
        return "Internet and Voice Bundle Purchases"
    elif "cash power" in body_lower or ("token" in body_lower and all(x not in body_lower for x in ["mb", "gb", "bundle", "data", "internet", "airtime"])):
        return "Cash Power Bill Payments"
    elif "your payment of" in body_lower:
        return "Payments to Code Holders"
    elif "from" in body_lower and ("received" in body_lower or "credited" in body_lower):
        return "Transactions Initiated by Third Parties"
    elif "withdrawn" in body_lower or "withdrawal" in body_lower or "agent" in body_lower:
        return "Withdrawals from Agents"
    else:
        log_unprocessed(body, "No matching category")
        return "Other"

def parse_sms(xml_data):
    """Parse SMS XML data and extract transaction details."""
    try:
        root = ET.fromstring(xml_data)
    except ET.ParseError as e:
        print(f"Error parsing XML: {e}")
        return []
    transactions = []

    for sms in root.findall('sms'):
        body = sms.attrib.get('body', '')
        try:
            date = datetime.fromtimestamp(int(sms.attrib.get('date', '0')) / 1000)
        except Exception as e:
            log_unprocessed(body, f"Date parsing error: {e}")
            continue
        category = categorize_transaction(body)
        base_data = {
            "category": category,
            "datetime": date.strftime('%Y-%m-%d %H:%M:%S'),
            "raw_text": body
        }

        # Extract amount
        amount_match = re.search(r'([0-9,]+)\s*RWF', body)
        if amount_match:
            base_data["amount"] = int(amount_match.group(1).replace(',', ''))
        else:
            base_data["amount"] = 0  # Default if not found
            log_unprocessed(body, "Amount not found")

        # Extract fee
        fee_match = re.search(r'Fee (was|:) (\d+)', body)
        if fee_match:
            base_data["fee"] = int(fee_match.group(2))
        else:
            base_data["fee"] = 0

        # Additional details based on category
        if category in ["Payments to Code Holders"]:
            match = re.search(r'payment of .*? RWF to (.+?) (\d+)', body)
            if match:
                base_data["recipient"], base_data["code"] = match.groups()
        elif category == "Bank Transfers":
            match = re.search(r'transferred to (.+?) \((\d+)\)', body)
            if match:
                base_data["recipient"], base_data["account_or_phone"] = match.groups()
        elif category == "Incoming Money":
            match = re.search(r'from\s+(.+?)\s+\(\*+\d+\)', body)
            if match:
                base_data["sender"] = match.group(1)

        transactions.append(base_data)

    return transactions

def save_to_json(data, filename="parsed_sms_data.json"):
    """Save parsed transactions to a JSON file."""
    try:
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f" Saved {len(data)} transactions to {filename}")
    except Exception as e:
        print(f"Error saving to JSON: {e}")

if __name__ == "__main__":
    print("Current directory:", os.getcwd())
    try:
        with open("modified_sms_v2.xml", "r", encoding="utf-8") as file:
            xml_content = file.read()
    except FileNotFoundError:
        print(" Error: XML file 'modified_sms_v2.xml' not found in the current directory.")
        exit(1)

    transactions = parse_sms(xml_content)
    save_to_json(transactions)