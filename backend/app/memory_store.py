"""
Simple in-memory store compatible with the ChatKit Store interface.
A production app would implement this using a persistant database.
"""

from __future__ import annotations

from collections import defaultdict

from chatkit.store import NotFoundError, Store
from chatkit.types import Attachment, Page, ThreadItem, ThreadMetadata


class MemoryStore(Store[dict]):
    def __init__(self):
        self.threads: dict[str, dict[str, ThreadMetadata]] = defaultdict(dict)
        self.items: dict[str, dict[str, list[ThreadItem]]] = defaultdict(
            lambda: defaultdict(list)
        )
        self.attachments: dict[str, Attachment] = {}
        self.attachment_bytes: dict[str, bytes] = {}

    def _session_id(self, context: dict) -> str:
        return context.get("session_id") or "default"

    async def load_thread(self, thread_id: str, context: dict) -> ThreadMetadata:
        session_id = self._session_id(context)
        if thread_id not in self.threads[session_id]:
            raise NotFoundError(f"Thread {thread_id} not found")
        return self.threads[session_id][thread_id]

    async def save_thread(self, thread: ThreadMetadata, context: dict) -> None:
        session_id = self._session_id(context)
        self.threads[session_id][thread.id] = thread

    async def load_threads(
        self, limit: int, after: str | None, order: str, context: dict
    ) -> Page[ThreadMetadata]:
        session_id = self._session_id(context)
        threads = list(self.threads[session_id].values())
        return self._paginate(
            threads,
            after,
            limit,
            order,
            sort_key=lambda t: t.created_at,
            cursor_key=lambda t: t.id,
        )

    async def load_thread_items(
        self, thread_id: str, after: str | None, limit: int, order: str, context: dict
    ) -> Page[ThreadItem]:
        session_id = self._session_id(context)
        items = self.items[session_id].get(thread_id, [])
        return self._paginate(
            items,
            after,
            limit,
            order,
            sort_key=lambda i: i.created_at,
            cursor_key=lambda i: i.id,
        )

    async def add_thread_item(
        self, thread_id: str, item: ThreadItem, context: dict
    ) -> None:
        session_id = self._session_id(context)
        self.items[session_id][thread_id].append(item)

    async def save_item(self, thread_id: str, item: ThreadItem, context: dict) -> None:
        session_id = self._session_id(context)
        items = self.items[session_id][thread_id]
        for idx, existing in enumerate(items):
            if existing.id == item.id:
                items[idx] = item
                return
        items.append(item)

    async def load_item(
        self, thread_id: str, item_id: str, context: dict
    ) -> ThreadItem:
        session_id = self._session_id(context)
        for item in self.items[session_id].get(thread_id, []):
            if item.id == item_id:
                return item
        raise NotFoundError(f"Item {item_id} not found in thread {thread_id}")

    async def delete_thread(self, thread_id: str, context: dict) -> None:
        session_id = self._session_id(context)
        self.threads[session_id].pop(thread_id, None)
        self.items[session_id].pop(thread_id, None)

    async def delete_thread_item(
        self, thread_id: str, item_id: str, context: dict
    ) -> None:
        session_id = self._session_id(context)
        self.items[session_id][thread_id] = [
            item
            for item in self.items[session_id].get(thread_id, [])
            if item.id != item_id
        ]

    def _paginate(
        self,
        rows: list,
        after: str | None,
        limit: int,
        order: str,
        sort_key,
        cursor_key,
    ):
        sorted_rows = sorted(rows, key=sort_key, reverse=order == "desc")
        start = 0
        if after:
            for idx, row in enumerate(sorted_rows):
                if cursor_key(row) == after:
                    start = idx + 1
                    break
        data = sorted_rows[start : start + limit]
        has_more = start + limit < len(sorted_rows)
        next_after = cursor_key(data[-1]) if has_more and data else None
        return Page(data=data, has_more=has_more, after=next_after)

    # Attachments are not implemented in the quickstart store

    async def save_attachment(self, attachment: Attachment, context: dict) -> None:
        self.attachments[attachment.id] = attachment

    async def load_attachment(self, attachment_id: str, context: dict) -> Attachment:
        attachment = self.attachments.get(attachment_id)
        if not attachment:
            raise NotFoundError(f"Attachment {attachment_id} not found")
        return attachment

    async def delete_attachment(self, attachment_id: str, context: dict) -> None:
        self.attachments.pop(attachment_id, None)
        self.attachment_bytes.pop(attachment_id, None)

    async def save_attachment_bytes(self, attachment_id: str, data: bytes) -> None:
        self.attachment_bytes[attachment_id] = data

    async def load_attachment_bytes(self, attachment_id: str) -> bytes:
        data = self.attachment_bytes.get(attachment_id)
        if data is None:
            raise NotFoundError(f"Attachment bytes {attachment_id} not found")
        return data
