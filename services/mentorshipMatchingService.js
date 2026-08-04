/**
 * mentorshipMatchingService.js
 * 
 * Service responsible for the Peer-to-Peer Mentorship Matching Algorithm.
 * Pairs current students with alumni or advanced students based on shared interests,
 * timezone compatibility, and specific course overlap for 1-on-1 mentorship.
 */

export class MentorshipMatchingService {
  /**
   * Matches a learner with the best available mentor based on specific criteria.
   * @param {string} learnerId - The ID of the student seeking mentorship.
   * @param {Object} preferences - The learner's preferences (interests, course, timezone).
   * @returns {Promise<Object>} The matched mentor profile and match score.
   */
  async findBestMatch(learnerId, preferences) {
    try {
      console.log(`Initiating mentorship matching for learner: ${learnerId}`);
      
      const { timezone, courseId, interests = [] } = preferences;

      // Stub: Simulate database lookup and algorithm processing time
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Mock database of potential mentors
      const availableMentors = [
        { mentorId: 'm1', name: 'Alice Smith', timezone: 'UTC-5', expertise: ['React', 'Node'], courses: ['CS101'] },
        { mentorId: 'm2', name: 'Bob Jones', timezone: 'UTC+1', expertise: ['Python', 'AI'], courses: ['CS102'] },
        { mentorId: 'm3', name: 'Charlie Lee', timezone: 'UTC-5', expertise: ['React', 'CSS'], courses: ['CS101'] },
      ];

      // Extremely simplified scoring algorithm
      let bestMatch = null;
      let highestScore = -1;

      for (const mentor of availableMentors) {
        let score = 0;
        
        if (mentor.timezone === timezone) score += 50;
        if (mentor.courses.includes(courseId)) score += 30;
        
        const sharedInterests = mentor.expertise.filter(exp => interests.includes(exp));
        score += (sharedInterests.length * 10);

        if (score > highestScore) {
          highestScore = score;
          bestMatch = mentor;
        }
      }

      if (!bestMatch) {
        throw new Error('No suitable mentor found at this time.');
      }

      const matchData = {
        learnerId,
        mentorId: bestMatch.mentorId,
        mentorName: bestMatch.name,
        matchScore: highestScore,
        status: 'pending_mentor_approval',
        createdAt: new Date().toISOString()
      };

      console.log(`Matched learner ${learnerId} with mentor ${bestMatch.mentorId} (Score: ${highestScore})`);
      
      return matchData;
    } catch (error) {
      console.error('Error finding mentor match:', error);
      throw error;
    }
  }

  /**
   * Registers a user as an available mentor.
   * @param {string} userId - The ID of the user volunteering to mentor.
   * @param {Object} mentorProfile - The mentor's expertise and availability.
   * @returns {Promise<boolean>} True if registration is successful.
   */
  async registerMentor(userId, mentorProfile) {
    // Stub: Save mentor profile to database
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log(`Registered user ${userId} as an available mentor.`);
    return true;
  }
}

export default new MentorshipMatchingService();
