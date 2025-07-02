"""
Web-Buddy Framework Event-Driven Python Client

Copyright (C) 2025-today  rydnr@acm-sl.org

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
"""

import asyncio
import time
from typing import Dict, List, Optional, Any, Union, Type
from dataclasses import dataclass
from abc import ABC, abstractmethod
import aiohttp
import requests
from .events import (
    DomainEvent,
    EventResponse,
    ProjectSelectionRequested,
    ProjectSelected,
    ProjectSelectionFailed,
    ChatSelectionRequested,
    ChatSelected,
    ChatSelectionFailed,
    PromptSubmissionRequested,
    PromptSubmitted,
    PromptSubmissionFailed,
    ResponseRetrievalRequested,
    ResponseRetrieved,
    ResponseRetrievalFailed,
    GoogleImageDownloadRequested,
    GoogleImageDownloadCompleted,
    GoogleImageDownloadFailed,
    FileDownloadRequested,
    FileDownloadStarted,
    FileDownloadFailed,
    TrainingModeRequested,
    TrainingModeEnabled
)


@dataclass
class ClientConfig:
    """Configuration for Web-Buddy client"""
    base_url: str
    api_key: str
    timeout: int = 30
    retries: int = 3
    user_agent: str = 'WebBuddyPythonSDK/1.0.0'


