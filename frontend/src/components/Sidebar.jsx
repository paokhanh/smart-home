import React from 'react'
import './sidebar.css'
function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Sidebar navigation">
      <h2>Smart Home</h2>
      <nav>
        <ul>
          <li><a href="#dashboard">Dashboard</a></li>
          <li><a href="#devices">Devices</a></li>
          <li><a href="#scenes">Scenes</a></li>
          <li><a href="#routines">Routines</a></li>
          <li><a href="#settings">Settings</a></li>
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar