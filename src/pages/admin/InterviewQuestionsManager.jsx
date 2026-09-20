import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X, RefreshCw, AlertCircle } from 'lucide-react';

const emptyQuestion = {
  question: '',
  role: 'Data Engineer',
  topic: 'SQL',
  difficulty: 'MEDIUM',
  type: 'SQL',
  company: '',
  platform: '',
  proOnly: false
};

const ROLES = ['Data Analyst', 'BI Analyst', 'Analytics Engineer', 'Data Engineer', 'Data Scientist', 'ML Engineer', 'MLOps Engineer', 'AI Engineer', 'Data Architect'];
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const TYPES = ['SQL', 'Python', 'Behavioral', 'System design'];

export default function InterviewQuestionsManager() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyQuestion);
  const [isAdding, setIsAdding] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3002/api/questions');
      if (!res.ok) throw new Error('Failed to fetch questions');
      const data = await res.json();
      setQuestions(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleSave = async () => {
    try {
      const url = editingId 
        ? `http://localhost:3002/api/admin/questions/${editingId}`
        : 'http://localhost:3002/api/admin/questions';
        
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (!res.ok) throw new Error('Failed to save question');
      
      await fetchQuestions();
      setEditingId(null);
      setIsAdding(false);
    } catch (err) {
      alert(`Error saving: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`http://localhost:3002/api/admin/questions/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete');
      setQuestions(questions.filter(q => q.id !== id));
    } catch (err) {
      alert(`Error deleting: ${err.message}`);
    }
  };

  const startEdit = (q) => {
    setEditingId(q.id);
    setEditForm(q);
    setIsAdding(false);
  };

  const startAdd = () => {
    setEditingId(null);
    setEditForm(emptyQuestion);
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Interview Questions</h1>
          <p className="text-sm text-gray-400">Manage the dynamic question bank shown on the public site.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchQuestions} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={startAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 text-red-400 p-4 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {(isAdding || editingId) && (
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">{isAdding ? 'Add New Question' : 'Edit Question'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Question Text</label>
              <textarea 
                name="question" value={editForm.question} onChange={handleChange} 
                rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none" 
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Role</label>
              <select name="role" value={editForm.role} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Topic</label>
              <input type="text" name="topic" value={editForm.topic} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Difficulty</label>
              <select name="difficulty" value={editForm.difficulty} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white">
                {DIFFICULTIES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Type</label>
              <select name="type" value={editForm.type} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white">
                {TYPES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Company (Optional)</label>
              <input type="text" name="company" value={editForm.company || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Platform (Optional)</label>
              <input type="text" name="platform" value={editForm.platform || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" />
            </div>

            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="proOnly" name="proOnly" checked={editForm.proOnly} onChange={handleChange} className="w-4 h-4" />
              <label htmlFor="proOnly" className="text-sm text-amber-400 font-semibold">Requires PRO Subscription</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={cancelEdit} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-2">
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/80 text-gray-400 text-xs">
            <tr>
              <th className="p-4">Question</th>
              <th className="p-4">Tags</th>
              <th className="p-4 w-24 text-center">Pro Only</th>
              <th className="p-4 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {questions.map(q => (
              <tr key={q.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 text-white">
                  <div className="line-clamp-2">{q.question}</div>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] px-2 py-0.5 bg-slate-700 rounded">{q.difficulty}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-700 rounded">{q.role}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-700 rounded">{q.topic}</span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  {q.proOnly ? <span className="text-amber-400 font-bold text-xs">PRO</span> : <span className="text-gray-500 text-xs">FREE</span>}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => startEdit(q)} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(q.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {questions.length === 0 && !loading && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">No questions found. Add one above!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
