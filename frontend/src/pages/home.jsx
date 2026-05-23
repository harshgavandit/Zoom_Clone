import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {


    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");


    const {addToUserHistory} = useContext(AuthContext);
    let handleJoinVideoCall = async () => {
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`)
    }

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
            <div className="glow-blob blob-blue"></div>
            <div className="glow-blob blob-purple"></div>

            <div className="navBar">
                <div style={{ display: "flex", alignItems: "center" }}>
                    <h2>Apna Video Call</h2>
                </div>

                <div className="navBarRight">
                    <div className="navBarHistoryBtn" onClick={() => navigate("/history")}>
                        <RestoreIcon sx={{ color: 'text.secondary' }} />
                        <p>History</p>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <Button variant="text" onClick={() => navigate('/recordings')} sx={{ color: 'text.secondary' }}>Recordings</Button>
                        <Button 
                            variant="outlined" 
                            color="error"
                            sx={{ borderRadius: '10px', px: 2, py: 0.5 }}
                            onClick={() => {
                                localStorage.removeItem("token")
                                navigate("/auth")
                            }}
                        >
                            Logout
                        </Button>
                    </div>
                </div>
            </div>

            <div className="meetContainer">
                <div className="leftPanel">
                    <div>
                        <h2>High quality video calls. Simple, reliable, and secure.</h2>
                        
                        <div className="join-card">
                            <h3 style={{ marginBottom: '1.2rem', fontWeight: 600, fontSize: '1.3rem' }}>Join or Start a Meeting</h3>
                            <div style={{ display: 'flex', gap: "12px", alignItems: 'center' }}>
                                <TextField 
                                    fullWidth
                                    size="small"
                                    onChange={e => setMeetingCode(e.target.value)} 
                                    id="outlined-basic" 
                                    label="Enter Meeting Code" 
                                    variant="outlined" 
                                />
                                <Button 
                                    onClick={handleJoinVideoCall} 
                                    variant='contained'
                                    sx={{ py: 1.1, px: 3, whiteSpace: 'nowrap' }}
                                >
                                    Join Call
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className='rightPanel'>
                    <img src='/logo3.png' alt="Video Conferencing illustration" />
                </div>
            </div>
        </div>
    )
}


export default withAuth(HomeComponent)