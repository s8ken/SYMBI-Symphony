import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  TrendingUp,
  Shield,
  CheckCircle,
  Warning,
  Error,
  Timeline,
  Speed,
  Visibility
} from '@mui/icons-material';

const TrustScoringDemo = () => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [liveScores, setLiveScores] = useState([]);
  const [currentRequest, setCurrentRequest] = useState({
    id: 'req_001',
    query: 'How do I implement secure authentication?',
    user: 'developer@company.com',
    timestamp: new Date().toISOString(),
    scores: {
      transparency: 92,
      reliability: 88,
      accuracy: 95,
      safety: 91,
      overall: 91
    },
    factors: [
      { name: 'Source Verification', score: 95, weight: 0.3 },
      { name: 'Response Consistency', score: 88, weight: 0.25 },
      { name: 'Safety Check', score: 91, weight: 0.2 },
      { name: 'Transparency Level', score: 92, weight: 0.15 },
      { name: 'Performance Speed', score: 89, weight: 0.1 }
    ]
  });

  const mockRequests = [
    {
      id: 'req_001',
      query: 'How do I implement secure authentication?',
      user: 'developer@company.com',
      timestamp: new Date().toISOString(),
      scores: {
        transparency: 92,
        reliability: 88,
        accuracy: 95,
        safety: 91,
        overall: 91
      }
    },
    {
      id: 'req_002',
      query: 'What are the best practices for data privacy?',
      user: 'admin@company.com',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      scores: {
        transparency: 89,
        reliability: 94,
        accuracy: 97,
        safety: 96,
        overall: 94
      }
    },
    {
      id: 'req_003',
      query: 'Explain machine learning bias detection',
      user: 'analyst@company.com',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      scores: {
        transparency: 85,
        reliability: 90,
        accuracy: 93,
        safety: 88,
        overall: 89
      }
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time score updates
      setLiveScores(prev => {
        const newScore = {
          timestamp: new Date().toLocaleTimeString(),
          transparency: Math.round(85 + Math.random() * 15),
          reliability: Math.round(85 + Math.random() * 15),
          accuracy: Math.round(90 + Math.random() * 10),
          safety: Math.round(88 + Math.random() * 12),
          overall: Math.round(87 + Math.random() * 13)
        };
        return [...prev.slice(-19), newScore];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (score) => {
    if (score >= 90) return '#4caf50';
    if (score >= 80) return '#ff9800';
    return '#f44336';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    return 'Needs Improvement';
  };

  const getScoreIcon = (score) => {
    if (score >= 90) return <CheckCircle sx={{ color: 'success.main' }} />;
    if (score >= 80) return <Warning sx={{ color: 'warning.main' }} />;
    return <Error sx={{ color: 'error.main' }} />;
  };

  const handleRequestClick = (request) => {
    setSelectedRequest(request);
    setOpenDialog(true);
  };

  const ScoreCard = ({ title, score, icon }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" sx={{ color: getScoreColor(score) }}>
          {score}%
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {getScoreLabel(score)}
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={score} 
          sx={{ mt: 2, height: 8, borderRadius: 4, 
            '& .MuiLinearProgress-bar': { 
              backgroundColor: getScoreColor(score) 
            } 
          }} 
        />
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Trust Scoring Engine Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Live demonstration of real-time AI trustworthiness evaluation using the SYMBI framework
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ScoreCard 
            title="Overall Trust Score" 
            score={currentRequest.scores.overall} 
            icon={<TrendingUp />}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <ScoreCard 
            title="Safety Score" 
            score={currentRequest.scores.safety} 
            icon={<Shield />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={3}>
          <ScoreCard 
            title="Transparency" 
            score={currentRequest.scores.transparency} 
            icon={<Visibility />}
          />
        </Grid>
        
        <Grid item xs={12} md={3}>
          <ScoreCard 
            title="Reliability" 
            score={currentRequest.scores.reliability} 
            icon={<Timeline />}
          />
        </Grid>
        
        <Grid item xs={12} md={3}>
          <ScoreCard 
            title="Accuracy" 
            score={currentRequest.scores.accuracy} 
            icon={<CheckCircle />}
          />
        </Grid>
        
        <Grid item xs={12} md={3}>
          <ScoreCard 
            title="Performance" 
            score={88} 
            icon={<Speed />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Requests Analysis
              </Typography>
              <List>
                {mockRequests.map((request) => (
                  <ListItem
                    key={request.id}
                    button
                    onClick={() => handleRequestClick(request)}
                    divider
                  >
                    <ListItemIcon>
                      {getScoreIcon(request.scores.overall)}
                    </ListItemIcon>
                    <ListItemText
                      primary={request.query}
                      secondary={`User: ${request.user} | Score: ${request.scores.overall}%`}
                    />
                    <Chip 
                      label={getScoreLabel(request.scores.overall)} 
                      color={request.scores.overall >= 90 ? 'success' : request.scores.overall >= 80 ? 'warning' : 'error'}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Scoring Factors
              </Typography>
              <List dense>
                {currentRequest.factors.map((factor, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={factor.name}
                      secondary={`${factor.score}% (weight: ${(factor.weight * 100).toFixed(0)}%)`}
                    />
                    <LinearProgress 
                      variant="determinate" 
                      value={factor.score} 
                      sx={{ width: 60, height: 6, borderRadius: 3 }}
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
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>Real-time Evaluation:</strong> Live scoring of AI responses based on multiple trust dimensions
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>Transparent Scoring:</strong> Clear breakdown of factors contributing to trust scores
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>Historical Tracking:</strong> Continuous monitoring and trend analysis
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>Enterprise Integration:</strong> Scalable for large-scale AI deployments
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Request Analysis Details
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Query:</strong> {selectedRequest.query}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>User:</strong> {selectedRequest.user}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Timestamp:</strong> {new Date(selectedRequest.timestamp).toLocaleString()}
              </Typography>
              
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Detailed Scoring
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(selectedRequest.scores).map(([key, value]) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {key}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ color: getScoreColor(value), mr: 1 }}>
                          {value}%
                        </Typography>
                        {getScoreIcon(value)}
                      </Box>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={value} 
                      sx={{ mt: 1, height: 6, borderRadius: 3 }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          href="https://github.com/s8ken/SYMBI-SYNERGY"
          target="_blank"
          rel="noopener noreferrer"
        >
          View Implementation
        </Button>
      </Box>
    </Box>
  );
};

export default TrustScoringDemo;