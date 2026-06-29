from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import Response
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

from openai import AsyncOpenAI

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGO = "HS256"
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# SendGrid (optional — leads always save; email only sends when key is set)
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', '')
OWNER_EMAIL = os.environ.get('OWNER_EMAIL', 'bbirdpaving@gmail.com')

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# ---------- Rate limiting ----------
from collections import defaultdict
import time as _time

_rate_store: dict[str, list[float]] = defaultdict(list)

def rate_limit(max_calls: int, window_seconds: int = 3600):
    """Simple sliding-window rate limiter — per client IP, in-memory."""
    from fastapi import Request
    async def dependency(request: Request):
        ip = request.client.host if request.client else "unknown"
        key = f"{request.url.path}:{ip}"
        now = _time.monotonic()
        cutoff = now - window_seconds
        _rate_store[key] = [t for t in _rate_store[key] if t > cutoff]
        if len(_rate_store[key]) >= max_calls:
            raise HTTPException(
                status_code=429,
                detail=f"Too many requests — please wait before trying again.",
            )
        _rate_store[key].append(now)
    return dependency


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
    client_email: str = ""
    title: str = ""
    project_type: str = ""
    line_items: List[dict] = []
    tax_percent: float = 0
    status: str = "draft"  # draft | sent | paid | rejected


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
    project_id: str = ""
    image_base64: str
    caption: str = ""


class TestimonialBody(BaseModel):
    name: str
    town: str = ""
    job: str = ""
    stars: int = 5
    text: str


class ReviewSubmitBody(BaseModel):
    name: str
    town: str = ""
    job: str = ""
    stars: int = 5
    text: str


class SiteSettingsBody(BaseModel):
    biz_name: str = "T&B Paving"
    tagline: str = "Driveways · Patios · Paths"
    since: str = "Trusted Since 2009"
    headline: str = "Expert Driveways, Patios & Paths Built to Last"
    intro: str = "From your first call to a finished driveway, we keep things straightforward, transparent and stress-free at every stage."
    phone: str = "01376 618683"
    mobile: str = "07717 315528"
    email: str = "bbirdpaving@gmail.com"
    hours: str = "Mon–Sat: 7:30am – 6:00pm"
    area: str = "Essex & Suffolk"
    hero_slides: List[dict] = []
    faqs: List[dict] = []
    services: List[dict] = []
    areas: List[str] = []
    stats: List[dict] = []
    steps: List[dict] = []
    hero_images: List[str] = []


class HeroImageBody(BaseModel):
    image_base64: str


class ChatBody(BaseModel):
    session_id: str
    message: str


class EstimateBody(BaseModel):
    description: str
    area: str = ""
    quality: str = "standard"
    location: str = ""


class BeforeAfterBody(BaseModel):
    label: str = ""
    before_base64: str
    after_base64: str


class EnquiryBody(BaseModel):
    name: str
    phone: str = ""
    email: str = ""
    service: str = ""
    message: str = ""
    postcode: str = ""
    area_size: str = ""
    photo_base64: str = ""


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
async def update_quote(qid: str, body: QuoteBody, background: BackgroundTasks, user=Depends(get_current_user)):
    subtotal, tax, total = compute_total(body.line_items, body.tax_percent)
    existing = await db.quotes.find_one({"id": qid})
    d = body.dict()
    d.update({"subtotal": subtotal, "tax": tax, "total": total})
    await db.quotes.update_one({"id": qid}, {"$set": d})
    doc = await db.quotes.find_one({"id": qid})
    # Send quote email when status first changes to "sent"
    if body.status == "sent" and existing and existing.get("status") != "sent":
        background.add_task(send_quote_email, clean(doc))
    return clean(doc)


@api_router.patch("/quotes/{qid}/status")
async def patch_quote_status(qid: str, status: str, background: BackgroundTasks, user=Depends(get_current_user)):
    existing = await db.quotes.find_one({"id": qid})
    await db.quotes.update_one({"id": qid}, {"$set": {"status": status}})
    doc = await db.quotes.find_one({"id": qid})
    if status == "sent" and existing and existing.get("status") != "sent":
        background.add_task(send_quote_email, clean(doc))
    return {"ok": True}


