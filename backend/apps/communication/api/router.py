from ninja import Router

from apps.communication.api import activities, comments, notes, tasks, notifications, call_logs, events

router = Router()

router.add_router("/activities/", activities.router, tags=["Activities"])
router.add_router("/comments/", comments.router, tags=["Comments"])
router.add_router("/notes/", notes.router, tags=["Notes"])
router.add_router("/tasks/", tasks.router, tags=["Tasks"])
router.add_router("/notifications/", notifications.router, tags=["Notifications"])
router.add_router("/call-logs/", call_logs.router, tags=["Call Logs"])
router.add_router("/events/", events.router, tags=["Events"])
