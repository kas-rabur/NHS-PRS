import pyodbc
import bcrypt
from datetime import datetime, timedelta
import json
from pymongo import MongoClient
from bson import ObjectId


def login_user(data):
    national_id = data["nationalId"]
    raw_password = data["password"].encode("utf-8")

    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()

    try:
        # Fetch stored hash and user info
        cur.execute(
            "SELECT Password_Hash, PRS_Id, Role_ID, Name, DateOfBirth, User_Type, Merchant_ID "
            "FROM [USER] WHERE National_Identifier = ?",
            national_id,
        )
        row = cur.fetchone()
        if not row:
            return {"success": False, "error": "Invalid credentials."}

        stored_hash, prs_id, role_id, name, DateOfBirth, user_type, merchant_id = row

        dob_str = DateOfBirth.strftime("%d/%m/%Y")
        print("login row: ", row)
        # Verify password
        if not bcrypt.checkpw(raw_password, stored_hash.encode("utf-8")):
            return {"success": False, "error": "Invalid credentials."}

        return {
            "success": True,
            "prsId": prs_id,
            "roleId": role_id,
            "name": name,
            "dob": dob_str,
            "userType": user_type,
            "merchantId": merchant_id,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

    finally:
        cur.close()
        conn.close()


def register_user(data):
    national_id = data["nationalId"]
    dob = data["dob"]
    digit_group = national_id[-1] or None
    name = data["name"]
    address = data.get("address") or None
    user_type = data.get("userType") or None
    role_id = data["roleId"]
    schedule_id = data.get("scheduleId") or None
    raw_password = data["password"].encode("utf-8")
    hashed = bcrypt.hashpw(raw_password, bcrypt.gensalt()).decode()

    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()

    try:
        cur.execute("SELECT 1 FROM [USER] WHERE National_Identifier = ?", national_id)
        if cur.fetchone():
            return {
                "success": False,
                "error": "A user with that National ID already exists.",
            }

        insert_sql = """
        INSERT INTO [USER] (
            National_Identifier, DateOfBirth, Digit_Group,
            Name, Address, User_Type, Role_ID, Schedule_ID, Password_Hash
        )
        OUTPUT inserted.PRS_Id
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        cur.execute(
            insert_sql,
            (
                national_id,
                dob,
                digit_group,
                name,
                address,
                user_type,
                role_id,
                schedule_id,
                hashed,
            ),
        )

        row = cur.fetchone()
        prs_id = row[0] if row else None
        conn.commit()
        return {"success": True, "prsId": prs_id}

    except Exception as e:
        return {"success": False, "error": str(e)}

    finally:
        cur.close()
        conn.close()


def fetch_suppliers():
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    cur.execute("SELECT Store_ID, Address FROM STORE")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [{"storeId": r[0], "address": r[1]} for r in rows]


def fetch_user_location(prs_id):
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    cur.execute("SELECT Address FROM [USER] WHERE PRS_Id = ?", prs_id)
    row = cur.fetchone()
    cur.close()
    conn.close()

    return row[0] if row else None


def fetch_user_vacc_record(prs_id):
    client = MongoClient("mongodb://localhost:27017")
    col = client.prs_db.vaccination_records
    try:
        cursor = col.find(
            {"prsId": prs_id},
            {
                "_id": 0,
                "prsId": 1,
                "vaccineName": 1,
                "dose": 1,
                "vaccinationDate": 1,
                "verified": 1,
            },
        ).sort("vaccinationDate", 1)

        records = []
        for doc in cursor:
            records.append(
                {
                    "prsId": doc.get("prsId"),
                    "vaccineName": doc.get("vaccineName"),
                    "dose": doc.get("dose"),
                    "date": (
                        doc.get("vaccinationDate").isoformat()
                        if doc.get("vaccinationDate")
                        else None
                    ),
                    "verified": doc.get("verified", False),
                }
            )
        return records

    finally:
        client.close()


def add_family_member(data):
    head_prs_id = data["prsId"]
    national_id = data["nationalId"]
    name = data.get("name", "")
    dob = data.get("dob")
    address = data.get("address", "")
    user_type = data.get("userType", "individual")

    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    try:
        conn.autocommit = False

        cur.execute("SELECT ID, Family_ID FROM [USER] WHERE PRS_Id = ?", head_prs_id)
        row = cur.fetchone()
        if not row:
            return {"success": False, "error": "Head user not found."}
        head_user_id, family_id = row

        cur.execute("SELECT 1 FROM [USER] WHERE National_Identifier = ?", national_id)
        if cur.fetchone():
            return {
                "success": False,
                "error": "A user with that National Identifier already exists.",
            }

        if not family_id:
            family_id = head_prs_id
            cur.execute(
                "INSERT INTO FAMILY (Family_ID, Head_User_Id, Created_On) VALUES (?, ?, GETDATE())",
                family_id,
                head_user_id,
            )
            cur.execute(
                "UPDATE [USER] SET Family_ID = ? WHERE ID = ?", family_id, head_user_id
            )
        last_digit = national_id.strip()[-1]
        cur.execute(
            "SELECT Schedule_ID FROM PURCHASE_SCHEDULE WHERE ',' + Digit_Group + ',' LIKE ?",
            f"%,{last_digit},%",
        )
        sched_row = cur.fetchone()
        if not sched_row:
            return {
                "success": False,
                "error": f"No schedule found for digit '{last_digit}'.",
            }
        schedule_id = sched_row[0]

        cur.execute(
            """
            INSERT INTO [USER]
              (National_Identifier, DateOfBirth, Digit_Group, Name, Address,
               User_Type, Role_ID, Schedule_ID, Family_ID)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            national_id,
            dob,
            last_digit,
            name,
            address,
            user_type,
            "public_user",
            schedule_id,
            family_id,
        )
        print("Inserted family member with DOB: ", dob)

        conn.commit()
        return {"success": True}

    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}

    finally:
        cur.close()
        conn.close()


