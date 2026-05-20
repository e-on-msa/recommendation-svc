// backend/utils/extractKeywords.js
function extractKeywordsFromTextArray(textArray) {
  const allText = textArray.join(' ').toLowerCase();
  const words = allText.match(/\b[a-zA-Z가-힣]{2,}\b/g) || [];
  const frequency = {};

  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1]) // 빈도 내림차순
    .slice(0, 10) // 상위 10개
    .map(entry => entry[0]); // 단어만 반환
}

module.exports = extractKeywordsFromTextArray;
