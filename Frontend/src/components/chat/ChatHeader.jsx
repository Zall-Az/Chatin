import React from 'react';

const ChatHeader = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border-l-4 border-emerald-500">
      <h2 className="text-lg font-medium text-emerald-700 mb-2">Selamat datang di Chatin</h2>
      <p className="text-gray-600 mb-3">
        Saya siap membantu Anda dengan menjawab pertanyaan berdasarkan pengetahuan yang tersedia dalam dokumen.
      </p>
      <div className="flex flex-wrap gap-2">
        <button className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full hover:bg-emerald-100">
          Apa itu pedoman edukasi?
        </button>
        <button className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full hover:bg-emerald-100">
          Apa font yang digunakan dalam KTI?
        </button>
        <button className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full hover:bg-emerald-100">
          Tanyakan seputar apa yang ingin kamu tahu
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;