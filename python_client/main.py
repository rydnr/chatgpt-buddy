import requests
import json
import os

# --- Configuration ---
SERVER_URL = os.getenv('SERVER_URL', 'http://localhost:3000')
CLIENT_SECRET = os.getenv('CLIENT_SECRET', 'your-super-secret-client-key') # This should match the secret in server/src/index.ts

# --- Dispatch Function ---
def dispatch_message(extension_id: str, tab_id: int, action: str, payload: dict, correlation_id: str):
    headers = {
        'Authorization': f'Bearer {CLIENT_SECRET}',
        'Content-Type': 'application/json',
    }

    message = {
        'action': action,
        'payload': payload,
        'correlationId': correlation_id,
    }

    dispatch_payload = {
        'target': {
            'extensionId': extension_id,
            'tabId': tab_id,
        },
        'message': message,
    }

    try:
        print(f"\nAttempting to dispatch {action} message...")
        response = requests.post(f"{SERVER_URL}/api/dispatch", headers=headers, json=dispatch_payload)
        response.raise_for_status()  # Raise an exception for HTTP errors (4xx or 5xx)
        print("Dispatch successful:", response.json())
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error dispatching message: {e}")
        if e.response is not None:
            print("Server response:", e.response.json())
        raise

# --- Example Usage ---
if __name__ == "__main__":
    # Replace with the actual ID of your installed Chrome extension
    EXTENSION_ID = os.getenv('EXTENSION_ID', 'YOUR_EXTENSION_ID')
    # Replace with the ID of the target browser tab
    TARGET_TAB_ID = int(os.getenv('TARGET_TAB_ID', 123))

    if EXTENSION_ID == 'YOUR_EXTENSION_ID':
        print("WARNING: Please set the EXTENSION_ID environment variable or update main.py with your extension ID.")
    if TARGET_TAB_ID == 123:
        print("WARNING: Please set the TARGET_TAB_ID environment variable or update main.py with your target tab ID.")

    try:
        # Example: Select a project
        dispatch_message(
            EXTENSION_ID,
            TARGET_TAB_ID,
            'SELECT_PROJECT',
            {'selector': '#myProjectElement'},
            f'corr-{os.urandom(8).hex()}-proj'
        )

        # Example: Fill a prompt
        dispatch_message(
            EXTENSION_ID,
            TARGET_TAB_ID,
            'FILL_PROMPT',
            {'selector': 'textarea#promptInput', 'value': 'Hello from Python!'},
            f'corr-{os.urandom(8).hex()}-fill'
        )

    except Exception as e:
        print(f"Failed to dispatch messages: {e}")
