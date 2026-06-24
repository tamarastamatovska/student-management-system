import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
} from '@mui/material';

interface StudentToolbarProps {
  search: string;
  major: string;
  majors: string[];
  onSearchChange: (value: string) => void;
  onMajorChange: (value: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  onAdd: () => void;
  refreshing: boolean;
  resultCount: number;
}

export default function StudentToolbar({
  search,
  major,
  majors,
  onSearchChange,
  onMajorChange,
  onRefresh,
  onExport,
  onAdd,
  refreshing,
  resultCount,
}: StudentToolbarProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        alignItems: 'center',
      }}
    >
      <TextField
        size="small"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ flex: '1 1 220px', minWidth: 200 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          },
        }}
      />

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Major</InputLabel>
        <Select value={major} label="Major" onChange={(e) => onMajorChange(e.target.value)}>
          <MenuItem value="">All majors</MenuItem>
          {majors.map((m) => (
            <MenuItem key={m} value={m}>
              {m}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
        <Box component="span" sx={{ typography: 'body2', color: 'text.secondary', mr: 1 }}>
          {resultCount} student{resultCount !== 1 ? 's' : ''}
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={onRefresh} disabled={refreshing} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export to CSV">
          <IconButton onClick={onExport} size="small" disabled={resultCount === 0}>
            <DownloadIcon />
          </IconButton>
        </Tooltip>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
          Add Student
        </Button>
      </Box>
    </Paper>
  );
}
