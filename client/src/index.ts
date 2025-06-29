import axios from 'axios';
import { AgentMessage } from '../shared/types';

const SERVER_URL = 'http://localhost:3000';
const CLIENT_SECRET = 'your-super-secret-client-key'; // This should match the secret in server/src/index.ts

async function dispatchMessage(extensionId: string, tabId: number, message: AgentMessage) {
  try {
    const response = await axios.post(
      `${SERVER_URL}/api/dispatch`,
      {
        target: {
          extensionId,
          tabId,
        },
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${CLIENT_SECRET}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Dispatch successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error dispatching message:', error.response?.data || error.message);
    throw error;
  }
}

// --- Example Usage ---
async function main() {
  const EXTENSION_ID = 'YOUR_EXTENSION_ID'; // Replace with the actual ID of your installed extension
  const TARGET_TAB_ID = 123; // Replace with the ID of the target browser tab

  // Example: Select a project
  const selectProjectMessage: AgentMessage = {
    action: 'SELECT_PROJECT',
    payload: {
      selector: '#myProjectElement',
    },
    correlationId: `corr-${Date.now()}-proj`,
  };

  try {
    console.log('\nAttempting to dispatch SELECT_PROJECT message...');
    await dispatchMessage(EXTENSION_ID, TARGET_TAB_ID, selectProjectMessage);

    // Example: Fill a prompt
    const fillPromptMessage: AgentMessage = {
      action: 'FILL_PROMPT',
      payload: {
        selector: 'textarea#promptInput',
        value: 'Hello, ChatGPT buddy!',
      },
      correlationId: `corr-${Date.now()}-fill`,
    };

    console.log('\nAttempting to dispatch FILL_PROMPT message...');
    await dispatchMessage(EXTENSION_ID, TARGET_TAB_ID, fillPromptMessage);

  } catch (error) {
    console.error('Failed to dispatch messages.', error);
  }
}

main();
