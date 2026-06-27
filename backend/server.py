from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, BeforeValidator
from typing import List, Optional, Annotated, Any
from bson import ObjectId
import uuid
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta

from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGO = "HS256"
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

# SendGrid (optional — leads always save; email only sends when key is set)
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', '')
OWNER_EMAIL = os.environ.get('OWNER_EMAIL', 'bbirdpaving@gmail.com')

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)


# ---------- Helpers ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v)]


def oid() -> str:
    return str(uuid.uuid4())


def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def make_token(uid: str) -> str:
    payload = {"sub": uid, "exp": datetime.now(timezone.utc) + timedelta(days=30)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        uid = payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": uid})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    user.pop("_id", None)
    user.pop("password", None)
    return user


# ---------- Auth Models ----------
class RegisterBody(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "contractor"  # contractor | client


class LoginBody(BaseModel):
    email: EmailStr
    password: str


# ---------- Domain Models ----------
class ProjectBody(BaseModel):
    name: str
    client_name: str = ""
    address: str = ""
    status: str = "active"  # active | on_hold | completed
    budget: float = 0
    progress: int = 0
    start_date: str = ""
    end_date: str = ""
    cover_image: str = ""


class TaskBody(BaseModel):
    project_id: str
    title: str
    assignee: str = ""
    due_date: str = ""
    status: str = "todo"  # todo | in_progress | done


class QuoteBody(BaseModel):
    project_id: str = ""
    client_name: str
    title: str
    line_items: List[dict] = []  # {desc, qty, unit_price}
    tax_percent: float = 0
    type: str = "quote"  # quote | invoice
    status: str = "draft"  # draft | sent | paid


class WorkerBody(BaseModel):
    name: str
    role: str = "Laborer"
    phone: str = ""
    daily_rate: float = 0
    photo: str = ""


class AttendanceBody(BaseModel):
    worker_id: str
    project_id: str = ""
    date: str
    status: str = "present"  # present | absent | half_day


class InventoryBody(BaseModel):
    name: str
    unit: str = "units"
    quantity: float = 0
    unit_cost: float = 0
    threshold: float = 0
    project_id: str = ""


class PhotoBody(BaseModel):
    project_id: str
    image: str  # base64
    caption: str = ""


class ChatBody(BaseModel):
    session_id: str
    message: str


class EstimateBody(BaseModel):
    description: str
    area: str = ""
    quality: str = "standard"
    location: str = ""


class EnquiryBody(BaseModel):
    name: str
    phone: str = ""
    email: str = ""
    service: str = ""
    message: str = ""


class PavingEstimateBody(BaseModel):
    service: str
    area: str = ""
    material: str = ""
    notes: str = ""


# ---------- Auth Routes ----------
@api_router.post("/auth/register")
async def register(body: RegisterBody):
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = oid()
    doc = {
        "id": uid,
        "name": body.name,
        "email": body.email.lower(),
        "password": hash_pw(body.password),
        "role": body.role,
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    token = make_token(uid)
    return {"token": token, "user": {"id": uid, "name": body.name, "email": body.email.lower(), "role": body.role}}


@api_router.post("/auth/login")
async def login(body: LoginBody):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_pw(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = make_token(user["id"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}}


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


# ---------- Generic clean ----------
def clean(doc):
    doc.pop("_id", None)
    return doc


# ---------- Projects ----------
@api_router.post("/projects")
async def create_project(body: ProjectBody, user=Depends(get_current_user)):
    doc = body.dict()
    doc.update({"id": oid(), "owner_id": user["id"], "created_at": now_iso()})
    await db.projects.insert_one(doc)
    return clean(doc)


@api_router.get("/projects")
async def list_projects(user=Depends(get_current_user)):
    docs = await db.projects.find({"owner_id": user["id"]}).sort("created_at", -1).to_list(500)
    return [clean(d) for d in docs]


@api_router.get("/projects/{pid}")
async def get_project(pid: str, user=Depends(get_current_user)):
    doc = await db.projects.find_one({"id": pid})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    return clean(doc)


@api_router.put("/projects/{pid}")
async def update_project(pid: str, body: ProjectBody, user=Depends(get_current_user)):
    await db.projects.update_one({"id": pid}, {"$set": body.dict()})
    doc = await db.projects.find_one({"id": pid})
    return clean(doc)


@api_router.delete("/projects/{pid}")
async def delete_project(pid: str, user=Depends(get_current_user)):
    await db.projects.delete_one({"id": pid})
    await db.tasks.delete_many({"project_id": pid})
    await db.photos.delete_many({"project_id": pid})
    return {"ok": True}


# ---------- Tasks ----------
@api_router.post("/tasks")
async def create_task(body: TaskBody, user=Depends(get_current_user)):
    doc = body.dict()
    doc.update({"id": oid(), "created_at": now_iso()})
    await db.tasks.insert_one(doc)
    return clean(doc)


@api_router.get("/tasks")
async def list_tasks(project_id: Optional[str] = None, user=Depends(get_current_user)):
    q = {"project_id": project_id} if project_id else {}
    docs = await db.tasks.find(q).sort("created_at", -1).to_list(500)
    return [clean(d) for d in docs]


@api_router.put("/tasks/{tid}")
async def update_task(tid: str, body: TaskBody, user=Depends(get_current_user)):
    await db.tasks.update_one({"id": tid}, {"$set": body.dict()})
    doc = await db.tasks.find_one({"id": tid})
    return clean(doc)


@api_router.delete("/tasks/{tid}")
async def delete_task(tid: str, user=Depends(get_current_user)):
    await db.tasks.delete_one({"id": tid})
    return {"ok": True}


# ---------- Quotes / Invoices ----------
def compute_total(line_items, tax_percent):
    subtotal = sum(float(i.get("qty", 0)) * float(i.get("unit_price", 0)) for i in line_items)
    tax = subtotal * (tax_percent / 100.0)
    return round(subtotal, 2), round(tax, 2), round(subtotal + tax, 2)


@api_router.post("/quotes")
async def create_quote(body: QuoteBody, user=Depends(get_current_user)):
    subtotal, tax, total = compute_total(body.line_items, body.tax_percent)
    doc = body.dict()
    doc.update({"id": oid(), "owner_id": user["id"], "subtotal": subtotal, "tax": tax,
                "total": total, "created_at": now_iso()})
    await db.quotes.insert_one(doc)
    return clean(doc)


@api_router.get("/quotes")
async def list_quotes(user=Depends(get_current_user)):
    docs = await db.quotes.find({"owner_id": user["id"]}).sort("created_at", -1).to_list(500)
    return [clean(d) for d in docs]


@api_router.put("/quotes/{qid}")
async def update_quote(qid: str, body: QuoteBody, user=Depends(get_current_user)):
    subtotal, tax, total = compute_total(body.line_items, body.tax_percent)
    d = body.dict()
    d.update({"subtotal": subtotal, "tax": tax, "total": total})
    await db.quotes.update_one({"id": qid}, {"$set": d})
    doc = await db.quotes.find_one({"id": qid})
    return clean(doc)


@api_router.delete("/quotes/{qid}")
async def delete_quote(qid: str, user=Depends(get_current_user)):
    await db.quotes.delete_one({"id": qid})
    return {"ok": True}


# ---------- Workers & Attendance ----------
@api_router.post("/workers")
async def create_worker(body: WorkerBody, user=Depends(get_current_user)):
    doc = body.dict()
    doc.update({"id": oid(), "owner_id": user["id"], "created_at": now_iso()})
    await db.workers.insert_one(doc)
    return clean(doc)


@api_router.get("/workers")
async def list_workers(user=Depends(get_current_user)):
    docs = await db.workers.find({"owner_id": user["id"]}).sort("created_at", -1).to_list(500)
    return [clean(d) for d in docs]


@api_router.delete("/workers/{wid}")
async def delete_worker(wid: str, user=Depends(get_current_user)):
    await db.workers.delete_one({"id": wid})
    return {"ok": True}


@api_router.post("/attendance")
async def mark_attendance(body: AttendanceBody, user=Depends(get_current_user)):
    await db.attendance.update_one(
        {"worker_id": body.worker_id, "date": body.date},
        {"$set": {**body.dict(), "owner_id": user["id"], "updated_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True}


@api_router.get("/attendance")
async def get_attendance(date: str, user=Depends(get_current_user)):
    docs = await db.attendance.find({"owner_id": user["id"], "date": date}).to_list(500)
    return [clean(d) for d in docs]


# ---------- Inventory ----------
@api_router.post("/inventory")
async def create_inventory(body: InventoryBody, user=Depends(get_current_user)):
    doc = body.dict()
    doc.update({"id": oid(), "owner_id": user["id"], "created_at": now_iso()})
    await db.inventory.insert_one(doc)
    return clean(doc)


@api_router.get("/inventory")
async def list_inventory(user=Depends(get_current_user)):
    docs = await db.inventory.find({"owner_id": user["id"]}).sort("created_at", -1).to_list(500)
    return [clean(d) for d in docs]


@api_router.put("/inventory/{iid}")
async def update_inventory(iid: str, body: InventoryBody, user=Depends(get_current_user)):
    await db.inventory.update_one({"id": iid}, {"$set": body.dict()})
    doc = await db.inventory.find_one({"id": iid})
    return clean(doc)


@api_router.delete("/inventory/{iid}")
async def delete_inventory(iid: str, user=Depends(get_current_user)):
    await db.inventory.delete_one({"id": iid})
    return {"ok": True}


# ---------- Photos ----------
@api_router.post("/photos")
async def create_photo(body: PhotoBody, user=Depends(get_current_user)):
    doc = body.dict()
    doc.update({"id": oid(), "owner_id": user["id"], "created_at": now_iso()})
    await db.photos.insert_one(doc)
    return clean(doc)


@api_router.get("/photos")
async def list_photos(project_id: str, user=Depends(get_current_user)):
    docs = await db.photos.find({"project_id": project_id}).sort("created_at", -1).to_list(500)
    return [clean(d) for d in docs]


@api_router.delete("/photos/{pid}")
async def delete_photo(pid: str, user=Depends(get_current_user)):
    await db.photos.delete_one({"id": pid})
    return {"ok": True}


# ---------- Dashboard ----------
@api_router.get("/dashboard")
async def dashboard(user=Depends(get_current_user)):
    projects = await db.projects.find({"owner_id": user["id"]}).to_list(1000)
    active = len([p for p in projects if p.get("status") == "active"])
    workers = await db.workers.count_documents({"owner_id": user["id"]})
    quotes = await db.quotes.find({"owner_id": user["id"]}).to_list(1000)
    pending_quotes = len([q for q in quotes if q.get("status") != "paid"])
    revenue = sum(q.get("total", 0) for q in quotes if q.get("status") == "paid")
    inv = await db.inventory.find({"owner_id": user["id"]}).to_list(1000)
    low_stock = len([i for i in inv if i.get("quantity", 0) <= i.get("threshold", 0)])
    return {
        "active_projects": active,
        "total_projects": len(projects),
        "workers": workers,
        "pending_quotes": pending_quotes,
        "revenue": round(revenue, 2),
        "low_stock": low_stock,
    }


# ---------- Enquiries (public lead capture) ----------
def send_owner_email(enq: dict):
    """Notify the business owner of a new enquiry. No-op if SendGrid not configured."""
    if not SENDGRID_API_KEY or not SENDER_EMAIL:
        logger.info("SendGrid not configured — skipping owner email (lead saved to dashboard).")
        return
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        html = f"""
        <h2>New T&amp;B Paving enquiry</h2>
        <p><strong>Name:</strong> {enq.get('name','')}</p>
        <p><strong>Phone:</strong> {enq.get('phone','-')}</p>
        <p><strong>Email:</strong> {enq.get('email','-')}</p>
        <p><strong>Service:</strong> {enq.get('service','-')}</p>
        <p><strong>Message:</strong><br/>{enq.get('message','-')}</p>
        <hr/><p style="color:#888">Sent automatically from your T&amp;B Paving website.</p>
        """
        msg = Mail(from_email=SENDER_EMAIL, to_emails=OWNER_EMAIL,
                   subject=f"New enquiry: {enq.get('name','')} ({enq.get('service','general')})",
                   html_content=html)
        SendGridAPIClient(SENDGRID_API_KEY).send(msg)
        logger.info("Owner enquiry email sent.")
    except Exception as e:
        logger.error(f"SendGrid email failed (lead still saved): {e}")


@api_router.post("/enquiries")
async def create_enquiry(body: EnquiryBody, background: BackgroundTasks):
    doc = body.dict()
    doc.update({"id": oid(), "status": "new", "created_at": now_iso()})
    await db.enquiries.insert_one(doc)
    background.add_task(send_owner_email, {k: doc[k] for k in ("name", "phone", "email", "service", "message")})
    return {"ok": True, "id": doc["id"]}


@api_router.get("/enquiries")
async def list_enquiries(user=Depends(get_current_user)):
    docs = await db.enquiries.find().sort("created_at", -1).to_list(1000)
    return [clean(d) for d in docs]


@api_router.put("/enquiries/{eid}/status")
async def update_enquiry(eid: str, status: str, user=Depends(get_current_user)):
    await db.enquiries.update_one({"id": eid}, {"$set": {"status": status}})
    return {"ok": True}


@api_router.post("/ai/paving-estimate")
async def paving_estimate(body: PavingEstimateBody):
    prompt = (
        "You are an expert UK paving and driveway estimator for T&B Paving (Manchester & North West). "
        "Give a friendly, realistic BALLPARK estimate in GBP (£) for the following job. "
        "Use typical UK 2026 market rates.\n\n"
        f"Service: {body.service}\n"
        f"Approx area: {body.area or 'not specified'}\n"
        f"Preferred material: {body.material or 'not specified'}\n"
        f"Notes: {body.notes or 'none'}\n\n"
        "Respond in this exact short format (plain text, no markdown symbols):\n"
        "ESTIMATE: £low - £high\n"
        "WHAT'S INCLUDED: 2-3 short bullet lines\n"
        "TIMELINE: x-y days\n"
        "Then 1 line: 'This is a guide only - book a free site survey for an exact quote.'\n"
        "Keep it under 130 words."
    )
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"paving-estimate-{oid()}",
        system_message="You are a helpful, honest UK paving cost estimator.",
    ).with_model("openai", "gpt-5.4")
    try:
        reply = await chat.send_message(UserMessage(text=prompt))
    except Exception as e:
        logger.error(f"Paving estimate error: {e}")
        raise HTTPException(status_code=500, detail="AI service error")
    return {"estimate": reply}


# ---------- AI ----------
@api_router.post("/ai/chat")
async def ai_chat(body: ChatBody, user=Depends(get_current_user)):
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"{user['id']}-{body.session_id}",
        system_message=(
            "You are T&B Paving AI, an expert paving and driveway assistant. "
            "Help with project planning, scheduling, building codes, material calculations, "
            "safety guidance, and cost estimation. Be concise, practical and use clear structure."
        ),
    ).with_model("openai", "gpt-5.4")
    try:
        reply = await chat.send_message(UserMessage(text=body.message))
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        raise HTTPException(status_code=500, detail="AI service error")
    await db.chat_messages.insert_one({
        "id": oid(), "owner_id": user["id"], "session_id": body.session_id,
        "role": "user", "content": body.message, "created_at": now_iso(),
    })
    await db.chat_messages.insert_one({
        "id": oid(), "owner_id": user["id"], "session_id": body.session_id,
        "role": "assistant", "content": reply, "created_at": now_iso(),
    })
    return {"reply": reply}


@api_router.get("/ai/history")
async def ai_history(session_id: str, user=Depends(get_current_user)):
    docs = await db.chat_messages.find(
        {"owner_id": user["id"], "session_id": session_id}
    ).sort("created_at", 1).to_list(500)
    return [clean(d) for d in docs]


@api_router.post("/ai/estimate")
async def ai_estimate(body: EstimateBody, user=Depends(get_current_user)):
    prompt = (
        f"Generate a detailed construction cost estimate.\n"
        f"Project: {body.description}\n"
        f"Area/Size: {body.area or 'not specified'}\n"
        f"Quality level: {body.quality}\n"
        f"Location: {body.location or 'not specified'}\n\n"
        "Return a clear breakdown with these sections:\n"
        "1. SUMMARY (1-2 lines + total estimated cost range)\n"
        "2. COST BREAKDOWN (materials, labor, equipment, permits) with approximate figures\n"
        "3. TIMELINE estimate\n"
        "4. KEY ASSUMPTIONS\n"
        "Keep it practical and use plain text with clear headers."
    )
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"{user['id']}-estimate-{oid()}",
        system_message="You are a senior construction cost estimator with 20 years experience.",
    ).with_model("openai", "gpt-5.4")
    try:
        reply = await chat.send_message(UserMessage(text=prompt))
    except Exception as e:
        logger.error(f"AI estimate error: {e}")
        raise HTTPException(status_code=500, detail="AI service error")
    return {"estimate": reply}


@api_router.get("/")
async def root():
    return {"message": "T&B Paving API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
