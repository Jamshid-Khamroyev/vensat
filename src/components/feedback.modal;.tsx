// FeedbackModal.tsx
import { useEffect, useState } from "react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
}

export default function FeedbackModal({ isOpen, onClose, onSubmit }: FeedbackModalProps){
  const [text, setText] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.7)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999,
      animation: "fadeIn 0.3s ease",
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div style={{
        background: "white",
        borderRadius: 16,
        padding: 40,
        maxWidth: 440,
        width: "90%",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        animation: "slideUp 0.4s ease",
        position: "relative",
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 24,
            cursor: "pointer",
            color: "#999",
            padding: "4px 8px",
            borderRadius: 4,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f5f5f5";
            e.currentTarget.style.color = "#333";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.color = "#999";
          }}
        >
          ✕
        </button>

        {/* Icon */}
        <div style={{
          textAlign: "center",
          marginBottom: 20,
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#f0f7ff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
          }}>
            💬
          </div>
        </div>

        {/* Title */}
        <h2 style={{
          margin: "0 0 8px 0",
          fontSize: 22,
          fontWeight: 600,
          color: "#1a1a1a",
          textAlign: "center",
        }}>
        </h2>

        <p style={{
          margin: "0 0 24px 0",
          fontSize: 15,
          color: "#666",
          textAlign: "center",
          lineHeight: 1.5,
        }}>
        </p>

        {/* Textarea */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Fikringizni yozing..."
          autoFocus
          style={{
            width: "100%",
            height: 100,
            padding: 12,
            borderRadius: 8,
            border: "2px solid #e8e8e8",
            resize: "none",
            fontFamily: "inherit",
            fontSize: 14,
            transition: "border-color 0.2s",
            outline: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#4a90d9";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e8e8e8";
          }}
        />

        {/* Buttons */}
        <div style={{
          display: "flex",
          gap: 10,
          marginTop: 20,
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px 24px",
              background: "#f5f5f5",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 500,
              color: "#666",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#ebebeb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f5f5f5";
            }}
          >
            Keyinroq
          </button>
          <button
            onClick={() => {
              if (text.trim()) {
                onSubmit(text);
                onClose();
              } else {
                alert("Iltimos, fikringizni yozing");
              }
            }}
            style={{
              flex: 1,
              padding: "12px 24px",
              background: "#4a90d9",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              color: "white",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#3a7bc8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#4a90d9";
            }}
          >
            Yuborish
          </button>
        </div>

        {/* Skip link */}
        <p style={{
          textAlign: "center",
          margin: "16px 0 0 0",
          fontSize: 13,
          color: "#999",
        }}>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#999",
              textDecoration: "underline",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Sahifada qolish
          </button>
        </p>
      </div>
    </div>
  );
};