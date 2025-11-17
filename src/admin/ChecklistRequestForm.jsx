import React, { useState, useEffect } from 'react';
import logo from '../assets/logo-seal.png';
import cityhallImage from '../assets/cityhall-logo.webp';
import axios from 'axios';

const ChecklistRequestForm = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    date: '',
    name: '',
    position: '',
    department: '',
    service_record: false,
    coe: false,
    codec: false,
    cert_leave_credits: false,
    automated_dtr: false,
    dtr_month: '',
    payslip: false,
    pay_period: '',
    travel_order: false,
    itinerary_of_travel: false,
    terminal_pay: false,
    copy_201_file: false,
    type_of_document: '',
    acceptance_resignation: false,
    saln_blank: false,
    pds_form: false,
    dtr_blank: false,
    cert_completion: false,
    others: false,
    others_specify: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (currentUser) {
      setUser(currentUser);
      // Pre-fill department if admin has one assigned
      if (currentUser.role === 'admin' && currentUser.department) {
        setForm(prev => ({
          ...prev,
          department: currentUser.department
        }));
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:8000/api/hr/checklist-pdf',
        form,
        {
          responseType: 'blob',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'checklist_form.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to generate PDF.');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-100 to-yellow-100 px-2 md:px-8 py-8">
      <div className="flex w-full max-w-3xl items-center justify-center mx-auto">
        <div className="flex-1 flex items-center justify-center rounded-xl border-2 border-gray-400 shadow-xl bg-white p-0 md:p-4">
          <div className="w-full px-2 md:px-6 py-6 md:py-10">
            {/* Department-specific header for admin users */}
            {user && user.role === 'admin' && user.department && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h2 className="text-lg font-semibold mb-2 text-blue-800">
                  Checklist Request Form for {user.department}
                </h2>
                <p className="text-sm text-blue-700">
                  Generate checklist forms for your department's HR requirements.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block text-sm font-semibold text-gray-700">Date
                  <input type="date" name="date" value={form.date} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-lg" required />
                </label>
                <label className="block text-sm font-semibold text-gray-700">Name
                  <input type="text" name="name" value={form.name} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-lg" required />
                </label>
                <label className="block text-sm font-semibold text-gray-700">Position
                  <input type="text" name="position" value={form.position} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-lg" required />
                </label>
                <label className="block text-sm font-semibold text-gray-700">Department
                  <input 
                    type="text" 
                    name="department" 
                    value={form.department} 
                    onChange={handleChange} 
                    className={`mt-1 w-full px-3 py-2 border rounded-lg ${
                      user && user.role === 'admin' && user.department ? 'bg-gray-50 text-gray-500' : ''
                    }`}
                    required 
                    disabled={user && user.role === 'admin' && user.department}
                  />
                  {user && user.role === 'admin' && user.department && (
                    <p className="mt-1 text-xs text-gray-500">
                      Department is pre-filled based on your assignment.
                    </p>
                  )}
                </label>
              </div>
              <div className="mt-4">
                <p className="font-semibold text-gray-700 mb-2">Please check appropriate box:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <label><input type="checkbox" name="service_record" checked={form.service_record} onChange={handleChange} className="mr-2" />Service Record</label>
                  <label><input type="checkbox" name="coe" checked={form.coe} onChange={handleChange} className="mr-2" />COE</label>
                  <label><input type="checkbox" name="codec" checked={form.codec} onChange={handleChange} className="mr-2" />CODEC</label>
                  <label><input type="checkbox" name="cert_leave_credits" checked={form.cert_leave_credits} onChange={handleChange} className="mr-2" />Cert. of Leave Credits</label>
                  <label><input type="checkbox" name="automated_dtr" checked={form.automated_dtr} onChange={handleChange} className="mr-2" />Automated DTR</label>
                  <label className="flex items-center">Month: <input type="text" name="dtr_month" value={form.dtr_month} onChange={handleChange} className="ml-2 px-2 py-1 border rounded w-24 max-w-full" /></label>
                  <label><input type="checkbox" name="payslip" checked={form.payslip} onChange={handleChange} className="mr-2" />Payslip</label>
                  <label className="flex items-center">Pay period: <input type="text" name="pay_period" value={form.pay_period} onChange={handleChange} className="ml-2 px-2 py-1 border rounded w-24 max-w-full" /></label>
                  <label><input type="checkbox" name="travel_order" checked={form.travel_order} onChange={handleChange} className="mr-2" />Travel Order</label>
                  <label><input type="checkbox" name="itinerary_of_travel" checked={form.itinerary_of_travel} onChange={handleChange} className="mr-2" />Itinerary of travel</label>
                  <label><input type="checkbox" name="terminal_pay" checked={form.terminal_pay} onChange={handleChange} className="mr-2" />Terminal Pay & Commutation of Leave Pay</label>
                  <label><input type="checkbox" name="copy_201_file" checked={form.copy_201_file} onChange={handleChange} className="mr-2" />Copy of 201 File</label>
                  <label className="flex items-center">Type of document: <input type="text" name="type_of_document" value={form.type_of_document} onChange={handleChange} className="ml-2 px-2 py-1 border rounded w-24 max-w-full" /></label>
                  <label><input type="checkbox" name="acceptance_resignation" checked={form.acceptance_resignation} onChange={handleChange} className="mr-2" />Acceptance of Resignation</label>
                  <label><input type="checkbox" name="saln_blank" checked={form.saln_blank} onChange={handleChange} className="mr-2" />SALN blank form</label>
                  <label><input type="checkbox" name="pds_form" checked={form.pds_form} onChange={handleChange} className="mr-2" />PDS Form</label>
                  <label><input type="checkbox" name="dtr_blank" checked={form.dtr_blank} onChange={handleChange} className="mr-2" />DTR Blank</label>
                  <label><input type="checkbox" name="cert_completion" checked={form.cert_completion} onChange={handleChange} className="mr-2" />Cert. of Completion (OJT)</label>
                  <label><input type="checkbox" name="others" checked={form.others} onChange={handleChange} className="mr-2" />Others</label>
                  <label className="flex items-center">Specify: <input type="text" name="others_specify" value={form.others_specify} onChange={handleChange} className="ml-2 px-2 py-1 border rounded w-24 max-w-full" /></label>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 mt-6 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition duration-200">
                {loading ? 'Generating PDF...' : 'Generate PDF'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChecklistRequestForm; 