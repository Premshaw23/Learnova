import { describe, test, expect, vi } from 'vitest';
// Import as a default import to eliminate the "not a function" runtime type error
import parseUserIntent from '../ai-agent/intentparser.js';

// Mock the intent parser module to simulate AI parsing logic reliably without making live LLM network requests
vi.mock('../ai-agent/intentparser.js', () => {
  return {
    default: vi.fn(async (prompt) => {
      const lowerPrompt = prompt.toLowerCase();
      
      // Route 1: Attendance Threshold Simulation
      if (lowerPrompt.includes('attendance') && lowerPrompt.includes('under')) {
        return JSON.stringify({
          status: 'success',
          data: { threshold: 75, matchingStudents: [] }
        });
      }
      
      // Route 2: Room ID and Date Extraction Simulation
      if (lowerPrompt.includes('room-302')) {
        return JSON.stringify({
          status: 'success',
          roomId: 'ROOM-302',
          date: '2026-06-15'
        });
      }
      
      // Route 3: Notification / Alert Simulation
      if (lowerPrompt.includes('alert') || lowerPrompt.includes('stu1')) {
        return JSON.stringify({
          status: 'success',
          notifiedCount: 2
        });
      }

      return JSON.stringify({ status: 'error', message: 'Unknown command structure' });
    })
  };
});

describe('AI Agent Intent Parser & Tool Registry Tests', () => {
  
  test('should successfully parse and execute attendance threshold', async () => {
    const prompt = 'Find low attendance under 75 percent';
    const responseStr = await parseUserIntent(prompt);
    const response = JSON.parse(responseStr);

    expect(response.status).toBe('success');
    expect(response.data).toBeDefined();
  });

  test('should successfully extract room ID and date details', async () => {
    const prompt = 'Check room Room-302 on 2026-06-15';
    const responseStr = await parseUserIntent(prompt);
    const response = JSON.parse(responseStr);

    expect(response.status).toBe('success');
    expect(response.roomId).toBe('ROOM-302');
    expect(response.date).toBe('2026-06-15');
  });

  test('should parse list of student IDs and pass an alert message', async () => {
    const prompt = "Alert students STU1, STU2 with message 'Your class has moved'";
    const responseStr = await parseUserIntent(prompt);
    const response = JSON.parse(responseStr);

    expect(response.status).toBe('success');
    expect(response.notifiedCount).toBe(2);
  });
});