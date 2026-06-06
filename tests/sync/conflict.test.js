import { resolveConflict } from '../../lib/conflictResolver';

describe('Conflict Resolution Algorithm', () => {
  it('should prefer the newer timestamp', () => {
    const local = { id: 1, updatedAt: '2026-06-05T12:00:00Z', data: 'A' };
    const remote = { id: 1, updatedAt: '2026-06-05T10:00:00Z', data: 'B' };
    
    const result = resolveConflict(local, remote);
    expect(result.data).toBe('A');
  });

  it('should merge log arrays instead of overwriting', () => {
    const local = { id: 1, updatedAt: '2026-06-05T10:00:00Z', logs: ['scan1'] };
    const remote = { id: 1, updatedAt: '2026-06-05T12:00:00Z', logs: ['scan2'] };
    
    const result = resolveConflict(local, remote);
    expect(result.logs).toContain('scan1');
    expect(result.logs).toContain('scan2');
  });
});

