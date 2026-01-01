export interface UserResponse {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  birthDate: Date | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  preferredLanguage: string;
  role: 'STUDENT' | 'TUTOR' | 'ADMIN';
  subscriptionType: string;
  subscriptionExpiresAt: Date | null;
  walletBalance: number;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
  isActive: boolean;
}

export interface StudentProfileResponse {
  id: string;
  userId: string;
  educationLevel: string;
  educationDetails?: string; // JSON string containing detailed education info
  schoolName: string | null;
  parentEmail: string | null;
  parentPhone: string | null;
  learningGoals: string | null;
  preferredSubjects: string[];
  budgetPerHour: number | null;
  user?: UserResponse;
}

export interface TutorProfileResponse {
  id: string;
  userId: string;
  bio: string | null;
  experienceYears: number;
  hourlyRate: number;
  subjects: string[];
  educationLevels: string[];
  languages: string[];
  teachingMode: 'IN_PERSON' | 'ONLINE' | 'BOTH';
  serviceRadius: number | null;
  diplomas: Diploma[];
  availability: WeeklySchedule;
  teachingSkillsDetails?: string; // JSON string containing detailed teaching skills
  totalHoursTaught: number;
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  verificationDocuments: string[];
  user?: UserResponse;
}

export interface Diploma {
  name: string;
  institution: string;
  year: number;
  verified: boolean;
}

export interface WeeklySchedule {
  [day: string]: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface EducationLevel {
  level: string;
  system?: string;
  specificLevel?: string;
  stream?: string;
}

export interface ClassResponse {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  educationLevel: EducationLevel;
  subjects: string[]; // Changed from single subject to array
  maxStudents: number | null;
  meetingType: 'IN_PERSON' | 'ONLINE';
  meetingLocation: string | null;
  createdAt: Date;
  isActive: boolean;
  creator: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    role: string;
  };
  members?: ClassMemberResponse[];
  _count?: {
    members: number;
  };
}

export interface ClassMemberResponse {
  id: string;
  classId: string;
  studentId: string;
  joinedAt: Date;
  isActive: boolean;
  student: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    role: string;
  };
}

export interface CreateClassData {
  name: string;
  description?: string;
  educationLevel: EducationLevel;
  subjects: string[]; // Changed from single subject to array
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

// Tutor Search Types
export interface TutorSearchCriteria {
  subject?: string;
  educationLevel?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: TimeSlot[];
  location?: {
    latitude: number;
    longitude: number;
    maxDistance?: number; // in km
  };
  minRating?: number;
  teachingMode?: 'IN_PERSON' | 'ONLINE' | 'BOTH';
  languages?: string[];
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
  teachingMode: 'IN_PERSON' | 'ONLINE' | 'BOTH';
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  matchingScore: number;
  distance?: number;
  availability: WeeklySchedule;
}

// Session Booking Types
export interface CreateSessionData {
  classId: string;
  tutorId?: string;
  consortiumId?: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  location?: string;
  onlineMeetingLink?: string;
  subject: string;
  description?: string;
  price: number;
}

export interface SessionResponse {
  id: string;
  classId: string;
  tutorId: string | null;
  consortiumId: string | null;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart: Date | null;
  actualEnd: Date | null;
  location: string | null;
  onlineMeetingLink: string | null;
  subject: string;
  description: string | null;
  price: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  cancellationReason: string | null;
  createdAt: Date;
  tutor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
    hourlyRate?: number; // For backward compatibility
    tutorProfile?: {
      hourlyRate: number;
    };
  };
  class?: ClassResponse;
}

// Review Types
export interface ReviewResponse {
  id: string;
  sessionId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  reviewer?: UserResponse;
}

// Payment Types
export interface PaymentIntentResponse {
  paymentIntent: {
    id: string;
    clientSecret: string;
    amount: number;
    currency: string;
  };
  transaction: {
    id: string;
    amount: number;
    platformFee: number;
    netAmount: number;
    status: string;
  };
}

export interface WalletBalance {
  totalBalance: number;
  availableBalance: number;
  pendingBalance: number;
}

