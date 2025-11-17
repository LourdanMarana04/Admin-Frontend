import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDepartments } from '../utils/DepartmentsContext.jsx';
import { ArrowLeft, Plus, Trash2, Edit } from 'lucide-react';
import { useEffect } from 'react';

const defaultFormTemplate = `<div style="font-family: Arial, sans-serif; font-size: 14px;">
  <div style="display: flex; justify-content: space-between;">
    <span><b>ASSESSOR'S OFFICE</b></span>
    <span><b>FORM A</b></span>
  </div>
  <div style="margin-top: 10px; font-weight: bold;">REAL PROPERTY TAX COMPUTATION / VERIFICATION</div>
  <div style="margin-top: 10px;">Name of Owner: ________________________________</div>
  <div style="margin-top: 10px;">Location of Property: Blk: ____  Lot: ____  Phase: ____</div>
  <div style="margin-top: 5px;">Subdivision: ________________________________</div>
  <div style="margin-top: 5px;">Barangay: ________________________________</div>
  <div style="margin-top: 10px; border: 1px solid #000; padding: 5px;">
    <div>TD No. Land: ____________________</div>
    <div>TD No. Building: ________________</div>
  </div>
  <div style="margin-top: 10px; display: flex; justify-content: space-between;">
    <span>Served: ____________________</span>
    <span>Date: ____________________</span>
  </div>
</div>`;

