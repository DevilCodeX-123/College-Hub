import axios from 'axios';
import { Club, Challenge, Project, User } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Add auth header to requests
const getAuthDetails = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { 'x-auth-token': token } } : {};
};

export const api = {
    // Auth
    register: async (userData: any) => {
        const response = await axios.post(`${API_URL}/auth/register`, userData);
        return response.data;
    },
    login: async (credentials: any) => {
        const response = await axios.post(`${API_URL}/auth/login`, credentials);
        return response.data;
    },
    getActiveColleges: async () => {
        const response = await axios.get<string[]>(`${API_URL}/auth/colleges`);
        return response.data;
    },
    createCollegeAdmin: async (adminData: any) => {
        const response = await axios.post(`${API_URL}/auth/admin`, adminData);
        return response.data;
    },
    forgotPassword: async (email: string) => {
        const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
        return response.data;
    },
    changePassword: async (data: any) => {
        const response = await axios.post(`${API_URL}/auth/change-password`, data, getAuthDetails());
        return response.data;
    },

    // Clubs
    getClubs: async (college?: string, requestingUserId?: string) => {
        const response = await axios.get<Club[]>(`${API_URL}/clubs`, { params: { college, requestingUserId }, ...getAuthDetails() });
        return response.data;
    },
    getClub: async (id: string, requestingUserId?: string) => {
        const response = await axios.get<Club>(`${API_URL}/clubs/${id}`, { params: { requestingUserId } });
        return response.data;
    },
    getClubByCoordinator: async (userId: string, requestingUserId?: string) => {
        const response = await axios.get<Club>(`${API_URL}/clubs/coordinator/${userId}`, {
            params: { requestingUserId }
        });
        return response.data;
    },
    createClub: async (clubData: Partial<Club>) => {
        const response = await axios.post<Club>(`${API_URL}/clubs`, clubData);
        return response.data;
    },
    updateClub: async (id: string, clubData: any) => {
        const response = await axios.put(`${API_URL}/clubs/${id}`, clubData, getAuthDetails());
        return response.data;
    },
    deleteClub: async (id: string) => {
        const response = await axios.delete(`${API_URL}/clubs/${id}`, getAuthDetails());
        return response.data;
    },
    joinClub: async (id: string, userId: string) => {
        const response = await axios.post(`${API_URL}/clubs/${id}/join`, { userId });
        return response.data;
    },
    requestJoinClub: async (id: string, userId: string, name: string, email: string) => {
        const response = await axios.post(`${API_URL}/clubs/${id}/request-join`, { userId, name, email });
        return response.data;
    },
    approveJoinRequest: async (clubId: string, requestId: string) => {
        const response = await axios.post(`${API_URL}/clubs/${clubId}/approve-join/${requestId}`, {}, getAuthDetails());
        return response.data;
    },
    rejectJoinRequest: async (clubId: string, requestId: string) => {
        const response = await axios.post(`${API_URL}/clubs/${clubId}/reject-join/${requestId}`, {}, getAuthDetails());
        return response.data;
    },
    removeMemberFromClub: async (clubId: string, userId: string) => {
        const response = await axios.post(`${API_URL}/clubs/${clubId}/remove-member`, { userId }, getAuthDetails());
        return response.data;
    },
    suggestChallenge: async (clubId: string, suggestion: any) => {
        const response = await axios.post(`${API_URL}/clubs/${clubId}/suggest-challenge`, suggestion);
        return response.data;
    },
    approveChallengeSuggestion: async (clubId: string, suggestionId: string) => {
        const response = await axios.post(`${API_URL}/clubs/${clubId}/approve-challenge/${suggestionId}`);
        return response.data;
    },
    rejectChallengeSuggestion: async (clubId: string, suggestionId: string) => {
        const response = await axios.post(`${API_URL}/clubs/${clubId}/reject-challenge/${suggestionId}`);
        return response.data;
    },
    addClubHistory: async (clubId: string, historyData: any) => {
        const response = await axios.post(`${API_URL}/clubs/${clubId}/history`, historyData, getAuthDetails());
        return response.data;
    },
    deleteClubHistory: async (clubId: string, itemId: string) => {
        const response = await axios.delete(`${API_URL}/clubs/${clubId}/history/${itemId}`, getAuthDetails());
        return response.data;
    },
    addClubAchievement: async (clubId: string, achievementData: any) => {
        const response = await axios.post(`${API_URL}/clubs/${clubId}/achievements`, achievementData, getAuthDetails());
        return response.data;
    },
    deleteClubAchievement: async (clubId: string, itemId: string) => {
        const response = await axios.delete(`${API_URL}/clubs/${clubId}/achievements/${itemId}`, getAuthDetails());
        return response.data;
    },
    updateClubCoreTeam: async (clubId: string, memberData: { userId: string, role: string, customTitle: string, requestingUserId?: string }) => {
        const response = await axios.post(`${API_URL}/clubs/${clubId}/core-team`, memberData, getAuthDetails());
        return response.data;
    },
    removeCoreTeamMember: async (clubId: string, userId: string) => {
        const response = await axios.delete(`${API_URL}/clubs/${clubId}/core-team/${userId}`, getAuthDetails());
        return response.data;
    },

    // Challenges
    getChallenges: async (college?: string, clubId?: string, requestingUserId?: string) => {
        const response = await axios.get<Challenge[]>(`${API_URL}/challenges`, {
            params: { college, clubId, requestingUserId },
            ...getAuthDetails()
        });
        return response.data;
    },
    createChallenge: async (challengeData: Partial<Challenge>) => {
        const response = await axios.post<Challenge>(`${API_URL}/challenges`, challengeData, getAuthDetails());
        return response.data;
    },
    updateChallenge: async (id: string, challengeData: Partial<Challenge>) => {
        const response = await axios.put<Challenge>(`${API_URL}/challenges/${id}`, challengeData, getAuthDetails());
        return response.data;
    },
    deleteChallenge: async (id: string) => {
        const response = await axios.delete(`${API_URL}/challenges/${id}`, getAuthDetails());
        return response.data;
    },
    gradeChallengeSubmission: async (challengeId: string, submissionId: string, gradeData: any) => {
        const response = await axios.post(`${API_URL}/challenges/${challengeId}/grade/${submissionId}`, gradeData, getAuthDetails());
        return response.data;
    },

    // Events
    getEvents: (college?: string) => axios.get(`${API_URL}/events`, { params: { college } }).then(res => res.data),
    createEvent: (eventData: any) => axios.post(`${API_URL}/events`, eventData).then(res => res.data),
    updateEvent: (eventId: string, data: any) => axios.put(`${API_URL}/events/${eventId}`, data).then(res => res.data),
    registerEvent: (eventId: string, data: any) => axios.post(`${API_URL}/events/${eventId}/register`, data).then(res => res.data),
    completeEvent: (eventId: string, data: any) => axios.post(`${API_URL}/events/${eventId}/complete`, data).then(res => res.data),

    // Projects
    getProjects: async (college?: string, clubId?: string, userId?: string, requestingUserId?: string) => {
        const response = await axios.get<Project[]>(`${API_URL}/projects`, {
            params: { college, clubId, userId, requestingUserId },
            ...getAuthDetails()
        });
        return response.data;
    },
    getProject: async (id: string, requestingUserId?: string) => {
        const response = await axios.get<Project>(`${API_URL}/projects/${id}`, { params: { requestingUserId } });
        return response.data;
    },
    createProject: async (projectData: Partial<Project>) => {
        const response = await axios.post<Project>(`${API_URL}/projects`, projectData, getAuthDetails());
    },
    joinProjectByCode: async (userId: string, joinCode: string) => {
        const response = await axios.post(`${API_URL}/projects/join-by-code`, { userId, joinCode }, getAuthDetails());
        return response.data;
    },
    exitProject: async (projectId: string, userId: string) => {
        const response = await axios.post(`${API_URL}/projects/${projectId}/exit`, { userId }, getAuthDetails());
        return response.data;
    },
    notifyProjectTeam: async (projectId: string, notificationData: { title?: string, message: string, senderId: string, type?: string }) => {
        const response = await axios.post(`${API_URL}/projects/${projectId}/notify`, notificationData, getAuthDetails());
        return response.data;
    },
    approveProject: async (projectId: string) => {
        const response = await axios.post(`${API_URL}/projects/${projectId}/approve`, {}, getAuthDetails());
        return response.data;
    },
    rejectProject: async (projectId: string) => {
        const response = await axios.post(`${API_URL}/projects/${projectId}/reject`, {}, getAuthDetails());
        return response.data;
    },
    onHoldProject: async (projectId: string) => {
        const response = await axios.post(`${API_URL}/projects/${projectId}/on-hold`, {}, getAuthDetails());
        return response.data;
    },
    resumeProject: async (projectId: string) => {
        const response = await axios.post(`${API_URL}/projects/${projectId}/resume`, {}, getAuthDetails());
        return response.data;
    },
    deleteProject: async (projectId: string) => {
        const response = await axios.delete(`${API_URL}/projects/${projectId}`, getAuthDetails());
        return response.data;
    },

    // Users
    getUsers: async (college?: string, requestingUserId?: string) => {
        const response = await axios.get<User[]>(`${API_URL}/users`, { params: { college, requestingUserId }, ...getAuthDetails() });
        return response.data;
    },
    getProfile: async (id: string, requestingUserId?: string) => {
        const response = await axios.get<User>(`${API_URL}/users/${id}`, { params: { requestingUserId } });
        return response.data;
    },
    updateUser: async (id: string, userData: Partial<User>) => {
        const response = await axios.put<User>(`${API_URL}/users/${id}`, userData, getAuthDetails());
        return response.data;
    },
    updateUserRole: async (id: string, data: { role: string, clubId?: string, requestingUserId?: string }) => {
        const response = await axios.put(`${API_URL}/users/${id}`, data, getAuthDetails());
        return response.data;
    },
    awardUserBadge: async (id: string, badge: any) => {
        const response = await axios.post(`${API_URL}/users/${id}/award-badge`, badge, getAuthDetails());
        return response.data;
    },
    awardUserSkill: async (id: string, skill: string) => {
        const response = await axios.post(`${API_URL}/users/${id}/add-skill`, { skill }, getAuthDetails());
        return response.data;
    },

    // Chat
    getMessages: async (clubId: string) => {
        const response = await axios.get(`${API_URL}/chat/${clubId}`, getAuthDetails());
        return response.data;
    },
    sendMessage: async (clubId: string, content: string, senderId: string) => {
        const response = await axios.post(`${API_URL}/chat/${clubId}`, { content, senderId }, getAuthDetails());
        return response.data;
    },
    getProjectMessages: async (projectId: string) => {
        const response = await axios.get(`${API_URL}/chat/project/${projectId}`, getAuthDetails());
        return response.data;
    },
    sendProjectMessage: async (projectId: string, content: string, senderId: string) => {
        const response = await axios.post(`${API_URL}/chat/project/${projectId}`, { content, senderId }, getAuthDetails());
        return response.data;
    },
    getLatestProjectMessageTimestamp: async (userId: string) => {
        const response = await axios.get(`${API_URL}/chat/projects/latest-timestamp/${userId}`, getAuthDetails());
        return response.data;
    },

    // Leaderboard
    getLeaderboard: async (college?: string, requestingUserId?: string) => {
        const response = await axios.get(`${API_URL}/leaderboard/college`, { params: { college, requestingUserId }, ...getAuthDetails() });
        return response.data;
    },
    getChallengeLeaderboard: async (challengeId: string) => {
        const response = await axios.get(`${API_URL}/leaderboard/challenge/${challengeId}`, getAuthDetails());
        return response.data;
    },
    getClubLeaderboard: async (college?: string, requestingUserId?: string) => {
        const response = await axios.get(`${API_URL}/leaderboard/clubs`, { params: { college, requestingUserId }, ...getAuthDetails() });
        return response.data;
    },

    // Notifications
    getNotifications: async (userId: string, role: string) => {
        const response = await axios.get(`${API_URL}/notifications`, { params: { userId, role }, ...getAuthDetails() });
        return response.data;
    },
    sendNotification: async (data: any) => {
        const response = await axios.post(`${API_URL}/notifications`, data, getAuthDetails());
        return response.data;
    },
    markNotificationRead: async (id: string, userId: string) => {
        const response = await axios.put(`${API_URL}/notifications/${id}/read`, { userId }, getAuthDetails());
        return response.data;
    },

    // Polls
    getPolls: async (userId?: string, role?: string, email?: string, clubId?: string, college?: string, status?: string) => {
        const response = await axios.get(`${API_URL}/polls`, { params: { userId, role, email, clubId, college, status }, ...getAuthDetails() });
        return response.data;
    },
    createPoll: async (pollData: any) => {
        const response = await axios.post(`${API_URL}/polls`, pollData, getAuthDetails());
        return response.data;
    },
    votePoll: async (pollId: string, voteData: { userId: string, optionIndex: number }) => {
        const response = await axios.post(`${API_URL}/polls/${pollId}/vote`, voteData, getAuthDetails());
        return response.data;
    },
    updatePollStatus: async (pollId: string, status: 'active' | 'closed') => {
        const response = await axios.patch(`${API_URL}/polls/${pollId}/status`, { status }, getAuthDetails());
        return response.data;
    },
    extendPoll: async (pollId: string, hours: number) => {
        const response = await axios.patch(`${API_URL}/polls/${pollId}/extend`, { hours }, getAuthDetails());
        return response.data;
    },

    // Engagements & Timeline
    joinChallenge: async (id: string, userId: string) => {
        const response = await axios.post(`${API_URL}/challenges/${id}/join`, { userId }, getAuthDetails());
        return response.data;
    },
    joinChallengeByCode: async (userId: string, code: string) => {
        const response = await axios.post(`${API_URL}/challenges/join-by-code`, { userId, code }, getAuthDetails());
        return response.data;
    },
    submitChallenge: async (challengeId: string, userId: string, submissionLink: string, phaseId?: string) => {
        const response = await axios.post(`${API_URL}/challenges/${challengeId}/submit`, { userId, submissionLink, phaseId }, getAuthDetails());
        return response.data;
    },
    attendEvent: async (id: string, userId: string) => {
        const response = await axios.post(`${API_URL}/events/${id}/attend`, { userId }, getAuthDetails());
        return response.data;
    },

    // Tasks & Rewards
    getTasks: async (params?: { userId?: string, email?: string, joinedClubs?: string, status?: string, requestingUserId?: string }) => {
        const response = await axios.get(`${API_URL}/tasks`, { params, ...getAuthDetails() });
        return response.data;
    },
    deleteTask: async (id: string) => {
        const response = await axios.delete(`${API_URL}/tasks/${id}`, getAuthDetails());
        return response.data;
    },
    createTask: async (taskData: any) => {
        const response = await axios.post(`${API_URL}/tasks`, taskData, getAuthDetails());
        return response.data;
    },
    submitTask: async (submissionData: any) => {
        const response = await axios.post(`${API_URL}/tasks/submit`, submissionData, getAuthDetails());
        return response.data;
    },
    getTaskSubmissions: async (params?: { clubId?: string, taskId?: string }) => {
        const response = await axios.get(`${API_URL}/tasks/submissions`, { params, ...getAuthDetails() });
        return response.data;
    },
    reviewTaskSubmission: async (id: string, reviewData: any) => {
        const response = await axios.post(`${API_URL}/tasks/submissions/${id}/review`, reviewData, getAuthDetails());
        return response.data;
    },

    // Missing methods for Challenges
    getMyChallengeTeam: async (challengeId: string, userId: string) => {
        const response = await axios.get(`${API_URL}/challenges/${challengeId}/team/${userId}`, getAuthDetails());
        return response.data;
    },
    createChallengeTeam: async (challengeId: string, userId: string, name: string) => {
        const response = await axios.post(`${API_URL}/challenges/${challengeId}/create-team`, { userId, teamName: name }, getAuthDetails());
        return response.data;
    },
    joinChallengeTeam: async (userId: string, code: string) => {
        const response = await axios.post(`${API_URL}/challenges/join-team`, { userId, code }, getAuthDetails());
        return response.data;
    },
    removeTeamMember: async (teamId: string, memberId: string, userId: string) => {
        const response = await axios.post(`${API_URL}/challenges/team/${teamId}/remove-member`, { memberId, userId }, getAuthDetails());
        return response.data;
    },
    getChallengeParticipants: async (clubId: string) => {
        const response = await axios.get(`${API_URL}/challenges/club/${clubId}/participants`, getAuthDetails());
        return response.data;
    },
    verifyChallengeCompletion: async (userId: string, challengeId: string) => {
        const response = await axios.post(`${API_URL}/challenges/${challengeId}/verify/${userId}`, {}, getAuthDetails());
        return response.data;
    },


    // Missing methods for Users
    updateUserStatus: async (id: string, blocked: { website: boolean }) => {
        const response = await axios.put(`${API_URL}/users/${id}/status`, blocked, getAuthDetails());
        return response.data;
    },

    // Missing methods for Projects
    completeProject: async (id: string) => {
        const response = await axios.post(`${API_URL}/projects/${id}/complete`, {}, getAuthDetails());
        return response.data;
    },

    // Notes & Papers
    getNotes: async (college: string) => {
        const response = await axios.get(`${API_URL}/notes`, { params: { college }, ...getAuthDetails() });
        return response.data;
    },
    getPublicNotes: async (college: string) => {
        const response = await axios.get(`${API_URL}/notes/public`, { params: { college }, ...getAuthDetails() });
        return response.data;
    },
    createNote: async (noteData: any) => {
        const response = await axios.post(`${API_URL}/notes`, noteData, getAuthDetails());
        return response.data;
    },
    updateNote: async (id: string, noteData: any) => {
        const response = await axios.put(`${API_URL}/notes/${id}`, noteData, getAuthDetails());
        return response.data;
    },
    deleteNote: async (id: string) => {
        const response = await axios.delete(`${API_URL}/notes/${id}`, getAuthDetails());
        return response.data;
    },

    // Campus Locations
    getLocations: async (college: string) => {
        const response = await axios.get(`${API_URL}/locations`, { params: { college }, ...getAuthDetails() });
        return response.data;
    },
    createLocation: async (locationData: any) => {
        const response = await axios.post(`${API_URL}/locations`, locationData, getAuthDetails());
        return response.data;
    },
    deleteLocation: async (id: string) => {
        const response = await axios.delete(`${API_URL}/locations/${id}`, getAuthDetails());
        return response.data;
    },
};
