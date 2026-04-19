import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { getDashboardStats } from '../../api/dashboardApi';
import './AdminDashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboardStats()
      .then(res => setStats(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="dash-loading">Loading dashboard...</div>;
  if (error) return <div className="dash-error">Failed to load dashboard.</div>;
  if (!stats) return null;

  const resourceUsage = stats.totalResources > 0
    ? Math.round((stats.activeResources / stats.totalResources) * 100)
    : 0;

  // ── Bar Chart: Peak Booking Times ──
  const barData = {
    labels: Object.keys(stats.bookingsByHour || {}),
    datasets: [{
      label: 'Bookings',
      data: Object.values(stats.bookingsByHour || {}),
      backgroundColor: 'rgba(124, 58, 237, 0.7)',
      borderRadius: 6,
      borderSkipped: false,
    }],
  };
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#6b7280' },
        grid: { color: '#f3f4f6' },
      },
      x: {
        ticks: { color: '#6b7280' },
        grid: { display: false },
      },
    },
  };

  // ── Doughnut Chart: Ticket Categories ──
  const categoryColors = [
    '#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'
  ];
  const categories = Object.keys(stats.ticketsByCategory || {});
  const doughnutData = {
    labels: categories.map(c => c.charAt(0) + c.slice(1).toLowerCase().replace('_', ' ')),
    datasets: [{
      data: Object.values(stats.ticketsByCategory || {}),
      backgroundColor: categoryColors.slice(0, categories.length),
      borderWidth: 0,
      cutout: '65%',
    }],
  };
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          color: '#374151',
          font: { size: 12 },
        },
      },
    },
  };

  // ── Line Chart: Tickets by Status (as a simple trend visualization) ──
  const statusLabels = Object.keys(stats.ticketsByStatus || {}).map(
    s => s.charAt(0) + s.slice(1).toLowerCase().replace('_', ' ')
  );
  const lineData = {
    labels: statusLabels,
    datasets: [
      {
        label: 'Tickets',
        data: Object.values(stats.ticketsByStatus || {}),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#f59e0b',
        pointRadius: 5,
      },
    ],
  };
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          color: '#374151',
          font: { size: 12 },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#6b7280' },
        grid: { color: '#f3f4f6' },
      },
      x: {
        ticks: { color: '#6b7280' },
        grid: { display: false },
      },
    },
  };

  // ── Booking status bar chart ──
  const bookingStatusLabels = Object.keys(stats.bookingsByStatus || {}).map(
    s => s.charAt(0) + s.slice(1).toLowerCase().replace('_', ' ')
  );
  const bookingBarData = {
    labels: bookingStatusLabels,
    datasets: [{
      label: 'Bookings',
      data: Object.values(stats.bookingsByStatus || {}),
      backgroundColor: ['#10b981', '#3b82f6', '#ef4444', '#6b7280', '#f59e0b'],
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  return (
    <div className="admin-dashboard">
      <div className="dash-header">
        <h2>System Overview</h2>
        <p>Monitor campus operations and manage approvals.</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Bookings</span>
            <span className="stat-value">{stats.totalBookings}</span>
          </div>
          <div className="stat-icon blue">📅</div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Resource Usage</span>
            <span className="stat-value">{resourceUsage}%</span>
          </div>
          <div className="stat-icon green">🏢</div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Open Tickets</span>
            <span className="stat-value">{stats.openTickets}</span>
          </div>
          <div className="stat-icon orange">🔧</div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Active Users</span>
            <span className="stat-value">{stats.activeUsers}</span>
          </div>
          <div className="stat-icon purple">👥</div>
        </div>
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="charts-row">
        <div className="chart-card">
          <h3>Peak Booking Times</h3>
          <div className="chart-container">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h3>Ticket Categories</h3>
          <div className="chart-container">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="charts-row">
        <div className="chart-card">
          <h3>Tickets by Status</h3>
          <div className="chart-container">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h3>Bookings by Status</h3>
          <div className="chart-container">
            <Bar data={bookingBarData} options={{
              ...barOptions,
              plugins: { legend: { display: false } },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
