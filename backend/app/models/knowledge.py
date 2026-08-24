import uuid
from datetime import datetime
from sqlalchemy import Table, Column, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

# Junction table for Article <-> Tag (many-to-many)
article_tags = Table(
    "article_tags",
    Base.metadata,
    Column("article_id", String(36), ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String(36), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

# Junction table for Article <-> MitreTechnique (many-to-many)
article_mitre_techniques = Table(
    "article_mitre_techniques",
    Base.metadata,
    Column("article_id", String(36), ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True),
    Column("technique_id", String(36), ForeignKey("mitre_techniques.id", ondelete="CASCADE"), primary_key=True),
)

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=True)
    icon: Mapped[str] = mapped_column(String(50), nullable=True)

    # Relationships
    articles: Mapped[list["Article"]] = relationship("Article", back_populates="category", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Category {self.name}>"

class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    # Relationships
    articles: Mapped[list["Article"]] = relationship("Article", secondary=article_tags, back_populates="tags")

    def __repr__(self) -> str:
        return f"<Tag {self.name}>"

class MitreTechnique(Base):
    __tablename__ = "mitre_techniques"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    technique_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)  # e.g., T1486
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    tactic: Mapped[str] = mapped_column(String(100), nullable=True)

    # Relationships
    articles: Mapped[list["Article"]] = relationship("Article", secondary=article_mitre_techniques, back_populates="mitre_techniques")

    def __repr__(self) -> str:
        return f"<MitreTechnique {self.technique_id}>"

class Reference(Base):
    __tablename__ = "references"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    article_id: Mapped[str] = mapped_column(String(36), ForeignKey("articles.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=True)

    # Relationships
    article: Mapped["Article"] = relationship("Article", back_populates="references")

    def __repr__(self) -> str:
        return f"<Reference {self.title}>"

class Article(Base):
    __tablename__ = "articles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    summary: Mapped[str] = mapped_column(String(1000), nullable=False)
    
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(50), nullable=False)  # Beginner, Intermediate, Advanced
    mitre_id: Mapped[str] = mapped_column(String(50), nullable=True)     # Primary MITRE technique ID, e.g. T1486 (for quick UI badge)
    
    last_updated: Mapped[str] = mapped_column(String(50), nullable=False, default="2026-08-24")

    # Structured article sections
    content_overview: Mapped[str] = mapped_column(Text, nullable=False)
    content_how_it_works: Mapped[str] = mapped_column(Text, nullable=False)
    content_detection: Mapped[str] = mapped_column(Text, nullable=False)
    content_prevention: Mapped[str] = mapped_column(Text, nullable=False)

    # Attack flow step strings stored as JSON array (list of strings)
    attack_flow: Mapped[list[str]] = mapped_column(JSON, default=list)

    # Related article slug strings stored as JSON array (list of strings)
    related_topics: Mapped[list[str]] = mapped_column(JSON, default=list)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category: Mapped["Category"] = relationship("Category", back_populates="articles")
    tags: Mapped[list["Tag"]] = relationship("Tag", secondary=article_tags, back_populates="articles")
    mitre_techniques: Mapped[list["MitreTechnique"]] = relationship("MitreTechnique", secondary=article_mitre_techniques, back_populates="articles")
    references: Mapped[list["Reference"]] = relationship("Reference", back_populates="article", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Article {self.title}>"
