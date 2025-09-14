from dotenv import load_dotenv
import os
import psycopg
from psycopg_pool import ConnectionPool

load_dotenv()
DATABASE_URL = os.environ['DATABASE_URL']

pool = ConnectionPool(DATABASE_URL, min_size=1, max_size=5)

def fetch_all(sql, params=None):
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            return cur.fetchall()