import pyodbc


def get_family_members(prs_id):
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT PRS_Id, Name, DateOfBirth " "FROM [USER] " "WHERE Family_ID = ?",
            prs_id,
        )
        rows = cur.fetchall()

        if not rows:
            return {"success": True, "members": []}

        members = []
        for prs, name, dob in rows:
            dob_str = dob.strftime("%d/%m/%Y")
            members.append({"prsId": prs, "name": name, "dob": dob_str})

        return {"success": True, "members": members}

    except Exception as e:
        return {"success": False, "error": str(e)}

    finally:
        cur.close()
        conn.close()


def remove_family_member(prs_id, family_member_prs_id):
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    try:
        cur.execute(
            "DELETE FROM [USER] WHERE PRS_Id = ? AND Family_ID = ?",
            family_member_prs_id,
            prs_id,
        )
        conn.commit()
        return {"success": True}

    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}

    finally:
        cur.close()
        conn.close()


def update_address(prs_id, new_address):
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE [USER] SET Address = ? WHERE PRS_Id = ?", new_address, prs_id
        )
        conn.commit()
        return {"success": True}

    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}

    finally:
        cur.close()
        conn.close()


def update_password(prs_id, old_password, new_password):
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    try:
        cur.execute("SELECT Password_Hash FROM [USER] WHERE PRS_Id = ?", prs_id)
        row = cur.fetchone()
        if not row:
            return {"success": False, "error": "User not found."}

        stored_hash = row[0]
        if not bcrypt.checkpw(
            old_password.encode("utf-8"), stored_hash.encode("utf-8")
        ):
            return {"success": False, "error": "Old password is incorrect."}

        hashed_new_password = bcrypt.hashpw(
            new_password.encode("utf-8"), bcrypt.gensalt()
        ).decode()
        cur.execute(
            "UPDATE [USER] SET Password_Hash = ? WHERE PRS_Id = ?",
            hashed_new_password,
            prs_id,
        )
        conn.commit()
        return {"success": True}

    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}

    finally:
        cur.close()
        conn.close()


