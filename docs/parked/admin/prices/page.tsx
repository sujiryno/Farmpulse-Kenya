// app/admin/prices/page.tsx (or a client component)
'use client';
import { useEffect, useState } from 'react';

export default function PriceModerationPanel() {
  const [feedSubmissions, setFeedSubmissions] = useState([]);
  const [medicineSubmissions, setMedicineSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'medicine'>('feed');

  useEffect(() => {
    fetchPending('feed');
    fetchPending('medicine');
  }, []);

  async function fetchPending(type: 'feed' | 'medicine') {
    const res = await fetch(`/api/admin/prices/pending?type=${type}`);
    const data = await res.json();
    if (type === 'feed') setFeedSubmissions(data.submissions || []);
    else setMedicineSubmissions(data.submissions || []);
  }

  async function moderate(id: number, type: 'feed' | 'medicine', verified: boolean) {
    const endpoint = type === 'feed' 
      ? `/api/admin/feed-prices/${id}`
      : `/api/admin/medicine-prices/${id}`;
    await fetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified }),
    });
    // Refresh list
    fetchPending(type);
  }

  const submissions = activeTab === 'feed' ? feedSubmissions : medicineSubmissions;

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('feed')} className="px-4 py-2 bg-green-600 text-white rounded">Feed Prices</button>
        <button onClick={() => setActiveTab('medicine')} className="px-4 py-2 bg-blue-600 text-white rounded">Medicine Prices</button>
      </div>
      {submissions.map((sub: any) => (
        <div key={sub.id} className="border p-3 mb-2 rounded">
          <p><strong>{sub.brand || sub.name}</strong> - KES {sub.price_kes}</p>
          <p>County: {sub.county} | Submitted by: {sub.farmers?.name || 'Anonymous'}</p>
          <div className="flex gap-2 mt-2">
            <button onClick={() => moderate(sub.id, activeTab, true)} className="bg-green-500 px-3 py-1 text-white rounded">Approve</button>
            <button onClick={() => moderate(sub.id, activeTab, false)} className="bg-red-500 px-3 py-1 text-white rounded">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}