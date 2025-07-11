import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import DownloadIcon from '@mui/icons-material/Download';
import OrderBarChart from './BarChart';
import { format } from 'date-fns';
import '../styles/Reports.css';
import Sidebar from './Sidebar';

const Reports = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [reportType, setReportType] = useState('all');
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState({ text: '', severity: 'info' });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const response = await axios.get('http://192.168.100.147:5173/fetchorder', {
        headers: {
          'user-id': userId
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Fetched orders:', response.data);
        setOrders(response.data);
        if (response.data.length === 0) {
          setMessage({ text: 'No orders found', severity: 'info' });
          setShowMessage(true);
        }
      } else {
        console.error('Invalid orders data:', response.data);
        setMessage({ text: 'Invalid data received from server', severity: 'error' });
        setShowMessage(true);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
      setMessage({ text: 'Failed to fetch orders', severity: 'error' });
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders when component mounts and every 30 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const filterOrders = () => {
    let filtered = [...orders];
    
    if (startDate && endDate) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    if (reportType === 'revenue') {
      filtered = filtered.filter(order => order.amountToPay && parseFloat(order.amountToPay) > 0);
    }

    return filtered;
  };

  const calculateMetrics = (filteredOrders) => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => {
      const amount = parseFloat(order.amountToPay) || 0;
      return sum + amount;
    }, 0);
    const completedOrders = filteredOrders.filter(order => 
      order.status?.toLowerCase() === 'completed'
    ).length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Calculate service type distribution
    const serviceTypes = filteredOrders.reduce((acc, order) => {
      const type = order.serviceType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Calculate daily revenue
    const dailyRevenue = filteredOrders.reduce((acc, order) => {
      if (order.date && order.amountToPay) {
        const date = format(new Date(order.date), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + (parseFloat(order.amountToPay) || 0);
      }
      return acc;
    }, {});

    return {
      totalOrders,
      totalRevenue,
      completedOrders,
      averageOrderValue,
      serviceTypes,
      dailyRevenue
    };
  };

  const handleRefresh = () => {
    fetchOrders();
    setMessage({ text: 'Data refreshed', severity: 'success' });
    setShowMessage(true);
  };

  const downloadReport = () => {
    try {
      const filteredOrders = filterOrders();
      const metrics = calculateMetrics(filteredOrders);
      
      // Create CSV content
      let csvContent = 'Report Generated on: ' + new Date().toLocaleString() + '\n\n';
      
      // Add summary metrics
      csvContent += 'Summary Metrics\n';
      csvContent += `Total Orders,${metrics.totalOrders}\n`;
      csvContent += `Total Revenue,₱${metrics.totalRevenue.toFixed(2)}\n`;
      csvContent += `Completed Orders,${metrics.completedOrders}\n`;
      csvContent += `Average Order Value,₱${metrics.averageOrderValue.toFixed(2)}\n\n`;
      
      // Add service type distribution
      csvContent += 'Service Type Distribution\n';
      Object.entries(metrics.serviceTypes).forEach(([type, count]) => {
        csvContent += `${type},${count}\n`;
      });
      csvContent += '\n';
      
      // Add daily revenue
      csvContent += 'Daily Revenue\n';
      csvContent += 'Date,Revenue\n';
      Object.entries(metrics.dailyRevenue).forEach(([date, revenue]) => {
        csvContent += `${date},₱${revenue.toFixed(2)}\n`;
      });
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laundrotrack_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setMessage({ text: 'Report downloaded successfully', severity: 'success' });
      setShowMessage(true);
    } catch (error) {
      console.error('Error downloading report:', error);
      setMessage({ text: 'Failed to download report', severity: 'error' });
      setShowMessage(true);
    }
  };

  const filteredOrders = filterOrders();
  const metrics = calculateMetrics(filteredOrders);

  if (loading && orders.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      
      <Box component="main" sx={{ flexGrow: 1, ml: { md: '' }, overflow: 'hidden' }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Container 
            maxWidth={false} 
            className="reports-container" 
            sx={{ 
              ml: 0, 
              maxWidth: '1500px', // Set your desired width
              width: '100%',
              marginLeft: '100px'
            }}
          >
            <Box className="reports-header">
              <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                <Typography variant="h4" component="h1">
                  Analytics & Reports
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleRefresh}
                >
                  Refresh Data
                </Button>
              </Box>
              
              <Box className="reports-filters">
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{ textField: { variant: 'outlined' } }}
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{ textField: { variant: 'outlined' } }}
                />
                <FormControl>
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    label="Report Type"
                  >
                    <MenuItem value="all">All Data</MenuItem>
                    <MenuItem value="revenue">Revenue Only</MenuItem>
                    <MenuItem value="orders">Orders Only</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={downloadReport}
                >
                  Download Report
                </Button>
              </Box>
            </Box>

            <Grid container spacing={3}>
              {/* Summary Cards */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper className="metric-card">
                  <Typography variant="subtitle1" color="textSecondary">
                    Total Orders
                  </Typography>
                  <Typography variant="h4">
                    {metrics.totalOrders}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper className="metric-card">
                  <Typography variant="subtitle1" color="textSecondary">
                    Total Revenue
                  </Typography>
                  <Typography variant="h4">
                    ₱{metrics.totalRevenue.toFixed(2)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper className="metric-card">
                  <Typography variant="subtitle1" color="textSecondary">
                    Completed Orders
                  </Typography>
                  <Typography variant="h4">
                    {metrics.completedOrders}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper className="metric-card">
                  <Typography variant="subtitle1" color="textSecondary">
                    Average Order Value
                  </Typography>
                  <Typography variant="h4">
                    ₱{metrics.averageOrderValue.toFixed(2)}
                  </Typography>
                </Paper>
              </Grid>

              {/* Charts - now in one row with 3 items */}
              <Grid item xs={12} md={4}>
                <Paper className="chart-container">
                  <Typography variant="h6" gutterBottom>
                    Order Status Distribution
                  </Typography>
                  <OrderBarChart orders={filteredOrders} />
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper className="chart-container">
                  <Typography variant="h6" gutterBottom>
                    Service Type Distribution
                  </Typography>
                  <div className="service-distribution">
                    {Object.entries(metrics.serviceTypes).map(([type, count]) => (
                      <div key={type} className="service-item">
                        <Typography variant="body1">{type}</Typography>
                        <Typography variant="h6">{count}</Typography>
                        <div 
                          className="service-bar" 
                          style={{ 
                            width: `${(count / metrics.totalOrders) * 100}%` 
                          }} 
                        />
                      </div>
                    ))}
                  </div>
                </Paper>
              </Grid>

              {/* Daily Revenue Chart - now side-by-side with the other charts */}
              <Grid item xs={12} md={4}>
                <Paper className="chart-container">
                  <Typography variant="h6" gutterBottom>
                    Daily Revenue
                  </Typography>
                  <div className="daily-revenue">
                    {Object.entries(metrics.dailyRevenue).map(([date, revenue]) => (
                      <div key={date} className="revenue-item">
                        <Typography variant="body2">{format(new Date(date), 'MMM dd')}</Typography>
                        <Typography variant="body1">₱{revenue.toFixed(2)}</Typography>
                        <div 
                          className="revenue-bar" 
                          style={{ 
                            height: `${(revenue / Math.max(...Object.values(metrics.dailyRevenue))) * 100}%` 
                          }} 
                        />
                      </div>
                    ))}
                  </div>
                </Paper>
              </Grid>
            </Grid>

            <Snackbar
              open={showMessage}
              autoHideDuration={6000}
              onClose={() => setShowMessage(false)}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Alert onClose={() => setShowMessage(false)} severity={message.severity}>
                {message.text}
              </Alert>
            </Snackbar>
          </Container>
        </LocalizationProvider>
      </Box>
    </Box>
  );
};

export default Reports;