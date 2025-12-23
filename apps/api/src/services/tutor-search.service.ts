import { PrismaClient } from '@prisma/client';
import { ValidationError, NotFoundError } from '@repo/utils';

const prisma = new PrismaClient();

// Types
export interface TutorSearchCriteria {
  subject?: string;
  educationLevel?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  maxDistance?: number;
  latitude?: number;
  longitude?: number;
  availability?: {
    day: string;
    start: string;
    end: string;
  };
  languages?: string[];
  teachingMode?: 'IN_PERSON' | 'ONLINE' | 'BOTH';
}

export interface TutorSearchResult {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string | null;
  hourlyRate: number;
  subjects: string[];
  educationLevels: string[];
  languages: string[];
  teachingMode: string;
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  matchingScore: number;
  distance?: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if tutor is available during specified time slot
 */
function checkAvailability(
  tutorAvailability: any,
  requestedDay: string,
  requestedStart: string,
  requestedEnd: string
): boolean {
  if (!tutorAvailability || typeof tutorAvailability !== 'object') {
    return false;
  }

  const daySlots = tutorAvailability[requestedDay.toLowerCase()];
  if (!Array.isArray(daySlots) || daySlots.length === 0) {
    return false;
  }

  // Convert time strings to minutes for easier comparison
  const requestedStartMinutes = timeToMinutes(requestedStart);
  const requestedEndMinutes = timeToMinutes(requestedEnd);

  // Check if any slot covers the requested time
  return daySlots.some((slot: any) => {
    const slotStartMinutes = timeToMinutes(slot.start);
    const slotEndMinutes = timeToMinutes(slot.end);
    
    return (
      slotStartMinutes <= requestedStartMinutes &&
      slotEndMinutes >= requestedEndMinutes
    );
  });
}

function timeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  return hours * 60 + minutes;
}

/**
 * Calculate matching score based on criteria
 * Weights: availability 30%, price 20%, location 15%, language 15%, education level 10%, ratings 10%
 */
function calculateMatchingScore(
  tutor: any,
  criteria: TutorSearchCriteria,
  distance?: number
): number {
  let score = 0;
  let totalWeight = 0;

  // Availability score (30%)
  if (criteria.availability) {
    totalWeight += 30;
    const isAvailable = checkAvailability(
      tutor.availability,
      criteria.availability.day,
      criteria.availability.start,
      criteria.availability.end
    );
    if (isAvailable) {
      score += 30;
    }
  }

  // Price score (20%)
  if (criteria.minPrice !== undefined || criteria.maxPrice !== undefined) {
    totalWeight += 20;
    const tutorRate = Number(tutor.hourlyRate);
    const minPrice = criteria.minPrice || 0;
    const maxPrice = criteria.maxPrice || 1000;
    
    if (tutorRate >= minPrice && tutorRate <= maxPrice) {
      // Score based on how close to minimum price (lower is better)
      const priceRange = maxPrice - minPrice;
      const pricePosition = tutorRate - minPrice;
      const priceScore = priceRange > 0 ? (1 - pricePosition / priceRange) * 20 : 20;
      score += priceScore;
    }
  }

  // Location score (15%)
  if (distance !== undefined && criteria.maxDistance !== undefined) {
    totalWeight += 15;
    if (distance <= criteria.maxDistance) {
      // Score based on proximity (closer is better)
      const locationScore = (1 - distance / criteria.maxDistance) * 15;
      score += locationScore;
    }
  } else if (tutor.teachingMode === 'ONLINE' || tutor.teachingMode === 'BOTH') {
    // Online tutors get full location score
    totalWeight += 15;
    score += 15;
  }

  // Language score (15%)
  if (criteria.languages && criteria.languages.length > 0) {
    totalWeight += 15;
    const matchingLanguages = tutor.languages.filter((lang: string) =>
      criteria.languages!.includes(lang)
    );
    const languageScore = (matchingLanguages.length / criteria.languages.length) * 15;
    score += languageScore;
  }

  // Education level score (10%)
  if (criteria.educationLevel) {
    totalWeight += 10;
    if (tutor.educationLevels.includes(criteria.educationLevel)) {
      score += 10;
    }
  }

  // Rating score (10%)
  totalWeight += 10;
  const ratingScore = (Number(tutor.averageRating) / 5) * 10;
  score += ratingScore;

  // Normalize score to 0-100 range
  return totalWeight > 0 ? (score / totalWeight) * 100 : 0;
}

/**
 * Search for tutors based on criteria
 */
