const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const FAQ = require('./models/FAQ');

const faqData = [
    {
        name: "Points & XP Distribution",
        icon: "Zap",
        order: 1,
        items: [
            {
                question: "How do I earn XP as a student?",
                answer: "Students earn 100 XP for attending any verified event. Additionally, winning competitions awards extra XP: 50 XP for 1st place, 40 XP for 2nd place, and 25 XP for 3rd place.",
                order: 1
            },
            {
                question: "How does my Level increase?",
                answer: "Your Level is calculated based on your Total Earned XP. As you participate in more events and win challenges, your XP grows, unlocking higher levels and prestige on the leaderboard.",
                order: 2
            },
            {
                question: "How do Clubs earn points?",
                answer: "Clubs earn points based on the events they organize. They get 15 points per Chief Guest, 25 points per competition held, and 10 points per participant. Partnering with other clubs shares 75% of the total points with collaborators.",
                order: 3
            },
            {
                question: "What are Event Ratings?",
                answer: "After an event, participants can rate it via a poll. These ratings contribute directly to the club's points (e.g., a 5-star rating adds 5 points to the club's total).",
                order: 4
            }
        ]
    },
    {
        name: "Challenges & Missions",
        icon: "Target",
        order: 2,
        items: [
            {
                question: "What are Challenges?",
                answer: "Challenges are sets of missions designed to test and reward your skills. Each challenge has multiple goals that you can complete within a specified deadline.",
                order: 1
            },
            {
                question: "How do I join a challenge?",
                answer: "Browse the 'Challenges' tab, select a challenge that interests you, and click 'Join'. You can then track your progress and submit missions directly through the dashboard.",
                order: 2
            },
            {
                question: "What rewards do I get for challenges?",
                answer: "Completing challenge missions awards XP and points. Some missions may also grant special badges that appear on your profile.",
                order: 3
            }
        ]
    },
    {
        name: "Events & Registration",
        icon: "Calendar",
        order: 3,
        items: [
            {
                question: "How do I register for an event?",
                answer: "Go to the 'Events' tab, find an upcoming event, and click 'Register'. You can choose to register as an individual or part of a team if the event permits.",
                order: 1
            },
            {
                question: "Can I edit my registration?",
                answer: "Yes! If registrations are still open, you can click the 'Edit' button on the event card or within the registration dialog to update your details or team members.",
                order: 2
            },
            {
                question: "What is an event report?",
                answer: "Past events have reports where you can see the summary, highlights, winners, and guest lists. It serves as a verified record of the event's success.",
                order: 3
            }
        ]
    },
    {
        name: "Projects & Collaboration",
        icon: "FolderKanban",
        order: 4,
        items: [
            {
                question: "What are Projects?",
                answer: "Projects are collaborative workspaces where you can build anything from software to event plans. You can invite team members and track goals together.",
                order: 1
            },
            {
                question: "How do I join a project?",
                answer: "You can be invited to a project or join using a unique Join Code provided by the project lead. Managed projects may require approval from a club coordinator.",
                order: 2
            },
            {
                question: "What are Project Goals?",
                answer: "Goals help break down projects into tasks. Team members can submit their work links, which project leads can review and approve.",
                order: 3
            }
        ]
    },
    {
        name: "Leaderboard & Rankings",
        icon: "Trophy",
        order: 5,
        items: [
            {
                question: "How often is the leaderboard reset?",
                answer: "The Student Leaderboard resets its 'Weekly XP' every Monday at midnight. The Club Ranking resets its 'Monthly Points' on the 1st of every month.",
                order: 1
            },
            {
                question: "What are the rewards for ranking high?",
                answer: "Top 3 students in each college receive exclusive Weekly Rank badges. Top 3 clubs receive Monthly Achievement trophies on their club profiles.",
                order: 2
            },
            {
                question: "Is there an overall ranking?",
                answer: "Yes, besides weekly/monthly resets, the platform tracks 'Total Earned XP' for students and 'Total Points' for clubs for all-time prestige.",
                order: 3
            }
        ]
    }
];

const backfill = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing FAQs to avoid duplicates
        await FAQ.deleteMany({});

        // Insert backfill data
        await FAQ.insertMany(faqData);

        console.log('Backfill successful. FAQs imported.');
        process.exit(0);
    } catch (err) {
        console.error('Backfill failed:', err);
        process.exit(1);
    }
};

backfill();
