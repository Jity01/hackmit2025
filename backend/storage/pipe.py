class Pipe:
    """
    A class that migrates data from a `DataSource` to the cloud storage.
    """
    def __init__(self, data_source, cloud):
        self.source = data_source
        self.cloud = cloud

    def migrate_all(self):
        all_files = self.source.get_all_files()
        self.cloud.migrate_files(all_files)

