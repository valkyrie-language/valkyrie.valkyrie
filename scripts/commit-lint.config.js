module.exports = {
    parserPreset: {
        parserOpts: {
            headerPattern: /^(\u2728|\ud83d\udd27|\ud83d\udcdd|\ud83c\udfa8|\u2622\ufe0f|\ud83e\uddea|\ud83d\udd28|\u26a1\ufe0f|\ud83d\ude80|\ud83d\udd16|\ud83d\udea6|\ud83d\udce6|\u23ea|\ud83d\udca1|\ud83e\udde8|\u2705|\ud83d\udd00|\ud83d\udd2e)\s+(.+)$/,
            headerCorrespondence: ['type', 'subject'],
            noteKeywords: ['BREAKING CHANGE'],
            revertPattern: /^(?:Revert|revert:)\s"?([\s\S]+?)"?\s*This reverts commit (\w+)\./i,
            revertCorrespondence: ['header', 'hash']
        }
    },
    rules: {
        // 自定义规则以适应纯emoji格式 - 允许emoji作为type
        'type-enum': [2, 'always', [
            '✨', // feat: 新功能
            '🔧', // fix: 修复bug
            '📝', // docs: 文档更新
            '🎨', // style: 代码格式调整
            '☢️', // refactor: 重构代码
            '🧪', // test: 测试相关
            '🔨', // config: 配置文件修改
            '⚡️', // perf: 性能优化
            '🚀', // release: 发布版本
            '🔖', // tag: 标签相关
            '🚦', // ci: CI/CD相关
            '📦', // build: 构建相关
            '⏪', // revert: 回滚操作
            '💡', // idea: 新想法
            '🧨', // delete: 删除文件
            '✅', // complete: 完成任务
            '🔀', // branch: 分支操作
            '🔮'  // experiment: 实验性功能
        ]],
        'type-empty': [2, 'never'],
        'subject-empty': [2, 'never'],
        'header-max-length': [2, 'always', 100]
    },
    prompt: {
        questions: {
            type: {
                description: '选择你要提交的更改类型:',
                enum: {
                    '✨ feat': {
                        description: '新功能',
                        title: 'Features',
                        emoji: '✨'
                    },
                    '🔧 fix': {
                        description: '修复bug',
                        title: 'Bug Fixes',
                        emoji: '🔧'
                    },
                    '📝 docs': {
                        description: '文档更新',
                        title: 'Documentation',
                        emoji: '📝'
                    },
                    '🎨 style': {
                        description: '代码格式调整',
                        title: 'Styles',
                        emoji: '🎨'
                    },
                    '☢️ refactor': {
                        description: '重构代码',
                        title: 'Code Refactoring',
                        emoji: '☢️'
                    },
                    '🧪 test': {
                        description: '测试相关',
                        title: 'Tests',
                        emoji: '🧪'
                    },
                    '🔨 config': {
                        description: '配置文件修改',
                        title: 'Configuration',
                        emoji: '🔨'
                    },
                    '⚡️ perf': {
                        description: '性能优化',
                        title: 'Performance Improvements',
                        emoji: '⚡️'
                    },
                    '🚀 release': {
                        description: '发布版本',
                        title: 'Release',
                        emoji: '🚀'
                    },
                    '🔖 tag': {
                        description: '标签相关',
                        title: 'Tag',
                        emoji: '🔖'
                    },
                    '🚦 ci': {
                        description: 'CI/CD相关',
                        title: 'CI/CD',
                        emoji: '🚦'
                    },
                    '📦 build': {
                        description: '构建相关',
                        title: 'Build',
                        emoji: '📦'
                    },
                    '⏪ revert': {
                        description: '回滚操作',
                        title: 'Revert',
                        emoji: '⏪'
                    },
                    '💡 idea': {
                        description: '新想法',
                        title: 'Idea',
                        emoji: '💡'
                    },
                    '🧨 delete': {
                        description: '删除文件',
                        title: 'Delete',
                        emoji: '🧨'
                    },
                    '✅ complete': {
                        description: '完成任务',
                        title: 'Complete',
                        emoji: '✅'
                    },
                    '🔀 branch': {
                        description: '分支操作',
                        title: 'Branch',
                        emoji: '🔀'
                    },
                    '🔮 experiment': {
                        description: '实验性功能',
                        title: 'Experiment',
                        emoji: '🔮'
                    }
                }
            }
        }
    }
};