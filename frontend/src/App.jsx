import { lazy, Suspense } from 'react';
import './App.css';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import LandingPage from './pages/landing';
const Authentication = lazy(() => import('./pages/authentication'));
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './ErrorBoundary';
const VideoMeetComponent = lazy(() => import('./pages/VideoMeet'));

const HomeComponent = lazy(() => import('./pages/home'));
const History = lazy(() => import('./pages/history'));
const RecordingsPage = lazy(() => import('./pages/recordings'));
const SystemInfo = lazy(() => import('./pages/systemInfo'));
import { ThemeProvider, createTheme } from '@mui/material';

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
                <Suspense fallback={<div role="status" style={{ padding: 32 }}>Loading…</div>}>
                <Routes>
                  <Route path='/' element={<LandingPage />} />
                  <Route path='/auth' element={<Authentication />} />
                  <Route path='/home' element={<HomeComponent />} />
                  <Route path='/history' element={<History />} />
                  <Route path='/:url' element={<VideoMeetComponent />} />
                  <Route path='/ms/:roomId' element={<VideoMeetComponent />} />
                  <Route path='/recordings' element={<RecordingsPage />} />
                  <Route path='/system-info' element={<SystemInfo />} />
                </Routes>
                </Suspense>
              </AuthProvider>
            </Router>
          </ToastProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </div>
  );
}

export default App;
