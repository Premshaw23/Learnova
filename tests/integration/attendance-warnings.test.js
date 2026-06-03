import { describe, it, expect } from 'vitest';
import handler from '../../app/api/attendance-warnings/route'; 

describe('Attendance Warnings API Integration Tests', () => {
  it('should return 400 Bad Request if instituteId is missing', async () => {
    const mockUrl = new URL('http://localhost/api/attendance-warnings?startDate=2026-01-01&endDate=2026-01-31');
    const request = new Request(mockUrl, { method: 'GET' });
    const response = await handler(request);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain('instituteId is required');
  });

  it('should return 400 Bad Request if startDate is after endDate', async () => {
    const mockUrl = new URL('http://localhost/api/attendance-warnings?instituteId=inst_123&startDate=2026-02-01&endDate=2026-01-01');
    const request = new Request(mockUrl, { method: 'GET' });
    const response = await handler(request);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid date range');
  });
});
