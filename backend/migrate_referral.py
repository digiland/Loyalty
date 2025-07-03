"""
Migration script to add referral_code column and other missing columns
Run this after updating the models
"""

from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

def run_migration():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    with engine.connect() as conn:
        # Add referral_code to customers table
        try:
            conn.execute(text("ALTER TABLE customers ADD COLUMN referral_code VARCHAR UNIQUE;"))
            print("Added referral_code column to customers table")
        except Exception as e:
            print(f"referral_code column already exists in customers: {e}")
        
        # Add tier_id to transactions table
        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN tier_id INTEGER;"))
            print("Added tier_id column to transactions table")
        except Exception as e:
            print(f"tier_id column already exists in transactions: {e}")
        
        # Add referral_id to transactions table
        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN referral_id INTEGER;"))
            print("Added referral_id column to transactions table")
        except Exception as e:
            print(f"referral_id column already exists in transactions: {e}")
        
        # Create referrals table if it doesn't exist
        try:
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS referrals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                referrer_id INTEGER NOT NULL,
                referred_id INTEGER NOT NULL,
                business_id INTEGER NOT NULL,
                loyalty_program_id INTEGER NOT NULL,
                points_awarded INTEGER NOT NULL,
                cashback_awarded REAL DEFAULT 0.0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (referrer_id) REFERENCES customers(id),
                FOREIGN KEY (referred_id) REFERENCES customers(id),
                FOREIGN KEY (business_id) REFERENCES businesses(id),
                FOREIGN KEY (loyalty_program_id) REFERENCES loyalty_programs(id)
            );
            """))
            print("Created referrals table")
        except Exception as e:
            print(f"Error creating referrals table: {e}")
        
        # Create customer_memberships table if it doesn't exist
        try:
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS customer_memberships (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                loyalty_program_id INTEGER NOT NULL,
                current_tier_id INTEGER,
                points INTEGER DEFAULT 0,
                is_paid_member BOOLEAN DEFAULT FALSE,
                membership_start DATETIME,
                membership_end DATETIME,
                FOREIGN KEY (customer_id) REFERENCES customers(id),
                FOREIGN KEY (loyalty_program_id) REFERENCES loyalty_programs(id),
                FOREIGN KEY (current_tier_id) REFERENCES tier_levels(id)
            );
            """))
            print("Created customer_memberships table")
        except Exception as e:
            print(f"Error creating customer_memberships table: {e}")
        
        # Create tier_levels table if it doesn't exist
        try:
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS tier_levels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                loyalty_program_id INTEGER NOT NULL,
                name VARCHAR NOT NULL,
                min_points INTEGER NOT NULL,
                benefits TEXT,
                multiplier REAL DEFAULT 1.0,
                FOREIGN KEY (loyalty_program_id) REFERENCES loyalty_programs(id)
            );
            """))
            print("Created tier_levels table")
        except Exception as e:
            print(f"Error creating tier_levels table: {e}")
        
        # Add program_type to loyalty_programs if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE loyalty_programs ADD COLUMN program_type VARCHAR;"))
            print("Added program_type column to loyalty_programs table")
        except Exception as e:
            print(f"program_type column already exists in loyalty_programs: {e}")
        
        # Add earn_rate to loyalty_programs if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE loyalty_programs ADD COLUMN earn_rate REAL DEFAULT 1.0;"))
            print("Added earn_rate column to loyalty_programs table")
        except Exception as e:
            print(f"earn_rate column already exists in loyalty_programs: {e}")
        
        # Add membership-specific fields to loyalty_programs
        try:
            conn.execute(text("ALTER TABLE loyalty_programs ADD COLUMN membership_fee REAL;"))
            print("Added membership_fee column to loyalty_programs table")
        except Exception as e:
            print(f"membership_fee column already exists in loyalty_programs: {e}")
        
        try:
            conn.execute(text("ALTER TABLE loyalty_programs ADD COLUMN membership_period_days INTEGER DEFAULT 365;"))
            print("Added membership_period_days column to loyalty_programs table")
        except Exception as e:
            print(f"membership_period_days column already exists in loyalty_programs: {e}")
        
        try:
            conn.execute(text("ALTER TABLE loyalty_programs ADD COLUMN membership_benefits TEXT;"))
            print("Added membership_benefits column to loyalty_programs table")
        except Exception as e:
            print(f"membership_benefits column already exists in loyalty_programs: {e}")
        
        conn.commit()
        print("Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