export interface TransactionResponse {
  id: string;
  sessionId: string | null;
  amount: number;
  platformFee: number;
  netAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  type: 'SESSION_PAYMENT' | 'SUBSCRIPTION' | 'SHOP_PURCHASE' | 'WITHDRAWAL';
  paymentMethod: string;
  createdAt: Date;
  session?: {
    id: string;
    subject: string;
    scheduledStart: Date;
  };
  payer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  payee?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface WithdrawalRequest {
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// Payment Methods Types
export interface MobileMoneyOperator {
  id: string;
  code: string;
  name: string;
  displayName: string;
  provider: 'ORANGE_MONEY' | 'MTN_MOBILE_MONEY' | 'MOOV_MONEY';
  country: string;
  countryName: string;
  currency: string;
  phonePrefix: string;
  phoneFormat: string;
  phoneLength: number;
  color: string;
  logoUrl: string | null;
  isActive: boolean;
  supportedFeatures: {
    withdrawal?: boolean;
    deposit?: boolean;
    transfer?: boolean;
  };
  fees: any;
  limits: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  operatorId: string;
  phoneNumber: string;
  accountName: string;
  accountHolder: string | null;
  isDefault: boolean;
  isVerified: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  operator?: MobileMoneyOperator;
}

export interface CreatePaymentMethodData {
  operatorId: string;
  phoneNumber: string;
  accountName: string;
  accountHolder?: string;
}

// Attendance Types
export interface AttendanceResponse {
  id: string;
  sessionId: string;
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  checkInTime: Date | null;
  checkOutTime: Date | null;
  notes: string | null;
  student?: UserResponse;
}

export interface CheckInData {
  sessionId: string;
  studentId: string;
  method: 'QR' | 'PIN';
  code?: string;
}

// Session Report Types
export interface SessionReportResponse {
  id: string;
  sessionId: string;
  tutorId: string;
  topicsCovered: string | null;
  homeworkAssigned: string | null;
  studentPerformance: { [studentId: string]: Performance };
  notes: string | null;
  createdAt: Date;
  tutor?: UserResponse;
}

export interface Performance {
  participation: number;
  understanding: number;
}

export interface CreateSessionReportData {
  sessionId: string;
  topicsCovered?: string;
  homeworkAssigned?: string;
  studentPerformance: { [studentId: string]: Performance };
  notes?: string;
}

// Progress Tracking Types
export interface AcademicResultResponse {
  id: string;
  studentId: string;
  subject: string;
  examName: string;
  score: number;
  maxScore: number;
  examDate: Date;
  createdAt: Date;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateAcademicResultData {
  subject: string;
  examName: string;
  score: number;
  maxScore: number;
  examDate: Date;
}

export interface ProgressData {
  subject: string;
  results: AcademicResultResponse[];
  averageScore: number;
  improvement: number | null;
  trend: 'improving' | 'declining' | 'stable';
}

export interface ProgressDashboard {
  totalHoursTutored: number;
  upcomingSessions: number;
  progressBySubject: ProgressData[];
  overallImprovement: number | null;
  recentResults: AcademicResultResponse[];
}

export interface ProgressVisualizationData {
  labels: string[];
  scores: number[];
  averages: number[];
}

// Goal Tracking Types
export interface LearningGoal {
  id: string;
  studentId: string;
  subject: string;
  targetScore: number;
  currentScore: number;
  deadline: Date;
  description: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLearningGoalData {
  subject: string;
  targetScore: number;
  deadline: Date;
  description: string;
}

// Notification Types
export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  data: any;
  isRead: boolean;
  createdAt: Date;
}

export interface UnreadNotificationCount {
  count: number;
}

// Suggestion Types
export interface TutorSuggestion {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string | null;
  hourlyRate: number;
  subjects: string[];
  educationLevels: string[];
  averageRating: number;
  totalReviews: number;
  totalHoursTaught: number;
}

export interface AvailableSessionSuggestion {
  id: string;
  classId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  subject: string;
  description: string | null;
  price: number;
  location: string | null;
  class: {
    id: string;
    name: string;
    educationLevel: string;
    subjects: string[];
    meetingLocation: string | null;
    _count: {
      members: number;
    };
  };
}

// Marketplace Types
export interface ShopProductResponse {
  id: string;
  sellerId: string;
  title: string;
  description: string | null;
  productType: 'BOOK' | 'EXAM' | 'FLASHCARDS' | 'VIDEO' | 'OTHER';
  subject: string;
  educationLevel: string;
  price: number;
  fileUrl: string | null;
  previewUrl: string | null;
  downloadsCount: number;
  rating: number;
  isActive: boolean;
  createdAt: Date;
  seller?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export interface CreateProductData {
  title: string;
  description?: string;
  productType: 'BOOK' | 'EXAM' | 'FLASHCARDS' | 'VIDEO' | 'OTHER';
  subject: string;
  educationLevel: string;
  price: number;
  fileUrl?: string;
  previewUrl?: string;
}

export interface UpdateProductData {
  title?: string;
  description?: string;
  price?: number;
  isActive?: boolean;
}

export interface ShopPurchaseResponse {
  id: string;
  productId: string;
  buyerId: string;
  amountPaid: number;
  transactionId: string;
  purchasedAt: Date;
  product?: ShopProductResponse;
}

export interface ProductFilters {
  subject?: string;
  educationLevel?: string;
  productType?: 'BOOK' | 'EXAM' | 'FLASHCARDS' | 'VIDEO' | 'OTHER';
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  search?: string;
}

export interface SellerDashboard {
  totalProducts: number;
  activeProducts: number;
  totalSales: number;
  totalRevenue: number;
  recentSales: ShopPurchaseResponse[];
  topProducts: ShopProductResponse[];
}
