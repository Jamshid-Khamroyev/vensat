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

  const renderBackground = (text: string) => {
  const background = text.match(/\$([\s\S]*?)\$/)?.[1].trim();
  if (!background) return null;

  const passage = text.replace(/\$[\s\S]*?\$/g, "").trim();

  return (
    <div className="text-sm text-gray-900">
      <p className="mb-4">{background}</p>

      <p className="whitespace-pre-line">
        {passage}
      </p>
    </div>
  );
};

  const renderNotes = (text: string) => {
    const intro = text.split("^")[0].trim();

    const notes = [...text.matchAll(/\^([\s\S]*?)\^/g)].map(match => match[1].replace(/\s+/g, " ").trim());
    if (!notes.length) return null;

      return (
  <div className="text-sm">
    <p className="mb-3 text-gray-900">{intro}</p>

    <ul className="list-disc pl-5 space-y-1 text-gray-900">
      {notes.map((note, i) => (
        <li key={i}>{note}</li>
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
    if (text.includes('^')) {
      return renderNotes(text);
    }

    // Bg information
    if (text.includes("$")) {
      return renderBackground(text);
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