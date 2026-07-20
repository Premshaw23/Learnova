import { describe, it, expect } from 'vitest';
import {
  calculateEngagementScore,
  normalizeEngagementWeights,
  getEngagementCategory,
  getEngagementTrend,
  DEFAULT_ENGAGEMENT_WEIGHTS,
} from '../../lib/engagementScore';

describe('Engagement Scoring Module', () => {
  describe('normalizeEngagementWeights', () => {
    it('should use default weights if empty weights are provided', () => {
      const normalized = normalizeEngagementWeights({});
      expect(normalized).toEqual(DEFAULT_ENGAGEMENT_WEIGHTS);
    });

    it('should scale weights to sum to 1', () => {
      const normalized = normalizeEngagementWeights({
        attendance: 2,
        activity: 2,
        assignment: 2,
        academic: 2,
      });
      expect(normalized.attendance).toBe(0.25);
      expect(normalized.activity).toBe(0.25);
      expect(normalized.assignment).toBe(0.25);
      expect(normalized.academic).toBe(0.25);
    });
  });

  describe('calculateEngagementScore', () => {
    it('should correctly blend scores based on weights', () => {
      const scorePayload = {
        attendanceScore: 80,
        activityScore: 90,
        assignmentScore: 70,
        academicScore: 85,
      };
      const result = calculateEngagementScore(scorePayload, {
        attendance: 0.25,
        activity: 0.25,
        assignment: 0.25,
        academic: 0.25,
      });

      expect(result.overallScore).toBe(81.25);
    });
  });

  describe('getEngagementCategory', () => {
    it('should categorize scores properly', () => {
      expect(getEngagementCategory(95)).toBe('Excellent');
      expect(getEngagementCategory(80)).toBe('Good');
      expect(getEngagementCategory(65)).toBe('Moderate');
      expect(getEngagementCategory(40)).toBe('Needs Attention');
    });
  });

  describe('getEngagementTrend', () => {
    it('should return stable if no history is provided', () => {
      const trend = getEngagementTrend([]);
      expect(trend.trend).toBe('stable');
      expect(trend.change).toBe(0);
    });

    it('should detect improving trends', () => {
      const history = [
        { overallScore: 70, calculatedAt: '2026-06-01' },
        { overallScore: 80, calculatedAt: '2026-06-02' },
      ];
      const trend = getEngagementTrend(history);
      expect(trend.trend).toBe('improving');
      expect(trend.change).toBe(10);
    });

    it('should detect declining trends', () => {
      const history = [
        { overallScore: 80, calculatedAt: '2026-06-01' },
        { overallScore: 70, calculatedAt: '2026-06-02' },
      ];
      const trend = getEngagementTrend(history);
      expect(trend.trend).toBe('declining');
      expect(trend.change).toBe(-10);
    });
  });
});
