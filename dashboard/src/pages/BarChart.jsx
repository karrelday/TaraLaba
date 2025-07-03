import React from "react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const OrderBarChart = ({ orders }) => {
  const data = [
    { status: "Pending", count: orders.filter(order => order.status === "Pending").length },
    { status: "Processing", count: orders.filter(order => order.status === "Processing").length },
    { status: "Ready", count: orders.filter(order => order.status === "Ready").length },
    { status: "Delivered", count: orders.filter(order => order.status === "Delivered").length }
  ];

  const customColors = {
    Pending: "#ff9800",
    Processing: "#2196f3",
    Ready: "#4caf50",
    Delivered: "#9c27b0"
  };
  // helloo
  // hi

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data}>
        <XAxis 
          dataKey="status" 
          tick={{ fill: '#2c3e50' }}
          axisLine={{ stroke: '#e0e0e0' }}
        />
        <YAxis 
          tick={{ fill: '#2c3e50' }}
          axisLine={{ stroke: '#e0e0e0' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '4px'
          }}
        />
        <Bar 
          dataKey="count" 
          fill="#8884d8"
          radius={[4, 4, 0, 0]}
          barSize={40}
        >
          {
            data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={customColors[entry.status]} />
            ))
          }
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default OrderBarChart;
