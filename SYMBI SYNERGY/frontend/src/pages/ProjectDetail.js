import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Box, Typography, Paper, Button, TextField, Divider, List, ListItem, ListItemText } from '@mui/material';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [buildLogs, setBuildLogs] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(`/api/projects/projects/${id}`);
        setProject(res.data.project || res.data.data || res.data?.project);
      } catch (e) {
        console.error('Failed to load project', e);
      }
    };
    fetchProject();
  }, [id]);

  useEffect(() => {
    socketRef.current = io({ auth: { token: localStorage.getItem('token') } });
    socketRef.current.emit('joinProject', id);
    socketRef.current.on('bolt:message', (evt) => {
      if (evt?.projectId === id) setMessages(prev => [...prev, evt]);
    });
    socketRef.current.on('bolt:build:update', (evt) => {
      setBuildLogs(prev => [...prev, evt]);
    });
    socketRef.current.on('bolt:knowledge:added', (evt) => {
      if (evt?.projectId === id) setMessages(prev => [...prev, { ts: new Date().toISOString(), payload: `Knowledge added: ${evt.count} item(s)`, projectId: id }]);
    });
    return () => socketRef.current?.disconnect();
  }, [id]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socketRef.current.emit('bolt:message', { projectId: id, payload: input });
    setInput('');
  };

  const addSampleKnowledge = async () => {
    try {
      await axios.post(`/api/projects/projects/${id}/knowledge`, {
        items: [
          { tag: `project:${id}:accounts`, source: 'symbi', data: { doc: 'Accounts policy v1', content: 'Reimbursement requires manager approval over $500.' } },
          { tag: `project:${id}:customer-service`, source: 'symbi', data: { doc: 'CS playbook', content: 'Escalate outages to tier-2 immediately.' } }
        ]
      });
    } catch (e) {
      console.error('Failed to add knowledge', e);
    }
  };

  const triggerBuild = async () => {
    try {
      await axios.post(`/api/projects/projects/${id}/builds`, { spec: { target: 'prototype', steps: ['lint', 'test', 'package'] } });
    } catch (e) {
      console.error('Failed to start build', e);
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>{project?.name || 'Project'}</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>{project?.description}</Typography>
      <Box display="flex" gap={2}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1">Collaboration</Typography>
          <Divider sx={{ my: 1 }} />
          <Box display="flex" gap={1}>
            <TextField fullWidth size="small" placeholder="Message" value={input} onChange={e => setInput(e.target.value)} />
            <Button variant="contained" onClick={sendMessage}>Send</Button>
          </Box>
          <List dense>
            {messages.map((m, idx) => (
              <ListItem key={idx}>
                <ListItemText primary={m.payload || m.msg || JSON.stringify(m)} secondary={new Date(m.ts || Date.now()).toLocaleTimeString()} />
              </ListItem>
            ))}
          </List>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1">Builds</Typography>
          <Divider sx={{ my: 1 }} />
          <Box display="flex" gap={1} mb={1}>
            <Button variant="outlined" onClick={addSampleKnowledge}>Add Sample Knowledge</Button>
            <Button variant="contained" onClick={triggerBuild}>Start Build</Button>
          </Box>
          <List dense>
            {buildLogs.map((l, idx) => (
              <ListItem key={idx}>
                <ListItemText primary={l.msg} secondary={`${l.level} • ${new Date(l.ts).toLocaleTimeString()}`} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    </Box>
  );
};

export default ProjectDetail;
