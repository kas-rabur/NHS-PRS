import pyodbc
import bcrypt
import datetime
import json


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
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    cur.execute("SELECT * FROM dbo.VACCINATION_RECORD WHERE PRS_Id = ?", (prs_id,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    print("Vaccination records: ", rows)
    return [
        {
            "prsId": r[1],
            "vaccineName": r[2],
            "dose": r[3],
            "date": r[4],
            "verified": r[5],
        }
        for r in rows
    ]


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
        # find which weekday this user is allowed
        cur.execute("""
            SELECT ps.Allowed_Day
            FROM [USER] u
            JOIN PURCHASE_SCHEDULE ps
              ON u.Schedule_ID = ps.Schedule_ID
            WHERE u.PRS_Id = ?
        """, (prs_id,))
        row = cur.fetchone()
        if not row:
            return {"success": False, "error": "User or schedule not found"}

        allowed_abbr = row[0].strip()[:3].capitalize()

        # compute week window, monday to monday, to make suer users can only buy on their allowed day and only once a week, then it resets
        today         = datetime.date.today()
        start_of_week = today - datetime.timedelta(days=today.weekday())
        next_monday   = start_of_week + datetime.timedelta(days=7)

        week_data = []
        for offset in range(7):
            dt       = start_of_week + datetime.timedelta(days=offset)
            day_abbr = dt.strftime("%a")

            if day_abbr == allowed_abbr:
                # for the allowed day, sum all purchases within the weekly window
                cur.execute("""
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
                          AND pt.Item_ID        = ci.Item_ID
                      ) AS total_bought
                    FROM CRITICAL_ITEM ci
                    ORDER BY ci.Item_ID
                """, (prs_id, start_of_week, next_monday))
                rows = cur.fetchall()

                items = [
                    {
                        "item_id":        item_id,
                        "item_name":      name,
                        "daily_limit":    limit_per_day,
                        "total_bought":   total
                    }
                    for item_id, name, limit_per_day, total in rows
                ]
            else:
                cur.execute("""
                    SELECT Item_ID, Item_Name, PurchaseLimit_Per_Day
                    FROM CRITICAL_ITEM
                    ORDER BY Item_ID
                """)
                items = [
                    {
                        "item_id":      iid,
                        "item_name":    nm,
                        "daily_limit":  limit_per_day,
                        "total_bought": 0
                    }
                    for iid, nm, limit_per_day in cur.fetchall()
                ]

            week_data.append({
                "date":    dt.isoformat(),
                "day":     day_abbr,
                "allowed": day_abbr == allowed_abbr,
                "items":   items
            })

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

def save_vaccination_bundle(prs_id, bundle):
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    try:
        for entry in bundle.get("entry", []):
            resource = entry.get("resource", {})
            if resource.get("resourceType") != "Immunization":
                continue

            vaccine = (
                resource.get("vaccineCode", {})
                        .get("coding", [{}])[0]
                        .get("display", "")
            )
            dose = str(
                resource.get("protocolApplied", [{}])[0]
                        .get("doseNumberPositiveInt", "")
            )
            occurrence = resource.get("occurrenceDateTime", "")
            vaccination_date = occurrence.split("T")[0] if occurrence else None
            payload = json.dumps(resource)

            cur.execute(
                """
                INSERT INTO VACCINATION_RECORD
                  (PRS_Id, Vaccine_Name, Dose, Vaccination_Date, Verified, Payload)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                prs_id,
                vaccine,
                dose,
                vaccination_date,
                1,
                payload,
            )

        conn.commit()
        return True, None

    except Exception as e:
        conn.rollback()
        return False, str(e)

    finally:
        cur.close()
        conn.close()




#new funcs
def get_merchant_id(prs_id):
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT Merchant_ID
              FROM [USER]
             WHERE PRS_Id = ?
        """, (prs_id,))
        row = cur.fetchone()
        
        merchant_id = row[0] if row else None

        cur.execute("""
            SELECT Business_License_Number, Name, Registration_Info
                    FROM MERCHANT
                    WHERE Merchant_ID = ?
        """, (merchant_id,))
        row = cur.fetchone()
        business_license, name, registration_info = row 
        if not row:
            return {"success": False, "error": "Merchant not found."}
        return {
            "merchantId": merchant_id,
            "businessLicense": business_license,
            "name": name,
            "registrationInfo": registration_info
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
        cur.execute("""
            SELECT 
              COUNT(*)      AS orders,
              ISNULL(SUM(pt.Quantity), 0) AS total_units_sold
            FROM PURCHASE_TRANSACTION pt
            JOIN STORE st         ON pt.Store_ID = st.Store_ID
            WHERE st.Merchant_ID = ? AND pt.Is_Valid = 1
        """, (merchant_id,))
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
        cur.execute("""
            SELECT COUNT(DISTINCT inv.Item_ID)
            FROM INVENTORY inv
            JOIN STORE st ON inv.Store_ID = st.Store_ID
            WHERE st.Merchant_ID = ?
        """, (merchant_id,))
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
        cur.execute("""
            SELECT ci.Item_ID, ci.Item_Name, inv.Stock_Quantity, inv.LastUpdated
              FROM INVENTORY inv
              JOIN STORE st          ON inv.Store_ID = st.Store_ID
              JOIN CRITICAL_ITEM ci  ON inv.Item_ID = ci.Item_ID
             WHERE st.Merchant_ID = ?
        """, (merchant_id,))
        return [
            {
                "item_id":     item_id,
                "name":        name,
                "quantity":    qty,
                "lastUpdated": updated
            }
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
        cur.execute("""
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
        """, (prs_id,))
        return [
            {"item": item, "limit": limit, "window": window, "schedule": schedule}
            for item, limit, window, schedule in cur.fetchall()
        ]
    finally:
        cur.close()
        conn.close()

def get_vaccination_stats(_merchant_id=None):
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT
              COUNT(*)                                AS total,
              SUM(CASE WHEN Verified = 1 THEN 1 ELSE 0 END) AS verified,
              SUM(CASE WHEN Verified = 0 THEN 1 ELSE 0 END) AS pending
            FROM VACCINATION_RECORD
        """)
        total, verified, pending = cur.fetchone()
        return {
            "totalRecords": total or 0,
            "verified":     verified or 0,
            "pending":      pending or 0
        }
    finally:
        cur.close()
        conn.close()

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
            return {"success": False, "error": "No matching inventory record found for that merchant and item"}
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}
    finally:
        cur.close()
        conn.close()

def update_verify_record(prs_id, record_id, verified_status):
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    try:
        if verified_status == 1:
            cur.execute(
                """
                UPDATE VACCINATION_RECORD
                SET Verified = 1
                WHERE Record_ID = ?
                """,
                (record_id),
            )
        elif verified_status == 0:
            cur.execute(
                """
                UPDATE VACCINATION_RECORD
                SET Verified = 0
                WHERE Record_ID = ?
                """,
                (record_id),
            )

        if cur.rowcount == 0:
            return {"success": False, "error": "No matching vaccination record found"}
        conn.commit()
        return {"success": True}
    
    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}
    finally:
        cur.close()
        conn.close()

def get_all_vaccination_records():
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;DATABASE=NHS-PRS;Trusted_Connection=yes;"
    )
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT Record_ID, PRS_Id, Vaccine_Name, Dose, Vaccination_Date, Verified
            FROM VACCINATION_RECORD
            """,
        )
        rows = cur.fetchall()
        print("Vaccination records: ", rows)
        return [
            {
                "recordId":       recordID,
                "id":              id,
                "vaccineName":     name,
                "dose":           dose,
                "vaccinationDate": date,
                "verified":       verified,
            }
            for recordID, id, name, dose, date, verified in rows
        ]
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    # Use a PRS_Id for the PRS‐based functions:
    test_prs_id     = "PRS_000015"
    # Use a Merchant_ID (e.g. "MER001") for the merchant‐scoped functions:
    test_merchant_id = "MER001"

    # print("get allowed critical items", get_allowed_critical_items(test_prs_id))
    # print("get update stock", update_stock_by_name("MER001", "ITEM001", 38))
    print("get_merchant_id:", get_merchant_id(test_prs_id))
    print("get all vaccination records:", get_all_vaccination_records())
    # print("get_total_sales_and_orders:", get_total_sales_and_orders(test_merchant_id))
    # print("get_active_product_count:", get_active_product_count(test_merchant_id))
    # print("get_stock_levels:", get_stock_levels(test_merchant_id))
    # print("get_purchase_restrictions:", get_purchase_restrictions(test_prs_id))
    # print("get_vaccination_stats:", get_vaccination_stats(test_merchant_id))
    # If you still have the old helper:
    # print("get_allowed_critical_items:", get_allowed_critical_items(test_prs_id))
