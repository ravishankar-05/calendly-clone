const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
// We are pasting the link directly here to bypass the .env issue
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_JItUVinA9u8E@ep-square-rain-ah1vch2n-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

// --- ROUTES ---

// 1. Get Event Types
app.get('/api/events', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM event_types');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// 2. Get Available Slots
app.get('/api/slots', async (req, res) => {
    const { date, eventTypeId } = req.query; 
    try {
        const eventResult = await pool.query('SELECT duration FROM event_types WHERE id = $1', [eventTypeId]);
        if (eventResult.rows.length === 0) return res.status(404).json({ error: "Event not found" });
        const duration = eventResult.rows[0].duration;

        const bookingsResult = await pool.query(
            "SELECT start_time FROM bookings WHERE event_type_id = $1 AND start_time::text LIKE $2",
            [eventTypeId, `${date}%`]
        );
        const bookings = bookingsResult.rows;

        let slots = [];
        // Generate slots 9 AM to 5 PM
        for (let h = 9; h < 17; h++) {
            for (let m = 0; m < 60; m += duration) {
                if (h === 16 && m + duration > 60) continue;
                const timeStr = `${date} ${h < 10 ? '0'+h : h}:${m < 10 ? '0'+m : m}:00`;
                const isTaken = bookings.some(b => new Date(b.start_time).getTime() === new Date(timeStr).getTime());
                if (!isTaken) slots.push(timeStr);
            }
        }
        res.json(slots);
    } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});

// 3. Create Booking
app.post('/api/book', async (req, res) => {
    const { eventTypeId, name, email, startTime } = req.body;
    const endTime = new Date(new Date(startTime).getTime() + 30*60000); 
    try {
        await pool.query(
            "INSERT INTO bookings (event_type_id, invitee_name, invitee_email, start_time, end_time) VALUES ($1, $2, $3, $4, $5)",
            [eventTypeId, name, email, startTime, endTime]
        );
        res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).send("Database Error"); }
});

app.listen(5000, () => console.log("Server running on port 5000"));