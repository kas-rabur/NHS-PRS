from flask import Flask, request, jsonify
from flask_cors import CORS
import dblogic

app = Flask(__name__)
CORS(app)

#Login and Register routes
@app.route("/api/register", methods=["POST"])
def api_register():
    data = request.get_json()
    required_fields = ["nationalId", "dob", "name", "password", "roleId"]

    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    result = dblogic.register_user(data)

    if result["success"]:
        return jsonify({"message": "User registered", "prsId": result["prsId"]}), 201
    else:
        return jsonify({"error": result["error"]}), 500

@app.route('/login', methods=['POST'])
def login():
    pass

if __name__ == '__main__':
    app.run(debug=True, port=5000)