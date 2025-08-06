import React, { useState } from 'react';

interface CustomDatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  selected?: Date;
  className?: string;
}

const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function getWeeks(year: number, month: number) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDay).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, selected }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(selected || value || new Date()));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const weeks = getWeeks(year, month);

  // Format date as dd-mmm-yyyy
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%' }}>
             <input
         type="text"
         value={formatDate(selected || value || new Date())}
         readOnly
         onClick={() => setShowCalendar((v) => !v)}
         className="date-picker-input"
        style={{
          cursor: 'pointer',
          width: '120px',
          background: '#111',
          color: '#fff',
          borderRadius: 16,
          border: '1px solid white',
          boxShadow: 'none',
          padding: '0.5rem',
          paddingLeft: '1.5rem',
          paddingRight: '2rem',
          fontSize: '0.85rem',
          fontWeight: 'bold',
          textAlign: 'left',
          transition: 'border 0.2s, box-shadow 0.2s'
        }}
      />
      
      {showCalendar && (
        <div
          style={{
            position: 'absolute',
            top: '2.5rem',
            left: '0px',
            background: '#111',
            color: '#fff',
            borderRadius: 8,
            border: '1px solid white',
            zIndex: 11000,
            padding: 12,
            minWidth: 300,
            fontFamily: 'inherit',
            fontSize: '0.95rem'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8
          }}>
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              style={{
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                color: '#fff',
                fontSize: '2rem',
                cursor: 'pointer',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                padding: 0
              }}
            >‹</button>
            <span style={{
              fontWeight: 'bold',
              color: '#fff',
              fontSize: '1.15rem'
            }}>
              {viewDate.toLocaleString('default', { month: 'long' })} {year}
            </span>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              style={{
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                color: '#fff',
                fontSize: '2rem',
                cursor: 'pointer',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                padding: 0
              }}
            >›</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {dayNames.map((d) => (
                  <th key={d} style={{
                    color: '#aaa',
                    fontWeight: 'bold',
                    padding: 4,
                    textAlign: 'center',
                    fontSize: '0.85rem'
                  }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, i) => (
                <tr key={i}>
                  {week.map((d, j) => {
                    const isSelected =
                      d === value?.getDate() &&
                      month === value?.getMonth() &&
                      year === value?.getFullYear();
                    return (
                      <td
                        key={j}
                        style={{
                          width: 32,
                          height: 32,
                          textAlign: 'center',
                          borderRadius: 4,
                          background: isSelected ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))' : 'transparent',
                          color: isSelected ? '#fff' : '#ddd',
                          cursor: d ? 'pointer' : 'default',
                          opacity: d ? 1 : 0,
                          fontSize: '1.0rem',
                          fontWeight: 'bold',
                          ...(d && (new Date(year, month, d).toDateString() === new Date().toDateString()) ? {
                            border: '2px solid rgba(30, 58, 138, 0.9)',
                            borderRadius: '50%'
                          } : {})
                        }}
                        onClick={() => {
                          if (d) {
                            onChange(new Date(year, month, d));
                            setShowCalendar(false);
                          }
                        }}
                      >
                        {d || ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