def get_allowed_critical_items(prs_id):
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT ps.Allowed_Day
            FROM [USER] u
            JOIN PURCHASE_SCHEDULE ps
              ON u.Schedule_ID = ps.Schedule_ID
            WHERE u.PRS_Id = ?
            """,
            (prs_id,),
        )
        row = cur.fetchone()
        if not row:
            return {"success": False, "error": "User or schedule not found"}

        allowed_abbr = row[0].strip()[:3].capitalize()

        # compute week window, Monday → next Monday
        today = datetime.today().date()
        start_of_week = today - timedelta(days=today.weekday())
        next_monday = start_of_week + timedelta(days=7)

        week_data = []
        for offset in range(7):
            dt = start_of_week + timedelta(days=offset)
            day_abbr = dt.strftime("%a")

            if day_abbr == allowed_abbr:
                cur.execute(
                    """
                    SELECT
                      ci.Item_ID,
                      ci.Item_Name,
                      ci.PurchaseLimit_Per_Day AS daily_limit,
                      (
                        SELECT ISNULL(SUM(pt.Quantity), 0)
                        FROM PURCHASE_TRANSACTION pt
                        WHERE
                          pt.PRS_Id = ?
                          AND pt.Transaction_Date >= ?
                          AND pt.Transaction_Date <  ?
                          AND pt.Item_ID = ci.Item_ID
                      ) AS total_bought
                    FROM CRITICAL_ITEM ci
                    ORDER BY ci.Item_ID
                    """,
                    (prs_id, start_of_week, next_monday),
                )
                rows = cur.fetchall()
                items = [
                    {
                        "item_id": item_id,
                        "item_name": name,
                        "daily_limit": limit_per_day,
                        "total_bought": total,
                    }
                    for item_id, name, limit_per_day, total in rows
                ]
            else:
                cur.execute(
                    """
                    SELECT Item_ID, Item_Name, PurchaseLimit_Per_Day
                    FROM CRITICAL_ITEM
                    ORDER BY Item_ID
                    """
                )
                items = [
                    {
                        "item_id": iid,
                        "item_name": nm,
                        "daily_limit": limit_per_day,
                        "total_bought": 0,
                    }
                    for iid, nm, limit_per_day in cur.fetchall()
                ]

            week_data.append(
                {
                    "date": dt.isoformat(),
                    "day": day_abbr,
                    "allowed": (day_abbr == allowed_abbr),
                    "items": items,
                }
            )

        return {"success": True, "data": week_data}

    except Exception as e:
        return {"success": False, "error": str(e)}

    finally:
        cur.close()
        conn.close()


def get_allowed_day(prs_id):
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT ps.Allowed_Day
            FROM [USER] u
            JOIN PURCHASE_SCHEDULE ps
                ON u.Schedule_ID = ps.Schedule_ID
            WHERE u.PRS_Id = ?
            """,
            (prs_id,),
        )
        row = cur.fetchone()
        if row:
            return {"success": True, "data": row[0]}
        else:
            return {"success": False, "error": "No schedule found for that PRS_Id"}
    finally:
        cur.close()
        conn.close()


def get_allowed_days_for_all():
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT Digit_Group, Allowed_Day
            FROM PURCHASE_SCHEDULE 
            """
        )
        rows = cur.fetchall()
        return [{"digitgroup": row[0], "allowedDay": row[1]} for row in rows]
    finally:
        cur.close()
        conn.close()


# def save_vaccination_bundle(prs_id, bundle):
#     conn = pyodbc.connect(
#         "DRIVER={ODBC Driver 17 for SQL Server};"
#         "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
#     )
#     cur = conn.cursor()
#     try:
#         for entry in bundle.get("entry", []):
#             resource = entry.get("resource", {})
#             if resource.get("resourceType") != "Immunization":
#                 continue

#             vaccine = (
#                 resource.get("vaccineCode", {})
#                 .get("coding", [{}])[0]
#                 .get("display", "")
#             )
#             dose = str(
#                 resource.get("protocolApplied", [{}])[0].get(
#                     "doseNumberPositiveInt", ""
#                 )
#             )
#             occurrence = resource.get("occurrenceDateTime", "")
#             vaccination_date = occurrence.split("T")[0] if occurrence else None
#             payload = json.dumps(resource)

#             cur.execute(
#                 """
#                 INSERT INTO VACCINATION_RECORD
#                   (PRS_Id, Vaccine_Name, Dose, Vaccination_Date, Verified, Payload)
#                 VALUES (?, ?, ?, ?, ?, ?)
#                 """,
#                 prs_id,
#                 vaccine,
#                 dose,
#                 vaccination_date,
#                 1,
#                 payload,
#             )

