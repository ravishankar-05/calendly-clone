import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// --- STYLES (Calendly-inspired) ---
const styles = {
  container: { fontFamily: 'sans-serif', maxWidth: '1000px', margin: '40px auto', padding: '20px' },
  nav: { display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '10px' },
  navButton: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', color: '#666' },
  activeNav: { color: '#0069ff', borderBottom: '2px solid #0069ff' },
  flexContainer: { display: 'flex', gap: '30px' },
  leftPanel: { flex: 1, borderRight: '1px solid #ddd', paddingRight: '20px' },
  rightPanel: { flex: 2 },
  title: { fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px' },
  eventButton: {
    display: 'block', width: '100%', padding: '15px', marginBottom: '10px',
    border: '1px solid #ddd', borderRadius: '8px', background: 'white',
    cursor: 'pointer', textAlign: 'left', fontSize: '1rem'
  },
  activeButton: { border: '2px solid #0069ff', background: '#f6faff' },
  slotButton: {
    display: 'block', width: '100%', padding: '12px', marginBottom: '8px',
    border: '1px solid #0069ff', color: '#0069ff', background: 'white',
    borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
  },
  meetingCard: { border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '10px' }
};

function App() {
  const [view, setView] = useState('booking'); // 'booking' or 'meetings'
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [date, setDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [meetings, setMeetings] = useState([]);

  const API_BASE = "https://calendly-clone-edou.onrender.com/api";

  // 1. Initial Load
  useEffect(() => {
    axios.get(`${API_BASE}/events`).then(res => setEvents(res.data));
    fetchMeetings();
  }, []);

  const fetchMeetings = () => {
    axios.get(`${API_BASE}/meetings`).then(res => setMeetings(res.data));
  };

  // 2. Load Availability (9 AM - 5 PM Logic is in Backend)
  const onDateChange = (newDate) => {
    setDate(newDate);
    if (selectedEvent) {
      const dateStr = newDate.toLocaleDateString('en-CA');
      axios.get(`${API_BASE}/slots?date=${dateStr}&eventTypeId=${selectedEvent.id}`)
           .then(res => setSlots(res.data));
    }
  };

  // 3. Handle Weekend Disabling (Requirement Check)
  const isWeekend = ({ date }) => date.getDay() === 0 || date.getDay() === 6;

  // 4. Booking Logic
  const handleBook = (slotTime) => {
    const name = prompt("Enter your Name:");
    const email = prompt("Enter your Email:");
    if (name && email) {
      axios.post(`${API_BASE}/book`, {
        eventTypeId: selectedEvent.id, name, email, startTime: slotTime
      }).then(() => {
        alert("✅ Booking Confirmed!");
        onDateChange(date); // Refresh slots
        fetchMeetings(); // Refresh admin list
      }).catch(err => alert(err.response?.data?.error || "Booking failed"));
    }
  };

  // 5. Cancel Meeting Logic (With Simple Admin Guard)
const handleCancel = (id) => {
  // Requirement check: The assignment assumes a default user is logged in 
  const password = prompt("Enter Admin Password to cancel:");
  
  if (password === "admin123") { 
    if (window.confirm("Are you sure you want to cancel this meeting?")) {
      axios.delete(`${API_BASE}/meetings/${id}`)
        .then(() => {
          alert("Meeting cancelled successfully.");
          fetchMeetings(); // Refresh the list [cite: 34]
        })
        .catch(err => alert("Error cancelling meeting"));
    }
  } else {
    alert("Unauthorized! Only the admin can cancel meetings.");
  }
};

  return (
    <div style={styles.container}>
      {/* NAVIGATION TABS */}
      <nav style={styles.nav}>
        <button 
          style={{...styles.navButton, ...(view === 'booking' ? styles.activeNav : {})}} 
          onClick={() => setView('booking')}>Public Booking Page</button>
        <button 
          style={{...styles.navButton, ...(view === 'meetings' ? styles.activeNav : {})}} 
          onClick={() => setView('meetings')}>Meetings Management</button>
      </nav>

      {view === 'booking' ? (
        <div style={styles.flexContainer}>
          <div style={styles.leftPanel}>
            <div style={styles.title}>Select Event Type</div>
            {events.map(ev => (
              <button key={ev.id} 
                style={{...styles.eventButton, ...(selectedEvent?.id === ev.id ? styles.activeButton : {})}}
                onClick={() => { setSelectedEvent(ev); setSlots([]); }}>
                <strong>{ev.name}</strong><br/>
                <small>{ev.duration} min</small>
              </button>
            ))}
          </div>

          <div style={styles.rightPanel}>
            {!selectedEvent ? <p>Select an event to see availability.</p> : (
              <div style={{display:'flex', gap:'20px'}}>
                <Calendar onChange={onDateChange} value={date} minDate={new Date()} tileDisabled={isWeekend} />
                <div style={{width:'200px'}}>
                  <strong>Available Times</strong>
                  {slots.map((s, i) => (
                    <button key={i} style={styles.slotButton} onClick={() => handleBook(s)}>
                      {new Date(s).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div style={styles.title}>Upcoming & Past Meetings</div>
          {meetings.map(m => (
            <div key={m.id} style={styles.meetingCard}>
              <strong>{m.event_name}</strong> with {m.invitee_name} ({m.invitee_email})<br/>
              📅 {new Date(m.start_time).toLocaleString()}
              <button onClick={() => handleCancel(m.id)} style={{float:'right', color:'red', cursor:'pointer'}}>Cancel</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;