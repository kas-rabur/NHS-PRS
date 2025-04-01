from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/members')
def members():
    return {"members": ["Alice", "Bob", "Charlie"]}

@app.route("/api/data", methods=["GET"])
def get_data():
    # Sample data; replace with your actual data
    data = ["Supply Chain Status", "Health Monitoring", "Vaccination Tracking"]
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)