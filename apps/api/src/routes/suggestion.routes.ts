import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getTutorSuggestionsForStudent, getSessionSuggestionsForTutor } from '../services/suggestion.service';
import { logger } from '@repo/utils';

const router = Router();

/**
 * GET /tutors/suggestions/:sessionId
 * Get tutor suggestions for a specific unassigned session
 */
router.get('/tutors/suggestions/:sessionId', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const suggestions = await getTutorSuggestionsForStudent(userId);
    
    // Filter suggestions for the specific session
    const sessionSuggestion = suggestions.find(s => s.session.id === sessionId);
    
    if (!sessionSuggestion) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Return only the tutors, limited by the query param
    const tutors = sessionSuggestion.suggestedTutors.slice(0, limit);

    res.json({
      success: true,
      data: tutors,
    });
  } catch (error) {
    logger.error('Failed to get tutor suggestions:', error);
    // Return empty array instead of error to prevent dashboard cascade failures
    res.json({
      success: true,
      data: [],
    });
  }
});

/**
 * GET /sessions/available-suggestions
 * Get session suggestions for a tutor based on their profile
 */
router.get('/sessions/available-suggestions', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    const suggestions = await getSessionSuggestionsForTutor(userId);
    
    // Transform to match the expected format
    const formattedSuggestions = suggestions.slice(0, limit).map(s => ({
      id: s.session.id,
      classId: s.class.id,
      scheduledStart: s.session.scheduledStart,
      scheduledEnd: s.session.scheduledEnd,
      subject: s.session.subject,
      description: null,
      price: s.potentialEarnings,
      location: s.session.location,
      class: {
        id: s.class.id,
        name: s.class.name,
        educationLevel: s.class.educationLevel,
        subjects: s.class.subjects,
        meetingLocation: s.class.meetingLocation,
        _count: {
          members: s.class.studentCount,
        },
      },
    }));

    res.json({
      success: true,
      data: formattedSuggestions,
    });
  } catch (error) {
    logger.error('Failed to get session suggestions:', error);
    // Return empty array instead of error to prevent dashboard cascade failures
    res.json({
      success: true,
      data: [],
    });
  }
});

export default router;
