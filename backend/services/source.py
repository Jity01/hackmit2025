from abc import ABC, abstractmethod


class DataSource:
    def __init__(self, name):
        self.name = name
    
    @abstractmethod
    def authenticate(self):
        pass

    @abstractmethod
    def load_all_files(self):
        pass

    @abstractmethod
    def load_file(self, name):
        pass


        
