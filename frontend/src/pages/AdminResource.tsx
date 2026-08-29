import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

type Props = { title: string; endpoint: string; description: string; fields?: string[] };
export default function AdminResource({ title, endpoint, description, fields = [] }: Props) {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const load = () => api.get(endpoint).then((r) => setRows(Array.isArray(r.data) ? r.data : [r.data])).catch(() => toast.error('Chargement impossible'));
  useEffect(() => { void load(); }, [endpoint]);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); try { await api.post(endpoint, form); setForm({}); toast.success('Enregistré'); load(); } catch (error:any) { toast.error(error.response?.data?.message || 'Erreur'); } };
  return <section className="space-y-6">
    <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1><p className="text-gray-500">{description}</p></div>
    {fields.length > 0 && <form onSubmit={submit} className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-premium grid md:grid-cols-3 gap-3">
      {fields.map((field) => <input key={field} required placeholder={field} value={form[field] || ''} onChange={(e) => setForm({...form,[field]:e.target.value})} className="rounded-xl border p-3 dark:bg-gray-800" />)}
      <button className="gradient-primary text-white rounded-xl px-5 py-3">Ajouter</button>
    </form>}
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-premium overflow-auto"><table className="w-full text-left"><thead><tr className="border-b"><th className="p-4">Élément</th><th>État / détails</th></tr></thead><tbody>{rows.map((row, i) => <tr key={row._id || i} className="border-b last:border-0"><td className="p-4 font-semibold">{row.name || row.title || row.organizationName || `#${i+1}`}</td><td className="text-gray-500">{Object.entries(row).filter(([k]) => !['_id','name','title','password'].includes(k)).slice(0,4).map(([k,v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ')}</td></tr>)}</tbody></table>{rows.length===0 && <p className="p-6 text-gray-500">Aucune donnée</p>}</div>
  </section>;
}
