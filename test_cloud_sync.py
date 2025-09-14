
from app.services.drive import GoogleDrive
from app.storage.cloud import CloudStorage


drive = GoogleDrive("drive")
gcs = CloudStorage("gcs")

files = gcs.list_files_in_directory("user_diana/")
print(files)
# test drive download and upload
# files = drive.search_file('esg')
# if not files:
#     print("No files found in Drive.")
#     exit()

# file_packet = drive.load_file(files[0])
# filestream, name, type = file_packet['file'], file_packet['name'], file_packet['type']

# destination = f"test_upload/{name}"
# gcs.upload_file(filestream, destination, type)


# print("File uploaded to GCS:", destination)
