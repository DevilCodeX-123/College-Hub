const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/college-hub', { // Try localhost explicitly
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected');
    const event = await Event.findOne({ isCompleted: false });
    const user = await User.findOne({});

    if (event && user) {
        console.log(`EVENT_ID=${event._id}`);
        console.log(`USER_ID=${user._id}`);
    } else {
        console.log('No event or user found');
    }
    mongoose.disconnect();
}).catch(err => console.log(err));
