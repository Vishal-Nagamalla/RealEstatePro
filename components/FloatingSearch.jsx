'use client';
import { useState } from 'react';
import { Button } from 'react-bootstrap';

export default function FloatingSearch({ onApply }){
  const [q, setQ] = useState('');
  const [min, setMin] = useState('');
  const [beds, setBeds] = useState('');
  return (
    <div className="float-search">
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Neighborhood or city…" />
      <select value={min} onChange={e=>setMin(e.target.value)}>
        <option value="">Min Price</option>
        <option value="1000000">$1,000,000</option>
        <option value="1500000">$1,500,000</option>
        <option value="2000000">$2,000,000</option>
      </select>
      <select value={beds} onChange={e=>setBeds(e.target.value)}>
        <option value="">Beds</option>
        <option value="2">2+</option>
        <option value="3">3+</option>
        <option value="4">4+</option>
      </select>
      <Button variant="outline-light" onClick={()=>onApply?.({ q, min, beds })}>Search</Button>
    </div>
  );
}
