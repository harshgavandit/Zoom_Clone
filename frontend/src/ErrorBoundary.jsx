// ErrorBoundary.jsx - Catch React errors gracefully
import React from 'react';
import { Box, Button, Typography, Container } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #060913 0%, #0d1224 100%)',
          }}
        >
          <Container maxWidth="sm">
            <Box
              sx={{
                textAlign: 'center',
                p: 4,
                backgroundColor: 'rgba(25, 33, 61, 0.4)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <ErrorOutlineIcon
                sx={{ fontSize: 80, color: '#ff6b6b', mb: 2 }}
              />
              <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
                Oops! Something went wrong
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#94a3b8', mb: 3 }}
              >
                We encountered an unexpected error. Please try reloading the page.
              </Typography>
              {process.env.NODE_ENV === 'development' && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px',
                    textAlign: 'left',
                    color: '#ff9500',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    mb: 3,
                  }}
                >
                  <p>{this.state.error?.toString()}</p>
                </Box>
              )}
              <Button
                variant="contained"
                onClick={this.handleReset}
                sx={{
                  background: 'linear-gradient(90deg, #006aff 0%, #0052cc 100%)',
                  px: 4,
                  py: 1.5,
                }}
              >
                Reload Page
              </Button>
            </Box>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;