from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.knowledge import Category, Article
from app.schemas.knowledge import CategoryResponse, ArticleResponse, ArticleContentSchema


router = APIRouter(prefix="/knowledge", tags=["knowledge"])

def map_article_to_response(art: Article, relevance_score: Optional[int] = None) -> ArticleResponse:
    return ArticleResponse(
        id=art.id,
        title=art.title,
        slug=art.slug,
        summary=art.summary,
        category=art.category.name,
        category_slug=art.category.slug,
        difficulty=art.difficulty,
        mitreId=art.mitre_id,
        lastUpdated=art.last_updated,
        content=ArticleContentSchema(
            overview=art.content_overview,
            howItWorks=art.content_how_it_works,
            attackFlow=art.attack_flow,
            detection=art.content_detection,
            prevention=art.content_prevention
        ),
        tags=[t.name for t in art.tags],
        relatedTopics=art.related_topics,
        references=[r.title for r in art.references],
        relevanceScore=relevance_score
    )

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    """Retrieve all subject categories."""
    categories = db.query(Category).all()
    return categories

@router.get("/category/{slug}", response_model=CategoryResponse)
def get_category_by_slug(slug: str, db: Session = Depends(get_db)):
    """Retrieve category details by its slug."""
    cat = db.query(Category).filter(Category.slug == slug).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat

@router.get("/articles", response_model=List[ArticleResponse])
def get_articles(
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Retrieve all articles, optionally filtered by keyword, category name, or difficulty."""
    query = db.query(Article)
    
    if category and category.lower() != 'all':
        # Can filter by category slug or name
        query = query.join(Category).filter(
            (Category.name.ilike(category)) | (Category.slug.ilike(category))
        )
        
    if difficulty and difficulty.lower() != 'all':
        query = query.filter(Article.difficulty.ilike(difficulty))
        
    articles = query.all()
    
    # Process text query filtering in python to keep it flexible
    mapped_articles = []
    
    if q and q.strip():
        search_query = q.lower().strip()
        scored_articles = []
        for art in articles:
            score = 0
            if art.title.lower() == search_query:
                score += 100
            elif search_query in art.title.lower():
                score += 85
                
            for t in art.tags:
                if search_query in t.name.lower():
                    score += 15
                    
            if art.mitre_id and search_query in art.mitre_id.lower():
                score += 40
            if search_query in art.summary.lower():
                score += 20
            if search_query in art.content_overview.lower():
                score += 5
                
            if score > 0 or search_query in art.category.name.lower() or search_query in art.category.slug.lower():
                scored_articles.append((art, min(score, 100) or 80))
        
        scored_articles.sort(key=lambda x: x[1], reverse=True)
        mapped_articles = [map_article_to_response(art, score) for art, score in scored_articles]
    else:
        mapped_articles = [map_article_to_response(art, 80) for art in articles]
        
    return mapped_articles

@router.get("/article/{slug}", response_model=ArticleResponse)
def get_article_by_slug(slug: str, db: Session = Depends(get_db)):
    """Retrieve a single article by its slug."""
    art = db.query(Article).filter(Article.slug == slug).first()
    if not art:
        raise HTTPException(status_code=404, detail="Article not found")
    return map_article_to_response(art)
