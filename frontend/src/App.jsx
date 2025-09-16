import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Sensors from "./pages/Sensors";
import Schedules from "./pages/Schedules";
import Users from "./pages/Users";
import Settings from "./pages/Settings";

function App() {
  return (
    <div style={{ marginLeft: 240, padding: "20px" }}>
      <Navbar />
      <div className="flex-1 flex flex-col">
        <Sidebar />
        <main className="p-4 flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sensors" element={<Sensors />} />
            <Route path="/schedules" element={<Schedules />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
