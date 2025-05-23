import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  ListSubheader,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { useThemeContext, TreeBackgroundOption, treeBackgroundConfigs } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  showBackgroundSelector?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  showBackgroundSelector = false 
}) => {
  const { themeMode, toggleTheme, treeBackground, setTreeBackground } = useThemeContext();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleBackgroundChange = (background: TreeBackgroundOption) => {
    setTreeBackground(background);
    handleMenuClose();
  };

  const getBackgroundPreview = (bg: TreeBackgroundOption) => {
    const config = treeBackgroundConfigs[bg];
    if (config.backgroundImage && config.backgroundImage !== 'none') {
      return (
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: 1,
            backgroundImage: `url(${config.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid',
            borderColor: 'divider',
            mr: 1,
          }}
        />
      );
    }
    return (
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: 1,
          backgroundColor: config.backgroundColor,
          border: '1px solid',
          borderColor: 'divider',
          mr: 1,
        }}
      />
    );
  };

  if (!showBackgroundSelector) {
    // Simple theme toggle
    return (
      <Tooltip title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}>
        <IconButton
          onClick={toggleTheme}
          sx={{
            color: 'inherit',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.1)',
            },
          }}
        >
          {themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
      </Tooltip>
    );
  }

  // Advanced theme controls with background selector
  return (
    <>
      <Tooltip title="Theme & Display Settings">
        <IconButton
          onClick={handleMenuOpen}
          sx={{
            color: 'inherit',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.1)',
            },
          }}
        >
          <SettingsIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 280,
            maxWidth: 320,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            '& .MuiMenuItem-root': {
              borderRadius: 1,
              mx: 1,
              my: 0.5,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <ListSubheader
          sx={{
            bgcolor: 'transparent',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <PaletteIcon fontSize="small" />
          Theme Settings
        </ListSubheader>

        <MenuItem>
          <FormControlLabel
            control={
              <Switch
                checked={themeMode === 'dark'}
                onChange={toggleTheme}
                size="small"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {themeMode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
                <Typography variant="body2">
                  {themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </Typography>
              </Box>
            }
            sx={{ width: '100%', m: 0 }}
          />
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        <ListSubheader
          sx={{
            bgcolor: 'transparent',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          Tree Background
        </ListSubheader>

        {Object.entries(treeBackgroundConfigs).map(([key, config]) => (
          <MenuItem
            key={key}
            onClick={() => handleBackgroundChange(key as TreeBackgroundOption)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getBackgroundPreview(key as TreeBackgroundOption)}
              <Typography variant="body2">{config.name}</Typography>
            </Box>
            {treeBackground === key && (
              <Chip
                label="Active"
                size="small"
                color="primary"
                sx={{ height: 20, fontSize: '0.75rem' }}
              />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ThemeToggle; 