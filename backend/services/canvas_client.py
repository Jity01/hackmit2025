import requests
import json
import time
from typing import Dict, List, Optional
from urllib.parse import urljoin

class CanvasClient:
    def __init__(self, base_url: str, access_token: str):
        self.base_url = base_url.rstrip('/')
        self.access_token = access_token
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/json+canvas-string-ids'
        })

    def _make_request(self, endpoint: str, params: Dict = None) -> requests.Response:
        """Make a request to the Canvas API with basic error handling"""
        url = urljoin(f"{self.base_url}/api/v1/", endpoint.lstrip('/'))

        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            return response
        except requests.exceptions.RequestException as e:
            raise

    def _get_paginated_data(self, endpoint: str, params: Dict = None) -> List[Dict]:
        """Get all pages of data from a paginated endpoint"""
        all_data = []
        url = endpoint

        while url:
            response = self._make_request(url, params)
            data = response.json()

            if isinstance(data, list):
                all_data.extend(data)
            else:
                all_data.append(data)

            # Check for pagination
            links = response.links
            url = links.get('next', {}).get('url')
            if url:
                # Extract just the endpoint part for next request
                url = url.replace(f"{self.base_url}/api/v1/", "")

            # Simple rate limiting
            time.sleep(0.1)

        return all_data

    def get_user_profile(self) -> Dict:
        """Get the current user's profile"""
        response = self._make_request('/users/self/profile')
        return response.json()

    def get_courses(self) -> List[Dict]:
        """Get all courses for the user"""
        return self._get_paginated_data('/courses', {'enrollment_state': 'active'})

    def get_course_assignments(self, course_id: str) -> List[Dict]:
        """Get all assignments for a specific course"""
        return self._get_paginated_data(f'/courses/{course_id}/assignments')

    def get_course_discussions(self, course_id: str) -> List[Dict]:
        """Get all discussions for a specific course"""
        return self._get_paginated_data(f'/courses/{course_id}/discussion_topics')

    def get_course_files(self, course_id: str) -> List[Dict]:
        """Get all files for a specific course"""
        return self._get_paginated_data(f'/courses/{course_id}/files')

    def get_course_modules(self, course_id: str) -> List[Dict]:
        """Get all modules for a specific course"""
        return self._get_paginated_data(f'/courses/{course_id}/modules')

    def get_course_announcements(self, course_id: str) -> List[Dict]:
        """Get all announcements for a specific course"""
        return self._get_paginated_data(f'/courses/{course_id}/discussion_topics',
                                      {'only_announcements': True})

    def get_enrollments(self) -> List[Dict]:
        """Get all enrollments for the user"""
        return self._get_paginated_data('/users/self/enrollments')

    def get_calendar_events(self) -> List[Dict]:
        """Get calendar events"""
        return self._get_paginated_data('/calendar_events')