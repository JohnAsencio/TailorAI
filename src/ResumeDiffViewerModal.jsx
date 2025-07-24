// src/components/ResumeDiffViewerModal.jsx
import React from 'react';
import { createPatch } from 'diff'; // We'll use createPatch to get a simplified diff, or directly diffWords
import { diffWords } from 'diff'; // Using diffWords for a more granular, word-level diff

function ResumeDiffViewerModal({ originalText, tailoredText, isOpen, onClose }) {
  if (!isOpen) return null;

  // Perform a word-level diff
  const changes = diffWords(originalText, tailoredText);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-75">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-indigo-800">Resume Changes</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Modal Body - Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-grow text-sm font-mono whitespace-pre-wrap">
          <p className="text-gray-600 mb-4">
            <span className="inline-block w-3 h-3 bg-green-200 mr-2 border border-green-400"></span>Added content
            <span className="inline-block w-3 h-3 bg-red-200 ml-4 mr-2 border border-red-400"></span>Removed content
          </p>
          {changes.map((part, index) => {
            const color = part.added ? 'bg-green-200 text-green-800' :
                          part.removed ? 'bg-red-200 text-red-800 line-through' :
                          'text-gray-800'; // Unchanged parts
            
            // Render a newline character explicitly if the original text had one,
            // to maintain line breaks in the diff view
            const content = part.value.split('\n').map((line, lineIndex) => (
              <React.Fragment key={`${index}-${lineIndex}`}>
                {line}
                {lineIndex < part.value.split('\n').length - 1 && <br />}
              </React.Fragment>
            ));

            return (
              <span key={index} className={color}>
                {content}
              </span>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResumeDiffViewerModal;