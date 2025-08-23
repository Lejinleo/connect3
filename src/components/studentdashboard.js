import React from 'react';

function StudentDashboard({ user, setUser }) {
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎓 Student Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span>Welcome, {user.name}!</span>
            <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">
              Logout
            </button>
          </div>
        </div>
      </div>
      <div className="p-8">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold">Student Dashboard Working!</h2>
          <p>Your login system is now functional.</p>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