@api_router.delete("/quotes/{qid}")
async def delete_quote(qid: str, user=Depends(get_current_user)):
    await db.quotes.delete_one({"id": qid})
    return {"ok": True}


@api_router.get("/quotes/{qid}/pdf")
async def download_quote_pdf(qid: str, user=Depends(get_current_user)):
    from io import BytesIO
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_RIGHT, TA_LEFT, TA_CENTER

    doc_data = await db.quotes.find_one({"id": qid, "owner_id": user["id"]})
    if not doc_data:
        raise HTTPException(404, "Quote not found")
    q = clean(doc_data)

    # Fetch business settings for contact info
    settings = await db.site_settings.find_one({}) or {}
    biz_phone = settings.get("phone", "01376 618683")
    biz_mobile = settings.get("mobile", "07503 111803")
    biz_email = settings.get("email", "bbirdpaving@gmail.com")

    buf = BytesIO()
    page_w, page_h = A4
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm,
        topMargin=16*mm, bottomMargin=16*mm,
    )

    NAVY   = colors.HexColor("#1A2A3A")
    COPPER = colors.HexColor("#B5651D")
    MUTED  = colors.HexColor("#7A6A5A")
    LIGHT  = colors.HexColor("#F2E4C8")
    WHITE  = colors.white

    styles = getSampleStyleSheet()
    def style(name, **kw):
        s = ParagraphStyle(name, **kw)
        return s

    biz_name_style  = style("BizName",  fontSize=22, fontName="Helvetica-Bold", textColor=NAVY, leading=26)
    biz_sub_style   = style("BizSub",   fontSize=9,  fontName="Helvetica",      textColor=MUTED, leading=13)
    label_style     = style("Label",    fontSize=8,  fontName="Helvetica-Bold", textColor=MUTED, leading=10, spaceAfter=2)
    value_style     = style("Value",    fontSize=11, fontName="Helvetica-Bold", textColor=NAVY, leading=14)
    value_sub_style = style("ValueSub", fontSize=9,  fontName="Helvetica",      textColor=MUTED, leading=11)
    footer_style    = style("Footer",   fontSize=8,  fontName="Helvetica",      textColor=MUTED, alignment=TA_CENTER, leading=11)

    created = datetime.fromisoformat(q.get("created_at", now_iso()).replace("Z","")).strftime("%d %B %Y")
    quote_num = f"QT-{str(q.get('id',''))[:6].upper()}"

    # ── Header row ──
    header_left = [
        Paragraph("T&amp;B Paving", biz_name_style),
        Paragraph(f"{biz_phone} &nbsp;|&nbsp; {biz_mobile}", biz_sub_style),
        Paragraph(biz_email, biz_sub_style),
        Paragraph("Essex &amp; Suffolk", biz_sub_style),
    ]
    header_right = [
        Paragraph('<font color="#B5651D"><b>QUOTATION</b></font>', style("QLabel", fontSize=26, fontName="Helvetica-Bold", textColor=COPPER, alignment=TA_RIGHT, leading=30)),
        Paragraph(f'<font color="#7A6A5A">Ref: {quote_num}</font>', style("QRef", fontSize=9, fontName="Helvetica", textColor=MUTED, alignment=TA_RIGHT, leading=12)),
        Paragraph(f'<font color="#7A6A5A">Date: {created}</font>', style("QDate", fontSize=9, fontName="Helvetica", textColor=MUTED, alignment=TA_RIGHT, leading=12)),
        Paragraph('<font color="#7A6A5A">Valid for 30 days</font>', style("QValid", fontSize=9, fontName="Helvetica", textColor=MUTED, alignment=TA_RIGHT, leading=12)),
    ]

    header_table = Table([[header_left, header_right]], colWidths=["55%", "45%"])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING", (0,0), (-1,-1), 0),
        ("RIGHTPADDING", (0,0), (-1,-1), 0),
    ]))

    # ── Client block ──
    client_name = q.get("client_name", "")
    client_email = q.get("client_email", "")
    project_type = q.get("project_type", "")

    client_data = [[
        [Paragraph("PREPARED FOR", label_style),
         Paragraph(client_name, value_style),
         Paragraph(client_email, value_sub_style) if client_email else Spacer(1, 0),
         Paragraph(project_type, value_sub_style) if project_type else Spacer(1, 0)],
        [Spacer(1, 1)],
    ]]
    client_table = Table(client_data, colWidths=["60%", "40%"])
    client_table.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING", (0,0), (-1,-1), 0),
        ("RIGHTPADDING", (0,0), (-1,-1), 0),
    ]))

    # ── Line items table ──
    line_items = q.get("line_items", [])
    li_header = [
        Paragraph("<b>Description</b>", style("LH", fontSize=9, fontName="Helvetica-Bold", textColor=WHITE)),
        Paragraph("<b>Qty</b>", style("LH2", fontSize=9, fontName="Helvetica-Bold", textColor=WHITE, alignment=TA_CENTER)),
        Paragraph("<b>Unit Price</b>", style("LH3", fontSize=9, fontName="Helvetica-Bold", textColor=WHITE, alignment=TA_RIGHT)),
        Paragraph("<b>Amount</b>", style("LH4", fontSize=9, fontName="Helvetica-Bold", textColor=WHITE, alignment=TA_RIGHT)),
    ]
    li_rows = [li_header]
    for li in line_items:
        amt = float(li.get("qty", 1)) * float(li.get("unit_price", 0))
        li_rows.append([
            Paragraph(str(li.get("description", "")), style("LR", fontSize=10, fontName="Helvetica", textColor=NAVY)),
            Paragraph(str(li.get("qty", 1)), style("LR2", fontSize=10, fontName="Helvetica", textColor=NAVY, alignment=TA_CENTER)),
            Paragraph(f"£{float(li.get('unit_price',0)):.2f}", style("LR3", fontSize=10, fontName="Helvetica", textColor=NAVY, alignment=TA_RIGHT)),
            Paragraph(f"£{amt:.2f}", style("LR4", fontSize=10, fontName="Helvetica", textColor=NAVY, alignment=TA_RIGHT)),
        ])

    # Totals rows
    subtotal = float(q.get("subtotal", 0))
    tax      = float(q.get("tax", 0))
    total    = float(q.get("total", 0))
    tax_pct  = float(q.get("tax_percent", 0))

    li_rows.append(["", "", Paragraph("Subtotal", style("Tot", fontSize=9, textColor=MUTED, alignment=TA_RIGHT)), Paragraph(f"£{subtotal:.2f}", style("TotV", fontSize=9, textColor=NAVY, alignment=TA_RIGHT))])
    if tax_pct:
        li_rows.append(["", "", Paragraph(f"VAT ({tax_pct:.0f}%)", style("Tot2", fontSize=9, textColor=MUTED, alignment=TA_RIGHT)), Paragraph(f"£{tax:.2f}", style("TotV2", fontSize=9, textColor=MUTED, alignment=TA_RIGHT))])
    li_rows.append(["", "", Paragraph("<b>TOTAL</b>", style("TotF", fontSize=11, fontName="Helvetica-Bold", textColor=WHITE, alignment=TA_RIGHT)), Paragraph(f"<b>£{total:.2f}</b>", style("TotFV", fontSize=11, fontName="Helvetica-Bold", textColor=WHITE, alignment=TA_RIGHT))])

    n_items = len(line_items)
    col_w = [page_w - 36*mm - 20*mm - 40*mm - 40*mm, 20*mm, 40*mm, 40*mm]
    li_table = Table(li_rows, colWidths=col_w, repeatRows=1)
    total_row_idx = 1 + n_items + (1 if tax_pct else 0) + 1

    ts = TableStyle([
        # Header
        ("BACKGROUND",  (0,0), (-1,0), NAVY),
        ("ROWBACKGROUNDS", (0,1), (-1, n_items), [WHITE, LIGHT]),
        ("FONTNAME",    (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",    (0,0), (-1,0), 9),
        ("TOPPADDING",  (0,0), (-1,-1), 6),
        ("BOTTOMPADDING",(0,0), (-1,-1), 6),
        ("LEFTPADDING", (0,0), (-1,-1), 6),
        ("RIGHTPADDING",(0,0), (-1,-1), 6),
        ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
        ("LINEBELOW",   (0,0), (-1,0), 0.5, NAVY),
        # Subtotal rows
        ("LINEABOVE",   (0, n_items+1), (-1, n_items+1), 0.5, colors.HexColor("#E8D9C0")),
        # Total row
        ("BACKGROUND",  (2, total_row_idx), (-1, total_row_idx), COPPER),
        ("LINEABOVE",   (0, total_row_idx), (-1, total_row_idx), 1, COPPER),
    ])
    li_table.setStyle(ts)

    # ── Footer text ──
    footer_text = (
        "T&amp;B Paving · Essex &amp; Suffolk · 10-year workmanship guarantee · Free site survey included\n"
        "This quotation is valid for 30 days from the date above. All prices include materials and labour unless stated."
    )

    story = [
        header_table,
        HRFlowable(width="100%", thickness=2, color=COPPER, spaceAfter=10, spaceBefore=6),
        client_table,
        Spacer(1, 8*mm),
        li_table,
        Spacer(1, 6*mm),
        HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E8D9C0"), spaceAfter=6),
        Paragraph(footer_text, footer_style),
    ]

    doc.build(story)
    buf.seek(0)
    safe_name = client_name.replace(" ", "-").replace("/", "-")
    filename = f"TB-Paving-Quote-{safe_name}.pdf"
    return Response(
        content=buf.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


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
    count = await db.photos.count_documents({"owner_id": user["id"]})
    doc = body.dict()
    doc.update({"id": oid(), "owner_id": user["id"], "created_at": now_iso(), "sort_order": count})
    await db.photos.insert_one(doc)
    return clean(doc)


@api_router.get("/photos")
async def list_photos(user=Depends(get_current_user)):
    docs = await db.photos.find({"owner_id": user["id"]}).sort([("sort_order", 1), ("created_at", -1)]).to_list(500)
    return [clean(d) for d in docs]


@api_router.patch("/photos/{pid}/order")
async def reorder_photo(pid: str, direction: str, user=Depends(get_current_user)):
    """Swap sort_order with the adjacent photo. direction: 'up' or 'down'."""
    docs = await db.photos.find({"owner_id": user["id"]}).sort([("sort_order", 1), ("created_at", -1)]).to_list(500)
    idx = next((i for i, d in enumerate(docs) if d["id"] == pid), None)
    if idx is None:
        raise HTTPException(404, "Photo not found")
    swap_idx = idx - 1 if direction == "up" else idx + 1
    if swap_idx < 0 or swap_idx >= len(docs):
        return {"ok": True}
    a, b = docs[idx], docs[swap_idx]
    a_order = a.get("sort_order", idx)
    b_order = b.get("sort_order", swap_idx)
    await db.photos.update_one({"id": a["id"]}, {"$set": {"sort_order": b_order}})
    await db.photos.update_one({"id": b["id"]}, {"$set": {"sort_order": a_order}})
    return {"ok": True}


@api_router.delete("/photos/{pid}")
async def delete_photo(pid: str, user=Depends(get_current_user)):
    await db.photos.delete_one({"id": pid, "owner_id": user["id"]})
    return {"ok": True}


# ---------- Testimonials ----------
@api_router.get("/public/testimonials")
async def public_testimonials():
    """Public — returns all approved testimonials."""
    docs = await db.testimonials.find({"status": "approved"}).sort("created_at", -1).to_list(100)
    return [clean(d) for d in docs]


@api_router.get("/public/gallery")
async def public_gallery():
    """Public — returns all uploaded gallery photos."""
    docs = await db.photos.find({}).sort([("sort_order", 1), ("created_at", -1)]).to_list(200)
    return [clean(d) for d in docs]


@api_router.get("/public/before-after")
async def public_before_after():
    docs = await db.before_after.find({}).sort("created_at", -1).to_list(20)
    return [clean(d) for d in docs]


@api_router.post("/before-after")
async def create_before_after(body: BeforeAfterBody, user=Depends(get_current_user)):
    doc = body.dict()
    doc.update({"id": oid(), "owner_id": user["id"], "created_at": now_iso()})
    await db.before_after.insert_one(doc)
    return {"ok": True, "id": doc["id"]}


@api_router.delete("/before-after/{bid}")
async def delete_before_after(bid: str, user=Depends(get_current_user)):
    await db.before_after.delete_one({"id": bid})
    return {"ok": True}


@api_router.post("/reviews/submit", dependencies=[Depends(rate_limit(5, 3600))])
async def submit_review(body: ReviewSubmitBody, background: BackgroundTasks):
    """Public endpoint — no auth. Saves as pending for admin approval."""
    doc = body.dict()
    doc.update({"id": oid(), "status": "pending", "created_at": now_iso()})
    await db.testimonials.insert_one(doc)
    background.add_task(send_review_notification, doc)
    return {"ok": True}


@api_router.post("/testimonials")
async def create_testimonial(body: TestimonialBody, user=Depends(get_current_user)):
    doc = body.dict()
    doc.update({"id": oid(), "owner_id": user["id"], "status": "approved", "created_at": now_iso()})
    await db.testimonials.insert_one(doc)
    return clean(doc)


@api_router.get("/testimonials")
async def list_testimonials(status: str = "all", user=Depends(get_current_user)):
    query: dict = {}
    if status == "pending":
        query["status"] = "pending"
    elif status == "approved":
        query["$or"] = [{"status": "approved"}, {"owner_id": user["id"]}]
    docs = await db.testimonials.find(query).sort("created_at", -1).to_list(500)
    return [clean(d) for d in docs]


@api_router.put("/testimonials/{tid}/approve")
async def approve_testimonial(tid: str, user=Depends(get_current_user)):
    await db.testimonials.update_one(
        {"id": tid},
        {"$set": {"status": "approved", "owner_id": user["id"]}}
    )
    return {"ok": True}


@api_router.delete("/testimonials/{tid}")
async def delete_testimonial(tid: str, user=Depends(get_current_user)):
    await db.testimonials.delete_one({"id": tid})
    return {"ok": True}


# ---------- Site Settings ----------
@api_router.get("/site-settings")
async def get_site_settings():
    """Public — no auth. Website reads this to render dynamic content."""
    doc = await db.site_settings.find_one({})
    if not doc:
        return {}
    return clean(doc)


@api_router.put("/site-settings")
async def update_site_settings(body: SiteSettingsBody, user=Depends(get_current_user)):
    await db.site_settings.update_one(
        {"owner_id": user["id"]},
        {"$set": {**body.dict(), "owner_id": user["id"], "updated_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True}


@api_router.put("/site-settings/hero-image/{slot}")
async def update_hero_image(slot: int, body: HeroImageBody, user=Depends(get_current_user)):
    if slot < 0 or slot > 4:
        raise HTTPException(status_code=400, detail="Slot must be 0–4")
    existing = await db.site_settings.find_one({"owner_id": user["id"]})
    images: list = existing.get("hero_images", []) if existing else []
    while len(images) <= slot:
        images.append("")
    images[slot] = body.image_base64
    await db.site_settings.update_one(
        {"owner_id": user["id"]},
        {"$set": {"hero_images": images, "updated_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True}


@api_router.delete("/site-settings/hero-image/{slot}")
async def delete_hero_image(slot: int, user=Depends(get_current_user)):
    if slot < 0 or slot > 4:
        raise HTTPException(status_code=400, detail="Slot must be 0–4")
    existing = await db.site_settings.find_one({"owner_id": user["id"]})
    images: list = existing.get("hero_images", []) if existing else []
    while len(images) <= slot:
        images.append("")
    images[slot] = ""
    await db.site_settings.update_one(
        {"owner_id": user["id"]},
        {"$set": {"hero_images": images, "updated_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True}


# ---------- Dashboard ----------
@api_router.get("/dashboard")
async def dashboard(user=Depends(get_current_user)):
    enqs = await db.enquiries.find({"owner_id": user["id"]}).to_list(5000)
    new_enqs = len([e for e in enqs if e.get("status") == "new"])
    quotes = await db.quotes.find({"owner_id": user["id"]}).to_list(5000)
    draft_quotes = len([q for q in quotes if q.get("status") == "draft"])
    reviews = await db.reviews.find({"owner_id": user["id"]}).to_list(5000)
    pending_reviews = len([r for r in reviews if not r.get("approved", False)])
    approved_reviews = len([r for r in reviews if r.get("approved", False)])
    gallery_photos = await db.gallery.count_documents({"owner_id": user["id"]})
    return {
        "new_enquiries": new_enqs,
        "total_enquiries": len(enqs),
        "draft_quotes": draft_quotes,
        "pending_reviews": pending_reviews,
        "approved_reviews": approved_reviews,
        "gallery_photos": gallery_photos,
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
        photo_html = f'<p><strong>Photo:</strong> <img src="data:image/jpeg;base64,{enq["photo_base64"]}" style="max-width:400px;border-radius:8px;margin-top:8px"/></p>' if enq.get("photo_base64") else ""
        html = f"""
        <h2 style="color:#1A2A3A">New T&amp;B Paving Enquiry</h2>
        <table style="border-collapse:collapse;width:100%;max-width:500px">
          <tr><td style="padding:8px 0;color:#7A6A5A;font-weight:600;width:120px">Name</td><td style="padding:8px 0;color:#1A2A3A;font-weight:700">{enq.get('name','')}</td></tr>
          <tr><td style="padding:8px 0;color:#7A6A5A;font-weight:600">Phone</td><td style="padding:8px 0;color:#1A2A3A">{enq.get('phone','-')}</td></tr>
          <tr><td style="padding:8px 0;color:#7A6A5A;font-weight:600">Email</td><td style="padding:8px 0;color:#1A2A3A">{enq.get('email','-')}</td></tr>
          <tr><td style="padding:8px 0;color:#7A6A5A;font-weight:600">Service</td><td style="padding:8px 0;color:#1A2A3A">{enq.get('service','-')}</td></tr>
          <tr><td style="padding:8px 0;color:#7A6A5A;font-weight:600">Postcode</td><td style="padding:8px 0;color:#1A2A3A">{enq.get('postcode','-')}</td></tr>
          <tr><td style="padding:8px 0;color:#7A6A5A;font-weight:600">Area Size</td><td style="padding:8px 0;color:#1A2A3A">{enq.get('area_size','-')}</td></tr>
          <tr><td style="padding:8px 0;color:#7A6A5A;font-weight:600;vertical-align:top">Message</td><td style="padding:8px 0;color:#1A2A3A">{enq.get('message','-')}</td></tr>
        </table>
        {photo_html}
        <hr style="margin-top:24px"/><p style="color:#aaa;font-size:12px">Sent automatically from your T&amp;B Paving website.</p>
        """
        msg = Mail(from_email=SENDER_EMAIL, to_emails=OWNER_EMAIL,
                   subject=f"New enquiry: {enq.get('name','')} ({enq.get('service','general')})",
                   html_content=html)
        SendGridAPIClient(SENDGRID_API_KEY).send(msg)
        logger.info("Owner enquiry email sent.")
    except Exception as e:
        logger.error(f"SendGrid email failed (lead still saved): {e}")


def send_review_notification(review: dict):
    """Notify owner when a new review is submitted and awaiting approval."""
    if not SENDGRID_API_KEY or not SENDER_EMAIL:
        return
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        stars = "★" * int(review.get("stars", 5)) + "☆" * (5 - int(review.get("stars", 5)))
        html = f"""
        <h2>New review awaiting approval</h2>
        <p>{stars}</p>
        <p><strong>{review.get('name','')} · {review.get('town','')} · {review.get('job','')}</strong></p>
        <blockquote style="border-left:4px solid #B5651D;padding-left:12px;color:#444;">
          {review.get('text','')}
        </blockquote>
        <p><a href="https://frontend-khaki-tau-70.vercel.app/admin/testimonials" style="background:#B5651D;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">
          Review in Admin Panel
        </a></p>
        <hr/><p style="color:#888">T&amp;B Paving — automated notification</p>
        """
        msg = Mail(from_email=SENDER_EMAIL, to_emails=OWNER_EMAIL,
                   subject=f"New {review.get('stars',5)}★ review from {review.get('name','')}",
                   html_content=html)
        SendGridAPIClient(SENDGRID_API_KEY).send(msg)
    except Exception as e:
        logger.error(f"Review notification email failed: {e}")


def send_quote_email(quote: dict):
    """Send the quote to the customer by email."""
    client_email = quote.get("client_email", "")
    if not client_email or not SENDGRID_API_KEY or not SENDER_EMAIL:
        return
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        rows = "".join(
            f"<tr><td style='padding:8px;border-bottom:1px solid #eee'>{li.get('description','')}</td>"
            f"<td style='padding:8px;border-bottom:1px solid #eee;text-align:right'>£{float(li.get('amount',0)):.2f}</td></tr>"
            for li in quote.get("line_items", [])
        )
        tax_row = (
            f"<tr><td style='padding:8px;color:#888'>VAT ({quote.get('tax_percent',0)}%)</td>"
            f"<td style='padding:8px;text-align:right;color:#888'>£{float(quote.get('tax',0)):.2f}</td></tr>"
            if quote.get("tax_percent", 0) else ""
        )
        html = f"""
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <div style="background:#1A2A3A;padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">T&amp;B Paving</h1>
            <p style="color:rgba(255,255,255,0.6);margin:4px 0 0">Driveways · Patios · Paths</p>
          </div>
          <div style="padding:28px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
            <h2 style="color:#1A2A3A">Your Quote</h2>
            <p>Dear {quote.get('client_name','')},</p>
            <p>Thank you for considering T&amp;B Paving. Please find your quote below.</p>
            {"<p><strong>Project type:</strong> " + quote.get('project_type','') + "</p>" if quote.get('project_type') else ""}
            <table style="width:100%;border-collapse:collapse;margin:20px 0">
              <thead>
                <tr style="background:#f5f5f5">
                  <th style="padding:10px;text-align:left">Description</th>
                  <th style="padding:10px;text-align:right">Amount</th>
                </tr>
              </thead>
              <tbody>{rows}</tbody>
              <tfoot>
                {tax_row}
                <tr style="background:#1A2A3A">
                  <td style="padding:12px;color:#fff;font-weight:bold">Total</td>
                  <td style="padding:12px;color:#fff;font-weight:bold;text-align:right">£{float(quote.get('total',0)):.2f}</td>
                </tr>
              </tfoot>
            </table>
            <p>This quote is valid for 30 days. To accept or discuss further, please call us:</p>
            <p style="font-size:18px;font-weight:bold">01376 618683 &nbsp;·&nbsp; 07717 315528</p>
            <p style="color:#888;font-size:13px">T&amp;B Paving — Essex &amp; Suffolk</p>
          </div>
        </div>
        """
        msg = Mail(from_email=SENDER_EMAIL, to_emails=client_email,
                   subject=f"Your quote from T&B Paving — £{float(quote.get('total',0)):.2f}",
                   html_content=html)
        SendGridAPIClient(SENDGRID_API_KEY).send(msg)
        logger.info(f"Quote email sent to {client_email}")
    except Exception as e:
        logger.error(f"Quote email failed: {e}")


@api_router.post("/enquiries", dependencies=[Depends(rate_limit(10, 3600))])
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


@api_router.post("/ai/paving-estimate", dependencies=[Depends(rate_limit(10, 3600))])
async def paving_estimate(body: PavingEstimateBody):
    prompt = (
        "You are an expert UK paving and driveway estimator for T&B Paving (Essex & Suffolk). "
        "Give a friendly, realistic BALLPARK estimate in GBP (£) for the following job. "
        "Use typical UK 2026 market rates for the Essex & Suffolk area.\n\n"
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
    if not openai_client:
        raise HTTPException(status_code=503, detail="AI service not configured")
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful, honest UK paving cost estimator."},
                {"role": "user", "content": prompt},
            ],
        )
        reply = response.choices[0].message.content
    except Exception as e:
        logger.error(f"Paving estimate error: {e}")
        raise HTTPException(status_code=500, detail="AI service error")
    return {"estimate": reply}


# ---------- AI ----------
class PublicChatBody(BaseModel):
    message: str
    history: list = []

@api_router.post("/ai/public-chat", dependencies=[Depends(rate_limit(20, 3600))])
async def ai_public_chat(body: PublicChatBody):
    if not openai_client:
        raise HTTPException(status_code=503, detail="AI service not configured")
    system = (
        "You are a friendly assistant for T&B Paving, a professional paving company in Essex & Suffolk, UK. "
        "Help customers with questions about driveways, patios, paths, block paving, resin bound, tarmac, gravel, and garden steps. "
        "You cover services in Essex & Suffolk. Phone: 01376 618683. Email: bbirdpaving@gmail.com. "
        "Hours: Mon-Sat 7:30am-6pm. Always suggest booking a free site survey for exact quotes. "
        "Be warm, helpful and concise. If asked something unrelated to paving or the business, politely redirect."
    )
    messages = [{"role": "system", "content": system}]
    for h in body.history[-6:]:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": body.message})
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini", messages=messages, max_tokens=300,
        )
        reply = response.choices[0].message.content
    except Exception as e:
        logger.error(f"Public chat error: {e}")
        raise HTTPException(status_code=500, detail="AI service error")
    return {"reply": reply}


@api_router.post("/ai/chat")
async def ai_chat(body: ChatBody, user=Depends(get_current_user)):
    if not openai_client:
        raise HTTPException(status_code=503, detail="AI service not configured")
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": (
                    "You are T&B Paving AI, an expert paving and driveway assistant. "
                    "Help with project planning, scheduling, building codes, material calculations, "
                    "safety guidance, and cost estimation. Be concise, practical and use clear structure."
                )},
                {"role": "user", "content": body.message},
            ],
        )
        reply = response.choices[0].message.content
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
    if not openai_client:
        raise HTTPException(status_code=503, detail="AI service not configured")
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a senior construction cost estimator with 20 years experience."},
                {"role": "user", "content": prompt},
            ],
        )
        reply = response.choices[0].message.content
    except Exception as e:
        logger.error(f"AI estimate error: {e}")
        raise HTTPException(status_code=500, detail="AI service error")
    return {"estimate": reply}


class ReviewReplyBody(BaseModel):
    reviewer_name: str
    review_text: str
    stars: int = 5

@api_router.post("/ai/review-reply")
async def ai_review_reply(body: ReviewReplyBody, user=Depends(get_current_user)):
    if not openai_client:
        raise HTTPException(status_code=503, detail="AI service not configured")
    prompt = (
        f"Write a warm, professional reply to this customer review for T&B Paving (Essex & Suffolk).\n\n"
        f"Reviewer: {body.reviewer_name}\n"
        f"Stars: {body.stars}/5\n"
        f"Review: {body.review_text}\n\n"
        "Guidelines: Thank them by first name. Reference something specific from their review. "
        "Mention you'd be happy to help them or their contacts in future. "
        "Keep it 2-3 sentences. Sound genuine, not corporate. Sign off as 'The T&B Paving Team'."
    )
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You write friendly, genuine business replies to customer reviews."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=150,
        )
        reply = response.choices[0].message.content
    except Exception as e:
        logger.error(f"Review reply error: {e}")
        raise HTTPException(status_code=500, detail="AI service error")
    return {"reply": reply}


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
