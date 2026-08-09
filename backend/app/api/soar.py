"""
api/soar.py
-----------
API router for SOAR (Security Orchestration, Automation, and Response) Playbooks and Audit Logs.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.response.policy_engine import policy_engine

router = APIRouter(prefix="/api/soar", tags=["SOAR & Response Playbooks"])

class PolicyCreateSchema(BaseModel):
    name: str
    condition_type: str
    threshold: Optional[int] = 80
    action_type: str
    description: str

class PolicyToggleSchema(BaseModel):
    enabled: bool

@router.get("/policies")
def list_policies(db: Session = Depends(get_db)):
    """Returns list of active SOAR Playbook policies."""
    return {"policies": policy_engine.get_policies(db)}

@router.post("/policies")
def create_policy(data: PolicyCreateSchema, db: Session = Depends(get_db)):
    """Creates a new autonomous SOAR policy rule."""
    policy = policy_engine.add_policy(
        db=db,
        name=data.name,
        condition_type=data.condition_type,
        threshold=data.threshold,
        action_type=data.action_type,
        description=data.description
    )
    return {"status": "success", "policy": policy}

@router.patch("/policies/{policy_id}")
def toggle_policy(policy_id: str, data: PolicyToggleSchema, db: Session = Depends(get_db)):
    """Toggles policy enabled/disabled state."""
    updated = policy_engine.toggle_policy(db, policy_id, data.enabled)
    if not updated:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {"status": "success", "policy": updated}

@router.delete("/policies/{policy_id}")
def delete_policy(policy_id: str, db: Session = Depends(get_db)):
    """Deletes a SOAR policy rule from the database."""
    deleted = policy_engine.delete_policy(db, policy_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {"status": "success", "message": "Policy deleted"}

@router.get("/logs")
def get_execution_logs(db: Session = Depends(get_db)):
    """Returns execution audit logs of autonomous SOAR actions."""
    return {"logs": policy_engine.get_execution_logs(db)}

@router.post("/test-trigger")
def test_trigger(incident_data: dict, db: Session = Depends(get_db)):
    """Simulates an incident evaluation against SOAR policies without committing to the DB."""
    actions = policy_engine.evaluate_incident(incident_data, db=db, commit=False)
    return {"status": "evaluated", "triggered_actions": actions}