export async function searchTutors(
  criteria: TutorSearchCriteria
): Promise<TutorSearchResult[]> {
  // Build where clause for database query
  const where: any = {
    user: {
      isActive: true,
      role: 'TUTOR',
    },
  };

  // Filter by subject
  if (criteria.subject) {
    where.subjects = {
      has: criteria.subject,
    };
  }

  // Filter by education level
  if (criteria.educationLevel) {
    where.educationLevels = {
      has: criteria.educationLevel,
    };
  }

  // Filter by price range
  if (criteria.minPrice !== undefined || criteria.maxPrice !== undefined) {
    where.hourlyRate = {};
    if (criteria.minPrice !== undefined) {
      where.hourlyRate.gte = criteria.minPrice;
    }
    if (criteria.maxPrice !== undefined) {
      where.hourlyRate.lte = criteria.maxPrice;
    }
  }

  // Filter by minimum rating
  if (criteria.minRating !== undefined) {
    where.averageRating = {
      gte: criteria.minRating,
    };
  }

  // Filter by teaching mode
  if (criteria.teachingMode) {
    where.teachingMode = criteria.teachingMode;
  }

  // Fetch tutors from database
  const tutors = await prisma.tutorProfile.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          city: true,
          country: true,
        },
      },
    },
  });

  // Calculate matching scores and filter results
  const results: TutorSearchResult[] = [];

  for (const tutor of tutors) {
    // Calculate distance if location criteria provided
    let distance: number | undefined;
    if (
      criteria.latitude !== undefined &&
      criteria.longitude !== undefined &&
      tutor.user.city // Simplified: in real app, would need actual coordinates
    ) {
      // For now, we'll skip distance calculation without actual coordinates
      // In production, you'd geocode the tutor's address or store coordinates
      distance = undefined;
    }

    // Filter by distance if specified
    if (criteria.maxDistance !== undefined && distance !== undefined) {
      if (distance > criteria.maxDistance && tutor.teachingMode === 'IN_PERSON') {
        continue; // Skip tutors too far away
      }
    }

    // Filter by language if specified
    if (criteria.languages && criteria.languages.length > 0) {
      const hasMatchingLanguage = tutor.languages.some((lang) =>
        criteria.languages!.includes(lang)
      );
      if (!hasMatchingLanguage) {
        continue; // Skip tutors without matching languages
      }
    }

    // Calculate matching score
    const matchingScore = calculateMatchingScore(tutor, criteria, distance);

    results.push({
      id: tutor.id,
      userId: tutor.userId,
      firstName: tutor.user.firstName,
      lastName: tutor.user.lastName,
      avatarUrl: tutor.user.avatarUrl,
      bio: tutor.bio,
      hourlyRate: Number(tutor.hourlyRate),
      subjects: tutor.subjects,
      educationLevels: tutor.educationLevels,
      languages: tutor.languages,
      teachingMode: tutor.teachingMode,
      averageRating: Number(tutor.averageRating),
      totalReviews: tutor.totalReviews,
      isVerified: tutor.isVerified,
      matchingScore,
      distance,
    });
  }

  // Sort by matching score (descending)
  results.sort((a, b) => b.matchingScore - a.matchingScore);

  return results;
}

/**
 * Get tutor details by ID
 */
export async function getTutorDetails(tutorId: string): Promise<any> {
  const tutor = await prisma.tutorProfile.findUnique({
    where: { id: tutorId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          city: true,
          country: true,
          createdAt: true,
        },
      },
    },
  });

  if (!tutor) {
    throw new NotFoundError('Tutor not found');
  }

  return {
    id: tutor.id,
    userId: tutor.userId,
    firstName: tutor.user.firstName,
    lastName: tutor.user.lastName,
    avatarUrl: tutor.user.avatarUrl,
    bio: tutor.bio,
    experienceYears: tutor.experienceYears,
    hourlyRate: Number(tutor.hourlyRate),
    subjects: tutor.subjects,
    educationLevels: tutor.educationLevels,
    languages: tutor.languages,
    teachingMode: tutor.teachingMode,
    serviceRadius: tutor.serviceRadius,
    diplomas: tutor.diplomas,
    availability: tutor.availability,
    totalHoursTaught: Number(tutor.totalHoursTaught),
    averageRating: Number(tutor.averageRating),
    totalReviews: tutor.totalReviews,
    isVerified: tutor.isVerified,
    city: tutor.user.city,
    country: tutor.user.country,
    memberSince: tutor.user.createdAt,
  };
}

/**
 * Get tutor details by user ID
 */
export async function getTutorDetailsByUserId(userId: string): Promise<any> {
  const tutor = await prisma.tutorProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          city: true,
          country: true,
          createdAt: true,
        },
      },
    },
  });

  if (!tutor) {
    throw new NotFoundError('Tutor not found');
  }

  return {
    id: tutor.id,
    userId: tutor.userId,
    firstName: tutor.user.firstName,
    lastName: tutor.user.lastName,
    avatarUrl: tutor.user.avatarUrl,
    bio: tutor.bio,
    experienceYears: tutor.experienceYears,
    hourlyRate: Number(tutor.hourlyRate),
    subjects: tutor.subjects,
    educationLevels: tutor.educationLevels,
    languages: tutor.languages,
    teachingMode: tutor.teachingMode,
    serviceRadius: tutor.serviceRadius,
    diplomas: tutor.diplomas,
    availability: tutor.availability,
    totalHoursTaught: Number(tutor.totalHoursTaught),
    averageRating: Number(tutor.averageRating),
    totalReviews: tutor.totalReviews,
    isVerified: tutor.isVerified,
    city: tutor.user.city,
    country: tutor.user.country,
    memberSince: tutor.user.createdAt,
  };
}
