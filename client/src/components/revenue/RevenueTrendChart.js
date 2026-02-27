import React from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

/**
 * גרף מגמות והשוואה לחודשים קודמים
 * @param {Object} props.data - נתוני השוואה לחודשים קודמים 
 */
const RevenueTrendChart = ({ data }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // קביעת צבעים לגרף מתוך התמה
  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.error.main
  ];

  // שאר הגדרות צבעים
  const chartColors = {
    grid: theme.palette.divider,
    text: theme.palette.text.secondary,
    reference: theme.palette.action.disabled,
  };

  // פורמט תאריכים לתצוגה
  const formatDay = (day) => {
    return day;
  };

  // פורמט מספרי לשקלים
  const formatCurrency = (value) => {
    return `₪${value?.toLocaleString() || 0}`;
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
          <p style={{ margin: 0, fontWeight: 'bold' }}>יום {label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              margin: '5px 0 0', 
              color: entry.color,
            }}>
              {entry.name}: <span style={{ fontWeight: 'bold' }}>
                {formatCurrency(entry.value)}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // מחשב את היום הנוכחי בחודש הנוכחי
  const currentDay = data.currentMonthDay;

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
      <LineChart
        data={data.byDay}
        margin={{
          top: 10,
          right: 10,
          left: 10,
          bottom: 20
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
        <XAxis 
          dataKey="day" 
          tickFormatter={formatDay}
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
        
        {/* קו אנכי המסמן את היום הנוכחי */}
        {currentDay && (
          <ReferenceLine 
            x={currentDay} 
            stroke={chartColors.reference} 
            strokeDasharray="3 3" 
            label={{ 
              value: 'היום', 
              position: 'insideBottomRight',
              fill: chartColors.text,
              fontSize: 12
            }} 
          />
        )}

        {/* קו לכל חודש */}
        {data.months.map((month, index) => (
          <Line
            key={month}
            type="monotone"
            dataKey={month}
            name={month}
            stroke={colors[index % colors.length]}
            activeDot={{ r: 6 }}
            strokeWidth={2}
            dot={{ fill: colors[index % colors.length], r: 4 }}
            animationDuration={1500}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RevenueTrendChart; 