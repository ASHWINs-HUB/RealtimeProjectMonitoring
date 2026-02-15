import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import apiService from '../services/api'
import socket from '../services/socket'


export const HRDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    riskScore: 0,
    onTrack: 0,
    delayed: 0,
  });
  const [deliveryForecastData, setDeliveryForecastData] = useState([]);
  const [highRiskProjects, setHighRiskProjects] = useState([]);

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        const analytics = await apiService.getTeamAnalytics();
        setStats({
          total: analytics.totalProjects,
          riskScore: analytics.riskScore || 0,
          onTrack: analytics.onTrackProjects || 0,
          delayed: analytics.delayedProjects || 0,
        });
        setDeliveryForecastData(analytics.deliveryForecast || []);
        setHighRiskProjects(analytics.highRiskProjects || []);
      } catch (e) {
        // fallback or error handling
      }
    }
    fetchData();
    socket.connect();
    return () => { socket.disconnect(); };
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    function handleRealtimeUpdate(data) {
      if (data.stats) setStats(data.stats);
      if (data.deliveryForecast) setDeliveryForecastData(data.deliveryForecast);
      if (data.highRiskProjects) setHighRiskProjects(data.highRiskProjects);
    }
    socket.on('hr-dashboard-update', handleRealtimeUpdate);
    return () => { socket.off('hr-dashboard-update', handleRealtimeUpdate); };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  }
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">HR Dashboard</h1>
        <p className="text-gray-600">Project health overview and risk assessment</p>
      </div>
      {/* Stats Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Projects</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-indigo-600" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Risk Score</p>
                  <p className="text-xl sm:text-2xl font-semibold text-red-600 mt-1">{stats.riskScore}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-red-600" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">On Track</p>
                  <p className="text-xl sm:text-2xl font-semibold text-green-600 mt-1">{stats.onTrack}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Delayed</p>
                  <p className="text-xl sm:text-2xl font-semibold text-yellow-600 mt-1">{stats.delayed}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-yellow-600" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts and Tables - Responsive */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Delivery Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={deliveryForecastData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="onTime" 
                      stroke="#4F46E5" 
                      strokeWidth={2}
                      name="On Time %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="delayed" 
                      stroke="#DC2626" 
                      strokeWidth={2}
                      name="Delayed %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">High Risk Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4 max-h-64 sm:max-h-80 overflow-y-auto">
                {highRiskProjects.map((project, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{project.name}</p>
                      <p className="text-sm text-gray-600">Due: {project.deadline}</p>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        project.status === 'Critical' ? 'bg-red-100 text-red-600' :
                        project.status === 'High' ? 'bg-orange-100 text-orange-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {project.status}
                      </span>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">{project.risk}%</p>
                        <p className="text-xs text-gray-600">Risk</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
