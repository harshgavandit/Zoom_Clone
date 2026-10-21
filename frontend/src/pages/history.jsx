import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../utils/api';
import withAuth from '../utils/withAuth';
function History() {
  const [meetings, setMeetings] = useState([]), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  useEffect(() => { let alive = true;
    api.get('/users/get_all_activity').then(({ data }) => { if (alive) setMeetings(data); }).catch(e => { if (alive) setError(errorMessage(e)); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  return <main style={{ padding: 32, maxWidth: 800, margin: 'auto' }}><Link to="/home">Back to home</Link><h1>Meeting history</h1>
    {error && <p role="alert">{error}</p>}{loading ? <p>Loading meetings…</p> : meetings.length ? <ul>{meetings.map(meeting => <li key={meeting._id} style={{ margin: '20px 0' }}><Link to={`/${meeting.meetingCode}`}>{meeting.meetingCode}</Link><p>{new Date(meeting.date).toLocaleString()}</p></li>)}</ul> : <p>Your meetings will appear here after you join from home.</p>}
  </main>;
}
export default withAuth(History);
