import React from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

/**
 * גרף הכנסות יומיות לחודש
 * @param {Array} props.data - מערך של נתוני הכנסות יומיים
 */
const DailyRevenueChart = ({ data }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // עיצוב גרף מותאם לתמה של המערכת
  const chartColors = {
    bar: theme.palette.primary.main,
    grid: theme.palette.divider,
    text: theme.palette.text.secondary
  };

  // פורמט מספרי לשקלים
  const formatCurrency = (value) => {
    return `₪${value.toLocaleString()}`;
  };

  // פורמט תאריכים לתצוגה
  const formatDate = (date) => {
    return new Date(date).getDate();
  };

  // מותאם אישית לטולטיפ בגרף
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: '#fff',
          padding: '10px',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '4px',
          boxShadow: theme.shadows[1]
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{data.fullDate}</p>
          <p style={{ margin: '5px 0 0' }}>
            הכנסה: <span style={{ color: chartColors.bar, fontWeight: 'bold' }}>
              {formatCurrency(data.revenue)}
            </span>
          </p>
          {data.bookings !== undefined && (
            <p style={{ margin: '5px 0 0' }}>
              הזמנות: <span style={{ fontWeight: 'bold' }}>{data.bookings}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 5,
          left: 5,
          bottom: 20
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
        <XAxis 
          dataKey="day" 
          tickFormatter={formatDate}
          stroke={chartColors.text}
          tick={{ fill: chartColors.text, fontSize: 12 }}
          axisLine={{ stroke: chartColors.grid }}
          tickLine={{ stroke: chartColors.grid }}
        />
        <YAxis 
          tickFormatter={formatCurrency}
          stroke={chartColors.text}
          tick={{ fill: chartColors.text, fontSize: 12 }}
          axisLine={{ stroke: chartColors.grid }}
          tickLine={{ stroke: chartColors.grid }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey="revenue" 
          name="הכנסה יומית" 
          fill={chartColors.bar} 
          radius={[4, 4, 0, 0]}
          animationDuration={1500}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DailyRevenueChart; 