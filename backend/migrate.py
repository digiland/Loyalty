"""
Migration script to add rewards table and update existing tables
Run this after updating the models
"""

from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

def run_migration():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    with engine.connect() as conn:
        # Create rewards table
        conn.execute(text("""
        CREATE TABLE IF NOT EXISTS rewards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            loyalty_program_id INTEGER NOT NULL,
            name VARCHAR NOT NULL,
            description TEXT,
            points_required INTEGER NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            stock_limit INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (loyalty_program_id) REFERENCES loyalty_programs(id)
        );
        """))
        
        # Add loyalty_program_id to transactions if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN loyalty_program_id INTEGER;"))
        except:
            print("loyalty_program_id column already exists in transactions")
        
        # Add cashback_amount to transactions if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN cashback_amount REAL DEFAULT 0.0;"))
        except:
            print("cashback_amount column already exists in transactions")
        
        conn.commit()
        print("Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
