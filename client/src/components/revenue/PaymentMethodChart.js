import React from 'react';
import { useTheme, Box, Typography } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getPaymentMethodName } from '../../constants/paymentMethods';

/**
 * גרף פילוח הכנסות לפי אמצעי תשלום
 * @param {Array} props.data - נתוני פילוח אמצעי תשלום
 */
const PaymentMethodChart = ({ data }) => {
  const theme = useTheme();

  // צבעים לגרף העוגה
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];

  // פורמט מספרי לשקלים
  const formatCurrency = (value) => {
    return `₪${value.toLocaleString()}`;
  };

  // שימוש בפונקציה המרכזית לתרגום שמות אמצעי תשלום

  // טולטיפ מותאם אישית
  const CustomTooltip = ({ active, payload }) => {
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
          <p style={{ margin: 0, fontWeight: 'bold', color: payload[0].color }}>
            {getPaymentMethodName(data.name)}
          </p>
          <p style={{ margin: '5px 0 0' }}>
            סכום: <span style={{ fontWeight: 'bold' }}>
              {formatCurrency(data.value)}
            </span>
          </p>
          <p style={{ margin: '5px 0 0' }}>
            אחוז: <span style={{ fontWeight: 'bold' }}>
              {data.percent}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  // רנדור תווית בתוך גרף העוגה
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // רק תוויות לפלחים גדולים מספיק
    if (percent < 0.05) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="white"
        textAnchor="middle" 
        dominantBaseline="central"
        fontWeight="bold"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // רנדור של לגנדה מותאמת אישית
  const CustomLegend = ({ payload }) => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', mt: 2 }}>
        {payload.map((entry, index) => (
          <Box 
            key={`legend-${index}`} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 0.5,
              direction: 'rtl'
            }}
          >
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                backgroundColor: entry.color,
                borderRadius: '50%',
                ml: 1
              }} 
            />
            <Typography variant="body2" sx={{ ml: 'auto' }}>
              {getPaymentMethodName(entry.value)}
            </Typography>
            <Typography variant="body2" sx={{ ml: 2, fontWeight: 'bold' }}>
              {formatCurrency(entry.payload.value)}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  // אם אין נתונים, מציג הודעה
  if (!data || data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography>אין נתונים זמינים</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 300, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            animationDuration={1500}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default PaymentMethodChart; 