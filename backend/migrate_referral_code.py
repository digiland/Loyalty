"""
Migration script to properly add referral_code column to customers table
This handles the SQLite limitation with UNIQUE columns
"""

from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

def run_migration():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if referral_code column exists
        result = conn.execute(text("PRAGMA table_info(customers);"))
        columns = [row[1] for row in result]
        
        if 'referral_code' not in columns:
            # Add referral_code column without UNIQUE constraint first
            conn.execute(text("ALTER TABLE customers ADD COLUMN referral_code VARCHAR;"))
            print("Added referral_code column to customers table")
            
            # Create a unique index on referral_code column
            try:
                conn.execute(text("CREATE UNIQUE INDEX ix_customers_referral_code ON customers (referral_code);"))
                print("Created unique index on referral_code")
            except Exception as e:
                print(f"Index already exists or error creating index: {e}")
        else:
            print("referral_code column already exists in customers table")
        
        conn.commit()
        print("Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
