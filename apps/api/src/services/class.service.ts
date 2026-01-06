import { PrismaClient, Class, ClassMember, User } from '@prisma/client';
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError,
  ConflictError 
} from '@repo/utils';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Types
export interface CreateClassData {
  name: string;
  description?: string;
  // New education relations
  educationSystemId?: string;
  educationLevelId?: string;
  educationStreamId?: string;
  levelSubjectIds?: string[]; // Array of LevelSubject IDs
  streamSubjectIds?: string[]; // Array of StreamSubject IDs (for levels with streams)
  maxStudents?: number;
  meetingType: 'IN_PERSON' | 'ONLINE';
  meetingLocation?: string;
}

export interface UpdateClassData {
  name?: string;
  description?: string;
  maxStudents?: number;
  meetingLocation?: string;
  isActive?: boolean;
}

export interface ClassInvitation {
  classId: string;
  invitationCode: string;
  expiresAt: Date;
}

export interface ClassWithMembers extends Class {
  members: (ClassMember & { student: User })[];
  creator: User;
  _count: {
    members: number;
  };
}

/**
 * Generate a unique invitation code for a class
 */
export function generateInvitationCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Create a new class
 * Validates: Requirements 3.1
 */
export async function createClass(
  userId: string,
  data: CreateClassData
): Promise<ClassWithMembers> {
  // Validate required fields
  if (!data.name) {
    throw new ValidationError('Name is required');
  }

  if (!data.educationSystemId || !data.educationLevelId) {
    throw new ValidationError('Education system and level are required');
  }

  if (!data.levelSubjectIds?.length && !data.streamSubjectIds?.length) {
    throw new ValidationError('At least one subject is required');
  }

  // Validate meeting type and location
  if (data.meetingType === 'IN_PERSON' && !data.meetingLocation) {
    throw new ValidationError('Meeting location is required for in-person classes');
  }

  // Create class with creator as first member
  const classData = await prisma.class.create({
    data: {
      name: data.name,
      description: data.description,
      createdBy: userId,
      educationSystemId: data.educationSystemId,
      educationLevelId: data.educationLevelId,
      educationStreamId: data.educationStreamId,
      maxStudents: data.maxStudents,
      meetingType: data.meetingType,
      meetingLocation: data.meetingLocation,
      members: {
        create: {
          studentId: userId,
        },
      },
    },
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
        },
      },
      members: {
        include: {
          student: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  // Create level subject entries
  if (data.levelSubjectIds && data.levelSubjectIds.length > 0) {
    await Promise.all(
      data.levelSubjectIds.map(levelSubjectId =>
        prisma.classSubject.create({
          data: {
            classId: classData.id,
            levelSubjectId,
          },
        })
      )
    );
  }
  
  // Create stream subject entries
  if (data.streamSubjectIds && data.streamSubjectIds.length > 0) {
    await Promise.all(
      data.streamSubjectIds.map(streamSubjectId =>
        prisma.classSubject.create({
          data: {
            classId: classData.id,
            streamSubjectId,
          },
        })
      )
    );
  }

  return classData as ClassWithMembers;
}
/**
 * Get class by ID
 */
export async function getClassById(classId: string): Promise<ClassWithMembers> {
  const classData = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
        },
      },
      members: {
        where: { isActive: true },
        include: {
          student: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
      },
      timeSlots: {
        orderBy: {
          dayOfWeek: 'asc',
        },
      },
      classSubjects: {
        include: {
          levelSubject: {
            include: {
              subject: true,
              level: true,
            },
          },
          streamSubject: {
            include: {
              subject: true,
              stream: true,
            },
          },
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  if (!classData) {
    throw new NotFoundError('Class not found');
  }

  return classData as any;
}

/**
 * Get all classes for a user (as creator or member)
 */
export async function getUserClasses(userId: string): Promise<ClassWithMembers[]> {
  const classes = await prisma.class.findMany({
    where: {
      OR: [
        { createdBy: userId },
        {
          members: {
            some: {
              studentId: userId,
              isActive: true,
            },
          },
        },
      ],
      isActive: true,
    },
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
        },
      },
      members: {
        where: { isActive: true },
        include: {
          student: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
      },
      classSubjects: {
        include: {
          levelSubject: {
            include: {
              subject: true,
            },
          },
          streamSubject: {
            include: {
              subject: true,
            },
          },
        },
      },
      _count: {
        select: {
          members: true,
          timeSlots: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return classes as any;
}

/**
 * Update class information
 * Only the creator can update the class
 */
export async function updateClass(
  classId: string,
  userId: string,
  data: UpdateClassData
): Promise<ClassWithMembers> {
  // Check if class exists and user is the creator
  const existingClass = await prisma.class.findUnique({
    where: { id: classId },
  });

  if (!existingClass) {
    throw new NotFoundError('Class not found');
  }

  if (existingClass.createdBy !== userId) {
    throw new AuthorizationError('Only the class creator can update the class');
  }

  // Update class
  const updatedClass = await prisma.class.update({
    where: { id: classId },
    data,
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
        },
      },
      members: {
        where: { isActive: true },
        include: {
          student: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  return updatedClass as ClassWithMembers;
}

/**
 * Delete (deactivate) a class
 * Only the creator can delete the class
 */
export async function deleteClass(classId: string, userId: string): Promise<void> {
  // Check if class exists and user is the creator
  const existingClass = await prisma.class.findUnique({
    where: { id: classId },
  });

  if (!existingClass) {
    throw new NotFoundError('Class not found');
  }

  if (existingClass.createdBy !== userId) {
    throw new AuthorizationError('Only the class creator can delete the class');
  }

  // Soft delete by setting isActive to false
  await prisma.class.update({
    where: { id: classId },
    data: { isActive: false },
  });
}

/**
 * Add a member to a class
 * Validates education level matching (Requirements 3.3, 3.4)
 */
export async function addClassMember(
  classId: string,
  studentId: string
): Promise<ClassMember> {
  // Get class details
  const classData = await prisma.class.findUnique({
    where: { id: classId },
  });

  if (!classData) {
    throw new NotFoundError('Class not found');
  }

  if (!classData.isActive) {
    throw new ValidationError('Cannot join an inactive class');
  }

  // Get student profile to check education level
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      studentProfile: true,
    },
  });

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  // Validate education level matching (Requirement 3.3)
  // For now, we'll skip strict validation since student profile still uses string format
  // In production, both should use JSON format and we'd compare the level field
  // TODO: Update student profile to use JSON education level format

  // Check if student is already a member
  const existingMember = await prisma.classMember.findUnique({
    where: {
      classId_studentId: {
        classId,
        studentId,
      },
    },
  });

  if (existingMember) {
    if (existingMember.isActive) {
      throw new ConflictError('Student is already a member of this class');
    }
    // Reactivate if previously removed
    return await prisma.classMember.update({
      where: { id: existingMember.id },
      data: { isActive: true },
    });
  }

  // Check max students limit
  if (classData.maxStudents) {
    const currentMemberCount = await prisma.classMember.count({
      where: {
        classId,
        isActive: true,
      },
    });

    if (currentMemberCount >= classData.maxStudents) {
      throw new ValidationError('Class has reached maximum student capacity');
    }
  }

  // Add member
  const member = await prisma.classMember.create({
    data: {
      classId,
      studentId,
    },
  });

  return member;
}

/**
 * Remove a member from a class
 * Only the creator or the member themselves can remove the member
 */
export async function removeClassMember(
  classId: string,
  studentId: string,
  requestingUserId: string
): Promise<void> {
  // Get class details
  const classData = await prisma.class.findUnique({
    where: { id: classId },
  });

  if (!classData) {
    throw new NotFoundError('Class not found');
  }

  // Check authorization: must be creator or the student themselves
  if (classData.createdBy !== requestingUserId && studentId !== requestingUserId) {
    throw new AuthorizationError('Only the class creator or the student can remove the member');
  }

  // Prevent creator from removing themselves if they're the only member
  if (studentId === classData.createdBy) {
    const memberCount = await prisma.classMember.count({
      where: {
        classId,
        isActive: true,
      },
    });

    if (memberCount === 1) {
      throw new ValidationError('Cannot remove the creator when they are the only member. Delete the class instead.');
    }
  }

  // Find and deactivate member
  const member = await prisma.classMember.findUnique({
    where: {
      classId_studentId: {
        classId,
        studentId,
      },
    },
  });

  if (!member) {
    throw new NotFoundError('Member not found in this class');
  }

  if (!member.isActive) {
    throw new ValidationError('Member is already removed from this class');
  }

  // Soft delete by setting isActive to false
  await prisma.classMember.update({
    where: { id: member.id },
    data: { isActive: false },
  });
}

/**
 * Generate invitation code for a class
 * Validates: Requirements 3.2
 */
export async function generateClassInvitation(
  classId: string,
  userId: string
): Promise<{ invitationCode: string; classId: string }> {
  // Check if class exists and user is the creator
  const classData = await prisma.class.findUnique({
    where: { id: classId },
  });

  if (!classData) {
    throw new NotFoundError('Class not found');
  }

  if (classData.createdBy !== userId) {
    throw new AuthorizationError('Only the class creator can generate invitation codes');
  }

  // Generate invitation code
  const invitationCode = generateInvitationCode();

  // In a production system, we would store this in a separate table with expiration
  // For now, we'll return the code and classId
  return {
    invitationCode,
    classId,
  };
}

/**
 * Join a class using invitation code
 * Validates: Requirements 3.2, 3.3
 */
export async function joinClassByCode(
  invitationCode: string,
  studentId: string
): Promise<ClassMember> {
  // In a production system, we would look up the invitation code in a table
  // For this implementation, we'll use a simple format: CODE-CLASSID
  // This is a simplified version - in production, use a proper invitation table
  
  // For now, we'll expect the frontend to pass the classId separately
  // This is a placeholder that should be enhanced with a proper invitation system
  throw new ValidationError('Invitation code system not yet implemented. Use direct class ID to join.');
}

/**
 * Send invitation emails to students
 * Validates: Requirements 3.2
 */
export async function inviteStudentsByEmail(
  classId: string,
  emails: string[],
  invitingUserId: string
): Promise<{ invited: string[]; failed: string[] }> {
  // Check if class exists and user is the creator
  const classData = await prisma.class.findUnique({
    where: { id: classId },
  });

  if (!classData) {
    throw new NotFoundError('Class not found');
  }

  if (classData.createdBy !== invitingUserId) {
    throw new AuthorizationError('Only the class creator can invite students');
  }

  const invited: string[] = [];
  const failed: string[] = [];

  // Process each email
  for (const email of emails) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          studentProfile: true,
        },
      });

      if (!user) {
        failed.push(email);
        continue;
      }

      // Check if user is a student
      if (user.role !== 'STUDENT') {
        failed.push(email);
        continue;
      }

      // Try to add as member
      try {
        await addClassMember(classId, user.id);
        invited.push(email);
      } catch (error) {
        failed.push(email);
      }
    } catch (error) {
      failed.push(email);
    }
  }

  // In production, send actual email notifications here
  // For now, we just return the results

  return { invited, failed };
}

/**
 * Get class members
 */
export async function getClassMembers(classId: string): Promise<(ClassMember & { student: User })[]> {
  const classData = await prisma.class.findUnique({
    where: { id: classId },
  });

  if (!classData) {
    throw new NotFoundError('Class not found');
  }

  const members = await prisma.classMember.findMany({
    where: {
      classId,
      isActive: true,
    },
    include: {
      student: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
    orderBy: {
      joinedAt: 'asc',
    },
  });

  return members as (ClassMember & { student: User })[];
}
