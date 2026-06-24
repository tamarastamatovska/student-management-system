import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import SchoolIcon from '@mui/icons-material/School';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import StudentListPage from './pages/StudentListPage';
import { theme } from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 50%, #6366f1 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Toolbar>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1.5,
                }}
              >
                <SchoolIcon />
              </Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
                Student Management System
              </Typography>
            </Toolbar>
          </AppBar>
          <Box component="main" sx={{ py: 4 }}>
            <Container maxWidth="lg">
              <Routes>
                <Route path="/" element={<StudentListPage />} />
              </Routes>
            </Container>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
