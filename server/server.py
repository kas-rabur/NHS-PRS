from flask import Flask, request, jsonify

app = Flask(__name__)

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