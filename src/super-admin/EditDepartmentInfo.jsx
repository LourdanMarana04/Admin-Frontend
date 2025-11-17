import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Archive, RotateCcw, Edit } from 'lucide-react';
import { useDepartments } from '../utils/DepartmentsContext.jsx';

const EditDepartmentInfo = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { departments, addTransaction, deleteTransaction, archiveTransaction, restoreTransaction, editDepartment } = useDepartments();
  const department = departments.find(d => d.id === Number(id));
  const [newTransaction, setNewTransaction] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(department.description || '');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(department.name);

  if (!department) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold text-red-700">Department Not Found</h1>
        </div>
      </div>
    );
  }

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!newTransaction.trim()) return;
    await addTransaction(department.id, newTransaction.trim());
    setNewTransaction('');
    setSuccessMessage('Transaction added successfully!');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleEditTransaction = (transactionId) => {
    navigate(`/edit-transaction/${department.id}/${transactionId}`);
  };

  const handleDeleteClick = (tx) => {
    setTransactionToDelete(tx);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (transactionToDelete) {
      await deleteTransaction(department.id, transactionToDelete.id);
      setShowDeleteModal(false);
      setTransactionToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setTransactionToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {successMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transition-all">
          {successMessage}
        </div>
      )}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-3xl font-bold text-blue-700">{department.name}</h1>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Department Information</h2>
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-semibold">Department name:</span>
            {!editingName ? (
              <>
                <span>{department.name}</span>
                <button
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  onClick={() => setEditingName(true)}
                >
                  <Edit className="w-4 h-4 inline" />
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  className="border border-gray-300 rounded px-2 py-1 mr-2"
                  value={nameValue}
                  onChange={e => setNameValue(e.target.value)}
                  autoFocus
                />
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded mr-1"
                  onClick={async () => {
                    await editDepartment(department.id, nameValue, department.description);
                    setEditingName(false);
                    setSuccessMessage('Department name updated successfully!');
                    setTimeout(() => setSuccessMessage(''), 2000);
                  }}
                >Save</button>
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-2 py-1 rounded"
                  onClick={() => {
                    setNameValue(department.name);
                    setEditingName(false);
                  }}
                >Cancel</button>
              </>
            )}
          </div>
          <div className="mb-2 flex items-center gap-2">
            <span className="font-semibold">Description:</span>
            {!editingDescription ? (
              <>
                {department.description || <span className="text-gray-400">(No description)</span>}
                <button
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  onClick={() => setEditingDescription(true)}
                >
                  <Edit className="w-4 h-4 inline" />
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  className="border border-gray-300 rounded px-2 py-1 mr-2"
                  value={descriptionValue}
                  onChange={e => setDescriptionValue(e.target.value)}
                  autoFocus
                />
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded mr-1"
                  onClick={async () => {
                    await editDepartment(department.id, department.name, descriptionValue);
                    setEditingDescription(false);
                    setSuccessMessage('Description updated successfully!');
                    setTimeout(() => setSuccessMessage(''), 2000);
                  }}
                >Save</button>
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-2 py-1 rounded"
                  onClick={() => {
                    setDescriptionValue(department.description || '');
                    setEditingDescription(false);
                  }}
                >Cancel</button>
              </>
            )}
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Transactions</h2>
        <form onSubmit={handleAddTransaction} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTransaction}
            onChange={e => setNewTransaction(e.target.value)}
            placeholder="Add new transaction"
            className="flex-1 px-3 py-2 border border-gray-300 rounded"
          />
          <button
            type="submit"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-4">Transaction Name</th>
              <th className="text-left py-2 px-4">Status</th>
              <th className="text-left py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {department.transactions.length === 0 && (
              <tr><td colSpan={3} className="text-center text-gray-400 py-4">No transactions yet.</td></tr>
            )}
            {department.transactions.map(tx => (
              <tr key={tx.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">{tx.name}</td>
                <td className="py-2 px-4">
                  {tx.archived ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">Archived</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                  )}
                </td>
                <td className="py-2 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTransaction(tx.id)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" /> Edit
                    </button>
                    {!tx.archived ? (
                      <>
                        <button
                          onClick={() => archiveTransaction(department.id, tx.id)}
                          className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium hover:bg-yellow-200"
                        >
                          <Archive className="w-3 h-3" /> Archive
                        </button>
                        <button
                          onClick={() => handleDeleteClick(tx)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => restoreTransaction(department.id, tx.id)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200"
                      >
                        <RotateCcw className="w-3 h-3" /> Restore
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
            <p className="mb-6">Are you sure you want to delete the transaction <span className="font-semibold">{transactionToDelete?.name}</span>? This action cannot be undone.</p>
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

export default EditDepartmentInfo; 