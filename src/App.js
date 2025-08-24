import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api';

// Stylish Button Component (using CSS classes)
const StylishButton = ({ children, onClick, variant = "primary", icon, loading, className = "" }) => {
  return (
    <button
      className={`btn btn-${variant} ${loading ? 'loading' : ''} ${className}`}
      onClick={loading ? null : onClick}
      disabled={loading}
    >
      {loading && <div className="loading-spinner" />}
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
};

// Stylish Card Component
const StylishCard = ({ children, title, className = "" }) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
};

// Stat Card Component
const StylishStatCard = ({ title, value, icon, color = "blue" }) => {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{title}</div>
      <div className="stat-icon">{icon}</div>
    </div>
  );
};

// Form Input Component
const StylishInput = ({ label, icon, type = "text", value, onChange, error, as = "input", children, ...props }) => {
  const Component = as;

  return (
    <div className="form-group">
      {label && <label className="form-label">{icon && <span>{icon}</span>} {label}</label>}
      <Component
        type={type}
        className={`form-input ${error ? 'error' : ''}`}
        value={value || ''} // ✅ Fixed: Added fallback for undefined values
        onChange={onChange}
        {...props}
      >
        {children}
      </Component>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  return (
    <span className={`badge badge-${status}`}>
      {status.replace('-', ' ').toUpperCase()}
    </span>
  );
};

// Deadline Badge Component
const DeadlineBadge = ({ deadline }) => {
  if (!deadline) return null;
  
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const timeDiff = deadlineDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  let badgeClass = 'badge badge-deadline-';
  let statusText = '';
  
  if (daysDiff < 0) {
    badgeClass += 'overdue';
    statusText = `Overdue by ${Math.abs(daysDiff)} days`;
  } else if (daysDiff === 0) {
    badgeClass += 'today';
    statusText = 'Due Today';
  } else if (daysDiff <= 3) {
    badgeClass += 'urgent';
    statusText = `${daysDiff} days left`;
  } else if (daysDiff <= 7) {
    badgeClass += 'soon';
    statusText = `${daysDiff} days left`;
  } else {
    badgeClass += 'normal';
    statusText = `${daysDiff} days left`;
  }
  
  return (
    <span className={badgeClass}>
      ⏰ {statusText}
    </span>
  );
};

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [formErrors, setFormErrors] = useState({});
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
    location: '',
    deadline: ''
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
    setSubmitting(true);
    setFormErrors({});

    try {
      const response = isLogin 
        ? await axios.post(`${API_URL}/login`, formData)
        : await axios.post(`${API_URL}/register`, formData);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      await fetchComplaints(response.data.user);
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 401) {
        setFormErrors({ general: 'Invalid credentials. Please check your information.' });
      } else {
        setFormErrors({ general: 'Unable to connect to server. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const submitComplaint = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post(`${API_URL}/complaints`, {
        ...complaintData,
        userId: user.id
      });
      setComplaintData({ 
        title: '', 
        description: '', 
        category: '', 
        priority: '', 
        location: '',
        deadline: ''
      });
      setShowForm(false);
      await fetchComplaints(user);
    } catch (error) {
      console.error('Error submitting complaint:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const updateComplaintStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/complaints/${id}`, { status: newStatus });
      await fetchComplaints(user);
    } catch (error) {
      console.error('Error updating complaint:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setComplaints([]);
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = !searchTerm || 
      complaint.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || complaint.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <div className="loading-text">Loading Campus Portal...</div>
      </div>
    );
  }

// Professional Admin Dashboard with Consistent Styling
if (user && user.role === 'admin') {
  return (
    <div className="App">
      {/* Enhanced Header with Better Styling */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">🏛️</div>
            <div>
              <h1>Admin Control Center</h1>
              <p>Campus Complaint Management System</p>
            </div>
          </div>
          
          <div className="user-info">
            <div className="text-right">
              <p className="user-role">System Administrator</p>
              <p className="user-name">{user.name}</p>
            </div>
            <StylishButton variant="outline" onClick={logout} icon="🚪">
              Secure Logout
            </StylishButton>
          </div>
        </div>
      </header>

      <div className="main-content">
        {/* Enhanced Statistics Grid */}
        <div className="stats-grid">
          <StylishStatCard
            title="Total Complaints"
            value={complaints.length}
            icon="📊"
            color="blue"
          />
          <StylishStatCard
            title="Pending Review"
            value={complaints.filter(c => c.status === 'pending').length}
            icon="⏳"
            color="yellow"
          />
          <StylishStatCard
            title="In Progress"
            value={complaints.filter(c => c.status === 'in-progress').length}
            icon="🔄"
            color="purple"
          />
          <StylishStatCard
            title="Resolved"
            value={complaints.filter(c => c.status === 'resolved').length}
            icon="✅"
            color="green"
          />
          <StylishStatCard
            title="Overdue Items"
            value={complaints.filter(c => {
              if (!c.deadline) return false;
              const today = new Date();
              const deadline = new Date(c.deadline);
              return deadline < today && c.status !== 'resolved';
            }).length}
            icon="⚠️"
            color="red"
          />
        </div>

        {/* Quick Actions Panel */}
        <StylishCard title="Administrative Tools" className="admin-tools-card">
          <div className="admin-actions-grid">
            <StylishButton variant="primary" icon="🔄" onClick={fetchComplaints}>
              Refresh Data
            </StylishButton>
            <StylishButton variant="success" icon="📊">
              Analytics Report
            </StylishButton>
            <StylishButton variant="outline" icon="📤">
              Export CSV
            </StylishButton>
            <StylishButton variant="outline" icon="⚙️">
              System Settings
            </StylishButton>
            <StylishButton variant="outline" icon="📧">
              Bulk Email
            </StylishButton>
            <StylishButton variant="outline" icon="🔔">
              Send Notifications
            </StylishButton>
          </div>
        </StylishCard>

        {/* Enhanced Search & Filter */}
        <StylishCard title="Search & Advanced Filtering" className="search-card">
          <div className="search-container">
            <div className="search-inputs">
              <StylishInput
                label="Search Complaints"
                icon="🔍"
                placeholder="Search by title, description, student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <StylishInput
                label="Filter by Status"
                icon="🏷️"
                as="select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">⏳ Pending Review</option>
                <option value="in-progress">🔄 In Progress</option>
                <option value="resolved">✅ Resolved</option>
              </StylishInput>
            </div>
            <div className="search-stats">
              <span className="result-count">
                Showing {filteredComplaints.length} of {complaints.length} complaints
              </span>
            </div>
          </div>
        </StylishCard>

        {/* Professional Complaints Management */}
        <StylishCard 
          title={`Complaint Management Dashboard`} 
          className="complaints-management-card"
        >
          {filteredComplaints.length === 0 ? (
            <div className="empty-state enhanced">
              <div className="empty-icon">📋</div>
              <div className="empty-title">No Complaints Found</div>
              <div className="empty-description">
                {searchTerm || filterStatus 
                  ? "No complaints match your current search criteria. Try adjusting your filters or search terms."
                  : "No complaints have been submitted to the system yet. The dashboard is ready to receive and process new complaints."
                }
              </div>
              {(searchTerm || filterStatus) && (
                <div className="empty-actions">
                  <StylishButton 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('');
                    }}
                  >
                    Clear Filters
                  </StylishButton>
                </div>
              )}
            </div>
          ) : (
            <div className="complaints-grid">
              {filteredComplaints.map((complaint, index) => (
                <div key={complaint._id || index} className="complaint-card professional">
                  <div className="complaint-header enhanced">
                    <div className="complaint-title-section">
                      <h3 className="complaint-title">{complaint.title}</h3>
                      <div className="complaint-id">#{complaint._id?.slice(-6) || `REF${index + 1}`}</div>
                    </div>
                    <div className="badge-group">
                      <StatusBadge status={complaint.status} />
                      <DeadlineBadge deadline={complaint.deadline} />
                    </div>
                  </div>
                  
                  <div className="complaint-description enhanced">
                    {complaint.description}
                  </div>
                  
                  <div className="complaint-meta enhanced">
                    <div className="meta-row">
                      <div className="complaint-meta-item">
                        <div className="meta-label">👤 Student:</div>
                        <div className="meta-value">{complaint.studentId?.name || 'Unknown'}</div>
                      </div>
                      <div className="complaint-meta-item">
                        <div className="meta-label">📧 Email:</div>
                        <div className="meta-value">{complaint.studentId?.email || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="meta-row">
                      <div className="complaint-meta-item">
                        <div className="meta-label">📁 Category:</div>
                        <div className="meta-value category">{complaint.category}</div>
                      </div>
                      <div className="complaint-meta-item">
                        <div className="meta-label">🏷️ Priority:</div>
                        <div className={`meta-value priority-${complaint.priority}`}>
                          {complaint.priority?.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div className="meta-row">
                      <div className="complaint-meta-item">
                        <div className="meta-label">📍 Location:</div>
                        <div className="meta-value">{complaint.location || 'Not specified'}</div>
                      </div>
                      <div className="complaint-meta-item">
                        <div className="meta-label">⏰ Deadline:</div>
                        <div className="meta-value">
                          {complaint.deadline ? new Date(complaint.deadline).toLocaleDateString() : 'No deadline'}
                        </div>
                      </div>
                    </div>
                    <div className="meta-row">
                      <div className="complaint-meta-item">
                        <div className="meta-label">📅 Submitted:</div>
                        <div className="meta-value">{new Date(complaint.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="complaint-meta-item">
                        <div className="meta-label">⏱️ Age:</div>
                        <div className="meta-value">
                          {Math.ceil((new Date() - new Date(complaint.createdAt)) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="complaint-actions enhanced">
                    {complaint.status === 'pending' && (
                      <div className="action-group pending">
                        <StylishButton
                          variant="primary"
                          icon="▶️"
                          onClick={() => updateComplaintStatus(complaint._id, 'in-progress')}
                        >
                          Begin Processing
                        </StylishButton>
                        <StylishButton
                          variant="success"
                          icon="✅"
                          onClick={() => updateComplaintStatus(complaint._id, 'resolved')}
                        >
                          Mark Resolved
                        </StylishButton>
                      </div>
                    )}
                    
                    {complaint.status === 'in-progress' && (
                      <div className="action-group in-progress">
                        <StylishButton
                          variant="success"
                          icon="✅"
                          onClick={() => updateComplaintStatus(complaint._id, 'resolved')}
                        >
                          Complete & Resolve
                        </StylishButton>
                      </div>
                    )}

                    {complaint.status === 'resolved' && (
                      <div className="resolved-status">
                        <span className="resolved-indicator">
                          ✓ Successfully Resolved
                        </span>
                      </div>
                    )}

                    {/* Additional Admin Tools */}
                    <div className="admin-tools">
                      <StylishButton variant="outline" icon="📝" className="tool-btn">
                        Add Note
                      </StylishButton>
                      <StylishButton variant="outline" icon="📧" className="tool-btn">
                        Contact
                      </StylishButton>
                      <StylishButton variant="outline" icon="📎" className="tool-btn">
                        Attach
                      </StylishButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </StylishCard>

        {/* System Overview Panel */}
        <div className="system-overview">
          <div className="overview-grid">
            <StylishCard title="System Analytics" className="analytics-card">
              <div className="analytics-content">
                <div className="metric">
                  <span className="metric-label">Resolution Rate</span>
                  <span className="metric-value success">
                    {complaints.length > 0 ? Math.round((complaints.filter(c => c.status === 'resolved').length / complaints.length) * 100) : 0}%
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Avg. Response Time</span>
                  <span className="metric-value">2.3 days</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Student Satisfaction</span>
                  <span className="metric-value">4.2/5 ⭐</span>
                </div>
              </div>
            </StylishCard>

            <StylishCard title="Recent Activity" className="activity-card">
              <div className="activity-feed">
                <div className="activity-item">
                  <div className="activity-dot resolved"></div>
                  <span className="activity-text">3 complaints resolved today</span>
                </div>
                <div className="activity-item">
                  <div className="activity-dot new"></div>
                  <span className="activity-text">5 new complaints received</span>
                </div>
                <div className="activity-item">
                  <div className="activity-dot urgent"></div>
                  <span className="activity-text">2 urgent items pending</span>
                </div>
                <div className="activity-item">
                  <div className="activity-dot info"></div>
                  <span className="activity-text">System backup completed</span>
                </div>
              </div>
            </StylishCard>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Student Dashboard with Consistent Styling
if (user && user.role === 'student') {
  return (
    <div className="App">
      {/* Enhanced Student Header */}
      <header className="header student-header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">🎓</div>
            <div>
              <h1>Student Portal</h1>
              <p>Your Voice, Our Priority</p>
            </div>
          </div>
          
          <div className="user-info">
            <div className="text-right">
              <p className="user-role">Student</p>
              <p className="user-name">{user.name}</p>
              <p className="user-id">ID: {user.studentId}</p>
            </div>
            <StylishButton variant="outline" onClick={logout} icon="🚪">
              Logout
            </StylishButton>
          </div>
        </div>
      </header>

      <div className="main-content">
        {/* Enhanced Student Statistics */}
        <div className="stats-grid student-stats">
          <StylishStatCard
            title="My Complaints"
            value={complaints.length}
            icon="📝"
            color="blue"
          />
          <StylishStatCard
            title="Pending Review"
            value={complaints.filter(c => c.status === 'pending').length}
            icon="⏳"
            color="yellow"
          />
          <StylishStatCard
            title="In Progress"
            value={complaints.filter(c => c.status === 'in-progress').length}
            icon="🔄"
            color="purple"
          />
          <StylishStatCard
            title="Resolved"
            value={complaints.filter(c => c.status === 'resolved').length}
            icon="✅"
            color="green"
          />
        </div>

        {/* Enhanced Quick Actions */}
        <div className="student-actions">
          <StylishButton
            variant="primary"
            onClick={() => setShowForm(!showForm)}
            icon={showForm ? "❌" : "➕"}
            className="primary-action"
          >
            {showForm ? 'Cancel Submission' : 'Submit New Complaint'}
          </StylishButton>
        </div>

        {/* Enhanced Form with Better Styling */}
        {showForm && (
          <StylishCard title="Submit Your Complaint" className="complaint-form-card">
            <div className="form-header">
              <p className="form-subtitle">
                Please provide detailed information to help us address your concern effectively.
              </p>
            </div>
            
            <form onSubmit={submitComplaint} className="enhanced-form">
              <div className="form-section">
                <h4 className="section-title">Basic Information</h4>
                <div className="form-row">
                  <StylishInput
                    label="Category"
                    icon="📁"
                    as="select"
                    value={complaintData.category}
                    onChange={(e) => setComplaintData({...complaintData, category: e.target.value})}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="infrastructure">🏗️ Infrastructure</option>
                    <option value="academics">📚 Academics</option>
                    <option value="facilities">🏢 Facilities</option>
                    <option value="hostel">🏠 Hostel</option>
                    <option value="others">📋 Others</option>
                  </StylishInput>
                  
                  <StylishInput
                    label="Priority Level"
                    icon="🏷️"
                    as="select"
                    value={complaintData.priority}
                    onChange={(e) => setComplaintData({...complaintData, priority: e.target.value})}
                    required
                  >
                    <option value="">Select Priority</option>
                    <option value="high">🔴 High Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="low">🟢 Low Priority</option>
                  </StylishInput>
                </div>
              </div>

              <div className="form-section">
                <h4 className="section-title">Complaint Details</h4>
                <StylishInput
                  label="Complaint Title"
                  icon="✏️"
                  placeholder="Brief, descriptive title of your complaint"
                  value={complaintData.title}
                  onChange={(e) => setComplaintData({...complaintData, title: e.target.value})}
                  required
                />
                
                <StylishInput
                  label="Detailed Description"
                  icon="📄"
                  as="textarea"
                  rows={5}
                  placeholder="Please provide a comprehensive description of your complaint, including any relevant details that might help us understand and resolve the issue..."
                  value={complaintData.description}
                  onChange={(e) => setComplaintData({...complaintData, description: e.target.value})}
                  required
                />
              </div>

              <div className="form-section">
                <h4 className="section-title">Additional Information</h4>
                <div className="form-row">
                  <StylishInput
                    label="Location (Optional)"
                    icon="📍"
                    placeholder="Building, room number, specific area..."
                    value={complaintData.location}
                    onChange={(e) => setComplaintData({...complaintData, location: e.target.value})}
                  />
                  
                  <StylishInput
                    label="Expected Resolution Date (Optional)"
                    icon="⏰"
                    type="date"
                    value={complaintData.deadline}
                    onChange={(e) => setComplaintData({...complaintData, deadline: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <StylishButton
                  variant="success"
                  loading={submitting}
                  icon="🚀"
                  className="submit-btn"
                >
                  {submitting ? 'Submitting Your Complaint...' : 'Submit Complaint'}
                </StylishButton>
              </div>
            </form>
          </StylishCard>
        )}

        {/* Enhanced My Complaints Section */}
        <StylishCard 
          title={`My Complaint History`}
          className="my-complaints-card"
        >
          <div className="complaints-header">
            <div className="complaints-summary">
              <span className="total-count">{complaints.length} Total Complaints</span>
              {complaints.length > 0 && (
                <span className="success-rate">
                  {Math.round((complaints.filter(c => c.status === 'resolved').length / complaints.length) * 100)}% Resolution Rate
                </span>
              )}
            </div>
          </div>

          {complaints.length === 0 ? (
            <div className="empty-state student-empty">
              <div className="empty-icon">📝</div>
              <div className="empty-title">No Complaints Submitted Yet</div>
              <div className="empty-description">
                You haven't submitted any complaints yet. Use the form above to submit your first complaint and help us improve your campus experience.
              </div>
              <StylishButton 
                variant="primary" 
                onClick={() => setShowForm(true)} 
                icon="➕"
                className="get-started-btn"
              >
                Submit Your First Complaint
              </StylishButton>
            </div>
          ) : (
            <div className="student-complaints-grid">
              {complaints.map((complaint, index) => (
                <div key={index} className="student-complaint-card">
                  <div className="complaint-header student">
                    <div className="complaint-title-section">
                      <h3 className="complaint-title">{complaint.title}</h3>
                      <div className="complaint-ref">Ref: #{(complaint._id?.slice(-6) || `CMP${index + 1}`).toUpperCase()}</div>
                    </div>
                    <div className="badge-group">
                      <StatusBadge status={complaint.status} />
                      <DeadlineBadge deadline={complaint.deadline} />
                    </div>
                  </div>
                  
                  <div className="complaint-description student">
                    {complaint.description}
                  </div>
                  
                  <div className="complaint-meta student">
                    <div className="meta-grid">
                      <div className="meta-item">
                        <span className="meta-icon">📁</span>
                        <div>
                          <div className="meta-label">Category</div>
                          <div className="meta-value">{complaint.category}</div>
                        </div>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">🏷️</span>
                        <div>
                          <div className="meta-label">Priority</div>
                          <div className={`meta-value priority-${complaint.priority}`}>
                            {complaint.priority?.charAt(0).toUpperCase() + complaint.priority?.slice(1)}
                          </div>
                        </div>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">📍</span>
                        <div>
                          <div className="meta-label">Location</div>
                          <div className="meta-value">{complaint.location || 'Not specified'}</div>
                        </div>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">⏰</span>
                        <div>
                          <div className="meta-label">Deadline</div>
                          <div className="meta-value">
                            {complaint.deadline ? new Date(complaint.deadline).toLocaleDateString() : 'No deadline'}
                          </div>
                        </div>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">📅</span>
                        <div>
                          <div className="meta-label">Submitted</div>
                          <div className="meta-value">{new Date(complaint.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">⏱️</span>
                        <div>
                          <div className="meta-label">Status Duration</div>
                          <div className="meta-value">
                            {Math.ceil((new Date() - new Date(complaint.createdAt)) / (1000 * 60 * 60 * 24))} days
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="complaint-progress">
                    <div className="progress-bar">
                      <div className={`progress-fill ${complaint.status}`}></div>
                    </div>
                    <div className="progress-label">
                      {complaint.status === 'pending' && 'Waiting for review'}
                      {complaint.status === 'in-progress' && 'Being processed'}
                      {complaint.status === 'resolved' && 'Successfully resolved'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </StylishCard>
      </div>
    </div>
  );
}


  // Login Page
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="text-center mb-6">
          <div className="login-icon">🎓</div>
          <h1 className="login-title">Campus Portal</h1>
          <p className="login-subtitle">Your Voice, Our Priority</p>
        </div>

        <div className="login-tabs">
          <div
            className={`login-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </div>
          <div
            className={`login-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <StylishInput
              label="Full Name"
              icon="👤"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          )}

          <StylishInput
            label="Email Address"
            icon="✉️"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />

          {!isLogin && (
            <StylishInput
              label="Student/Employee ID"
              icon="🆔"
              value={formData.studentId}
              onChange={(e) => setFormData({...formData, studentId: e.target.value})}
              required
            />
          )}

          <StylishInput
            label="Password"
            icon="🔒"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />

          <div className="role-selection">
            <div className="role-option">
              <input
                type="radio"
                value="student"
                checked={formData.role === 'student'}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              />
              <span>👨‍🎓 Student</span>
            </div>
            <div className="role-option">
              <input
                type="radio"
                value="admin"
                checked={formData.role === 'admin'}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              />
              <span>👨‍💼 Administrator</span>
            </div>
          </div>

          {formErrors.general && (
            <div className="error-message">
              <span>⚠️</span>
              {formErrors.general}
            </div>
          )}

          <StylishButton
            variant="primary"
            loading={submitting}
            className="w-full"
          >
            {submitting ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </StylishButton>
        </form>
      </div>
    </div>
  );
}

export default App;
