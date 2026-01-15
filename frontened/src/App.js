import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// --- STYLES ---
const styles = {
  container: { fontFamily: 'sans-serif', maxWidth: '900px', margin: '40px auto', display: 'flex', gap: '30px', padding: '20px' },
  leftPanel: { flex: 1, borderRight: '1px solid #ddd', paddingRight: '20px' },
  rightPanel: { flex: 2 },
  header: { fontSize: '1.2rem', color: '#666', marginBottom: '10px' },
  title: { fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '20px' },
  eventButton: {
    display: 'block', width: '100%', padding: '15px', marginBottom: '10px',
    border: '1px solid #ddd', borderRadius: '8px', background: 'white',
    cursor: 'pointer', textAlign: 'left', fontSize: '1rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  activeButton: { border: '2px solid #0069ff', background: '#f6faff' },
  slotButton: {
    display: 'block', width: '100%', padding: '12px', marginBottom: '8px',
    border: '1px solid #0069ff', color: '#0069ff', background: 'white',
    borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', textAlign: 'center'
  }
};

function App() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [date, setDate] = useState(new Date());
  const [slots, setSlots] = useState([]);

  // 1. Load Event Types
  useEffect(() => {
    axios.get('https://calendly-clone-edou.onrender.com/api/events')
      .then(res => setEvents(res.data))
      .catch(err => console.error("Backend not running!"));
  }, []);

  // 2. Load Time Slots
  const onDateChange = (newDate) => {
    setDate(newDate);
    if(selectedEvent) {
        const dateStr = newDate.toLocaleDateString('en-CA'); 
        axios.get(`https://calendly-clone-edou.onrender.com/api/slots?date=${dateStr}&eventTypeId=${selectedEvent.id}`)
             .then(res => setSlots(res.data));
    }
  };

  // 3. Handle Booking
  const handleBook = (slotTime) => {
      const name = prompt("Enter your Name:");
      const email = prompt("Enter your Email:");
      if(name && email) {
        axios.post('https://calendly-clone-edou.onrender.com/api/book', {
            eventTypeId: selectedEvent.id, name, email, startTime: slotTime
        }).then(() => {
            alert("✅ Booking Confirmed!");
            setSlots(slots.filter(s => s !== slotTime));
        });
      }
  };

  return (
    <div style={styles.container}>
      {/* LEFT COLUMN */}
      <div style={styles.leftPanel}>
        <div style={styles.header}>Ravi's Calendar</div>
        <div style={styles.title}>Select an Event</div>
        {events.map(ev => (
            <button key={ev.id} 
                style={{...styles.eventButton, ...(selectedEvent?.id === ev.id ? styles.activeButton : {})}}
                onClick={() => { setSelectedEvent(ev); setSlots([]); }}>
                <strong>{ev.name}</strong><br/>
                <span style={{color:'#666', fontSize:'0.9rem'}}>{ev.duration} min</span>
            </button>
        ))}
      </div>

      {/* RIGHT COLUMN */}
      <div style={styles.rightPanel}>
        {!selectedEvent ? (
            <p>Please select an event type from the left.</p>
        ) : (
            <div style={{display: 'flex', gap: '30px'}}>
                <div>
                    <h3 style={{marginTop:0}}>Select a Date</h3>
                    <Calendar onChange={onDateChange} value={date} minDate={new Date()} />
                </div>
                <div style={{width: '200px'}}>
                    <h3 style={{marginTop:0}}>Available Times</h3>
                    {slots.length === 0 && <p style={{color:'#888'}}>No slots available.</p>}
                    <div style={{maxHeight:'350px', overflowY:'auto'}}>
                        {slots.map((slot, i) => (
                            <button key={i} style={styles.slotButton} onClick={() => handleBook(slot)}>
                                {new Date(slot).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

export default App;