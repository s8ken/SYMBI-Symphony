import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  LinearProgress,
  Chip,
  Avatar,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const YCQConsoleDemo = () => {
  const [trustScore, setTrustScore] = useState(85);
  const [activeUsers, setActiveUsers] = useState(127);
  const [processedRequests, setProcessedRequests] = useState(15420);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setTrustScore(prev => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 5)));
      setActiveUsers(prev => Math.max(0, prev + Math.floor(Math.random() * 3 - 1)));
      setProcessedRequests(prev => prev + Math.floor(Math.random() * 10));
      
      const newActivity = {
        id: Date.now(),
        type: Math.random() > 0.7 ? 'success' : 'info',
        message: [
          'Trust score updated for user session',
          'New compliance check completed',
          'AI response validated successfully',
          'User feedback processed',
          'Security audit passed'
        ][Math.floor(Math.random() * 5)],
        timestamp: new Date().toLocaleTimeString()
      };
      
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 4)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const metrics = [
    {
      title: 'Overall Trust Score',
      value: Math.round(trustScore),
      icon: <TrendingUpIcon />,
      color: getScoreColor(trustScore),
      description: 'Real-time AI trustworthiness assessment'
    },
    {
      title: 'Active Sessions',
      value: activeUsers,
      icon: <AssessmentIcon />,
      color: 'primary',
      description: 'Currently monitored user interactions'
    },
    {
      title: 'Requests Processed',
      value: processedRequests.toLocaleString(),
      icon: <TimelineIcon />,
      color: 'info',
      description: 'Total AI interactions analyzed today'
    },
    {
      title: 'Security Status',
      value: 'Secure',
      icon: <SecurityIcon />,
      color: 'success',
      description: 'All security protocols active'
    }
  ];

  return (
    <Box sx={{ flexGrow: 1, p: 3, bgcolor: 'background.default' }}>
      <Typography variant="h4" gutterBottom>
        YCQ-Sonate Enterprise Console Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Live demonstration of enterprise-grade AI trust scoring and relationship quality monitoring
      </Typography>

      <Grid container spacing={3}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: \`\${metric.color}.main`, mr: 2 }}>
                    {metric.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{metric.title}</Typography>
                    <Typography variant="h3" color={`${metric.color}.main`}>
                      {metric.value}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {metric.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Trust Score Trend
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" color={`${getScoreColor(trustScore)}.main`}>
                  {Math.round(trustScore)}%
                </Typography>
                <Chip 
                  label={getScoreLabel(trustScore)} 
                  color={getScoreColor(trustScore)} 
                  size="small" 
                  sx={{ ml: 2 }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={trustScore} 
                color={getScoreColor(trustScore)}
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Based on conversation depth, humor alignment, ethical resonance, and biological synchronization
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List dense>
                {recentActivity.map((activity, index) => (
                  <ListItem key={activity.id} divider={index < recentActivity.length - 1}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: activity.type === 'success' ? 'success.main' : 'info.main', width: 32, height: 32 }}>
                        {activity.type === 'success' ? <CheckCircleIcon /> : <WarningIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.message}
                      secondary={activity.timestamp}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Key Features Demonstrated
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body1" gutterBottom>
                  <strong>Real-time Monitoring:</strong> Live tracking of trust scores and user interactions
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body1" gutterBottom>
                  <strong>Comprehensive Metrics:</strong> Four-dimensional analysis of relationship quality
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body1" gutterBottom>
                  <strong>Enterprise Integration:</strong> Scalable monitoring for large-scale deployments
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          href="https://github.com/s8ken/SYMBI-SYNERGY"
          target="_blank"
          rel="noopener noreferrer"
        >
          View Source Code
        </Button>
      </Box>
    </Box>
  );
};

export default YCQConsoleDemo;