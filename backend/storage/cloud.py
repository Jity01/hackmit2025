import os
from google.cloud import storage
from dotenv import load_dotenv
from io import BytesIO
import mimetypes

class CloudStorage:
    def __init__(self):
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

    def create_folder(self, path):
        """
        Given a well-formed path, creates a folder in GCS.
        Does not overwrite existing directory if path already exists.
        """
        path = path.rstrip('/') + '/'
        try:
            # Create an empty blob to represent the folder
            blob = self.bucket.blob(path)
            if not blob.exists():
                blob.upload_from_string('', content_type='application/x-directory')
            return True
        except Exception as e:
            print(f"Error creating folder: {e}")
            return False

    def upload_file(self, file_dict, user_prefix="user_files"):
        """
        Uploads a file to GCS with a user-specific directory prefix.

        Args:
            file_dict: a dictionary containing (stream, name, mimeType, full_path, folder_path)
            user_prefix: Directory prefix for user files (default: "user_files")
        """
        # Create the user-prefixed path
        original_path = file_dict['full_path'].lstrip('/')  # Remove leading slash if present
        user_path = f"{user_prefix}/{original_path}"

        # Create the folder structure if needed
        folder_path = f"{user_prefix}{file_dict['folder_path']}"
        if folder_path and not folder_path.endswith('/'):
            folder_path += '/'

        # Check if folder exists, create if not
        folder_blob = self.bucket.blob(folder_path)
        if folder_path != f"{user_prefix}/" and not folder_blob.exists():
            self.create_folder(folder_path)

        # Upload the file to the user-prefixed path
        blob = self.bucket.blob(user_path)
        stream, mime_type = file_dict['stream'], file_dict['mimeType']

        # Reset stream position to beginning
        stream.seek(0)

        blob.upload_from_file(stream, content_type=mime_type)

        print(f"Uploaded file to: {user_path}")
        return True

    def migrate_files(self, file_dicts_with_paths, user_prefix="user_files"):
        """
        Migrate files with a user-specific directory prefix.

        Args:
            file_dicts_with_paths: List of file dictionaries from Google Drive
            user_prefix: Directory prefix for organizing user files
        """
        success_count = 0
        for file in file_dicts_with_paths:
            try:
                self.upload_file(file, user_prefix)
                success_count += 1
            except Exception as e:
                print(f"Failed to upload {file.get('name', 'unknown')}: {e}")

        print(f"Successfully migrated {success_count}/{len(file_dicts_with_paths)} files")
        return success_count


    def download_file(self, file_path, file_name):
        """
        Downloads a file from GCS.
        """
        blob = self.bucket.blob(file_path)
        blob.download_to_filename(file_name)
        return True


    def list_files_in_directory(self, current_path: str = ""):
        """
        List only files and folders directly under the current_path.

        Returns a dictionary of list of files and folder names.
        Sample output {"files":['hello.pdf'], "folders": ['/user', '/public']}
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

    def open_stream(self, file_path: str):
        """
        return (fh, mime, filename) where fh is a streaming, file-like object.
        nothing is written to disk and we don't load full bytes into memory.
        """
        blob = self.bucket.blob(file_path)
        fh = blob.open("rb")                  # streaming handle
        # fetch metadata for correct headers
        try:
            blob.reload()
        except Exception:
            pass
        mime = blob.content_type or mimetypes.guess_type(file_path)[0] or "application/octet-stream"
        filename = os.path.basename(file_path)
        return fh, mime, filename

    def list_media(self, prefix: str = "", exts: tuple[str, ...] = ("pdf", "mp4")):
        """
        return a flat list of pdf/mp4 objects under `prefix` (recursive).
        each item: {path, name, size, content_type, updated}
        """
        exts = tuple(e.lower().lstrip(".") for e in exts)
        out = []
        for blob in self.client.list_blobs(self.bucket, prefix=prefix or None):
            if blob.name.endswith("/"):
                continue
            name = os.path.basename(blob.name)
            ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
            if ext not in exts:
                continue
            out.append({
                "path": blob.name,
                "name": name,
                "size": blob.size,
                "content_type": (blob.content_type or ""),
                "updated": (blob.updated.isoformat() if getattr(blob, "updated", None) else None),
            })
        # newest first
        out.sort(key=lambda x: x["updated"] or "", reverse=True)
        return out


if __name__ == "__main__":

    pass
    # # test code
    # with open("../../tf1.pdf", "rb") as f:
    #     upload_file(f, "tf1.pdf")
    # print("Successfully uploaded file")
    # download_file("tf1.pdf", "test2.pdf")
