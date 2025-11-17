import React, { useState, useEffect } from 'react';
import { X, Save, User, MapPin, DollarSign, Calendar, Clock, FileText, Building } from 'lucide-react';

const AddAssessmentModal = ({ isOpen, onClose, onSubmit, departments = [], isSuperAdmin = false, transactionOptions = [] }) => {
  const [formData, setFormData] = useState({
    transactionType: '',
    citizenName: '',
    citizenEmail: '',
    citizenPhone: '',
    propertyAddress: '',
    barangay: '',
    assessmentValue: '',
    taxAmount: '',
    assignedStaff: '',
    department: '',
    priority: 'normal',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transaction types based on department
  const transactionTypes = {
    'Assessor': [
      'Property Assessment',
      'Tax Computation',
      'Valuation Request',
      'Property Transfer',
      'Assessment Appeal'
    ],
    'Treasurer': [
      'Business Permit',
      'Real Property Tax',
      'Business Tax',
      'Permit Renewal',
      'Tax Payment'
    ],
    'Mayor\'s Office': [
      'Business License',
      'Permit Application',
      'Document Request',
      'Complaint Filing',
      'Service Request'
    ],
    'Health': [
      'Health Certificate',
      'Sanitary Permit',
      'Medical Clearance',
      'Health Inspection',
      'Vaccination Record'
    ],
    'default': [
      'Property Assessment',
      'Tax Computation',
      'Business Permit',
      'Document Request',
      'Service Request'
    ]
  };

  // Barangay options
  const barangays = [
    'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5',
    'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10',
    'Poblacion', 'San Isidro', 'San Antonio', 'San Jose', 'San Miguel'
  ];

  // Staff members (mock data)
  const staffMembers = [
    'Maria Santos', 'Jose Reyes', 'Carlos Lopez', 'Ana Martinez', 'Roberto Cruz',
    'Carmen Flores', 'Pedro Garcia', 'Luis Rodriguez', 'Elena Torres', 'Miguel Ramos'
  ];

  useEffect(() => {
    if (!isOpen) return;
    // Reset form when modal opens (only when opening)
    setFormData({
      transactionType: '',
      citizenName: '',
      citizenEmail: '',
      citizenPhone: '',
      propertyAddress: '',
      barangay: '',
      assessmentValue: '',
      taxAmount: '',
      assignedStaff: '',
      department: isSuperAdmin ? '' : (departments[0]?.name || ''),
      priority: 'normal',
      notes: ''
    });
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Auto-calculate tax amount if assessment value changes
    if (name === 'assessmentValue' && value) {
      const assessmentValue = parseFloat(value.replace(/[^0-9.]/g, ''));
      if (!isNaN(assessmentValue)) {
        const taxAmount = assessmentValue * 0.01; // 1% tax rate
        setFormData(prev => ({
          ...prev,
          taxAmount: taxAmount.toFixed(2)
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.transactionType) newErrors.transactionType = 'Transaction type is required';
    if (!formData.citizenName) newErrors.citizenName = 'Citizen name is required';
    if (!formData.citizenEmail) newErrors.citizenEmail = 'Email is required';
    if (!formData.citizenPhone) newErrors.citizenPhone = 'Phone number is required';
    if (!formData.propertyAddress) newErrors.propertyAddress = 'Property address is required';
    if (!formData.barangay) newErrors.barangay = 'Barangay is required';
    if (!formData.assessmentValue) newErrors.assessmentValue = 'Assessment value is required';
    if (!formData.assignedStaff) newErrors.assignedStaff = 'Assigned staff is required';
    if (isSuperAdmin && !formData.department) newErrors.department = 'Department is required';

    // Email validation
    if (formData.citizenEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.citizenEmail)) {
      newErrors.citizenEmail = 'Please enter a valid email address';
    }

    // Phone validation
    if (formData.citizenPhone && !/^[0-9+\-\s()]+$/.test(formData.citizenPhone)) {
      newErrors.citizenPhone = 'Please enter a valid phone number';
    }

    // Assessment value validation
    if (formData.assessmentValue && isNaN(parseFloat(formData.assessmentValue.replace(/[^0-9.]/g, '')))) {
      newErrors.assessmentValue = 'Please enter a valid amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const assessmentData = {
        ...formData,
        id: Date.now(), // Generate unique ID
        status: 'pending',
        dateSubmitted: new Date().toISOString().split('T')[0],
        processingTime: '0 hours',
        assessmentValue: parseFloat(formData.assessmentValue.replace(/[^0-9.]/g, '')),
        taxAmount: parseFloat(formData.taxAmount.replace(/[^0-9.]/g, ''))
      };

      onSubmit(assessmentData);
      onClose();
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('Error submitting assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const number = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(number)) return value;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(number);
  };

  const getTransactionTypes = () => {
    if (isSuperAdmin && formData.department) {
      return transactionTypes[formData.department] || transactionTypes.default;
    }
    if (transactionOptions && transactionOptions.length > 0) return transactionOptions;
    return transactionTypes.default;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Add New Assessment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Department Selection (SuperAdmin only) */}
          {isSuperAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="w-4 h-4 inline mr-2" />
                  Department *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.department ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="text-red-500 text-sm mt-1">{errors.department}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Transaction Type *
                </label>
                <select
                  name="transactionType"
                  value={formData.transactionType}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.transactionType ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Transaction Type</option>
                  {getTransactionTypes().map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.transactionType && (
                  <p className="text-red-500 text-sm mt-1">{errors.transactionType}</p>
                )}
              </div>
            </div>
          )}

          {/* Transaction Type (Admin only) */}
          {!isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Transaction Type *
              </label>
              <select
                name="transactionType"
                value={formData.transactionType}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.transactionType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Transaction Type</option>
                {getTransactionTypes().map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.transactionType && (
                <p className="text-red-500 text-sm mt-1">{errors.transactionType}</p>
              )}
            </div>
          )}

          {/* Citizen Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Citizen Name *
              </label>
              <input
                type="text"
                name="citizenName"
                value={formData.citizenName}
                onChange={handleInputChange}
                placeholder="Enter full name"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.citizenName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.citizenName && (
                <p className="text-red-500 text-sm mt-1">{errors.citizenName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Email Address *
              </label>
              <input
                type="email"
                name="citizenEmail"
                value={formData.citizenEmail}
                onChange={handleInputChange}
                placeholder="Enter email address"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.citizenEmail ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.citizenEmail && (
                <p className="text-red-500 text-sm mt-1">{errors.citizenEmail}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Phone Number *
              </label>
              <input
                type="tel"
                name="citizenPhone"
                value={formData.citizenPhone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.citizenPhone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.citizenPhone && (
                <p className="text-red-500 text-sm mt-1">{errors.citizenPhone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Property Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Property Address *
            </label>
            <input
              type="text"
              name="propertyAddress"
              value={formData.propertyAddress}
              onChange={handleInputChange}
              placeholder="Enter complete property address"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.propertyAddress ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.propertyAddress && (
              <p className="text-red-500 text-sm mt-1">{errors.propertyAddress}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Barangay *
              </label>
              <select
                name="barangay"
                value={formData.barangay}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.barangay ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Barangay</option>
                {barangays.map((barangay) => (
                  <option key={barangay} value={barangay}>
                    {barangay}
                  </option>
                ))}
              </select>
              {errors.barangay && (
                <p className="text-red-500 text-sm mt-1">{errors.barangay}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Assigned Staff *
              </label>
              <select
                name="assignedStaff"
                value={formData.assignedStaff}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.assignedStaff ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Staff Member</option>
                {staffMembers.map((staff) => (
                  <option key={staff} value={staff}>
                    {staff}
                  </option>
                ))}
              </select>
              {errors.assignedStaff && (
                <p className="text-red-500 text-sm mt-1">{errors.assignedStaff}</p>
              )}
            </div>
          </div>

          {/* Financial Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Assessment Value *
              </label>
              <input
                type="text"
                name="assessmentValue"
                value={formData.assessmentValue}
                onChange={handleInputChange}
                placeholder="Enter assessment value"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.assessmentValue ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.assessmentValue && (
                <p className="text-red-500 text-sm mt-1">{errors.assessmentValue}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Tax Amount
              </label>
              <input
                type="text"
                name="taxAmount"
                value={formatCurrency(formData.taxAmount)}
                onChange={handleInputChange}
                placeholder="Auto-calculated"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">Auto-calculated at 1% of assessment value</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Enter any additional notes or special requirements..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Create Assessment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAssessmentModal;

