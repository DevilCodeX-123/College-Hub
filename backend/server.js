const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
