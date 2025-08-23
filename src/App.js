import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    password: '',
    role: 'student'
  });
  const [complaintData, setComplaintData] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
    location: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      fetchComplaints(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const fetchComplaints = async (currentUser) => {
    try {
      const params = currentUser.role === 'admin' ? { role: 'admin' } : { userId: currentUser.id, role: currentUser.role };
      const response = await axios.get(`${API_URL}/complaints`, { params });
      setComplaints(response.data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = isLogin 
        ? await axios.post(`${API_URL}/login`, formData)
        : await axios.post(`${API_URL}/register`, formData);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      await fetchComplaints(response.data.user);
    } catch (error) {
      alert(error.response?.data?.message || 'Error occurred');
    }
  };

  const submitComplaint = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/complaints`, {
        ...complaintData,
        userId: user.id
      });
      setComplaintData({ title: '', description: '', category: '', priority: '', location: '' });
      setShowForm(false);
      await fetchComplaints(user);
      alert('✅ Complaint submitted successfully!');
    } catch (error) {
      alert('❌ Error submitting complaint');
    }
  };

  const updateComplaintStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/complaints/${id}`, { status: newStatus });
      await fetchComplaints(user);
      alert(`✅ Complaint status updated to ${newStatus}!`);
    } catch (error) {
      alert('❌ Error updating complaint');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setComplaints([]);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'assigned': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="text-3xl text-white font-bold">🎓 Loading Campus Portal...</div>
      </div>
    );
  }

  // Enhanced Admin Dashboard
  if (user && user.role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Admin Header */}
        <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold">👨‍💼 Admin Dashboard</h1>
                <span className="ml-4 px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                  Administrator
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span>Welcome, <span className="font-semibold">{user.name}</span>!</span>
                <button 
                  onClick={logout} 
                  className="bg-red-500 bg-opacity-20 backdrop-blur text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-all duration-200 border border-white border-opacity-20"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Admin Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-700">Total Complaints</h3>
                  <p className="text-2xl font-bold text-purple-600">{complaints.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-700">Pending</h3>
                  <p className="text-2xl font-bold text-yellow-600">
                    {complaints.filter(c => c.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <span className="text-2xl">🔄</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-700">In Progress</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {complaints.filter(c => c.status === 'in-progress').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-700">Resolved</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {complaints.filter(c => c.status === 'resolved').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <span className="text-2xl">🔴</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-700">High Priority</h3>
                  <p className="text-2xl font-bold text-red-600">
                    {complaints.filter(c => c.priority === 'high').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Complaints Management */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                🎛️ Complaint Management Center ({complaints.length} total)
              </h2>
              <p className="text-gray-600 mt-1">Review, assign, and resolve student complaints efficiently</p>
            </div>
            
            {complaints.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No complaints to manage</h3>
                <p className="text-gray-500">All caught up! New complaints will appear here for review.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {complaints.map((complaint, index) => (
                  <div key={complaint._id || index} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-xl font-semibold text-gray-800">{complaint.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(complaint.status)}`}>
                            {complaint.status.replace('-', ' ').toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                            {complaint.priority?.toUpperCase()} PRIORITY
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-4 leading-relaxed bg-gray-50 p-3 rounded-lg">
                          {complaint.description}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4 bg-white p-4 rounded-lg border">
                          <div>
                            <span className="font-semibold text-gray-700">👨‍🎓 Student:</span>
                            <div className="text-gray-600">{complaint.studentId?.name || 'Unknown'}</div>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">📁 Category:</span>
                            <div className="text-gray-600 capitalize">{complaint.category}</div>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">📍 Location:</span>
                            <div className="text-gray-600">{complaint.location || 'Not specified'}</div>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">📅 Date:</span>
                            <div className="text-gray-600">{new Date(complaint.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Action Buttons */}
                    <div className="flex flex-wrap gap-3 mt-4">
                      {complaint.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateComplaintStatus(complaint._id, 'assigned')}
                            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium flex items-center"
                          >
                            👤 Assign to Team
                          </button>
                          <button
                            onClick={() => updateComplaintStatus(complaint._id, 'in-progress')}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center"
                          >
                            🔄 Start Progress
                          </button>
                        </>
                      )}
                      
                      {complaint.status === 'assigned' && (
                        <button
                          onClick={() => updateComplaintStatus(complaint._id, 'in-progress')}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center"
                        >
                          🔄 Begin Work
                        </button>
                      )}
                      
                      {complaint.status === 'in-progress' && (
                        <button
                          onClick={() => updateComplaintStatus(complaint._id, 'resolved')}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center"
                        >
                          ✅ Mark as Resolved
                        </button>
                      )}
                      
                      {complaint.status === 'resolved' && (
                        <div className="flex items-center text-green-600 font-medium">
                          <span className="mr-2">✅</span>
                          <span>Complaint Resolved</span>
                        </div>
                      )}
                      
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                        📧 Contact Student
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Student Dashboard (same as before but shortened for space)
  if (user && user.role === 'student') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">🎓 Student Dashboard</h1>
              <div className="flex items-center space-x-4">
                <span>Welcome, <span className="font-semibold">{user.name}</span>!</span>
                <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Student Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Total Complaints</h3>
              <p className="text-3xl font-bold text-blue-600">{complaints.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Pending</h3>
              <p className="text-3xl font-bold text-yellow-600">
                {complaints.filter(c => c.status === 'pending').length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">In Progress</h3>
              <p className="text-3xl font-bold text-blue-600">
                {complaints.filter(c => c.status === 'in-progress').length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Resolved</h3>
              <p className="text-3xl font-bold text-green-600">
                {complaints.filter(c => c.status === 'resolved').length}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
            >
              {showForm ? '❌ Cancel' : '➕ Submit New Complaint'}
            </button>
          </div>

          {/* Complaint Form */}
          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-xl font-bold mb-4">📝 Submit New Complaint</h2>
              <form onSubmit={submitComplaint} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={complaintData.category}
                    onChange={(e) => setComplaintData({...complaintData, category: e.target.value})}
                    className="p-3 border rounded-lg"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="infrastructure">🏗️ Infrastructure</option>
                    <option value="academics">📚 Academics</option>
                    <option value="facilities">🏢 Facilities</option>
                    <option value="hostel">🏠 Hostel</option>
                    <option value="others">📋 Others</option>
                  </select>
                  
                  <select
                    value={complaintData.priority}
                    onChange={(e) => setComplaintData({...complaintData, priority: e.target.value})}
                    className="p-3 border rounded-lg"
                    required
                  >
                    <option value="">Select Priority</option>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
                
                <input
                  type="text"
                  placeholder="Complaint Title"
                  value={complaintData.title}
                  onChange={(e) => setComplaintData({...complaintData, title: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                  required
                />
                
                <textarea
                  placeholder="Detailed Description"
                  value={complaintData.description}
                  onChange={(e) => setComplaintData({...complaintData, description: e.target.value})}
                  className="w-full p-3 border rounded-lg h-32"
                  required
                />
                
                <input
                  type="text"
                  placeholder="Location (Building, Room, etc.)"
                  value={complaintData.location}
                  onChange={(e) => setComplaintData({...complaintData, location: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
                
                <button
                  type="submit"
                  className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600"
                >
                  🚀 Submit Complaint
                </button>
              </form>
            </div>
          )}

          {/* Complaints List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">📋 My Complaints ({complaints.length})</h2>
            </div>
            {complaints.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No complaints yet</h3>
                <p className="text-gray-500 mb-6">Submit your first complaint to get started!</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
                >
                  Submit New Complaint
                </button>
              </div>
            ) : (
              <div className="divide-y">
                {complaints.map((complaint, index) => (
                  <div key={index} className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">{complaint.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(complaint.status)}`}>
                        {complaint.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{complaint.description}</p>
                    <div className="flex space-x-4 text-sm text-gray-500">
                      <span>Category: {complaint.category}</span>
                      <span>Priority: {complaint.priority}</span>
                      <span>Location: {complaint.location}</span>
                      <span>Date: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Login Page (same as before)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🎓 Campus Portal</h1>
          <p className="text-gray-600">Your Voice, Our Priority</p>
        </div>

        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-center rounded-md transition-colors ${
              isLogin ? 'bg-blue-600 text-white' : 'text-gray-600'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-center rounded-md transition-colors ${
              !isLogin ? 'bg-blue-600 text-white' : 'text-gray-600'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />

          {!isLogin && (
            <input
              type="text"
              placeholder="Student/Employee ID"
              value={formData.studentId}
              onChange={(e) => setFormData({...formData, studentId: e.target.value})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          )}

          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />

          <div className="flex space-x-4 justify-center">
            <label className="flex items-center">
              <input
                type="radio"
                value="student"
                checked={formData.role === 'student'}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="mr-2"
              />
              👨‍🎓 Student
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="admin"
                checked={formData.role === 'admin'}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="mr-2"
              />
              👨‍💼 Admin
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
