from app.database.connection import db
from app.models.mixins import UUIDMixin, TimestampMixin
class BaseModel(db.Model, UUIDMixin, TimestampMixin):
    """Base model with common fields"""
    __abstract__ = True
    def save(self):
        """Save instance to database"""
        db.session.add(self)
        db.session.commit()
        return self

    def delete(self):
        """Delete instance from database"""
        db.session.delete(self)
        db.session.commit()

    def update(self, **kwargs):
        """Update instance attributes"""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
            db.session.commit()
        return self

    @classmethod
    def find_by_id(cls, id):
        """Find record by ID"""
        return cls.query.get(id)

    @classmethod
    def find_all(cls):
        """Get all records"""
        return cls.query.all()
        
    def to_dict(self):
        """Convert model to dictionary"""
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}