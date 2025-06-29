/*
                        Google-Buddy

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
*/

import { GoogleBuddyClient } from './client';
import { GoogleMessages } from './messages';
import { WebBuddyClient } from '@web-buddy/core';

// Mock WebBuddyClient
const mockWebBuddyClient = {
  sendMessage: jest.fn()
} as unknown as WebBuddyClient;

describe('GoogleBuddyClient', () => {
  let client: GoogleBuddyClient;
  
  beforeEach(() => {
    client = new GoogleBuddyClient(mockWebBuddyClient);
    (mockWebBuddyClient.sendMessage as jest.Mock).mockClear();
  });
  
  describe('enterSearchTerm', () => {
    it('should send ENTER_SEARCH_TERM message', async () => {
      // Arrange
      const mockResponse = { success: true };
      (mockWebBuddyClient.sendMessage as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const result = await client.enterSearchTerm('TypeScript');
      
      // Assert
      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        {
          [GoogleMessages.ENTER_SEARCH_TERM]: { searchTerm: 'TypeScript' }
        },
        {}
      );
      expect(result).toEqual(mockResponse);
    });
    
    it('should include tabId when provided', async () => {
      // Arrange
      const mockResponse = { success: true };
      (mockWebBuddyClient.sendMessage as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      await client.enterSearchTerm('TypeScript', { tabId: 123 });
      
      // Assert
      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        {
          [GoogleMessages.ENTER_SEARCH_TERM]: { searchTerm: 'TypeScript' }
        },
        { tabId: 123 }
      );
    });
  });
  
  describe('getSearchResults', () => {
    it('should return results array', async () => {
      // Arrange
      const mockResults = [
        { title: 'Result 1', url: 'http://example1.com', description: 'Description 1' },
        { title: 'Result 2', url: 'http://example2.com', description: 'Description 2' }
      ];
      (mockWebBuddyClient.sendMessage as jest.Mock).mockResolvedValue({ results: mockResults });
      
      // Act
      const results = await client.getSearchResults();
      
      // Assert
      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        {
          [GoogleMessages.GET_SEARCH_RESULTS]: {}
        },
        {}
      );
      expect(results).toEqual(mockResults);
    });
    
    it('should return empty array when no results', async () => {
      // Arrange
      (mockWebBuddyClient.sendMessage as jest.Mock).mockResolvedValue({});
      
      // Act
      const results = await client.getSearchResults();
      
      // Assert
      expect(results).toEqual([]);
    });
  });
  
  describe('search', () => {
    it('should perform complete search flow', async () => {
      // Arrange
      const mockResults = [
        { title: 'Result 1', url: 'http://example1.com', description: 'Description 1' }
      ];
      (mockWebBuddyClient.sendMessage as jest.Mock)
        .mockResolvedValueOnce({ success: true }) // enterSearchTerm
        .mockResolvedValueOnce({ results: mockResults }); // getSearchResults
      
      // Act
      const results = await client.search('TypeScript');
      
      // Assert
      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledTimes(2);
      expect(results).toEqual(mockResults);
    });
  });
  
  describe('batchSearch', () => {
    it('should perform multiple searches in parallel by default', async () => {
      // Arrange
      const terms = ['TypeScript', 'JavaScript'];
      const mockResults1 = [{ title: 'TS Result', url: 'http://ts.com', description: 'TS Desc' }];
      const mockResults2 = [{ title: 'JS Result', url: 'http://js.com', description: 'JS Desc' }];
      
      // Mock the sendMessage calls for each search operation
      (mockWebBuddyClient.sendMessage as jest.Mock)
        .mockImplementation((message) => {
          if (message[GoogleMessages.ENTER_SEARCH_TERM]) {
            return Promise.resolve({ success: true });
          }
          if (message[GoogleMessages.GET_SEARCH_RESULTS]) {
            // Return different results based on call order
            const callCount = (mockWebBuddyClient.sendMessage as jest.Mock).mock.calls.length;
            if (callCount <= 2) {
              return Promise.resolve({ results: mockResults1 });
            } else {
              return Promise.resolve({ results: mockResults2 });
            }
          }
          return Promise.resolve({});
        });
      
      // Act
      const results = await client.batchSearch(terms);
      
      // Assert
      expect(results).toHaveLength(2);
      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledTimes(4); // 2 searches * 2 calls each
    });
  });
  
  describe('searchWithFilter', () => {
    it('should filter search results', async () => {
      // Arrange
      const mockResults = [
        { title: 'TypeScript Result', url: 'http://ts.com', description: 'TS Desc' },
        { title: 'JavaScript Result', url: 'http://js.com', description: 'JS Desc' }
      ];
      (mockWebBuddyClient.sendMessage as jest.Mock)
        .mockResolvedValueOnce({ success: true }) // enterSearchTerm
        .mockResolvedValueOnce({ results: mockResults }); // getSearchResults
      
      const filter = (result: any) => result.title.includes('TypeScript');
      
      // Act
      const results = await client.searchWithFilter('programming', filter);
      
      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('TypeScript Result');
    });
  });
});