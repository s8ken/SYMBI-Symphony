import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Paper, TextField, Button, List, ListItem, ListItemText, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/api/projects/projects');
      setProjects(res.data.projects || res.data.data || res.data.projects || res.data?.projects || res.data?.projects);
      // Normalize when controller returns { success, projects }
      if (res.data && res.data.success && Array.isArray(res.data.projects)) {
        setProjects(res.data.projects);
      }
    } catch (e) {
      console.error('Failed to load projects', e);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const createProject = async () => {
    if (!name.trim()) return;
    try {
      setLoading(true);
      const res = await axios.post('/api/projects/projects', { name, description });
      setName('');
      setDescription('');
      setLoading(false);
      fetchProjects();
      const id = res.data?.project?._id || res.data?.data?._id;
      if (id) navigate(`/projects/${id}`);
    } catch (e) {
      console.error('Failed to create project', e);
      setLoading(false);
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>Projects</Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Create Project</Typography>
        <Box display="flex" gap={2}>
          <TextField label="Name" value={name} onChange={e => setName(e.target.value)} size="small" />
          <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)} size="small" sx={{ flex: 1 }} />
          <Button variant="contained" onClick={createProject} disabled={loading}>Create</Button>
        </Box>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Your Projects</Typography>
        <Divider sx={{ mb: 1 }} />
        <List>
          {projects.map(p => (
            <ListItem key={p._id} button onClick={() => navigate(`/projects/${p._id}`)}>
              <ListItemText primary={p.name} secondary={p.description} />
            </ListItem>
          ))}
          {projects.length === 0 && (
            <Typography variant="body2" color="text.secondary">No projects yet.</Typography>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default Projects;