#         conn.commit()
#         return True, None

#     except Exception as e:
#         conn.rollback()
#         return False, str(e)

#     finally:
#         cur.close()
#         conn.close()


# new funcs
def get_merchant_id(prs_id):
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT Merchant_ID
              FROM [USER]
             WHERE PRS_Id = ?
        """,
            (prs_id,),
        )
        row = cur.fetchone()

        merchant_id = row[0] if row else None

        cur.execute(
            """
            SELECT Business_License_Number, Name, Registration_Info
                    FROM MERCHANT
                    WHERE Merchant_ID = ?
        """,
            (merchant_id,),
        )
        row = cur.fetchone()
        business_license, name, registration_info = row
        if not row:
            return {"success": False, "error": "Merchant not found."}
        return {
            "merchantId": merchant_id,
            "businessLicense": business_license,
            "name": name,
            "registrationInfo": registration_info,
        }
    finally:
        cur.close()
        conn.close()


def get_total_sales_and_orders(merchant_id):
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT 
              COUNT(*)      AS orders,
              ISNULL(SUM(pt.Quantity), 0) AS total_units_sold
            FROM PURCHASE_TRANSACTION pt
            JOIN STORE st         ON pt.Store_ID = st.Store_ID
            WHERE st.Merchant_ID = ? AND pt.Is_Valid = 1
        """,
            (merchant_id,),
        )
        orders, total_units = cur.fetchone()
        return {"orders": orders, "sales": total_units}
    finally:
        cur.close()
        conn.close()


def get_active_product_count(merchant_id):
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT COUNT(DISTINCT inv.Item_ID)
            FROM INVENTORY inv
            JOIN STORE st ON inv.Store_ID = st.Store_ID
            WHERE st.Merchant_ID = ?
        """,
            (merchant_id,),
        )
        (count,) = cur.fetchone()
        return count
    finally:
        cur.close()
        conn.close()


def get_stock_levels(merchant_id):
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT ci.Item_ID, ci.Item_Name, inv.Stock_Quantity, inv.LastUpdated
              FROM INVENTORY inv
              JOIN STORE st          ON inv.Store_ID = st.Store_ID
              JOIN CRITICAL_ITEM ci  ON inv.Item_ID = ci.Item_ID
             WHERE st.Merchant_ID = ?
        """,
            (merchant_id,),
        )
        return [
            {"item_id": item_id, "name": name, "quantity": qty, "lastUpdated": updated}
            for item_id, name, qty, updated in cur.fetchall()
        ]
    finally:
        cur.close()
        conn.close()


def get_purchase_restrictions(prs_id):
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT
              ci.Item_Name,
              COALESCE(ci.PurchaseLimit_Per_Day, ci.PurchaseLimit_Per_Week, 0) AS limit,
              CASE 
                WHEN ci.PurchaseLimit_Per_Day IS NOT NULL THEN 'day'
                ELSE 'week'
              END AS window,
              ps.Allowed_Day AS schedule
            FROM CRITICAL_ITEM ci
            CROSS JOIN (
              SELECT ps.Allowed_Day
              FROM [USER] u
              JOIN PURCHASE_SCHEDULE ps 
                ON u.Schedule_ID = ps.Schedule_ID
              WHERE u.PRS_Id = ?
            ) ps
        """,
            (prs_id,),
        )
        return [
            {"item": item, "limit": limit, "window": window, "schedule": schedule}
            for item, limit, window, schedule in cur.fetchall()
        ]
    finally:
        cur.close()
        conn.close()


def get_all_purchase_restrictions():

    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT
              Item_Name,
              ISNULL(PurchaseLimit_Per_Day, 0) AS limit
            FROM CRITICAL_ITEM
            """
        )
        return [{"item": item, "limit": limit} for item, limit in cur.fetchall()]
    finally:
        cur.close()
        conn.close()


