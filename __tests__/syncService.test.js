import { resolveConflict } from "../lib/syncService";

describe('Version Vectoring & Conflict Resolution Engine', () => {

  describe('resolveConflict()', () => {
    
    it('should return local record if no remote record exists', () => {
      const localRecord = { id: 'A001', status: 'Present', timestamp: '2026-06-06T10:00:00Z' };
      const remoteRecord = null;

      const result = resolveConflict(localRecord, remoteRecord);
      
      expect(result).toEqual(localRecord);
    });

    it('should overwrite remote record if local record is newer (LWW)', () => {
      const remoteRecord = { 
        id: 'A002', 
        status: 'Absent', 
        timestamp: '2026-06-06T09:00:00Z',
        instituteId: 'INST_123'
      };
      
      const localRecord = { 
        id: 'A002', 
        status: 'Present', 
        timestamp: '2026-06-06T10:30:00Z' // 1.5 hours newer
      };

      const result = resolveConflict(localRecord, remoteRecord);
      
      // Should prefer local status
      expect(result.status).toBe('Present');
      // Deep merge should retain remote metadata not present in local
      expect(result.instituteId).toBe('INST_123');
      // Should update timestamp to signify resolution
      expect(result).toHaveProperty('updatedAt');
    });

    it('should discard local record if remote record is newer', () => {
      const remoteRecord = { 
        id: 'A003', 
        status: 'Late', 
        timestamp: '2026-06-06T11:00:00Z' // Newer
      };
      
      const localRecord = { 
        id: 'A003', 
        status: 'Absent', 
        timestamp: '2026-06-06T08:00:00Z' // Stale offline cache
      };

      const result = resolveConflict(localRecord, remoteRecord);
      
      // Should completely ignore the stale local record
      expect(result).toEqual(remoteRecord);
      expect(result.status).toBe('Late');
    });

    it('should handle epoch numeric timestamps seamlessly', () => {
      const remoteRecord = { id: 'A004', status: 'Present', timestamp: 1717670000000 }; // Older
      const localRecord = { id: 'A004', status: 'Absent', timestamp: 1717675000000 };  // Newer

      const result = resolveConflict(localRecord, remoteRecord);
      
      expect(result.status).toBe('Absent');
    });

    it('should fallback safely if timestamps are missing', () => {
      const remoteRecord = { id: 'A005', status: 'Present' }; // No timestamp
      const localRecord = { id: 'A005', status: 'Absent' };   // No timestamp

      const result = resolveConflict(localRecord, remoteRecord);
      
      // Because neither has a timestamp, localTime and remoteTime evaluate to 0
      // 0 is not > 0, so it defaults to keeping the remote record (safe fallback)
      expect(result).toEqual(remoteRecord);
    });

  });

});