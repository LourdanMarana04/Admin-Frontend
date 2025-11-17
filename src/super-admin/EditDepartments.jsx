import React, { useState } from 'react';
import { Plus, Edit, Trash2, Archive, CheckCircle, ArrowLeft, X } from 'lucide-react';
import { useDepartments } from '../utils/DepartmentsContext.jsx';
import { useNavigate } from 'react-router-dom';

const EditDepartments = () => {
  const { departments, addDepartment, editDepartment, deleteDepartment, archiveDepartment, restoreDepartment } = useDepartments();
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [description, setDescription] = useState('');
  const [transactions, setTransactions] = useState(['']);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/superdepartments');
  };

  const handleEditDepartmentInfo = (dept) => {
    navigate(`/edit-department/${dept.id}`, { state: { department: dept } });
  };

  const handleModalOpen = () => {
    setDeptName('');
    setDescription('');
    setTransactions(['']);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleTransactionChange = (idx, value) => {
    setTransactions(transactions.map((t, i) => (i === idx ? value : t)));
  };

  const handleAddTransaction = () => {
    setTransactions([...transactions, '']);
  };

  const handleRemoveTransaction = (idx) => {
    setTransactions(transactions.filter((_, i) => i !== idx));
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!deptName.trim()) return;
    // Save department with description and transactions
    const newDept = await addDepartment(deptName, description, transactions.filter(t => t.trim() !== ''));
    setShowModal(false);
    // Redirect to EditDepartmentInfo for the new department
    if (newDept && newDept.id) {
      navigate(`/edit-department/${newDept.id}`);
    }
  };

  const handleDeleteClick = (dept) => {
    setDeptToDelete(dept);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (deptToDelete) {
      await deleteDepartment(deptToDelete.id);
      setShowDeleteModal(false);
      setDeptToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeptToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-3xl font-bold text-blue-700">Edit Departments</h1>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex gap-4 mb-4">
          <button
            onClick={handleModalOpen}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4" /> Add Department
          </button>
        </div>
        {/* Modal Popup for Adding Department */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
              <button
                onClick={handleModalClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold mb-4 text-blue-700">Add Department</h2>
              <form onSubmit={handleAddDepartment}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Department Name<span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={deptName}
                    onChange={e => setDeptName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Transactions</label>
                  {transactions.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={t}
                        onChange={e => handleTransactionChange(idx, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded"
                        placeholder={`Transaction #${idx + 1}`}
                      />
                      {transactions.length > 1 && (
                        <button type="button" onClick={() => handleRemoveTransaction(idx)} className="text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={handleAddTransaction} className="text-xs text-blue-600 hover:underline mt-1">+ Add Transaction</button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    Add Department
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-4">Department Name</th>
              <th className="text-left py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.filter(dept => dept.active !== false).map(dept => (
              <tr key={dept.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">
                  {dept.name}
                </td>
                <td className="py-2 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditDepartmentInfo(dept)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    {dept.active ? (
                      <>
                        <button
                          onClick={() => archiveDepartment(dept.id)}
                          className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium hover:bg-yellow-200"
                        >
                          <Archive className="w-3 h-3" /> Archive
                        </button>
                        <button
                          onClick={() => handleDeleteClick(dept)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => restoreDepartment(dept.id)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <h2 className="text-xl font-bold mb-4 text-red-700">Confirm Delete</h2>
            <p className="mb-6">Are you sure you want to delete the department <span className="font-semibold">{deptToDelete?.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelDelete}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditDepartments; 