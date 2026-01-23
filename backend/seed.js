const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Club = require('./models/Club');
const Challenge = require('./models/Challenge');
const Project = require('./models/Project');
const User = require('./models/User');
const Event = require('./models/Event');

dotenv.config();

const mockClubs = [
    {
        name: 'Tech Innovators Club',
        description: 'Building the future through technology. Weekly hackathons, workshops, and coding challenges.',
        memberCount: 156,
        category: 'Technology',
        coordinator: 'Rahul Verma',
        socialLinks: {
            instagram: 'https://instagram.com/techinnovators',
            linkedin: 'https://linkedin.com/company/techinnovators',
            website: 'https://techinnovators.edu',
        },
        achievements: [
            { title: 'Best Tech Club 2024', description: 'Awarded by DTU', icon: 'trophy', earnedAt: new Date() },
        ],
    },
    {
        name: 'Entrepreneurship Cell',
        description: 'Fostering innovation and startup culture. Pitch competitions, mentorship, and networking events.',
        memberCount: 98,
        category: 'Business',
        coordinator: 'Ananya Singh',
        socialLinks: {
            instagram: 'https://instagram.com/ecell',
            linkedin: 'https://linkedin.com/company/ecell',
        },
    },
    {
        name: 'Photography Society',
        description: 'Capturing moments, creating memories. Photo walks, workshops, and exhibitions.',
        memberCount: 72,
        category: 'Creative',
        coordinator: 'Vikram Joshi',
        socialLinks: {
            instagram: 'https://instagram.com/photosociety',
        },
    },
    {
        name: 'Debate Club',
        description: 'Sharpening minds through discourse. Parliamentary debates, MUNs, and public speaking.',
        memberCount: 64,
        category: 'Literary',
        coordinator: 'Meera Kapoor',
    },
    {
        name: 'Sports Committee',
        description: 'Promoting fitness and sportsmanship. Inter-college tournaments and fitness programs.',
        memberCount: 120,
        category: 'Sports',
        coordinator: 'Arjun Reddy',
    },
    {
        name: 'Music Society',
        description: 'Harmonizing talents. Band performances, open mics, and music production workshops.',
        memberCount: 85,
        category: 'Creative',
        coordinator: 'Kavya Nair',
    },
];

const mockChallenges = [
    {
        title: '24-Hour Hackathon: Build a Climate App',
        description: 'Create an innovative solution for climate change awareness using any technology stack.',
        clubName: 'Tech Innovators Club',
        points: 500,
        difficulty: 'hard',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        participants: 48,
        status: 'active',
        category: 'Hackathon',
        isTeamChallenge: true,
        entryFee: 100,
    },
    {
        title: 'Startup Pitch Competition',
        description: 'Present your startup idea to a panel of investors. Top 3 win funding opportunities.',
        clubName: 'Entrepreneurship Cell',
        points: 350,
        difficulty: 'medium',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        participants: 24,
        status: 'active',
        category: 'Competition',
    },
];

const mockEvents = [
    {
        title: 'Spring Tech Symposium',
        description: 'A day of innovation featuring guest speakers from top tech companies and student project showcases.',
        date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        time: '10:00 AM - 4:00 PM',
        location: 'Main Auditorium',
        category: 'Technology',
        xpReward: 150,
        coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'
    },
    {
        title: 'Winter Hackathon 2025',
        description: 'Compete with the best minds to build solutions for real-world problems in 48 hours.',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        time: '9:00 AM onwards',
        location: 'Computer Center',
        category: 'Coding',
        xpReward: 300,
        coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80'
    },
    {
        title: 'Cultural Night: Fusion 2025',
        description: 'An evening of dance, music, and drama showcasing the diverse talents of our campus.',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        time: '6:00 PM - 10:00 PM',
        location: 'Open Air Theater',
        category: 'Cultural',
        xpReward: 100,
        coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80'
    }
];

const mockProjects = [
    {
        title: 'College Event Management System',
        description: 'Building a comprehensive platform for managing college events.',
        progress: 65,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'in_progress',
    },
    {
        title: 'AI Study Assistant',
        description: 'Creating an AI-powered study companion for students.',
        progress: 40,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        status: 'in_progress',
    },
];

const mockUsers = [
    { name: 'Aryan Mehta', email: 'aryan@dtu.ac.in', points: 5840, college: 'DTU', role: 'student' },
    { name: 'Priya Sharma', email: 'priya@dtu.ac.in', points: 5620, college: 'DTU', role: 'student' },
    { name: 'College Admin', email: 'admin@college.edu', role: 'owner', points: 9999, college: 'DTU', password: 'password123' },
    { name: 'Test Super Admin', email: 'testadmin@college.edu', role: 'owner', points: 9999, college: 'DTU', password: 'password123' },
    // Wait, seed uses `User.insertMany`. User model doesn't have a pre-save hook in the snippet I saw (it was defining schema).
    // The `auth.js` route hashes the password. 
    // If I insert directly via Mongoose, I need to hash it manually or add a pre-save hook.
    // Let me check User model again or better yet, run a script that hashes it.
];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        await Club.deleteMany();
        await Challenge.deleteMany();
        await Project.deleteMany();
        await User.deleteMany();
        await Event.deleteMany();

        // Insert Clubs
        const createdClubs = await Club.insertMany(mockClubs.map(club => ({ ...club, college: 'DTU' })));
        console.log('Clubs Seeded');

        // Link Challenges to Clubs (simple matching by name for now or just insert)
        // For specific linking we'd need to map IDs, but for now let's just insert challenges.
        // We need clubId for challenges.
        const techClub = createdClubs.find(c => c.name === 'Tech Innovators Club');
        const eCell = createdClubs.find(c => c.name === 'Entrepreneurship Cell');

        if (techClub) {
            mockChallenges[0].clubId = techClub._id;
        } else {
            mockChallenges[0].clubId = new mongoose.Types.ObjectId();
        }

        if (eCell) {
            mockChallenges[1].clubId = eCell._id;
        } else {
            mockChallenges[1].clubId = new mongoose.Types.ObjectId();
        }

        await Challenge.insertMany(mockChallenges);
        console.log('Challenges Seeded');

        await Project.insertMany(mockProjects);
        console.log('Projects Seeded');

        await Event.insertMany(mockEvents);
        console.log('Events Seeded');

        // Hash passwords for all users
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);

        const hashedUsers = await Promise.all(mockUsers.map(async (user) => {
            const hashedPassword = await bcrypt.hash(user.password || 'password123', salt);
            return { ...user, password: hashedPassword };
        }));

        await User.insertMany(hashedUsers);
        console.log('Users Seeded');

        console.log('Data Seeded Successfully');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

seedData();