class EventDrivenWebBuddyClient:
    """
    Event-Driven Web-Buddy Python Client
    
    Pure event-driven interface following the Web-Buddy Framework's EDA principles.
    All operations are performed by sending domain events and receiving event responses.
    """
    
    def __init__(self, config: ClientConfig):
        self.config = config
        self._session = None
        self._event_queue: Dict[str, asyncio.Future] = {}
    
    # === Core Event Sending Interface ===
    
    async def send_event(
        self,
        event: DomainEvent,
        extension_id: str,
        tab_id: int
    ) -> EventResponse:
        """
        Sends a domain event and waits for response.
        This is the low-level interface that all other methods use.
        """
        correlation_id = event.correlation_id or self._generate_correlation_id()
        
        try:
            # Create the dispatch payload in Web-Buddy format
            dispatch_payload = {
                'target': {
                    'extensionId': extension_id,
                    'tabId': tab_id
                },
                'message': {
                    'action': self._map_event_to_action(event),
                    'payload': self._extract_event_payload(event),
                    'correlationId': correlation_id
                }
            }
            
            # Send HTTP request to server
            response_data = await self._make_request('POST', '/api/dispatch', dispatch_payload)
            
            # Wait for and return the event response
            return await self._wait_for_event_response(correlation_id)
            
        except Exception as error:
            raise EventSendError(
                f'Failed to send event {event.__class__.__name__}: {str(error)}',
                event,
                error
            )
    
    async def send_events(
        self,
        events: List[Dict[str, Any]],
        parallel: bool = False,
        stop_on_error: bool = True
    ) -> List[EventResponse]:
        """
        Sends multiple events in sequence or parallel
        """
        if parallel:
            tasks = [
                self.send_event(event_data['event'], event_data['extension_id'], event_data['tab_id'])
                for event_data in events
            ]
            return await asyncio.gather(*tasks)
        else:
            results = []
            for event_data in events:
                try:
                    result = await self.send_event(
                        event_data['event'],
                        event_data['extension_id'],
                        event_data['tab_id']
                    )
                    results.append(result)
                except Exception as error:
                    if stop_on_error:
                        raise error
                    print(f"Warning: Event {event_data['event'].__class__.__name__} failed: {error}")
            return results
    
    # === High-Level Convenience Methods ===
    
    async def request_project_selection(
        self,
        extension_id: str,
        tab_id: int,
        project_name: str,
        selector: Optional[str] = None
    ) -> Union[ProjectSelected, ProjectSelectionFailed]:
        """Requests ChatGPT project selection"""
        event = ProjectSelectionRequested(
            project_name=project_name,
            selector=selector,
            correlation_id=self._generate_correlation_id()
        )
        
        return await self.send_event(event, extension_id, tab_id)
    
    async def request_chat_selection(
        self,
        extension_id: str,
        tab_id: int,
        chat_title: str,
        selector: Optional[str] = None
    ) -> Union[ChatSelected, ChatSelectionFailed]:
        """Requests chat selection"""
        event = ChatSelectionRequested(
            chat_title=chat_title,
            selector=selector,
            correlation_id=self._generate_correlation_id()
        )
        
        return await self.send_event(event, extension_id, tab_id)
    
    async def request_prompt_submission(
        self,
        extension_id: str,
        tab_id: int,
        prompt_text: str,
        selector: str = '#prompt-textarea'
    ) -> Union[PromptSubmitted, PromptSubmissionFailed]:
        """Requests prompt submission"""
        event = PromptSubmissionRequested(
            prompt_text=prompt_text,
            selector=selector,
            correlation_id=self._generate_correlation_id()
        )
        
        return await self.send_event(event, extension_id, tab_id)
    
    async def request_response_retrieval(
        self,
        extension_id: str,
        tab_id: int,
        selector: str = '[data-message-author-role="assistant"]',
        timeout: int = 30000
    ) -> Union[ResponseRetrieved, ResponseRetrievalFailed]:
        """Requests response retrieval from ChatGPT"""
        event = ResponseRetrievalRequested(
            selector=selector,
            timeout=timeout,
            correlation_id=self._generate_correlation_id()
        )
        
        return await self.send_event(event, extension_id, tab_id)
    
    async def request_google_image_download(
        self,
        extension_id: str,
        tab_id: int,
        image_element: Dict[str, Any],
        search_query: Optional[str] = None,
        filename: Optional[str] = None
    ) -> Union[GoogleImageDownloadCompleted, GoogleImageDownloadFailed]:
        """Requests Google Images download"""
        event = GoogleImageDownloadRequested(
            image_element=image_element,
            search_query=search_query,
            filename=filename,
            correlation_id=self._generate_correlation_id()
        )
        
        return await self.send_event(event, extension_id, tab_id)
    
    async def request_file_download(
        self,
        extension_id: str,
        tab_id: int,
        url: str,
        filename: Optional[str] = None,
        conflict_action: str = 'uniquify',
        save_as: bool = False
    ) -> Union[FileDownloadStarted, FileDownloadFailed]:
        """Requests file download"""
        event = FileDownloadRequested(
            url=url,
            filename=filename,
            conflict_action=conflict_action,
            save_as=save_as,
            correlation_id=self._generate_correlation_id()
        )
        
        return await self.send_event(event, extension_id, tab_id)
    
    async def request_training_mode(
        self,
        website: str
    ) -> TrainingModeEnabled:
        """Requests training mode activation"""
        event = TrainingModeRequested(
            website=website,
            correlation_id=self._generate_correlation_id()
        )
        
        # Training mode requests go directly to server
        return await self._send_training_event(event)
    
    # === Workflow Convenience Methods ===
    
    async def execute_full_chatgpt_workflow(
        self,
        extension_id: str,
        tab_id: int,
        workflow: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Complete ChatGPT workflow: select project, submit prompt, get response
        """
        results = {}
        
        # Step 1: Select project
        results['project_selection'] = await self.request_project_selection(
            extension_id, tab_id, workflow['project_name']
        )
        
        if isinstance(results['project_selection'], ProjectSelectionFailed):
            raise WorkflowError('Project selection failed', results)
        
        # Step 2: Select chat (optional)
        if workflow.get('chat_title'):
            results['chat_selection'] = await self.request_chat_selection(
                extension_id, tab_id, workflow['chat_title']
            )
            
            if isinstance(results['chat_selection'], ChatSelectionFailed):
                raise WorkflowError('Chat selection failed', results)
        
        # Step 3: Submit prompt
        results['prompt_submission'] = await self.request_prompt_submission(
            extension_id, tab_id, workflow['prompt_text']
        )
        
        if isinstance(results['prompt_submission'], PromptSubmissionFailed):
            raise WorkflowError('Prompt submission failed', results)
        
        # Step 4: Get response
        results['response_retrieval'] = await self.request_response_retrieval(
            extension_id, tab_id
        )
        
        return results
    
    async def download_multiple_google_images(
        self,
        extension_id: str,
        tab_id: int,
        images: List[Dict[str, Any]],
        parallel: bool = False,
        delay_between: float = 1.0
    ) -> List[Union[GoogleImageDownloadCompleted, GoogleImageDownloadFailed]]:
        """Batch Google Images download"""
        download_events = [
            {
                'event': GoogleImageDownloadRequested(
                    image_element=img['element'],
                    search_query=img.get('search_query'),
                    filename=img.get('filename', f'image_{i+1}'),
                    correlation_id=self._generate_correlation_id()
                ),
                'extension_id': extension_id,
                'tab_id': tab_id
            }
            for i, img in enumerate(images)
        ]
        
        if parallel:
            return await self.send_events(download_events, parallel=True)
        else:
            results = []
            for event_data in download_events:
                result = await self.send_event(
                    event_data['event'],
                    event_data['extension_id'],
                    event_data['tab_id']
                )
                results.append(result)
                
                if delay_between > 0:
                    await asyncio.sleep(delay_between)
                    
            return results
    
    # === Utility Methods ===
    
    async def ping(self) -> Dict[str, Any]:
        """Tests connectivity with server"""
        start_time = time.time()
        try:
            await self._make_request('GET', '/docs/health')
            return {
                'success': True,
                'latency': int((time.time() - start_time) * 1000)
            }
        except Exception:
            return {
                'success': False,
                'latency': int((time.time() - start_time) * 1000)
            }
    
    def get_config(self) -> ClientConfig:
        """Gets client configuration"""
        return self.config
    
    def update_config(self, updates: Dict[str, Any]) -> None:
        """Updates client configuration"""
        for key, value in updates.items():
            if hasattr(self.config, key):
                setattr(self.config, key, value)
    
    # === Private Helper Methods ===
    
    def _generate_correlation_id(self) -> str:
        """Generates unique correlation ID"""
        return f'py-client-{int(time.time() * 1000)}-{id(self) % 10000}'
    
    def _map_event_to_action(self, event: DomainEvent) -> str:
        """Maps domain event to Web-Buddy action"""
        event_type_map = {
            'ProjectSelectionRequested': 'SELECT_PROJECT',
            'ChatSelectionRequested': 'SELECT_CHAT',
            'PromptSubmissionRequested': 'FILL_PROMPT',
            'ResponseRetrievalRequested': 'GET_RESPONSE',
            'GoogleImageDownloadRequested': 'DOWNLOAD_IMAGE',
            'FileDownloadRequested': 'DOWNLOAD_FILE'
        }
        
        action = event_type_map.get(event.__class__.__name__)
        if not action:
            raise ValueError(f'No action mapping found for event type: {event.__class__.__name__}')
        return action
    
    def _extract_event_payload(self, event: DomainEvent) -> Dict[str, Any]:
        """Extracts payload from domain event"""
        if isinstance(event, ProjectSelectionRequested):
            return {
                'selector': event.selector or f'[data-project-name="{event.project_name}"]'
            }
        elif isinstance(event, PromptSubmissionRequested):
            return {
                'selector': event.selector,
                'value': event.prompt_text
            }
        elif isinstance(event, GoogleImageDownloadRequested):
            return {
                'selector': 'img',  # Will be refined by Google Images adapter
                'imageElement': event.image_element,
                'searchQuery': event.search_query,
                'filename': event.filename
            }
        elif isinstance(event, FileDownloadRequested):
            return {
                'url': event.url,
                'filename': event.filename,
                'conflictAction': event.conflict_action,
                'saveAs': event.save_as
            }
        
        # Default payload extraction
        return {
            key: value for key, value in event.__dict__.items()
            if key != 'correlation_id'
        }
    
    async def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Any:
        """Makes HTTP request with authentication and error handling"""
        url = f'{self.config.base_url}{endpoint}'
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.config.api_key}',
            'User-Agent': self.config.user_agent
        }
        
        if self._session is None:
            self._session = aiohttp.ClientSession()
        
        for attempt in range(self.config.retries):
            try:
                async with self._session.request(
                    method,
                    url,
                    headers=headers,
                    json=data,
                    timeout=aiohttp.ClientTimeout(total=self.config.timeout)
                ) as response:
                    if response.status >= 400:
                        error_data = await response.json() if response.content_type == 'application/json' else {}
                        raise EventSendError(f'HTTP {response.status}: {error_data.get("error", response.reason)}')
                    
                    return await response.json()
                    
            except asyncio.TimeoutError:
                if attempt == self.config.retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
            except Exception as error:
                if attempt == self.config.retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)
    
    async def _wait_for_event_response(self, correlation_id: str) -> EventResponse:
        """
        Waits for event response with matching correlation ID
        In a real implementation, this would listen for WebSocket responses
        or poll for the response. For now, we simulate immediate response.
        """
        # Placeholder - in real implementation would:
        # 1. Listen on WebSocket for responses with matching correlation_id
        # 2. Or poll a /api/responses/{correlation_id} endpoint
        # 3. Or use Server-Sent Events for real-time updates
        
        await asyncio.sleep(0.1)  # Simulate network delay
        
        # Return a mock successful response for now
        from .events import GenericEventResponse
        return GenericEventResponse(
            correlation_id=correlation_id,
            success=True,
            data={'message': 'Event processed successfully'}
        )
    
    async def _send_training_event(self, event: DomainEvent) -> EventResponse:
        """Sends training events to specific training endpoints"""
        endpoint = self._get_training_endpoint(event)
        payload = self._extract_event_payload(event)
        
        response_data = await self._make_request('POST', endpoint, payload)
        
        # Convert response to appropriate event response type
        from .events import TrainingModeEnabled
        return TrainingModeEnabled(
            session_id=response_data.get('sessionId', 'unknown'),
            website=response_data.get('website', ''),
            existing_patterns=response_data.get('existingPatterns', 0),
            correlation_id=event.correlation_id
        )
    
    def _get_training_endpoint(self, event: DomainEvent) -> str:
        """Gets appropriate training endpoint for event"""
        if isinstance(event, TrainingModeRequested):
            return '/api/training/enable'
        raise ValueError(f'No training endpoint for event: {event.__class__.__name__}')
    
    async def close(self):
        """Closes the client session"""
        if self._session:
            await self._session.close()
            self._session = None


# === Synchronous Client ===

class SyncEventDrivenWebBuddyClient:
    """
    Synchronous version of the event-driven client
    For use cases where async/await is not preferred
    """
    
    def __init__(self, config: ClientConfig):
        self.config = config
        self._session = requests.Session()
        self._session.headers.update({
            'Authorization': f'Bearer {config.api_key}',
            'Content-Type': 'application/json',
            'User-Agent': config.user_agent
        })
    
    def send_event(
        self,
        event: DomainEvent,
        extension_id: str,
        tab_id: int
    ) -> EventResponse:
        """Synchronous event sending"""
        correlation_id = event.correlation_id or self._generate_correlation_id()
        
        try:
            dispatch_payload = {
                'target': {'extensionId': extension_id, 'tabId': tab_id},
                'message': {
                    'action': self._map_event_to_action(event),
                    'payload': self._extract_event_payload(event),
                    'correlationId': correlation_id
                }
            }
            
            response_data = self._make_request('POST', '/api/dispatch', dispatch_payload)
            return self._create_mock_response(correlation_id)
            
        except Exception as error:
            raise EventSendError(
                f'Failed to send event {event.__class__.__name__}: {str(error)}',
                event,
                error
            )
    
    def request_project_selection(
        self,
        extension_id: str,
        tab_id: int,
        project_name: str,
        selector: Optional[str] = None
    ) -> Union[ProjectSelected, ProjectSelectionFailed]:
        """Synchronous project selection"""
        event = ProjectSelectionRequested(
            project_name=project_name,
            selector=selector,
            correlation_id=self._generate_correlation_id()
        )
        
        return self.send_event(event, extension_id, tab_id)
    
    def ping(self) -> Dict[str, Any]:
        """Synchronous connectivity test"""
        start_time = time.time()
        try:
            self._make_request('GET', '/docs/health')
            return {
                'success': True,
                'latency': int((time.time() - start_time) * 1000)
            }
        except Exception:
            return {
                'success': False,
                'latency': int((time.time() - start_time) * 1000)
            }
    
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Any:
        """Synchronous HTTP request"""
        url = f'{self.config.base_url}{endpoint}'
        
        try:
            if method == 'GET':
                response = self._session.get(url, timeout=self.config.timeout)
            elif method == 'POST':
                response = self._session.post(url, json=data, timeout=self.config.timeout)
            else:
                raise ValueError(f'Unsupported HTTP method: {method}')
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            raise EventSendError(f'Request failed: {str(e)}')
    
    def _generate_correlation_id(self) -> str:
        return f'py-sync-{int(time.time() * 1000)}-{id(self) % 10000}'
    
    def _map_event_to_action(self, event: DomainEvent) -> str:
        # Same as async version
        event_type_map = {
            'ProjectSelectionRequested': 'SELECT_PROJECT',
            'ChatSelectionRequested': 'SELECT_CHAT',
            'PromptSubmissionRequested': 'FILL_PROMPT',
            'ResponseRetrievalRequested': 'GET_RESPONSE',
            'GoogleImageDownloadRequested': 'DOWNLOAD_IMAGE',
            'FileDownloadRequested': 'DOWNLOAD_FILE'
        }
        
        action = event_type_map.get(event.__class__.__name__)
        if not action:
            raise ValueError(f'No action mapping found for event type: {event.__class__.__name__}')
        return action
    
    def _extract_event_payload(self, event: DomainEvent) -> Dict[str, Any]:
        # Same logic as async version
        if isinstance(event, ProjectSelectionRequested):
            return {
                'selector': event.selector or f'[data-project-name="{event.project_name}"]'
            }
        # ... other event types
        
        return {
            key: value for key, value in event.__dict__.items()
            if key != 'correlation_id'
        }
    
    def _create_mock_response(self, correlation_id: str) -> EventResponse:
        from .events import GenericEventResponse
        return GenericEventResponse(
            correlation_id=correlation_id,
            success=True,
            data={'message': 'Event processed successfully'}
        )


# === Custom Exceptions ===

class EventSendError(Exception):
    """Error occurred while sending event"""
    def __init__(self, message: str, event: DomainEvent = None, cause: Exception = None):
        super().__init__(message)
        self.event = event
        self.cause = cause


class WorkflowError(Exception):
    """Error occurred during workflow execution"""
    def __init__(self, message: str, partial_results: Dict[str, Any] = None):
        super().__init__(message)
        self.partial_results = partial_results or {}


# === Convenience Factory Functions ===

def create_async_client(base_url: str, api_key: str, **kwargs) -> EventDrivenWebBuddyClient:
    """Creates async event-driven client"""
    config = ClientConfig(base_url=base_url, api_key=api_key, **kwargs)
    return EventDrivenWebBuddyClient(config)


def create_sync_client(base_url: str, api_key: str, **kwargs) -> SyncEventDrivenWebBuddyClient:
    """Creates synchronous event-driven client"""
    config = ClientConfig(base_url=base_url, api_key=api_key, **kwargs)
    return SyncEventDrivenWebBuddyClient(config)