import os
from dotenv import load_dotenv
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from app.services.source import DataSource
from io import BytesIO
from googleapiclient.http import MediaIoBaseDownload

class GoogleDrive(DataSource):
    def __init__(self, name):
        super().__init__(name)
        self.drive_service = self.authenticate()
        self._native_types = {
            "application/vnd.google-apps.document": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.google-apps.spreadsheet": "text/csv",
            "application/vnd.google-apps.presentation": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        }

    def authenticate(self):
        """
        Uses OAuth to connect to user's google drive.
        Returns the drive connection.
        """
        load_dotenv()
        
        GOOGLE_DRIVE_CREDENTIALS = os.getenv("GOOGLE_DRIVE_CREDENTIALS")
        SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
        flow = InstalledAppFlow.from_client_secrets_file(
            GOOGLE_DRIVE_CREDENTIALS, SCOPES
        )
        creds = flow.run_local_server(port=0)
        drive_service = build('drive', 'v3', credentials=creds)
        return drive_service
    
    def load_all_files(self):
        """
        Loads all files from the user's google drive.
        Returns a list of files containing id, name, and file type.
        """
        if self.drive_service is None:
            pass
            return
        
        all_files = []
        page_token = None

        while True:
            response = self.drive_service.files().list(
                pageSize=100,
                fields="nextPageToken, files(id, name, mimeType)",
                pageToken=page_token
            ).execute()
            
            all_files.extend(response.get('files', []))
            page_token = response.get('nextPageToken')
            
            if not page_token:
                break
        return all_files
    
    def search_file(self, name, type=None):
        """
        Searches for a file with specified name and type in the user's google drive.
        Returns a list of files containing id, name, and file type.
        """
        if self.drive_service is None:
            pass
            return
        results = self.drive_service.files().list(
            q=f"name contains '{name}'",        
            pageSize=1,
            fields="files(id, name, mimeType)").execute()

        items = results.get('files', [])
        return items
        
    def load_file(self, file):
        """
        Loads a file from the user's google drive.
        Returns a dictionary with file stream, name and type.
        """
        id, name = file['id'], file['name']
        type = file['mimeType']
        if type in self._native_types:
            type = self._native_types[type]

        request = self.drive_service.files().export_media(
            fileId=id,
            mimeType=type
            )
        fh = BytesIO()
        downloader = MediaIoBaseDownload(fh, request)

        done = False
        while not done:
            status, done = downloader.next_chunk()
            print(f"Download {int(status.progress() * 100)}%")

        fh.seek(0)
        return {"file": fh, "name": name, "type": type}


    





