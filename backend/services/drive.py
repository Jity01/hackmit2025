import os
from dotenv import load_dotenv
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from services.source import DataSource
from io import BytesIO
from googleapiclient.http import MediaIoBaseDownload


class GoogleDrive(DataSource):
   def __init__(self, name):
       super().__init__(name)
       self.drive_service = None
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
       GOOGLE_DRIVE_CREDENTIALS = os.path.join(os.path.dirname(__file__), "../auth/drive_credentials.json")
       SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
       flow = InstalledAppFlow.from_client_secrets_file(
           GOOGLE_DRIVE_CREDENTIALS, SCOPES
       )
       creds = flow.run_local_server(port=0)
       self.drive_service = build('drive', 'v3', credentials=creds)
       return self.drive_service


   def get_all_files(self):
       """
       Loads all files from the user's google drive.
       Returns a list of dictionaries containing id, name, and file type.


       Sample output: [{'id': '483290', 'name': 'hello', 'mimeType': 'application/pdf'}]
       """
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


   def get_files(self, keyword, page_size=1):
       """
       Searches for a file with specified name and type in the user's google drive.
       Returns a list of dictionaries containing id, name, and file type.


       Sample output: [{'id': '483290', 'name': 'hello', 'mimeType': 'application/pdf'}]
       """

       if self.drive_service is None:
           print("Please connect to the Google Drive first.")
           return
       results = self.drive_service.files().list(
           q=f"name contains '{keyword}'",
           pageSize=page_size,
           fields="files(id, name, mimeType)").execute()

        files = results.get('files', [])
        return files

    def _load_file(self, file):
        """
        Loads a file from the user's google drive.
        Mutates the file dictionary by adding a filestream key.
        """
        id, name = file['id'], file['name']
        type = file['mimeType']
        if type in self._native_types:
            type = self._native_types[type]

       files = results.get('files', [])
       return files


   def _load_file(self, file):
       """
       Loads a file from the user's google drive.
       Mutates the file dictionary by adding a filestream key.
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


       fh.seek(0)
       file['stream'] = fh




    def get_all_files_with_paths(self, root_folder_id='root'):
        """
        Returns all files with their paths.
        Sample output: [{id, name, mimeType, full_path, folder_path}, ...]
        """
   def get_all_files_with_paths(self, root_folder_id='root'):
       """
       Returns all files with their paths.
       Sample output: [{id, name, mimeType, full_path, folder_path}, ...]
       """


        all_files_with_paths = []

       all_files_with_paths = []




       folder_queue = [(root_folder_id, "")]


       while folder_queue:
           current_folder_id, current_path = folder_queue.pop(0)


           response = self.drive_service.files().list(
               q=f"'{current_folder_id}' in parents and trashed=false", # grab all files with current directory as parent
               pageSize=100,
               fields="files(id, name, mimeType)"
           ).execute()


           items = response.get('files', [])


           # Process each item in this folder
           for item in items:
               item_name = item['name']
               item_full_path = f"{current_path}/{item_name}" if current_path else f"/{item_name}"


               if item['mimeType'] == 'application/vnd.google-apps.folder':
                   # It's a folder - add to queue for later processing
                   print(f"Found subfolder: {item_name}")
                   folder_queue.append((item['id'], item_full_path))
               else:
                   # It's a file - add to results
                   print(f"Found file: {item_name}")
                   file_with_path = {
                       **item,
                       'full_path': item_full_path,
                       'folder_path': current_path if current_path else "",
                   }
                   self._load_file(file_with_path)
                   all_files_with_paths.append(file_with_path)


       return all_files_with_paths
