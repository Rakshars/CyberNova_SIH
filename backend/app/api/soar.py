"""
api/soar.py
-----------
API router for SOAR (Security Orchestration, Automation, and Response) Playbooks and Audit Logs.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
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
def list_policies():
    """Returns list of active SOAR Playbook policies."""
    return {"policies": policy_engine.get_policies()}

@router.post("/policies")
def create_policy(data: PolicyCreateSchema):
    """Creates a new autonomous SOAR policy rule."""
    policy = policy_engine.add_policy(
        name=data.name,
        condition_type=data.condition_type,
        threshold=data.threshold,
        action_type=data.action_type,
        description=data.description
    )
    return {"status": "success", "policy": policy}

@router.patch("/policies/{policy_id}")
def toggle_policy(policy_id: str, data: PolicyToggleSchema):
    """Toggles policy enabled/disabled state."""
    updated = policy_engine.toggle_policy(policy_id, data.enabled)
    if not updated:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {"status": "success", "policy": updated}

@router.get("/logs")
def get_execution_logs():
    """Returns real-time execution audit logs of autonomous SOAR actions."""
    return {"logs": policy_engine.execution_logs}

@router.post("/test-trigger")
def test_trigger(incident_data: dict):
    """Simulates an incident evaluation against SOAR policies."""
    actions = policy_engine.evaluate_incident(incident_data)
    return {"status": "evaluated", "triggered_actions": actions}
