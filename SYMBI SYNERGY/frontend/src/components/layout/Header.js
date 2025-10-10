import React, { useContext } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Avatar, Menu, MenuItem, Divider, Switch, Box, useMediaQuery, useTheme } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useAuth } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';

// Check if we're in demo mode
const isDemoMode = process.env.NODE_ENV === 'demo' || process.env.REACT_APP_DEMO_MODE === 'true';

const Header = ({ toggleDrawer }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/settings');
    handleClose();
  };

  return (
    <>
      {/* Skip link for accessibility */}
      <a
        href="#main"
        style={{
          position: 'absolute',
          left: '-9999px',
          zIndex: 9999,
          padding: '8px 16px',
          background: '#000',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '4px',
        }}
        onFocus={(e) => {
          e.target.style.left = '8px';
          e.target.style.top = '8px';
        }}
        onBlur={(e) => {
          e.target.style.left = '-9999px';
        }}
      >
        Skip to content
      </a>
      <AppBar 
      position="fixed" 
      sx={{
        background: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        boxShadow: 'none',
        backdropFilter: 'blur(10px)',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)'
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        {user && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer}
            sx={{ 
              mr: 2,
              color: theme.palette.text.primary,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.primary.main,
              },
              transition: 'all 0.2s ease'
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Typography 
            variant="h6" 
            component={Link} 
            to="/" 
            sx={{ 
              textDecoration: 'none', 
              color: theme.palette.text.primary,
              fontFamily: theme.typography.fontFamily,
              fontWeight: 600,
              fontSize: { xs: '1.2rem', sm: '1.4rem' },
              letterSpacing: '-0.01em',
              '&:hover': {
                color: theme.palette.primary.main,
              },
              transition: 'color 0.2s ease'
            }}
          >
            YCQ Sonate
          </Typography>
          
          {isDemoMode && (
            <Box
              sx={{
                ml: 2,
                px: 1,
                py: 0.5,
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                border: '1px solid rgba(255, 152, 0, 0.3)',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.warning.main,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                🎭 Demo
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Theme toggle */}
          <IconButton 
            onClick={toggleTheme} 
            sx={{ 
              ml: 1,
              color: theme.palette.warning.main,
              '&:hover': {
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
              },
              transition: 'all 0.2s ease'
            }}
          >
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

          {user ? (
            <>
              <Button 
                component={Link} 
                to="/conversations"
                sx={{ 
                  display: isMobile ? 'none' : 'block',
                  mx: 0.5,
                  px: 2,
                  py: 1,
                  color: theme.palette.text.primary,
                  fontWeight: 500,
                  textTransform: 'none',
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.info.main,
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Conversations
              </Button>
              <Button 
                component={Link} 
                to="/projects"
                sx={{ 
                  display: isMobile ? 'none' : 'block',
                  mx: 0.5,
                  px: 2,
                  py: 1,
                  color: theme.palette.text.primary,
                  fontWeight: 500,
                  textTransform: 'none',
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.success.main,
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Projects
              </Button>
              <Button 
                component={Link} 
                to="/agents"
                sx={{ 
                  display: isMobile ? 'none' : 'block',
                  mx: 0.5,
                  px: 2,
                  py: 1,
                  color: theme.palette.text.primary,
                  fontWeight: 500,
                  textTransform: 'none',
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.success.main,
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Agents
              </Button>
              <Button 
                component={Link} 
                to="/reports"
                sx={{ 
                  display: isMobile ? 'none' : 'block',
                  mx: 0.5,
                  px: 2,
                  py: 1,
                  color: theme.palette.text.primary,
                  fontWeight: 500,
                  textTransform: 'none',
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.warning.main,
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Symbi Logs
              </Button>
              <Button 
                component={Link} 
                to="/context-bridge"
                sx={{ 
                  display: isMobile ? 'none' : 'block',
                  mx: 0.5,
                  px: 2,
                  py: 1,
                  color: theme.palette.text.primary,
                  fontWeight: 500,
                  textTransform: 'none',
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.info.main,
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Context Bridge
              </Button>
              <IconButton
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                sx={{
                  ml: 1,
                  p: 0,
                  '&:hover': {
                    '& .MuiAvatar-root': {
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                    }
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleProfile}>Profile & Settings</MenuItem>
                <MenuItem component={Link} to="/reports" onClick={handleClose}>Symbi Logs</MenuItem>
                <MenuItem component={Link} to="/context-bridge" onClick={handleClose}>Context Bridge</MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
              {/* <Button color="inherit" component={Link} to="/register">
                Register
              </Button> */} {/* Temporarily disabled */}
            </>
          )}
        </Box>
      </Toolbar>
      </AppBar>
    </>
  );
};

export default Header;
