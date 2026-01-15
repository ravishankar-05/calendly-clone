import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// --- STYLES (Calendly-inspired) ---
const styles = {
  container: { 
    fontFamily: "'Inter', -apple-system, sans-serif", 
    backgroundColor: '#f8f9fa', 
    minHeight: '100vh', 
    padding: '40px 20px',
    color: '#1a1a1a'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 10px 20px rgba(0,0,0,0.05)',
    maxWidth: '1060px',
    margin: '0 auto',
    overflow: 'hidden',
    border: '1px solid #e2e8f0'
  },
  nav: { 
    display: 'flex', 
    borderBottom: '1px solid #edf2f7',
    backgroundColor: '#ffffff'
  },
  navButton: { 
    flex: 1, 
    padding: '18px', 
    background: 'none', 
    border: 'none', 
    cursor: 'pointer', 
    fontSize: '0.95rem', 
    fontWeight: '600', 
    color: '#718096',
    transition: 'all 0.2s'
  },
  activeNav: { 
    color: '#0069ff', 
    borderBottom: '3px solid #0069ff',
    backgroundColor: '#fafdff'
  },
  mainContent: { padding: '40px' },
  flexContainer: { display: 'flex', gap: '40px' },
  leftPanel: { flex: '0 0 320px', borderRight: '1px solid #edf2f7', paddingRight: '20px' },
  rightPanel: { flex: 1 },
  title: { fontSize: '1.25rem', fontWeight: '700', marginBottom: '24px', color: '#1a202c' },
  eventButton: {
    width: '100%',
    padding: '18px',
    marginBottom: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease'
  },
  activeEvent: { borderColor: '#0069ff', backgroundColor: '#f0f7ff', boxShadow: '0 0 0 1px #0069ff' },
  slotGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' },
  slotButton: {
    padding: '12px',
    border: '1px solid #0069ff',
    borderRadius: '4px',
    color: '#0069ff',
    backgroundColor: 'white',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'center'
  },
  meetingCard: { 
    padding: '20px', 
    border: '1px solid #e2e8f0', 
    borderRadius: '8px', 
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff'
  }
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
    <div style={styles.card}>
      <nav style={styles.nav}>
        <button 
          style={{...styles.navButton, ...(view === 'booking' ? styles.activeNav : {})}} 
          onClick={() => setView('booking')}>Public Booking Page</button>
        <button 
          style={{...styles.navButton, ...(view === 'meetings' ? styles.activeNav : {})}} 
          onClick={() => setView('meetings')}>Meetings Management</button>
      </nav>

      <div style={styles.mainContent}>
        {view === 'booking' ? (
          <div style={styles.flexContainer}>
            <div style={styles.leftPanel}>
              <div style={styles.title}>What event should we book?</div>
              {events.map(ev => (
                <button key={ev.id} 
                  style={{...styles.eventButton, ...(selectedEvent?.id === ev.id ? styles.activeEvent : {})}}
                  onClick={() => { setSelectedEvent(ev); setSlots([]); }}>
                  <div style={{color: '#0069ff', fontWeight: 'bold', marginBottom: '4px'}}>{ev.name}</div>
                  <div style={{color: '#718096', fontSize: '0.85rem'}}>🕒 {ev.duration} min duration</div>
                </button>
              ))}
            </div>

            <div style={styles.rightPanel}>
              {!selectedEvent ? (
                <div style={{textAlign:'center', color:'#a0aec0', marginTop: '40px'}}>
                  <p>Please select an event type on the left to see availability.</p>
                </div>
              ) : (
                <div>
                  <div style={styles.title}>Select a Date & Time</div>
                  <div style={{display:'flex', gap:'30px', flexWrap: 'wrap'}}>
                    <Calendar onChange={onDateChange} value={date} minDate={new Date()} tileDisabled={isWeekend} />
                    <div style={{flex: 1}}>
                      <div style={{marginBottom: '15px', fontWeight: '600'}}>Available slots:</div>
                      <div style={styles.slotGrid}>
                        {slots.map((s, i) => (
                          <button key={i} style={styles.slotButton} onClick={() => handleBook(s)}>
                            {new Date(s).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{maxWidth: '800px', margin: '0 auto'}}>
            <div style={styles.title}>Upcoming & Past Meetings</div>
            {meetings.length === 0 ? <p>No meetings found.</p> : meetings.map(m => (
              <div key={m.id} style={styles.meetingCard}>
                <div>
                  <div style={{fontWeight: '700', color: '#2d3748'}}>{m.event_name}</div>
                  <div style={{fontSize: '0.9rem', color: '#718096'}}>
                    👤 {m.invitee_name} ({m.invitee_email})<br/>
                    📅 {new Date(m.start_time).toLocaleString()}
                  </div>
                </div>
                <button 
                  onClick={() => handleCancel(m.id)} 
                  style={{padding: '8px 16px', borderRadius: '4px', border: '1px solid #fc8181', color: '#e53e3e', background: 'none', cursor: 'pointer', fontWeight: 'bold'}}>
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);
}

export default App;