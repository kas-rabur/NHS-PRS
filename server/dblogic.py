import pyodbc
import bcrypt

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
            "SELECT Password_Hash, PRS_Id, Role_ID, Name, User_Type "
            "FROM [USER] WHERE National_Identifier = ?",
            national_id
        )
        row = cur.fetchone()
        if not row:
            return {"success": False, "error": "Invalid credentials."}

        stored_hash, prs_id, role_id, name, user_type = row
        # Verify password
        if not bcrypt.checkpw(raw_password, stored_hash.encode("utf-8")):
            return {"success": False, "error": "Invalid credentials."}

        return {
            "success": True,
            "prsId": prs_id,
            "roleId": role_id,
            "name": name,  
            "userType": user_type
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
        cur.execute(
            "SELECT 1 FROM [USER] WHERE National_Identifier = ?",
            national_id
        )
        if cur.fetchone():
            return {"success": False, "error": "A user with that National ID already exists."}

        insert_sql = """
        INSERT INTO [USER] (
            National_Identifier, DateOfBirth, Digit_Group,
            Name, Address, User_Type, Role_ID, Schedule_ID, Password_Hash
        )
        OUTPUT inserted.PRS_Id
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        cur.execute(insert_sql, (
            national_id, dob, digit_group, name,
            address, user_type, role_id, schedule_id, hashed
        ))

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
    cur.execute(
        "SELECT * FROM dbo.VACCINATION_RECORD WHERE PRS_Id = ?",
        (prs_id,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    print("Vaccination records: ", rows)
    return [
        {
            "prsId":    r[1],
            "vaccineName":r[2],
            "dose": r[3],
            "date": r[4],
            "verified": r[5],
        }
        for r in rows
    ]
    
