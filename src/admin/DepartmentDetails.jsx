import React from 'react';
import { useParams } from 'react-router-dom';
import { useDepartments } from '../utils/DepartmentsContext.jsx';

const DepartmentDetails = () => {
  const { id } = useParams();
  const { departments, loading } = useDepartments();

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  const department = departments.find(d => String(d.id) === String(id));
  if (!department) return <div className="p-8 text-center">Department not found.</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">{department.name}</h1>
      <p className="mb-2"><strong>Description:</strong> {department.description || 'No description'}</p>
      <p className="mb-2"><strong>Status:</strong> {department.active ? 'Active' : 'Inactive'}</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Transactions</h2>
      <ul>
        {department.transactions && department.transactions.length > 0 ? (
          department.transactions.map(tx => (
            <li key={tx.id}>{tx.name}</li>
          ))
        ) : (
          <li>No transactions</li>
        )}
      </ul>
    </div>
  );
};

export default DepartmentDetails; 