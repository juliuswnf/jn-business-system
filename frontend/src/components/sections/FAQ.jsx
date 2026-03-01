import { useState } from 'react';

export default function FAQ({ questions = [] }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div key={i} className="border border-zinc-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggle(i)}
            className="w-full flex items-center justify-between p-4 bg-white/20 text-left"
            aria-expanded={openIndex === i}
          >
            <span className="font-medium text-zinc-900">{q.question}</span>
            <svg
              className={`w-5 h-5 text-zinc-300 transform transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div
            className="px-4"
            style={{
              maxHeight: openIndex === i ? '1000px' : '0px',
              transition: 'max-height 300ms ease',
              overflow: 'hidden'
            }}
          >
            <div className="py-3 text-zinc-400">
              {q.answer}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
