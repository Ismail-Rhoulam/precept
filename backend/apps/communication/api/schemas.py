from typing import Optional
from datetime import datetime, date

from ninja import Schema


# ---------------------------------------------------------------------------
# Task
# ---------------------------------------------------------------------------


class TaskOut(Schema):
    id: int
    title: str
    description: str
    priority: str
    status: str
    assigned_to_id: Optional[int] = None
    assigned_to_name: Optional[str] = None
    assigned_to_email: Optional[str] = None
    start_date: Optional[date] = None
    due_date: Optional[datetime] = None
    entity_type: Optional[str] = None  # "lead" or "deal"
    entity_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    created_by_email: Optional[str] = None

    @staticmethod
    def resolve_assigned_to_name(obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip()
        return None

    @staticmethod
    def resolve_assigned_to_email(obj):
        return obj.assigned_to.email if obj.assigned_to else None

    @staticmethod
    def resolve_entity_type(obj):
        if obj.content_type:
            return obj.content_type.model  # "lead" or "deal"
        return None

    @staticmethod
    def resolve_entity_id(obj):
        return obj.object_id

    @staticmethod
    def resolve_created_by_email(obj):
        return obj.created_by.email if obj.created_by else None


class TaskCreate(Schema):
    title: str
    description: str = ""
    priority: str = "Medium"
    status: str = "Todo"
    assigned_to_id: Optional[int] = None
    start_date: Optional[date] = None
    due_date: Optional[datetime] = None
    entity_type: Optional[str] = None  # "lead" or "deal"
    entity_id: Optional[int] = None


class TaskUpdate(Schema):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to_id: Optional[int] = None
    start_date: Optional[date] = None
    due_date: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Note
# ---------------------------------------------------------------------------


class NoteOut(Schema):
    id: int
    title: str
    content: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    created_by_email: Optional[str] = None
    created_by_name: Optional[str] = None

    @staticmethod
    def resolve_entity_type(obj):
        if obj.content_type:
            return obj.content_type.model
        return None

    @staticmethod
    def resolve_entity_id(obj):
        return obj.object_id

    @staticmethod
    def resolve_created_by_email(obj):
        return obj.created_by.email if obj.created_by else None

    @staticmethod
    def resolve_created_by_name(obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
        return None


class NoteCreate(Schema):
    title: str
    content: str = ""
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None


class NoteUpdate(Schema):
    title: Optional[str] = None
    content: Optional[str] = None


# ---------------------------------------------------------------------------
# Comment
# ---------------------------------------------------------------------------


class CommentOut(Schema):
    id: int
    content: str
    comment_by_id: Optional[int] = None
    comment_by_email: Optional[str] = None
    comment_by_name: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    created_at: datetime

    @staticmethod
    def resolve_comment_by_email(obj):
        return obj.comment_by.email if obj.comment_by else None

    @staticmethod
    def resolve_comment_by_name(obj):
        if obj.comment_by:
            return f"{obj.comment_by.first_name} {obj.comment_by.last_name}".strip()
        return None

    @staticmethod
    def resolve_entity_type(obj):
        if obj.content_type:
            return obj.content_type.model
        return None

    @staticmethod
    def resolve_entity_id(obj):
        return obj.object_id


class CommentCreate(Schema):
    content: str
    entity_type: str  # "lead" or "deal"
    entity_id: int


# ---------------------------------------------------------------------------
# CallLog
# ---------------------------------------------------------------------------


class CallLogOut(Schema):
    id: int
    call_id: str
    caller_number: str
    receiver_number: str
    status: str
    call_type: str
    duration: Optional[str] = None  # formatted as string
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    recording_url: str
    telephony_medium: str
    caller_email: Optional[str] = None
    caller_name: Optional[str] = None
    receiver_email: Optional[str] = None
    receiver_name: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    created_at: datetime

    @staticmethod
    def resolve_duration(obj):
        if obj.duration:
            total_seconds = int(obj.duration.total_seconds())
            minutes, seconds = divmod(total_seconds, 60)
            hours, minutes = divmod(minutes, 60)
            if hours:
                return f"{hours}h {minutes}m {seconds}s"
            if minutes:
                return f"{minutes}m {seconds}s"
            return f"{seconds}s"
        return None

    @staticmethod
    def resolve_caller_email(obj):
        return obj.caller.email if obj.caller else None

    @staticmethod
    def resolve_caller_name(obj):
        if obj.caller:
            return f"{obj.caller.first_name} {obj.caller.last_name}".strip()
        return None

    @staticmethod
    def resolve_receiver_email(obj):
        return obj.receiver.email if obj.receiver else None

    @staticmethod
    def resolve_receiver_name(obj):
        if obj.receiver:
            return f"{obj.receiver.first_name} {obj.receiver.last_name}".strip()
        return None

    @staticmethod
    def resolve_entity_type(obj):
        if obj.content_type:
            return obj.content_type.model
        return None

    @staticmethod
    def resolve_entity_id(obj):
        return obj.object_id


class CallLogCreate(Schema):
    caller_number: str
    receiver_number: str
    status: str = "Initiated"
    call_type: str = "Outgoing"
    duration_seconds: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    recording_url: str = ""
    telephony_medium: str = "Manual"
    caller_id: Optional[int] = None
    receiver_id: Optional[int] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None


class CallLogUpdate(Schema):
    caller_number: Optional[str] = None
    receiver_number: Optional[str] = None
    status: Optional[str] = None
    call_type: Optional[str] = None
    duration_seconds: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    recording_url: Optional[str] = None
    telephony_medium: Optional[str] = None
    caller_id: Optional[int] = None
    receiver_id: Optional[int] = None


# ---------------------------------------------------------------------------
# Notification
# ---------------------------------------------------------------------------


class NotificationOut(Schema):
    id: int
    notification_text: str
    from_user_email: Optional[str] = None
    from_user_name: Optional[str] = None
    to_user_email: Optional[str] = None
    type: str
    read: bool
    message: str
    reference_doctype: Optional[str] = None
    reference_id: Optional[int] = None
    created_at: datetime

    @staticmethod
    def resolve_from_user_email(obj):
        return obj.from_user.email if obj.from_user else None

    @staticmethod
    def resolve_from_user_name(obj):
        if obj.from_user:
            return f"{obj.from_user.first_name} {obj.from_user.last_name}".strip()
        return None

    @staticmethod
    def resolve_to_user_email(obj):
        return obj.to_user.email if obj.to_user else None

    @staticmethod
    def resolve_reference_doctype(obj):
        if obj.reference_content_type:
            return obj.reference_content_type.model
        return None

    @staticmethod
    def resolve_reference_id(obj):
        return obj.reference_object_id


# ---------------------------------------------------------------------------
# StatusChangeLog
# ---------------------------------------------------------------------------


class StatusChangeLogOut(Schema):
    id: int
    from_status: str
    to_status: str
    changed_by_email: Optional[str] = None
    changed_by_name: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    created_at: datetime

    @staticmethod
    def resolve_changed_by_email(obj):
        return obj.changed_by.email if obj.changed_by else None

    @staticmethod
    def resolve_changed_by_name(obj):
        if obj.changed_by:
            return f"{obj.changed_by.first_name} {obj.changed_by.last_name}".strip()
        return None

    @staticmethod
    def resolve_entity_type(obj):
        return obj.content_type.model if obj.content_type else None

    @staticmethod
    def resolve_entity_id(obj):
        return obj.object_id


# ---------------------------------------------------------------------------
# Activity (unified timeline entry)
# ---------------------------------------------------------------------------


class ActivityOut(Schema):
    id: int
    activity_type: str  # "comment", "note", "task", "call_log", "status_change", "creation"
    created_at: datetime
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    data: Optional[dict] = None  # type-specific payload


# ---------------------------------------------------------------------------
# EventParticipant
# ---------------------------------------------------------------------------


class EventParticipantOut(Schema):
    id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    email: str
    attending: str

    @staticmethod
    def resolve_user_email(obj):
        return obj.user.email if obj.user else None

    @staticmethod
    def resolve_user_name(obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip()
        return None


class EventParticipantCreate(Schema):
    user_id: Optional[int] = None
    email: str
    attending: str = "Yes"


# ---------------------------------------------------------------------------
# Event
# ---------------------------------------------------------------------------


class EventOut(Schema):
    id: int
    subject: str
    description: str
    location: str
    starts_on: datetime
    ends_on: Optional[datetime] = None
    all_day: bool
    event_type: str
    color: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    owner_id: int
    owner_email: Optional[str] = None
    owner_name: Optional[str] = None
    participants: Optional[list] = None
    created_at: datetime
    updated_at: datetime

    @staticmethod
    def resolve_owner_email(obj):
        return obj.owner.email if obj.owner else None

    @staticmethod
    def resolve_owner_name(obj):
        if obj.owner:
            return f"{obj.owner.first_name} {obj.owner.last_name}".strip()
        return None

    @staticmethod
    def resolve_participants(obj):
        # Only populated when explicitly prefetch_related
        if hasattr(obj, "_prefetched_objects_cache") and "participants" in obj._prefetched_objects_cache:
            return [EventParticipantOut.from_orm(p) for p in obj.participants.all()]
        return None


class EventCreate(Schema):
    subject: str
    description: str = ""
    location: str = ""
    starts_on: datetime
    ends_on: Optional[datetime] = None
    all_day: bool = False
    event_type: str = "Private"
    color: str = ""
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    participants: Optional[list] = None  # list of EventParticipantCreate dicts


class EventUpdate(Schema):
    subject: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    starts_on: Optional[datetime] = None
    ends_on: Optional[datetime] = None
    all_day: Optional[bool] = None
    event_type: Optional[str] = None
    color: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