const EditTransaction = () => {
  const { deptId, transactionId } = useParams();
  const navigate = useNavigate();
  const {
    departments,
    editTransactionName,
    addRequirement,
    editRequirement,
    deleteRequirement,
    addProcedure,
    editProcedure,
    deleteProcedure
  } = useDepartments();

  const department = departments.find(d => d.id === Number(deptId));
  const transaction = department?.transactions.find(t => t.id === Number(transactionId));

  const [editName, setEditName] = useState(transaction?.name || '');
  const [newRequirement, setNewRequirement] = useState('');
  const [editingReqId, setEditingReqId] = useState(null);
  const [editingReqText, setEditingReqText] = useState('');
  const [newProcedure, setNewProcedure] = useState('');
  const [newProcedureWhere, setNewProcedureWhere] = useState('');
  const [editingProcId, setEditingProcId] = useState(null);
  const [editingProcText, setEditingProcText] = useState('');
  const [editingProcWhere, setEditingProcWhere] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showEditReqModal, setShowEditReqModal] = useState(false);
  const [showDeleteReqModal, setShowDeleteReqModal] = useState(false);
  const [reqToEdit, setReqToEdit] = useState(null);
  const [reqToDelete, setReqToDelete] = useState(null);
  const [editReqText, setEditReqText] = useState('');
  const [showEditProcModal, setShowEditProcModal] = useState(false);
  const [showDeleteProcModal, setShowDeleteProcModal] = useState(false);
  const [procToEdit, setProcToEdit] = useState(null);
  const [procToDelete, setProcToDelete] = useState(null);
  const [editProcText, setEditProcText] = useState('');
  const [showAddReqModal, setShowAddReqModal] = useState(false);
  const [addReqText, setAddReqText] = useState('');
  const [addReqWhere, setAddReqWhere] = useState('');
  const [addReqHasForm, setAddReqHasForm] = useState(false);
  const [editReqWhere, setEditReqWhere] = useState('');
  // Add state for editReqHasForm
  const [editReqHasForm, setEditReqHasForm] = useState(false);
  // Remove all formFields, fieldsDraft, showFormModal, and related handlers and UI
  // Remove the Transaction Form Structure section entirely

  useEffect(() => {
    // setFieldsDraft(formFields); // This line is no longer needed
  }, []); // Removed formFields from dependency array

  if (!department || !transaction) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold text-red-700">Transaction Not Found</h1>
        </div>
      </div>
    );
  }

  // Transaction name edit
  const handleSaveName = async () => {
    if (editName.trim()) {
      await editTransactionName(department.id, transaction.id, editName.trim());
      setSuccessMessage('Transaction name saved successfully!');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };

  // Requirements
  const handleAddRequirement = async (e) => {
    e.preventDefault();
    if (addReqText.trim()) {
      await addRequirement(department.id, transaction.id, { text: addReqText.trim(), where: addReqWhere.trim(), hasForm: addReqHasForm, formContent: '' });
      setAddReqText('');
      setAddReqWhere('');
      setAddReqHasForm(false);
      setShowAddReqModal(false);
      setSuccessMessage('Requirement added successfully!');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };
  const handleEditRequirement = (reqId, text, where, hasForm) => {
    setReqToEdit(reqId);
    setEditReqText(text);
    setEditReqWhere(where || '');
    setEditReqHasForm(hasForm || false);
    setShowEditReqModal(true);
  };
  const handleSaveRequirement = async () => {
    if (editReqText.trim() && reqToEdit !== null) {
      await editRequirement(department.id, transaction.id, reqToEdit, {
        text: editReqText.trim(),
        where: editReqWhere.trim(),
        hasForm: editReqHasForm,
      });
      setShowEditReqModal(false);
      setReqToEdit(null);
      setEditReqText('');
      setEditReqWhere('');
      setEditReqHasForm(false);
      setSuccessMessage('Requirement saved successfully!');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };
  const handleDeleteRequirement = (reqId) => {
    setReqToDelete(reqId);
    setShowDeleteReqModal(true);
  };
  const confirmDeleteRequirement = async () => {
    if (reqToDelete !== null) {
      await deleteRequirement(department.id, transaction.id, reqToDelete);
      setShowDeleteReqModal(false);
      setReqToDelete(null);
      setSuccessMessage('Requirement deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };

  // Procedures
  const handleAddProcedure = async (e) => {
    e.preventDefault();
    if (newProcedure.trim()) {
      await addProcedure(department.id, transaction.id, { text: newProcedure.trim(), where: newProcedureWhere.trim() });
      setNewProcedure('');
      setNewProcedureWhere('');
      setSuccessMessage('Procedure added successfully!');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };
  const handleEditProcedure = (procId, text, where) => {
    setProcToEdit(procId);
    setEditProcText(text);
    setEditingProcWhere(where || '');
    setShowEditProcModal(true);
  };
  const handleSaveProcedure = async () => {
    if (editProcText.trim() && procToEdit !== null) {
      await editProcedure(department.id, transaction.id, procToEdit, { text: editProcText.trim(), where: editingProcWhere.trim() });
      setShowEditProcModal(false);
      setProcToEdit(null);
      setEditProcText('');
      setEditingProcWhere('');
      setSuccessMessage('Procedure saved successfully!');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };
  const handleDeleteProcedure = (procId) => {
    setProcToDelete(procId);
    setShowDeleteProcModal(true);
  };
  const confirmDeleteProcedure = async () => {
    if (procToDelete !== null) {
      await deleteProcedure(department.id, transaction.id, procToDelete);
      setShowDeleteProcModal(false);
      setProcToDelete(null);
      setSuccessMessage('Procedure deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };

  // Multiline textarea handler (Shift+Enter for new line, Enter alone is blocked)
  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevents line break on Enter alone
    }
    // Shift+Enter will naturally create a new line (default behavior)
  };

  // Save form template to transaction (local state for now)
  // const handleSaveFormTemplate = () => { // This function is no longer needed
  //   // In a real app, you would update the backend here
  //   transaction.formTemplate = formTemplateDraft;
  //   setFormTemplate(formTemplateDraft);
  //   setShowFormModal(false);
  //   setSuccessMessage('Form template saved successfully!');
  //   setTimeout(() => setSuccessMessage(''), 2000);
  // };

  // const handleAddOrEditForm = () => { // This function is no longer needed
  //   setFormTemplateDraft(formTemplate || defaultFormTemplate);
  //   setShowFormModal(true);
  // };

  // const handleOpenFormModal = () => { // This function is no longer needed
  //   setFieldsDraft(formFields);
  //   setShowFormModal(true);
  // };
  // const handleFieldChange = (idx, key, value) => { // This function is no longer needed
  //   setFieldsDraft(prev => prev.map((f, i) => i === idx ? { ...f, [key]: value } : f));
  // };
  // const handleAddField = () => { // This function is no longer needed
  //   setFieldsDraft(prev => [...prev, { label: '', placeholder: '' }]);
  // };
  // const handleRemoveField = (idx) => { // This function is no longer needed
  //   setFieldsDraft(prev => prev.filter((_, i) => i !== idx));
  // };
  // const handleSaveFormFields = () => { // This function is no longer needed
  //   transaction.formFields = fieldsDraft;
  //   setFormFields(fieldsDraft);
  //   setShowFormModal(false);
  //   setSuccessMessage('Form structure saved successfully!');
  //   setTimeout(() => setSuccessMessage(''), 2000);
  // };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {successMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transition-all">
          {successMessage}
        </div>
      )}
      {/* Edit Requirement Modal */}
      {showEditReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <h2 className="text-xl font-bold mb-4 text-blue-700">Edit Requirement</h2>
            <textarea
              value={editReqText}
              onChange={e => setEditReqText(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded mb-4 resize-y"
              placeholder="Requirement (Use Shift+Enter for new lines)"
              rows="4"
            />
            <textarea
              value={editReqWhere}
              onChange={e => setEditReqWhere(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded mb-4 resize-y"
              placeholder="Where to Secure (Use Shift+Enter for new lines)"
              rows="3"
            />
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="editReqHasForm"
                checked={editReqHasForm}
                onChange={e => setEditReqHasForm(e.target.checked)}
              />
              <label htmlFor="editReqHasForm" className="text-sm">Has Form</label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEditReqModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRequirement}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Requirement Modal */}
      {showDeleteReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <h2 className="text-xl font-bold mb-4 text-red-700">Confirm Delete</h2>
            <p className="mb-6">Are you sure you want to delete this requirement? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteReqModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRequirement}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Procedure Modal */}
      {showEditProcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <h2 className="text-xl font-bold mb-4 text-blue-700">Edit Procedure</h2>
            <textarea
              value={editProcText}
              onChange={e => setEditProcText(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded mb-4 resize-y"
              placeholder="Procedure (Use Shift+Enter for new lines)"
              rows="4"
            />
            <textarea
              value={editingProcWhere}
              onChange={e => setEditingProcWhere(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded mb-4 resize-y"
              placeholder="Where (Use Shift+Enter for new lines)"
              rows="3"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEditProcModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProcedure}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Procedure Modal */}
      {showDeleteProcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <h2 className="text-xl font-bold mb-4 text-red-700">Confirm Delete</h2>
            <p className="mb-6">Are you sure you want to delete this procedure? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteProcModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProcedure}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Requirement Modal */}
      {showAddReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <h2 className="text-xl font-bold mb-4 text-blue-700">Add Requirement</h2>
            <form onSubmit={handleAddRequirement}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Requirement</label>
                <textarea
                  value={addReqText}
                  onChange={e => setAddReqText(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded resize-y"
                  placeholder="Use Shift+Enter for new lines"
                  rows="4"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Where to Secure</label>
                <textarea
                  value={addReqWhere}
                  onChange={e => setAddReqWhere(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded resize-y"
                  placeholder="Use Shift+Enter for new lines"
                  rows="3"
                />
              </div>
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="addReqHasForm"
                  checked={addReqHasForm}
                  onChange={e => setAddReqHasForm(e.target.checked)}
                />
                <label htmlFor="addReqHasForm" className="text-sm">Has Form</label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddReqModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Remove all formFields, fieldsDraft, showFormModal, and related handlers and UI */}
      {/* Remove the Transaction Form Structure section entirely */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-3xl font-bold text-blue-700">Edit Transaction</h1>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Transaction Name</label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded flex-1"
            />
            <button
              onClick={handleSaveName}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
            >
              Save
            </button>
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-2 text-gray-800">Checklist Requirements</h2>
          <button
            onClick={() => setShowAddReqModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg mb-4"
          >
            <Plus className="w-4 h-4" /> Add Requirement
          </button>
        </div>
        <div className="mb-8">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Requirement</th>
                <th className="py-2 px-4 text-left">Where to Secure</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transaction.requirements && transaction.requirements.length === 0 && (
                <tr><td colSpan={3} className="text-gray-400 py-2 px-4">No requirements yet.</td></tr>
              )}
              {transaction.requirements && transaction.requirements.map(req => (
                <tr key={req.id}>
                  <td className="py-2 px-4 whitespace-pre-wrap break-words">
                    {typeof req.text === 'object' && req.text !== null ? req.text.text : req.text}
                  </td>
                  <td className="py-2 px-4 whitespace-pre-wrap break-words">
                    {typeof req.text === 'object' && req.text !== null ? req.text.where : req.where || ''}
                  </td>
                  <td className="py-2 px-4 flex gap-1">
                    <button onClick={() => handleEditRequirement(
                      req.id,
                      typeof req.text === 'object' && req.text !== null ? req.text.text : req.text,
                      typeof req.text === 'object' && req.text !== null ? req.text.where : req.where || '',
                      req.hasForm !== undefined ? req.hasForm : req.text?.hasForm || false
                    )} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium hover:bg-yellow-200 mr-1"><Edit className="w-3 h-3" /></button>
                    <button onClick={() => handleDeleteRequirement(req.id)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"><Trash2 className="w-3 h-3" /></button>
                    {((req.hasForm !== undefined ? req.hasForm : req.text?.hasForm) || false) && (
                      <button
                        onClick={() => navigate(`/superadmin/transactions/${department.id}/${transaction.id}/requirement/${req.id}/form-edit`)}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200"
                      >
                        Edit Form
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h2 className="text-lg font-bold mb-2 text-gray-800">Procedures</h2>
          <form onSubmit={handleAddProcedure} className="flex gap-2 mb-4">
            <div className="flex-1 flex flex-col gap-2">
              <input
                type="text"
                value={newProcedure}
                onChange={e => setNewProcedure(e.target.value)}
                placeholder="Add procedure"
                className="px-3 py-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                value={newProcedureWhere}
                onChange={e => setNewProcedureWhere(e.target.value)}
                placeholder="Where"
                className="px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </form>
        </div>
        <div>
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Procedure</th>
                <th className="py-2 px-4 text-left">Where</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transaction.procedures && transaction.procedures.length === 0 && (
                <tr><td colSpan={3} className="text-gray-400 py-2 px-4">No procedures yet.</td></tr>
              )}
              {transaction.procedures && transaction.procedures.map((proc, idx) => (
                <tr key={proc.id}>
                  <td className="py-2 px-4 whitespace-pre-wrap break-words">
                    <span>
                      {typeof proc.text === 'object' && proc.text !== null
                        ? proc.text.text || ''
                        : proc.text}
                    </span>
                  </td>
                  <td className="py-2 px-4 whitespace-pre-wrap break-words">
                    <span>
                      {typeof proc.text === 'object' && proc.text !== null
                        ? proc.text.where || ''
                        : ''}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    <button onClick={() => handleEditProcedure(
                      proc.id, 
                      typeof proc.text === 'object' && proc.text !== null ? proc.text.text : proc.text,
                      typeof proc.text === 'object' && proc.text !== null ? proc.text.where : ''
                    )} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium hover:bg-yellow-200 mr-1"><Edit className="w-3 h-3" /></button>
                    <button onClick={() => handleDeleteProcedure(proc.id)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"><Trash2 className="w-3 h-3" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Remove all formFields, fieldsDraft, showFormModal, and related handlers and UI */}
        {/* Remove the Transaction Form Structure section entirely */}
      </div>
    </div>
  );
};

export default EditTransaction; 