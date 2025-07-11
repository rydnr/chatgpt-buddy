// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

document.addEventListener('DOMContentLoaded', function () {
  const button = document.getElementById('sendPrompt');
  if (button) {
    button.addEventListener('click', () => {
      const prompt = document.getElementById('prompt').value;
      chrome.runtime.sendMessage({ type: 'sendPrompt', prompt });
    });
  } else {
    console.error("Button with ID 'sendPrompt' not found.");
  }
});
