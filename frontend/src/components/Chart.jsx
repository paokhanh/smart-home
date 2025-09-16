import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,} from "recharts";


const data = [
  { time: "00:00", temperature: 22 },
  { time: "03:00", temperature: 21 },
  { time: "06:00", temperature: 20 },
  { time: "09:00", temperature: 23 },
  { time: "12:00", temperature: 26 },
  { time: "15:00", temperature: 27 },
  { time: "18:00", temperature: 25 },
  { time: "21:00", temperature: 23 },
  { time: "24:00", temperature: 22 },
];

const Chart = ({ dataPoints = data, width = "100%", title }) => {
  return (
    <div style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column" }}>
      {title && <h3 style={{ marginBottom: 12 }}>{title}</h3>}
      <div style={{ flex: 1 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dataPoints} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={['auto', 'auto']} unit="°C" />
          <Tooltip />
          <Line type="monotone" dataKey="temperature" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
    </div>
  )
}

export default Chart