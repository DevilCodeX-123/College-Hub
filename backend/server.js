const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

const path = require('path');
// .env config
dotenv.config({ path: path.resolve(__dirname, '../.env') });

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/clubs', require('./routes/clubs'));
app.use('/api/challenges', require('./routes/challenges'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/polls', require('./routes/polls'));
app.use('/api/events', require('./routes/events'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/team-chat', require('./routes/teamChat'));
app.use('/api/faqs', require('./routes/faqs'));
app.use('/api/ads', require('./routes/ads'));
app.use('/api/config', require('./routes/config'));

// Weekly Leaderboard Reset & Student Rewards (Monday 00:00)
const cron = require('node-cron');
const User = require('./models/User');
const Club = require('./models/Club');

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

cron.schedule('0 0 * * 1', async () => {
    console.log('Running Weekly Leaderboard Reset & Reward System...');
    try {
        const weekNo = getWeekNumber(new Date());
        const weekStart = new Date();
        weekStart.setHours(0, 0, 0, 0);

        // Award badges to Top 3 in each college
        const colleges = await User.distinct('college');
        for (const collegeName of colleges) {
            const topUsers = await User.find({ college: collegeName })
                .sort({ weeklyXP: -1 })
                .limit(3);

            for (let i = 0; i < topUsers.length; i++) {
                const user = topUsers[i];
                const rank = i + 1;
                let badgeName = `Week ${weekNo} - Rank ${rank}`;
                let icon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';

                user.badges.push({
                    name: badgeName,
                    icon: icon,
                    description: `Placed Rank ${rank} in the Weekly Leaderboard of ${collegeName}`,
                    earnedAt: new Date()
                });
                await user.save();
            }
        }

        // Award CLUB-SPECIFIC badges to Top 3 in each club
        console.log('[Weekly Reset] Awarding club-specific badges...');
        const clubs = await Club.find();
        for (const club of clubs) {
            const clubMembers = await User.find({ joinedClubs: club._id })
                .sort({ weeklyXP: -1 })
                .limit(3);

            for (let i = 0; i < clubMembers.length; i++) {
                const member = clubMembers[i];
                const rank = i + 1;

                // Only award if they earned some XP this week
                if (member.weeklyXP && member.weeklyXP > 0) {
                    member.clubWeeklyBadges = member.clubWeeklyBadges || [];
                    member.clubWeeklyBadges.push({
                        clubId: club._id,
                        clubName: club.name,
                        rank: rank,
                        weekStart: weekStart,
                        earnedAt: new Date()
                    });
                    await member.save();
                    console.log(`[Weekly Reset] Awarded rank ${rank} badge to ${member.name} for ${club.name}`);
                }
            }
        }

        await User.updateMany({}, { weeklyXP: 0 });
        console.log('Weekly Reset & Rewards Successful');
    } catch (err) {
        console.error('Weekly Reset Failed:', err);
    }
});

// Monthly Club Ranking Reset & Rewards (1st of every month 00:00)
cron.schedule('0 0 1 * *', async () => {
    console.log('Running Monthly Club Reset & Reward System...');
    try {
        const monthNo = new Date().getMonth() + 1; // 1-indexed

        // Award achievements to Top 3 clubs per college
        const colleges = await Club.distinct('college');
        for (const collegeName of colleges) {
            const topClubs = await Club.find({ college: collegeName })
                .sort({ monthlyPoints: -1 })
                .limit(3);

            for (let i = 0; i < topClubs.length; i++) {
                const club = topClubs[i];
                const rank = i + 1;
                let achTitle = `Month ${monthNo} - Rank ${rank}`;
                let icon = rank === 1 ? '🏆' : rank === 2 ? '🥈' : '🥉';

                club.achievements.push({
                    title: achTitle,
                    icon: icon,
                    description: `Placed Rank ${rank} in the Monthly Club Rankings of ${collegeName}`,
                    earnedAt: new Date()
                });
                await club.save();
            }
        }

        await Club.updateMany({}, { monthlyPoints: 0 });
        console.log('Monthly Reset & Rewards Successful');
    } catch (err) {
        console.error('Monthly Reset Failed:', err);
    }
});

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(`[Error] ${req.method} ${req.url} - ${err.message}`);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
