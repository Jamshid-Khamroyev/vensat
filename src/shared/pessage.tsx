import { ParsedQuestion } from "../services/geminiService";

interface PessageProps {
  currentQ: ParsedQuestion;
}

const Pessage = ({ currentQ }: PessageProps) => {
  const renderUnderlined = (text: string) => {
    return text.split(/(##.*?##)/g).map((part, i) =>
      part.startsWith("##") && part.endsWith("##") ? (
        <span
          key={i}
          className="underline decoration-blue-900 font-semibold"
        >
          {part.slice(2, -2)}
        </span>
      ) : (
        part
      )
    );
  };

  const renderNotes = (text: string) => {
    const notes = [...text.matchAll(/\^(.*?)\^/g)]
      .map((match) => match[1].trim())
      .filter(Boolean);

    return (
      <div>
        <div className="text-sm font-semibold mb-3">
          Notes
        </div>

        <ul className="space-y-2 text-sm leading-relaxed text-gray-800">
          {notes.map((note, index) => (
            <li key={index} className="ml-5 list-disc">
              {renderUnderlined(note)}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderDualText = (text: string) => {
    const passages = [...text.matchAll(/&&([\s\S]*?)&&/g)]
      .map((match) => match[1].trim())
      .filter(Boolean);

    return (
      <div className="space-y-5">
        {passages.map((content, index) => (
          <div key={index}>
            <div className="text-sm font-semibold mb-2">
              Text {index + 1}
            </div>

            <div className="text-sm leading-relaxed text-gray-800">
              {renderUnderlined(content)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    const text = currentQ.text;

    // Student Notes
    if (/\^(.*?)\^/.test(text)) {
      return renderNotes(text);
    }

    // Dual Text
    if (/&&([\s\S]*?)&&/.test(text)) {
      return renderDualText(text);
    }

    // Normal Passage
    return (
      <div className="text-sm leading-relaxed text-gray-800">
        {renderUnderlined(text)}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="bg-white overflow-hidden">
        <div className="py-4">
          {renderContent()}
        </div>
      </div>

      {currentQ.graph && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-center">
            <img
              src={currentQ.graph}
              alt="Graph"
              className="max-w-full h-auto"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = "none";

                const parent = img.parentElement;

                if (parent) {
                  parent.innerHTML =
                    '<div class="text-red-500 text-sm text-center py-4">⚠️ Graph could not be loaded</div>';
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Pessage;