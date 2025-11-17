import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDepartments } from '../utils/DepartmentsContext.jsx';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';

const EditRequirementForm = () => {
  const { deptId, transactionId, reqId } = useParams();
  const navigate = useNavigate();
  const { departments, editRequirement, fetchDepartments } = useDepartments();

  const department = departments.find(d => d.id === Number(deptId));
  const transaction = department?.transactions.find(t => t.id === Number(transactionId));
  const requirement = transaction?.requirements.find(r => r.id === Number(reqId));

  console.log('Loaded requirement after refresh:', requirement);
  const [formContent, setFormContent] = useState(requirement?.text?.formContent || '');
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef();
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfFields, setPdfFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [parsedFields, setParsedFields] = useState([]);
  const [parsedFieldValues, setParsedFieldValues] = useState({});
  const [editFieldsMode, setEditFieldsMode] = useState(false);
  const [editedFields, setEditedFields] = useState([]);
  const [formTitle, setFormTitle] = useState('Form Title');
  const [editedFormTitle, setEditedFormTitle] = useState('Form Title');
  const [editPdfFieldsMode, setEditPdfFieldsMode] = useState(false);
  const [editedPdfFields, setEditedPdfFields] = useState([]);

  useEffect(() => {
    if (requirement?.text?.fields && requirement.text.fields.length > 0) {
      setParsedFields(requirement.text.fields);
      setFormTitle(requirement.text.formTitle || 'Form Title');
      setParsedFieldValues(
        requirement.text.fields.reduce((acc, f) => ({ ...acc, [f.name]: '' }), {})
      );
    } else if (formContent && formContent.startsWith('data:application/pdf')) {
      extractPdfFields(formContent);
    }
    // eslint-disable-next-line
  }, [requirement, formContent]);

  if (!department || !transaction || !requirement) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition duration-200"
          >
            Back
          </button>
          <h1 className="text-2xl font-bold text-red-700">Requirement Not Found</h1>
        </div>
      </div>
    );
  }

  const handleFileChange = (e) => {
    setUploadError('');
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  // Extract fillable fields from PDF (AcroForm)
  const extractPdfFields = async (pdfDataUrl) => {
    console.log('extractPdfFields called');
    try {
      const base64 = pdfDataUrl.split(',')[1];
      const uint8Array = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const pdfDoc = await PDFDocument.load(uint8Array);
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      const extracted = fields.map(field => {
        let value = '';
        let type = field.constructor.name;
        // Support all PDFTextField types
        if (type.startsWith('PDFTextField')) {
          value = field.getText ? field.getText() : '';
          type = 'PDFTextField'; // Normalize for rendering
        } else if (type.startsWith('PDFCheckBox')) {
          value = field.isChecked ? field.isChecked() : false;
          type = 'PDFCheckBox'; // Normalize for rendering
        }
        return {
          name: field.getName(),
          type,
          value,
          required: true,
        };
      });
      setPdfFields(extracted);
      setFieldValues(
        extracted.reduce((acc, f) => ({ ...acc, [f.name]: f.value || (f.type === 'PDFCheckBox' ? false : '') }), {})
      );
      // If no fillable fields, try to parse text fields and checkboxes
      if (extracted.length === 0) {
        await extractTextAndParseFields(uint8Array);
      } else {
        setParsedFields([]);
        setParsedFieldValues({});
      }
    } catch (err) {
      console.error('Error in extractPdfFields:', err);
      setPdfFields([]);
      setFieldValues({});
      // Try to parse text fields and checkboxes from text
      try {
        const base64 = pdfDataUrl.split(',')[1];
        const uint8Array = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        await extractTextAndParseFields(uint8Array);
      } catch (e) {
        console.error('Error in fallback extractTextAndParseFields:', e);
        setParsedFields([]);
        setParsedFieldValues({});
      }
    }
  };

  // Extract text from PDF and parse for fields and checkboxes
  const extractTextAndParseFields = async (uint8Array) => {
    console.log('extractTextAndParseFields called');
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    console.log('Extracted PDF text:', fullText);
    // New logic: every occurrence of 'Label:' is a field
    const lines = fullText.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
    const fields = [];
    lines.forEach(line => {
      // Ignore lines that are just lines (underscores, dashes, etc.)
      if (/^[_\-—\.\s]+$/.test(line)) return;
      // Find all occurrences of 'Label:' in the line
      let matches = [...line.matchAll(/([^:]+):/g)];
      matches.forEach(match => {
        let label = match[1].trim();
        // Remove trailing underscores, dashes, lines, and extra spaces
        label = label.replace(/[_\-—\.\s]+$/, '').trim();
        if (label.length > 0) {
          fields.push({ type: 'text', name: label, required: true });
        }
      });
    });
    setParsedFields(fields);
    setParsedFieldValues(fields.reduce((acc, f) => ({ ...acc, [f.name]: f.type === 'checkbox' ? false : '' }), {}));
    // In extractTextAndParseFields, set the form title to the first non-empty line
    let firstTitle = '';
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] && !/^[_\-—\.\s]+$/.test(lines[i])) {
        firstTitle = lines[i];
        break;
      }
    }
    setFormTitle(firstTitle || 'Form Title');
    setEditedFormTitle(firstTitle || 'Form Title');
  };

  // When a PDF is uploaded, extract fields
  const handleUpload = () => {
    if (!selectedFile) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      setFormContent(event.target.result);
      await editRequirement(
        department.id,
        transaction.id,
        requirement.id,
        {
          ...requirement.text,
          hasForm: requirement.hasForm !== undefined ? requirement.hasForm : true,
          formContent: event.target.result
        }
      );
      setSuccessMessage('PDF form uploaded and saved!');
      setTimeout(() => setSuccessMessage(''), 2000);
      setSelectedFile(null);
      await fetchDepartments();
      // Extract fields after upload
      extractPdfFields(event.target.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Handle field value change
  const handleFieldChange = (name, value) => {
    setFieldValues(prev => ({ ...prev, [name]: value }));
  };

  // Handle parsed field value change
  const handleParsedFieldChange = (name, value) => {
    setParsedFieldValues(prev => ({ ...prev, [name]: value }));
  };

  // Handle Shift+Enter for multiline in textarea
  const handleTextareaKeyDown = (e, name) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Regular Enter - prevent default (prevents line break)
      e.preventDefault();
    }
    // Shift+Enter will naturally create a new line (default behavior)
  };

  const handleRemove = async () => {
    setShowRemoveConfirm(true);
  };

  const confirmRemove = async () => {
    setFormContent('');
    await editRequirement(
      department.id,
      transaction.id,
      requirement.id,
      {
        ...requirement.text,
        hasForm: requirement.hasForm !== undefined ? requirement.hasForm : true,
        formContent: '',
        fields: [],
        formTitle: ''
      }
    );
    setSuccessMessage('PDF form removed.');
    setTimeout(() => setSuccessMessage(''), 2000);
    await fetchDepartments();
    setShowRemoveConfirm(false);
    setParsedFields([]);
    setParsedFieldValues({});
    setPdfFields([]);
    setFieldValues({});
    setFormTitle('Form Title');
    setEditedFormTitle('Form Title');
  };

  const cancelRemove = () => {
    setShowRemoveConfirm(false);
  };

  // Remove a field from editedFields (edit mode)
  const handleRemoveField = (name) => {
    setEditedFields(fields => fields.filter(f => f.name !== name));
  };

  // Edit a field name in edit mode, store oldName for value remapping
  const handleEditFieldName = (idx, newName) => {
    setEditedFields(fields =>
      fields.map((f, i) =>
        i === idx ? { ...f, oldName: f.oldName || f.name, name: newName } : f
      )
    );
  };

  // Add a new field in edit mode
  const handleAddField = () => {
    setEditedFields(fields => [...fields, { type: 'text', name: 'New Field' }]);
  };

  // When entering edit mode, assign unique ids to fields for dnd-kit
  const startEditFields = () => {
    setEditedFields(parsedFields.map((f, i) => ({...f, id: f.id || `${f.name}-${i}-${Date.now()}`})));
    setEditedFormTitle(formTitle);
    setEditFieldsMode(true);
  };

  // When done editing, save editedFields to parsedFields and editedFormTitle to formTitle, and persist to backend
  const finishEditFields = async () => {
    const filteredFields = editedFields.filter(f => f.name.trim() !== '');
    // Remap values to new field names
    setParsedFieldValues(values => {
      const newValues = {};
      filteredFields.forEach(f => {
        // Try to preserve value if field was renamed
        const oldField = f.oldName && values.hasOwnProperty(f.oldName) ? f.oldName : f.name;
        newValues[f.name] = values[oldField] || '';
      });
      return newValues;
    });
    setParsedFields(filteredFields.map(f => ({ name: f.name, type: f.type, required: f.required })));
    setFormTitle(editedFormTitle.trim() || 'Form Title');
    setEditFieldsMode(false);

    // Save to backend
    await editRequirement(
      department.id,
      transaction.id,
      requirement.id,
      {
        ...requirement.text,
        formTitle: editedFormTitle.trim() || 'Form Title',
        fields: filteredFields.map(f => ({ name: f.name, type: f.type, required: f.required }))
      }
    );
    await fetchDepartments(); // Refresh local state from backend
    setSuccessMessage('Form changes saved!');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  // Remove a field from editedPdfFields (edit mode)
  const handleRemovePdfField = (name) => {
    setEditedPdfFields(fields => fields.filter(f => f.name !== name));
  };

  // Edit a pdf field name in edit mode
  const handleEditPdfFieldName = (idx, newName) => {
    setEditedPdfFields(fields => fields.map((f, i) => i === idx ? { ...f, name: newName } : f));
  };

  // Add a new pdf field in edit mode
  const handleAddPdfField = () => {
    setEditedPdfFields(fields => [...fields, { type: 'PDFTextField', name: 'New Field' }]);
  };

  // Add a new subtitle in edit mode for PDF fields
  const handleAddPdfSubtitle = () => {
    setEditedPdfFields(fields => [
      ...fields,
      { type: 'subtitle', name: 'New Subtitle', id: `subtitle-${fields.length}-${Date.now()}` }
    ]);
  };

  // Add a new static text in edit mode for PDF fields
  const handleAddPdfStaticText = () => {
    setEditedPdfFields(fields => [
      ...fields,
      { type: 'staticText', name: 'New text block', id: `staticText-${fields.length}-${Date.now()}` }
    ]);
  };

  // When entering edit mode for pdfFields, also allow editing the title
  const startEditPdfFields = () => {
    setEditedPdfFields(pdfFields.map((f, i) => ({ ...f, id: f.id || `${f.name}-${i}-${Date.now()}` })));
    setEditedFormTitle(formTitle);
    setEditPdfFieldsMode(true);
  };

  // When done editing, save editedPdfFields and editedFormTitle to pdfFields and backend
  const finishEditPdfFields = async () => {
    const filteredFields = editedPdfFields.filter(f => f.name.trim() !== '');
    setPdfFields(filteredFields);
    setFieldValues(values => {
      const newValues = {};
      filteredFields.forEach(f => {
        if (f.name.trim() !== '') newValues[f.name] = values[f.name] || '';
      });
      return newValues;
    });
    setFormTitle(editedFormTitle.trim() || 'Form Title');
    setEditPdfFieldsMode(false);
    // Save to backend
    await editRequirement(
      department.id,
      transaction.id,
      requirement.id,
      {
        ...requirement.text,
        formTitle: editedFormTitle.trim() || 'Form Title',
        fields: filteredFields
      }
    );
    await fetchDepartments();
    setSuccessMessage('Form changes saved!');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleToggleFieldRequired = (idx, isRequired) => {
    setEditedFields(fields =>
      fields.map((f, i) => (i === idx ? { ...f, required: isRequired } : f))
    );
  };

  const handleTogglePdfFieldRequired = (idx, isRequired) => {
    setEditedPdfFields(fields =>
      fields.map((f, i) => (i === idx ? { ...f, required: isRequired } : f))
    );
  };

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // dnd-kit drag end handler
  const handleDragEnd = (event) => {
    const {active, over} = event;
    if (active.id !== over?.id) {
      const oldIndex = editedFields.findIndex(f => f.id === active.id);
      const newIndex = editedFields.findIndex(f => f.id === over.id);
      setEditedFields(arrayMove(editedFields, oldIndex, newIndex));
    }
  };

  const handlePdfDragEnd = (event) => {
    const {active, over} = event;
    if (active.id !== over?.id) {
      const oldIndex = editedPdfFields.findIndex(f => f.id === active.id);
      const newIndex = editedPdfFields.findIndex(f => f.id === over.id);
      setEditedPdfFields(arrayMove(editedPdfFields, oldIndex, newIndex));
    }
  };

  // Sortable item component for dnd-kit
  function SortableField({id, idx, field, onEdit, onRemove, onToggleRequired}) {
    const {
      attributes,
      setNodeRef,
      transform,
      transition,
      isDragging,
      listeners
    } = useSortable({id});
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      background: isDragging ? '#f3f4f6' : undefined
    };
    if (field.type === 'subtitle') {
      return (
        <div ref={setNodeRef} style={style} className="flex flex-col relative mb-2 bg-gray-100 border-l-4 border-blue-400 px-2 py-1">
          <div className="flex items-center mb-1">
            <span {...attributes} {...listeners} className="cursor-move mr-2 text-gray-400">☰</span>
            <textarea
              value={field.name}
              onChange={e => onEdit(idx, e.target.value)}
              className="font-bold text-blue-700 bg-transparent border-b border-blue-300 flex-1 px-2 py-1 resize-y min-h-[32px]"
              rows={3}
            />
            <button
              type="button"
              className="ml-2 text-red-600 hover:text-red-800 font-bold text-lg"
              onClick={() => onRemove(field.name)}
              title="Remove subtitle"
            >
              ×
            </button>
          </div>
        </div>
      );
    }
    if (field.type === 'staticText') {
      return (
        <div ref={setNodeRef} style={style} className="flex flex-col relative mb-2 bg-yellow-50 border-l-4 border-yellow-400 px-2 py-1">
          <div className="flex items-center mb-1">
            <span {...attributes} {...listeners} className="cursor-move mr-2 text-gray-400">☰</span>
            <textarea
              value={field.name}
              onChange={e => onEdit(idx, e.target.value)}
              className="font-medium text-yellow-900 bg-transparent border-b border-yellow-300 flex-1 px-2 py-1 resize-y min-h-[32px]"
              rows={2}
            />
            <button
              type="button"
              className="ml-2 text-red-600 hover:text-red-800 font-bold text-lg"
              onClick={() => onRemove(field.name)}
              title="Remove text block"
            >
              ×
            </button>
          </div>
        </div>
      );
    }
    return (
      <div ref={setNodeRef} style={style} className="flex flex-col relative mb-2 bg-white">
        <div className="flex items-center mb-1">
          <span {...attributes} {...listeners} className="cursor-move mr-2 text-gray-400">☰</span>
          <textarea
            value={field.name}
            onChange={e => onEdit(idx, e.target.value)}
            className="border px-2 py-1 rounded flex-1 resize-y min-h-[32px]"
            rows={3}
          />
          <label className="ml-2 flex items-center text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={field.required !== false}
              onChange={e => onToggleRequired(idx, e.target.checked)}
              className="mr-1"
            />
            Required
          </label>
          <button
            type="button"
            className="ml-2 text-red-600 hover:text-red-800 font-bold text-lg"
            onClick={() => onRemove(field.name)}
            title="Remove field"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

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
          Back
        </button>
        <h1 className="text-3xl font-bold text-blue-700">Edit Requirement Form</h1>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 max-w-md min-w-[340px] mx-auto flex flex-col items-center">
        <h2 className="text-lg font-bold mb-4 text-gray-800 text-center">Upload PDF Form</h2>
        <div className="flex flex-col items-center w-full">
          <div className="flex items-center gap-3 mb-2 w-full justify-center">
            <input
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              onChange={handleFileChange}
              className=""
            />
            {selectedFile && (
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={handleUpload}
              >
                Upload
              </button>
            )}
          </div>
          {/* Show file name and remove button if a PDF is uploaded */}
          {formContent && formContent.startsWith('data:application/pdf') && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-700 font-mono truncate max-w-[180px]">
                {requirement?.text?.fileName || 'Uploaded PDF'}
              </span>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                onClick={handleRemove}
              >
                Remove
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                onClick={() => setShowPreview(true)}
              >
                Preview PDF
              </button>
            </div>
          )}
          {/* Show file name for selected file before upload */}
          {selectedFile && !formContent && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-700 font-mono truncate max-w-[180px]">{selectedFile.name}</span>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                onClick={() => setSelectedFile(null)}
              >
                Remove
              </button>
            </div>
          )}
        </div>
        {uploadError && <div className="text-red-600 mb-2 text-center w-full">{uploadError}</div>}
      </div>
      {/* Only render one panel: pdfFields if present, else parsedFields */}
      {pdfFields.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6 max-w-md min-w-[340px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            {!editPdfFieldsMode ? (
              <h3 className="text-lg font-bold text-gray-800">{formTitle}</h3>
            ) : (
              <textarea
                value={editedFormTitle}
                onChange={e => setEditedFormTitle(e.target.value)}
                onKeyDown={e => handleTextareaKeyDown(e, 'formTitle')}
                className="text-lg font-bold text-gray-800 border px-2 py-1 rounded flex-1 resize-y min-h-[32px]"
                rows={2}
              />
            )}
            {!editPdfFieldsMode ? (
              <button
                className="ml-2 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm"
                onClick={startEditPdfFields}
              >
                Edit
              </button>
            ) : (
              <button
                className="ml-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                onClick={finishEditPdfFields}
              >
                Done
              </button>
            )}
          </div>
          <form className="space-y-3">
            {!editPdfFieldsMode && pdfFields.map(field => (
              <div key={field.name} className="flex flex-col">
                <label className="font-semibold text-gray-700 mb-1">{field.name}</label>
                {field.type === 'PDFTextField' ? (
                  <textarea
                    value={fieldValues[field.name] || ''}
                    onChange={e => handleFieldChange(field.name, e.target.value)}
                    onKeyDown={e => handleTextareaKeyDown(e, field.name)}
                    className="border px-2 py-1 rounded resize-y"
                    rows={3}
                    placeholder="Use Shift+Enter for new lines"
                  />
                ) : field.type === 'PDFCheckBox' ? (
                  <input
                    type="checkbox"
                    checked={!!fieldValues[field.name]}
                    onChange={e => handleFieldChange(field.name, e.target.checked)}
                  />
                ) : field.type === 'subtitle' ? (
                  <div className="font-bold text-blue-700 bg-gray-100 border-l-4 border-blue-400 px-2 py-1 my-2">{field.name}</div>
                ) : field.type === 'staticText' ? (
                  <div className="font-medium text-yellow-900 bg-yellow-50 border-l-4 border-yellow-400 px-2 py-1 my-2 whitespace-pre-line">{field.name}</div>
                ) : (
                  <span className="text-gray-500">Unsupported field type: {field.type}</span>
                )}
              </div>
            ))}
            {editPdfFieldsMode && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePdfDragEnd}>
                <SortableContext items={editedPdfFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  {editedPdfFields.map((field, idx) => (
                    <SortableField
                      key={field.id}
                      id={field.id}
                      idx={idx}
                      field={field}
                      onEdit={handleEditPdfFieldName}
                      onRemove={handleRemovePdfField}
                      onToggleRequired={handleTogglePdfFieldRequired}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
            {editPdfFieldsMode && (
              <button
                type="button"
                className="mt-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                onClick={handleAddPdfField}
              >
                + Add Field
              </button>
            )}
          </form>
        </div>
      ) : parsedFields.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6 max-w-md min-w-[340px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            {!editFieldsMode ? (
              <h3 className="text-lg font-bold text-gray-800">{formTitle}</h3>
            ) : (
              <textarea
                value={editedFormTitle}
                onChange={e => setEditedFormTitle(e.target.value)}
                onKeyDown={e => handleTextareaKeyDown(e, 'formTitle')}
                className="text-lg font-bold text-gray-800 border px-2 py-1 rounded flex-1 resize-y min-h-[32px]"
                rows={2}
              />
            )}
            {!editFieldsMode ? (
              <button
                className="ml-2 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm"
                onClick={startEditFields}
              >
                Edit
              </button>
            ) : (
              <button
                className="ml-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                onClick={finishEditFields}
              >
                Done
              </button>
            )}
          </div>
          <form className="space-y-3">
            {!editFieldsMode && parsedFields.map(field => (
              <div key={field.name} className="flex flex-col relative">
                <label className="font-semibold text-gray-700 mb-1 flex items-center">
                  {field.name}
                </label>
                {field.type === 'text' ? (
                  <textarea
                    value={parsedFieldValues[field.name] || ''}
                    onChange={e => handleParsedFieldChange(field.name, e.target.value)}
                    onKeyDown={e => handleTextareaKeyDown(e, field.name)}
                    className="border px-2 py-1 rounded resize-y"
                    rows={4}
                    placeholder="Use Shift+Enter for new lines"
                  />
                ) : field.type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={!!parsedFieldValues[field.name]}
                    onChange={e => handleParsedFieldChange(field.name, e.target.checked)}
                  />
                ) : null}
              </div>
            ))}
            {editFieldsMode && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={editedFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  {editedFields.map((field, idx) => (
                    <SortableField
                      key={field.id}
                      id={field.id}
                      idx={idx}
                      field={field}
                      onEdit={handleEditFieldName}
                      onRemove={handleRemoveField}
                      onToggleRequired={handleToggleFieldRequired}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
            {editFieldsMode && (
              <button
                type="button"
                className="mt-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                onClick={handleAddField}
              >
                + Add Field
              </button>
            )}
          </form>
        </div>
      )}
      {showRemoveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <h2 className="text-xl font-bold mb-4 text-red-700">Confirm Remove</h2>
            <p className="mb-6">Are you sure you want to remove the uploaded PDF? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelRemove}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
      {/* PDF Preview Modal */}
      {showPreview && formContent && formContent.startsWith('data:application/pdf') && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col">
          <button
            className="self-end m-4 bg-white text-black px-4 py-2 rounded shadow-lg hover:bg-gray-200"
            onClick={() => setShowPreview(false)}
          >
            Close
          </button>
          <div className="flex-1 flex items-center justify-center">
            <embed src={formContent} type="application/pdf" width="100%" height="100%" style={{ minHeight: '0', minWidth: '0' }} />
          </div>
        </div>
      )}
      {/* Note: You must install dnd-kit: npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities */}
    </div>
  );
};

export default EditRequirementForm; 