def get_vaccination_stats(_merchant_id=None):
    client = MongoClient("mongodb://localhost:27017")
    col = client.prs_db.vaccination_records
    try:
        base_filter = {}

        total = col.count_documents(base_filter)
        verified = col.count_documents({**base_filter, "verified": True})
        pending = col.count_documents(
            {
                **base_filter,
                "$or": [{"verified": False}, {"verified": {"$exists": False}}],
            }
        )

        return {"totalRecords": total, "verified": verified, "pending": pending}
    finally:
        client.close()


def update_stock_by_name(merchant_id, item_id, new_quantity):
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    try:
        cur.execute(
            """
            UPDATE inv
               SET inv.Stock_Quantity = ?,
                   inv.LastUpdated    = GETDATE()
            FROM INVENTORY inv
            JOIN STORE s
              ON inv.Store_ID = s.Store_ID
            WHERE s.Merchant_ID = ?
              AND inv.Item_ID    = ?
            """,
            (new_quantity, merchant_id, item_id),
        )
        if cur.rowcount == 0:
            return {
                "success": False,
                "error": "No matching inventory record found for that merchant and item",
            }
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}
    finally:
        cur.close()
        conn.close()


def update_verify_record(record_id, verified_status):
    client = MongoClient("mongodb://localhost:27017")
    col = client.prs_db.vaccination_records
    try:
        result = col.update_one(
            {"_id": ObjectId(record_id)},
            {
                "$set": {
                    "verified": bool(int(verified_status)),
                    "updatedAt": datetime.utcnow(),
                }
            },
        )
        if result.matched_count == 0:
            return {
                "success": False,
                "error": "No matching vaccination record found for that Record_ID",
                "rows_updated": 0,
            }
        return {"success": True, "rows_updated": result.modified_count}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        client.close()


# def get_all_vaccination_records():
#     conn = pyodbc.connect(
#         "DRIVER={ODBC Driver 17 for SQL Server};"
#         "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
#     )
#     cur = conn.cursor()
#     try:
#         cur.execute(
#             """
#             SELECT Record_ID, PRS_Id, Vaccine_Name, Dose, Vaccination_Date, Verified
#             FROM VACCINATION_RECORD
#             """,
#         )
#         rows = cur.fetchall()
#         print("Vaccination records: ", rows)
#         return [
#             {
#                 "recordId": recordID,
#                 "id": id,
#                 "vaccineName": name,
#                 "dose": dose,
#                 "vaccinationDate": date,
#                 "verified": verified,
#             }
#             for recordID, id, name, dose, date, verified in rows
#         ]
#     finally:
#         cur.close()
#         conn.close()


# --------------------MONGO--------------------
def get_all_vaccination_records_mongo():
    client = MongoClient("mongodb://localhost:27017")
    vaxcol = client.prs_db.vaccination_records
    try:
        cursor = vaxcol.find(
            {},
            {
                "_id": 1,
                "prsId": 1,
                "vaccineName": 1,
                "dose": 1,
                "vaccinationDate": 1,
                "lotNumber": 1,
                "manufacturer": 1,
                "status": 1,
                "verified": 1,
                "fhirPayload": 1,
                "createdAt": 1,
                "updatedAt": 1,
            },
        ).sort([("prsId", 1), ("vaccinationDate", 1)])

        records = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            records.append(doc)

        return {"success": True, "records": records}

    except Exception as e:
        return {"success": False, "error": str(e)}

    finally:
        client.close()


def fetch_all_immunizations_for_user(prs_id):
    client = MongoClient("mongodb://localhost:27017")
    vaxcol = client.prs_db.vaccination_records
    try:
        cursor = vaxcol.find(
            {"prsId": prs_id},
            {
                "_id": 1,
                "vaccineName": 1,
                "dose": 1,
                "vaccinationDate": 1,
                "lotNumber": 1,
                "manufacturer": 1,
                "status": 1,
                "fhirPayload": 1,
            },
        ).sort("vaccinationDate", 1)
        return list(cursor)
    finally:
        client.close()


