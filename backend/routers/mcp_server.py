from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from pydantic import BaseModel
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import crud, schemas, models
from database import get_db
from routers.extra import get_recommendations

router = APIRouter(
    prefix="/mcp",
    tags=["mcp-server"],
)

# MCP Request/Response Models
class MCPToolRequest(BaseModel):
    tool: str
    parameters: Dict[str, Any]
    context: Optional[Dict[str, Any]] = {}

class MCPToolResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    context: Optional[Dict[str, Any]] = {}

# MCP Tool Execution Endpoint
@router.post("/tool", response_model=MCPToolResponse)
async def execute_mcp_tool(
    request: MCPToolRequest,
    db: Session = Depends(get_db)
):
    """
    Execute MCP tools with proper context handling
    """
    try:
        tool_name = request.tool
        parameters = request.parameters
        context = request.context or {}
        
        # Tool dispatch
        if tool_name == "check_points":
            result = await execute_check_points(parameters, db)
        elif tool_name == "get_recommendations":
            result = await execute_get_recommendations(parameters, db)
        elif tool_name == "explain_referrals":
            result = await execute_explain_referrals(parameters, db)
        elif tool_name == "get_business_info":
            result = await execute_get_business_info(parameters, db)
        elif tool_name == "get_customer_transactions":
            result = await execute_get_customer_transactions(parameters, db)
        elif tool_name == "get_analytics":
            result = await execute_get_analytics(parameters, db)
        else:
            return MCPToolResponse(
                success=False,
                error=f"Unknown tool: {tool_name}",
                context=context
            )
        
        return MCPToolResponse(
            success=result.get("success", True),
            data=result.get("data"),
            error=result.get("error"),
            context=context
        )
        
    except Exception as e:
        return MCPToolResponse(
            success=False,
            error=str(e),
            context=context
        )

# Tool Implementations
async def execute_check_points(parameters: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Check customer points and transaction history"""
    try:
        phone_number = parameters.get("phone_number")
        if not phone_number:
            return {"success": False, "error": "Phone number is required"}
        
        # Use existing CRUD function
        result = crud.get_customer_points(db, phone_number)
        return {
            "success": True,
            "data": {
                "total_points": result["total_points"],
                "recent_transactions": [
                    {
                        "business_name": tx["business_name"],
                        "points_earned": tx["points_earned"],
                        "amount_spent": tx["amount_spent"],
                        "timestamp": tx["timestamp"].isoformat() if tx["timestamp"] else None,
                        "reward_description": tx["reward_description"]
                    }
                    for tx in result["recent_transactions"]
                ]
            }
        }
    except Exception as e:
        error_msg = str(e)
        if "Customer not found" in error_msg:
            return {
                "success": False, 
                "error": "📋 I couldn't find an account with that phone number. This could mean:\n\n• You haven't made your first purchase yet\n• The phone number might be entered incorrectly\n• You might be using a different format\n\n💡 To get started, make a purchase at any participating business and mention this phone number!"
            }
        return {"success": False, "error": f"Error checking points: {error_msg}"}

async def execute_get_recommendations(parameters: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Get personalized recommendations for a customer"""
    try:
        phone_number = parameters.get("phone_number")
        business_id = parameters.get("business_id")
        
        if not phone_number:
            return {"success": False, "error": "Phone number is required"}
        
        # Use existing recommendation function
        result = get_recommendations(phone_number, business_id, db)
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

async def execute_explain_referrals(parameters: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Explain how the referral system works"""
    return {
        "success": True,
        "data": {
            "how_it_works": [
                "When you refer a friend, ask them to mention your phone number during their first purchase",
                "Once they make their first purchase, you both earn bonus points",
                "The more friends you refer, the more bonus points you earn",
                "There's no limit to how many friends you can refer"
            ],
            "benefits": [
                "You earn bonus points for each successful referral",
                "Your friends get bonus points on their first purchase",
                "Help local businesses grow their customer base",
                "Build a community of loyal customers"
            ],
            "steps": [
                "Share your phone number with friends",
                "Ask them to mention it during their first purchase",
                "Both of you earn bonus points automatically",
                "Continue referring for more rewards"
            ]
        }
    }

async def execute_get_business_info(parameters: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Get information about participating businesses"""
    try:
        business_id = parameters.get("business_id")
        
        if business_id:
            business = db.query(models.Business).filter(models.Business.id == business_id).first()
            if not business:
                return {"success": False, "error": "Business not found"}
            
            return {
                "success": True,
                "data": {
                    "id": business.id,
                    "name": business.name,
                    "contact_person": business.contact_person,
                    "email": business.email,
                    "loyalty_rate": business.loyalty_rate
                }
            }
        else:
            # Return general business info
            businesses = db.query(models.Business).limit(10).all()
            return {
                "success": True,
                "data": {
                    "businesses": [
                        {
                            "id": b.id,
                            "name": b.name,
                            "loyalty_rate": b.loyalty_rate
                        }
                        for b in businesses
                    ],
                    "message": "Here are some of our participating businesses!"
                }
            }
    except Exception as e:
        return {"success": False, "error": str(e)}

async def execute_get_customer_transactions(parameters: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Get detailed customer transaction history"""
    try:
        phone_number = parameters.get("phone_number")
        limit = parameters.get("limit", 20)
        
        if not phone_number:
            return {"success": False, "error": "Phone number is required"}
        
        customer = db.query(models.Customer).filter(models.Customer.phone_number == phone_number).first()
        if not customer:
            return {"success": False, "error": "Customer not found"}
        
        transactions = db.query(models.Transaction).filter(
            models.Transaction.customer_id == customer.id
        ).order_by(models.Transaction.timestamp.desc()).limit(limit).all()
        
        return {
            "success": True,
            "data": {
                "transactions": [
                    {
                        "id": tx.id,
                        "business_name": tx.business.name if tx.business else "Unknown",
                        "amount_spent": tx.amount_spent,
                        "points_earned": tx.points_earned,
                        "transaction_type": tx.transaction_type.value,
                        "timestamp": tx.timestamp.isoformat(),
                        "reward_description": tx.reward_description
                    }
                    for tx in transactions
                ],
                "total_transactions": len(transactions),
                "customer_total_points": customer.total_points
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

async def execute_get_analytics(parameters: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Get analytics data for businesses or customers"""
    try:
        analytics_type = parameters.get("type", "customer")
        phone_number = parameters.get("phone_number")
        business_id = parameters.get("business_id")
        
        if analytics_type == "customer" and phone_number:
            customer = db.query(models.Customer).filter(models.Customer.phone_number == phone_number).first()
            if not customer:
                return {"success": False, "error": "Customer not found"}
            
            # Get customer analytics
            transactions = db.query(models.Transaction).filter(
                models.Transaction.customer_id == customer.id
            ).all()
            
            total_spent = sum(tx.amount_spent for tx in transactions)
            points_earned = sum(tx.points_earned for tx in transactions if tx.points_earned > 0)
            points_redeemed = sum(abs(tx.points_earned) for tx in transactions if tx.points_earned < 0)
            
            return {
                "success": True,
                "data": {
                    "customer_stats": {
                        "total_points": customer.total_points,
                        "total_spent": total_spent,
                        "points_earned": points_earned,
                        "points_redeemed": points_redeemed,
                        "total_transactions": len(transactions),
                        "average_transaction": total_spent / len(transactions) if transactions else 0
                    }
                }
            }
        else:
            return {"success": False, "error": "Invalid analytics request"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}
