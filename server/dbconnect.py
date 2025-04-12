import pyodbc
print(pyodbc.drivers())

try:
    conn = pyodbc.connect(
        'DRIVER={ODBC Driver 18 for SQL Server};'
        'SERVER=ML-RefVm-759941;' 
        'DATABASE=PRS;'
        'UID=sa;'
        'PWD=sa1234'
    )
    print("✅ Connection successful")
except Exception as e:
    print("❌ Connection failed:", e)
