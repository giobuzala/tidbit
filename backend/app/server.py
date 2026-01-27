"""ChatKit server that streams responses from a single assistant."""

from __future__ import annotations

import base64
from typing import Any, AsyncIterator

from agents import RunConfig, Runner
from chatkit.agents import (
    AgentContext,
    ThreadItemConverter,
    stream_agent_response,
)
from chatkit.server import ChatKitServer
from chatkit.types import Attachment, ThreadMetadata, ThreadStreamEvent, UserMessageItem
from openai.types.responses import ResponseInputFileParam

from .memory_store import MemoryStore
from agents import Agent


MAX_RECENT_ITEMS = 30
MODEL = "gpt-4.1"


media_summary_agent = Agent[AgentContext[dict[str, Any]]](
    model=MODEL,
    name="Media summary agent",
    instructions=(
        "If the user message does not contain a news article URL, uploaded file, "
        "or pasted article text to analyze, respond normally and conversationally "
        "to the user's message. Only apply the analysis workflow below when an "
        "input to analyze is provided.\n\n"
        "You will receive one or more inputs. Each input may be either:\n"
        "- a public news article URL,\n"
        "- an uploaded text-based file (PDF, DOCX, or TXT), or\n"
        "- plain text pasted directly into the conversation.\n\n"
        "For each input:\n"
        "1. If a URL is provided, open the link.\n"
        "2. If a file is provided, read the file contents.\n"
        "3. If plain text is provided, treat it as the full content.\n"
        "4. Read the full article or document body (not just the headline).\n"
        "5. Extract the original headline exactly as it appears in the article "
        "or document.\n"
        "6. Write one concise paragraph summarizing the main points.\n"
        "7. Provide exactly five keywords describing the primary topics.\n\n"
        "Output format:\n"
        "- Process inputs in the order received.\n"
        "- For each input, output a clearly separated block using the format below.\n\n"
        "Use this format exactly:\n\n"
        "Headline:\n"
        "<original headline as published>\n\n"
        "Summary:\n"
        "<one paragraph summary>\n\n"
        "Keywords:\n"
        "<keyword 1>; <keyword 2>; <keyword 3>; <keyword 4>; <keyword 5>\n\n"
        "---\n\n"
        "Rules:\n"
        "- Use the original published headline only.\n"
        "- Do not rewrite, paraphrase, infer, or generate a headline.\n"
        "- If no explicit headline exists, write:\n"
        "  Headline:\n"
        "  Unavailable\n"
        "- Summaries must be factual, neutral, and written in plain language.\n"
        "- Keywords must be nouns or noun phrases.\n"
        "- Use exactly five keywords.\n"
        "- Do not use hashtags.\n"
        "- Do not add commentary or opinions.\n"
        "- Do not mention URLs or file names.\n"
        "- Do not include extra sections or explanatory text.\n\n"
        "If content cannot be accessed (e.g., paywall, broken link, unreadable file), "
        "output:\n\n"
        "Headline:\n"
        "Unavailable\n\n"
        "Status:\n"
        "<brief reason content could not be accessed>\n\n"
        "If a provided link does not resemble a news article at all (e.g., homepage, "
        "category page, search results, forum thread, product page), output:\n\n"
        "Headline:\n"
        "Not a news article\n\n"
        "Status:\n"
        "Input does not appear to be a news article\n\n"
        "Do not provide a summary or keywords in this case."
    ),
)


class StarterChatServer(ChatKitServer[dict[str, Any]]):
    """Server implementation that keeps conversation state in memory."""

    def __init__(self) -> None:
        self.store: MemoryStore = MemoryStore()
        self.converter = StarterThreadItemConverter(self.store)
        super().__init__(self.store)

    async def respond(
        self,
        thread: ThreadMetadata,
        item: UserMessageItem | None,
        context: dict[str, Any],
    ) -> AsyncIterator[ThreadStreamEvent]:
        items_page = await self.store.load_thread_items(
            thread.id,
            after=None,
            limit=MAX_RECENT_ITEMS,
            order="desc",
            context=context,
        )
        items = list(reversed(items_page.data))
        agent_input = await self.converter.to_agent_input(items)

        agent_context = AgentContext(
            thread=thread,
            store=self.store,
            request_context=context,
        )

        result = Runner.run_streamed(
            media_summary_agent,
            agent_input,
            context=agent_context,
            run_config=RunConfig(
                trace_metadata={
                    "__trace_source__": "agent-builder",
                    "workflow_id": "wf_6977fe4bcf008190a19ff4780cdb706f00b7eba8aba4afa0",
                }
            ),
        )

        async for event in stream_agent_response(agent_context, result):
            yield event


def _as_data_url(mime_type: str, content: bytes) -> str:
    encoded = base64.b64encode(content).decode("utf-8")
    return f"data:{mime_type};base64,{encoded}"


class StarterThreadItemConverter(ThreadItemConverter):
    def __init__(self, store: MemoryStore) -> None:
        self.store = store

    async def attachment_to_message_content(
        self, attachment: Attachment
    ) -> ResponseInputFileParam:
        content = await self.store.load_attachment_bytes(attachment.id)
        allowed_types = {
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
        }
        if attachment.mime_type not in allowed_types:
            raise ValueError("Only PDF or Word attachments are supported.")
        return ResponseInputFileParam(
            type="input_file",
            file_data=_as_data_url(attachment.mime_type, content),
            filename=attachment.name or "document",
        )
