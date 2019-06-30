const emojiTypes = [
  '✨', '🔧', '📝', '🎨', '☢️', '🧪', '🔨', '⚡️', 
  '🚀', '🔖', '🚦', '📦', '⏪', '💡', '🧨', '✅', '🔀', '🔮'
];

module.exports = {
  parserOpts: {
    headerPattern: /^([✨🔧📝🎨☢️🧪🔨⚡️🚀🔖🚦📦⏪💡🧨✅🔀🔮])\s+(.+)$/,
    headerCorrespondence: ['type', 'subject'],
    noteKeywords: ['BREAKING CHANGE'],
    revertPattern: /^(?:Revert|revert:)\s"?([\s\S]+?)"?\s*This reverts commit (\w+)\./i,
    revertCorrespondence: ['header', 'hash']
  }
};