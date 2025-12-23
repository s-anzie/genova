import {
  createClass,
  getClassById,
  getUserClasses,
  updateClass,
  deleteClass,
  addClassMember,
  removeClassMember,
  inviteStudentsByEmail,
  getClassMembers,
  CreateClassData,
} from '../class.service';
import { register } from '../auth.service';
import { createStudentProfile } from '../profile.service';
import { cleanDatabase, disconnectDatabase } from '../../test-setup';
import { Role } from '@prisma/client';

describe('Class Service', () => {
  let studentUser1Id: string;
  let studentUser2Id: string;
  let studentUser3Id: string;

  beforeEach(async () => {
    await cleanDatabase();

    // Create test users
    const user1 = await register({
      email: 'student1@example.com',
      password: 'password123',
      firstName: 'Student',
      lastName: 'One',
      role: Role.STUDENT,
    });
    studentUser1Id = user1.user.id;

    const user2 = await register({
      email: 'student2@example.com',
      password: 'password123',
      firstName: 'Student',
      lastName: 'Two',
      role: Role.STUDENT,
    });
    studentUser2Id = user2.user.id;

    const user3 = await register({
      email: 'student3@example.com',
      password: 'password123',
      firstName: 'Student',
      lastName: 'Three',
      role: Role.STUDENT,
    });
    studentUser3Id = user3.user.id;

    // Create student profiles with education levels
    await createStudentProfile({
      userId: studentUser1Id,
      educationLevel: 'high_school',
      preferredSubjects: ['mathematics', 'physics'],
    });

    await createStudentProfile({
      userId: studentUser2Id,
      educationLevel: 'high_school',
      preferredSubjects: ['mathematics'],
    });

    await createStudentProfile({
      userId: studentUser3Id,
      educationLevel: 'university',
      preferredSubjects: ['computer_science'],
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('Class Creation', () => {
    it('should create a class with valid data', async () => {
      const classData: CreateClassData = {
        name: 'Math Study Group',
        description: 'Advanced mathematics study group',
        educationLevel: 'high_school',
        subject: 'mathematics',
        meetingType: 'ONLINE',
      };

      const result = await createClass(studentUser1Id, classData);

      expect(result).toBeDefined();
      expect(result.name).toBe('Math Study Group');
      expect(result.educationLevel).toBe('high_school');
      expect(result.subject).toBe('mathematics');
      expect(result.createdBy).toBe(studentUser1Id);
      expect(result.isActive).toBe(true);
      expect(result.members).toHaveLength(1);
      expect(result.members[0].studentId).toBe(studentUser1Id);
    });

    it('should create an in-person class with location', async () => {
      const classData: CreateClassData = {
        name: 'Physics Lab',
        educationLevel: 'high_school',
        subject: 'physics',
        meetingType: 'IN_PERSON',
        meetingLocation: 'Room 101, Science Building',
      };

      const result = await createClass(studentUser1Id, classData);

      expect(result.meetingType).toBe('IN_PERSON');
      expect(result.meetingLocation).toBe('Room 101, Science Building');
    });

    it('should reject class creation without required fields', async () => {
      const classData: any = {
        name: 'Incomplete Class',
      };

      await expect(createClass(studentUser1Id, classData)).rejects.toThrow(
        'Name, education level, and subject are required'
      );
    });

    it('should reject in-person class without location', async () => {
      const classData: CreateClassData = {
        name: 'Physics Lab',
        educationLevel: 'high_school',
        subject: 'physics',
        meetingType: 'IN_PERSON',
      };

      await expect(createClass(studentUser1Id, classData)).rejects.toThrow(
        'Meeting location is required for in-person classes'
      );
    });
  });

  describe('Class Retrieval', () => {
    let testClass: any;

    beforeEach(async () => {
      testClass = await createClass(studentUser1Id, {
        name: 'Test Class',
        educationLevel: 'high_school',
        subject: 'mathematics',
        meetingType: 'ONLINE',
      });
    });

    it('should get class by ID', async () => {
      const result = await getClassById(testClass.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(testClass.id);
      expect(result.name).toBe('Test Class');
    });

    it('should throw error for non-existent class', async () => {
      await expect(getClassById('non-existent-id')).rejects.toThrow('Class not found');
    });

    it('should get all classes for a user', async () => {
      // Create another class
      await createClass(studentUser1Id, {
        name: 'Second Class',
        educationLevel: 'high_school',
        subject: 'physics',
        meetingType: 'ONLINE',
      });

      const classes = await getUserClasses(studentUser1Id);

      expect(classes).toHaveLength(2);
      expect(classes[0].createdBy).toBe(studentUser1Id);
    });
  });

  describe('Class Updates', () => {
    let testClass: any;

    beforeEach(async () => {
      testClass = await createClass(studentUser1Id, {
        name: 'Original Name',
        educationLevel: 'high_school',
        subject: 'mathematics',
        meetingType: 'ONLINE',
      });
    });

    it('should update class information', async () => {
      const result = await updateClass(testClass.id, studentUser1Id, {
        name: 'Updated Name',
        description: 'New description',
      });

      expect(result.name).toBe('Updated Name');
      expect(result.description).toBe('New description');
    });

    it('should reject update by non-creator', async () => {
      await expect(
        updateClass(testClass.id, studentUser2Id, {
          name: 'Unauthorized Update',
        })
      ).rejects.toThrow('Only the class creator can update the class');
    });

    it('should delete class', async () => {
      await deleteClass(testClass.id, studentUser1Id);

      const result = await getClassById(testClass.id);
      expect(result.isActive).toBe(false);
    });

    it('should reject delete by non-creator', async () => {
      await expect(deleteClass(testClass.id, studentUser2Id)).rejects.toThrow(
        'Only the class creator can delete the class'
      );
    });
  });

  describe('Class Membership', () => {
    let testClass: any;

    beforeEach(async () => {
      testClass = await createClass(studentUser1Id, {
        name: 'Test Class',
        educationLevel: 'high_school',
        subject: 'mathematics',
        meetingType: 'ONLINE',
      });
    });

    it('should add member with matching education level', async () => {
      const member = await addClassMember(testClass.id, studentUser2Id);

      expect(member).toBeDefined();
      expect(member.classId).toBe(testClass.id);
      expect(member.studentId).toBe(studentUser2Id);
      expect(member.isActive).toBe(true);
    });

    it('should reject member with different education level', async () => {
      await expect(addClassMember(testClass.id, studentUser3Id)).rejects.toThrow(
        'Student education level (university) does not match class education level (high_school)'
      );
    });

    it('should reject duplicate member', async () => {
      await addClassMember(testClass.id, studentUser2Id);

      await expect(addClassMember(testClass.id, studentUser2Id)).rejects.toThrow(
        'Student is already a member of this class'
      );
    });

    it('should get all class members', async () => {
      await addClassMember(testClass.id, studentUser2Id);

      const members = await getClassMembers(testClass.id);

      expect(members).toHaveLength(2);
      expect(members.some((m) => m.studentId === studentUser1Id)).toBe(true);
      expect(members.some((m) => m.studentId === studentUser2Id)).toBe(true);
    });

    it('should remove member from class', async () => {
      await addClassMember(testClass.id, studentUser2Id);
      await removeClassMember(testClass.id, studentUser2Id, studentUser1Id);

      const members = await getClassMembers(testClass.id);
      expect(members).toHaveLength(1);
      expect(members[0].studentId).toBe(studentUser1Id);
    });

    it('should allow member to remove themselves', async () => {
      await addClassMember(testClass.id, studentUser2Id);
      await removeClassMember(testClass.id, studentUser2Id, studentUser2Id);

      const members = await getClassMembers(testClass.id);
      expect(members).toHaveLength(1);
    });

    it('should reject removal by unauthorized user', async () => {
      await addClassMember(testClass.id, studentUser2Id);

      await expect(
        removeClassMember(testClass.id, studentUser2Id, studentUser3Id)
      ).rejects.toThrow('Only the class creator or the student can remove the member');
    });

    it('should prevent creator from removing themselves when they are the only member', async () => {
      await expect(
        removeClassMember(testClass.id, studentUser1Id, studentUser1Id)
      ).rejects.toThrow('Cannot remove the creator when they are the only member');
    });
  });

  describe('Class Invitations', () => {
    let testClass: any;

    beforeEach(async () => {
      testClass = await createClass(studentUser1Id, {
        name: 'Test Class',
        educationLevel: 'high_school',
        subject: 'mathematics',
        meetingType: 'ONLINE',
      });
    });

    it('should invite students by email', async () => {
      const result = await inviteStudentsByEmail(
        testClass.id,
        ['student2@example.com'],
        studentUser1Id
      );

      expect(result.invited).toContain('student2@example.com');
      expect(result.failed).toHaveLength(0);

      const members = await getClassMembers(testClass.id);
      expect(members).toHaveLength(2);
    });

    it('should handle mixed valid and invalid emails', async () => {
      const result = await inviteStudentsByEmail(
        testClass.id,
        ['student2@example.com', 'nonexistent@example.com', 'student3@example.com'],
        studentUser1Id
      );

      expect(result.invited).toContain('student2@example.com');
      expect(result.failed).toContain('nonexistent@example.com');
      expect(result.failed).toContain('student3@example.com'); // Different education level
    });

    it('should reject invitation by non-creator', async () => {
      await expect(
        inviteStudentsByEmail(testClass.id, ['student2@example.com'], studentUser2Id)
      ).rejects.toThrow('Only the class creator can invite students');
    });
  });

  describe('Class Capacity', () => {
    it('should enforce max students limit', async () => {
      const testClass = await createClass(studentUser1Id, {
        name: 'Limited Class',
        educationLevel: 'high_school',
        subject: 'mathematics',
        meetingType: 'ONLINE',
        maxStudents: 2,
      });

      await addClassMember(testClass.id, studentUser2Id);

      await expect(addClassMember(testClass.id, studentUser3Id)).rejects.toThrow(
        'Class has reached maximum student capacity'
      );
    });
  });

  describe('Multiple Class Membership', () => {
    it('should allow student to join multiple classes', async () => {
      const class1 = await createClass(studentUser1Id, {
        name: 'Math Class',
        educationLevel: 'high_school',
        subject: 'mathematics',
        meetingType: 'ONLINE',
      });

      const class2 = await createClass(studentUser1Id, {
        name: 'Physics Class',
        educationLevel: 'high_school',
        subject: 'physics',
        meetingType: 'ONLINE',
      });

      await addClassMember(class1.id, studentUser2Id);
      await addClassMember(class2.id, studentUser2Id);

      const classes = await getUserClasses(studentUser2Id);
      expect(classes).toHaveLength(2);
    });
  });
});
