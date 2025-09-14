
from backend.services.drive import GoogleDrive
from backend.storage.cloud import CloudStorage


drive = GoogleDrive("drive")
gcs = CloudStorage("gcs")

def test_directory_view():
    files = gcs.list_files_in_directory("user_diana/")
    print(files)

def test_drive_download_gcs_upload():
    # test drive download and upload
    files = drive.search_file('esg')
    if not files:
        print("No files found in Drive.")
        exit()

    file_packet = drive.load_file(files[0])
    filestream, name, type = file_packet['file'], file_packet['name'], file_packet['type']

    destination = f"test_upload/{name}"
    gcs.upload_file(filestream, destination, type)


    print("File uploaded to GCS:", destination)

def test_gcs_file_search():
    files = drive.search_file('esg')
    print(files)

def test_gcs_all_files_with_paths():
    files = drive.get_all_files_with_paths()
    print([(info['name'], info['mimeType'], info['full_path'], info['folder_path']) for info in files])
    

if __name__ == "__main__":
    # test_gcs_file_search()
    try:
        test_gcs_all_files_with_paths()
    except KeyboardInterrupt:
        exit()

