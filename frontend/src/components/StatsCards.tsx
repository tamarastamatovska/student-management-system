import GroupsIcon from '@mui/icons-material/Groups';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Card, CardContent, Grid, Skeleton, Typography } from '@mui/material';
import type { StudentStats } from '../types/student';

interface StatsCardsProps {
  stats: StudentStats | null;
  loading: boolean;
}

const cards = [
  {
    key: 'total',
    label: 'Total Students',
    icon: GroupsIcon,
    color: '#4f46e5',
    bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
    getValue: (s: StudentStats) => s.totalStudents,
  },
  {
    key: 'majors',
    label: 'Unique Majors',
    icon: MenuBookIcon,
    color: '#7c3aed',
    bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
    getValue: (s: StudentStats) => s.uniqueMajors,
  },
  {
    key: 'enrolled',
    label: 'Active Programs',
    icon: TrendingUpIcon,
    color: '#059669',
    bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
    getValue: (s: StudentStats) => s.majors.length,
  },
] as const;

export default function StatsCards({ stats, loading }: StatsCardsProps) {
  return (
    <Grid container spacing={2.5} sx={{ mb: 3 }}>
      {cards.map(({ key, label, icon: Icon, color, bg, getValue }) => (
        <Grid key={key} size={{ xs: 12, sm: 4 }}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              background: bg,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              },
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2.5 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: `0 4px 14px ${color}40`,
                }}
              >
                <Icon />
              </Box>
              <Box>
                {loading ? (
                  <Skeleton width={60} height={36} />
                ) : (
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {stats ? getValue(stats) : 0}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {label}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
