import os
from google.cloud import storage
from dotenv import load_dotenv
from io import BytesIO
import mimetypes

class CloudStorage:
    def __init__(self, name):
        self.name = name
        self.authenticate()

    def authenticate(self):
        load_dotenv()
        cred_path = os.path.join(os.path.dirname(__file__), "../auth/cloud_service.json")
        cred_path = os.path.abspath(cred_path)
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = cred_path

        GOOGLE_CLOUD_BUCKET = os.getenv("GOOGLE_CLOUD_BUCKET")
        self.client = storage.Client()
        self.bucket = self.client.bucket(GOOGLE_CLOUD_BUCKET)

    def open_local_file(self, file_path):
        """
        Opens a local file and returns the file stream and mime type.
        """
        type = mimetypes.guess_type(file_path)
        return open(file_path, "rb"), type

    def upload_file(self, file_stream, destination_path, mime_type):
        """
        Uploads a file to GCS.

        Args:
            file_stream: File
            destination_path: Path in the bucket (e.g., "user_123/report.pdf")
        """
        blob = self.bucket.blob(destination_path)
        blob.upload_from_file(file_stream, content_type=mime_type)
        return True

    def download_file(self, file_path, file_name):
        """
        Downloads a file from GCS.
        """
        blob = self.bucket.blob(file_path)
        blob.download_to_filename(file_name)
        return True


    def list_files_in_directory(self, current_path):
        """
        List only files and folders directly under the current_path.
        """
        blobs = self.client.list_blobs(
            self.bucket,
            prefix=current_path,
            delimiter='/'
        )
        files = []
        folders = []

        for page in blobs.pages:
            for pref in page.prefixes:
                folders.append(pref[len(current_path):])
            for blob in page:
                if not blob.name.endswith('/'):
                    relative_name = blob.name[len(current_path):]
                    files.append(relative_name)
        return {"files": files, "folders": folders}
    
    def delete_file(self, file_path):
        """Deletes a file from GCS."""
        blob = self.bucket.blob(file_path)
        blob.delete()
        return True

    def exists(self, file_path):
        """Checks if a file exists in GCS."""
        blob = self.bucket.blob(file_path)
        return blob.exists()
    
    def copy_file(self, source_path, destination_path):
        source_blob = self.bucket.blob(source_path)
        self.bucket.copy_blob(source_blob, self.bucket, destination_path)
        return True

    def move_file(self, source_path, destination_path):
        self.copy_file(source_path, destination_path)
        self.delete_file(source_path)
        return True

    def make_public(self, file_path):
        blob = self.bucket.blob(file_path)
        blob.make_public()
        return blob.public_url

    def preview_file(self, file_path):
        """
        Saves the file to a io buffer for in-app preview.
        Returns the file handle and mime type.
        """
        blob = self.bucket.blob(file_path)
        fh = BytesIO()
        blob.download_to_file(fh)
        fh.seek(0)
        return fh, blob.content_type

if __name__ == "__main__":

    pass
    # # test code
    # with open("../../tf1.pdf", "rb") as f:
    #     upload_file(f, "tf1.pdf")
    # print("Successfully uploaded file")
    # download_file("tf1.pdf", "test2.pdf")

