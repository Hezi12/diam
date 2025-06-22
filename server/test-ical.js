const ical = require('ical-generator').default;

try {
    const calendar = ical({
        domain: 'diam-hotels.com',
        name: 'Test Calendar',
        description: 'בדיקה',
        timezone: 'Asia/Jerusalem'
    });

    console.log('iCal generator works!');
    console.log(calendar.toString());
} catch (error) {
    console.error('Error with ical-generator:', error);
} 