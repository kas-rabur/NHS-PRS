from flask import Flask, request, jsonify
from flask_cors import CORS
import dblogic
import jwt
import datetime
import distanceCalc

app = Flask(__name__)
CORS(app)

app.config["SECRET_KEY"] = "12345678910"


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
        "role": result["roleId"],
        "name": result["name"],
        "DOB": result["dob"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=6),
    }
    print("Payload: ", payload)
    token = jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")

    return jsonify({"message": "Login successful", "token": token}), 200


@app.route("/api/findNearestSuppliers", methods=["POST"])
def fetch_suppliers():
    prs_ID = request.json.get("prsId")
    supplier_data = (
        dblogic.fetch_suppliers()
    )  # returns [{ "storeId": "...", "address": "..." }, ...]
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
        results.append(
            {"storeId": sup["storeId"], "address": addr, "distance": round(km, 2)}
        )

    results.sort(key=lambda x: x["distance"])
    print("Results: ", results)
    return jsonify(results), 200


@app.route("/api/getUserVaccRecord", methods=["POST"])
def fetch_user_vacc_record():
    prs_ID = request.json.get("prsId")
    print("PRS ID in server: ", prs_ID)
    if not prs_ID:
        return jsonify({"error": "Missing PRS ID"}), 400

    result = dblogic.fetch_user_vacc_record(prs_ID)
    print("Result: ", result)
    if not result:
        return jsonify({"error": "Vaccination record not found"}), 404
    return jsonify(result), 200


@app.route("/api/addFamilyMember", methods=["POST"])
def add_family_member_route():
    data = request.get_json() or {}

    required_fields = ["prsId", "nationalId", "name", "dob", "address", "userType"]
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return (
            jsonify(
                {"success": False, "error": f"Missing fields: {', '.join(missing)}"}
            ),
            400,
        )

    member_payload = {
        "prsId": data["prsId"],
        "nationalId": data["nationalId"],
        "name": data["name"],
        "dob": data["dob"],
        "address": data["address"],
        "userType": data["userType"],
    }
    print("Member payload: ", member_payload)

    result = dblogic.add_family_member(member_payload)

    if result.get("success"):
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Family member added",
                }
            ),
            201,
        )
    else:
        return jsonify({"success": False, "error": result["error"]}), 500


@app.route("/api/getFamilyMembers", methods=["POST"])
def get_family_members():
    prs_ID = request.json.get("prsId")
    if not prs_ID:
        return jsonify({"error": "Missing PRS ID"}), 400

    result = dblogic.get_family_members(prs_ID)
    if not result:
        return jsonify({"error": "Family members not found"}), 404
    return jsonify(result), 200


@app.route("/api/removeFamilyMember", methods=["POST"])
def remove_family_member():
    data = request.get_json() or {}
    required_fields = ["prsId", "familyMemberId"]
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return (
            jsonify(
                {"success": False, "error": f"Missing fields: {', '.join(missing)}"}
            ),
            400,
        )

    result = dblogic.remove_family_member(data["prsId"], data["familyMemberId"])
    if result.get("success"):
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Family member removed",
                }
            ),
            200,
        )
    else:
        return jsonify({"success": False, "error": result["error"]}), 500


@app.route("/api/updateAddress", methods=["POST"])
def update_address_route():
    data = request.get_json() or {}
    required = ["prsId", "address"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return (
            jsonify(success=False, error=f"Missing fields: {', '.join(missing)}"),
            400,
        )

    result = dblogic.update_address(data["prsId"], data["address"])
    if result.get("success"):
        return jsonify(success=True, message="Address updated"), 200
    return jsonify(success=False, error=result["error"]), 400


@app.route("/api/updatePassword", methods=["POST"])
def update_password_route():
    data = request.get_json() or {}
    required = ["prsId", "oldPassword", "newPassword", "confirmPassword"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return (
            jsonify(success=False, error=f"Missing fields: {', '.join(missing)}"),
            400,
        )

    if data["newPassword"] != data["confirmPassword"]:
        return jsonify(success=False, error="Passwords do not match"), 400

    result = dblogic.update_password(
        data["prsId"], data["oldPassword"], data["newPassword"]
    )
    if result.get("success"):
        return jsonify(success=True, message="Password updated"), 200
    return jsonify(success=False, error=result["error"]), 400

@app.route("/api/get_allowed_critical_items", methods=["POST"])
def get_allowed_critical_items():
    data = request.get_json() or {}
    required = ["prsId"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return (
            jsonify(success=False, error=f"Missing fields: {', '.join(missing)}"),
            400,
        )

    result = dblogic.get_allowed_critical_items(data["prsId"])
    if result.get("success"):
        return jsonify(success=True, items=result["data"]), 200

    return jsonify(success=False, error=result["error"]), 400

@app.route("/api/get_allowed_day", methods=["POST"])
def get_allowed_day_route():
    payload = request.get_json() or {}
    prs_id = payload.get("prsId")
    if not prs_id:
        return jsonify(success=False, error="Missing field: prsId"), 400

    result = dblogic.get_allowed_day(prs_id)
    if result["success"]:
        return jsonify(success=True, allowedDay=result["data"]), 200
    else:
        return jsonify(success=False, error=result["error"]), 404
    
@app.route("/api/upload_vaccination", methods=["POST"])
def upload_vaccination():
    bundle = request.get_json()
    if not bundle:
        return jsonify(success=False, error="No JSON provided"), 400

    prs_id = bundle.get("prsId")
    if not prs_id:
        return jsonify(success=False, error="Missing prsId"), 400

    success, error = dblogic.save_vaccination_bundle(prs_id, bundle)
    if not success:
        return jsonify(success=False, error=error), 500

    return jsonify(success=True), 200


@app.route("/api/merchant/dashboard-data", methods=["POST"])
def merchant_dashboard_data():
    data = request.get_json() or {}
    prs_id = data.get("prsId")
    if not prs_id:
        return jsonify({"error": "Missing field: prsId"}), 400

    merchant_id = dblogic.get_merchant_id(prs_id)
    if merchant_id is None:
        return jsonify({"error": "Not a merchant-linked account"}), 403

    sales_orders      = dblogic.get_total_sales_and_orders(merchant_id)
    product_count     = dblogic.get_active_product_count(merchant_id)
    stock_levels      = dblogic.get_stock_levels(merchant_id)
    restrictions      = dblogic.get_purchase_restrictions(prs_id)
    vaccination_stats = dblogic.get_vaccination_stats(merchant_id)

    return jsonify({
        "sales":                sales_orders["sales"],
        "orders":               sales_orders["orders"],
        "products":             product_count,
        "stockLevels":          stock_levels,
        "purchaseRestrictions": restrictions,
        "vaccinationStats":     vaccination_stats
    }), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
