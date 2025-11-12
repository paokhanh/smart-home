import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,} from "recharts";


const Chart = ({ dataPoints = [], yKey = "temperature", unit = " °C", title }) => {
  return (
    <div style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column" }}>
      {title && <h3 style={{ marginBottom: 12 }}>{title}</h3>}
      <div style={{ flex: 1, minHeight: "250px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dataPoints}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={["auto", "auto"]} unit={unit} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={yKey === "temperature" ? "#3b82f6" : "#10b981"} // xanh dương cho nhiệt độ, xanh lá cho độ ẩm
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default Chart