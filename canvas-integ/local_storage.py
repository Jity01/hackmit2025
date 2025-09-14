import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict

class LocalStorage:
    def __init__(self, base_dir: str = "canvas_data"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(exist_ok=True)

    def save_json_data(self, data: Dict, file_path: str) -> str:
        """Save JSON data to local file"""
        full_path = self.base_dir / file_path

        # Create directories if they don't exist
        full_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            # Convert data to JSON and save
            with open(full_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, default=str, ensure_ascii=False)
            return str(full_path)

        except Exception as e:
            raise

    def save_canvas_data(self, canvas_data: Dict) -> Dict[str, str]:
        """Save Canvas data with organized structure"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        saved_files = {}

        # Save full data dump
        full_dump_path = f"full_dumps/{timestamp}/complete_data.json"
        saved_files['full_dump'] = self.save_json_data(canvas_data, full_dump_path)

        # Save user data separately
        user_data_path = f"user_data/{timestamp}/user_data.json"
        saved_files['user_data'] = self.save_json_data(
            canvas_data['user_data'], user_data_path
        )

        # Save each course's data separately
        for course_id, course_data in canvas_data.get('courses_data', {}).items():
            course_path = f"courses/{course_id}/{timestamp}/course_data.json"
            saved_files[f'course_{course_id}'] = self.save_json_data(
                course_data, course_path
            )

        # Save courses list
        if 'courses_list' in canvas_data:
            courses_list_path = f"courses_list/{timestamp}/courses.json"
            saved_files['courses_list'] = self.save_json_data(
                canvas_data['courses_list'], courses_list_path
            )

        # Save extraction summary
        summary = {
            'extraction_timestamp': canvas_data.get('extraction_timestamp'),
            'user_name': canvas_data.get('user_data', {}).get('user_profile', {}).get('name'),
            'total_courses': len(canvas_data.get('courses_data', {})),
            'files_created': saved_files
        }
        summary_path = f"summaries/{timestamp}/extraction_summary.json"
        saved_files['summary'] = self.save_json_data(summary, summary_path)

        return saved_files

    def list_extractions(self) -> list:
        """List all extraction timestamps"""
        full_dumps_dir = self.base_dir / "full_dumps"
        if not full_dumps_dir.exists():
            return []

        return [d.name for d in full_dumps_dir.iterdir() if d.is_dir()]

    def get_latest_extraction(self) -> str:
        """Get the latest extraction timestamp"""
        extractions = self.list_extractions()
        return max(extractions) if extractions else None