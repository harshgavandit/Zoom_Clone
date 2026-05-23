import './App.css';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './ErrorBoundary';
import VideoMeetComponent from './pages/VideoMeet';
import VideoMeetMediasoup from './pages/VideoMeetMediasoup';
import HomeComponent from './pages/home';
import History from './pages/history';
import RecordingsPage from './pages/recordings';
import SystemInfo from './pages/systemInfo';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#006aff', // Zoom vivid blue
    },
    background: {
      default: '#060913',
      paper: '#0d1224',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    }
  },
  typography: {
    fontFamily: "'Outfit', sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 20px',
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: 'rgba(25, 33, 61, 0.4)',
          }
        }
      }
    }
  }
});

function App() {
  return (
    <div className="App">
      <ErrorBoundary>
        <ThemeProvider theme={darkTheme}>
          <ToastProvider>
            <Router>
              <AuthProvider>
                <Routes>
                  <Route path='/' element={<LandingPage />} />
                  <Route path='/auth' element={<Authentication />} />
                  <Route path='/home' element={<HomeComponent />} />
                  <Route path='/history' element={<History />} />
                  <Route path='/:url' element={<VideoMeetComponent />} />
                  <Route path='/ms/:roomId' element={<VideoMeetMediasoup />} />
                  <Route path='/recordings' element={<RecordingsPage />} />
                  <Route path='/system-info' element={<SystemInfo />} />
                </Routes>
              </AuthProvider>
            </Router>
          </ToastProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </div>
  );
}

export default App;
