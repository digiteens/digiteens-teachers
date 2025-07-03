import React from 'react';
import WordCloud from 'react-d3-cloud';

const WordCloudComponent = ({ answers, studentAnswer, colors }) => {
  // Italian stop words - updated
  const stopWords = new Set([
  "il", "la", "lo", "i", "gli", "le",
  "e", "ma", "o", "oppure", "perché", "anche", "infatti", "quindi", "se", "come", "quando", "mentre", "dove", "che", "chi", "cui",
  "un", "una", "uno",
  "di", "a", "da", "in", "su", "per", "tra", "fra", "con",
  "del", "della", "dello", "dei", "degli", "delle",
  "al", "allo", "alla", "ai", "agli", "alle",
  "dal", "dallo", "dalla", "dai", "dagli", "dalle",
  "nel", "nello", "nella", "nei", "negli", "nelle",
  "sul", "sullo", "sulla", "sui", "sugli", "sulle",
  "col", "coi",
  "è", "era", "sono", "sei", "fui", "fu", "foste", "sarà", "saranno", "sarei", "saremmo", "sia", "fosse", "siano",
  "avere", "ho", "hai", "ha", "abbiamo", "hanno", "avevo", "aveva", "avremo", "avrei", "abbia", "abbiano",
  "fare", "fatto", "fa", "fai", "fanno", "faceva", "farebbe", "farei", "fossi", "fossero",
  "può", "puoi", "posso", "possiamo", "possono", "potrebbe", "potrei", "dovrebbe", "dovrei", "deve", "devi", "devono",
  "ci", "vi", "mi", "ti", "si", "lui", "lei", "noi", "voi", "loro",
  "questo", "questa", "quello", "quella", "questi", "quelle", "quelli",
  "tutto", "tutti", "ogni", "alcuni", "alcune", "nessuno", "niente", "nulla", "qualcuno", "qualcosa",
  "già", "ancora", "solo", "sempre", "mai", "poi", "ora", "adesso", "prima", "dopo",
  "sì", "no", "non", "ne", "più", "meno", "molto", "tanto", "troppo", "così"
]);

  // Process answers into word frequencies
  const processWords = (texts) => {
    const wordMap = new Map();
    
    texts.forEach(text => {
      text.toLowerCase()
        .split(/[ ,.!?;:()]+/) // Split on punctuation
        .filter(word => word.length > 2 && !stopWords.has(word))
        .forEach(word => {
          wordMap.set(word, (wordMap.get(word) || 0) + 1);
        });
    });

    return Array.from(wordMap.entries()).map(([text, value]) => ({ 
      text, 
      value: value * 80 // Boost values for visibility
    }));
  };

  const wordData = processWords(answers);

  // Font size calculator (minimum 24px)
  const fontSizeMapper = word => Math.max(24, Math.sqrt(word.value) * 25);

  return (
    <div style={{
      border: `2px solid ${colors?.border || '#4a86e8'}`,
      borderRadius: '8px',
      padding: '20px',
      margin: '20px',
      backgroundColor: '#fff'
    }}>
      <h2 style={{ color: colors?.text || '#333', marginBottom: '20px' }}>
        Risposte della classe:
      </h2>

      <div style={{ 
        width: '100%', 
        height: '500px',
        border: '1px solid #eee' // Debug border
      }}>
        <WordCloud
          data={wordData}
          fontSizeMapper={fontSizeMapper}
          width={700}
          height={400}
          padding={2}
          font="Arial"
          fontWeight="bold"
          rotate={0} // No rotation for readability
        />
      </div>
    </div>
  );
};

export default WordCloudComponent;