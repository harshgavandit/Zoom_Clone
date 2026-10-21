import * as React from 'react';
import { errorMessage } from '../utils/api';
import { Avatar as Avatar } from '@mui/material';
import { Button as Button } from '@mui/material';
import { CssBaseline as CssBaseline } from '@mui/material';
import { TextField as TextField } from '@mui/material';



import { Paper as Paper } from '@mui/material';
import { Box as Box } from '@mui/material';
import { Grid as Grid } from '@mui/material';
import { LockOutlined as LockOutlinedIcon } from '@mui/icons-material';

import { createTheme, ThemeProvider } from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material';



const defaultTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#006aff',
        },
        background: {
            default: '#060913',
            paper: '#0d1224',
        },
    },
    typography: {
        fontFamily: "'Outfit', sans-serif",
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(13, 18, 36, 0.75) !important',
                    backdropFilter: 'blur(16px)',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    padding: '8px 16px',
                }
            }
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        backgroundColor: 'rgba(25, 33, 61, 0.3)',
                    }
                }
            }
        }
    }
});

export default function Authentication() {



    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [name, setName] = React.useState('');
    const [error, setError] = React.useState('');
    const [message, setMessage] = React.useState('');


    const [formState, setFormState] = React.useState(0);

    const [open, setOpen] = React.useState(false);
    const [busy, setBusy] = React.useState(false);


    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    let handleAuth = async () => {
        if (busy) return;
        setBusy(true); setError('');
        try {
            if (formState === 0) {

                await handleLogin(username, password)


            }
            if (formState === 1) {
                let result = await handleRegister(name, username, password);

                setUsername("");
                setMessage(result);
                setOpen(true);
                setError("")
                setFormState(0)
                setPassword("")
            }
        } catch (err) {


            let message = errorMessage(err);
            setError(message);
        } finally { setBusy(false); }
    }


    return (
        <ThemeProvider theme={defaultTheme}>
            <Grid container component="main" sx={{ height: '100vh' }}>
                <CssBaseline />
                <Grid
                    item
                    xs={false}
                    sm={4}
                    md={7}
                    sx={{
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
                    <Box
                        sx={{
                            my: 8,
                            mx: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                            <LockOutlinedIcon />
                        </Avatar>


                        <Box sx={{ display: 'flex', gap: 1, background: 'rgba(255, 255, 255, 0.05)', p: 0.5, borderRadius: '12px', mb: 3, width: '100%' }}>
                            <Button
                                variant={formState === 0 ? "contained" : "text"}
                                sx={{
                                    flex: 1,
                                    boxShadow: formState === 0 ? '0 4px 12px rgba(0,106,255,0.3)' : 'none',
                                    bgcolor: formState === 0 ? 'primary.main' : 'transparent',
                                    color: formState === 0 ? 'white' : 'text.secondary',
                                    '&:hover': { bgcolor: formState === 0 ? 'primary.dark' : 'rgba(255,255,255,0.05)' }
                                }}
                                onClick={() => { setFormState(0) }}
                            >
                                Sign In
                            </Button>
                            <Button
                                variant={formState === 1 ? "contained" : "text"}
                                sx={{
                                    flex: 1,
                                    boxShadow: formState === 1 ? '0 4px 12px rgba(0,106,255,0.3)' : 'none',
                                    bgcolor: formState === 1 ? 'primary.main' : 'transparent',
                                    color: formState === 1 ? 'white' : 'text.secondary',
                                    '&:hover': { bgcolor: formState === 1 ? 'primary.dark' : 'rgba(255,255,255,0.05)' }
                                }}
                                onClick={() => { setFormState(1) }}
                            >
                                Sign Up
                            </Button>
                        </Box>

                        <Box component="form" onSubmit={e => { e.preventDefault(); handleAuth(); }} sx={{ mt: 1 }}>
                            {formState === 1 ? <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="full-name"
                                label="Full Name"
                                name="name"
                                autoComplete="name"
                                value={name}
                                autoFocus
                                onChange={(e) => setName(e.target.value)}
                            /> : <></>}

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="username"
                                label="Username"
                                name="username"
                                value={username}
                                autoFocus
                                onChange={(e) => setUsername(e.target.value)}

                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                value={password}
                                type="password"
                                onChange={(e) => setPassword(e.target.value)}

                                id="password"
                            />

                            <p role="alert" style={{ color: "#fca5a5" }}>{error}</p>
                            {formState === 1 && <p style={{ color: "#94a3b8", fontSize: 13 }}>Use 8–72 characters with uppercase, lowercase, and a number.</p>}

                            <Button
                                type="submit"
                                disabled={busy}
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}

                            >
                                {formState === 0 ? "Login " : "Register"}
                            </Button>

                        </Box>
                    </Box>
                </Grid>
            </Grid>

            <Snackbar

                open={open}
                autoHideDuration={4000}
                onClose={() => setOpen(false)}
                message={message}
            />

        </ThemeProvider>
    );
}
