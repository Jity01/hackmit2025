import json
from datetime import datetime
from typing import Dict, List
from services.canvas_client import CanvasClient

class CanvasDataExtractor:
    def __init__(self, canvas_client: CanvasClient):
        self.client = canvas_client

    def extract_user_data(self) -> Dict:
        """Extract all user-related data"""
        user_profile = self.client.get_user_profile()

        enrollments = self.client.get_enrollments()

        calendar_events = self.client.get_calendar_events()

        return {
            'user_profile': user_profile,
            'enrollments': enrollments,
            'calendar_events': calendar_events,
            'extracted_at': datetime.now().isoformat()
        }

    def extract_course_data(self, course_id: str) -> Dict:
        """Extract all data for a specific course"""

        course_data = {
            'course_id': course_id,
            'extracted_at': datetime.now().isoformat()
        }

        # Get assignments
        try:
            course_data['assignments'] = self.client.get_course_assignments(course_id)
        except Exception as e:
            course_data['assignments'] = []

        # Get discussions
        try:
            course_data['discussions'] = self.client.get_course_discussions(course_id)
        except Exception as e:
            course_data['discussions'] = []

        # Get files
        try:
            course_data['files'] = self.client.get_course_files(course_id)
        except Exception as e:
            course_data['files'] = []

        # Get modules
        try:
            course_data['modules'] = self.client.get_course_modules(course_id)
        except Exception as e:
            course_data['modules'] = []

        # Get announcements
        try:
            course_data['announcements'] = self.client.get_course_announcements(course_id)
        except Exception as e:
            course_data['announcements'] = []

        return course_data

    def extract_all_data(self) -> Dict:
        """Extract all available data from Canvas"""

        all_data = {
            'extraction_timestamp': datetime.now().isoformat(),
            'user_data': {},
            'courses_data': {}
        }

        # Extract user data
        all_data['user_data'] = self.extract_user_data()

        # Get courses and extract data for each
        courses = self.client.get_courses()
        all_data['courses_list'] = courses


        for course in courses:
            course_id = course['id']
            course_name = course.get('name', 'Unknown Course')

            try:
                all_data['courses_data'][course_id] = self.extract_course_data(course_id)
            except Exception as e:
                all_data['courses_data'][course_id] = {
                    'error': str(e),
                    'extracted_at': datetime.now().isoformat()
                }

        return all_data