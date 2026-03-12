import { useState } from "react";

export default function ChatbotIframe() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg z-50"
      >
        💬
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-[360px] h-[520px] bg-white rounded-xl shadow-2xl overflow-hidden border z-50">
          <iframe
            src="https://udify.app/chat/w0j6ZaSlBs9BpEFu"
            className="w-full h-full"
          />
        </div>
      )}
    </>
  );
}
