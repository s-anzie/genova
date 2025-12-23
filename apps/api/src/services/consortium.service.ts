import { PrismaClient, Consortium, ConsortiumMember, User } from '@prisma/client';
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError,
  ConflictError 
} from '@repo/utils';

const prisma = new PrismaClient();

// Types
export interface CreateConsortiumData {
  name: string;
  description?: string;
  revenueDistributionPolicy: RevenueDistributionPolicy;
}

export interface UpdateConsortiumData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface RevenueDistributionPolicy {
  type: 'equal' | 'proportional' | 'custom';
  customShares?: { [tutorId: string]: number }; // Percentage
}

export interface ConsortiumWithMembers extends Consortium {
  members: (ConsortiumMember & { tutor: User })[];
  creator: User;
  _count: {
    members: number;
  };
}

/**
 * Validate revenue distribution policy
 * Ensures shares sum to 100% for custom policies
 */
function validateRevenuePolicy(policy: RevenueDistributionPolicy, memberCount: number): void {
  if (policy.type === 'custom') {
    if (!policy.customShares) {
      throw new ValidationError('Custom shares must be provided for custom revenue distribution');
    }

    const shares = Object.values(policy.customShares);
    if (shares.length !== memberCount) {
      throw new ValidationError('Custom shares must be provided for all members');
    }

    const totalShare = shares.reduce((sum, share) => sum + share, 0);
    // Allow small floating point differences
    if (Math.abs(totalShare - 100) > 0.01) {
      throw new ValidationError(`Revenue shares must sum to 100%, got ${totalShare}%`);
    }

    // Validate each share is positive
    shares.forEach(share => {
      if (share <= 0 || share > 100) {
        throw new ValidationError('Each revenue share must be between 0 and 100%');
      }
    });
  }
}

/**
 * Calculate revenue shares based on policy
 * Validates: Requirements 5.3, 5.4
 */
export function calculateRevenueShares(
  policy: RevenueDistributionPolicy,
  memberIds: string[]
): { [tutorId: string]: number } {
  const shares: { [tutorId: string]: number } = {};

  switch (policy.type) {
    case 'equal':
      // Equal distribution among all members
      const equalShare = 100 / memberIds.length;
      memberIds.forEach(id => {
        shares[id] = equalShare;
      });
      break;

    case 'proportional':
      // For now, proportional is same as equal
      // In production, this could be based on hours worked, seniority, etc.
      const propShare = 100 / memberIds.length;
      memberIds.forEach(id => {
        shares[id] = propShare;
      });
      break;

    case 'custom':
      if (!policy.customShares) {
        throw new ValidationError('Custom shares must be provided');
      }
      // Use provided custom shares
      memberIds.forEach(id => {
        if (policy.customShares![id] === undefined) {
          throw new ValidationError(`Revenue share not specified for tutor ${id}`);
        }
        shares[id] = policy.customShares![id];
      });
      break;

    default:
      throw new ValidationError('Invalid revenue distribution policy type');
  }

  return shares;
}

/**
 * Create a new consortium
 * Validates: Requirements 5.1
 */
