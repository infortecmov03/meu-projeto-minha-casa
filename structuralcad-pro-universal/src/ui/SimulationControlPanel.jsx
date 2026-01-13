import React, { useState, useRef } from 'react';
import {
  Paper, Grid, Typography, Button, IconButton,
  Slider, Card, CardContent, Box, Chip,
  LinearProgress, SpeedDial, SpeedDialAction,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, List, ListItem, ListItemIcon,
  ListItemText, Divider, Switch, FormControlLabel,
  TextField, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import {
  PlayArrow, Pause, Stop, SkipNext, SkipPrevious,
  Speed, Timeline, Construction, Engineering,
  Videocam, CameraAlt, DirectionsWalk, Build,
  FastForward, FastRewind, Settings, Save,
  Download, Share, ZoomIn, ZoomOut, RotateLeft
} from '@mui/icons-material';

const SimulationControlPanel = ({ simulator }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [cameraMode, setCameraMode] = useState('free');
  const [recording, setRecording] = useState(false);
  const [showWorkers, setShowWorkers] = useState(true);
  const [showEquipment, setShowEquipment] = useState(true);
  const [showMaterials, setShowMaterials] = useState(true);

  const phases = simulator?.phases || [];

  const handlePlayPause = () => {
    if (isPlaying) {
      simulator.pause();
    } else {
      simulator.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSpeedChange = (event, newValue) => {
    setSpeed(newValue);
    simulator.setSpeed(newValue);
  };

  const handlePhaseSelect = (phaseIndex) => {
    setCurrentPhase(phaseIndex);
    simulator.jumpToPhase(phaseIndex);
  };

  const handleExportVideo = async () => {
    const videoBlob = await simulator.exportSimulationVideo();
    
    // Criar download link
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulacao_construcao_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Paper sx={{ p: 2, position: 'absolute', bottom: 20, left: 20, right: 20 }}>
      <Grid container spacing={2} alignItems="center">
        {/* Controles de reprodução */}
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => simulator.jumpToPhase(currentPhase - 1)}>
              <SkipPrevious />
            </IconButton>
            
            <IconButton 
              onClick={handlePlayPause}
              color="primary"
              sx={{ width: 56, height: 56 }}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
            
            <IconButton onClick={() => simulator.jumpToPhase(currentPhase + 1)}>
              <SkipNext />
            </IconButton>
            
            <IconButton onClick={() => simulator.stop()}>
              <Stop />
            </IconButton>
          </Box>
        </Grid>
        
        {/* Controle de velocidade */}
        <Grid item xs={12} md={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Speed />
            <Typography variant="body2">
              {speed.toFixed(1)}x
            </Typography>
            <Slider
              value={speed}
              onChange={handleSpeedChange}
              min={0.1}
              max={10}
              step={0.1}
              size="small"
              sx={{ width: 100 }}
            />
          </Box>
        </Grid>
        
        {/* Progresso da fase */}
        <Grid item xs={12} md={3}>
          <Box>
            <Typography variant="caption" color="textSecondary">
              {phases[currentPhase]?.name || 'Nenhuma fase'}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={simulator?.getPhaseProgress() || 0}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Grid>
        
        {/* Informações do projeto */}
        <Grid item xs={12} md={2}>
          <Chip 
            icon={<Construction />}
            label={`Fase ${currentPhase + 1}/${phases.length}`}
            color="primary"
            variant="outlined"
          />
        </Grid>
        
        {/* Ações rápidas */}
        <Grid item xs={12} md={2}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              color={recording ? 'error' : 'default'}
              onClick={() => {
                setRecording(!recording);
                if (!recording) {
                  simulator.startRecording();
                } else {
                  simulator.stopRecording();
                }
              }}
            >
              <Videocam />
            </IconButton>
            
            <IconButton onClick={handleExportVideo}>
              <Download />
            </IconButton>
            
            <IconButton>
              <Share />
            </IconButton>
          </Box>
        </Grid>
      </Grid>
      
      {/* Timeline das fases */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Fases da Construção
        </Typography>
        
        <Box sx={{ display: 'flex', overflowX: 'auto', gap: 1, pb: 1 }}>
          {phases.map((phase, index) => (
            <Card 
              key={phase.id}
              sx={{ 
                minWidth: 150, 
                cursor: 'pointer',
                bgcolor: index === currentPhase ? 'primary.light' : 'background.paper',
                color: index === currentPhase ? 'primary.contrastText' : 'text.primary'
              }}
              onClick={() => handlePhaseSelect(index)}
            >
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="caption" display="block">
                  Fase {index + 1}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {phase.name}
                </Typography>
                <Typography variant="caption">
                  {phase.duration} dias
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
      
      {/* Controles avançados */}
      <SpeedDial
        ariaLabel="Controles avançados"
        sx={{ position: 'absolute', top: -56, right: 0 }}
        icon={<Settings />}
      >
        <SpeedDialAction
          icon={<DirectionsWalk />}
          tooltipTitle="Modo Caminhar"
          onClick={() => setCameraMode('walk')}
        />
        <SpeedDialAction
          icon={<CameraAlt />}
          tooltipTitle="Modo Câmera Livre"
          onClick={() => setCameraMode('free')}
        />
        <SpeedDialAction
          icon={<Engineering />}
          tooltipTitle="Mostrar/Ocultar Trabalhadores"
          onClick={() => setShowWorkers(!showWorkers)}
        />
        <SpeedDialAction
          icon={<Build />}
          tooltipTitle="Mostrar/Ocultar Equipamentos"
          onClick={() => setShowEquipment(!showEquipment)}
        />
      </SpeedDial>
    </Paper>
  );
};