export type UserRole = 'owner' | 'student' | 'club_member' | 'club_coordinator' | 'club_co_coordinator' | 'club_head' | 'core_member' | 'admin' | 'co_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  college: string;
  points: number;
  totalEarnedXP: number;
  weeklyXP: number;
  level: number;
  badges: Badge[];
  joinedClubs: string[];
  blocked?: {
    website: boolean;
    clubs: boolean;
    challenges: boolean;
  };
  customTitle?: string;
  primaryGoal?: string;
  secondaryGoal?: string;
  skills?: string[];
  activity?: {
    type: 'challenge' | 'project' | 'event' | 'club';
    refId: string;
    title: string;
    status?: string;
    timestamp: string | Date;
  }[];
  branch?: string;
  year?: string;
  _id?: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  challengeName?: string;
  clubName?: string;
  earnedAt: Date;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  logo: string;
  banner?: string;
  coverImage?: string;
  memberCount: number;
  category: string;
  college: string;
  coordinator: string;
  coordinatorId?: string;
  socialLinks: {
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
  coreTeam: CoreMember[];
  pendingMembers?: { userId: string; name: string; email: string; }[];
  joiningDeadline?: Date | string;
  challengeSuggestions?: {
    id: string;
    title: string;
    description: string;
    points: number;
    difficulty: string;
    status: 'pending' | 'approved' | 'rejected';
  }[];
  achievements: Achievement[];
  history?: {
    type: 'event' | 'challenge';
    title: string;
    date: Date | string;
    description: string;
    link?: string;
  }[];
}

export interface CoreMember {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  role: string;
  customTitle?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

export interface ChallengePhase {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  deadline: Date | string;
  points: number;
}

export interface ChallengeSubmission {
  id?: string;
  _id?: string;
  userId: string;
  challengeId: string;
  phaseId?: string;
  link: string;
  status: 'pending' | 'approved' | 'rejected';
  marks?: number;
  feedback?: string;
  submittedAt: Date | string;
}

export interface Challenge {
  id: string;
  _id?: string;
  title: string;
  description: string;
  clubId: string;
  clubName: string;
  points: number;
  entryFee: number;
  difficulty: 'easy' | 'medium' | 'hard';
  deadline: Date;
  participants: number;
  status: 'active' | 'completed' | 'upcoming';
  category: string;
  isTeamChallenge?: boolean;
  phases?: ChallengePhase[];
  submissions?: ChallengeSubmission[];
  prizes?: string;
  minTeamSize?: number;
  maxTeamSize?: number;
  joinCode?: string;
}

export interface Project {
  id: string;
  _id?: string;
  title: string;
  description: string;
  type: string;
  teamName?: string;
  memberLimit: number;
  problemStatement: string;
  idea: string;
  requestedBy: string;
  joinCode?: string;
  clubId: string;
  clubName: string;
  progress: number;
  team: string[];
  deadline: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'rejected';
  joinRequests?: {
    _id: string;
    user: string | { id: string; _id: string; name: string };
    reason: string;
    skills: string;
    experiences: string;
    comments: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
  }[];
  timeGoals?: {
    id: string;
    _id: string;
    title: string;
    description: string;
    deadline: string;
    status: 'pending' | 'submitted' | 'approved' | 'rejected';
    assignedType: 'all' | 'specific';
    assignees: string[];
    submissionLink?: string;
    submissionTitle?: string;
    submissionDescription?: string;
    submissionKey?: string;
    completedAt?: string;
  }[];
  resources?: {
    title: string;
    description: string;
    url: string;
    addedBy: string;
    addedByName: string;
    addedAt: string;
  }[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  points: number;
  totalXP?: number;
  college?: string;
  club?: string;
}

export interface Leaderboard {
  id: string;
  title: string;
  type: 'college' | 'club' | 'custom';
  visibility: 'public' | 'members' | 'core_team';
  entries: LeaderboardEntry[];
  isSystemGenerated: boolean;
  createdBy?: string;
}

export interface DailyTask {
  id: string;
  title: string;
  points: number;
  completed: boolean;
  icon: string;
}

export interface Event {
  id: string;
  _id?: string;
  title: string;
  date: Date | string;
  clubId: string;
  clubName: string;
  type?: 'workshop' | 'competition' | 'meetup' | 'hackathon';
  category?: string;
  description?: string;
  coverImage?: string;
  location?: string;
  duration?: string;
  time?: string;
  organizingClub?: string;
  isCompleted?: boolean;
  xpReward?: number;
  stopRegistration?: boolean;
  paymentQRCode?: string;
  paymentAmountIndividual?: number;
  paymentAmountTeam?: number;
  programs?: string[];
  registrations?: {
    userId: string;
    name: string;
    email: string;
    registrationType: 'individual' | 'team';
    program?: string;
    teamMembers?: { name: string; email: string }[];
    paymentProofUrl?: string;
    transactionId?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
  }[];
  winners?: {
    userId: string;
    name: string;
    competition: string;
    rank: number;
    score: number;
  }[];
}

export interface Note {
  _id: string;
  title: string;
  link: string;
  description: string;
  isPublic: boolean;
  college: string;
  uploadedBy: string | User;
  createdAt: Date;
}

export interface CampusLocation {
  _id: string;
  name: string;
  googleMapsLink: string;
  college: string;
  category: string;
  description: string;
  status: 'active' | 'busy' | 'full';
  occupancy: string;
  uploadedBy: string | User;
  createdAt: Date;
}

export interface TeamChatMessage {
  id: string;
  _id?: string;
  teamId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date | string;
}

