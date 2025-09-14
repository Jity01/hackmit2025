from abc import ABC, abstractmethod


class DataSource:
    def __init__(self, name):
        self.name = name
    
    @abstractmethod
    def authenticate(self):
        pass

    @abstractmethod
    def get_file(self):
        pass

    # @abstractmethod
    # def load_file(self, name):
    #     pass


        
