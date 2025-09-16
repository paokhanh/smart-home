import React from 'react'
import Card from '../components/Card'
import Chart from '../components/Chart'
const temperatureData = [
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

function Dashboard() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "20px" }}>
      <Card title="Temperature Sensor" footer="Updated 5 minutes ago">
        <Chart dataPoints={temperatureData} height={200} title="Temperature over 24h" />
      </Card>
      
      <Card title="Humidity Sensor" footer="Updated 3 minutes ago">
        <p>Current humidity: 45%</p>
        <p>Location: Bedroom</p>
      </Card>
      <Card title="Energy Usage" footer="Last 24 hours">
        <p>Usage: 12.5 kWh</p>
      </Card>
    </div>
  )
}

export default Dashboard