export async function createConsortium(
  userId: string,
  data: CreateConsortiumData
): Promise<ConsortiumWithMembers> {
  // Validate required fields
  if (!data.name) {
    throw new ValidationError('Consortium name is required');
  }

  // Verify user is a tutor
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tutorProfile: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.role !== 'TUTOR' || !user.tutorProfile) {
    throw new ValidationError('Only tutors can create consortiums');
  }

  // For initial creation with one member, validate policy
  const initialShares = calculateRevenueShares(data.revenueDistributionPolicy, [userId]);
  
  // Create consortium with creator as first member (coordinator)
  const consortium = await prisma.consortium.create({
    data: {
      name: data.name,
      description: data.description,
      createdBy: userId,
      revenueDistributionPolicy: data.revenueDistributionPolicy as any,
      members: {
        create: {
          tutorId: userId,
          role: 'COORDINATOR',
          revenueShare: initialShares[userId] || 100,
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
          tutor: {
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

  return consortium as ConsortiumWithMembers;
}

/**
 * Get consortium by ID
 */
export async function getConsortiumById(consortiumId: string): Promise<ConsortiumWithMembers> {
  const consortium = await prisma.consortium.findUnique({
    where: { id: consortiumId },
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
          tutor: {
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

  if (!consortium) {
    throw new NotFoundError('Consortium not found');
  }

  return consortium as ConsortiumWithMembers;
}

/**
 * Get all consortiums for a tutor (as creator or member)
 */
export async function getTutorConsortiums(userId: string): Promise<ConsortiumWithMembers[]> {
  const consortiums = await prisma.consortium.findMany({
    where: {
      OR: [
        { createdBy: userId },
        {
          members: {
            some: {
              tutorId: userId,
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
        include: {
          tutor: {
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
    orderBy: {
      createdAt: 'desc',
    },
  });

  return consortiums as ConsortiumWithMembers[];
}

/**
 * Update consortium information
 * Only the coordinator can update the consortium
 */
export async function updateConsortium(
  consortiumId: string,
  userId: string,
  data: UpdateConsortiumData
): Promise<ConsortiumWithMembers> {
  // Check if consortium exists and user is the creator
  const existingConsortium = await prisma.consortium.findUnique({
    where: { id: consortiumId },
  });

  if (!existingConsortium) {
    throw new NotFoundError('Consortium not found');
  }

  if (existingConsortium.createdBy !== userId) {
    throw new AuthorizationError('Only the consortium coordinator can update the consortium');
  }

  // Update consortium
  const updatedConsortium = await prisma.consortium.update({
    where: { id: consortiumId },
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
        include: {
          tutor: {
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

  return updatedConsortium as ConsortiumWithMembers;
}

/**
 * Delete (deactivate) a consortium
 * Only the coordinator can delete the consortium
 */
export async function deleteConsortium(consortiumId: string, userId: string): Promise<void> {
  // Check if consortium exists and user is the creator
  const existingConsortium = await prisma.consortium.findUnique({
    where: { id: consortiumId },
  });

  if (!existingConsortium) {
    throw new NotFoundError('Consortium not found');
  }

  if (existingConsortium.createdBy !== userId) {
    throw new AuthorizationError('Only the consortium coordinator can delete the consortium');
  }

  // Soft delete by setting isActive to false
  await prisma.consortium.update({
    where: { id: consortiumId },
    data: { isActive: false },
  });
}

/**
 * Add a member to a consortium
 * Validates: Requirements 5.2, 5.3
 */
export async function addConsortiumMember(
  consortiumId: string,
  tutorId: string,
  invitingUserId: string
): Promise<ConsortiumMember> {
  // Get consortium details
  const consortium = await prisma.consortium.findUnique({
    where: { id: consortiumId },
    include: {
      members: true,
    },
  });

  if (!consortium) {
    throw new NotFoundError('Consortium not found');
  }

  if (!consortium.isActive) {
    throw new ValidationError('Cannot join an inactive consortium');
  }

  // Only coordinator can add members
  if (consortium.createdBy !== invitingUserId) {
    throw new AuthorizationError('Only the consortium coordinator can add members');
  }

  // Verify the new member is a tutor
  const tutor = await prisma.user.findUnique({
    where: { id: tutorId },
    include: { tutorProfile: true },
  });

  if (!tutor) {
    throw new NotFoundError('Tutor not found');
  }

  if (tutor.role !== 'TUTOR' || !tutor.tutorProfile) {
    throw new ValidationError('Only tutors can join consortiums');
  }

  // Check if tutor is already a member
  const existingMember = await prisma.consortiumMember.findUnique({
    where: {
      consortiumId_tutorId: {
        consortiumId,
        tutorId,
      },
    },
  });

  if (existingMember) {
    throw new ConflictError('Tutor is already a member of this consortium');
  }

  // Get all current member IDs including the new one
  const currentMemberIds = consortium.members.map(m => m.tutorId);
  const allMemberIds = [...currentMemberIds, tutorId];

  // Recalculate revenue shares for all members
  const policy = consortium.revenueDistributionPolicy as unknown as RevenueDistributionPolicy;
  const newShares = calculateRevenueShares(policy, allMemberIds);

  // Validate the new distribution
  validateRevenuePolicy(policy, allMemberIds.length);

  // Update all existing members' shares and add new member in a transaction
  await prisma.$transaction(async (tx) => {
    // Update existing members' shares
    for (const memberId of currentMemberIds) {
      await tx.consortiumMember.updateMany({
        where: {
          consortiumId,
          tutorId: memberId,
        },
        data: {
          revenueShare: newShares[memberId] || 0,
        },
      });
    }

    // Add new member
    await tx.consortiumMember.create({
      data: {
        consortiumId,
        tutorId,
        role: 'MEMBER',
        revenueShare: newShares[tutorId] || 0,
      },
    });
  });

  // Fetch and return the new member
  const newMember = await prisma.consortiumMember.findUnique({
    where: {
      consortiumId_tutorId: {
        consortiumId,
        tutorId,
      },
    },
  });

  return newMember!;
}

/**
 * Remove a member from a consortium
 * Only the coordinator can remove members
 */
export async function removeConsortiumMember(
  consortiumId: string,
  tutorId: string,
  requestingUserId: string
): Promise<void> {
  // Get consortium details
  const consortium = await prisma.consortium.findUnique({
    where: { id: consortiumId },
    include: {
      members: true,
    },
  });

  if (!consortium) {
    throw new NotFoundError('Consortium not found');
  }

  // Check authorization: must be coordinator
  if (consortium.createdBy !== requestingUserId) {
    throw new AuthorizationError('Only the consortium coordinator can remove members');
  }

  // Prevent coordinator from removing themselves if they're the only member
  if (tutorId === consortium.createdBy && consortium.members.length === 1) {
    throw new ValidationError('Cannot remove the coordinator when they are the only member. Delete the consortium instead.');
  }

  // Find member
  const member = await prisma.consortiumMember.findUnique({
    where: {
      consortiumId_tutorId: {
        consortiumId,
        tutorId,
      },
    },
  });

  if (!member) {
    throw new NotFoundError('Member not found in this consortium');
  }

  // Get remaining member IDs
  const remainingMemberIds = consortium.members
    .filter(m => m.tutorId !== tutorId)
    .map(m => m.tutorId);

  // Recalculate revenue shares for remaining members
  const policy = consortium.revenueDistributionPolicy as unknown as RevenueDistributionPolicy;
  const newShares = calculateRevenueShares(policy, remainingMemberIds);

  // Remove member and update shares in a transaction
  await prisma.$transaction(async (tx) => {
    // Remove the member
    await tx.consortiumMember.delete({
      where: {
        consortiumId_tutorId: {
          consortiumId,
          tutorId,
        },
      },
    });

    // Update remaining members' shares
    for (const memberId of remainingMemberIds) {
      await tx.consortiumMember.updateMany({
        where: {
          consortiumId,
          tutorId: memberId,
        },
        data: {
          revenueShare: newShares[memberId] || 0,
        },
      });
    }
  });
}

/**
 * Update revenue distribution policy
 * Validates: Requirements 5.4, 5.5
 */
export async function updateRevenuePolicy(
  consortiumId: string,
  userId: string,
  newPolicy: RevenueDistributionPolicy
): Promise<ConsortiumWithMembers> {
  // Check if consortium exists and user is the coordinator
  const consortium = await prisma.consortium.findUnique({
    where: { id: consortiumId },
    include: {
      members: true,
    },
  });

  if (!consortium) {
    throw new NotFoundError('Consortium not found');
  }

  if (consortium.createdBy !== userId) {
    throw new AuthorizationError('Only the consortium coordinator can update the revenue policy');
  }

  // Get all member IDs
  const memberIds = consortium.members.map(m => m.tutorId);

  // Calculate new shares
  const newShares = calculateRevenueShares(newPolicy, memberIds);

  // Validate the new policy
  validateRevenuePolicy(newPolicy, memberIds.length);

  // Update policy and all member shares in a transaction
  await prisma.$transaction(async (tx) => {
    // Update the policy
    await tx.consortium.update({
      where: { id: consortiumId },
      data: {
        revenueDistributionPolicy: newPolicy as any,
      },
    });

    // Update all members' shares
    for (const memberId of memberIds) {
      await tx.consortiumMember.updateMany({
        where: {
          consortiumId,
          tutorId: memberId,
        },
        data: {
          revenueShare: newShares[memberId],
        },
      });
    }
  });

  // In production, send notifications to all members here
  // Validates: Requirements 5.5

  // Fetch and return updated consortium
  return await getConsortiumById(consortiumId);
}

/**
 * Invite tutors to consortium by email
 * Validates: Requirements 5.2
 */
export async function inviteTutorsByEmail(
  consortiumId: string,
  emails: string[],
  invitingUserId: string
): Promise<{ invited: string[]; failed: string[] }> {
  // Check if consortium exists and user is the coordinator
  const consortium = await prisma.consortium.findUnique({
    where: { id: consortiumId },
  });

  if (!consortium) {
    throw new NotFoundError('Consortium not found');
  }

  if (consortium.createdBy !== invitingUserId) {
    throw new AuthorizationError('Only the consortium coordinator can invite tutors');
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
          tutorProfile: true,
        },
      });

      if (!user) {
        failed.push(email);
        continue;
      }

      // Check if user is a tutor
      if (user.role !== 'TUTOR' || !user.tutorProfile) {
        failed.push(email);
        continue;
      }

      // Try to add as member
      try {
        await addConsortiumMember(consortiumId, user.id, invitingUserId);
        invited.push(email);
      } catch (error) {
        failed.push(email);
      }
    } catch (error) {
      failed.push(email);
    }
  }

  // In production, send actual email notifications here

  return { invited, failed };
}

/**
 * Get consortium members
 */
export async function getConsortiumMembers(
  consortiumId: string
): Promise<(ConsortiumMember & { tutor: User })[]> {
  const consortium = await prisma.consortium.findUnique({
    where: { id: consortiumId },
  });

  if (!consortium) {
    throw new NotFoundError('Consortium not found');
  }

  const members = await prisma.consortiumMember.findMany({
    where: {
      consortiumId,
    },
    include: {
      tutor: {
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

  return members as (ConsortiumMember & { tutor: User })[];
}
