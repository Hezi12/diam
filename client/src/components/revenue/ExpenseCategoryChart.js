import React from 'react';
import { useTheme, useMediaQuery, Box, Typography } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

/**
 * גרף פילוח הוצאות לפי קטגוריה
 * @param {Array} props.data - נתוני הוצאות
 */
const ExpenseCategoryChart = ({ data }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // עיבוד הנתונים - קיבוץ לפי קטגוריה
  const prepareData = () => {
    const categoryMap = {};
    
    // סיכום הוצאות לפי קטגוריה
    data.forEach(expense => {
      const category = expense.category || 'אחר';
      if (!categoryMap[category]) {
        categoryMap[category] = {
          name: category,
          value: 0,
          count: 0
        };
      }
      categoryMap[category].value += expense.amount;
      categoryMap[category].count += 1;
    });
    
    // המרה למערך והוספת אחוזים
    const result = Object.values(categoryMap);
    const total = result.reduce((sum, item) => sum + item.value, 0);
    
    // חישוב אחוזים
    result.forEach(item => {
      item.percent = Math.round((item.value / total) * 100);
    });
    
    // מיון לפי סכום (מהגבוה לנמוך)
    return result.sort((a, b) => b.value - a.value);
  };

  // הנתונים המעובדים
  const chartData = prepareData();

  // צבעים לגרף העוגה
  const COLORS = [
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    '#9c27b0', // purple
    '#795548', // brown
    '#607d8b', // blue grey
    '#009688', // teal
    '#ff5722', // deep orange
    '#673ab7'  // deep purple
  ];

  // פורמט מספרי לשקלים
  const formatCurrency = (value) => {
    return `₪${value.toLocaleString()}`;
  };

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
            {data.name}
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
          <p style={{ margin: '5px 0 0' }}>
            מספר הוצאות: <span style={{ fontWeight: 'bold' }}>
              {data.count}
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
              {entry.value}
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
    <Box sx={{ height: isMobile ? 220 : 300, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={isMobile ? 60 : 80}
            fill="#8884d8"
            dataKey="value"
            animationDuration={1500}
          >
            {chartData.map((entry, index) => (
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

export default ExpenseCategoryChart; 