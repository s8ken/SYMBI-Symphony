import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Paper,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Code as CodeIcon,
  PlayArrow as PlayIcon,
  Description as DocsIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';

const IntegrationPlayground = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState(`// YCQ-Sonate API Integration Example
const YCQClient = require('ycq-sonate');

const client = new YCQClient({
  apiKey: 'your-api-key',
  endpoint: 'https://api.yseeku.com/v1'
});

async function analyzeTrust(query, context) {
  try {
    const response = await client.trust.analyze({
      query: query,
      context: context,
      includeFactors: true
    });
    
    console.log('Trust Score:', response.score);
    console.log('Factors:', response.factors);
    
    return response;
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

// Example usage
analyzeTrust(
  "How do I implement secure authentication?",
  { userRole: "developer", session: "auth-001" }
);`);
  const [response, setResponse] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const endpoints = [
    {
      name: 'Trust Analysis',
      path: '/api/v1/trust/analyze',
      method: 'POST',
      description: 'Analyze AI response trustworthiness',
      example: {
        query: "How do I implement secure authentication?",
        context: { userRole: "developer" },
        includeFactors: true
      }
    },
    {
      name: 'Conversation Metrics',
      path: '/api/v1/metrics/conversation',
      method: 'POST',
      description: 'Calculate conversation depth and resonance',
      example: {
        messages: [
          { role: "user", content: "Hello, can you help me?" },
          { role: "assistant", content: "I'd be happy to help. What do you need assistance with?" }
        ],
        includeAnalysis: true
      }
    },
    {
      name: 'Biometric Binding',
      path: '/api/v1/biometrics/sync',
      method: 'POST',
      description: 'Sync biometric data for enhanced personalization',
      example: {
        userId: "user-123",
        metrics: ["heartRate", "skinConductance"],
        timestamp: new Date().toISOString()
      }
    }
  ];

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'curl', label: 'cURL' }
  ];

  const codeTemplates = {
    javascript: `// YCQ-Sonate API Integration Example
const YCQClient = require('ycq-sonate');

const client = new YCQClient({
  apiKey: 'your-api-key',
  endpoint: 'https://api.yseeku.com/v1'
});

async function analyzeTrust(query, context) {
  const response = await client.trust.analyze({
    query: query,
    context: context,
    includeFactors: true
  });
  
  return response;
}`,

    python: `# YCQ-Sonate API Integration Example
import requests
import json

class YCQClient:
    def __init__(self, api_key, endpoint='https://api.yseeku.com/v1'):
        self.api_key = api_key
        self.endpoint = endpoint
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def analyze_trust(self, query, context):
        data = {
            'query': query,
            'context': context,
            'include_factors': True
        }
        
        response = requests.post(
            f'{self.endpoint}/api/v1/trust/analyze',
            headers=self.headers,
            json=data
        )
        
        return response.json()`,

    curl: `# YCQ-Sonate API Integration Example
curl -X POST https://api.yseeku.com/v1/api/v1/trust/analyze \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "How do I implement secure authentication?",
    "context": {"userRole": "developer"},
    "include_factors": true
  }'`
  };

  const handleExecute = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setResponse({
        score: Math.round(75 + Math.random() * 20),
        factors: [
          { name: 'Source Verification', score: 92, description: 'All sources verified' },
          { name: 'Response Consistency', score: 88, description: 'Consistent with previous responses' },
          { name: 'Safety Check', score: 95, description: 'No harmful content detected' }
        ],
        recommendation: 'High trustworthiness - safe to use'
      });
      setIsExecuting(false);
    }, 1500);
  };

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    setCode(codeTemplates[lang]);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Integration Playground
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Interactive API testing and code examples for YCQ-Sonate integration
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                  <Tab label="Code Editor" />
                  <Tab label="API Endpoints" />
                  <Tab label="Documentation" />
                </Tabs>
              </Box>

              {activeTab === 0 && (
                <Box>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Language</InputLabel>
                      <Select
                        value={selectedLanguage}
                        label="Language"
                        onChange={(e) => handleLanguageChange(e.target.value)}
                      >
                        {languages.map((lang) => (
                          <MenuItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      startIcon={<PlayIcon />}
                      onClick={handleExecute}
                      disabled={isExecuting}
                    >
                      {isExecuting ? 'Executing...' : 'Execute'}
                    </Button>
                  </Box>
                  
                  <Editor
                    height="400px"
                    language={selectedLanguage === 'curl' ? 'shell' : selectedLanguage}
                    value={code}
                    onChange={setCode}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: 'on'
                    }}
                  />
                </Box>
              )}

              {activeTab === 1 && (
                <Box>
                  {endpoints.map((endpoint, index) => (
                    <Accordion key={index} defaultExpanded={index === 0}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label={endpoint.method} 
                            color={endpoint.method === 'POST' ? 'primary' : 'secondary'}
                            size="small"
                          />
                          <Typography variant="body1">{endpoint.name}</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {endpoint.description}
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                          {endpoint.path}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
                          Example Request:
                        </Typography>
                        <pre style={{ 
                          background: '#f5f5f5', 
                          padding: '12px', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          overflow: 'auto'
                        }}>
                          {JSON.stringify(endpoint.example, null, 2)}
                        </pre>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}

              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Getting Started
                  </Typography>
                  <Typography variant="body1" paragraph>
                    The YCQ-Sonate API provides endpoints for trust analysis, conversation metrics, 
                    and biometric integration. All requests require authentication via API key.
                  </Typography>
                  
                  <Typography variant="h6" gutterBottom>
                    Authentication
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Include your API key in the Authorization header:
                  </Typography>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '12px', 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
{`Authorization: Bearer your-api-key`}
                  </pre>
                  
                  <Typography variant="h6" gutterBottom>
                    Rate Limits
                  </Typography>
                  <Typography variant="body1" paragraph>
                    • 1000 requests per hour for standard tier
                    <br />
                    • 10000 requests per hour for enterprise tier
                    <br />
                    • Real-time streaming available for high-volume applications
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Response Preview
              </Typography>
              
              {response ? (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Analysis Complete - Score: {response.score}%
                  </Alert>
                  
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    Trust Factors:
                  </Typography>
                  <List dense>
                    {response.factors.map((factor, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${factor.name}: ${factor.score}%`}
                          secondary={factor.description}
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Typography variant="body2" fontWeight="bold" sx={{ mt: 2 }}>
                    Recommendation:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {response.recommendation}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">
                  Execute code to see response
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<DocsIcon />}
                  href="https://github.com/s8ken/SYMBI-SYNERGY"
                  target="_blank"
                >
                  API Documentation
                </Button>
                <Button
                  size="small"
                  startIcon={<CodeIcon />}
                  href="https://github.com/s8ken/SYMBI-SYNERGY"
                  target="_blank"
                >
                  Source Code
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default IntegrationPlayground;