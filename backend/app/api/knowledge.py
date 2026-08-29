from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.knowledge import Category, Article
from app.schemas.knowledge import CategoryResponse, ArticleResponse, ArticleContentSchema, ArticleListResponse


router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])

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

@router.get("/articles", response_model=ArticleListResponse)
def get_articles(
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    page: Optional[int] = Query(None),
    limit: Optional[int] = Query(None),
    sort_by: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Retrieve articles with support for text search, categories, difficulty, tags, sorting, and pagination."""
    query = db.query(Article)
    
    if category and category.lower() != 'all':
        # Can filter by category slug or name
        query = query.join(Category).filter(
            (Category.name.ilike(category)) | (Category.slug.ilike(category))
        )
        
    if difficulty and difficulty.lower() != 'all':
        query = query.filter(Article.difficulty.ilike(difficulty))

    if tag and tag.lower() != 'all':
        from app.models.knowledge import Tag as DBTag
        query = query.join(Article.tags).filter(
            (DBTag.name.ilike(tag)) | (DBTag.slug.ilike(tag))
        )
        
    articles = query.all()
    
    # Process text query filtering in Python to support complex relevance scoring
    scored_articles = []
    has_query = q and q.strip()
    
    if has_query:
        search_query = q.lower().strip()
        for art in articles:
            score = 0
            title_lower = art.title.lower()
            
            # 1. Exact title match
            if title_lower == search_query:
                score = 100
            # 2. Title prefix match
            elif title_lower.startswith(search_query):
                score = 90
            # 2b. Title substring match
            elif search_query in title_lower:
                score = 80
                
            # 3. Tag match
            for t in art.tags:
                tag_name_lower = t.name.lower()
                if search_query == tag_name_lower:
                    score = max(score, 50)
                elif search_query in tag_name_lower:
                    score = max(score, 40)
                    
            # 4. Category match
            cat_name_lower = art.category.name.lower()
            cat_slug_lower = art.category.slug.lower()
            if search_query == cat_name_lower or search_query == cat_slug_lower:
                score = max(score, 45)
            elif search_query in cat_name_lower:
                score = max(score, 30)
                
            # 5. MITRE technique ID match
            if art.mitre_id:
                mitre_lower = art.mitre_id.lower()
                if search_query == mitre_lower:
                    score = max(score, 60)
                elif search_query in mitre_lower:
                    score = max(score, 35)
                    
            # 6. Summary/content match
            if search_query in art.summary.lower():
                score = max(score, 25)
            if search_query in art.content_overview.lower():
                score = max(score, 15)
            if search_query in art.content_how_it_works.lower():
                score = max(score, 15)
            if search_query in art.content_detection.lower():
                score = max(score, 15)
            if search_query in art.content_prevention.lower():
                score = max(score, 15)
                
            if score > 0:
                scored_articles.append((art, score))
    else:
        # Default score when there is no query
        for art in articles:
            scored_articles.append((art, 100))
            
    # Apply sorting
    if sort_by == 'az':
        scored_articles.sort(key=lambda x: x[0].title.lower())
    elif sort_by in ('updated', 'recently_updated'):
        scored_articles.sort(key=lambda x: x[0].last_updated, reverse=True)
    else:
        # Default is relevance
        if has_query:
            # Sort by score descending, then by title alphabetically
            scored_articles.sort(key=lambda x: (-x[1], x[0].title.lower()))
        else:
            scored_articles.sort(key=lambda x: x[0].last_updated, reverse=True)
            
    mapped_articles = [map_article_to_response(art, score if has_query else None) for art, score in scored_articles]
    
    total = len(mapped_articles)
    p = page if page is not None else 1
    l = limit if limit is not None else total
    
    start = (p - 1) * l
    end = start + l
    paginated_items = mapped_articles[start:end]
    
    return ArticleListResponse(
        total=total,
        page=p,
        limit=l,
        items=paginated_items
    )

@router.get("/article/{slug}", response_model=ArticleResponse)
def get_article_by_slug(slug: str, db: Session = Depends(get_db)):
    """Retrieve a single article by its slug."""
    art = db.query(Article).filter(Article.slug == slug).first()
    if not art:
        raise HTTPException(status_code=404, detail="Article not found")
    return map_article_to_response(art)
