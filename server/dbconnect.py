from sqlalchemy import create_engine, text

server = "localhost\\KAS"
database = "NHS-PRS"
username = "your_username"
password = "your_password"
driver = "ODBC Driver 17 for SQL Server"


connection_string = (
    f"mssql+pyodbc://@{server}/{database}"
    f"?driver={driver.replace(' ', '+')}&trusted_connection=yes"
)


# Create the engine
try:
    engine = create_engine(connection_string)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT GETDATE() AS CurrentTime"))
        for row in result:
            print(f"✅ Connected! SQL Server time is: {row['CurrentTime']}")
except Exception as e:
    print("❌ Failed to connect to SQL Server.")
    print("Error:", e)
