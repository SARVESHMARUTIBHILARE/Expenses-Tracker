from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND = os.path.join(BASE, "frontend")

app = Flask(__name__)
CORS(app)

DB = {
    "host": "127.0.0.1",
    "port": 3306,
    "user": "root",
    "password": "",
    "database": "expenses_tracker"
}

def db():
    return mysql.connector.connect(**DB)

@app.route("/")
def home():
    return send_from_directory(FRONTEND, "index.html")

@app.route("/<path:filename>")
def frontend(filename):
    # Serve all frontend pages/assets from the same Flask origin.
    safe = os.path.normpath(filename).replace("\\", "/")
    if safe.startswith("../") or safe == "..":
        return "Not found", 404
    return send_from_directory(FRONTEND, safe)

@app.get("/api/health")
def health():
    try:
        c = db()
        c.close()
        return jsonify({"status": "ok", "database": "connected"})
    except Error as e:
        return jsonify({"status": "error", "database": str(e)}), 500

@app.get("/api/transactions")
def get_transactions():
    try:
        c = db()
        cur = c.cursor(dictionary=True)
        cur.execute("""
            SELECT id, description, amount, type, category,
                   DATE_FORMAT(tx_date, '%Y-%m-%d') AS date
            FROM transactions
            ORDER BY tx_date DESC, id DESC
        """)
        data = cur.fetchall()
        cur.close()
        c.close()
        return jsonify(data)
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.post("/api/transactions")
def add_transaction():
    d = request.get_json(silent=True) or {}
    required = ["description", "amount", "type", "category", "date"]
    if not all(k in d for k in required):
        return jsonify({"error": "Missing required fields"}), 400
    try:
        c = db()
        cur = c.cursor()
        cur.execute("""
            INSERT INTO transactions
            (description, amount, type, category, tx_date)
            VALUES (%s, %s, %s, %s, %s)
        """, (d["description"], d["amount"], d["type"], d["category"], d["date"]))
        c.commit()
        new_id = cur.lastrowid
        cur.close()
        c.close()
        return jsonify({"id": new_id}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.delete("/api/transactions/<int:tx_id>")
def delete_transaction(tx_id):
    try:
        c = db()
        cur = c.cursor()
        cur.execute("DELETE FROM transactions WHERE id = %s", (tx_id,))
        c.commit()
        cur.close()
        c.close()
        return jsonify({"success": True})
    except Error as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
