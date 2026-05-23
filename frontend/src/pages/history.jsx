import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';

import { IconButton } from '@mui/material';
export default function History() {


    const { getHistoryOfUser } = useContext(AuthContext);

    const [meetings, setMeetings] = useState([])


    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch {
                // IMPLEMENT SNACKBAR
            }
        }

        fetchHistory();
    }, [])

    let formatDate = (dateString) => {

        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const year = date.getFullYear();

        return `${day}/${month}/${year}`

    }

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', padding: '2rem' }}>
            <div className="glow-blob blob-blue"></div>
            <div className="glow-blob blob-purple"></div>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, position: 'relative', zIndex: 1 }}>
                <IconButton 
                    onClick={() => routeTo("/home")}
                    sx={{ 
                        bgcolor: 'rgba(255,255,255,0.05)', 
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'text.primary',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                    }}
                >
                    <HomeIcon />
                </IconButton>
                <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.5px' }}>Meeting History</Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 3, position: 'relative', zIndex: 1 }}>
                {meetings.length !== 0 ? (
                    meetings.map((e, i) => (
                        <Card 
                            key={i} 
                            variant="outlined" 
                            sx={{ 
                                bgcolor: 'rgba(13, 18, 36, 0.65)', 
                                backdropFilter: 'blur(16px)',
                                borderColor: 'rgba(255, 255, 255, 0.08)', 
                                borderRadius: '16px',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    borderColor: 'primary.main',
                                    boxShadow: '0 8px 30px rgba(0, 106, 255, 0.15)'
                                }
                            }}
                        >
                            <CardContent>
                                <Typography sx={{ fontSize: 13, color: 'primary.main', fontWeight: 600, mb: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Video Conference
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                                    Code: {e.meetingCode}
                                </Typography>
                                <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
                                    Date: {formatDate(e.date)}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 8 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: '1.1rem' }}>No meeting records found yet.</Typography>
                    </Box>
                )}
            </Box>
        </div>
    )
}
