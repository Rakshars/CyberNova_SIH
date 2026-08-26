from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field

class CategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None

    model_config = {"from_attributes": True}

class TagResponse(BaseModel):
    id: str
    name: str
    slug: str

    model_config = {"from_attributes": True}

class MitreTechniqueResponse(BaseModel):
    id: str
    technique_id: str
    name: str
    description: Optional[str] = None
    tactic: Optional[str] = None

    model_config = {"from_attributes": True}

class ArticleContentSchema(BaseModel):
    overview: str
    howWorks: str = Field(..., serialization_alias="howItWorks")  # maps content_how_it_works to howItWorks
    attackFlow: list[str] = Field(..., serialization_alias="attackFlow")  # maps attack_flow to attackFlow
    detection: str
    prevention: str

class ArticleResponse(BaseModel):
    id: str
    title: str
    slug: str
    summary: str
    category: str
    category_slug: str
    difficulty: str
    mitreId: Optional[str] = Field(default=None, serialization_alias="mitreId")
    lastUpdated: str = Field(..., serialization_alias="lastUpdated")
    content: ArticleContentSchema
    tags: list[str]
    relatedTopics: list[str] = Field(..., serialization_alias="relatedTopics")
    references: list[str]

    relevanceScore: Optional[int] = Field(default=None, serialization_alias="relevanceScore")

    model_config = {"from_attributes": True, "populate_by_name": True}