def save_vaccination_bundle(data):
    """
    Expects `data` = { "prsId": "...", "bundle": { "entry": [ ... ] } }
    Returns (success: bool, error: str|None)
    """
    prs_id = data.get("prsId")
    bundle = data.get("bundle")

    if not prs_id or not bundle or "entry" not in bundle:
        return False, "Invalid payload: must include prsId and bundle.entry"

    client = MongoClient("mongodb://localhost:27017")
    col = client.prs_db.vaccination_records

    docs = []
    try:
        for entry in bundle["entry"]:
            res = entry.get("resource", {})
            if res.get("resourceType") != "Immunization":
                continue

            vaccine = (
                res.get("vaccineCode", {}).get("coding", [{}])[0].get("display", "")
            )
            dose_str = str(
                res.get("protocolApplied", [{}])[0].get("doseNumberPositiveInt", "")
            )
            occ = res.get("occurrenceDateTime", "")
            vacc_date = datetime.fromisoformat(occ) if occ else None

            docs.append(
                {
                    "prsId": prs_id,
                    "vaccineName": vaccine,
                    "dose": dose_str,
                    "vaccinationDate": vacc_date,
                    "verified": False,  # start as pending
                    "fhirPayload": res,
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow(),
                }
            )

        if docs:
            col.insert_many(docs)
        return True, None

    except Exception as e:
        return False, str(e)

    finally:
        client.close()

def get_all_merchants():
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT Merchant_ID, Business_License_Number, Name, Registration_Info FROM MERCHANT"
        )
        merchants = []
        for mid, lic, nm, reg in cur.fetchall():
            merchants.append(
                {
                    "merchantId": mid,
                    "businessLicense": lic,
                    "name": nm,
                    "registrationInfo": reg,
                }
            )
        return {"merchants": merchants}
    finally:
        cur.close()
        conn.close()


def get_compliance_status():
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT s.Store_ID, "
            "CASE WHEN SUM(CASE WHEN pt.Is_Valid = 0 THEN 1 ELSE 0 END) > 0 "
            "THEN 'Non-Compliant' ELSE 'Compliant' END as Status "
            "FROM STORE s "
            "LEFT JOIN PURCHASE_TRANSACTION pt ON s.Store_ID = pt.Store_ID "
            "GROUP BY s.Store_ID"
        )
        statuses = []
        for store_id, status in cur.fetchall():
            statuses.append({"location": store_id, "status": status})
        return {"statuses": statuses}
    finally:
        cur.close()
        conn.close()


def get_all_stock():
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT st.Store_ID, ci.Item_ID, ci.Item_Name, inv.Stock_Quantity "
            "FROM INVENTORY inv "
            "JOIN STORE st ON inv.Store_ID = st.Store_ID "
            "JOIN CRITICAL_ITEM ci ON inv.Item_ID = ci.Item_ID"
        )
        stock = []
        for sid, iid, nm, qty in cur.fetchall():
            stock.append(
                {"storeId": sid, "itemId": iid, "item_name": nm, "quantity": qty}
            )
        return {"stock": stock}
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":

    with open(r"C:\Users\kas\Documents\GitHub\NHS-PRS\server\data_vacc.json") as f:
        bundle = json.load(f)

    # 2) Call the save function
    # inserted_id = save_fhir_bundle_per_shot(bundle)
    # print("Saved document with _id:", inserted_id)

    # Use a PRS_Id for the PRS‐based functions:
    test_prs_id = "PRS_000013"
    # Use a Merchant_ID (e.g. "MER001") for the merchant‐scoped functions:
    test_merchant_id = "MER001"

    # print("get all vac stats:", get_vaccination_stats())
    print("res", get_allowed_days_for_all())
    # print("get update stock", update_stock_by_name("MER001", "ITEM001", 38))
    # print("get_merchant_id:", get_merchant_id(test_prs_id))
    # print("get all vaccination records:", get_all_vaccination_records())
    # print("get_total_sales_and_orders:", get_total_sales_and_orders(test_merchant_id))
    # print("get_active_product_count:", get_active_product_count(test_merchant_id))
    # print("get_stock_levels:", get_stock_levels(test_merchant_id))
    # print("get_purchase_restrictions:", get_purchase_restrictions(test_prs_id))
    # print("get_vaccination_stats:", get_vaccination_stats(test_merchant_id))
    # If you still have the old helper:
    # print("get_allowed_critical_items:", get_allowed_critical_items(test_prs_id))
