from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from storage.database import fetch_all, pool

app = Flask(__name__)
CORS(app)

@app.route('/api/check-access', methods=['POST'])
def check_access():
    try:
        data = request.get_json()
        entity = data.get('entity', '')

        # Check if StartUp is in demo_table and has access
        sql = "SELECT * FROM demo_table WHERE entity = %s AND access = TRUE"
        result = fetch_all(sql, (entity,))

        has_access = len(result) > 0

        return jsonify({'hasAccess': has_access})

    except Exception as e:
        print(f"Error checking access: {e}")
        return jsonify({'hasAccess': False})

@app.route('/api/grant-access', methods=['POST'])
def grant_access():
    try:
        data = request.get_json()
        entity = data.get('entity', '')

        # Insert or update StartUp entity with access = TRUE
        with pool.connection() as conn:
            with conn.cursor() as cur:
                # Use INSERT ... ON CONFLICT to handle duplicates
                sql = """
                    INSERT INTO demo_table (entity, access)
                    VALUES (%s, TRUE)
                    ON CONFLICT (entity)
                    DO UPDATE SET access = TRUE
                """
                cur.execute(sql, (entity,))
                conn.commit()

        return jsonify({'success': True})

    except Exception as e:
        print(f"Error granting access: {e}")
        return jsonify({'success': False})

if __name__ == '__main__':
    app.run(debug=True, port=5000)