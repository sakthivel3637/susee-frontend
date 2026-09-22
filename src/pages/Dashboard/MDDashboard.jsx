import { Grid, Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, Divider } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Briefcase, Users, Car, ClipboardList, IndianRupee } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import { useMdDashboard } from '../../queries/useDataQueries';
import Loader from '../../components/common/Loader';

export default function MDDashboard() {
  const [timeRange, setTimeRange] = useState('Today');
  const navigate = useNavigate();

  const timeFrameMap = {
    'Today': 'today',
    'This Week': 'this_week',
    'This Month': 'this_month',
    'All Time': 'all_time'
  };

  const { data: dashboardData, isLoading } = useMdDashboard({ timeframe: timeFrameMap[timeRange] });

  const data = dashboardData || {};
  const kpis = data.kpis || {};
  const dailyThroughput = data.dailyThroughput || [];
  const statusMix = data.statusMix || [];
  const departmentPerformance = data.departmentPerformance || [];
  const revenueBreakdown = data.revenueBreakdown || { items: [], todaysTotal: 0 };

  const BAR_CHART_DATA = dailyThroughput.map(d => ({ name: d.day, Vehicles: d.count }));
  const COLORS = ['#10B981', '#2563EB', '#8B5CF6', '#06B6D4', '#F59E0B', '#EF4444', '#6B7280'];
  const PIE_CHART_DATA = statusMix.map((s, i) => ({
    name: s.statusName,
    value: s.count,
    color: COLORS[i % COLORS.length]
  }));

  const deptIcons = {
    'Mechanical': '🔧 Mechanical',
    'Body Shop': '🔨 Body Shop',
    'Water Wash': '💧 Water Wash',
    'Job Card': '📋 Job Card',
    'Parts & Materials': '📋 Parts & Materials'
  };

  const DEPARTMENT_DATA = departmentPerformance.map(d => ({
    ...d,
    dept: deptIcons[d.department] || d.department
  }));

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#F0F4FF', minHeight: '100%' }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={800} color="#1E293B">
          Managing Director Dashboard
        </Typography>
        <Select
          size="small"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          sx={{
            minWidth: 150,
            bgcolor: 'white',
            borderRadius: 2,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' }
          }}
        >
          {Object.keys(timeFrameMap).map((key) => (
            <MenuItem key={key} value={key}>{key}</MenuItem>
          ))}
        </Select>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Loader text="Loading dashboard data..." size="lg" />
        </Box>
      ) : (
        <>
          {/* KPI Cards Row */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Card 1: Total Vehicles */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', borderTop: '4px solid #2563EB', height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h4" fontWeight={800} color="#1E3A8A">{kpis.totalVehicles?.value || 0}</Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 1, mt: 0.5 }}>Total Vehicles</Typography>
                    </Box>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(30, 58, 138, 0.08)', color: '#1E3A8A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Car size={20} />
                    </Box>
                  </Box>
                  <Typography variant="caption" fontWeight={700} color="#10B981" sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUp size={14} className="mr-1" /> {kpis.totalVehicles?.comparison || '+3 vs yesterday'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Card 2: Total Job Cards */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', borderTop: '4px solid #10B981', height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h4" fontWeight={800} color="#065F46">{kpis.totalJobCards?.value || 0}</Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 1, mt: 0.5 }}>Total Job Cards</Typography>
                    </Box>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(6, 95, 70, 0.08)', color: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ClipboardList size={20} />
                    </Box>
                  </Box>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    {kpis.totalJobCards?.comparison || 'Active in system'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Card 3: Total Revenue */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', borderTop: '4px solid #DB2777', height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h4" fontWeight={800} color="#BE185D">
                        ₹{kpis.totalRevenue?.value > 100000 ? (kpis.totalRevenue.value / 100000).toFixed(1) + 'L' : kpis.totalRevenue?.value || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 1, mt: 0.5 }}>Total Revenue</Typography>
                    </Box>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(190, 24, 93, 0.08)', color: '#BE185D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IndianRupee size={20} />
                    </Box>
                  </Box>
                  <Typography variant="caption" fontWeight={700} color="#10B981" sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUp size={14} className="mr-1" /> {kpis.totalRevenue?.comparison || '+12% vs avg'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Card 4: Total Users */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  borderTop: '4px solid #13323a',
                  height: '100%',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(ROUTES.ADMIN_USERS)}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h4" fontWeight={800} color="#13323a">{kpis.totalUsers?.value || 0}</Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 1, mt: 0.5 }}>Total Users</Typography>
                    </Box>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(19, 50, 58, 0.08)', color: '#13323a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={20} />
                    </Box>
                  </Box>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    {kpis.totalUsers?.comparison || 'Manage platform users'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Middle Row */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', mb: 3, display: 'block' }}>
                    Daily Vehicle Entries — Last 7 Days
                  </Typography>
                  <Box sx={{ height: 200, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={BAR_CHART_DATA} margin={{ top: 0, right: 0, bottom: 0, left: -40 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <RechartsTooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                        <Bar dataKey="Vehicles" radius={[4, 4, 0, 0]}>
                          {BAR_CHART_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === 'Today' ? '#2563EB' : '#BFDBFE'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2, display: 'block' }}>
                    Status Mix
                  </Typography>
                  {PIE_CHART_DATA.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: { xs: 150, sm: 200 }, width: '100%' }}>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>No Job Cards found for this timeframe.</Typography>
                    </Box>
                  ) : (
                    <Box sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center',
                      height: { xs: 'auto', sm: 200 },
                      gap: { xs: 2, sm: 0 }
                    }}>
                      <Box sx={{ width: { xs: '100%', sm: '45%' }, height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={PIE_CHART_DATA}
                              innerRadius={45}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="value"
                              stroke="none"
                            >
                              {PIE_CHART_DATA.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                      <Box sx={{ width: { xs: '100%', sm: '55%' }, display: 'flex', flexDirection: 'column', gap: 1, pl: { xs: 0, sm: 2 } }}>
                        {PIE_CHART_DATA.map((item, i) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: item.color }} />
                            <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ fontSize: '0.8rem' }}>
                              {item.name} ({item.value})
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Bottom Row */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', height: '100%' }}>
                <CardContent sx={{ p: 3, pb: '16px !important' }}>
                  <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2, display: 'block' }}>
                    Department Performance
                  </Typography>
                  {DEPARTMENT_DATA.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 150, width: '100%' }}>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>No work assignments found for this timeframe.</Typography>
                    </Box>
                  ) : (
                    <TableContainer sx={{ overflowX: 'auto' }}>
                      <Table size="small" sx={{ minWidth: 400 }}>
                        <TableHead sx={{ bgcolor: 'transparent' }}>
                          <TableRow>
                            <TableCell sx={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 700, px: 0, py: 1.5, borderBottom: '1px solid #E2E8F0', bgcolor: 'transparent' }}>DEPARTMENT</TableCell>
                            <TableCell sx={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 700, py: 1.5, borderBottom: '1px solid #E2E8F0', bgcolor: 'transparent' }}>ACTIVE</TableCell>
                            <TableCell sx={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 700, py: 1.5, borderBottom: '1px solid #E2E8F0', bgcolor: 'transparent' }}>QUEUE</TableCell>
                            <TableCell sx={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 700, py: 1.5, borderBottom: '1px solid #E2E8F0', bgcolor: 'transparent' }}>DONE</TableCell>
                            <TableCell sx={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 700, py: 1.5, borderBottom: '1px solid #E2E8F0', bgcolor: 'transparent' }}>AVG TIME</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {DEPARTMENT_DATA.map((row, i) => (
                            <TableRow key={i} sx={{ '& td': { borderBottom: '1px solid #F1F5F9', py: 1.5 } }}>
                              <TableCell sx={{ px: 0, color: '#2563EB', fontWeight: 600, fontSize: '0.8rem', bgcolor: 'transparent' }}>{row.dept}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', bgcolor: 'transparent' }}>{row.active}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', bgcolor: 'transparent' }}>{row.queue}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', bgcolor: 'transparent' }}>{row.done}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', bgcolor: 'transparent' }}>{row.avgTime}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', mb: 3, display: 'block' }}>
                    Revenue Breakdown
                  </Typography>

                  {revenueBreakdown.items.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 150, width: '100%' }}>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>No revenue data found for this timeframe.</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                      {revenueBreakdown.items.map((item, i) => (
                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="#475569" fontWeight={500}>{deptIcons[item.category] || item.category}</Typography>
                          <Typography variant="body2" color="#10B981" fontWeight={700}>₹{item.amount.toLocaleString()}</Typography>
                        </Box>
                      ))}
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" fontWeight={800} color="#1E293B">Total Revenue</Typography>
                    <Typography variant="h6" fontWeight={800} color="#2563EB">₹{revenueBreakdown.todaysTotal.toLocaleString()}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
