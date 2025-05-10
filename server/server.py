from flask import Flask, request, jsonify
from flask_cors import CORS
import dblogic
import jwt
import datetime
import distanceCalc

app = Flask(__name__)
CORS(app)

app.config['SECRET_KEY'] = '12345678910'

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

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    required_fields = ["nationalId", "password"]
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    result = dblogic.login_user(data)
    if not result["success"]:
        return jsonify({"error": result["error"]}), 401

    # gen JWT token with a 6 hr expiry
    payload = {
        "prs_id": result["prsId"],
        "role":   result["roleId"],   
        "name":   result["name"],
        "exp":    datetime.datetime.utcnow() + datetime.timedelta(hours=6)
    }
    print("Payload: ", payload)
    token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm="HS256")


    return jsonify({
        "message": "Login successful",
        "token": token
    }), 200

@app.route("/api/findNearestSuppliers", methods=["POST"])
def fetch_suppliers():
    prs_ID = request.json.get("prsId")
    supplier_data = dblogic.fetch_suppliers()        # returns [{ "storeId": "...", "address": "..." }, ...]
    user_location = dblogic.fetch_user_location(prs_ID)
    print
    
    if not user_location:
        return jsonify({"error": "User location not found"}), 404

    results = []
    for sup in supplier_data:
        addr = sup["address"]
        try:
            print("Calculating distance for: ", addr)
            km = distanceCalc.get_straight_line_km(addr, user_location)
        except Exception:
            continue
        results.append({
            "storeId":  sup["storeId"],
            "address":  addr,
            "distance": round(km, 2)
        })

    results.sort(key=lambda x: x["distance"])
    print("Results: ", results)
    return jsonify(results), 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)
