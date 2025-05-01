import React, { useState } from 'react';
import { useTheme, Box, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
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
 * גרף פילוח הכנסות לפי חדרים
 * @param {Array} props.data - נתוני הכנסות לפי חדרים
 */
const RoomRevenueChart = ({ data }) => {
  const theme = useTheme();
  const [viewType, setViewType] = useState('byRoom'); // byRoom או byType

  // הגדרת צבעים לגרף
  const chartColors = {
    bar: theme.palette.secondary.main,
    grid: theme.palette.divider,
    text: theme.palette.text.secondary
  };

  // פורמט מספרי לשקלים
  const formatCurrency = (value) => {
    return `₪${value?.toLocaleString() || 0}`;
  };

  // טיפול בשינוי סוג התצוגה
  const handleViewTypeChange = (event, newViewType) => {
    if (newViewType !== null) {
      setViewType(newViewType);
    }
  };

  // טולטיפ מותאם אישית
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#fff',
          padding: '10px',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '4px',
          boxShadow: theme.shadows[1]
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>
            {viewType === 'byRoom' ? `חדר ${label}` : label}
          </p>
          <p style={{ margin: '5px 0 0' }}>
            הכנסה: <span style={{ 
              color: chartColors.bar, 
              fontWeight: 'bold' 
            }}>
              {formatCurrency(payload[0].value)}
            </span>
          </p>
          {payload[0].payload.bookings !== undefined && (
            <p style={{ margin: '5px 0 0' }}>
              הזמנות: <span style={{ fontWeight: 'bold' }}>
                {payload[0].payload.bookings}
              </span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // מיין את הנתונים לפי הכנסה (מהגבוה לנמוך)
  const sortedData = [...(viewType === 'byRoom' ? data.byRoom : data.byType)]
    .sort((a, b) => b.revenue - a.revenue);

  // אם אין נתונים, מציג הודעה
  if (!data || ((!data.byRoom || data.byRoom.length === 0) && (!data.byType || data.byType.length === 0))) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography>אין נתונים זמינים</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
        <ToggleButtonGroup
          value={viewType}
          exclusive
          onChange={handleViewTypeChange}
          size="small"
          sx={{ direction: 'ltr' }}
        >
          <ToggleButton value="byRoom">
            לפי חדר
          </ToggleButton>
          <ToggleButton value="byType">
            לפי סוג
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{
            top: 5,
            right: 5,
            left: 40,
            bottom: 5
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={true} />
          <XAxis
            type="number"
            tickFormatter={formatCurrency}
            stroke={chartColors.text}
            tick={{ fill: chartColors.text, fontSize: 12 }}
            axisLine={{ stroke: chartColors.grid }}
            tickLine={{ stroke: chartColors.grid }}
          />
          <YAxis
            type="category"
            dataKey={viewType === 'byRoom' ? 'roomNumber' : 'roomType'}
            stroke={chartColors.text}
            tick={{ fill: chartColors.text, fontSize: 12 }}
            axisLine={{ stroke: chartColors.grid }}
            tickLine={{ stroke: chartColors.grid }}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="revenue"
            name="הכנסה"
            fill={chartColors.bar}
            radius={[0, 4, 4, 0]}
            animationDuration={1500}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default RoomRevenueChart; 