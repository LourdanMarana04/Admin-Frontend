import React, { createContext, useContext, useState, useEffect } from 'react';
// import api from './api';

const DepartmentsContext = createContext();

const initialDepartments = [
  { id: 1, name: 'Assessor', description: '', transactions: [], active: true },
  { id: 2, name: 'Treasury', description: '', transactions: [], active: true },
  { id: 3, name: 'Office of the City Mayor', description: '', transactions: [], active: true },
  { id: 4, name: 'Office of the City Planning and Development Coordinator', description: '', transactions: [], active: true },
  { id: 5, name: 'Human Resources Management Office', description: '', transactions: [], active: true },
  { id: 6, name: 'Sangguniang Panglungsod', description: '', transactions: [], active: true },
  { id: 7, name: 'City Information Office', description: '', transactions: [], active: true },
  { id: 8, name: 'Office of the City Administrator', description: '', transactions: [], active: true },
  { id: 9, name: 'General Services Office', description: '', transactions: [], active: true },
  { id: 10, name: 'Business Permits and Licensing Office', description: '', transactions: [], active: true },
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

export const DepartmentsProvider = ({ children }) => {
  const [departments, setDepartments] = useState(initialDepartments); // Start with initial departments
  const [loading, setLoading] = useState(true);

  // Fetch departments from backend on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/departments`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });
        if (response.status === 429) {
          console.warn('Rate limited for departments, using initial departments');
          setLoading(false);
          return;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch departments');
        
        // Handle both direct array and wrapped response
        const departmentsArray = Array.isArray(data) ? data : (data.data || data.departments || []);
        setDepartments(departmentsArray);
      } catch (error) {
        console.error('Failed to fetch departments, using initial departments:', error);
        // Keep using initialDepartments as fallback
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();

    // Polling for real-time updates every 15 seconds (departments don't change often)
    const interval = setInterval(fetchDepartments, 15000);
    return () => clearInterval(interval);
  }, []);

  // Add department
  const addDepartment = async (name, description = '', transactions = []) => {
    try {
      const response = await fetch(`${API_BASE_URL}/departments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, description, active: true, transactions }),
      });
      const newDept = await response.json();
      if (!response.ok) throw new Error(newDept.message || 'Failed to add department');
      setDepartments([...departments, newDept]);
      return newDept;
    } catch (error) {
      console.error('Failed to add department:', error);
      return null;
    }
  };

  // Edit department
  const editDepartment = async (id, newName, newDescription, active) => {
    try {
      const body = { name: newName, description: newDescription };
      if (typeof active === 'boolean') body.active = active;
      const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const updated = await response.json();
      if (!response.ok) throw new Error(updated.message || 'Failed to edit department');
      setDepartments(departments.map(d => d.id === id ? { ...d, ...updated } : d));
    } catch (error) {
      console.error('Failed to edit department:', error);
    }
  };

  // Delete department
  const deleteDepartment = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete department');
      setDepartments(departments.filter(d => d.id !== id));
    } catch (error) {
      console.error('Failed to delete department:', error);
    }
  };

  // Archive/restore department (edit active field)
  const archiveDepartment = (id) => {
    const dept = departments.find(d => d.id === id);
    if (!dept) return;
    return editDepartment(id, dept.name, dept.description, false);
  };
  const restoreDepartment = (id) => {
    const dept = departments.find(d => d.id === id);
    if (!dept) return;
    return editDepartment(id, dept.name, dept.description, true);
  };

  // Add transaction
  const addTransaction = async (deptId, transactionName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/departments/${deptId}/transactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: transactionName }),
      });
      const newTrans = await response.json();
      if (!response.ok) throw new Error(newTrans.message || 'Failed to add transaction');
      setDepartments(departments.map(d => d.id === deptId ? { ...d, transactions: [...(d.transactions || []), newTrans] } : d));
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  };

  // Transaction management
  const editTransactionName = async (deptId, transactionId, newName) => {
    const department = departments.find(d => d.id === deptId);
    const transaction = department?.transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    try {
      const response = await fetch(`${API_BASE_URL}/departments/${deptId}/transactions/${transactionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newName,
          requirements: transaction.requirements || [],
          procedures: transaction.procedures || []
        })
      });
      const updated = await response.json();
      if (!response.ok) throw new Error(updated.message || 'Failed to update transaction name');
      setDepartments(departments.map(d =>
        d.id === deptId
          ? {
              ...d,
              transactions: d.transactions.map(t => t.id === transactionId ? updated : t)
            }
          : d
      ));
    } catch (error) {
      console.error('Failed to update transaction name:', error);
    }
  };

  const deleteTransaction = (deptId, transactionId) => {
    setDepartments(departments.map(d =>
      d.id === deptId
        ? { ...d, transactions: d.transactions.filter(t => t.id !== transactionId) }
        : d
    ));
  };

  const archiveTransaction = (deptId, transactionId) => {
    setDepartments(departments.map(d =>
      d.id === deptId
        ? {
            ...d,
            transactions: d.transactions.map(t =>
              t.id === transactionId ? { ...t, archived: true } : t
            )
          }
        : d
    ));
  };

  const restoreTransaction = (deptId, transactionId) => {
    setDepartments(departments.map(d =>
      d.id === deptId
        ? {
            ...d,
            transactions: d.transactions.map(t =>
              t.id === transactionId ? { ...t, archived: false } : t
            )
          }
        : d
    ));
  };

  // Requirements management
  const addRequirement = async (deptId, transactionId, requirement) => {
    const department = departments.find(d => d.id === deptId);
    const transaction = department?.transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    const newReq = { id: Date.now() + Math.random(), text: requirement };
    const updatedReqs = [...(transaction.requirements || []), newReq];
    try {
      const response = await fetch(`${API_BASE_URL}/departments/${deptId}/transactions/${transactionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: transaction.name,
          requirements: updatedReqs,
          procedures: transaction.procedures || []
        })
      });
      const updated = await response.json();
      if (!response.ok) throw new Error(updated.message || 'Failed to add requirement');
      setDepartments(departments.map(d =>
        d.id === deptId
          ? {
              ...d,
              transactions: d.transactions.map(t => t.id === transactionId ? updated : t)
            }
          : d
      ));
    } catch (error) {
      console.error('Failed to add requirement:', error);
    }
  };

  const editRequirement = async (deptId, transactionId, reqId, newText) => {
    const department = departments.find(d => d.id === deptId);
    const transaction = department?.transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    const updatedReqs = (transaction.requirements || []).map(r => r.id === reqId ? { ...r, text: newText } : r);
    try {
      const response = await fetch(`${API_BASE_URL}/departments/${deptId}/transactions/${transactionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: transaction.name,
          requirements: updatedReqs,
          procedures: transaction.procedures || []
        })
      });
      const updated = await response.json();
      if (!response.ok) throw new Error(updated.message || 'Failed to edit requirement');
      setDepartments(departments.map(d =>
        d.id === deptId
          ? {
              ...d,
              transactions: d.transactions.map(t => t.id === transactionId ? updated : t)
            }
          : d
      ));
    } catch (error) {
      console.error('Failed to edit requirement:', error);
    }
  };

  const deleteRequirement = async (deptId, transactionId, reqId) => {
    const department = departments.find(d => d.id === deptId);
    const transaction = department?.transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    const updatedReqs = (transaction.requirements || []).filter(r => r.id !== reqId);
    try {
      const response = await fetch(`${API_BASE_URL}/departments/${deptId}/transactions/${transactionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: transaction.name,
          requirements: updatedReqs,
          procedures: transaction.procedures || []
        })
      });
      const updated = await response.json();
      if (!response.ok) throw new Error(updated.message || 'Failed to delete requirement');
      setDepartments(departments.map(d =>
        d.id === deptId
          ? {
              ...d,
              transactions: d.transactions.map(t => t.id === transactionId ? updated : t)
            }
          : d
      ));
    } catch (error) {
      console.error('Failed to delete requirement:', error);
    }
  };

  // Procedures management
  const addProcedure = async (deptId, transactionId, procedure) => {
    const department = departments.find(d => d.id === deptId);
    const transaction = department?.transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    const newProc = { id: Date.now() + Math.random(), text: procedure };
    const updatedProcs = [...(transaction.procedures || []), newProc];
    try {
      const response = await fetch(`${API_BASE_URL}/departments/${deptId}/transactions/${transactionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: transaction.name,
          requirements: transaction.requirements || [],
          procedures: updatedProcs
        })
      });
      const updated = await response.json();
      if (!response.ok) throw new Error(updated.message || 'Failed to add procedure');
      setDepartments(departments.map(d =>
        d.id === deptId
          ? {
              ...d,
              transactions: d.transactions.map(t => t.id === transactionId ? updated : t)
            }
          : d
      ));
    } catch (error) {
      console.error('Failed to add procedure:', error);
    }
  };

  const editProcedure = async (deptId, transactionId, procId, newText) => {
    const department = departments.find(d => d.id === deptId);
    const transaction = department?.transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    const updatedProcs = (transaction.procedures || []).map(p => p.id === procId ? { ...p, text: newText } : p);
    try {
      const response = await fetch(`${API_BASE_URL}/departments/${deptId}/transactions/${transactionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: transaction.name,
          requirements: transaction.requirements || [],
          procedures: updatedProcs
        })
      });
      const updated = await response.json();
      if (!response.ok) throw new Error(updated.message || 'Failed to edit procedure');
      setDepartments(departments.map(d =>
        d.id === deptId
          ? {
              ...d,
              transactions: d.transactions.map(t => t.id === transactionId ? updated : t)
            }
          : d
      ));
    } catch (error) {
      console.error('Failed to edit procedure:', error);
    }
  };

  const deleteProcedure = (deptId, transactionId, procId) => {
    setDepartments(departments.map(d =>
      d.id === deptId
        ? {
            ...d,
            transactions: d.transactions.map(t =>
              t.id === transactionId
                ? { ...t, procedures: t.procedures.filter(p => p.id !== procId) }
                : t
            )
          }
        : d
    ));
  };

  return (
    <DepartmentsContext.Provider value={{
      departments,
      loading,
      addDepartment,
      editDepartment,
      deleteDepartment,
      archiveDepartment,
      restoreDepartment,
      addTransaction,
      editTransactionName,
      deleteTransaction,
      archiveTransaction,
      restoreTransaction,
      addRequirement,
      editRequirement,
      deleteRequirement,
      addProcedure,
      editProcedure,
      deleteProcedure
    }}>
      {children}
    </DepartmentsContext.Provider>
  );
};

export const useDepartments = () => useContext(DepartmentsContext); 