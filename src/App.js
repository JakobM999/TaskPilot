import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { 
  Box, 
  CircularProgress, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Button, 
  BottomNavigation, 
  BottomNavigationAction, 
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import TaskIcon from '@mui/icons-material/Task';
import EventIcon from '@mui/icons-material/Event';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

// Components
import Login from './components/Login';
import Tasks from './components/Tasks';
import Settings from './components/Settings';
import AIAssistant from './components/AIAssistant';
import Calendar from './components/Calendar';

// Services
import { getCurrentUser } from './services/index';
import { startNotificationChecker, stopNotificationChecker } from './services/notificationService';

// Create AppWrapper to use hooks that require Router context
function AppWrapper() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();

  const [drawerOpen, setDrawerOpen] = useState(true);
  
  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };
  
  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const customTheme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#2563eb',
        light: '#3b82f6',
        dark: '#1d4ed8',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#10b981',
        light: '#34d399',
        dark: '#059669',
        contrastText: '#ffffff',
      },
      error: {
        main: '#ef4444',
      },
      warning: {
        main: '#f59e0b',
      },
      success: {
        main: '#10b981',
      },
      background: {
        default: darkMode ? '#121212' : '#f8fafc',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#2563eb',
          }
        }
      }
    }
  });

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { user } = await getCurrentUser();
        setUser(user);
      } catch (error) {
        console.error('Error checking user session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // Start notification checker when user is logged in
  useEffect(() => {
    let notificationInterval;
    
    if (user) {
      notificationInterval = startNotificationChecker();
    }

    return () => {
      if (notificationInterval) {
        stopNotificationChecker(notificationInterval);
      }
    };
  }, [user]);

  const handleLogin = (user) => {
    setUser(user);
    navigate('/');
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <ThemeProvider theme={customTheme}>
        <CssBaseline />
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh' 
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={customTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}
      >
        <Box sx={{ display: 'flex' }}>
          {/* Sidebar */}
          {user && !isMobile && (
            <Drawer
              variant="permanent"
              open={drawerOpen}
              sx={{
                width: drawerOpen ? 240 : 64,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                  width: drawerOpen ? 240 : 64,
                  boxSizing: 'border-box',
                  overflowX: 'hidden',
                  transition: theme => theme.transitions.create('width', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                  }),
                },
              }}
            >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              p: 1
            }}>
              {drawerOpen ? (
                <>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#2563eb', ml: 1 }}>
                    TaskPilot
                  </Typography>
                  <IconButton onClick={handleDrawerClose}>
                    <ChevronLeftIcon />
                  </IconButton>
                </>
              ) : (
                <IconButton onClick={handleDrawerOpen} sx={{ mx: 'auto' }}>
                  <MenuIcon />
                </IconButton>
              )}
            </Box>
            <Divider />
            <List>
              <ListItem button onClick={() => navigate('/')} selected={location.pathname === '/'}>
                <ListItemIcon>
                  <TaskIcon />
                </ListItemIcon>
                <ListItemText primary="Tasks" sx={{ opacity: drawerOpen ? 1 : 0 }} />
              </ListItem>
              <ListItem button onClick={() => navigate('/calendar')} selected={location.pathname === '/calendar'}>
                <ListItemIcon>
                  <EventIcon />
                </ListItemIcon>
                <ListItemText primary="Calendar" sx={{ opacity: drawerOpen ? 1 : 0 }} />
              </ListItem>
              <ListItem button onClick={() => navigate('/settings')} selected={location.pathname === '/settings'}>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Settings" sx={{ opacity: drawerOpen ? 1 : 0 }} />
              </ListItem>
              <Divider sx={{ my: 2 }} />
              <ListItem button onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Sign Out" sx={{ opacity: drawerOpen ? 1 : 0 }} />
              </ListItem>
            </List>
          </Drawer>
        )}

        {/* Top App Bar */}
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            ...(isMobile && {
              bottom: 0,
              top: 'auto'
            })
          }}
        >
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              {isMobile && (
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="subtitle1" component="div">
                {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: da })}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {user ? (
                <>
                  <Typography variant="body2" component="div">
                    Welcome, {user.email}
                  </Typography>
                  <IconButton color="inherit" onClick={toggleTheme} sx={{ ml: 1 }}>
                    {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                  </IconButton>
                  <Button 
                    color="inherit" 
                    onClick={handleLogout}
                    startIcon={<LogoutIcon />}
                    sx={{ display: { xs: 'none', sm: 'flex' } }}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button color="inherit" onClick={handleLoginClick}>Login</Button>
              )}
            </Box>
          </Toolbar>
          {isMobile && user && (
            <BottomNavigation
              value={location.pathname}
              onChange={(event, newValue) => {
                navigate(newValue);
              }}
              showLabels
              sx={{
                width: '100%',
                borderTop: 1,
                borderColor: 'divider'
              }}
            >
              <BottomNavigationAction
                label="Tasks"
                value="/"
                icon={<TaskIcon />}
              />
              <BottomNavigationAction
                label="Calendar"
                value="/calendar"
                icon={<EventIcon />}
              />
              <BottomNavigationAction
                label="AI"
                value="/ai"
                icon={<SmartToyIcon />}
              />
              <BottomNavigationAction
                label="Settings"
                value="/settings"
                icon={<SettingsIcon />}
              />
            </BottomNavigation>
          )}
        </AppBar>
        
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 1, sm: 1 },
              width: '100%',
              mt: !isMobile ? '64px' : 0,
              mb: isMobile ? '112px' : 0,
              transition: theme => theme.transitions.create('margin', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            }}
          >
            <Routes>
              <Route path="/login" element={
                user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
              } />
              <Route path="/" element={
                user ? <Tasks user={user} /> : <Navigate to="/login" />
              } />
              <Route path="/calendar" element={
                user ? <Calendar user={user} /> : <Navigate to="/login" />
              } />
              <Route path="/ai" element={
                user ? <AIAssistant user={user} /> : <Navigate to="/login" />
              } />
              <Route path="/settings" element={
                user ? <Settings user={user} /> : <Navigate to="/login" />
              } />
            </Routes>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default AppWrapper;
