const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_JItUVinA9u8E@ep-square-rain-ah1vch2n-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

// 1. Get Event Types [cite: 19]
app.get('/api/events', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM event_types');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// 2. Get Available Slots (9 AM - 5 PM) [cite: 23, 27]
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

// 3. Create Booking (WITH DOUBLE-BOOKING PROTECTION) [cite: 28, 29]
app.post('/api/book', async (req, res) => {
    const { eventTypeId, name, email, startTime } = req.body;
    try {
        const eventResult = await pool.query("SELECT duration FROM event_types WHERE id = $1", [eventTypeId]);
        if (eventResult.rows.length === 0) return res.status(400).json({ error: "Invalid Event" });
        
        const duration = eventResult.rows[0].duration;
        const start = new Date(startTime);
        const end = new Date(start.getTime() + duration * 60000);

        // --- NEW: Double Booking Check ---
        const check = await pool.query(
            "SELECT * FROM bookings WHERE event_type_id = $1 AND start_time = $2",
            [eventTypeId, start]
        );
        if (check.rows.length > 0) return res.status(400).json({ error: "Slot already taken" });

        await pool.query(
            "INSERT INTO bookings (event_type_id, invitee_name, invitee_email, start_time, end_time) VALUES ($1, $2, $3, $4, $5)",
            [eventTypeId, name, email, start, end]
        );
        res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).send("Database Error"); }
});

// 4. View All Meetings (Upcoming & Past) [cite: 31, 32, 33]
app.get('/api/meetings', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT b.*, e.name as event_name 
            FROM bookings b 
            LEFT JOIN event_types e ON b.event_type_id = e.id 
            ORDER BY b.start_time DESC
        `);
        res.json(result.rows);
    } catch (err) { 
        console.error(err); 
        res.status(500).send("Database Error"); 
    }
});

// 5. Cancel Meeting [cite: 34]
app.delete('/api/meetings/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM bookings WHERE id = $1", [req.params.id]);
        res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).send("Database Error"); }
});

app.listen(5000, () => console.log("Server running on port 5000"));