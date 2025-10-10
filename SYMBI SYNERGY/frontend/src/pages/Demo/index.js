import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Container
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  Code as CodeIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';

import YCQConsoleDemo from './YCQConsoleDemo';
import TrustScoringDemo from './TrustScoringDemo';
import IntegrationPlayground from './IntegrationPlayground';

const DemoHome = () => {
  const demos = [
    {
      title: 'YCQ-Sonate Console',
      description: 'Live enterprise dashboard demonstrating real-time AI trust scoring and relationship monitoring',
      icon: <DashboardIcon sx={{ fontSize: 40 }} />,
      path: '/demo/console',
      color: 'primary'
    },
    {
      title: 'Trust Scoring Engine',
      description: 'Interactive demonstration of real-time AI evaluation using SYMBI framework metrics',
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      path: '/demo/trust-scoring',
      color: 'success'
    },
    {
      title: 'Integration Playground',
      description: 'API testing environment with code examples and live sandbox for developers',
      icon: <CodeIcon sx={{ fontSize: 40 }} />,
      path: '/demo/playground',
      color: 'info'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        YCQ-Sonate Interactive Demos
      </Typography>
      
      <Typography variant="body1" color="text.secondary" align="center" paragraph>
        Experience the SYMBI framework in action with live demonstrations of enterprise AI trust management
      </Typography>

      <Grid container spacing={4} sx={{ mt: 4 }}>
        {demos.map((demo) => (
          <Grid item xs={12} md={4} key={demo.title}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ color: `${demo.color}.main`, mb: 2 }}>
                  {demo.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {demo.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {demo.description}
                </Typography>
              </CardContent>
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Button
                  component={Link}
                  to={demo.path}
                  variant="contained"
                  color={demo.color}
                  startIcon={<PlayIcon />}
                >
                  Launch Demo
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Ready to integrate?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Access our comprehensive documentation and start building with YCQ-Sonate today
        </Typography>
        <Button
          variant="outlined"
          size="large"
          href="https://github.com/s8ken/SYMBI-SYNERGY"
          target="_blank"
          rel="noopener noreferrer"
        >
          View Documentation
        </Button>
      </Box>
    </Container>
  );
};

const DemoRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<DemoHome />} />
      <Route path="/console" element={<YCQConsoleDemo />} />
      <Route path="/trust-scoring" element={<TrustScoringDemo />} />
      <Route path="/playground" element={<IntegrationPlayground />} />
    </Routes>
  );
};

export default DemoRoutes;