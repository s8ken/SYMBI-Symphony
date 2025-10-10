import React, { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Header from './Header';
import Sidebar from './Sidebar';
import DemoNotice from '../DemoNotice';
import { useTheme } from '../../context/ThemeContext';

const Layout = ({ children }) => {
  const { mode, toggleTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar open={drawerOpen} toggleDrawer={toggleDrawer} />
      <Box sx={{ flexGrow: 1 }}>
        <Header toggleDrawer={toggleDrawer}>
          <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Header>
        <DemoNotice />
        <Box 
          component="main" 
          id="main"
          role="main"
          tabIndex={-1}
          sx={{ 
            p: 3, 
            mt: process.env.REACT_APP_DEMO_MODE === 'true' ? 12 : 8, // Extra margin for demo notice
            outline: 'none',
            '&:focus': {
              outline: 'none'
            }
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;