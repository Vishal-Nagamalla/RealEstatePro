'use client';
import { useRef, useEffect } from 'react';

export default function BeforeAfter({ before, after, height=420 }){
  const wrapRef = useRef(null);
  const rangeRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const range = rangeRef.current;
    if (!wrap || !range) return;
    const imgAfter = wrap.querySelector('.ba-after');
    const onInput = () => {
      const v = range.value; // 0..100
      imgAfter.style.clipPath = `inset(0 ${100 - v}% 0 0)`;
    };
    range.addEventListener('input', onInput);
    onInput();
    return () => range.removeEventListener('input', onInput);
  }, []);

  return (
    <div ref={wrapRef} className="position-relative rounded-3 overflow-hidden shadow" style={{ height }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={before} className="w-100 h-100 object-fit-cover" alt="Before" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} className="ba-after position-absolute top-0 start-0 w-100 h-100 object-fit-cover" alt="After" />
      <input ref={rangeRef} type="range" min="0" max="100" defaultValue="50"
        className="position-absolute start-50 translate-middle-x bottom-2 w-75" style={{ zIndex: 3 }} />
    </div>
  );
}
