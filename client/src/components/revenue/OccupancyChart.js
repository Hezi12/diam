import React from 'react';
import { useTheme } from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

/**
 * גרף תפוסה יומי
 * @param {Array} props.data - נתוני תפוסה יומיים
 */
const OccupancyChart = ({ data }) => {
  const theme = useTheme();

  // הגדרת צבעים לגרף
  const chartColors = {
    area: {
      fill: theme.palette.info.light,
      stroke: theme.palette.info.main,
    },
    grid: theme.palette.divider,
    text: theme.palette.text.secondary
  };

  // פורמט לאחוזים
  const formatPercent = (value) => {
    return `${value}%`;
  };

  // פורמט תאריכים
  const formatDate = (date) => {
    return new Date(date).getDate();
  };

  // טולטיפ מותאם אישית
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: '#fff',
          padding: '10px',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '4px',
          boxShadow: theme.shadows[1]
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{data.fullDate}</p>
          <p style={{ margin: '5px 0 0' }}>
            תפוסה: <span style={{ 
              color: chartColors.area.stroke, 
              fontWeight: 'bold' 
            }}>
              {formatPercent(data.occupancyRate)}
            </span>
          </p>
          {data.totalRooms && (
            <p style={{ margin: '5px 0 0' }}>
              חדרים תפוסים: <span style={{ fontWeight: 'bold' }}>
                {data.occupiedRooms} / {data.totalRooms}
              </span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={data}
        margin={{
          top: 5,
          right: 5,
          left: 5,
          bottom: 20
        }}
      >
        <defs>
          <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColors.area.fill} stopOpacity={0.8} />
            <stop offset="95%" stopColor={chartColors.area.fill} stopOpacity={0.2} />
          </linearGradient>
        </defs>
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
          tickFormatter={formatPercent}
          domain={[0, 100]}
          stroke={chartColors.text}
          tick={{ fill: chartColors.text, fontSize: 12 }}
          axisLine={{ stroke: chartColors.grid }}
          tickLine={{ stroke: chartColors.grid }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="occupancyRate" 
          name="אחוז תפוסה"
          stroke={chartColors.area.stroke} 
          fillOpacity={1} 
          fill="url(#occupancyGradient)" 
          activeDot={{ r: 6 }}
          animationDuration={1500}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default OccupancyChart; 